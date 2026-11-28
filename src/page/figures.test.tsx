/**
 * The product pages' screenshots (src/page/figures.tsx, src/content/shots.ts): each section that claims one shows it,
 * in the page's language, with its alternative text in that language, a light and a dark capture, lazy, sized before
 * it arrives, and never on the first screen; the stylesheet shows one capture per theme and keeps the frame's shape.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { render, screen } from "@testing-library/react";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { App } from "@/App";
import type { PageId } from "@/content/site";
import { SHOT_HEIGHT, SHOT_WIDTH, SHOTS, type ShotId } from "@/content/shots";
import { LANGS } from "@/i18n";
import { BUILT_PAGES } from "@/page/pages";
import { prop, rules } from "@/test/css";

const SRC = join(import.meta.dirname, "..");
const CJK = /[㐀-鿿]/;

/** What each page shows, in order. A page left out shows none (owner, 2026-11-06: no screenshot of what is not built). */
const PAGE_SHOTS: Partial<Record<PageId, ShotId[]>> = {
  aha: ["latex", "beads", "metro", "diary", "news"],
  models: ["newkey", "models"],
  workspace: ["workspaces"],
  help: ["ticket"],
  agents: ["aha"],
};

/** The section (by its h2) each screenshot illustrates, in English. */
const SECTION_OF: Partial<Record<PageId, Record<string, string>>> = {
  aha: { latex: "Apps that live inside Aha.", news: "Apps that live inside Aha." },
  models: { newkey: "Choose how each key is routed.", models: "Prices and health, model by model." },
  workspace: { workspaces: "A real machine, not a notebook." },
  help: { ticket: "Talk to a person." },
  agents: { aha: "Aha is the first app on it." },
};

const figures = () => [...document.querySelectorAll<HTMLElement>("figure.h-fig[data-shot]")].filter((f) => f.dataset.shot !== "pending");

describe.each(BUILT_PAGES.flatMap((page) => LANGS.map((lang) => [page, lang] as const)))("%s in %s", (page, lang) => {
  beforeEach(() => {
    render(<App lang={lang} page={page} />);
  });

  it("shows the screenshots it claims, each with its alternative text in the page's language", () => {
    const shown = figures().map((f) => f.dataset.shot);
    expect(shown).toEqual(PAGE_SHOTS[page] ?? []);
    for (const fig of figures()) {
      const shot = SHOTS[fig.dataset.shot as ShotId];
      const imgs = [...fig.querySelectorAll("img")];
      expect(imgs.map((i) => i.dataset.tone)).toEqual(["light", "dark"]);
      for (const img of imgs) {
        const alt = img.getAttribute("alt") ?? "";
        expect(alt).toBe(shot.alt[lang]);
        // A description, not a label: a sentence in English, a clause or two in Chinese.
        expect(alt.length, `${shot.id} alt`).toBeGreaterThan(lang === "zh" ? 20 : 60);
        if (lang === "zh") expect(alt, `${shot.id} alt in Chinese`).toMatch(CJK);
        else expect(alt, `${shot.id} alt in English`).not.toMatch(CJK);
        expect(img.getAttribute("src"), `${shot.id} ${img.dataset.tone}`).toContain(`${shot.id}-${img.dataset.tone}-${lang}`);
      }
    }
  });

  it("loads them lazily and sized before they arrive, never in the page's opening (the hero)", () => {
    for (const img of document.querySelectorAll("figure.h-fig img")) {
      expect(img).toHaveAttribute("loading", "lazy");
      expect(img).toHaveAttribute("decoding", "async");
      expect(img).toHaveAttribute("width", String(SHOT_WIDTH));
      expect(img).toHaveAttribute("height", String(SHOT_HEIGHT));
      expect(img.closest(".h-hero"), "no screenshot in the page's opening").toBeNull();
    }
  });

  it("captions and credits each one in the page's language, numbered in order", () => {
    const captioned = figures();
    expect(captioned.map((f) => f.dataset.shot)).toEqual(PAGE_SHOTS[page] ?? []);
    captioned.forEach((fig, i) => {
      const shot = SHOTS[fig.dataset.shot as ShotId];
      const cap = fig.querySelector("figcaption")!;
      expect(cap.querySelector(".h-fig__credit")).toHaveTextContent(shot.credit[lang]);
      // The credit breaks between its parts only: each is a piece that does not wrap, its dot kept at its end.
      const parts = [...cap.querySelectorAll(".h-fig__credit-part")].map((el) => el.textContent);
      expect(parts.map((part) => part!.replace(/ ·$/, ""))).toEqual(shot.credit[lang].split(" · "));
      expect(parts.slice(0, -1).every((part) => part!.endsWith(" ·"))).toBe(true);
      expect(cap.querySelector(".h-fig__no")).toHaveTextContent(lang === "zh" ? `图 ${i + 1}` : `Fig. ${i + 1}`);
      expect(cap).toHaveTextContent(shot.caption[lang]);
    });
  });

  if (lang === "en" && SECTION_OF[page]) {
    it("sets each in the section it illustrates", () => {
      for (const [id, title] of Object.entries(SECTION_OF[page]!)) {
        const section = screen.getByRole("region", { name: title });
        expect(section.querySelector(`figure[data-shot="${id}"]`), `${id} in "${title}"`).toBeInTheDocument();
      }
    });
  }
});

describe("the prerendered pages", () => {
  it.each(Object.keys(PAGE_SHOTS) as PageId[])("%s has each picture's size and lazy loading in its HTML, so nothing moves when it arrives", (page) => {
    for (const lang of LANGS) {
      const html = renderToString(createElement(App, { lang, page }));
      const imgs = html.match(/<img [^>]*class="h-fig__img[^>]*>/g) ?? [];
      expect(imgs.length).toBe((PAGE_SHOTS[page] ?? []).length * 2);
      for (const img of imgs) {
        expect(img).toContain(`width="${SHOT_WIDTH}"`);
        expect(img).toContain(`height="${SHOT_HEIGHT}"`);
        expect(img).toContain('loading="lazy"');
      }
    }
  });
});

describe("the captures", () => {
  const dir = join(SRC, "assets/shots");
  const files = readdirSync(dir);

  it("are a light and a dark capture of every shot in each language, and nothing else", () => {
    const want = Object.keys(SHOTS).flatMap((id) => ["light", "dark"].flatMap((t) => LANGS.map((l) => `${id}-${t}-${l}.webp`)));
    expect(files.sort()).toEqual(want.sort());
  });

  it("are WebP files 1600 x 1000, each under 150 KB", () => {
    for (const f of files) {
      const buf = readFileSync(join(dir, f));
      expect(buf.subarray(0, 4).toString("latin1"), f).toBe("RIFF");
      expect(buf.subarray(8, 12).toString("latin1"), f).toBe("WEBP");
      expect(statSync(join(dir, f)).size, f).toBeLessThan(150 * 1024);
      // VP8 (lossy): the frame's width and height are 14 bits each, after the 3-byte start code at offset 23.
      expect(buf.subarray(12, 16).toString("latin1"), `${f} is lossy VP8`).toBe("VP8 ");
      expect([buf.readUInt16LE(26) & 0x3fff, buf.readUInt16LE(28) & 0x3fff], f).toEqual([SHOT_WIDTH, SHOT_HEIGHT]);
    }
  });
});

describe("the figures' stylesheet", () => {
  const ALL = rules(readFileSync(join(SRC, "styles/home.css"), "utf8"));
  const body = (selector: string) => ALL.filter((r) => r.selector === selector).map((r) => r.body).join(";");

  it("keeps the capture's shape before it arrives", () => {
    expect(prop(body(".h-fig__view"), "aspect-ratio")).toBe("16 / 10");
    expect(SHOT_WIDTH / SHOT_HEIGHT).toBe(16 / 10);
  });

  it("shows the light capture by day and the dark one at night, by the system's theme and by the reader's choice", () => {
    // The system's dark theme applies only inside its media query (rules() reads through @media, so check the source).
    const css = readFileSync(join(SRC, "styles/home.css"), "utf8");
    expect(css).toMatch(/@media \(prefers-color-scheme: dark\) \{\s*:root:not\(\[data-theme="light"\]\) \.h-fig__img--light \{ display: none; \}\s*:root:not\(\[data-theme="light"\]\) \.h-fig__img--dark \{ display: block; \}\s*\}/);
    expect(prop(body(".h-fig__img--dark"), "display")).toBe("none");
    expect(prop(body(':root:not([data-theme="light"]) .h-fig__img--light'), "display")).toBe("none");
    expect(prop(body(':root:not([data-theme="light"]) .h-fig__img--dark'), "display")).toBe("block");
    expect(prop(body(':root[data-theme="dark"] .h-fig__img--light'), "display")).toBe("none");
    expect(prop(body(':root[data-theme="dark"] .h-fig__img--dark'), "display")).toBe("block");
  });
});
