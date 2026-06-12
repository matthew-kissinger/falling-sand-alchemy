// Shared scene infrastructure for the showcase pipeline: paint helpers, the
// Scene contract, and the colorizer. Pure and DOM-free so it runs in the
// browser bench (demos.html), the headless recorder (record.ts), and the
// frame-prototyping harness (proto.ts).

import { World } from '../sim/world'
import { ELEMENTS, EMPTY, FIRE, GOLD, MERCURY, PLANT, SAND, SPIRIT, STEAM, spawnAux } from '../sim/elements'

export const W = 180
export const H = 120

/* ───────────────────────── paint helpers ───────────────────────── */

/** Direct fill (overwrites) — for building stone fixtures and pre-set pools. */
export function rect(w: World, x0: number, y0: number, x1: number, y1: number, e: number): void {
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++) w.set(x, y, e, spawnAux(e, w.rng))
}

/** Direct fill with an explicit aux value. The load-bearing use is wet-packed
 *  sand/clay (aux=1): wet powder skips the diagonal slide, so strata hold
 *  crisp vertical faces yet still drop straight down when undermined. */
export function rectAux(w: World, x0: number, y0: number, x1: number, y1: number, e: number, aux: number): void {
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++) w.set(x, y, e, aux)
}

/** Thick line of element (Bresenham-ish walk painting discs). */
export function line(w: World, x0: number, y0: number, x1: number, y1: number, r: number, e: number): void {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1
  for (let s = 0; s <= steps; s++) {
    const x = Math.round(x0 + ((x1 - x0) * s) / steps)
    const y = Math.round(y0 + ((y1 - y0) * s) / steps)
    for (let dy = -r; dy <= r; dy++)
      for (let dx = -r; dx <= r; dx++)
        if (dx * dx + dy * dy <= r * r) w.set(x + dx, y + dy, e, 0)
  }
}

/** Topmost solid cell in a column (skips flames/steam so the probe sees the body). */
export function topOf(w: World, x: number, yFrom = 0, yTo = H - 1): number {
  for (let y = yFrom; y <= yTo; y++) {
    const e = w.at(x, y)
    if (e !== EMPTY && e !== FIRE && e !== STEAM && e !== SPIRIT) return y
  }
  return yTo
}

/** Deterministic scatter so loops replay identically per seed. */
export const jig = (f: number, lo: number, hi: number) => lo + ((f * 7919) % (hi - lo))

/** Single-pixel placement (only into empty space) — precision pours. */
export function dot(w: World, x: number, y: number, e: number): void {
  if (w.at(x, y) === EMPTY) w.set(x, y, e, spawnAux(e, w.rng))
}

/** Find a PLANT cell in the column band and set fire directly above it. */
export function igniteNear(w: World, x0: number, x1: number, f: number): void {
  const x = x0 + ((f * 13) % (x1 - x0))
  for (let y = 16; y < H - 2; y++) {
    if (w.at(x, y) === PLANT) {
      if (w.at(x, y - 1) === EMPTY) w.set(x, y - 1, FIRE, 40)
      return
    }
  }
}

/** Write the world as packed pixels (channels 3 = RGB for ffmpeg rawvideo,
 *  4 = RGBA for canvas ImageData). Same shading as the bench page. */
export function colorize(world: World, out: Uint8Array | Uint8ClampedArray, channels: 3 | 4): void {
  const { grid, aux, shade } = world
  for (let i = 0, p = 0; i < world.n; i++, p += channels) {
    const e = grid[i]!
    const def = ELEMENTS[e]!
    const s = 0.82 + (shade[i]! / 255) * 0.36
    const g = def.glow * 0.25
    let r = def.color[0] * s + g
    let gc = def.color[1] * s + g
    let b = def.color[2] * s + g
    // material accents ported from the game renderer (renderer.ts fillBuffer)
    if (e === SAND && aux[i] === 1) {
      r *= 0.68; gc *= 0.72; b *= 0.82 // wet sand: darker, cooler
    } else if (e === GOLD && shade[i]! > 235) {
      r = 255; gc = 240; b = 170 // glint
    } else if (e === MERCURY && shade[i]! > 240) {
      r = 240; gc = 244; b = 252 // specular bead
    }
    out[p] = Math.min(255, r)
    out[p + 1] = Math.min(255, gc)
    out[p + 2] = Math.min(255, b)
    if (channels === 4) out[p + 3] = 255
  }
}

/* ───────────────────────── scene contract ───────────────────────── */

export interface Cap {
  /** Show at this absolute sim frame... */
  at?: number
  /** ...or when this codex discovery first fires (event-synced). */
  on?: string
  /** Sim frames after the event before the text lands (default 24 ≈ 0.4s). */
  delay?: number
  /** Event-synced: arm only at the Nth firing of the event (default 1st). */
  count?: number
  text: string
}

export interface Scene {
  title: string
  blurb: string
  film: string[]
  duration: number
  captions: Cap[]
  /** Pinned RNG seed. Scenes pin the seed they were frame-verified under so
   *  that reordering or inserting scenes never re-rolls existing staging.
   *  Default (legacy): 0xc0ffee + index * 7333. */
  seed?: number
  setup: (w: World) => void
  tick: (w: World, f: number) => void
  /** Sim steps per output frame for the recorder (speed ramp). The browser
   *  bench ignores this and always runs 1x. Default 1x. */
  rate?: (f: number) => number
  /** Where captions render: in the sky band or on the floor band. Pick the
   *  scene's negative space. Default 'bottom'. */
  capAnchor?: 'top' | 'bottom'
  /** Recorder holds (output frames at 60fps) before/after the scripted run. */
  holdIn?: number
  holdOut?: number
}

/** Speed-ramp helper: segments of [untilSimFrame, stepsPerOutputFrame]. */
export const ramp = (segs: [number, number][]) => (f: number): number => {
  for (const [until, r] of segs) if (f < until) return r
  return 1
}
