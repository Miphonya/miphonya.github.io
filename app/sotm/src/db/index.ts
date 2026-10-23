import Dexie, { type Table } from "dexie";
import {
  backupSchema,
  defaults,
  preferencesSchema,
  lotSchema,
  type Backup,
  type Card,
  type Lot,
  type Preferences,
  type SetInfo,
} from "../schemas/models";
import { type Deck } from "../schemas/decks";
class VaultDB extends Dexie {
  lots!: Table<Lot, string>;
  decks!: Table<Deck, string>;
  cards!: Table<Card, string>;
  sets!: Table<SetInfo, string>;
  settings!: Table<{ id: string; value: Preferences }, string>;
  cache!: Table<{ id: string; at: number; data: unknown }, string>;
  constructor() {
    super("phyrexian-vault");
    this.version(1).stores({
      lots: "id,cardId,set,updatedAt",
      cards: "id,set",
      sets: "code,set_type",
      settings: "id",
      cache: "id",
    });
    this.version(2).stores({ decks: "id,format,updatedAt" });
  }
}
export const db = new VaultDB();
export async function prefs() {
  return preferencesSchema.parse(
    (await db.settings.get("preferences"))?.value ?? defaults,
  );
}
export async function savePrefs(value: Preferences) {
  await db.settings.put({
    id: "preferences",
    value: preferencesSchema.parse(value),
  });
}
export async function updatePrefs(changes: Partial<Preferences>) {
  await db.transaction("rw", db.settings, async () => {
    await savePrefs({ ...(await prefs()), ...changes });
  });
}
export async function saveLot(lot: Lot) {
  await db.lots.put(lotSchema.parse(lot));
}
export async function exportBackup(): Promise<Backup> {
  return backupSchema.parse({
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    lots: await db.lots.toArray(),
    decks: await db.decks.toArray(),
    preferences: await prefs(),
  });
}
export async function importBackup(input: unknown, replace = false) {
  const b = backupSchema.parse(input);
  await db.transaction("rw", db.lots, db.decks, db.settings, async () => {
    if (replace) { await db.lots.clear(); await db.decks.clear(); }
    for (const deck of b.decks) {
      const oldDeck = await db.decks.get(deck.id);
      if (!oldDeck || replace || deck.updatedAt > oldDeck.updatedAt) await db.decks.put(deck);
    }
    for (const l of b.lots) {
      const old = await db.lots.get(l.id);
      if (!old || replace || l.updatedAt > old.updatedAt) await db.lots.put(l);
    }
    const old = await prefs();
    await savePrefs(
      replace
        ? {
            ...b.preferences,
            onboardingCompleted:
              old.onboardingCompleted || b.preferences.onboardingCompleted,
          }
        : {
            ...old,
            tracked: [...new Set([...old.tracked, ...b.preferences.tracked])],
          },
    );
  });
}
export async function clearCatalog() {
  await db.transaction("rw", db.cards, db.sets, db.cache, async () => {
    await db.cards.clear();
    await db.sets.clear();
    await db.cache.clear();
  });
}
