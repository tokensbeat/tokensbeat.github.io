import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { assemble, files, pages, policyTags, sitePaths } from "@/entry-server";
import { appPagePath, CONTENT_PAGES, DOC_SLUGS, LEGAL_UNLISTED } from "@/content/routes";
import { pagePath } from "@/content/site";
import { SEO } from "@/content/seo";
import { LANGS, tagOf, translate } from "@/i18n";
import { C } from "@/content/copy";
import { BUILT_PAGES } from "@/page/pages";
import { headTags, INDEXABLE, OG_IMAGE, pageUrl, SITE_URL, structuredData } from "@/seo/head";

const ROOT = path.resolve(import.meta.dirname, "../..");
const TEMPLATE = readFileSync(path.join(ROOT, "index.html"), "utf8");

function page(file: string): string {
  const p = pages().find((x) => x.file === file)!;
  return assemble(TEMPLATE, { ...p, body: p.render(), preload: ["/assets/font-abc.woff2"] });
}
const fileOf = (id: (typeof BUILT_PAGES)[number], lang: "en" | "zh") => `${pagePath(id, lang).slice(1)}index.html`;
const h1Of = (html: string) => /<h1[^>]*>([\s\S]*?)<\/h1>/.exec(html)?.[1].replace(/<[^>]+>/g, "").trim();

describe("the prerendered pages", () => {
  it("writes every page in both languages, the docs and the legal documents, and the 404 page", () => {
    const want = BUILT_PAGES.flatMap((id) => LANGS.map((l) => fileOf(id, l)));
    const content = CONTENT_PAGES.flatMap((p) => LANGS.map((l) => `${appPagePath(p, l).slice(1)}index.html`));
    expect(pages().map((p) => p.file)).toEqual([...want, ...content, "404.html"]);
    expect(want).toContain("index.html");
    expect(want).toContain("zh/index.html");
    for (const f of ["docs/index.html", "zh/docs/index.html", "docs/codex/index.html", "zh/docs/troubleshooting/index.html", "legal/terms/index.html", "zh/legal/privacy/index.html", "legal/admin-compliance/index.html"]) {
      expect(content).toContain(f);
    }
    expect(content).not.toContain("docs/quickstart/index.html");
  });

  it("is the build for tokensbeat.com, for search engines (no noindex but the 404 page and the operators' commitment)", () => {
    expect(SITE_URL).toBe("https://tokensbeat.com");
    expect(INDEXABLE).toBe(true);
    for (const p of pages()) {
      const noindex = p.head.includes('name="robots" content="noindex"');
      expect(noindex, p.file).toBe(p.file === "404.html" || LEGAL_UNLISTED.some((id) => p.file.includes(`legal/${id}/`)));
    }
  });

  describe.each(BUILT_PAGES.flatMap((id) => LANGS.map((lang) => [id, lang] as const)))("%s in %s", (id, lang) => {
    const html = page(fileOf(id, lang));

    it("has its language, one h1 in the body, and the page id for the client", () => {
      expect(html).toContain(`<html lang="${tagOf(lang)}">`);
      expect(html.match(/<h1[\s>]/g)).toHaveLength(1);
      expect(h1Of(html)).toBeTruthy();
      expect(html).toContain(`<div id="root" data-page="${id}">`);
    });

    it("has its title, description, canonical and alternates", () => {
      const seo = SEO[id][lang];
      expect(html).toContain(`<title>${seo.title.replace(/'/g, "&#39;")}</title>`);
      expect(html).toContain(`<link rel="canonical" href="${SITE_URL}${pagePath(id, lang)}" />`);
      expect(html).toContain(`<link rel="alternate" hreflang="en" href="${SITE_URL}${pagePath(id, "en")}" />`);
      expect(html).toContain(`<link rel="alternate" hreflang="zh-CN" href="${SITE_URL}${pagePath(id, "zh")}" />`);
      expect(html).toContain(`<link rel="alternate" hreflang="x-default" href="${SITE_URL}${pagePath(id, "en")}" />`);
      expect(html).toContain(`<meta property="og:locale" content="${lang === "zh" ? "zh_CN" : "en_US"}" />`);
      expect(html).toContain(`<meta property="og:image" content="${SITE_URL}${OG_IMAGE[lang]}" />`);
      expect(html).not.toContain("<!--head-->");
      expect(html).not.toContain('<div id="root"></div>');
    });

    it("gives structured data that parses", () => {
      const scripts = [...headTags(id, lang).matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
      expect(scripts).toEqual(structuredData(id, lang));
      expect(scripts.find((s) => s["@type"] === "WebPage").inLanguage).toBe(tagOf(lang));
    });
  });

  it("puts the deck's headline in / and /zh/, and a description that names the products", () => {
    expect(h1Of(page("index.html"))).toBe("Galaxies of Intelligence. Born from Within.");
    expect(h1Of(page("zh/index.html"))).toBe("星汉灿烂，若出其里。");
    // The hero is a line of a poem; the lead under it and the head say the products in plain words.
    expect(page("index.html")).toContain('<p class="h-lead">One account for an AI assistant, bots that run on a schedule, and one API key for every model. Pay as you go.</p>');
    expect(page("zh/index.html")).toContain('<p class="h-lead">一个账户：AI 助手、按日程运行的机器人，和一把调用所有模型的 API 密钥。按用量付费。</p>');
    expect(page("index.html")).toContain("<title>TokensBeat: an AI assistant, bots on a schedule, and one API key for every model</title>");
    for (const part of ["Aha", "AI assistant", "bots", "API key", "every model", "prepaid balance"]) expect(SEO.home.en.description).toContain(part);
    for (const part of ["Aha", "AI 助手", "机器人", "API 密钥", "所有模型", "预付余额"]) expect(SEO.home.zh.description).toContain(part);
    expect(page("index.html")).toContain(`<meta property="og:description" content="${SEO.home.en.description}" />`);
    expect(page("zh/index.html")).toContain(`<meta property="og:description" content="${SEO.home.zh.description}" />`);
  });

  it("prerenders the journey: the chart's empty canvas and its notes, the five stops, the first stop in force", () => {
    const html = page("index.html");
    expect(html).toMatch(/<canvas class="j__cv" role="img" aria-label="A star chart of the Milky Way drawn in characters/);
    expect(html.match(/class="j__note"/g)).toHaveLength(16);
    expect(html.match(/class="j__step[ "]/g)).toHaveLength(5);
    expect(html.match(/<button type="button" class="j__stop"/g)).toHaveLength(5);
    expect(html).toContain('<button type="button" class="j__stop" aria-current="step">');
    expect(html).toContain("00 / 04 · Start");
  });

  it("points Open Graph at social cards that exist (public/og)", () => {
    for (const lang of LANGS) expect(existsSync(path.join(ROOT, "public", OG_IMAGE[lang])), OG_IMAGE[lang]).toBe(true);
  });

  it("keeps a dollar sign in the page as it is", () => {
    expect(page("index.html")).toContain('<p class="s1-stat__value">$5</p>');
    expect(page("index.html")).toContain("Top up from $5 by card or Link, or from $15 in USDT or USDC.");
  });

  it("marks the 404 page for the client and keeps it out of search", () => {
    const html = page("404.html");
    expect(html).toContain('<div id="root" data-page="404">');
    expect(html).toContain('<meta name="robots" content="noindex" />');
    expect(html).toContain("Page not found.");
  });

  it("gives FAQPage data only where the page shows its questions: the database page, not the homepage", () => {
    for (const lang of LANGS) expect(structuredData("home", lang).some((s) => s["@type"] === "FAQPage")).toBe(false);
    const db = structuredData("database", "zh").find((s) => s["@type"] === "FAQPage") as { mainEntity: { name: string }[] };
    expect(db.mainEntity).toHaveLength(3);
    expect(db.mainEntity[0].name).toBe(translate("zh", C.database.faq.jsQ));
  });

  it("lists every page, guide and listed legal document in both languages in the sitemap, each with its alternates", () => {
    const xml = files["sitemap.xml"]();
    for (const id of BUILT_PAGES) for (const l of LANGS) expect(xml).toContain(`<loc>${pageUrl(id, l)}</loc>`);
    for (const l of LANGS) {
      expect(xml).toContain(`<loc>${SITE_URL}${l === "zh" ? "/zh" : ""}/docs/</loc>`);
      expect(xml).toContain(`<loc>${SITE_URL}${l === "zh" ? "/zh" : ""}/docs/claude-code/</loc>`);
      expect(xml).toContain(`<loc>${SITE_URL}${l === "zh" ? "/zh" : ""}/legal/terms/</loc>`);
      expect(xml).toContain(`<loc>${SITE_URL}${l === "zh" ? "/zh" : ""}/legal/privacy/</loc>`);
    }
    expect(xml).not.toContain("admin-compliance");
    const entries = BUILT_PAGES.length + DOC_SLUGS.length + 2;
    expect(xml.match(/<url>/g)).toHaveLength(entries * 2);
    expect(xml.match(/hreflang="x-default"/g)).toHaveLength(entries * 2);
    expect(files["robots.txt"]()).toContain(`Sitemap: ${SITE_URL}/sitemap.xml`);
  });

  it("starts the 404 page with the script that sends old addresses where they live now", () => {
    const html = page("404.html");
    const head = html.slice(0, html.indexOf("</head>"));
    expect(head.indexOf("<script>(function(){try{var to=")).toBeGreaterThan(0);
    expect(head.indexOf("<script>(function(){try{var to=")).toBeLessThan(head.indexOf("<title>"));
    expect(head).toContain("https://console.tokensbeat.com");
    expect(sitePaths()).toContain("/zh/docs/codex/");
    expect(sitePaths()).toContain("/legal/terms/");
  });

  it("writes the policy tags with every inline script's hash and the API origin the live checks call", () => {
    const tags = policyTags(["sha256-abc", "sha256-def"]);
    expect(tags).toContain('<meta http-equiv="Content-Security-Policy" content="default-src \'self\'; ');
    expect(tags).toContain("script-src 'self' https://static.cloudflareinsights.com 'sha256-abc' 'sha256-def';");
    expect(tags).toContain('<meta name="referrer" content="strict-origin-when-cross-origin" />');
  });
});

// After a build: the files themselves (HOME_DIST, else dist/). Skipped on a tree that has not been built.
const DIST = process.env.HOME_DIST ? path.resolve(process.env.HOME_DIST) : path.join(ROOT, "dist");
const built = existsSync(path.join(DIST, "zh", "index.html")) && readFileSync(path.join(DIST, "index.html"), "utf8").includes('data-page="home"');
describe.skipIf(!built)("the built site", () => {
  it.each(BUILT_PAGES.flatMap((id) => LANGS.map((lang) => [id, lang] as const)))("%s in %s has its h1, hreflang and the assets it names", (id, lang) => {
    const html = readFileSync(path.join(DIST, fileOf(id, lang)), "utf8");
    expect(html).toContain(`<html lang="${tagOf(lang)}">`);
    expect(h1Of(html)).toBe(h1Of(page(fileOf(id, lang))));
    expect(html).toMatch(/hreflang="zh-CN"/);
    expect(html).toMatch(/hreflang="x-default"/);
    for (const m of html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)) expect(existsSync(path.join(DIST, m[1])), m[1]).toBe(true);
  });

  it("has the 404 page, robots.txt and sitemap.xml, and no other host's config", () => {
    expect(existsSync(path.join(DIST, "404.html"))).toBe(true);
    expect(existsSync(path.join(DIST, "robots.txt"))).toBe(true);
    const indexable = readFileSync(path.join(DIST, "robots.txt"), "utf8").includes("Sitemap:");
    if (indexable) expect(readFileSync(path.join(DIST, "sitemap.xml"), "utf8").match(/<url>/g)).toHaveLength((BUILT_PAGES.length + DOC_SLUGS.length + 2) * 2);
    else expect(existsSync(path.join(DIST, "sitemap.xml"))).toBe(false);
    expect(existsSync(path.join(DIST, "staticwebapp.config.json"))).toBe(false);
  });

  it.each(CONTENT_PAGES.flatMap((p) => LANGS.map((lang) => [p, lang] as const)))("%s in %s is built, with the assets it names", (p, lang) => {
    const html = readFileSync(path.join(DIST, `${appPagePath(p, lang).slice(1)}index.html`), "utf8");
    expect(html).toContain(`data-page="${p}"`);
    expect(html).toContain(`<html lang="${tagOf(lang)}">`);
    for (const m of html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)) expect(existsSync(path.join(DIST, m[1])), m[1]).toBe(true);
  });

  it("allows every inline script of every page by its hash in the policy the page carries first", () => {
    for (const file of [...BUILT_PAGES.map((id) => fileOf(id, "en")), "404.html", "docs/index.html", "zh/legal/terms/index.html"]) {
      const html = readFileSync(path.join(DIST, file), "utf8");
      const head = html.slice(0, html.indexOf("</head>"));
      const policy = /<meta http-equiv="Content-Security-Policy" content="([^"]+)" \/>/.exec(head)?.[1];
      expect(policy, file).toBeDefined();
      expect(head.indexOf("Content-Security-Policy"), file).toBeLessThan(head.indexOf("<script"));
      for (const m of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) {
        expect(policy, file).toContain(`'sha256-${createHash("sha256").update(m[1], "utf8").digest("base64")}'`);
      }
    }
  });
});
