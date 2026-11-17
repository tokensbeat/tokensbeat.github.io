import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { assemble, files, pages, policyTags, sitePaths } from "@/entry-server";
import { appPagePath, CONTENT_PAGES, DOC_SLUGS, LEGAL_UNLISTED } from "@/content/routes";
import { pagePath } from "@/content/site";
import { HOME } from "@/content/home";
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
    // The hero is a line of a poem; the claim under it and the head say the product in plain words.
    expect(page("index.html")).toContain('<p class="h-home-claim">One key for the models. A team of bots for the work.</p>');
    expect(page("zh/index.html")).toContain('<p class="h-home-claim">一把密钥通模型，一队机器人干活。</p>');
    expect(page("index.html")).toContain("<title>TokensBeat: one key for the AI models, and Aha with its working bots</title>");
    for (const part of ["AI models", "API key", "Aha", "bots", "Aha Code", "Postgres backend", "agent runtime", "early access"]) expect(SEO.home.en.description).toContain(part);
    for (const part of ["AI 模型", "API 密钥", "Aha", "机器人", "Aha 代码", "Postgres 后端", "Agent 运行时", "抢先体验"]) expect(SEO.home.zh.description).toContain(part);
    expect(page("index.html")).toContain(`<meta property="og:description" content="${SEO.home.en.description}" />`);
    expect(page("zh/index.html")).toContain(`<meta property="og:description" content="${SEO.home.zh.description}" />`);
  });

  it("prerenders the orbit's first frame: the moons and labels placed, the planet's text in place", () => {
    const html = page("index.html");
    expect(html.match(/class="h-orbit__moon /g)).toHaveLength(10);
    expect(html).toMatch(/class="h-orbit__moon [^"]*"[^>]*style="transform:translate3d\([\d.]+cqw, [\d.]+cqw, 0\)/);
    expect(html).toContain('class="h-orbit__planet-text"');
    expect(html).toMatch(/<button[^>]*class="h-orbit__pause"[^>]*hidden=""/);
  });

  it("points Open Graph at social cards that exist (public/og)", () => {
    for (const lang of LANGS) expect(existsSync(path.join(ROOT, "public", OG_IMAGE[lang])), OG_IMAGE[lang]).toBe(true);
  });

  it("keeps a dollar sign in the page as it is", () => {
    expect(page("index.html")).toMatch(/Start from <b class="h-lean-price__amount">\$5<\/b>\. One prepaid balance/);
  });

  it("marks the 404 page for the client and keeps it out of search", () => {
    const html = page("404.html");
    expect(html).toContain('<div id="root" data-page="404">');
    expect(html).toContain('<meta name="robots" content="noindex" />');
    expect(html).toContain("Page not found.");
  });

  it("gives the homepage's questions as FAQPage data in its language, word for word as the page shows them", () => {
    const zh = structuredData("home", "zh").find((s) => s["@type"] === "FAQPage") as { mainEntity: { name: string; acceptedAnswer: { text: string } }[] };
    expect(zh.mainEntity.map((q) => q.name)).toEqual(HOME.faq.map((x) => x.q.zh));
    expect(zh.mainEntity[0].name).toBe("现在能用的有哪些？");
    const en = structuredData("home", "en").find((s) => s["@type"] === "FAQPage") as { mainEntity: { name: string; acceptedAnswer: { text: string } }[] };
    expect(en.mainEntity.map((q) => q.acceptedAnswer.text)).toEqual(HOME.faq.map((x) => x.a.en));
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
