import { useState } from "react";
import { Layers3 } from "lucide-react";
import { updatePrefs } from "../db";
import { usePreferences } from "./CollectionShared";
export function DeckCollectionSetting() {
  const p = usePreferences();
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  return <section className="panel deck-collection-setting">
    <div><Layers3 size={22} /><h2>Decks et collection</h2></div>
    <button type="button" className={"tracked-toggle " + (p.includeDeckCards ? "is-on" : "")} role="switch" aria-checked={p.includeDeckCards} disabled={busy} onClick={async () => {
      setBusy(true); setError("");
      try { await updatePrefs({ includeDeckCards: !p.includeDeckCards }); } catch { setError("Réglage non enregistré. Réessayez."); } finally { setBusy(false); }
    }}><span className="switch-track"><span /></span><span>Compter les cartes des decks dans la collection</span></button>
    <p>{p.includeDeckCards ? "Les quantités du principal, des commandants et des réserves sont incluses dans la liste, les totaux et la progression." : "Seuls les exemplaires ajoutés directement à la collection sont comptés."}</p>
    <p className="muted">Les quantités s’additionnent : une carte déjà saisie dans la collection sera aussi comptée pour chaque deck qui la contient. Les cartes des decks se modifient dans leur deck ou en sélection multiple dans la collection. Désactiver cette option ne supprime aucune carte.</p>
    {error && <p className="error" role="alert">{error}</p>}
  </section>;
}
