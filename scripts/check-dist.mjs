#!/usr/bin/env node
/**
 * Checks a build (dist/) before it is published: the build for SITE_ORIGIN, calling API_ORIGIN (both https origins
 * without a path, the values the build was given as VITE_HOME_SITE_URL and VITE_HOME_API_ORIGIN).
 *   - the pages the site cannot do without: both homepages, the 404 page, the docs, the legal documents, robots.txt;
 *   - no source maps (vite.config.ts build.sourcemap stays false);
 *   - the canonical address is SITE_ORIGIN's;
 *   - every page carries the policy first in its head (src/seo/policy.ts): before any script, with API_ORIGIN in its
 *     connect-src and every inline script of the page allowed by its hash;
 *   - the 404 page has the script that sends old addresses where they live now (src/seo/moved.ts);
 *   - search engines: a build for https://tokensbeat.com is indexable (only the 404 page and the operators'
 *     commitment say noindex; robots.txt names the sitemap); any other origin is a preview: every page says noindex,
 *     and there is no sitemap;
 *   - no status.json (the publishing workflow writes it after this check) and no other host's config file;
 *   - no reseller named in any text file (scripts/check-public-text.mjs).
 *
 *   SITE_ORIGIN=https://… API_ORIGIN=https://… node scripts/check-dist.mjs [--dist dist]
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { namedLines, publicFiles } from "./check-public-text.mjs";
import { CHARSET_META, inlineScriptHashes } from "./csp.mjs";

const PRODUCTION = "https://tokensbeat.com";
const ORIGIN = /^https:\/\/[a-z0-9.-]+(:[0-9]+)?$/;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const i = process.argv.indexOf("--dist");
const dist = path.resolve(i >= 0 ? (process.argv[i + 1] ?? "") : path.join(root, "dist"));

/** @param {string} why @returns {never} */
function die(why) {
  console.error(`check-dist: ${why}`);
  process.exit(1);
}

const site = process.env.SITE_ORIGIN ?? "";
const api = process.env.API_ORIGIN ?? "";
if (!ORIGIN.test(site)) die(`SITE_ORIGIN must be an https origin without a path, not '${site}'`);
if (!ORIGIN.test(api)) die(`API_ORIGIN must be an https origin without a path, not '${api}'`);
if (!statSync(dist, { throwIfNoEntry: false })?.isDirectory()) die(`no build at ${dist}`);

/** @param {string} dir @returns {string[]} the files under `dir`, relative, with "/" */
function files(dir) {
  return readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter((e) => e.isFile())
    .map((e) => path.relative(dist, path.join(e.parentPath, e.name)).split(path.sep).join("/"))
    .sort();
}
const all = files(dist);
const read = (/** @type {string} */ f) => readFileSync(path.join(dist, f), "utf8");

for (const f of ["index.html", "zh/index.html", "404.html", "docs/index.html", "zh/docs/index.html", "legal/terms/index.html", "zh/legal/terms/index.html", "legal/privacy/index.html", "zh/legal/privacy/index.html", "robots.txt"]) {
  if (!existsSync(path.join(dist, f)) || statSync(path.join(dist, f)).size === 0) die(`the build has no ${f}`);
}
const map = all.find((f) => f.endsWith(".map"));
if (map) die(`the build wrote source maps (${map}): vite.config.ts build.sourcemap must stay false`);
if (!read("index.html").includes(`<link rel="canonical" href="${site}/"`)) die(`index.html is not built for ${site} (canonical)`);

const html = all.filter((f) => f.endsWith(".html"));
for (const f of html) {
  const page = read(f);
  const head = page.slice(0, page.indexOf("</head>"));
  const policy = /<meta http-equiv="Content-Security-Policy" content="([^"]+)" \/>/.exec(head);
  if (!policy) die(`${f} carries no policy`);
  // A policy applies to what follows it: right after the charset, before the first script.
  const charset = head.indexOf(CHARSET_META);
  if (charset < 0 || head.slice(charset + CHARSET_META.length, policy.index).trim() !== "") die(`${f}: the policy does not follow ${CHARSET_META}`);
  const script = head.indexOf("<script");
  if (script >= 0 && script < policy.index) die(`${f}: the policy comes after a script`);
  const directives = policy[1].split("; ");
  const connect = directives.find((d) => d.startsWith("connect-src "));
  if (!connect || !connect.split(" ").includes(api)) die(`${f}: the policy does not let the page call ${api}`);
  const allowed = directives.find((d) => d.startsWith("script-src "))?.split(" ") ?? [];
  for (const h of inlineScriptHashes(page)) if (!allowed.includes(`'${h}'`)) die(`${f}: an inline script (${h}) is not in the policy`);
}
if (!read("404.html").includes("var to=")) die("404.html has no redirect script for the old addresses");

const noindex = html.filter((f) => /<meta name="robots" content="[^"]*noindex/.test(read(f)));
if (site === PRODUCTION) {
  const want = ["404.html", "legal/admin-compliance/index.html", "zh/legal/admin-compliance/index.html"];
  if (noindex.join(" ") !== [...want].sort().join(" ")) die(`an indexable build marks these pages noindex: ${noindex.join(" ")}`);
  if (!/^Sitemap: https:\/\/tokensbeat\.com\/sitemap\.xml$/m.test(read("robots.txt")) || !all.includes("sitemap.xml")) die("robots.txt or sitemap.xml is missing");
} else {
  const indexable = html.filter((f) => !noindex.includes(f));
  if (indexable.length) die(`a build for ${site} (not ${PRODUCTION}) must say noindex on every page; these do not: ${indexable.join(" ")}`);
  if (/^Sitemap:/m.test(read("robots.txt")) || all.includes("sitemap.xml")) die(`a build for ${site} names or writes a sitemap`);
}
if (all.includes("status.json")) die("the build wrote a status snapshot (the publishing workflow writes it after this check)");
if (all.includes("staticwebapp.config.json")) die("the build wrote another host's config (staticwebapp.config.json)");

const named = publicFiles(root, dist).flatMap((f) => namedLines(readFileSync(f, "utf8")).map((n) => `${path.relative(dist, f)}:${n}`));
if (named.length) die(`a reseller is named at ${named.join(", ")}`);

console.log(`check-dist: ${all.length} files, ${html.length} pages for ${site} (${site === PRODUCTION ? "indexable" : "noindex"}), calling ${api}: ok`);
