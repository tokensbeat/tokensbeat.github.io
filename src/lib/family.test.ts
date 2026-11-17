import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { FAMILIES, family, familyHue, familyOf, familyRank, type FamilyId } from "./family";
import { FamilyMark, hasFamilyMark } from "./familyMarks";

describe("familyOf", () => {
  it("names the family of a model id by the spec's rules, first match first", () => {
    const cases: [string, FamilyId][] = [
      ["gpt-5.5", "gpt"], ["o4-mini", "gpt"], ["gpt-image-2", "gpt"], ["chatgpt-4o", "gpt"], ["codex-mini", "gpt"],
      ["dall-e-3", "gpt"], ["whisper-1", "gpt"], ["tts-1-hd", "gpt"], ["text-embedding-3-large", "gpt"],
      ["claude-sonnet-5", "claude"], ["gemini-3.8-flash", "gemini"], ["gemma-4", "gemini"], ["imagen-4", "gemini"],
      ["veo-4", "gemini"], ["nano-banana-pro", "gemini"], ["deepseek-v4", "deepseek"], ["deepseek-r1-distill-qwen-32b", "deepseek"],
      ["kimi-k3", "kimi"], ["moonshot-v1-8k", "kimi"], ["glm-5", "glm"], ["cogview-4", "glm"], ["grok-4-3", "grok"],
      ["qwen-3.8", "qwen"], ["qwen3.8-27b-cyber", "qwen"], ["qwq-32b", "qwen"], ["MiniMax-M3", "minimax"],
      ["abab7", "minimax"], ["hailuo-3", "minimax"], ["doubao-pro", "doubao"], ["seedream-4", "doubao"],
      ["seedance-2", "doubao"], ["mistral-large", "mistral"], ["devstral-2", "mistral"], ["llama-4", "llama"],
      ["command-r", "command"], ["embed-v4", "command"], ["jev-1-mini", "jev"],
    ];
    for (const [id, f] of cases) expect([id, familyOf(id)]).toEqual([id, f]);
  });

  it("puts a model no rule names on the Other line, never a guessed brand", () => {
    expect(familyOf("mystery-model")).toBe("other");
    expect(familyOf("my-gpt-clone")).toBe("other");
    expect(familyOf("")).toBe("other");
  });
});

describe("the families", () => {
  it("run in the owner's fixed order, the others by name, Other last, each once", () => {
    expect(FAMILIES.map((f) => f.name)).toEqual(["GPT", "Claude", "Gemini", "DeepSeek", "Kimi", "GLM", "Grok", "Qwen", "MiniMax", "Doubao", "Jev", "Command", "Llama", "Mistral", "Other"]);
    expect(new Set(FAMILIES.map((f) => f.id)).size).toBe(FAMILIES.length);
    expect(familyRank("gpt")).toBeLessThan(familyRank("claude"));
    expect(familyRank("other")).toBe(FAMILIES.length - 1);
  });

  it("draw in their vendor's hue token, Jev and Other in the ink", () => {
    expect(familyHue("deepseek")).toBe("var(--c-vendor-deepseek)");
    expect(familyHue("glm")).toBe("var(--c-vendor-zhipu)");
    expect(familyHue("grok")).toBe("var(--c-vendor-xai)");
    expect(familyHue("jev")).toBeUndefined();
    expect(familyHue("other")).toBeUndefined();
  });

  it("each have their own hue, or none", () => {
    const hues = FAMILIES.map((f) => f.hue).filter(Boolean);
    expect(new Set(hues).size).toBe(hues.length);
  });
});

describe("FamilyMark", () => {
  it("draws every family's vendored logo, without its title; a family without one draws nothing", () => {
    for (const f of FAMILIES) {
      const svg = renderToStaticMarkup(createElement(FamilyMark, { id: f.id }));
      if (f.logo) {
        expect(hasFamilyMark(f.id)).toBe(true);
        expect(svg).toMatch(/^<svg viewBox="0 0 24 24"[^>]* aria-hidden="true" focusable="false" data-family="[a-z]+">.*<\/svg>$/s);
        expect(svg).not.toMatch(/<title>/);
      } else {
        expect(hasFamilyMark(f.id)).toBe(false);
        expect(svg).toBe("");
      }
    }
  });

  it("draws one-colour marks in currentColor, so they take the ink", () => {
    for (const id of ["gpt", "kimi", "grok"] as FamilyId[]) expect(renderToStaticMarkup(createElement(FamilyMark, { id }))).toMatch(/fill="currentColor"/);
    expect(family("claude").logo).toBe("claude-color.svg");
  });

  it("gives each mark its own gradient ids, so two marks on a page never share one", () => {
    const page = renderToStaticMarkup(createElement("div", null, createElement(FamilyMark, { id: "minimax" }), createElement(FamilyMark, { id: "minimax" }), createElement(FamilyMark, { id: "llama" })));
    const ids = [...page.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
    expect(ids.length).toBeGreaterThan(3);
    expect(new Set(ids).size).toBe(ids.length);
    for (const [, ref] of page.matchAll(/url\(#([^)]+)\)/g)) expect(ids).toContain(ref);
  });
});
