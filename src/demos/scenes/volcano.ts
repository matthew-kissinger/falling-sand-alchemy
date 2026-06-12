// 01 - The Mountain Wakes. The hook: a stratified volcano by the sea wakes,
// and one welling of lava sets off everything the bench can do - oil springs
// flash, buried brimstone blows the flank open, the flood vitrifies the
// beach and quenches into a black glass delta where it meets the water.
//
// Staging truths this scene leans on (all measured):
// - Wet-packed powder (aux=1) skips the diagonal slide, so the 54-degree cone
//   holds crisp strata - and wet sand renders darker, so alternating wet
//   sand/clay bands stripe the mountain for free. Heat dries wet sand, so the
//   slopes nearest the lava loosen and slump as the eruption goes on.
// - The lava well is a 1px dot into the crater throat: dot() only fills EMPTY,
//   so the well auto-throttles while the crater is full and resumes as lava
//   overflows. Sustained stream, never a blob (the keg lesson - explosions
//   vaporize lava, so the source must outlive each blast).
// - No scripted spark anywhere: lava+oil flashes (p=1), fire relays down the
//   oil rivulets (oil fuses self-heal), fire/lava+sulphur detonates (p=1),
//   lava+water quenches to obsidian (p=1), lava+sand vitrifies (p=0.08).
//   The mountain does it all itself.

import type { World } from '../../sim/world'
import { CLAY, LAVA, OIL, SAND, STONE, SULPHUR, WATER } from '../../sim/elements'
import { dot, ramp, rect, rectAux, type Scene } from '../lib'

const APX = 56 // apex column
const APY = 40 // apex row
const SLOPE = 0.72 // half-width per row of depth (about 54 degrees)

const half = (y: number): number => Math.round(SLOPE * (y - APY))
const faceL = (y: number): number => APX - half(y)
const faceR = (y: number): number => APX + half(y)

export const SCENE: Scene = {
  title: 'The Mountain Wakes',
  seed: 757101,
  blurb:
    'A stratified mountain sleeps by the sea. Lava wells up the throat, overflows the crater, and meets ' +
    'the oil weeping from the flanks - flash. The fire relays down the rivulets to an outcrop of brimstone ' +
    '(detonation), then to the seam buried in the left flank (the flank lets go). The flood pours down the ' +
    'shattered gullies, turns the beach to glass, and where it meets the sea it builds a delta of obsidian ' +
    'under columns of steam.',
  film: [
    'Build a layered mountain: alternating bands of clay and sand, packed wet so the cone holds.',
    'Bury a sulphur (s) seam in one flank and let a small outcrop breach the other slope.',
    'Lay a beach of dry sand down to a deep pool of water (1): the sea.',
    'Pour lava (5) steadily into the crater and let it overflow. Do not light anything.',
    'Drip oil (4) from two spring points on the flanks; the lava finds it, the fire finds the brimstone.',
    'Let the flood run to the sea. Glass on the beach, obsidian in the water, steam over everything.',
  ],
  duration: 1300,
  captions: [
    { at: 8, text: 'a mountain asleep by the sea' },
    { at: 60, text: 'it wakes' },
    { on: 'flash', delay: 6, text: 'the oil catches first' },
    { on: 'quench', count: 30, delay: 10, text: 'the flood finds the sea' },
    { on: 'detonate', delay: 10, text: 'then fire finds the buried brimstone' },
    { on: 'detonate', count: 3, delay: 12, text: 'the flank lets go' },
  ],
  capAnchor: 'top',
  holdOut: 80,
  // measured beats: wake 60, flash 142, sea ~190-230, breach 300, barrage
  // 325-560, then rain quenches the flows and the mountain sleeps again
  rate: ramp([[70, 1], [120, 2], [160, 1], [180, 2], [230, 1], [260, 2], [455, 1], [700, 2], [1300, 3]]),
  setup(w) {
    rect(w, 0, 114, 179, 119, STONE) // bedrock
    // the cone: alternating wet clay / wet sand bands, five rows each
    for (let y = APY; y <= 113; y++) {
      const band = Math.floor((y - APY) / 5) % 2
      rectAux(w, Math.max(0, faceL(y)), y, Math.min(179, faceR(y)), y, band ? SAND : CLAY, 1)
    }
    // The crater: a STONE-LINED basin narrowing to a throat - the old
    // volcanic plug. The lining is load-bearing: standing lava dries adjacent
    // wet powder, the dried grains' diagonal slide re-enables, and they
    // slough INTO the melt (denser sand sinks through lava) - measured: a
    // powder wall beside the well dissolves in ~15 frames and the eruption
    // escapes sideways. Only hard rock contains the standing well.
    for (let y = APY + 3; y <= APY + 13; y++) {
      const r = Math.max(1, 4 - Math.round(0.4 * (y - APY)))
      rect(w, Math.max(0, APX - r - 2), y, APX + r + 2, y, STONE)
    }
    for (let y = APY; y <= APY + 12; y++) {
      const r = Math.max(1, 4 - Math.round(0.4 * (y - APY)))
      rect(w, APX - r, y, APX + r, y, 0)
    }
    // Direct the first overflow RIGHT (toward the oil and the sea): a stone
    // crag rises above the dome on the left rim, while the right rim sits at
    // dome height - lava pools to y=APY+2 and rolls right over the lining.
    rect(w, APX - 4, APY + 1, APX - 3, APY + 4, STONE)
    // Brimstone lives on the LEFT flank only, away from every oil path: the
    // oil-fire relay is near-instant (measured), so pacing the detonations
    // means only the slow lava creep may reach the sulphur.
    // An outcrop flush with the face (proud powder grains shed as talus)...
    for (let y = 68; y <= 72; y++) rect(w, faceL(y), y, faceL(y) + 4, y, SULPHUR)
    // ...and the buried seam lower, where lava pours in after the outcrop
    // blast opens the face above it
    for (let y = 84; y <= 92; y++) rect(w, faceL(y), y, faceL(y) + 11, y, SULPHUR)
    // dry golden beach falling to the sea
    for (let x = 100; x <= 133; x++) {
      rect(w, x, 104 + Math.round((x - 100) / 8), x, 113, SAND)
    }
    rect(w, 130, 98, 179, 113, WATER) // the sea
  },
  tick(w, f) {
    // the well: lava dropped just ABOVE the rim, every other frame. Down in
    // the throat the feed cell stays submerged once the basin fills and the
    // well dies (measured); up here each new cell rides down the lava dome,
    // so the eruption is continuous for the whole window.
    if (f >= 30 && f < 900 && f % 2 === 0) dot(w, APX, APY + 2, LAVA)
    // one oil spring, right flank only: the flash spectacle and the burning
    // rivulet to the beach, with no brimstone anywhere on its path
    if (f >= 20 && f < 520 && f % 3 === 0) dot(w, faceR(60) + 2, 59, OIL)
    // the second act: the crag and the left lining give way and the flood
    // turns toward the brimstone (the narrator's one touch, like the dam's
    // three grains)
    if (f === 300) rect(w, APX - 5, APY + 1, APX - 3, APY + 6, 0)
  },
}
