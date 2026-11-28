/**
 * Each page's head, written into the prerendered HTML by scripts/prerender.mjs: the title and description v4 gives the
 * page (src/content/seo.ts) in the page's language, the canonical address and its language alternates (hreflang en,
 * zh-CN and x-default on the English), Open Graph and Twitter cards, and structured data: the organization, the site
 * and the questions on the homepage; on every page a WebPage and (below the homepage) its breadcrumb; the API on the AI
 * models page; the questions on the database page. Also robots.txt and sitemap.xml. The docs and the legal documents
 * build their heads from the same parts (src/docs/head.ts: headFromMeta).
 *
 * The public origin is VITE_HOME_SITE_URL at build time (no trailing slash), https://tokensbeat.com by default: this
 * site is tokensbeat.com. Search engines index only that build: any other origin (a preview such as
 * a staging host) or VITE_HOME_NOINDEX=1 marks every page noindex, and robots.txt then allows every page (so the
 * noindex can be read) and names no sitemap (none is written).
 */
import { C } from "@/content/copy";
import { AHA_URL, API_BASE_URL, CONSOLE_ORIGIN } from "@/content/links";
import { SEO } from "@/content/seo";
import { pagePath, type PageId } from "@/content/site";
import { LANGS, tagOf, translate, type Lang } from "@/i18n";

/** tokensbeat.com: the one origin whose build search engines may index. */
export const PRODUCTION_SITE_URL = "https://tokensbeat.com";
export const SITE_URL = (import.meta.env.VITE_HOME_SITE_URL || PRODUCTION_SITE_URL).replace(/\/+$/, "");
/** Whether this build is for search engines: tokensbeat.com's own, not a preview. */
export const INDEXABLE = SITE_URL === PRODUCTION_SITE_URL && import.meta.env.VITE_HOME_NOINDEX !== "1";
export const SITE_NAME = "TokensBeat";
/** The social cards (public/og), 1200 x 630, one per language. */
export const OG_IMAGE = { en: "/og/home.png", zh: "/og/home-zh.png", width: 1200, height: 630 } as const;
const OG_ALT = "TokensBeat: Galaxies of Intelligence. Born from Within. Your creation at the core, the Bedrock ring and the Vanguard orbit around it.";

export function pageUrl(page: PageId, lang: Lang): string {
  return `${SITE_URL}${pagePath(page, lang)}`;
}

export function pageMeta(page: PageId, lang: Lang) {
  const text = SEO[page][lang];
  return {
    title: text.title,
    description: text.description,
    url: pageUrl(page, lang),
    image: `${SITE_URL}${OG_IMAGE[lang]}`,
    imageAlt: translate(lang, OG_ALT),
  };
}

const ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => ESCAPES[c]);
}

/** JSON for a <script> element: no "</script" or "<!--" can end or bend it. */
export function scriptJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
}

export type JsonLd = Record<string, unknown>;

const ORG_ID = `${SITE_URL}/#organization`;
const SITE_ID = `${SITE_URL}/#website`;

/** The questions a page shows, as FAQPage data; `items` are already in the page's language. */
function faqPage(page: PageId, lang: Lang, items: { q: string; a: string }[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${pageUrl(page, lang)}#faq`,
    inLanguage: tagOf(lang),
    mainEntity: items.map((x) => ({
      "@type": "Question",
      name: x.q,
      acceptedAnswer: { "@type": "Answer", text: x.a },
    })),
  };
}

export function structuredData(page: PageId, lang: Lang): JsonLd[] {
  const meta = pageMeta(page, lang);
  const out: JsonLd[] = [];
  if (page === "home") {
    out.push(
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        "@id": ORG_ID,
        name: SITE_NAME,
        url: `${SITE_URL}/`,
        logo: `${SITE_URL}/favicon.svg`,
        sameAs: [AHA_URL, CONSOLE_ORIGIN],
      },
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "@id": SITE_ID,
        name: SITE_NAME,
        url: `${SITE_URL}/`,
        inLanguage: LANGS.map(tagOf),
        publisher: { "@id": ORG_ID },
      },
    );
  }
  out.push({
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${meta.url}#webpage`,
    url: meta.url,
    name: meta.title,
    description: meta.description,
    inLanguage: tagOf(lang),
    isPartOf: { "@id": SITE_ID },
  });
  if (page !== "home") {
    out.push({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: translate(lang, C.pages.home.name), item: pageUrl("home", lang) },
        { "@type": "ListItem", position: 2, name: translate(lang, C.pages[page].name), item: meta.url },
      ],
    });
  }
  if (page === "database") {
    out.push(
      faqPage(
        page,
        lang,
        (["js", "psql", "price"] as const).map((id) => ({ q: translate(lang, C.database.faq[`${id}Q`]), a: translate(lang, C.database.faq[`${id}A`]) })),
      ),
    );
  }
  if (page === "models") {
    out.push({
      "@context": "https://schema.org",
      "@type": "WebAPI",
      name: `${SITE_NAME} API`,
      description: meta.description,
      url: meta.url,
      documentation: `${SITE_URL}/docs/`,
      termsOfService: `${SITE_URL}/legal/terms/`,
      provider: { "@type": "Organization", name: SITE_NAME, url: `${SITE_URL}/` },
      potentialAction: { "@type": "ConsumeAction", target: API_BASE_URL },
    });
  }
  return out;
}

const OG_LOCALE: Record<Lang, string> = { en: "en_US", zh: "zh_CN" };

/** What a page's head says: its words, its address in each language, its structured data. */
export interface HeadMeta {
  title: string;
  description: string;
  /** The page's address in each language (absolute). */
  urls: Readonly<Record<Lang, string>>;
  jsonLd: JsonLd[];
  /** Keep this page out of search engines even in an indexable build. */
  noindex?: boolean;
}

/** The tags for a page's <head>, after the charset and viewport, in `lang`. */
export function headFromMeta(m: HeadMeta, lang: Lang): string {
  const e = escapeHtml;
  const url = m.urls[lang];
  const image = `${SITE_URL}${OG_IMAGE[lang]}`;
  const imageAlt = translate(lang, OG_ALT);
  const lines = [
    `<title>${e(m.title)}</title>`,
    `<meta name="description" content="${e(m.description)}" />`,
    ...(!INDEXABLE || m.noindex ? [`<meta name="robots" content="noindex" />`] : []),
    `<link rel="canonical" href="${e(url)}" />`,
    ...LANGS.map((l) => `<link rel="alternate" hreflang="${tagOf(l)}" href="${e(m.urls[l])}" />`),
    `<link rel="alternate" hreflang="x-default" href="${e(m.urls.en)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:title" content="${e(m.title)}" />`,
    `<meta property="og:description" content="${e(m.description)}" />`,
    `<meta property="og:url" content="${e(url)}" />`,
    `<meta property="og:locale" content="${OG_LOCALE[lang]}" />`,
    ...LANGS.filter((l) => l !== lang).map((l) => `<meta property="og:locale:alternate" content="${OG_LOCALE[l]}" />`),
    `<meta property="og:image" content="${e(image)}" />`,
    `<meta property="og:image:width" content="${OG_IMAGE.width}" />`,
    `<meta property="og:image:height" content="${OG_IMAGE.height}" />`,
    `<meta property="og:image:alt" content="${e(imageAlt)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${e(m.title)}" />`,
    `<meta name="twitter:description" content="${e(m.description)}" />`,
    `<meta name="twitter:image" content="${e(image)}" />`,
    `<meta name="twitter:image:alt" content="${e(imageAlt)}" />`,
    ...m.jsonLd.map((d) => `<script type="application/ld+json">${scriptJson(d)}</script>`),
  ];
  return lines.join("\n    ");
}

/** The tags for one of the twelve pages' <head>, after the charset and viewport. */
export function headTags(page: PageId, lang: Lang): string {
  const m = pageMeta(page, lang);
  return headFromMeta(
    { title: m.title, description: m.description, urls: { en: pageUrl(page, "en"), zh: pageUrl(page, "zh") }, jsonLd: structuredData(page, lang) },
    lang,
  );
}

/** robots.txt: every page allowed; the sitemap only in an indexable build (a preview has none, its pages say noindex). */
export function robotsTxt(): string {
  return INDEXABLE ? `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n` : "User-agent: *\nAllow: /\n";
}

/** The twelve pages' entries for the sitemap: each page's address in every language. */
export function pageEntries(pages: readonly PageId[]): Record<Lang, string>[] {
  return pages.map((page) => ({ en: pageUrl(page, "en"), zh: pageUrl(page, "zh") }));
}

/** One <url> per page and language, each with its alternates. */
export function sitemapXml(entries: readonly Readonly<Record<Lang, string>>[]): string {
  const urls = entries.flatMap((entry) => {
    const alternates = LANGS.map((l) => `    <xhtml:link rel="alternate" hreflang="${tagOf(l)}" href="${escapeHtml(entry[l])}" />`)
      .concat(`    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeHtml(entry.en)}" />`)
      .join("\n");
    return LANGS.map((l) => `  <url>\n    <loc>${escapeHtml(entry[l])}</loc>\n${alternates}\n  </url>`);
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join("\n")}\n</urlset>\n`;
}
