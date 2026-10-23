import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import { scryfallService } from "../services/scryfall";
import { useDebounced } from "./CollectionShared";
import { SearchResults } from "./SearchResults";
import { Button } from "./ui/button";
export function NameSearch() {
  const [search, setSearch] = useState(""),
    [query, setQuery] = useState("");
  const debounced = useDebounced(search);
  const suggestions = useQuery({
    queryKey: ["autocomplete", debounced],
    queryFn: () => scryfallService.autocomplete(debounced),
    enabled: debounced.length >= 2,
  });
  return (
    <section aria-label="Ajout par nom">
      <div className="method-intro">
        <h2>Un nom. La bonne impression.</h2>
        <p className="muted">
          Recherchez une carte, puis choisissez son édition et vos exemplaires.
        </p>
      </div>
      <form
        className="toolbar"
        onSubmit={(e) => {
          e.preventDefault();
          setQuery(search.trim());
        }}
      >
        <label className="search">
          <Search size={18} />
          <input
            list="card-suggestions"
            aria-label="Rechercher une carte Scryfall"
            placeholder="Elesh Norn, Mother of Machines…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <datalist id="card-suggestions">
            {suggestions.data?.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </label>
        <Button type="submit" disabled={!search.trim()}>
          Rechercher
          <ArrowRight size={17} />
        </Button>
      </form>
      <SearchResults key={query} query={query} />
    </section>
  );
}
