/// <reference types="vitest/config" />
import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { vendorNotices } from "./scripts/vendor-notices.mjs";

// The homepage: a plain Vite + React app, prerendered. `npm run build` makes the client (dist/), then the server
// build of src/entry-server.tsx (dist-ssr/), then scripts/prerender.mjs writes every page (and 404.html, robots.txt,
// sitemap.xml) into dist/ as finished HTML that the client hydrates, each with the pages' policy tags. Build-time settings:
// VITE_HOME_SITE_URL (the public origin, https://tokensbeat.com by default), VITE_HOME_API_ORIGIN (where the live
// checks go; unset: this origin) and VITE_HOME_NOINDEX=1 (a preview).
export default defineConfig({
  plugins: [react(), vendorNotices(path.resolve(import.meta.dirname, "src"))],
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } },
  // The legal pages read legal/*.md (src/docs/legal.ts), inside this folder: the dev server may serve them.
  server: { host: "127.0.0.1", port: 5330, strictPort: true },
  preview: { host: "127.0.0.1", port: 4331, strictPort: true },
  // Fonts are files, never data: URLs in the stylesheet (the pages' policy allows fonts from this origin only).
  build: { sourcemap: false, assetsInlineLimit: (file) => (/\.(woff2?|ttf|otf)$/.test(file) ? false : undefined) },
  test: {
    // At most 8 workers: on a many-core machine Vitest's default (one per CPU) starved the jsdom pages past their
    // findBy waits.
    maxWorkers: 8,
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    css: false,
    restoreMocks: true,
  },
});
