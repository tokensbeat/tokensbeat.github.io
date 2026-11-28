import { AsciiWater, type InkContext } from "./render";
import { startSharkWater } from "./water";
import { World } from "./world";

/** A context that records the glyphs drawn and the ink they were drawn in. */
function recorder() {
  const drawn = { glyphs: [] as string[], blocks: 0, clears: 0, inks: new Set<string>() };
  const ctx: InkContext & { setTransform(): void } = {
    font: "",
    textAlign: "start",
    textBaseline: "alphabetic",
    fillStyle: "",
    globalAlpha: 1,
    setTransform: () => undefined,
    clearRect: () => void drawn.clears++,
    fillRect: () => void drawn.blocks++,
    fillText(text: string) {
      drawn.glyphs.push(text);
      drawn.inks.add(String(this.fillStyle));
    },
  };
  return { ctx, drawn };
}

/** A canvas 600 x 420 CSS px with a recording context, under a controllable frame clock, visibility and viewport. */
function rig({ reduced = false, intersecting = true }: { reduced?: boolean; intersecting?: boolean } = {}) {
  const { ctx, drawn } = recorder();
  const canvas = document.createElement("canvas");
  canvas.style.color = "rgb(246, 246, 244)";
  Object.defineProperty(canvas, "clientWidth", { value: 600 });
  Object.defineProperty(canvas, "clientHeight", { value: 420 });
  vi.spyOn(canvas, "getContext").mockReturnValue(ctx as unknown as CanvasRenderingContext2D);
  document.body.append(canvas);

  const frames = new Map<number, FrameRequestCallback>();
  let next = 0;
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    frames.set(++next, cb);
    return next;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => frames.delete(id));
  let now = 0;
  /** Runs the pending frames `n` times, `ms` apart. */
  const step = (n = 1, ms = 50) => {
    for (let k = 0; k < n; k++) {
      now += ms;
      const due = [...frames.values()];
      frames.clear();
      for (const cb of due) cb(now);
    }
  };

  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: reduced && query.includes("reduced-motion"),
    media: query,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }));
  let see: ((entries: { isIntersecting: boolean }[]) => void) | undefined;
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(cb: (entries: { isIntersecting: boolean }[]) => void) {
        see = cb;
      }
      observe() {
        see?.([{ isIntersecting: intersecting }]);
      }
      disconnect() {}
    },
  );
  let hidden = false;
  Object.defineProperty(document, "hidden", { configurable: true, get: () => hidden });
  const setHidden = (h: boolean) => {
    hidden = h;
    document.dispatchEvent(new Event("visibilitychange"));
  };
  return { canvas, drawn, frames, step, setHidden, scroll: (v: boolean) => see?.([{ isIntersecting: v }]) };
}

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.replaceChildren();
  Reflect.deleteProperty(document, "hidden");
  delete document.documentElement.dataset.theme;
});

describe("the closing band's sharks", () => {
  it("show a reader who asks for reduced motion one settled still frame, and never start a loop", () => {
    const { canvas, drawn, frames, step } = rig({ reduced: true });
    startSharkWater(canvas);
    expect(canvas.dataset.state).toBe("still");
    expect(frames.size).toBe(0);
    expect(canvas).toHaveAttribute("data-drawn");
    expect(drawn.glyphs.length).toBeGreaterThan(100);
    const glyphs = drawn.glyphs.length;
    step(10);
    expect(frames.size).toBe(0);
    expect(drawn.glyphs.length).toBe(glyphs);
  });

  it("swim only while on screen and while the tab is shown, and pick up where they left off", () => {
    const { canvas, drawn, frames, step, setHidden, scroll } = rig();
    startSharkWater(canvas);
    expect(canvas.dataset.state).toBe("moving");
    step(6);
    const moving = drawn.clears;
    expect(moving).toBeGreaterThan(3);

    setHidden(true);
    expect(canvas.dataset.state).toBe("hidden");
    expect(frames.size).toBe(0);
    step(6);
    expect(drawn.clears).toBe(moving);

    setHidden(false);
    expect(canvas.dataset.state).toBe("moving");
    step(6);
    expect(drawn.clears).toBeGreaterThan(moving);

    scroll(false);
    expect(canvas.dataset.state).toBe("off");
    expect(frames.size).toBe(0);
    scroll(true);
    expect(canvas.dataset.state).toBe("moving");
    expect(frames.size).toBe(1);
  });

  it("draw at most 30 frames a second, even on a 120 Hz screen, and every second frame at 60 Hz", () => {
    const { canvas, drawn, step } = rig();
    startSharkWater(canvas);
    const before = drawn.clears;
    step(120, 1000 / 120);
    expect(drawn.clears - before).toBeLessThanOrEqual(31);
    expect(drawn.clears - before).toBeGreaterThanOrEqual(28);
    const at60 = drawn.clears;
    step(60, 1000 / 60);
    expect(drawn.clears - at60).toBeGreaterThanOrEqual(28);
  });

  it("stop for good when the band goes away", () => {
    const { canvas, drawn, frames, step } = rig();
    const water = startSharkWater(canvas);
    water.stop();
    expect(frames.size).toBe(0);
    const glyphs = drawn.glyphs.length;
    step(5);
    expect(drawn.glyphs.length).toBe(glyphs);
  });

  it("are inked in the canvas's colour (the band's words) and take the new one when the theme changes", async () => {
    const { canvas, drawn } = rig({ reduced: true });
    startSharkWater(canvas);
    expect([...drawn.inks]).toEqual(["rgb(246, 246, 244)"]);
    canvas.style.color = "rgb(15, 15, 15)";
    document.documentElement.dataset.theme = "dark";
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(drawn.inks).toContain("rgb(15, 15, 15)");
  });
});

describe("the water", () => {
  it("is the same on every visit: one seed, one sea", () => {
    const a = new World();
    const b = new World();
    for (const w of [a, b]) {
      w.resize(600, 420, 8, 12);
      for (let i = 0; i < 240; i++) w.step(1 / 60);
    }
    expect(a.sharks.map((s) => [...s.nodes])).toEqual(b.sharks.map((s) => [...s.nodes]));
    expect(a.fish.map((f) => [f.x, f.y])).toEqual(b.fish.map((f) => [f.x, f.y]));
  });

  it("keeps its sharks coming back into view and its schools stocked over a long swim", () => {
    const w = new World(7);
    w.resize(600, 420, 8, 12);
    expect(w.sharks).toHaveLength(3);
    // How far a snout ever gets outside the water, in shark lengths.
    let farthest = 0;
    let seen = 0;
    for (let t = 0; t < 120 * 60; t++) {
      w.step(1 / 60);
      for (const s of w.sharks) {
        const [x, y] = [s.nodes[0], s.nodes[1]];
        farthest = Math.max(farthest, -x / s.length, (x - 600) / s.length, -y / s.length, (y - 420) / s.length);
        if (x > 0 && x < 600 && y > 0 && y < 420) seen++;
      }
    }
    expect(farthest).toBeLessThan(1);
    expect(seen / (120 * 60 * 3)).toBeGreaterThan(0.8);
    expect(w.fish.filter((f) => f.alive).length).toBeGreaterThan(w.fish.length * 0.6);
    const small = new World();
    small.resize(358, 225, 7, 10);
    expect(small.sharks).toHaveLength(2);
  });

  it("in Aha's variation has longer sharks, and fish and sharks swim round a calm middle (WaterOptions.sharkSize, calm)", () => {
    const home = new World(5);
    home.resize(600, 420, 8, 12);
    const w = new World(5, { sharkSize: 1.6, calm: { rx: 150, ry: 80 } });
    w.resize(600, 420, 8, 12);
    expect(w.sharks.map((s) => s.length)).toEqual(home.sharks.map((s) => s.length * 1.6));
    const depth = (x: number, y: number) => Math.hypot((x - 300) / 150, (y - 210) / 80);
    let fish = 0;
    let fishIn = 0;
    let snouts = 0;
    let snoutsIn = 0;
    for (let t = 0; t < 40 * 60; t++) {
      w.step(1 / 60);
      if (t < 4 * 60 || t % 15) continue;
      for (const f of w.fish) {
        if (!f.alive) continue;
        fish++;
        if (depth(f.x, f.y) < 0.7) fishIn++;
      }
      for (const s of w.sharks) {
        snouts++;
        if (depth(s.nodes[0], s.nodes[1]) < 0.7) snoutsIn++;
      }
    }
    expect(fishIn / fish).toBeLessThan(0.01);
    expect(snoutsIn / snouts).toBeLessThan(0.05);
  });

  it("draws the default water glyph for glyph as before: one fingerprint of 20 s of frames (a faster raster must not move a cell)", () => {
    // FNV-1a over every clear, block and glyph (with its place and strength), as main drew them before the raster
    // passed over the cells no sample can hit (2026-11-16). A change that means to change the water writes a new one.
    let h = 2166136261;
    const mix = (s: string) => {
      for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
    };
    const ctx: InkContext = {
      font: "",
      textAlign: "start",
      textBaseline: "alphabetic",
      fillStyle: "",
      globalAlpha: 1,
      clearRect: () => mix("C"),
      fillRect: (x: number, y: number) => mix(`R${x},${y},${ctx.globalAlpha}`),
      fillText: (t: string, x: number, y: number) => mix(`${t}${x},${y},${ctx.globalAlpha}`),
    };
    const water = new AsciiWater(ctx);
    water.resize(600, 420);
    const w = new World();
    w.resize(600, 420, water.cellWidth, water.cellHeight);
    for (let i = 0; i < 1200; i++) {
      w.step(1 / 60);
      if (i % 2 === 0) water.render(w, 1 / 30);
    }
    expect((h >>> 0).toString(16)).toBe("75750db0");
  }, 60_000); // 20 s of frames: seconds on a laptop, more on a 2-core CI runner (5 s default timed out there)

  it("draws the sharks' blocks as strongly as blockAlpha says: none at 0 (Aha's first frame), the default at 1", () => {
    const w = new World();
    w.resize(600, 420, 8, 12);
    const { ctx, drawn } = recorder();
    const water = new AsciiWater(ctx);
    water.resize(600, 420);
    water.blockAlpha = 0;
    water.render(w, 1 / 60);
    expect(drawn.blocks).toBe(0);
    expect(drawn.glyphs.length).toBeGreaterThan(100);
    water.blockAlpha = 1;
    water.render(w, 1 / 60);
    expect(drawn.blocks).toBeGreaterThan(50);
  });

  it("draws a shark as ASCII: a faint block under each body cell, dense glyphs on its back, an eye, light marks on its edges", () => {
    const w = new World();
    w.resize(600, 420, 8, 12);
    const { ctx, drawn } = recorder();
    const water = new AsciiWater(ctx);
    water.resize(600, 420);
    water.setInk("rgb(1, 2, 3)");
    water.render(w, 1 / 60);
    expect(drawn.blocks).toBeGreaterThan(50);
    expect(drawn.glyphs).toContain("o");
    expect(drawn.glyphs.some((g) => "@8%#X".includes(g))).toBe(true);
    expect(drawn.glyphs.some((g) => ".',`:;".includes(g))).toBe(true);
    expect(drawn.glyphs).toContain("-");
    expect([...drawn.inks]).toEqual(["rgb(1, 2, 3)"]);
    expect(ctx.globalAlpha).toBe(1);
  });
});
