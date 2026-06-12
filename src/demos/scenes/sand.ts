// 01 - Falling Sand. The cold open of the film. A single off-center stream
// pours through the title; then one sweep of the hand carries the pour across
// three staggered stone ledges, each spill feeding the ledge below. Pyramids
// at the angle of repose; a hard rain to close.
//
// Engine truth: water cannot push settled sand around (liquids never displace
// powders), so the honest payoff of the rain is the wet-sand darkening and the
// ponds that gather in the hollows - the rain is heavy enough to read on both.

import type { World } from '../../sim/world'
import { SAND, STONE, WATER } from '../../sim/elements'
import { dot, ramp, rect, type Scene } from '../lib'

const SWEEP_AT = 260 // title owns the open: fixed off-center pour until here
const SWEEP_LEN = 440 // one full cosine arc, 146 -> 34 -> 146
const EASE_AT = SWEEP_AT + SWEEP_LEN // final leg: decelerate to crown the middle ledge
const POUR_END = 880
const RAIN_AT = 910
const RAIN_END = 1100

export const SCENE: Scene = {
  title: 'Falling Sand',
  seed: 12648430, // pinned (legacy index-derived; staging frame-verified under this)
  blurb:
    'The namesake, plainly: sand poured in one slow sweep over three stone ledges. Each grain tumbles to ' +
    'its angle of rest, every ledge spills into the next, and a hard rain ends the scene: the dunes drink, ' +
    'darken, and still, and water ponds in the hollows.',
  film: [
    'Draw three staggered stone (=) ledges stepping down from upper right to lower left.',
    'Select sand (2) and hold the pour off-center over the high ledge, then sweep slowly left and back.',
    'Let each pyramid saturate; the spill from one ledge builds the pile on the next.',
    'Finish with a hard rain of water (1): the crests darken wet, and ponds gather in the hollows.',
  ],
  duration: 1140,
  captions: [
    { at: 360, text: 'sand, poured over stone' },
    { at: 600, text: 'each grain finds its angle of rest' },
    { at: 800, text: 'pyramids, grain by grain' },
    { on: 'wetting', count: 90, delay: 10, text: 'then rain - the dunes drink, and darken' },
  ],
  rate: ramp([[480, 1], [910, 2], [1140, 1]]),
  capAnchor: 'top',
  holdIn: 6,
  holdOut: 60,
  setup(w) {
    rect(w, 126, 50, 170, 54, STONE) // high ledge, right
    rect(w, 64, 80, 128, 84, STONE) // middle ledge - catches the high spill
    rect(w, 12, 102, 66, 106, STONE) // low ledge, left - catches the middle spill
  },
  tick(w, f) {
    if (f < POUR_END) {
      // Fixed pour at x=146 through the title, then one cosine sweep
      // (146 -> 34 -> 146) so the stream never crosses the top-center title
      // band early, then a smoothstep deceleration that comes to rest over
      // the middle ledge and crowns it. Spawn at y=16: below both the title
      // and the top caption band.
      let x: number
      if (f < SWEEP_AT) x = 146
      else if (f < EASE_AT) x = Math.round(90 + 56 * Math.cos((Math.PI * 2 * (f - SWEEP_AT)) / SWEEP_LEN))
      else {
        const t = (f - EASE_AT) / (POUR_END - EASE_AT)
        x = Math.round(146 - 50 * t * t * (3 - 2 * t))
      }
      w.paint(x, 16, 1, SAND)
    }
    if (f >= RAIN_AT && f < RAIN_END) {
      // hard deterministic rain across the whole dunescape, spawned just
      // below the caption band
      for (let k = 0; k < 6; k++) dot(w, 8 + ((f * 37 + k * 29) % 164), 14, WATER)
    }
  },
}
