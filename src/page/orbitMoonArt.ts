/**
 * The orbit's moons in the planet's own ASCII (./orbitScene.ts): the same character cell (the scene's 1600 x 1040
 * units in 140 x 45 characters, so one cell is 11.4 x 23.1 stage units), the same 2 x 4 sub-samples per cell, the same
 * light from the upper left and the same ramp of ten glyphs, so a moon reads as a small body of the same stuff as the
 * planet. orbitScene.ts stays as v4 wrote it; its shading is repeated here (shade(), no graticule: v4's moonCells),
 * not imported, with one change: a higher floor (0.4, not 0.2) and a softer curve, so a body of ten characters reads
 * whole, its dark side in the ramp's middle glyphs rather than its faint dots.
 *
 * A moon's status is its shape, as the legend's pips draw it: Live a whole lit body (dot), Beta lit on its left half
 * with only the rim on the right (half dot), Early access the rim alone (ring), Coming the rim in dots, the ramp's
 * faintest glyphs all the way round (dashed ring).
 * Each moon is drawn once, as text (pure, so the server's first frame and the browser's agree); moving it is a
 * transform, never a redraw.
 *
 * The product pages' closing bands draw larger moons of the same stuff (./ctaArt.ts): lit from another side (the light
 * going round it is the moon's phases) and on a lower floor, so its unlit side falls to the ramp's dots (MoonLight).
 */
import type { SiteStatus } from "@/content/site";
import { ORBIT_COLS, ORBIT_H, ORBIT_ROWS, ORBIT_W } from "./orbitScene";

/** One character cell in stage units (the scene's units are the stage's: its 1600 cover 80 % of the stage's 2000). */
export const CELL_W = ORBIT_W / ORBIT_COLS;
export const CELL_H = ORBIT_H / ORBIT_ROWS;
const SX = 2;
const SY = 4;
const RAMP = "@%#*+=-:. ";
/** The rim's width, as a share of the radius (Early access, Coming and Beta's unlit half). */
const RIM = 0.34;
/** The least ink of a rim point (the rim of a hollow moon reads all the way round, its unlit side too). */
const RIM_INK = 0.45;
/** A Coming moon's rim: one faint ink all round, so it is drawn in the ramp's dots (':' and '.'). */
const DOTTED_INK = 0.24;

const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const LIGHT = (() => {
  const l = [-0.55, -0.6, 0.58];
  const n = Math.hypot(l[0], l[1], l[2]);
  return l.map((c) => c / n);
})();
const glyph = (ink: number) => RAMP[Math.round((1 - clamp(ink)) * (RAMP.length - 1))];

/** Where a moon's light comes from and how dark its unlit side is; left out, the orbit's moons' own. */
export interface MoonLight {
  /** The direction of the light, x to the right, y down, z towards the reader (need not be of length one); the planet's upper left. */
  from?: readonly [number, number, number];
  /** The least light on the body, 0 to 1 (0.4). */
  floor?: number;
}

const unit = (v: readonly number[]) => {
  const n = Math.hypot(v[0], v[1], v[2]) || 1;
  return v.map((c) => c / n);
};

/** orbitScene.ts's shade() for a body without the graticule (v4's moons), on a higher floor. */
function shade(dx: number, dy: number, dz: number, light: readonly number[] = LIGHT, floor = 0.4) {
  const lam = clamp(dx * light[0] + dy * light[1] + dz * light[2]);
  const s = floor + (1 - floor) * lam ** 0.75 + 0.25 * (1 - dz) ** 3;
  return clamp(s) ** 0.7;
}

/** Whether a point of the disc (dx in radii from the centre, d its distance) is drawn for a status. */
function drawn(status: SiteStatus, dx: number, d: number): boolean {
  const rim = d > 1 - RIM;
  if (status === "live") return true;
  if (status === "beta") return rim || dx <= 0;
  return rim;
}

/**
 * A moon of `radius` stage units as lines of text: an even number of columns and rows round its centre, so the text's
 * middle is the moon's.
 */
export function moonArt(radius: number, status: SiteStatus, light: MoonLight = {}): string {
  const from = light.from ? unit(light.from) : LIGHT;
  const floor = light.floor ?? 0.4;
  const cols = 2 * Math.ceil(radius / CELL_W);
  const rows = 2 * Math.ceil(radius / CELL_H);
  const cx = (cols * CELL_W) / 2;
  const cy = (rows * CELL_H) / 2;
  const lines: string[] = [];
  for (let row = 0; row < rows; row++) {
    let line = "";
    for (let col = 0; col < cols; col++) {
      let sum = 0;
      for (let sub = 0; sub < SX * SY; sub++) {
        const dx = ((col + ((sub % SX) + 0.5) / SX) * CELL_W - cx) / radius;
        const dy = ((row + (Math.floor(sub / SX) + 0.5) / SY) * CELL_H - cy) / radius;
        const d2 = dx * dx + dy * dy;
        const d = Math.sqrt(d2);
        if (d2 > 1 || !drawn(status, dx, d)) continue;
        const ink = shade(dx, dy, Math.sqrt(1 - d2), from, floor);
        sum += status === "coming" ? DOTTED_INK : status !== "live" && d > 1 - RIM ? Math.max(ink, RIM_INK) : ink;
      }
      line += glyph(sum / (SX * SY));
    }
    lines.push(line);
  }
  return lines.join("\n");
}
