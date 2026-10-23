import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FilePlus2, Crown, Download, Plus, RefreshCw, Search, ShieldCheck, Trash2 } from "lucide-react";
import { db } from "../db";
import { PageHead, Empty, usePreferences } from "../components/CollectionShared";
import { Button } from "../components/ui/button";
import { Modal } from "../components/ui/dialog";
import { DeckListImporter } from "../components/DeckListImporter";
import { DeckEntryEditor } from "../components/DeckEntryEditor";
import { finishLabel } from "../components/ExemplarFields";
import { languages } from "../schemas/languages";
import { DeckCardPicker } from "../components/DeckCardPicker";
import { formats, type Deck, type DeckEntry, type DeckFormat } from "../schemas/decks";
import { imageUrl } from "../schemas/models";
import { addDeckCard, entryDetails, bracketLabels, checkBracket, deckCount, loadGameChangers, mutateDeck, normalizeDeckSearch, refreshDeck, validateDeck, type GameChangers } from "../services/decks";
import { useUI } from "../stores/ui";

export default function DeckDetail() {
  const p = usePreferences();
  const { id = "" } = useParams(), navigate = useNavigate();
  const deck = useLiveQuery(() => db.decks.get(id), [id]);
  const changers = useLiveQuery(async () => (await db.cache.get("deck-gamechangers"))?.data as GameChangers | undefined, []);
  const [importing, setImporting] = useState(false), [editingEntry, setEditingEntry] = useState<DeckEntry | null>(null);
  const [picker, setPicker] = useState<{ zone: DeckEntry["zone"]; second?: boolean } | null>(null), [query, setQuery] = useState("");
  const [remove, setRemove] = useState<DeckEntry | null>(null), [deleteDeck, setDeleteDeck] = useState(false), [editInfo, setEditInfo] = useState(false);
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const notify = useUI(s => s.notify);
  async function run(action: () => Promise<unknown>) {
    setBusy(true); setError("");
    try { await action(); } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  if (!deck) return <><Link to="/decks">← Decks</Link><Empty title="Deck en cours de chargement ou introuvable">Revenez à la liste si ce deck a été supprimé.</Empty></>;
  const rules = formats[deck.format], validation = validateDeck(deck), bracket = checkBracket(deck, changers);
  const commanders = deck.entries.filter(e => e.zone === "commander");
  const needle = normalizeDeckSearch(query);
  const visible = deck.entries.filter(e => e.zone !== "commander" && (!needle || normalizeDeckSearch(e.card.name).includes(needle)));
  const snapshots = deck.entries.map(e => e.card.fetchedAt).filter((n): n is number => typeof n === "number");
  function exportList() {
    const lines = ["main", "commander", "sideboard"].map(zone => `${zone === "main" ? "Deck" : zone === "commander" ? "Commander" : "Sideboard"}\n` + deck!.entries.filter(e => e.zone === zone).map(e => `${e.quantity} ${e.card.name} (${e.card.set.toUpperCase()}) ${e.card.collector_number}${entryDetails(e).finish === "foil" ? " *F*" : entryDetails(e).finish === "etched" ? " *E*" : ""}`).join("\n")).join("\n\n");
    const url = URL.createObjectURL(new Blob([lines], { type: "text/plain;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = `${deck!.name.replace(/[^\p{L}\p{N} -]/gu, "") || "deck"}.txt`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <>
    <Link to="/decks" className="deck-back"><ArrowLeft size={16} /> Tous les decks</Link>
    <PageHead eyebrow={rules.label.toUpperCase()} title={deck.name} description={p.includeDeckCards ? "Les cartes de ce deck sont comptées dans votre collection." : "Ce deck est exclu des quantités de votre collection."}>
      <Button variant="outline" onClick={() => setEditInfo(true)}>Modifier le deck</Button>
      <Button variant="ghost" onClick={() => setDeleteDeck(true)}><Trash2 size={16} />Supprimer le deck</Button>
      <Button variant="ghost" onClick={exportList}><Download size={16} />Exporter la liste</Button>
    </PageHead>
    {error && <p className="error" role="alert">{error}</p>}
    <div className="deck-workspace">
      <div className="deck-main-column">
        {rules.commanders && <section className="panel deck-command-section">
          <div className="section-heading"><h2><Crown size={20} /> Commandement</h2><span className="muted">Couverture du deck</span></div>
          <div className="deck-commanders">
            {commanders.map((entry, i) => <div className="deck-commander" key={entry.id}>
              <button className="deck-commander-image" aria-label={"Changer le commandant " + entry.card.name} onClick={() => setPicker({ zone: "commander" })}>{imageUrl(entry.card) ? <img src={imageUrl(entry.card)} alt={entry.card.name} /> : <Crown size={40} />}</button>
              <div><small>{i === 0 ? "COMMANDANT · COUVERTURE" : "SECOND COMMANDANT"}</small><h3>{entry.card.name}</h3><p>{entry.card.color_identity?.join(" · ") || "Incolore"} · {entryDetails(entry).language.toUpperCase()} · {finishLabel(entryDetails(entry).finish)}</p><Button variant="outline" onClick={() => setEditingEntry(entry)}>Caractéristiques</Button><Button variant="ghost" onClick={() => setRemove(entry)}>Retirer</Button></div>
            </div>)}
            {!commanders.length && <button className="deck-command-empty" onClick={() => setPicker({ zone: "commander" })}><Crown size={32} /><strong>Choisir votre commandant</strong><span>Son image devient la couverture du deck.</span></button>}
          </div>
          {commanders.length === 1 && deck.format !== "brawl" && <Button variant="outline" onClick={() => setPicker({ zone: "commander", second: true })}>Ajouter un second commandant compatible</Button>}
          {commanders.length > 1 && <p className="muted">Le premier commandant fournit la couverture. Le remplacer remplace la paire ; retirez le second pour en choisir un autre.</p>}
        </section>}
        <section className="panel deck-list-section">
          <div className="section-heading"><h2>La liste</h2><span className="muted">{validation.mainCount} / {rules.singleton ? rules.size : rules.size + "+"} cartes{validation.sideCount ? ` · ${validation.sideCount} en réserve` : ""}</span></div>
          <div className="toolbar wrap"><label className="search"><Search size={17} /><input aria-label="Filtrer les cartes de ce deck" placeholder="Rechercher dans ce deck…" value={query} onChange={e => setQuery(e.target.value)} /></label><Button onClick={() => setPicker({ zone: "main" })}><Plus size={17} />Ajouter une carte</Button><Button variant="outline" onClick={() => setImporting(true)}><FilePlus2 size={16} />Importer une liste</Button>{!rules.commanders && <Button variant="outline" onClick={() => setPicker({ zone: "sideboard" })}>Ajouter en réserve</Button>}</div>
          {(["main", "sideboard"] as const).map(zone => {
            const entries = visible.filter(e => e.zone === zone);
            if (!entries.length) return null;
            return <div className="deck-zone" key={zone}><h3>{zone === "main" ? "Deck principal" : "Réserve"} <span>{deckCount(deck, zone)}</span></h3>{entries.map(entry => <div className="deck-entry" key={entry.id}>
              {imageUrl(entry.card) && <img src={imageUrl(entry.card)} alt="" loading="lazy" />}
              <div className="deck-entry-name"><strong>{entry.card.name}</strong><small>{entry.card.set.toUpperCase()} · #{entry.card.collector_number}</small><small>{languages[entryDetails(entry).language as keyof typeof languages] ?? entryDetails(entry).language} · {finishLabel(entryDetails(entry).finish)} · {entryDetails(entry).condition}{entryDetails(entry).signed ? " · Signée" : ""}{entryDetails(entry).altered ? " · Altérée" : ""}</small></div>
              <Button variant="ghost" aria-label={"Caractéristiques de " + entry.card.name} onClick={() => setEditingEntry(entry)}>Modifier</Button>
              <label className="deck-entry-quantity"><span className="sr-only">Quantité de {entry.card.name} en {zone === "main" ? "principal" : "réserve"}</span><input type="number" min={1} max={999} value={entry.quantity} onChange={e => {
                const n = Number(e.target.value); if (Number.isInteger(n) && n >= 1 && n <= 999) void run(() => mutateDeck(id, d => ({ ...d, entries: d.entries.map(x => x.id === entry.id ? { ...x, quantity: n } : x) })));
              }} /></label>
              {!rules.commanders && <Button variant="ghost" aria-label={"Déplacer " + entry.card.name + (zone === "main" ? " en réserve" : " en principal")} onClick={() => void run(() => mutateDeck(id, d => ({ ...d, entries: d.entries.map(x => x.id === entry.id ? { ...x, zone: zone === "main" ? "sideboard" : "main" } : x) })))}>{zone === "main" ? "→ Réserve" : "→ Principal"}</Button>}
              <Button variant="ghost" aria-label={"Retirer " + entry.card.name} onClick={() => setRemove(entry)}><Trash2 size={16} /></Button>
            </div>)}</div>;
          })}
          {!visible.length && <p className="deck-list-empty">{needle ? "Aucune carte correspondante dans ce deck." : "Votre bibliothèque attend ses premières cartes."}</p>}
        </section>
      </div>
      <aside className="deck-checks-column">
        <section className="panel deck-legality" aria-label="Contrôle de légalité">
          <div className="section-heading"><h2><ShieldCheck size={18} /> Légalité</h2></div>
          <p className={validation.errors.length ? "deck-check-status needs-review" : "deck-check-status"}>{validation.errors.length ? `${validation.errors.length} point(s) à corriger` : validation.warnings.length > 1 ? "Contrôle incomplet · données manquantes" : "Contrôles automatiques satisfaits"}</p>
          <Button variant="outline" disabled={busy} onClick={() => void run(async () => { const missing = await refreshDeck(id); if (deck.format === "commander") await loadGameChangers(); notify(missing ? `${missing} carte(s) non actualisée(s)` : "Statuts Scryfall actualisés"); })}><RefreshCw size={15} />Actualiser les règles</Button>
          <p className="muted deck-check-date">{snapshots.length ? `Instantané le plus ancien : ${new Date(Math.min(...snapshots)).toLocaleDateString("fr-CH")}` : "Utilise les statuts chargés avec les cartes."}</p>
          {validation.errors.length > 0 && <ul className="deck-issues">{validation.errors.map((message, i) => <li key={i}>{message}</li>)}</ul>}
          <details className="deck-limitations"><summary>Portée du contrôle</summary><ul>{validation.warnings.map((message, i) => <li key={i}>{message}</li>)}</ul></details>
        </section>
        {deck.format === "commander" && <section className="panel deck-bracket" aria-label="Bracket Commander">
          <h2>Bracket Commander</h2><p className="muted">Choisi par vous, accompagné d’alertes. Un bracket n’est pas déduit du nombre de cartes puissantes.</p>
          <label>Bracket annoncé<select aria-label="Bracket annoncé" value={deck.bracket} onChange={e => void run(() => mutateDeck(id, d => ({ ...d, bracket: Number(e.target.value) })))}>{bracketLabels.map((label, i) => <option key={label} value={i + 1}>{i + 1} · {label}</option>)}</select></label>
          <div className="deck-gamechangers"><strong>{changers ? bracket.count : "?"}</strong><span>Game Changer{bracket.count > 1 ? "s" : ""}<small>0 en B1/B2 · jusqu’à 3 en B3</small></span></div>
          {changers && <p className="muted">Liste Scryfall du {new Date(changers.checkedAt).toLocaleDateString("fr-CH")}</p>}
          {!changers && <Button variant="outline" disabled={busy} onClick={() => void run(loadGameChangers)}>Charger les Game Changers</Button>}
          {bracket.hits.length > 0 && <ul>{bracket.hits.map(e => <li key={e.id}>{e.card.name}</li>)}</ul>}
          <h3>À examiner dans votre plan de jeu</h3>
          {([
            ["earlyCombos", "Combos à deux cartes capables de conclure tôt"],
            ["extraTurns", "Enchaînement de tours supplémentaires"],
            ["landDenial", "Destruction ou déni massif de terrains"],
          ] as const).map(([key, label]) => <label key={key}>{label}<select aria-label={label} value={deck.bracketChecks[key]} onChange={e => {
            const value = e.target.value as Deck["bracketChecks"][typeof key];
            void run(() => mutateDeck(id, d => ({ ...d, bracketChecks: { ...d.bracketChecks, [key]: value } })));
          }}><option value="unknown">À vérifier</option><option value="no">Non prévu</option><option value="yes">Oui, prévu</option></select></label>)}
          {bracket.warnings.length > 0 && <ul className="deck-issues">{bracket.warnings.map((message, i) => <li key={i}>{message}</li>)}</ul>}
          <p className="muted">Repères indicatifs, pas une certification. Vitesse, régularité, intention et interactions demandent une discussion avec la table. Ces questions ne couvrent pas tous les critères officiels.</p>
          <a href="https://magic.wizards.com/en/news/announcements/introducing-commander-brackets-beta" target="_blank" rel="noreferrer">Lire le cadre officiel des brackets ↗</a>
        </section>}
        <section className="panel deck-notes"><h2>Notes</h2><textarea key={deck.id + "-notes"} aria-label="Notes du deck" defaultValue={deck.notes} placeholder="Plan de jeu, idées, améliorations…" maxLength={6000} onBlur={e => { const notes = e.target.value; if (notes !== deck.notes) void run(() => mutateDeck(id, d => ({ ...d, notes }))); }} /></section>
      </aside>
    </div>
    {picker && <DeckCardPicker commander={picker.zone === "commander"} onClose={() => setPicker(null)} onPick={async (card, details, quantity) => { await addDeckCard(id, { ...card, fetchedAt: Date.now() }, picker.zone, picker.second, details, quantity); setPicker(null); notify(picker.zone === "commander" ? "Commandant sélectionné" : p.includeDeckCards ? "Carte ajoutée au deck et comptée dans la collection" : "Carte ajoutée au deck uniquement"); }} />}
    {importing && <DeckListImporter deckId={id} hasSideboard={!rules.commanders} onClose={() => setImporting(false)} />}
    {editingEntry && <DeckEntryEditor card={editingEntry.card} entry={editingEntry} commander={editingEntry.zone === "commander"} onClose={() => setEditingEntry(null)} onSave={async (details, quantity) => { await mutateDeck(id, d => ({ ...d, entries: d.entries.map(e => e.id === editingEntry.id ? { ...e, details, quantity } : e) })); setEditingEntry(null); }} />}
    {remove && <Modal title="Retirer cette carte du deck ?" onClose={() => setRemove(null)}><p>{remove.quantity} × {remove.card.name}. {p.includeDeckCards ? "Ces exemplaires ne seront plus comptés dans la collection." : "Les exemplaires saisis directement dans la collection restent intacts."}</p><Button disabled={busy} onClick={() => void run(async () => { await mutateDeck(id, d => ({ ...d, entries: d.entries.filter(e => e.id !== remove.id) })); setRemove(null); })}>Confirmer le retrait</Button></Modal>}
    {deleteDeck && <Modal title="Supprimer ce deck ?" onClose={() => setDeleteDeck(false)}><p>Le deck « {deck.name} » et sa liste seront supprimés de ce navigateur. Les exemplaires saisis directement dans la collection restent intacts. {p.includeDeckCards ? "Les cartes de ce deck ne seront plus comptées dans la collection." : ""}</p><Button disabled={busy} onClick={() => void run(async () => { await db.decks.delete(id); navigate("/decks"); })}>Confirmer la suppression du deck</Button></Modal>}
    {editInfo && <DeckInfo deck={deck} onClose={() => setEditInfo(false)} />}
  </>;
}
function DeckInfo({ deck, onClose }: { deck: Deck; onClose: () => void }) {
  const [name, setName] = useState(deck.name), [format, setFormat] = useState(deck.format), [error, setError] = useState(""), [busy, setBusy] = useState(false);
  return <Modal title="Modifier le deck" onClose={onClose}><form className="deck-form" onSubmit={async e => { e.preventDefault(); setBusy(true); try { await mutateDeck(deck.id, d => ({ ...d, name, format, entries: formats[format].commanders ? d.entries : d.entries.map(e => e.zone === "commander" ? { ...e, zone: "main" as const } : e) })); onClose(); } catch (err) { setError((err as Error).message); } finally { setBusy(false); } }}>
    <label>Nom du deck<input aria-label="Nom du deck" value={name} maxLength={120} required onChange={e => setName(e.target.value)} /></label><label>Format<select aria-label="Format du deck" value={format} onChange={e => setFormat(e.target.value as DeckFormat)}>{Object.entries(formats).map(([key, f]) => <option key={key} value={key}>{f.label}</option>)}</select></label><p className="muted">Changer de format conserve les cartes et relance le contrôle. Vers un format sans commandant, les commandants rejoignent le deck principal.</p>{error && <p className="error" role="alert">{error}</p>}<Button type="submit" disabled={busy || !name.trim()}>Enregistrer</Button>
  </form></Modal>;
}
