import "fake-indexeddb/auto";
import { beforeEach, it, expect } from "vitest";
import { db, updatePrefs } from "../db";
import { deckSchema, type DeckCard } from "../schemas/decks";
import type { Card, Lot } from "../schemas/models";
import { applyBulkEdit } from "../services/bulkEdit";
const now = "2026-01-01T00:00:00.000Z";
const card = (id: string, finishes = ["nonfoil", "foil"]): Card => ({ id, name: id, set: "one", set_name: "ONE", collector_number: id, rarity: "rare", lang: "en", finishes, prices: { eur: "1", eur_foil: "2" } });
const a = card("a"), b = card("b");
const lot = (c: Card, extra: Partial<Lot> = {}): Lot => ({ id: crypto.randomUUID(), cardId: c.id, name: c.name, set: c.set, collectorNumber: c.collector_number, language: "fr", finish: "nonfoil", condition: "NM", signed: true, altered: false, quantity: 4, trade: 3, notes: "À garder", createdAt: now, updatedAt: now, ...extra });
const makeDeck = (c: Card = a, commander = false) => deckSchema.parse({ id: crypto.randomUUID(), name: "Deck test", format: commander ? "commander" : "modern", entries: [{ id: crypto.randomUUID(), card: c as DeckCard, quantity: 1, zone: commander ? "commander" : "main" }], createdAt: now, updatedAt: now });
beforeEach(async () => { await Promise.all(db.tables.map(table => table.clear())); await db.cards.bulkPut([a, b]); });
it("modifie tous les lots sélectionnés et préserve les autres caractéristiques et cartes", async () => {
  const x = lot(a), y = lot(a, { language: "en" }), other = lot(b);
  await db.lots.bulkPut([x, y, other]);
  expect(await applyBulkEdit([a], { language: "ja", condition: "EX" })).toEqual({ lots: 2, deckEntries: 0 });
  for (const id of [x.id, y.id]) expect(await db.lots.get(id)).toMatchObject({ language: "ja", condition: "EX", quantity: 4, signed: true, notes: "À garder" });
  expect(await db.lots.get(other.id)).toEqual(other);
});
it("une finition indisponible annule toute la sélection", async () => {
  await db.cards.put(card("b", ["nonfoil"]));
  const x = lot(a), y = lot(b); await db.lots.bulkPut([x, y]);
  await expect(applyBulkEdit([a, b], { finish: "foil", language: "ja" })).rejects.toThrow("indisponible");
  expect(await db.lots.get(x.id)).toEqual(x); expect(await db.lots.get(y.id)).toEqual(y);
});
it("refuse une sélection vide, un patch vide ou une quantité invalide", async () => {
  const x = lot(a); await db.lots.put(x);
  await expect(applyBulkEdit([], { language: "ja" })).rejects.toThrow("Sélectionnez");
  await expect(applyBulkEdit([a], {})).rejects.toThrow("champ");
  await expect(applyBulkEdit([a], { quantity: 0 })).rejects.toThrow();
  expect(await db.lots.get(x.id)).toEqual(x);
});
it("réduit les quantités par lot et borne la quantité d’échange stockée", async () => {
  const x = lot(a); await db.lots.put(x);
  await applyBulkEdit([a], { quantity: 1 });
  expect(await db.lots.get(x.id)).toMatchObject({ quantity: 1, trade: 1 });
});
it("protège le mode automatique et valide la quantité d’échange manuelle", async () => {
  const x = lot(a); await db.lots.put(x);
  await expect(applyBulkEdit([a], { manualTrade: 1 })).rejects.toThrow("automatiques");
  await updatePrefs({ autoTradeDuplicates: false });
  await expect(applyBulkEdit([a], { quantity: 1, manualTrade: 2 })).rejects.toThrow("dépasse");
  expect(await db.lots.get(x.id)).toEqual(x);
  await applyBulkEdit([a], { manualTrade: 1 });
  expect((await db.lots.get(x.id))?.trade).toBe(1);
});
it("actualise la source des cartes de deck incluses avec les lots dans une transaction", async () => {
  const x = lot(a), deck = makeDeck();
  await db.lots.put(x); await db.decks.put(deck); await updatePrefs({ includeDeckCards: true });
  expect(await applyBulkEdit([a], { language: "de", finish: "foil", signed: false })).toEqual({ lots: 1, deckEntries: 1 });
  expect(await db.lots.get(x.id)).toMatchObject({ language: "de", finish: "foil", signed: false });
  expect((await db.decks.get(deck.id))?.entries[0].details).toMatchObject({ language: "de", finish: "foil", signed: false, condition: "NM" });
});
it("ne modifie pas les decks exclus du comptage de collection", async () => {
  const x = lot(a), deck = makeDeck(); await db.lots.put(x); await db.decks.put(deck);
  expect(await applyBulkEdit([a], { language: "de" })).toEqual({ lots: 1, deckEntries: 0 });
  expect(await db.decks.get(deck.id)).toEqual(deck);
});
it("un commandant empêchant la modification de quantité annule aussi celle des lots", async () => {
  const x = lot(a), deck = makeDeck(a, true); await db.lots.put(x); await db.decks.put(deck); await updatePrefs({ includeDeckCards: true });
  await expect(applyBulkEdit([a], { quantity: 2, notes: "Nouveau" })).rejects.toThrow("commandant");
  expect(await db.lots.get(x.id)).toEqual(x); expect(await db.decks.get(deck.id)).toEqual(deck);
});
it("une finition incompatible dans un deck ne modifie aucune source", async () => {
  const x = lot(a), deck = makeDeck(card("a", ["nonfoil"])); await db.lots.put(x); await db.decks.put(deck); await updatePrefs({ includeDeckCards: true });
  await expect(applyBulkEdit([a], { finish: "foil" })).rejects.toThrow("indisponible");
  expect(await db.lots.get(x.id)).toEqual(x); expect(await db.decks.get(deck.id)).toEqual(deck);
});
it("ne recrée pas les lots supprimés pendant l’ouverture du formulaire", async () => {
  await expect(applyBulkEdit([a], { language: "ja" })).rejects.toThrow("plus dans la collection");
  expect(await db.lots.count()).toBe(0);
});
it("permet de vider les notes et retirer explicitement une signature", async () => {
  const x = lot(a); await db.lots.put(x); await applyBulkEdit([a], { notes: "", signed: false });
  expect(await db.lots.get(x.id)).toMatchObject({ notes: "", signed: false, quantity: 4 });
});
it("une quantité d’échange manuelle seule ne modifie pas les entrées de deck", async () => {
  const x = lot(a), deck = makeDeck(); await db.lots.put(x); await db.decks.put(deck); await updatePrefs({ includeDeckCards: true, autoTradeDuplicates: false });
  expect(await applyBulkEdit([a], { manualTrade: 1 })).toEqual({ lots: 1, deckEntries: 0 });
  expect(await db.decks.get(deck.id)).toEqual(deck);
});
