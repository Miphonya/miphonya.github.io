import "fake-indexeddb/auto";
import { beforeEach, afterEach, it, expect, vi } from "vitest";
import { db, exportBackup, prefs, saveLot, updatePrefs } from "../db";
import { useVisionSession } from "../stores/vision";
import { identifyWithVision } from "../services/vision";
import { resetAppData } from "../services/reset";
const image = "data:image/jpeg;base64,dGVzdA==";
const key = "test-only-fake-personal-key";
beforeEach(async () => {
  useVisionSession.getState().clear();
  await Promise.all([
    db.lots.clear(),
    db.cards.clear(),
    db.sets.clear(),
    db.settings.clear(),
    db.cache.clear(),
  ]);
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
it("la clé est éphémère et ne figure jamais dans une sauvegarde", async () => {
  useVisionSession.getState().setKey(key);
  await updatePrefs({ scannerPrivacySeen: true });
  const backup = await exportBackup();
  expect(JSON.stringify(backup)).not.toContain(key);
  expect("apiKey" in backup.preferences).toBe(false);
  useVisionSession.getState().clear();
  expect(useVisionSession.getState().apiKey).toBe("");
});
it("le mode + utilise uniquement le fournisseur défini et demande une sortie structurée", async () => {
  const fetcher = vi.fn().mockResolvedValue(
    new Response(
      JSON.stringify({
        output: [
          {
            content: [
              {
                type: "output_text",
                text: JSON.stringify({
                  name: "Elesh Norn",
                  set: "one",
                  collectorNumber: "10",
                }),
              },
            ],
          },
        ],
      }),
    ),
  );
  vi.stubGlobal("fetch", fetcher);
  expect(
    await identifyWithVision(
      image,
      key,
      new AbortController().signal,
      "openai",
    ),
  ).toMatchObject({ name: "Elesh Norn" });
  const [url, options] = fetcher.mock.calls[0];
  expect(url).toBe("https://api.openai.com/v1/responses");
  expect(options.headers.Authorization).toBe("Bearer " + key);
  const body = JSON.parse(options.body);
  expect(body.store).toBe(false);
  expect(options.body).not.toContain(key);
  expect(body.input[0].content[1].image_url).toBe(image);
  expect(options.redirect).toBe("error");
});
it("aucun envoi sans clé et aucune fuite de clé dans les erreurs fournisseur", async () => {
  const fetcher = vi.fn().mockResolvedValue(
    new Response(JSON.stringify({ error: { message: key } }), {
      status: 401,
    }),
  );
  vi.stubGlobal("fetch", fetcher);
  await expect(
    identifyWithVision(image, "", new AbortController().signal, "openai"),
  ).rejects.toThrow("clé");
  expect(fetcher).not.toHaveBeenCalled();
  await expect(
    identifyWithVision(image, key, new AbortController().signal, "openai"),
  ).rejects.toThrow("Clé refusée");
});
it("le mode + refuse une proposition structurée invalide", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          output: [
            {
              content: [{ type: "output_text", text: '{"unexpected":true}' }],
            },
          ],
        }),
      ),
    ),
  );
  await expect(
    identifyWithVision(image, key, new AbortController().signal, "openai"),
  ).rejects.toThrow();
  expect(await db.lots.count()).toBe(0);
});
async function seed() {
  const now = new Date().toISOString();
  await saveLot({
    id: crypto.randomUUID(),
    cardId: "printing",
    name: "Card",
    set: "one",
    collectorNumber: "1",
    language: "fr",
    finish: "nonfoil",
    condition: "NM",
    signed: false,
    altered: false,
    quantity: 2,
    trade: 1,
    notes: "",
    createdAt: now,
    updatedAt: now,
  });
  await updatePrefs({
    onboardingCompleted: true,
    scannerPrivacySeen: true,
    defaultLanguage: "de",
  });
  await db.cache.put({ id: "test", at: 0, data: [] });
}
it("la réinitialisation efface les données personnelles et garde le shell et les autres apps", async () => {
  await seed();
  const remove = vi.fn().mockResolvedValue(true);
  vi.stubGlobal("caches", {
    keys: vi
      .fn()
      .mockResolvedValue(["sotm-ocr-v1", "sotm-shell-v2", "another-app"]),
    delete: remove,
  });
  await resetAppData();
  expect(await db.lots.count()).toBe(0);
  expect(await db.settings.count()).toBe(0);
  expect(await db.cache.count()).toBe(0);
  expect(await prefs()).toMatchObject({
    onboardingCompleted: false,
    scannerPrivacySeen: false,
    defaultLanguage: "fr",
  });
  expect(remove.mock.calls).toEqual([["sotm-ocr-v1"]]);
});
it("la suppression reste transactionnelle si une table échoue", async () => {
  await seed();
  vi.spyOn(db.settings, "clear").mockRejectedValue(new Error("storage error"));
  await expect(resetAppData()).rejects.toThrow("storage error");
  expect(await db.lots.count()).toBe(1);
  expect((await prefs()).defaultLanguage).toBe("de");
});
it("Gemini envoie la photo uniquement à son endpoint et la clé uniquement dans son en-tête", async () => {
  const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify({ name: "Elesh Norn", set: "one", collectorNumber: "10" }) }] } }] })));
  vi.stubGlobal("fetch", fetcher);
  expect(await identifyWithVision(image, key, new AbortController().signal, "gemini")).toMatchObject({ name: "Elesh Norn" });
  const [url, options] = fetcher.mock.calls[0];
  expect(url).toBe("https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent");
  expect(url).not.toContain(key);
  expect(options.headers["x-goog-api-key"]).toBe(key);
  expect(options.body).not.toContain(key);
  expect(JSON.parse(options.body).contents[0].parts[1].inlineData).toEqual({ mimeType: "image/jpeg", data: "dGVzdA==" });
  expect(options.credentials).toBe("omit");
  expect(options.redirect).toBe("error");
});
it("changer de fournisseur efface la clé précédente", () => {
  useVisionSession.getState().setKey(key);
  useVisionSession.getState().setProvider("openai");
  expect(useVisionSession.getState().apiKey).toBe("");
  expect(useVisionSession.getState().provider).toBe("openai");
});
