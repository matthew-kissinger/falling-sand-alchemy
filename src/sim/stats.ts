// Per-frame material census + activity — the audio engine's conductor score.
// Cheap O(N) pass; call at the audio update rate (~10 Hz), not per frame.

import {
  ACID, AQUA, AZOTH, BRINE, FIRE, GAS, LAVA, LYE, MERCURY, MWAX, OIL, PLANT,
  REBIS, SPIRIT, STEAM, WATER,
} from './elements'
import type { World } from './world'

export interface SimStats {
  /** Cell counts by sound class. */
  water: number
  fire: number
  steam: number
  plant: number
  /** Movement activity this step, by move class. */
  powderMoved: number
  liquidMoved: number
  gasMoved: number
  /** 0..1 — overall busyness, for the bed's swell. */
  activity: number
}

const WATERY = new Set([WATER, BRINE, LYE, ACID, AQUA, AZOTH, OIL, MERCURY, MWAX, REBIS])
const FIERY = new Set([FIRE, LAVA, SPIRIT])
const STEAMY = new Set([STEAM, GAS])

export function collectStats(world: World): SimStats {
  let water = 0, fire = 0, steam = 0, plant = 0
  const g = world.grid
  for (let i = 0; i < world.n; i++) {
    const e = g[i]!
    if (e === 0) continue
    if (WATERY.has(e)) water++
    else if (FIERY.has(e)) fire++
    else if (STEAMY.has(e)) steam++
    else if (e === PLANT) plant++
  }
  const m = world.moved
  const activity = Math.min(1, (m.powder + m.liquid + m.gas * 2 + fire) / (world.n * 0.08))
  return {
    water, fire, steam, plant,
    powderMoved: m.powder, liquidMoved: m.liquid, gasMoved: m.gas,
    activity,
  }
}
