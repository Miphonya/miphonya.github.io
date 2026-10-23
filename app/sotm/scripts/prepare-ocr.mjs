import { mkdir, copyFile, chmod } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
const root = fileURLToPath(new URL("../", import.meta.url));
const target = path.join(root, "public/app/sotm/ocr");
await mkdir(target, { recursive: true });
const files = [
  ["tesseract.js/dist/worker.min.js", "worker.min.js"],
  ...[
    "tesseract-core",
    "tesseract-core-simd",
    "tesseract-core-lstm",
    "tesseract-core-simd-lstm",
  ].map((n) => [`tesseract.js-core/${n}.wasm.js`, `${n}.wasm.js`]),
  ...["eng", "fra"].map((lang) => [
    `@tesseract.js-data/${lang}/4.0.0_best_int/${lang}.traineddata.gz`,
    `${lang}.traineddata.gz`,
  ]),
  ["tesseract.js/LICENSE.md", "LICENSE-tesseract.txt"],
  ["tesseract.js-core/LICENSE", "LICENSE-core.txt"],
];
for (const [source, dest] of files) {
  await copyFile(
    path.join(root, "node_modules", source),
    path.join(target, dest),
  );
  await chmod(path.join(target, dest), 0o644);
}
console.log(
  "OCR local prêt : worker, WebAssembly et modèles français/anglais.",
);
