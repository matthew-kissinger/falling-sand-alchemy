// 06 - The Powder Keg Cathedral. A sealed stone vault; three brimstone piles
// standing in a shared oil film; lava waiting in one narrow hanging basin over
// the center pile. One stroke erases the basin floor: the falling lava
// detonates the center pile, the blast torches the oil, and the burning film
// carries the fire to both flank piles - a rolling barrage, fully contained
// (explosions cannot break stone). The lava that survives the blasts lands on
// the sand bed and vitrifies it to glass.
//
// Staging truths: an explosion is an r=7 fireball that vaporizes everything
// soft in radius (including other sulphur - so each pile detonates as a chain
// of 3-6 booms marching through its body, not one flash), and fire + oil
// ignites at p=0.5 per contact, so the film between piles is a fast fuse.

import type { World } from '../../sim/world'
import { EMPTY, LAVA, OIL, SAND, STONE, SULPHUR } from '../../sim/elements'
import { dot, ramp, rect, type Scene } from '../lib'

const PILES = [52, 90, 128]
const ERASE_AT = 280

export const SCENE: Scene = {
  title: 'The Powder Keg Cathedral',
  seed: 12685095, // pinned (legacy index-derived; staging frame-verified under this)
  blurb:
    'A sealed stone vault. Three sulphur piles on a sand bed, their feet in a shared oil film; lava waits ' +
    'in a hanging basin over the center pile. Erase the basin floor - one stroke - and the falling lava ' +
    'detonates the center pile, the blast lights the oil, and the burning film carries fire to both flanks: ' +
    'a rolling barrage the stone contains. The lava that survives turns the sand it rests on to glass.',
  film: [
    'Build a fully sealed stone vault with a thick foundation; line the interior floor with sand.',
    'Raise three sulphur pyramids on the bed; pour oil (4) between them into one shared film.',
    'Hang a narrow stone basin over the center pile and fill it with lava (5).',
    'Erase (e) the basin floor. One stroke. Hands off.',
    'Center pile detonates; the oil fuse relays the fire to both flanks; the vault holds it all.',
  ],
  duration: 1100,
  captions: [
    { at: 0, text: 'brimstone, sealed in stone. lava waits above' },
    { at: 64, text: 'oil, laid as a fuse between the piles' },
    { at: ERASE_AT - 14, text: 'one stroke' },
    { on: 'detonate', delay: 10, text: 'detonation. the stone holds' },
    { on: 'detonate', count: 8, delay: 14, text: 'and the cathedral answers, and answers' },
    { on: 'vitrify', count: 3, delay: 30, text: 'where the lava rests, the sand is glass' },
  ],
  rate: ramp([[470, 1], [820, 2], [1100, 3]]),
  capAnchor: 'top',
  holdIn: 36,
  holdOut: 60,
  setup(w) {
    // the sealed vault - no opening anywhere, and a foundation thicker than
    // the blast radius so nothing punches through to the frame edge
    rect(w, 28, 24, 152, 27, STONE) // roof
    rect(w, 28, 24, 31, 113, STONE) // left wall
    rect(w, 149, 24, 152, 113, STONE) // right wall
    rect(w, 28, 110, 152, 119, STONE) // floor + foundation to canvas bottom
    // sand bed lining the interior floor (vitrify payoff)
    rect(w, 32, 108, 148, 109, SAND)
    // three sulphur piles, slope under repose so they stand still
    for (const cx of PILES) {
      for (let y = 96; y <= 107; y++) {
        const hw = Math.round(((y - 96) * 14) / 11)
        rect(w, cx - hw, y, cx + hw, y, SULPHUR)
      }
    }
    // narrow hanging basin over the center pile only. The stroke erases just
    // a notch in the shelf, so the lava drains as a SUSTAINED stream (fresh
    // lava keeps feeding the chain for seconds, and the tail of the pour
    // lands on the emptied bed to pool and vitrify) instead of one blob.
    rect(w, 83, 28, 84, 44, STONE)
    rect(w, 96, 28, 97, 44, STONE)
    rect(w, 85, 44, 95, 46, STONE) // the shelf - one stroke notches this
    rect(w, 85, 34, 95, 43, LAVA)
  },
  tick(w, f) {
    // the oil pour: two spouts over the gaps between piles; the oil pools and
    // levels into one film lapping every pile's feet
    if (f >= 16 && f < 190 && f % 3 === 0) {
      dot(w, 71, 29, OIL)
      dot(w, 109, 29, OIL)
    }
    if (f === ERASE_AT) rect(w, 88, 44, 92, 46, EMPTY)
  },
}
