import { readFileSync } from "node:fs";
import path from "node:path";
import { render, screen, within } from "@testing-library/react";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { App } from "@/App";
import { assemble, pages } from "@/entry-server";
import { appPagePath, appPageOfPath, CONTENT_PAGES, DOC_SLUGS, docPath, LEGAL_IDS, legalPath, type ContentPage } from "@/content/routes";
import { LANGS, missingZh, tagOf } from "@/i18n";
import { CONTENT_DATA } from "./data";
import { contentEntries, contentMeta } from "./head";
import { LEGAL_DOCS } from "./legal";
import { resolveContentHref } from "./links";
import { renderMarkdown } from "./markdown";

const ROOT = path.resolve(import.meta.dirname, "../..");
const TEMPLATE = readFileSync(path.join(ROOT, "index.html"), "utf8");
const { articles } = CONTENT_DATA;
/** Sections written here after the port (2026-11-02), as "<slug>#<section>": the Vue site never had them. */
const ADDED_AFTER_PORT = new Set(["agent#phone-tasks", "compatible-apps#mika"]);

describe("the docs, ported from the Vue site", () => {
  it("has every guide of /docs, in its order, at its address", () => {
    expect(articles.map((a) => a.slug)).toEqual([...DOC_SLUGS]);
    expect(docPath("quickstart", "en")).toBe("/docs/");
    expect(docPath("codex", "zh")).toBe("/zh/docs/codex/");
    expect(appPageOfPath("/docs")).toBe("docs:quickstart");
    expect(appPageOfPath("/zh/docs/claude-code/")).toBe("docs:claude-code");
    expect(appPageOfPath("/docs/quickstart/")).toBeNull();
    expect(appPageOfPath("/legal/privacy/")).toBe("legal:privacy");
    expect(appPageOfPath("/legal/usage-policy/")).toBeNull();
  });

  it("has the sections written here after the port: Phone tasks in the Aha app, and Mika with your own key", () => {
    const section = (slug: string, id: string) => articles.find((a) => a.slug === slug)!.sections.find((s) => s.id === id)!;
    for (const key of ADDED_AFTER_PORT) expect(section(...(key.split("#") as [string, string])), key).toBeTruthy();
    const phone = JSON.stringify(section("agent", "phone-tasks"));
    for (const words of ["Set up and open", "“Aha phone agent”", "gemini-3.8-flash", "Wireless debugging", "accessibility service", "Android 12", "设置并打开", "无线调试", "无障碍服务"]) expect(phone).toContain(words);
    const mika = JSON.stringify(section("compatible-apps", "mika"));
    expect(mika).toContain("https://api.tokensbeat.com/v1");
    expect(mika).toContain("/docs/agent#phone-tasks");
    for (const lang of LANGS) expect(resolveContentHref("/docs/agent#phone-tasks", lang)!.href).toBe(`${docPath("agent", lang)}#phone-tasks`);
  });

  it("puts the account at console.tokensbeat.com (this site is tokensbeat.com), with a console link beside it", () => {
    const words = JSON.stringify(articles);
    // No sentence locates the account on the bare tokensbeat.com any more.
    expect(words).not.toMatch(/(?<![\w./@-])tokensbeat\.com(?![\w/])/);
    const quickstart = articles.find((a) => a.slug === "quickstart")!.sections.find((s) => s.id === "prepare")!;
    expect(JSON.stringify(quickstart)).toContain("Sign in at console.tokensbeat.com");
    expect(JSON.stringify(quickstart)).toContain("在 console.tokensbeat.com 使用邮箱");
    const links = quickstart.blocks.flatMap((b) => (b.type === "links" ? b.items.map((i) => i.href) : []));
    expect(links).toEqual(["/login", "/purchase", "/keys", "/docs/billing"]);
    expect(resolveContentHref("/login", "zh")!.href).toBe("https://console.tokensbeat.com/login?lang=zh");
    const agent = articles.find((a) => a.slug === "agent")!.sections.find((s) => s.id === "billing")!;
    expect(JSON.stringify(agent)).toContain("the same account you use on console.tokensbeat.com");
    expect(agent.blocks.some((b) => b.type === "links" && b.items.some((i) => i.href === "/dashboard"))).toBe(true);
  });

  it("writes the brand TokensBeat everywhere", () => {
    expect(JSON.stringify(CONTENT_DATA)).not.toMatch(/Tokensbeat/);
  });

  it.each(LANGS)("resolves every link of every guide and legal document in %s", (lang) => {
    const hrefs = articles.flatMap((a) => a.sections.flatMap((s) => s.blocks.flatMap((b) => (b.type === "links" ? b.items.map((i) => i.href) : []))));
    const legalLinks = LEGAL_IDS.flatMap((id) => [...LEGAL_DOCS[id].markdown[lang].matchAll(/\]\(([^)\s]+)\)/g)].map((m) => m[1]));
    expect(hrefs.length).toBeGreaterThan(30);
    for (const href of [...hrefs, ...legalLinks]) {
      const to = resolveContentHref(href, lang);
      expect(to, href).not.toBeNull();
      // A link to a section (#id) is its page's address plus the section's anchor (ContentPage gives sections their ids).
      if (to!.href.startsWith("/")) expect(appPageOfPath(to!.href.split("#")[0]!), `${href} -> ${to!.href}`).not.toBeNull();
      if (to!.href.startsWith("https://console.tokensbeat.com")) expect(new URL(to!.href).searchParams.get("lang"), href).toBe(lang === "zh" ? "zh" : null);
    }
    expect(resolveContentHref("/docs/billing", lang)!.href).toBe(docPath("billing", lang));
    expect(resolveContentHref("/legal/terms", lang)!.href).toBe(legalPath("terms", lang));
    expect(resolveContentHref("/keys", lang)!.href).toBe(`https://console.tokensbeat.com/keys${lang === "zh" ? "?lang=zh" : ""}`);
    expect(resolveContentHref("javascript:alert(1)", lang)).toBeNull();
    expect(resolveContentHref("//evil.example", lang)).toBeNull();
  });
});

describe("the legal documents", () => {
  it.each(LEGAL_IDS.flatMap((id) => LANGS.map((lang) => [id, lang] as const)))("%s in %s: every placeholder filled, the version line out", (id, lang) => {
    const doc = LEGAL_DOCS[id];
    expect(doc.markdown[lang]).not.toMatch(/\{\{/);
    expect(doc.markdown[lang]).not.toMatch(/^\s*(Version|版本)[:：]/m);
    expect(doc.markdown[lang]).not.toMatch(/^#\s/);
    expect(doc.markdown[lang]).not.toMatch(/Tokensbeat/);
  });

  it("prints the version as the date and the creator where a contact line was", () => {
    expect(LEGAL_DOCS.terms.updated.en).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(LEGAL_DOCS.privacy.updated.zh).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(LEGAL_DOCS["admin-compliance"].updated.en).toBe("");
    expect(LEGAL_DOCS.terms.markdown.en).toContain("Created by s1lin — [s1lin.tokensbeat.com](https://s1lin.tokensbeat.com)");
    expect(LEGAL_DOCS.privacy.markdown.zh).toContain("由 s1lin 创建 — [s1lin.tokensbeat.com](https://s1lin.tokensbeat.com)");
    expect(LEGAL_DOCS.terms.markdown.en).toContain("the API endpoint at api.tokensbeat.com, Aha, the agent application at aha.tokensbeat.com");
    expect(LEGAL_DOCS.terms.markdown.en).toMatch(/your use of TokensBeat —/);
  });
});

describe("the Markdown of the legal documents", () => {
  const link = (href: string) => (href.startsWith("/") ? { href: `/x${href}`, external: false } : href.startsWith("https://") ? { href, external: true } : null);

  it("renders headings under the page's h1, paragraphs, lists, tables, emphasis and links", () => {
    const html = renderMarkdown(
      "## 1. Title\n\nA **bold** and *slanted* line\ncontinued, with `code`.\n\n- one\n- two [link](/legal/terms)\n  more of two\n\n1. first\n2. second\n\n| A | B |\n| --- | --- |\n| a | [out](https://x.example) |\n\n### Sub",
      link,
    );
    expect(html).toContain("<h2>1. Title</h2>");
    expect(html).toContain("<p>A <strong>bold</strong> and <em>slanted</em> line continued, with <code>code</code>.</p>");
    expect(html).toContain('<ul><li>one</li><li>two <a href="/x/legal/terms">link</a> more of two</li></ul>');
    expect(html).toContain("<ol><li>first</li><li>second</li></ol>");
    expect(html).toContain('<th scope="col">A</th>');
    expect(html).toContain('<td><a href="https://x.example" target="_blank" rel="noopener noreferrer">out</a></td>');
    expect(html).toContain("<h3>Sub</h3>");
  });

  it("escapes every character of the text and keeps no link the page does not allow", () => {
    const html = renderMarkdown('<script>alert("x")</script> & [bad](javascript:alert(1)) [ok](/a?b=1&c="2")', link);
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; bad) ");
    expect(html).not.toContain("javascript");
    expect(html).toContain('href="/x/a?b=1&amp;c=&quot;2&quot;"');
  });

  it("renders every legal document with links in its own language", () => {
    for (const id of LEGAL_IDS) {
      for (const lang of LANGS) {
        const html = renderMarkdown(LEGAL_DOCS[id].markdown[lang], (href) => resolveContentHref(href, lang));
        expect(html).not.toMatch(/\[[^\]]+\]\(/); // no Markdown link left unrendered
        if (id === "terms") expect(html).toContain(`href="${legalPath("privacy", lang)}"`);
      }
    }
  });
});

describe.each(CONTENT_PAGES.flatMap((page) => LANGS.map((lang) => [page, lang] as const)))("%s in %s", (page, lang) => {
  it("renders one h1 named by the main landmark, the head's language switch to its own address", () => {
    render(<App lang={lang} page={page} content={CONTENT_DATA} />);
    const h1s = screen.getAllByRole("heading", { level: 1 });
    expect(h1s).toHaveLength(1);
    expect(screen.getByRole("main")).toHaveAttribute("aria-labelledby", h1s[0].id);
    const group = within(screen.getByRole("banner")).getByRole("group");
    expect(within(group).getByRole("link", { name: "English" })).toHaveAttribute("href", appPagePath(page, "en"));
    expect(within(group).getByRole("link", { name: "中文" })).toHaveAttribute("href", appPagePath(page, "zh"));
    expect(document.body.textContent).not.toMatch(/Tokensbeat/);
  });

  it("has a head with its own canonical and alternates", () => {
    const meta = contentMeta(page as ContentPage, lang);
    expect(meta.urls[lang]).toBe(`https://tokensbeat.com${appPagePath(page, lang)}`);
    expect(meta.title).toMatch(/TokensBeat/);
    expect(meta.noindex ?? false).toBe(page === "legal:admin-compliance");
  });
});

describe("the content pages' prerender", () => {
  it("has Chinese for every word the Chinese pages show (the docs' words are their own, both languages)", () => {
    for (const page of CONTENT_PAGES) {
      missingZh.clear();
      renderToString(createElement(App, { lang: "zh", page, content: CONTENT_DATA }));
      expect([...missingZh], page).toEqual([]);
    }
  });

  it("writes the page id for the client, the language, the guide's title and its sections", () => {
    const p = pages().find((x) => x.file === "zh/docs/codex/index.html")!;
    const html = assemble(TEMPLATE, { ...p, body: p.render() });
    expect(html).toContain(`<html lang="${tagOf("zh")}">`);
    expect(html).toContain('<div id="root" data-page="docs:codex">');
    expect(html).toContain('<link rel="canonical" href="https://tokensbeat.com/zh/docs/codex/" />');
    expect(html).toContain('<link rel="alternate" hreflang="en" href="https://tokensbeat.com/docs/codex/" />');
    const codex = articles.find((a) => a.slug === "codex")!;
    expect(html).toContain(codex.title.zh);
    for (const s of codex.sections) expect(html).toContain(`id="${s.id}"`);
  });

  it("writes a legal document as HTML with its date", () => {
    const p = pages().find((x) => x.file === "legal/privacy/index.html")!;
    const html = assemble(TEMPLATE, { ...p, body: p.render() });
    expect(html).toContain('data-page="legal:privacy"');
    expect(html).toContain("<h2>1. Data we collect</h2>");
    expect(html).toContain(`Updated: ${LEGAL_DOCS.privacy.updated.en}`);
    expect(html).toContain('href="/legal/terms/"');
  });

  it("lists the guides and the terms and privacy in the sitemap, not the operators' commitment", () => {
    const entries = contentEntries();
    expect(entries).toHaveLength(DOC_SLUGS.length + 2);
    expect(entries.map((e) => e.en)).toContain("https://tokensbeat.com/legal/terms/");
    expect(entries.map((e) => e.zh)).toContain("https://tokensbeat.com/zh/docs/");
    expect(JSON.stringify(entries)).not.toContain("admin-compliance");
  });
});
