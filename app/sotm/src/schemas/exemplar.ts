import { z } from "zod";
export const exemplarSchema = z.object({
  language: z.string().min(2).max(12),
  finish: z.enum(["nonfoil", "foil", "etched"]),
  condition: z.enum(["MT", "NM", "EX", "GD", "LP", "PL", "PO"]),
  signed: z.boolean(), altered: z.boolean(), notes: z.string().max(4000),
});
export type Exemplar = z.infer<typeof exemplarSchema>;
