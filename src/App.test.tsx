import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { App } from "@/App";
import { C } from "@/content/copy";
import { HOME } from "@/content/home";
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
  it("heads the page with the owner's line in two sentences, the claim in plain words under it, then its sections, live products first", () => {
    render(<App lang="en" page="home" />);
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1).toHaveTextContent("Galaxies of Intelligence. Born from Within.");
    // The poem's two halves, a line each, the second in jade (owner, 2026-11-16: the poem is the headline).
    expect([h1.querySelector(":scope > span")!.textContent, h1.querySelector(":scope > em")!.textContent]).toEqual(["Galaxies of Intelligence.", "Born from Within."]);
    const claim = document.querySelector(".h-home-claim")!;
    expect(claim).toHaveTextContent("One key for the models. A team of bots for the work.");
    expect(h1.compareDocumentPosition(claim) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(document.querySelector(".h-home-motto")).toBeNull();
    const h2s = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
    expect(h2s).toEqual([
      "New this month",
      "Bots that work while you are away.",
      "Aha Code works in the folder on your own computer.",
      "One kind of key reaches the models.",
      "AI API pricing is a mess. Here's the map.",
      "More that is open today.",
      "A backend for your app, opening in stages.",
      "People and tools while you build.",
      "One balance. Pay for what you use.",
      "Questions",
      "Step onto the Bedrock. Build Your Universe.",
    ]);
    // Aha in the hero and the closing band; a key in the hero, beside the call and in the closing band.
    expect(hrefOf("Open Aha")).toEqual(["https://aha.tokensbeat.com", "https://aha.tokensbeat.com"]);
    expect(hrefOf("Get an API key")).toEqual(Array(3).fill("https://console.tokensbeat.com/keys"));
    expect(hrefOf("See pricing")).toEqual(["/pricing/"]);
    expect(document.querySelectorAll("details.h-faq__item")).toHaveLength(4);
  });

  it("dates what is new this month, each line with its status and a link to its section on the page", () => {
    render(<App lang="en" page="home" />);
    const news = screen.getByRole("region", { name: "New this month" });
    const items = [...news.querySelectorAll<HTMLElement>("[data-news]")];
    expect(items.map((li) => [li.dataset.news, li.querySelector("time")!.textContent, li.querySelector("[data-status]")!.getAttribute("data-status"), within(li).getByRole("link").textContent])).toEqual([
      ["bots", "15 Nov", "live", "Bots"],
      ["code", "16 Nov", "early", "Aha Code"],
      ["keys", "16 Nov", "live", "One kind of key"],
    ]);
    for (const li of items) {
      const href = within(li).getByRole("link").getAttribute("href")!;
      expect(href).toMatch(/^#home-(bots|code|models)$/);
      expect(document.getElementById(href.slice(1)), href).toBeInTheDocument();
    }
  });

  it("tells Bots as they are: live, a job from one sentence, routines, asks that wait, a team room, what wakes one, and never money", () => {
    render(<App lang="en" page="home" />);
    const bots = screen.getByRole("region", { name: "Bots that work while you are away." });
    expect(bots.querySelector('.h-eyebrow [data-status="live"]')).toBeInTheDocument();
    // Bots are Live; the one thing in the section that is not is its lead picture, the coming Workspace's room, and it
    // alone carries Coming. Today's list beside it carries Live.
    // (Each picture says its status twice: on its frame's bar, over the picture, and on its caption.)
    expect([...bots.querySelectorAll("[data-status]")].map((c) => [c.closest("figure")?.getAttribute("data-shot") ?? "section", c.getAttribute("data-status")])).toEqual([
      ["section", "live"],
      ["room", "coming"],
      ["room", "coming"],
      ["bots", "live"],
      ["bots", "live"],
    ]);
    expect(bots).toHaveTextContent("The new Workspace, coming in the next Aha update: a house where each bot will have a room, and pressing a room will take you inside. Here Atlas, a sample bot, is at work in its own.");
    expect(bots).toHaveTextContent("A bot is a job, not a character");
    expect(bots).toHaveTextContent("Up to eight in an account.");
    expect([...bots.querySelectorAll(".h-spread__points h3")].map((h) => h.textContent)).toEqual(["Made from one sentence", "Routines", "It asks, then waits", "One room for the team"]);
    expect(bots).toHaveTextContent("one of five starters, from Researcher to Chief of staff");
    expect(bots).toHaveTextContent("At most 24 such runs in any 24 hours, across all your bots.");
    expect([...bots.querySelectorAll("[data-wake]")].map((r) => [r.getAttribute("data-wake"), r.querySelector("th")!.textContent])).toEqual([
      ["routine", "A routine"],
      ["feed", "A feed or a page"],
      ["address", "A request to its address"],
      ["you", "You"],
    ]);
    expect(bots.querySelectorAll('[data-note="bounds"] li')).toHaveLength(3);
    expect(bots).toHaveTextContent("Each bot gets a share of your key's 30-day allowance.");
    // The two notes are disclosures, open as the page is written, each named by its title.
    const notes = [...bots.querySelectorAll<HTMLDetailsElement>("details.h-feat__note")];
    expect(notes.map((n) => [n.dataset.note, n.open, n.querySelector("summary h3")!.textContent])).toEqual([
      ["wakes", true, "What wakes a bot"],
      ["bounds", true, "What keeps it in bounds"],
    ]);
    expect(hrefOf("Open Bots in Aha", bots)).toEqual(["https://aha.tokensbeat.com/#/bots"]);
    // Bots never show a price or a balance: neither does what the site says about them. Nor are they
    // characters, and nothing that is not released is promised (phone push, a bot on the user's PC).
    expect(bots.textContent).not.toMatch(/\$|balance|price|credit|companion|persona|phone|your PC|GitHub/i);
  });

  it("folds Bots' notes to a row each on a phone once the page is live, and leaves them open on a wide screen", () => {
    vi.stubGlobal("matchMedia", (query: string) => ({ matches: query === "(max-width: 639px)", addEventListener() {}, removeEventListener() {} }));
    try {
      render(<App lang="en" page="home" />);
      const notes = [...document.querySelectorAll<HTMLDetailsElement>("details.h-feat__note")];
      expect(notes).toHaveLength(2);
      expect(notes.map((n) => n.open)).toEqual([false, false]);
      // Still on the page, for a reader who opens one and for search engines.
      expect(notes[0].querySelectorAll("[data-wake]")).toHaveLength(4);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("says in the hero's own line that Aha Code is in early access", () => {
    render(<App lang="en" page="home" />);
    const hero = screen.getByRole("region", { name: "Galaxies of Intelligence. Born from Within." });
    expect(hero.querySelector(".h-lean-hero__line")).toHaveTextContent("Aha Code, now in early access, works in the folder on your own Windows computer.");
  });

  it("tells Aha Code as it is: early access inside Aha for Windows 0.4.1, the download, and nothing that is not released", () => {
    render(<App lang="en" page="home" />);
    const code = screen.getByRole("region", { name: "Aha Code works in the folder on your own computer." });
    // Released, but shown only for the accounts TokensBeat turns on: Early access, never Live, Beta or Coming.
    expect([...code.querySelectorAll("[data-status]")].map((c) => c.getAttribute("data-status"))).toEqual(["early"]);
    expect(code.querySelectorAll(".h-spread__points > li")).toHaveLength(4);
    expect(code).toHaveTextContent("Your repo stays on your computer.");
    expect(code).toHaveTextContent("It asks before a command runs");
    expect(code).toHaveTextContent("Early access: Aha Code shows for the accounts TokensBeat has turned it on for. Aha for Windows 0.4.1 runs on Windows 10 and 11 (x64).");
    expect(hrefOf("Download Aha for Windows", code)).toEqual(["https://aha.tokensbeat.com/desktop/download/windows"]);
    // Who sees it is said before the download, so nobody installs the app expecting what their account does not show.
    const who = code.querySelector(".h-feat__small")!;
    expect(who.compareDocumentPosition(within(code).getByRole("link", { name: "Download Aha for Windows" })) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(hrefOf("Ask for early access", code)).toEqual(["https://console.tokensbeat.com/support/new?category=general&subject=Aha+Code+early+access"]);
    // Not released: Aha for VS Code, the phone apps, a Mac build.
    expect(document.querySelector("main")!.textContent).not.toMatch(/VS Code|Android|iPhone|iOS|macOS|Mac\b/);
  });

  it("shows what else is open in Aha, each card with its status and where it goes", () => {
    render(<App lang="en" page="home" />);
    const aha = screen.getByRole("region", { name: "More that is open today." });
    // Aha's own storage by its name: the backend's Storage & Functions, in early access, is another thing.
    expect(within(aha).getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual(["LaTeX", "TokensBeat News", "Metro2Line", "Aha Storage"]);
    for (const id of ["latex", "news", "metro", "aha-storage"]) expect(aha.querySelector(`[data-item="${id}"] [data-status="live"]`), id).toBeInTheDocument();
    expect(hrefOf("TokensBeat News", aha)).toEqual(["https://news.tokensbeat.com"]);
    expect(hrefOf("Aha Storage", aha)).toEqual(["https://console.tokensbeat.com/plaza/storage"]);
    expect(hrefOf("Metro2Line", aha)).toEqual(["/aha/"]);
    expect(hrefOf("Everything Aha does", aha)).toEqual(["/aha/"]);
  });

  it("says one kind of key beside the call itself: no plan to pick, the docs' own cURL example", () => {
    render(<App lang="en" page="home" />);
    const models = screen.getByRole("region", { name: "One kind of key reaches the models." });
    expect(models.querySelector('.h-eyebrow [data-status="live"]')).toBeInTheDocument();
    expect(models.querySelectorAll(".h-lines li")).toHaveLength(4);
    expect(models).toHaveTextContent("Nobody picks a plan or a route.");
    // The plan that was retired on 2026-11-16 is not offered, and no reseller is named.
    expect(models.textContent).not.toMatch(/Official only|Best price/);
    expect(models.querySelector("pre")).toHaveTextContent("curl https://api.tokensbeat.com/v1/chat/completions");
    expect(within(models).getByRole("button", { name: "Copy cURL" })).toBeInTheDocument();
    expect(models).toHaveTextContent("Where a discounted route serves the model, it goes there first.");
    expect(hrefOf("Read the quickstart", models)).toEqual(["/docs/"]);
    expect(hrefOf("How the gateway works", models)).toEqual(["/ai-models/"]);
  });

  it("names each part of the backend and of the support once, as a card with its status and its page", () => {
    render(<App lang="en" page="home" />);
    const serve = screen.getByRole("region", { name: "A backend for your app, opening in stages." });
    expect(within(serve).getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual(["Database & Auth", "Storage & Functions", "Agents", "Supabase Move"]);
    expect(hrefOf("Database & Auth", serve)).toEqual(["/database/"]);
    for (const id of ["database", "storage", "agents"]) expect(serve.querySelector(`[data-item="${id}"] [data-status="early"]`), id).toBeInTheDocument();
    expect(serve.querySelector('[data-item="supabase"] [data-status="coming"]')).toBeInTheDocument();
    const support = screen.getByRole("region", { name: "People and tools while you build." });
    expect(within(support).getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual(["Workspace", "Guides & Docs", "Human Support", "Build with Us"]);
    expect(hrefOf("Build with Us", support)).toEqual(["/build/"]);
    expect(support.querySelector('[data-item="workspace"] [data-status="beta"]')).toBeInTheDocument();
    // A person answers: said without "bots", which are a product now.
    expect(support).toHaveTextContent("A person answers your ticket.");
  });

  it("speaks Chinese on /zh/, with each link in Chinese", () => {
    render(<App lang="zh" page="home" />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("星汉灿烂，若出其里。");
    expect(document.querySelector(".h-home-claim")).toHaveTextContent("一把密钥通模型，一队机器人干活。");
    expect(hrefOf("打开 Aha")).toEqual(["https://aha.tokensbeat.com", "https://aha.tokensbeat.com"]);
    expect(hrefOf("获取 API 密钥")).toEqual(Array(3).fill("https://console.tokensbeat.com/keys?lang=zh"));
    expect(hrefOf("申请抢先体验")[0]).toMatch(/^https:\/\/console\.tokensbeat\.com\/support\/new\?.*lang=zh$/);
    expect(hrefOf("下载 Aha Windows 版")).toEqual(["https://aha.tokensbeat.com/desktop/download/windows"]);
    expect(hrefOf("数据库与认证", screen.getByRole("region", { name: "给你应用的后端，正在分批开放。" }))).toEqual(["/zh/database/"]);
    expect(hrefOf("看快速开始")).toEqual(["/zh/docs/"]);
    expect(screen.getByRole("heading", { level: 2, name: "常见问题" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "你不在的时候，机器人照常干活。" })).toHaveTextContent("一个机器人就是一份差事，不是一个角色");
  });

  it.each([
    ["en", "Step onto the Bedrock. Build Your Universe.", ["Step onto the Bedrock.", "Build Your Universe."], /[㐀-鿿]/, ["Open Aha", "Get an API key"]],
    ["zh", "踏上基石，构建你的宇宙。", ["踏上基石，", "构建你的宇宙。"], /[A-Za-z]{4,}/, ["打开 Aha", "获取 API 密钥"]],
  ] as const)("closes (%s) on its line in the page's language alone, a sentence a line, with its two buttons", (lang, name, titleLines, otherLanguage, buttons) => {
    render(<App lang={lang} page="home" />);
    const band = screen.getByRole("region", { name });
    const title = within(band).getByRole("heading", { level: 2, name });
    expect(title).toHaveClass("h-cta__title");
    expect([...title.querySelectorAll("[data-line]")].map((l) => l.textContent)).toEqual(titleLines);
    // One language at a time (owner, 2026-11-12): no line in the other language under the title.
    expect(band.querySelector(".h-cta__deck")).toBeNull();
    expect(band.querySelector("[lang]")).toBeNull();
    expect(band.querySelector(".h-cta__words")!.textContent!.replace(/\b(Aha|API)\b/g, "")).not.toMatch(otherLanguage);
    expect(within(band).getAllByRole("heading")).toHaveLength(1);
    expect(within(band).getAllByRole("link").map((a) => [a.textContent, a.getAttribute("href")])).toEqual([
      [buttons[0], "https://aha.tokensbeat.com"],
      [buttons[1], `https://console.tokensbeat.com/keys${lang === "zh" ? "?lang=zh" : ""}`],
    ]);
    // The sharks are decoration beside the words: hidden from screen readers, which read the words themselves.
    const water = band.querySelector("canvas.h-sharks")!;
    expect(water.closest(".h-cta__aside")).toHaveAttribute("aria-hidden", "true");
  });

  it("draws the orbit's first frame, its labels as links with their status, and Pause hidden until it moves", () => {
    render(<App lang="en" page="home" />);
    const labels = screen.getByRole("list", { name: "How TokensBeat sits around your app" });
    expect(within(labels).getAllByRole("link")).toHaveLength(10);
    expect(within(labels).getByRole("link", { name: "Agent runtime (Early access)" })).toHaveAttribute("href", "/agents/");
    const moons = document.querySelectorAll<HTMLElement>(".h-orbit__moon");
    expect(moons).toHaveLength(10);
    // jsdom answers prefers-reduced-motion with false and has no IntersectionObserver: the figure counts as moving.
    expect(screen.getByRole("button", { name: "Pause the orbit" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Pause the orbit" }));
    expect(screen.getByRole("button", { name: "Play the orbit" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Play the orbit" }).closest("figure")).toHaveAttribute("data-paused");
  });
});

describe("the Aha page", () => {
  it.each(LANGS)("gives Aha Code the status the homepage gives it: early access inside Aha for Windows, never 'not open yet' (%s)", (lang) => {
    render(<App lang={lang} page="aha" />);
    const title = screen.getByRole("heading", { level: 3, name: HOME.code.eyebrow[lang].split(" · ")[1] });
    const cell = title.closest("li")!;
    expect(cell.querySelector("[data-status]")).toHaveAttribute("data-status", HOME.code.status);
    expect(HOME.code.status).toBe("early");
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

describe("the homepage's hero", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("is one composition on the night sky in both themes: the words, the orbit and the stars, which stop with Pause", () => {
    // A canvas that can draw, and a frame clock that never fires (the loop's state is what this test reads).
    const ctx = {
      globalAlpha: 1, fillStyle: "", setTransform() {}, clearRect() {}, fillRect() {}, beginPath() {}, arc() {}, fill() {}, drawImage() {},
      createRadialGradient: () => ({ addColorStop() {} }),
    };
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(ctx as unknown as CanvasRenderingContext2D);
    vi.stubGlobal("requestAnimationFrame", () => 1);
    vi.stubGlobal("cancelAnimationFrame", () => undefined);
    render(<App lang="en" page="home" />);
    const hero = screen.getByRole("region", { name: "Galaxies of Intelligence. Born from Within." });
    expect(hero).toHaveAttribute("data-theme", "dark");
    expect(hero).toHaveClass("h-cosmos");
    expect(within(hero).getByRole("figure")).toBeInTheDocument();
    expect(within(hero).getByRole("link", { name: "Open Aha" })).toBeInTheDocument();
    expect(within(hero).getByRole("link", { name: "Get an API key" })).toBeInTheDocument();
    const sky = hero.querySelector<HTMLCanvasElement>("canvas.h-cosmos__stars")!;
    expect(sky).toHaveAttribute("aria-hidden", "true");
    expect(sky.dataset.state).toBe("moving");
    fireEvent.click(screen.getByRole("button", { name: "Pause the orbit" }));
    expect(sky.dataset.state).toBe("paused");
    fireEvent.click(screen.getByRole("button", { name: "Play the orbit" }));
    expect(sky.dataset.state).toBe("moving");
    // The head's "+" marks would sit on the sky's edge: the homepage's head drops them.
    expect(screen.getByRole("banner")).toHaveClass("h-head--cosmos");
  });

  it("draws each moon as ASCII in the planet's glyphs, its label still riding beside it", () => {
    render(<App lang="en" page="home" />);
    const arts = [...document.querySelectorAll<HTMLElement>(".h-orbit__moon > .h-orbit__moon-art")];
    expect(arts).toHaveLength(10);
    for (const art of arts) {
      expect(art.textContent).toMatch(/^[@%#*+=\-:. \n]+$/);
      expect(art.textContent!.trim()).not.toBe("");
      expect(art.style.getPropertyValue("--moon-d")).toMatch(/^\d+\.\d{3}em$/);
    }
    expect(document.querySelectorAll(".h-orbit__labels a[data-moon]")).toHaveLength(10);
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
