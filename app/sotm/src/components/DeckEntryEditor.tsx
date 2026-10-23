import { useState } from "react";
import type { DeckCard, DeckEntry } from "../schemas/decks";
import type { Exemplar } from "../schemas/exemplar";
import { entryDetails } from "../services/decks";
import { usePricing } from "../hooks/usePricing";
import { Modal } from "./ui/dialog";
import { Button } from "./ui/button";
import { ExemplarFields } from "./ExemplarFields";
export function DeckEntryEditor({ card, entry, commander, onSave, onClose }: { card: DeckCard; entry?: DeckEntry; commander: boolean; onSave: (details: Exemplar, quantity: number) => Promise<void>; onClose: () => void }) {
  const pricing = usePricing();
  const [details, setDetails] = useState<Exemplar>(() => entry ? entryDetails(entry) : { ...entryDetails({ card }), language: pricing.defaultLanguage });
  const [quantity, setQuantity] = useState(entry?.quantity ?? 1), [busy, setBusy] = useState(false), [error, setError] = useState("");
  return <Modal title={entry ? "Modifier la carte du deck" : commander ? "Configurer le commandant" : "Configurer la carte du deck"} onClose={onClose}>
    <p className="muted">{card.name} · {card.set.toUpperCase()} #{card.collector_number}</p>
    <form className="deck-form" onSubmit={async e => { e.preventDefault(); setBusy(true); setError(""); try { if (!card.finishes.includes(details.finish)) throw Error("Finition indisponible."); await onSave(details, quantity); } catch (err) { setError((err as Error).message); } finally { setBusy(false); } }}>
      <label>Quantité<input aria-label="Quantité dans le deck" type="number" min={1} max={commander ? 1 : 999} required disabled={commander} value={quantity} onChange={e => setQuantity(Number(e.target.value))} /></label>
      <ExemplarFields value={details} onChange={setDetails} finishes={card.finishes} />
      <p className="muted">Prix indicatif : {pricing.format(pricing.quote(card, details.finish).amount)} par exemplaire. Les caractéristiques n’altèrent pas l’identité utilisée pour la légalité.</p>
      {error && <p role="alert" className="error">{error}</p>}
      <Button type="submit" disabled={busy}>{entry ? "Enregistrer les caractéristiques" : commander ? "Sélectionner ce commandant" : "Ajouter au deck"}</Button>
    </form>
  </Modal>;
}
