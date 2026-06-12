// 02 - The Settling. Five liquids poured out of order into a tall narrow
// glass alembic; left alone they sort into five horizontal bands. Then gold
// falls through everything and the mercury swallows it (Amalgam).
//
// Pour discipline (load-bearing): liquids in this sim only displace each
// other VERTICALLY (horizontal moves need empty space), so global horizontal
// bands form only if every column receives the same composition. Each pour
// event is therefore a dashed half-row landing simultaneously across the
// whole mouth: simultaneous landing leaves no surface tilt, so there is no
// lateral drift to smear the bands. Swept blobs and multi-frame curtains
// both freeze into vertical streaks / wide combs (verified failure modes).

import type { World } from '../../sim/world'
import { AQUA, BRINE, GLASS, GOLD, MERCURY, OIL, WATER } from '../../sim/elements'
import { dot, ramp, rect, type Scene } from '../lib'

// Interleaved bursts (element, events). One event = one full-width row of
// dots landing in the SAME frame: the pool surface stays flat at all times,
// so lateral surface flow (the band-smearing mechanism) never happens and
// every column receives exactly the same composition. Band depths: water 15
// rows, oil 14, brine 11, aqua 9, mercury a 4-row bottom film. The tail is
// deliberately wrong-ordered (water, brine, then mercury last) so the
// settle shows heavy liquid visibly piercing the stack.
const BURSTS: [number, number][] = [
  [WATER, 3], [OIL, 3], [BRINE, 3], [AQUA, 3], [MERCURY, 2],
  [OIL, 3], [WATER, 3], [BRINE, 3], [AQUA, 3], [OIL, 3],
  [WATER, 3], [BRINE, 3], [MERCURY, 1], [OIL, 3], [WATER, 3],
  [AQUA, 3], [OIL, 2], [WATER, 3], [BRINE, 2], [MERCURY, 1],
]

const CURTAINS: number[] = []
for (const [e, n] of BURSTS) for (let i = 0; i < n; i++) CURTAINS.push(e)
const POUR_END = CURTAINS.length * 10 // 53 events * 10 frames = 530

export const SCENE: Scene = {
  title: 'The Settling',
  seed: 12655763, // pinned (legacy index-derived; staging frame-verified under this)
  blurb:
    'Pour five liquids into a tall glass alembic in chaotic order and let the bench sort them: ' +
    'mercury (135) under brine (24) under water (20) under oil (10) under aqua vitae (8). ' +
    'Then drop gold - it falls through every band, lands on the quicksilver, and is slowly swallowed (Amalgam).',
  film: [
    'Build a tall narrow glass alembic: two walls, a floor, a flared lip.',
    'Rain mercury (a), brine, water (1), oil (4), aqua vitae (g) in dashed curtains - deliberately out of order.',
    'Wait. Do not stir. Five horizontal bands self-organize.',
    'Drop a pinch of gold (f) down the middle; it pierces every band and rests on the mercury.',
    'Hold the shot while the quicksilver eats the gold, grain by grain.',
  ],
  duration: 1780,
  captions: [
    { at: 12, text: 'five liquids, poured out of order' },
    { at: 700, text: 'left alone, they find their order' },
    { at: 845, text: 'gold falls through everything' },
    { on: 'amalgam', count: 4, delay: 24, text: 'amalgam - the quicksilver swallows the sun' },
  ],
  capAnchor: 'top',
  holdOut: 84,
  // 1x rain establish -> 3x pour completes + the sort finishes on screen ->
  // 1x settled bands + gold pinch -> 3x drizzle -> 2x final swallow.
  rate: ramp([[300, 1], [700, 3], [1060, 1], [1500, 3], [1780, 2]]),
  setup(w) {
    rect(w, 62, 24, 64, 110, GLASS) // left wall
    rect(w, 114, 24, 116, 110, GLASS) // right wall
    rect(w, 62, 108, 116, 110, GLASS) // floor
    rect(w, 60, 24, 61, 25, GLASS) // flared lip, left
    rect(w, 117, 24, 118, 25, GLASS) // flared lip, right
  },
  tick(w, f) {
    // the pour: one full-width row every 10 frames, landing as one piece
    if (f < POUR_END && f % 10 === 0) {
      const e = CURTAINS[f / 10]!
      for (let x = 65; x <= 113; x++) dot(w, x, 18, e)
    }
    // gold pinch: 10 deliberate grains down the center
    if (f >= 820 && f < 880 && f % 6 === 0) dot(w, 88 + ((f / 6) % 3), 16, GOLD)
    // sparse drizzle while the amalgam eats (stops ~400 frames before end)
    if (f >= 1080 && f < 1400 && f % 18 === 0) dot(w, 78 + ((f / 18) * 7) % 23, 16, GOLD)
  },
}
