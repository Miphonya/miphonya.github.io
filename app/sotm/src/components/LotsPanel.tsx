import { Link } from "react-router-dom";
import { printingKey } from "../services/trade";
import { useLiveQuery } from "dexie-react-hooks";
import { Search } from "lucide-react";
import { useState } from "react";
import { CardTile } from "../components/CardTile";
import { Empty, useLots, usePhysicalLots, useTradeLots, usePreferences } from "../components/CollectionShared";
import { LotEditor } from "../components/LotEditor";
import { Button } from "../components/ui/button";
import { Modal } from "../components/ui/dialog";
import { db, saveLot } from "../db";
import { compatible, type Card, type Lot } from "../schemas/models";
import { usePricing } from "../hooks/usePricing";
import { useUI } from "../stores/ui";

export default function LotsPanel({
  tradeOnly = false,
  cardId,
  onDeleted,
}: {
  tradeOnly?: boolean;
  cardId?: string;
  onDeleted?: () => void;
}) {
  const pricing = usePricing();
  const physical = usePhysicalLots();
  const all = useTradeLots();
  const p = usePreferences();
  const deckLots = useLots().filter(l => !tradeOnly && l.deckId && (!cardId || l.cardId === cardId));
  const cards = useLiveQuery(() => db.cards.toArray(), []) ?? [];
  const cardById = new Map(cards.map(card => [card.id, card]));
  const printingGroups = new Map<string, Lot[]>();
  for (const lot of all) {
    const key = printingKey(lot, cardById.get(lot.cardId));
    const group = printingGroups.get(key);
    if (group) group.push(lot); else printingGroups.set(key, [lot]);
  }
  const notify = useUI((s) => s.notify);
  const [search, setSearch] = useState("");
  const [condition, setCondition] = useState("all");
  const [set, setSet] = useState("all");
  const [edit, setEdit] = useState<{ card: Card; lot: Lot } | null>(null);
  const [deleting, setDeleting] = useState(false), [deleteError, setDeleteError] = useState("");
  const [remove, setRemove] = useState<Lot | null>(null);
  const [merge, setMerge] = useState<[Lot, Lot] | null>(null);
  const lots = all.filter(
    (l) =>
      (!cardId || l.cardId === cardId) &&
      (!tradeOnly || l.trade > 0) &&
      l.name.toLowerCase().includes(search.toLowerCase()) &&
      (condition === "all" || l.condition === condition) &&
      (set === "all" || l.set === set),
  );
  let total = 0,
    unpriced = 0;
  for (const l of lots) {
    const c = cardById.get(l.cardId);
    const price = c ? pricing.quote(c, l.finish).amount : null;
    if (price === null) unpriced++;
    else total += price * (tradeOnly ? l.trade : l.quantity);
  }
  async function updateTrade(l: Lot, n: number) {
    try {
      await saveLot({ ...l, trade: n, updatedAt: new Date().toISOString() });
    } catch {
      notify("La quantité Trade doit être comprise entre 0 et " + l.quantity);
    }
  }
  return (
    <section className="lots-section">
      <div className="section-heading">
        <h2>{tradeOnly ? "Disponibles à l’échange" : "Vos lots physiques"}</h2>
        <span className="muted">
          {pricing.format(
            lots.length > 0 && unpriced === lots.length ? null : total,
          )}
          {unpriced > 0 ? ` · ${unpriced} lot(s) sans prix` : ""}
        </span>
      </div>
      <div className="toolbar wrap">
        <label className="search">
          <Search size={16} />
          <input
            placeholder="Rechercher un lot…"
            aria-label="Rechercher un lot"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <select
          aria-label="État"
          value={condition}
          onChange={(e) => setCondition(e.target.value)}
        >
          <option value="all">Tous états</option>
          {["MT", "NM", "EX", "GD", "LP", "PL", "PO"].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        {new Set(all.map((l) => l.set)).size > 1 && (
          <select
            aria-label="Extension"
            value={set}
            onChange={(e) => setSet(e.target.value)}
          >
            <option value="all">Toutes extensions</option>
            {[...new Set(all.map((l) => l.set))].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        )}
      </div>
      <div className={tradeOnly ? "trade-grid" : "lot-list"}>
        {lots.map((l) => {
          const group = printingGroups.get(printingKey(l, cardById.get(l.cardId))) ?? [l];
          const totalForPrinting = group.reduce((sum, other) => sum + other.quantity, 0);
          const c = cardById.get(l.cardId);
          const candidate = all.find(
            (other) => other.id !== l.id && compatible(l, other),
          );
          return (
            <article className="lot panel" key={l.id}>
              {tradeOnly && c && (
                <CardTile
                  card={c}
                  quantity={l.quantity}
                  finish={l.finish}
                  imageAction={"Modifier " + l.name}
                  onAdd={() => setEdit({ card: c, lot: physical.find(x => x.id === l.id) ?? l })}
                />
              )}
              <div>
                <h3>{l.name}</h3>
                <p>
                  {l.set.toUpperCase()} #{l.collectorNumber} · {l.language} ·{" "}
                  {l.finish} · {l.condition} {l.signed ? "· Signée" : ""}{" "}
                  {l.altered ? "· Altérée" : ""}
                </p>
                {tradeOnly && <details className="trade-explanation"><summary>{p.autoTradeDuplicates ? `${totalForPrinting} exemplaires au total pour ${(c?.set ?? l.set).toUpperCase()} #${c?.collector_number ?? l.collectorNumber}` : "Proposé manuellement à l’échange"}</summary><p>{p.autoTradeDuplicates ? "Un exemplaire est réservé sur l’ensemble des lots ci-dessous, en priorité foil ou etched. Le nombre affiché sur la carte correspond seulement à ce lot." : "Le mode automatique est désactivé : la quantité d’échange provient d’un choix manuel enregistré. Utilisez Retirer du Trade pour l’enlever."}</p><ul>{group.map(other => <li key={other.id}>{other.quantity} × {other.name} · {other.language} · {other.finish} · {other.condition}{other.id === l.id ? " · ce lot" : ""}</li>)}</ul><Link to="/cards">Vérifier dans la collection →</Link></details>}
                {l.notes && <p>{l.notes}</p>}
                <small>
                  {l.quantity} exemplaire(s) ·{" "}
                  {pricing.format(c ? pricing.quote(c, l.finish).amount : null)}{" "}
                  / exemplaire
                </small>
              </div>
              <label className="trade-quantity">
                Échange
                <input
                  type="number"
                  min="0"
                  max={l.quantity}
                  disabled={p.autoTradeDuplicates}
                  title={p.autoTradeDuplicates ? "Quantité calculée automatiquement" : "Quantité disponible à l’échange"}
                  value={l.trade}
                  onChange={(e) => void updateTrade(l, Number(e.target.value))}
                />
              </label>
              <div className="actions">
                {c && (
                  <Button
                    variant="outline"
                    onClick={() => setEdit({ card: c, lot: physical.find(x => x.id === l.id) ?? l })}
                  >
                    Modifier
                  </Button>
                )}
                {tradeOnly && p.autoTradeDuplicates ? <span className="muted">Doublon · automatique</span> : tradeOnly ? (
                  <Button
                    variant="ghost"
                    onClick={() => void updateTrade(l, 0)}
                  >
                    Retirer du Trade
                  </Button>
                ) : (
                  <>
                    <Button variant="ghost" onClick={() => setRemove(l)}>
                      Supprimer
                    </Button>
                    {candidate && (
                      <Button
                        variant="ghost"
                        onClick={() => setMerge([l, candidate])}
                      >
                        Fusionner les lots identiques
                      </Button>
                    )}
                  </>
                )}
              </div>
            </article>
          );
        })}
      </div>
      {!tradeOnly && deckLots.length > 0 && <div className="deck-origin-lots"><h3>Exemplaires comptés depuis les decks</h3><p className="muted">Leur gestion individuelle et leur retrait se font dans le deck d’origine.</p>{deckLots.filter(l => l.name.toLowerCase().includes(search.toLowerCase()) && (set === "all" || l.set === set)).map(l => <Link key={l.id} to={"/decks/" + l.deckId}><span>{l.quantity} × {l.name}<small>{l.deckName}</small></span><span>Ouvrir le deck →</span></Link>)}</div>}
      {!lots.length && !deckLots.length && (
        <Empty
          title={
            tradeOnly
              ? "Les échanges commencent ici"
              : "Aucun lot pour le moment"
          }
        >
          {tradeOnly && p.autoTradeDuplicates ? "Ajoutez des doublons à la collection : les exemplaires en surplus apparaîtront ici automatiquement. Les cartes des decks restent protégées." : "Attribuez une quantité à l’échange depuis l’ajout ou la modification de carte."}
        </Empty>
      )}
      {edit && <LotEditor {...edit} onClose={() => setEdit(null)} />}
      {remove && (
        <Modal title="Supprimer ce lot ?" onClose={() => { if (!deleting) { setRemove(null); setDeleteError(""); } }}>
          <p>
            Les {remove.quantity} exemplaires de {remove.name} seront
            définitivement retirés.
          </p>
          {deleteError && <p role="alert" className="error">{deleteError}</p>}
          <Button disabled={deleting}
            onClick={async () => {
              setDeleting(true); setDeleteError("");
              try { await db.lots.delete(remove.id); setRemove(null); onDeleted?.(); notify("Lot supprimé"); }
              catch { setDeleteError("Suppression impossible. Réessayez."); }
              finally { setDeleting(false); }
            }}
          >
            Confirmer la suppression
          </Button>
        </Modal>
      )}
      {merge && (
        <Modal
          title="Fusionner les lots compatibles ?"
          onClose={() => setMerge(null)}
        >
          <p>
            Les quantités possédées et Trade seront additionnées. Langue,
            finition, état, signature, altération et notes sont identiques.
          </p>
          <Button
            onClick={async () => {
              await db.transaction("rw", db.lots, async () => {
                const a = await db.lots.get(merge[0].id),
                  b = await db.lots.get(merge[1].id);
                if (!a || !b || !compatible(a, b))
                  throw Error("Lots incompatibles");
                await saveLot({
                  ...a,
                  quantity: a.quantity + b.quantity,
                  trade: a.trade + b.trade,
                  updatedAt: new Date().toISOString(),
                });
                await db.lots.delete(b.id);
              });
              setMerge(null);
              notify("Lots fusionnés");
            }}
          >
            Confirmer la fusion
          </Button>
        </Modal>
      )}
    </section>
  );
}
