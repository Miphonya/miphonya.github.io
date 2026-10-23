import { createContext, useContext, type ReactNode } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { prefs } from "../db";
import { defaults, type Card, type Lot } from "../schemas/models";
import { money, scryfallPriceProvider } from "../services/pricing";
const PricingContext = createContext(defaults);
export function PricingProvider({ children }: { children: ReactNode }) {
  const p = useLiveQuery(prefs, []) ?? defaults;
  return (
    <PricingContext.Provider value={p}>{children}</PricingContext.Provider>
  );
}
export function useVaultPreferences() {
  return useContext(PricingContext);
}
export function usePricing() {
  const p = useVaultPreferences();
  return {
    defaultLanguage: p.defaultLanguage,
    currency: p.currency,
    rate: p.exchangeRate,
    quote: (c: Card, f: Lot["finish"] = "nonfoil") =>
      scryfallPriceProvider.quote(c, f, p.currency, p.exchangeRate),
    format: (n: number | null) => money(n, p.currency),
  };
}
