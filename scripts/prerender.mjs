#!/usr/bin/env node
/**
 * After `vite build` and `vite build --ssr src/entry-server.tsx --outDir dist-ssr` (npm run build): writes each page
 * as finished HTML into dist/ from the client's dist/index.html, so the pages read without JavaScript, search engines
 * get both languages, and the client only hydrates.
 *
 *   dist/index.html, dist/zh/index.html                      the homepage   <html lang="en"> / <html lang="zh-CN">
 *   dist/<slug>/index.html, dist/zh/<slug>/index.html        every other page (src/content/site.ts)
 *   dist/docs/…, dist/legal/<id>/… (and under zh/)           the docs' guides and the legal documents (routes.ts)
 *   dist/404.html                                            both languages, noindex (GitHub Pages answers every
 *                                                            address it has no file for with it, status 404); its
 *                                                            first script sends an old tokensbeat.com address where
 *                                                            it lives now (seo/moved.ts)
 *   dist/robots.txt, dist/sitemap.xml                        (no sitemap in a noindex preview build: src/seo/head.ts)
 *   dist/status.json                                         the status page's snapshot (below)
 *
 * Each page gets its head (src/seo/head.ts: title, description, canonical, hreflang, Open Graph, JSON-LD) between the
 * template's <!--head--> markers, and a preload for the two typefaces the first screen is set in. Then every page gets
 * the policy tags (src/seo/policy.ts) right after its <meta charset>, with the hashes of every inline script written
 * above: the host sends no policy header, so the page carries it.
 *
 * status.json: scripts/status-snapshot.mjs (the API gateway's and Aha's public health, probed now, with the time; run
 * it alone on a schedule to keep it fresh). HOME_STATUS_PROBE=0 skips it (no snapshot: the status page says so).
 *
 *   node scripts/prerender.mjs [--dist dist] [--ssr dist-ssr] [--keep-ssr]
 */
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import vm from "node:vm";
import { CHARSET_META, inlineScriptHashes } from "./csp.mjs";
import { writeStatusSnapshot } from "./status-snapshot.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
/** @param {string} name @param {string} fallback */
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? path.resolve(args[i + 1]) : fallback;
};
const DIST = opt("dist", path.join(HERE, "..", "dist"));
const SSR = opt("ssr", path.join(HERE, "..", "dist-ssr"));

const { pages, files, assemble, policyTags, INDEXABLE, SITE_URL, API_ORIGIN } = await import(pathToFileURL(path.join(SSR, "entry-server.js")).href);
console.log(`prerender: ${SITE_URL}${INDEXABLE ? "" : " (noindex)"}, live checks on ${API_ORIGIN || "this origin"}`);
const template = await readFile(path.join(DIST, "index.html"), "utf8");

// The fonts the first screen is drawn in: the display serif (the headline) and the sans (the words), Latin only.
const assets = await readdir(path.join(DIST, "assets"));
const preload = [/^instrument-serif-latin-400-normal-.*\.woff2$/, /^inter-tight-latin-wght-normal-.*\.woff2$/]
  .map((re) => assets.find((f) => re.test(f)))
  .filter(Boolean)
  .map((f) => `/assets/${f}`);
if (preload.length !== 2) console.warn("prerender: a first-screen font was not found in assets/; no preload for it");

for (const page of pages()) {
  const html = assemble(template, { ...page, body: page.render(), preload });
  const out = path.join(DIST, page.file);
  await mkdir(path.dirname(out), { recursive: true });
  await writeFile(out, html);
  console.log(`prerendered ${path.relative(process.cwd(), out)}`);
}
for (const [name, make] of Object.entries(files)) {
  await writeFile(path.join(DIST, name), make());
  console.log(`wrote ${name}`);
}
if (!("sitemap.xml" in files)) await rm(path.join(DIST, "sitemap.xml"), { force: true });

// The 404 page's first script, as built: it must send an old address where it lives now (src/seo/moved.ts), else
// the build fails here rather than on tokensbeat.com.
const notFound = await readFile(path.join(DIST, "404.html"), "utf8");
const moved = /<script>(\(function\(\)\{try\{var to=[\s\S]*?)<\/script>/.exec(notFound)?.[1];
if (!moved) throw new Error("prerender: 404.html has no redirect script");
/** @type {[string, string | null][]} */
const MOVED_CHECKS = [
  ["/keys?x=1#y", "https://console.tokensbeat.com/keys?x=1#y"],
  ["/admin/users", "https://admin.tokensbeat.com/admin/users"],
  ["/Pricing", "/pricing/"],
  ["/no-such-page", null],
];
for (const [from, want] of MOVED_CHECKS) {
  const url = new URL(from, "https://tokensbeat.com");
  /** @type {string | null} */
  let went = null;
  const location = { pathname: url.pathname, search: url.search, hash: url.hash, replace: (/** @type {string} */ to) => (went = to) };
  vm.runInNewContext(moved, { window: { location }, document: { documentElement: { style: {} } } });
  if (went !== want) throw new Error(`prerender: the 404 page's redirect sends ${from} to ${went}, not ${want}`);
}

// Every HTML file's inline scripts (the theme script, the redirect script): their hashes go into the policy, which
// every page then carries right after its <meta charset> (before any script, so it covers them all).
/** @param {string} dir @returns {Promise<string[]>} */
async function htmlFiles(dir) {
  /** @type {string[]} */
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await htmlFiles(p)));
    else if (entry.name.endsWith(".html")) out.push(p);
  }
  return out;
}
const html = await htmlFiles(DIST);
const hashes = new Set();
for (const file of html) for (const h of inlineScriptHashes(await readFile(file, "utf8"))) hashes.add(h);
const tags = policyTags([...hashes].sort());
for (const file of html) {
  const page = await readFile(file, "utf8");
  if (page.split(CHARSET_META).length !== 2) throw new Error(`prerender: ${path.relative(DIST, file)} has not exactly one ${CHARSET_META}`);
  await writeFile(file, page.replace(CHARSET_META, () => `${CHARSET_META}\n    ${tags}`));
}
console.log(`wrote the policy into ${html.length} pages (${hashes.size} inline script hashes)`);

/** One public health endpoint, probed once: ok true/false by its answer, null when nothing answered in time. */
if (process.env.HOME_STATUS_PROBE !== "0") {
  const { probes } = await writeStatusSnapshot(DIST);
  console.log(`wrote status.json (${Object.entries(probes).map(([id, p]) => `${id} ${p.ok}`).join(", ")})`);
} else {
  await rm(path.join(DIST, "status.json"), { force: true });
}

if (!args.includes("--keep-ssr")) await rm(SSR, { recursive: true, force: true });
