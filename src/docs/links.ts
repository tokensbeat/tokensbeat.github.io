/**
 * A link in the docs or a legal document, written as an address of the old site, for the reader's language:
 *   /docs, /docs/<slug>, /legal/<id>    this site's page (/zh/… in Chinese)
 *   /keys, /purchase, /plaza/models…    where the old address moved (src/seo/moved.ts): the console's page carries the
 *                                       language (?lang=zh), another origin's is as it is
 *   https://…                           another site, in a new tab
 * Anything else is no link (its words stay as text); the tests check that every link of every document resolves.
 */
import { CONSOLE_ORIGIN, consoleUrl } from "@/content/links";
import { DOC_SLUGS, docPath, LEGAL_IDS, legalPath, type DocSlug, type LegalId } from "@/content/routes";
import type { Lang } from "@/i18n";
import { movedTables, movedTarget } from "@/seo/moved";
import type { LinkTarget } from "./markdown";

const MOVED = movedTables([]);

export function resolveContentHref(href: string, lang: Lang): LinkTarget | null {
  if (/^https:\/\/[^/]/.test(href)) return { href, external: true };
  if (!href.startsWith("/") || href.startsWith("//")) return null;
  const [path, hash = ""] = href.split("#");
  const bare = path.replace(/\/+$/, "") || "/";
  const anchor = hash ? `#${hash}` : "";
  if (bare === "/docs") return { href: docPath("quickstart", lang) + anchor, external: false };
  const doc = /^\/docs\/([a-z0-9-]+)$/.exec(bare)?.[1];
  if (doc && (DOC_SLUGS as readonly string[]).includes(doc)) return { href: docPath(doc as DocSlug, lang) + anchor, external: false };
  const legal = /^\/legal\/([a-z0-9-]+)$/.exec(bare)?.[1];
  if (legal && (LEGAL_IDS as readonly string[]).includes(legal)) return { href: legalPath(legal as LegalId, lang) + anchor, external: false };
  const query = path.includes("?") ? path.slice(path.indexOf("?")) : "";
  const moved = movedTarget({ pathname: path.split("?")[0], search: query, hash: anchor }, MOVED);
  if (!moved) return null;
  if (moved.startsWith(`${CONSOLE_ORIGIN}/`)) return { href: consoleUrl(moved.slice(CONSOLE_ORIGIN.length), lang), external: false };
  return { href: moved, external: false };
}
