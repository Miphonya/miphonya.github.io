import { exemplarSchema } from "./exemplar";
import { z } from "zod";
export const formats = {
  commander: { label: "Commander", size: 100, singleton: true, commanders: true },
  standard: { label: "Standard", size: 60, singleton: false, commanders: false },
  pioneer: { label: "Pioneer", size: 60, singleton: false, commanders: false },
  modern: { label: "Modern", size: 60, singleton: false, commanders: false },
  legacy: { label: "Legacy", size: 60, singleton: false, commanders: false },
  vintage: { label: "Vintage", size: 60, singleton: false, commanders: false },
  pauper: { label: "Pauper", size: 60, singleton: false, commanders: false },
  duel: { label: "Duel Commander", size: 100, singleton: true, commanders: true },
  brawl: { label: "Brawl (Standard)", size: 60, singleton: true, commanders: true },
} as const;
export type DeckFormat = keyof typeof formats;
// Decks carry their own Scryfall snapshots, independently of collection lots/catalogue.
export const deckCardSchema = z.object({
  id: z.string().min(1), oracle_id: z.string().optional(), name: z.string().min(1),
  set: z.string(), set_name: z.string(), collector_number: z.string(), rarity: z.string(),
  lang: z.string(), finishes: z.array(z.string()), type_line: z.string().optional(),
  oracle_text: z.string().optional(), color_identity: z.array(z.string()).optional(),
  keywords: z.array(z.string()).optional(), legalities: z.record(z.string(), z.string()).optional(),
  image_uris: z.object({ normal: z.string(), small: z.string() }).optional(),
  card_faces: z.array(z.object({ name: z.string(), type_line: z.string().optional(), oracle_text: z.string().optional(), image_uris: z.object({ normal: z.string(), small: z.string() }).optional() }).passthrough()).optional(),
  prices: z.object({ eur: z.string().nullable(), eur_foil: z.string().nullable(), usd: z.string().nullable().optional(), usd_foil: z.string().nullable().optional(), usd_etched: z.string().nullable().optional() }).passthrough(),
  fetchedAt: z.number().optional(),
}).passthrough();
export type DeckCard = z.infer<typeof deckCardSchema>;
export const deckEntrySchema = z.object({
  id: z.string().uuid(), card: deckCardSchema, quantity: z.number().int().min(1).max(999),
  zone: z.enum(["main", "sideboard", "commander"]),
  details: exemplarSchema.optional(),
});
export type DeckEntry = z.infer<typeof deckEntrySchema>;
export const deckSchema = z.object({
  id: z.string().uuid(), name: z.string().trim().min(1).max(120),
  format: z.enum(["commander", "standard", "pioneer", "modern", "legacy", "vintage", "pauper", "duel", "brawl"]),
  entries: z.array(deckEntrySchema).max(1500),
  bracket: z.number().int().min(1).max(5).default(2),
  bracketChecks: z.object({
    earlyCombos: z.enum(["unknown", "no", "yes"]).default("unknown"),
    extraTurns: z.enum(["unknown", "no", "yes"]).default("unknown"),
    landDenial: z.enum(["unknown", "no", "yes"]).default("unknown"),
  }).default({ earlyCombos: "unknown", extraTurns: "unknown", landDenial: "unknown" }),
  notes: z.string().max(6000).default(""),
  createdAt: z.string().datetime(), updatedAt: z.string().datetime(),
}).superRefine((deck, ctx) => {
  for (const entry of deck.entries) if (entry.details && !entry.card.finishes.includes(entry.details.finish)) ctx.addIssue({ code: "custom", message: `Finition indisponible pour ${entry.card.name}` });
  if (new Set(deck.entries.map(e => e.id)).size !== deck.entries.length) ctx.addIssue({ code: "custom", message: "Identifiants de cartes dupliqués" });
});
export type Deck = z.infer<typeof deckSchema>;
