/**
 * Where the site sends people. The console (console.tokensbeat.com) understands `?lang=zh|en`, so
 * its links carry the page's language: its front door (from /start/), keys, top-up, the Service Plaza, support tickets.
 * The docs and the legal documents are this site's own pages (src/content/routes.ts), in the page's language, at the
 * addresses tokensbeat.com has always given them; Aha is aha.tokensbeat.com. The site has no sign-in link of its own:
 * the head's Get started opens /start/, where the visitor chooses the console or Aha (owner, 2026-11-02).
 */
import type { Lang } from "@/i18n";
import { docPath, legalPath, type DocSlug } from "./routes";

export const CONSOLE_ORIGIN = "https://console.tokensbeat.com";
export const AHA_URL = "https://aha.tokensbeat.com";
/** TokensBeat News, the daily paper (its own site, in English and Chinese). */
export const NEWS_URL = "https://news.tokensbeat.com";
/** Aha's workspace page (a hash route of the agent UI). */
export const AHA_WORKSPACE_URL = `${AHA_URL}/#workspace`;
/** An app's page inside Aha (what it is, its screenshots, Open): Aha's own address for it, /#/apps/<id>. */
export const ahaAppUrl = (id: "latex" | "beads" | "metro" | "diary") => `${AHA_URL}/#/apps/${id}`;
/** The gateway's base URL, as the docs and the console give it. */
export const API_BASE_URL = "https://api.tokensbeat.com/v1";

/** A console page (`/login`, `/keys`, `/purchase?tab=recharge`…) in the page's language. */
export function consoleUrl(path: string, lang: Lang): string {
  const url = new URL(path, CONSOLE_ORIGIN);
  if (lang === "zh") url.searchParams.set("lang", "zh");
  return url.href;
}

/** An invite code as the console takes one (4-32 of A-Z, 0-9, "_" and "-", any case), else null. */
export function inviteCode(value: string | null | undefined): string | null {
  const code = (value ?? "").trim();
  return /^[A-Za-z0-9_-]{4,32}$/.test(code) ? code : null;
}

/**
 * Where /start/'s "Open the console" goes: the console's front door (it signs the visitor in and opens the overview),
 * or, for a visitor who arrived with an invite code (?aff=CODE), its sign-up, which then opens the console's own invite
 * link (/affiliate?aff=CODE). That page keeps the code for 30 days and offers to bind it; /register itself ignores aff.
 */
export function consoleEntry(lang: Lang, aff: string | null = null): string {
  if (!aff) return consoleUrl("/", lang);
  return consoleUrl(`/register?redirect=${encodeURIComponent(`/affiliate?aff=${encodeURIComponent(aff)}`)}`, lang);
}

/**
 * A support ticket about early access (v4's earlyAccessTicket): the console's ticket form (sign-in first) with its
 * category and subject filled in. No other form exists; the ticket is the request.
 */
export function ticketUrl(subject: string, lang: Lang): string {
  const url = new URL("/support/new", CONSOLE_ORIGIN);
  url.searchParams.set("category", "general");
  url.searchParams.set("subject", subject);
  if (lang === "zh") url.searchParams.set("lang", "zh");
  return url.href;
}

/** A docs guide in a language: /docs/<id>/ or /zh/docs/<id>/ (the quickstart is /docs/). */
export const docUrl = (id: DocSlug, lang: Lang) => docPath(id, lang);

/** Every outside link the pages show, by name, for one language. */
export function links(lang: Lang) {
  return {
    console: consoleUrl("/dashboard", lang),
    keys: consoleUrl("/keys", lang),
    topUp: consoleUrl("/purchase?tab=recharge", lang),
    plaza: consoleUrl("/models", lang),
    plazaStorage: consoleUrl("/plaza/storage", lang),
    news: NEWS_URL,
    plazaWorkspaces: consoleUrl("/plaza/workspaces", lang),
    newTicket: consoleUrl("/support/new", lang),
    aha: AHA_URL,
    ahaWorkspace: AHA_WORKSPACE_URL,
    docs: docPath("quickstart", lang),
    terms: legalPath("terms", lang),
    privacy: legalPath("privacy", lang),
  } as const;
}

export type Links = ReturnType<typeof links>;
