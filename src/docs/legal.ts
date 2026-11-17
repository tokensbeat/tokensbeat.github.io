/**
 * The legal documents at /legal/<id>/ (the Vue site's LegalDocumentView): the repository's docs/legal/<id>.<lang>.md,
 * the one source the backend and the Vue app read too, with their placeholders filled as tokensbeat.com filled them:
 *   {{site_name}}  TokensBeat (the site name setting; the brand is written TokensBeat)
 *   {{site_host}} {{api_host}} {{agent_name}} {{agent_host}}  tokensbeat.com, api.tokensbeat.com, Aha, aha.tokensbeat.com
 *   {{contact}}    "Created by s1lin — s1lin.tokensbeat.com" (owner, 29 Oct 2026: no public contact; the brand's creator)
 * The "Version:" line the Vue page printed as "Updated: <date>" is taken out of the text the same way. The site name
 * setting's admin-written documents (Settings → Login agreement) all have no content (checked 2026-11-02), so only the
 * shipped ones are pages; the operators' compliance commitment keeps its address, out of search.
 *
 * Imported by src/docs/data.ts only (the content pages' module).
 */
import type { LegalId } from "@/content/routes";
import type { Lang } from "@/i18n";
import type { DocText } from "./articles";
import adminComplianceEn from "../../legal/admin-compliance.en.md?raw";
import adminComplianceZh from "../../legal/admin-compliance.zh.md?raw";
import privacyEn from "../../legal/privacy.en.md?raw";
import privacyZh from "../../legal/privacy.zh.md?raw";
import termsEn from "../../legal/terms.en.md?raw";
import termsZh from "../../legal/terms.zh.md?raw";

export interface LegalDoc {
  id: LegalId;
  title: DocText;
  /** The line over the title. */
  label: DocText;
  /** For search and sharing. */
  description: DocText;
  /** The text as Markdown, placeholders filled, without its version line (and without its own "#" title). */
  markdown: DocText;
  /** The version line's date ("2026-10-23"), "" when the page prints none. */
  updated: DocText;
}

export const LEGAL_PLACEHOLDERS: Readonly<Record<string, string>> = {
  site_name: "TokensBeat",
  site_host: "tokensbeat.com",
  api_host: "api.tokensbeat.com",
  agent_name: "Aha",
  agent_host: "aha.tokensbeat.com",
};
const CREATOR = { name: "s1lin", url: "https://s1lin.tokensbeat.com" };
/** The Vue site's legal.createdBy, with the creator's page as a Markdown link. */
export const CONTACT_LINE: DocText = {
  en: `Created by ${CREATOR.name} — [${new URL(CREATOR.url).host}](${CREATOR.url})`,
  zh: `由 ${CREATOR.name} 创建 — [${new URL(CREATOR.url).host}](${CREATOR.url})`,
};

const VERSION_LINE = /^\s*(?:Version|版本)[:：]\s*(\S+)\s*\n+/;
const OWN_TITLE = /^\s*#\s+[^\n]*\n+/;

/** A document's text for the page: placeholders filled, the version line and its own "#" title taken out. */
export function prepareLegal(raw: string, lang: Lang, keepDate: boolean): { markdown: string; updated: string } {
  const filled = raw
    .replace(/\{\{\s*contact\s*\}\}/g, () => CONTACT_LINE[lang])
    .replace(/\{\{\s*([a-z_]+)\s*\}\}/g, (whole, name: string) => LEGAL_PLACEHOLDERS[name] ?? whole);
  const body = filled.replace(OWN_TITLE, "");
  const version = VERSION_LINE.exec(body);
  return { markdown: body.replace(VERSION_LINE, "").trim(), updated: keepDate && version ? version[1] : "" };
}

function doc(id: LegalId, title: DocText, label: DocText, description: DocText, raw: DocText, keepDate = true): LegalDoc {
  const en = prepareLegal(raw.en, "en", keepDate);
  const zh = prepareLegal(raw.zh, "zh", keepDate);
  return { id, title, label, description, markdown: { en: en.markdown, zh: zh.markdown }, updated: { en: en.updated, zh: zh.updated } };
}

const LEGAL_LABEL: DocText = { en: "Legal", zh: "法律文件" };

export const LEGAL_DOCS: Readonly<Record<LegalId, LegalDoc>> = {
  terms: doc(
    "terms",
    { en: "Terms of Service", zh: "服务条款" },
    LEGAL_LABEL,
    {
      en: "The terms for using TokensBeat: the website, the API at api.tokensbeat.com, Aha, the console, keys and credits.",
      zh: "使用 TokensBeat 的条款：网站、api.tokensbeat.com 上的 API、Aha、控制台、密钥和额度。",
    },
    { en: termsEn, zh: termsZh },
  ),
  privacy: doc(
    "privacy",
    { en: "Privacy Policy", zh: "隐私政策" },
    LEGAL_LABEL,
    {
      en: "What personal data TokensBeat collects, why, who it is shared with and how long it is kept, and your rights.",
      zh: "TokensBeat 收集哪些个人数据、为何收集、与谁共享、保存多久，以及你的权利。",
    },
    { en: privacyEn, zh: privacyZh },
  ),
  "admin-compliance": doc(
    "admin-compliance",
    { en: "Deployment and Operation Compliance Acknowledgment", zh: "部署与运营合规确认" },
    { en: "Deployment and Operation Compliance Commitment", zh: "部署与运营合规承诺" },
    {
      en: "The commitment an operator of a Sub2API instance accepts before using its admin console.",
      zh: "Sub2API 实例的运营者在使用管理后台之前需要确认的合规承诺。",
    },
    { en: adminComplianceEn, zh: adminComplianceZh },
    false,
  ),
};
