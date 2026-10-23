import "fake-indexeddb/auto";
import { beforeEach, it, expect } from "vitest";
import { db, prefs, updatePrefs, importBackup, exportBackup } from "../db";
import { type Card } from "../schemas/models";
import { compareCollectorNumbers } from "../services/cardSort";
import { prepareList, commitList } from "../services/listImport";
const card: Card = {
  id: "elesh",
  name: "Elesh Norn, Mother of Machines",
  set: "one",
  set_name: "ONE",
  collector_number: "10",
  rarity: "mythic",
  lang: "en",
  finishes: ["foil", "nonfoil"],
  type_line: "Creature",
  prices: { eur: "1", eur_foil: "2" },
};
beforeEach(async () => {
  await Promise.all([
    db.lots.clear(),
    db.cards.clear(),
    db.settings.clear(),
    db.cache.clear(),
  ]);
});
it("ordonne naturellement les numéros y compris variantes et zéros initiaux", () => {
  const cards = ["100", "10a", "2", "10", "1", "010b"].map((n, i) => ({
    ...card,
    id: String(i),
    collector_number: n,
  }));
  expect(
    cards.sort(compareCollectorNumbers).map((c) => c.collector_number),
  ).toEqual(["1", "2", "10", "10a", "010b", "100"]);
});
it("nouvelle installation : français et onboarding non terminé", async () => {
  expect(await prefs()).toMatchObject({
    defaultLanguage: "fr",
    onboardingCompleted: false,
  });
});
it("conserve les choix et la fin de l’onboarding dans la sauvegarde", async () => {
  await updatePrefs({
    defaultLanguage: "de",
    theme: "light",
    currency: "EUR",
    onboardingCompleted: true,
  });
  expect((await exportBackup()).preferences).toMatchObject({
    defaultLanguage: "de",
    theme: "light",
    currency: "EUR",
    onboardingCompleted: true,
  });
});
it("une ancienne sauvegarde ne relance pas l’onboarding déjà terminé", async () => {
  await updatePrefs({ onboardingCompleted: true });
  const old = {
    theme: "dark",
    currency: "CHF",
    tracked: [],
    metadataDays: 7,
    priceHours: 24,
  };
  await importBackup(
    {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      lots: [],
      preferences: old,
    },
    true,
  );
  expect(await prefs()).toMatchObject({
    defaultLanguage: "fr",
    onboardingCompleted: true,
  });
});
it("la langue par défaut s’applique à la liste sans modifier les lots précédents", async () => {
  await db.cards.put(card);
  await updatePrefs({ defaultLanguage: "de" });
  await commitList(
    await prepareList("1 Elesh Norn, Mother of Machines (ONE) 10 *F*"),
  );
  await updatePrefs({ defaultLanguage: "fr" });
  await commitList(
    await prepareList("2 Elesh Norn, Mother of Machines (ONE) 10"),
  );
  const lots = await db.lots.toArray();
  expect(lots.find((l) => l.finish === "foil")?.language).toBe("de");
  expect(lots.find((l) => l.finish === "nonfoil")?.language).toBe("fr");
  expect(lots.reduce((n, l) => n + l.quantity, 0)).toBe(3);
});
