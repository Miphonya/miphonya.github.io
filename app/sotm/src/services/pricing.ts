import type { Card, Currency, ExchangeRate, Lot } from "../schemas/models";
export interface PriceQuote {
  amount: number | null;
  currency: Currency;
  source: string;
  updatedAt: number | null;
}
export interface PriceProvider {
  quote(
    card: Card,
    finish: Lot["finish"],
    currency?: Currency,
    rate?: ExchangeRate | null,
  ): PriceQuote;
}
export const scryfallPriceProvider: PriceProvider = {
  quote(card, finish, currency = "EUR", rate = null) {
    const raw =
      currency === "USD"
        ? finish === "etched"
          ? card.prices.usd_etched
          : finish === "foil"
            ? card.prices.usd_foil
            : card.prices.usd
        : finish === "etched"
          ? null
          : finish === "foil"
            ? card.prices.eur_foil
            : card.prices.eur;
    const n = raw == null || raw.trim() === "" ? NaN : Number(raw);
    let amount = Number.isFinite(n) && n >= 0 ? n : null;
    if (currency === "CHF")
      amount =
        amount !== null && rate && Number.isFinite(rate.value) && rate.value > 0
          ? amount * rate.value
          : null;
    return {
      amount,
      currency,
      source:
        currency === "CHF"
          ? `Scryfall EUR · ${rate?.source ?? "taux indisponible"} (${rate?.date ?? "—"})`
          : "Scryfall",
      updatedAt: card.fetchedAt ?? null,
    };
  },
};
export const money = (n: number | null, currency: Currency = "EUR") =>
  n === null
    ? "N/A"
    : new Intl.NumberFormat("fr-CH", {
        style: "currency",
        currency,
        currencyDisplay: currency === "USD" ? "code" : "symbol",
      }).format(n);
