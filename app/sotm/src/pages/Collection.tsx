import { useQuery } from "@tanstack/react-query";
import { useLiveQuery } from "dexie-react-hooks";
import {
  ArrowRight,
  Check,
  ChevronRight,
  Plus,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Empty,
  PageHead,
  QueryState,
  Stats,
  useLots,
  usePreferences,
} from "../components/CollectionShared";
import { Button } from "../components/ui/button";
import { db, savePrefs, updatePrefs } from "../db";
import { progress } from "../schemas/models";
import { scryfallService } from "../services/scryfall";
const logo = import.meta.env.BASE_URL + "app/sotm/logo.svg";

export default function Collection() {
  const navigate = useNavigate();
  const lots = useLots();
  const p = usePreferences();
  const [search, setSearch] = useState("");
  const [type, setType] = useState("main");
  const [sort, setSort] = useState("date");
  const tracked = p.onlyTracked;
  const q = useQuery({ queryKey: ["sets"], queryFn: scryfallService.sets });
  const local = useLiveQuery(() => db.sets.toArray(), []) ?? [];
  const sets = q.data ?? local;
  const filtered = sets
    .filter(
      (s) =>
        (!tracked || p.tracked.includes(s.code)) &&
        `${s.name} ${s.code}`.toLowerCase().includes(search.toLowerCase()) &&
        (type === "all" ||
          (type === "main"
            ? ["expansion", "core"].includes(s.set_type)
            : type === "commander"
              ? s.set_type === "commander"
              : !["expansion", "core", "commander"].includes(s.set_type))),
    )
    .sort((a, b) =>
      sort === "name"
        ? a.name.localeCompare(b.name)
        : sort === "progress"
          ? progress(lots, b.code, b.card_count).percent -
            progress(lots, a.code, a.card_count).percent
          : sort === "count"
            ? b.card_count - a.card_count
            : b.released_at.localeCompare(a.released_at),
    );
  async function toggle(code: string) {
    await savePrefs({
      ...p,
      tracked: p.tracked.includes(code)
        ? p.tracked.filter((c) => c !== code)
        : [...p.tracked, code],
    });
  }
  return (
    <>
      <PageHead
        eyebrow="VOTRE SANCTUAIRE PERSONNEL"
        title="La collection"
        description="Chaque carte a sa place. Chaque collection, son histoire."
      >
        <Button onClick={() => navigate("/add")}>
          <Plus size={17} /> Ajouter des cartes
        </Button>
      </PageHead>
      <Stats />
      <section className="collection-banner">
        <div className="sigil">
          <img src={logo} alt="" />
        </div>
        <div>
          <p className="eyebrow">L’ARCHIVE PREND FORME</p>
          <h2>Une collection. Votre héritage.</h2>
          <p>
            Réunissez vos cartes, complétez vos extensions et préparez vos
            échanges.
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate("/cards")}>
          Toutes mes cartes <ArrowRight size={16} />
        </Button>
      </section>
      <div className="section-heading">
        <div>
          <h2>
            Vos extensions <span className="count">{filtered.length}</span>
          </h2>
          <p>Explorez le catalogue et suivez votre progression.</p>
        </div>
        <button
          type="button"
          className={"tracked-toggle " + (tracked ? "is-on" : "")}
          role="switch"
          aria-checked={tracked}
          onClick={() => void updatePrefs({ onlyTracked: !tracked })}
        >
          <span className="switch-track">
            <span />
          </span>
          <span>Extensions suivies uniquement</span>
        </button>
      </div>
      <div className="toolbar">
        <label className="search">
          <Search size={17} />
          <input
            placeholder="Rechercher une extension…"
            aria-label="Rechercher une extension"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <select
          aria-label="Type d’extension"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="main">Extensions principales</option>
          <option value="commander">Commander</option>
          <option value="special">Bonus et spéciales</option>
          <option value="all">Tous les types</option>
        </select>
        <select
          aria-label="Trier les extensions"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="date">Plus récentes</option>
          <option value="name">Nom</option>
          <option value="progress">Progression</option>
          <option value="count">Nombre de cartes</option>
        </select>
        <Button
          variant="ghost"
          aria-label="Rafraîchir les extensions"
          onClick={() => void q.refetch()}
        >
          <SlidersHorizontal size={18} />
        </Button>
      </div>
      <QueryState loading={q.isPending && !sets.length} error={q.error} />
      <div className="set-grid">
        {filtered.map((s) => {
          const pr = progress(lots, s.code, s.card_count);
          const followed = p.tracked.includes(s.code);
          return (
            <article className="set-card panel" key={s.code}>
              <div className="set-art">
                <div className="set-lines" />
                <img src={s.icon_svg_uri} alt="" loading="lazy" />
                <span className="set-code">{s.code.toUpperCase()}</span>
                <button
                  className={"follow " + (followed ? "selected" : "")}
                  aria-label={
                    (followed ? "Ne plus suivre " : "Suivre ") + s.name
                  }
                  aria-pressed={followed}
                  onClick={() => void toggle(s.code)}
                >
                  {followed ? <Check size={15} /> : <Plus size={15} />}
                </button>
              </div>
              <div className="set-body">
                <small>
                  {s.set_type === "commander"
                    ? "COMMANDER"
                    : ["core", "expansion"].includes(s.set_type)
                      ? "EXTENSION"
                      : "ÉDITION SPÉCIALE"}{" "}
                  · {new Date(s.released_at).getFullYear()}
                </small>
                <button
                  className="set-title"
                  onClick={() => navigate("/sets/" + s.code)}
                >
                  {s.name}
                  <ChevronRight size={17} />
                </button>
                <div className="progress-label">
                  <span>
                    <b>{pr.owned}</b> / {s.card_count} impressions
                  </span>
                  <span>{pr.percent.toFixed(1)} %</span>
                </div>
                <progress
                  value={pr.owned}
                  max={s.card_count || 1}
                  aria-label={"Collection " + s.name}
                />
                <p className="set-date">
                  Sortie le{" "}
                  {new Date(s.released_at).toLocaleDateString("fr-FR")}
                </p>
              </div>
            </article>
          );
        })}
      </div>
      {!q.isPending && !filtered.length && (
        <Empty title="Votre prochaine extension vous attend">
          Modifiez les filtres ou chargez le catalogue Scryfall avec une
          connexion Internet.
        </Empty>
      )}
    </>
  );
}
