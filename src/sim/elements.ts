// Element registry. Ids are stable u8 codes stored in the grid; never reorder
// shipped ids (saves only persist discovery keys, but trial defs reference ids).

export const EMPTY = 0
export const STONE = 1
export const SAND = 2
export const WATER = 3
export const OIL = 4
export const FIRE = 5
export const STEAM = 6
export const PLANT = 7
export const ACID = 8
export const LAVA = 9
export const WAX = 10
export const MWAX = 11
export const SPORE = 12
export const ICE = 13
export const ASH = 14
export const CLAY = 15
export const MUD = 16
export const BRICK = 17
export const SALT = 18
export const BRINE = 19
export const LYE = 20
export const SOAP = 21
export const GAS = 22
export const GLASS = 23
export const OBSID = 24
export const SULPHUR = 25
export const MERCURY = 26
export const IRON = 27
export const GOLD = 28
export const CALX = 29
export const AQUA = 30
export const AZOTH = 31
export const REBIS = 32
export const SPIRIT = 33

export const N_ELEMENTS = 34

export type MoveClass = 'static' | 'powder' | 'liquid' | 'gas'

export interface ElementDef {
  id: number
  key: string
  name: string
  color: [number, number, number]
  glow: number
  move: MoveClass
  /** Single density scale shared by powders and liquids: a powder sinks
   *  through any liquid lighter than itself; a liquid sinks below any
   *  liquid lighter than itself. Gases ignore it. */
  density: number
  /** Liquids: max horizontal spread per step. Powders/gases ignore it. */
  fluidity: number
  group: 'tools' | 'classical' | 'garden' | 'salts' | 'prima' | 'products'
  shelf: boolean
  hotkey?: string
  sparse?: boolean
}

const def = (d: ElementDef) => d

export const ELEMENTS: ElementDef[] = []
function reg(d: ElementDef) {
  ELEMENTS[d.id] = d
}

reg(def({ id: EMPTY, key: 'erase', name: 'erase', color: [14, 12, 10], glow: 0, move: 'static', density: 0, fluidity: 0, group: 'tools', shelf: true, hotkey: 'e' }))
reg(def({ id: STONE, key: 'stone', name: 'stone', color: [122, 118, 110], glow: 0, move: 'static', density: 255, fluidity: 0, group: 'tools', shelf: true, hotkey: '=' }))
reg(def({ id: SAND, key: 'sand', name: 'sand', color: [214, 180, 106], glow: 0, move: 'powder', density: 40, fluidity: 0, group: 'classical', shelf: true, hotkey: '2' }))
reg(def({ id: WATER, key: 'water', name: 'water', color: [58, 118, 178], glow: 0, move: 'liquid', density: 20, fluidity: 5, group: 'classical', shelf: true, hotkey: '1' }))
reg(def({ id: OIL, key: 'oil', name: 'oil', color: [94, 72, 48], glow: 0, move: 'liquid', density: 10, fluidity: 3, group: 'classical', shelf: true, hotkey: '4' }))
reg(def({ id: FIRE, key: 'fire', name: 'fire', color: [255, 140, 30], glow: 255, move: 'gas', density: 1, fluidity: 0, group: 'classical', shelf: true, hotkey: '3', sparse: true }))
reg(def({ id: STEAM, key: 'steam', name: 'steam', color: [176, 194, 202], glow: 0, move: 'gas', density: 2, fluidity: 0, group: 'products', shelf: false }))
reg(def({ id: PLANT, key: 'plant', name: 'plant', color: [86, 148, 66], glow: 0, move: 'static', density: 0, fluidity: 0, group: 'garden', shelf: true, hotkey: '8' }))
reg(def({ id: ACID, key: 'acid', name: 'acid', color: [158, 214, 42], glow: 80, move: 'liquid', density: 21, fluidity: 4, group: 'salts', shelf: true, hotkey: 'w' }))
reg(def({ id: LAVA, key: 'lava', name: 'lava', color: [226, 86, 28], glow: 185, move: 'liquid', density: 30, fluidity: 1, group: 'classical', shelf: true, hotkey: '5' }))
reg(def({ id: WAX, key: 'wax', name: 'wax', color: [226, 212, 182], glow: 0, move: 'static', density: 0, fluidity: 0, group: 'garden', shelf: true, hotkey: '0' }))
reg(def({ id: MWAX, key: 'molten-wax', name: 'molten wax', color: [238, 206, 148], glow: 60, move: 'liquid', density: 26, fluidity: 2, group: 'products', shelf: false }))
reg(def({ id: SPORE, key: 'spore', name: 'spore', color: [170, 128, 190], glow: 0, move: 'powder', density: 14, fluidity: 0, group: 'garden', shelf: true, hotkey: '9', sparse: true }))
reg(def({ id: ICE, key: 'ice', name: 'ice', color: [168, 222, 240], glow: 0, move: 'static', density: 0, fluidity: 0, group: 'classical', shelf: true, hotkey: '6' }))
reg(def({ id: ASH, key: 'ash', name: 'ash', color: [138, 136, 126], glow: 0, move: 'powder', density: 12, fluidity: 0, group: 'products', shelf: false }))
reg(def({ id: CLAY, key: 'clay', name: 'clay', color: [146, 98, 66], glow: 0, move: 'powder', density: 42, fluidity: 0, group: 'garden', shelf: true, hotkey: '7' }))
reg(def({ id: MUD, key: 'mud', name: 'mud', color: [88, 66, 46], glow: 0, move: 'liquid', density: 28, fluidity: 1, group: 'products', shelf: false }))
reg(def({ id: BRICK, key: 'brick', name: 'brick', color: [172, 96, 62], glow: 0, move: 'static', density: 0, fluidity: 0, group: 'products', shelf: false }))
reg(def({ id: SALT, key: 'salt', name: 'salt', color: [232, 228, 218], glow: 0, move: 'powder', density: 35, fluidity: 0, group: 'salts', shelf: true, hotkey: 'q' }))
reg(def({ id: BRINE, key: 'brine', name: 'brine', color: [64, 128, 150], glow: 0, move: 'liquid', density: 24, fluidity: 4, group: 'products', shelf: false }))
reg(def({ id: LYE, key: 'lye', name: 'lye', color: [152, 158, 176], glow: 14, move: 'liquid', density: 22, fluidity: 4, group: 'salts', shelf: true, hotkey: 'r' }))
reg(def({ id: SOAP, key: 'soap', name: 'soap', color: [222, 232, 238], glow: 20, move: 'powder', density: 6, fluidity: 0, group: 'products', shelf: false }))
reg(def({ id: GAS, key: 'gas', name: 'marsh gas', color: [56, 72, 50], glow: 0, move: 'gas', density: 3, fluidity: 0, group: 'products', shelf: false }))
reg(def({ id: GLASS, key: 'glass', name: 'glass', color: [176, 214, 206], glow: 24, move: 'static', density: 0, fluidity: 0, group: 'products', shelf: false }))
reg(def({ id: OBSID, key: 'obsidian', name: 'obsidian', color: [40, 34, 56], glow: 0, move: 'static', density: 0, fluidity: 0, group: 'products', shelf: false }))
reg(def({ id: SULPHUR, key: 'sulphur', name: 'sulphur', color: [212, 178, 40], glow: 8, move: 'powder', density: 38, fluidity: 0, group: 'prima', shelf: true, hotkey: 's' }))
reg(def({ id: MERCURY, key: 'mercury', name: 'mercury', color: [200, 204, 212], glow: 30, move: 'liquid', density: 135, fluidity: 3, group: 'prima', shelf: true, hotkey: 'a' }))
reg(def({ id: IRON, key: 'iron', name: 'iron', color: [104, 108, 114], glow: 0, move: 'powder', density: 80, fluidity: 0, group: 'prima', shelf: true, hotkey: 'd' }))
reg(def({ id: GOLD, key: 'gold', name: 'gold', color: [236, 196, 64], glow: 70, move: 'powder', density: 95, fluidity: 0, group: 'prima', shelf: true, hotkey: 'f' }))
reg(def({ id: CALX, key: 'calx', name: 'calx', color: [188, 120, 84], glow: 0, move: 'powder', density: 30, fluidity: 0, group: 'products', shelf: false }))
reg(def({ id: AQUA, key: 'aqua-vitae', name: 'aqua vitae', color: [196, 226, 232], glow: 26, move: 'liquid', density: 8, fluidity: 5, group: 'prima', shelf: true, hotkey: 'g' }))
reg(def({ id: AZOTH, key: 'azoth', name: 'azoth', color: [120, 220, 190], glow: 90, move: 'liquid', density: 27, fluidity: 3, group: 'products', shelf: false }))
reg(def({ id: REBIS, key: 'rebis', name: 'rebis', color: [224, 160, 220], glow: 80, move: 'liquid', density: 50, fluidity: 2, group: 'products', shelf: false }))
reg(def({ id: SPIRIT, key: 'spirit-flame', name: 'spirit flame', color: [150, 190, 255], glow: 230, move: 'gas', density: 1, fluidity: 0, group: 'products', shelf: false }))

// Hot lookup tables for the sim inner loop.
export const DENS = new Uint8Array(N_ELEMENTS)
export const FLUID = new Uint8Array(N_ELEMENTS)
/** 0 static, 1 powder, 2 liquid, 3 gas */
export const MOVE = new Uint8Array(N_ELEMENTS)
for (const d of ELEMENTS) {
  DENS[d.id] = d.density
  FLUID[d.id] = d.fluidity
  MOVE[d.id] = d.move === 'powder' ? 1 : d.move === 'liquid' ? 2 : d.move === 'gas' ? 3 : 0
}

export const isHot = (e: number): boolean => e === FIRE || e === LAVA || e === SPIRIT
export const isLiquid = (e: number): boolean => MOVE[e] === 2
export const isGasish = (e: number): boolean => e === EMPTY || MOVE[e] === 3
/** Indestructible by explosions. */
export const isHard = (e: number): boolean =>
  e === STONE || e === OBSID || e === GLASS || e === BRICK

/** aux value an element should be painted/spawned with. */
export function spawnAux(e: number, rng: () => number): number {
  if (e === FIRE) return (30 + rng() * 40) | 0
  if (e === SPIRIT) return (40 + rng() * 30) | 0
  if (e === STEAM) return (80 + rng() * 60) | 0
  if (e === GAS) return (180 + rng() * 60) | 0
  if (e === PLANT) return 8
  return 0
}

/** Shelf layout: ordered groups of paintable elements. */
export const SHELF_GROUPS: { label: string; ids: number[] }[] = [
  { label: 'tools', ids: [STONE, EMPTY] },
  { label: 'classical', ids: [WATER, SAND, FIRE, OIL, LAVA, ICE] },
  { label: 'garden', ids: [CLAY, PLANT, SPORE, WAX] },
  { label: 'salts', ids: [SALT, ACID, LYE] },
  { label: 'tria prima', ids: [MERCURY, SULPHUR, IRON, GOLD, AQUA] },
]
