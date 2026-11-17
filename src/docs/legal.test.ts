/**
 * legal/: the legal documents' Markdown, which the pages read at build time. The same files serve TokensBeat's other
 * apps, each filling the placeholders with its own names, so a document names the site only through them
 * ({{site_name}}, {{site_host}}, {{api_host}}, {{agent_name}}, {{agent_host}}, {{contact}}), never by writing it out.
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { LEGAL_IDS } from "@/content/routes";
import { LANGS, type Lang } from "@/i18n";
import { prepareLegal } from "./legal";

const LEGAL = path.resolve(import.meta.dirname, "../../legal");
const FILES = LEGAL_IDS.flatMap((id) => LANGS.map((lang) => `${id}.${lang}.md`)).sort();
const langOf = (name: string): Lang => (name.endsWith(".zh.md") ? "zh" : "en");

describe("the legal documents' text (legal/)", () => {
  it("is one file a document and language, and nothing else", () => {
    expect(readdirSync(LEGAL).sort()).toEqual(FILES);
  });

  it.each(FILES)("%s names the site only through its placeholders", (name) => {
    const source = readFileSync(path.join(LEGAL, name), "utf8");
    expect(source.toLowerCase()).not.toContain("tokensbeat");
    expect(source).not.toMatch(/\baha\b/i);
  });

  // Production left Microsoft Azure on 2026-11-17: a document naming it would tell users their data is somewhere it is not.
  it.each(FILES)("%s names no Azure service", (name) => {
    expect(readFileSync(path.join(LEGAL, name), "utf8")).not.toMatch(/Azure/);
  });

  it.each(FILES.filter((name) => !name.startsWith("admin-compliance.")))("%s fills every placeholder for this site", (name) => {
    const source = readFileSync(path.join(LEGAL, name), "utf8");
    expect(source).toMatch(/\{\{\s*site_name\s*\}\}/);
    const { markdown } = prepareLegal(source, langOf(name), true);
    expect(markdown).not.toMatch(/\{\{|\}\}/);
    expect(markdown).toContain("api.tokensbeat.com");
    expect(markdown).toContain("TokensBeat");
  });
});
