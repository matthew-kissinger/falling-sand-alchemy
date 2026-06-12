// End card: a shallow glass dish holding a thin mercury film, centered low
// under the recorder-drawn title (y30-55 band stays clear of standing
// material). Gold drizzles down the center; the quicksilver eats the first
// grains (amalgam, p=0.02 per contact per step) but the drizzle outruns the
// nibble and a golden mound rises visibly out of the silver film - the payoff
// the previous cut lacked. No captions: the title is the only text.

import type { World } from '../../sim/world'
import { GLASS, GOLD, MERCURY } from '../../sim/elements'
import { jig, rect, type Scene } from '../lib'

export const SCENE: Scene = {
  title: 'Falling Sand Alchemy',
  seed: 12721760, // pinned (legacy index-derived; staging frame-verified under this)
  blurb:
    'End card: gold drizzled onto a thin mercury film in a shallow glass dish. ' +
    'Amalgam swallows the early grains, then the mound breaches the silver surface.',
  film: [],
  duration: 760,
  captions: [],
  holdOut: 75,
  setup(w) {
    rect(w, 58, 109, 121, 111, GLASS) // dish floor
    rect(w, 58, 103, 60, 108, GLASS) // left wall (low: shallow dish)
    rect(w, 119, 103, 121, 108, GLASS) // right wall
    rect(w, 61, 107, 118, 108, MERCURY) // 2px mercury film, wall to wall
  },
  tick(w, f) {
    // narrow centered drizzle from the top of frame, falling through the title
    if (f >= 30 && f <= 610 && f % 6 === 0) w.paint(jig(f, 85, 96), 10, 1, GOLD)
  },
}
