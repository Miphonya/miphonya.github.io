import { CheckSquare, Grid2X2, List, Search, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { BulkCardEditor } from "./BulkCardEditor";
import LotsPanel from "./LotsPanel";
import { Modal } from "./ui/dialog";
import { CardTile } from "./CardTile";
import { Empty, useLots } from "./CollectionShared";
import { LotEditor } from "./LotEditor";
import { Button } from "./ui/button";
import { cardTypeLine, type Card } from "../schemas/models";
import { usePricing } from "../hooks/usePricing";
import { compareCollectorNumbers } from "../services/cardSort";
export default function CardBrowser({
  cards,
  markMissing = false,
  showEditionFilter = false,
  manageOwned = false,
}: {
  cards: Card[];
  markMissing?: boolean;
  showEditionFilter?: boolean;
  manageOwned?: boolean;
}) {
  const [selectionMode, setSelectionMode] = useState(false);
  const [selection, setSelection] = useState<Set<string>>(new Set());
  const [bulkEdit, setBulkEdit] = useState(false);
  const toggleSelected = (id: string) => setSelection(old => { const next = new Set(old); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const [managing, setManaging] = useState<Card | null>(null);
  const pricing = usePricing(),
    lots = useLots();
  const [name, setName] = useState(""),
    [ownership, setOwnership] = useState("all"),
    [edition, setEdition] = useState("all"),
    [rarity, setRarity] = useState("all"),
    [color, setColor] = useState("all"),
    [type, setType] = useState("");
  const [sort, setSort] = useState(markMissing ? "number" : "name"),
    [list, setList] = useState(false),
    [advanced, setAdvanced] = useState(false),
    [selected, setSelected] = useState<Card | null>(null);
  const quantity = (id: string) =>
    lots.filter((l) => l.cardId === id).reduce((n, l) => n + l.quantity, 0);
  const editions = [...new Set(cards.map((c) => c.set))];
  const extraCount =
    Number(color !== "all") +
    Number(Boolean(type)) +
    Number(!markMissing && !showEditionFilter && edition !== "all");
  const filtered = cards
    .filter(
      (c) =>
        `${c.name} ${c.collector_number}`
          .toLowerCase()
          .includes(name.toLowerCase()) &&
        (!markMissing ||
          ownership === "all" ||
          (ownership === "owned"
            ? quantity(c.id) > 0
            : quantity(c.id) === 0)) &&
        (markMissing || edition === "all" || c.set === edition) &&
        (rarity === "all" || c.rarity === rarity) &&
        (color === "all" ||
          (color === "C" ? !c.colors?.length : c.colors?.includes(color))) &&
        cardTypeLine(c).toLowerCase().includes(type.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "number"
        ? compareCollectorNumbers(a, b)
        : sort === "value"
          ? (pricing.quote(b).amount ?? -1) - (pricing.quote(a).amount ?? -1)
          : sort === "quantity"
            ? quantity(b.id) - quantity(a.id)
            : a.name.localeCompare(b.name),
    );
  const selectedCards = cards.filter(card => selection.has(card.id) && quantity(card.id) > 0);
  const selectable = filtered.filter(card => quantity(card.id) > 0);
  const hiddenSelected = selectedCards.filter(card => !filtered.some(shown => shown.id === card.id)).length;
  return (
    <>
      <div className="toolbar wrap card-toolbar">
        <label className="search">
          <Search size={17} />
          <input
            aria-label="Nom ou numéro"
            placeholder="Nom ou numéro de carte…"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        {markMissing && (
          <select
            aria-label="Possession"
            value={ownership}
            onChange={(e) => setOwnership(e.target.value)}
          >
            <option value="all">Toutes les cartes</option>
            <option value="owned">Possédées</option>
            <option value="missing">Manquantes</option>
          </select>
        )}
        {showEditionFilter && !markMissing && (
          <select
            className="extension-filter"
            aria-label="Extension des cartes"
            value={edition}
            onChange={(e) => setEdition(e.target.value)}
          >
            <option value="all">Toutes les extensions</option>
            {editions.map((code) => (
              <option key={code} value={code}>
                {cards.find((c) => c.set === code)?.set_name ?? code} (
                {code.toUpperCase()})
              </option>
            ))}
          </select>
        )}
        <select
          aria-label="Rareté"
          value={rarity}
          onChange={(e) => setRarity(e.target.value)}
        >
          <option value="all">Toutes raretés</option>
          {["common", "uncommon", "rare", "mythic", "special", "bonus"].map(
            (r) => (
              <option key={r}>{r}</option>
            ),
          )}
        </select>
        <select
          aria-label="Tri des cartes"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="number">Numéro de carte</option>
          <option value="name">Nom</option>
          <option value="value">Valeur</option>
          <option value="quantity">Quantité</option>
        </select>
        <Button
          variant="outline"
          aria-expanded={advanced}
          aria-controls="advanced-card-filters"
          onClick={() => setAdvanced(!advanced)}
        >
          <SlidersHorizontal size={15} /> Plus de filtres
          {extraCount > 0 ? ` (${extraCount})` : ""}
        </Button>
        {(manageOwned || markMissing) && <Button variant={selectionMode ? "default" : "outline"} aria-pressed={selectionMode} onClick={() => { setSelectionMode(!selectionMode); setSelection(new Set()); }}><CheckSquare size={17} />{selectionMode ? "Terminer la sélection" : "Sélectionner des cartes"}</Button>}
        <Button
          variant="ghost"
          aria-label={list ? "Vue grille" : "Vue liste"}
          onClick={() => setList(!list)}
        >
          {list ? <Grid2X2 size={18} /> : <List size={18} />}
        </Button>
      </div>
      {advanced && (
        <div className="advanced-filters" id="advanced-card-filters">
          {!markMissing && !showEditionFilter && editions.length > 1 && (
            <label>
              Édition
              <select
                aria-label="Édition"
                value={edition}
                onChange={(e) => setEdition(e.target.value)}
              >
                <option value="all">Toutes éditions</option>
                {editions.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
          )}
          <label>
            Couleur
            <select
              aria-label="Couleur"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            >
              <option value="all">Toutes les couleurs</option>
              {["W", "U", "B", "R", "G", "C"].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            Type
            <input
              aria-label="Type de carte"
              placeholder="Créature, artefact…"
              value={type}
              onChange={(e) => setType(e.target.value)}
            />
          </label>
          {extraCount > 0 && (
            <Button
              variant="ghost"
              onClick={() => {
                setColor("all");
                setType("");
                setEdition("all");
              }}
            >
              Réinitialiser
            </Button>
          )}
        </div>
      )}
      {selectionMode && <section className="bulk-selection-bar" aria-label="Actions sur la sélection"><span role="status">{selectedCards.length} carte(s) sélectionnée(s){hiddenSelected ? ` · ${hiddenSelected} masquée(s) par les filtres` : ""}</span><div><Button variant="outline" disabled={!selectable.length} onClick={() => setSelection(old => new Set([...old, ...selectable.map(card => card.id)]))}>Tout sélectionner (cartes affichées)</Button><Button variant="ghost" disabled={!selectedCards.length} onClick={() => setSelection(new Set())}>Tout désélectionner</Button><Button disabled={!selectedCards.length} onClick={() => setBulkEdit(true)}>Modifier la sélection</Button></div></section>}
      <p className="muted result-count">
        {filtered.length} impressions affichées
      </p>
      <div className={list ? "cards-list" : "cards-grid"}>
        {filtered.map((c) => (
          <CardTile
            key={c.id}
            card={c}
            quantity={quantity(c.id)}
            selectionMode={selectionMode}
            selection={selectionMode && quantity(c.id) > 0 ? { selected: selection.has(c.id), onToggle: () => toggleSelected(c.id) } : undefined}
            missing={markMissing && quantity(c.id) === 0}
            onAdd={() => setSelected(c)}
            onImageClick={() => (manageOwned || markMissing) && quantity(c.id) > 0 ? setManaging(c) : setSelected(c)}
            imageAction={(manageOwned || markMissing) && quantity(c.id) > 0 ? "Gérer " + c.name : "Ajouter " + c.name}
          />
        ))}
      </div>
      {!filtered.length && (
        <Empty title="Aucune carte à afficher">
          Ajoutez une carte ou ajustez vos filtres.
        </Empty>
      )}
      {managing && (
        <Modal title={"Gérer " + managing.name} onClose={() => setManaging(null)}>
          <LotsPanel cardId={managing.id} onDeleted={() => setManaging(null)} />
          <Button variant="outline" onClick={() => {
            setSelected(managing);
            setManaging(null);
          }}>
            Ajouter des exemplaires
          </Button>
        </Modal>
      )}
      {bulkEdit && <BulkCardEditor cards={selectedCards} onClose={() => setBulkEdit(false)} onSaved={() => { setBulkEdit(false); setSelection(new Set()); setSelectionMode(false); }} />}
      {selected && (
        <LotEditor card={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}
