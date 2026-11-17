/**
 * The hashes of a page's inline scripts, for its Content-Security-Policy (src/seo/policy.ts): scripts/prerender.mjs
 * writes them into every page, scripts/check-dist.mjs checks them. Node built-ins only.
 */
import { createHash } from "node:crypto";

/**
 * Every inline script of `html` that a browser runs (no src, a JavaScript type or none; JSON-LD is data), as
 * 'sha256-…' sources.
 * @param {string} html
 * @returns {string[]}
 */
export function inlineScriptHashes(html) {
  const out = [];
  for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const attrs = m[1];
    if (/\bsrc\s*=/i.test(attrs)) continue;
    const type = /\btype\s*=\s*["']?([^"'\s>]+)/i.exec(attrs)?.[1]?.toLowerCase();
    if (type && type !== "module" && type !== "text/javascript" && type !== "application/javascript") continue;
    out.push(`sha256-${createHash("sha256").update(m[2], "utf8").digest("base64")}`);
  }
  return out;
}

/** The <meta charset> every page starts its head with; the policy tags go right after it, before any script. */
export const CHARSET_META = '<meta charset="utf-8" />';
