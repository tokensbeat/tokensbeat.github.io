/**
 * The homepage's words: the copy deck ./home-copy.json, kept to what the products do today (each claim as the
 * products' own documentation states it: Aha, Aha Work, Aha's Bots, key plans, the pricing and the privacy policy).
 * The 2026-11-27 deck is a journey along the Milky Way: the hero (the owner's line from 《观沧海》 as the headline, owner
 * 2026-11-16: the poem stays the headline), then four stops, each a product (Aha, Bots, the Model API, Pricing), then
 * the first request, the price figures and the closing. Every text is { en, zh }; the page shows the one for its
 * language. To change the homepage's words, change home-copy.json; its shape is HomeDeck.
 *
 * The deck's hrefs are written once, in English. hrefFor gives each the address for the page's language: a site page
 * as pagePath has it (/zh/pricing/), the docs' quickstart for /docs, a legal document for /legal/<id>, a console page
 * with ?lang=zh, a support ticket for ticket:<subject>; a place on the page (#home-code) and any other site as written.
 */
import { API_BASE_URL, CONSOLE_ORIGIN, consoleUrl, links, ticketUrl } from "@/content/links";
import { legalPath, LEGAL_IDS, type LegalId } from "@/content/routes";
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

/** A line of a stop's plate: a title and its words, or a sentence alone; a status only where it is not Live. */
export interface HomePoint {
  id: string;
  title?: Bi;
  status?: SiteStatus;
  body: Bi;
}

/** A note on the chart, at a point of a product's drawing (../page/milkyWay.ts names the points). */
export interface HomeNote {
  id: string;
  name: Bi;
  line?: Bi;
}

/** One stop of the journey: a product, told on a plate over the chart. */
export interface HomeStop {
  id: "aha" | "bots" | "api" | "pricing";
  eyebrow: Bi;
  title: Bi;
  lead: Bi;
  points: HomePoint[];
  primary?: HomeLink;
  links: HomeLink[];
}

export interface HomeDeck {
  hero: { eyebrow: Bi; titleA: Bi; titleB: Bi; lead: Bi; hint: Bi; primary: HomeLink; secondary: HomeLink };
  chart: { label: Bi; title: Bi; stopsLabel: Bi; pause: Bi; stops: Bi[]; notes: HomeNote[] };
  stops: HomeStop[];
  code: { eyebrow: Bi; title: Bi; lead: Bi; tabs: Bi; primary: HomeLink; links: HomeLink[] };
  pricing: { eyebrow: Bi; title: Bi; lead: Bi; stats: { id: string; label: Bi; value: string }[]; note: Bi };
  closing: { title: Bi; lead: Bi; primary: HomeLink; secondary: HomeLink };
}

export const HOME: HomeDeck = deck as HomeDeck;

/**
 * The first request, in three languages. The model comes from the reader's own environment ($TOKENSBEAT_MODEL): the
 * homepage names no model, so no family is shown above the others.
 */
export const FIRST_REQUEST = [
  {
    id: "curl",
    label: "cURL",
    code: `curl ${API_BASE_URL}/chat/completions \\
  -H "Authorization: Bearer $TOKENSBEAT_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d @- <<EOF
{"model": "$TOKENSBEAT_MODEL",
 "messages": [{"role": "user", "content": "Hello"}]}
EOF`,
  },
  {
    id: "python",
    label: "Python",
    code: `from openai import OpenAI
import os

client = OpenAI(
    base_url="${API_BASE_URL}",
    api_key=os.environ["TOKENSBEAT_API_KEY"],
)
reply = client.chat.completions.create(
    model=os.environ["TOKENSBEAT_MODEL"],
    messages=[{"role": "user", "content": "Hello"}],
)`,
  },
  {
    id: "node",
    label: "Node.js",
    code: `import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "${API_BASE_URL}",
  apiKey: process.env.TOKENSBEAT_API_KEY,
});
const reply = await client.chat.completions.create({
  model: process.env.TOKENSBEAT_MODEL,
  messages: [{ role: "user", content: "Hello" }],
});`,
  },
] as const;

/** Aha and TokensBeat keep their capitals inside the kit's mono-caps labels (a note's name, an eyebrow, a stop). */
export function keepsCase(text: string): boolean {
  return /\bAha\b|TokensBeat/.test(text);
}

const TICKET = "ticket:";

/** A deck href in the page's language. */
export function hrefFor(href: string, lang: Lang): string {
  if (href.startsWith(TICKET)) return ticketUrl(href.slice(TICKET.length), lang);
  if (href === "/docs") return links(lang).docs;
  const legal = /^\/legal\/([a-z-]+)$/.exec(href)?.[1];
  if (legal) {
    if (!(LEGAL_IDS as readonly string[]).includes(legal)) throw new Error(`the homepage deck links ${href}, which is no legal document`);
    return legalPath(legal as LegalId, lang);
  }
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
