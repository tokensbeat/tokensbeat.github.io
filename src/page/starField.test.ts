import { drawSky, makeStars, MAX_STARS, starAlpha, starCount, STARS, startStarField, type Glows, type SkyContext } from "./starField";

/** A context that counts what is drawn. */
function recorder() {
  const calls = { clear: 0, rect: 0, arc: 0 };
  const ctx: SkyContext = {
    globalAlpha: 1,
    fillStyle: "",
    setTransform: () => undefined,
    clearRect: () => void calls.clear++,
    fillRect: () => void calls.rect++,
    beginPath: () => undefined,
    arc: () => void calls.arc++,
    fill: () => undefined,
  };
  return { ctx, calls };
}

/** A canvas 800 x 400 CSS px with a recording context, under a controllable frame clock, visibility and viewport. */
function rig({ reduced = false, intersecting = true }: { reduced?: boolean; intersecting?: boolean } = {}) {
  const { ctx, calls } = recorder();
  const canvas = document.createElement("canvas");
  Object.defineProperty(canvas, "clientWidth", { value: 800 });
  Object.defineProperty(canvas, "clientHeight", { value: 400 });
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
  /** Runs the pending frames `n` times, 50 ms apart. */
  const step = (n = 1) => {
    for (let k = 0; k < n; k++) {
      now += 50;
      const due = [...frames.entries()];
      frames.clear();
      for (const [, cb] of due) cb(now);
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
  return { canvas, calls, frames, step, setHidden, scroll: (v: boolean) => see?.([{ isIntersecting: v }]) };
}

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.replaceChildren();
  Reflect.deleteProperty(document, "hidden");
});

describe("the hero's stars", () => {
  it("are the same sky every time (the server and the browser agree), placed in fractions of the canvas", () => {
    expect(makeStars()).toEqual(makeStars());
    expect(STARS).toHaveLength(MAX_STARS);
    for (const s of STARS) {
      expect(s.x).toBeGreaterThanOrEqual(0);
      expect(s.x).toBeLessThan(1);
      expect(s.y).toBeGreaterThanOrEqual(0);
      expect(s.y).toBeLessThan(1);
    }
    expect(starCount(0, 0)).toBe(0);
    expect(starCount(1440, 1200)).toBeLessThanOrEqual(MAX_STARS);
    expect(starCount(390, 700)).toBeGreaterThan(50);
  });

  it("twinkle gently: some hold still, the rest dim slowly and never brighten past their own light", () => {
    const still = STARS.filter((s) => !s.tw);
    const twinkling = STARS.filter((s) => s.tw);
    expect(still.length).toBeGreaterThan(STARS.length * 0.3);
    expect(twinkling.length).toBeGreaterThan(STARS.length * 0.3);
    // No flashing: the quickest twinkle takes 3 s, the slow ones 10 s or more.
    expect(Math.min(...STARS.map((s) => s.period))).toBeGreaterThanOrEqual(3);
    expect(STARS.filter((s) => s.period >= 10).length).toBeGreaterThan(10);
    for (const s of twinkling.slice(0, 50)) {
      for (let t = 0; t < 20; t += 0.7) {
        const a = starAlpha(s, t);
        expect(a).toBeGreaterThanOrEqual(s.a * (1 - s.tw) - 1e-9);
        expect(a).toBeLessThanOrEqual(s.a + 1e-9);
      }
    }
    for (const s of still.slice(0, 20)) expect(starAlpha(s, 7)).toBe(s.a);
  });

  it("draws a canvas's share of the sky: specks as squares, the larger stars as discs", () => {
    const { ctx, calls } = recorder();
    drawSky(ctx, STARS, 300, 800, 400, 0, ["#fff", "#ccf", "#ffc"]);
    expect(calls.clear).toBe(1);
    expect(calls.rect + calls.arc).toBeGreaterThanOrEqual(300);
    expect(calls.rect).toBeGreaterThan(0);
    expect(calls.arc).toBeGreaterThan(0);
    expect(ctx.globalAlpha).toBe(1);
  });

  it("give the bright stars a soft glow, stamped from one image per tint, as faint as the star at that moment", () => {
    const { ctx } = recorder();
    const stamps: { image: unknown; alpha: number; size: number }[] = [];
    ctx.drawImage = (image, _x, _y, size) => void stamps.push({ image, alpha: ctx.globalAlpha, size });
    const glows = [{ id: "white" }, { id: "cool" }, { id: "warm" }] as unknown as Glows;
    const bright = STARS.slice(0, 300).filter((s) => s.r > 1.3);
    expect(bright.length).toBeGreaterThan(3);
    drawSky(ctx, STARS, 300, 800, 400, 2, ["#fff", "#ccf", "#ffc"], glows);
    expect(stamps).toHaveLength(bright.length);
    for (const s of bright) {
      const stamp = stamps.find((p) => p.image === glows[s.tint] && Math.abs(p.size - s.r * 8) < 1e-9 && Math.abs(p.alpha - starAlpha(s, 2)) < 1e-9);
      expect(stamp, `a glow for the star at ${s.x}, ${s.y}`).toBeDefined();
    }
    // Without glows (a canvas that cannot make them) the stars are drawn all the same.
    stamps.length = 0;
    drawSky(ctx, STARS, 300, 800, 400, 2, ["#fff", "#ccf", "#ffc"]);
    expect(stamps).toHaveLength(0);
  });

  it("move only while on screen, the tab is shown and the reader has not paused them", () => {
    let paused = false;
    const { canvas, calls, frames, step, setHidden, scroll } = rig();
    const field = startStarField(canvas, () => paused);
    expect(canvas.dataset.state).toBe("moving");
    expect(canvas).toHaveAttribute("data-drawn");
    const drawn = calls.clear;
    step(4);
    expect(calls.clear).toBeGreaterThan(drawn);

    // A hidden tab: the loop stops, and comes back when the tab does.
    setHidden(true);
    expect(canvas.dataset.state).toBe("hidden");
    expect(frames.size).toBe(0);
    const atHide = calls.clear;
    step(4);
    expect(calls.clear).toBe(atHide);
    setHidden(false);
    expect(canvas.dataset.state).toBe("moving");
    expect(frames.size).toBe(1);

    // Scrolled away: stopped.
    scroll(false);
    expect(canvas.dataset.state).toBe("off");
    expect(frames.size).toBe(0);
    scroll(true);
    expect(frames.size).toBe(1);

    // The orbit's Pause stops the stars too.
    paused = true;
    field.sync();
    expect(canvas.dataset.state).toBe("paused");
    expect(frames.size).toBe(0);

    field.stop();
    paused = false;
    setHidden(false);
    expect(frames.size).toBe(0);
  });

  it("hold still under reduced motion: one sky drawn, no frames asked for", () => {
    const { canvas, calls, frames, step } = rig({ reduced: true });
    startStarField(canvas);
    expect(canvas.dataset.state).toBe("still");
    expect(canvas).toHaveAttribute("data-drawn");
    expect(calls.clear).toBe(1);
    expect(frames.size).toBe(0);
    step(5);
    expect(calls.clear).toBe(1);
  });

  it("do not start off screen", () => {
    const { canvas, frames } = rig({ intersecting: false });
    startStarField(canvas);
    expect(canvas.dataset.state).toBe("off");
    expect(frames.size).toBe(0);
  });
});
