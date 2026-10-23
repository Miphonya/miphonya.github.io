import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { Crown, Layers3, Plus, Search, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { db } from "../db";
import { PageHead, Empty } from "../components/CollectionShared";
import { Button } from "../components/ui/button";
import { Modal } from "../components/ui/dialog";
import { formats, type Deck, type DeckFormat } from "../schemas/decks";
import { imageUrl } from "../schemas/models";
import { createDeck, deckCount, normalizeDeckSearch, bracketLabels } from "../services/decks";
export default function Decks() {
  const decks = useLiveQuery(() => db.decks.orderBy("updatedAt").reverse().toArray(), []) ?? [];
  const [query, setQuery] = useState(""), [create, setCreate] = useState(false), [name, setName] = useState(""), [format, setFormat] = useState<DeckFormat>("commander"), [error, setError] = useState(""), [busy, setBusy] = useState(false);
  const [remove, setRemove] = useState<Deck | null>(null);
  const navigate = useNavigate(), needle = normalizeDeckSearch(query);
  const matching = decks.filter(d => !needle || d.entries.some(e => normalizeDeckSearch(e.card.name).includes(needle)));
  return <>
    <PageHead eyebrow="VOS ARSENAUX" title="Les decks" description="Composez. Vérifiez. Perfectionnez. Vos listes, sous votre contrôle.">
      <Button onClick={() => { setCreate(true); setError(""); }}><Plus size={17} />Créer un deck</Button>
    </PageHead>
    <div className="deck-overview-bar">
      <label className="search"><Search size={18} /><input aria-label="Chercher une carte dans tous les decks" placeholder="Dans quel deck se trouve cette carte ?" value={query} onChange={e => setQuery(e.target.value)} /></label>
      <span className="muted">{matching.length} deck{matching.length > 1 ? "s" : ""}{needle ? " contenant cette carte" : " archivés"}</span>
    </div>
    {needle && <p className="muted">Recherche dans le deck principal, la réserve et les commandants, quelle que soit l’impression.</p>}
    <div className="deck-grid">
      {matching.map(d => {
        const leader = d.entries.find(e => e.zone === "commander")?.card;
        const cover = leader ?? (!formats[d.format].commanders ? d.entries[0]?.card : undefined);
        const matches = d.entries.filter(e => normalizeDeckSearch(e.card.name).includes(needle));
        return <article key={d.id} className="deck-overview-item"><Link to={"/decks/" + d.id} className="deck-cover-card">
          <div className="deck-cover-art">{cover && imageUrl(cover) ? <img src={imageUrl(cover)} alt={cover.name} loading="lazy" /> : <div className="deck-cover-empty"><Crown size={38} /><span>{formats[d.format].commanders ? "Votre commandant vous attend" : "Un arsenal à composer"}</span></div>}<span className="deck-format">{formats[d.format].label}</span></div>
          <div className="deck-cover-caption"><h2>{d.name}</h2><p>{leader ? leader.name : formats[d.format].commanders ? "Aucun commandant" : "Deck construit"}</p><div><span><Layers3 size={14} /> {deckCount(d, "main") + deckCount(d, "commander")} cartes{deckCount(d, "sideboard") > 0 ? ` · ${deckCount(d, "sideboard")} en réserve` : ""}</span>{d.format === "commander" && <span className="deck-bracket-badge">B{d.bracket} · {bracketLabels[d.bracket - 1]}</span>}</div>
          {needle && <ul className="deck-search-hits">{matches.map(e => <li key={e.id}>{e.quantity} × {e.card.name}<small>{e.zone === "commander" ? "Commandant" : e.zone === "sideboard" ? "Réserve" : "Principal"}</small></li>)}</ul>}</div>
        </Link><button type="button" className="deck-delete-button" aria-label={"Supprimer le deck " + d.name} onClick={() => { setRemove(d); setError(""); }}><Trash2 size={16} /></button></article>;
      })}
    </div>
    {!matching.length && <Empty title={needle ? "Cette carte n’est dans aucun deck" : "Votre premier arsenal"}>{needle ? "Essayez un autre nom ou une partie du nom de la carte." : "Créez un deck et choisissez votre format pour commencer."}</Empty>}
    {remove && <Modal title="Supprimer ce deck ?" onClose={() => setRemove(null)}><p>Le deck « {remove.name} » et sa liste seront supprimés. Les exemplaires ajoutés directement à la collection restent conservés. Si les decks sont comptés dans la collection, ses cartes ne seront plus comptabilisées.</p>{error && <p className="error" role="alert">{error}</p>}<div className="actions"><Button variant="outline" disabled={busy} onClick={() => setRemove(null)}>Annuler</Button><Button disabled={busy} onClick={async () => { setBusy(true); try { await db.decks.delete(remove.id); setRemove(null); } catch { setError("Suppression impossible. Réessayez."); } finally { setBusy(false); } }}>Confirmer la suppression du deck</Button></div></Modal>}
    {create && <Modal title="Créer un deck" onClose={() => setCreate(false)}><form className="deck-form" onSubmit={async e => {
      e.preventDefault(); setBusy(true); setError("");
      try { const deck = await createDeck(name, format); navigate("/decks/" + deck.id); } catch (err) { setError((err as Error).message); } finally { setBusy(false); }
    }}><label>Nom du deck<input aria-label="Nom du deck" maxLength={120} value={name} onChange={e => setName(e.target.value)} required placeholder="La perfection incarnée" /></label><label>Format<select aria-label="Format du deck" value={format} onChange={e => setFormat(e.target.value as DeckFormat)}>{Object.entries(formats).map(([id, f]) => <option key={id} value={id}>{f.label}</option>)}</select></label><p className="muted">Le comptage dans la collection suit le réglage des paramètres.</p>{error && <p className="error" role="alert">{error}</p>}<Button disabled={busy || !name.trim()} type="submit">Créer</Button></form></Modal>}
  </>;
}
