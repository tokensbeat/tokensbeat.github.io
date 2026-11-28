import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { App } from "@/App";
import { C } from "@/content/copy";
import { appPagePath, CONTENT_PAGES } from "@/content/routes";
import { NAV_SERVE, NAV_SUPPORT, pagePath, SITE_PAGES } from "@/content/site";
import { LANGS, translate } from "@/i18n";
import { BUILT_PAGES } from "@/page/pages";

/** Every href on the page (or in `scope`) for links of this accessible name. */
function hrefOf(name: string | RegExp, scope: HTMLElement = document.body): string[] {
  return within(scope)
    .getAllByRole("link", { name })
    .map((a) => a.getAttribute("href") ?? "");
}

const ALLOWED_OUTSIDE = [/^https:\/\/console\.tokensbeat\.com\//, /^https:\/\/aha\.tokensbeat\.com(\/|$)/, /^https:\/\/news\.tokensbeat\.com$/];
/** Every address this site prerenders: its pages, the docs' guides and the legal documents, in both languages. */
const KNOWN = new Set([...SITE_PAGES.map((p) => p.id), ...CONTENT_PAGES].flatMap((p) => LANGS.map((l) => appPagePath(p, l))));

describe.each(BUILT_PAGES.flatMap((page) => LANGS.map((lang) => [page, lang] as const)))("%s in %s", (page, lang) => {
  beforeEach(() => {
    render(<App lang={lang} page={page} />);
  });

  it("has one h1, named by the main landmark, and the page's landmarks", () => {
    const h1s = screen.getAllByRole("heading", { level: 1 });
    expect(h1s).toHaveLength(1);
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("main")).toHaveAttribute("aria-labelledby", h1s[0].id);
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
    expect(h1s[0]).toHaveTextContent(/\S/);
  });

  it("links only to pages that exist (its own, the docs, the legal documents), the console and Aha", () => {
    for (const a of document.querySelectorAll("a[href]")) {
      const href = a.getAttribute("href")!;
      if (href.startsWith("/")) expect(KNOWN.has(href.split("#")[0]), href).toBe(true);
      else if (!href.startsWith("#")) expect(ALLOWED_OUTSIDE.some((re) => re.test(href)), href).toBe(true);
    }
  });

  it("sends console links in the page's language", () => {
    for (const a of document.querySelectorAll<HTMLAnchorElement>('a[href^="https://console.tokensbeat.com"]')) {
      const url = new URL(a.href);
      expect(url.searchParams.get("lang"), a.href).toBe(lang === "zh" ? "zh" : null);
    }
  });

  it("writes the brand TokensBeat", () => {
    expect(document.body.textContent).not.toMatch(/Tokensbeat/);
  });

  it("links this page in both languages from the head, the current one marked", () => {
    const head = screen.getByRole("banner");
    const group = within(head).getByRole("group", { name: translate(lang, "Language") });
    expect(within(group).getByRole("link", { name: "English" })).toHaveAttribute("href", pagePath(page, "en"));
    expect(within(group).getByRole("link", { name: "中文" })).toHaveAttribute("href", pagePath(page, "zh"));
    const current = within(group).getByRole("link", { name: lang === "zh" ? "中文" : "English" });
    expect(current).toHaveAttribute("aria-current", "page");
  });
});

describe("the head", () => {
  it("opens Platform: the Serve and Support pages, each with its line, and closes on Escape", () => {
    render(<App lang="en" page="home" />);
    const button = screen.getByRole("button", { name: "Platform" });
    const panel = document.getElementById("h-platform")!;
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(panel).not.toBeVisible();
    fireEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(panel).toBeVisible();
    for (const id of [...NAV_SERVE, ...NAV_SUPPORT]) {
      expect(hrefOf(new RegExp(`^${translate("en", C.pages[id].name)}`), panel)).toEqual([pagePath(id, "en")]);
      expect(panel).toHaveTextContent(translate("en", C.pages[id].blurb));
    }
    expect(panel).toHaveTextContent("Production infrastructure at scale");
    expect(panel).toHaveTextContent("Tools and real engineers in your corner");
    fireEvent.keyDown(document, { key: "Escape" });
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(button).toHaveFocus();
  });

  it("links Aha, Pricing, Support and the docs, then Launch Aha and Get started (to /start/); no Sign in, no admin", () => {
    render(<App lang="en" page="home" />);
    const nav = screen.getByRole("navigation", { name: "Main" });
    expect(hrefOf("Aha", nav)).toContain("/aha/");
    expect(hrefOf("Pricing", nav)).toContain("/pricing/");
    expect(hrefOf("Support", nav)).toContain("/help/");
    expect(hrefOf("Docs", nav)).toContain("/docs/");
    // Get started is a page where the visitor chooses the console or Aha; Aha has its own quiet link (owner, 2026-11-02).
    expect(hrefOf("Get started", nav)).toEqual(["/start/"]);
    expect(hrefOf("Launch Aha", nav)).toEqual(["https://aha.tokensbeat.com"]);
    const end = nav.querySelector(".h-head__end")!;
    expect([...end.querySelectorAll("a")].map((a) => a.textContent)).toEqual(["EN", "中文", "Launch Aha", "Get started"]);
    expect(within(nav).queryByRole("link", { name: /Sign in|Log in|Try Aha/ })).toBeNull();
    expect(document.querySelector('a[href*="admin"], a[href*="/login"]')).toBeNull();
  });

  it("opens the menu sheet on a phone with Get started and Launch Aha first, the pages, then the language; in Chinese on /zh/", () => {
    render(<App lang="zh" page="home" />);
    const menu = screen.getByRole("button", { name: "菜单" });
    fireEvent.click(menu);
    expect(menu).toHaveAccessibleName("关闭菜单");
    const sheet = document.getElementById("h-sheet")!;
    expect(sheet).toBeVisible();
    expect(hrefOf(/开始使用/, sheet)).toEqual(["/zh/start/"]);
    expect(hrefOf("启动 Aha", sheet)).toEqual(["https://aha.tokensbeat.com"]);
    expect(within(sheet).queryByRole("link", { name: "登录" })).toBeNull();
    const sheetLinks = within(sheet).getAllByRole("link");
    expect(sheetLinks[0]).toHaveTextContent("开始使用");
    expect(sheetLinks[1]).toHaveTextContent("启动 Aha");
    for (const id of [...NAV_SERVE, ...NAV_SUPPORT]) expect(hrefOf(new RegExp(`^${translate("zh", C.pages[id].name)}`), sheet)).toEqual([pagePath(id, "zh")]);
    expect(within(sheet).getByRole("group", { name: "语言" })).toBeInTheDocument();
  });

  it("dims the page under the open Platform panel, and a click on it closes the panel", () => {
    render(<App lang="en" page="home" />);
    const scrim = document.querySelector<HTMLElement>(".h-scrim")!;
    expect(scrim).not.toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Platform" }));
    expect(scrim).toBeVisible();
    expect(document.querySelectorAll("#h-platform .h-item__icon svg")).toHaveLength(NAV_SERVE.length + NAV_SUPPORT.length);
    fireEvent.click(scrim);
    expect(screen.getByRole("button", { name: "Platform" })).toHaveAttribute("aria-expanded", "false");
    expect(document.getElementById("h-platform")).not.toBeVisible();
  });
});

describe("the foot", () => {
  it("lists every page, the plaza, the console and the legal documents, and what the labels mean", () => {
    render(<App lang="en" page="home" />);
    const foot = screen.getByRole("contentinfo");
    for (const p of SITE_PAGES) {
      if (p.id === "home") continue;
      expect(hrefOf(translate("en", C.pages[p.id].name), foot)).toEqual([pagePath(p.id, "en")]);
    }
    expect(hrefOf("Get started", foot)).toEqual(["/start/"]);
    expect(hrefOf("Service Plaza", foot)).toEqual(["https://console.tokensbeat.com/models"]);
    expect(hrefOf("Console", foot)).toEqual(["https://console.tokensbeat.com/dashboard"]);
    expect(hrefOf("Terms of Service", foot)).toEqual(["/legal/terms/"]);
    expect(hrefOf("Privacy Policy", foot)).toEqual(["/legal/privacy/"]);
    expect(hrefOf("Docs", foot)).toEqual(["/docs/"]);
    const legend = within(foot).getByRole("note", { name: "What the labels mean" });
    for (const s of ["Live", "Beta", "Early access", "Coming"]) expect(legend).toHaveTextContent(s);
    // Each chip, then what it means without saying the label again.
    expect(legend).toHaveTextContent("Live Production-ready and open to all.");
    expect(legend).not.toHaveTextContent("Live: Production");
    expect(foot).toHaveTextContent("https://api.tokensbeat.com/v1");
  });
});

describe("the homepage", () => {
  it("heads the journey with the owner's line in two sentences, then a plate for each stop and the paper sections", () => {
    render(<App lang="en" page="home" />);
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1).toHaveTextContent("Galaxies of Intelligence. Born from Within.");
    // The poem's two halves, a line each, the second in jade (owner, 2026-11-16: the poem is the headline).
    expect([h1.querySelector(":scope > span")!.textContent, h1.querySelector(":scope > em")!.textContent]).toEqual(["Galaxies of Intelligence.", "Born from Within."]);
    const lead = screen.getByText("One account for an AI assistant, bots that run on a schedule, and one API key for every model. Pay as you go.");
    expect(h1.compareDocumentPosition(lead) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent)).toEqual([
      "An assistant for chat, papers and code.",
      "Bots that work while you're away.",
      "One key for every model.",
      "One balance. Pay as you go.",
      "Your first request.",
      "No subscription.",
      "Start with Aha.",
    ]);
    // Aha in the hero, on its plate and at the close; a key in the hero, on the API's plate, beside the call and at the close.
    expect(hrefOf("Open Aha")).toEqual(Array(3).fill("https://aha.tokensbeat.com"));
    expect(hrefOf("Get an API key")).toEqual(Array(4).fill("https://console.tokensbeat.com/keys"));
    expect(hrefOf("Read the docs")).toEqual(["/docs/"]);
    expect(hrefOf("Model prices")).toEqual(["https://console.tokensbeat.com/models?view=pricing"]);
    // The API's plate sends the reader to the call further down.
    expect(hrefOf("See the code")).toEqual(["#home-code"]);
    expect(document.getElementById("home-code")).toHaveTextContent("Your first request.");
  });

  it("draws the chart on a night slab: its notes hidden from screen readers, the five stops, where the reader is, and Pause", () => {
    render(<App lang="en" page="home" />);
    const journey = screen.getByRole("region", { name: "Galaxies of Intelligence. Born from Within." });
    expect(journey.querySelector(".j__stage")).toHaveAttribute("data-theme", "dark");
    expect(within(journey).getByRole("img", { name: /^A star chart of the Milky Way drawn in characters, with four constellations along it/ })).toBeInTheDocument();
    const notes = journey.querySelector(".j__notes")!;
    expect(notes).toHaveAttribute("aria-hidden", "true");
    expect([...notes.querySelectorAll("[data-note] b")].map((b) => b.textContent)).toEqual([
      "Chat", "LaTeX", "Aha Work", "Coder", "Watcher", "Researcher", "Team", "Writer", "Webhook", "Your key", "Gateway", "A model", "One balance", "Aha", "Bots", "API",
    ]);
    // Aha keeps its capitals inside the mono caps; the other names are set in caps.
    expect(notes.querySelector('[data-note="aha.work"] b')).toHaveClass("h-keep-case");
    expect(notes.querySelector('[data-note="api.key"] b')).not.toHaveClass("h-keep-case");
    const stops = within(within(journey).getByRole("navigation", { name: "Stops" })).getAllByRole("button");
    expect(stops.map((b) => b.textContent)).toEqual(["00Start", "01Aha", "02Bots", "03Model API", "04Pricing"]);
    expect(stops.map((b) => b.getAttribute("aria-current"))).toEqual(["step", null, null, null, null]);
    expect(journey.querySelector(".j__where")).toHaveTextContent("00 / 04 · Start");
    // A toggle with one name: pressed while the chart is paused (its icon turns to Play).
    const pause = within(journey).getByRole("button", { name: "Pause" });
    expect(pause).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(pause);
    expect(within(journey).getByRole("button", { name: "Pause" })).toHaveAttribute("aria-pressed", "true");
  });

  it("hides Pause under reduced motion: the chart follows the scroll and stands still", () => {
    vi.stubGlobal("matchMedia", (query: string) => ({ matches: query === "(prefers-reduced-motion: reduce)", addEventListener() {}, removeEventListener() {} }));
    try {
      render(<App lang="en" page="home" />);
      expect(screen.queryByRole("button", { name: "Pause" })).toBeNull();
      expect(screen.getByRole("navigation", { name: "Stops" })).toBeInTheDocument();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("tells each stop on its plate as it is: Aha (Aha Work in early access), Bots, the Model API and Pricing", () => {
    render(<App lang="en" page="home" />);
    const plate = (name: string) => screen.getByRole("article", { name });
    const aha = plate("An assistant for chat, papers and code.");
    expect([...aha.querySelectorAll(".j__points b")].map((b) => b.textContent)).toEqual(["Chat", "LaTeX", "Aha Work"]);
    // Released inside Aha for Windows for the accounts TokensBeat turns on: the one chip on the journey.
    expect([...document.querySelectorAll(".j [data-status]")].map((c) => [c.closest("li")!.dataset.point, c.getAttribute("data-status")])).toEqual([["work", "early"]]);
    expect(aha).toHaveTextContent("The repository stays on your machine.");
    expect(hrefOf("Download for Windows", aha)).toEqual(["https://aha.tokensbeat.com/desktop/download/windows"]);
    const bots = plate("Bots that work while you're away.");
    expect(bots).toHaveTextContent("Up to eight per account, each with its own budget.");
    expect(hrefOf("Open Bots in Aha", bots)).toEqual(["https://aha.tokensbeat.com/#/bots"]);
    // Bots never show a price or a balance; they are not characters; nothing unreleased (phone push, a bot on the user's PC).
    expect(bots.textContent).not.toMatch(/\$|balance|price|credit|companion|persona|phone|your PC|GitHub/i);
    const api = plate("One key for every model.");
    expect(api).toHaveTextContent("No plans or groups to choose.");
    // The plan that was retired on 2026-11-16 is not offered, and no reseller is named.
    expect(api.textContent).not.toMatch(/Official only|Best price/);
    const pricing = plate("One balance. Pay as you go.");
    expect(pricing).toHaveTextContent("Top up from $5 by card or Link, or from $15 in USDT or USDC.");
    expect(hrefOf("See pricing", pricing)).toEqual(["/pricing/"]);
    expect(hrefOf("Privacy", pricing)).toEqual(["/legal/privacy/"]);
    // Not released: Aha for VS Code, the phone apps, a Mac build.
    expect(document.querySelector("main")!.textContent).not.toMatch(/VS Code|Android|iPhone|iOS|macOS|Mac\b/);
  });

  it("gives the first request in three languages, each with Copy, the model from the reader's own environment", () => {
    render(<App lang="en" page="home" />);
    const code = screen.getByRole("region", { name: "Your first request." });
    const tabs = within(within(code).getByRole("tablist", { name: "Code examples" })).getAllByRole("tab");
    expect(tabs.map((t) => t.textContent)).toEqual(["cURL", "Python", "Node.js"]);
    expect(code.querySelector("pre")).toHaveTextContent("curl https://api.tokensbeat.com/v1/chat/completions");
    expect(code.querySelector("pre")).toHaveTextContent('{"model": "$TOKENSBEAT_MODEL",');
    expect(within(code).getByRole("button", { name: "Copy code" })).toBeInTheDocument();
    fireEvent.click(tabs[1]);
    expect(code.querySelector("pre")).toHaveTextContent('base_url="https://api.tokensbeat.com/v1"');
    expect(code.querySelector("pre")).toHaveTextContent('model=os.environ["TOKENSBEAT_MODEL"]');
  });

  it("gives the price figures, then closes with Aha and a key", () => {
    render(<App lang="en" page="home" />);
    const pricing = screen.getByRole("region", { name: "No subscription." });
    expect([...pricing.querySelectorAll(".s1-stat")].map((s) => [s.querySelector(".s1-stat__label")!.textContent, s.querySelector(".s1-stat__value")!.textContent])).toEqual([
      ["Monthly fee", "$0"],
      ["Card or Link, from", "$5"],
      ["USDT or USDC, from", "$15"],
    ]);
    expect(pricing).toHaveTextContent("Any fee for the method you pick shows at checkout, before you pay.");
    const close = screen.getByRole("region", { name: "Start with Aha." });
    expect(within(close).getAllByRole("link").map((a) => [a.textContent, a.getAttribute("href")])).toEqual([
      ["Open Aha", "https://aha.tokensbeat.com"],
      ["Get an API key", "https://console.tokensbeat.com/keys"],
    ]);
  });

  it("speaks Chinese on /zh/, with each link in Chinese", () => {
    render(<App lang="zh" page="home" />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("星汉灿烂，若出其里。");
    expect(hrefOf("打开 Aha")).toEqual(Array(3).fill("https://aha.tokensbeat.com"));
    expect(hrefOf("获取 API 密钥")).toEqual(Array(4).fill("https://console.tokensbeat.com/keys?lang=zh"));
    expect(hrefOf("阅读文档")).toEqual(["/zh/docs/"]);
    expect(hrefOf("模型价格")).toEqual(["https://console.tokensbeat.com/models?view=pricing&lang=zh"]);
    const pricing = screen.getByRole("article", { name: "一份余额，用多少付多少。" });
    expect(hrefOf("查看价格", pricing)).toEqual(["/zh/pricing/"]);
    expect(hrefOf("隐私政策", pricing)).toEqual(["/zh/legal/privacy/"]);
    expect(screen.getByRole("navigation", { name: "站点" })).toBeInTheDocument();
    expect(document.querySelector(".j__where")).toHaveTextContent("00 / 04 · 起点");
    expect(screen.getByRole("article", { name: "你不在时，机器人照常做事。" })).toHaveTextContent("每个账户最多八个，额度各自独立。");
  });
});

describe("the Aha page", () => {
  it.each([
    ["en", "Aha Code"],
    ["zh", "Aha 代码"],
  ] as const)("gives Aha Code its status: early access inside Aha for Windows, never 'not open yet' (%s)", (lang, name) => {
    render(<App lang={lang} page="aha" />);
    const cell = screen.getByRole("heading", { level: 3, name }).closest("li")!;
    expect(cell.querySelector("[data-status]")).toHaveAttribute("data-status", "early");
    expect(cell).toHaveTextContent(lang === "zh" ? "随 Aha Windows 版提供" : "Inside Aha for Windows");
    expect(document.querySelector("main")!.textContent).not.toMatch(/Not open yet|尚未开放/);
  });
});

describe.each(["aha", "storage", "database", "supabase", "pricing", "models", "help", "status", "workspace", "agents", "build"] as const)("the closing band of %s", (page) => {
  it("sets the page's art, empty until it comes near, in a column of its own hidden from screen readers", () => {
    render(<App lang="en" page={page} />);
    const band = document.querySelector<HTMLElement>(".h-cta")!;
    expect(band).toHaveClass("h-cta--aside");
    const art = band.querySelector("canvas.h-cta-art")!;
    expect(art).toHaveAttribute("data-art", page);
    expect(art.closest(".h-cta__aside")).toHaveAttribute("aria-hidden", "true");
    expect(art).not.toHaveAttribute("data-drawn");
    expect(within(band).getAllByRole("link").length).toBeGreaterThan(0);
  });
});

describe("the get-started page", () => {
  afterEach(() => window.history.replaceState(null, "", "/"));

  it("offers two choices, each a card with its picture, address, line and action: the console and Aha", () => {
    render(<App lang="en" page="start" />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Where do you want to start?");
    const cards = [...document.querySelectorAll<HTMLElement>(".h-start__choice")];
    expect(cards.map((c) => c.dataset.choice)).toEqual(["console", "aha"]);
    const [console_, aha] = cards;
    expect(within(console_).getByRole("heading", { level: 2 })).toHaveTextContent("TokensBeat Console");
    expect(console_).toHaveTextContent("console.tokensbeat.com");
    expect(console_).toHaveTextContent("API keys, top-ups, usage, the Service Plaza and invoices");
    expect(within(console_).getByRole("link", { name: "Open the console" })).toHaveAttribute("href", "https://console.tokensbeat.com/");
    expect(within(aha).getByRole("heading", { level: 2 })).toHaveTextContent("Aha");
    expect(aha).toHaveTextContent("aha.tokensbeat.com");
    expect(within(aha).getByRole("link", { name: "Launch Aha" })).toHaveAttribute("href", "https://aha.tokensbeat.com");
    for (const card of cards) {
      expect(card.querySelector(".h-start__icon svg")).toBeInTheDocument();
      expect(within(card).getAllByRole("link")).toHaveLength(1);
    }
    expect(hrefOf("Read the docs", screen.getByRole("main"))).toEqual(["/docs/"]);
    expect(hrefOf("See pricing", screen.getByRole("main"))).toEqual(["/pricing/"]);
  });

  it("in Chinese: 开始使用, the console in Chinese (?lang=zh), 启动 Aha", () => {
    render(<App lang="zh" page="start" />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("你想从哪里开始？");
    expect(screen.getByRole("heading", { level: 2, name: "TokensBeat 控制台" })).toBeInTheDocument();
    const main = screen.getByRole("main");
    expect(hrefOf("打开控制台", main)).toEqual(["https://console.tokensbeat.com/?lang=zh"]);
    expect(hrefOf("启动 Aha", main)).toEqual(["https://aha.tokensbeat.com"]);
  });

  it("sends a visitor who came with an invite code to the console's sign-up with it, in the page's language", () => {
    window.history.replaceState(null, "", "/start/?aff=FRIEND01&utm_source=x");
    const first = render(<App lang="en" page="start" />);
    expect(hrefOf("Open the console", screen.getByRole("main"))).toEqual(["https://console.tokensbeat.com/register?redirect=%2Faffiliate%3Faff%3DFRIEND01"]);
    expect(hrefOf("Launch Aha", screen.getByRole("main"))).toEqual(["https://aha.tokensbeat.com"]);
    first.unmount();
    window.history.replaceState(null, "", "/zh/start/?aff=friend_02");
    const second = render(<App lang="zh" page="start" />);
    expect(hrefOf("打开控制台", screen.getByRole("main"))).toEqual(["https://console.tokensbeat.com/register?redirect=%2Faffiliate%3Faff%3Dfriend_02&lang=zh"]);
    second.unmount();
    // Not a code the console takes: the plain front door.
    window.history.replaceState(null, "", "/start/?aff=%3Cscript%3E");
    render(<App lang="en" page="start" />);
    expect(hrefOf("Open the console", screen.getByRole("main"))).toEqual(["https://console.tokensbeat.com/"]);
  });
});

describe("the 404 page", () => {
  it("says so in both languages and links both homepages", () => {
    render(<App lang="en" page="404" />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Page not found. 页面不存在。");
    expect(screen.getByRole("link", { name: "Go to the homepage" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "返回中文首页" })).toHaveAttribute("href", "/zh/");
  });
});

/** A fetch that answers by path: the body (JSON unless a string with a type) and the status. */
function fakeFetch(routes: Record<string, { status?: number; body: unknown; type?: string; headers?: Record<string, string> }>) {
  return vi.fn(async (input: RequestInfo | URL) => {
    const path = String(input);
    const r = routes[path];
    if (!r) throw new TypeError(`no route ${path}`);
    const type = r.type ?? "application/json";
    return new Response(typeof r.body === "string" ? r.body : JSON.stringify(r.body), { status: r.status ?? 200, headers: { "Content-Type": type, ...r.headers } });
  });
}

describe("the status page, live", () => {
  const fresh = () => ({ version: 1, generated_at: new Date().toISOString(), probes: { aha: { ok: true, status: 200, checked_at: new Date().toISOString() } } });

  it("shows each part's state once checked: up from /health and the snapshot, no public check for the rest", async () => {
    vi.stubGlobal("fetch", fakeFetch({ "/health": { body: { status: "ok" } }, "/status.json": { body: fresh() } }));
    render(<App lang="en" page="status" />);
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Every service with a public check is up."));
    const row = (id: string) => document.querySelector(`[data-component="${id}"]`)!;
    expect(row("website")).toHaveAttribute("data-state", "operational");
    expect(row("api")).toHaveAttribute("data-state", "operational");
    expect(row("aha")).toHaveAttribute("data-state", "operational");
    expect(row("runtime")).toHaveAttribute("data-state", "unchecked");
    expect(row("support")).toHaveAttribute("data-state", "unchecked");
    expect(screen.getByRole("button", { name: "Check again" })).toBeEnabled();
    vi.unstubAllGlobals();
  });

  it("says Unknown, not Problem, when the server cannot reach the gateway or answers with a page; Problem for the gateway's own error", async () => {
    vi.stubGlobal(
      "fetch",
      fakeFetch({ "/health": { status: 502, body: { error: "x" }, headers: { "X-Home-Upstream": "unreachable" } }, "/status.json": { status: 404, body: "<!doctype html>", type: "text/html" } }),
    );
    const first = render(<App lang="en" page="status" />);
    await waitFor(() => expect(document.querySelector('[data-component="api"]')).toHaveAttribute("data-state", "unknown"));
    expect(document.querySelector('[data-component="aha"]')).toHaveAttribute("data-state", "unknown");
    expect(screen.getByRole("status")).toHaveTextContent("Some services could not be checked.");
    first.unmount();

    vi.stubGlobal("fetch", fakeFetch({ "/health": { status: 404, body: "<!doctype html>", type: "text/html" }, "/status.json": { body: fresh() } }));
    const second = render(<App lang="en" page="status" />);
    await waitFor(() => expect(document.querySelector('[data-component="api"]')).toHaveAttribute("data-state", "unknown"));
    second.unmount();

    vi.stubGlobal("fetch", fakeFetch({ "/health": { status: 503, body: { status: "down" } }, "/status.json": { body: fresh() } }));
    render(<App lang="zh" page="status" />);
    await waitFor(() => expect(document.querySelector('[data-component="api"]')).toHaveAttribute("data-state", "problem"));
    expect(screen.getByRole("status")).toHaveTextContent("有服务出了问题。");
    vi.unstubAllGlobals();
  });

  it("counts a snapshot older than 13 hours as Unknown", async () => {
    const old = new Date(Date.now() - 14 * 3600 * 1000).toISOString();
    vi.stubGlobal("fetch", fakeFetch({ "/health": { body: { status: "ok" } }, "/status.json": { body: { version: 1, generated_at: old, probes: { aha: { ok: true, status: 200, checked_at: old } } } } }));
    render(<App lang="en" page="status" />);
    await waitFor(() => expect(document.querySelector('[data-component="aha"]')).toHaveAttribute("data-state", "unknown"));
    expect(document.querySelector('[data-component="aha"]')).toHaveTextContent("too long ago to count");
    vi.unstubAllGlobals();
  });
});

describe("the pricing page, live", () => {
  it("keeps the top-up button while top-ups are open", async () => {
    const fetch = fakeFetch({ "/api/v1/settings/public": { body: { code: 0, data: { payment_enabled: true, payment_balance_disabled: false } } } });
    vi.stubGlobal("fetch", fetch);
    render(<App lang="en" page="pricing" />);
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(hrefOf("Add to your balance")).toEqual(["https://console.tokensbeat.com/purchase?tab=recharge"]);
    expect(screen.queryByText("Top-ups are paused on this site right now.")).toBeNull();
    vi.unstubAllGlobals();
  });

  it("drops it and says top-ups are paused when the settings say so", async () => {
    vi.stubGlobal("fetch", fakeFetch({ "/api/v1/settings/public": { body: { code: 0, data: { payment_enabled: true, payment_balance_disabled: true } } } }));
    render(<App lang="zh" page="pricing" />);
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("本站目前暂停充值。"));
    expect(screen.queryByRole("link", { name: /充值余额/ })).toBeNull();
    vi.unstubAllGlobals();
  });
});
