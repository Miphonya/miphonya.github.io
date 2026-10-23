import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearCatalog,
  db,
  exportBackup,
  importBackup,
  saveLot,
  savePrefs,
} from "../db";
import {
  backupSchema,
  compatible,
  defaults,
  imageUrl,
  lotSchema,
  progress,
  type Card,
  type Lot,
} from "../schemas/models";
import { scryfallPriceProvider } from "../services/pricing";
import { request, scryfallService } from "../services/scryfall";
const lot = (overrides: Partial<Lot> = {}): Lot => ({
  id: crypto.randomUUID(),
  cardId: "printing-one",
  oracleId: "oracle-one",
  name: "Test",
  set: "one",
  collectorNumber: "1",
  language: "fr",
  finish: "nonfoil",
  condition: "NM",
  signed: false,
  altered: false,
  quantity: 3,
  trade: 1,
  notes: "",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
});
const card = {
  id: "printing-one",
  oracle_id: "oracle-one",
  name: "Test",
  set: "one",
  set_name: "ONE",
  collector_number: "1",
  rarity: "rare",
  lang: "fr",
  finishes: ["nonfoil", "foil"],
  type_line: "Creature",
  prices: { eur: "2.50", eur_foil: "4.00" },
} satisfies Card;
beforeEach(async () => {
  await Promise.all([
    db.lots.clear(),
    db.cards.clear(),
    db.sets.clear(),
    db.settings.clear(),
    db.cache.clear(),
  ]);
});
afterEach(() => vi.unstubAllGlobals());
describe("lots physiques", () => {
  it("refuse les quantités nulles, fractionnelles et le Trade supérieur au total", () => {
    for (const v of [
      { quantity: 0 },
      { quantity: 1.5 },
      { trade: -1 },
      { trade: 4 },
    ])
      expect(lotSchema.safeParse(lot(v)).success).toBe(false);
  });
  it("valide états et finitions", () => {
    expect(
      lotSchema.safeParse({ ...lot(), condition: "damaged" }).success,
    ).toBe(false);
    expect(lotSchema.safeParse({ ...lot(), finish: "glossy" }).success).toBe(
      false,
    );
    expect(
      lotSchema.parse(lot({ finish: "etched", condition: "PO" })),
    ).toBeTruthy();
  });
  it("ne fusionne que les lots avec caractéristiques et notes identiques", () => {
    const a = lot();
    expect(compatible(a, lot())).toBe(true);
    for (const changes of [
      { signed: true },
      { altered: true },
      { notes: "Provenance" },
      { finish: "foil" as const },
      { language: "en" },
      { condition: "EX" as const },
    ])
      expect(compatible(a, lot(changes))).toBe(false);
  });
  it("compte les impressions une seule fois et distingue les réimpressions", () => {
    expect(
      progress([lot(), lot(), lot({ cardId: "printing-two" })], "one", 10),
    ).toEqual({ owned: 2, percent: 20 });
    expect(progress([], "one", 0).percent).toBe(0);
  });
  it("le Trade conserve la quantité physique et le même identifiant", async () => {
    const a = lot();
    await saveLot(a);
    await saveLot({ ...a, trade: 2 });
    expect(await db.lots.count()).toBe(1);
    expect((await db.lots.get(a.id))?.quantity).toBe(3);
  });
});
describe("sauvegardes", () => {
  it("exporte sans catalogue ni images puis restaure les préférences", async () => {
    await saveLot(lot());
    await db.cards.put(card);
    await savePrefs({ ...defaults, tracked: ["one"] });
    const b = await exportBackup();
    expect(Object.keys(b).sort()).toEqual([
      "decks",
      "exportedAt",
      "lots",
      "preferences",
      "schemaVersion",
    ]);
    await db.lots.clear();
    await importBackup(b, true);
    expect(await db.lots.count()).toBe(1);
    expect((await exportBackup()).preferences.tracked).toEqual(["one"]);
  });
  it("réimporte sans doubler les quantités et conserve la version récente", async () => {
    const a = lot();
    const b = {
      schemaVersion: 1,
      exportedAt: a.createdAt,
      lots: [a],
      preferences: defaults,
    };
    await importBackup(b);
    await importBackup(b);
    expect((await db.lots.toArray())[0].quantity).toBe(3);
    await saveLot({ ...a, quantity: 5, updatedAt: "2026-02-01T00:00:00.000Z" });
    await importBackup(b);
    expect((await db.lots.toArray())[0].quantity).toBe(5);
  });
  it("un import invalide ne modifie jamais les données existantes", async () => {
    const a = lot();
    await saveLot(a);
    await expect(
      importBackup({ schemaVersion: 2, lots: [] }, true),
    ).rejects.toThrow();
    expect(await db.lots.get(a.id)).toEqual(a);
  });
  it("refuse les identifiants dupliqués et préserve la collection au nettoyage", async () => {
    const a = lot();
    expect(
      backupSchema.safeParse({
        schemaVersion: 1,
        exportedAt: a.createdAt,
        lots: [a, a],
        preferences: defaults,
      }).success,
    ).toBe(false);
    await saveLot(a);
    await db.cards.put(card);
    await clearCatalog();
    expect(await db.cards.count()).toBe(0);
    expect(await db.lots.count()).toBe(1);
  });
});
describe("catalogue et prix", () => {
  it("ne transforme pas les prix manquants en zéro et distingue les finitions", () => {
    expect(scryfallPriceProvider.quote(card, "nonfoil").amount).toBe(2.5);
    expect(scryfallPriceProvider.quote(card, "foil").amount).toBe(4);
    expect(scryfallPriceProvider.quote(card, "etched").amount).toBeNull();
    expect(
      scryfallPriceProvider.quote(
        { ...card, prices: { eur: null, eur_foil: null } },
        "nonfoil",
      ).amount,
    ).toBeNull();
  });
  it("sélectionne les images recto verso", () => {
    const double = {
      ...card,
      card_faces: [
        { name: "Recto", image_uris: { normal: "front", small: "front" } },
        { name: "Verso", image_uris: { normal: "back", small: "back" } },
      ],
    };
    expect(imageUrl(double)).toBe("front");
    expect(imageUrl(double, 1)).toBe("back");
  });
  it("remonte les erreurs HTTP sans les traiter comme des cartes", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ details: "Aucune carte" }), {
          status: 404,
        }),
      ),
    );
    await expect(request("/cards/search?q=none")).rejects.toThrow(
      "Aucune carte",
    );
  });
  it("refuse les destinations étrangères dans la pagination", async () => {
    await expect(request("https://example.com/cards")).rejects.toThrow(
      "Destination API refusée",
    );
  });
  it("charge toutes les pages d’un set et les met en cache", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: [card],
            has_more: true,
            next_page: "https://api.scryfall.com/cards/page2",
          }),
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: [{ ...card, id: "printing-two" }],
            has_more: false,
          }),
        ),
      );
    vi.stubGlobal("fetch", fetcher);
    const result = await scryfallService.setCards("one");
    expect(result).toHaveLength(2);
    expect(await db.cards.count()).toBe(2);
    await scryfallService.setCards("one");
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it("sert le cache expiré si le réseau est indisponible", async () => {
    await db.cache.put({ id: "sets", at: 0, data: [{ code: "one" }] });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    expect(await scryfallService.sets()).toEqual([{ code: "one" }]);
  });
});
