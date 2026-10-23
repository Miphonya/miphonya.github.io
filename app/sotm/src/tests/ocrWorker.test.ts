import { it, expect, vi, beforeEach, afterEach } from "vitest";
const mocks = vi.hoisted(() => ({ createWorker: vi.fn() }));
vi.mock("tesseract.js", () => ({
  createWorker: mocks.createWorker,
  OEM: { LSTM_ONLY: 1 },
  PSM: { AUTO: "3" },
}));
import { recognizeCard } from "../services/ocr";
beforeEach(() => {
  mocks.createWorker.mockReset();
  vi.stubEnv("BASE_URL", "./");
  vi.stubGlobal("document", {
    baseURI: "https://example.com/PhyrexiaCodex/#/add",
  });
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
it("le moteur utilise des ressources de la même origine sous le chemin du dépôt et se termine", async () => {
  const worker = {
    setParameters: vi.fn().mockResolvedValue({}),
    recognize: vi.fn().mockResolvedValue({
      data: { text: "Elesh Norn\n010/271 M\nONE • EN", confidence: 90 },
    }),
    terminate: vi.fn().mockResolvedValue(undefined),
  };
  mocks.createWorker.mockResolvedValue(worker);
  expect(
    (
      await recognizeCard(
        "data:image/jpeg;base64,test",
        () => {},
        new AbortController().signal,
      )
    ).name,
  ).toBe("Elesh Norn");
  const options = mocks.createWorker.mock.calls[0][2];
  expect(options.workerPath).toBe(
    "https://example.com/PhyrexiaCodex/app/sotm/ocr/worker.min.js",
  );
  expect(options.langPath).toBe("https://example.com/PhyrexiaCodex/app/sotm/ocr/");
  expect(worker.terminate).toHaveBeenCalled();
});
it("une annulation interrompt une lecture en attente et libère le worker", async () => {
  const worker = {
    setParameters: vi.fn().mockResolvedValue({}),
    recognize: vi.fn().mockReturnValue(new Promise(() => {})),
    terminate: vi.fn().mockResolvedValue(undefined),
  };
  mocks.createWorker.mockResolvedValue(worker);
  const controller = new AbortController();
  const operation = recognizeCard("image", () => {}, controller.signal);
  const assertion = expect(operation).rejects.toMatchObject({
    name: "AbortError",
  });
  await vi.waitFor(() => expect(worker.recognize).toHaveBeenCalled());
  controller.abort();
  await assertion;
  expect(worker.terminate).toHaveBeenCalled();
});
it("un signal déjà annulé ne démarre pas de worker", async () => {
  const controller = new AbortController();
  controller.abort();
  await expect(
    recognizeCard("image", () => {}, controller.signal),
  ).rejects.toMatchObject({ name: "AbortError" });
  expect(mocks.createWorker).not.toHaveBeenCalled();
});
