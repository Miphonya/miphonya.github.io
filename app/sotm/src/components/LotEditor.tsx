import { useCollectionView, usePhysicalLots, usePreferences } from "./CollectionShared";
import { tradeLots } from "../services/trade";
import { usePricing } from "../hooks/usePricing";
import { languages } from "../schemas/languages";
import { useState } from "react";
import { saveLot } from "../db";
import { lotSchema, type Card, type Lot } from "../schemas/models";
import { useUI } from "../stores/ui";
import { Button } from "./ui/button";
import { Modal } from "./ui/dialog";
export function LotEditor({
  card,
  lot,
  onClose,
}: {
  card: Card;
  lot?: Lot;
  onClose: () => void;
}) {
  const { defaultLanguage } = usePricing();
  const p = usePreferences();
  const physical = usePhysicalLots();
  const catalog = useCollectionView().cards;
  const now = new Date().toISOString();
  const [value, setValue] = useState<Lot>(
    lot ?? {
      id: crypto.randomUUID(),
      cardId: card.id,
      oracleId: card.oracle_id,
      name: card.name,
      set: card.set,
      collectorNumber: card.collector_number,
      language: defaultLanguage,
      finish: (card.finishes[0] ?? "nonfoil") as Lot["finish"],
      condition: "NM",
      signed: false,
      altered: false,
      quantity: 1,
      trade: 0,
      notes: "",
      createdAt: now,
      updatedAt: now,
    },
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const notify = useUI((s) => s.notify);
  const change = <K extends keyof Lot>(k: K, v: Lot[K]) =>
    setValue({ ...value, [k]: v });
  const automaticTrade = tradeLots([...physical.filter(l => l.id !== value.id), value], true, [...catalog.filter(c => c.id !== card.id), card]).find(l => l.id === value.id)?.trade ?? 0;
  async function submit(keep: boolean) {
    setBusy(true);
    try {
      if (!card.finishes.includes(value.finish))
        throw Error("Finition indisponible pour cette impression");
      await saveLot(
        lotSchema.parse({ ...value, updatedAt: new Date().toISOString() }),
      );
      notify(lot ? "Lot modifié" : "Carte ajoutée à votre collection");
      if (keep && !lot) {
        setValue({
          ...value,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
        });
        setError("");
      } else onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Enregistrement impossible");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={lot ? "Modifier le lot" : "Ajouter à la collection"}
      onClose={onClose}
    >
      <p className="muted">
        {card.name} · {card.set.toUpperCase()} #{card.collector_number}
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit(false);
        }}
      >
        <div className="form-grid">
          <label>
            Quantité
            <input
              type="number"
              required
              min="1"
              value={value.quantity}
              onChange={(e) => { const quantity = Number(e.target.value); setValue({ ...value, quantity, trade: Math.min(value.trade, Math.max(0, quantity)) }); }}
            />
          </label>
          <label>
            {p.autoTradeDuplicates ? "À l’échange · automatique" : "Quantité à l’échange"}
            <input
              type="number"
              required
              min="0"
              max={value.quantity}
              disabled={p.autoTradeDuplicates}
              value={p.autoTradeDuplicates ? automaticTrade : value.trade}
              onChange={(e) => change("trade", Number(e.target.value))}
            />
          </label>
          <label>
            Langue
            <select
              aria-label="Langue de l’exemplaire"
              value={value.language}
              onChange={(e) => change("language", e.target.value)}
            >
              {[
                ...new Set([
                  value.language,
                  card.lang,
                  ...Object.keys(languages),
                ]),
              ].map((l) => (
                <option key={l} value={l}>
                  {languages[l as keyof typeof languages] ?? l}
                </option>
              ))}
            </select>
          </label>
          <label>
            État
            <select
              value={value.condition}
              onChange={(e) =>
                change("condition", e.target.value as Lot["condition"])
              }
            >
              {["MT", "NM", "EX", "GD", "LP", "PL", "PO"].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            Finition
            <select
              value={value.finish}
              onChange={(e) =>
                change("finish", e.target.value as Lot["finish"])
              }
            >
              {card.finishes
                .filter((f) => ["nonfoil", "foil", "etched"].includes(f))
                .map((f) => (
                  <option key={f}>{f}</option>
                ))}
            </select>
          </label>
        </div>
        {p.autoTradeDuplicates && <p className="muted">Un exemplaire est conservé par extension et numéro, en priorité foil ou etched. Les exemplaires normaux en surplus sont proposés à l’échange. Ce calcul se désactive dans les paramètres.</p>}
        <div className="checks">
          <label>
            <input
              type="checkbox"
              checked={value.signed}
              onChange={(e) => change("signed", e.target.checked)}
            />{" "}
            Signée
          </label>
          <label>
            <input
              type="checkbox"
              checked={value.altered}
              onChange={(e) => change("altered", e.target.checked)}
            />{" "}
            Altérée
          </label>
        </div>
        <label>
          Notes
          <textarea
            value={value.notes}
            onChange={(e) => change("notes", e.target.value)}
            maxLength={4000}
          />
        </label>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <div className="actions">
          <Button disabled={busy} type="submit">
            Enregistrer
          </Button>
          {!lot && (
            <Button
              disabled={busy}
              variant="outline"
              type="button"
              onClick={() => void submit(true)}
            >
              Ajouter et continuer
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
}
