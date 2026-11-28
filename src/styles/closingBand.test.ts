/**
 * The closing band says its line in the page's language alone (owner, 2026-11-12: one language at a time; until then
 * the other language stood under it as a deck). These read the stylesheets: no rule is left for that deck, and a
 * Chinese title beside the art grows no wider than the words' column.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { prop, rules } from "../test/css";

const SRC = join(import.meta.dirname, "..");
const THEME = readFileSync(join(SRC, "styles/theme.css"), "utf8");
const ALL = [...rules(readFileSync(join(SRC, "styles/home.css"), "utf8")), ...rules(readFileSync(join(SRC, "i18n/zh.css"), "utf8"))];

/** The declarations of the rule with exactly this selector (the last one wins, as in the cascade). */
function rule(selector: string): string {
  const found = ALL.filter((r) => r.selector === selector);
  expect(found.length, `a rule for ${selector}`).toBeGreaterThan(0);
  return found.map((r) => r.body).join(";");
}

/** A font size (from font-size, or the size in a font shorthand) in px, at a viewport `vw` px wide and a column `col` px wide. */
function sizeAt(body: string, vw: number, col: number): number {
  const value = prop(body, "font-size") ?? prop(body, "font")!.match(/(clamp\(.*?\))\//)![1];
  const js = value
    .replace(/(\d*\.?\d+)rem/g, "($1*16)")
    .replace(/(\d*\.?\d+)vw/g, `($1*${vw}/100)`)
    .replace(/(\d*\.?\d+)cqi/g, `($1*${col}/100)`)
    .replace(/(\d*\.?\d+)px/g, "$1")
    .replace(/\bmin\(/g, "Math.min(")
    .replace(/clamp\(/g, "((a, b, c) => Math.min(Math.max(a, b), c))(");
  expect(js, `only numbers, units and clamp/min in ${value}`).toMatch(/^[\d\s.+\-*/(),=>a-zA-Z]*$/);
  return Function(`return ${js}`)() as number;
}

/** The words' column of the band at a viewport this wide: the page's gutters and the plate's padding taken off. */
function columnAt(vw: number): number {
  const gutter = Math.min(Math.max(16, vw * 0.04), 48);
  const pad = Math.min(Math.max(28, vw * 0.05), 68);
  const plate = Math.min(vw, 1320) - 2 * gutter;
  return (vw >= 900 ? (plate * 1.08) / 2.08 : plate) - 2 * pad;
}

const WIDTHS = [320, 360, 390, 600, 899, 900, 1024, 1280, 1440, 1600];

describe("the closing band", () => {
  it("has no rule left for a line in the other language", () => {
    expect(ALL.filter((r) => r.selector.includes("h-cta__deck"))).toEqual([]);
  });

  it("keeps a Chinese title's line of seven characters inside the words' column beside the art", () => {
    expect(prop(rule(".h-cta--aside .h-cta__words"), "container-type")).toBe("inline-size");
    const titleZh = rule(".h-cta--aside .h-cta__title:lang(zh)");
    for (const vw of WIDTHS) {
      const col = columnAt(vw);
      expect(sizeAt(titleZh, vw, col) * 7, `seven characters at ${vw}`).toBeLessThanOrEqual(col);
    }
  });

});

describe("the product pages' closing art and the head's menu", () => {
  it("draws each product page's art in a colour of its own, beside the band's words, laid over its column", () => {
    const art = rule(".h-cta-art");
    expect(prop(art, "color")).toBe("var(--c-cta-art)");
    expect(prop(art, "position")).toBe("absolute");
    expect(prop(art, "inset")).toBe("0");
    // A colour by day and at night (the system's dark scheme and data-theme="dark"), never the words' own.
    const values = [...THEME.matchAll(/--c-cta-art:\s*([^;]+);/g)].map((m) => m[1].trim().toLowerCase());
    expect(values).toHaveLength(3);
    expect(values[1]).toBe(values[2]);
    expect(values[0]).not.toBe(values[1]);
    for (const v of values) expect(v).toMatch(/^#[0-9a-f]{6}$/);
  });

  it("gives the art half a ground unlike the words half's, with the art readable on it, by day and at night", () => {
    expect(prop(rule(".h-cta__aside"), "background")).toBe("var(--c-cta-art-ground)");
    const grounds = [...THEME.matchAll(/--c-cta-art-ground:\s*(#[0-9a-fA-F]{6})/g)].map((m) => m[1]);
    const arts = [...THEME.matchAll(/--c-cta-art:\s*(#[0-9a-fA-F]{6})/g)].map((m) => m[1]);
    const strong = [...THEME.matchAll(/--c-primary-strong:\s*(#[0-9a-fA-F]{6})/g)].map((m) => m[1]);
    expect(grounds).toHaveLength(3);
    expect(grounds[1]).toBe(grounds[2]);
    // The words half's ground is --c-primary-strong (light, dark, data-theme dark); the words are the page's paper.
    const words = [strong[0], strong[1], strong[2]];
    const light = (hex: string) => {
      const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
      return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    };
    const ratio = (a: string, b: string) => (Math.max(light(a), light(b)) + 0.05) / (Math.min(light(a), light(b)) + 0.05);
    for (const i of [0, 1]) {
      expect(ratio(arts[i], grounds[i]), `art on its ground, theme ${i}`).toBeGreaterThanOrEqual(3);
      expect(ratio(grounds[i], words[i]), `the two halves differ, theme ${i}`).toBeGreaterThanOrEqual(1.5);
    }
  });

  it("draws the menu's icons as lines in the menu's jade, with no tile, border or fill round them", () => {
    const icon = rule(".h-item__icon");
    expect(prop(icon, "color")).toBe("var(--c-primary-strong)");
    for (const name of ["background", "background-color", "border", "box-shadow"]) expect(prop(icon, name), name).toBeUndefined();
    expect(ALL.some((r) => /\.h-item__icon/.test(r.selector) && /(^|;)\s*(background|border)/.test(r.body))).toBe(false);
  });
});
