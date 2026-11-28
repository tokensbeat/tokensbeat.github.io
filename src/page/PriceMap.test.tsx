/**
 * The price maps, read from the gateway's public price list (GET /api/v1/model-plaza/prices): on /pricing/, ghost lines
 * in the prerendered page, the live maps after (families with their logos, fare zones, an interchange, the piece map,
 * the hidden list that is their text alternative, the link to the console's table), in English and Chinese; prices
 * not published (404, 403), a failure, reduced motion; never a status, whatever the body sends. The AI models page's
 * link to them.
 */
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { App } from "@/App";

const token = (input: number, output: number) => ({ billing_mode: "token", input_price: input, output_price: output });
/** The price list as the gateway sends it: the { code, data } envelope, prices per token. */
const PLAZA = {
  code: 0,
  data: {
    groups: [
      {
        id: 2,
        name: "OpenAI · Official",
        rate_multiplier: 1,
        models: [
          { name: "gpt-5.5", pricing: token(1.6e-6, 8e-6) },
          { name: "o5-preview", pricing: null },
          { name: "gpt-image-2", pricing: { billing_mode: "image", per_request_price: 0.04 } },
        ],
      },
      { id: 4, name: "Claude · Official", rate_multiplier: 1, models: [{ name: "claude-haiku-5", pricing: token(1e-6, 8e-6) }] },
      { id: 5, name: "Qwen", rate_multiplier: 1, models: [{ name: "qwen-3.8", pricing: token(4e-7, 1.2e-6) }] },
    ],
  },
};
/** The same list with each model's last 24 hours, as the sign-in plaza sends them: never shown. */
const day = (status: string, last: string[] = []) => ({ status, buckets: [...Array(24 - last.length).fill("operational"), ...last].map((s, i) => ({ start: `2026-11-02T${String(i).padStart(2, "0")}:00:00Z`, status: s })) });
function withHealth() {
  const measured = structuredClone(PLAZA);
  const [openai, claude] = measured.data.groups;
  Object.assign(openai.models[0], { health: day("degraded", ["degraded"]) });
  Object.assign(openai.models[2], { health: day("down", ["down", "down"]) });
  Object.assign(claude.models[0], { health: day("operational", ["unknown"]) });
  return measured;
}

/** The page's live reads: the price list as given, top-ups open; anything else (the sign-in plaza) is not there. */
function stubFetch(plaza: { status?: number; body: unknown } | "offline") {
  const fetch = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url === "/api/v1/settings/public") return Response.json({ code: 0, data: { payment_enabled: true } });
    if (url === "/api/v1/model-plaza/prices") {
      if (plaza === "offline") throw new TypeError("Failed to fetch");
      return Response.json(plaza.body, { status: plaza.status ?? 200 });
    }
    throw new TypeError(`no route ${url}`);
  });
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

afterEach(() => vi.unstubAllGlobals());

/** The price map section. */
const section = () => document.getElementById("pricing-map")!.closest("section")!;
/** A map by its caption. */
const figure = async (caption: RegExp) => (await screen.findByText(caption, { selector: "figcaption" })).closest("figure")!;

describe("the price map on /pricing/", () => {
  it("is in the prerendered page as its heading and ghost lines, no prices, in both languages", () => {
    const en = renderToString(<App lang="en" page="pricing" />);
    expect(en).toContain(`id="pricing-map" class="h-h2">AI API pricing is a mess. Here&#x27;s the map.</h2>`);
    expect(en).toMatch(/<figure class="s1-metro h-pricemap__map" aria-busy="true"/);
    expect(en.match(/class="s1-metro__ghost-roundel"/g)).toHaveLength(6);
    expect(en).not.toContain("s1-metro__line");
    const zh = renderToString(<App lang="zh" page="pricing" />);
    expect(zh).toContain("AI API 的价格一团乱，这是地图。");
    expect(zh).toContain('<span class="s1-visually-hidden">加载中</span>');
  });

  it("draws the live prices, one line a family by output price in fare zones, the piece map under it, and no table", async () => {
    const fetch = stubFetch({ body: PLAZA });
    render(<App lang="en" page="pricing" />);
    const map = await figure(/^TokensBeat's prices now/);
    expect(fetch).toHaveBeenCalledWith("/api/v1/model-plaza/prices", expect.objectContaining({ credentials: "omit" }));
    expect(fetch.mock.calls.map(([url]) => String(url))).not.toContain("/api/v1/model-plaza");
    expect(map).toHaveAttribute("aria-details", "pricing-map-list");
    expect(within(map).getByRole("group", { name: "Price map of the models, by family and output price" })).toBeInTheDocument();
    expect(within(map).getAllByRole("group").map((g) => g.getAttribute("aria-label"))).toEqual(["Price map of the models, by family and output price", "GPT", "Claude", "Qwen"]);
    expect(within(map).getByRole("link", { name: "gpt-5.5, 1.60 / 8.00" })).toHaveAttribute("href", expect.stringMatching(/^https:\/\/console\.tokensbeat\.com\/models\?model=gpt-5\.5&group=\d+$/));
    // no status on any card
    expect(map.querySelector(".s1-metro__status")).toBeNull();
    // each line's roundel has its family's logo
    expect(map.querySelector('.s1-metro__mark svg[data-family="gpt"]')).not.toBeNull();
    // the zones the prices reach ($1.20 to $8.00): from Zone 2 to Zone 4
    expect([...map.querySelectorAll(".s1-metro__zone-name")].map((z) => z.textContent)).toEqual(["Zone 2 · $0.50–2", "Zone 3 · $2–8", "Zone 4 · $8–20"]);
    expect(within(map).getByText(/^TokensBeat's prices now.*1 more is in the plaza, free or without a price\.$/).tagName).toBe("FIGCAPTION");
    expect(map.querySelectorAll(".s1-metro__legend .s1-metro__glyph")).toHaveLength(3);
    // two families at $8.00 out meet at an interchange
    expect(within(map).getByRole("img", { name: "Same fare: gpt-5.5 and claude-haiku-5, $8.00 out" })).toHaveAttribute("tabindex", "0");
    // the table is the console's: a link under the caption
    expect(within(section()).getByRole("link", { name: "Every price, every route, as a table" })).toHaveAttribute("href", "https://console.tokensbeat.com/models?view=pricing");
    expect(within(section()).queryByRole("table")).toBeNull();
    // by the piece: its own map, the unit on the stop
    expect(within(section()).getByRole("heading", { level: 3, name: "By the piece" })).toBeInTheDocument();
    const piece = await figure(/^The lowest price per image/);
    expect(within(piece).getByRole("link", { name: "gpt-image-2, 0.04 / image" })).toBeInTheDocument();
    expect(piece.querySelector(".s1-metro__zone")).toBeNull();
    // the text alternative: the same data as a list, out of sight
    const list = document.getElementById("pricing-map-list")!;
    expect(list).toHaveClass("h-visually-hidden");
    expect(within(list).getByRole("list", { name: "Priced per 1M tokens, input / output" })).toHaveTextContent("gpt-5.5, 1.60 / 8.00");
    expect(within(list).getByRole("list", { name: "Priced by the piece" })).toHaveTextContent("gpt-image-2, 0.04 / image");
    expect(list).not.toHaveTextContent("o5-preview");
  });

  it("never ends a stop's card in a status, even when the body sends each model's last 24 hours (owner 2026-11-03)", async () => {
    stubFetch({ body: withHealth() });
    render(<App lang="en" page="pricing" />);
    const map = await figure(/^TokensBeat's prices now/);
    expect(within(map).getByRole("link", { name: "gpt-5.5, 1.60 / 8.00" })).toBeInTheDocument();
    expect(within(map).getByRole("link", { name: "claude-haiku-5, 1.00 / 8.00" })).toBeInTheDocument();
    expect(within(map).getByRole("link", { name: "qwen-3.8, 0.40 / 1.20" })).toBeInTheDocument();
    const piece = await figure(/^The lowest price per image/);
    expect(within(piece).getByRole("link", { name: "gpt-image-2, 0.04 / image" })).toBeInTheDocument();
    // the card: its prices and where they come from, no status line and no strip
    fireEvent.focus(within(map).getByRole("link", { name: /^gpt-5\.5, / }));
    const tip = document.querySelector<HTMLElement>(".s1-metro__tip")!;
    expect(tip).toHaveTextContent("Input / output, USD per 1M tokens · from OpenAI · Official");
    expect(document.querySelector(".s1-metro__status, .s1-metro__strip, .s1-metro__tip-tone")).toBeNull();
    expect(section()).not.toHaveTextContent(/Degraded|Normal|No status yet|Last 24 hours/);
    const listed = within(document.getElementById("pricing-map-list")!).getByRole("list", { name: "Priced per 1M tokens, input / output" });
    expect(within(listed).getAllByRole("listitem").filter((li) => !li.querySelector("ul")).map((li) => li.textContent)).toEqual(["gpt-5.5, 1.60 / 8.00", "claude-haiku-5, 1.00 / 8.00", "qwen-3.8, 0.40 / 1.20"]);
  });

  it("is in Chinese on the Chinese page, the families' names as they are, its stops opening the console in Chinese", async () => {
    stubFetch({ body: PLAZA });
    render(<App lang="zh" page="pricing" />);
    const map = await figure(/^TokensBeat 现在的价格/);
    expect(within(map).getByRole("group", { name: "Qwen" })).toBeInTheDocument();
    expect(within(map).getByRole("link", { name: "qwen-3.8, 0.40 / 1.20" })).toHaveAttribute("href", expect.stringMatching(/^https:\/\/console\.tokensbeat\.com\/models\?model=qwen-3\.8&group=\d+&lang=zh$/));
    expect(map.querySelector(".s1-metro__zone-name")).toHaveTextContent("2 区 · $0.50–2");
    expect(within(map).getByRole("img", { name: "同价：gpt-5.5 和 claude-haiku-5，输出 $8.00" })).toBeInTheDocument();
    expect(within(section()).getByRole("heading", { level: 3, name: "按件计价" })).toBeInTheDocument();
    expect(within(section()).getByRole("link", { name: "每个价格、每条线路的表格" })).toHaveAttribute("href", "https://console.tokensbeat.com/models?view=pricing&lang=zh");
  });

  it.each([404, 403])("keeps its heading and sends the reader to the plaza, under the TokensBeat mark, when the gateway does not publish its prices (%i)", async (status) => {
    stubFetch({ status, body: { code: status, message: "Model plaza prices are not public" } });
    render(<App lang="en" page="pricing" />);
    const map = await screen.findByRole("figure", { busy: false });
    expect(within(section()).getByRole("heading", { level: 2, name: "AI API pricing is a mess. Here's the map." })).toBeInTheDocument();
    expect(within(map).getByText("Live prices are in the Service Plaza")).toBeInTheDocument();
    expect(map.querySelector(".s1-empty__own .c-logo--mono")).not.toBeNull();
    const open = within(map).getByRole("link", { name: "Open the Service Plaza" });
    expect(open).toHaveAttribute("href", "https://console.tokensbeat.com/models");
    expect(open.querySelector("svg.h-btn__icon")).not.toBeNull();
    expect(map.querySelector("figcaption, .s1-metro__legend")).toBeNull();
    expect(document.getElementById("pricing-map-list")).toBeNull();
    expect(screen.queryByRole("link", { name: "Every price, every route, as a table" })).toBeNull();
  });

  it("says the map could not load when nothing answers", async () => {
    stubFetch("offline");
    render(<App lang="zh" page="pricing" />);
    const map = await screen.findByRole("figure", { busy: false });
    expect(within(map).getByText("地图暂时没能加载")).toBeInTheDocument();
    expect(within(map).getByRole("link", { name: "打开服务广场" })).toHaveAttribute("href", "https://console.tokensbeat.com/models?lang=zh");
  });

  it("stops the trains' clock under reduced motion", async () => {
    const pause = vi.fn();
    Object.assign(SVGSVGElement.prototype, { pauseAnimations: pause, unpauseAnimations: vi.fn() });
    vi.stubGlobal("matchMedia", (query: string) => ({ matches: query === "(prefers-reduced-motion: reduce)", media: query, addEventListener: () => undefined, removeEventListener: () => undefined }));
    stubFetch({ body: PLAZA });
    try {
      render(<App lang="en" page="pricing" />);
      await figure(/^TokensBeat's prices now/);
      await waitFor(() => expect(pause).toHaveBeenCalled());
    } finally {
      delete (SVGSVGElement.prototype as Partial<SVGSVGElement>).pauseAnimations;
      delete (SVGSVGElement.prototype as Partial<SVGSVGElement>).unpauseAnimations;
    }
  });
});

describe("the AI models page", () => {
  it("links to the price map", () => {
    render(<App lang="en" page="models" />);
    expect(screen.getByRole("link", { name: "See the price map" })).toHaveAttribute("href", "/pricing/#pricing-map");
  });

  it("links to it in Chinese", () => {
    render(<App lang="zh" page="models" />);
    expect(screen.getByRole("link", { name: "查看价格地图" })).toHaveAttribute("href", "/zh/pricing/#pricing-map");
  });
});
