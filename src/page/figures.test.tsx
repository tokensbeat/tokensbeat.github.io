/**
 * The product pages' screenshots (src/page/figures.tsx, src/content/shots.ts): each section that claims one shows it,
 * in the page's language, with its alternative text in that language, a light and a dark capture, lazy, sized before
 * it arrives, and never on the first screen; the homepage shows Bots and Aha Code as they are (Aha Code is in early
 * access: a real capture, no "not open yet" frame); the stylesheet shows one capture per theme and keeps the frame's
 * shape.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { render, screen, within } from "@testing-library/react";
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

/** The homepage's figures with a caption and a credit (its features); its cards' pictures have the cards' own words. */
const HOME_CAPTIONED: ShotId[] = ["room", "bots", "code"];

/** What each page shows, in order. A page left out shows none (owner, 2026-11-06: no screenshot of what is not built). */
const PAGE_SHOTS: Partial<Record<PageId, ShotId[]>> = {
  home: ["room", "bots", "code", "latex", "news", "metro", "storage"],
  aha: ["latex", "beads", "metro", "diary", "news"],
  models: ["newkey", "models"],
  workspace: ["workspaces"],
  help: ["ticket"],
  agents: ["aha"],
};

/** The section (by its h2) each screenshot illustrates, in English. */
const SECTION_OF: Partial<Record<PageId, Record<string, string>>> = {
  home: { room: "Bots that work while you are away.", bots: "Bots that work while you are away.", code: "Aha Code works in the folder on your own computer.", latex: "More that is open today." },
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
    const captioned = figures().filter((f) => !f.classList.contains("h-fig--bare"));
    // Every screenshot but the homepage's cards (which have their own words) is captioned.
    expect(captioned.map((f) => f.dataset.shot)).toEqual(page === "home" ? HOME_CAPTIONED : (PAGE_SHOTS[page] ?? []));
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

describe("the homepage's pictures", () => {
  it.each(LANGS)("leads Bots with a bot's room and Aha Code with its approval card, each beside its four points, with no frame of something not open (%s)", (lang) => {
    render(<App lang={lang} page="home" />);
    expect(document.querySelector('figure[data-shot="pending"]')).toBeNull();
    for (const id of ["room", "code"] as const) {
      const fig = document.querySelector<HTMLElement>(`.h-spread > figure[data-shot="${id}"]`)!;
      expect(fig, id).toBeInTheDocument();
      expect(fig.querySelectorAll("img")).toHaveLength(2);
      expect(fig.parentElement!.querySelectorAll(".h-spread__points > li")).toHaveLength(4);
    }
    // The room is the section's lead picture, a step wider, at the left; Aha Code's stands at the right of its points.
    const room = document.querySelector<HTMLElement>('figure[data-shot="room"]')!;
    expect(room.parentElement).toHaveClass("h-spread--lead");
    expect(room.parentElement).not.toHaveClass("h-spread--flip");
    expect(document.querySelector('figure[data-shot="code"]')!.parentElement).toHaveClass("h-spread--flip");
    // On a phone the room comes a step closer, so its bot's card can be read; the approval card is already close.
    expect(SHOTS.room.focus).toEqual({ zoom: 1.18, origin: "6% 87%" });
    expect(room).toHaveAttribute("data-focus");
    expect(room).not.toHaveClass("h-fig--close");
    expect(SHOTS.code.focus).toBeUndefined();
  });

  it.each(LANGS)("keeps today's list as a small second picture under the room, close on the bot that waits at every width (%s)", (lang) => {
    render(<App lang={lang} page="home" />);
    const room = document.querySelector<HTMLElement>('figure[data-shot="room"]')!;
    const today = document.querySelector<HTMLElement>('figure[data-shot="bots"]')!;
    expect(room.compareDocumentPosition(today) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(today.closest(".h-spread")).toBeNull();
    expect(today).toHaveClass("h-feat__today", "h-fig--close");
    expect(today).toHaveAttribute("data-focus");
    expect(Number(today.style.getPropertyValue("--h-fig-zoom"))).toBe(SHOTS.bots.focus!.zoom);
    expect(today.style.getPropertyValue("--h-fig-origin")).toBe(SHOTS.bots.focus!.origin);
    expect(document.querySelectorAll(".h-fig--bare[data-focus]")).toHaveLength(0);
    // The two notes follow it in the same row.
    expect(today.parentElement!.querySelectorAll("details.h-feat__note")).toHaveLength(2);
  });

  it.each(LANGS)("labels what is coming as coming: the room's caption carries the Coming chip and says so, today's list the Live chip (%s)", (lang) => {
    render(<App lang={lang} page="home" />);
    const chipOf = (id: ShotId) => document.querySelector(`figure[data-shot="${id}"] figcaption .h-fig__status`)?.getAttribute("data-status") ?? null;
    expect(chipOf("room")).toBe("coming");
    expect(chipOf("bots")).toBe("live");
    expect(chipOf("code")).toBeNull();
    const cap = document.querySelector('figure[data-shot="room"] figcaption')!;
    expect(cap).toHaveTextContent(lang === "zh" ? "随下一次 Aha 更新推出" : "coming in the next Aha update");
    expect(cap).toHaveTextContent(lang === "zh" ? "下次更新 · 示例机器人" : "next update · sample bots");
    // And over the picture itself, on the frame's bar: the chip and when.
    const barOf = (id: ShotId) => document.querySelector<HTMLElement>(`figure[data-shot="${id}"] .h-fig__bar .h-fig__label`);
    expect(barOf("room")!.querySelector("[data-status]")).toHaveAttribute("data-status", "coming");
    expect(barOf("room")).toHaveTextContent(lang === "zh" ? "下一次 Aha 更新" : "next Aha update");
    expect(barOf("bots")!.querySelector("[data-status]")).toHaveAttribute("data-status", "live");
    expect(barOf("bots")).toHaveTextContent(lang === "zh" ? "今天" : "today");
    expect(barOf("code")).toBeNull();
    // A card's bare picture carries no label.
    expect(document.querySelectorAll(".h-fig--bare .h-fig__label")).toHaveLength(0);
    expect(document.querySelector('figure[data-shot="bots"] figcaption')).toHaveTextContent(lang === "zh" ? "今天的样子" : "Today:");
  });

  it.each(LANGS)("leads each card of Also in Aha with its screenshot (%s)", (lang) => {
    render(<App lang={lang} page="home" />);
    const cards = document.querySelectorAll<HTMLElement>(".h-lean-cards--shots > li");
    expect([...cards].map((c) => [c.dataset.item, c.querySelector("figure")?.dataset.shot])).toEqual([
      ["latex", "latex"],
      ["news", "news"],
      ["metro", "metro"],
      ["aha-storage", "storage"],
    ]);
    for (const card of cards) expect(within(card).getAllByRole("img", { hidden: true }).length).toBe(2);
  });
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

describe("a capture of something not released", () => {
  const coming = Object.values(SHOTS).filter((shot) => shot.status === "coming");

  it("is the Workspace's room alone, and says in its caption and its credit that it is coming, in both languages", () => {
    expect(coming.map((shot) => shot.id)).toEqual(["room"]);
    for (const shot of coming) {
      expect(shot.caption.en, shot.id).toMatch(/coming in the next Aha update/);
      expect(shot.caption.zh, shot.id).toMatch(/随下一次 Aha 更新推出/);
      expect(shot.credit.en, shot.id).toMatch(/next update · sample bots/);
      expect(shot.credit.zh, shot.id).toMatch(/下次更新 · 示例机器人/);
      expect(shot.when, shot.id).toEqual({ en: "next Aha update", zh: "下一次 Aha 更新" });
      // What it will do is said in the future, and nothing in it reads as available now.
      expect(shot.caption.en, shot.id).toMatch(/will have a room.*will take you inside/);
      expect(shot.caption.zh, shot.id).toMatch(/会有一间自己的房间，到时/);
      for (const text of [shot.caption.en, shot.alt.en]) expect(text, shot.id).not.toMatch(/\b(now|today|live|available)\b/i);
    }
  });

  it.each(BUILT_PAGES)("is never shown bare (without its caption's label), and only on the homepage: %s", (page) => {
    for (const lang of LANGS) {
      const { unmount } = render(<App lang={lang} page={page} />);
      const shown = [...document.querySelectorAll<HTMLElement>('figure[data-shot="room"]')];
      expect(shown.length, `${page} ${lang}`).toBe(page === "home" ? 1 : 0);
      for (const fig of shown) {
        expect(fig).not.toHaveClass("h-fig--bare");
        expect(fig.querySelector('figcaption [data-status="coming"]')).toBeInTheDocument();
      }
      unmount();
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

  it("scales a capture about its telling part on a phone, and a small figure's at every width, inside the frame that clips it", () => {
    const css = readFileSync(join(SRC, "styles/home.css"), "utf8");
    expect(css).toMatch(/@media \(max-width: 639px\) \{[^@]*\.h-fig\[data-focus\] \.h-fig__img \{ transform: scale\(var\(--h-fig-zoom\)\); transform-origin: var\(--h-fig-origin\); \}\s*\}/);
    expect(prop(body(".h-fig--close .h-fig__img"), "transform")).toBe("scale(var(--h-fig-zoom))");
    expect(prop(body(".h-fig--close .h-fig__img"), "transform-origin")).toBe("var(--h-fig-origin)");
    expect(prop(body(".h-fig__view"), "overflow")).toBe("hidden");
    for (const shot of Object.values(SHOTS)) {
      if (!shot.focus) continue;
      expect(shot.focus.zoom, shot.id).toBeGreaterThan(1);
      expect(shot.focus.zoom, shot.id).toBeLessThanOrEqual(2.5);
      expect(shot.focus.origin, shot.id).toMatch(/^\d+% \d+%$/);
    }
  });

  it("puts today's picture straight after the coming one on a phone, before the points", () => {
    const css = readFileSync(join(SRC, "styles/home.css"), "utf8");
    const phone = /@media \(max-width: 639px\) \{\s*\.h-feat--bots > \.h-wrap \{[^@]*?\n\}/.exec(css)?.[0] ?? "";
    expect(phone).toContain(".h-feat--bots :is(.h-spread, .h-feat__notes) { display: contents; }");
    const order = (selector: string) => Number(new RegExp(`${selector.replace(/[.>]/g, "\\$&")} \\{ order: (\\d)`).exec(phone)?.[1]);
    expect([order(".h-feat--bots .h-spread > .h-fig"), order(".h-feat--bots .h-feat__today"), order(".h-feat--bots .h-spread__copy"), order(".h-feat--bots .h-feat__note")]).toEqual([1, 2, 3, 4]);
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
