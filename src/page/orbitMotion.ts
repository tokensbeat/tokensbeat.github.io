/**
 * The homepage orbit's geometry and motion, as pure functions (no DOM): where each moon is at a time, how near or far
 * it is, where its label sits, and which labels give way when two would overlap. Orbit.tsx draws it; the tests read it.
 *
 * The stage is v4's (the earlier Vue site's orbit): 2000 x 1100 units, the planet's core a disc
 * of 280 at the middle, the Serve ring the middle of the ASCII planet's outer ring band, the Support orbit wider and
 * flatter. An angle is in degrees on a ring: 0 the right end, 90 the front (towards the reader, the lower edge), 180
 * the left end, 270 the back (behind the planet's top).
 *
 * The moons travel: the Serve ring once in 90 s the way the ASCII ring's own gaps drift (angles falling), the Support
 * orbit once in 150 s the other way. On the far side they shrink and fade; a Serve moon crossing behind the planet's
 * top is hidden where the core covers it. Positions are written as container units of the stage (1cqw is 20 units),
 * so the server can render the first frame without measuring anything.
 */
export const STAGE_W = 2000;
export const STAGE_H = 1100;
export const CX = STAGE_W / 2;
export const CY = STAGE_H / 2;
export const CORE_R = 280;

export type RingId = "serve" | "support";

export interface Ring {
  rx: number;
  ry: number;
  /** Radians; negative: the right side rises. */
  tilt: number;
  /** Seconds per turn. */
  period: number;
  /** +1: angles rise with time; -1: they fall. */
  dir: 1 | -1;
  /** The moon's radius in stage units: an ASCII body (./orbitMoonArt.ts) of 10 characters by 6 (5 lines of ink). */
  moonR: number;
}

export const RINGS: Readonly<Record<RingId, Ring>> = {
  serve: { rx: 600 * 1.125, ry: 250 * 1.125, tilt: -0.22, period: 90, dir: -1, moonR: 56 },
  support: { rx: 930, ry: 470, tilt: -0.1, period: 150, dir: 1, moonR: 50 },
};

const RAD = Math.PI / 180;
const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const smoothstep = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/** A ring's angle at `t` seconds for a moon that starts at `angle0`. */
export function angleAt(ring: RingId, angle0: number, t: number): number {
  const r = RINGS[ring];
  return angle0 + (r.dir * 360 * t) / r.period;
}

/** A point on a ring at `angle` degrees, in stage units. */
export function ringPoint(ring: RingId, angle: number): { x: number; y: number } {
  const r = RINGS[ring];
  const th = angle * RAD;
  const u = r.rx * Math.cos(th);
  const v = r.ry * Math.sin(th);
  const ct = Math.cos(r.tilt);
  const st = Math.sin(r.tilt);
  return { x: CX + u * ct - v * st, y: CY + u * st + v * ct };
}

/** An arc of a ring from `a` to `b` degrees, as an SVG polyline path. */
export function arcPath(ring: RingId, a: number, b: number, steps = 72): string {
  const pts: string[] = [];
  for (let k = 0; k <= steps; k++) {
    const p = ringPoint(ring, a + ((b - a) * k) / steps);
    pts.push(`${p.x.toFixed(1)} ${p.y.toFixed(1)}`);
  }
  return `M${pts.join("L")}`;
}

export interface MoonState {
  x: number;
  y: number;
  /** -1 the far side (behind), +1 the near side (in front). */
  depth: number;
  scale: number;
  opacity: number;
  front: boolean;
}

/** Where a moon is at `t` seconds, how large and how visible. */
export function moonState(ring: RingId, angle0: number, t: number): MoonState {
  const a = angleAt(ring, angle0, t);
  const { x, y } = ringPoint(ring, a);
  const depth = Math.sin(a * RAD);
  const near = (depth + 1) / 2;
  let opacity = 0.8 + 0.2 * near;
  if (ring === "serve" && depth < 0) {
    // Behind the planet: gone before its centre reaches the core's edge, back in view as it clears the edge.
    const r = RINGS.serve.moonR;
    opacity *= smoothstep(CORE_R - r * 0.2, CORE_R + r * 1.2, Math.hypot(x - CX, y - CY));
  }
  return { x, y, depth, scale: 0.78 + 0.22 * near, opacity, front: depth >= 0 };
}

/**
 * Which way a label sits from its moon, as a unit vector. On the Serve ring: outwards (the ring's normal), so the
 * labels stand clear of the planet. On the Support orbit: above the moons in the upper half and below them in the
 * lower, turning through the inner side at the ends, so no label leaves the stage.
 */
export function labelDirection(ring: RingId, angle: number, x: number, y: number): [number, number] {
  if (ring === "serve") {
    const r = RINGS.serve;
    const th = angle * RAD;
    let nx = Math.cos(th) / r.rx;
    let ny = Math.sin(th) / r.ry;
    const n = Math.hypot(nx, ny) || 1;
    nx /= n;
    ny /= n;
    const ct = Math.cos(r.tilt);
    const st = Math.sin(r.tilt);
    return [nx * ct - ny * st, nx * st + ny * ct];
  }
  const s = clamp((y - CY) / 150, -1, 1);
  const side = x >= CX ? 1 : -1;
  const dx = -side * (1 - Math.abs(s));
  const n = Math.hypot(dx, s) || 1;
  return [dx / n, s / n];
}

/** The gap between a moon's centre and its label's near edge, in stage units: clear of the moon's rim. */
export const labelGap = (ring: RingId): number => RINGS[ring].moonR + 16;

export interface LabelPlace {
  /** The anchor beside the moon, in stage units. */
  x: number;
  y: number;
  /** The label box's shift from the anchor, in % of its own width and height (-100 to 0). */
  ax: number;
  ay: number;
}

/** Where a label sits: an anchor `labelGap` from its moon and the box hung from it on the side it faces. */
export function labelPlace(ring: RingId, angle0: number, t: number): LabelPlace {
  const a = angleAt(ring, angle0, t);
  const p = ringPoint(ring, a);
  const [dx, dy] = labelDirection(ring, a, p.x, p.y);
  const sq = (v: number) => clamp(v * 1.5, -1, 1);
  const gap = labelGap(ring);
  return { x: p.x + dx * gap, y: p.y + dy * gap, ax: -50 + 50 * sq(dx), ay: -50 + 50 * sq(dy) };
}

/** Stage units as container units (the stage is the container: 1cqw is 1 % of its width, 20 units). */
const cq = (units: number) => `${(units / 20).toFixed(3)}cqw`;

export function moonTransform(m: MoonState): string {
  return `translate3d(${cq(m.x)}, ${cq(m.y)}, 0) translate(-50%, -50%) scale(${m.scale.toFixed(3)})`;
}

export function labelTransform(p: LabelPlace): string {
  return `translate3d(${cq(p.x)}, ${cq(p.y)}, 0) translate(${p.ax.toFixed(1)}%, ${p.ay.toFixed(1)}%)`;
}

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** A label's box in pixels, for a stage `stageW` px wide and a label `w` x `h` px. */
export function labelBox(p: LabelPlace, stageW: number, w: number, h: number): Box {
  const k = stageW / STAGE_W;
  return { x: p.x * k + (p.ax / 100) * w, y: p.y * k + (p.ay / 100) * h, w, h };
}

const overlaps = (a: Box, b: Box, pad: number) =>
  a.x < b.x + b.w + pad && b.x < a.x + a.w + pad && a.y < b.y + b.h + pad && b.y < a.y + a.h + pad;

/**
 * The labels that give way this frame: walking from the most to the least important (one that showed last frame
 * first, then the nearer), a label that would overlap one already placed is hidden. A label hidden last frame needs a
 * wider clearance to come back, so two labels passing each other do not flicker.
 */
export function declutter(boxes: readonly Box[], depth: readonly number[], hiddenBefore: ReadonlySet<number>, pad = 6): Set<number> {
  const order = boxes.map((_, i) => i).sort((a, b) => Number(hiddenBefore.has(a)) - Number(hiddenBefore.has(b)) || depth[b] - depth[a]);
  const placed: Box[] = [];
  const hidden = new Set<number>();
  for (const i of order) {
    const clearance = hiddenBefore.has(i) ? pad + 10 : pad;
    if (placed.some((b) => overlaps(boxes[i], b, clearance))) hidden.add(i);
    else placed.push(boxes[i]);
  }
  return hidden;
}
