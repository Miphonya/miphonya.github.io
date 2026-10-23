import { db, prefs } from "../db";
import type { Card, SetInfo } from "../schemas/models";
const API = "https://api.scryfall.com";
let queue: Promise<unknown> = Promise.resolve();
let last = 0;
export function request<T>(path: string, options?: RequestInit): Promise<T> {
  const run = async () => {
    const url = new URL(path, API);
    if (url.origin !== API) throw Error("Destination API refusée");
    for (let attempt = 0; attempt < 3; attempt++) {
      await new Promise((r) =>
        setTimeout(r, Math.max(0, 120 - (Date.now() - last))),
      );
      last = Date.now();
      let res: Response;
      try {
        res = await fetch(url, {
          ...options,
          headers: { Accept: "application/json", ...options?.headers },
        });
      } catch {
        throw Error(
          "Connexion Scryfall indisponible. Les données déjà chargées restent accessibles.",
        );
      }
      if (res.status === 429 || res.status >= 500) {
        if (attempt < 2) {
          const delay = Number(res.headers.get("Retry-After"));
          await new Promise((r) =>
            setTimeout(
              r,
              Math.min(
                10000,
                Number.isFinite(delay) && delay > 0
                  ? delay * 1000
                  : 500 * 2 ** attempt,
              ),
            ),
          );
          continue;
        }
      }
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw Error(error.details ?? `Erreur Scryfall ${res.status}`);
      }
      return res.json() as Promise<T>;
    }
    throw Error("Scryfall temporairement indisponible");
  };
  const task = queue.then(run, run);
  queue = task.catch(() => {});
  return task;
}
interface Page<T> {
  data: T[];
  has_more?: boolean;
  next_page?: string;
}
async function pages<T>(path: string) {
  const all: T[] = [];
  let next: string | undefined = path;
  while (next) {
    const page: Page<T> = await request(next);
    all.push(...page.data);
    next = page.has_more ? page.next_page : undefined;
  }
  return all;
}
async function cached<T>(
  key: string,
  load: () => Promise<T>,
  hours: number,
): Promise<T> {
  const hit = await db.cache.get(key);
  if (hit && Date.now() - hit.at < hours * 3600000) return hit.data as T;
  try {
    const data = await load();
    await db.cache.put({ id: key, at: Date.now(), data });
    await pruneCache();
    return data;
  } catch (e) {
    if (hit) return hit.data as T;
    throw e;
  }
}
export async function pruneCache() {
  const entries = (await db.cache.toArray()).sort((a, b) => b.at - a.at);
  let bytes = 0;
  const remove: string[] = [];
  for (const entry of entries) {
    bytes += new Blob([JSON.stringify(entry.data)]).size;
    if (bytes > 25 * 1024 * 1024 || Date.now() - entry.at > 90 * 86400000)
      remove.push(entry.id);
  }
  await db.cache.bulkDelete(remove);
  const cards = await db.cards.toArray();
  if (cards.length > 15000) {
    const owned = new Set((await db.lots.toArray()).map((l) => l.cardId));
    const excess = cards
      .filter((c) => !owned.has(c.id))
      .sort((a, b) => (a.fetchedAt ?? 0) - (b.fetchedAt ?? 0))
      .slice(0, cards.length - 15000);
    await db.cards.bulkDelete(excess.map((c) => c.id));
  }
}
export const scryfallService = {
  async refreshOwned() {
    const ids = [...new Set((await db.lots.toArray()).map((l) => l.cardId))];
    let count = 0;
    for (let start = 0; start < ids.length; start += 75) {
      const result = await request<Page<Card>>("/cards/collection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifiers: ids.slice(start, start + 75).map((id) => ({ id })),
        }),
      });
      await db.cards.bulkPut(
        result.data.map((c) => ({ ...c, fetchedAt: Date.now() })),
      );
      count += result.data.length;
    }
    return count;
  },
  async sets() {
    const p = await prefs();
    return cached(
      "sets",
      async () => {
        const data = (await request<Page<SetInfo>>("/sets")).data.map((s) => ({
          ...s,
          fetchedAt: Date.now(),
        }));
        await db.sets.bulkPut(data);
        return data;
      },
      p.metadataDays * 24,
    );
  },
  async setCards(code: string) {
    const p = await prefs();
    return cached(
      `set:${code}`,
      async () => {
        const data = (
          await pages<Card>(
            `/cards/search?q=${encodeURIComponent(`set:${code} game:paper`)}&unique=prints&order=set`,
          )
        ).map((c) => ({ ...c, fetchedAt: Date.now() }));
        await db.cards.bulkPut(data);
        return data;
      },
      Math.min(p.metadataDays * 24, p.priceHours),
    );
  },
  async search(q: string) {
    return cached(
      `search:${q}`,
      async () => {
        const page = await request<Page<Card>>(
          `/cards/search?q=${encodeURIComponent(q + " game:paper")}&unique=prints`,
        );
        await db.cards.bulkPut(
          page.data.map((c) => ({ ...c, fetchedAt: Date.now() })),
        );
        return page;
      },
      24,
    );
  },
  async next(url: string) {
    const page = await request<Page<Card>>(url);
    await db.cards.bulkPut(
      page.data.map((c) => ({ ...c, fetchedAt: Date.now() })),
    );
    return page;
  },
  async autocomplete(q: string) {
    return (
      await request<{ data: string[] }>(
        `/cards/autocomplete?q=${encodeURIComponent(q)}`,
      )
    ).data;
  },
  async card(id: string) {
    const old = await db.cards.get(id);
    if (old) return old;
    const c = await request<Card>(`/cards/${encodeURIComponent(id)}`);
    await db.cards.put({ ...c, fetchedAt: Date.now() });
    return c;
  },
};
