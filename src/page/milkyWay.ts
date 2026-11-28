/**
 * The homepage's chart of the Milky Way (./Journey.tsx), drawn on a canvas: a river of about 7,600 seeded stars along a
 * spine, with its glow and dust lane, and four products at points along it, each drawn as an engraved plate would
 * annotate it: Aha (a jade planet with its ring and a moon), Bots (six moons on their orbits, one bringing back a
 * report), the Model API (a key, the gateway and four model stars, one route lit) and the balance (one warm star tied to
 * Aha, Bots and the API). A route runs along the river, dashed ahead and jade where the camera has been.
 *
 * `p` is where the reader is, 0 (the start, the whole river) to 4 (the last product), fractional between stops; the
 * camera moves from one stop's view to the next and dips out a little between products. `t` is the time in seconds,
 * which moves the moons, the request and the twinkle (it stands still when paused or under reduced motion).
 *
 * The products' notes are HTML (the page's own type, in its language) that the chart sets on the canvas each frame: a
 * note that would cover a plate of words, or a note already set, waits until there is room. Every colour comes from the
 * theme's tokens on the stage (the three star tokens, the cosmos, the jade and the ink), so the drawing follows them.
 */

export const STOP_COUNT = 5;

type Rgb = readonly [number, number, number];
type Pt = readonly [number, number];
type Side = "l" | "r";

interface Colours {
  star: Rgb;
  cool: Rgb;
  warm: Rgb;
  cosmos: Rgb;
  jade: Rgb;
  jade2: Rgb;
  ink: Rgb;
  ink2: Rgb;
}

interface Star {
  x: number;
  y: number;
  d: number;
  col: number;
  sz: number;
  a: number;
  tw: number;
  ph: number;
}

interface World {
  stars: Star[];
  glows: { x: number; y: number; sz: number; sp: "warm" | "cool"; a: number }[];
  dust: { x: number; y: number; rx: number; ry: number; ang: number; a: number }[];
  deep: { fx: number; fy: number; sz: number; a: number; col: number; tw: number; ph: number }[];
}

interface Placed {
  id: string;
  x: number;
  y: number;
  side: Side;
  alpha: number;
}

/** A note the chart places: its element, and its size once measured (reset when the type or the screen changes). */
interface Note {
  el: HTMLElement;
  w: number;
  h: number;
  on: boolean;
}

export interface ChartOptions {
  stage: HTMLElement;
  canvas: HTMLCanvasElement;
  /** The plates of words over the chart, which no note may cover. */
  plates: () => HTMLElement[];
  /** A stop's name in the page's language, written under it when the chart is seen from afar. */
  stopName: (k: number) => string;
}

export interface Chart {
  /** Measure the stage again (a new size, a new plate width). */
  resize(): void;
  /** The notes' type changed (the web fonts arrived): measure them again on the next draw. */
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

const rgba = (c: Rgb, a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

/** A CSS colour as RGB, through a canvas (which resolves any colour syntax). */
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

/** A soft round glow of one colour, drawn once and stamped many times. */
function sprite(c: Rgb, size = 128): HTMLCanvasElement {
  const s = document.createElement("canvas");
  s.width = s.height = size;
  const g = s.getContext("2d");
  if (!g) return s;
  const gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gr.addColorStop(0, rgba(c, 1));
  gr.addColorStop(0.25, rgba(c, 0.45));
  gr.addColorStop(0.6, rgba(c, 0.1));
  gr.addColorStop(1, rgba(c, 0));
  g.fillStyle = gr;
  g.fillRect(0, 0, size, size);
  return s;
}

/** The river's stars, glows, dust and the far stars behind it, from one seed. */
function buildWorld(): World {
  const r = mulberry32(207);
  const world: World = { stars: [], glows: [], dust: [], deep: [] };
  const N = SPINE.length - 1;
  for (let i = 0; i < 7600; i++) {
    const s = r() < 0.3 ? 3.4 + gauss(r) * 0.55 : r() * N;
    const [x, y] = spine(s);
    const [nx, ny] = normal(s);
    const off = gauss(r) * 200;
    if (Math.abs(off - meander(s)) < 34 && r() < 0.65) continue;
    const bulge = Math.exp(-((s - 3.4) ** 2) / 0.5);
    const p = r();
    const col = p < 0.5 * bulge ? 2 : p < 0.62 ? 0 : p < 0.97 ? 1 : 3;
    const big = r();
    world.stars.push({
      x: x + nx * off + gauss(r) * 16,
      y: y + ny * off + gauss(r) * 16,
      d: 0.86 + r() * 0.28,
      col,
      sz: big < 0.84 ? 0.6 + r() * 0.5 : big < 0.98 ? 1.1 + r() * 0.5 : 1.7 + r() * 0.6,
      a: 0.3 + r() * 0.65,
      tw: r() < 0.3 ? 2 + r() * 5 : 0,
      ph: r() * 6.28,
    });
  }
  for (let i = 0; i < 300; i++) {
    const s = r() < 0.3 ? 3.4 + gauss(r) * 0.6 : r() * N;
    const [x, y] = spine(s);
    const [nx, ny] = normal(s);
    const off = gauss(r) * 130;
    const bulge = Math.exp(-((s - 3.4) ** 2) / 0.6);
    world.glows.push({ x: x + nx * off, y: y + ny * off, sz: 260 + r() * 380, sp: r() < 0.45 * bulge + 0.08 ? "warm" : "cool", a: 0.04 + r() * 0.07 });
  }
  for (let i = 0; i < 220; i++) {
    const s = r() * N;
    const [x, y] = spine(s);
    const [nx, ny, ang] = normal(s);
    const off = meander(s) + gauss(r) * 22;
    world.dust.push({ x: x + nx * off, y: y + ny * off, rx: 110 + r() * 170, ry: 16 + r() * 26, ang: ang + (r() - 0.5) * 0.25, a: 0.25 + r() * 0.25 });
  }
  for (let i = 0; i < 260; i++) world.deep.push({ fx: r(), fy: r(), sz: 0.4 + r() * 0.8, a: 0.2 + r() * 0.5, col: r() < 0.75 ? 0 : 1, tw: 2 + r() * 6, ph: r() * 6.28 });
  return world;
}

const BOT_SPEED = [0.5, 0.36, 0.28, 0.22, 0.18, 0.15];
const MODELS: readonly Pt[] = [
  [118, -96],
  [150, -26],
  [138, 48],
  [96, 116],
];
const TIES: readonly (readonly [number, string])[] = [
  [-2.5, "bal.0"],
  [-0.75, "bal.1"],
  [1.05, "bal.2"],
];

/**
 * The chart on `canvas`, or null where the browser gives no 2D context (the page then shows the night slab and its
 * words without the drawing).
 */
export function createChart({ stage, canvas, plates, stopName }: ChartOptions): Chart | null {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const cs = getComputedStyle(stage);
  const token = (name: string) => rgbOf(cs.getPropertyValue(name).trim());
  const COL: Colours = {
    star: token("--c-star"),
    cool: token("--c-star-cool"),
    warm: token("--c-star-warm"),
    cosmos: token("--c-cosmos"),
    jade: token("--c-primary"),
    jade2: token("--c-primary-strong"),
    ink: token("--s1-ink"),
    ink2: token("--s1-ink-2"),
  };
  const MONO = cs.getPropertyValue("--s1-font-mono").trim() || "monospace";
  const SPR = { cool: sprite(COL.cool), warm: sprite(COL.warm), star: sprite(COL.star, 64), dark: sprite(COL.cosmos) };
  const WORLD = buildWorld();
  const notes = new Map<string, Note>(
    [...stage.querySelectorAll<HTMLElement>("[data-note]")].map((el) => [el.dataset.note!, { el, w: 0, h: 0, on: false }]),
  );

  let W = 1;
  let H = 1;
  let dpr = 1;
  let plateRight = 0;
  let placed: Placed[] = [];

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
    const z = mob ? Math.min(0.85, W / 470) : Math.max(0.68, Math.min(1, room / 700));
    const tx = mob ? 0.5 * W : plateRight + room * 0.5;
    const ty = mob ? 0.22 * H : 0.48 * H;
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

  /* Drawing helpers in screen space: the kit's "+", a hairline leader, a filled dot, a ring. */
  function plus(x: number, y: number, s: number, c: Rgb, a: number) {
    ctx!.fillStyle = rgba(c, a);
    ctx!.fillRect(x - 0.5, y - s, 1, s * 2);
    ctx!.fillRect(x - s, y - 0.5, s * 2, 1);
  }
  function leader(x: number, y: number, len: number, side: Side, c: Rgb, a: number) {
    ctx!.fillStyle = rgba(c, a);
    ctx!.fillRect(x - 0.5, y - len, 1, len);
    ctx!.fillRect(side === "r" ? x : x - 7, y - len, 7, 1);
  }
  function dot(x: number, y: number, r: number, fill: string) {
    ctx!.fillStyle = fill;
    ctx!.beginPath();
    ctx!.arc(x, y, r, 0, 6.283);
    ctx!.fill();
  }
  function ring(x: number, y: number, r: number, stroke: string) {
    ctx!.strokeStyle = stroke;
    ctx!.beginPath();
    ctx!.arc(x, y, r, 0, 6.283);
    ctx!.stroke();
  }
  const place = (id: string, x: number, y: number, side: Side, alpha: number) => placed.push({ id, x, y, side, alpha });

  function drawAha(P: Pt, z: number, t: number, f: number) {
    const R = 44 * z;
    const rx = 104 * z;
    const ry = 30 * z;
    const rot = -0.36;
    const arc = (from: number, to: number, w: number, a: number) => {
      ctx!.save();
      ctx!.translate(P[0], P[1]);
      ctx!.rotate(rot);
      ctx!.strokeStyle = rgba(COL.jade2, a);
      ctx!.lineWidth = w;
      ctx!.beginPath();
      ctx!.ellipse(0, 0, rx, ry, 0, from, to);
      ctx!.stroke();
      ctx!.restore();
    };
    const onRing = (th: number): Pt => {
      const x0 = Math.cos(th) * rx;
      const y0 = Math.sin(th) * ry;
      return [P[0] + x0 * Math.cos(rot) - y0 * Math.sin(rot), P[1] + x0 * Math.sin(rot) + y0 * Math.cos(rot)];
    };
    const mth = 4.0 + t * 0.22;
    const mpos = onRing(mth);
    const moonFront = Math.sin(mth) > 0;
    const moon = () => dot(mpos[0], mpos[1], Math.max(1.5, 6.5 * z), rgba(COL.star, 0.95));
    arc(Math.PI, 2 * Math.PI, Math.max(1, 1.5 * z), 0.55);
    if (!moonFront) moon();
    const gr = ctx!.createRadialGradient(P[0] - R * 0.38, P[1] - R * 0.42, R * 0.1, P[0], P[1], R);
    gr.addColorStop(0, rgba(COL.jade2, 1));
    gr.addColorStop(0.55, rgba(COL.jade, 1));
    gr.addColorStop(1, rgba(COL.cosmos, 1));
    ctx!.fillStyle = gr;
    ctx!.beginPath();
    ctx!.arc(P[0], P[1], R, 0, 6.283);
    ctx!.fill();
    arc(0, Math.PI, Math.max(1, 1.6 * z), 0.9);
    if (moonFront) moon();
    if (f <= 0.3) return;
    const pts: readonly (readonly [string, number, Side, number])[] = [
      ["aha.chat", 3.35, "l", 70],
      ["aha.latex", 5.75, "r", 64],
      ["aha.work", 1.35, "r", -1],
    ];
    for (const [id, th, side, lead] of pts) {
      const [x, y] = onRing(th);
      plus(x, y, 5, COL.ink, 0.9 * f);
      if (lead > 0) {
        const L = lead * Math.max(0.7, z);
        leader(x, y, L, side, COL.ink, 0.4 * f);
        place(id, x, y - L, side, f);
      } else {
        // A note under the ring: the hairline goes down to it.
        ctx!.fillStyle = rgba(COL.ink, 0.4 * f);
        ctx!.fillRect(x - 0.5, y, 1, 40);
        ctx!.fillRect(x, y + 40, 7, 1);
        place(id, x, y + 40, side, f);
      }
    }
  }

  function drawBots(P: Pt, z: number, t: number, f: number) {
    const rot = -0.22;
    const cr = Math.cos(rot);
    const sr = Math.sin(rot);
    ctx!.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      const rx = (48 + i * 24) * z;
      const ry = rx * 0.42;
      ctx!.save();
      ctx!.translate(P[0], P[1]);
      ctx!.rotate(rot);
      ctx!.strokeStyle = rgba(COL.star, 0.3);
      ctx!.setLineDash([2.5, 3.5]);
      ctx!.beginPath();
      ctx!.ellipse(0, 0, rx, ry, 0, Math.PI, 2 * Math.PI);
      ctx!.stroke();
      ctx!.setLineDash([]);
      ctx!.strokeStyle = rgba(COL.star, 0.42);
      ctx!.beginPath();
      ctx!.ellipse(0, 0, rx, ry, 0, 0, Math.PI);
      ctx!.stroke();
      ctx!.restore();
    }
    dot(P[0], P[1], Math.max(2, 13 * z), rgba(COL.star, 1));
    ring(P[0], P[1], Math.max(4, 22 * z), rgba(COL.star, 0.5));
    // One moon at a time brings a report back to the planet.
    const report = Math.floor(t / 1.6) % 6;
    const rp = (t % 1.6) / 1.6;
    for (let i = 0; i < 6; i++) {
      const rx = (48 + i * 24) * z;
      const ry = rx * 0.42;
      const th = i * 1.05 + 0.4 + t * BOT_SPEED[i] * 0.5;
      const x0 = Math.cos(th) * rx;
      const y0 = Math.sin(th) * ry;
      const x = P[0] + x0 * cr - y0 * sr;
      const y = P[1] + x0 * sr + y0 * cr;
      dot(x, y, Math.max(1.4, (3 + (i % 3)) * z), rgba(COL.star, Math.sin(th) > 0 ? 1 : 0.6));
      if (i === report) dot(x + (P[0] - x) * rp, y + (P[1] - y) * rp, Math.max(1.5, 2.6 * z), rgba(COL.jade, 1 - rp * 0.4));
      if (f > 0.3) place(`bots.${i}`, x + (x >= P[0] ? 10 : -10), y + 9, x >= P[0] ? "r" : "l", f);
    }
  }

  function drawApi(P: Pt, z: number, t: number, f: number) {
    const key: Pt = [P[0] - 128 * z, P[1] + 18 * z];
    const act = Math.floor(t / 2.4) % 4;
    const ph = (t % 2.4) / 2.4;
    const model = (i: number): Pt => [P[0] + MODELS[i][0] * z, P[1] + MODELS[i][1] * z];
    const bend = (i: number): Pt => [P[0] + MODELS[i][0] * z * 0.45, P[1]];
    ctx!.lineWidth = 1;
    ctx!.strokeStyle = rgba(COL.star, 0.38);
    ctx!.beginPath();
    ctx!.moveTo(key[0], key[1]);
    ctx!.lineTo(P[0], P[1]);
    ctx!.stroke();
    MODELS.forEach((_, i) => {
      const m = model(i);
      const c = bend(i);
      ctx!.strokeStyle = i === act ? rgba(COL.jade, 0.95) : rgba(COL.star, 0.26);
      ctx!.lineWidth = i === act ? 1.4 : 1;
      ctx!.beginPath();
      ctx!.moveTo(P[0], P[1]);
      ctx!.quadraticCurveTo(c[0], c[1], m[0], m[1]);
      ctx!.stroke();
      dot(m[0], m[1], Math.max(1.6, 4.2 * z), rgba(COL.star, 0.95));
      ctx!.lineWidth = 1;
      ring(m[0], m[1], Math.max(3.5, 9 * z), i === act ? rgba(COL.jade, 1) : rgba(COL.star, 0.45));
      if (i === act && f > 0.3) place("api.model", m[0] + 14, m[1], "r", f);
    });
    // The request: from the key to the gateway, then along the chosen route.
    let px: number;
    let py: number;
    if (ph < 0.45) {
      const u = ph / 0.45;
      px = key[0] + (P[0] - key[0]) * u;
      py = key[1] + (P[1] - key[1]) * u;
    } else {
      const u = (ph - 0.45) / 0.55;
      const v = 1 - u;
      const m = model(act);
      const c = bend(act);
      px = v * v * P[0] + 2 * v * u * c[0] + u * u * m[0];
      py = v * v * P[1] + 2 * v * u * c[1] + u * u * m[1];
    }
    dot(px, py, Math.max(1.5, 2.8 * z), rgba(COL.jade, 1));
    plus(P[0], P[1], 7, COL.ink, 0.95);
    ring(P[0], P[1], Math.max(4, 12 * z), rgba(COL.star, 0.5));
    dot(key[0], key[1], Math.max(2, 6 * z), rgba(COL.jade, 1));
    ring(key[0], key[1], Math.max(4, 13 * z), rgba(COL.jade2, 0.9));
    if (f > 0.3) {
      const L = 58 * Math.max(0.7, z);
      leader(key[0], key[1], L, "l", COL.ink, 0.4 * f);
      place("api.key", key[0], key[1] - L, "l", f);
      ctx!.fillStyle = rgba(COL.ink, 0.4 * f);
      ctx!.fillRect(P[0] - 0.5, P[1] + 14, 1, 52);
      ctx!.fillRect(P[0], P[1] + 66, 7, 1);
      place("api.gw", P[0], P[1] + 66, "r", f);
    }
  }

  function drawBalance(P: Pt, z: number, t: number, f: number) {
    ctx!.lineWidth = 1;
    ctx!.setLineDash([2.5, 3.5]);
    for (let i = 1; i <= 3; i++) ring(P[0], P[1], (28 + i * 28) * z, rgba(COL.warm, 0.42 - i * 0.08));
    ctx!.setLineDash([]);
    // The balance pays each in turn: a jade drop runs out along one tie.
    const k = Math.floor(t / 1.4) % 3;
    const u = (t % 1.4) / 1.4;
    TIES.forEach(([th, id], i) => {
      const x = P[0] + Math.cos(th) * 140 * z;
      const y = P[1] + Math.sin(th) * 140 * z;
      ctx!.strokeStyle = rgba(COL.star, 0.3);
      ctx!.beginPath();
      ctx!.moveTo(P[0], P[1]);
      ctx!.lineTo(x, y);
      ctx!.stroke();
      plus(x, y, 5.5, COL.ink, 0.9);
      if (i === k) dot(P[0] + (x - P[0]) * u, P[1] + (y - P[1]) * u, Math.max(1.5, 2.6 * z), rgba(COL.jade, 1));
      if (f > 0.3) place(id, x + (x >= P[0] ? 10 : -10), y - 8, x >= P[0] ? "r" : "l", f);
    });
    ctx!.globalCompositeOperation = "lighter";
    ctx!.globalAlpha = 0.55;
    ctx!.drawImage(SPR.warm, P[0] - 60 * z, P[1] - 60 * z, 120 * z, 120 * z);
    ctx!.globalAlpha = 1;
    ctx!.globalCompositeOperation = "source-over";
    dot(P[0], P[1], Math.max(2.5, 9 * z), rgba(COL.warm, 1));
    if (f > 0.3) {
      const L = 70 * Math.max(0.7, z);
      leader(P[0], P[1] - 12 * z, L, "r", COL.ink, 0.4 * f);
      place("bal.core", P[0], P[1] - 12 * z - L, "r", f);
    }
  }

  const PRODUCTS = [null, drawAha, drawBots, drawApi, drawBalance] as const;

  /** Set the notes collected this frame, in order; one that would cover a plate or a note already set waits. */
  function setNotes() {
    const sr = stage.getBoundingClientRect();
    const boxes = plates()
      .map((pl) => {
        const b = pl.getBoundingClientRect();
        return [b.left - sr.left - 8, b.top - sr.top - 8, b.right - sr.left + 8, b.bottom - sr.top + 8];
      })
      .filter((b) => b[3] > 0 && b[1] < H);
    for (const n of notes.values()) n.on = false;
    for (const n of placed) {
      const note = notes.get(n.id);
      if (!note) continue;
      if (!note.w) {
        note.w = note.el.offsetWidth;
        note.h = note.el.offsetHeight;
      }
      const x = n.side === "r" ? n.x + 6 : n.x - 6 - note.w;
      const y = n.y - note.h / 2;
      const box = [x - 4, y - 2, x + note.w + 4, y + note.h + 2];
      if (box[0] < 0 || box[2] > W || box[1] < 0 || box[3] > H || boxes.some((b) => box[0] < b[2] && b[0] < box[2] && box[1] < b[3] && b[1] < box[3])) continue;
      boxes.push(box);
      note.on = true;
      note.el.dataset.side = n.side;
      note.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      note.el.style.opacity = Math.max(0, Math.min(1, (n.alpha - 0.35) / 0.4)).toFixed(3);
    }
    for (const n of notes.values()) if (!n.on) n.el.style.opacity = "0";
  }

  function draw(p: number, t: number) {
    const cam = camera(p);
    const proj = (x: number, y: number, d = 1): Pt => [W / 2 + (x - cam.cx) * cam.z * d, H / 2 + (y - cam.cy) * cam.z * d];
    const c = ctx!;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, W, H);

    // The far stars, drifting a little with the camera.
    for (const s of WORLD.deep) {
      const x = (((s.fx * W - cam.cx * 0.04) % W) + W) % W;
      const y = (((s.fy * H - cam.cy * 0.04) % H) + H) % H;
      const tw = 0.6 + 0.4 * Math.sin((t / s.tw) * 6.283 + s.ph);
      c.fillStyle = rgba(s.col ? COL.cool : COL.star, s.a * tw);
      c.fillRect(x, y, s.sz, s.sz);
    }

    // The river's glow.
    c.globalCompositeOperation = "lighter";
    for (const g of WORLD.glows) {
      const [x, y] = proj(g.x, g.y);
      const s = g.sz * cam.z;
      if (x + s < 0 || x - s > W || y + s < 0 || y - s > H) continue;
      c.globalAlpha = g.a;
      c.drawImage(SPR[g.sp], x - s / 2, y - s / 2, s, s);
    }
    c.globalAlpha = 1;
    c.globalCompositeOperation = "source-over";

    // Its dust lane.
    for (const d of WORLD.dust) {
      const [x, y] = proj(d.x, d.y);
      const rx = d.rx * cam.z;
      if (x + rx < 0 || x - rx > W || y + rx < 0 || y - rx > H) continue;
      c.save();
      c.translate(x, y);
      c.rotate(d.ang);
      c.scale(rx / 64, (d.ry * cam.z) / 64);
      c.globalAlpha = d.a;
      c.drawImage(SPR.dark, -64, -64, 128, 128);
      c.restore();
    }
    c.globalAlpha = 1;

    // Its stars.
    const SC = [COL.star, COL.cool, COL.warm, COL.jade2];
    for (const s of WORLD.stars) {
      const [x, y] = proj(s.x, s.y, s.d);
      if (x < -3 || x > W + 3 || y < -3 || y > H + 3) continue;
      c.fillStyle = rgba(SC[s.col], s.tw ? s.a * (0.55 + 0.45 * Math.sin((t / s.tw) * 6.283 + s.ph)) : s.a);
      if (s.sz < 1.3) c.fillRect(x - s.sz / 2, y - s.sz / 2, s.sz, s.sz);
      else {
        c.beginPath();
        c.arc(x, y, s.sz * 0.6, 0, 6.283);
        c.fill();
      }
    }

    // The route along the river: dashed ahead, jade where the camera has been.
    const sNow = 1 + Math.max(0, p);
    c.lineWidth = 1;
    c.setLineDash([3, 5]);
    c.strokeStyle = rgba(COL.star, 0.22);
    c.beginPath();
    for (let k = 0; k <= 80; k++) {
      const [x, y] = proj(...spine(1 + (k / 80) * 4));
      if (k) c.lineTo(x, y);
      else c.moveTo(x, y);
    }
    c.stroke();
    c.setLineDash([]);
    c.strokeStyle = rgba(COL.jade, 0.85);
    c.beginPath();
    for (let k = 0; k <= 60; k++) {
      const [x, y] = proj(...spine(1 + (k / 60) * (sNow - 1)));
      if (k) c.lineTo(x, y);
      else c.moveTo(x, y);
    }
    c.stroke();

    placed = [];
    for (let k = 1; k < STOP_COUNT; k++) {
      const P = proj(SPINE[k + 1][0], SPINE[k + 1][1]);
      const f = Math.max(0, Math.min(1, 1 - Math.abs(p - k) * 1.6));
      if (P[0] < -320 || P[0] > W + 320 || P[1] < -320 || P[1] > H + 320) continue;
      PRODUCTS[k]!(P, cam.z, t, f);
      if (cam.z < 0.55) {
        // Seen from afar: the stop's number and name under it, a hairline down to the words.
        const y0 = P[1] + 150 * cam.z + 8;
        c.fillStyle = rgba(COL.ink, 0.35);
        c.fillRect(P[0] - 0.5, P[1] + 16 * cam.z + 6, 1, y0 - P[1] - 16 * cam.z - 6);
        c.font = `500 11px ${MONO}`;
        c.fillStyle = rgba(COL.jade2, 1);
        c.fillText(`0${k}`, P[0] + 6, y0 + 10);
        c.fillStyle = rgba(COL.ink2, 1);
        c.fillText(stopName(k), P[0] + 30, y0 + 10);
      }
    }
    setNotes();
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
    remeasure();
  }

  function remeasure() {
    for (const n of notes.values()) n.w = n.h = 0;
  }

  resize();
  return { resize, remeasure, draw };
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
