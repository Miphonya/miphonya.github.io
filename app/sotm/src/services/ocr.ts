import { extractCardHints } from "./ocrHints";
import type { Worker } from "tesseract.js";
export interface OCRProgress {
  label: string;
  progress: number;
}
const messages: Record<string, string> = {
  "loading tesseract core": "Préparation du moteur OCR",
  "initializing tesseract": "Initialisation",
  "loading language traineddata": "Chargement français / anglais",
  "initializing api": "Préparation de la lecture",
  "recognizing text": "Lecture de la carte",
};
export async function recognizeCard(
  image: string,
  onProgress: (p: OCRProgress) => void,
  signal: AbortSignal,
) {
  const { createWorker, OEM, PSM } = await import("tesseract.js");
  const cancelledError = () =>
    new DOMException("Lecture annulée", "AbortError");
  if (signal.aborted) throw cancelledError();
  let worker: Worker | undefined;
  let rejectCancellation!: (reason: Error) => void;
  const cancellation = new Promise<never>((_, reject) => {
    rejectCancellation = reject;
  });
  const abort = () => {
    rejectCancellation(cancelledError());
    void worker?.terminate().catch(() => {});
  };
  signal.addEventListener("abort", abort, { once: true });
  try {
    const base = new URL(import.meta.env.BASE_URL + "app/sotm/ocr/", document.baseURI)
      .href;
    worker = await Promise.race([
      createWorker(["eng", "fra"], OEM.LSTM_ONLY, {
        workerPath: base + "worker.min.js",
        corePath: base,
        langPath: base,
        workerBlobURL: false,
        cacheMethod: "none",
        logger: (m) => {
          if (!signal.aborted)
            onProgress({
              label: messages[m.status] ?? "Préparation OCR",
              progress: Number.isFinite(m.progress)
                ? Math.round(m.progress * 100)
                : 0,
            });
        },
      }).then((w) => {
        if (signal.aborted) {
          void w.terminate().catch(() => {});
          throw cancelledError();
        }
        return w;
      }),
      cancellation,
    ]);
    await Promise.race([
      worker.setParameters({
        tessedit_pageseg_mode: PSM.AUTO,
        preserve_interword_spaces: "1",
      }),
      cancellation,
    ]);
    const { data } = await Promise.race([
      worker.recognize(image),
      cancellation,
    ]);
    return extractCardHints(data.text, data.confidence);
  } finally {
    signal.removeEventListener("abort", abort);
    await worker?.terminate().catch(() => {});
  }
}
