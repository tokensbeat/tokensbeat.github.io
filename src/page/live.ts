/**
 * The three things the site reads live, from the API origin (API_ORIGIN), with no cookie and no credential:
 *   GET /api/v1/settings/public     whether top-ups are open (the pricing page hides its top-up button when they are not)
 *   GET /api/v1/model-plaza/prices  the plaza's public price list (the price maps on the homepage and /pricing/)
 *   GET /health                     the API gateway's health (the status page)
 * and the status snapshot beside the pages (GET /status.json on this origin: scripts/status-snapshot.mjs, run when the
 * site is published and every six hours).
 * The API origin is VITE_HOME_API_ORIGIN at build time: the published build (a static host that passes nothing on)
 * calls https://api.tokensbeat.com directly, whose CORS must allow the site's origin (all are simple GETs, no
 * preflight; the policy's connect-src names it: src/seo/policy.ts). Unset, the site's own origin (connect-src
 * 'self'), for a host that passes these three GETs on to the API.
 * Nothing here runs in the prerender: every caller is an effect.
 */

import { readPlaza, type PlazaGroup } from "@/lib/priceMap";

/** The API's origin ("" = this site's own; no trailing slash). */
export const API_ORIGIN = (import.meta.env.VITE_HOME_API_ORIGIN || "").replace(/\/+$/, "");
/** An API path ("/health") on the API origin. */
export const apiUrl = (path: string) => `${API_ORIGIN}${path}`;

/** How long a live check may take before it counts as no answer. */
export const LIVE_CHECK_TIMEOUT_MS = 8000;

/** Fetches `url` and reads it with `read`, all inside one time limit (a body that stalls counts as a failure too). */
export async function fetchWithTimeout<T>(url: string, signal: AbortSignal | undefined, read: (response: Response) => Promise<T>): Promise<T> {
  const timeout = new AbortController();
  const timer = setTimeout(() => timeout.abort(), LIVE_CHECK_TIMEOUT_MS);
  const onAbort = () => timeout.abort();
  signal?.addEventListener("abort", onAbort, { once: true });
  try {
    const response = await fetch(url, { cache: "no-store", credentials: "omit", redirect: "error", signal: timeout.signal });
    return await read(response);
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);
  }
}

/** True when the backend's public settings say top-ups are closed (payments off, or balance top-ups off). */
export async function topUpsClosed(signal?: AbortSignal): Promise<boolean> {
  const body = await fetchWithTimeout(apiUrl("/api/v1/settings/public"), signal, async (r) => (r.ok ? ((await r.json()) as unknown) : null));
  const data = (body && typeof body === "object" && "data" in body ? (body as { data: unknown }).data : body) as Record<string, unknown> | null;
  if (!data || typeof data !== "object") return false;
  return data.payment_enabled === false || data.payment_balance_disabled === true;
}

/** The plaza's public price list: prices only, no status, answered while the plaza itself needs a sign-in. */
export const PRICES_PATH = "/api/v1/model-plaza/prices";

/**
 * The groups and prices for the price maps, from the gateway's public price list (GET /api/v1/model-plaza/prices, no
 * credential): "closed" when the gateway does not publish its prices (404: the owner switched them off, or the
 * plaza; 403: backend mode; 401 for good measure); throws when nothing usable answers.
 */
export async function plazaPrices(signal?: AbortSignal): Promise<{ state: "open"; groups: PlazaGroup[] } | { state: "closed" }> {
  return fetchWithTimeout(apiUrl(PRICES_PATH), signal, async (r) => {
    if (r.status === 401 || r.status === 403 || r.status === 404) return { state: "closed" as const };
    if (!r.ok) throw new Error(`model-plaza/prices: ${r.status}`);
    const groups = readPlaza((await r.json()) as unknown);
    if (!groups) throw new Error("model-plaza/prices: not a price list");
    return { state: "open" as const, groups };
  });
}

/** The snapshot scripts/status-snapshot.mjs writes. */
export interface StatusSnapshot {
  version: 1;
  generated_at: string;
  probes: Record<string, { ok: boolean | null; status: number; checked_at: string }>;
}

/** A probe older than this no longer counts (v4: Unknown after 13 hours). */
export const SNAPSHOT_MAX_AGE_MS = 13 * 60 * 60 * 1000;
