import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { App } from "@/App";
import { C } from "@/content/copy";
import { pageOfPath, pagePath } from "@/content/site";
import { langOfPath, missingZh, pathOf, translate } from "@/i18n";
import { ZH } from "@/i18n/zh";
import { BUILT_PAGES } from "@/page/pages";
import { headTags } from "@/seo/head";

describe("translate", () => {
  it("gives the English for English, the Chinese for Chinese", () => {
    expect(translate("en", C.nav.launchAha)).toBe("Launch Aha");
    expect(translate("zh", C.nav.launchAha)).toBe("启动 Aha");
  });

  it("drops a context in English and looks it up first in Chinese", () => {
    expect(translate("en", C.pages.supabase.name)).toBe("Coming from Supabase");
    expect(translate("zh", C.pages.supabase.name)).toBe("从 Supabase 迁移");
    expect(translate("zh", C.supabase.eyebrow)).toBe("从 Supabase 迁来");
    expect(translate("zh", C.models.apis.images)).toBe("Images");
    expect(translate("zh", C.pricing.table.images)).toBe("图片");
  });

  it("fills placeholders", () => {
    expect(translate("en", "kit::Copy {name}", { name: "Base URL" })).toBe("Copy Base URL");
    expect(translate("zh", C.statusPage.source.liveAt, { time: "10:00" })).toBe("于 10:00 从你的浏览器检查。");
  });

  it("maps paths, pages and languages", () => {
    expect(langOfPath("/")).toBe("en");
    expect(langOfPath("/zh/")).toBe("zh");
    expect(langOfPath("/zh/pricing/")).toBe("zh");
    expect(langOfPath("/zhx")).toBe("en");
    expect(pathOf("zh")).toBe("/zh/");
    expect(pagePath("models", "en")).toBe("/ai-models/");
    expect(pagePath("models", "zh")).toBe("/zh/ai-models/");
    expect(pageOfPath("/zh/ai-models/")).toBe("models");
    expect(pageOfPath("/")).toBe("home");
    expect(pageOfPath("/nope/")).toBeNull();
  });
});

describe("the Chinese pages", () => {
  it.each(BUILT_PAGES)("%s has Chinese for every text it shows, and for its head", (page) => {
    missingZh.clear();
    renderToString(createElement(App, { lang: "zh", page }));
    headTags(page, "zh");
    expect([...missingZh]).toEqual([]);
  });

  // Production left Microsoft Azure on 2026-11-17: no page may still say a part of the service runs or keeps a key there.
  it.each(BUILT_PAGES)("%s names no Azure service, in either language", (page) => {
    for (const lang of ["en", "zh"] as const) expect(renderToString(createElement(App, { lang, page })), lang).not.toMatch(/Azure/);
  });

  it("writes the brand TokensBeat, never Tokensbeat", () => {
    for (const [en, zh] of Object.entries(ZH)) {
      expect(en, en).not.toMatch(/Tokensbeat/);
      expect(zh, en).not.toMatch(/Tokensbeat/);
      expect(zh.trim(), en).not.toBe("");
    }
  });
});
