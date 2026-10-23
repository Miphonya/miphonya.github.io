import type { Card, Lot } from "../schemas/models";
export function printingKey(lot: Lot, card?: Pick<Card, "set" | "collector_number">): string {
  const set = (card?.set || lot.set).trim().toLowerCase(), number = (card?.collector_number || lot.collectorNumber).trim().toLowerCase();
  return set && number ? JSON.stringify([set, number]) : JSON.stringify(["card", lot.cardId]);
}
/** Derived only: disabling automation restores the stored manual trade quantities. */
export function tradeLots(lots: Lot[], automatic: boolean, cards: Card[] = []): Lot[] {
  if (!automatic) return lots;
  const catalog = new Map(cards.map(card => [card.id, card]));
  const groups = new Map<string, Lot[]>();
  for (const lot of lots) {
    const key = printingKey(lot, catalog.get(lot.cardId));
    groups.set(key, [...(groups.get(key) ?? []), lot]);
  }
  const quantities = new Map<string, number>();
  const finishRank = (lot: Lot) => lot.finish === "nonfoil" ? 1 : 0;
  for (const group of groups.values()) {
    let keep = 1;
    const preferred = [...group].sort((a, b) => finishRank(a) - finishRank(b) || a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
    for (const lot of preferred) {
      const kept = Math.min(keep, lot.quantity); keep -= kept;
      quantities.set(lot.id, Math.max(0, lot.quantity - kept));
    }
  }
  return lots.map(lot => ({ ...lot, trade: quantities.get(lot.id) ?? 0 }));
}
