// Data-driven pairwise reaction table + the codex of discoveries.
// Pairwise transmutations live here; behaviors that need lifetimes, growth,
// or 3-body conditions live as hooks in world.ts (see BEHAVIOR notes below).

import {
  ACID, AQUA, ASH, AZOTH, BRICK, BRINE, CALX, CLAY, EMPTY, FIRE, GLASS, GOLD,
  ICE, IRON, LAVA, LYE, MERCURY, MUD, MWAX, OBSID, OIL, PLANT, REBIS, SALT,
  SAND, SOAP, SPIRIT, SPORE, STEAM, STONE, SULPHUR, WATER, WAX,
} from './elements'

/** Matches any hot element (fire, lava, spirit flame). */
export const HOT = -1

type Rng = () => number

export interface Reaction {
  /** Neighbor element this rule fires against (or HOT wildcard). */
  b: number
  /** Probability per neighbor encounter per step. */
  p: number
  /** What the acting cell becomes. Omit to leave unchanged. */
  aTo?: number
  /** Chance that aTo applies when the rule fires (default 1). */
  aToP?: number
  /** What the neighbor becomes. Omit to leave unchanged. */
  bTo?: number
  aAux?: (rng: Rng) => number
  bAux?: (rng: Rng) => number
  /** Codex key inscribed when this fires. */
  disc?: string
  /** Side effect handled by the world. */
  fx?: 'explode' | 'steamUp' | 'burnPlant'
  /** Stop scanning further neighbors this step (cell consumed/transformed). */
  stop?: boolean
}

const fireAux = (rng: Rng) => (30 + rng() * 30) | 0
const steamAux = (rng: Rng) => (80 + rng() * 60) | 0
const spiritAux = (rng: Rng) => (40 + rng() * 30) | 0

/** Reaction rules indexed by the acting element. Order matters: first match
 *  per neighbor wins. */
export const RULES: Partial<Record<number, Reaction[]>> = {
  [WATER]: [
    { b: ICE, p: 0.012, aTo: ICE, disc: 'crystal', stop: true },
  ],
  [SAND]: [
    { b: LAVA, p: 0.08, aTo: GLASS, disc: 'vitrify', stop: true },
    // Wetting (wet-bit, not a transmutation) is a behavior hook in world.ts.
  ],
  [ACID]: [
    { b: LAVA, p: 1, bTo: STONE, aTo: STEAM, aAux: steamAux, disc: 'neutral', stop: true },
    { b: STONE, p: 0.06, bTo: EMPTY, aTo: EMPTY, aToP: 0.3, disc: 'corrode' },
    { b: PLANT, p: 0.15, bTo: EMPTY, disc: 'wither' },
    { b: IRON, p: 0.08, bTo: EMPTY },
    { b: SAND, p: 0.05, bTo: EMPTY },
    { b: WAX, p: 0.05, bTo: EMPTY },
  ],
  [LAVA]: [
    { b: WATER, p: 1, bTo: STEAM, bAux: steamAux, aTo: OBSID, disc: 'quench', stop: true },
    { b: OIL, p: 1, bTo: FIRE, bAux: fireAux, disc: 'flash' },
    { b: PLANT, p: 0.5, bTo: FIRE, bAux: fireAux, disc: 'wildfire' },
    { b: WAX, p: 0.3, bTo: MWAX, disc: 'render' },
    { b: ICE, p: 0.5, bTo: WATER, disc: 'thaw' },
    { b: SULPHUR, p: 1, fx: 'explode' },
    { b: IRON, p: 0.05, bTo: CALX, disc: 'calcine' },
  ],
  [FIRE]: [
    { b: WATER, p: 1, bTo: STEAM, bAux: steamAux, aTo: EMPTY, disc: 'evap', stop: true },
    { b: OIL, p: 0.5, bTo: FIRE, bAux: fireAux, disc: 'ignite' },
    { b: PLANT, p: 0.3, fx: 'burnPlant' },
    { b: WAX, p: 0.12, bTo: MWAX, disc: 'render' },
    { b: SULPHUR, p: 1, fx: 'explode' },
    { b: ICE, p: 0.3, bTo: WATER, disc: 'thaw' },
    { b: SPORE, p: 0.4, bTo: FIRE, bAux: () => 16 },
    { b: IRON, p: 0.04, bTo: CALX, disc: 'calcine' },
  ],
  [SPIRIT]: [
    { b: WATER, p: 1, bTo: STEAM, bAux: steamAux, aTo: EMPTY, disc: 'evap', stop: true },
    { b: OIL, p: 0.4, bTo: FIRE, bAux: fireAux, disc: 'ignite' },
    { b: ICE, p: 0.3, bTo: WATER, disc: 'thaw' },
    { b: SULPHUR, p: 1, fx: 'explode' },
  ],
  [STEAM]: [
    { b: ICE, p: 0.2, aTo: WATER, disc: 'cond', stop: true },
  ],
  [PLANT]: [
    { b: ASH, p: 0.05, bTo: EMPTY, disc: 'fertile' }, // energy boost applied in world hook
  ],
  [ASH]: [
    { b: WATER, p: 0.05, bTo: EMPTY, aTo: LYE, disc: 'potash', stop: true },
  ],
  [CLAY]: [
    { b: WATER, p: 0.12, bTo: EMPTY, aTo: MUD, disc: 'slip', stop: true },
  ],
  [MUD]: [
    { b: HOT, p: 0.25, aTo: BRICK, disc: 'kiln', stop: true },
  ],
  [SALT]: [
    { b: WATER, p: 1, bTo: BRINE, aTo: EMPTY, disc: 'dissolve', stop: true },
    { b: ICE, p: 0.08, bTo: WATER, disc: 'deice' },
  ],
  [BRINE]: [
    { b: HOT, p: 1, aTo: SALT, fx: 'steamUp', disc: 'distill', stop: true },
    { b: PLANT, p: 0.12, bTo: EMPTY, disc: 'salted' },
  ],
  [LYE]: [
    { b: ACID, p: 1, bTo: WATER, aTo: SALT, disc: 'titrate', stop: true },
    { b: OIL, p: 0.3, bTo: SOAP, aTo: EMPTY, aToP: 0.5, disc: 'sapon' },
    { b: PLANT, p: 0.04, bTo: EMPTY },
  ],
  [MERCURY]: [
    { b: GOLD, p: 0.02, bTo: EMPTY, disc: 'amalgam' },
  ],
  [AQUA]: [
    { b: HOT, p: 0.5, aTo: SPIRIT, aAux: spiritAux, disc: 'spiritfire', stop: true },
  ],
  [CALX]: [
    { b: AQUA, p: 0.15, aTo: EMPTY, bTo: AZOTH, disc: 'dissolution', stop: true },
  ],
  [AZOTH]: [
    { b: MERCURY, p: 0.1, aTo: REBIS, bTo: EMPTY, disc: 'conjunction', stop: true },
  ],
  // REBIS coagulation is a 3-body condition (sulphur + heat) — world hook.
}

/* ───────────────────────── the codex ───────────────────────── */

export interface Discovery {
  key: string
  name: string
  recipe: string
  hint: string
  group: string
}

export const CODEX_GROUPS = [
  'Foundations',
  'The Garden',
  'Fire & Earth',
  'The Salt Path',
  'The Great Work',
] as const

const d = (key: string, name: string, recipe: string, hint: string, group: string): Discovery =>
  ({ key, name, recipe, hint, group })

export const DISCOVERIES: Discovery[] = [
  // I. Foundations
  d('wetting', 'Wetting', 'sand + water', 'Dry grains drink, darken, and hold.', 'Foundations'),
  d('immis', 'Immiscible', 'oil over water', 'Two liquids that refuse each other.', 'Foundations'),
  d('crystal', 'Crystallize', 'ice + water', 'Cold spreads through still water.', 'Foundations'),
  d('thaw', 'Thaw', 'heat + ice', 'Winter’s grip loosens near warmth.', 'Foundations'),
  d('evap', 'Evaporation', 'fire + water', 'Flame lifts the river skyward.', 'Foundations'),
  d('cond', 'Condensation', 'steam → water', 'What rises must rain down.', 'Foundations'),
  // II. The Garden
  d('germ', 'Germination', 'spore + water', 'A sleeping seed asks for rain.', 'The Garden'),
  d('myc', 'Mycelium', 'spore + plant', 'Drifting motes creep along living stems.', 'The Garden'),
  d('photo', 'Photosynthesis', 'plant + water', 'Leaves drink, and multiply.', 'The Garden'),
  d('cultivate', 'Cultivate', 'spore + clay + water', 'Seed, soil, and rain - the old triad.', 'The Garden'),
  d('fertile', 'Fertile Ground', 'plant + ash', 'The burnt field feeds the next harvest.', 'The Garden'),
  d('wither', 'Wither', 'acid + plant', 'The venom finds the garden.', 'The Garden'),
  d('salted', 'Salted Earth', 'brine + plant', 'Nothing grows where the bitter water falls.', 'The Garden'),
  d('decay', 'Decay', 'plant + mud', 'What rots beneath the marsh must rise.', 'The Garden'),
  // III. Fire & Earth
  d('ignite', 'Ignition', 'fire + oil', 'A single spark finds the black blood.', 'Fire & Earth'),
  d('flash', 'Flashpoint', 'lava + oil', 'The slick dark touches the earth’s fire.', 'Fire & Earth'),
  d('wildfire', 'Wildfire', 'fire + plant', 'Green things fear the orange tongue.', 'Fire & Earth'),
  d('cremate', 'Cremation', 'plant → ash', 'What burns leaves something gray behind.', 'Fire & Earth'),
  d('quench', 'Quench', 'water + lava', 'The sea meets the mountain’s blood.', 'Fire & Earth'),
  d('vitrify', 'Vitrify', 'lava + sand', 'Desert grains kissed by molten heat.', 'Fire & Earth'),
  d('render', 'Render', 'heat + wax', 'The candle bows to the flame.', 'Fire & Earth'),
  d('congeal', 'Congeal', 'molten wax → wax', 'What melted remembers its shape.', 'Fire & Earth'),
  d('slip', 'Slip', 'clay + water', 'Earth drinks, and softens.', 'Fire & Earth'),
  d('kiln', 'Kiln', 'mud + heat', 'Soft earth, fired hard.', 'Fire & Earth'),
  d('marsh', 'Marsh Fire', 'marsh gas + fire', 'Will-o’-the-wisp - the marsh exhales flame.', 'Fire & Earth'),
  d('detonate', 'Detonation', 'fire + sulphur', 'Yellow brimstone. One spark.', 'Fire & Earth'),
  // IV. The Salt Path
  d('dissolve', 'Dissolve', 'salt + water', 'White crystals vanish into the deep.', 'The Salt Path'),
  d('distill', 'Distill', 'brine + heat', 'Boil the bitter sea, keep what remains.', 'The Salt Path'),
  d('deice', 'De-Ice', 'salt + ice', 'White crystals bite through winter.', 'The Salt Path'),
  d('potash', 'Potash', 'ash + water', 'The fire’s leavings steep into caustic.', 'The Salt Path'),
  d('sapon', 'Saponify', 'lye + oil', 'Caustic and fat become the cleanser.', 'The Salt Path'),
  d('titrate', 'Titration', 'acid + lye', 'Venom meets caustic - salt and water remain.', 'The Salt Path'),
  d('corrode', 'Corrosion', 'acid + stone', 'Green venom gnaws at rock.', 'The Salt Path'),
  d('neutral', 'Neutralize', 'acid + lava', 'Venom and fire’s blood cancel to stone.', 'The Salt Path'),
  // V. The Great Work
  d('spiritfire', 'Spirit Flame', 'aqua vitae + heat', 'The distilled spirit burns pale and clean.', 'The Great Work'),
  d('amalgam', 'Amalgam', 'mercury + gold', 'The quicksilver swallows the sun. Keep them apart.', 'The Great Work'),
  d('calcine', 'Calcination', 'iron + fire', 'First, the metal must die to red dust.', 'The Great Work'),
  d('dissolution', 'Dissolution', 'calx + aqua vitae', 'Drown the dead metal in the spirit of wine.', 'The Great Work'),
  d('conjunction', 'Conjunction', 'azoth + mercury', 'The green water weds the quicksilver.', 'The Great Work'),
  d('coagulate', 'Coagulation', 'rebis + sulphur + heat', 'Fix the volatile. The Great Work is done.', 'The Great Work'),
]

export const DISC_INDEX: Record<string, number> = {}
DISCOVERIES.forEach((disc, i) => { DISC_INDEX[disc.key] = i })
