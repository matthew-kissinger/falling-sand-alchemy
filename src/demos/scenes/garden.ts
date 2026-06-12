// 05 - Wildfire. A planted garden - six tall bushes rooted into a buried
// root line - leafs out under a light rain; then one spark at the left edge,
// and the fire takes the garden the way a real ground fire does: along the
// roots, then UP through every limb of every bush it reaches (burnPlant
// spreads flame through the connected body, shedding ash). Rain returns; the
// ash steeps to lye; spores ride the wind back in; what survives, regrows.
//
// Staging truths (learned against real frames): standing water + photosynthesis
// grows a FLAT MAT, never towers - tall bodies must be planted (plant is a
// shelf element; the dam scene paints tufts the same way) with energized
// crowns (aux>0) so the rain visibly leafs them out. A surface fuel line
// drowns: rain pockets lodge in the mat and every wet cell kills the front
// (fire + water -> steam). A buried plant fuse self-blocks: burnPlant sheds
// ash 25% of the time and two ash cells in one column plug the tunnel
// (~16-column run, measured) - and fire NEVER moves sideways (behave() only
// drifts it up into empty), so no air channel can carry it. The fuse that
// works is OIL: fire + oil -> fire at p=0.5 with no ash branch, so the front
// can never block itself, and debris that falls in sinks through the lighter
// liquid - the fuse self-heals. A static plant cap roofs the oil vein (clay
// would sink through it), burning overhead as the front passes: the running
// surface flame. Bush trunks root down through the cap into the vein, two
// cells wide so the climbing fire never strands the upper body when one cell
// burns through to ash.

import type { World } from '../../sim/world'
import { CLAY, FIRE, OIL, PLANT, SPORE, WATER } from '../../sim/elements'
import { dot, jig, line, ramp, rect, type Scene } from '../lib'
import { H, W } from '../lib'

const SITES = [22, 48, 74, 100, 126, 152]
const HEIGHTS = [26, 30, 22, 28, 24, 29]
const IGNITE = 860

/** One hand-planted bush: a meandering 2px trunk standing on the cap (the
 *  cap is 4-adjacent to the oil vein, so the vein fire climbs in by itself -
 *  plant roots must NOT pierce the vein: they can ash-plug it, measured),
 *  three diagonal limbs, and an energized crown that leafs out in rain. */
function plantBush(w: World, sx: number, i: number): void {
  const h = HEIGHTS[i]!
  let x = sx
  let branch = 0
  for (let s = 0; s < h; s++) {
    const y = 97 - s
    if (s > 2 && s % 3 === 0) x += ((i * 7 + s) % 3) - 1
    const en = s > h - 4 ? 14 : 0
    w.set(x, y, PLANT, en)
    w.set(x + 1, y, PLANT, en)
    // three limbs per bush, alternating sides, rising diagonally. Every cell
    // is 4-connected (fire spreads orthogonally only - a diagonal-only limb
    // half-burns and strands floating green, measured), so each up-step
    // paints the bridge cell too.
    if (s === ((h * 0.45) | 0) || s === ((h * 0.68) | 0) || s === ((h * 0.88) | 0)) {
      const dir = branch++ % 2 === 0 ? 1 : -1
      const len = 5 + ((i + s) % 3)
      let lx = dir > 0 ? x + 1 : x
      let ly = y
      for (let k = 1; k <= len; k++) {
        lx += dir
        const len2 = k > len - 3 ? 12 : 0
        w.set(lx, ly, PLANT, len2)
        if (k % 2 === 0) {
          ly -= 1
          w.set(lx, ly, PLANT, len2)
        }
      }
    }
  }
  // the crown clump (gap row filled so the crown is 4-connected to the trunk)
  const ty = 97 - h
  w.set(x, ty, PLANT, 14)
  w.set(x + 1, ty, PLANT, 14)
  w.set(x, ty - 1, PLANT, 14)
  w.set(x + 1, ty - 1, PLANT, 14)
  w.set(x - 1, ty, PLANT, 14)
  w.set(x + 2, ty, PLANT, 14)
}

export const SCENE: Scene = {
  title: 'Wildfire',
  seed: 12677762, // pinned (legacy index-derived; staging frame-verified under this)
  blurb:
    'A planted garden of six tall bushes, rooted into one buried oil vein, leafs out under a light rain ' +
    '(Photosynthesis, Germination). Then a single spark into the vein: the fire runs the fuse beneath the ' +
    'field (Ignition) and climbs every limb of every bush it reaches (Wildfire, Cremation), shedding ash ' +
    'as it goes. The rain returns, steeps the ash into lye (Potash), and wind-blown spores reseed the burn.',
  film: [
    'Lay a clay (7) floor; bury a 2px vein of oil (4) under a thin connected line of plant (8).',
    'Plant six tall bushes, each rooted down through the cover into the vein.',
    'Scatter spore (9) and rain water (1) in light passes: the meadow germinates, the crowns leaf out.',
    'One dab of fire (3) into the left end of the vein. Hands off.',
    'The fire runs the fuse and torches each bush from below; rain and spores then reseed the ash.',
  ],
  duration: 2400,
  captions: [
    { at: 0, text: 'rain, on a young garden' },
    { on: 'photo', count: 120, delay: 30, text: 'the garden drinks, and grows' },
    { at: IGNITE - 16, text: 'one spark, into the buried fuse' },
    { on: 'wildfire', count: 30, delay: 18, text: 'the fire runs, and climbs every limb it touches' },
    { on: 'cremate', count: 120, delay: 30, text: 'ash, where a garden stood' },
    { at: 1860, text: 'rain returns; what survives, regrows' },
  ],
  rate: ramp([[220, 1], [840, 3], [1340, 1], [1640, 2], [2400, 3]]),
  capAnchor: 'top',
  setup(w) {
    rect(w, 0, 98, W - 1, H - 1, CLAY)
    // the buried fuse: a static plant cap roofing a 2px oil vein in the clay.
    // Cap runs the full width so no clay surface is exposed to the rain
    // (exposed clay slips to mud at the edges and lets water under the vein).
    line(w, 0, 98, W - 1, 98, 0, PLANT)
    rect(w, 1, 99, W - 2, 100, OIL)
    SITES.forEach((sx, i) => plantBush(w, sx, i))
    // meadow spores between the bushes
    for (let k = 0; k < 64; k++) w.set((w.rng() * (W - 8) + 4) | 0, 93 + ((w.rng() * 2) | 0), SPORE, 0)
  },
  tick(w, f) {
    // light growth rain: a broad drizzle plus one aimed droplet over each
    // crown in turn - low volume, so the field never ponds into a flat mat
    if (f < 560) {
      if (f % 8 === 0) w.paint(jig(f, 6, W - 6), 6, 1, WATER)
      if (f % 6 === 0) dot(w, SITES[(f / 6) % SITES.length]! + (f % 3), 8, WATER)
    }
    // one spark, torched into the left end of the oil vein (rain cannot
    // reach it there, and the fire cannot rise past the cap)
    if (f >= IGNITE && f < IGNITE + 8 && f % 3 === 0) {
      w.set(3, 99, FIRE, 46)
      w.set(4, 99, FIRE, 46)
      w.set(3, 100, FIRE, 46)
      w.set(4, 100, FIRE, 46)
    }
    // wind-blown spores drift in low and settle BEFORE the rain returns -
    // a spore that meets a falling droplet midair germinates into a plant
    // frozen in the sky (spores fall at 0.4x, rain always catches them)
    if (f >= 1620 && f < 1690 && f % 6 === 0) w.set(jig(f, 8, W - 8), 90, SPORE, 0)
    // then the rain, gently (a heavy rain floods the plantless burn)
    if (f >= 1720 && f < 2160 && f % 10 === 0) w.paint(jig(f, 4, W - 4), 6, 1, WATER)
  },
}
