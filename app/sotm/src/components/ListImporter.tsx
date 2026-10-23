import { usePreferences } from "./CollectionShared";
import { usePricing } from "../hooks/usePricing";
import { languages } from "../schemas/languages";
import { useState } from "react";
import { FilePlus2 } from "lucide-react";
import {
  prepareList,
  commitList,
  type ImportRow,
} from "../services/listImport";
import type { Lot } from "../schemas/models";
import { useUI } from "../stores/ui";
import { Button } from "./ui/button";
import { Modal } from "./ui/dialog";
export function ListImporter() {
  const p = usePreferences();
  const { defaultLanguage } = usePricing();
  const [text, setText] = useState("");
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [condition, setCondition] = useState<Lot["condition"]>("NM");
  const notify = useUI((s) => s.notify);
  const total = rows.reduce((n, r) => n + (r.entry?.quantity ?? 0), 0);
  const invalid = rows.filter((r) => r.error).length;
  async function analyze() {
    setBusy(true);
    setError("");
    setRows([]);
    try {
      setRows(await prepareList(text));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel list-importer">
      <div className="section-heading">
        <div>
          <p className="eyebrow">AJOUT EN LOT</p>
          <h2>
            <FilePlus2 size={22} /> Importer une liste
          </h2>
        </div>
      </div>
      <p className="muted">
        Une carte par ligne : quantité, nom, (extension), numéro. Les noms et
        images du catalogue restent ceux de Scryfall. <code>*F*</code> = foil,{" "}
        <code>*E*</code> = etched ; sans marqueur = non-foil.
      </p>
      <label htmlFor="card-list">Votre liste de cartes</label>
      <textarea
        id="card-list"
        rows={5}
        placeholder={
          "1 Elesh Norn, Mother of Machines (ONE) 10 *F*\n2 Elesh Norn, Mother of Machines (ONE) 10"
        }
        value={text}
        disabled={busy}
        onChange={(e) => {
          setText(e.target.value);
          setRows([]);
          setError("");
        }}
      />
      <div className="actions">
        <Button disabled={busy || !text.trim()} onClick={() => void analyze()}>
          {busy ? "Vérification…" : "Analyser la liste"}
        </Button>
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {rows.length > 0 && (
        <>
          <div className="import-summary">
            <b>
              {rows.length} ligne(s) · {total} exemplaire(s)
            </b>
            <span>
              {invalid
                ? `${invalid} erreur(s) à corriger`
                : "Toutes les impressions sont vérifiées"}
            </span>
          </div>
          <ol className="import-preview">
            {rows.map((row) => (
              <li key={row.id} className={row.error ? "invalid" : ""}>
                <span className="muted">Ligne {row.line}</span>
                <strong>
                  {row.entry
                    ? `${row.entry.quantity} × ${row.card?.name ?? row.entry.name}`
                    : row.input}
                </strong>
                {row.entry && (
                  <span>
                    {row.entry.set.toUpperCase()} #{row.entry.collectorNumber} ·{" "}
                    {row.entry.finish} · {languages[defaultLanguage]}
                  </span>
                )}
                {row.error && <p role="alert">{row.error}</p>}
              </li>
            ))}
          </ol>
          <label className="import-condition">
            État des exemplaires
            <select
              aria-label="État pour la liste"
              value={condition}
              onChange={(e) => setCondition(e.target.value as Lot["condition"])}
            >
              {["MT", "NM", "EX", "GD", "LP", "PL", "PO"].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <p className="muted">
            Nouveaux lots, non signés et non altérés. Langue des exemplaires :{" "}
            {languages[defaultLanguage]} (réglable dans les paramètres),
            {p.autoTradeDuplicates ? "les doublons seront automatiquement proposés à l’échange." : "quantité d’échange initiale à zéro, modifiable ensuite."} Cette liste ajoute des exemplaires ; elle ne
            remplace pas votre collection.
          </p>
          <Button
            disabled={busy || invalid > 0}
            onClick={() => setConfirm(true)}
          >
            Ajouter {total} exemplaire(s)
          </Button>
        </>
      )}
      {confirm && (
        <Modal
          title="Confirmer l’ajout de la liste"
          onClose={() => {
            if (!busy) setConfirm(false);
          }}
        >
          <p>
            {total} exemplaire(s), répartis en {rows.length} lots, seront
            ajoutés à votre collection. Vérifiez que cette liste n’a pas déjà
            été importée.
          </p>
          <Button
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                const n = await commitList(rows, condition);
                notify(`${n} exemplaires ajoutés depuis la liste`);
                setRows([]);
                setText("");
                setConfirm(false);
              } catch (e) {
                setError((e as Error).message);
                setConfirm(false);
              } finally {
                setBusy(false);
              }
            }}
          >
            Confirmer l’ajout
          </Button>
        </Modal>
      )}
    </section>
  );
}
