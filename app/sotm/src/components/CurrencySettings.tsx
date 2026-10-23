import { useVaultPreferences } from "../hooks/usePricing";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { updatePrefs } from "../db";
import { type Currency } from "../schemas/models";
import { refreshExchangeRate } from "../services/exchange";
import { useState } from "react";
import { Button } from "./ui/button";
export function CurrencySelect() {
  const p = useVaultPreferences();
  return (
    <select
      aria-label="Devise des prix"
      value={p.currency}
      onChange={(e) =>
        void updatePrefs({ currency: e.target.value as Currency })
      }
    >
      <option value="CHF">CHF · Franc suisse</option>
      <option value="EUR">EUR · Euro</option>
      <option value="USD">USD · Dollar US</option>
    </select>
  );
}
export function ExchangeSync() {
  const p = useVaultPreferences();
  useQuery({
    queryKey: ["exchange-rate"],
    queryFn: () => refreshExchangeRate(),
    enabled: p.currency === "CHF",
    staleTime: 86400000,
    retry: false,
  });
  return null;
}
export function CurrencySettings() {
  const client = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const p = useVaultPreferences();
  const q = useQuery({
    queryKey: ["exchange-rate"],
    queryFn: () => refreshExchangeRate(),
    enabled: p.currency === "CHF",
    staleTime: 86400000,
    retry: false,
  });
  const rate = p.exchangeRate;
  return (
    <section className="panel setting">
      <h2>Devise des prix</h2>
      <p>
        Votre choix est mémorisé sur cet appareil et inclus dans les
        sauvegardes.
      </p>
      <CurrencySelect />
      <p>
        EUR et USD : prix Scryfall pour chaque finition. CHF : conversion
        indicative du prix EUR.
      </p>
      {rate ? (
        <p>
          1 EUR = {rate.value.toFixed(6)} CHF · taux du {rate.date}
          <br />
          {rate.source}
          {Date.now() - Date.parse(rate.date) > 3 * 86400000 && (
            <strong> · Taux ancien, conservé hors ligne</strong>
          )}
        </p>
      ) : (
        <p>
          Pas encore de taux local : les prix CHF affichent N/A jusqu’à sa
          récupération.
        </p>
      )}
      <Button
        variant="outline"
        disabled={q.isFetching || busy}
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            const fresh = await refreshExchangeRate(true);
            client.setQueryData(["exchange-rate"], fresh);
          } catch {
            setError("Actualisation impossible ; dernier taux conservé.");
          } finally {
            setBusy(false);
          }
        }}
      >
        {q.isFetching ? "Chargement du taux…" : "Actualiser le taux CHF"}
      </Button>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {q.error && (
        <p className="error" role="alert">
          Taux CHF indisponible. Vérifiez Internet ; le dernier taux enregistré
          reste utilisable.
        </p>
      )}
    </section>
  );
}
