import vm from "node:vm";
import { sitePaths } from "@/entry-server";
import { LEGACY_AUTH_PATHS, MOVED_ORIGINS, movedScript, movedTables, movedTarget } from "./moved";

const TABLES = movedTables(sitePaths());
const C = "https://console.tokensbeat.com";
const A = "https://admin.tokensbeat.com";

/** Runs the 404 page's script (movedScript: movedTarget's own source text) on an address; the URL it goes to, or null. */
function inlined(address: string): string | null {
  const url = new URL(address, "https://tokensbeat.com");
  let went: string | null = null;
  const location = { pathname: url.pathname, search: url.search, hash: url.hash, replace: (to: string) => (went = to) };
  const style: Record<string, string> = {};
  vm.runInNewContext(movedScript(TABLES), { window: { location }, document: { documentElement: { style } } });
  if (went) expect(style.visibility).toBe("hidden");
  return went;
}

function direct(address: string): string | null {
  const url = new URL(address, "https://tokensbeat.com");
  return movedTarget({ pathname: url.pathname, search: url.search, hash: url.hash }, TABLES);
}

/** Every old address of the Vue site that leaves it, with where it goes (query and hash as the test adds them). */
const MAP: [string, string][] = [
  // The account and payment pages: the console, under its own name for each (user-side-removal's map).
  ["/dashboard", `${C}/dashboard`],
  // The console's Access keys and its Requests, one hop (console plaza design 2026-11-05).
  ["/keys", `${C}/keys`],
  ["/usage", `${C}/keys/requests`],
  ["/purchase", `${C}/purchase`],
  ["/payment", `${C}/purchase`],
  ["/payment/result", `${C}/payment/result`],
  ["/payment/stripe", `${C}/payment/stripe`],
  ["/payment/stripe-popup", `${C}/payment/stripe`],
  ["/payment/airwallex", `${C}/payment/airwallex`],
  ["/payment/qrcode", `${C}/payment/qrcode`],
  ["/orders", `${C}/orders`],
  ["/subscriptions", `${C}/subscriptions`],
  ["/redeem", `${C}/redeem`],
  ["/transfers", `${C}/transfers`],
  ["/profile", `${C}/profile`],
  ["/affiliate", `${C}/affiliate`],
  ["/support", `${C}/support`],
  ["/support/new", `${C}/support/new`],
  ["/support/123", `${C}/support/123`],
  ["/available-channels", `${C}/models`],
  ["/monitor", `${C}/models`],
  ["/key-usage", `${C}/key-usage`],
  ["/register", `${C}/register`],
  ["/login", `${C}/login`],
  ["/batch-image", `${C}/dashboard`],
  ["/docs/batch-image", `${C}/dashboard`],
  ["/auth/wechat/payment/callback", `${C}/auth/wechat/payment/callback`],
  // The public plaza: the console's.
  ["/plaza", `${C}/plaza`],
  ["/plaza/models", `${C}/models`],
  ["/plaza/sessions", `${C}/plaza/sessions`],
  ["/plaza/workspaces", `${C}/plaza/workspaces`],
  ["/plaza/anything-else", `${C}/plaza/anything-else`],
  ["/model-plaza", `${C}/models`],
  // The admin and its own pages.
  ["/admin", `${A}/admin`],
  ["/admin/users", `${A}/admin/users`],
  ["/admin/tickets/42", `${A}/admin/tickets/42`],
];

describe("the old addresses that leave tokensbeat.com", () => {
  it.each(MAP)("%s goes to %s, query and hash kept, in any case and with a trailing slash", (from, to) => {
    for (const variant of [from, `${from}/`, from.toUpperCase()]) {
      // An admin path keeps the request's own spelling (the React admin maps it).
      const want = /^\/admin/.test(from) && variant === from.toUpperCase() ? to.slice(0, to.length - from.length) + from.toUpperCase() : to;
      expect(direct(variant), variant).toBe(want);
      expect(inlined(variant), variant).toBe(want);
    }
    expect(direct(`${from}?x=1&y=two#frag`)).toBe(`${to}?x=1&y=two#frag`);
    expect(inlined(`${from}?x=1&y=two#frag`)).toBe(`${to}?x=1&y=two#frag`);
  });

  it("keeps an invitation code, a payment's order and a WeChat callback's code and state", () => {
    expect(inlined("/register?aff=FRIEND01")).toBe(`${C}/register?aff=FRIEND01`);
    expect(inlined("/keys?x=1#y")).toBe(`${C}/keys?x=1#y`);
    expect(inlined("/payment/result?out_trade_no=T1&status=ok")).toBe(`${C}/payment/result?out_trade_no=T1&status=ok`);
    expect(inlined("/auth/wechat/payment/callback?code=abc&state=s1")).toBe(`${C}/auth/wechat/payment/callback?code=abc&state=s1`);
    expect(inlined("/purchase?tab=recharge")).toBe(`${C}/purchase?tab=recharge`);
  });

  it("drops the old plaza's in-console marker", () => {
    expect(inlined("/plaza/models?embedded=1")).toBe(`${C}/models`);
    expect(inlined("/plaza/models?embedded=1&group=qwen#top")).toBe(`${C}/models?group=qwen#top`);
    expect(inlined("/model-plaza?embedded=1")).toBe(`${C}/models`);
  });

  it("sends each retired console address to its page in one hop, a target's own query first", () => {
    expect(inlined("/plaza/bench")).toBe(`${C}/models?view=bench`);
    expect(inlined("/plaza/bench?sort=cost#board")).toBe(`${C}/models?view=bench&sort=cost#board`);
    expect(direct("/plaza/bench?embedded=1")).toBe(`${C}/models?view=bench`);
    // the request's own view wins, once: never view=bench&view=pricing (the page reads the first)
    expect(inlined("/plaza/bench?view=pricing#rates")).toBe(`${C}/models?view=pricing#rates`);
    expect(direct("/plaza/bench?sort=cost&view=status&embedded=1")).toBe(`${C}/models?sort=cost&view=status`);
    // an encoded name is the same name to the page
    expect(inlined("/plaza/bench?%76iew=pricing")).toBe(`${C}/models?%76iew=pricing`);
    expect(inlined("/plaza/bench?%E0%A4%A=1")).toBe(`${C}/models?view=bench&%E0%A4%A=1`);
    // Never to an address the console only redirects from (/keys is its Access keys again; /models/api and its tabs
    // are redirects since console plaza K6).
    for (const old of ["/keys", "/usage", "/plaza/models", "/model-plaza", "/available-channels", "/monitor", "/plaza/bench"]) {
      expect(new URL(inlined(old)!).pathname, old).not.toMatch(/^\/(usage|start|plaza\/models|plaza\/bench|model-plaza|available-channels|monitor)$|^\/models\/api(\/|$)/);
    }
  });

  it("sends the admin's own sign-in to the admin, every other to the console (the Vue app's host is retired)", () => {
    expect(inlined("/login?redirect=%2Fadmin%2Fdashboard")).toBe(`${A}/login?redirect=%2Fadmin%2Fdashboard`);
    expect(inlined("/login?redirect=/admin")).toBe(`${A}/login?redirect=/admin`);
    expect(inlined("/login?redirect=%2Fcustom%2Fm1")).toBe(`${C}/login?redirect=%2Fcustom%2Fm1`);
    expect(inlined("/login?redirect=%2Fsetup")).toBe(`${C}/login?redirect=%2Fsetup`);
    expect(inlined("/login?redirect=%2Fkeys")).toBe(`${C}/login?redirect=%2Fkeys`);
    expect(inlined("/login?redirect=%2F%2Fadmin.evil")).toBe(`${C}/login?redirect=%2F%2Fadmin.evil`);
    expect(inlined("/login")).toBe(`${C}/login`);
  });

  it.each(LEGACY_AUTH_PATHS)("%s goes to the console's sign-in with its redirect only, never a code or token", (from) => {
    expect(inlined(`${from}?code=SECRET&state=s&redirect=%2Fkeys#access_token=SECRET`)).toBe(`${C}/login?redirect=%2Fkeys`);
    expect(inlined(`${from}?token=SECRET`)).toBe(`${C}/login`);
    expect(inlined(`${from}?redirect=https%3A%2F%2Fevil.example`)).toBe(`${C}/login`);
  });

  it("sends a consultant's earnings to Aha's consulting desk", () => {
    expect(inlined("/consult/earnings?x=1#y")).toBe("https://aha.tokensbeat.com/#/consult/desk");
  });

  it("goes nowhere else: every target is on one of the moved-to origins or this site", () => {
    const origins = Object.values(MOVED_ORIGINS).filter(Boolean);
    for (const key of [...Object.keys(TABLES.exact), ...TABLES.prefixes.map(([p]) => `${p}x`)]) {
      const to = direct(key)!;
      expect(to, key).toBeTruthy();
      expect(to.startsWith("/") || origins.some((o) => to.startsWith(`${o}/`)), `${key} -> ${to}`).toBe(true);
    }
    // A request cannot choose the host: a doubled slash stays a path on the admin's own host, or no redirect at all.
    expect(inlined("/admin//evil.example/x")).toBe(`${A}/admin//evil.example/x`);
    expect(movedTarget({ pathname: "//evil.example/keys", search: "", hash: "" }, TABLES)).toBeNull();
    // Nothing goes to the Vue app's own host, retired on 2026-11-16.
    expect(Object.values(MOVED_ORIGINS)).not.toContain("https://vue.tokensbeat.com");
  });
});

describe("addresses that stay", () => {
  it("leaves the API paths and unknown addresses a 404", () => {
    for (const p of ["/api/v1/settings/public", "/v1/models", "/v1/chat/completions", "/health", "/no-such-page", "/zh/keys", "/docs/no-such-guide", "/legal/usage-policy"]) {
      expect(direct(p), p).toBeNull();
      expect(inlined(p), p).toBeNull();
    }
  });

  it("leaves the Vue app's custom pages and setup wizard a 404: no page serves them since its host was retired", () => {
    for (const p of ["/custom/menu-1", "/custom/menu-1?x=1", "/custom", "/setup", "/setup/"]) {
      expect(direct(p), p).toBeNull();
      expect(inlined(p), p).toBeNull();
    }
  });

  it("sends this site's old aliases and other spellings of its pages to their address", () => {
    expect(inlined("/home")).toBe("/");
    expect(inlined("/home?ref=x#y")).toBe("/?ref=x#y");
    expect(inlined("/docs/quickstart")).toBe("/docs/");
    expect(inlined("/zh/docs/quickstart/")).toBe("/zh/docs/");
    expect(inlined("/Pricing")).toBe("/pricing/");
    expect(inlined("/pricing")).toBe("/pricing/");
    expect(inlined("/DOCS/Codex?x=1")).toBe("/docs/codex/?x=1");
    expect(inlined("/legal/Terms")).toBe("/legal/terms/");
    expect(inlined("/ZH/docs")).toBe("/zh/docs/");
    // An address that is already right never comes here (it has a file); if it did, no loop.
    expect(direct("/pricing/")).toBeNull();
    expect(direct("/")).toBeNull();
  });
});
