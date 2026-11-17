import { describe, expect, it } from "vitest";
import { translate } from "@/i18n";
import { cheapestFares, dollars, fareLabel, interchange, priceMaps, readPlaza, tokenAxis, usd, zones, type PlazaGroup } from "./priceMap";

const en = (key: string, vars?: Record<string, string | number>) => translate("en", key, vars);
const zh = (key: string, vars?: Record<string, string | number>) => translate("zh", key, vars);

const token = (input: number | null, output: number | null) => ({ billing_mode: "token", input_price: input, output_price: output });
const unit = (mode: string, price: number | null, tiers: number[] = []) => ({ billing_mode: mode, per_request_price: price, intervals: tiers.map((p) => ({ per_request_price: p })) });

/** The price list as the gateway sends it (GET /api/v1/model-plaza/prices): the { code, data } envelope, prices per token. */
const BODY = {
  code: 0,
  data: {
    groups: [
      { id: 1, name: "Claude · Official", rate_multiplier: 1, models: [{ name: "claude-opus-5", pricing: token(5e-6, 2.5e-5) }, { name: "claude-haiku-5", pricing: token(1e-6, 5e-6) }] },
      {
        id: 2,
        name: "Mixed",
        rate_multiplier: 1,
        models: [
          { name: "gpt-5.5", pricing: token(1.6e-6, 8e-6) },
          { name: "gpt-image-2", pricing: unit("image", 0.04) },
          { name: "sora-3", pricing: unit("video", 0.09) },
          { name: "hailuo-3", pricing: unit("per_request", null, [1.36, 2.72]) },
          { name: "o5-preview", pricing: null },
          { name: "qwen-3.8", pricing: token(4e-7, 1.2e-6) },
          { name: "gemini-embedding-2", pricing: token(1.5e-7, 0) },
          { name: "jev-1", pricing: unit("per_request", 0.002) },
          { name: "mystery-1", pricing: token(1e-6, 2e-6) },
        ],
      },
      { id: 3, name: "OpenAI · Discount", rate_multiplier: 0.8, models: [{ name: "gpt-5.5", pricing: token(1.6e-6, 8e-6) }] },
    ],
  },
};

describe("readPlaza", () => {
  it("reads the groups from the envelope or from the data alone", () => {
    expect(readPlaza(BODY)?.map((g) => g.id)).toEqual([1, 2, 3]);
    expect(readPlaza(BODY.data)?.length).toBe(3);
  });

  it("is null for anything that is not a price list, and leaves out what it cannot read", () => {
    for (const junk of [null, "<!doctype html>", [], { code: 401, message: "Authentication required" }, { data: { groups: "no" } }]) expect(readPlaza(junk)).toBeNull();
    const groups = readPlaza({ groups: [{ id: "x", models: [] }, { id: 9, models: [{ name: 3 }, { name: "ok", pricing: { input_price: "1", output_price: 2e-6 } }] }] })!;
    expect(groups).toHaveLength(1);
    expect(groups[0].models).toEqual([{ name: "ok", pricing: { billing_mode: undefined, input_price: null, output_price: 2e-6, per_request_price: null, intervals: [] } }]);
  });

  it("drops a model's health and anything else it does not draw, whatever the body sends (no status, owner 2026-11-03)", () => {
    const [group] = readPlaza({ groups: [{ id: 1, name: "g", health: { status: "down", pool_status: "down" }, access: "private", models: [{ name: "a", platform: "openai", health: { status: "degraded", buckets: [{ status: "down" }] }, pricing: token(1e-6, 2e-6) }] }] })!;
    expect(group).not.toHaveProperty("health");
    expect(group).not.toHaveProperty("access");
    expect(group.models[0]).toEqual({ name: "a", pricing: { billing_mode: "token", input_price: 1e-6, output_price: 2e-6, per_request_price: null, intervals: [] } });
    const stations = priceMaps([group], en).tokens.flatMap((l) => l.stations);
    expect(stations.map((s) => s.status)).toEqual([undefined]);
  });
});

describe("the price maps' lines", () => {
  const groups = readPlaza(BODY) as PlazaGroup[];

  it("price each model once at its lowest, the group's rate applied", () => {
    const gpt = cheapestFares(groups).find((f) => f.model === "gpt-5.5")!;
    expect([gpt.group.id, gpt.input, gpt.output, gpt.family]).toEqual([3, 1.28, 6.4, "gpt"]);
  });

  it("run one a family in the fixed order, marked by the family's logo, the brand's own name", () => {
    const { tokens } = priceMaps(groups, en);
    expect(tokens.map((l) => [l.id, l.name, l.colour])).toEqual([
      ["gpt", "GPT", "var(--c-vendor-openai)"],
      ["claude", "Claude", "var(--c-vendor-anthropic)"],
      ["gemini", "Gemini", "var(--c-vendor-google)"],
      ["qwen", "Qwen", "var(--c-vendor-qwen)"],
      ["other", "Other", undefined],
    ]);
    expect(tokens.slice(0, 4).every((l) => l.mark != null)).toBe(true);
    expect(tokens[4].mark).toBeUndefined();
    expect(priceMaps(groups, zh).tokens.map((l) => l.name)).toEqual(["GPT", "Claude", "Gemini", "Qwen", "其他"]);
  });

  it("place a token model at its output price, in / out under it; an embedding at its input price on a square stop", () => {
    const { tokens } = priceMaps(groups, en);
    expect(tokens[0].stations[0]).toMatchObject({ id: "gpt-5.5", x: 6.4, kind: "stop", value: "1.28 / 6.40", note: "Input / output, USD per 1M tokens · from OpenAI · Discount" });
    expect(tokens[2].stations[0]).toMatchObject({ id: "gemini-embedding-2", x: 0.15, kind: "input", value: "0.15 / 0.00", note: "Priced on input; output is free · from Mixed" });
    expect(tokens[1].stations.map((s) => [s.label, s.x])).toEqual([["claude-haiku-5", 5], ["claude-opus-5", 25]]);
  });

  it("put models priced by the piece on their own map, the unit on every stop, and leave models without a price off both", () => {
    const { pieces, unpriced, tokens } = priceMaps(groups, en);
    expect(pieces.map((l) => [l.id, l.stations.map((s) => [s.label, s.x, s.value])])).toEqual([
      ["gpt", [["gpt-image-2", 0.04, "0.04 / image"]]],
      ["minimax", [["hailuo-3", 1.36, "1.36 / req"]]],
      ["jev", [["jev-1", 0.002, "0.002 / req"]]],
      ["other", [["sora-3", 0.09, "0.09 / s"]]],
    ]);
    expect(pieces[2].mark).toBeUndefined();
    expect(pieces[1].stations[0].note).toBe("USD per request · from Mixed");
    expect(unpriced).toBe(1);
    expect(tokens.flatMap((l) => l.stations).some((s) => s.id === "o5-preview")).toBe(false);
    expect(priceMaps(groups, zh).pieces.flatMap((l) => l.stations.map((s) => s.value))).toEqual(["0.04 / 张", "1.36 / 次", "0.002 / 次", "0.09 / 秒"]);
  });

  it("link each stop where asked, and none otherwise", () => {
    expect(priceMaps(groups, en).tokens[0].stations[0].href).toBeUndefined();
    // Each stop opens the model in the group its price comes from, never the first group listing it.
    const first = priceMaps(groups, en).tokens[0].stations[0];
    const linked = priceMaps(groups, en, (m, g) => `https://console.tokensbeat.com/models?model=${m}&group=${g}`).tokens[0].stations[0];
    expect(linked.href).toMatch(/^https:\/\/console\.tokensbeat\.com\/models\?model=gpt-5\.5&group=\d+$/);
    expect(linked.note).toBe(first.note);
  });

  it("are none without data", () => {
    expect(priceMaps(null, en)).toEqual({ tokens: [], pieces: [], unpriced: 0 });
    expect(priceMaps([], en)).toEqual({ tokens: [], pieces: [], unpriced: 0 });
  });

  it("write prices with two decimals, or as many as they have", () => {
    expect([usd(0.4), usd(1.6000000000000003), usd(0.125), usd(15), usd(0.0035)]).toEqual(["0.40", "1.60", "0.125", "15.00", "0.0035"]);
    expect([dollars(0.5), dollars(2), dollars(0.1), dollars(0.001), dollars(20)]).toEqual(["$0.50", "$2", "$0.10", "$0.001", "$20"]);
  });
});

describe("the cheapest offer (review 2026-11-02)", () => {
  const plaza = (groups: Record<string, unknown>[]) => readPlaza({ data: { groups } })!;
  it("prices a unit model with size tiers at its lowest tier, as the console's table shows them, not at its base", () => {
    const [f] = cheapestFares(plaza([{ id: 1, name: "Draw", platform: "openai", rate_multiplier: 1, models: [{ name: "gpt-image-2", pricing: unit("image", 0.2, [0.02, 0.2, 0.3]) }] }]));
    expect(f.unit).toBe(0.02);
  });

  it("takes a free offer as the cheapest, and leaves it off the map rather than show a dearer one", () => {
    const groups = plaza([
      { id: 1, name: "Paid", platform: "openai", rate_multiplier: 1, models: [{ name: "gpt-image-2", pricing: unit("image", 0.04) }] },
      { id: 2, name: "Free", platform: "openai", rate_multiplier: 1, image_rate_independent: true, image_rate_multiplier: 0, models: [{ name: "gpt-image-2", pricing: unit("image", 0.04) }] },
    ]);
    const [f] = cheapestFares(groups);
    expect([f.group.id, f.unit]).toEqual([2, 0]);
    const maps = priceMaps(groups, en);
    expect(maps.pieces).toEqual([]);
    expect(maps.unpriced).toBe(1);
  });
});

describe("the fare zones, the axis and the interchanges", () => {
  it("are five zones by output price, named in both languages", () => {
    expect(zones(en).map((z) => [z.from, z.to, z.name])).toEqual([
      [null, 0.5, "Zone 1 · under $0.50"],
      [0.5, 2, "Zone 2 · $0.50–2"],
      [2, 8, "Zone 3 · $2–8"],
      [8, 20, "Zone 4 · $8–20"],
      [20, null, "Zone 5 · $20 and up"],
    ]);
    expect(zones(zh).map((z) => z.name)).toEqual(["1 区 · 低于 $0.50", "2 区 · $0.50–2", "3 区 · $2–8", "4 区 · $8–20", "5 区 · $20 起"]);
  });

  it("mark the axis in round dollars, cheaper on the left", () => {
    const axis = tokenAxis(en);
    expect(axis.ticks?.map(axis.format!)).toEqual(["$0.10", "$0.50", "$1", "$2", "$5", "$10", "$20", "$50"]);
    expect(tokenAxis(zh).cue).toEqual({ start: "← 更便宜", end: "更贵 →" });
  });

  it("tag an interchange with its fare, exact or near, and say who meets there", () => {
    expect(fareLabel({ min: 0.4, max: 0.4, exact: true })).toBe("$0.40");
    expect(fareLabel({ min: 2.2, max: 2.25, exact: false })).toBe("$2.20–2.25");
    const s = (label: string, value: string) => ({ id: label, label, value });
    const tokens = interchange(en, "tokens");
    expect(tokens.announce!([s("gpt-5.5-nano", "0.05 / 0.40"), s("gemini-3.8-flash-lite", "0.10 / 0.40"), s("grok-4-3-mini", "0.24 / 0.40")], "$0.40")).toBe(
      "Same fare: gpt-5.5-nano, gemini-3.8-flash-lite and grok-4-3-mini, $0.40 out",
    );
    expect(tokens.announce!([s("a", "1.60 / 8.00"), s("b", "1.60 / 8.00")], "$8.00")).toBe("Same fare: a and b, $1.60 / $8.00");
    expect(interchange(en, "pieces").announce!([s("gpt-image-2", "0.04 / image"), s("gemini-3.1-flash-image", "0.04 / image")], "$0.04")).toBe("Same fare: gpt-image-2 and gemini-3.1-flash-image, $0.04 / image");
    expect(interchange(zh, "tokens").announce!([s("a", "0.10 / 0.40"), s("b", "0.24 / 0.40")], "$0.40")).toBe("同价：a 和 b，输出 $0.40");
    expect(tokens.tip).toBe("same price, change here");
  });
});
