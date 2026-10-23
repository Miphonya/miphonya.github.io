import { db, saveLot, prefs } from "../db";
import { lotSchema, type Card, type Lot } from "../schemas/models";
import { request } from "./scryfall";
export interface ListEntry {
  line: number;
  name: string;
  set: string;
  collectorNumber: string;
  quantity: number;
  finish: Lot["finish"];
}
export interface ImportRow {
  line: number;
  input: string;
  entry?: ListEntry;
  card?: Card;
  error?: string;
  id: string;
}
export function parseListLine(input: string, line = 1): ListEntry {
  const clean = input.replace(/\\([*])/g, "$1").trim();
  const match = clean.match(
    /^(\d+)\s+(?:x\s+)?(.+?)\s+\(([a-z0-9]+)\)\s+([^\s*]+)(?:\s+(\*(?:F|E)\*))?\s*$/i,
  );
  if (!match)
    throw Error(
      "Format attendu : 1 Elesh Norn, Mother of Machines (ONE) 10 *F*",
    );
  const quantity = Number(match[1]);
  if (!Number.isSafeInteger(quantity) || quantity < 1)
    throw Error("Quantité entière supérieure à zéro requise");
  return {
    line,
    quantity,
    name: match[2].trim(),
    set: match[3].toLowerCase(),
    collectorNumber: match[4],
    finish:
      match[5]?.toUpperCase() === "*F*"
        ? "foil"
        : match[5]?.toUpperCase() === "*E*"
          ? "etched"
          : "nonfoil",
  };
}
const key = (set: string, num: string) =>
  `${set.toLowerCase()}/${num.toLowerCase()}`;
const normalize = (s: string) =>
  s
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
const namesFor = (card: Card) => [card.name, card.printed_name, ...(card.card_faces ?? []).flatMap(face => [face.name, face.printed_name])].filter((name): name is string => !!name);
export async function prepareList(text: string, options: { cacheCards?: boolean } = {}): Promise<ImportRow[]> {
  const lines = text
    .split(/\r?\n/)
    .map((input, i) => ({ input, line: i + 1 }))
    .filter((l) => l.input.trim());
  if (!lines.length) throw Error("Collez au moins une ligne.");
  if (lines.length > 1000) throw Error("Maximum 1 000 lignes par import.");
  const rows: ImportRow[] = lines.map(({ input, line }) => {
    try {
      return {
        input,
        line,
        entry: parseListLine(input, line),
        id: crypto.randomUUID(),
      };
    } catch (e) {
      return {
        input,
        line,
        error: (e as Error).message,
        id: crypto.randomUUID(),
      };
    }
  });
  const cards = new Map<string, Card>();
  for (const c of await db.cards.toArray())
    if (c.lang === "en") cards.set(key(c.set, c.collector_number), c);
  const identifiers = [
    ...new Map(
      rows
        .filter(
          (r) =>
            r.entry && !cards.has(key(r.entry.set, r.entry.collectorNumber)),
        )
        .map((r) => [
          key(r.entry!.set, r.entry!.collectorNumber),
          { set: r.entry!.set, collector_number: r.entry!.collectorNumber },
        ]),
    ).values(),
  ];
  for (let i = 0; i < identifiers.length; i += 75) {
    try {
      const page = await request<{ data: Card[] }>("/cards/collection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifiers: identifiers.slice(i, i + 75) }),
      });
      if (options.cacheCards !== false) await db.cards.bulkPut(
        page.data.map((c) => ({ ...c, fetchedAt: Date.now() })),
      );
      for (const c of page.data) cards.set(key(c.set, c.collector_number), c);
    } catch (e) {
      for (const row of rows) {
        if (
          row.entry &&
          identifiers
            .slice(i, i + 75)
            .some(
              (id) =>
                key(id.set, id.collector_number) ===
                key(row.entry!.set, row.entry!.collectorNumber),
            )
        )
          row.error = (e as Error).message;
      }
    }
  }
  // Keep the canonical printing, but validate localized names against official translations.
  const languages = [...new Set(["fr", (await prefs()).defaultLanguage].filter(lang => lang !== "en"))];
  const aliases = new Map<string, string[]>();
  const unavailable = new Set<string>();
  const needed = [...new Map(rows.filter(row => {
    if (!row.entry || row.error) return false;
    const card = cards.get(key(row.entry.set, row.entry.collectorNumber));
    return card && !namesFor(card).some(name => normalize(name) === normalize(row.entry!.name));
  }).map(row => [key(row.entry!.set, row.entry!.collectorNumber), row.entry!])).values()];
  const pending: ListEntry[] = [];
  for (const entry of needed) {
    const id = key(entry.set, entry.collectorNumber);
    const cached = await db.cache.get(`import-names:${id}:${languages.join(",")}`);
    if (cached && Date.now() - cached.at < 30 * 86400000 && Array.isArray(cached.data)) aliases.set(id, cached.data as string[]);
    else pending.push(entry);
  }
  for (let start = 0; start < pending.length; start += 10) {
    const batch = pending.slice(start, start + 10);
    const query = `(${batch.map(e => `(set:${e.set} cn:${e.collectorNumber})`).join(" or ")}) (${languages.map(lang => `lang:${lang}`).join(" or ")})`;
    try {
      let next: string | undefined = `/cards/search?q=${encodeURIComponent(query)}&unique=prints&include_multilingual=true`;
      const translated: Card[] = [];
      while (next) {
        const page: { data: Card[]; has_more?: boolean; next_page?: string } = await request(next);
        translated.push(...page.data); next = page.has_more ? page.next_page : undefined;
      }
      for (const entry of batch) {
        const id = key(entry.set, entry.collectorNumber);
        const canonical = cards.get(id)!;
        const names = translated.filter(c => key(c.set, c.collector_number) === id && (!canonical.oracle_id || c.oracle_id === canonical.oracle_id)).flatMap(namesFor);
        aliases.set(id, names);
        await db.cache.put({ id: `import-names:${id}:${languages.join(",")}`, at: Date.now(), data: names });
      }
    } catch {
      for (const entry of batch) unavailable.add(key(entry.set, entry.collectorNumber));
    }
  }
  return rows.map((row) => {
    if (!row.entry || row.error) return row;
    const card = cards.get(key(row.entry.set, row.entry.collectorNumber));
    if (!card)
      return {
        ...row,
        error: "Impression introuvable : vérifiez extension et numéro.",
      };
    if (
      ![...namesFor(card), ...(aliases.get(key(row.entry.set, row.entry.collectorNumber)) ?? [])].some(
        name => normalize(name) === normalize(row.entry!.name),
      )
    )
      return {
        ...row,
        card,
        error: unavailable.has(key(row.entry.set, row.entry.collectorNumber))
          ? `Vérification du nom traduit indisponible. Réessayez en ligne ou utilisez « ${card.name} ».`
          : `Le numéro correspond à « ${card.name} ». Corrigez le nom ou le numéro.`,
      };
    if (!card.finishes.includes(row.entry.finish))
      return {
        ...row,
        card,
        error: `Finition ${row.entry.finish} indisponible pour cette impression.`,
      };
    return { ...row, card };
  });
}
export async function commitList(
  rows: ImportRow[],
  condition: Lot["condition"] = "NM",
) {
  if (!rows.length || rows.some((r) => r.error || !r.entry || !r.card))
    throw Error("Corrigez toutes les lignes avant de confirmer.");
  const { defaultLanguage } = await prefs();
  const now = new Date().toISOString();
  const lots = rows.map(({ id, entry: e, card: c }) =>
    lotSchema.parse({
      id,
      cardId: c!.id,
      oracleId: c!.oracle_id,
      name: c!.name,
      set: c!.set,
      collectorNumber: c!.collector_number,
      language: defaultLanguage,
      finish: e!.finish,
      quantity: e!.quantity,
      trade: 0,
      condition,
      signed: false,
      altered: false,
      notes: "",
      createdAt: now,
      updatedAt: now,
    }),
  );
  await db.transaction("rw", db.lots, async () => {
    for (const lot of lots) {
      if (await db.lots.get(lot.id))
        throw Error(
          "Cet aperçu a déjà été ajouté. Analysez une nouvelle liste pour un nouvel ajout.",
        );
      await saveLot(lot);
    }
  });
  return lots.reduce((n, l) => n + l.quantity, 0);
}
