/**
 * The ASCII chart (./milkyWay.ts): the density ramp, the four constellations against the deck's notes (every note of
 * the chart is a star of its stop's figure, once), the river's field, a whole draw at every stop, and where the reader
 * is.
 */
import { HOME } from "@/content/home";
import { buildRiver, createChart, FIGURES, glyphOf, RAMP, scrollStop, STOP_COUNT } from "./milkyWay";

/** A 2D context that records what is drawn (jsdom has no canvas): the text set, by glyph. */
function recorder() {
  const texts: string[] = [];
  const ctx = {
    font: "",
    fillStyle: "",
    textAlign: "left",
    textBaseline: "alphabetic",
    globalAlpha: 1,
    setTransform() {},
    clearRect() {},
    fillText(text: string) {
      texts.push(text);
    },
    measureText: () => ({ width: 7.2 }),
  };
  return { ctx, texts };
}

/** A stage with the chart's notes and a plate, sized as a laptop's slab. */
function stage(w = 1440, h = 848) {
  const el = document.createElement("div");
  for (const n of HOME.chart.notes) {
    const note = document.createElement("div");
    note.dataset.note = n.id;
    el.append(note);
  }
  el.getBoundingClientRect = () => ({ left: 0, top: 0, right: w, bottom: h, width: w, height: h, x: 0, y: 0, toJSON() {} });
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
        chart!.draw(p, p * 3.1);
        const glyphs = new Set(texts.filter((t) => t.length === 1));
        // The river's rows, then the marks over it: at a product, its stars, the dots of its lines and a runner.
        expect(texts.some((t) => t.length > 40), `rows at ${p}`).toBe(true);
        if (Number.isInteger(p) && p > 0) {
          expect(glyphs.has("*"), `stars at ${p}`).toBe(true);
          expect(glyphs.has("."), `dotted lines at ${p}`).toBe(true);
          expect(glyphs.has("o"), `a runner at ${p}`).toBe(true);
        }
      }
      // Seen from afar, each stop's name is written under its constellation.
      texts.length = 0;
      chart!.draw(0, 0);
      for (const name of ["Aha", "Bots", "Model API", "Pricing"]) expect(texts, name).toContain(name);
    } finally {
      el.remove();
    }
  });

  it("reads where the reader is from the steps' tops, a step at a time", () => {
    expect(scrollStop([52, 900, 1748, 2596, 3444], 52)).toBe(0);
    expect(scrollStop([52, 900, 1748, 2596, 3444], 30)).toBe(0);
    expect(scrollStop([-796, 52, 900, 1748, 2596], 52)).toBe(1);
    expect(scrollStop([-372, 476, 1324, 2172, 3020], 52)).toBeCloseTo(0.5, 5);
    expect(scrollStop([-5000, -4000, -3000, -2000, -1000], 52)).toBe(4);
  });
});
