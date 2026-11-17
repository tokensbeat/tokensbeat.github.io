/**
 * Text art on a canvas: the orbit's pure ASCII engines (./orbitScene.ts's planet, ./orbitMoonArt.ts's moons) as the
 * product pages' closing bands draw them (./ctaArt.ts). A frame is lines of text; each character is set in its cell of
 * a grid sized so the whole frame fits the canvas (the planet's cell, 0.6 x 1.2 of the font size), in the canvas's
 * colour and monospace font, the ramp's lighter glyphs a little fainter so the body reads in depth. The colour is read
 * again when the theme changes.
 *
 * startTextArt runs it as the water and the stars run: a new frame at most `fps` times a second, only while the canvas
 * is on screen (IntersectionObserver) and the tab is shown (visibilitychange); under reduced motion the frame at
 * `still` seconds, once, with no loop. The canvas says what it is doing in data-state (moving, still, hidden, off) and
 * gets data-drawn once it holds a frame, which the stylesheet fades in.
 */

export interface TextArt {
  /** The frame at `t` seconds: lines of text, each the same length. */
  frame(t: number): string;
  /** New frames a second. */
  fps: number;
  /** The time of the one frame drawn under reduced motion. */
  still: number;
  /** The share of the canvas's width and height the art may fill (0.86). */
  fit?: number;
}

export type TextArtState = "moving" | "still" | "hidden" | "off";

export interface TextArtHandle {
  sync(): void;
  stop(): void;
}

/** The subset of CanvasRenderingContext2D the art uses (tests pass a recorder). */
export type TextContext = Pick<CanvasRenderingContext2D, "setTransform" | "clearRect" | "fillText"> & {
  globalAlpha: number;
  fillStyle: string | CanvasGradient | CanvasPattern;
  font: string;
  textAlign: CanvasTextAlign;
  textBaseline: CanvasTextBaseline;
};

/** The orbit's ramp, dense to light (orbitScene.ts, orbitMoonArt.ts); a glyph further along it is drawn fainter. */
const RAMP = "@%#*+=-:.";
const REDUCED = "(prefers-reduced-motion: reduce)";
const DARK = "(prefers-color-scheme: dark)";

/** A glyph's strength: the ramp's densest at full ink, its dots at a little over half; any other glyph at full. */
export function inkOf(glyph: string): number {
  const at = RAMP.indexOf(glyph);
  return at < 0 ? 1 : 1 - (0.45 * at) / (RAMP.length - 1);
}

/** The font size (CSS px) at which a frame of `cols` x `rows` characters fills `fit` of a `w` x `h` canvas. */
export function fontFor(cols: number, rows: number, w: number, h: number, fit = 0.86): number {
  if (!cols || !rows) return 0;
  return Math.min((w * fit) / (cols * 0.6), (h * fit) / (rows * 1.2));
}

/** Draws one frame centred on a `w` x `h` canvas; returns how many glyphs it set. */
export function drawText(ctx: TextContext, text: string, w: number, h: number, ink: string, family: string, fit = 0.86): number {
  const lines = text.split("\n");
  const cols = lines.reduce((m, l) => Math.max(m, l.length), 0);
  const size = fontFor(cols, lines.length, w, h, fit);
  ctx.clearRect(0, 0, w, h);
  if (!size) return 0;
  const cw = size * 0.6;
  const ch = size * 1.2;
  const x0 = (w - cols * cw) / 2 + cw / 2;
  const y0 = (h - lines.length * ch) / 2 + ch / 2;
  ctx.fillStyle = ink;
  ctx.font = `600 ${size.toFixed(2)}px ${family}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  let drawn = 0;
  lines.forEach((line, row) => {
    for (let col = 0; col < line.length; col++) {
      const glyph = line[col];
      if (glyph === " ") continue;
      ctx.globalAlpha = inkOf(glyph);
      ctx.fillText(glyph, x0 + col * cw, y0 + row * ch);
      drawn++;
    }
  });
  ctx.globalAlpha = 1;
  return drawn;
}

export function startTextArt(canvas: HTMLCanvasElement, art: TextArt): TextArtHandle {
  const ctx = canvas.getContext("2d") as TextContext | null;
  if (!ctx) return { sync: () => undefined, stop: () => undefined };
  const reduced = window.matchMedia?.(REDUCED) ?? null;
  const dark = window.matchMedia?.(DARK) ?? null;

  let w = 0;
  let h = 0;
  let t = 0;
  let raf = 0;
  let last = 0;
  let shown = -1;
  let ink = "";
  let family = "";
  let inView = typeof IntersectionObserver !== "function";

  const state = (): TextArtState => (reduced?.matches ? "still" : document.hidden ? "hidden" : !inView ? "off" : "moving");
  const paint = (at: number) => {
    if (!w || !h) return;
    drawText(ctx, art.frame(at), w, h, ink, family, art.fit);
    canvas.dataset.drawn = "";
  };
  /** A frame without the loop: the still one under reduced motion, else the art as it stands. */
  const hold = () => paint(state() === "still" ? art.still : t);
  const readStyle = () => {
    const css = getComputedStyle(canvas);
    ink = css.color;
    family = css.fontFamily || "ui-monospace, monospace";
  };

  const resize = () => {
    const cw = canvas.clientWidth;
    const ch = canvas.clientHeight;
    if (!cw || !ch) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    w = cw;
    h = ch;
    canvas.width = Math.round(cw * dpr);
    canvas.height = Math.round(ch * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // A new size clears the canvas; the loop redraws by itself, anything else draws its frame now.
    if (raf) shown = -1;
    else hold();
  };

  const tick = (now: number) => {
    raf = requestAnimationFrame(tick);
    t += last ? Math.min(0.1, (now - last) / 1000) : 0;
    last = now;
    const frame = Math.floor(t * art.fps);
    if (frame === shown) return;
    shown = frame;
    paint(frame / art.fps);
  };

  const sync = () => {
    const now = state();
    canvas.dataset.state = now;
    if (now === "moving" && !raf) {
      last = 0;
      shown = -1;
      raf = requestAnimationFrame(tick);
    } else if (now !== "moving" && raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
    if (now === "still") hold();
  };

  const recolour = () => {
    readStyle();
    if (raf) shown = -1;
    else hold();
  };

  readStyle();
  reduced?.addEventListener?.("change", sync);
  dark?.addEventListener?.("change", recolour);
  document.addEventListener("visibilitychange", sync);
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
  // A canvas cannot ask for a web font; once the mono face is in, the frame is drawn again with it (not after stop).
  let stopped = false;
  document.fonts?.load?.(`600 12px ${family}`).then(
    () => {
      if (stopped) return;
      if (raf) shown = -1;
      else hold();
    },
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
      theme?.disconnect();
      resizer?.disconnect();
      viewport?.disconnect();
      cancelAnimationFrame(raf);
      raf = 0;
    },
  };
}
