/**
 * The price maps (src/page/PriceMap.tsx, on the homepage and /pricing/): the gateway's public price list
 * (GET /api/v1/model-plaza/prices) as metro lines, one a model family (./family.ts, with its logo), each model a
 * station once, at the lowest price a group sells it for: the model's price times the group's rate, at standard hours,
 * the base tier. The price list has only the groups anyone can buy from (no exclusive, private or subscription group:
 * the gateway leaves them out) and only what this file reads.
 *
 * Two maps (owner 2026-11-02): models priced by the token sit at their output price per 1M tokens on a log
 * axis in five fare zones (a model whose output is free, an embedding, at its input price on a square stop); models
 * priced by the image, the request or the second of video have their own small map, by the piece. A model the plaza
 * lists free or without a price is on neither. Values as the map writes them, USD without the sign: "1.60 / 8.00" (input /
 * output per 1M tokens), "0.04 / image", "1.36 / req", "0.09 / s".
 *
 * No status (owner 2026-11-03: "show the map in the home page, but no status"): a stop's card is its prices and where
 * they come from, never the model's health, whatever a body sends; status stays in the plaza, for people signed in.
 *
 * The same price rules as the console's price map and billing rate: keep the two the same. The homepage has no API types, and the body comes over the network, so readPlaza takes only what
 * it can read and leaves out anything else.
 */
import { createElement } from "react";
import type { MetroAxis, MetroFare, MetroInterchange, MetroLine, MetroStation, MetroZone } from "@/components/s1lin/metro-map";
import type { T } from "@/i18n";
import { FAMILIES, familyHue, familyOf, type FamilyId } from "./family";
import { FamilyMark, hasFamilyMark } from "./familyMarks";

export type BillingMode = "token" | "per_request" | "image" | "video";

export interface PlazaPricing {
  billing_mode?: string;
  input_price?: number | null;
  output_price?: number | null;
  per_request_price?: number | null;
  intervals?: { per_request_price?: number | null }[];
}
export interface PlazaModel {
  name: string;
  pricing?: PlazaPricing | null;
}
export interface PlazaGroup {
  id: number;
  name?: string;
  rate_multiplier?: number;
  image_rate_independent?: boolean;
  image_rate_multiplier?: number;
  video_rate_independent?: boolean;
  video_rate_multiplier?: number;
  models: PlazaModel[];
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);

/** The price list's groups from a response body (the API's { code, data } envelope or the data alone); null when it is not one. */
export function readPlaza(body: unknown): PlazaGroup[] | null {
  const data = isRecord(body) && "data" in body ? body.data : body;
  if (!isRecord(data) || !Array.isArray(data.groups)) return null;
  return data.groups.flatMap((g): PlazaGroup[] => {
    if (!isRecord(g) || typeof g.id !== "number" || !Array.isArray(g.models)) return [];
    const models = g.models.flatMap((m): PlazaModel[] => {
      if (!isRecord(m) || typeof m.name !== "string" || !m.name) return [];
      const p = isRecord(m.pricing) ? m.pricing : null;
      return [
        {
          name: m.name,
          pricing: p && {
            billing_mode: typeof p.billing_mode === "string" ? p.billing_mode : undefined,
            input_price: num(p.input_price),
            output_price: num(p.output_price),
            per_request_price: num(p.per_request_price),
            intervals: Array.isArray(p.intervals) ? p.intervals.filter(isRecord).map((iv) => ({ per_request_price: num(iv.per_request_price) })) : [],
          },
        },
      ];
    });
    return [
      {
        id: g.id,
        name: typeof g.name === "string" ? g.name : "",
        rate_multiplier: num(g.rate_multiplier) ?? 1,
        image_rate_independent: g.image_rate_independent === true,
        image_rate_multiplier: num(g.image_rate_multiplier) ?? 1,
        video_rate_independent: g.video_rate_independent === true,
        video_rate_multiplier: num(g.video_rate_multiplier) ?? 1,
        models,
      },
    ];
  });
}

/** What one model costs in one group. */
export interface Fare {
  model: string;
  family: FamilyId;
  group: PlazaGroup;
  mode: BillingMode;
  /** USD per 1M tokens; null when the plaza gives none. */
  input: number | null;
  output: number | null;
  /** USD per image, request or second of video. */
  unit: number | null;
}

const modeOf = (m: PlazaModel): BillingMode => {
  const mode = m.pricing?.billing_mode;
  return mode === "per_request" || mode === "image" || mode === "video" ? mode : "token";
};

/** The rate a billing mode is charged at in this group: images and video follow their own where the group sets one. */
function rateOf(mode: BillingMode, g: PlazaGroup): number {
  if (mode === "video" && g.video_rate_independent) return Math.max(0, g.video_rate_multiplier ?? 1);
  if (mode === "image" && g.image_rate_independent) return g.image_rate_multiplier ?? 1;
  return g.rate_multiplier ?? 1;
}

/** The price times the rate and scale, kept to 10 significant digits so float noise never sorts or shows. */
const scaled = (v: number | null | undefined, rate: number, scale = 1) => (v == null || !Number.isFinite(v) ? null : Number((v * rate * scale).toPrecision(10)));

export function fareOf(group: PlazaGroup, model: PlazaModel): Fare {
  const mode = modeOf(model);
  const rate = rateOf(mode, group);
  const p = model.pricing;
  const base = { model: model.name, family: familyOf(model.name), group, mode };
  if (mode === "token") return { ...base, input: scaled(p?.input_price, rate, 1_000_000), output: scaled(p?.output_price, rate, 1_000_000), unit: null };
  // With size tiers, the tiers are the prices (the console's table shows them, not the base): the lowest of them.
  const tiers = (p?.intervals ?? []).map((iv) => iv.per_request_price).filter((v): v is number => v != null);
  const unit = tiers.length ? Math.min(...tiers) : (p?.per_request_price ?? null);
  return { ...base, input: null, output: null, unit: scaled(unit, rate) };
}

/** What a fare costs: a token model's output (or its input when the output is free), a unit model's price; 0 is free; else none. */
function priceOf(f: Fare): number | null {
  if (f.mode !== "token") return f.unit;
  return f.output != null && f.output > 0 ? f.output : (f.input ?? f.output);
}
/** Where a fare sits on its map: its price above 0 (a free one cannot sit on a log axis), else nowhere. */
function placeOf(f: Fare): number | null {
  const v = priceOf(f);
  return v != null && v > 0 ? v : null;
}
/** Token prices first, then unit prices, then none; a free offer is a price, the lowest. */
const tier = (f: Fare) => (priceOf(f) == null ? 2 : f.mode === "token" ? 0 : 1);
const cost = (f: Fare) => priceOf(f) ?? Infinity;

/** Each model once, at its lowest price among the groups (the price list's: the ones anyone can buy from). */
export function cheapestFares(groups: PlazaGroup[]): Fare[] {
  const best = new Map<string, Fare>();
  for (const group of groups) {
    for (const model of group.models) {
      const fare = fareOf(group, model);
      const was = best.get(model.name);
      if (!was || tier(fare) < tier(was) || (tier(fare) === tier(was) && cost(fare) < cost(was))) best.set(model.name, fare);
    }
  }
  return [...best.values()];
}

/** USD without the sign, two decimals or as many as the price has: "0.40", "0.125". */
export function usd(v: number): string {
  const s = v.toPrecision(10).replace(/\.?0+$/, "");
  if (s.includes("e")) return s;
  const decimals = s.includes(".") ? s.length - s.indexOf(".") - 1 : 0;
  return decimals >= 2 ? s : (s.includes(".") ? s : `${s}.`) + "0".repeat(2 - decimals);
}

/** A round figure in dollars: "$0.50", "$2", "$0.001" (ticks and zone names). */
export const dollars = (v: number) => `$${usd(v)}`.replace(/\.00$/, "");

const UNIT: Record<Exclude<BillingMode, "token">, [suffix: string, note: string]> = {
  image: ["unit::image", "USD per image"],
  per_request: ["unit::req", "USD per request"],
  video: ["unit::s", "USD per second of video"],
};

/** A model's stop: its prices and where they come from; never a status. */
function station(f: Fare, t: T, href: ((model: string, groupId: number) => string) | undefined): MetroStation {
  const x = placeOf(f);
  const from = t("from {group}", { group: f.group.name ?? "" });
  // The detail of the model in the group this price comes from (the console's Models redesign §13.5), never the first.
  const base = { id: f.model, label: f.model, href: href?.(f.model, f.group.id), x };
  if (f.mode === "token") {
    const side = (v: number | null) => (v == null ? "—" : usd(v));
    const input = x != null && !(f.output != null && f.output > 0);
    return {
      ...base,
      kind: input ? "input" : "stop",
      value: `${side(f.input)} / ${side(f.output)}`,
      note: `${t(input ? "Priced on input; output is free" : "Input / output, USD per 1M tokens")} · ${from}`,
      figures: { input: f.input, output: f.output },
    };
  }
  const [suffix, note] = UNIT[f.mode];
  return { ...base, unit: f.mode, value: f.unit == null ? undefined : `${usd(f.unit)} / ${t(suffix)}`, note: `${t(note)} · ${from}`, figures: { unit: f.unit } };
}

const along = (a: Fare, b: Fare) => cost(a) - cost(b) || a.model.localeCompare(b.model);

/** Fares by family, as lines in the families' fixed order, each line marked by its family's logo. */
function linesOf(fares: Fare[], t: T, href: ((model: string, groupId: number) => string) | undefined): MetroLine[] {
  const byFamily = new Map<FamilyId, Fare[]>();
  for (const f of fares) byFamily.set(f.family, [...(byFamily.get(f.family) ?? []), f]);
  return FAMILIES.filter((fam) => byFamily.has(fam.id)).map((fam) => ({
    id: fam.id,
    // Family names are brands and stay as they are; only "Other" is a word.
    name: fam.id === "other" ? t(fam.name) : fam.name,
    mark: hasFamilyMark(fam.id) ? createElement(FamilyMark, { id: fam.id }) : undefined,
    colour: familyHue(fam.id),
    stations: byFamily.get(fam.id)!.sort(along).map((f) => station(f, t, href)),
  }));
}

export interface PriceMaps {
  /** Models priced by the token, at their output price per 1M tokens. */
  tokens: MetroLine[];
  /** Models priced by the image, the request or the second. */
  pieces: MetroLine[];
  /** Models the plaza lists free or without a price: on neither map. */
  unpriced: number;
}

/** The plaza as the two maps' lines (each station a link to `href(model)`, when given); none without data. */
export function priceMaps(groups: PlazaGroup[] | null | undefined, t: T, href?: (model: string, groupId: number) => string): PriceMaps {
  if (!groups) return { tokens: [], pieces: [], unpriced: 0 };
  const fares = cheapestFares(groups);
  const priced = fares.filter((f) => placeOf(f) != null);
  return {
    tokens: linesOf(priced.filter((f) => f.mode === "token"), t, href),
    pieces: linesOf(priced.filter((f) => f.mode !== "token"), t, href),
    unpriced: fares.length - priced.length,
  };
}

/** The fare zones, by output price (owner 2026-11-02: five, edges at $0.50, $2, $8 and $20). */
export const ZONE_EDGES: readonly [from: number | null, to: number | null][] = [
  [null, 0.5],
  [0.5, 2],
  [2, 8],
  [8, 20],
  [20, null],
];

/** "Zone 1 · under $0.50", "Zone 2 · $0.50–2", "Zone 5 · $20 and up". */
export function zones(t: T): MetroZone[] {
  return ZONE_EDGES.map(([from, to], i) => {
    const range = from == null ? t("under {price}", { price: dollars(to!) }) : to == null ? t("{price} and up", { price: dollars(from) }) : `${dollars(from)}–${dollars(to).slice(1)}`;
    return { id: `zone-${i + 1}`, from, to, name: `${t("Zone {n}", { n: i + 1 })} · ${range}` };
  });
}

/** The token map's axis: output price per 1M tokens, log scale, cheaper on the left. */
export function tokenAxis(t: T): MetroAxis {
  return { ticks: [0.1, 0.5, 1, 2, 5, 10, 20, 50], format: dollars, cue: { start: t("← Cheaper"), end: t("Pricier →") } };
}

/** The piece map's axis: USD per image, request or second. */
export function pieceAxis(t: T): MetroAxis {
  return { ticks: [0.001, 0.01, 0.1, 1], format: dollars, cue: { start: t("← Cheaper"), end: t("Pricier →") } };
}

/** An interchange's tag: "$0.40" when the fares are one, "$2.20–2.25" when they are near. */
export const fareLabel = (f: MetroFare) => (f.exact ? `$${usd(f.min)}` : `$${usd(f.min)}–${usd(f.max)}`);

/** "a, b and c" in the page's language. */
function listed(names: string[], t: T) {
  return names.length < 2 ? (names[0] ?? "") : t("{list} and {last}", { list: names.slice(0, -1).join(", "), last: names[names.length - 1] });
}

/**
 * The interchanges of a map: their tag and what a screen reader hears, "Same fare: a, b and c, $0.40 out" (or
 * "$1.60 / $8.00" when the inputs match too; "$0.04 / image" on the piece map).
 */
export function interchange(t: T, kind: "tokens" | "pieces"): MetroInterchange {
  return {
    label: fareLabel,
    tip: t("same price, change here"),
    announce: (stations, fare) => {
      const values = new Set(stations.map((s) => s.value));
      const one = values.size === 1 ? [...values][0] : undefined;
      const said = one
        ? kind === "tokens"
          ? one.replace(/^(\S+) \/ (\S+)$/, "$$$1 / $$$2")
          : `$${one}`
        : kind === "tokens"
          ? t("{fare} out", { fare })
          : fare;
      return t("Same fare: {names}, {fare}", { names: listed(stations.map((s) => s.label), t), fare: said });
    },
  };
}
