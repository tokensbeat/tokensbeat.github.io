import { CORE_R, CX, CY, declutter, labelPlace, labelTransform, moonState, moonTransform, ringPoint, RINGS, STAGE_W, angleAt, labelBox } from "./orbitMotion";
import { MOONS } from "./Orbit";

describe("the orbit's motion", () => {
  it("turns the Serve ring once in 90 s and the Support orbit once in 150 s, the other way", () => {
    expect(RINGS.serve.period).toBe(90);
    expect(RINGS.support.period).toBe(150);
    expect(Math.sign(angleAt("serve", 0, 1))).toBe(-Math.sign(angleAt("support", 0, 1)));
    for (const ring of ["serve", "support"] as const) {
      const a = moonState(ring, 30, 0);
      const b = moonState(ring, 30, RINGS[ring].period);
      expect(b.x).toBeCloseTo(a.x, 6);
      expect(b.y).toBeCloseTo(a.y, 6);
      const half = moonState(ring, 30, RINGS[ring].period / 2);
      expect(Math.hypot(half.x - a.x, half.y - a.y)).toBeGreaterThan(400);
    }
  });

  it("starts every moon where v4 drew it", () => {
    for (const m of MOONS) {
      const p = ringPoint(m.ring, m.angle);
      const s = moonState(m.ring, m.angle, 0);
      expect(s.x).toBeCloseTo(p.x, 9);
      expect(s.y).toBeCloseTo(p.y, 9);
    }
  });

  it("draws the far side smaller and fainter, and hides a Serve moon where the planet covers it", () => {
    const front = moonState("support", 90, 0);
    const back = moonState("support", 270, 0);
    expect(front.front).toBe(true);
    expect(back.front).toBe(false);
    expect(back.scale).toBeLessThan(front.scale);
    expect(back.opacity).toBeLessThan(front.opacity);
    const top = moonState("serve", 270, 0);
    expect(Math.hypot(top.x - CX, top.y - CY)).toBeLessThan(CORE_R + RINGS.serve.moonR);
    expect(top.opacity).toBeLessThan(0.2);
    expect(moonState("serve", 200, 0).opacity).toBeGreaterThan(0.4);
  });

  it("hangs Serve labels outwards and Support labels above or below, inside the stage", () => {
    expect(labelPlace("serve", 0, 0).ax).toBeGreaterThan(-10); // right of the right end
    expect(labelPlace("serve", 180, 0).ax).toBeLessThan(-90); // left of the left end
    expect(labelPlace("serve", 90, 0).ay).toBe(0); // under the front
    expect(labelPlace("support", 270, 0).ay).toBe(-100); // over the back
    expect(labelPlace("support", 90, 0).ay).toBe(0); // under the front
    // At the Support orbit's ends the label turns through the inside, never past the stage's edge.
    for (let a = -30; a <= 30; a += 5) expect(labelPlace("support", a, 0).x).toBeLessThan(STAGE_W - 40);
  });

  it("writes positions as container units and percentages, the same on the server as in the browser", () => {
    const s = moonState("serve", -14, 0);
    expect(moonTransform(s)).toMatch(/^translate3d\([\d.]+cqw, [\d.]+cqw, 0\) translate\(-50%, -50%\) scale\([\d.]+\)$/);
    expect(labelTransform(labelPlace("serve", -14, 0))).toMatch(/^translate3d\([\d.]+cqw, [\d.]+cqw, 0\) translate\(-?[\d.]+%, -?[\d.]+%\)$/);
  });

  it("gives way: of two overlapping labels the farther hides, and one hidden needs room to come back", () => {
    const a = { x: 0, y: 0, w: 100, h: 30 };
    const b = { x: 50, y: 10, w: 100, h: 30 };
    const far = { x: 400, y: 0, w: 100, h: 30 };
    expect([...declutter([a, b, far], [1, -1, 0], new Set())]).toEqual([1]);
    expect([...declutter([a, b, far], [-1, 1, 0], new Set())]).toEqual([0]);
    // Shown last frame wins over nearer.
    expect([...declutter([a, b], [-1, 1], new Set([1]))]).toEqual([1]);
    // Just clear of the other, but not by the wider clearance a hidden label needs.
    const near = { x: 108, y: 0, w: 100, h: 30 };
    expect(declutter([a, near], [1, 0], new Set()).size).toBe(0);
    expect([...declutter([a, near], [1, 0], new Set([1]))]).toEqual([1]);
  });

  it("keeps the first frame's labels apart on a full-width figure", () => {
    const boxes = MOONS.map((m) => labelBox(labelPlace(m.ring, m.angle, 0), 1224, 120, 30));
    expect(declutter(boxes, MOONS.map((m) => moonState(m.ring, m.angle, 0).depth), new Set()).size).toBe(0);
  });
});
