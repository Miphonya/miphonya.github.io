import { deckSchema } from "./decks";
import { z } from "zod";
import { languageSchema } from "./languages";
export const lotSchema = z
  .object({
    id: z.string().uuid(),
    cardId: z.string().min(1),
    oracleId: z.string().optional(),
    name: z.string(),
    set: z.string(),
    collectorNumber: z.string(),
    language: z.string().min(2),
    finish: z.enum(["nonfoil", "foil", "etched"]),
    condition: z.enum(["MT", "NM", "EX", "GD", "LP", "PL", "PO"]),
    signed: z.boolean(),
    altered: z.boolean(),
    quantity: z.number().int().min(1),
    trade: z.number().int().min(0),
    notes: z.string(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .refine(
    (v) => v.trade <= v.quantity,
    "Le Trade ne peut pas dépasser la quantité possédée",
  );
export type Lot = z.infer<typeof lotSchema>;
export const exchangeRateSchema = z.object({
  value: z.number().positive().max(10),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  source: z.string(),
  fetchedAt: z.string().datetime(),
});
export type ExchangeRate = z.infer<typeof exchangeRateSchema>;
export type Currency = "CHF" | "EUR" | "USD";
export const preferencesSchema = z.object({
  theme: z.enum(["dark", "light"]),
  defaultLanguage: languageSchema.default("fr"),
  onboardingCompleted: z.boolean().default(false),
  addMethod: z.enum(["name", "photo", "batch"]).default("name"),
  scannerPrivacySeen: z.boolean().default(false),
  currency: z.enum(["CHF", "EUR", "USD"]).default("CHF"),
  onlyTracked: z.boolean().default(false),
  includeDeckCards: z.boolean().default(false),
  autoTradeDuplicates: z.boolean().default(true),
  exchangeRate: exchangeRateSchema.nullable().default(null),
  tracked: z.array(z.string()),
  metadataDays: z.number().positive(),
  priceHours: z.number().positive(),
});
export type Preferences = z.infer<typeof preferencesSchema>;
export const defaults: Preferences = {
  theme: "dark",
  defaultLanguage: "fr",
  onboardingCompleted: false,
  addMethod: "name",
  scannerPrivacySeen: false,
  currency: "CHF",
  onlyTracked: false,
  includeDeckCards: false,
  autoTradeDuplicates: true,
  exchangeRate: null,
  tracked: [],
  metadataDays: 7,
  priceHours: 24,
};
export const backupSchema = z
  .object({
    schemaVersion: z.literal(1),
    exportedAt: z.string().datetime(),
    lots: z.array(lotSchema),
    decks: z.array(deckSchema).default([]),
    preferences: preferencesSchema,
  })
  .superRefine((v, ctx) => {
    if (new Set(v.decks.map(d => d.id)).size !== v.decks.length) ctx.addIssue({ code: "custom", message: "Identifiants de decks dupliqués" });
    if (new Set(v.lots.map((l) => l.id)).size !== v.lots.length)
      ctx.addIssue({
        code: "custom",
        message: "Identifiants de lots dupliqués",
      });
  });
export type Backup = z.infer<typeof backupSchema>;
export interface Card {
  id: string;
  oracle_id?: string;
  name: string;
  printed_name?: string;
  set: string;
  set_name: string;
  collector_number: string;
  rarity: string;
  lang: string;
  finishes: string[];
  colors?: string[];
  type_line?: string;
  oracle_text?: string;
  color_identity?: string[];
  keywords?: string[];
  legalities?: Record<string, string>;
  image_uris?: { normal: string; small: string };
  card_faces?: {
    name: string;
    printed_name?: string;
    type_line?: string;
    oracle_text?: string;
    image_uris?: { normal: string; small: string };
  }[];
  prices: {
    eur: string | null;
    eur_foil: string | null;
    usd?: string | null;
    usd_foil?: string | null;
    usd_etched?: string | null;
  };
  fetchedAt?: number;
}
export interface SetInfo {
  id: string;
  code: string;
  name: string;
  set_type: string;
  released_at: string;
  card_count: number;
  icon_svg_uri: string;
  fetchedAt?: number;
}
export const imageUrl = (c: Card, face = 0) =>
  c.image_uris?.normal ?? c.card_faces?.[face]?.image_uris?.normal;
export function progress(lots: Lot[], set: string, total: number) {
  const owned = new Set(lots.filter((l) => l.set === set).map((l) => l.cardId))
    .size;
  return { owned, percent: total ? Math.min(100, (owned / total) * 100) : 0 };
}
export function compatible(a: Lot, b: Lot) {
  return (
    [
      "cardId",
      "language",
      "finish",
      "condition",
      "signed",
      "altered",
      "notes",
    ] as const
  ).every((k) => a[k] === b[k]);
}

export const cardTypeLine = (card: Card) => card.type_line ?? card.card_faces?.map((face) => face.type_line ?? "").join(" // ") ?? "";
