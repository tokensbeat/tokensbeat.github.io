/**
 * The ASCII chart (./milkyWay.ts): the density ramp, the four constellations against the deck's notes (every note of
 * the chart is a star of its stop's figure, once), the river's field, a whole draw at every stop, and where the reader
 * is.
 */
import { HOME } from "@/content/home";
import { buildRiver, createChart, FIGURES, glyphOf, nextDue, RAMP, scrollStop, STOP_COUNT, TICK_MS } from "./milkyWay";

/** A 2D context that records what is drawn (jsdom has no canvas): each text set and where. */
function recorder() {
  const texts: { text: string; x: number; y: number }[] = [];
  const ctx = {
    font: "",
    fillStyle: "",
    textAlign: "left",
    textBaseline: "alphabetic",
    globalAlpha: 1,
    setTransform() {},
    clearRect() {},
    fillText(text: string, x: number, y: number) {
      texts.push({ text, x, y });
    },
    measureText: (text: string) => ({ width: 7.2 * text.length }),
  };
  return { ctx, texts };
}

/** A box for getBoundingClientRect. */
const rect = (left: number, top: number, right: number, bottom: number) =>
  ({ left, top, right, bottom, width: right - left, height: bottom - top, x: left, y: top, toJSON() {} }) as DOMRect;

/** A stage as a laptop's slab: the chart's notes, its bar (40 px) and its ruler (44 px). */
const W = 1440;
const H = 848;
const BAR = 40;
const RULER = H - 44;
function stage(w = W, h = H, bar = BAR, ruler = h - 44) {
  const el = document.createElement("div");
  for (const n of HOME.chart.notes) {
    const note = document.createElement("div");
    note.dataset.note = n.id;
    el.append(note);
  }
  const barH = bar;
  const barEl = document.createElement("div");
  barEl.className = "j__bar";
  barEl.getBoundingClientRect = () => rect(0, 0, w, barH);
  const rulerEl = document.createElement("nav");
  rulerEl.className = "j__ruler";
  rulerEl.getBoundingClientRect = () => rect(0, ruler, w, h);
  el.append(barEl, rulerEl);
  el.getBoundingClientRect = () => rect(0, 0, w, h);
  document.body.append(el);
  return el;
}

describe("the ASCII chart", () => {
  it("sets a density as a glyph of the ramp, emptier to denser, and nothing for no light", () => {
    expect(glyphOf(0)).toBe(" ");
    expect(glyphOf(-1)).toBe(" ");
    expect(glyphOf(Number.NaN)).toBe(" ");
    expect(glyphOf(1)).toBe("@");
    expect(glyphOf(5)).toBe("@");
    const steps = [0.05, 0.15, 0.3, 0.5, 0.7, 0.9].map((v) => RAMP.indexOf(glyphOf(v)));
    expect(steps).toEqual([...steps].sort((a, b) => a - b));
    expect(new Set(steps).size).toBeGreaterThan(4);
  });

  it("has a constellation for each product, every note of the chart a star of its own stop's figure, once", () => {
    expect(FIGURES).toHaveLength(STOP_COUNT - 1);
    const prefix = ["aha", "bots", "api", "bal"];
    const onStars = FIGURES.flatMap((f, k) => f.stars.filter((s) => s.note).map((s) => [k, s.note!] as const));
    // "A model" rides on whichever model star's route is lit, so it has no fixed star.
    const notes = HOME.chart.notes.map((n) => n.id).filter((id) => id !== "api.model");
    expect(onStars.map(([, id]) => id).sort()).toEqual([...notes].sort());
    for (const [k, id] of onStars) expect(id.split(".")[0], id).toBe(prefix[k]);
    for (const f of FIGURES) {
      // Each line joins two stars of its figure, and every star is on a line: a constellation, not a scatter.
      for (const [i, j] of f.lines) {
        expect(f.stars[i]).toBeDefined();
        expect(f.stars[j]).toBeDefined();
        expect(i).not.toBe(j);
      }
      const joined = new Set(f.lines.flat());
      expect(joined.size).toBe(f.stars.length);
    }
  });

  it("builds the same river from its seed, its brightest about 1, with bright stars to twinkle", () => {
    const a = buildRiver();
    const b = buildRiver();
    expect(a.field.all.length).toBe(a.field.w * a.field.h);
    expect(a.field.all[150 * a.field.w + 200]).toBe(b.field.all[150 * b.field.w + 200]);
    let max = 0;
    let lit = 0;
    for (const v of a.field.all) {
      if (v > max) max = v;
      if (v > 0.04) lit++;
    }
    expect(max).toBeGreaterThan(1);
    expect(max).toBeLessThan(4);
    // The river covers part of the world, not all of it.
    expect(lit / a.field.all.length).toBeGreaterThan(0.05);
    expect(lit / a.field.all.length).toBeLessThan(0.6);
    expect(a.bright.length).toBeGreaterThan(300);
  });

  it("draws every stop and the way between them in characters, each product's constellation with its stars and dotted lines", () => {
    const { ctx, texts } = recorder();
    const canvas = document.createElement("canvas");
    canvas.getContext = (() => ctx) as unknown as HTMLCanvasElement["getContext"];
    const el = stage();
    try {
      const chart = createChart({ stage: el, canvas, plates: () => [], stopName: (k) => HOME.chart.stops[k].en });
      expect(chart).not.toBeNull();
      for (const p of [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4]) {
        texts.length = 0;
        // A time when every runner is midway along its line.
        chart!.draw(p, 0.7);
        const glyphs = texts.filter((t) => t.text.length === 1);
        // The river: rows of characters with real glyphs in them, not only spaces.
        expect(texts.some((t) => t.text.length > 40 && /[^ ]/.test(t.text)), `river at ${p}`).toBe(true);
        // Nothing is set on the bar's or the ruler's rows.
        for (const t of texts) if (t.text.trim()) expect(t.y > BAR && t.y < RULER, `"${t.text.slice(0, 12)}" at y ${t.y} (${p})`).toBe(true);
        if (Number.isInteger(p) && p > 0) {
          expect(glyphs.some((g) => g.text === "*"), `stars at ${p}`).toBe(true);
          expect(glyphs.some((g) => g.text === "o"), `a runner at ${p}`).toBe(true);
          // The figure's own dotted lines: the route never comes this close to a product, so these dots are its lines.
          const centre = glyphs.find((g) => g.text === "@") ?? glyphs.find((g) => g.text === "*")!;
          const near = glyphs.filter((g) => g.text === "." && Math.hypot(g.x - centre.x, g.y - centre.y) < 150);
          expect(near.length, `dotted lines at ${p}`).toBeGreaterThan(5);
        }
      }
      // At rest (reduced motion: t = 0) no runner sits on a star.
      texts.length = 0;
      chart!.draw(1, 0);
      expect(texts.some((t) => t.text === "o")).toBe(false);
      // Seen from afar, each stop's name is written under its constellation, inside the page's gutters.
      texts.length = 0;
      chart!.draw(0, 0);
      for (const name of ["Aha", "Bots", "Model API", "Pricing"]) {
        const label = texts.find((t) => t.text === name);
        expect(label, name).toBeDefined();
        expect(label!.x + name.length * 7.2, name).toBeLessThanOrEqual(W - 16);
      }
    } finally {
      el.remove();
    }
  });

  it("leaves the ruler's rows empty on a phone too, where the grid's rows do not end at the ruler's top", () => {
    // 390 x 811 with a 40 px ruler: the grid is anchored at the top, so the ruler starts inside a row (771 / 15).
    const { ctx, texts } = recorder();
    const canvas = document.createElement("canvas");
    canvas.getContext = (() => ctx) as unknown as HTMLCanvasElement["getContext"];
    const el = stage(390, 811, 32, 771);
    try {
      const chart = createChart({ stage: el, canvas, plates: () => [], stopName: (k) => HOME.chart.stops[k].en });
      for (const p of [0, 1, 2, 3, 4]) {
        texts.length = 0;
        chart!.draw(p, 0.7);
        for (const t of texts) if (t.text.trim()) expect(t.y > 32 && t.y < 771, `"${t.text.slice(0, 12)}" at y ${t.y} (${p})`).toBe(true);
      }
    } finally {
      el.remove();
    }
  });

  it("draws 30 frames a second when only time moves, and resumes them at once after a long scroll", () => {
    // A 60 Hz screen: the loop asks at every frame; a draw happens when the camera moved, or when the time-only frame is due.
    const frame = 1000 / 60;
    let due = 0;
    let drawnAt = -Infinity;
    const draws: number[] = [];
    const run = (from: number, to: number, cameraMoving: boolean) => {
      for (let now = from; now < to; now += frame) {
        const timeOnly = !cameraMoving;
        if (timeOnly && now < due) continue;
        draws.push(now);
        drawnAt = now;
        due = nextDue(due, now, timeOnly);
      }
    };
    // Two seconds of scrolling: a draw at every frame.
    run(0, 2000, true);
    expect(draws.length).toBeGreaterThanOrEqual(119);
    // Then still: the next time-only frame comes within a tick of the camera settling, and 30 a second after that.
    draws.length = 0;
    run(2000, 3000, false);
    expect(draws[0] - 2000).toBeLessThanOrEqual(TICK_MS + frame);
    expect(draws.length).toBeGreaterThanOrEqual(29);
    expect(draws.length).toBeLessThanOrEqual(31);
    expect(drawnAt).toBeGreaterThan(2950);
  });

  it("reads where the reader is from the steps' tops, a step at a time", () => {
    expect(scrollStop([52, 900, 1748, 2596, 3444], 52)).toBe(0);
    expect(scrollStop([52, 900, 1748, 2596, 3444], 30)).toBe(0);
    expect(scrollStop([-796, 52, 900, 1748, 2596], 52)).toBe(1);
    expect(scrollStop([-372, 476, 1324, 2172, 3020], 52)).toBeCloseTo(0.5, 5);
    expect(scrollStop([-5000, -4000, -3000, -2000, -1000], 52)).toBe(4);
  });
});
