/**
 * English / Chinese, as the console does it: the English text is the key. `t("Pricing")` returns
 * the Chinese on the Chinese page and the English itself on the English one, so a missing translation never shows a
 * raw key. `{name}` placeholders are filled from `vars`. Where the same English means two things in Chinese, the key
 * carries a context: `t("nav::Models")` shows "Models" in English and looks up "nav::Models" before "Models".
 *
 * Unlike the console, the language is not a choice kept in the browser: it is the page's address. `/pricing/` is
 * English and `/zh/pricing/` Chinese (the homepage `/` and `/zh/`), each prerendered with its own <html lang>, title and
 * links (scripts/prerender.mjs), so search engines and readers without JavaScript get both. The switch in the head and
 * the foot is a pair of links to the same page.
 *
 * The words are src/content/copy.ts (v4's English); the Chinese is ./zh.ts, the Vue site's own (./zh-site.ts).
 * i18n.test.ts renders every Chinese page and fails on any English left over.
 */
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { ZH } from "./zh";
import "./zh.css";

export type Lang = "en" | "zh";
export type Vars = Record<string, string | number>;
export type T = (text: string, vars?: Vars) => string;

export const LANGS: readonly Lang[] = ["en", "zh"];
const CONTEXT = /^[a-z][a-z-]*::/;

/** Keys asked for in Chinese that have no Chinese (tests read it; the page shows the English). */
export const missingZh = new Set<string>();

function fill(text: string, vars?: Vars): string {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (whole, name: string) => (name in vars ? String(vars[name]) : whole));
}

/** Translates without React: the head, tests, code that is handed the language. */
export function translate(lang: Lang, key: string, vars?: Vars): string {
  const text = key.replace(CONTEXT, "");
  if (lang !== "zh") return fill(text, vars);
  const zh = ZH[key] ?? ZH[text];
  if (zh === undefined) missingZh.add(key);
  return fill(zh ?? text, vars);
}

/** The BCP 47 tag for <html lang> and hreflang: en or zh-CN. */
export function tagOf(lang: Lang): string {
  return lang === "zh" ? "zh-CN" : "en";
}

/** The homepage's path in a language: / or /zh/ (a page's: pagePath in src/content/site.ts). */
export function pathOf(lang: Lang): string {
  return lang === "zh" ? "/zh/" : "/";
}

/** The language of a path: /zh and below are Chinese, the rest English. */
export function langOfPath(pathname: string): Lang {
  return /^\/zh(\/|$)/.test(pathname) ? "zh" : "en";
}

interface I18n {
  lang: Lang;
  t: T;
}

const Ctx = createContext<I18n>({ lang: "en", t: (text, vars) => translate("en", text, vars) });

/** The page's language, fixed for the page (its address decides it). */
export function I18nProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  const value = useMemo<I18n>(() => ({ lang, t: (text, vars) => translate(lang, text, vars) }), [lang]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useI18n = () => useContext(Ctx);
export const useT = () => useContext(Ctx).t;
export const useLang = () => useContext(Ctx).lang;
