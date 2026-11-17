#!/usr/bin/env node
/**
 * Public text names none of the resellers behind the Discount groups: who they are is a business detail we do not
 * publish, and the pages say the groups are served through "trusted third parties" (zh: 受信任的第三方). This check is
 * public too, so it holds the names only as SHA-256 hashes of their normalised spellings (NAME_HASHES).
 *
 * What it reads: every text file of this repository (the site, its tests, scripts, workflows and README: all of it
 * is public; tests use made-up names), or, with --dist, every text file of a build. How it matches, as a whole-word
 * rule: each run of ASCII letters and digits, A-Z lower-cased, is a word; a word, two words joined by one space, "_"
 * or "-" (hashed written together), and two words joined by "." (hashed with the dot) are each compared with the
 * hashes. A hit prints the file and line, never the text.
 *
 *   node scripts/check-public-text.mjs [--dist dist]
 */
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/** The normalised spellings this check refuses, as SHA-256 hex digests. */
export const NAME_HASHES = new Set([
  "be7f210fcab6d14bccce9fbcf537133acbd0bb6503000df7b45557014bad6a9e",
  "14350a3d6b3b27be1fb042ddbb3d08ae8ea7be4cd83242674bfb83ca7c0bb90e",
  "02fb9e5d8b002eae9ac1e98a6b35efae0736e34286f1ee87081af3f8c4ec4596",
  "ef2abb1099fea93a046223cf5f0e1b9a8fce57e9ebc8e87890221804f0e6888c",
]);

const TEXT = /\.(?:ts|tsx|js|mjs|cjs|json|css|html|svg|md|txt|xml|yml|yaml|webmanifest)$|(?:^|\/)(?:LICENSE|\.gitignore)$/i;
/** Never read: installed packages, build outputs, git's own files. */
const SKIP = new Set(["node_modules", "dist", "dist-ssr", "coverage", ".git"]);
const sha = (/** @type {string} */ s) => createHash("sha256").update(s, "utf8").digest("hex");

/**
 * The lines of `text` (1-based) that name one of `hashes`.
 * @param {string} text
 * @param {Set<string>} [hashes]
 * @returns {number[]}
 */
export function namedLines(text, hashes = NAME_HASHES) {
  /** @type {number[]} */
  const lines = [];
  text.split("\n").forEach((raw, i) => {
    // ASCII only, so every offset below is the same in the line as in its words.
    const line = raw.replace(/[A-Z]/g, (c) => c.toLowerCase());
    const words = [...line.matchAll(/[a-z0-9]+/g)];
    const hit = words.some((w, k) => {
      if (hashes.has(sha(w[0]))) return true;
      const next = words[k + 1];
      if (!next) return false;
      const gap = line.slice(w.index + w[0].length, next.index);
      if (gap.length !== 1) return false;
      if (" _-".includes(gap)) return hashes.has(sha(w[0] + next[0]));
      return gap === "." && hashes.has(sha(`${w[0]}.${next[0]}`));
    });
    if (hit) lines.push(i + 1);
  });
  return lines;
}

/** @param {string} dir @returns {string[]} */
function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? (SKIP.has(e.name) ? [] : walk(p)) : [p];
  });
}

/**
 * The files to read: a build's text files, or every text file of the repository.
 * @param {string} root
 * @param {string | null} dist
 */
export function publicFiles(root, dist) {
  return walk(dist ?? root).filter((f) => TEXT.test(f.split(path.sep).join("/")));
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const i = process.argv.indexOf("--dist");
  const dist = i >= 0 ? path.resolve(process.argv[i + 1] ?? "dist") : null;
  if (dist && !statSync(dist, { throwIfNoEntry: false })?.isDirectory()) throw new Error(`check-public-text: no ${dist}`);
  const files = publicFiles(root, dist);
  const hits = files.flatMap((f) => namedLines(readFileSync(f, "utf8")).map((n) => `${path.relative(process.cwd(), f)}:${n}`));
  if (hits.length) {
    console.error(`check-public-text: a reseller is named (say "trusted third parties", zh 受信任的第三方) at:\n  ${hits.join("\n  ")}`);
    process.exit(1);
  }
  console.log(`check-public-text: ${files.length} files of ${dist ? path.relative(process.cwd(), dist) || "." : "the repository"} name no reseller`);
}
