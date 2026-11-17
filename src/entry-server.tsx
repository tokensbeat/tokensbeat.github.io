/**
 * The server build (vite build --ssr), for scripts/prerender.mjs only: each page in each language as HTML, with its
 * head (the twelve pages, the docs' guides and the legal documents), the 404 page with the script that sends old
 * addresses where they live now (src/seo/moved.ts), robots.txt and sitemap.xml, and the pages' policy tags
 * (src/seo/policy.ts, written once the pages' inline scripts are known). Never shipped to the browser.
 */
import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { App } from "./App";
import { appPagePath, CONTENT_PAGES, type AppPage, type ContentPage } from "./content/routes";
import { pagePath, type PageId } from "./content/site";
import { CONTENT_DATA } from "./docs/data";
import { contentEntries, contentHead } from "./docs/head";
import { LANGS, tagOf, type Lang } from "./i18n";
import { API_ORIGIN } from "./page/live";
import { BUILT_PAGES } from "./page/pages";
import { headTags, INDEXABLE, pageEntries, robotsTxt, sitemapXml } from "./seo/head";
import { movedScript, movedTables } from "./seo/moved";
import { policyTags as policyTagsFor } from "./seo/policy";

export { assemble } from "./seo/assemble";
export { movedTables, movedTarget } from "./seo/moved";

export interface PrerenderPage {
  /** The file under dist/: index.html, zh/index.html, database/index.html, docs/codex/index.html… */
  file: string;
  /** <html lang>. */
  lang: string;
  /** The tags after the viewport meta. */
  head: string;
  /** The root's attributes (data-page). */
  rootAttrs: string;
  render: () => string;
}

function render(page: AppPage, lang: Lang) {
  return () =>
    renderToString(
      <StrictMode>
        <App lang={lang} page={page} content={page === "404" || BUILT_PAGES.includes(page as PageId) ? null : CONTENT_DATA} />
      </StrictMode>,
    );
}

function sitePage(id: PageId, lang: Lang): PrerenderPage {
  return { file: `${pagePath(id, lang).slice(1)}index.html`, lang: tagOf(lang), head: headTags(id, lang), rootAttrs: ` data-page="${id}"`, render: render(id, lang) };
}

function contentPage(page: ContentPage, lang: Lang): PrerenderPage {
  return {
    file: `${appPagePath(page, lang).slice(1)}index.html`,
    lang: tagOf(lang),
    head: contentHead(page, lang),
    rootAttrs: ` data-page="${page}"`,
    render: render(page, lang),
  };
}

/** Every prerendered page's address ("/", "/zh/docs/codex/"…): the redirect script canonicalises their case. */
export function sitePaths(): string[] {
  return [...BUILT_PAGES, ...CONTENT_PAGES].flatMap((page) => LANGS.map((lang) => appPagePath(page, lang)));
}

export function pages(): PrerenderPage[] {
  return [
    ...BUILT_PAGES.flatMap((id) => LANGS.map((lang) => sitePage(id, lang))),
    ...CONTENT_PAGES.flatMap((page) => LANGS.map((lang) => contentPage(page, lang))),
    {
      file: "404.html",
      lang: "en",
      // First: an old address of tokensbeat.com goes where it lives now, before anything renders.
      head: [`<script>${movedScript(movedTables(sitePaths()))}</script>`, `<title>Page not found · TokensBeat</title>`, `<meta name="robots" content="noindex" />`].join(
        "\n    ",
      ),
      rootAttrs: ' data-page="404"',
      render: render("404", "en"),
    },
  ];
}

/** robots.txt always; sitemap.xml in an indexable build only (a preview's pages say noindex: src/seo/head.ts). */
export const files: Record<string, () => string> = {
  "robots.txt": robotsTxt,
  ...(INDEXABLE ? { "sitemap.xml": () => sitemapXml([...pageEntries(BUILT_PAGES), ...contentEntries()]) } : {}),
};

/**
 * The policy tags every page carries, for pages whose inline scripts hash to `hashes` (scripts/prerender.mjs computes
 * them), calling the API at this build's API origin (src/page/live.ts).
 */
export function policyTags(hashes: readonly string[]): string {
  return policyTagsFor({ hashes, apiOrigin: API_ORIGIN });
}

export { API_ORIGIN, INDEXABLE };
export { SITE_URL } from "./seo/head";
