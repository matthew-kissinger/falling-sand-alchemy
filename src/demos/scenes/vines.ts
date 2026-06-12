// 10 - The Vines. Three great looping vines - drawn as living calligraphy,
// taller than anything else in the film - leaf out under rain, then burn:
// one spark at a root and the fire climbs every limb and runs BOTH ways
// around each loop. The third vine is caught mid-burn by returning rain and
// survives, half-charred and still green above the scar.
//
// Staging truths:
// - Stems are drawn with line() at r=1 (plus-shaped discs), so every stroke
//   is 4-connected and 2-3 cells thick: burnPlant always has a parallel path
//   past its own 25% ash plugs (a 1px vine self-blocks like any plant fuse).
// - Loops are chord-rings entered at the bottom and exited at the top, so
//   the climb forks at every ring and the fire traces it as a glowing circle.
// - The skeleton is drawn with aux 0 (inert): energy is sprinkled only at
//   crowns and loop-tops, so rain leafs out clusters where a vine would leaf,
//   and the calligraphy itself never grows into a blob.
// - The ground is the garden's proven sandwich (wet clay capped by a plant
//   line) so rain cannot turn the bed to creeping mud; a root-fire chars at
//   most a ~16-column ring of cap before ash plugs it (measured).

import type { World } from '../../sim/world'
import { CLAY, FIRE, PLANT, STONE, WATER } from '../../sim/elements'
import { dot, line, ramp, rect, rectAux, type Scene } from '../lib'

type Step = { to: [number, number] } | { loop: [number, number, number] }

function ring(w: World, cx: number, cy: number, r: number): void {
  const n = Math.max(12, Math.round(r * 2.4))
  let prev: [number, number] = [cx, cy + r]
  for (let k = 1; k <= n; k++) {
    const th = Math.PI / 2 + (k / n) * Math.PI * 2
    const q: [number, number] = [Math.round(cx + r * Math.cos(th)), Math.round(cy + r * Math.sin(th))]
    line(w, prev[0], prev[1], q[0], q[1], 1, PLANT)
    prev = q
  }
}

function vine(w: World, root: [number, number], steps: Step[]): void {
  let cur = root
  for (const s of steps) {
    if ('to' in s) {
      line(w, cur[0], cur[1], s.to[0], s.to[1], 1, PLANT)
      cur = s.to
    } else {
      const [cx, cy, r] = s.loop
      line(w, cur[0], cur[1], cx, cy + r, 1, PLANT)
      ring(w, cx, cy, r)
      // a touch of energy at the loop-top so rain leafs the rings
      w.set(cx, cy - r, PLANT, 12)
      w.set(cx + 1, cy - r, PLANT, 9)
      cur = [cx, cy - r]
    }
  }
}

function crown(w: World, x: number, y: number): void {
  for (let dy = -2; dy <= 2; dy++)
    for (let dx = -2; dx <= 2; dx++) {
      if (dx * dx + dy * dy > 5) continue
      w.set(x + dx, y + dy, PLANT, 8 + ((Math.abs(dx * 3 + dy) * 7) % 7))
    }
}

// unconditional: by spark time the root may be overgrown with new leaf, and
// a polite dot() would no-op forever (measured: zero wildfire events)
const torch = (w: World, x: number, y: number): void => {
  w.set(x, y, FIRE, 44)
}

export const SCENE: Scene = {
  title: 'The Vines',
  seed: 757110,
  blurb:
    'Three great looping vines stand bare from a dead season. Rain returns and they remember how to grow - ' +
    'crowns and loop-tops leafing out. Then one spark at the eldest root, and the fire climbs every limb, ' +
    'running both ways around each loop; a second spark takes its sister. The third catches too - but the ' +
    'rain comes back for it, quenching the climb mid-loop, and the last vine keeps its green above the scar.',
  film: [
    'Lay wet clay ground capped by a line of plant; draw three tall vines (8) with loops in their stems.',
    'Rain (1) until the crowns and loop-tops leaf out.',
    'Stop the rain. Touch fire (3) to the first stem: the burn climbs every attached limb, both ways around the loop.',
    'Spark the second vine. Watch the rings light like filaments and the ash snow off.',
    'Spark the third at its crown, under returning rain: the creep down is held. What is wet, lives.',
  ],
  duration: 1400,
  captions: [
    { at: 10, text: 'three vines, bare from the dead season' },
    { on: 'photo', count: 16, delay: 20, text: 'rain - and they remember how to grow' },
    { on: 'wildfire', delay: 8, text: 'a spark takes the eldest' },
    { at: 788, text: 'and its sister' },
    { at: 938, text: 'the third waits its turn' },
    { at: 1000, text: 'but the rain keeps the last one' },
  ],
  capAnchor: 'bottom',
  holdOut: 80,
  rate: ramp([[90, 1], [530, 3], [1100, 1], [1400, 3]]),
  setup(w) {
    rect(w, 0, 114, 179, 119, STONE)
    rectAux(w, 0, 101, 179, 113, CLAY, 1)
    // the cap: rain-proof roof for the clay. Drawn INERT (aux 0) - rect()'s
    // default plant aux of 8 turns the whole line into a growing mat that
    // can carry fire between the vines.
    rectAux(w, 0, 100, 179, 100, PLANT, 0)
    // the eldest: one mid loop, one high loop, a crown
    vine(w, [38, 100], [
      { to: [35, 86] }, { to: [41, 76] }, { loop: [43, 64, 8] },
      { to: [37, 44] }, { loop: [41, 34, 5] }, { to: [44, 25] },
    ])
    crown(w, 44, 23)
    // the sister: the broadest loop, and a forked tendril with its own ring
    vine(w, [88, 100], [
      { to: [93, 84] }, { loop: [85, 67, 10] }, { to: [79, 44] }, { to: [84, 33] },
    ])
    crown(w, 84, 30)
    vine(w, [85, 57], [{ to: [95, 50] }, { loop: [100, 43, 4] }])
    crown(w, 100, 37)
    // the last: low ring, high ring, leaning crown
    vine(w, [136, 100], [
      { loop: [143, 86, 7] }, { to: [131, 62] }, { loop: [137, 49, 6] }, { to: [131, 33] },
    ])
    crown(w, 130, 30)
  },
  tick(w, f) {
    // the growing rain: broad, with aimed drops for the crowns
    if (f >= 40 && f < 520) {
      if (f % 5 === 0) dot(w, 6 + ((f * 37) % 168), 12, WATER)
      if (f % 5 === 2) dot(w, 10 + ((f * 53 + 31) % 160), 12, WATER)
      if (f % 6 === 0) dot(w, 40 + ((f / 6) % 3) * 43 + ((f * 11) % 9), 14, WATER)
    }
    // the sparks, set ON a stem cell of each vine. Ground-level torches
    // beside the roots land in leftover rain puddles and steam out before
    // they catch (measured: the eldest never burned); a stem cell at y93 is
    // above the puddle line and the climb takes it from there. The LAST vine
    // is sparked at its crown: an upward climb outruns any rain curtain
    // (measured), but a downward creep against falling water can be held.
    if (f >= 600 && f < 607 && f % 3 === 0) torch(w, 37, 93)
    if (f >= 780 && f < 787 && f % 3 === 0) torch(w, 90, 93)
    if (f >= 955 && f < 962 && f % 3 === 0) torch(w, 131, 33)
    // the saving rain, spawned LOW (just over the last vine's crown): a drop
    // released at the sky line takes ~80 frames to fall and arrives after
    // the climb has already crowned (measured). Starts before the spark so
    // the curtain is falling through the vine as the burn begins.
    if (f >= 940 && f < 1240) {
      dot(w, 120 + ((f * 19) % 42), 34, WATER)
      if (f % 2 === 0) dot(w, 126 + ((f * 7 + 13) % 32), 42, WATER)
      if (f % 3 === 0) dot(w, 122 + ((f * 11 + 5) % 38), 26, WATER)
      if (f % 7 === 0) dot(w, 8 + ((f * 41) % 164), 12, WATER)
    }
  },
}
