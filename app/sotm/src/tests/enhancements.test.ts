import "fake-indexeddb/auto";
import { beforeEach, afterEach, it, expect, vi } from "vitest";
import { db, prefs, updatePrefs, importBackup } from "../db";
import { cardTypeLine, defaults, type Card, type ExchangeRate } from "../schemas/models";
import { money, scryfallPriceProvider } from "../services/pricing";
import { refreshExchangeRate } from "../services/exchange";
import { parseListLine, prepareList, commitList } from "../services/listImport";
const card: Card = {
  id: "tamiyo",
  name: "The Tale of Tamiyo",
  set: "dsk",
  set_name: "Duskmourn",
  collector_number: "75",
  rarity: "rare",
  lang: "en",
  finishes: ["foil", "nonfoil"],
  type_line: "Enchantment",
  prices: {
    eur: "1.00",
    eur_foil: "2.00",
    usd: "1.50",
    usd_foil: "3.00",
    usd_etched: "4.00",
  },
};
const rate: ExchangeRate = {
  value: 0.925,
  date: "2026-10-22",
  source: "Test source",
  fetchedAt: new Date().toISOString(),
};
beforeEach(async () => {
  await Promise.all([
    db.lots.clear(),
    db.cards.clear(),
    db.settings.clear(),
    db.cache.clear(),
  ]);
});
afterEach(() => vi.unstubAllGlobals());
it("adapte les anciennes préférences et sauvegardes sans perdre les lots", async () => {
  await db.settings.put({
    id: "preferences",
    value: {
      theme: "dark",
      tracked: ["dsk"],
      metadataDays: 7,
      priceHours: 24,
    } as typeof defaults,
  });
  expect(await prefs()).toMatchObject({
    currency: "CHF",
    onlyTracked: false,
    exchangeRate: null,
    tracked: ["dsk"],
  });
  await importBackup(
    {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      lots: [],
      preferences: {
        theme: "light",
        tracked: ["one"],
        metadataDays: 7,
        priceHours: 24,
      },
    },
    true,
  );
  expect(await prefs()).toMatchObject({ currency: "CHF", theme: "light" });
});
it("mémorise le suivi et la devise sans écraser les changements concurrents", async () => {
  await Promise.all([
    updatePrefs({ onlyTracked: true }),
    updatePrefs({ currency: "USD" }),
  ]);
  expect(await prefs()).toMatchObject({ onlyTracked: true, currency: "USD" });
});
it("convertit les euros en CHF et utilise les véritables prix USD", () => {
  expect(scryfallPriceProvider.quote(card, "foil", "CHF", rate).amount).toBe(
    1.85,
  );
  expect(scryfallPriceProvider.quote(card, "foil", "USD").amount).toBe(3);
  expect(scryfallPriceProvider.quote(card, "etched", "USD").amount).toBe(4);
  expect(scryfallPriceProvider.quote(card, "foil", "EUR").amount).toBe(2);
  expect(money(2, "CHF")).toContain("CHF");
  expect(money(2, "USD")).toContain("USD");
});
it("ne fabrique pas de prix ni de taux", () => {
  expect(scryfallPriceProvider.quote(card, "nonfoil", "CHF").amount).toBeNull();
  expect(
    scryfallPriceProvider.quote(
      { ...card, prices: { eur: null, eur_foil: null } },
      "foil",
      "USD",
    ).amount,
  ).toBeNull();
  expect(
    scryfallPriceProvider.quote(card, "etched", "CHF", rate).amount,
  ).toBeNull();
  expect(
    scryfallPriceProvider.quote(card, "nonfoil", "CHF", { ...rate, value: NaN })
      .amount,
  ).toBeNull();
});
it("charge, date et conserve un taux local utilisable hors ligne", async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValue(
      new Response(JSON.stringify({ date: "2026-10-22", eur: { chf: 0.925 } })),
    );
  vi.stubGlobal("fetch", fetcher);
  await refreshExchangeRate();
  expect((await prefs()).exchangeRate).toMatchObject({
    value: 0.925,
    date: "2026-10-22",
  });
  await refreshExchangeRate();
  expect(fetcher).toHaveBeenCalledTimes(1);
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
  await expect(refreshExchangeRate(true)).rejects.toThrow();
  expect((await prefs()).exchangeRate?.value).toBe(0.925);
});
it("refuse un taux invalide sans remplacer le dernier taux fiable", async () => {
  await updatePrefs({ exchangeRate: rate });
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ date: "bad", eur: { chf: -1 } })),
      ),
  );
  await expect(refreshExchangeRate(true)).rejects.toThrow();
  expect((await prefs()).exchangeRate).toEqual(rate);
});
it("lit le format demandé, les marqueurs échappés et les différentes finitions", () => {
  expect(parseListLine("1 The Tale of Tamiyo (DSK) 75 *F*")).toMatchObject({
    name: card.name,
    set: "dsk",
    collectorNumber: "75",
    quantity: 1,
    finish: "foil",
  });
  expect(
    parseListLine(String.raw`2 The Tale of Tamiyo (DSK) 75 \*F\*`).finish,
  ).toBe("foil");
  expect(parseListLine("2 The Tale of Tamiyo (DSK) 75").finish).toBe("nonfoil");
  expect(parseListLine("1 Card (ABC) 4a *E*").finish).toBe("etched");
  for (const s of [
    "0 Card (DSK) 75",
    "-1 Card (DSK) 75",
    "1.5 Card (DSK) 75",
    "Card",
    "1 Card (DSK) 75 *X*",
  ])
    expect(() => parseListLine(s)).toThrow();
});
it("vérifie les impressions en un appel groupé et prévisualise sans modifier la collection", async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValue(new Response(JSON.stringify({ data: [card] })));
  vi.stubGlobal("fetch", fetcher);
  const rows = await prepareList(
    "1 The Tale of Tamiyo (DSK) 75 *F*\n2 The Tale of Tamiyo (DSK) 75",
  );
  expect(fetcher).toHaveBeenCalledTimes(1);
  const options = fetcher.mock.calls[0][1] as RequestInit;
  expect(JSON.parse(options.body as string).identifiers).toHaveLength(1);
  expect(rows.every((r) => !r.error)).toBe(true);
  expect(await db.lots.count()).toBe(0);
  expect(await commitList(rows, "EX")).toBe(3);
  expect(await db.lots.count()).toBe(2);
  expect(
    (await db.lots.toArray()).every(
      (l) => l.condition === "EX" && l.trade === 0,
    ),
  ).toBe(true);
  await expect(commitList(rows)).rejects.toThrow("déjà");
  expect(await db.lots.count()).toBe(2);
});
it("refuse un nom incompatible, une finition indisponible et un import partiel", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: [] }))));
  await db.cards.put(card);
  const rows = await prepareList(
    "1 Wrong name (DSK) 75\n1 The Tale of Tamiyo (DSK) 75 *E*\nnot valid",
  );
  expect(rows.every((r) => r.error)).toBe(true);
  await expect(commitList(rows)).rejects.toThrow();
  expect(await db.lots.count()).toBe(0);
});
it("fonctionne depuis le catalogue local sans réseau et garde les numéros de ligne", async () => {
  await db.cards.put(card);
  const fetcher = vi.fn();
  vi.stubGlobal("fetch", fetcher);
  const rows = await prepareList("\n\n1 The Tale of Tamiyo (DSK) 75 *F*\n");
  expect(rows[0].line).toBe(3);
  expect(rows[0].card?.id).toBe("tamiyo");
  expect(fetcher).not.toHaveBeenCalled();
});

it("accepte les types portés par les faces réversibles de Scryfall", () => {
  const reversible: Card = { ...card, type_line: undefined, card_faces: [{ name: "Blightsteel Colossus", type_line: "Artifact Creature — Phyrexian Golem" }, { name: "Blightsteel Colossus" }] };
  expect(cardTypeLine(reversible).toLowerCase()).toContain("golem");
  expect(cardTypeLine({ ...card, type_line: undefined })).toBe("");
  expect(cardTypeLine(card)).toBe("Enchantment");
});

it("accepte le nom français officiel sans abandonner la validation du nom et met la traduction en cache", async () => {
  const english = { ...card, id: "duelist", oracle_id: "oracle-duelist", name: "Duelist of Deep Faith", set: "one", collector_number: "9" };
  const french = { ...english, id: "duelist-fr", lang: "fr", printed_name: "Duelliste de vive foi" };
  await db.cards.put(english);
  const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: [french] })));
  vi.stubGlobal("fetch", fetcher);
  const rows = await prepareList("1 Duelliste de vive foi (ONE) 9");
  expect(rows[0].error).toBeUndefined(); expect(rows[0].card?.id).toBe("duelist");
  expect(String(fetcher.mock.calls[0][0])).toContain("include_multilingual=true");
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Hors ligne")));
  expect((await prepareList("1 Duelliste de vive foi (ONE) 9"))[0].error).toBeUndefined();
  expect((await prepareList("1 Une mauvaise carte (ONE) 9"))[0].error).toContain("Le numéro correspond");
});
it("n’accepte pas la traduction d’une autre carte ou d’un autre numéro", async () => {
  const english = { ...card, id: "duelist", oracle_id: "oracle-duelist", name: "Duelist of Deep Faith", set: "one", collector_number: "9" };
  await db.cards.put(english);
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: [{ ...english, oracle_id: "autre-oracle", printed_name: "Mauvaise traduction", lang: "fr" }] }))));
  expect((await prepareList("1 Mauvaise traduction (ONE) 9"))[0].error).toContain("Le numéro correspond");
});
