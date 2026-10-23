import { entryDetails } from "./decks";
import type { Deck } from "../schemas/decks";
import type { Card, Lot } from "../schemas/models";
export type CollectionLot = Lot & { deckId?: string; deckName?: string; deckEntryId?: string };
export function projectCollection(physicalLots: Lot[], catalog: Card[], decks: Deck[], includeDeckCards: boolean) {
  const lots: CollectionLot[] = [...physicalLots];
  const cards = new Map(catalog.map(card => [card.id, card]));
  if (includeDeckCards) for (const deck of decks) for (const entry of deck.entries) {
    const card = entry.card;
    const details = entryDetails(entry);
    const known = cards.get(card.id);
    if (!known || (card.fetchedAt ?? 0) > (known.fetchedAt ?? 0)) cards.set(card.id, card);
    lots.push({
      id: `deck:${deck.id}:${entry.id}`, deckId: deck.id, deckName: deck.name, deckEntryId: entry.id,
      cardId: card.id, oracleId: card.oracle_id, name: card.name, set: card.set, collectorNumber: card.collector_number,
      ...details, quantity: entry.quantity, trade: 0, createdAt: deck.createdAt, updatedAt: deck.updatedAt,
    });
  }
  return { lots, cards: [...cards.values()] };
}
