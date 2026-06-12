// The showcase cut: scene modules in film order, plus compatibility re-exports
// so demos.ts and record.ts keep importing from this path. Scene scripts live
// in scenes/ (one module each, so they can be iterated independently).

import type { Scene } from './lib'
import { SCENE as sand } from './scenes/sand'
import { SCENE as volcano } from './scenes/volcano'
import { SCENE as settling } from './scenes/settling'
import { SCENE as hourglass } from './scenes/hourglass'
import { SCENE as candle } from './scenes/candle'
import { SCENE as garden } from './scenes/garden'
import { SCENE as keg } from './scenes/keg'
import { SCENE as distillery } from './scenes/distillery'
import { SCENE as firedamp } from './scenes/firedamp'
import { SCENE as reef } from './scenes/reef'
import { SCENE as vines } from './scenes/vines'
import { SCENE as dam } from './scenes/dam'
import { SCENE as opus } from './scenes/opus'
import { SCENE as endcard } from './scenes/endcard'

// Film order. The volcano sits second as the early hook; every combustion
// scene (volcano, wildfire, keg, firedamp, vines) is followed by a quieter
// one so the film keeps its breath. Scenes pin their RNG seeds, so insertion
// here never re-rolls existing staging.
export const SCENES: Scene[] = [
  sand, volcano, settling, hourglass, candle, garden, keg, distillery,
  firedamp, reef, vines, dam, opus,
]

export const END_CARD: Scene = endcard

export { W, H, colorize, dot, igniteNear, jig, line, ramp, rect, topOf } from './lib'
export type { Cap, Scene } from './lib'
