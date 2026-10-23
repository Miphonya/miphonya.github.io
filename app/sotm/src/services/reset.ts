import { db } from "../db";
export async function resetAppData() {
  await db.transaction(
    "rw",
    [db.lots, db.decks, db.cards, db.sets, db.settings, db.cache],
    async () => {
      await Promise.all([
        db.lots.clear(),
        db.decks.clear(),
        db.cards.clear(),
        db.sets.clear(),
        db.settings.clear(),
        db.cache.clear(),
      ]);
    },
  );
  // Keep the application shell so that onboarding still works offline.
  if (typeof caches !== "undefined") {
    try {
      const keys = await caches.keys();
      await Promise.allSettled(
        keys
          .filter((k) => k.startsWith("sotm-ocr-"))
          .map((k) => caches.delete(k)),
      );
    } catch {
      /* Static OCR cache cleanup is best effort; personal data was cleared atomically. */
    }
  }
}
