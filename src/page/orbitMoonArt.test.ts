import { STATUSES } from "@/content/site";
import { CELL_H, CELL_W, moonArt } from "./orbitMoonArt";
import { createOrbitScene, ORBIT_COLS, ORBIT_ROWS } from "./orbitScene";

/** A small moon's radii in stage units (the closing bands' moons are larger: ./ctaArt.ts). */
const SMALL = [56, 50];

const GLYPHS = /^[@%#*+=\-:. \n]+$/;
const RAMP = "@%#*+=-:. ";
const grid = (art: string) => art.split("\n");
/** The glyph at the middle of a moon's text, a little left or right of it. */
const at = (art: string, colShift: number) => {
  const rows = grid(art);
  const row = rows[Math.floor(rows.length / 2) - 1];
  return row[row.length / 2 + colShift];
};

describe("the moons in ASCII", () => {
  it("are drawn in the planet's cell and glyphs: even columns and rows round the centre, about 8 by 4 characters", () => {
    expect(CELL_W).toBeCloseTo(1600 / ORBIT_COLS, 9);
    expect(CELL_H).toBeCloseTo(1040 / ORBIT_ROWS, 9);
    // The planet's own glyphs, and nothing else.
    const planet = createOrbitScene([]).render(0);
    const used = new Set(planet.replace(/\n/g, ""));
    for (const art of SMALL.flatMap((r) => STATUSES.map((status) => moonArt(r, status)))) {
      expect(art).toMatch(GLYPHS);
      for (const c of art.replace(/\n/g, "")) expect(used.has(c) || c === " ", c).toBe(true);
      const rows = grid(art);
      expect(rows.length % 2).toBe(0);
      expect(rows.every((r) => r.length === rows[0].length && r.length % 2 === 0)).toBe(true);
      expect(rows[0].length).toBeGreaterThanOrEqual(8);
      expect(rows.length).toBeGreaterThanOrEqual(4);
    }
  });

  it("show the status as the legend's pips do: whole, half, rim, dashed rim", () => {
    const r = SMALL[0];
    // How much ink a moon puts down: each glyph by its place on the ramp (@ the most, a space none).
    const ink = (art: string) => [...art.replace(/\n/g, "")].reduce((n, c) => n + RAMP.length - 1 - RAMP.indexOf(c), 0);
    const live = moonArt(r, "live");
    const beta = moonArt(r, "beta");
    const early = moonArt(r, "early");
    const coming = moonArt(r, "coming");
    // Live: solid through the middle.
    expect(at(live, -1)).not.toBe(" ");
    expect(at(live, 1)).not.toBe(" ");
    // Beta: lit on the left, open on the right.
    expect(at(beta, -1)).not.toBe(" ");
    expect(at(beta, 1)).toBe(" ");
    // Early access: the rim alone; Coming: the rim in dashes, less of it.
    expect(at(early, -1)).toBe(" ");
    expect(at(early, 1)).toBe(" ");
    expect(ink(live)).toBeGreaterThan(ink(beta));
    expect(ink(beta)).toBeGreaterThan(ink(early));
    expect(ink(early)).toBeGreaterThan(ink(coming));
    expect(ink(coming)).toBeGreaterThan(4);
  });

  it("is lit from the planet's side: the upper left denser than the lower right", () => {
    const rows = grid(moonArt(SMALL[0], "live"));
    const weight = (c: string) => RAMP.length - 1 - RAMP.indexOf(c);
    const half = rows[0].length / 2;
    const upperLeft = rows.slice(0, rows.length / 2).reduce((n, row) => n + [...row.slice(0, half)].reduce((k, c) => k + weight(c), 0), 0);
    const lowerRight = rows.slice(rows.length / 2).reduce((n, row) => n + [...row.slice(half)].reduce((k, c) => k + weight(c), 0), 0);
    expect(upperLeft).toBeGreaterThan(lowerRight);
  });
});
