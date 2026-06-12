// 04 - The Candle That Remembers. A candelabrum: three wax pillars lit in
// sequence, burned, and left to rest. Fire driven INTO the crown (a wandering
// wick) renders wax to molten wax that drips and pools; each flame is stopped
// in turn, and the melt congeals into new shapes - shorter, slumped, skirted.

import type { World } from '../../sim/world'
import { FIRE, MWAX, STONE, WAX } from '../../sim/elements'
import { ramp, rect, topOf, type Scene } from '../lib'

// Three pillars on one stone table: left short, center tall, right medium.
// Each has its own flame window so all three keep a distinct stub at the end.
const PILLARS = [
  { x0: 50, x1: 58, top: 80, start: 250, stop: 580 }, // left - short, lit second
  { x0: 84, x1: 96, top: 54, start: 0, stop: 1550 }, // center - tall, lit first
  { x0: 118, x1: 128, top: 70, start: 450, stop: 1200 }, // right - medium, lit third
]

export const SCENE: Scene = {
  title: 'The Candle That Remembers',
  seed: 12670429, // pinned (legacy index-derived; staging frame-verified under this)
  blurb:
    'Three wax pillars lit in turn. Fire renders wax to molten wax, which drips and pools on the ' +
    'table; away from heat it congeals back into solid wax. The candles reshape themselves.',
  film: [
    'Draw a lipped stone (=) table, then three wax (0) pillars of different heights.',
    'Light them in sequence - tend each wick by dabbing fire (3) into the crown.',
    'Patience shot: drips run the sides, pool, and merge into a skirt.',
    'Let the flames die in turn, then let the melt fully set (Congeal).',
    'Compare the final silhouettes to the opening: shorter, slumped, remembered.',
  ],
  duration: 2450,
  captions: [
    { at: 80, text: 'three candles, lit in turn' },
    { at: 900, text: 'the wax remembers every flame' },
    { at: 1850, text: 'left to rest, it sets in a new shape' },
  ],
  capAnchor: 'top',
  holdOut: 90,
  rate: ramp([[150, 1], [520, 2], [2450, 3]]),
  setup(w) {
    rect(w, 24, 104, 156, 108, STONE)
    rect(w, 24, 101, 25, 103, STONE) // table lips: keep the melt on the table
    rect(w, 155, 101, 156, 103, STONE)
    for (const p of PILLARS) rect(w, p.x0, p.top, p.x1, 103, WAX)
  },
  tick(w, f) {
    for (let i = 0; i < PILLARS.length; i++) {
      const p = PILLARS[i]!
      if (f < p.start || f >= p.stop) continue
      const span = p.x1 - p.x0 + 1
      // Wandering wick: drive fire directly INTO the wax crown so heat
      // actually transfers (fire dabbed above never renders the pillar).
      // The wick wanders a few columns past the walls but only ignites wax in
      // the crown band - so drips that congeal mid-air at the receding crown's
      // shoulders get burned off instead of stranding as floating beads, while
      // the walls below and the pooled skirt on the table are never torched.
      if ((f - p.start) % 4 === 0) {
        let crown = 103
        for (let cx = p.x0; cx <= p.x1; cx++) {
          const cy = topOf(w, cx, 20, 103)
          if (cy < crown) crown = cy
        }
        const x = p.x0 - 5 + ((f * 7919 + i * 131) % (span + 10))
        const y = topOf(w, x, 20, 103)
        if (y < 96 && y <= crown + 2 && w.at(x, y) === WAX) {
          w.set(x, y, FIRE, (34 + w.rng() * 26) | 0)
        }
      }
      // Visible flame body: a solid root right on the crown plus sparse licks
      // above it, every other frame, so the flame reads as a body, not sparks.
      if ((f - p.start) % 2 === 0) {
        const x = p.x0 + ((f * 53 + i * 17) % span)
        const y = topOf(w, x, 20, 103)
        const crown = w.at(x, y)
        if (y < 103 && (crown === WAX || crown === MWAX)) {
          if (w.at(x, y - 1) === 0) w.set(x, y - 1, FIRE, (30 + w.rng() * 40) | 0)
          w.paint(x, y - 2, 1, FIRE, true)
        }
      }
    }
  },
}
