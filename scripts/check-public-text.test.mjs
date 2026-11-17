// @vitest-environment node
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { NAME_HASHES, namedLines, publicFiles } from "./check-public-text.mjs";

// Made-up names stand in for the real ones, which this public repository never spells out.
const sha = (/** @type {string} */ s) => createHash("sha256").update(s).digest("hex");
const FAKE = new Set(["acmeapi", "zorbo", "bluecode", "relay.site"].map(sha));
const ROOT = path.resolve(import.meta.dirname, "..");

describe("the reseller-name check", () => {
  it("holds four names as SHA-256 digests only", () => {
    expect(NAME_HASHES.size).toBe(4);
    for (const h of NAME_HASHES) expect(h).toMatch(/^[0-9a-f]{64}$/);
  });

  it("finds a name as a whole word in any case, its host, and its two words written apart or together", () => {
    const text = [
      "Served by AcmeAPI.", // 1
      "see acmeapi.ai", // 2
      "由Blue Code提供", // 3
      "blue-code and blue_code", // 4
      "BlueCode", // 5
      "the relay.site host", // 6
      "x.relay.site.y", // 7
      "Zorbo", // 8
    ].join("\n");
    expect(namedLines(text, FAKE)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it("leaves a name inside another word, words further apart and trusted third parties alone", () => {
    const text = ["superacmeapi", "acmeapis", "blue  code", "blue, code", "relay site", "relay..site", "trusted third parties", "受信任的第三方"].join("\n");
    expect(namedLines(text, FAKE)).toEqual([]);
  });

  it("lower-cases ASCII only, so a letter that changes length in lower case hides nothing after it", () => {
    expect(namedLines("\u0130 blue-code", FAKE)).toEqual([1]);
  });

  it("reads every text file of the repository, tests, scripts, workflows and README included", () => {
    const files = publicFiles(ROOT, null).map((f) => path.relative(ROOT, f).split(path.sep).join("/"));
    for (const f of ["index.html", "README.md", "package.json", ".github/workflows/pages.yml", "legal/privacy.en.md", "src/content/home-copy.json", "src/content/home.test.ts", "scripts/check-public-text.test.mjs", "public/favicon.svg"]) expect(files).toContain(f);
    expect(files.some((f) => /^(node_modules|dist|\.git)\//.test(f))).toBe(false);
    expect(files.some((f) => f.endsWith(".png") || f.endsWith(".webp"))).toBe(false);
  });

  it("finds no name in the repository", () => {
    const hits = publicFiles(ROOT, null).filter((f) => namedLines(readFileSync(f, "utf8")).length > 0);
    expect(hits).toEqual([]);
  });
});
