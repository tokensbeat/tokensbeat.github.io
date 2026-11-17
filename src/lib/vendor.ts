/**
 * Whose model is it: a model id (and the platform of the group it is served in) to a vendor, for the vendor marks
 * and hues in model lists. The id rules follow the Vue ModelIcon.vue `iconKey`; the platform wins when it names a
 * vendor, so a group's header and its rows agree. As the console's vendor rules (the platform names are plain strings
 * here: the homepage has no API types).
 */
export type VendorId =
  | "anthropic" | "openai" | "google" | "qwen" | "deepseek" | "zhipu" | "kimi" | "minimax" | "xai"
  | "mistral" | "meta" | "doubao" | "cohere" | "composite" | "other";

export const VENDOR_NAME: Readonly<Record<VendorId, string>> = {
  anthropic: "Anthropic",
  openai: "OpenAI",
  google: "Google",
  qwen: "Qwen",
  deepseek: "DeepSeek",
  zhipu: "Zhipu",
  kimi: "Moonshot",
  minimax: "MiniMax",
  xai: "xAI",
  mistral: "Mistral",
  meta: "Meta",
  doubao: "Doubao",
  cohere: "Cohere",
  composite: "Mixed",
  other: "Other",
};

const PLATFORM_VENDOR: Readonly<Record<string, VendorId>> = {
  anthropic: "anthropic",
  openai: "openai",
  azure: "openai",
  gemini: "google",
  antigravity: "google",
  qwen: "qwen",
  deepseek: "deepseek",
  zhipu: "zhipu",
  kimi: "kimi",
  minimax: "minimax",
  grok: "xai",
  composite: "composite",
};

/** The vendor of a group's platform; `other` for platforms that carry many vendors' models. */
export function vendorOfPlatform(platform?: string | null): VendorId {
  return (platform && PLATFORM_VENDOR[platform]) || "other";
}

/** The vendor of a model id alone, by the Vue ModelIcon rules; null when nothing matches. */
export function vendorOfModel(model?: string | null): VendorId | null {
  const m = (model ?? "").toLowerCase().trim();
  if (!m) return null;
  if (/^(gpt|o1|o3|o4|chatgpt)/.test(m) || /dall-e|whisper|tts-1|text-embedding-3|text-moderation|babbage|davinci|codex/.test(m)) return "openai";
  if (m.includes("claude")) return "anthropic";
  if (/gemini|gemma|learnlm|imagen-|veo-|nano-banana/.test(m)) return "google";
  if (/glm|cogview|cogvideo/.test(m)) return "zhipu";
  if (/qwen|qwq/.test(m)) return "qwen";
  if (m.includes("deepseek")) return "deepseek";
  if (/mistral|mixtral|codestral|pixtral|voxtral|magistral|devstral/.test(m)) return "mistral";
  if (m.includes("llama")) return "meta";
  if (m.includes("grok")) return "xai";
  if (/moonshot|kimi/.test(m)) return "kimi";
  if (/abab|minimax|hailuo/.test(m)) return "minimax";
  if (m.includes("doubao") || m.includes("seedream") || m.includes("seedance")) return "doubao";
  if (/^command|c4ai-|^embed-/.test(m)) return "cohere";
  return null;
}

/**
 * A model's vendor: the id first (a composite group serves many vendors' models, and a model's own maker is what
 * the row should show), then the platform it is served on.
 */
export function vendorOf(model?: string | null, platform?: string | null): VendorId {
  return vendorOfModel(model) ?? vendorOfPlatform(platform);
}
