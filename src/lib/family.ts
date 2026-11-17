/**
 * The model families the price map draws as lines (owner 2026-11-02: one line a family, marked by its logo, no company
 * names): a model id to its family, the family's name (a brand: never translated), its logo in src/assets/model-logos/
 * and its hue token, in the app's fixed line order. A family without a logo gets a letter, never a guessed brand; one
 * without a hue is drawn in the ink.
 *
 * The logos are @lobehub/icons-static-svg 1.95.1 (MIT, the LICENSE beside them; the marks belong to their owners).
 * One-colour marks draw in `currentColor`.
 *
 * The console draws the same families with the same rules and order: change the two together.
 */

export type FamilyId =
  | "gpt" | "claude" | "gemini" | "deepseek" | "kimi" | "glm" | "grok" | "qwen" | "minimax" | "doubao" | "jev"
  | "command" | "llama" | "mistral" | "other";

export interface Family {
  id: FamilyId;
  name: string;
  /** The logo's file in src/assets/model-logos/; null: the name's first letter. */
  logo: string | null;
  /** The hue: --c-vendor-<hue> in src/styles/theme.css (light and dark); null: the ink. */
  hue: string | null;
}

/**
 * Top to bottom: the owner's order (2026-11-02), then the others by name, Other last. Fixed, not by price: a line
 * that moves with every price change cannot be found again.
 */
export const FAMILIES: readonly Family[] = [
  { id: "gpt", name: "GPT", logo: "openai.svg", hue: "openai" },
  { id: "claude", name: "Claude", logo: "claude-color.svg", hue: "anthropic" },
  { id: "gemini", name: "Gemini", logo: "gemini-color.svg", hue: "google" },
  { id: "deepseek", name: "DeepSeek", logo: "deepseek-color.svg", hue: "deepseek" },
  { id: "kimi", name: "Kimi", logo: "kimi.svg", hue: "kimi" },
  { id: "glm", name: "GLM", logo: "zhipu-color.svg", hue: "zhipu" },
  { id: "grok", name: "Grok", logo: "grok.svg", hue: "xai" },
  { id: "qwen", name: "Qwen", logo: "qwen-color.svg", hue: "qwen" },
  { id: "minimax", name: "MiniMax", logo: "minimax-color.svg", hue: "minimax" },
  { id: "doubao", name: "Doubao", logo: "doubao-color.svg", hue: "doubao" },
  { id: "jev", name: "Jev", logo: null, hue: null },
  { id: "command", name: "Command", logo: "cohere-color.svg", hue: "cohere" },
  { id: "llama", name: "Llama", logo: "meta-color.svg", hue: "meta" },
  { id: "mistral", name: "Mistral", logo: "mistral-color.svg", hue: "mistral" },
  { id: "other", name: "Other", logo: null, hue: null },
];

const BY_ID = new Map(FAMILIES.map((f) => [f.id, f]));

/** First match wins, in this order (a DeepSeek model distilled from Qwen is DeepSeek's). */
const RULES: readonly [FamilyId, RegExp][] = [
  ["gpt", /^(gpt|o[134]|chatgpt|codex|dall-e|whisper|tts|text-embedding)/],
  ["claude", /claude/],
  ["gemini", /gemini|gemma|imagen-|veo-|nano-banana|learnlm/],
  ["deepseek", /deepseek/],
  ["kimi", /kimi|moonshot/],
  ["glm", /glm|cogview|cogvideo/],
  ["grok", /grok/],
  ["qwen", /qwen|qwq/],
  ["minimax", /minimax|abab|hailuo/],
  ["doubao", /doubao|seedream|seedance/],
  ["mistral", /mistral|mixtral|codestral|pixtral|voxtral|magistral|devstral/],
  ["llama", /llama/],
  ["command", /^command|c4ai-|^embed-/],
  ["jev", /^jev/],
];

/** The family of a model id; Other when no rule names one. */
export function familyOf(model: string): FamilyId {
  const id = model.toLowerCase().trim();
  return RULES.find(([, re]) => re.test(id))?.[0] ?? "other";
}

export function family(id: FamilyId): Family {
  return BY_ID.get(id)!;
}

/** The family's line colour as CSS (a token with a light and a dark value); undefined for the ink. */
export function familyHue(id: FamilyId): string | undefined {
  const hue = family(id).hue;
  return hue ? `var(--c-vendor-${hue})` : undefined;
}

/** Families in line order, for sorting lines. */
export function familyRank(id: FamilyId): number {
  return FAMILIES.findIndex((f) => f.id === id);
}
