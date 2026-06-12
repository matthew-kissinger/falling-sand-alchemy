// 07 - The Distillery. A duality engine: brine drips down the left channel
// and flashes on the lava to a white salt cone; plain water drips down the
// right channel and quenches the lava to black glass. Steam climbs to a
// full-width ice ceiling, condenses, and rains into stone trays.

import type { World } from '../../sim/world'
import { BRINE, ICE, LAVA, STONE, WATER } from '../../sim/elements'
import { W, dot, ramp, rect, type Scene } from '../lib'

export const SCENE: Scene = {
  title: 'The Distillery',
  seed: 12692428, // pinned (legacy index-derived; staging frame-verified under this)
  blurb:
    'Two drip columns over one lava hearth: brine on the left flashes to steam and banks a white salt cone ' +
    '(Distill); plain water on the right quenches the lava into dark obsidian (Quench). The steam climbs to an ' +
    'ice ceiling, condenses, and rains back into stone trays. A weather machine in a box - white salt and black ' +
    'glass, twin children of the same fire.',
  film: [
    'Draw a full-width ice (6) ceiling, a lava (5) bed on a stone hearth, and tray shelves with two open channels.',
    'Drip brine down the left channel (drop salt (q) into water (1) first), plain water (1) down the right.',
    'Lock the camera and watch the duality: white salt cone left, black obsidian right.',
    'The steam meets the ice ceiling, condenses, and rains into the trays.',
    'This is the long screensaver shot - let it run two minutes uncut.',
  ],
  duration: 2500,
  capAnchor: 'top',
  captions: [
    { at: 0, text: 'brine to the left. rainwater to the right' },
    { on: 'distill', count: 1, delay: 200, text: 'flash - steam climbs, salt remains' },
    { on: 'cond', count: 1, delay: 520, text: 'the steam meets ice, and rains' },
    { at: 2100, text: 'white salt. black glass. twin children of the fire' },
  ],
  rate: ramp([[240, 1], [640, 2], [2500, 3]]),
  setup(w) {
    rect(w, 0, 2, W - 1, 7, ICE) // ice ceiling - full width so no steam slips past
    rect(w, 42, 8, 48, 10, STONE) // left spigot
    rect(w, 132, 8, 138, 10, STONE) // right spigot
    // tray shelves with raised lips; open channels at x 40-50 and x 130-140
    rect(w, 0, 54, 39, 56, STONE)
    rect(w, 37, 46, 39, 56, STONE)
    rect(w, 51, 54, 59, 56, STONE)
    rect(w, 72, 54, 129, 56, STONE)
    rect(w, 51, 46, 53, 56, STONE)
    rect(w, 127, 46, 129, 56, STONE)
    // the middle tray funnels through a slot into a hanging collection well
    // placed under the rainiest stretch of ceiling, so the condensate
    // visibly fills a vessel instead of filming the floor
    rect(w, 58, 57, 59, 66, STONE)
    rect(w, 72, 57, 73, 66, STONE)
    rect(w, 58, 65, 73, 66, STONE)
    rect(w, 141, 54, W - 1, 56, STONE)
    rect(w, 141, 46, 143, 56, STONE)
    // the hearth: shallow lava bed on a stone plinth, with low curbs that
    // corral the right-hand quench pool so the black glass stays contained
    rect(w, 0, 106, W - 1, 111, LAVA)
    rect(w, 121, 104, 123, 111, STONE)
    rect(w, 147, 104, 149, 111, STONE)
    rect(w, 0, 112, W - 1, 119, STONE)
  },
  tick(w, f) {
    // brine runs the whole scene (slower late, so the bed never swamps)
    if (f % (f < 1400 ? 12 : 28) === 0) w.paint(45, 13, 1, BRINE)
    // the right column is a single-droplet drizzle scattered across the
    // basin: each drop quenches one lava cell and flashes off, so black
    // glass keeps forming at the rising surface instead of drowning
    if (f % 12 === 0) dot(w, 129 + (((f / 12) * 7) % 13), 13, WATER)
  },
}
