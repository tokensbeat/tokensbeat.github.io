/**
 * The heads of the content pages (src/content/routes.ts) and their sitemap entries, from the same parts as the twelve
 * pages' (src/seo/head.ts headFromMeta): title, description, canonical, hreflang, cards, and structured data (a
 * TechArticle for a guide, a WebPage for a legal document, each with its breadcrumb). The operators' compliance
 * commitment (LEGAL_UNLISTED) says noindex and is not in the sitemap. For the prerender only.
 */
import { C } from "@/content/copy";
import { CONTENT_PAGES, DOC_SLUGS, docPath, LEGAL_IDS, LEGAL_UNLISTED, legalPath, type ContentPage, type DocSlug, type LegalId } from "@/content/routes";
import { pagePath } from "@/content/site";
import { tagOf, translate, type Lang } from "@/i18n";
import { headFromMeta, SITE_NAME, SITE_URL, type HeadMeta, type JsonLd } from "@/seo/head";
import { CONTENT_DATA } from "./data";

const abs = (path: string) => `${SITE_URL}${path}`;
const SITE_ID = `${SITE_URL}/#website`;
/** The docs' word in a guide's title: "Quickstart | TokensBeat Docs". */
const DOCS_WORD: Record<Lang, string> = { en: "Docs", zh: "文档" };

function breadcrumb(lang: Lang, trail: { name: string; path: string }[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [{ name: translate(lang, C.pages.home.name), path: pagePath("home", lang) }, ...trail].map((x, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: x.name,
      item: abs(x.path),
    })),
  };
}

/** A content page's head meta in a language. */
export function contentMeta(page: ContentPage, lang: Lang): HeadMeta {
  const { articles, ui, legal } = CONTENT_DATA;
  if (page.startsWith("docs:")) {
    const slug = page.slice(5) as DocSlug;
    const article = articles.find((a) => a.slug === slug);
    if (!article) throw new Error(`no article ${slug}`);
    const title = `${article.title[lang]} | ${SITE_NAME} ${DOCS_WORD[lang]}`;
    const urls = { en: abs(docPath(slug, "en")), zh: abs(docPath(slug, "zh")) };
    const trail = [{ name: ui.title[lang], path: docPath("quickstart", lang) }];
    if (slug !== "quickstart") trail.push({ name: article.title[lang], path: docPath(slug, lang) });
    return {
      title,
      description: article.description[lang],
      urls,
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "TechArticle",
          "@id": `${urls[lang]}#article`,
          headline: article.title[lang],
          description: article.description[lang],
          url: urls[lang],
          inLanguage: tagOf(lang),
          isPartOf: { "@id": SITE_ID },
        },
        breadcrumb(lang, trail),
      ],
    };
  }
  const id = page.slice(6) as LegalId;
  const doc = legal[id];
  const urls = { en: abs(legalPath(id, "en")), zh: abs(legalPath(id, "zh")) };
  return {
    title: `${doc.title[lang]} | ${SITE_NAME}`,
    description: doc.description[lang],
    urls,
    noindex: LEGAL_UNLISTED.includes(id),
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "@id": `${urls[lang]}#webpage`,
        url: urls[lang],
        name: doc.title[lang],
        description: doc.description[lang],
        inLanguage: tagOf(lang),
        isPartOf: { "@id": SITE_ID },
        ...(doc.updated[lang] ? { dateModified: doc.updated[lang] } : {}),
      },
      breadcrumb(lang, [{ name: doc.title[lang], path: legalPath(id, lang) }]),
    ],
  };
}

export function contentHead(page: ContentPage, lang: Lang): string {
  return headFromMeta(contentMeta(page, lang), lang);
}

/** The sitemap's entries for the content pages: every guide, the legal documents but the unlisted ones. */
export function contentEntries(): Record<Lang, string>[] {
  return [
    ...DOC_SLUGS.map((slug) => ({ en: abs(docPath(slug, "en")), zh: abs(docPath(slug, "zh")) })),
    ...LEGAL_IDS.filter((id) => !LEGAL_UNLISTED.includes(id)).map((id) => ({ en: abs(legalPath(id, "en")), zh: abs(legalPath(id, "zh")) })),
  ];
}

export { CONTENT_PAGES };
