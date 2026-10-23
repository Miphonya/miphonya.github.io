import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { scryfallService } from "../services/scryfall";
import type { Card } from "../schemas/models";
import CardBrowser from "./CardBrowser";
import { QueryState } from "./CollectionShared";
import { Button } from "./ui/button";
export function SearchResults({ query }: { query: string }) {
  const [extra, setExtra] = useState<Card[]>([]),
    [next, setNext] = useState<string>(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const result = useQuery({
    queryKey: ["search", query],
    queryFn: () => scryfallService.search(query),
    enabled: !!query,
  });
  useEffect(() => {
    setExtra([]);
    setNext(result.data?.next_page);
    setError("");
  }, [result.data, query]);
  async function more() {
    if (!next) return;
    setBusy(true);
    setError("");
    try {
      const page = await scryfallService.next(next);
      setExtra((old) => [...old, ...page.data]);
      setNext(page.next_page);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (!query) return null;
  return (
    <section className="search-results" aria-label="Résultats Scryfall">
      <QueryState loading={result.isFetching} error={result.error} />
      {result.data && <CardBrowser cards={[...result.data.data, ...extra]} />}
      {next && (
        <Button disabled={busy} variant="outline" onClick={() => void more()}>
          Charger les impressions suivantes
        </Button>
      )}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
    </section>
  );
}
