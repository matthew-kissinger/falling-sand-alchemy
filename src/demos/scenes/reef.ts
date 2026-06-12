// 08 - Obsidian Reef. Lava pulsed into a deep still sea quenches on contact;
// in each cool-down gap a quench-rain darkens the perched lava to true
// obsidian, so the reef visibly blackens between pulses. Then clay slips to
// mud shallows at the shorelines and spores root kelp that takes the blue.

import type { World } from '../../sim/world'
import { CLAY, LAVA, MUD, OBSID, SAND, SPORE, WATER } from '../../sim/elements'
import { H, W, jig, ramp, rect, topOf, type Scene } from '../lib'

/** [startFrame, pourX] - four sites across the sea, ~200-frame cool-downs.
 *  Each pulse meets fresh water, so it quenches clean instead of pooling on
 *  old crust - an island chain grows pulse by pulse. */
const PULSES: [number, number][] = [[60, 40], [300, 84], [540, 120], [780, 146]]
/** Quench-rain windows inside the cool-downs. Each opens 110 frames after the
 *  pour begins (the pour has fully landed and drained thin - droplets then
 *  quench surface film instead of crusting a deep pool over live lava) and
 *  closes 70 frames before the next pour (a droplet falls ~45 frames, so rain
 *  and lava never share the sky - no midair quenching). */
const RAIN: [number, number][] = [[170, 230], [410, 470], [650, 710], [890, 1080]]

/** Columns whose exposed top cell is still lava - rain aims only here, so no
 *  droplet is wasted and the rain stops by itself once the reef is dark. */
function lavaTops(w: World): number[] {
  const xs: number[] = []
  for (let x = 1; x < W - 1; x++) {
    if (w.at(x, topOf(w, x)) === LAVA) xs.push(x)
  }
  return xs
}

/** True if any still-glowing ember sits within `r` columns of x near the
 *  surface band - life is never seeded next to coals (a plant that grows into
 *  an ember catches fire, and a burnt sprig can strand green in the sky). */
function emberNear(w: World, x: number, r: number): boolean {
  for (let dx = -r; dx <= r; dx++)
    for (let y = 36; y < 64; y++)
      if (w.at(x + dx, y) === LAVA) return true
  return false
}

/** Land columns (reef/beach) with open water within 3 columns - the shore.
 *  Clamped well inside the canvas so the life that roots here never crowds
 *  the frame border, and kept clear of buried embers. */
function shoreline(w: World): number[] {
  const xs: number[] = []
  for (let x = 26; x <= 153; x++) {
    const e = w.at(x, topOf(w, x))
    if (e !== OBSID && e !== CLAY && e !== MUD && e !== SAND) continue
    if (emberNear(w, x, 4)) continue
    for (let d = -3; d <= 3; d++) {
      const tx = x + d
      if (tx < 2 || tx > W - 3) continue
      if (w.at(tx, topOf(w, tx)) === WATER) { xs.push(x); break }
    }
  }
  return xs
}

export const SCENE: Scene = {
  title: 'Obsidian Reef',
  seed: 12699761, // pinned (legacy index-derived; staging frame-verified under this)
  blurb:
    'Pour lava into a still sea in short pulses. Every contact quenches to obsidian - and between pulses a ' +
    'light rain drains the orange away, so the reef you grow is black glass, not fire. Then clay onto the ' +
    'shorelines, spores onto the clay: kelp roots in the mud shallows and takes the water around the islands.',
  film: [
    'Fill the sea deep - water from mid-canvas down (1).',
    'Pour lava (5) in gentle pulses, a new spot each time. Rain a little water between pulses: each island darkens to obsidian.',
    'Drop clay (7) at the shorelines - it slips to mud and settles as shallows.',
    'Scatter spore (9) over the shallows - kelp roots in the mud and spreads through the water.',
    'An island chain, terraformed and then colonized.',
  ],
  duration: 2400,
  captions: [
    { at: 0, text: 'a still sea' },
    { at: 175, text: 'the mountain’s blood, poured in' },
    { on: 'quench', count: 200, delay: 230, text: 'each quench builds the reef' },
    { on: 'germ', delay: 110, text: 'life takes the shallows' },
  ],
  rate: ramp([[520, 1], [1500, 2], [2400, 3]]),
  capAnchor: 'top',
  setup(w) {
    rect(w, 0, 50, W - 1, H - 1, WATER)
  },
  tick(w, f) {
    // four lava pulses, radius 1, ~44-frame gentle bursts, 195+ frame gaps.
    // The pour wanders a few columns so it lays thin films over a broad cone
    // instead of pooling deep at one spot (deep pools crust over and trap
    // glowing embers the rain can never reach).
    for (const [p, px] of PULSES)
      if (f >= p && f < p + 44 && f % 3 === 0) w.paint(px + jig(f, 0, 13) - 6, 8, 1, LAVA)
    // aimed quench-rain: one droplet at a time over a still-glowing column
    for (const [a, b] of RAIN)
      if (f >= a && f < b) {
        const xs = lavaTops(w)
        if (xs.length) w.paint(xs[(f * 11) % xs.length]!, 6, 0, WATER)
      }
    // clay onto the shorelines -> mud shallows at the water's edge
    if (f >= 1100 && f < 1260 && f % 4 === 0) {
      const xs = shoreline(w)
      if (xs.length) w.paint(xs[(f * 13) % xs.length]! + ((f >> 2) % 3) - 1, 8, 1, CLAY)
    }
    // a pinch of sand on one peak for shore color
    if (f >= 1280 && f < 1300 && f % 5 === 0) w.paint(40, 8, 1, SAND)
    // spores over the shallows: clay/mud + water meet -> cultivate -> kelp
    // (starts only after all rain steam is gone - no midair germination)
    if (f >= 1400 && f < 2100 && f % 8 === 0) {
      const xs = shoreline(w)
      if (xs.length) w.paint(xs[(f * 7) % xs.length]! + ((f >> 3) % 5) - 2, 8, 1, SPORE, true)
    }
  },
}
