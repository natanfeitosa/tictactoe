import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";
import { resolve } from "node:path";

const frontRoot = fileURLToPath(new URL("./front", import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  root: frontRoot,
  plugins: [vue(), vueDevTools()],
  resolve: {
    alias: {
      "@": frontRoot,
    },
  },
  build: {
    rollupOptions: {
      input: Array.from(new Bun.Glob(resolve(frontRoot, "*.html")).scanSync()),
      output: { dir: resolve(frontRoot, "../dist/front") },
    },
    emptyOutDir: true,
  },
});
