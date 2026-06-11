import { describe, expect, it } from 'vitest'
import {
  AQUA, AZOTH, BRINE, CALX, CLAY, EMPTY, GLASS, GOLD, IRON, LAVA, MERCURY,
  MUD, OBSID, OIL, REBIS, SALT, SAND, STEAM, STONE, SULPHUR, WATER,
} from './elements'
import { DISCOVERIES, DISC_INDEX } from './rules'
import { World } from './world'

/** Small walled world: stone floor + walls so nothing escapes. */
function basin(w = 20, h = 20, seed = 42): World {
  const world = new World(w, h, seed)
  for (let x = 0; x < w; x++) { world.set(x, h - 1, STONE); world.set(x, 0, STONE) }
  for (let y = 0; y < h; y++) { world.set(0, y, STONE); world.set(w - 1, y, STONE) }
  return world
}

function run(world: World, steps: number, collect?: Set<string>): void {
  for (let s = 0; s < steps; s++) {
    world.step()
    if (collect) for (const ev of world.events) if (ev.t === 'disc') collect.add(ev.key)
  }
}

function count(world: World, e: number): number {
  let c = 0
  for (let i = 0; i < world.n; i++) if (world.grid[i] === e) c++
  return c
}

/** Mean y of all cells of element e (larger = lower on screen). */
function meanY(world: World, e: number): number {
  let sum = 0, c = 0
  for (let y = 0; y < world.h; y++)
    for (let x = 0; x < world.w; x++)
      if (world.grid[y * world.w + x] === e) { sum += y; c++ }
  return c ? sum / c : -1
}

describe('unified density movement', () => {
  it('sand sinks through water (the prototype bug)', () => {
    const w = basin()
    // water pool filling the basin, sand layer on top
    for (let y = 10; y < 19; y++) for (let x = 1; x < 19; x++) w.set(x, y, WATER)
    for (let x = 6; x < 14; x++) w.set(x, 5, SAND)
    run(w, 200)
    expect(meanY(w, SAND)).toBeGreaterThan(meanY(w, WATER))
    expect(count(w, SAND)).toBe(8) // displaced, not destroyed
  })

  it('oil floats on water', () => {
    const w = basin()
    for (let x = 1; x < 19; x++) { w.set(x, 17, OIL); w.set(x, 18, OIL) }
    for (let x = 1; x < 19; x++) { w.set(x, 15, WATER); w.set(x, 16, WATER) }
    run(w, 300)
    expect(meanY(w, OIL)).toBeLessThan(meanY(w, WATER))
  })

  it('mercury sinks below everything, and iron floats on mercury', () => {
    const w = basin()
    for (let x = 1; x < 19; x++) w.set(x, 18, WATER)
    for (let x = 8; x < 12; x++) w.set(x, 10, MERCURY)
    for (let x = 9; x < 11; x++) w.set(x, 5, IRON)
    run(w, 400)
    expect(meanY(w, MERCURY)).toBeGreaterThan(meanY(w, WATER))
    expect(meanY(w, IRON)).toBeLessThan(meanY(w, MERCURY))
  })

  it('wet sand packs: no diagonal slide once wetted', () => {
    const w = basin(30, 20)
    for (let x = 1; x < 29; x++) for (let y = 14; y < 19; y++) w.set(x, y, WATER)
    w.set(15, 5, SAND)
    run(w, 300)
    // the lone wet grain sits on the floor, did not vanish
    expect(count(w, SAND)).toBe(1)
    let auxVal = -1
    for (let i = 0; i < w.n; i++) if (w.grid[i] === SAND) auxVal = w.aux[i]!
    expect(auxVal).toBe(1) // wet bit set
  })
})

describe('reaction table', () => {
  it('salt dissolves into brine, and brine sinks below water', () => {
    const w = basin()
    const found = new Set<string>()
    for (let y = 12; y < 19; y++) for (let x = 1; x < 19; x++) w.set(x, y, WATER)
    for (let x = 8; x < 12; x++) w.set(x, 5, SALT)
    run(w, 300, found)
    expect(found.has('dissolve')).toBe(true)
    expect(count(w, BRINE)).toBeGreaterThan(0)
    expect(meanY(w, BRINE)).toBeGreaterThan(meanY(w, WATER))
  })

  it('water quenches lava into obsidian + steam', () => {
    const w = basin()
    const found = new Set<string>()
    for (let x = 5; x < 15; x++) w.set(x, 17, LAVA)
    for (let x = 5; x < 15; x++) w.set(x, 14, WATER)
    run(w, 60, found)
    expect(found.has('quench')).toBe(true)
    expect(count(w, OBSID)).toBeGreaterThan(0)
  })

  it('lava vitrifies sand into glass', () => {
    const w = basin()
    const found = new Set<string>()
    for (let x = 1; x < 19; x++) w.set(x, 18, LAVA)
    for (let x = 8; x < 12; x++) w.set(x, 16, SAND)
    run(w, 200, found)
    expect(found.has('vitrify')).toBe(true)
    expect(count(w, GLASS)).toBeGreaterThan(0)
  })

  it('clay + water makes mud (slip)', () => {
    const w = basin()
    const found = new Set<string>()
    for (let x = 1; x < 19; x++) for (let y = 14; y < 19; y++) w.set(x, y, WATER)
    for (let x = 8; x < 12; x++) w.set(x, 5, CLAY)
    run(w, 300, found)
    expect(found.has('slip')).toBe(true)
    expect(count(w, MUD)).toBeGreaterThan(0)
  })
})

describe('the Great Work', () => {
  it('calcination: iron + lava heat → calx', () => {
    const w = basin()
    const found = new Set<string>()
    for (let x = 1; x < 19; x++) w.set(x, 18, LAVA)
    for (let x = 8; x < 12; x++) w.set(x, 16, IRON)
    run(w, 400, found)
    expect(found.has('calcine')).toBe(true)
    expect(count(w, CALX)).toBeGreaterThan(0)
  })

  it('dissolution: calx + aqua vitae → azoth', () => {
    const w = basin()
    const found = new Set<string>()
    for (let y = 14; y < 19; y++) for (let x = 1; x < 19; x++) w.set(x, y, AQUA)
    for (let x = 8; x < 12; x++) w.set(x, 10, CALX)
    run(w, 300, found)
    expect(found.has('dissolution')).toBe(true)
    expect(count(w, AZOTH)).toBeGreaterThan(0)
  })

  it('conjunction: azoth + mercury → rebis', () => {
    const w = basin()
    const found = new Set<string>()
    for (let x = 1; x < 19; x++) w.set(x, 18, MERCURY)
    for (let x = 6; x < 14; x++) w.set(x, 15, AZOTH)
    run(w, 300, found)
    expect(found.has('conjunction')).toBe(true)
    expect(count(w, REBIS)).toBeGreaterThan(0)
  })

  it('coagulation: rebis + sulphur + heat → gold', () => {
    const w = basin(9, 5)
    const found = new Set<string>()
    // 1-cell pocket row: stone | lava | rebis | sulphur | stone
    // (sulphur must not touch the lava or it detonates — that is the puzzle)
    for (let x = 1; x < 8; x++) w.set(x, 2, STONE)
    w.set(1, 3, STONE); w.set(2, 3, LAVA); w.set(3, 3, REBIS)
    w.set(4, 3, SULPHUR); w.set(5, 3, STONE)
    run(w, 200, found)
    expect(found.has('coagulate')).toBe(true)
    expect(count(w, GOLD)).toBeGreaterThan(0)
  })

  it('amalgam: mercury slowly swallows gold', () => {
    const w = basin()
    for (let x = 1; x < 19; x++) for (let y = 15; y < 19; y++) w.set(x, y, MERCURY)
    for (let x = 6; x < 14; x++) w.set(x, 10, GOLD)
    const found = new Set<string>()
    run(w, 600, found)
    expect(found.has('amalgam')).toBe(true)
    expect(count(w, GOLD)).toBeLessThan(8)
  })
})

describe('codex integrity', () => {
  it('every rule discovery key exists in the codex', async () => {
    const { RULES } = await import('./rules')
    for (const rules of Object.values(RULES)) {
      if (!rules) continue
      for (const r of rules) {
        if (r.disc) expect(DISC_INDEX[r.disc], `missing codex entry: ${r.disc}`).toBeDefined()
      }
    }
  })

  it('codex has 40 unique entries', () => {
    expect(DISCOVERIES.length).toBe(40)
    expect(new Set(DISCOVERIES.map(d => d.key)).size).toBe(40)
  })

  it('steam condenses back to water eventually', () => {
    const w = basin()
    for (let x = 5; x < 15; x++) w.set(x, 10, STEAM, 30)
    const found = new Set<string>()
    run(w, 200, found)
    expect(count(w, STEAM)).toBe(0)
    expect(found.has('cond')).toBe(true)
  })

  it('sulphur detonates on fire contact', () => {
    const w = basin(30, 30)
    for (let x = 5; x < 25; x++) for (let y = 24; y < 28; y++) w.set(x, y, SULPHUR)
    const found = new Set<string>()
    w.set(15, 23, LAVA)
    run(w, 60, found)
    expect(found.has('detonate')).toBe(true)
    expect(count(w, SULPHUR)).toBeLessThan(80) // chain reaction consumed most
  })

  it('erase paints over anything; elements only paint into empty', () => {
    const w = basin()
    for (let x = 5; x < 15; x++) w.set(x, 10, STONE)
    w.paint(10, 10, 2, WATER)
    expect(w.at(10, 10)).toBe(STONE) // water cannot overwrite
    w.paint(10, 10, 2, EMPTY)
    expect(w.at(10, 10)).toBe(EMPTY) // erase can
  })
})
