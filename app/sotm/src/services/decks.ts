import { db, prefs } from "../db";
import { exemplarSchema, type Exemplar } from "../schemas/exemplar";
import { deckCardSchema } from "../schemas/decks";
import type { ImportRow } from "./listImport";
import { deckSchema, formats, type Deck, type DeckCard, type DeckEntry, type DeckFormat } from "../schemas/decks";
import { cardTypeLine } from "../schemas/models";
import { request } from "./scryfall";
export const normalizeDeckSearch = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
export const cardKey = (c: DeckCard) => c.oracle_id ?? c.name.toLowerCase();
export const cardText = (c: DeckCard) => c.oracle_text ?? c.card_faces?.map(f => f.oracle_text ?? "").join("\n") ?? "";
export const deckCount = (d: Deck, zone?: DeckEntry["zone"]) => d.entries.filter(e => !zone || e.zone === zone).reduce((n, e) => n + e.quantity, 0);
export async function createDeck(name: string, format: DeckFormat) {
  const now = new Date().toISOString();
  const deck = deckSchema.parse({ id: crypto.randomUUID(), name, format, entries: [], createdAt: now, updatedAt: now });
  await db.decks.put(deck);
  return deck;
}
export async function mutateDeck(id: string, change: (deck: Deck) => Deck) {
  return db.transaction("rw", db.decks, async () => {
    const old = await db.decks.get(id);
    if (!old) throw Error("Deck introuvable.");
    const next = deckSchema.parse({ ...change(old), updatedAt: new Date().toISOString() });
    await db.decks.put(next);
    return next;
  });
}
export function entryDetails(entry: Pick<DeckEntry, "card" | "details">): Exemplar {
  return entry.details ?? {
    language: entry.card.lang,
    finish: entry.card.finishes.includes("nonfoil") ? "nonfoil" : entry.card.finishes.includes("foil") ? "foil" : "etched",
    condition: "NM", signed: false, altered: false, notes: "",
  };
}
const sameDetails = (a: Exemplar, b: Exemplar) => (["language", "finish", "condition", "signed", "altered", "notes"] as const).every(key => a[key] === b[key]);
export async function addDeckCard(id: string, card: DeckCard, zone: DeckEntry["zone"], secondCommander = false, details?: Exemplar, quantity = 1) {
  const chosen = exemplarSchema.parse(details ?? { ...entryDetails({ card }), language: (await prefs()).defaultLanguage });
  if (!card.finishes.includes(chosen.finish)) throw Error("Finition indisponible pour cette impression.");
  if (zone === "commander" && quantity !== 1) throw Error("Un seul exemplaire par commandant.");
  return mutateDeck(id, d => {
    let entries = [...d.entries];
    if (zone === "commander") {
      if (secondCommander) {
        if (entries.filter(e => e.zone === "commander").length >= 2) throw Error("Deux commandants maximum.");
        if (entries.some(e => e.zone === "commander" && cardKey(e.card) === cardKey(card))) throw Error("Ce commandant est déjà sélectionné.");
      } else entries = entries.filter(e => e.zone !== "commander");
      const existingMain = entries.find(e => e.zone === "main" && e.card.id === card.id && sameDetails(entryDetails(e), chosen));
      if (existingMain) entries = entries.flatMap(e => e.id !== existingMain.id ? [e] : e.quantity > 1 ? [{ ...e, quantity: e.quantity - 1 }] : []);
    }
    const existing = entries.find(e => e.card.id === card.id && e.zone === zone && sameDetails(entryDetails(e), chosen));
    if (existing) entries = entries.map(e => e.id === existing.id ? { ...e, quantity: e.quantity + quantity } : e);
    else entries.push({ id: crypto.randomUUID(), card, zone, quantity, details: chosen });
    return { ...d, entries };
  });
}
export async function commitDeckList(id: string, rows: ImportRow[], zone: "main" | "sideboard", details: Omit<Exemplar, "finish">) {
  if (!rows.length || rows.some(row => row.error || !row.entry || !row.card)) throw Error("Corrigez toutes les lignes avant de confirmer.");
  const incoming = rows.map(row => ({ id: row.id, card: { ...deckCardSchema.parse(row.card), fetchedAt: Date.now() }, quantity: row.entry!.quantity, zone, details: exemplarSchema.parse({ ...details, finish: row.entry!.finish }) }));
  await mutateDeck(id, d => {
    if (incoming.some(entry => d.entries.some(old => old.id === entry.id))) throw Error("Cet aperçu a déjà été ajouté. Analysez une nouvelle liste pour un nouvel ajout.");
    return { ...d, entries: [...d.entries, ...incoming] };
  });
  return incoming.reduce((n, entry) => n + entry.quantity, 0);
}
export async function searchDeckCards(q: string, next?: string) {
  return request<{ data: DeckCard[]; next_page?: string }>(next ?? `/cards/search?q=${encodeURIComponent(q + " game:paper")}&unique=prints`);
}
export interface GameChangers { ids: string[]; names: string[]; checkedAt: string }
export async function loadGameChangers(): Promise<GameChangers> {
  const page = await request<{ data: DeckCard[]; has_more?: boolean; next_page?: string }>("/cards/search?q=is%3Agamechanger&unique=cards");
  const cards = [...page.data];
  let next = page.has_more ? page.next_page : undefined;
  while (next) { const p = await request<typeof page>(next); cards.push(...p.data); next = p.has_more ? p.next_page : undefined; }
  const result = { ids: cards.map(c => cardKey(c)), names: cards.map(c => c.name.toLowerCase()), checkedAt: new Date().toISOString() };
  await db.cache.put({ id: "deck-gamechangers", at: Date.now(), data: result });
  return result;
}
export async function refreshDeck(id: string) {
  const before = await db.decks.get(id);
  if (!before) throw Error("Deck introuvable.");
  const ids = [...new Set(before.entries.map(e => e.card.id))];
  const cards = new Map<string, DeckCard>();
  for (let i = 0; i < ids.length; i += 75) {
    const page = await request<{ data: DeckCard[]; not_found?: unknown[] }>("/cards/collection", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ identifiers: ids.slice(i, i + 75).map(id => ({ id })) }) });
    for (const card of page.data) cards.set(card.id, { ...card, fetchedAt: Date.now() });
  }
  await mutateDeck(id, d => ({ ...d, entries: d.entries.map(e => ({ ...e, card: cards.get(e.card.id) ?? e.card })) }));
  return ids.length - cards.size;
}
function copyLimit(c: DeckCard, singleton: boolean) {
  if (/\bBasic\b/.test(cardTypeLine(c)) || /a deck can have any number of cards named/i.test(cardText(c))) return Infinity;
  const match = cardText(c).match(/a deck can have up to (\w+) cards named/i);
  const words: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, fifteen: 15 };
  return match ? (words[match[1].toLowerCase()] ?? Number(match[1])) || (singleton ? 1 : 4) : singleton ? 1 : 4;
}
function commanderEligible(card: DeckCard, format: DeckFormat) {
  const type = cardTypeLine(card).split(" // ")[0];
  return /can be your commander/i.test(cardText(card)) || (/Legendary/.test(type) && /Creature/.test(type)) || (format === "brawl" && /Legendary/.test(type) && /Planeswalker/.test(type));
}
function validPair(a: DeckCard, b: DeckCard) {
  const at = cardText(a), bt = cardText(b);
  const partner = (c: DeckCard) => c.keywords?.includes("Partner") || /(?:^|\n)Partner(?:\s*\(|\s*$)/m.test(cardText(c));
  return (partner(a) && partner(b)) ||
    (/Friends forever/i.test(at) && /Friends forever/i.test(bt)) ||
    (at.includes(`Partner with ${b.name}`) && bt.includes(`Partner with ${a.name}`)) ||
    (/Choose a Background/i.test(at) && /Legendary Enchantment.*Background/.test(cardTypeLine(b))) ||
    (/Choose a Background/i.test(bt) && /Legendary Enchantment.*Background/.test(cardTypeLine(a))) ||
    (/Doctor's companion/i.test(at) && /Creature — (?:Time Lord )?Doctor\b/.test(cardTypeLine(b))) ||
    (/Doctor's companion/i.test(bt) && /Creature — (?:Time Lord )?Doctor\b/.test(cardTypeLine(a)));
}
export interface DeckValidation { errors: string[]; warnings: string[]; mainCount: number; sideCount: number }
export function validateDeck(d: Deck): DeckValidation {
  const rules = formats[d.format], errors: string[] = [], warnings: string[] = [];
  const commanders = d.entries.filter(e => e.zone === "commander");
  const mainCount = deckCount(d, "main") + deckCount(d, "commander"), sideCount = deckCount(d, "sideboard");
  if (rules.singleton ? mainCount !== rules.size : mainCount < rules.size) errors.push(`${rules.singleton ? "Exactement" : "Au moins"} ${rules.size} cartes requises${rules.commanders ? ", commandant compris" : " dans le deck principal"} (${mainCount} actuellement).`);
  if (rules.commanders && sideCount) errors.push("La réserve n’est pas autorisée pour ce format dans ce contrôle ; les compagnons nécessitent une vérification distincte.");
  if (!rules.commanders && sideCount > 15) errors.push(`Réserve limitée à 15 cartes (${sideCount}).`);
  if (!rules.commanders && commanders.length) errors.push("Ce format n’utilise pas de commandant.");
  if (rules.commanders) {
    if (!commanders.length) errors.push("Sélectionnez un commandant.");
    if (commanders.length > (d.format === "brawl" ? 1 : 2) || commanders.some(e => e.quantity !== 1)) errors.push("Nombre ou quantité de commandants non autorisé.");
    if (commanders.length === 2 && !validPair(commanders[0].card, commanders[1].card)) errors.push("Ces deux cartes ne présentent pas de capacité autorisant cette paire de commandants.");
    for (const e of commanders) {
      const background = commanders.length === 2 && /Legendary Enchantment.*Background/.test(cardTypeLine(e.card)) && commanders.some(other => other.id !== e.id && /Choose a Background/i.test(cardText(other.card)));
      if (!background && !commanderEligible(e.card, d.format)) errors.push(`${e.card.name} : carte non éligible comme commandant.`);
    }
    if (commanders.length) {
      const missing = d.entries.some(e => !Array.isArray(e.card.color_identity));
      if (missing) warnings.push("Identité couleur manquante pour certaines cartes : actualisez les règles.");
      const identity = new Set(commanders.flatMap(e => e.card.color_identity ?? []));
      for (const e of d.entries.filter(e => e.zone === "main")) if (e.card.color_identity?.some(c => !identity.has(c))) errors.push(`${e.card.name} : hors identité couleur du commandant.`);
    }
  }
  const groups = new Map<string, DeckEntry[]>();
  for (const e of d.entries) groups.set(cardKey(e.card), [...(groups.get(cardKey(e.card)) ?? []), e]);
  for (const group of groups.values()) {
    const card = group[0].card, quantity = group.reduce((n, e) => n + e.quantity, 0);
    const statuses = group.map(e => e.card.legalities?.[d.format]);
    if (statuses.some(s => !s || !["legal", "restricted", "not_legal", "banned"].includes(s))) warnings.push(`${card.name} : légalité inconnue ; actualisez les règles.`);
    if (statuses.some(s => s === "banned" || s === "not_legal")) errors.push(`${card.name} : ${statuses.includes("banned") ? "bannie" : "non légale"} en ${rules.label}.`);
    const limit = statuses.includes("restricted") ? 1 : copyLimit(card, rules.singleton);
    if (quantity > limit) errors.push(`${card.name} : ${quantity} exemplaires, maximum ${limit} toutes zones confondues.`);
  }
  warnings.push("Contrôle structurel et statuts Scryfall, pas une homologation : compagnons, restrictions de commandants propres au format et interactions particulières restent à vérifier. Les règles peuvent évoluer ; actualisez avant de jouer.");
  return { errors, warnings, mainCount, sideCount };
}
export const bracketLabels = ["Exhibition", "Core", "Upgraded", "Optimized", "cEDH"];
export function checkBracket(d: Deck, changers?: GameChangers) {
  const hits = d.entries.filter(e => e.zone !== "sideboard" && changers && (changers.ids.includes(cardKey(e.card)) || changers.names.includes(e.card.name.toLowerCase())));
  const count = hits.reduce((n, e) => n + e.quantity, 0), warnings: string[] = [];
  if (!changers) warnings.push("Liste des Game Changers indisponible : contrôle incomplet.");
  if (changers && Date.now() - Date.parse(changers.checkedAt) > 7 * 86400000) warnings.push("Liste des Game Changers ancienne : actualisez-la.");
  const cap = d.bracket <= 2 ? 0 : d.bracket === 3 ? 3 : Infinity;
  if (count > cap) warnings.push(`${count} Game Changer(s) : dépasse la limite de ${cap} du bracket ${d.bracket}.`);
  if (Object.values(d.bracketChecks).includes("unknown")) warnings.push("Complétez les vérifications manuelles du plan de jeu.");
  if (d.bracket <= 3 && Object.values(d.bracketChecks).includes("yes")) warnings.push("Le plan de jeu déclaré demande une revue des critères officiels ; un bracket 4 ou 5 peut être nécessaire.");
  return { count, hits, warnings };
}
