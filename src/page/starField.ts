/**
 * The hero's night sky: a scatter of stars on one canvas, a few of them twinkling. The stars are fixed by a seed (the
 * same sky on every visit, in every browser) and placed in fractions of the canvas, so a resize only redraws them.
 * Most hold still; about half dim and come back slowly (a sine of 3 to 9 s, a few of 10 to 16 s, never brighter than
 * their own light and never faster than once in 3 s, so nothing flashes). The colours are the theme's star tokens
 * (--c-star, --c-star-cool, --c-star-warm in theme.css), read from the canvas.
 *
 * startStarField runs it: one requestAnimationFrame loop drawing at most 30 times a second, only while the canvas is on
 * screen (IntersectionObserver), the tab is shown (visibilitychange) and the reader has not paused it. Under reduced
 * motion it draws one still sky and never loops. The canvas says what it is doing in data-state (moving, still,
 * paused, hidden, off) and gets data-drawn once it holds a sky, which the stylesheet fades in: the server sends an
 * empty canvas over the night ground, so there is nothing to mismatch and no flash.
 *
 * The product pages' closing bands draw variations of this sky (./ctaArt.ts, SkyOptions): the same seeded stars and
 * twinkle, set as characters in one ink (the canvas's colour, read again when the theme changes) beside the band's
 * words, and joined into constellations, turning round a pole star, or crossed by a wave of light.
 */

export interface Star {
  /** Position, as fractions of the canvas's width and height. */
  x: number;
  y: number;
  /** Radius in CSS pixels. */
  r: number;
  /** Its full light, 0 to 1. */
  a: number;
  /** How far it dims at the bottom of a twinkle (0: it holds still). */
  tw: number;
  /** Seconds per twinkle. */
  period: number;
  phase: number;
  /** 0 white, 1 cool, 2 warm. */
  tint: 0 | 1 | 2;
}

/** The most stars a canvas holds (a large hero); a smaller one draws the first of them. */
export const MAX_STARS = 620;
/** One star per this many square CSS pixels. */
const AREA_PER_STAR = 2600;
/** The loop draws no more often than this (ms). */
const FRAME_MS = 1000 / 30;

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The sky: `count` stars from `seed`, the same every time. */
export function makeStars(seed = 2026, count = MAX_STARS): Star[] {
  const rand = mulberry32(seed);
  const stars: Star[] = [];
  for (let i = 0; i < count; i++) {
    const size = rand();
    // Mostly specks, some small stars, a few bright ones.
    const r = size < 0.72 ? 0.35 + rand() * 0.45 : size < 0.95 ? 0.8 + rand() * 0.5 : 1.3 + rand() * 0.7;
    const a = size < 0.72 ? 0.28 + rand() * 0.4 : 0.5 + rand() * 0.45;
    const kind = rand();
    const slow = kind > 0.9;
    const tw = kind < 0.45 ? 0 : slow ? 0.55 + rand() * 0.3 : 0.25 + rand() * 0.45;
    const period = slow ? 10 + rand() * 6 : 3 + rand() * 6;
    const hue = rand();
    stars.push({ x: rand(), y: rand(), r, a, tw, period, phase: rand() * Math.PI * 2, tint: hue < 0.7 ? 0 : hue < 0.88 ? 1 : 2 });
  }
  return stars;
}

export const STARS: readonly Star[] = makeStars();

/** How many stars a canvas of `w` x `h` CSS pixels holds. */
export function starCount(w: number, h: number): number {
  return Math.max(0, Math.min(MAX_STARS, Math.round((w * h) / AREA_PER_STAR)));
}

/** A star's light at `t` seconds: its full light, dimmed by up to `tw` of it as it twinkles. */
export function starAlpha(s: Star, t: number): number {
  if (!s.tw) return s.a;
  const dip = 0.5 + 0.5 * Math.sin((2 * Math.PI * t) / s.period + s.phase);
  return s.a * (1 - s.tw * dip);
}

/** The subset of CanvasRenderingContext2D the sky uses (tests pass a recorder). */
export type SkyContext = Pick<CanvasRenderingContext2D, "setTransform" | "clearRect" | "fillRect" | "beginPath" | "arc" | "fill"> & {
  globalAlpha: number;
  fillStyle: string | CanvasGradient | CanvasPattern;
  drawImage?: (image: CanvasImageSource, x: number, y: number, w: number, h: number) => void;
};

/** The glows of the bright stars, one per tint: a soft radial fade drawn once and stamped on each such star. */
export type Glows = readonly [CanvasImageSource, CanvasImageSource, CanvasImageSource];

/** The glow round a bright star reaches this many times its radius. */
const GLOW = 4;

/** The three glows (white, cool, warm) as small canvases, made once in the browser; null where a canvas cannot draw. */
export function makeGlows(colours: readonly [string, string, string]): Glows | null {
  const sprites = colours.map((colour) => {
    const c = document.createElement("canvas");
    c.width = c.height = 32;
    const g = c.getContext("2d");
    if (!g) return null;
    const fade = g.createRadialGradient(16, 16, 0, 16, 16, 16);
    fade.addColorStop(0, colour);
    fade.addColorStop(1, "transparent");
    g.globalAlpha = 0.4;
    g.fillStyle = fade;
    g.fillRect(0, 0, 32, 32);
    return c;
  });
  return sprites.every(Boolean) ? (sprites as unknown as Glows) : null;
}

/**
 * Draws the first `n` stars at `t` seconds on a `w` x `h` (CSS px) canvas, one colour at a time; the bright ones get
 * their soft glow when `glows` are given.
 */
export function drawSky(ctx: SkyContext, stars: readonly Star[], n: number, w: number, h: number, t: number, colours: readonly [string, string, string], glows: Glows | null = null): void {
  ctx.clearRect(0, 0, w, h);
  for (const tint of [0, 1, 2] as const) {
    ctx.fillStyle = colours[tint];
    for (let i = 0; i < n; i++) {
      const s = stars[i];
      if (s.tint !== tint) continue;
      const alpha = starAlpha(s, t);
      const x = s.x * w;
      const y = s.y * h;
      ctx.globalAlpha = alpha;
      if (s.r < 0.8) {
        ctx.fillRect(x - s.r, y - s.r, s.r * 2, s.r * 2);
        continue;
      }
      ctx.beginPath();
      ctx.arc(x, y, s.r, 0, Math.PI * 2);
      ctx.fill();
      if (s.r > 1.3 && glows && ctx.drawImage) {
        // A soft glow round the bright ones, fading with the star.
        const g = s.r * GLOW;
        ctx.drawImage(glows[tint], x - g, y - g, g * 2, g * 2);
      }
    }
  }
  ctx.globalAlpha = 1;
}

/* ------------------------------------------------------------------ the sky as characters (the closing bands) */

/** A variation of the sky in characters (the product pages' closing bands); options left out are the hero's own. */
export interface SkyOptions {
  /** The glyphs of a speck, a small star and a bright one, in that order. */
  glyphs: string;
  /** Which sky (the hero's is 2026). */
  seed?: number;
  /** Stars per area, as a multiple of the hero's (1). */
  density?: number;
  /** Groups of nearby bright stars joined by dotted lines, up to this many (none). */
  constellations?: number;
  /** The sky turns round a pole star at this point (fractions of the canvas), once in `period` seconds, each brighter star trailing an arc of dots. */
  turn?: { x: number; y: number; period: number };
  /** A wave of light crosses the sky from left to right, once every this many seconds (none). */
  pulse?: number;
  /** The stars set on a square lattice this many px apart, one star to a point: a board of lights (none). */
  lattice?: number;
  /** Most of the stars gathered in a band across the canvas's middle (a Milky Way): its slope in degrees and its half-width as a share of the canvas's diagonal (none). */
  band?: { angle: number; width: number };
}

/** A sky in characters laid out on a canvas: its stars, which of them it shows, where, and its constellations' lines. */
export interface GlyphSky {
  stars: readonly Star[];
  /** The indices of the stars shown. */
  shown: readonly number[];
  /** Where each shown star stands (x, y pairs in CSS px, in the order of `shown`), for a sky that does not turn. */
  at: Float32Array;
  /** Pairs of star indices, each a line of a constellation. */
  links: readonly (readonly [number, number])[];
  /** The stars in a constellation, drawn as bright ones. */
  linked: ReadonlySet<number>;
}

/** The subset of CanvasRenderingContext2D the sky in characters uses (tests pass a recorder). */
export type GlyphContext = Pick<CanvasRenderingContext2D, "setTransform" | "clearRect" | "fillText"> & {
  globalAlpha: number;
  fillStyle: string | CanvasGradient | CanvasPattern;
  font: string;
  textAlign: CanvasTextAlign;
  textBaseline: CanvasTextBaseline;
};

/** The glyphs' sizes in CSS px: a speck, a small star, a bright one. */
const GLYPH_PX = [11, 12, 16] as const;
/** The dots of a constellation's line or a star's trail, this many px apart. */
const DOT_STEP = 9;
/** The most stars in one constellation. */
const GROUP_MAX = 6;
/** The arc a turning star's trail covers behind it, in radians: the same angle near the pole and far from it. */
const TRAIL_ARC = 0.55;

/** The side of the square of sky that turns round the pole: wide enough to cover the canvas's farthest corner at any angle. */
function turningSide(w: number, h: number, turn: NonNullable<SkyOptions["turn"]>): number {
  return 2 * Math.hypot(Math.max(turn.x, 1 - turn.x) * w, Math.max(turn.y, 1 - turn.y) * h);
}

/** Where a star stands at `t` seconds on a `w` x `h` canvas: in fractions of it, or on a square turning round the pole. */
export function placeStar(s: Star, w: number, h: number, t: number, turn?: SkyOptions["turn"]): [number, number] {
  if (!turn) return [s.x * w, s.y * h];
  const cx = turn.x * w;
  const cy = turn.y * h;
  const reach = turningSide(w, h, turn);
  const dx = (s.x - 0.5) * reach;
  const dy = (s.y - 0.5) * reach;
  const a = (2 * Math.PI * t) / turn.period;
  const cos = Math.cos(a);
  const sin = Math.sin(a);
  return [cx + dx * cos - dy * sin, cy + dx * sin + dy * cos];
}

/** A star's size class: 0 a speck, 1 a small star, 2 a bright one. */
const sizeOf = (s: Star) => (s.r < 0.8 ? 0 : s.r < 1.3 ? 1 : 2);

/**
 * Lays out a sky in characters on a `w` x `h` canvas: as many stars as the area holds (all of the turning square's
 * when it turns), set on the lattice or thinned outside the band if asked, and up to `constellations` groups of three
 * to six bright stars, each grown from its brightest star by joining the nearest bright star to any star already in it.
 */
export function layGlyphSky(stars: readonly Star[], w: number, h: number, options: SkyOptions): GlyphSky {
  const density = options.density ?? 1;
  const area = options.turn ? turningSide(w, h, options.turn) ** 2 : w * h;
  const n = Math.max(0, Math.min(stars.length, Math.round((area * density) / AREA_PER_STAR)));
  const shown: number[] = [];
  const at: number[] = [];
  const taken = new Set<number>();
  const { lattice, band } = options;
  const diagonal = Math.hypot(w, h);
  const slope = band ? (band.angle * Math.PI) / 180 : 0;
  for (let i = 0; i < n; i++) {
    const s = stars[i];
    let x = s.x * w;
    let y = s.y * h;
    if (band) {
      // Distance from the band's middle line; the star's twinkle phase is its own uniform draw for the thinning.
      const d = Math.abs(-(x - w / 2) * Math.sin(slope) + (y - h / 2) * Math.cos(slope)) / (band.width * diagonal);
      if (s.phase / (2 * Math.PI) > 0.04 + 0.96 * Math.exp(-d * d)) continue;
    }
    if (lattice) {
      const col = Math.round((x - lattice / 2) / lattice);
      const row = Math.round((y - lattice / 2) / lattice);
      if (col < 0 || row < 0 || col * lattice + lattice > w || row * lattice + lattice > h || taken.has(row * 10_000 + col)) continue;
      taken.add(row * 10_000 + col);
      x = col * lattice + lattice / 2 + (w % lattice) / 2;
      y = row * lattice + lattice / 2 + (h % lattice) / 2;
    }
    shown.push(i);
    at.push(x, y);
  }

  const links: [number, number][] = [];
  const linked = new Set<number>();
  const want = options.constellations ?? 0;
  if (want > 0 && !options.turn) {
    const reach = 0.3 * Math.min(w, h) + 40;
    const margin = 0.06;
    const bright = shown.filter((i) => {
      const s = stars[i];
      return s.r >= 0.8 && s.x > margin && s.x < 1 - margin && s.y > margin && s.y < 1 - margin;
    });
    bright.sort((a, b) => stars[b].a - stars[a].a);
    const used = new Set<number>();
    let groups = 0;
    for (const start of bright) {
      if (groups >= want) break;
      if (used.has(start)) continue;
      const group = [start];
      const edges: [number, number][] = [];
      while (group.length < GROUP_MAX) {
        let best = -1;
        let from = -1;
        let bestD = reach;
        for (const j of bright) {
          if (used.has(j) || group.includes(j)) continue;
          for (const k of group) {
            const d = Math.hypot((stars[j].x - stars[k].x) * w, (stars[j].y - stars[k].y) * h);
            if (d < bestD) {
              bestD = d;
              best = j;
              from = k;
            }
          }
        }
        if (best < 0) break;
        group.push(best);
        edges.push([from, best]);
      }
      if (group.length < 3) continue;
      for (const i of group) {
        used.add(i);
        linked.add(i);
      }
      links.push(...edges);
      groups++;
    }
  }
  return { stars, shown, at: Float32Array.from(at), links, linked };
}

/** How much a wave of light crossing the canvas every `period` seconds adds to a star at `x` (0 to 1); none at t = 0. */
export function pulseAt(x: number, w: number, t: number, period: number): number {
  // The wave crosses in the first 70 % of the period and rests for the rest; the clock starts in the rest.
  const phase = (t / period + 0.75) % 1;
  if (phase > 0.7) return 0;
  const band = Math.max(30, w * 0.09);
  const at = -band + ((w + 2 * band) * phase) / 0.7;
  return Math.exp(-(((x - at) / band) ** 2));
}

/**
 * Draws a sky in characters at `t` seconds, in one ink: the constellations' lines as faint dots, the turning stars'
 * trails, then each star as its glyph by size (a star in a constellation, or lit by the wave, as a bright one), as
 * strong as its twinkle allows. Returns how many glyphs it set.
 */
export function drawGlyphSky(ctx: GlyphContext, sky: GlyphSky, w: number, h: number, t: number, ink: string, family: string, options: SkyOptions): number {
  const { stars, shown, at, links, linked } = sky;
  const { glyphs, turn, pulse } = options;
  const where = (k: number): [number, number] => (turn ? placeStar(stars[shown[k]], w, h, t, turn) : [at[k * 2], at[k * 2 + 1]]);
  let drawn = 0;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = ink;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `500 ${GLYPH_PX[0]}px ${family}`;
  ctx.globalAlpha = 0.42;
  for (const [a, b] of links) {
    const [ax, ay] = [stars[a].x * w, stars[a].y * h];
    const [bx, by] = [stars[b].x * w, stars[b].y * h];
    const steps = Math.floor(Math.hypot(bx - ax, by - ay) / DOT_STEP);
    for (let k = 1; k < steps; k++) {
      ctx.fillText(".", ax + ((bx - ax) * k) / steps, ay + ((by - ay) * k) / steps - 3);
      drawn++;
    }
  }
  if (turn) {
    const cx = turn.x * w;
    const cy = turn.y * h;
    shown.forEach((i, k) => {
      const s = stars[i];
      if (sizeOf(s) === 0) return;
      const [x, y] = where(k);
      const r = Math.hypot(x - cx, y - cy);
      const dots = Math.min(16, Math.floor((r * TRAIL_ARC) / DOT_STEP));
      const a0 = Math.atan2(y - cy, x - cx);
      for (let d = 1; d <= dots; d++) {
        const a = a0 - (d * DOT_STEP) / r;
        const tx = cx + Math.cos(a) * r;
        const ty = cy + Math.sin(a) * r;
        if (tx < 0 || ty < 0 || tx > w || ty > h) continue;
        ctx.globalAlpha = 0.8 * s.a * (1 - d / (dots + 1));
        ctx.fillText(".", tx, ty - 3);
        drawn++;
      }
    });
  }
  for (const size of [0, 1, 2] as const) {
    ctx.font = `${size === 2 ? 600 : 500} ${GLYPH_PX[size]}px ${family}`;
    shown.forEach((i, k) => {
      const s = stars[i];
      const [x, y] = where(k);
      if (x < -8 || y < -8 || x > w + 8 || y > h + 8) return;
      const lit = pulse ? pulseAt(x, w, t, pulse) : 0;
      const own = linked.has(i) ? 2 : sizeOf(s);
      if (Math.min(2, own + (lit > 0.6 ? 2 : lit > 0.25 ? 1 : 0)) !== size) return;
      ctx.globalAlpha = Math.min(1, (linked.has(i) ? Math.max(starAlpha(s, t), 0.85) : starAlpha(s, t)) + 0.6 * lit);
      ctx.fillText(glyphs[size], x, y);
      drawn++;
    });
  }
  if (turn) {
    // The pole star: the one light that holds still while the sky turns round it.
    ctx.font = `600 ${GLYPH_PX[2] + 6}px ${family}`;
    ctx.globalAlpha = 1;
    ctx.fillText(glyphs[2], turn.x * w, turn.y * h);
    drawn++;
  }
  ctx.globalAlpha = 1;
  return drawn;
}

export type SkyState = "moving" | "still" | "paused" | "hidden" | "off";

export interface StarFieldHandle {
  /** Re-reads the reader's pause (and everything else) and starts or stops the loop. */
  sync(): void;
  stop(): void;
}

const REDUCED = "(prefers-reduced-motion: reduce)";

/**
 * Runs the sky on `canvas` (see the top of this file); `paused` is asked on every sync. With `options` it is a sky in
 * characters (SkyOptions), in the canvas's colour and font, read again when the theme changes.
 */
export function startStarField(canvas: HTMLCanvasElement, paused: () => boolean = () => false, options?: SkyOptions): StarFieldHandle {
  const ctx = canvas.getContext("2d") as (SkyContext & Partial<GlyphContext>) | null;
  if (!ctx) return { sync: () => undefined, stop: () => undefined };
  const reduced = window.matchMedia?.(REDUCED) ?? null;
  const css = getComputedStyle(canvas);
  const colour = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;
  const colours = [colour("--c-star", "#eef2fb"), colour("--c-star-cool", "#bcd0ff"), colour("--c-star-warm", "#ffe2bd")] as const;
  const glows = options ? null : makeGlows(colours);
  const glyphStars = options ? (options.seed == null ? STARS : makeStars(options.seed)) : STARS;
  let sky: GlyphSky | null = null;
  let ink = "";
  let family = "";
  const readInk = () => {
    const now = getComputedStyle(canvas);
    ink = now.color;
    family = now.fontFamily || "ui-monospace, monospace";
  };
  if (options) readInk();

  let w = 0;
  let h = 0;
  let t = 0;
  let raf = 0;
  let last = 0;
  let drawnAt = 0;
  let inView = typeof IntersectionObserver !== "function";

  const draw = () => {
    if (!w || !h) return;
    if (options && sky) drawGlyphSky(ctx as GlyphContext, sky, w, h, t, ink, family, options);
    else drawSky(ctx, STARS, starCount(w, h), w, h, t, colours, glows);
    canvas.dataset.drawn = "";
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
    if (options) sky = layGlyphSky(glyphStars, w, h, options);
    draw();
  };

  const tick = (now: number) => {
    raf = requestAnimationFrame(tick);
    t += last ? Math.min(0.1, (now - last) / 1000) : 0;
    last = now;
    if (now - drawnAt < FRAME_MS) return;
    drawnAt = now;
    draw();
  };
  const state = (): SkyState =>
    reduced?.matches ? "still" : paused() ? "paused" : document.hidden ? "hidden" : !inView ? "off" : "moving";
  const sync = () => {
    const now = state();
    canvas.dataset.state = now;
    if (now === "moving" && !raf) {
      last = 0;
      drawnAt = 0;
      raf = requestAnimationFrame(tick);
    } else if (now !== "moving" && raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  };

  const onMotion = () => {
    if (reduced?.matches) {
      // Back to the still sky.
      t = 0;
      draw();
    }
    sync();
  };
  const recolour = () => {
    readInk();
    draw();
  };
  reduced?.addEventListener?.("change", onMotion);
  document.addEventListener("visibilitychange", sync);
  // A sky in characters takes the canvas's colour, which the theme sets; and a canvas cannot ask for a web font.
  const dark = options ? (window.matchMedia?.("(prefers-color-scheme: dark)") ?? null) : null;
  dark?.addEventListener?.("change", recolour);
  const theme = options && typeof MutationObserver === "function" ? new MutationObserver(recolour) : null;
  theme?.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class"] });
  let stopped = false;
  if (options) document.fonts?.load?.(`500 12px ${family}`).then(() => !stopped && draw(), () => undefined);
  const resizer = typeof ResizeObserver === "function" ? new ResizeObserver(resize) : null;
  resizer?.observe(canvas);
  const observer =
    typeof IntersectionObserver === "function"
      ? new IntersectionObserver(([entry]) => {
          inView = entry.isIntersecting;
          sync();
        })
      : null;
  observer?.observe(canvas);

  resize();
  sync();

  return {
    sync,
    stop() {
      stopped = true;
      reduced?.removeEventListener?.("change", onMotion);
      dark?.removeEventListener?.("change", recolour);
      document.removeEventListener("visibilitychange", sync);
      theme?.disconnect();
      resizer?.disconnect();
      observer?.disconnect();
      cancelAnimationFrame(raf);
      raf = 0;
    },
  };
}
