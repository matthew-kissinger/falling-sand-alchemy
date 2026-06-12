// 10 - The Magnum Opus, Performed. Calcination, dissolution, conjunction,
// coagulation: every stage is a color, and the last one is gold.
//
// The staging is an athanor - the alchemist's furnace - built from measured
// engine truths (each one guards a verified failure mode):
//
// - The floor is one flat glass shelf: gold that lands on glass gleams forever
//   (shade-gated specular), gold that lands on mercury is eaten (Amalgam,
//   p=0.02/step). So every grain of mercury must be spent BEFORE any gold
//   exists - the film is budgeted smaller than the azoth that will wed it.
// - Brimstone is sown as a row ON the glass floor and the mercury film is laid
//   OVER it: sulphur (density 38) cannot sink through mercury (135) and rebis
//   (50) cannot displace the powder upward, so the grains stay pinned under
//   the band for the whole scene. When the climax heat touches the rebis from
//   above, each rebis cell has sulphur below and fire above - the exact
//   coagulation geometry - and the brimstone never once sits next to flame
//   (fire + sulphur detonates at p=1).
// - Calcination is done with fire driven INTO the iron, not lava on top: fire
//   is a gas and flees after a step, but a spark buried in the metal converts
//   its neighbors before it dies, and the red calx (density 30) sinks through
//   the aqua bath (8) to the floor on its own. No lava ever enters the bath to
//   flash it early.
// - The iron is budgeted so the azoth it becomes just outnumbers the film: the
//   small surplus stays a thin green blanket the closing flame can burn down
//   through, while every grain of mercury is still wed away (free quicksilver
//   would survive to eat the gold). No mercury is added to clear the blanket;
//   that mercury would itself eat the gold, so the budget is tuned, not fixed.

import type { World } from '../../sim/world'
import { AQUA, FIRE, GLASS, IRON, MERCURY, SULPHUR } from '../../sim/elements'
import { dot, ramp, rect, topOf, type Scene } from '../lib'

const FILM_X0 = 76
const FILM_X1 = 104 // 29-wide film + sulphur row, centered
// drip columns for the iron, kept inside the film footprint so calx sinks onto
// the film, not the bare floor. Sparse drip + fire curtain calcines in transit
// (a dense drip drops raw iron that piles gray on the band and blocks rebis).
const DRIP_X = [84, 92, 96, 80, 88, 100, 82, 94, 86, 98, 90, 78, 102, 87, 95, 83, 91, 99, 85]
const FLAME_AT = 1740

export const SCENE: Scene = {
  title: 'The Magnum Opus, Performed',
  seed: 12714427, // pinned (legacy index-derived; staging frame-verified under this)
  blurb:
    'The game’s entire win condition as one continuous take: brimstone sown on the glass and sealed under a film ' +
    'of quicksilver, iron dying to red dust in driven fire (Calcination), the dust drunk by the bath into green ' +
    'azoth (Dissolution), azoth wedding the quicksilver into a pink rebis band (Conjunction) - then a careful ' +
    'flame at the bath surface burns the spirit away until the heat above the band meets the brimstone sealed ' +
    'below it, and the band turns to gold on the glass (Coagulation). Every stage is a color.',
  film: [
    'Lay a glass floor. Sow a row of sulphur (s) on it, cover it with a film of mercury (a), then flood the vessel with aqua vitae (g).',
    'Hold a band of fire (3) over the bath mouth and drip iron (d) through it: the metal dies to red dust in transit and rains into the bath.',
    'Watch the dust drink the spirit to green azoth, sink to the film, and wed the quicksilver into a pink rebis band.',
    'Drizzle a little mercury (a) over the green blanket so the band closes clean.',
    'Touch fire to the bath surface. The spirit burns away; the heat finds the brimstone under the band; the Work turns to gold.',
  ],
  duration: 2900,
  captions: [
    { at: 8, text: 'brimstone, sealed under a film of quicksilver' },
    { at: 150, text: 'a bath of aqua vitae, under a curtain of fire' },
    { on: 'calcine', count: 6, delay: 24, text: 'calcination - iron dies to red dust' },
    { on: 'dissolution', count: 8, delay: 24, text: 'dissolution - the bath drinks the dust to green azoth' },
    { on: 'conjunction', count: 8, delay: 24, text: 'conjunction - azoth weds the quicksilver: rebis' },
    { at: FLAME_AT - 40, text: 'the band is closed. now a careful flame' },
    { on: 'spiritfire', count: 30, delay: 16, text: 'the spirit burns away' },
    { on: 'coagulate', count: 1, delay: 20, text: 'coagulation - gold' },
  ],
  capAnchor: 'top',
  holdOut: 100,
  rate: ramp([
    [150, 1], [360, 2], [1420, 3], [1720, 2], [2120, 1], [2500, 2], [2900, 1],
  ]),
  setup(w) {
    // a compact crucible: a flat glass floor (the gold bed) and short walls,
    // so when the spirit burns off the vessel reads as a shallow dish of gold,
    // not a tall empty box.
    rect(w, 60, 86, 120, 88, GLASS)
    rect(w, 60, 56, 62, 85, GLASS)
    rect(w, 118, 56, 120, 85, GLASS)
    rect(w, 58, 56, 59, 57, GLASS) // flared lips
    rect(w, 121, 56, 122, 57, GLASS)
    // The crucible floor is a fine glass COMB: a one-cell well at every odd
    // column, a glass tooth at every even one. A grain of brimstone drops into
    // each well, pinned by the teeth so it can never drift or rise; the film of
    // quicksilver lies across the comb's mouth. When the bath weds the film to
    // a rebis band, each well is capped by rebis sitting directly over its own
    // grain - the coagulation geometry, made structural. The heat that comes
    // later rests on the band and reaches the rebis but never the sealed grain,
    // so the Work turns to gold the whole width of the comb, with not one
    // detonation. (Loose brimstone under a flowing film leaves gaps; the comb
    // leaves none.)
    for (let x = FILM_X0; x <= FILM_X1; x++) {
      if ((x & 1) === 0) rect(w, x, 85, x, 85, GLASS) // a tooth
      else rect(w, x, 85, x, 85, SULPHUR) // a well, filled with brimstone
    }
    rect(w, FILM_X0, 84, FILM_X1, 84, MERCURY)
    rect(w, 63, 70, 117, 83, AQUA) // a shallow bath: drains fast so the closing
    rect(w, FILM_X0, 84, FILM_X1, 84, MERCURY) // flame reaches the band, not air
  },
  tick(w, f) {
    // calcination: a held band of fire over the bath mouth, and a sparse iron
    // drip through it. Sparse so each grain meets flame and calcines in
    // transit rather than building a gray slag pyramid on the film.
    if (f >= 200 && f < 1320) {
      const k = f & 3
      w.paint(78 + ((f * 7) % 27), 40 + 5 * (k & 1), 2, FIRE, true)
      w.paint(78 + ((f * 11 + 9) % 27), 50 + 5 * ((k >> 1) & 1), 2, FIRE, true)
    }
    // every 13 frames: enough iron that the azoth comfortably outnumbers the
    // film (so every grain of mercury is wed away - no free quicksilver
    // survives to eat the gold) while the surplus stays a thin green film the
    // closing flame can still burn down through. No mercury is added to clear
    // it: added mercury would itself eat the gold, so the budget is tuned.
    // every 16 frames: enough iron to wed the whole film while the surplus
    // azoth stays a thin green film the closing flame can still burn down
    // through. No mercury is added to clear it - added mercury would itself
    // survive to eat the gold - so the budget is tuned, not corrected.
    if (f >= 220 && f <= 1300 && f % 16 === 0) {
      dot(w, DRIP_X[(((f - 220) / 16) | 0) % DRIP_X.length]!, 16, IRON)
    }
    // the careful flame: a sustained sweep of single fire cells set just above
    // the band, cycling across every brimstone well in turn. Fire is a gas -
    // it first burns the bath surface away to spirit (the spirit-flame burn-off
    // drains the dish), then settles onto the exposed rebis caps. Each well it
    // touches has brimstone below and fire above: coagulation. The flame then
    // flees upward and dies, leaving the gold uncovered - where a lava cap
    // would smother it orange. The comb guarantees the fire only ever meets
    // rebis, never the sealed grain, so the sweep can run hot and long.
    const WELLS = (FILM_X1 - FILM_X0 - 1) >> 1
    if (f >= FLAME_AT && f < 2520 && f % 2 === 0) {
      const i = (f - FLAME_AT) >> 1
      const wx = FILM_X0 + 1 + 2 * (i % WELLS) // an odd column: a well
      const y = topOf(w, wx, 50, 84) - 1
      if (y > 50) w.set(wx, y, FIRE, (26 + w.rng() * 24) | 0)
    }
  },
}
