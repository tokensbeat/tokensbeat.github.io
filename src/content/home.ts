/**
 * The homepage's words: the copy deck ./home-copy.json, kept to what the products do today (each claim as the
 * products' own documentation states it: Aha's Bots, Aha Code, the Windows app, key plans). The 2026-11-16 deck leads with what is live: the hero's headline is
 * the owner's line from 《观沧海》 (星汉灿烂，若出其里; owner 2026-11-16: the poem stays the headline), the claim in plain
 * words under it, then what is new this month, Bots, Aha Code, the models, the rest of Aha and the backend that opens
 * in stages. Every text is { en, zh }; the page shows the one
 * for its language. To change the homepage's words, change home-copy.json; its shape is HomeDeck.
 *
 * The deck's hrefs are written once, in English. hrefFor gives each the address for the page's language: a site page
 * as pagePath has it (/zh/build/), the docs' quickstart for /docs, a console page with ?lang=zh, a support ticket for
 * ticket:<subject>; a place on the page (#home-bots) and any other site as written.
 */
import { CONSOLE_ORIGIN, consoleUrl, links, ticketUrl } from "@/content/links";
import { pageOfPath, pagePath, type SiteStatus } from "@/content/site";
import type { Lang } from "@/i18n";
import deck from "./home-copy.json";

export interface Bi {
  en: string;
  zh: string;
}

export interface HomeLink {
  label: Bi;
  href: string;
}

export interface HomeItem {
  id: string;
  name: Bi;
  line: Bi;
  status: SiteStatus;
  href: string;
}

export interface HomeSection {
  id: string;
  eyebrow: Bi;
  title: Bi;
  line?: Bi;
  items?: HomeItem[];
  /** Where the whole of it is told (Also in Aha: the Aha page). */
  more?: HomeLink;
}

/** One dated line of "New this month": what opened, when, in which state, and where on the page it is told. */
export interface HomeNews {
  id: string;
  date: Bi;
  name: Bi;
  line: Bi;
  status: SiteStatus;
  href: string;
}

/** A numbered point beside a picture: a title and its words, or a sentence alone. */
export interface HomePoint {
  id: string;
  title?: Bi;
  body: Bi;
}

/** A product told as a feature: its head, its points, and where to go. */
export interface HomeFeature {
  eyebrow: Bi;
  status: SiteStatus;
  title: Bi;
  line: Bi;
  points: HomePoint[];
}

export interface HomeDeck {
  hero: { titleA: Bi; titleB: Bi; claim: Bi; line: Bi; primary: HomeLink; secondary: HomeLink };
  news: { label: Bi; items: HomeNews[] };
  bots: HomeFeature & {
    wakes: { title: Bi; rows: { id: string; what: Bi; how: Bi }[] };
    bounds: { title: Bi; lines: Bi[] };
    link: HomeLink;
  };
  code: HomeFeature & { note: Bi; primary: HomeLink; secondary: HomeLink };
  models: { eyebrow: Bi; status: SiteStatus; title: Bi; lines: Bi[]; primary: HomeLink; secondary: HomeLink; page: HomeLink };
  sections: HomeSection[];
  faq: { q: Bi; a: Bi }[];
  closing: { title: Bi; button: HomeLink; second: HomeLink };
}

export const HOME: HomeDeck = deck as HomeDeck;

/** The deck's section by id (aha, serve, support, pricing); a missing one is a broken deck. */
export function homeSection(id: string): HomeSection {
  const section = HOME.sections.find((s) => s.id === id);
  if (!section) throw new Error(`the homepage deck has no section ${id}`);
  return section;
}

/**
 * A headline as its lines: in English a sentence a line, in Chinese a clause a line, each ending on its own
 * punctuation, so 踏上基石，构建你的宇宙。 is 踏上基石， over 构建你的宇宙。 (owner, 2026-11-03: never broken mid-phrase).
 */
export function headlineLines(text: string, lang: Lang): string[] {
  const parts = lang === "zh" ? text.split(/(?<=[，。；！？])/) : text.split(/(?<=[.!?])\s+/);
  return parts.map((part) => part.trim()).filter(Boolean);
}

const TICKET = "ticket:";

/** A deck href in the page's language. */
export function hrefFor(href: string, lang: Lang): string {
  if (href.startsWith(TICKET)) return ticketUrl(href.slice(TICKET.length), lang);
  if (href === "/docs") return links(lang).docs;
  if (href.startsWith("/")) {
    const page = pageOfPath(href);
    if (!page) throw new Error(`the homepage deck links ${href}, which is no page of the site`);
    return pagePath(page, lang);
  }
  if (href.startsWith(`${CONSOLE_ORIGIN}/`)) {
    const url = new URL(href);
    return consoleUrl(`${url.pathname}${url.search}`, lang);
  }
  return href;
}
