import { z } from "zod";
import { db, prefs } from "../db";
import { lotSchema, type Card } from "../schemas/models";
import { deckSchema } from "../schemas/decks";
import { exemplarSchema } from "../schemas/exemplar";
import { entryDetails } from "./decks";
export const bulkPatchSchema = exemplarSchema.partial().extend({
  quantity: z.number().int().min(1).max(999999).optional(),
  manualTrade: z.number().int().min(0).optional(),
}).strict().refine(patch => Object.keys(patch).length > 0, "Choisissez au moins un champ à modifier.");
export type BulkPatch = z.infer<typeof bulkPatchSchema>;
/** Validate every target before writing; a failing finish must never partially edit a selection. */
export async function applyBulkEdit(selectedCards: Card[], input: BulkPatch) {
  const patch = bulkPatchSchema.parse(input);
  const ids = new Set(selectedCards.map(card => card.id));
  if (!ids.size) throw Error("Sélectionnez au moins une carte.");
  return db.transaction("rw", [db.lots, db.decks, db.cards, db.settings], async () => {
    const p = await prefs();
    if (p.autoTradeDuplicates && patch.manualTrade !== undefined) throw Error("Désactivez les échanges automatiques pour modifier leur quantité manuelle.");
    const lots = (await db.lots.toArray()).filter(lot => ids.has(lot.cardId));
    const decks = p.includeDeckCards ? (await db.decks.toArray()).filter(deck => deck.entries.some(entry => ids.has(entry.card.id))) : [];
    if (!lots.length && !decks.length) throw Error("Les cartes sélectionnées ne sont plus dans la collection.");
    const catalog = new Map(selectedCards.map(card => [card.id, card]));
    for (const card of await db.cards.bulkGet([...ids])) if (card) catalog.set(card.id, card);
    const { quantity, manualTrade, ...details } = patch;
    const now = new Date().toISOString();
    const checkFinish = (card: Card) => {
      if (patch.finish && !card.finishes.includes(patch.finish)) throw Error(`${card.name} (${card.set.toUpperCase()} #${card.collector_number}) : finition ${patch.finish} indisponible. Aucune modification enregistrée.`);
    };
    const changedLots = lots.map(lot => {
      const card = catalog.get(lot.cardId);
      if (!card) throw Error(`Métadonnées manquantes pour ${lot.name}. Actualisez le catalogue.`);
      checkFinish(card);
      const nextQuantity = quantity ?? lot.quantity;
      if (manualTrade !== undefined && manualTrade > nextQuantity) throw Error(`${lot.name} : la quantité d’échange dépasse la quantité possédée.`);
      return lotSchema.parse({ ...lot, ...details, quantity: nextQuantity, trade: manualTrade ?? Math.min(lot.trade, nextQuantity), updatedAt: now });
    });
    let deckEntries = 0;
    const changeDecks = quantity !== undefined || Object.keys(details).length > 0;
    const changedDecks = changeDecks ? decks.map(deck => deckSchema.parse({ ...deck, updatedAt: now, entries: deck.entries.map(entry => {
      if (!ids.has(entry.card.id)) return entry;
      checkFinish(entry.card);
      if (quantity !== undefined && quantity > 999) throw Error("La quantité d’une entrée de deck ne peut pas dépasser 999.");
      if (entry.zone === "commander" && quantity !== undefined && quantity !== 1) throw Error(`${entry.card.name} : un commandant doit rester à un exemplaire.`);
      deckEntries++;
      return { ...entry, quantity: quantity ?? entry.quantity, details: { ...entryDetails(entry), ...details } };
    }) })) : [];
    if (manualTrade !== undefined && !changedLots.length) throw Error("Les cartes affectées aux decks ne sont pas proposées à l’échange.");
    await db.lots.bulkPut(changedLots);
    await db.decks.bulkPut(changedDecks);
    return { lots: changedLots.length, deckEntries };
  });
}
