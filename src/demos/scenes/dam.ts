// 09 - The Dam Break. A valley sleeps behind the dam; three grains erased at
// the base; the dam lets go; the oil rides out on the flood.
//
// Staging notes (learned against real frames): this engine has no hydrostatic
// pressure, so a breach at exact floor level equalizes and dies. The dam
// therefore stands on a stone sill - the 3-cell breach jets onto an apron and
// FALLS into the valley, which keeps the jet alive until the seepage pool
// finds the slot's own level against the hut wall and holds (the held breath
// before act two). The flood channel to the oil basin is unobstructed: the
// plant tufts live on a stone knoll DOWNSTREAM of the hut where seepage never
// reaches and the deep wave simply rolls over them, and the oil pond is thick
// enough (4 deep) to raft as a legible brown band on the flood.

import type { World } from '../../sim/world'
import { EMPTY, OIL, SAND, STONE, WATER, WAX, PLANT } from '../../sim/elements'
import { line, ramp, rect, type Scene } from '../lib'

export const SCENE: Scene = {
  title: 'The Dam Break',
  seed: 12707094, // pinned (legacy index-derived; staging frame-verified under this)
  blurb:
    'Build a little world: dunes, a wax hut, a tuft-topped knoll, a dry swale, an oil pond resting in a shallow ' +
    'stone basin - all asleep behind a stone dam holding back the sea. Erase three pixels at the dam base and the ' +
    'breach jets; erase the rest and the valley drowns in honest physics: water slides beneath the oil and the ' +
    'slick rides out on top of the flood.',
  film: [
    'Left side: 3-wide stone (=) dam on a stone sill, deep water (1) reservoir behind it.',
    'Right side: sand (2) dunes, a low wax (0) hut, plant (8) tufts on a stone knoll past the hut, a dry swale, an oil (4) pond in a stone-rimmed basin at the far right.',
    'Establishing shot of the sleeping valley (dunes settle, water shimmers).',
    'Erase (e) exactly three cells at the dam base - the jet falls off the apron and pools terrace by terrace until the hut wall holds it.',
    'Erase the whole dam for act two: the collapse wave sweeps the valley, dives under the oil, and the slick rides the flood.',
  ],
  duration: 1740,
  captions: [
    { at: 0, text: 'a valley sleeps behind the dam' },
    { at: 252, text: 'three grains, erased, at the base' },
    { at: 904, text: 'the dam lets go' },
    { on: 'immis', count: 50, delay: 12, text: 'the oil rides out on the flood' },
  ],
  rate: ramp([[250, 2], [650, 1], [900, 2], [1280, 1], [1500, 2], [1740, 3]]),
  capAnchor: 'top',
  setup(w) {
    // dunes + knoll first; the bedrock slab then cuts them to a clean grade (y112)
    line(w, 74, 112, 74, 112, 5, SAND) // dune A
    line(w, 90, 112, 90, 112, 4, SAND) // dune B
    line(w, 122, 112, 122, 112, 4, STONE) // stone knoll, downstream of the hut
    rect(w, 0, 113, 179, 119, STONE) // bedrock
    rect(w, 130, 113, 143, 114, EMPTY) // dry swale carved before the basin
    // plant tufts on the knoll, painted with line() so aux=0: decorative, inert,
    // cannot drink or wall the flood (rect() would give them growth energy)
    line(w, 120, 105, 120, 108, 0, PLANT)
    line(w, 122, 104, 122, 107, 0, PLANT)
    line(w, 124, 106, 124, 108, 0, PLANT)
    // low wax hut mid-valley: two pillars, an eaved roof, a sealed dry room
    rect(w, 100, 106, 101, 112, WAX)
    rect(w, 112, 106, 113, 112, WAX)
    rect(w, 98, 104, 115, 105, WAX)
    // shallow stone-rimmed basin at the far right: rim 2 above grade, oil pond
    // 4 deep - lip-flush, floor carved 1 into the bedrock. A stone crag walls
    // the right end so the slick raft pools against scenery, not the frame edge.
    rect(w, 174, 66, 179, 112, STONE)
    rect(w, 146, 110, 147, 112, STONE)
    rect(w, 148, 110, 173, 113, OIL)
    // the sill the dam stands on (with a short apron at the toe), the dam, the sea
    rect(w, 0, 106, 63, 112, STONE)
    rect(w, 58, 48, 60, 105, STONE)
    rect(w, 0, 50, 57, 105, WATER)
  },
  tick(w, f) {
    if (f === 250) rect(w, 58, 105, 60, 105, EMPTY) // exactly three cells, at the base
    if (f === 900) rect(w, 58, 48, 60, 105, EMPTY) // the whole dam - nothing left to levitate
  },
}
