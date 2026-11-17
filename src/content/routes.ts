/**
 * Every address the site prerenders, beyond its twelve pages (./site.ts): the docs and the legal documents that
 * tokensbeat.com has always had at /docs and /legal/<id> (the Vue site's DocsView and LegalDocumentView), now pages of
 * this site in English and Chinese:
 *   /docs/                    the quickstart (the Vue site's /docs)      /zh/docs/
 *   /docs/<slug>/             every other guide                          /zh/docs/<slug>/
 *   /legal/<id>/              terms, privacy, admin-compliance           /zh/legal/<id>/
 * The words live in src/docs/data.ts, loaded only by the pages that show them (src/main.tsx); this module is the light
 * part every page needs (addresses and the head's links). An "app page" is one of the twelve, a content page
 * ("docs:<slug>", "legal:<id>") or the 404 page; the client learns which from the root's data-page.
 */
import type { Lang } from "@/i18n";
import { pageOfPath, pagePath, type PageId } from "./site";

/** The guides, in the docs' order (src/docs/data.ts DOC_ARTICLES must list exactly these, in this order). */
export const DOC_SLUGS = [
  "quickstart",
  "account",
  "api-keys",
  "models",
  "billing",
  "usage",
  "codex",
  "claude-code",
  "windows-wsl",
  "agent",
  "chat-completions",
  "responses",
  "images",
  "sdks",
  "compatible-apps",
  "errors",
  "troubleshooting",
] as const;
export type DocSlug = (typeof DOC_SLUGS)[number];
/** The guide /docs/ shows (the Vue site's /docs was the quickstart; /docs/quickstart redirects there). */
export const DOCS_HOME: DocSlug = "quickstart";

/** The legal documents (docs/legal/<id>.<lang>.md). admin-compliance is for operators: noindex, not in the sitemap. */
export const LEGAL_IDS = ["terms", "privacy", "admin-compliance"] as const;
export type LegalId = (typeof LEGAL_IDS)[number];
export const LEGAL_UNLISTED: readonly LegalId[] = ["admin-compliance"];

export type ContentPage = `docs:${DocSlug}` | `legal:${LegalId}`;
export type AppPage = PageId | ContentPage | "404";

export const CONTENT_PAGES: readonly ContentPage[] = [
  ...DOC_SLUGS.map((s) => `docs:${s}` as const),
  ...LEGAL_IDS.map((id) => `legal:${id}` as const),
];

export function isContentPage(page: string): page is ContentPage {
  return (CONTENT_PAGES as readonly string[]).includes(page);
}

const prefix = (lang: Lang) => (lang === "zh" ? "/zh" : "");

/** A guide's address: /docs/ for the quickstart, /docs/<slug>/ for the others (/zh/… in Chinese). */
export function docPath(slug: DocSlug, lang: Lang): string {
  return `${prefix(lang)}/docs/${slug === DOCS_HOME ? "" : `${slug}/`}`;
}

/** A legal document's address: /legal/<id>/ (/zh/legal/<id>/ in Chinese). */
export function legalPath(id: LegalId, lang: Lang): string {
  return `${prefix(lang)}/legal/${id}/`;
}

/** Any app page's address in a language; the 404 page has none of its own (the homepage's). */
export function appPagePath(page: AppPage, lang: Lang): string {
  if (page === "404") return pagePath("home", lang);
  if (page.startsWith("docs:")) return docPath(page.slice(5) as DocSlug, lang);
  if (page.startsWith("legal:")) return legalPath(page.slice(6) as LegalId, lang);
  return pagePath(page as PageId, lang);
}

/** The app page an address shows (the dev server, which has no data-page), or null. */
export function appPageOfPath(pathname: string): AppPage | null {
  const rest = pathname.replace(/^\/zh(?=\/|$)/, "").replace(/^\/+|\/+$/g, "");
  if (rest === "docs") return `docs:${DOCS_HOME}`;
  const doc = /^docs\/([a-z0-9-]+)$/.exec(rest)?.[1];
  if (doc && doc !== DOCS_HOME && (DOC_SLUGS as readonly string[]).includes(doc)) return `docs:${doc as DocSlug}`;
  const legal = /^legal\/([a-z0-9-]+)$/.exec(rest)?.[1];
  if (legal && (LEGAL_IDS as readonly string[]).includes(legal)) return `legal:${legal as LegalId}`;
  return pageOfPath(pathname);
}
