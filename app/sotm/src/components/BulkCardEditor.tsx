import { useState } from "react";
import type { Card } from "../schemas/models";
import { languages } from "../schemas/languages";
import { applyBulkEdit, type BulkPatch } from "../services/bulkEdit";
import { useCollectionView, usePreferences } from "./CollectionShared";
import { finishLabel } from "./ExemplarFields";
import { Modal } from "./ui/dialog";
import { Button } from "./ui/button";
import { useUI } from "../stores/ui";
export function BulkCardEditor({ cards, onClose, onSaved }: { cards: Card[]; onClose: () => void; onSaved: () => void }) {
  const p = usePreferences(), all = useCollectionView().lots;
  const ids = new Set(cards.map(card => card.id)), targets = all.filter(lot => ids.has(lot.cardId));
  const physical = targets.filter(lot => !lot.deckId).length, fromDecks = targets.filter(lot => lot.deckId).length;
  const [enabled, setEnabled] = useState<Set<keyof BulkPatch>>(new Set());
  const [values, setValues] = useState({ language: p.defaultLanguage as string, finish: "nonfoil", condition: "NM", signed: false, altered: false, notes: "", quantity: 1, manualTrade: 0 });
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const notify = useUI(s => s.notify);
  const toggle = (key: keyof BulkPatch) => setEnabled(old => { const next = new Set(old); if (next.has(key)) next.delete(key); else next.add(key); return next; });
  const rows: { key: keyof BulkPatch; label: string; control: React.ReactNode }[] = [
    { key: "language", label: "Langue", control: <select aria-label="Nouvelle langue" disabled={!enabled.has("language")} value={values.language} onChange={e => setValues({ ...values, language: e.target.value })}>{Object.entries(languages).map(([code, name]) => <option key={code} value={code}>{name}</option>)}</select> },
    { key: "finish", label: "Finition", control: <select aria-label="Nouvelle finition" disabled={!enabled.has("finish")} value={values.finish} onChange={e => setValues({ ...values, finish: e.target.value })}>{["nonfoil", "foil", "etched"].map(finish => <option key={finish} value={finish}>{finishLabel(finish)}</option>)}</select> },
    { key: "condition", label: "État", control: <select aria-label="Nouvel état" disabled={!enabled.has("condition")} value={values.condition} onChange={e => setValues({ ...values, condition: e.target.value })}>{["MT", "NM", "EX", "GD", "LP", "PL", "PO"].map(condition => <option key={condition}>{condition}</option>)}</select> },
    { key: "quantity", label: "Quantité par lot", control: <input aria-label="Nouvelle quantité par lot" type="number" min={1} max={999999} required disabled={!enabled.has("quantity")} value={values.quantity} onChange={e => setValues({ ...values, quantity: Number(e.target.value) })} /> },
    { key: "signed", label: "Signature", control: <select aria-label="Nouvelle signature" disabled={!enabled.has("signed")} value={String(values.signed)} onChange={e => setValues({ ...values, signed: e.target.value === "true" })}><option value="false">Non signée</option><option value="true">Signée</option></select> },
    { key: "altered", label: "Altération", control: <select aria-label="Nouvelle altération" disabled={!enabled.has("altered")} value={String(values.altered)} onChange={e => setValues({ ...values, altered: e.target.value === "true" })}><option value="false">Non altérée</option><option value="true">Altérée</option></select> },
    { key: "notes", label: "Remplacer les notes", control: <textarea aria-label="Nouvelles notes" maxLength={4000} disabled={!enabled.has("notes")} value={values.notes} onChange={e => setValues({ ...values, notes: e.target.value })} /> },
  ];
  if (!p.autoTradeDuplicates && physical) rows.push({ key: "manualTrade", label: "Échange par lot de collection", control: <input aria-label="Nouvelle quantité à l’échange" type="number" min={0} required disabled={!enabled.has("manualTrade")} value={values.manualTrade} onChange={e => setValues({ ...values, manualTrade: Number(e.target.value) })} /> });
  return <Modal title="Modifier les cartes sélectionnées" onClose={() => { if (!busy) onClose(); }}>
    <p>{cards.length} impressions · {physical} lot(s) de collection{fromDecks ? ` · ${fromDecks} entrée(s) de decks` : ""}</p>
    <p className="muted">Cochez uniquement les champs à changer. Les autres caractéristiques restent conservées. La quantité s’applique à chaque lot ou entrée, pas au total de la sélection.</p>
    {fromDecks > 0 && <p className="notice">Cette sélection inclut des cartes comptées depuis les decks : les changements s’appliqueront aussi à leurs entrées de deck.</p>}
    <details className="bulk-preview"><summary>Voir les cartes concernées</summary><ul>{cards.map(card => <li key={card.id}>{card.name} · {card.set.toUpperCase()} #{card.collector_number}</li>)}</ul></details>
    <form onSubmit={async e => {
      e.preventDefault(); setBusy(true); setError("");
      const patch = Object.fromEntries([...enabled].map(key => [key, values[key]])) as BulkPatch;
      try { const result = await applyBulkEdit(cards, patch); notify(`${result.lots} lot(s) et ${result.deckEntries} entrée(s) de decks modifiés`); onSaved(); } catch (err) { setError((err as Error).message); } finally { setBusy(false); }
    }}><div className="bulk-edit-fields">{rows.map(row => <div className="bulk-edit-row" key={row.key}><label><input type="checkbox" aria-label={"Modifier : " + row.label} checked={enabled.has(row.key)} disabled={busy} onChange={() => toggle(row.key)} />{row.label}</label>{row.control}</div>)}</div>
      {error && <p role="alert" className="error">{error}</p>}
      <div className="actions"><Button variant="outline" type="button" disabled={busy} onClick={onClose}>Annuler</Button><Button type="submit" disabled={busy || !enabled.size || !targets.length}>{busy ? "Enregistrement…" : "Appliquer à la sélection"}</Button></div>
    </form>
  </Modal>;
}
