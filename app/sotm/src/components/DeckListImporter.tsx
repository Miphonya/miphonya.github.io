import { useState } from "react";
import { usePricing } from "../hooks/usePricing";
import { prepareList, type ImportRow } from "../services/listImport";
import { commitDeckList } from "../services/decks";
import type { Exemplar } from "../schemas/exemplar";
import { Modal } from "./ui/dialog";
import { Button } from "./ui/button";
import { ExemplarFields, finishLabel } from "./ExemplarFields";
export function DeckListImporter({ deckId, hasSideboard, onClose }: { deckId: string; hasSideboard: boolean; onClose: () => void }) {
  const pricing = usePricing();
  const [text, setText] = useState(""), [rows, setRows] = useState<ImportRow[]>([]), [zone, setZone] = useState<"main" | "sideboard">("main");
  const [details, setDetails] = useState<Exemplar>({ language: pricing.defaultLanguage, finish: "nonfoil", condition: "NM", signed: false, altered: false, notes: "" });
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  return <Modal title="Importer une liste dans le deck" onClose={onClose}>
    <p className="muted">Même format que l’ajout normal : quantité, nom, (extension), numéro. <code>*F*</code> = foil, <code>*E*</code> = etched. Le commandant se choisit séparément.</p>
    <label>Liste de cartes<textarea aria-label="Liste de cartes du deck" rows={6} placeholder="1 Elesh Norn, Mother of Machines (ONE) 10 *F*" value={text} disabled={busy} onChange={e => { setText(e.target.value); setRows([]); setError(""); }} /></label>
    <div className="deck-form">{hasSideboard && <label>Destination<select aria-label="Destination de l’import" value={zone} disabled={busy} onChange={e => setZone(e.target.value as typeof zone)}><option value="main">Deck principal</option><option value="sideboard">Réserve</option></select></label>}
      <h3>Caractéristiques communes</h3><ExemplarFields value={details} onChange={setDetails} hideFinish />
      <p className="muted">La finition vient de chaque ligne. Langue, état, signature, altération et notes s’appliquent à cet import ; vous pourrez les modifier ensuite.</p>
    </div>
    {error && <p className="error" role="alert">{error}</p>}
    <Button variant="outline" disabled={busy || !text.trim()} onClick={async () => { setBusy(true); setError(""); setRows([]); try { setRows(await prepareList(text, { cacheCards: false })); } catch (err) { setError((err as Error).message); } finally { setBusy(false); } }}>Analyser la liste du deck</Button>
    {rows.length > 0 && <><div className="deck-import-preview">{rows.map(row => <div key={row.id}><strong>Ligne {row.line} · {row.entry?.quantity ?? "?"} × {row.card?.name ?? row.entry?.name ?? row.input}</strong><small>{row.error ?? `${row.entry?.set.toUpperCase()} #${row.entry?.collectorNumber} · ${finishLabel(row.entry?.finish ?? "nonfoil")}`}</small></div>)}</div><p>{rows.reduce((n, row) => n + (row.entry?.quantity ?? 0), 0)} exemplaire(s) · {rows.filter(row => row.error).length} erreur(s)</p>
    <Button disabled={busy || rows.some(row => row.error || !row.card)} onClick={async () => { setBusy(true); setError(""); try { await commitDeckList(deckId, rows, zone, details); onClose(); } catch (err) { setError((err as Error).message); } finally { setBusy(false); } }}>Confirmer l’ajout au deck</Button></>}
  </Modal>;
}
