import { useLiveQuery } from "dexie-react-hooks";
import { Database, Layers3, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { tradeLots } from "../services/trade";
import { projectCollection } from "../services/collectionView";
import { db } from "../db";
import { usePricing, useVaultPreferences } from "../hooks/usePricing";

export function usePreferences() {
  return useVaultPreferences();
}

export function usePhysicalLots() {
  return useLiveQuery(() => db.lots.toArray(), []) ?? [];
}
export function useTradeLots() {
  const p = usePreferences();
  return useLiveQuery(async () => {
    const [lots, cards] = await Promise.all([db.lots.toArray(), db.cards.toArray()]);
    return tradeLots(lots, p.autoTradeDuplicates, cards);
  }, [p.autoTradeDuplicates]) ?? [];
}
export function useCollectionView() {
  const p = usePreferences();
  return useLiveQuery(async () => {
    const [lots, cards, decks] = await Promise.all([
      db.lots.toArray(), db.cards.toArray(), p.includeDeckCards ? db.decks.toArray() : Promise.resolve([]),
    ]);
    return projectCollection(lots, cards, decks, p.includeDeckCards);
  }, [p.includeDeckCards]) ?? { lots: [], cards: [] };
}
export function useLots() {
  return useCollectionView().lots;
}

export function useDebounced(value: string) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), 400);
    return () => clearTimeout(id);
  }, [value]);
  return debounced;
}

export function Empty({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="empty">
      <Layers3 size={36} />
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}

export function QueryState({
  loading,
  error,
}: {
  loading: boolean;
  error: Error | null;
}) {
  return (
    <>
      {loading && (
        <div className="skeletons" aria-label="Chargement">
          {[1, 2, 3].map((i) => (
            <div key={i} />
          ))}
        </div>
      )}
      {error && (
        <p role="alert" className="error">
          {error.message}
        </p>
      )}
    </>
  );
}

export function PageHead({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="page-head">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>
          {title}
          <span>.</span>
        </h1>
        <p className="muted">{description}</p>
      </div>
      {children}
    </header>
  );
}

export function Stats() {
  const pricing = usePricing();
  const { lots, cards } = useCollectionView();
  const p = usePreferences();
  let value = 0,
    missing = 0;
  for (const l of lots) {
    const c = cards.find((c) => c.id === l.cardId);
    const amount = c ? pricing.quote(c, l.finish).amount : null;
    if (amount === null) missing += l.quantity;
    else value += amount * l.quantity;
  }
  return (
    <div className="stats">
      {[
        {
          label: p.includeDeckCards ? "EXEMPLAIRES · DECKS INCLUS" : "EXEMPLAIRES PHYSIQUES",
          value: lots.reduce((n, l) => n + l.quantity, 0),
          icon: Layers3,
          note: `${new Set(lots.map((l) => l.cardId)).size} impressions distinctes`,
        },
        {
          label: "CARTES DISTINCTES",
          value: new Set(lots.map((l) => l.oracleId ?? l.cardId)).size,
          icon: Sparkles,
          note: "Identités de jeu · Oracle",
        },
        {
          label: "VALEUR INDICATIVE",
          value: pricing.format(
            lots.length > 0 &&
              missing === lots.reduce((n, l) => n + l.quantity, 0)
              ? null
              : value,
          ),
          icon: ShieldCheck,
          note: missing
            ? `${missing} exemplaire(s) sans prix`
            : `Prix indicatifs · ${pricing.currency}`,
        },
        {
          label: "EXTENSIONS SUIVIES",
          value: p.tracked.length,
          icon: Database,
          note: "Votre archive personnelle",
        },
      ].map(({ label, value, icon: Icon, note }) => (
        <div className="stat panel" key={label}>
          <div>
            <span>{label}</span>
            <Icon size={17} />
          </div>
          <strong>{value}</strong>
          <small>{note}</small>
        </div>
      ))}
    </div>
  );
}
