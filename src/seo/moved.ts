/**
 * Where the addresses tokensbeat.com had under the Vue site live now that this site is tokensbeat.com (owner,
 * 2026-11-02). Every old address keeps working:
 *   - the storefront pages, the docs and the legal documents are pages here (the same path with its trailing slash:
 *     the static host adds it; /home is /, /docs/quickstart is /docs/, through this script like the rest);
 *   - the account, payment and sign-in pages are the console's (console.tokensbeat.com), under the console's own name
 *     for each (the Vue app's own map of its moved pages), query string and
 *     hash kept; the public Service Plaza too (/model-plaza and /plaza/models are /models; the old in-console marker ?embedded=1 is
 *     dropped); the WeChat in-app payment callback is the console's from now on;
 *   - the old sign-in callbacks (native auth and providers removed long ago) go to the console's sign-in with only
 *     their `redirect` (never a provider code or token);
 *   - the admin is admin.tokensbeat.com, same path (the React admin maps old /admin/... paths itself), and the admin's
 *     own sign-in (/login?redirect=/admin/...) its /login;
 *   - a consultant's earnings (/consult/earnings) are Aha's consulting desk.
 * The Vue app's custom pages (/custom/<id>) and its setup wizard (/setup) have no page anywhere since the Vue app's own
 * host, vue.tokensbeat.com, was retired (2026-11-16): they stay a 404 here, and a sign-in for one is the console's.
 * api.tokensbeat.com sends every browser path here (the backend's server.ui_redirect_origin), so its old links land
 * through this map too.
 * /api/* and /v1/* are not here: tokensbeat.com has served no API since 27 Oct 2026; they stay a 404.
 *
 * How: the static host (GitHub Pages) answers every address it has no file for with 404.html; that page's
 * first script (inlined by src/entry-server.tsx, its hash in the policy) runs movedTarget on the address and replaces
 * the location before anything renders. The host's own redirects cannot carry the query string or a path below a
 * prefix to another origin, so a client redirect is the only one that keeps everything. movedTarget is
 * self-contained (no imports, no closures, no inner functions: its source text is inlined; tests run that text).
 */

/** The origins old addresses move to. Never a value a request can choose: the path is the request's, the host is not. */
export const MOVED_ORIGINS = {
  console: "https://console.tokensbeat.com",
  admin: "https://admin.tokensbeat.com",
  aha: "https://aha.tokensbeat.com",
  site: "",
} as const;
export type MovedOrigin = keyof typeof MOVED_ORIGINS;

/**
 * What a moved address keeps:
 *   q  its query string and hash
 *   p  the same, without the old plaza's ?embedded=1
 *   r  only its `redirect` query parameter (a site path), no hash: an old sign-in callback's code or token never rides
 *   n  nothing (the target is a fixed page, e.g. Aha's hash route)
 */
export type MovedKeep = "q" | "p" | "r" | "n";
/** [origin, path there (null: the request's own path), what it keeps]. */
export type MovedRule = readonly [MovedOrigin, string | null, MovedKeep];

export interface MovedTables {
  origins: Readonly<Record<MovedOrigin, string>>;
  /** By the address as the old router matched it: lower case, one trailing slash dropped. */
  exact: Readonly<Record<string, MovedRule>>;
  /** Paths below a prefix ("/admin/"); the prefix without its slash ("/admin") matches too. */
  prefixes: readonly (readonly [string, MovedRule])[];
  /** This site's own pages by their lower-case key ("/zh/docs/codex"): their address (case or a missing slash). */
  site: Readonly<Record<string, string>>;
}

const toConsole = (path: string, keep: MovedKeep = "q"): MovedRule => ["console", path, keep];

/** The old user pages and their console path (user-side-removal's MOVED_TO_CONSOLE, plus the WeChat callback). */
const CONSOLE_PAGES: Record<string, MovedRule> = {
  "/dashboard": toConsole("/dashboard"),
  // The console's Access keys and its Requests (console plaza design 2026-11-05): straight there, one hop (the
  // console's /usage and /models/api redirect too).
  "/keys": toConsole("/keys"),
  "/usage": toConsole("/keys/requests"),
  "/purchase": toConsole("/purchase"),
  "/payment": toConsole("/purchase"),
  "/payment/result": toConsole("/payment/result"),
  "/payment/stripe": toConsole("/payment/stripe"),
  "/payment/stripe-popup": toConsole("/payment/stripe"),
  "/payment/airwallex": toConsole("/payment/airwallex"),
  "/payment/qrcode": toConsole("/payment/qrcode"),
  "/orders": toConsole("/orders"),
  "/subscriptions": toConsole("/subscriptions"),
  "/redeem": toConsole("/redeem"),
  "/transfers": toConsole("/transfers"),
  "/profile": toConsole("/profile"),
  "/affiliate": toConsole("/affiliate"),
  "/support": toConsole("/support"),
  "/support/new": toConsole("/support/new"),
  "/available-channels": toConsole("/models"),
  "/monitor": toConsole("/models"),
  "/key-usage": toConsole("/key-usage"),
  "/register": toConsole("/register"),
  // No page of its own in the console: batch image jobs land on the console's overview.
  "/batch-image": toConsole("/dashboard"),
  "/docs/batch-image": toConsole("/dashboard"),
  // The WeChat in-app (JSAPI) payment's OAuth return: the console owns it from the switch on.
  "/auth/wechat/payment/callback": toConsole("/auth/wechat/payment/callback"),
  // The public Service Plaza: the console's (the site's prerendered copies retire with the Vue site).
  "/plaza": toConsole("/plaza", "p"),
  "/plaza/models": toConsole("/models", "p"),
  "/plaza/bench": toConsole("/models?view=bench", "p"),
  "/plaza/sessions": toConsole("/plaza/sessions", "p"),
  "/plaza/workspaces": toConsole("/plaza/workspaces", "p"),
  "/model-plaza": toConsole("/models", "p"),
};

/** The Vue site's old sign-in callbacks (its LEGACY_AUTH_REDIRECT_PATHS): to sign-in, `redirect` only. */
export const LEGACY_AUTH_PATHS = [
  "/forgot-password",
  "/reset-password",
  "/email-verify",
  "/auth/callback",
  "/auth/oauth/callback",
  "/auth/linuxdo/callback",
  "/auth/wechat/callback",
  "/auth/dingtalk/callback",
  "/auth/dingtalk/email-completion",
  "/auth/oidc/callback",
] as const;

/** The tables for this site: `sitePaths` are its own pages' addresses ("/", "/zh/docs/codex/"…). */
export function movedTables(sitePaths: readonly string[]): MovedTables {
  const exact: Record<string, MovedRule> = { ...CONSOLE_PAGES };
  for (const p of LEGACY_AUTH_PATHS) exact[p] = toConsole("/login", "r");
  exact["/consult/earnings"] = ["aha", "/#/consult/desk", "n"];
  exact["/admin"] = ["admin", null, "q"];
  // Old aliases on this site: the Vue router's /home, and the quickstart's second address.
  exact["/home"] = ["site", "/", "q"];
  exact["/docs/quickstart"] = ["site", "/docs/", "q"];
  exact["/zh/docs/quickstart"] = ["site", "/zh/docs/", "q"];
  const site: Record<string, string> = {};
  for (const p of sitePaths) site[p.length > 1 ? p.replace(/\/$/, "").toLowerCase() : p] = p;
  return {
    origins: MOVED_ORIGINS,
    exact,
    prefixes: [
      ["/admin/", ["admin", null, "q"]],
      // A ticket (/support/<id>) and every other plaza page: the console's, same path.
      ["/support/", ["console", null, "q"]],
      ["/plaza/", ["console", null, "p"]],
    ],
    site,
  };
}

/**
 * Where a page load at `location` must go, or null to stay (a 404 then). Self-contained: its source text runs inlined
 * in 404.html (src/entry-server.tsx movedScript), so it uses nothing outside its own body.
 *   /login is the admin's sign-in when its `redirect` is an admin page (admin.tokensbeat.com/login), else the console's;
 *   query and hash kept.
 *   A prefix rule keeps the request's own path (one trailing slash dropped; the console's plaza paths in lower case).
 */
export function movedTarget(location: { pathname: string; search: string; hash: string }, tables: MovedTables): string | null {
  const pathname = location.pathname || "/";
  const lower = pathname.toLowerCase();
  const key = lower.length > 1 && lower.charAt(lower.length - 1) === "/" ? lower.slice(0, -1) : lower;
  const own = pathname.length > 1 && pathname.charAt(pathname.length - 1) === "/" ? pathname.slice(0, -1) : pathname;
  const search = location.search === "?" ? "" : location.search || "";
  const hash = location.hash || "";
  // The `redirect` query parameter, decoded; "" when absent or unreadable.
  let redirect = "";
  const parts = search.replace(/^\?/, "").split("&");
  for (let i = 0; i < parts.length; i++) {
    const eq = parts[i].indexOf("=");
    if ((eq < 0 ? parts[i] : parts[i].slice(0, eq)) !== "redirect") continue;
    try {
      redirect = decodeURIComponent((eq < 0 ? "" : parts[i].slice(eq + 1)).replace(/\+/g, " "));
    } catch {
      redirect = "";
    }
    break;
  }
  const local = redirect.charAt(0) === "/" && redirect.charAt(1) !== "/" && redirect.charAt(1) !== "\\";
  let rule: readonly [string, string | null, string] | null = null;
  let path = own;
  if (key === "/login") {
    const target = local ? redirect.split(/[?#]/)[0].toLowerCase() : "";
    if (target === "/admin" || target.indexOf("/admin/") === 0) rule = ["admin", "/login", "q"];
    else rule = ["console", "/login", "q"];
  } else if (Object.prototype.hasOwnProperty.call(tables.exact, key)) {
    rule = tables.exact[key];
  } else {
    for (let i = 0; i < tables.prefixes.length; i++) {
      const prefix = tables.prefixes[i][0];
      if (key.indexOf(prefix) === 0 || key === prefix.slice(0, -1)) {
        rule = tables.prefixes[i][1];
        if (rule[0] === "console") path = key;
        break;
      }
    }
  }
  if (!rule) {
    // One of this site's own pages, asked for in another case or without its slash.
    if (!Object.prototype.hasOwnProperty.call(tables.site, key)) return null;
    rule = ["site", tables.site[key], "q"];
  }
  const origin = (tables.origins as Record<string, string>)[rule[0]];
  if (origin === undefined) return null;
  const to = rule[1] === null ? path : rule[1];
  let rest = "";
  if (rule[2] === "q") rest = search + hash;
  else if (rule[2] === "p") {
    const kept: string[] = [];
    for (let i = 0; i < parts.length; i++) if (parts[i] !== "" && parts[i] !== "embedded=1") kept.push(parts[i]);
    rest = (kept.length ? "?" + kept.join("&") : "") + hash;
  } else if (rule[2] === "r") rest = local ? "?redirect=" + encodeURIComponent(redirect) : "";
  // A target with a query of its own (/models?view=bench) keeps the parameters the request does not name, then the
  // request's: the request's own value wins (/plaza/bench?view=pricing stays on pricing, as the console's redirects
  // do) and no name repeats (the console reads the first of a repeated view=), names compared as the page reads them,
  // decoded (?%76iew= is view=).
  let target = to;
  const q = to.indexOf("?");
  if (q >= 0 && rest.charAt(0) === "?") {
    const nameOf = (part: string) => {
      const raw = part.split("=")[0].replace(/\+/g, " ");
      try {
        return decodeURIComponent(raw);
      } catch {
        return raw;
      }
    };
    const asked = rest.slice(1).split("#")[0].split("&");
    const names: string[] = [];
    for (let i = 0; i < asked.length; i++) names.push(nameOf(asked[i]));
    const own = to.slice(q + 1).split("&");
    const keep: string[] = [];
    for (let i = 0; i < own.length; i++) if (names.indexOf(nameOf(own[i])) < 0) keep.push(own[i]);
    target = to.slice(0, q) + (keep.length ? "?" + keep.join("&") : "");
    rest = (keep.length ? "&" : "?") + rest.slice(1);
  }
  // Never back to this very address (no loop): same site, same path, same query.
  if (origin === "" && target === pathname && rest === search + hash) return null;
  return origin + target + rest;
}

/**
 * The first script of 404.html: movedTarget's own source applied to the page's location with `tables`, then a hidden
 * page and location.replace (no history entry for the old address). Its sha256 joins the policy (scripts/prerender.mjs
 * hashes every inline script it writes).
 */
export function movedScript(tables: MovedTables): string {
  const data = JSON.stringify(tables).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
  return `(function(){try{var to=(${movedTarget.toString()})(window.location,${data});if(to){document.documentElement.style.visibility="hidden";window.location.replace(to)}}catch(e){}})();`;
}
