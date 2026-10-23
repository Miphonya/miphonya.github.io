import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";
export default defineConfig({
  root: fileURLToPath(new URL("../../", import.meta.url)),
  base: "./",
  cacheDir: fileURLToPath(new URL("./node_modules/.vite", import.meta.url)),
  publicDir: fileURLToPath(new URL("./public", import.meta.url)),
  // The HTML entry is two levels above the package that owns React.
  resolve: { alias: {
    react: fileURLToPath(new URL("./node_modules/react", import.meta.url)),
    "react-dom": fileURLToPath(new URL("./node_modules/react-dom", import.meta.url)),
  } },
  plugins: [react(), tailwind()],
  build: {
    outDir: fileURLToPath(new URL("./dist", import.meta.url)),
    emptyOutDir: true,
    assetsDir: "app/sotm/assets",
  },
});
