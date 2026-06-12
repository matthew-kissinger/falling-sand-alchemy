// 03 - The Hourglass, Corrupted. A stone hourglass runs through a 1px neck;
// mid-run, acid drips into the waist and corrodes it wider - the falling
// stream visibly fattens ("time runs faster") - and the drip never stops:
// stray drops fall through the ruined waist, ride the pile's slopes into the
// creases against the lower walls, and eat through the glass from inside.
// The breach is the acid's own work, not a scripted rip.

import type { World } from '../../sim/world'
import { ACID, EMPTY, SAND, STONE } from '../../sim/elements'
import { line, ramp, rect, type Scene } from '../lib'

// Geometry (shared by setup and the scripted failure). Canvas 180x120; the
// hourglass sits low enough to leave the top caption band (y < ~19) clear.
const CX = 90 // center column; the neck channel is the single cell x=CX
const TOP_Y = 20 // top plate
const WAIST_TOP = 62 // funnels meet the neck tube here
const WAIST_BOT = 64 // neck tube ends here (short tube: a few corrodes widen it)
const BASE_Y = 104 // funnels meet the bench here. Sized so the sand load
// (~1200 grains) fills the bottom bulb wall-to-wall: a deeper bulb leaves the
// pile a free repose cone that never touches the walls, and tearing the wall
// then releases nothing (measured).
const HALF = 36 // bulb half-width at the plates (x 54..126)


export const SCENE: Scene = {
  title: 'The Hourglass, Corrupted',
  seed: 12663096, // pinned (legacy index-derived; staging frame-verified under this)
  blurb:
    'A stone hourglass runs meditatively through a one-grain neck - then acid drips into the waist. ' +
    'Acid corrodes stone, so the neck widens, the stream fattens, time runs faster - and the drip ' +
    'keeps falling until it finds the lower walls and the sand bleeds out the wounds.',
  film: [
    'Draw the hourglass with stone (=): two funnels joined by a 1px neck tube.',
    'Fill the top bulb with sand (2). Let it run calm and thin for a long beat.',
    'Mid-run - bulb still well over half full - drip acid (w) into the waist.',
    'Watch the neck corrode wider: the falling stream fattens from 1px to 3+px.',
    'Keep dripping: the acid rides the pile into the lower walls and eats through. The sand bleeds out.',
  ],
  duration: 1340,
  captions: [
    { at: 0, text: 'an hourglass runs' },
    { at: 564, text: 'acid, at the waist' },
    { at: 620, text: 'the neck widens - time runs faster' },
    { at: 760, text: 'until the acid finds the glass itself' },
    { at: 1080, text: 'and still it pours - the venom outlives the vessel' },
  ],
  capAnchor: 'top',
  // 1x through the run and the corruption, 2x through the slow gnaw, back
  // to 1x for the gout act, 2x tail while the bled-out fans settle.
  rate: ramp([[700, 1], [860, 2], [1240, 1], [1340, 2]]),
  holdIn: 60,
  holdOut: 90,
  setup(w) {
    // top plate and the full-width stone bench the spill will pool on (deep
    // enough that stray acid dies inside it, never reaching the frame edge)
    line(w, CX - HALF, TOP_Y, CX + HALF, TOP_Y, 1, STONE)
    rect(w, 0, BASE_Y + 1, 179, 119, STONE)
    // top funnels
    line(w, CX - HALF, TOP_Y, CX - 2, WAIST_TOP, 1, STONE)
    line(w, CX + HALF, TOP_Y, CX + 2, WAIST_TOP, 1, STONE)
    // neck tube - interior is the single column x=CX (a one-grain stream)
    line(w, CX - 2, WAIST_TOP, CX - 2, WAIST_BOT, 1, STONE)
    line(w, CX + 2, WAIST_TOP, CX + 2, WAIST_BOT, 1, STONE)
    // bottom funnels, resting on the table
    line(w, CX - 2, WAIST_BOT, CX - HALF, BASE_Y, 1, STONE)
    line(w, CX + 2, WAIST_BOT, CX + HALF, BASE_Y, 1, STONE)
    // sand load: fill the top bulb flush to the walls
    for (let y = TOP_Y + 3; y <= 58; y++) {
      let xl = CX
      let xr = CX
      while (xl > CX - HALF + 2 && w.at(xl - 1, y) === EMPTY) xl--
      while (xr < CX + HALF - 2 && w.at(xr + 1, y) === EMPTY) xr++
      for (let x = xl; x <= xr; x++) w.set(x, y, SAND, 0)
    }
  },
  tick(w, f) {
    // the corruption: paired acid drops land on the neck rim cells,
    // alternating sides, eating the waist open fast and visibly green.
    // (Acid dripped from the top merely floats on the sand - sand sinks
    // through lighter acid - and acid dripped into the channel is washed
    // back up into the bulb; both measured. Placing drops on the rim itself
    // is the only honest path to visible corrosion, and the acid then
    // spreads by the real rules.)
    if (f >= 560 && f < 680 && (f - 560) % 20 === 0) {
      const i = (f - 560) / 20
      const side = i % 2 === 0 ? -1 : 1
      w.set(CX + side, WAIST_TOP + Math.floor(i / 2), ACID, 0)
      w.set(CX + side * 2, WAIST_TOP + Math.floor(i / 2), ACID, 0)
    }
    // ...and the drip never stops: drops keep falling through the ruined
    // waist, ride the pile's slopes into the creases against the lower
    // walls, and corrode the glass from inside. When a wall opens, the pile
    // bleeds out the wound - honest failure. (One drop every 5 frames keeps
    // both toe gaps open and visibly green against the sand.)
    if (f >= 700 && f < 1000 && (f - 700) % 5 === 0) w.set(CX, WAIST_TOP - 1, ACID, 0)
    // the third act: a sustained gout through the ruined waist - the stream
    // pours past the breached walls, ponds green on the bench, and gnaws it
    if (f >= 1000 && f < 1230 && f % 2 === 0) {
      w.set(CX + ((f / 2) % 3) - 1, WAIST_TOP - 2, ACID, 0)
    }
  },
}
