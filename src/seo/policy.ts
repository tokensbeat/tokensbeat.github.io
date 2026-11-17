/**
 * The pages' security policy. GitHub Pages sends no headers of a site's choosing, so scripts/prerender.mjs writes the
 * policy into every prerendered page as <meta> tags, first in its head, once the hashes of the pages' inline scripts are
 * known (policyTags below):
 *   - Content-Security-Policy: this origin only, plus the API origin the live checks call (src/page/live.ts), the
 *     inline scripts by their hashes (the theme script, the 404 page's redirect script; JSON-LD is data, not script)
 *     and Cloudflare Web Analytics' beacon, which Cloudflare's edge adds to the pages of a site it proxies. A policy
 *     in a <meta> tag cannot say frame-ancestors (browsers ignore it there), so it is left out;
 *   - the referrer policy.
 * Whether search engines may index a page is said by each page's own robots meta (src/seo/head.ts).
 */

/**
 * Cloudflare Web Analytics: the edge injects its beacon script from static.cloudflareinsights.com, which reports to
 * cloudflareinsights.com (Cloudflare's documented CSP for it).
 */
export const BEACON_SCRIPT_ORIGIN = "https://static.cloudflareinsights.com";
export const BEACON_REPORT_ORIGIN = "https://cloudflareinsights.com";

export const REFERRER_POLICY = "strict-origin-when-cross-origin";

const HTTPS_ORIGIN = /^https:\/\/[a-z0-9.-]+(:\d+)?$/;

/**
 * The policy for the site's pages: this origin only, plus `connect` (the API origin), the inline scripts' hashes and
 * Cloudflare's analytics beacon (its script origin, and its report origin for connect).
 */
export function contentSecurityPolicy(hashes: readonly string[] = [], connect: readonly string[] = []): string {
  for (const h of hashes) if (!/^sha256-[A-Za-z0-9+/]+=*$/.test(h)) throw new Error(`policy: ${h} is not a sha256 source`);
  for (const o of connect) if (!HTTPS_ORIGIN.test(o)) throw new Error(`policy: the API origin ${o} is not an https origin`);
  return [
    "default-src 'self'",
    `script-src 'self' ${BEACON_SCRIPT_ORIGIN}${hashes.map((h) => ` '${h}'`).join("")}`,
    // React writes style attributes (the orbit's label positions): inline styles, not inline scripts.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    `connect-src 'self'${connect.map((o) => ` ${o}`).join("")} ${BEACON_REPORT_ORIGIN}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}

/** The <meta> tags for pages whose inline scripts hash to `hashes`, calling the API at `apiOrigin` ("" for none). */
export function policyTags({ hashes, apiOrigin = "" }: { hashes: readonly string[]; apiOrigin?: string }): string {
  const policy = contentSecurityPolicy(hashes, apiOrigin ? [apiOrigin] : []);
  return [`<meta http-equiv="Content-Security-Policy" content="${policy}" />`, `<meta name="referrer" content="${REFERRER_POLICY}" />`].join("\n    ");
}
