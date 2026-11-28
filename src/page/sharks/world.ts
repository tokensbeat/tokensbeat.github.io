/**
 * The water behind the closing band: small fish schools and the sharks that hunt them, as plain numbers (./render.ts
 * draws them as ASCII).
 *
 * Ported from stackedlol/ascii-sharks (src/world.ts, src/math.ts, src/species.ts at a0074c1; MIT, Copyright (c) 2026
 * drewdi, the licence in ./LICENSE). Kept: the fish as boids with a blind spot, alarm that spreads through a school,
 * the fountain break round a shark, the divergence-free current; the sharks' wander, pursuit and follow-the-leader
 * spine, hunger and the schools that swim back in. Changed for a panel rather than a full screen: one kind of shark,
 * no headline to keep clear (the water is its own column), smaller sizes and numbers, sharks that swim mostly level,
 * turn back sooner and leave the fish by the edge alone (so they stay in view), and a seeded random source, so a
 * still frame (reduced motion) is the same on every visit.
 *
 * The product pages' closing bands draw variations of the same water (../ctaArt.ts) through WaterOptions: fewer or no
 * sharks, more fish or only some kinds, a current every fish swims with, water that a fish leaves by one side and comes
 * back to from the other, lanes. Aha's loading screen draws one more (with its own copy of this file): longer
 * sharks, more fish, and a calm oval in the middle that everything swims round, where its words are. Left out, each
 * option is the default water (the homepage's until 2026-11-27), number for number.
 */

export const TAU = Math.PI * 2;
export const SHARK_NODES = 20;

export const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);

export function smoothstep(e0: number, e1: number, x: number) {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
}

/** Shortest signed angle from a to b, in (-PI, PI]. */
export function angleDiff(a: number, b: number) {
  let d = (b - a) % TAU;
  if (d > Math.PI) d -= TAU;
  if (d < -Math.PI) d += TAU;
  return d;
}

/** Integer hash to [0, 1): the same cell gets the same glyph, so textures ride along instead of boiling. */
export function hash3(x: number, y: number, z: number) {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(z | 0, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/** A seeded source of [0, 1) numbers (mulberry32). */
export function seeded(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const K1 = 1 / 260;
const K2 = 1 / 310;
const K3 = 1 / 190;
const CURRENT_SCALE = 3400;

/** The curl of a slowly drifting stream function: it has no sources or sinks, so schools drift without piling up. */
function current(x: number, y: number, t: number, out: { x: number; y: number }) {
  const a = x * K1 + t * 0.07;
  const b = y * K2 - t * 0.05;
  const c = (x + y) * K3 + t * 0.11;
  out.x = (-K2 * Math.sin(a) * Math.sin(b) + 0.5 * K3 * Math.cos(c)) * CURRENT_SCALE;
  out.y = (-K1 * Math.cos(a) * Math.cos(b) - 0.5 * K3 * Math.cos(c)) * CURRENT_SCALE;
}

interface Species {
  cruise: number;
  maxSpeed: number;
  minSpeed: number;
  weight: number;
  schoolSize: [number, number];
  /** Personal space in grid cells (x, y), so every fish gets its own glyph. */
  spacing: [number, number];
  // The mix decides the school's shape (Couzin et al. 2002): strong alignment makes ribbons, low alignment a swarm,
  // a tangential pull (mill) a rotating bait ball.
  align: number;
  cohesion: number;
  jitter: number;
  mill: number;
  /** Real fish mostly cruise level. */
  verticalDrag: number;
}

const SPECIES: Species[] = [
  { cruise: 36, maxSpeed: 64, minSpeed: 18, weight: 3, schoolSize: [12, 20], spacing: [1.8, 1.1], align: 1.6, cohesion: 1.6, jitter: 40, mill: 70, verticalDrag: 0.5 },
  { cruise: 46, maxSpeed: 78, minSpeed: 22, weight: 3, schoolSize: [12, 22], spacing: [1.5, 1], align: 3.2, cohesion: 0.45, jitter: 30, mill: 0, verticalDrag: 1.4 },
  { cruise: 32, maxSpeed: 60, minSpeed: 16, weight: 2, schoolSize: [5, 9], spacing: [2.6, 1.3], align: 2, cohesion: 0.9, jitter: 25, mill: 0, verticalDrag: 2 },
  { cruise: 26, maxSpeed: 56, minSpeed: 10, weight: 1, schoolSize: [6, 10], spacing: [1.4, 1.1], align: 0.35, cohesion: 1.4, jitter: 110, mill: 0, verticalDrag: 0.3 },
];
const ALL_SPECIES: readonly number[] = SPECIES.map((_, i) => i);

/** A variation of the water (the product pages' closing bands); every option left out is the default. */
export interface WaterOptions {
  /** How many sharks, up to three; left out, two in a small panel and three in a large one. */
  sharks?: number;
  /** How many fish, as a multiple of the default number for water of the same size (1). */
  fish?: number;
  /** The kinds of fish there are, by their place in SPECIES (all four). */
  species?: readonly number[];
  /** How strongly fish keep together, as a multiple of each kind's own alignment, cohesion and milling (1). */
  school?: number;
  /** A current every fish is carried towards, in px/s, the near ones at full speed and the far ones slower (none). */
  drift?: { x: number; y: number };
  /** The way a fish leaves the water and comes back in on the other side: across ("x") or up and down ("y"); left out, the edges turn fish back. */
  wrap?: "x" | "y";
  /** Level lanes the fish keep to, the top one swimming right, the next left and so on, at `speed` px/s (none). */
  lanes?: { count: number; speed: number };
  /** How long the sharks are, as a multiple of the default length for water of the same size (1). */
  sharkSize?: number;
  /**
   * An oval in the middle of the water, its half-width and half-height in px, that the fish and the sharks swim round
   * and the sharks never hunt in (none): something read there (Aha's loading screen's words) has calm water behind it.
   */
  calm?: { rx: number; ry: number };
}

/** How hard a fish is pulled to the current's speed and direction (WaterOptions.drift, lanes), per second. */
const DRIFT_PULL = 1.2;
/** How hard a fish is pulled to its lane's middle (per second squared per px), and how much of its climb or dive a lane damps (per second). */
const LANE_PULL = 8;
const LANE_DAMP = 3;
/** How far beyond the edge a fish swims before it comes in on the other side (WaterOptions.wrap). */
const WRAP_PAD = 12;

/** How hard a fish is pushed out of the calm oval (WaterOptions.calm), per second squared at its middle; it starts a fifth
 * of the oval beyond its edge. */
const CALM_PUSH = 900;
const CALM_REACH = 1.2;

/** How far into the calm oval a point is: 0 at its middle, 1 on its edge (WaterOptions.calm). */
function calmDepth(x: number, y: number, W: number, H: number, calm: { rx: number; ry: number }) {
  return Math.hypot((x - W / 2) / calm.rx, (y - H / 2) / calm.ry);
}

/** A position on a side `size` long that a fish leaves and comes back into from the other end (WaterOptions.wrap). */
function wrapped(v: number, size: number) {
  if (v < -WRAP_PAD) return v + size + 2 * WRAP_PAD;
  if (v > size + WRAP_PAD) return v - size - 2 * WRAP_PAD;
  return v;
}

export interface Fish {
  x: number;
  y: number;
  vx: number;
  vy: number;
  species: number;
  /** 0 calm to 1 panicking; it spreads to neighbours. */
  alarm: number;
  alive: boolean;
  respawnAt: number;
  /** Smoothed angular velocity (rad/s): a hard turn glints. */
  turn: number;
  /** 0.55 far to 1 near. */
  depth: number;
  millDir: 1 | -1;
}

export interface Shark {
  id: number;
  length: number;
  /** Spine positions, snout first: [x0, y0, x1, y1, ...]. */
  nodes: Float32Array;
  heading: number;
  speed: number;
  /** Tail-beat phase; the renderer's body wave. */
  phase: number;
  /** Smoothed angular velocity (rad/s); the shark banks its fins into turns. */
  turn: number;
  hunger: number;
  wander: number;
  orbitDir: 1 | -1;
  orbitRadius: number;
  target: Fish | null;
  retargetAt: number;
  /** 0 far and faint to 1 near and full. */
  depth: number;
}

export interface WorldEvent {
  kind: "eat" | "splash";
  x: number;
  y: number;
}

const FISH_SEPARATION_K = 420;
const FISH_ALIGN_K = 1.4;
const FISH_COHESION_K = 1;
const FISH_FLEE_K = 1100;
/** About 127 degrees either side of the heading is seen; the rest is the blind spot behind. */
const BLIND_COS = -0.6;

/** How much of a shark's wish to climb or dive it acts on. */
const LEVEL = 0.6;
/** The sharks' sizes, biggest first; a small panel holds the first two. */
const SHARK_SIZES = [1, 0.7, 0.82];

export class World {
  width = 0;
  height = 0;
  time = 0;
  fish: Fish[] = [];
  sharks: Shark[] = [];
  events: WorldEvent[] = [];
  pointer = { x: 0, y: 0, active: false };
  readonly rand: () => number;

  private perception = 60;
  private sepX: number[] = [];
  private sepY: number[] = [];
  private foreignSep = 40;
  private bucketCols = 0;
  private bucketRows = 0;
  private bucketHead = new Int32Array(0);
  private bucketCount = new Uint16Array(0);
  private bucketNext = new Int32Array(0);
  private lastSpawn = 0;
  private tmp = { x: 0, y: 0 };

  constructor(
    seed = 2026,
    readonly options: WaterOptions = {},
  ) {
    this.rand = seeded(seed);
  }

  private between(lo: number, hi: number) {
    return lo + this.rand() * (hi - lo);
  }

  private pickSpecies() {
    const pool = this.options.species ?? ALL_SPECIES;
    let r = this.rand() * pool.reduce((sum, i) => sum + SPECIES[i].weight, 0);
    for (const i of pool) {
      r -= SPECIES[i].weight;
      if (r <= 0) return i;
    }
    return pool[0];
  }

  resize(width: number, height: number, cellW: number, cellH: number) {
    const first = this.width === 0;
    this.width = width;
    this.height = height;
    // Spacing in grid cells, so every fish lands in a cell of its own.
    this.sepX = SPECIES.map((sp) => sp.spacing[0] * cellW);
    this.sepY = SPECIES.map((sp) => sp.spacing[1] * cellH);
    this.perception = Math.max(cellH * 3, cellW * 5.5);
    this.foreignSep = cellW * 3;
    if (first || this.fish.length === 0) {
      this.seed();
      return;
    }
    for (const f of this.fish) {
      f.x = clamp(f.x, 0, width);
      f.y = clamp(f.y, 0, height);
    }
  }

  seed() {
    const { width: W, height: H } = this;
    const minSide = Math.min(W, H);
    const baseLength = clamp(Math.min(W, H * 1.4) * 0.52, 100, 320);
    const { sharks, fish = 1, sharkSize = 1, calm } = this.options;
    const count = sharks != null ? clamp(Math.round(sharks), 0, SHARK_SIZES.length) : W * H < 110_000 ? 2 : SHARK_SIZES.length;

    this.sharks = [];
    for (let i = 0; i < count; i++) {
      const size = SHARK_SIZES[i];
      const length = baseLength * size * sharkSize;
      const orbitRadius = minSide * this.between(0.28, 0.4);
      const orbitDir: 1 | -1 = i % 2 === 0 ? 1 : -1;
      // Spread across the water, each swimming level, alternately one way and the other.
      const x = W * ((i + 0.5) / count) + this.between(-0.1, 0.1) * W;
      // Round a calm oval: above it and below it in turn.
      const y = calm ? (i % 2 === 0 ? H / 2 - calm.ry - (H / 2 - calm.ry) * this.between(0.25, 0.6) : H / 2 + calm.ry + (H / 2 - calm.ry) * this.between(0.25, 0.6)) : H * this.between(0.3, 0.7);
      const heading = (i % 2 === 0 ? 0 : Math.PI) + this.between(-0.3, 0.3);
      const nodes = new Float32Array(SHARK_NODES * 2);
      const seg = length / (SHARK_NODES - 1);
      for (let n = 0; n < SHARK_NODES; n++) {
        nodes[n * 2] = x - Math.cos(heading) * seg * n;
        nodes[n * 2 + 1] = y - Math.sin(heading) * seg * n;
      }
      this.sharks.push({
        id: i + 1, length, nodes, heading, speed: 26, phase: this.between(0, TAU), turn: 0, hunger: this.between(0.25, 0.75),
        wander: 0, orbitDir, orbitRadius, target: null, retargetAt: 0, depth: size,
      });
    }
    // The smaller (farther) sharks draw first, so the big one swims over them.
    this.sharks.sort((a, b) => a.length - b.length);

    const total = clamp(Math.round(((W * H) / 3200) * fish), Math.round(36 * fish), Math.round(150 * fish));
    this.fish = [];
    while (this.fish.length < total) {
      const species = this.pickSpecies();
      const sp = SPECIES[species];
      const size = Math.min(Math.floor(this.between(sp.schoolSize[0], sp.schoolSize[1] + 1)), total - this.fish.length);
      const millDir: 1 | -1 = this.rand() < 0.5 ? 1 : -1;
      let cx = this.between(W * 0.08, W * 0.92);
      let cy = this.between(H * 0.1, H * 0.9);
      // A school that would start in the calm oval starts just outside it, on the same side.
      const inCalm = calm ? calmDepth(cx, cy, W, H, calm) : Infinity;
      if (calm && inCalm < CALM_REACH) {
        const k = CALM_REACH / Math.max(inCalm, 0.05);
        cx = W / 2 + (cx - W / 2) * k;
        cy = H / 2 + (cy - H / 2) * k;
        if (inCalm < 0.05) cy = H / 2 + calm.ry * CALM_REACH;
      }
      // Mostly level: fish cruise sideways far more than up or down.
      const dir = (this.rand() < 0.5 ? 0 : Math.PI) + this.between(-0.5, 0.5);
      for (let k = 0; k < size; k++) {
        this.fish.push({
          x: cx + this.between(-1, 1) * this.sepX[species] * Math.sqrt(size),
          y: cy + this.between(-1, 1) * this.sepY[species] * Math.sqrt(size) * 0.6,
          vx: Math.cos(dir) * sp.cruise,
          vy: Math.sin(dir) * sp.cruise,
          species, alarm: 0, alive: true, respawnAt: 0, turn: 0, depth: this.between(0.55, 1), millDir,
        });
      }
    }
    this.bucketNext = new Int32Array(this.fish.length);
  }

  /** A tap in the water: every fish near it bolts straight out. */
  splash(x: number, y: number) {
    this.events.push({ kind: "splash", x, y });
    const r = 160;
    for (const f of this.fish) {
      if (!f.alive) continue;
      const dx = f.x - x;
      const dy = f.y - y;
      const d = Math.hypot(dx, dy);
      if (d > r || d < 1e-3) continue;
      const k = (1 - d / r) * 260;
      f.vx += (dx / d) * k;
      f.vy += (dy / d) * k;
      f.alarm = 1;
    }
  }

  step(dt: number) {
    this.time += dt;
    this.rebuildHash();
    this.stepFish(dt);
    this.stepSharks(dt);
    this.respawn();
  }

  private rebuildHash() {
    const size = this.perception;
    const pad = 2;
    this.bucketCols = Math.ceil(this.width / size) + pad * 2;
    this.bucketRows = Math.ceil(this.height / size) + pad * 2;
    const n = this.bucketCols * this.bucketRows;
    if (this.bucketHead.length !== n) {
      this.bucketHead = new Int32Array(n);
      this.bucketCount = new Uint16Array(n);
    }
    this.bucketHead.fill(-1);
    this.bucketCount.fill(0);
    if (this.bucketNext.length !== this.fish.length) this.bucketNext = new Int32Array(this.fish.length);
    for (let i = 0; i < this.fish.length; i++) {
      const f = this.fish[i];
      if (!f.alive) continue;
      const b = this.bucketOf(f.x, f.y);
      this.bucketNext[i] = this.bucketHead[b];
      this.bucketHead[b] = i;
      this.bucketCount[b]++;
    }
  }

  private bucketOf(x: number, y: number) {
    const size = this.perception;
    const c = clamp(Math.floor(x / size) + 2, 0, this.bucketCols - 1);
    const r = clamp(Math.floor(y / size) + 2, 0, this.bucketRows - 1);
    return r * this.bucketCols + c;
  }

  private stepFish(dt: number) {
    const { fish, sharks, pointer, width: W, height: H, time } = this;
    const R2 = this.perception * this.perception;
    const size = this.perception;
    const cols = this.bucketCols;
    const rows = this.bucketRows;
    const head = this.bucketHead;
    const next = this.bucketNext;
    const cur = this.tmp;
    const calmDecay = Math.exp(-dt * 0.7);
    const contagion = Math.min(1, dt * 6);
    const { drift, wrap, lanes, school = 1, calm } = this.options;

    for (let i = 0; i < fish.length; i++) {
      const f = fish[i];
      if (!f.alive) continue;
      const sp = SPECIES[f.species];
      // An alarmed fish wants more room: the school flashes apart round a shark and closes once it has passed.
      const spread = 1 + 1.8 * f.alarm;
      const sepX = this.sepX[f.species] * spread;
      const sepY = this.sepY[f.species] * spread;
      const speed = Math.hypot(f.vx, f.vy) || 1;
      const hx = f.vx / speed;
      const hy = f.vy / speed;

      let ax = 0;
      let ay = 0;
      let sx = 0;
      let sy = 0;
      let avx = 0;
      let avy = 0;
      let cx = 0;
      let cy = 0;
      let n = 0;
      let neighbourAlarm = 0;

      const bc = clamp(Math.floor(f.x / size) + 2, 0, cols - 1);
      const br = clamp(Math.floor(f.y / size) + 2, 0, rows - 1);
      for (let r = Math.max(0, br - 1); r <= Math.min(rows - 1, br + 1); r++) {
        for (let c = Math.max(0, bc - 1); c <= Math.min(cols - 1, bc + 1); c++) {
          for (let j = head[r * cols + c]; j !== -1; j = next[j]) {
            if (j === i) continue;
            const o = fish[j];
            const dx = o.x - f.x;
            const dy = o.y - f.y;
            const d2 = dx * dx + dy * dy;
            if (d2 >= R2 || d2 <= 1e-6) continue;
            const d = Math.sqrt(d2);
            if ((dx * hx + dy * hy) / d <= BLIND_COS) continue;
            // Elliptical personal space: wide along x, tight along y.
            const qx = dx / sepX;
            const qy = dy / sepY;
            const q2 = qx * qx + qy * qy;
            if (q2 < 1) {
              const q = Math.sqrt(q2) || 1e-3;
              const k = (1 - q) / q;
              sx -= qx * k;
              sy -= qy * k;
            }
            if (o.species === f.species) {
              avx += o.vx;
              avy += o.vy;
              cx += dx;
              cy += dy;
              n++;
            } else if (d < this.foreignSep) {
              // Each species keeps to its own school.
              const k = ((1 - d / this.foreignSep) / d) * 0.6;
              sx -= dx * k;
              sy -= dy * k;
            }
            if (o.alarm > neighbourAlarm) neighbourAlarm = o.alarm;
          }
        }
      }

      ax += sx * FISH_SEPARATION_K;
      ay += sy * FISH_SEPARATION_K;
      if (n > 0) {
        const alignK = FISH_ALIGN_K * sp.align * school;
        const cohesionK = FISH_COHESION_K * sp.cohesion * school * (1 - 0.8 * f.alarm);
        ax += (avx / n - f.vx) * alignK + (cx / n) * cohesionK;
        ay += (avy / n - f.vy) * alignK + (cy / n) * cohesionK;
        if (sp.mill > 0) {
          const cl = Math.hypot(cx, cy) || 1;
          ax += (-cy / cl) * f.millDir * sp.mill * school * (1 - f.alarm);
          ay += (cx / cl) * f.millDir * sp.mill * school * (1 - f.alarm);
        }
      }

      // Distance to the nearest point of the shark's front half, so fish give the flanks room too.
      let fear = 0;
      for (const sh of sharks) {
        const fearR = sh.length * 0.6 + 40;
        let best = Infinity;
        let bx = 0;
        let by = 0;
        for (let k = 0; k <= 12; k += 3) {
          const nx = sh.nodes[k * 2];
          const ny = sh.nodes[k * 2 + 1];
          const d2 = (f.x - nx) ** 2 + (f.y - ny) ** 2;
          if (d2 < best) {
            best = d2;
            bx = nx;
            by = ny;
          }
        }
        const d = Math.sqrt(best);
        if (d >= fearR || d < 1e-3) continue;
        let w = 1 - d / fearR;
        w *= w;
        const awayX = (f.x - bx) / d;
        const awayY = (f.y - by) / d;
        // The fountain: break to whichever side of the shark's path you are on.
        const shx = Math.cos(sh.heading);
        const shy = Math.sin(sh.heading);
        const side = shx * (f.y - sh.nodes[1]) - shy * (f.x - sh.nodes[0]) >= 0 ? 1 : -1;
        ax += (awayX * 0.7 - shy * side * 0.9) * FISH_FLEE_K * w;
        ay += (awayY * 0.7 + shx * side * 0.9) * FISH_FLEE_K * w;
        fear = Math.max(fear, Math.sqrt(w));
      }

      if (pointer.active) {
        const pr = 90;
        const dx = f.x - pointer.x;
        const dy = f.y - pointer.y;
        const d = Math.hypot(dx, dy);
        if (d < pr && d > 1e-3) {
          const w = (1 - d / pr) ** 2;
          ax += (dx / d) * FISH_FLEE_K * w;
          ay += (dy / d) * FISH_FLEE_K * w;
          fear = Math.max(fear, Math.sqrt(w) * 0.8);
        }
      }

      // A threat sets the alarm, neighbours pass it on (a little weaker each hop), and it fades by itself.
      let alarm = Math.max(f.alarm * calmDecay, fear);
      const relayed = neighbourAlarm * 0.86;
      if (relayed > alarm) alarm += (relayed - alarm) * contagion;
      f.alarm = alarm;

      const m = 24;
      if (wrap !== "x") {
        if (f.x < m) ax += (m - f.x) * 7;
        else if (f.x > W - m) ax -= (f.x - (W - m)) * 7;
      }
      if (wrap !== "y") {
        if (f.y < m) ay += (m - f.y) * 7;
        else if (f.y > H - m) ay -= (f.y - (H - m)) * 7;
      }
      if (calm) {
        const q = calmDepth(f.x, f.y, W, H, calm);
        if (q < CALM_REACH) {
          const ox = (f.x - W / 2) / calm.rx;
          const oy = (f.y - H / 2) / calm.ry;
          const ol = Math.hypot(ox, oy) || 1;
          const k = ((CALM_REACH - q) / CALM_REACH) * CALM_PUSH;
          ax += (ox / ol) * k;
          ay += (oy / ol) * k;
        }
      }

      current(f.x, f.y, time, cur);
      ax += cur.x * 0.5 + (this.rand() - 0.5) * sp.jitter;
      ay += cur.y * 0.5 + (this.rand() - 0.5) * sp.jitter;
      // Level swimming damps climbing and diving, measured against the current's own rise; a far fish drifts slower.
      const driftX = drift ? drift.x * f.depth : 0;
      const driftY = drift ? drift.y * f.depth : 0;
      ay -= (f.vy - driftY) * sp.verticalDrag * (1 - 0.7 * f.alarm);
      if (drift) {
        ax += (driftX - f.vx) * DRIFT_PULL;
        ay += (driftY - f.vy) * DRIFT_PULL;
      }
      if (lanes) {
        const laneH = H / lanes.count;
        const lane = clamp(Math.floor(f.y / laneH), 0, lanes.count - 1);
        ay += ((lane + 0.5) * laneH - f.y) * LANE_PULL - f.vy * LANE_DAMP;
        ax += ((lane % 2 ? -1 : 1) * lanes.speed - f.vx) * DRIFT_PULL;
      }

      const preferred = sp.cruise * (1 + 1.3 * f.alarm);
      ax += (preferred - speed) * hx * 1.6;
      ay += (preferred - speed) * hy * 1.6;

      const before = Math.atan2(f.vy, f.vx);
      f.vx += ax * dt;
      f.vy += ay * dt;
      const maxSpeed = sp.maxSpeed * (1 + 1.8 * f.alarm);
      const s = Math.hypot(f.vx, f.vy);
      if (s > maxSpeed) {
        f.vx *= maxSpeed / s;
        f.vy *= maxSpeed / s;
      } else if (s < sp.minSpeed && s > 1e-3) {
        f.vx *= sp.minSpeed / s;
        f.vy *= sp.minSpeed / s;
      }
      f.turn += (angleDiff(before, Math.atan2(f.vy, f.vx)) / dt - f.turn) * Math.min(1, dt * 8);
      f.x = wrap === "x" ? wrapped(f.x + f.vx * dt, W) : clamp(f.x + f.vx * dt, -60, W + 60);
      f.y = wrap === "y" ? wrapped(f.y + f.vy * dt, H) : clamp(f.y + f.vy * dt, -60, H + 60);
    }
  }

  private stepSharks(dt: number) {
    const { sharks, width: W, height: H, time } = this;
    const { calm } = this.options;
    const minSide = Math.min(W, H);
    const cxW = W / 2;
    const cyW = H / 2;

    for (const sh of sharks) {
      const L = sh.length;
      const nodes = sh.nodes;
      const hx = nodes[0];
      const hy = nodes[1];
      sh.hunger = Math.min(1, sh.hunger + dt * 0.03);

      let dx = Math.cos(sh.heading);
      let dy = Math.sin(sh.heading);
      // Wander: a slowly drifting offset on a circle ahead of the snout.
      sh.wander = clamp(sh.wander + (this.rand() - 0.5) * dt * 3.2, -1.1, 1.1);
      dx += Math.cos(sh.heading + sh.wander) * 0.45;
      dy += Math.sin(sh.heading + sh.wander) * 0.45;

      if (time >= sh.retargetAt) {
        sh.target = this.findPrey(sh);
        sh.retargetAt = time + 0.45;
      }
      const t = sh.target;
      let hunting = false;
      let closing = 0;
      if (t && t.alive && sh.hunger > 0.3) {
        // Pursuit: aim where the fish is about to be.
        const tx = t.x + t.vx * 0.35 - hx;
        const ty = t.y + t.vy * 0.35 - hy;
        const d = Math.hypot(tx, ty) || 1;
        const w = 1.4 + 2.6 * sh.hunger;
        dx += (tx / d) * w;
        dy += (ty / d) * w;
        hunting = true;
        closing = clamp(1 - d / (L * 0.9), 0, 1);
      } else {
        // Patrol: a lazy circuit round the middle of the water.
        const rx = (hx - cxW) / (W / minSide);
        const ry = hy - cyW;
        const r = Math.hypot(rx, ry) || 1;
        const radius = sh.orbitRadius * (1 + 0.15 * Math.sin(time * 0.05 + sh.id));
        const radial = clamp((radius - r) / radius, -1, 1);
        dx += ((-ry / r) * sh.orbitDir + (rx / r) * radial * 0.9) * 0.55;
        dy += ((rx / r) * sh.orbitDir + (ry / r) * radial * 0.9) * 0.55;
      }

      for (const other of sharks) {
        if (other === sh) continue;
        for (let k = 0; k < SHARK_NODES; k += 4) {
          const ox = hx - other.nodes[k * 2];
          const oy = hy - other.nodes[k * 2 + 1];
          const d = Math.hypot(ox, oy);
          const range = (L + other.length) * 0.45;
          if (d < range && d > 1e-3) {
            const w = (1 - d / range) * 3;
            dx += (ox / d) * w;
            dy += (oy / d) * w;
          }
        }
      }

      // Round the calm oval: a shark any part of whose body comes near it turns its snout away, harder the nearer, so the
      // whole body keeps out (it follows the snout).
      if (calm) {
        let q = Infinity;
        for (let k = 0; k < SHARK_NODES; k += 3) q = Math.min(q, calmDepth(nodes[k * 2], nodes[k * 2 + 1], W, H, calm));
        const reach = CALM_REACH + (L * 0.4) / Math.min(calm.rx, calm.ry);
        if (q < reach) {
          const ox = (hx - W / 2) / calm.rx;
          const oy = (hy - H / 2) / calm.ry;
          const ol = Math.hypot(ox, oy) || 1;
          const w = ((reach - q) / reach) * 4;
          dx += (ox / ol) * w;
          dy += (oy / ol) * w;
        }
      }

      // Mostly level (the water is wider than it is tall, and a shark across it reads as a shark), except when turning
      // back: that starts once the snout is within a third of a length of the edge, so a body dips out of the water
      // now and then but the sharks stay mostly in view.
      dy *= LEVEL;
      const over = Math.max(-hx, hx - W, -hy, hy - H);
      if (over > -L * 0.32) {
        const w = clamp((over + L * 0.32) / (L * 0.4), 0, 1) * 4;
        const toX = cxW - hx;
        const toY = cyW - hy;
        const d = Math.hypot(toX, toY) || 1;
        dx += (toX / d) * w;
        dy += (toY / d) * w;
      }

      const desired = Math.atan2(dy, dx);
      // A shark cannot pivot on the spot: its turning circle grows with speed.
      const agility = Math.min(hunting ? 1.7 + closing : 0.8, sh.speed / (L * 0.22));
      const maxTurn = agility * dt;
      const turned = clamp(angleDiff(sh.heading, desired), -maxTurn, maxTurn);
      sh.heading += turned;
      sh.turn += (turned / dt - sh.turn) * Math.min(1, dt * 3);

      const cruise = 22 + L * 0.04;
      const targetSpeed = hunting ? cruise * (1.45 + closing * 1.5) : cruise;
      sh.speed += (targetSpeed - sh.speed) * Math.min(1, dt * 1.1);
      sh.phase += dt * (2 + sh.speed / 24);

      nodes[0] += Math.cos(sh.heading) * sh.speed * dt;
      nodes[1] += Math.sin(sh.heading) * sh.speed * dt;

      // Follow the leader, each joint limited, so the body bends into a C at most and never folds back on itself.
      const seg = L / (SHARK_NODES - 1);
      const maxBend = 0.16;
      let prevAngle = sh.heading + Math.PI;
      for (let k = 1; k < SHARK_NODES; k++) {
        const px = nodes[(k - 1) * 2];
        const py = nodes[(k - 1) * 2 + 1];
        let angle = Math.atan2(nodes[k * 2 + 1] - py, nodes[k * 2] - px);
        angle = prevAngle + clamp(angleDiff(prevAngle, angle), -maxBend, maxBend);
        nodes[k * 2] = px + Math.cos(angle) * seg;
        nodes[k * 2 + 1] = py + Math.sin(angle) * seg;
        prevAngle = angle;
      }

      if (sh.hunger > 0.15) {
        const mouthR = L * 0.05 + 6;
        const mx = nodes[0];
        const my = nodes[1];
        for (const f of this.fish) {
          if (!f.alive) continue;
          if ((f.x - mx) ** 2 + (f.y - my) ** 2 < mouthR * mouthR) {
            f.alive = false;
            f.respawnAt = time + this.between(3, 8);
            sh.hunger = Math.max(0, sh.hunger - 0.16);
            this.events.push({ kind: "eat", x: f.x, y: f.y });
          }
        }
      }
    }
  }

  /** Prey in the forward cone, close fish in sparse spots first: a dense school confuses a predator. */
  private findPrey(sh: Shark): Fish | null {
    const range = sh.length * 0.9 + 110;
    const hx = sh.nodes[0];
    const hy = sh.nodes[1];
    const fx = Math.cos(sh.heading);
    const fy = Math.sin(sh.heading);
    let best: Fish | null = null;
    let bestScore = Infinity;
    let currentScore = Infinity;
    // Not a fish by the edge: chasing it would take the shark out of the water.
    const margin = sh.length * 0.2;
    const { calm } = this.options;
    for (const f of this.fish) {
      if (!f.alive || f.x < margin || f.x > this.width - margin || f.y < margin || f.y > this.height - margin) continue;
      // Nor one by the calm oval: the chase would cross it.
      if (calm && calmDepth(f.x, f.y, this.width, this.height, calm) < CALM_REACH + 0.3) continue;
      const dx = f.x - hx;
      const dy = f.y - hy;
      const d = Math.hypot(dx, dy);
      if (d > range || d < 1e-3) continue;
      const cos = (dx * fx + dy * fy) / d;
      if (cos < 0.2) continue;
      const crowd = this.bucketCount[this.bucketOf(f.x, f.y)];
      const score = d * (1 + (1 - cos) * 0.8) * (1 + crowd * 0.07);
      if (score < bestScore) {
        bestScore = score;
        best = f;
      }
      if (f === sh.target) currentScore = score;
    }
    // Keep the current target unless something is clearly better.
    if (sh.target && currentScore < bestScore * 1.3) return sh.target;
    return best;
  }

  /** Eaten fish come back as a new school from an edge, which keeps the water stocked. */
  private respawn() {
    const { time, width: W, height: H } = this;
    const due: Fish[] = [];
    for (const f of this.fish) if (!f.alive && f.respawnAt <= time) due.push(f);
    if (due.length === 0) return;
    if (due.length < 6 && time - this.lastSpawn < 9) return;
    this.lastSpawn = time;
    const side = Math.floor(this.rand() * 4);
    const along = this.between(0.15, 0.85);
    const x = side === 0 ? -20 : side === 1 ? W + 20 : along * W;
    const y = side === 2 ? -20 : side === 3 ? H + 20 : along * H;
    const inward = Math.atan2(H / 2 - y, W / 2 - x) + this.between(-0.5, 0.5);
    const species = this.pickSpecies();
    const sp = SPECIES[species];
    const millDir: 1 | -1 = this.rand() < 0.5 ? 1 : -1;
    for (const f of due.slice(0, sp.schoolSize[1])) {
      f.alive = true;
      f.species = species;
      f.alarm = 0;
      f.turn = 0;
      f.millDir = millDir;
      f.x = x + this.between(-1, 1) * this.perception;
      f.y = y + this.between(-1, 1) * this.perception;
      f.vx = Math.cos(inward) * sp.cruise * 1.4;
      f.vy = Math.sin(inward) * sp.cruise * 1.4;
    }
  }
}
