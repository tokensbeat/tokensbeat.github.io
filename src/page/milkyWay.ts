/**
 * The homepage's chart of the Milky Way (./Journey.tsx), drawn in ASCII: every frame is a grid of characters in the
 * site's monospace face, as the site's other ASCII art is. The river is a density field (about 7,600 seeded stars along
 * a spine, its glow and its dust lane, built once) read at each cell and set as a glyph of the ramp ` .:-=+*#%@`, warm
 * at the bulge, cool or white elsewhere, its brightest stars twinkling between `*`, `+` and `.`. A route runs along the
 * river in dots, faint ahead and jade where the camera has been.
 *
 * Each product is a constellation (星座), drawn as a star atlas draws one: its stars as `*` (a hub as `@`, a faint star
 * as `+`), joined by dotted lines of `.`, with clear sky round them. Aha is a hub star with Chat, LaTeX and
 * Aha Work; Bots a dipper of six stars, work handed along its lines; the Model API your key, the gateway and four model
 * stars, one route lit; the balance one warm star tied to Aha, Bots and the API. A jade `o` runs along the line in use.
 *
 * `p` is where the reader is, 0 (the start, the whole river) to 4 (the last product), fractional between stops; the
 * camera moves from one stop's view to the next and dips out a little between products. `t` is the time in seconds,
 * which moves the `o`s and the twinkle (it stands still when paused or under reduced motion).
 *
 * The constellations' names are HTML notes (the page's own type, in its language) set beside their stars each frame;
 * a note that would cover a plate of words, or a note already set, or leave the stage, waits until there is room. Every
 * colour comes from the theme's tokens on the stage.
 */

export const STOP_COUNT = 5;

type Rgb = readonly [number, number, number];
type Pt = readonly [number, number];
type Side = "l" | "r";

/** The density ramp, from empty to dense. */
export const RAMP = " .:-=+*#%@";

/** A density (0 empty, 1 the river's brightest) as a glyph of the ramp. */
export function glyphOf(v: number): string {
  if (!(v > 0)) return " ";
  const i = Math.min(RAMP.length - 1, Math.floor(Math.pow(Math.min(1, v), 0.8) * RAMP.length));
  return RAMP[i];
}

/** A star of a constellation: where it is from the product's point (world units), how bright, and its note. */
export interface FigureStar {
  x: number;
  y: number;
  /** 0 a faint star (`+`), 1 a named star (`*`), 2 the figure's hub (`@`). */
  mag: 0 | 1 | 2;
  /** The chart note (home-copy.json chart.notes) set beside it. */
  note?: string;
  warm?: boolean;
}

export interface Figure {
  stars: FigureStar[];
  /** Lines between stars, by index. */
  lines: [number, number][];
  /** On a phone (under 900 px) the figure is drawn at this share of its size: Bots' six names need a computer's room. */
  compact?: number;
}

/** The four constellations, in the stops' order (Aha, Bots, the Model API, the balance). */
export const FIGURES: readonly Figure[] = [
  {
    stars: [
      { x: 0, y: 0, mag: 2 },
      { x: -125, y: -45, mag: 1, note: "aha.chat" },
      { x: 115, y: -75, mag: 1, note: "aha.latex" },
      { x: 55, y: 105, mag: 1, note: "aha.work" },
      { x: -35, y: -120, mag: 0 },
      { x: 180, y: 15, mag: 0 },
    ],
    lines: [
      [0, 1],
      [0, 2],
      [0, 3],
      [1, 4],
      [4, 2],
      [2, 5],
      [5, 3],
    ],
  },
  {
    stars: [
      { x: -230, y: -10, mag: 1, note: "bots.0" },
      { x: -130, y: -70, mag: 1, note: "bots.1" },
      { x: -95, y: 55, mag: 1, note: "bots.2" },
      { x: -235, y: 128, mag: 1, note: "bots.3" },
      { x: 30, y: 30, mag: 1, note: "bots.4" },
      { x: 150, y: -62, mag: 1, note: "bots.5" },
      { x: 235, y: -112, mag: 0 },
    ],
    compact: 0.74,
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
      [2, 4],
      [4, 5],
      [5, 6],
    ],
  },
  {
    stars: [
      { x: -145, y: 20, mag: 1, note: "api.key" },
      { x: 0, y: 0, mag: 2, note: "api.gw" },
      { x: 120, y: -95, mag: 1 },
      { x: 158, y: -25, mag: 1 },
      { x: 142, y: 50, mag: 1 },
      { x: 92, y: 118, mag: 1 },
    ],
    lines: [
      [0, 1],
      [1, 2],
      [1, 3],
      [1, 4],
      [1, 5],
    ],
  },
  {
    stars: [
      { x: 0, y: 0, mag: 2, note: "bal.core", warm: true },
      { x: -112, y: -84, mag: 1, note: "bal.0" },
      { x: 102, y: -95, mag: 1, note: "bal.1" },
      { x: 70, y: 121, mag: 1, note: "bal.2" },
    ],
    lines: [
      [0, 1],
      [0, 2],
      [0, 3],
    ],
  },
];

/** The Model API's model stars (indices in its figure); the note "A model" rides on the one whose route is lit. */
const MODEL_STARS = [2, 3, 4, 5];

interface Colours {
  star: Rgb;
  cool: Rgb;
  warm: Rgb;
  jade: Rgb;
  jade2: Rgb;
  ink: Rgb;
  ink2: Rgb;
}

/** The river's density, in a grid over the world, with the share of it that is the bulge's warm light. */
interface Field {
  x0: number;
  y0: number;
  step: number;
  w: number;
  h: number;
  all: Float32Array;
  warm: Float32Array;
}

/** A bright star, drawn as its own glyph and twinkling. */
interface Bright {
  x: number;
  y: number;
  d: number;
  big: boolean;
  tw: number;
  ph: number;
  tint: 0 | 1 | 2;
}

interface Placed {
  id: string;
  x: number;
  y: number;
  side: Side;
  alpha: number;
  /** Where the note goes when its first place is taken (below its star instead of above). */
  alt?: { x: number; y: number };
}

interface Note {
  el: HTMLElement;
  w: number;
  h: number;
  on: boolean;
}

/** A character set over the river at a point (CSS px): a constellation's star or the dots of its lines, the route, a runner. */
interface Mark {
  x: number;
  y: number;
  g: string;
  col: Rgb;
  a: number;
  /** A star is set a size larger, in bold. */
  big?: boolean;
  /** A dot of a line or of the route, which breaks round a label (a star or a runner does not). */
  stroke?: boolean;
}

export interface ChartOptions {
  stage: HTMLElement;
  canvas: HTMLCanvasElement;
  /** The plates of words over the chart, which no note may cover. */
  plates: () => HTMLElement[];
  /** Words set straight on the chart (the hero): the river leaves their box empty, so no character sits on a letter. */
  veils?: () => HTMLElement[];
  /** A stop's name in the page's language, written under its constellation when the chart is seen from afar. */
  stopName: (k: number) => string;
}

export interface Chart {
  /** Measure the stage and the grid again (a new size, a new plate width, the web font arrived). */
  resize(): void;
  /** The type changed (the web fonts arrived): measure the cells and the notes again. */
  remeasure(): void;
  draw(p: number, t: number): void;
}

/** A seeded random in [0, 1): the same sky on every visit. */
export function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const gauss = (r: () => number) => {
  let u = 0;
  while (!u) u = r();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r());
};

/** A cell's fixed random in [0, 1) (its twinkle phase, its tint, a far star). */
function hash(c: number, r: number): number {
  let h = Math.imul(c, 374761393) + Math.imul(r, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** The Milky Way's spine (world units), a Catmull-Rom curve through seven points; the products sit at points 2 to 5. */
export const SPINE: readonly Pt[] = [
  [-900, 700],
  [-200, 330],
  [700, -160],
  [1500, -640],
  [2400, -980],
  [3200, -1500],
  [4000, -1900],
];
const crv = (a: number, b: number, c: number, d: number, t: number) =>
  0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t);

/** The point of the spine at `s` (0 to 6, the index of its points). */
export function spine(s: number): Pt {
  const n = SPINE.length - 1;
  s = Math.max(0, Math.min(n - 1e-6, s));
  const i = Math.floor(s);
  const t = s - i;
  const p0 = SPINE[Math.max(0, i - 1)];
  const p1 = SPINE[i];
  const p2 = SPINE[i + 1];
  const p3 = SPINE[Math.min(n, i + 2)];
  return [crv(p0[0], p1[0], p2[0], p3[0], t), crv(p0[1], p1[1], p2[1], p3[1], t)];
}

/** The unit normal of the spine at `s`, and its heading. */
function normal(s: number): [number, number, number] {
  const a = spine(s - 0.01);
  const b = spine(s + 0.01);
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const l = Math.hypot(dx, dy) || 1;
  return [-dy / l, dx / l, Math.atan2(dy, dx)];
}

/** The dust lane's offset from the spine. */
const meander = (s: number) => (Math.sin(s * 2.3) + 0.5 * Math.sin(s * 5.1 + 1)) * 70;

const ease = (t: number) => t * t * (3 - 2 * t);
/** 0 below a, 1 above b, smooth between. */
const smooth = (a: number, b: number, x: number) => ease(Math.max(0, Math.min(1, (x - a) / (b - a))));

const rgba = (c: Rgb, a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

/** A CSS colour as RGB, through a canvas (which resolves any colour syntax to sRGB). */
function rgbOf(colour: string): Rgb {
  const x = document.createElement("canvas").getContext("2d");
  if (!x) return [0, 0, 0];
  x.fillStyle = "#000";
  x.fillStyle = colour;
  const v = String(x.fillStyle);
  if (v.startsWith("#")) {
    const n = parseInt(v.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const m = v.match(/[\d.]+/g) ?? ["0", "0", "0"];
  return [+m[0], +m[1], +m[2]];
}

/** Adds a soft round light (a Gaussian) to a field, centred on world (x, y). */
function splat(arr: Float32Array, F: Omit<Field, "all" | "warm">, x: number, y: number, sigma: number, amp: number) {
  const gx = (x - F.x0) / F.step;
  const gy = (y - F.y0) / F.step;
  const s = sigma / F.step;
  const rad = Math.ceil(s * 2.5);
  const k = -1 / (2 * s * s);
  for (let j = Math.max(0, Math.floor(gy) - rad); j <= Math.min(F.h - 1, Math.ceil(gy) + rad); j++) {
    const dy2 = (j - gy) * (j - gy);
    for (let i = Math.max(0, Math.floor(gx) - rad); i <= Math.min(F.w - 1, Math.ceil(gx) + rad); i++) {
      arr[j * F.w + i] += amp * Math.exp(((i - gx) * (i - gx) + dy2) * k);
    }
  }
}

/** One pass of a 3 x 3 box blur. */
function blur(arr: Float32Array, w: number, h: number): Float32Array<ArrayBuffer> {
  const out = new Float32Array(arr.length);
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      let sum = 0;
      let n = 0;
      for (let dj = -1; dj <= 1; dj++) {
        const jj = j + dj;
        if (jj < 0 || jj >= h) continue;
        for (let di = -1; di <= 1; di++) {
          const ii = i + di;
          if (ii < 0 || ii >= w) continue;
          sum += arr[jj * w + ii];
          n++;
        }
      }
      out[j * w + i] = sum / n;
    }
  }
  return out;
}

/** The river, from one seed: its density field (normalised so its brightest are about 1) and its bright stars. */
export function buildRiver(): { field: Field; bright: Bright[] } {
  const r = mulberry32(207);
  const G = { x0: -1400, y0: -2400, step: 12, w: 492, h: 300 };
  let pts: Float32Array<ArrayBuffer> = new Float32Array(G.w * G.h);
  let ptsWarm: Float32Array<ArrayBuffer> = new Float32Array(G.w * G.h);
  const bright: Bright[] = [];
  const N = SPINE.length - 1;
  for (let i = 0; i < 7600; i++) {
    const s = r() < 0.3 ? 3.4 + gauss(r) * 0.55 : r() * N;
    const [x, y] = spine(s);
    const [nx, ny] = normal(s);
    const off = gauss(r) * 200;
    if (Math.abs(off - meander(s)) < 34 && r() < 0.65) continue;
    const bulge = Math.exp(-((s - 3.4) ** 2) / 0.5);
    const p = r();
    const tint = p < 0.5 * bulge ? 2 : p < 0.62 ? 0 : 1;
    const big = r();
    const sz = big < 0.84 ? 0.6 + r() * 0.5 : big < 0.98 ? 1.1 + r() * 0.5 : 1.7 + r() * 0.6;
    const a = 0.3 + r() * 0.65;
    const tw = r() < 0.3 ? 2 + r() * 5 : 0;
    const ph = r() * 6.28;
    const sx = x + nx * off + gauss(r) * 16;
    const sy = y + ny * off + gauss(r) * 16;
    const d = 0.86 + r() * 0.28;
    const gi = Math.round((sx - G.x0) / G.step);
    const gj = Math.round((sy - G.y0) / G.step);
    if (gi >= 0 && gi < G.w && gj >= 0 && gj < G.h) {
      const v = a * (0.4 + sz * 0.6);
      pts[gj * G.w + gi] += v;
      if (tint === 2) ptsWarm[gj * G.w + gi] += v;
    }
    if (sz >= 1.1) bright.push({ x: sx, y: sy, d, big: sz >= 1.7, tw, ph, tint: tint as 0 | 1 | 2 });
  }
  for (let k = 0; k < 2; k++) {
    pts = blur(pts, G.w, G.h);
    ptsWarm = blur(ptsWarm, G.w, G.h);
  }
  const all = pts;
  const warm = ptsWarm;
  for (let i = 0; i < 300; i++) {
    const s = r() < 0.3 ? 3.4 + gauss(r) * 0.6 : r() * N;
    const [x, y] = spine(s);
    const [nx, ny] = normal(s);
    const off = gauss(r) * 130;
    const bulge = Math.exp(-((s - 3.4) ** 2) / 0.6);
    const sigma = (260 + r() * 380) / 3.2;
    const amp = (0.04 + r() * 0.07) * 1.6;
    const isWarm = r() < 0.45 * bulge + 0.08;
    splat(all, G, x + nx * off, y + ny * off, sigma, amp);
    if (isWarm) splat(warm, G, x + nx * off, y + ny * off, sigma, amp);
  }
  // The dust lane darkens the river along its meander.
  for (let i = 0; i < 220; i++) {
    const s = r() * N;
    const [x, y] = spine(s);
    const [nx, ny, ang] = normal(s);
    const off = meander(s) + gauss(r) * 22;
    const cx = x + nx * off;
    const cy = y + ny * off;
    const rx = 110 + r() * 170;
    const ry = 16 + r() * 26;
    const th = ang + (r() - 0.5) * 0.25;
    const a = 0.25 + r() * 0.25;
    const cos = Math.cos(th);
    const sin = Math.sin(th);
    const rad = Math.ceil(rx / G.step) + 1;
    const gi0 = Math.round((cx - G.x0) / G.step);
    const gj0 = Math.round((cy - G.y0) / G.step);
    for (let j = Math.max(0, gj0 - rad); j <= Math.min(G.h - 1, gj0 + rad); j++) {
      for (let k = Math.max(0, gi0 - rad); k <= Math.min(G.w - 1, gi0 + rad); k++) {
        const wx = G.x0 + k * G.step - cx;
        const wy = G.y0 + j * G.step - cy;
        const u = (wx * cos + wy * sin) / rx;
        const v = (-wx * sin + wy * cos) / ry;
        const q = u * u + v * v;
        if (q > 4) continue;
        const keep = 1 - a * 1.4 * Math.exp(-q * 1.2);
        all[j * G.w + k] *= Math.max(0, keep);
        warm[j * G.w + k] *= Math.max(0, keep);
      }
    }
  }
  // Normalise: the river's 99th percentile is 1.
  const lit: number[] = [];
  for (let i = 0; i < all.length; i += 7) if (all[i] > 0.01) lit.push(all[i]);
  lit.sort((a, b) => a - b);
  const norm = lit.length ? lit[Math.floor(lit.length * 0.99)] : 1;
  for (let i = 0; i < all.length; i++) {
    all[i] /= norm;
    warm[i] /= norm;
  }
  return { field: { ...G, all, warm }, bright };
}

/** A field read at world (x, y), between its four nearest points. */
function sample(F: Field, arr: Float32Array, x: number, y: number): number {
  const gx = (x - F.x0) / F.step;
  const gy = (y - F.y0) / F.step;
  const i = Math.floor(gx);
  const j = Math.floor(gy);
  if (i < 0 || j < 0 || i >= F.w - 1 || j >= F.h - 1) return 0;
  const fx = gx - i;
  const fy = gy - j;
  const o = j * F.w + i;
  return (arr[o] * (1 - fx) + arr[o + 1] * fx) * (1 - fy) + (arr[o + F.w] * (1 - fx) + arr[o + F.w + 1] * fx) * fy;
}

/**
 * The chart on `canvas`, or null where the browser gives no 2D context (the page then shows the night slab and its
 * words without the drawing).
 */
export function createChart({ stage, canvas, plates, veils = () => [], stopName }: ChartOptions): Chart | null {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const cs = getComputedStyle(stage);
  const token = (name: string) => rgbOf(cs.getPropertyValue(name).trim());
  const COL: Colours = {
    star: token("--c-star"),
    cool: token("--c-star-cool"),
    warm: token("--c-star-warm"),
    jade: token("--c-primary"),
    jade2: token("--c-primary-strong"),
    ink: token("--s1-ink"),
    ink2: token("--s1-ink-2"),
  };
  const MONO = cs.getPropertyValue("--s1-font-mono").trim() || "monospace";
  const { field: FIELD, bright: BRIGHT } = buildRiver();
  const TINTS = [COL.star, COL.cool, COL.warm] as const;
  const notes = new Map<string, Note>(
    [...stage.querySelectorAll<HTMLElement>("[data-note]")].map((el) => [el.dataset.note!, { el, w: 0, h: 0, on: false }]),
  );

  let W = 1;
  let H = 1;
  let dpr = 1;
  let plateRight = 0;
  // The grid: the font size, a cell's width and height, and how many cells.
  let FS = 12;
  let CW = 7.2;
  let CH = 16;
  let COLS = 1;
  let ROWS = 1;
  let mask = new Uint8Array(1);
  // The slab's bar and ruler: rows the river leaves empty, so their words read.
  let topRows = 0;
  /** The first row under the ruler's top: rows from it down are the ruler's. */
  let endRow = 1;
  /** The bar's and the ruler's boxes (CSS px), which no note may cover. */
  let chrome: number[][] = [];
  let placed: Placed[] = [];
  let marks: Mark[] = [];

  /** The camera for a stop: the whole river at the start, then each product in close-up, set right of the words. */
  function view(k: number) {
    const mob = W < 900;
    if (k === 0) {
      const a = SPINE[2];
      const b = SPINE[5];
      const dx = b[0] - a[0];
      const dy = Math.abs(b[1] - a[1]);
      const z = Math.min(((mob ? 0.66 : 0.44) * W) / dx, ((mob ? 0.3 : 0.56) * H) / dy);
      const tx = mob ? 0.5 * W : 0.69 * W;
      const ty = mob ? 0.27 * H : 0.5 * H;
      return { cx: (a[0] + b[0]) / 2 - (tx - W / 2) / z, cy: (a[1] + b[1]) / 2 - (ty - H / 2) / z, z };
    }
    const g = SPINE[k + 1];
    // On a computer the product sits in the open sky right of the words' plate, scaled to the room it has.
    const room = mob ? W : W - plateRight;
    const z = mob ? Math.min(0.8, W / 530) : Math.max(0.68, Math.min(1, room / 700));
    const tx = mob ? 0.5 * W : plateRight + room * 0.5;
    const ty = mob ? 0.2 * H : 0.48 * H;
    return { cx: g[0] - (tx - W / 2) / z, cy: g[1] - (ty - H / 2) / z, z };
  }

  function camera(p: number) {
    const i = Math.min(STOP_COUNT - 2, Math.floor(p));
    const e = ease(p - i);
    const a = view(i);
    const b = view(i + 1);
    let z = a.z + (b.z - a.z) * e;
    if (i >= 1) z *= 1 - 0.2 * Math.sin(Math.PI * e);
    return { cx: a.cx + (b.cx - a.cx) * e, cy: a.cy + (b.cy - a.cy) * e, z };
  }

  const cellOf = (x: number, y: number): [number, number] => [Math.floor(x / CW), Math.floor(y / CH)];
  const inGrid = (c: number, r: number) => c >= 0 && r >= 0 && c < COLS && r < ROWS;
  /** Clears the river from a block of cells round (c, r), so a constellation reads on clear sky. */
  function clear(c: number, r: number, rc: number, rr: number) {
    for (let j = r - rr; j <= r + rr; j++) for (let i = c - rc; i <= c + rc; i++) if (inGrid(i, j)) mask[j * COLS + i] = 1;
  }
  /** A character at a point; the river leaves its cell empty. Nothing is set on the bar's or the ruler's rows. */
  function mark(x: number, y: number, g: string, col: Rgb, a: number, big = false, stroke = false) {
    const [c, r] = cellOf(x, y);
    if (!inGrid(c, r) || r < topRows || r >= endRow) return;
    mask[r * COLS + c] = 1;
    marks.push({ x, y, g, col, a, big, stroke });
  }
  /**
   * A line between two points as a star atlas draws one, a dotted line: a `.` every `gap` px along it, off the stars
   * at its ends, the river cleared round it.
   */
  function line(a: Pt, b: Pt, col: Rgb, alpha: number, gap = 6) {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const n = Math.floor(len / gap);
    const keep = Math.min(0.45, (CW * 1.1) / Math.max(1, len));
    for (let k = 1; k < n; k++) {
      const u = k / n;
      if (u < keep || u > 1 - keep) continue;
      const x = a[0] + (b[0] - a[0]) * u;
      const y = a[1] + (b[1] - a[1]) * u;
      const [c, r] = cellOf(x, y);
      clear(c, r, 1, 0);
      mark(x, y, ".", col, alpha, false, true);
    }
  }
  /** A star of a constellation at its point, its glyph by brightness, a size larger, on clear sky. */
  function star(at: Pt, mag: 0 | 1 | 2, col: Rgb) {
    const [c, r] = cellOf(at[0], at[1]);
    clear(c, r, mag === 2 ? 2 : 1, mag === 2 ? 1 : 0);
    mark(at[0], at[1], mag === 2 ? "@" : mag === 1 ? "*" : "+", col, mag === 0 ? 0.7 : 1, mag > 0);
  }
  /** A jade `o` a share `u` of the way from a to b; never on a star at either end (nor still on one under reduced motion). */
  function runner(a: Pt, b: Pt, u: number) {
    if (u < 0.1 || u > 0.9) return;
    mark(a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, "o", COL.jade2, 1, true);
  }
  const place = (id: string, x: number, y: number, side: Side, alpha: number, alt?: { x: number; y: number }) => placed.push({ id, x, y, side, alpha, alt });

  /** A constellation at screen point P, the camera at zoom z; f is how near its stop the reader is (notes show from 0.3). */
  function figure(k: number, P: Pt, z: number, t: number, f: number) {
    const fig = FIGURES[k - 1];
    const fz = z * (W < 900 ? (fig.compact ?? 1) : 1);
    const pos = fig.stars.map((s): Pt => [P[0] + s.x * fz, P[1] + s.y * fz]);
    const active = MODEL_STARS[Math.floor(t / 2.4) % MODEL_STARS.length];
    // The lines first, in the stars' ink; the Model API's lit route in jade.
    fig.lines.forEach(([i, j]) => {
      const lit = k === 3 && ((i === 0 && j === 1) || (i === 1 && j === active));
      line(pos[i], pos[j], lit ? COL.jade : COL.star, lit ? 1 : 0.7, lit ? 4.5 : 6);
    });
    fig.stars.forEach((s, i) => star(pos[i], s.mag, s.warm ? COL.warm : s.mag === 0 ? COL.ink2 : COL.star));
    // What moves along the lines.
    if (k === 1) {
      const arm = 1 + (Math.floor(t / 1.6) % 3);
      runner(pos[0], pos[arm], (t % 1.6) / 1.6);
    } else if (k === 2) {
      const [i, j] = fig.lines[Math.floor(t / 1.2) % fig.lines.length];
      runner(pos[i], pos[j], (t % 1.2) / 1.2);
    } else if (k === 3) {
      const ph = (t % 2.4) / 2.4;
      if (ph < 0.45) runner(pos[0], pos[1], ph / 0.45);
      else runner(pos[1], pos[active], (ph - 0.45) / 0.55);
    } else {
      const tie = 1 + (Math.floor(t / 1.4) % 3);
      runner(pos[0], pos[tie], (t % 1.4) / 1.4);
    }
    if (f <= 0.3) return;
    fig.stars.forEach((s, i) => {
      const id = s.note ?? (k === 3 && i === active ? "api.model" : null);
      if (!id) return;
      const [x, y] = pos[i];
      // As an atlas names a star: just above it, away from the figure's middle (a hub's name under it, to the right).
      // When that place is taken, the other side of the star (above for a hub, below for the others).
      const nx = s.x < 0 ? x - CW : x + CW;
      const side = s.x < 0 ? "l" : "r";
      if (s.x === 0) place(id, nx, y + CH * 1.6, side, f, { x: nx, y: y - CH * 1.6 });
      else place(id, nx, y - CH * 1.1, side, f, { x: nx, y: y + CH * 1.4 });
    });
  }

  /**
   * Set the notes collected this frame, in order; one that would cover a plate or a note already set waits. Returns
   * the boxes of the notes shown, in CSS px, so the sky under them is left clear.
   */
  function setNotes(): number[][] {
    const shown: number[][] = [];
    const sr = stage.getBoundingClientRect();
    const boxes = [
      ...chrome,
      ...plates()
        .map((pl) => {
          const b = pl.getBoundingClientRect();
          return [b.left - sr.left - 8, b.top - sr.top - 8, b.right - sr.left + 8, b.bottom - sr.top + 8];
        })
        .filter((b) => b[3] > 0 && b[1] < H),
    ];
    const free = (box: number[]) =>
      box[0] >= 0 && box[2] <= W && box[1] >= 0 && box[3] <= H && !boxes.some((b) => box[0] < b[2] && b[0] < box[2] && box[1] < b[3] && b[1] < box[3]);
    for (const n of notes.values()) n.on = false;
    for (const n of placed) {
      const note = notes.get(n.id);
      const opacity = Math.max(0, Math.min(1, (n.alpha - 0.35) / 0.4));
      // A note that would not show reserves nothing: no hole in the sky, no place taken from another.
      if (!note || opacity < 0.01) continue;
      if (!note.w) {
        note.w = note.el.offsetWidth;
        note.h = note.el.offsetHeight;
      }
      const at = [n, ...(n.alt ? [n.alt] : [])].map(({ x: ax, y: ay }) => {
        const x = n.side === "r" ? ax : ax - note.w;
        const y = ay - note.h / 2;
        // A cell of clear sky round the words.
        return { x, y, box: [x - CW, y - CH * 0.5, x + note.w + CW, y + note.h + CH * 0.5] };
      });
      const spot = at.find((a) => free(a.box));
      if (!spot) continue;
      boxes.push(spot.box);
      shown.push(spot.box);
      note.on = true;
      note.el.dataset.side = n.side;
      note.el.style.transform = `translate(${spot.x.toFixed(1)}px, ${spot.y.toFixed(1)}px)`;
      note.el.style.opacity = opacity.toFixed(3);
    }
    for (const n of notes.values()) if (!n.on) n.el.style.opacity = "0";
    return shown;
  }

  function draw(p: number, t: number) {
    const cam = camera(p);
    const proj = (x: number, y: number, d = 1): Pt => [W / 2 + (x - cam.cx) * cam.z * d, H / 2 + (y - cam.cy) * cam.z * d];
    const c = ctx!;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, W, H);
    mask.fill(0);
    marks = [];
    placed = [];

    // Where the products are on screen: their constellations get clear sky, and the route stops short of them.
    const centres = [1, 2, 3, 4].map((k) => proj(SPINE[k + 1][0], SPINE[k + 1][1]));
    const inSky = (x: number, y: number, radius: number) => centres.some((P) => Math.hypot(x - P[0], y - P[1]) < radius);

    // The route along the river: dotted ahead, jade where the camera has been.
    const sNow = 1 + Math.max(0, p);
    // A dot every few px along the spine, jade and close where the camera has been, faint and sparse ahead.
    let prevPt: Pt | null = null;
    let run = 0;
    for (let k = 0; k <= 400; k++) {
      const s = 1 + (k / 400) * 4;
      const pt = proj(...spine(s));
      if (prevPt) run += Math.hypot(pt[0] - prevPt[0], pt[1] - prevPt[1]);
      prevPt = pt;
      const gone = s <= sNow;
      if (run < (gone ? 5 : 11)) continue;
      run = 0;
      if (inSky(pt[0], pt[1], 205 * cam.z)) continue;
      mark(pt[0], pt[1], ".", gone ? COL.jade : COL.star, gone ? 0.95 : 0.45, false, true);
    }

    // The constellations, and seen from afar each stop's number and name under it.
    const far = cam.z < 0.55;
    const labels: { x: number; r: number; k: number }[] = [];
    ctx!.font = `500 ${FS}px ${MONO}`;
    const skies: Pt[] = [];
    for (let k = 1; k < STOP_COUNT; k++) {
      const P = proj(SPINE[k + 1][0], SPINE[k + 1][1]);
      if (P[0] < -320 || P[0] > W + 320 || P[1] < -320 || P[1] > H + 320) continue;
      skies.push(P);
      const f = Math.max(0, Math.min(1, 1 - Math.abs(p - k) * 1.6));
      figure(k, P, cam.z, t, f);
      if (far) {
        // Its number and name under it, kept inside the page's 16 px gutters and off the bar's and ruler's rows.
        const text = `0${k} ${stopName(k)}`;
        const width = ctx!.measureText(text).width + CW;
        const x = Math.max(16, Math.min(W - 16 - width, P[0] - CW));
        const lr = Math.floor((P[1] + Math.max(140 * cam.z, 18) + CH * 1.2) / CH);
        if (lr >= topRows && lr < endRow) {
          labels.push({ x, r: lr, k });
          for (let cc = Math.floor(x / CW) - 1; cc <= Math.ceil((x + width) / CW); cc++) clear(cc, lr, 0, 0);
        }
      }
    }

    // The hero's words: no river under them, the river thinning out over 60 px round them.
    const sr = stage.getBoundingClientRect();
    const veiled = veils()
      .map((el) => el.getBoundingClientRect())
      .filter((b) => b.bottom > sr.top && b.top < sr.bottom)
      .map((b) => [b.left - sr.left - 8, b.top - sr.top - 6, b.right - sr.left + 8, b.bottom - sr.top + 6]);
    const veil = (x: number, y: number) => {
      let k = 1;
      for (const [x0, y0, x1, y1] of veiled) k = Math.min(k, smooth(0, 60, Math.hypot(Math.max(x0 - x, 0, x - x1), Math.max(y0 - y, 0, y - y1))));
      return k;
    };

    // The names shown: the sky under each is clear, and a line or the route breaks round it (its stars stay).
    for (const [x0, y0, x1, y1] of setNotes()) {
      const c0 = Math.floor(x0 / CW);
      const c1 = Math.floor(x1 / CW);
      const r0 = Math.floor(y0 / CH);
      const r1 = Math.floor(y1 / CH);
      for (let r = r0; r <= r1; r++) for (let cc = c0; cc <= c1; cc++) if (inGrid(cc, r)) mask[r * COLS + cc] = 1;
      marks = marks.filter((m) => !m.stroke || m.x < x0 || m.x > x1 || m.y < y0 || m.y > y1);
    }

    // The river: each cell's density as a glyph, in three tints, a row at a time. Close to a constellation the river
    // steps back: fainter overall, and a clear sky round each figure, soft-edged, as a star atlas draws one.
    const gain = 1 - 0.5 * smooth(0.45, 0.8, cam.z);
    const skyIn = Math.max(205 * cam.z, 30);
    const skyOut = Math.max(290 * cam.z, 54);
    const skyRing = skyOut * 1.7;
    const rows: number[][][] = [[], [], []];
    const spark = new Map<number, [string, number]>();
    for (const b of BRIGHT) {
      const [x, y] = proj(b.x, b.y, b.d);
      if (x < 0 || y < 0 || x >= W || y >= H) continue;
      if (skies.some((P) => Math.hypot(x - P[0], y - P[1]) < skyOut) || (veiled.length && veil(x, y) < 0.5)) continue;
      const [cc, rr] = cellOf(x, y);
      const on = b.tw ? Math.sin((t / b.tw) * 6.283 + b.ph) : 1;
      const g = on > 0.55 ? (b.big ? "*" : "+") : on > -0.35 ? "+" : ".";
      spark.set(rr * COLS + cc, [g, b.tint]);
    }
    const ox = Math.floor((cam.cx * 0.04) / CW);
    const oy = Math.floor((cam.cy * 0.04) / CH);
    for (let r = 0; r < ROWS; r++) {
      if (r < topRows || r >= endRow) {
        rows[0].push([]);
        rows[1].push([]);
        rows[2].push([]);
        continue;
      }
      const line0 = new Array<number>(COLS).fill(32);
      const line1 = new Array<number>(COLS).fill(32);
      const line2 = new Array<number>(COLS).fill(32);
      const wy = cam.cy + ((r + 0.5) * CH - H / 2) / cam.z;
      for (let col = 0; col < COLS; col++) {
        const at = r * COLS + col;
        if (mask[at]) continue;
        const sp = spark.get(at);
        if (sp) {
          (sp[1] === 2 ? line2 : sp[1] === 1 ? line1 : line0)[col] = sp[0].charCodeAt(0);
          continue;
        }
        const wx = cam.cx + ((col + 0.5) * CW - W / 2) / cam.z;
        const all = sample(FIELD, FIELD.all, wx, wy);
        const h = hash(col, r);
        let clearSky = veiled.length ? veil((col + 0.5) * CW, (r + 0.5) * CH) : 1;
        for (const P of skies) {
          // A ragged edge (each cell's own share of the radius), so the clearing is no disc, and a dimmer ring round it.
          const d = Math.hypot((col + 0.5) * CW - P[0], (r + 0.5) * CH - P[1]) * (0.88 + 0.24 * h);
          if (d < skyRing) clearSky = Math.min(clearSky, smooth(skyIn, skyOut, d) * (0.55 + 0.45 * smooth(skyOut, skyRing, d)));
        }
        let g = " ";
        if (all > 0.04 && clearSky > 0) {
          const tw = 1 + 0.1 * Math.sin(t * 0.8 + h * 6.283);
          g = glyphOf(all * tw * gain * clearSky);
        }
        if (g === " ") {
          // A far star now and then on the empty sky, drifting a little with the camera.
          if (clearSky > 0.5 && hash(col + ox, r + oy) < 0.012) line1[col] = 46;
          continue;
        }
        const warm = sample(FIELD, FIELD.warm, wx, wy) / all;
        (warm > 0.42 ? line2 : h < 0.35 ? line1 : line0)[col] = g.charCodeAt(0);
      }
      const lit = (line: number[]) => (line.some((code) => code !== 32) ? line : []);
      rows[0].push(lit(line0));
      rows[1].push(lit(line1));
      rows[2].push(lit(line2));
    }
    c.font = `500 ${FS}px ${MONO}`;
    c.textAlign = "left";
    c.textBaseline = "middle";
    rows.forEach((layer, i) => {
      c.fillStyle = rgba(TINTS[i], 0.62 + 0.28 * gain);
      layer.forEach((codes, r) => codes.length && c.fillText(String.fromCharCode(...codes), 0, (r + 0.5) * CH));
    });

    // Over the river: the route, the constellations' lines, stars and runners, then the stops' names from afar.
    c.textAlign = "center";
    for (const m of marks) {
      c.font = m.big ? `700 ${Math.round(FS * 1.35)}px ${MONO}` : `500 ${FS}px ${MONO}`;
      c.fillStyle = rgba(m.col, m.a);
      // A dot sits on the line itself, not on the text's baseline below it.
      c.fillText(m.g, m.x, m.g === "." ? m.y - FS * 0.3 : m.y);
    }
    c.textAlign = "left";
    c.font = `500 ${FS}px ${MONO}`;
    for (const l of labels) {
      c.fillStyle = rgba(COL.jade2, 1);
      c.fillText(`0${l.k}`, l.x, (l.r + 0.5) * CH);
      c.fillStyle = rgba(COL.ink2, 1);
      c.fillText(stopName(l.k), l.x + 3 * CW, (l.r + 0.5) * CH);
    }
  }

  function measure() {
    FS = W < 600 ? 11 : 12;
    CH = Math.round(FS * 1.34);
    ctx!.font = `500 ${FS}px ${MONO}`;
    CW = ctx!.measureText("M").width || FS * 0.6;
    COLS = Math.ceil(W / CW);
    ROWS = Math.ceil(H / CH);
    mask = new Uint8Array(COLS * ROWS);
    const sr = stage.getBoundingClientRect();
    const bar = stage.querySelector<HTMLElement>(".j__bar")?.getBoundingClientRect();
    const ruler = stage.querySelector<HTMLElement>(".j__ruler")?.getBoundingClientRect();
    const barBottom = bar ? bar.bottom - sr.top : 0;
    const rulerTop = ruler ? ruler.top - sr.top : H;
    // The grid starts at the stage's top: a row is the bar's if any of it is above the bar's foot, the ruler's if any
    // of it is below the ruler's top.
    topRows = Math.max(0, Math.ceil((barBottom + 2) / CH));
    endRow = Math.min(ROWS, Math.floor((rulerTop - 2) / CH));
    chrome = [
      [0, 0, W, barBottom + 2],
      [0, rulerTop - 2, W, H],
    ];
  }

  function resize() {
    const r = stage.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = Math.max(1, Math.round(r.width));
    H = Math.max(1, Math.round(r.height));
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    const plate = plates()[0];
    plateRight = plate ? plate.getBoundingClientRect().right - r.left + 24 : W * 0.4;
    // Where the sky beside the plate is narrow (a phone, or under 600 px on a smaller laptop), the names go without
    // the line under them (the stylesheet reads data-narrow), so every star keeps its name.
    stage.toggleAttribute("data-narrow", W < 900 || W - plateRight < 600);
    remeasure();
  }

  function remeasure() {
    measure();
    for (const n of notes.values()) n.w = n.h = 0;
  }

  resize();
  return { resize, remeasure, draw };
}

/** A frame every this many ms when only the time moves (30 a second). */
export const TICK_MS = 1000 / 30;

/**
 * When the next time-only frame is due, after a draw at `now`. After a time-only draw it is a tick after the one that
 * was due (a 60 Hz screen draws every other frame, and a late frame does not push the next back); after a draw for the
 * camera or the stage, a tick from now, so a long scroll never pushes it ahead of the clock.
 */
export function nextDue(due: number, now: number, timeOnly: boolean): number {
  return timeOnly && now - due < TICK_MS * 2 ? due + TICK_MS : now + TICK_MS;
}

/**
 * Where the reader is, 0 to STOP_COUNT - 1, from the steps' tops and the line under the head: piecewise, a step at a
 * time, so a step taller than the screen (a long plate on a phone) still lands on its own product.
 */
export function scrollStop(tops: readonly number[], line: number): number {
  if (!tops.length || line <= tops[0]) return 0;
  for (let i = 0; i < tops.length - 1; i++) {
    if (line < tops[i + 1]) return i + (line - tops[i]) / Math.max(1, tops[i + 1] - tops[i]);
  }
  return tops.length - 1;
}
