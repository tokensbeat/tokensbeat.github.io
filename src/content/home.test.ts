/**
 * The homepage's deck (home-copy.json) as a whole: every text in both languages, the brand written TokensBeat, no
 * AI-flavoured words (owner: short, concrete sentences; never "unlock", "seamless", 赋能, 一站式…), Aha never called
 * 智能体 or "the agent", nothing that is not released, no reseller's name, and every address one hrefFor can resolve.
 */
// @ts-expect-error -- scripts/ is the node project's (JSDoc-typed JavaScript), not this one's
import { namedLines } from "../../scripts/check-public-text.mjs";
import { HOME, hrefFor } from "@/content/home";
import { LANGS } from "@/i18n";

type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

/** Every text in the deck (an object with an `en` or a `zh`), with its path; a side that is missing is undefined. */
function texts(node: Json, path = "deck"): { path: string; en: Json | undefined; zh: Json | undefined }[] {
  if (Array.isArray(node)) return node.flatMap((child, i) => texts(child, `${path}[${i}]`));
  if (node && typeof node === "object") {
    if ("en" in node || "zh" in node) return [{ path, en: node.en, zh: node.zh }];
    return Object.entries(node).flatMap(([key, child]) => texts(child, `${path}.${key}`));
  }
  return [];
}

/** Every href in the deck. */
function hrefs(node: Json): string[] {
  if (Array.isArray(node)) return node.flatMap(hrefs);
  if (node && typeof node === "object") return Object.entries(node).flatMap(([key, child]) => (key === "href" && typeof child === "string" ? [child] : hrefs(child)));
  return [];
}

const DECK = HOME as unknown as Json;
const FOUND = texts(DECK);
/** The same, as strings, for the tests that read the words (the first test fails on a side that is not one). */
const TEXTS = FOUND.map((t) => ({ path: t.path, en: typeof t.en === "string" ? t.en : "", zh: typeof t.zh === "string" ? t.zh : "" }));

const AI_FLAVOUR_EN = /\b(unlock|seamless|supercharg|harness|frontier|flagship|cutting[- ]edge|revolution|empower|leverag|world[- ]class|next[- ]gen|game[- ]chang|effortless|blazing|best[- ]in[- ]class|leading|unified|autonomous)\w*/i;
const AI_FLAVOUR_ZH = /赋能|一站式|颠覆|旗舰|顶尖|领先|极致|无缝|赋予|引领|重塑|智能体/;
const NOT_RELEASED = /VS Code|Android|iPhone|iOS|macOS|phone push|安卓|苹果手机/i;

describe("the homepage's deck", () => {
  it("has every text in English and in Chinese, each in its own language", () => {
    expect(FOUND.length).toBeGreaterThan(80);
    // A text with one side missing, empty or not a string is caught here, not skipped.
    for (const t of FOUND) {
      expect(typeof t.en === "string" && t.en.trim() !== "", `${t.path}.en is a text`).toBe(true);
      expect(typeof t.zh === "string" && t.zh.trim() !== "", `${t.path}.zh is a text`).toBe(true);
    }
    expect(texts({ a: { en: "only one side" } }).map((t) => t.zh)).toEqual([undefined]);
    for (const t of TEXTS) {
      // One language at a time: no Chinese in the English text.
      expect(t.en, `${t.path}.en`).not.toMatch(/[㐀-鿿]/);
    }
  });

  it("writes the brand TokensBeat, and Aha by its name", () => {
    for (const t of TEXTS) {
      for (const text of [t.en, t.zh]) {
        for (const m of text.match(/tokens\s?beat/gi) ?? []) expect(m, t.path).toBe("TokensBeat");
        expect(text, t.path).not.toMatch(/\b(the|our) agent\b/i);
      }
    }
  });

  it("uses no AI-flavoured words, promises nothing that is not released and names no reseller", () => {
    for (const t of TEXTS) {
      expect(t.en, `${t.path}.en`).not.toMatch(AI_FLAVOUR_EN);
      expect(t.zh, `${t.path}.zh`).not.toMatch(AI_FLAVOUR_ZH);
      for (const text of [t.en, t.zh]) {
        expect(text, t.path).not.toMatch(NOT_RELEASED);
        expect(namedLines(text), t.path).toEqual([]);
      }
    }
  });

  it("states each product's status as it is today", () => {
    expect(HOME.bots.status).toBe("live");
    // Released inside Aha for Windows, shown for the accounts TokensBeat turns on.
    expect(HOME.code.status).toBe("early");
    expect(HOME.models.status).toBe("live");
    expect(Object.fromEntries(HOME.news.items.map((n) => [n.id, n.status]))).toEqual({ bots: "live", code: "early", keys: "live" });
  });

  it("says nothing of the coming Workspace's house and rooms: that is its picture's caption alone, labelled Coming", () => {
    // The hero, New this month and the questions describe what is open today. (Bots' own "One room for the team" is
    // the Team chat, live; the Vanguard card "Workspace" is the cloud dev box, in beta.)
    const today = [HOME.hero, HOME.news, HOME.faq] as unknown as Json[];
    for (const t of today.flatMap((node, i) => texts(node, ["hero", "news", "faq"][i]))) {
      expect(String(t.en), t.path).not.toMatch(/\b(house|rooms?|floors?|3D)\b/i);
      expect(String(t.zh), t.path).not.toMatch(/房间|房子|工作间|楼/);
    }
    for (const t of TEXTS) {
      expect(t.en, t.path).not.toMatch(/\b(house|floors?|3D)\b/i);
      expect(t.zh, t.path).not.toMatch(/房子|工作间/);
    }
  });

  it("links only addresses hrefFor resolves, in both languages", () => {
    const all = hrefs(DECK);
    expect(all.length).toBeGreaterThan(20);
    for (const href of all) for (const lang of LANGS) expect(() => hrefFor(href, lang), href).not.toThrow();
    expect(hrefFor("ticket:Aha Code early access", "zh")).toBe("https://console.tokensbeat.com/support/new?category=general&subject=Aha+Code+early+access&lang=zh");
    expect(hrefFor("/docs", "zh")).toBe("/zh/docs/");
    expect(hrefFor("#home-bots", "zh")).toBe("#home-bots");
  });
});
