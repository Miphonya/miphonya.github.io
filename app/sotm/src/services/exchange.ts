import { z } from "zod";
import { prefs, updatePrefs } from "../db";
import { exchangeRateSchema } from "../schemas/models";
export const RATE_URL =
  "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/eur.json";
const responseSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  eur: z.object({ chf: z.number().positive().max(10) }),
});
export async function refreshExchangeRate(force = false) {
  const old = (await prefs()).exchangeRate;
  if (!force && old && Date.now() - Date.parse(old.fetchedAt) < 86400000)
    return old;
  const response = await fetch(RATE_URL, {
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok)
    throw Error("Taux CHF indisponible. Le dernier taux local reste conservé.");
  const data = responseSchema.parse(await response.json());
  const rate = exchangeRateSchema.parse({
    value: data.eur.chf,
    date: data.date,
    source: "Currency API · Fawaz Ahmed / jsDelivr",
    fetchedAt: new Date().toISOString(),
  });
  await updatePrefs({ exchangeRate: rate });
  return rate;
}
