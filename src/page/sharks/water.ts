/**
 * The closing band's water (./world.ts drawn by ./render.ts) on a canvas. Loaded only when the band comes near the
 * screen (../CtaArt.tsx, ../lazyArt.ts), so a page's first load carries none of it.
 *
 * startSharkWater runs it: the simulation in fixed 1/60 s steps, drawn at most 30 times a second, only while the
 * canvas is on screen (IntersectionObserver) and the tab is shown (visibilitychange). Under reduced motion it lets the
 * water settle for four simulated seconds and draws that one frame, with no loop. The ink is the canvas's `color`
 * (the band's words), read again when the theme changes. The canvas says what it is doing in data-state (moving,
 * still, hidden, off) and gets data-drawn once it holds a frame, which the stylesheet fades in.
 *
 * The product pages' closing bands run variations of it (../ctaArt.ts): startSharkWater's options are the World's
 * (./world.ts WaterOptions), its seed and the fish's glyphs; left out, the water is the default (the homepage's sharks until 2026-11-27).
 *
 * After stackedlol/ascii-sharks (src/engine.ts at a0074c1; MIT, Copyright (c) 2026 drewdi, ./LICENSE), whose notice
 * the build puts at the top of this chunk (scripts/vendor-notices.mjs).
 *
 * Aha's loading screen runs a copy of ./world.ts and ./render.ts as they are, with a loop of its own for a water of a
 * fixed size.
 */
import { AsciiWater, type InkContext } from "./render";
import { World, type WaterOptions } from "./world";

export type WaterState = "moving" | "still" | "hidden" | "off";

/** A variation of the water: the World's options, its random seed (2026) and the fish's glyphs, far to near ("-"). */
export interface SharkWaterOptions extends WaterOptions {
  seed?: number;
  glyphs?: string;
}

export interface WaterHandle {
  /** Re-reads the reader's motion setting, the tab and the viewport, and starts or stops the loop. */
  sync(): void;
  stop(): void;
}

const STEP = 1 / 60;
const MAX_STEPS = 4;
/** At most 30 frames a second; the margin lets a 60 Hz display draw every second frame, not every third. */
const FRAME_MS = 1000 / 30 - 4;
/** Simulated seconds before the still frame: the sharks have turned and the schools have formed by then. */
const SETTLE_S = 4;
const REDUCED = "(prefers-reduced-motion: reduce)";
const DARK = "(prefers-color-scheme: dark)";

export function startSharkWater(canvas: HTMLCanvasElement, options: SharkWaterOptions = {}): WaterHandle {
  const ctx = canvas.getContext("2d") as (InkContext & Pick<CanvasRenderingContext2D, "setTransform">) | null;
  if (!ctx) return { sync: () => undefined, stop: () => undefined };
  const reduced = window.matchMedia?.(REDUCED) ?? null;
  const dark = window.matchMedia?.(DARK) ?? null;
  const { seed, glyphs, ...variation } = options;
  const world = new World(seed, variation);
  const water = new AsciiWater(ctx, { fish: glyphs });

  let width = 0;
  let raf = 0;
  let drawnAt = 0;
  let acc = 0;
  let inView = typeof IntersectionObserver !== "function";

  const state = (): WaterState => (reduced?.matches ? "still" : document.hidden ? "hidden" : !inView ? "off" : "moving");

  const paint = (dt: number) => {
    if (!width) return;
    water.render(world, dt);
    canvas.dataset.drawn = "";
  };
  /** A frame without a loop: the settled water under reduced motion, else the water as it stands. */
  const hold = () => {
    if (state() === "still") while (world.time < SETTLE_S) world.step(STEP);
    paint(0);
  };
  const readStyle = () => {
    const css = getComputedStyle(canvas);
    water.setInk(css.color);
    water.setFontFamily(css.fontFamily);
  };

  const resize = () => {
    const cw = canvas.clientWidth;
    const ch = canvas.clientHeight;
    if (!cw || !ch) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    width = cw;
    canvas.width = Math.round(cw * dpr);
    canvas.height = Math.round(ch * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    water.resize(cw, ch);
    world.resize(cw, ch, water.cellWidth, water.cellHeight);
    // A new size clears the canvas; the loop redraws by itself, anything else draws its frame now.
    if (!raf) hold();
  };

  const tick = (now: number) => {
    raf = requestAnimationFrame(tick);
    if (!drawnAt) {
      drawnAt = now;
      return;
    }
    if (now - drawnAt < FRAME_MS) return;
    const dt = Math.min(0.1, (now - drawnAt) / 1000);
    drawnAt = now;
    acc += dt;
    let steps = 0;
    while (acc >= STEP && steps < MAX_STEPS) {
      world.step(STEP);
      acc -= STEP;
      steps++;
    }
    if (steps === MAX_STEPS) acc = 0;
    paint(dt);
  };

  const sync = () => {
    const now = state();
    canvas.dataset.state = now;
    if (now === "moving" && !raf) {
      drawnAt = 0;
      raf = requestAnimationFrame(tick);
    } else if (now !== "moving" && raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
    if (now === "still") hold();
  };

  const recolour = () => {
    readStyle();
    if (!raf) paint(0);
  };

  const local = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const onMove = (e: PointerEvent) => {
    const { x, y } = local(e);
    world.pointer.x = x;
    world.pointer.y = y;
    world.pointer.active = e.pointerType !== "touch";
  };
  const onLeave = () => {
    world.pointer.active = false;
  };
  const onDown = (e: PointerEvent) => {
    if (state() !== "moving") return;
    const { x, y } = local(e);
    world.splash(x, y);
  };

  readStyle();
  reduced?.addEventListener?.("change", sync);
  dark?.addEventListener?.("change", recolour);
  document.addEventListener("visibilitychange", sync);
  canvas.addEventListener("pointermove", onMove, { passive: true });
  canvas.addEventListener("pointerleave", onLeave);
  canvas.addEventListener("pointerdown", onDown, { passive: true });
  const theme = typeof MutationObserver === "function" ? new MutationObserver(recolour) : null;
  theme?.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class"] });
  const resizer = typeof ResizeObserver === "function" ? new ResizeObserver(resize) : null;
  resizer?.observe(canvas);
  const viewport =
    typeof IntersectionObserver === "function"
      ? new IntersectionObserver(([entry]) => {
          inView = entry.isIntersecting;
          sync();
        })
      : null;
  viewport?.observe(canvas);
  // A canvas cannot ask for a web font; once the mono face is in, a frame without the loop is drawn again with it
  // (not after stop: the font can arrive after the band is gone).
  let stopped = false;
  document.fonts?.load?.(`600 12px ${getComputedStyle(canvas).fontFamily}`).then(
    () => !stopped && !raf && paint(0),
    () => undefined,
  );

  resize();
  sync();

  return {
    sync,
    stop() {
      stopped = true;
      reduced?.removeEventListener?.("change", sync);
      dark?.removeEventListener?.("change", recolour);
      document.removeEventListener("visibilitychange", sync);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("pointerdown", onDown);
      theme?.disconnect();
      resizer?.disconnect();
      viewport?.disconnect();
      cancelAnimationFrame(raf);
      raf = 0;
    },
  };
}
