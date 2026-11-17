/**
 * Draws the World (./world.ts) as a grid of ASCII cells in one ink: the sharks rasterised cell by cell with
 * supersampled edges (each body cell a faint block of ink under its glyph, dense glyphs where the back catches the
 * light, sparse ones down the flanks, light marks on the edges), the fish as one dash each, their wakes as dots that
 * spread and fade, and a bite as a star.
 *
 * Ported from stackedlol/ascii-sharks (src/renderer.ts at a0074c1; MIT, Copyright (c) 2026 drewdi, the licence in
 * ./LICENSE): the classic shark's outline and fins, the body wave, the banking fins, the supersampling and the wake
 * field. Changed for the closing band: one ink at varying strength instead of colours on black (the card is jade and
 * its words' colour is the only ink), no background grid or ambient dots, no other species, and the canvas's size
 * and pixel ratio are the caller's (./water.ts), so this file only draws. A variation of the water may draw its fish
 * in other glyphs (InkOptions: bubbles for the storage page's band, ../ctaArt.ts).
 */
import { clamp, hash3, SHARK_NODES, smoothstep, type Shark, type World } from "./world";

/** The part of a 2D context the water draws with (tests pass a recorder). */
export type InkContext = Pick<CanvasRenderingContext2D, "clearRect" | "fillRect" | "fillText"> & {
  font: string;
  textAlign: CanvasTextAlign;
  textBaseline: CanvasTextBaseline;
  fillStyle: string | CanvasGradient | CanvasPattern;
  globalAlpha: number;
};

// Sparse to dense: a lit back is the most ink, a flank in shadow the least.
const SKIN_RAMP = ":;t%SX8#@";
const FIN_GLYPHS = "%;tS:";
const RIDGE_GLYPHS = "@8%";
const EDGE_HEAVY = ":;";
const EDGE_LIGHT = ".',`";

const FLAG_BODY = 1;
const FLAG_EDGE = 2;
const FLAG_FIN = 3;
const FLAG_RIDGE = 4;
const FLAG_EYE = 5;

/** Sample points inside a cell (x, y pairs, as fractions of it) for the anti-aliased silhouette. */
const SUBSAMPLES = [0.25, 0.3, 0.75, 0.3, 0.25, 0.72, 0.75, 0.72];

/** The classic shark seen from above: half its width at s in [0, 1] (snout to tail), as a fraction of its length. */
function halfWidth(s: number) {
  if (s < 0.13) return 0.09 * Math.pow(Math.sin(((s / 0.13) * Math.PI) / 2), 0.95);
  if (s < 0.3) return 0.09 + 0.016 * smoothstep(0.13, 0.3, s);
  if (s < 0.84) return 0.019 + 0.087 * Math.pow(1 - (s - 0.3) / 0.54, 1.25);
  const k = (s - 0.84) / 0.16;
  return 0.019 * (1 - k) + 0.012 * Math.sin(k * Math.PI);
}

// Fractions of the length: pectoral fin (leading root, trailing root, tip along the body, reach), pelvic fins, the
// forked tail's reach, the two dorsal fins, the eye and the gill slits.
const PECTORAL = [0.15, 0.43, 0.55, 0.26] as const;
const PELVIC = [0.57, 0.65, 0.69, 0.085] as const;
const CAUDAL = 0.085;
const DORSAL = [0.33, 0.47] as const;
const SECOND_DORSAL = [0.71, 0.76] as const;
const EYE = [0.1, 0.14] as const;
const GILLS = [0.19, 0.29] as const;

/** The cells round a shark are passed over in blocks of this many a side where no sample can hit (rasterizeSharks). */
const CULL_BLOCK = 4;
/** Each segment's reach (segmentReach) for the shark being drawn. */
const segmentReaches = new Float32Array(SHARK_NODES - 1);

/**
 * How far from the spine the outline can reach beside the stretch s0..s1 of it (fractions of the length, snout to
 * tail): the body's half-width there, or a fin's, each the most it is anywhere in the stretch (sampleShark's outline:
 * the body (halfWidth), the pectoral fins, whose tip is `tip` out at PECTORAL[2] and whose leading edge rises to it from
 * PECTORAL[0], the pelvic fins and the tail likewise). A sample farther than this from the stretch is never on it.
 */
function segmentReach(s0: number, s1: number, L: number, tip: number) {
  const a = s0 - 1e-6;
  const b = s1 + 1e-6;
  // halfWidth rises to s = 0.3, falls to 0.84, then is at most 0.031 (the tail's stalk and its bump).
  let body = Math.max(halfWidth(clamp(a, 0, 1)), halfWidth(clamp(b, 0, 1)));
  if (a < 0.3 && b > 0.3) body = Math.max(body, halfWidth(0.3));
  if (b > 0.84) body = Math.max(body, 0.031);
  // A fin's outer edge rises from its root to its tip, so its most within the stretch is at the stretch's end.
  const fin = (from: number, to: number, out: number) => (b < from || a > to ? 0 : out * clamp((Math.min(b, to) - from) / (to - from), 0, 1));
  return Math.max(body * L * 1.001, fin(PECTORAL[0], PECTORAL[2], tip), fin(PELVIC[0], PELVIC[2], L * PELVIC[3]), fin(0.86, 1, L * CAUDAL));
}

function inTriangle(px: number, py: number, ax: number, ay: number, bx: number, by: number, cx: number, cy: number) {
  const d1 = (px - bx) * (ay - by) - (ax - bx) * (py - by);
  const d2 = (px - cx) * (by - cy) - (bx - cx) * (py - cy);
  const d3 = (px - ax) * (cy - ay) - (cx - ax) * (py - ay);
  const neg = d1 < 0 || d2 < 0 || d3 < 0;
  const pos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(neg && pos);
}

export interface InkOptions {
  /** The fish's glyphs from far to near ("-": every fish a dash). */
  fish?: string;
}

/** Cell width for a panel this wide (CSS px); a cell is 1.45 times as tall. */
export function cellWidthFor(width: number) {
  return clamp(Math.round(width / 70), 7, 10);
}

export class AsciiWater {
  private width = 0;
  private height = 0;
  private cw = 8;
  private ch = 12;
  private cols = 0;
  private rows = 0;
  private ink = "#000";
  private fontFamily = "ui-monospace, monospace";

  private energy = new Float32Array(0);
  private energyTmp = new Float32Array(0);
  private heat = new Float32Array(0);
  private sharkFlag = new Uint8Array(0);
  private sharkShade = new Float32Array(0);
  private sharkKey = new Uint32Array(0);
  private sharkDepth = new Float32Array(0);
  /** Cells holding a fish this frame (by frame number); the wake skips them. */
  private fishStamp = new Uint32Array(0);
  private frameId = 0;

  private spine = new Float32Array(SHARK_NODES * 2);
  private arc = new Float32Array(SHARK_NODES);
  private arcTotal = 1;
  private finTipLeft = 0;
  private finTipRight = 0;
  // sampleShark's answers, kept on the object so a sample allocates nothing.
  private hitFlag = 0;
  private hitShade = 0;
  private hitS = 0;
  private hitV = 0;
  private hitDist = 0;

  private fishGlyphs: string;
  /**
   * How strongly the sharks' blocks are drawn, 0 to 1 (1). Aha's loading screen starts at 0, so its first frame is the
   * glyphs alone, as its HTML holds that frame, and brings the blocks in as the water starts to move.
   */
  blockAlpha = 1;

  constructor(
    private ctx: InkContext,
    options: InkOptions = {},
  ) {
    this.fishGlyphs = options.fish || "-";
  }

  get cellWidth() {
    return this.cw;
  }

  get cellHeight() {
    return this.ch;
  }

  get gridSize() {
    return { cols: this.cols, rows: this.rows };
  }

  setInk(ink: string) {
    if (ink) this.ink = ink;
  }

  setFontFamily(family: string) {
    if (family) this.fontFamily = family;
  }

  resize(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.cw = cellWidthFor(width);
    this.ch = Math.round(this.cw * 1.45);
    const cols = Math.ceil(width / this.cw);
    const rows = Math.ceil(height / this.ch);
    if (cols === this.cols && rows === this.rows) return;
    this.cols = cols;
    this.rows = rows;
    const n = cols * rows;
    this.energy = new Float32Array(n);
    this.energyTmp = new Float32Array(n);
    this.heat = new Float32Array(n);
    this.sharkFlag = new Uint8Array(n);
    this.sharkShade = new Float32Array(n);
    this.sharkKey = new Uint32Array(n);
    this.sharkDepth = new Float32Array(n);
    this.fishStamp = new Uint32Array(n);
  }

  /** Draws one frame; returns how many glyphs it set. */
  render(world: World, dt: number): number {
    const { ctx, cols } = this;
    if (cols === 0) return 0;
    this.consumeEvents(world);
    this.rasterizeSharks(world.sharks, world.time);
    this.depositWake(world);
    this.diffuse(dt);

    ctx.clearRect(0, 0, this.width, this.height);
    ctx.font = `600 ${Math.round(this.ch * 0.84)}px ${this.fontFamily}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = this.ink;
    const drawn = this.markAndDrawFish(world) + this.drawWake() + this.drawHeat() + this.drawSharks(world.time);
    ctx.globalAlpha = 1;
    return drawn;
  }

  /** The cell's block, a pixel short of the next so the grid shows between cells. */
  private block(i: number, alpha: number) {
    const { ctx, cols, cw, ch } = this;
    ctx.globalAlpha = clamp(alpha, 0, 1);
    ctx.fillRect((i % cols) * cw + 1, ((i / cols) | 0) * ch + 1, cw - 1, ch - 1);
  }

  private glyph(i: number, text: string, alpha: number) {
    const { ctx, cols, cw, ch } = this;
    ctx.globalAlpha = clamp(alpha, 0, 1);
    ctx.fillText(text, (i % cols) * cw + cw / 2, ((i / cols) | 0) * ch + ch / 2 + 1);
  }

  private cellIndex(x: number, y: number) {
    const c = Math.floor(x / this.cw);
    const r = Math.floor(y / this.ch);
    if (c < 0 || r < 0 || c >= this.cols || r >= this.rows) return -1;
    return r * this.cols + c;
  }

  private stamp(field: Float32Array, x: number, y: number, radius: number, amount: number) {
    const c0 = Math.floor(x / this.cw);
    const r0 = Math.floor(y / this.ch);
    for (let r = r0 - radius; r <= r0 + radius; r++) {
      for (let c = c0 - radius; c <= c0 + radius; c++) {
        if (c < 0 || r < 0 || c >= this.cols || r >= this.rows) continue;
        const d = Math.hypot(c - c0, (r - r0) * 1.4);
        if (d > radius + 0.5) continue;
        const i = r * this.cols + c;
        field[i] = Math.min(1.6, field[i] + amount * (1 - d / (radius + 1)));
      }
    }
  }

  private consumeEvents(world: World) {
    for (const e of world.events) {
      if (e.kind === "eat") {
        this.stamp(this.heat, e.x, e.y, 1, 1);
        this.stamp(this.energy, e.x, e.y, 3, 0.9);
      } else {
        this.stamp(this.energy, e.x, e.y, 5, 1.4);
      }
    }
    world.events.length = 0;
  }

  private depositWake(world: World) {
    const { energy } = this;
    for (const f of world.fish) {
      if (!f.alive) continue;
      const i = this.cellIndex(f.x, f.y);
      if (i >= 0) energy[i] = Math.min(1.6, energy[i] + 0.012 + f.alarm * 0.03);
    }
    for (const sh of world.sharks) {
      // The tail sweeps the most water.
      for (let k = SHARK_NODES - 6; k < SHARK_NODES; k++) {
        const i = this.cellIndex(sh.nodes[k * 2], sh.nodes[k * 2 + 1]);
        if (i >= 0) energy[i] = Math.min(1.6, energy[i] + 0.05 + sh.speed * 0.0012);
      }
    }
    if (world.pointer.active) this.stamp(energy, world.pointer.x, world.pointer.y, 1, 0.08);
  }

  /** Blur and decay, so a wake spreads like a ripple and fades. */
  private diffuse(dt: number) {
    const { cols, rows, energy, energyTmp: tmp, heat } = this;
    const decay = Math.exp(-dt * 1.5);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        const l = c > 0 ? energy[i - 1] : energy[i];
        const rt = c < cols - 1 ? energy[i + 1] : energy[i];
        const u = r > 0 ? energy[i - cols] : energy[i];
        const d = r < rows - 1 ? energy[i + cols] : energy[i];
        tmp[i] = (energy[i] * 4 + l + rt + u + d) * 0.125 * decay;
      }
    }
    this.energy = tmp;
    this.energyTmp = energy;
    const heatDecay = Math.exp(-dt * 2.2);
    for (let i = 0; i < heat.length; i++) heat[i] *= heatDecay;
  }

  /**
   * Classifies one point against the current shark (its spine and arc already built), in body coordinates: s along
   * the spine (0 snout, 1 tail), v across it. Writes the hit* fields; true when the point is on the shark.
   */
  private sampleShark(px: number, py: number, L: number) {
    const { spine, arc } = this;
    let best = Infinity;
    let bestS = 0;
    let bestSign = 1;
    let bestNx = 0;
    let bestNy = 0;
    for (let k = 0; k < SHARK_NODES - 1; k++) {
      const ax = spine[k * 2];
      const ay = spine[k * 2 + 1];
      const sx = spine[(k + 1) * 2] - ax;
      const sy = spine[(k + 1) * 2 + 1] - ay;
      const len2 = sx * sx + sy * sy || 1;
      const u = clamp(((px - ax) * sx + (py - ay) * sy) / len2, 0, 1);
      const qx = ax + sx * u;
      const qy = ay + sy * u;
      const d2 = (px - qx) ** 2 + (py - qy) ** 2;
      if (d2 < best) {
        best = d2;
        const len = Math.sqrt(len2);
        bestS = (arc[k] + u * len) / this.arcTotal;
        bestSign = sx * (py - ay) - sy * (px - ax) >= 0 ? 1 : -1;
        bestNx = (-sy / len) * bestSign;
        bestNy = (sx / len) * bestSign;
      }
    }

    const a = Math.sqrt(best);
    const s = bestS;
    const u = s * L;
    const w = halfWidth(s) * L;
    this.hitDist = a;
    this.hitS = s;
    this.hitV = a * bestSign;

    if (a <= w) {
      const across = a / (w || 1);
      // A rounded back lit from the top left; the flanks fall into shadow.
      const facing = (bestNx * -0.6 + bestNy * -0.8) * across;
      let shade = 0.58 - across * across * 0.42 + facing * 0.26;
      let flag = FLAG_BODY;
      if (s > DORSAL[0] && s < DORSAL[1] && across < 0.3) {
        flag = FLAG_RIDGE;
        shade = 1;
      } else if (s > SECOND_DORSAL[0] && s < SECOND_DORSAL[1] && across < 0.4) {
        shade = Math.max(shade, 0.82);
      } else if (s > EYE[0] && s < EYE[1] && across > 0.6) {
        flag = FLAG_EYE;
        shade = 0;
      } else if (s > GILLS[0] && s < GILLS[1] && across > 0.58) {
        // Five gill slits.
        if (Math.floor(((s - GILLS[0]) / (GILLS[1] - GILLS[0])) * 5) % 2 === 0) shade *= 0.45;
      } else if (s < 0.05) {
        shade = Math.max(shade, 0.7);
      }
      this.hitFlag = flag;
      this.hitShade = shade;
      return true;
    }

    const tip = bestSign > 0 ? this.finTipRight : this.finTipLeft;
    const [p0, p1, p2] = PECTORAL;
    if (
      inTriangle(u, a, L * p0, 0, L * p1, 0, L * p2, tip) &&
      // A sickle fin: its trailing edge is cut concave.
      !inTriangle(u, a, L * p1, 0, L * (p1 + (p2 - p1) * 0.33), tip * 0.55, L * p2, tip)
    ) {
      this.hitFlag = FLAG_FIN;
      this.hitShade = 0.38 + 0.22 * (1 - clamp(a / tip, 0, 1));
      return true;
    }
    const [v0, v1, v2, vr] = PELVIC;
    if (inTriangle(u, a, L * v0, 0, L * v1, 0, L * v2, L * vr) || inTriangle(u, a, L * 0.86, 0, L * 0.95, 0, L, L * CAUDAL)) {
      this.hitFlag = FLAG_FIN;
      this.hitShade = 0.36;
      return true;
    }
    return false;
  }

  /**
   * Builds a smooth, undulating spine from the simulated one, then supersamples every cell in the shark's box against
   * the outline: a covered cell is skin, a partly covered one an edge glyph.
   */
  private rasterizeSharks(sharks: Shark[], t: number) {
    const { sharkFlag, spine, arc, cw, ch, cols, rows } = this;
    sharkFlag.fill(0);
    for (const sh of sharks) {
      const L = sh.length;
      const N = SHARK_NODES;
      const n = sh.nodes;
      const swim = clamp(sh.speed / 60, 0.4, 1.4);
      // A travelling body wave, growing toward the tail.
      for (let k = 0; k < N; k++) {
        const s = k / (N - 1);
        const a = Math.max(0, k - 1);
        const b = Math.min(N - 1, k + 1);
        let tx = n[a * 2] - n[b * 2];
        let ty = n[a * 2 + 1] - n[b * 2 + 1];
        const tl = Math.hypot(tx, ty) || 1;
        tx /= tl;
        ty /= tl;
        const off = L * 0.05 * (0.1 + 0.9 * Math.pow(s, 1.8)) * swim * Math.sin(sh.phase - s * 5.2);
        spine[k * 2] = n[k * 2] - ty * off;
        spine[k * 2 + 1] = n[k * 2 + 1] + tx * off;
      }
      arc[0] = 0;
      for (let k = 1; k < N; k++) arc[k] = arc[k - 1] + Math.hypot(spine[k * 2] - spine[(k - 1) * 2], spine[k * 2 + 1] - spine[(k - 1) * 2 + 1]);
      this.arcTotal = arc[N - 1] || 1;

      // Banking into a turn: the inside fin foreshortens, the outside one spreads.
      const bank = clamp(sh.turn * 0.45, -0.35, 0.35);
      const flex = 1 + 0.06 * Math.sin(sh.phase * 0.5);
      this.finTipRight = L * PECTORAL[3] * flex * (1 - bank);
      this.finTipLeft = L * PECTORAL[3] * flex * (1 + bank);

      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      for (let k = 0; k < N; k++) {
        minX = Math.min(minX, spine[k * 2]);
        maxX = Math.max(maxX, spine[k * 2]);
        minY = Math.min(minY, spine[k * 2 + 1]);
        maxY = Math.max(maxY, spine[k * 2 + 1]);
      }
      const reach = L * 0.36;
      const c0 = Math.max(0, Math.floor((minX - reach) / cw));
      const c1 = Math.min(cols - 1, Math.floor((maxX + reach) / cw));
      const r0 = Math.max(0, Math.floor((minY - reach) / ch));
      const r1 = Math.min(rows - 1, Math.floor((maxY + reach) / ch));
      if (c0 > c1 || r0 > r1) continue;
      const skipBeyond = reach + Math.hypot(cw, ch);
      // A sample hits only within the shark's outline, which beside each segment of the spine reaches at most so far
      // (segmentReach). A block of cells, or a cell, whose middle is farther than that from every segment, by more than
      // its own half-diagonal, holds no hit and is passed over unsampled: the very same cells are drawn, and the
      // sampling follows the outline instead of the whole box round a shark.
      const tip = Math.max(this.finTipLeft, this.finTipRight);
      for (let k = 0; k < N - 1; k++) segmentReaches[k] = segmentReach(arc[k] / this.arcTotal, arc[k + 1] / this.arcTotal, L, tip) + 0.5;
      const cellPad = Math.hypot(cw, ch) / 2;

      for (let br = r0; br <= r1; br += CULL_BLOCK) {
        const er = Math.min(r1, br + CULL_BLOCK - 1);
        for (let bc = c0; bc <= c1; bc += CULL_BLOCK) {
          const ec = Math.min(c1, bc + CULL_BLOCK - 1);
          if (this.clearOfSpine(((bc + ec + 1) / 2) * cw, ((br + er + 1) / 2) * ch, Math.hypot((ec - bc + 1) * cw, (er - br + 1) * ch) / 2)) continue;
          for (let r = br; r <= er; r++) {
            for (let c = bc; c <= ec; c++) {
              if (!this.clearOfSpine((c + 0.5) * cw, (r + 0.5) * ch, cellPad)) this.rasterizeCell(sh, r, c, t, skipBeyond);
            }
          }
        }
      }
    }
  }

  /** Whether a point is farther from every segment of the current shark's spine than that segment's reach and `pad`. */
  private clearOfSpine(px: number, py: number, pad: number) {
    const { spine } = this;
    for (let k = 0; k < SHARK_NODES - 1; k++) {
      const ax = spine[k * 2];
      const ay = spine[k * 2 + 1];
      const sx = spine[(k + 1) * 2] - ax;
      const sy = spine[(k + 1) * 2 + 1] - ay;
      const u = clamp(((px - ax) * sx + (py - ay) * sy) / (sx * sx + sy * sy || 1), 0, 1);
      if ((px - ax - sx * u) ** 2 + (py - ay - sy * u) ** 2 <= (segmentReaches[k] + pad) ** 2) return false;
    }
    return true;
  }

  /** One cell of the current shark: sampled at its middle and four points within, and written as skin or an edge if hit. */
  private rasterizeCell(sh: Shark, r: number, c: number, t: number, skipBeyond: number) {
    const { sharkFlag, sharkShade, sharkKey, sharkDepth, cw, ch, cols } = this;
    const L = sh.length;
    const x = c * cw;
    const y = r * ch;
    const centerHit = this.sampleShark(x + cw / 2, y + ch / 2, L);
    if (!centerHit && this.hitDist > skipBeyond) return;
    const flag = this.hitFlag;
    const shade = this.hitShade;
    const s = this.hitS;
    const v = this.hitV;
    let hits = centerHit ? 1 : 0;
    for (let k = 0; k < SUBSAMPLES.length; k += 2) {
      if (this.sampleShark(x + SUBSAMPLES[k] * cw, y + SUBSAMPLES[k + 1] * ch, L)) hits++;
    }
    if (hits === 0) return;
    const coverage = hits / 5;
    const i = r * cols + c;
    // Keyed to the body, so each glyph rides along with the skin.
    sharkKey[i] = (hash3(Math.round(s * 52), Math.round(v / (cw * 0.9)), sh.id) * 4294967295) >>> 0;
    sharkDepth[i] = sh.depth;
    if (centerHit && coverage >= 0.6) {
      sharkFlag[i] = flag;
      sharkShade[i] = clamp(shade + (hash3(c, r, Math.floor(t * 6)) - 0.5) * 0.06, 0, 1);
    } else {
      sharkFlag[i] = FLAG_EDGE;
      sharkShade[i] = coverage;
    }
  }

  private drawSharks(t: number) {
    const { cols, rows, sharkFlag, sharkShade, sharkKey, sharkDepth } = this;
    let drawn = 0;
    for (let i = 0; i < cols * rows; i++) {
      const flag = sharkFlag[i];
      if (!flag) continue;
      const key = sharkKey[i];
      const shade = sharkShade[i];
      const dim = 0.62 + 0.38 * sharkDepth[i];
      // Now and then a cell catches the light, on a staggered clock, so the hide shimmers.
      const glint = hash3(key, Math.floor(t * 2.4 + (key % 997) / 97), 7) < 0.05 ? 0.25 : 0;
      let text: string;
      let alpha: number;
      if (flag === FLAG_EDGE) {
        const set = shade >= 0.5 ? EDGE_HEAVY : EDGE_LIGHT;
        text = set[(key >>> 8) % set.length];
        alpha = 0.3 + 0.4 * shade;
      } else if (flag === FLAG_RIDGE) {
        text = RIDGE_GLYPHS[(key >>> 8) % RIDGE_GLYPHS.length];
        alpha = 1;
      } else if (flag === FLAG_EYE) {
        text = "o";
        alpha = 1;
      } else if (flag === FLAG_FIN) {
        text = FIN_GLYPHS[(key >>> 8) % FIN_GLYPHS.length];
        alpha = 0.4 + 0.5 * shade;
      } else {
        const jitter = ((key >>> 4) % 3) - 1;
        text = SKIN_RAMP[clamp(Math.floor(shade * 8.99) + jitter, 0, SKIN_RAMP.length - 1)];
        alpha = 0.5 + 0.5 * shade;
      }
      if (flag !== FLAG_EDGE && this.blockAlpha > 0) this.block(i, (0.1 + 0.2 * shade) * dim * this.blockAlpha);
      this.glyph(i, text, (alpha + glint) * dim);
      drawn++;
    }
    return drawn;
  }

  /** One dash per fish, nearer fish first when two share a cell; far ones faint, a turning or bolting one bright. */
  private markAndDrawFish(world: World) {
    const { fishStamp, sharkFlag, fishGlyphs: glyphs } = this;
    const frame = ++this.frameId;
    let drawn = 0;
    for (let pass = 0; pass < 2; pass++) {
      for (const f of world.fish) {
        if (!f.alive || (f.depth > 0.78 ? 0 : 1) !== pass) continue;
        const i = this.cellIndex(f.x, f.y);
        if (i < 0 || fishStamp[i] === frame || sharkFlag[i]) continue;
        fishStamp[i] = frame;
        const glint = clamp(Math.abs(f.turn) / 3.5, 0, 1);
        const text = glyphs.length === 1 ? glyphs : glyphs[clamp(Math.floor(((f.depth - 0.55) / 0.45) * glyphs.length), 0, glyphs.length - 1)];
        this.glyph(i, text, 0.3 + (0.35 * (f.depth - 0.55)) / 0.45 + 0.35 * Math.max(glint, f.alarm));
        drawn++;
      }
    }
    return drawn;
  }

  private drawWake() {
    const { energy, sharkFlag, fishStamp, frameId } = this;
    let drawn = 0;
    for (let i = 0; i < energy.length; i++) {
      const e = energy[i];
      if (e < 0.45 || sharkFlag[i] || fishStamp[i] === frameId) continue;
      this.glyph(i, e > 0.9 ? ":" : ".", 0.16 + Math.min(0.4, (e - 0.45) * 0.5));
      drawn++;
    }
    return drawn;
  }

  private drawHeat() {
    const { heat, sharkFlag } = this;
    let drawn = 0;
    for (let i = 0; i < heat.length; i++) {
      const h = heat[i];
      if (h < 0.08 || sharkFlag[i]) continue;
      this.glyph(i, h > 0.6 ? "*" : "+", Math.min(1, h * 1.4));
      drawn++;
    }
    return drawn;
  }
}
