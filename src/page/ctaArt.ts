/**
 * The product pages' closing art (../CtaArt.tsx): beside each page's last call to action, a variation of one ASCII
 * engine (the sharks' water, the stars, the orbit's bodies) with its options, so each reads as the same hand and none
 * is a copy.
 *   water (./sharks/water.ts, the closing band's sharks)
 *     aha        one shark through a school that mills in bait balls: where people gather, the flagship swims
 *     storage    no sharks; bubbles rising (small fish drawn . ° o O, carried up, back in at the bottom): uploads
 *     database   no sharks; ribbons of fish (- and =) in level lanes, alternately right and left: rows of data
 *     supabase   no sharks; one school of > migrating left to right and round again: the move
 *   sky (./starField.ts, the hero's stars, as characters)
 *     models     constellations: bright stars joined by dotted lines, each a family under one key
 *     help       the sky turning slowly round a pole star that holds still, the stars trailing arcs: something to
 *                steer by
 *     status     the stars set on a lattice, a board of lights, and a wave of light crossing it every five seconds:
 *                every light checked, again and again
 *     pricing    a Milky Way: the stars gathered in one band across the sky: one balance for all of it
 *   text (./orbitScene.ts, ./orbitMoonArt.ts, the orbit's ASCII bodies)
 *     workspace  one large moon going through its phases: a world of your own in the cloud
 *     agents     v4's identity art (orbitScene.ts's two moons on their inclined orbits) with the orbit's moon bodies:
 *                the planet, and two moons going round it on their own, in front and behind: agents round your app
 *     build      a moon built up through the four states, Coming (dotted rim), Early access (rim), Beta (half),
 *                Live (whole), each dissolving into the next: what we build with you, step by step
 * Loaded only when a band comes near the screen, so a page's first load carries none of it.
 */
import { CELL_H, CELL_W, moonArt } from "./orbitMoonArt";
import { IDENTITY_MOONS, moonPosition, ORBIT_CORE_R, ORBIT_CX, ORBIT_CY } from "./orbitScene";
import { hash3 } from "./sharks/world";
import { startSharkWater, type SharkWaterOptions } from "./sharks/water";
import { startStarField, type SkyOptions } from "./starField";
import { startTextArt, type TextArt } from "./textArt";
import type { CtaArtId } from "./CtaArt";
import type { SiteStatus } from "@/content/site";

export interface CtaArtHandle {
  sync(): void;
  stop(): void;
}

/** The stars of the bands' skies: a speck, a small star, a bright one. */
const STAR_GLYPHS = ".+*";

export const WATERS: Readonly<Partial<Record<CtaArtId, SharkWaterOptions>>> = {
  aha: { seed: 11, sharks: 1, fish: 3, species: [0, 1] },
  storage: { seed: 5, sharks: 0, fish: 1.6, species: [3], school: 0.15, drift: { x: 0, y: -38 }, wrap: "y", glyphs: ".°oO" },
  database: { seed: 3, sharks: 0, fish: 3, species: [1], lanes: { count: 8, speed: 40 }, wrap: "x", glyphs: "-=" },
  supabase: { seed: 9, sharks: 0, fish: 2.4, species: [1, 2], drift: { x: 48, y: 0 }, wrap: "x", glyphs: ">" },
};

export const SKIES: Readonly<Partial<Record<CtaArtId, SkyOptions>>> = {
  models: { glyphs: STAR_GLYPHS, seed: 7, density: 1.5, constellations: 5 },
  help: { glyphs: STAR_GLYPHS, seed: 12, density: 1.1, turn: { x: 0.5, y: 0.5, period: 180 } },
  status: { glyphs: STAR_GLYPHS, seed: 4, density: 4, lattice: 22, pulse: 5 },
  pricing: { glyphs: STAR_GLYPHS, seed: 21, density: 5, band: { angle: -24, width: 0.1 } },
};

/** The bands' moons, in stage units (the orbit's): 54 x 26 characters. */
const MOON_R = 300;
/** Seconds the moon of the build band takes to dissolve into its next state, then holds it. */
const BUILD_DISSOLVE = 1.2;
const BUILD_HOLD = 2.4;
const BUILD_STATES: readonly SiteStatus[] = ["coming", "early", "beta", "live"];

/** The phases: the light goes round the moon once in `period` seconds, from the first quarter (lit on the right). */
function moonPhases(period: number): TextArt {
  return {
    fps: 8,
    still: 0,
    frame: (t) => {
      const a = Math.PI / 2 - (2 * Math.PI * t) / period;
      return moonArt(MOON_R, "live", { from: [Math.sin(a), -0.3, Math.cos(a)], floor: 0.1 });
    },
  };
}

/** One state into the next, a cell at a time in a fixed scattered order, then held; Live is the still frame. */
function moonBuilt(): TextArt {
  const frames = BUILD_STATES.map((s) => moonArt(MOON_R, s));
  const step = BUILD_DISSOLVE + BUILD_HOLD;
  return {
    fps: 12,
    still: 3 * step + BUILD_DISSOLVE,
    frame: (t) => {
      const k = Math.floor(t / step) % frames.length;
      const into = Math.min(1, (t % step) / BUILD_DISSOLVE);
      const to = frames[k];
      if (into >= 1) return to;
      const from = frames[(k + frames.length - 1) % frames.length];
      let out = "";
      for (let i = 0; i < to.length; i++) out += to[i] === "\n" || hash3(i, 7, 3) < into ? to[i] : from[i];
      return out;
    },
  };
}

/**
 * v4's identity art in the orbit's bodies: the planet (a lit body of the core's size) and orbitScene.ts's two identity
 * moons on their inclined orbits, each drawn as a moon of the hero's, hidden behind the planet as it passes behind.
 * The frame is the box the bodies ever reach, so nothing is cut off at any time.
 */
function planetAndMoons(): TextArt {
  const planet = { art: moonArt(ORBIT_CORE_R, "live").split("\n"), x: ORBIT_CX, y: ORBIT_CY };
  const moons = IDENTITY_MOONS.map((m) => ({ m, art: moonArt(m.radius, "live").split("\n") }));
  const box = (art: string[], x: number, y: number) => {
    const c = Math.round(x / CELL_W - art[0].length / 2);
    const r = Math.round(y / CELL_H - art.length / 2);
    return [c, r, c + art[0].length, r + art.length];
  };
  let [c0, r0, c1, r1] = box(planet.art, planet.x, planet.y);
  for (const { m, art } of moons) {
    for (let k = 0; k < 96; k++) {
      const p = moonPosition(m, (k / 96) * m.period);
      const [a, b, c, d] = box(art, p.x, p.y);
      [c0, r0, c1, r1] = [Math.min(c0, a), Math.min(r0, b), Math.max(c1, c), Math.max(r1, d)];
    }
  }
  const cols = c1 - c0;
  const rows = r1 - r0;
  return {
    fps: 10,
    still: 0,
    fit: 0.96,
    frame: (t) => {
      const grid = Array.from({ length: rows }, () => Array<string>(cols).fill(" "));
      const stamp = (art: string[], x: number, y: number) => {
        const [c, r] = box(art, x, y);
        art.forEach((line, i) => {
          for (let j = 0; j < line.length; j++) if (line[j] !== " ") grid[r - r0 + i][c - c0 + j] = line[j];
        });
      };
      const placed = moons.map(({ m, art }) => ({ art, p: moonPosition(m, t) })).sort((a, b) => a.p.z - b.p.z);
      for (const { art, p } of placed) if (p.z < 0) stamp(art, p.x, p.y);
      stamp(planet.art, planet.x, planet.y);
      for (const { art, p } of placed) if (p.z >= 0) stamp(art, p.x, p.y);
      return grid.map((row) => row.join("")).join("\n");
    },
  };
}

export const TEXTS: Readonly<Partial<Record<CtaArtId, () => TextArt>>> = {
  workspace: () => moonPhases(32),
  agents: planetAndMoons,
  build: moonBuilt,
};

/** Runs a page's art on its canvas. */
export function startCtaArt(canvas: HTMLCanvasElement, id: CtaArtId): CtaArtHandle {
  const water = WATERS[id];
  if (water) return startSharkWater(canvas, water);
  const sky = SKIES[id];
  if (sky) return startStarField(canvas, () => false, sky);
  const text = TEXTS[id];
  if (text) return startTextArt(canvas, text());
  throw new Error(`no closing art for ${id}`);
}
