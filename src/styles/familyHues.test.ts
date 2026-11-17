/**
 * The price map's lines are told apart by hue as well as by logo and place: neighbouring lines, and the named pairs
 * that the owner's colours (2026-11-02: Gemini red, GLM green, GPT cyan) put near each other, stay at least 15 apart
 * (ΔE × 100 in OKLab, the dataviz validator's normal-vision floor) in both themes. The reds: Gemini beside Claude
 * (a darker rust by day) and MiniMax (a plum by day, a pink at night, away from Kimi's magenta). The cool hues: GPT's
 * cyan, DeepSeek's blue (Gemini's old one, a deep blue by day so it stays off Qwen's violet) and GLM's green. Before
 * 2026-11-02 Gemini, DeepSeek and GLM shared one blue (ΔE 2–5). Byte-identical in the console and the homepage.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { FAMILIES, type FamilyId } from "../lib/family";

const css = readFileSync(path.join(import.meta.dirname, "theme.css"), "utf8");
const block = (from: string, to: string) => css.slice(css.indexOf(from), css.indexOf(to));
const hues = (text: string) => Object.fromEntries([...text.matchAll(/--c-vendor-([\w-]+):\s*(#[0-9a-f]{6});/gi)].map((m) => [m[1], m[2]]));
const THEMES = {
  light: hues(block(":root,", "@media (prefers-color-scheme: dark)")),
  dark: hues(block("@media (prefers-color-scheme: dark)", '[data-theme="dark"],')),
};

const lin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
function oklab(hex: string): [number, number, number] {
  const [r, g, b] = [1, 3, 5].map((i) => lin(parseInt(hex.slice(i, i + 2), 16) / 255));
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
}
const deltaE = (a: string, b: string) => {
  const [x, y] = [oklab(a), oklab(b)];
  return 100 * Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]);
};

/** The families on the plaza today, in line order, with a hue. */
const ON_THE_MAP: FamilyId[] = ["gpt", "claude", "gemini", "deepseek", "kimi", "glm", "grok", "qwen", "minimax", "doubao"];

/** Pairs that are not neighbours but sit near in hue: the reds and pinks, and the cyan, blue, green and violet. */
const NAMED: [FamilyId, FamilyId][] = [
  ["gemini", "claude"],
  ["gemini", "minimax"],
  ["claude", "minimax"],
  ["kimi", "minimax"],
  ["gpt", "deepseek"],
  ["gpt", "glm"],
  ["deepseek", "glm"],
  ["deepseek", "qwen"],
];

describe.each(Object.entries(THEMES))("the family hues in the %s theme", (_, theme) => {
  const hueOf = (id: FamilyId) => theme[FAMILIES.find((f) => f.id === id)!.hue!];

  it("give every family on the map a hue of its own", () => {
    for (const id of ON_THE_MAP) expect([id, hueOf(id)]).toEqual([id, expect.stringMatching(/^#/)]);
  });

  it("keep neighbouring lines apart", () => {
    for (let i = 1; i < ON_THE_MAP.length; i++) {
      const [a, b] = [ON_THE_MAP[i - 1], ON_THE_MAP[i]];
      expect([a, b, deltaE(hueOf(a), hueOf(b)) >= 15]).toEqual([a, b, true]);
    }
  });

  it.each(NAMED)("keep %s and %s apart", (a, b) => {
    expect(deltaE(hueOf(a), hueOf(b))).toBeGreaterThanOrEqual(15);
  });
});
