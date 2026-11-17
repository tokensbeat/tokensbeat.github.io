/**
 * The product pages' closing art (ctaArt.ts): each page's variation is drawn by the homepage's own engines through
 * their options, and every option left out leaves the homepage's art as it was.
 */
import type { CtaArtId } from "./CtaArt";
import { SKIES, TEXTS, WATERS } from "./ctaArt";
import { moonArt } from "./orbitMoonArt";
import { AsciiWater, type InkContext } from "./sharks/render";
import { startSharkWater } from "./sharks/water";
import { World } from "./sharks/world";
import { drawGlyphSky, layGlyphSky, makeStars, pulseAt, startStarField, type GlyphContext } from "./starField";
import { drawText, fontFor, inkOf, startTextArt, type TextContext } from "./textArt";

const IDS: CtaArtId[] = ["aha", "storage", "database", "supabase", "pricing", "models", "help", "status", "workspace", "agents", "build"];

/** A context that records each glyph and where it was set. */
function glyphs() {
  const set: { text: string; x: number; y: number; alpha: number }[] = [];
  const ctx: GlyphContext & TextContext & InkContext = {
    globalAlpha: 1,
    fillStyle: "",
    font: "",
    textAlign: "start",
    textBaseline: "alphabetic",
    setTransform: () => undefined,
    clearRect: () => void set.splice(0),
    fillRect: () => undefined,
    fillText(text: string, x: number, y: number) {
      set.push({ text, x, y, alpha: this.globalAlpha });
    },
  };
  return { ctx, set };
}

/** A world run for `seconds` on a panel of 600 x 420 CSS px. */
function run(world: World, seconds: number) {
  const water = new AsciiWater(glyphs().ctx);
  water.resize(600, 420);
  world.resize(600, 420, water.cellWidth, water.cellHeight);
  while (world.time < seconds) world.step(1 / 60);
  return world;
}

describe("the closing art of the product pages", () => {
  it("gives each page with a closing band one variation, from one engine", () => {
    for (const id of IDS) {
      const engines = [WATERS[id], SKIES[id], TEXTS[id]].filter(Boolean);
      expect(engines, id).toHaveLength(1);
    }
    expect(Object.keys({ ...WATERS, ...SKIES, ...TEXTS }).sort()).toEqual([...IDS].sort());
  });
});

describe("the water's options", () => {
  it("leave the homepage's water number for number when left out", () => {
    const a = run(new World(), 3);
    const b = run(new World(2026, {}), 3);
    expect(b.fish.map((f) => [f.x, f.y])).toEqual(a.fish.map((f) => [f.x, f.y]));
    expect(b.sharks.map((s) => s.nodes[0])).toEqual(a.sharks.map((s) => s.nodes[0]));
  });

  it("set how many sharks, how many fish and which kinds", () => {
    expect(run(new World(1, { sharks: 0 }), 0.1).sharks).toHaveLength(0);
    expect(run(new World(1, { sharks: 1 }), 0.1).sharks).toHaveLength(1);
    const base = run(new World(1, { sharks: 0 }), 0.1).fish.length;
    const many = run(new World(1, { sharks: 0, fish: 2 }), 0.1).fish;
    expect(many.length).toBeGreaterThan(base * 1.8);
    expect(new Set(run(new World(1, { species: [1] }), 0.1).fish.map((f) => f.species))).toEqual(new Set([1]));
  });

  it("carry the fish with a current, out at one side and back in at the other", () => {
    const up = run(new World(5, { sharks: 0, species: [3], school: 0.15, drift: { x: 0, y: -38 }, wrap: "y" }), 8);
    const rising = up.fish.filter((f) => f.vy < 0).length / up.fish.length;
    expect(rising).toBeGreaterThan(0.8);
    for (const f of up.fish) expect(f.y).toBeGreaterThanOrEqual(-12 - 1);
    const across = run(new World(9, { sharks: 0, drift: { x: 48, y: 0 }, wrap: "x" }), 8);
    expect(across.fish.filter((f) => f.vx > 0).length / across.fish.length).toBeGreaterThan(0.8);
  });

  it("keep fish in level lanes, alternately right and left", () => {
    const w = run(new World(3, { sharks: 0, species: [1], lanes: { count: 6, speed: 40 }, wrap: "x" }), 10);
    const laneH = 420 / 6;
    const kept = w.fish.filter((f) => {
      const lane = Math.min(5, Math.max(0, Math.floor(f.y / laneH)));
      return Math.abs(f.y - (lane + 0.5) * laneH) < laneH * 0.4 && Math.sign(f.vx) === (lane % 2 ? -1 : 1);
    });
    expect(kept.length / w.fish.length).toBeGreaterThan(0.75);
  });

  it("draw the fish in the glyphs asked for, far to near", () => {
    const { ctx, set } = glyphs();
    const water = new AsciiWater(ctx, { fish: ".°oO" });
    const world = new World(5, { sharks: 0 });
    water.resize(600, 420);
    world.resize(600, 420, water.cellWidth, water.cellHeight);
    world.step(1 / 60);
    water.render(world, 0);
    const drawn = new Set(set.map((g) => g.text));
    expect([...drawn].every((g) => ".°oO:".includes(g))).toBe(true);
    expect(drawn.has("-")).toBe(false);
  });
});

describe("the sky's options", () => {
  const stars = makeStars(7);

  it("join bright stars into constellations of three to six", () => {
    const sky = layGlyphSky(stars, 600, 420, { glyphs: ".+*", density: 1.5, constellations: 5 });
    expect(sky.links.length).toBeGreaterThanOrEqual(2 * 2);
    expect(sky.linked.size).toBeGreaterThanOrEqual(3);
    for (const [a, b] of sky.links) {
      expect(sky.linked.has(a) && sky.linked.has(b)).toBe(true);
      expect(stars[a].r).toBeGreaterThanOrEqual(0.8);
    }
  });

  it("set the stars on a lattice, one to a point, inside the canvas", () => {
    const sky = layGlyphSky(stars, 600, 420, { glyphs: ".+*", density: 4, lattice: 22 });
    const points = new Set<string>();
    for (let k = 0; k < sky.shown.length; k++) {
      const x = sky.at[k * 2];
      const y = sky.at[k * 2 + 1];
      expect(x).toBeGreaterThan(0);
      expect(x).toBeLessThan(600);
      expect(y).toBeLessThan(420);
      expect(Math.abs(((x - (600 % 22) / 2 - 11) / 22) % 1)).toBeLessThan(1e-6);
      points.add(`${x},${y}`);
    }
    expect(points.size).toBe(sky.shown.length);
  });

  it("gather most stars in the band when there is one", () => {
    const sky = layGlyphSky(stars, 600, 420, { glyphs: ".+*", density: 5, band: { angle: 0, width: 0.1 } });
    const ys = Array.from({ length: sky.shown.length }, (_, k) => sky.at[k * 2 + 1]);
    const near = ys.filter((y) => Math.abs(y - 210) < 0.2 * Math.hypot(600, 420)).length;
    expect(near / ys.length).toBeGreaterThan(0.75);
  });

  it("light no star with the wave at the start (the still frame), and cross the canvas within the period", () => {
    expect(pulseAt(0, 600, 0, 5)).toBe(0);
    expect(pulseAt(600, 600, 0, 5)).toBe(0);
    const peak = Array.from({ length: 50 }, (_, i) => pulseAt(300, 600, i / 10, 5));
    expect(Math.max(...peak)).toBeGreaterThan(0.95);
  });

  it("draw only the sky's own glyphs and the lines' dots, the pole star where it turns", () => {
    const { ctx, set } = glyphs();
    const options = { glyphs: ".+*", density: 1.1, turn: { x: 0.5, y: 0.5, period: 180 } };
    const sky = layGlyphSky(stars, 600, 420, options);
    drawGlyphSky(ctx, sky, 600, 420, 3, "#fff", "monospace", options);
    expect(new Set(set.map((g) => g.text))).toEqual(new Set([".", "+", "*"]));
    expect(set.at(-1)).toMatchObject({ text: "*", x: 300, y: 210, alpha: 1 });
  });

  it("hold one still sky in characters under reduced motion", () => {
    const { ctx, set } = glyphs();
    const canvas = document.createElement("canvas");
    Object.defineProperty(canvas, "clientWidth", { value: 600 });
    Object.defineProperty(canvas, "clientHeight", { value: 420 });
    vi.spyOn(canvas, "getContext").mockReturnValue(ctx as unknown as CanvasRenderingContext2D);
    const raf = vi.fn();
    vi.stubGlobal("requestAnimationFrame", raf);
    vi.stubGlobal("matchMedia", (q: string) => ({ matches: q.includes("reduced-motion"), addEventListener() {}, removeEventListener() {} }));
    const field = startStarField(canvas, () => false, SKIES.models!);
    expect(canvas.dataset.state).toBe("still");
    expect(canvas).toHaveAttribute("data-drawn");
    expect(set.length).toBeGreaterThan(20);
    expect(raf).not.toHaveBeenCalled();
    field.stop();
    vi.unstubAllGlobals();
  });
});

describe("the moons and the text art", () => {
  it("light a moon from another side on a lower floor only when asked", () => {
    expect(moonArt(40, "live", {})).toBe(moonArt(40, "live"));
    const right = moonArt(300, "live", { from: [1, -0.3, 0], floor: 0.1 }).split("\n");
    const mid = right[right.length >> 1];
    const half = mid.length >> 1;
    const dense = (s: string) => [...s].filter((c) => "@%#".includes(c)).length;
    expect(dense(mid.slice(half))).toBeGreaterThan(dense(mid.slice(0, half)) + 10);
  });

  it("goes through the phases, builds the moon through the four states and turns the moons round the planet, every frame the same size", () => {
    for (const id of ["workspace", "build", "agents"] as const) {
      const art = TEXTS[id]!();
      const sizes = new Set([0, 1.3, 2.7, 4.2, 9.9, art.still].map((t) => art.frame(t).split("\n").map((l) => l.length).join(",")));
      expect(sizes.size, id).toBe(1);
      expect(art.frame(1.3), id).not.toBe(art.frame(4.2));
    }
    const build = TEXTS.build!();
    expect(build.frame(build.still)).toBe(moonArt(300, "live"));
  });

  it("fits a frame in the canvas, centred, the ramp's dots fainter than its densest glyph", () => {
    const { ctx, set } = glyphs();
    const art = TEXTS.agents!();
    const text = art.frame(0);
    const lines = text.split("\n");
    drawText(ctx, text, 600, 420, "#fff", "monospace", 0.9);
    const size = fontFor(lines[0].length, lines.length, 600, 420, 0.9);
    expect(lines[0].length * size * 0.6).toBeLessThanOrEqual(600 * 0.9 + 1e-6);
    for (const g of set) {
      expect(g.x).toBeGreaterThan(0);
      expect(g.x).toBeLessThan(600);
      expect(g.y).toBeGreaterThan(0);
      expect(g.y).toBeLessThan(420);
    }
    expect(inkOf(".")).toBeLessThan(inkOf("@"));
    expect(inkOf("@")).toBe(1);
  });

  it("draws the still frame once and asks for no frames under reduced motion", () => {
    const { ctx, set } = glyphs();
    const canvas = document.createElement("canvas");
    Object.defineProperty(canvas, "clientWidth", { value: 600 });
    Object.defineProperty(canvas, "clientHeight", { value: 420 });
    vi.spyOn(canvas, "getContext").mockReturnValue(ctx as unknown as CanvasRenderingContext2D);
    const raf = vi.fn();
    vi.stubGlobal("requestAnimationFrame", raf);
    vi.stubGlobal("matchMedia", (q: string) => ({ matches: q.includes("reduced-motion"), addEventListener() {}, removeEventListener() {} }));
    const art = TEXTS.build!();
    const handle = startTextArt(canvas, art);
    expect(canvas.dataset.state).toBe("still");
    expect(canvas).toHaveAttribute("data-drawn");
    expect(set.map((g) => g.text).join("")).toBe(art.frame(art.still).replace(/[\s]/g, ""));
    expect(raf).not.toHaveBeenCalled();
    handle.stop();
    vi.unstubAllGlobals();
  });
});

describe("a closing band's art after stop", () => {
  /** A canvas whose font arrives only when `arrive` is called, with a recording context. */
  function late() {
    const { ctx, set } = glyphs();
    const canvas = document.createElement("canvas");
    Object.defineProperty(canvas, "clientWidth", { value: 600 });
    Object.defineProperty(canvas, "clientHeight", { value: 420 });
    vi.spyOn(canvas, "getContext").mockReturnValue(ctx as unknown as CanvasRenderingContext2D);
    let arrive = () => undefined as void;
    const font = new Promise<void>((resolve) => (arrive = resolve));
    Object.defineProperty(document, "fonts", { configurable: true, value: { load: () => font } });
    vi.stubGlobal("matchMedia", (q: string) => ({ matches: q.includes("reduced-motion"), addEventListener() {}, removeEventListener() {} }));
    return { canvas, set, arrive: async () => (arrive(), await font, await Promise.resolve()) };
  }

  afterEach(() => {
    Reflect.deleteProperty(document, "fonts");
    vi.unstubAllGlobals();
  });

  it.each([
    ["the water", (c: HTMLCanvasElement) => startSharkWater(c, WATERS.storage)],
    ["the sky", (c: HTMLCanvasElement) => startStarField(c, () => false, SKIES.models)],
    ["the moons", (c: HTMLCanvasElement) => startTextArt(c, TEXTS.build!())],
  ])("draws nothing more once stopped, though its font arrives later (%s)", async (_, start) => {
    const { canvas, set, arrive } = late();
    const handle = start(canvas);
    handle.stop();
    const before = set.length;
    canvas.removeAttribute("data-drawn");
    await arrive();
    expect(set.length).toBe(before);
    expect(canvas).not.toHaveAttribute("data-drawn");
  });
});
