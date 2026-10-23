import "fake-indexeddb/auto";
import { beforeEach, it, expect } from "vitest";
import { extractCardHints, photoQuery } from "../services/ocrHints";
import { db, prefs, updatePrefs, exportBackup, importBackup } from "../db";
beforeEach(async () => {
  await Promise.all([db.lots.clear(), db.settings.clear()]);
});
it("extrait un nom anglais, un numéro de collection et un code d’extension", () => {
  const hint = extractCardHints(
    "Elesh Norn, Mother of Machines 4WW\nLegendary Creature — Phyrexian Praetor\nVigilance\n010/271 M\nONE • EN\nCopyright Wizards",
    88,
  );
  expect(hint).toMatchObject({
    name: "Elesh Norn, Mother of Machines",
    collectorNumber: "010",
    set: "one",
    confidence: 88,
  });
  expect(photoQuery(hint.name, hint.set, hint.collectorNumber)).toBe(
    'name:"Elesh Norn, Mother of Machines" set:one cn:10',
  );
});
it("conserve les accents français et n’invente pas de numéro absent", () => {
  const hint = extractCardHints(
    "Élesh Norn, Mère des machines\nCréature légendaire\nVigilance",
    NaN,
  );
  expect(hint.name).toBe("Élesh Norn, Mère des machines");
  expect(hint.collectorNumber).toBe("");
  expect(hint.set).toBe("");
  expect(hint.confidence).toBe(0);
});
it("une image sans texte donne des champs vides et n’ajoute rien", async () => {
  expect(extractCardHints("", 0)).toMatchObject({
    name: "",
    set: "",
    collectorNumber: "",
  });
  expect(await db.lots.count()).toBe(0);
});
it("nettoie la recherche OCR sans injecter des filtres depuis les champs de set/numéro", () => {
  expect(() => photoQuery("", "one", "10")).toThrow();
  expect(() => photoQuery("Card", "one or set:dsk", "1")).toThrow();
  expect(() => photoQuery("Card", "one", "1 or 2")).toThrow();
  expect(photoQuery('Elesh "Norn"', "", "")).toBe('name:"Elesh Norn"');
});
it("mémorise la dernière méthode et la sauvegarde sans modifier les lots", async () => {
  expect((await prefs()).addMethod).toBe("name");
  await updatePrefs({ addMethod: "photo", onboardingCompleted: true });
  expect((await prefs()).addMethod).toBe("photo");
  const backup = await exportBackup();
  await updatePrefs({ addMethod: "batch" });
  await importBackup(backup, true);
  expect((await prefs()).addMethod).toBe("photo");
  expect(await db.lots.count()).toBe(0);
});
