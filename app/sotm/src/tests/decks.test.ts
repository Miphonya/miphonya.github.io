import "fake-indexeddb/auto";
import { beforeEach, afterEach, it, expect, vi } from "vitest";
import { projectCollection } from "../services/collectionView";
import { defaults, type Lot } from "../schemas/models";
import { db, prefs, updatePrefs, clearCatalog, exportBackup, importBackup } from "../db";
import { backupSchema } from "../schemas/models";
import { deckSchema, type Deck, type DeckCard } from "../schemas/decks";
import { addDeckCard, commitDeckList, entryDetails, cardKey, checkBracket, createDeck, loadGameChangers, mutateDeck, normalizeDeckSearch, refreshDeck, validateDeck } from "../services/decks";
import { prepareList, type ImportRow } from "../services/listImport";
import { resetAppData } from "../services/reset";
const card = (name: string, extras: Partial<DeckCard> = {}): DeckCard => ({ id: name, oracle_id: name, name, set: "one", set_name: "ONE", collector_number: "1", rarity: "rare", lang: "en", finishes: ["nonfoil"], type_line: "Creature", color_identity: ["W"], legalities: { commander: "legal", modern: "legal", standard: "legal", vintage: "legal", brawl: "legal" }, prices: { eur: null, eur_foil: null }, ...extras });
const leader = card("Elesh Norn", { type_line: "Legendary Creature — Phyrexian Praetor" });
const plains = card("Plains", { type_line: "Basic Land — Plains" });
const entry = (c: DeckCard, quantity = 1, zone: "main" | "sideboard" | "commander" = "main") => ({ id: crypto.randomUUID(), card: c, quantity, zone });
function deck(entries = [entry(leader, 1, "commander"), entry(plains, 99)], format: Deck["format"] = "commander"): Deck {
  const now = new Date().toISOString(); return deckSchema.parse({ id: crypto.randomUUID(), name: "La perfection", entries, format, createdAt: now, updatedAt: now });
}
beforeEach(async () => { await Promise.all(db.tables.map(t => t.clear())); });
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
it("stocke les decks séparément, sans créer de lots ni remplir le catalogue", async () => {
  const d = await createDeck("Mon deck", "commander");
  await addDeckCard(d.id, leader, "commander"); await addDeckCard(d.id, plains, "main");
  expect(await db.lots.count()).toBe(0); expect(await db.cards.count()).toBe(0);
  expect((await db.decks.get(d.id))?.entries).toHaveLength(2);
});
it("modifie atomiquement un deck et conserve les ajouts simultanés", async () => {
  const d = await createDeck("Standard", "standard");
  await Promise.all([addDeckCard(d.id, plains, "main"), addDeckCard(d.id, plains, "main")]);
  expect((await db.decks.get(d.id))?.entries[0].quantity).toBe(2);
});
it("choisir un commandant retire son doublon du principal et remplace la couverture", async () => {
  const d = await createDeck("Norn", "commander");
  await addDeckCard(d.id, leader, "main"); await addDeckCard(d.id, leader, "commander");
  expect((await db.decks.get(d.id))?.entries).toHaveLength(1);
  await addDeckCard(d.id, card("Autre", { type_line: "Legendary Creature" }), "commander");
  expect((await db.decks.get(d.id))?.entries[0].card.name).toBe("Autre");
});
it("valide 100 cartes avec commandant et autorise les terrains de base en plusieurs exemplaires", () => {
  expect(validateDeck(deck()).errors).toEqual([]);
  expect(validateDeck(deck([entry(leader, 1, "commander"), entry(plains, 98)])).errors.join(" ")).toContain("100");
});
it("détecte un commandant absent, non éligible et les couleurs hors identité", () => {
  expect(validateDeck(deck([entry(plains, 100)])).errors.join(" ")).toContain("Sélectionnez");
  const result = validateDeck(deck([entry(card("Non légendaire"), 1, "commander"), entry(card("Noir", { color_identity: ["B"] }), 99)]));
  expect(result.errors.join(" ")).toContain("non éligible"); expect(result.errors.join(" ")).toContain("hors identité");
});
it("reconnaît un commandant dont le type est sur ses faces", () => {
  const reversible = card("Recto // Verso", { type_line: undefined, card_faces: [{ name: "Recto", type_line: "Legendary Creature — Human" }, { name: "Verso" }] });
  expect(validateDeck(deck([entry(reversible, 1, "commander"), entry(plains, 99)])).errors).toEqual([]);
});
it("compte les doublons entre impressions et entre principal et réserve", () => {
  const c = card("Doublon");
  const d = deck([entry(c, 4), entry({ ...c, id: "autre-impression" }, 1, "sideboard"), entry(plains, 56)], "modern");
  expect(validateDeck(d).errors.join(" ")).toContain("5 exemplaires, maximum 4");
});
it("contrôle les bannissements, les restrictions Vintage et les statuts manquants", () => {
  const banned = card("Bannie", { legalities: { modern: "banned" } });
  expect(validateDeck(deck([entry(banned), entry(plains, 59)], "modern")).errors.join(" ")).toContain("bannie");
  expect(validateDeck(deck([entry(card("Restreinte", { legalities: { vintage: "restricted" } }), 2), entry(plains, 58)], "vintage")).errors.join(" ")).toContain("maximum 1");
  expect(validateDeck(deck([entry(card("Inconnue", { legalities: undefined })), entry(plains, 59)], "standard")).warnings.join(" ")).toContain("légalité inconnue");
});
it("respecte les exceptions de quantité écrites sur les cartes", () => {
  const rats = card("Rat Colony", { oracle_text: "A deck can have any number of cards named Rat Colony." });
  expect(validateDeck(deck([entry(rats, 60)], "modern")).errors).toEqual([]);
  const nazgul = card("Nazgûl", { oracle_text: "A deck can have up to nine cards named Nazgûl." });
  expect(validateDeck(deck([entry(nazgul, 10), entry(plains, 50)], "modern")).errors.join(" ")).toContain("maximum 9");
});
it("limite la réserve à 15 et refuse une réserve Commander", () => {
  expect(validateDeck(deck([entry(plains, 60), entry(plains, 16, "sideboard")], "standard")).errors.join(" ")).toContain("15");
  expect(validateDeck(deck([entry(leader, 1, "commander"), entry(plains, 99), entry(plains, 1, "sideboard")])).errors.join(" ")).toContain("réserve");
});
it("valide Brawl à 60 avec planeswalker légendaire", () => {
  const walker = card("Walker", { type_line: "Legendary Planeswalker — Test" });
  expect(validateDeck(deck([entry(walker, 1, "commander"), entry(plains, 59)], "brawl")).errors).toEqual([]);
});
it("n’autorise une paire de commandants que si leurs capacités le permettent", () => {
  const a = card("A", { type_line: "Legendary Creature", keywords: ["Partner"] }), b = card("B", { type_line: "Legendary Creature", keywords: ["Partner"] });
  expect(validateDeck(deck([entry(a, 1, "commander"), entry(b, 1, "commander"), entry(plains, 98)])).errors).toEqual([]);
  expect(validateDeck(deck([entry(a, 1, "commander"), entry(leader, 1, "commander"), entry(plains, 98)])).errors.join(" ")).toContain("paire");
});
it("filtre globalement sans tenir compte des accents et distingue les cartes par identité Oracle", () => {
  expect(normalizeDeckSearch("  ÉLESH NORN ")).toBe("elesh norn");
  expect(cardKey(card("Norn", { id: "nouvelle-impression" }))).toBe("Norn");
});
it("signale les Game Changers par identité Oracle et la revue manuelle incomplète", () => {
  const d = deck(), gc = { ids: [cardKey(leader)], names: [], checkedAt: new Date().toISOString() };
  expect(checkBracket(d, gc).count).toBe(1); expect(checkBracket(d, gc).warnings.join(" ")).toContain("limite de 0");
  expect(checkBracket(d, gc).warnings.join(" ")).toContain("manuelles");
  const reviewed = { ...d, bracket: 3, bracketChecks: { earlyCombos: "no", extraTurns: "no", landDenial: "no" } } as Deck;
  expect(checkBracket(reviewed, gc).warnings).toEqual([]);
  expect(checkBracket(d).warnings.join(" ")).toContain("indisponible");
});
it("charge la liste actuelle des Game Changers sans peupler la collection", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: [leader], has_more: false }))));
  expect((await loadGameChangers()).ids).toContain(cardKey(leader));
  expect(await db.lots.count()).toBe(0); expect(await db.cards.count()).toBe(0);
});
it("exporte et restaure les decks et garde les anciens exports compatibles", async () => {
  const d = deck(); await db.decks.put(d);
  const backup = await exportBackup(); expect(backup.decks).toHaveLength(1);
  await db.decks.clear(); await importBackup(backup); await importBackup(backup);
  expect(await db.decks.count()).toBe(1);
  const oldBackup = { ...backup } as Record<string, unknown>; delete oldBackup.decks;
  expect(backupSchema.parse(oldBackup).decks).toEqual([]);
  await importBackup(oldBackup); expect(await db.decks.count()).toBe(1);
  expect(backupSchema.safeParse({ ...backup, decks: [d, d] }).success).toBe(false);
});
it("ne restaure aucune donnée si un deck de la sauvegarde est invalide", async () => {
  const d = deck(); await db.decks.put(d);
  await expect(importBackup({ ...(await exportBackup()), decks: [{ ...d, entries: [{ ...d.entries[0], quantity: 0 }] }] }, true)).rejects.toThrow();
  expect(await db.decks.count()).toBe(1);
});
it("le nettoyage du catalogue préserve les decks ; le reset les supprime", async () => {
  await db.decks.put(deck()); await clearCatalog(); expect(await db.decks.count()).toBe(1);
  await resetAppData(); expect(await db.decks.count()).toBe(0);
});
it("rafraîchit les statuts sans écraser une modification simultanée du deck", async () => {
  const d = deck(); await db.decks.put(d);
  vi.stubGlobal("fetch", vi.fn().mockImplementation(async () => {
    await mutateDeck(d.id, old => ({ ...old, name: "Nom modifié pendant le réseau" }));
    return new Response(JSON.stringify({ data: [{ ...leader, legalities: { commander: "banned" } }, plains] }));
  }));
  expect(await refreshDeck(d.id)).toBe(0);
  const refreshed = await db.decks.get(d.id);
  expect(refreshed?.name).toContain("pendant le réseau");
  expect(validateDeck(refreshed!).errors.join(" ")).toContain("bannie");
});

it("le comptage optionnel inclut commandant, principal et réserve, sans modifier les lots", () => {
  const d = deck([entry(leader, 1, "commander"), entry(plains, 8), entry(card("Réserve"), 2, "sideboard")]);
  const disabled = projectCollection([], [], [d], false);
  expect(disabled.lots).toEqual([]); expect(disabled.cards).toEqual([]);
  const enabled = projectCollection([], [], [d], true);
  expect(enabled.lots.reduce((n, l) => n + l.quantity, 0)).toBe(11);
  expect(enabled.cards).toHaveLength(3);
  expect(enabled.lots.every(l => l.deckId === d.id && l.trade === 0)).toBe(true);
  expect(d.entries).toHaveLength(3);
});
it("additionne les decks et les exemplaires saisis sans fusionner les sources", () => {
  const physical: Lot = { id: crypto.randomUUID(), cardId: plains.id, name: plains.name, set: plains.set, collectorNumber: "1", language: "fr", finish: "foil", condition: "NM", signed: false, altered: false, quantity: 3, trade: 1, notes: "", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  const a = deck([entry(plains, 2)]), b = deck([entry(plains, 4)]);
  const combined = projectCollection([physical], [plains], [a, b], true);
  expect(combined.lots.reduce((n, l) => n + l.quantity, 0)).toBe(9);
  expect(new Set(combined.lots.map(l => l.id)).size).toBe(3);
  expect(combined.cards).toHaveLength(1);
  expect(projectCollection([physical], [plains], [a, b], false).lots).toEqual([physical]);
  expect(physical.quantity).toBe(3);
});
it("la projection suit les quantités modifiées et les suppressions de decks", () => {
  const a = deck([entry(plains, 2)]);
  expect(projectCollection([], [], [a], true).lots[0].quantity).toBe(2);
  const changed = { ...a, entries: [{ ...a.entries[0], quantity: 7 }] };
  expect(projectCollection([], [], [changed], true).lots[0].quantity).toBe(7);
  expect(projectCollection([], [], [], true).lots).toEqual([]);
});
it("le réglage commun est désactivé par défaut, persistant et sauvegardé sans lots artificiels", async () => {
  expect((await prefs()).includeDeckCards).toBe(false);
  await db.decks.put(deck()); await updatePrefs({ includeDeckCards: true });
  const backup = await exportBackup(); expect(backup.preferences.includeDeckCards).toBe(true);
  expect(backup.lots).toEqual([]); expect(backup.decks).toHaveLength(1);
  await resetAppData(); await importBackup(backup, true);
  expect((await prefs()).includeDeckCards).toBe(true); expect(await db.lots.count()).toBe(0);
  expect((await db.decks.toArray())[0].entries).toHaveLength(2);
  const legacyPrefs = { ...defaults } as Record<string, unknown>; delete legacyPrefs.includeDeckCards;
  expect(backupSchema.parse({ ...backup, preferences: legacyPrefs }).preferences.includeDeckCards).toBe(false);
});

it("conserve les caractéristiques et sépare les variantes d’une impression", async () => {
  const d = await createDeck("Variantes", "modern"), c = card("Norn", { finishes: ["foil", "nonfoil"] });
  const details = { language: "ja", finish: "foil" as const, condition: "EX" as const, signed: true, altered: true, notes: "Dédicace" };
  await addDeckCard(d.id, c, "main", false, details, 2);
  await addDeckCard(d.id, c, "main", false, { ...details, finish: "nonfoil" }, 1);
  await addDeckCard(d.id, c, "main", false, details, 1);
  const stored = (await db.decks.get(d.id))!;
  expect(stored.entries).toHaveLength(2);
  expect(stored.entries[0].quantity).toBe(3);
  expect(stored.entries[0].details).toEqual(details);
  expect(validateDeck(stored).errors.some(e => e.includes("maximum 4"))).toBe(false);
  expect(projectCollection([], [], [stored], true).lots[0]).toMatchObject({ language: "ja", finish: "foil", condition: "EX", signed: true, altered: true, notes: "Dédicace" });
});
it("les anciennes entrées sans caractéristiques restent lisibles et exportables", async () => {
  const old = deck(); await db.decks.put(old);
  expect(entryDetails(old.entries[0])).toMatchObject({ language: "en", finish: "nonfoil", condition: "NM" });
  expect((await exportBackup()).decks).toHaveLength(1);
});
it("l’import de liste deck est atomique, préserve les finitions et empêche un double clic", async () => {
  const d = await createDeck("Liste", "modern"), c = card("Elesh Norn", { finishes: ["foil", "nonfoil"] });
  const rows: ImportRow[] = [{ id: crypto.randomUUID(), input: "2 Elesh Norn (ONE) 1 *F*", line: 1, entry: { line: 1, name: c.name, set: "one", collectorNumber: "1", quantity: 2, finish: "foil" }, card: c }];
  const details = { language: "de", condition: "LP" as const, signed: true, altered: false, notes: "Lot" };
  expect(await commitDeckList(d.id, rows, "sideboard", details)).toBe(2);
  expect((await db.decks.get(d.id))?.entries[0]).toMatchObject({ zone: "sideboard", quantity: 2, details: { ...details, finish: "foil" } });
  await expect(commitDeckList(d.id, rows, "sideboard", details)).rejects.toThrow("déjà");
  expect((await db.decks.get(d.id))?.entries).toHaveLength(1);
  expect(await db.lots.count()).toBe(0);
});
it("la résolution d’une liste deck ne remplit ni catalogue ni collection", async () => {
  const c = card("Elesh Norn", { finishes: ["foil"] });
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: [c] }))));
  const rows = await prepareList("1 Elesh Norn (ONE) 1 *F*", { cacheCards: false });
  expect(rows[0].error).toBeUndefined(); expect(rows[0].entry?.finish).toBe("foil");
  expect(await db.cards.count()).toBe(0); expect(await db.lots.count()).toBe(0);
});
it("refuse tout un import si une finition est indisponible et garde les données intactes", async () => {
  const d = await createDeck("Liste invalide", "modern"), c = card("Norn", { finishes: ["nonfoil"] });
  const rows: ImportRow[] = [{ id: crypto.randomUUID(), input: "1 Norn (ONE) 1 *F*", line: 1, entry: { line: 1, name: c.name, set: "one", collectorNumber: "1", quantity: 1, finish: "foil" }, card: c }];
  await expect(commitDeckList(d.id, rows, "main", { language: "fr", condition: "NM", signed: false, altered: false, notes: "" })).rejects.toThrow("Finition");
  expect((await db.decks.get(d.id))?.entries).toEqual([]);
});
