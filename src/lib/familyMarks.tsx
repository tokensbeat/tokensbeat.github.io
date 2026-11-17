/**
 * A model family's logo (./family.ts) as an inline <svg>: the vendored file's own drawing, its ids made unique to each
 * mark, because Chromium paints no gradient whose first definition on the page sits in a hidden subtree (a closed tab,
 * a symbol sprite with display: none), and two marks would otherwise share one. One-colour marks draw in currentColor.
 * Decorative: the family's name is always said beside it. The console has the same component.
 */
import { useId } from "react";
import { family, type FamilyId } from "./family";
import claude from "@/assets/model-logos/claude-color.svg?raw";
import cohere from "@/assets/model-logos/cohere-color.svg?raw";
import deepseek from "@/assets/model-logos/deepseek-color.svg?raw";
import doubao from "@/assets/model-logos/doubao-color.svg?raw";
import gemini from "@/assets/model-logos/gemini-color.svg?raw";
import grok from "@/assets/model-logos/grok.svg?raw";
import kimi from "@/assets/model-logos/kimi.svg?raw";
import meta from "@/assets/model-logos/meta-color.svg?raw";
import minimax from "@/assets/model-logos/minimax-color.svg?raw";
import mistral from "@/assets/model-logos/mistral-color.svg?raw";
import openai from "@/assets/model-logos/openai.svg?raw";
import qwen from "@/assets/model-logos/qwen-color.svg?raw";
import zhipu from "@/assets/model-logos/zhipu-color.svg?raw";

const FILES: Readonly<Record<string, string>> = {
  "claude-color.svg": claude,
  "cohere-color.svg": cohere,
  "deepseek-color.svg": deepseek,
  "doubao-color.svg": doubao,
  "gemini-color.svg": gemini,
  "grok.svg": grok,
  "kimi.svg": kimi,
  "meta-color.svg": meta,
  "minimax-color.svg": minimax,
  "mistral-color.svg": mistral,
  "openai.svg": openai,
  "qwen-color.svg": qwen,
  "zhipu-color.svg": zhipu,
};

interface Drawing {
  fill?: string;
  fillRule?: "evenodd" | "nonzero";
  body: string;
}

const drawings = new Map<string, Drawing | null>();

/** The file's drawing without its <svg> and <title>, and the fill its root gives (a one-colour mark's currentColor). */
function drawing(file: string): Drawing | null {
  if (!drawings.has(file)) {
    const m = /^<svg([^>]*)>([\s\S]*)<\/svg>\s*$/.exec((FILES[file] ?? "").trim());
    const root = m?.[1] ?? "";
    const rule = /fill-rule="([^"]+)"/.exec(root)?.[1];
    drawings.set(
      file,
      m
        ? {
            fill: /\sfill="([^"]+)"/.exec(root)?.[1],
            fillRule: rule === "evenodd" || rule === "nonzero" ? rule : undefined,
            body: m[2].replace(/<title>[\s\S]*?<\/title>/, ""),
          }
        : null,
    );
  }
  return drawings.get(file) ?? null;
}

/** Whether the family has a logo (else a letter stands in). */
export function hasFamilyMark(id: FamilyId): boolean {
  const logo = family(id).logo;
  return !!logo && !!drawing(logo);
}

/** The family's logo, 24×24 drawn to fill its box; nothing for a family without one. */
export function FamilyMark({ id, className }: { id: FamilyId; className?: string }) {
  const own = useId().replace(/[^\w-]/g, "");
  const logo = family(id).logo;
  const d = logo ? drawing(logo) : null;
  if (!d) return null;
  const body = d.body.replace(/\bid="([^"]+)"/g, `id="$1-${own}"`).replace(/url\(#([^)]+)\)/g, `url(#$1-${own})`);
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill={d.fill}
      fillRule={d.fillRule}
      aria-hidden="true"
      focusable="false"
      data-family={id}
      // The vendored files, read at build time (?raw): no outside input reaches this markup.
      dangerouslySetInnerHTML={{ __html: body }}
    />
  );
}
