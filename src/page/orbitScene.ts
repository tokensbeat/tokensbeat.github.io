// Copied verbatim from the v4 site (the earlier Vue site's brand art): the brand planet as ASCII frames.
// Keep it identical to the original; the owner asked for the original art, not a redrawing.
// ASCII orbit scene behind the brand artwork: a ringed, lit core with moons on inclined orbits.
// Pure functions, no DOM: AsciiOrbit draws the two-moon identity (sign-in), SiteOrbit the planet alone with the
// site's moons drawn over it (home), scripts/og-image.mjs the social card.
// Port of output/ascii-source/generate.py hero().

export const ORBIT_COLS = 140
export const ORBIT_ROWS = 45
/** Virtual canvas the scene is computed in; one text cell covers ORBIT_W / ORBIT_COLS by ORBIT_H / ORBIT_ROWS. */
export const ORBIT_W = 1600
export const ORBIT_H = 1040
export const ORBIT_CX = 800
export const ORBIT_CY = 520
export const ORBIT_CORE_R = 280

const CW = ORBIT_W / ORBIT_COLS
const CH = ORBIT_H / ORBIT_ROWS
const SX = 2
const SY = 4
const SUBS = SX * SY
const CELLS = ORBIT_COLS * ORBIT_ROWS
const RAMP = '@%#*+=-:. '
const RING_TILT = -0.22
const RING_RX = 600
const RING_RY = 250
/** The planet's ring as the site orbit (SiteOrbit) draws on it: tilt, radii and the outer band (in ring radii). */
export const ORBIT_RING = { tilt: RING_TILT, rx: RING_RX, ry: RING_RY, outerBand: [1.01, 1.24] } as const
// Depth of a point in the ring plane per unit of screen-space v.
const RING_Z = (RING_RX / RING_RY) * Math.sqrt(1 - (RING_RY / RING_RX) ** 2)
const LIGHT = (() => {
  const l = [-0.55, -0.6, 0.58]
  const n = Math.hypot(l[0], l[1], l[2])
  return l.map(c => c / n)
})()

export interface OrbitMoon {
  radius: number
  orbit: number
  /** Tilt of the orbit plane away from the viewer; near PI/2 flattens it into a thin ellipse. */
  incline: number
  /** Rotation of the orbit ellipse in the picture plane. */
  tilt: number
  /** Seconds per revolution. */
  period: number
  phase: number
}

export interface MoonPoint {
  x: number
  y: number
  /** Towards the viewer is positive. */
  z: number
  r: number
}

/** The two moons of the original identity artwork. */
export const IDENTITY_MOONS: OrbitMoon[] = [
  { radius: 72, orbit: 650, incline: 1.33, tilt: 0.28, period: 26, phase: -2.3 },
  { radius: 46, orbit: 430, incline: 1.08, tilt: -0.5, period: 14, phase: -0.75 },
]

// Feature constellation: every moon shares one orbit plane, tilted against the planet's ring, and
// one period, spaced evenly around it. Moons never overtake each other, so labels stay apart.
const CONSTELLATION_PERIOD = 30
const CONSTELLATION_INCLINE = 1.12
const CONSTELLATION_TILT = 0.18
// Chosen so the first frame shows every moon clear of the planet disc, the API moon up front.
const CONSTELLATION_PHASE = 2.2
// One orbit radius per moon (six products); spaced so neighbours stay apart for a whole turn.
const CONSTELLATION_ORBITS = [690, 650, 700, 630, 670, 610]

/** Moons for a row of features, one per moon radius, in orbit order. */
export function constellationMoons(sizes: number[]): OrbitMoon[] {
  const step = (2 * Math.PI) / Math.max(1, sizes.length)
  return sizes.map((radius, index) => ({
    radius,
    orbit: CONSTELLATION_ORBITS[index % CONSTELLATION_ORBITS.length],
    incline: CONSTELLATION_INCLINE,
    tilt: CONSTELLATION_TILT,
    period: CONSTELLATION_PERIOD,
    phase: CONSTELLATION_PHASE + index * step,
  }))
}

const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v))
const mod1 = (v: number) => v - Math.floor(v)
const glyph = (ink: number) => RAMP[Math.round((1 - clamp(ink)) * (RAMP.length - 1))]

function shade(dx: number, dy: number, dz: number, floor: number, grid: boolean, spin = 0) {
  const lam = clamp(dx * LIGHT[0] + dy * LIGHT[1] + dz * LIGHT[2])
  let s = floor + (1 - floor) * lam ** 0.75 + 0.25 * (1 - dz) ** 3
  if (grid) {
    const t = 0.35
    const ty = dy * Math.cos(t) - dz * Math.sin(t)
    const tz = dy * Math.sin(t) + dz * Math.cos(t)
    const lat = Math.asin(clamp(-ty, -1, 1))
    // The light stays put while the graticule turns underneath it: that is what reads as rotation.
    const lon = Math.atan2(dx, tz) + spin
    const step = Math.PI / 3
    const onLat = Math.abs(mod1(lat / step + 0.5) - 0.5) < 0.1
    const onLon = Math.abs(mod1(lon / step + 0.5) - 0.5) < 0.09 / (0.35 + Math.cos(lat))
    if ((onLat || onLon) && dz > 0.25) s *= 0.35
  }
  return clamp(s) ** 0.85
}

function sampleXY(cell: number, sub: number) {
  const col = cell % ORBIT_COLS
  const row = (cell - col) / ORBIT_COLS
  return [(col + ((sub % SX) + 0.5) / SX) * CW, (row + (Math.floor(sub / SX) + 0.5) / SY) * CH]
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Where a moon is at `time` seconds, in virtual canvas units. */
export function moonPosition(m: OrbitMoon, time: number): MoonPoint {
  const phi = m.phase + (2 * Math.PI * time) / m.period
  const u = m.orbit * Math.cos(phi)
  const depth = m.orbit * Math.sin(phi)
  const v = depth * Math.cos(m.incline)
  const ct = Math.cos(m.tilt)
  const st = Math.sin(m.tilt)
  return { x: ORBIT_CX + u * ct - v * st, y: ORBIT_CY + u * st + v * ct, z: depth * Math.sin(m.incline), r: m.radius }
}

/** True while a moon passes behind the core, where it is drawn partly or fully hidden. */
export function isBehindCore(p: MoonPoint) {
  return p.z < 0 && Math.hypot(p.x - ORBIT_CX, p.y - ORBIT_CY) < ORBIT_CORE_R + p.r * 0.5
}

export interface OrbitLayers {
  /** Planet, ring, stars and orbit paths, with the cells the moons cover left blank. */
  base: string
  /** Only the moons, blank everywhere else, so they can be drawn in their own colour. */
  moons: string
}

export interface OrbitSceneOptions {
  /**
   * Planet rotation in radians per second. The lit side never moves; the surface grid and the
   * ring's segment gaps travel across it. Off by default so the identity artwork stays fixed.
   */
  planetSpin?: number
}

export interface OrbitScene {
  /** The frame at `time` seconds as ORBIT_ROWS lines of ORBIT_COLS characters. */
  render(time: number): string
  /** The same frame split into two stackable layers of identical size. */
  renderLayers(time: number): OrbitLayers
  positions(time: number): MoonPoint[]
}

export function createOrbitScene(moons: OrbitMoon[], options: OrbitSceneOptions = {}): OrbitScene {
  const planetSpin = options.planetSpin ?? 0
  const staticInk = new Float32Array(CELLS * SUBS)
  const staticZ = new Float32Array(CELLS * SUBS).fill(-Infinity)
  const staticChars: string[] = new Array(CELLS)
  // Sub-samples the spin repaints every frame: the planet's surface and the ring's outer band.
  const coreSamples: { i: number; dx: number; dy: number; dz: number }[] = []
  const ringSamples: { i: number; theta: number; depth: number; v: number; inCore: boolean }[] = []
  const liveCells = new Set<number>()

  const ca = Math.cos(RING_TILT)
  const sa = Math.sin(RING_TILT)
  for (let cell = 0; cell < CELLS; cell++) {
    for (let sub = 0; sub < SUBS; sub++) {
      const [x, y] = sampleXY(cell, sub)
      const i = cell * SUBS + sub
      const px = x - ORBIT_CX
      const py = y - ORBIT_CY
      const u = px * ca + py * sa
      const v = -px * sa + py * ca
      const s = Math.hypot(u / RING_RX, v / RING_RY)
      const theta = Math.atan2(v / RING_RY, u / RING_RX)
      const inner = s > 0.76 && s < 0.93
      const outer = s > 1.01 && s < 1.24
      const divider = mod1((theta * 28) / (2 * Math.PI)) < 0.16
      const depth = 0.5 + 0.5 * Math.sin(theta)
      const onRing = inner || (outer && !divider)
      const ringInk = (outer ? 0.35 + 0.6 * depth : 0.2 + 0.35 * depth) ** 0.85
      const inCore = px * px + py * py <= ORBIT_CORE_R * ORBIT_CORE_R
      if (onRing && v < 0 && !inCore) {
        staticInk[i] = ringInk
        staticZ[i] = v * RING_Z
      }
      if (inCore) {
        const dx = px / ORBIT_CORE_R
        const dy = py / ORBIT_CORE_R
        const dz = Math.sqrt(clamp(1 - dx * dx - dy * dy))
        staticInk[i] = shade(dx, dy, dz, 0.2, true)
        staticZ[i] = dz * ORBIT_CORE_R
        if (planetSpin) {
          coreSamples.push({ i, dx, dy, dz })
          liveCells.add(cell)
        }
      }
      if (onRing && v >= 0) {
        staticInk[i] = ringInk
        staticZ[i] = v * RING_Z
      }
      if (planetSpin && outer && (v >= 0 || !inCore)) {
        ringSamples.push({ i, theta, depth, v, inCore })
        liveCells.add(cell)
      }
    }
  }
  const rand = mulberry32(11)
  for (let n = 0; n < 28; n++) {
    const col = Math.floor(rand() * ORBIT_COLS)
    const row = Math.floor(rand() * ORBIT_ROWS)
    const value = (0.4 * (0.7 + rand() * 0.9)) ** 0.85
    if (Math.abs(row * CH - ORBIT_CY) < 400 && Math.abs(col * CW - ORBIT_CX) < 760) continue
    for (let sub = 0; sub < SUBS; sub++) {
      const i = (row * ORBIT_COLS + col) * SUBS + sub
      staticInk[i] = Math.max(staticInk[i], value)
    }
  }
  for (let cell = 0; cell < CELLS; cell++) {
    let sum = 0
    for (let sub = 0; sub < SUBS; sub++) sum += staticInk[cell * SUBS + sub]
    staticChars[cell] = glyph(sum / SUBS)
  }
  // Dotted orbit paths, only through empty space.
  for (const m of moons) {
    for (let k = 0; k < 96; k++) {
      const p = moonPosition(m, (k / 96) * m.period)
      const col = Math.floor(p.x / CW)
      const row = Math.floor(p.y / CH)
      if (col < 0 || col >= ORBIT_COLS || row < 0 || row >= ORBIT_ROWS) continue
      const cell = row * ORBIT_COLS + col
      if (staticChars[cell] === ' ') staticChars[cell] = k % 2 ? ' ' : '.'
    }
  }

  const positions = (time: number) => moons.map(m => moonPosition(m, time))

  /** Repaints the spinning parts of the planet for `time`; returns the cells whose glyph changed. */
  function spinCells(time: number) {
    const changed = new Map<number, string>()
    if (!planetSpin || !time) return changed
    const turn = planetSpin * time
    for (const { i, dx, dy, dz } of coreSamples) staticInk[i] = shade(dx, dy, dz, 0.2, true, turn)
    // The ring turns in its own plane, a third as fast, so its gaps drift rather than race.
    const ringTurn = turn / 3
    for (const { i, theta, depth, v, inCore } of ringSamples) {
      if (v < 0 && inCore) continue // the back half passes behind the planet; the core ink above stands
      const divider = mod1(((theta + ringTurn) * 28) / (2 * Math.PI)) < 0.16
      if (!divider) staticInk[i] = (0.35 + 0.6 * depth) ** 0.85
      else if (!inCore) staticInk[i] = 0 // a gap over the planet shows the planet, not a hole
    }
    for (const cell of liveCells) {
      let sum = 0
      for (let sub = 0; sub < SUBS; sub++) sum += staticInk[cell * SUBS + sub]
      const char = glyph(sum / SUBS)
      if (char !== staticChars[cell]) changed.set(cell, char)
    }
    return changed
  }

  /** Glyphs for the cells where a moon is the front-most surface at `time`. */
  function moonCells(time: number) {
    const points = positions(time)
    const cells = new Map<number, string>()
    const done = new Set<number>()
    for (const moon of points) {
      const c0 = Math.max(0, Math.floor((moon.x - moon.r) / CW))
      const c1 = Math.min(ORBIT_COLS - 1, Math.floor((moon.x + moon.r) / CW))
      const r0 = Math.max(0, Math.floor((moon.y - moon.r) / CH))
      const r1 = Math.min(ORBIT_ROWS - 1, Math.floor((moon.y + moon.r) / CH))
      for (let row = r0; row <= r1; row++) {
        for (let col = c0; col <= c1; col++) {
          const cell = row * ORBIT_COLS + col
          if (done.has(cell)) continue
          done.add(cell)
          let sum = 0
          let hit = false
          for (let sub = 0; sub < SUBS; sub++) {
            const [x, y] = sampleXY(cell, sub)
            let ink = staticInk[cell * SUBS + sub]
            let z = staticZ[cell * SUBS + sub]
            for (const other of points) {
              const dx = (x - other.x) / other.r
              const dy = (y - other.y) / other.r
              const d2 = dx * dx + dy * dy
              if (d2 > 1) continue
              const dz = Math.sqrt(1 - d2)
              const surface = other.z + dz * other.r
              if (surface <= z) continue
              ink = shade(dx, dy, dz, 0.2, false)
              z = surface
              hit = true
            }
            sum += ink
          }
          if (hit) cells.set(cell, glyph(sum / SUBS))
        }
      }
    }
    return cells
  }

  function toText(chars: string[]) {
    const lines: string[] = []
    for (let row = 0; row < ORBIT_ROWS; row++) lines.push(chars.slice(row * ORBIT_COLS, (row + 1) * ORBIT_COLS).join(''))
    return lines.join('\n')
  }

  function render(time: number) {
    const chars = staticChars.slice()
    for (const [cell, char] of spinCells(time)) chars[cell] = char
    for (const [cell, char] of moonCells(time)) chars[cell] = char
    return toText(chars)
  }

  function renderLayers(time: number): OrbitLayers {
    const base = staticChars.slice()
    const moons: string[] = new Array(CELLS).fill(' ')
    for (const [cell, char] of spinCells(time)) base[cell] = char
    for (const [cell, char] of moonCells(time)) {
      base[cell] = ' '
      moons[cell] = char
    }
    return { base: toText(base), moons: toText(moons) }
  }

  return { render, renderLayers, positions }
}
