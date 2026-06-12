// 08 - Firedamp. A cutaway mine: a living meadow over stratified ground over
// the old stone workings. Marsh gas seeps from a compost floor and pools
// under the roof; a venthole is opened, a lamp is set at the mouth, and the
// will-o'-the-wisp chases DOWN the rising gas into the gallery - whoomph -
// lighting the oil pool, which burns across to the brimstone heap under the
// old backfilled shaft. The detonations vaporize the shaft's timber lagging
// and the whole soft column comes down: sinkhole, sheared salt band, the
// meadow lowered into the workings. Then rain, for what is left.
//
// Staging truths (all measured or from the rule table):
// - Powder cannot roof a void (it falls straight down), so the gallery is
//   carved in a STONE band; the layers that must "respond" to the blast do so
//   through the soft backfilled shaft (wet sand) whose only floor is a row of
//   PLANT lagging boards - soft, static, and inside the blast radius.
// - GAS rises into EMPTY only, so it pools under the roof; a hot neighbor
//   combusts it (r=3), and a combustion next to more gas chains - down the
//   vent shaft, along the ceiling cloud.
// - The compost bed (plant sealed in mud) really does exhale gas ('decay'),
//   but each compost cell converts once - the seep dots sustain the cloud the
//   way the volcano's well sustains its lava.
// - Sulphur is dry powder: the heap is pre-shaped at repose so it holds, and
//   the oil pool self-levels until it laps the heap's toe.

import type { World } from '../../sim/world'
import {
  CLAY, FIRE, GAS, MUD, OIL, PLANT, SALT, SAND, STONE, SULPHUR, WATER,
} from '../../sim/elements'
import { dot, ramp, rect, rectAux, type Scene } from '../lib'

// Venthole columns (VENT_X, VENT_X+1): bored directly over the fuming pool,
// so the descending whoomph exits the shaft onto the standpipe's open top -
// a chain of r=3 hops with no long ceiling traverse (measured: a vent 50
// columns west never carried the flame across the cloud's gaps).
const VENT_X = 100
const WINZE_X0 = 134
const WINZE_X1 = 146 // backfilled shaft above the heap
const PEAK = 140 // heap apex column, centered under the winze

export const SCENE: Scene = {
  title: 'Firedamp',
  seed: 757108,
  blurb:
    'A meadow over layered ground over the old workings. The compost floor breathes marsh gas that pools ' +
    'under the stone roof. Open a venthole, set a lamp at its mouth, and the will-o’-the-wisp chases the ' +
    'gas DOWN the shaft - the firedamp answers, the oil pool takes, and the burn walks to the brimstone heap ' +
    'under the backfilled winze. The blast eats the lagging boards and the meadow comes down into the mine.',
  film: [
    'Lay a meadow over strata (clay, sand, a white salt band, clay, sand) over a stone gallery.',
    'Floor the gallery with mud and rotting plant matter; let marsh gas pool under the roof.',
    'Pour a shallow oil pool (4) on the gallery floor; heap sulphur (s) at repose under a sand-backfilled shaft.',
    'Open a 2px venthole from the meadow to the roof. Watch the gas climb.',
    'Touch one flame (3) to the vent mouth: the wisp runs down, the pool lights, the heap detonates.',
    'The blast takes the shaft floor; meadow, salt and sand pour into the burning gallery. Then rain.',
  ],
  duration: 1500,
  captions: [
    { at: 10, text: 'beneath the meadow, the old workings' },
    { at: 320, text: 'the rot breathes out - gas pools under the roof' },
    { at: 524, text: 'a venthole is opened' },
    { on: 'marsh', delay: 8, text: 'will-o-the-wisp - and the firedamp answers' },
    { on: 'ignite', count: 12, delay: 16, text: 'the black pool takes' },
    { on: 'detonate', delay: 10, text: 'the seam under the old shaft goes' },
    { on: 'detonate', count: 3, delay: 70, text: 'and the meadow comes down' },
  ],
  capAnchor: 'top',
  holdOut: 80,
  // measured beats: vent 520, lamp 640, whoomph 642, pool 688, booms 702+,
  // collapse through ~900, rain from 1180
  rate: ramp([[80, 1], [500, 3], [1000, 1], [1180, 2], [1500, 3]]),
  setup(w) {
    // strata over the workings (wet-packed so the cutaway faces hold)
    rectAux(w, 0, 39, 179, 46, CLAY, 1)
    rectAux(w, 0, 47, 179, 56, SAND, 1)
    rect(w, 0, 57, 179, 60, SALT) // the white band (dry: it shears when voids open)
    rectAux(w, 0, 61, 179, 68, CLAY, 1)
    rectAux(w, 0, 69, 179, 82, SAND, 1)
    // the stone shelf holding the workings, and the massive floor
    rect(w, 0, 83, 179, 108, STONE)
    rect(w, 0, 106, 179, 119, STONE)
    // the gallery, carved into the shelf, with two BROKEN pillars: stubs
    // that stop short of the roof. Full pillars partition the ceiling into
    // sealed compartments and the gas cloud can never connect (measured: the
    // left bay burned, the pool bay never received the flame).
    rect(w, 24, 86, 156, 105, 0)
    rect(w, 40, 92, 42, 105, STONE)
    rect(w, 78, 92, 80, 105, STONE)
    // compost floor in the left bays: plant matter sealed in mud
    rect(w, 26, 101, 76, 105, MUD)
    for (let x = 27; x <= 75; x += 2)
      for (let y = 102; y <= 104; y += 2) w.set(x, y, PLANT, 0)
    // the oil pool: shallow, self-levelling east across the floor
    rect(w, 84, 104, 124, 105, OIL)
    // The standpipe: an oil-filled stone pipe from the pool up to the roof -
    // the fire's one guaranteed way DOWN. Fire rises; plant ladders ash-block
    // (measured); rising-gas threads are too sparse to chain a descent
    // (measured twice). But a standing oil column relays flame in any
    // direction (the keg's fuse, stood upright). The foot is perforated so
    // the flame steps out into the pool instead of dying inside the straw.
    rect(w, 98, 87, 98, 105, STONE)
    rect(w, 101, 87, 101, 105, STONE)
    rect(w, 99, 87, 100, 105, OIL)
    w.set(98, 104, 0, 0)
    w.set(101, 104, 0, 0)
    // a clay dyke where the venthole will cross the salt band - dry salt
    // would otherwise bleed into the shaft and pinch off the gas column
    rectAux(w, VENT_X - 3, 57, VENT_X + 4, 60, CLAY, 1)
    // the brimstone heap, pre-shaped at repose, apex under the winze
    for (let x = 122; x <= 156; x++) {
      const h = Math.max(0, 17 - Math.round(Math.abs(x - PEAK) * 0.62))
      if (h > 0) rect(w, x, 106 - h, x, 105, SULPHUR)
    }
    // the backfilled winze: a soft sand column through every layer, floored
    // by one row of timber lagging (the blast's one soft target in the roof)
    rectAux(w, WINZE_X0, 39, WINZE_X1, 84, SAND, 1)
    rect(w, WINZE_X0, 85, WINZE_X1, 85, PLANT)
    // the meadow: turf line + standing tufts
    rect(w, 0, 38, 179, 38, PLANT)
    for (let x = 4; x < 176; x += 9) {
      const h = 1 + ((x * 7) % 3)
      for (let dy = 1; dy <= h; dy++) w.set(x, 38 - dy, PLANT, 12)
    }
  },
  tick(w, f) {
    // the workings breathe: three seeps sustain the ceiling cloud (the
    // compost's real 'decay' joins in, one cell at a time). One sits under
    // the venthole so the shaft column stays dense enough for the whoomph to
    // chain down it; one BUBBLES FROM THE OIL POOL ITSELF, so the burning
    // ceiling can chase that column down and the last r=3 whoomph laps the
    // oil surface - the only honest way down (fire rises; plant ladders
    // ash-block; the pool must reach up to the flame).
    if (f < 700 && f % 3 === 0) dot(w, 34, 100, GAS)
    if (f < 700 && f % 3 === 1) dot(w, VENT_X + 2, 103, GAS)
    // the pool fumes (atmosphere + cloud feed; ignition is the standpipe's)
    if (f < 700 && f % 2 === 0) dot(w, 86 + ((f * 13) % 38), 103, GAS)
    // the venthole is opened - with a wide firebreak: the digging clears the
    // turf around the mouth, or flames drifting out of the shaft torch the
    // whole meadow (measured twice: 70 then 234 wildfire events)
    if (f === 520) {
      rect(w, VENT_X - 8, 33, VENT_X + 9, 38, 0)
      rect(w, VENT_X, 36, VENT_X + 1, 85, 0)
    }
    // a lamp INSIDE the mouth, below turf level: the wisp lights, and chases
    // the gas down the shaft
    if (f >= 640 && f < 652 && f % 3 === 0) {
      dot(w, VENT_X, 37, FIRE)
      dot(w, VENT_X + 1, 37, FIRE)
    }
    // rain, late, over the sink and the meadow's east half
    if (f >= 1180 && f < 1460 && f % 6 === 0) {
      dot(w, 100 + ((f * 31) % 70), 12, WATER)
      dot(w, 96 + ((f * 17 + 9) % 78), 12, WATER)
    }
  },
}
