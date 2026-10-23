import { it, expect } from "vitest";
import { tradeLots } from "../services/trade";
import type { Card, Lot } from "../schemas/models";
const lot = (id: string, quantity: number, extra: Partial<Lot> = {}): Lot => ({ id, cardId: id, oracleId: "oracle-norn", name: "Elesh Norn", set: "one", collectorNumber: "10", language: "fr", finish: "nonfoil", condition: "NM", signed: false, altered: false, quantity, trade: 0, notes: "", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z", ...extra });
it("réserve un exemplaire et propose les suivants sans modifier les données sources", () => {
  const lots = [lot("a", 3)];
  expect(tradeLots(lots, true)[0].trade).toBe(2);
  expect(lots[0].trade).toBe(0);
  expect(tradeLots([lot("unique", 1)], true)[0].trade).toBe(0);
});
it("conserve séparément une Plaine normale et une full art de numéros différents", () => {
  const plains = [lot("normal", 1, { name: "Plains", collectorNumber: "2" }), lot("full-art", 1, { name: "Plains", collectorNumber: "324" })];
  expect(tradeLots(plains, true).map(l => l.trade)).toEqual([0, 0]);
});
it("ne regroupe pas le même numéro dans deux extensions différentes", () => {
  expect(tradeLots([lot("a", 1), lot("b", 1, { set: "mbs" })], true).map(l => l.trade)).toEqual([0, 0]);
});
it("met le normal à l’échange et garde le foil même si le normal est plus ancien", () => {
  const lots = [lot("normal", 1), lot("foil", 1, { finish: "foil", createdAt: "2026-02-01T00:00:00.000Z" })];
  expect(tradeLots(lots, true).map(l => l.trade)).toEqual([1, 0]);
});
it("garde un foil et propose tous les autres exemplaires du même numéro", () => {
  const lots = [lot("normal", 3), lot("foil", 2, { finish: "foil" })];
  expect(tradeLots(lots, true).map(l => l.trade)).toEqual([3, 1]);
});
it("privilégie également etched et regroupe les langues d’un même numéro", () => {
  const lots = [lot("normal", 1), lot("etched", 1, { finish: "etched", language: "en", signed: true, condition: "EX" })];
  expect(tradeLots(lots, true).map(l => l.trade)).toEqual([1, 0]);
});
it("garde le plus ancien à finition égale même si les lots arrivent dans un autre ordre", () => {
  const lots = [lot("new", 2, { createdAt: "2026-02-01T00:00:00.000Z" }), lot("old", 1)];
  expect(tradeLots(lots, true).map(l => l.trade)).toEqual([2, 0]);
});
it("préserve les suffixes des numéros et fonctionne sans nom ni identité Oracle", () => {
  const lots = [lot("a", 1, { collectorNumber: "10a", oracleId: undefined }), lot("b", 1, { collectorNumber: "10b", oracleId: undefined }), lot("c", 1, { collectorNumber: "10a", name: "Autre langue", oracleId: undefined })];
  expect(tradeLots(lots, true).map(l => l.trade)).toEqual([0, 0, 1]);
});
it("recalcule les doublons après une baisse de quantité ou un retrait", () => {
  expect(tradeLots([lot("a", 4), lot("b", 2)], true).reduce((n, l) => n + l.trade, 0)).toBe(5);
  expect(tradeLots([lot("b", 2)], true)[0].trade).toBe(1);
  expect(tradeLots([lot("b", 1)], true)[0].trade).toBe(0);
});
it("désactiver l’option restitue exactement les quantités manuelles", () => {
  const lots = [lot("a", 3, { trade: 1 }), lot("b", 1, { trade: 0 })];
  expect(tradeLots(lots, true).reduce((n, l) => n + l.trade, 0)).toBe(3);
  expect(tradeLots(lots, false)).toEqual(lots);
});

it("une unique Walk-In Closet // Forgotten Cellar ne devient pas un doublon à cause de ses deux noms ou d’un ancien marquage manuel", () => {
  const single = lot("walk-in", 1, { name: "Walk-In Closet // Forgotten Cellar", oracleId: "walk-in-oracle", set: "dsk", collectorNumber: "205", trade: 1 });
  expect(tradeLots([single], true)[0].trade).toBe(0);
  const variant = { ...single, id: "walk-in-341", cardId: "walk-in-341", collectorNumber: "341" };
  expect(tradeLots([single, variant], true).map(l => l.trade)).toEqual([0, 0]);
  const promo = { ...single, id: "promo", set: "pdsk", collectorNumber: "205p" };
  expect(tradeLots([single, variant, promo], true).map(l => l.trade)).toEqual([0, 0, 0]);
  expect(tradeLots([single], false)[0].trade).toBe(1);
});

it("utilise le numéro du catalogue si un ancien lot porte un numéro erroné", () => {
  const lots = [lot("walk", 1, { cardId: "walk-card", name: "Walk-In Closet // Forgotten Cellar", set: "dsk", collectorNumber: "205" }), lot("full-art", 1, { cardId: "full-art-card", name: "Walk-In Closet // Forgotten Cellar", set: "dsk", collectorNumber: "205" })];
  const cards = [{ id: "walk-card", set: "dsk", collector_number: "205" }, { id: "full-art-card", set: "dsk", collector_number: "341" }] as Card[];
  expect(tradeLots(lots, true, cards).map(l => l.trade)).toEqual([0, 0]);
  expect(lots[1].collectorNumber).toBe("205");
});
