import { useEffect, useState } from "react";
import { DeckEntryEditor } from "./DeckEntryEditor";
import type { Exemplar } from "../schemas/exemplar";
import { Search, Crown, Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Modal } from "./ui/dialog";
import { Button } from "./ui/button";
import { imageUrl, cardTypeLine } from "../schemas/models";
import type { DeckCard } from "../schemas/decks";
import { searchDeckCards } from "../services/decks";
import { usePreferences } from "./CollectionShared";
import { usePricing } from "../hooks/usePricing";
export function DeckCardPicker({ commander, onPick, onClose }: { commander: boolean; onPick: (card: DeckCard, details: Exemplar, quantity: number) => Promise<void>; onClose: () => void }) {
  const [selected, setSelected] = useState<DeckCard | null>(null);
  const [input, setInput] = useState(""), [query, setQuery] = useState("");
  const [extra, setExtra] = useState<DeckCard[]>([]), [next, setNext] = useState<string>();
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const pricing = usePricing();
  const p = usePreferences();
  const results = useQuery({ queryKey: ["deck-picker", query], queryFn: () => searchDeckCards(query), enabled: !!query });
  useEffect(() => { setNext(results.data?.next_page); setExtra([]); }, [results.data]);
  if (selected) return <DeckEntryEditor card={selected} commander={commander} onClose={() => setSelected(null)} onSave={(details, quantity) => onPick(selected, details, quantity)} />;
  return <Modal title={commander ? "Choisir le commandant" : "Ajouter au deck"} onClose={onClose}>
    <p className="muted">{commander ? "Sélection dédiée au commandant et à la couverture du deck. La légalité sera contrôlée après sélection." : p.includeDeckCards ? "Les cartes ajoutées seront aussi comptées dans la collection selon votre réglage." : "Ces cartes restent exclues de la collection selon votre réglage."}</p>
    <form className="toolbar" onSubmit={e => { e.preventDefault(); setExtra([]); setNext(input.trim() === query ? results.data?.next_page : undefined); setError(""); setQuery(input.trim()); }}>
      <label className="search"><Search size={18} /><input autoFocus aria-label="Rechercher une carte pour le deck" placeholder="Elesh Norn, Mother of Machines…" value={input} onChange={e => setInput(e.target.value)} /></label>
      <Button type="submit" disabled={!input.trim() || busy}>Rechercher</Button>
    </form>
    {results.isFetching && <p role="status">Recherche Scryfall…</p>}
    {(error || results.error) && <p className="error" role="alert">{error || results.error?.message}</p>}
    <div className="deck-picker-results">
      {[...(results.data?.data ?? []), ...extra].map(card => <button className="deck-picker-card" key={card.id} disabled={busy} onClick={() => setSelected(card)}>
        {imageUrl(card) ? <img src={imageUrl(card)} alt="" loading="lazy" /> : <span className="deck-card-placeholder">{commander ? <Crown /> : <Plus />}</span>}
        <span><strong>{card.name}</strong><small>{card.set.toUpperCase()} · {cardTypeLine(card)}</small><small>{pricing.format(pricing.quote(card).amount)}</small></span>
        {commander ? <Crown size={18} /> : <Plus size={18} />}
      </button>)}
    </div>
    {next && <Button variant="outline" disabled={busy || results.isFetching} onClick={async () => {
      setBusy(true); setError("");
      try { const page = await searchDeckCards(query, next); setExtra(old => [...old, ...page.data]); setNext(page.next_page); } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
    }}>Voir plus de cartes</Button>}
  </Modal>;
}
