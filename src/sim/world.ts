// The simulation core. Pure and dependency-free: no DOM, no audio, no UI.
// Consumers drain `events` after each step().

import {
  ASH, BRICK, CLAY, DENS, EMPTY, FIRE, FLUID, GAS, GLASS, GOLD, ICE,
  MOVE, MUD, MWAX, OBSID, OIL, PLANT, REBIS, SAND, SOAP,
  SPIRIT, SPORE, STEAM, STONE, SULPHUR, WATER, WAX, isGasish, isHard, isHot,
  isLiquid, spawnAux,
} from './elements'
import { HOT, RULES, type Reaction } from './rules'

export type SimEvent =
  | { t: 'disc'; key: string; x: number; y: number }
  | { t: 'boom'; x: number }
  | { t: 'combust'; x: number }

const MAX_EVENTS = 256

function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export class World {
  readonly w: number
  readonly h: number
  readonly n: number
  grid: Uint8Array
  aux: Uint8Array
  shade: Uint8Array
  stamp: Uint8Array
  frame = 0
  events: SimEvent[] = []
  /** Cells that moved this step, by move class — feeds the audio textures. */
  moved = { powder: 0, liquid: 0, gas: 0 }
  rng: () => number

  constructor(w: number, h: number, seed = 0xc0ffee) {
    this.w = w
    this.h = h
    this.n = w * h
    this.grid = new Uint8Array(this.n)
    this.aux = new Uint8Array(this.n)
    this.shade = new Uint8Array(this.n)
    this.stamp = new Uint8Array(this.n)
    this.rng = mulberry32(seed)
  }

  inb(x: number, y: number): boolean {
    return x >= 0 && x < this.w && y >= 0 && y < this.h
  }

  at(x: number, y: number): number {
    return this.inb(x, y) ? this.grid[y * this.w + x]! : STONE
  }

  auxAt(x: number, y: number): number {
    return this.inb(x, y) ? this.aux[y * this.w + x]! : 0
  }

  set(x: number, y: number, e: number, a = 0): void {
    if (!this.inb(x, y)) return
    const i = y * this.w + x
    this.grid[i] = e
    this.aux[i] = a | 0
    this.shade[i] = (this.rng() * 255) | 0
    this.stamp[i] = this.frame & 255
  }

  swap(x1: number, y1: number, x2: number, y2: number): void {
    const a = y1 * this.w + x1
    const b = y2 * this.w + x2
    const g = this.grid
    const cls = MOVE[g[a]!]!
    if (cls === 1) this.moved.powder++
    else if (cls === 2) this.moved.liquid++
    else if (cls === 3) this.moved.gas++
    let t = g[a]!; g[a] = g[b]!; g[b] = t
    t = this.aux[a]!; this.aux[a] = this.aux[b]!; this.aux[b] = t
    t = this.shade[a]!; this.shade[a] = this.shade[b]!; this.shade[b] = t
    this.stamp[a] = this.stamp[b] = this.frame & 255
  }

  clear(): void {
    this.grid.fill(EMPTY)
    this.aux.fill(0)
  }

  private emit(ev: SimEvent): void {
    if (this.events.length < MAX_EVENTS) this.events.push(ev)
  }

  /* ─────────────────────── painting ─────────────────────── */

  paint(cx: number, cy: number, r: number, e: number, sparse = false): void {
    for (let y = cy - r; y <= cy + r; y++) {
      for (let x = cx - r; x <= cx + r; x++) {
        if (!this.inb(x, y)) continue
        if ((x - cx) ** 2 + (y - cy) ** 2 > r * r) continue
        if (sparse && this.rng() < 0.7) continue
        if (e === EMPTY) { this.set(x, y, EMPTY, 0); continue }
        if (this.grid[y * this.w + x] !== EMPTY) continue
        this.set(x, y, e, spawnAux(e, this.rng))
      }
    }
  }

  /* ─────────────────────── area effects ─────────────────────── */

  private explode(cx: number, cy: number, r: number): void {
    this.emit({ t: 'boom', x: cx })
    this.emit({ t: 'disc', key: 'detonate', x: cx, y: cy })
    const R = this.rng
    for (let y = cy - r; y <= cy + r; y++) {
      for (let x = cx - r; x <= cx + r; x++) {
        if (!this.inb(x, y)) continue
        const dx = x - cx, dy = y - cy, dd = dx * dx + dy * dy
        if (dd > r * r) continue
        const e = this.at(x, y)
        if (isHard(e)) continue
        if (dd > r * r * 0.55 && R() < 0.4) { this.set(x, y, STEAM, 40 + R() * 40); continue }
        this.set(x, y, R() < 0.7 ? FIRE : STEAM, 30 + R() * 40)
      }
    }
  }

  private combust(cx: number, cy: number): void {
    this.emit({ t: 'combust', x: cx })
    this.emit({ t: 'disc', key: 'marsh', x: cx, y: cy })
    const R = this.rng
    const r = 3
    for (let y = cy - r; y <= cy + r; y++) {
      for (let x = cx - r; x <= cx + r; x++) {
        if (!this.inb(x, y)) continue
        if ((x - cx) ** 2 + (y - cy) ** 2 > r * r) continue
        if (isHard(this.at(x, y))) continue
        const q = R()
        this.set(x, y, q < 0.5 ? FIRE : q < 0.8 ? STEAM : EMPTY, 30 + R() * 30)
      }
    }
  }

  /* ─────────────────────── reactions ─────────────────────── */

  /** Apply table reactions for the cell. Returns true if the cell is still
   *  the same element afterwards (i.e. should continue with behavior+move). */
  private applyReactions(x: number, y: number, i: number, e: number): boolean {
    const rules = RULES[e]
    if (!rules) return true
    const R = this.rng
    for (let dir = 0; dir < 4; dir++) {
      const nx = dir === 2 ? x - 1 : dir === 3 ? x + 1 : x
      const ny = dir === 0 ? y - 1 : dir === 1 ? y + 1 : y
      const t = this.at(nx, ny)
      for (let ri = 0; ri < rules.length; ri++) {
        const r = rules[ri] as Reaction
        if (r.b !== t && !(r.b === HOT && isHot(t))) continue
        if (R() >= r.p) continue
        this.applyRule(r, x, y, nx, ny)
        if (r.stop || this.grid[i] !== e) return this.grid[i] === e
        break // one rule per neighbor
      }
    }
    return this.grid[i] === e
  }

  private applyRule(r: Reaction, x: number, y: number, nx: number, ny: number): void {
    const R = this.rng
    if (r.fx === 'explode') { this.explode(nx, ny, 7); return }
    if (r.fx === 'burnPlant') {
      // fire + plant: mostly spreads, sometimes leaves ash behind
      if (R() < 0.25) {
        this.set(nx, ny, ASH, 0)
        this.emit({ t: 'disc', key: 'cremate', x: nx, y: ny })
      } else {
        this.set(nx, ny, FIRE, (28 + R() * 22) | 0)
      }
      this.emit({ t: 'disc', key: 'wildfire', x: nx, y: ny })
      return
    }
    if (r.bTo !== undefined && this.inb(nx, ny)) {
      this.set(nx, ny, r.bTo, r.bAux ? r.bAux(R) : 0)
    }
    if (r.fx === 'steamUp' && this.at(x, y - 1) === EMPTY) {
      this.set(x, y - 1, STEAM, (80 + R() * 60) | 0)
    }
    if (r.aTo !== undefined && (r.aToP === undefined || R() < r.aToP)) {
      this.set(x, y, r.aTo, r.aAux ? r.aAux(R) : 0)
    }
    if (r.disc) this.emit({ t: 'disc', key: r.disc, x, y })
  }

  /* ─────────────────────── movement ─────────────────────── */

  private powderMove(x: number, y: number, e: number): void {
    const d_e = DENS[e]!
    const wet = (e === SAND || e === CLAY) && this.aux[y * this.w + x] === 1
    const b = this.at(x, y + 1)
    if (isGasish(b)) { this.swap(x, y, x, y + 1); return }
    if (isLiquid(b) && DENS[b]! < d_e && this.rng() < 0.85) { this.swap(x, y, x, y + 1); return }
    if (wet) return // wet powder packs: no diagonal slide
    const d = this.rng() < 0.5 ? -1 : 1
    const t1 = this.at(x + d, y + 1)
    if (isGasish(t1) || (isLiquid(t1) && DENS[t1]! < d_e && this.rng() < 0.5)) {
      this.swap(x, y, x + d, y + 1); return
    }
    const t2 = this.at(x - d, y + 1)
    if (isGasish(t2) || (isLiquid(t2) && DENS[t2]! < d_e && this.rng() < 0.5)) {
      this.swap(x, y, x - d, y + 1)
    }
  }

  private liquidMove(x: number, y: number, e: number): void {
    const myd = DENS[e]!
    const b = this.at(x, y + 1)
    if (isGasish(b)) { this.swap(x, y, x, y + 1); return }
    if (isLiquid(b) && DENS[b]! < myd && this.rng() < 0.6) { this.swap(x, y, x, y + 1); return }
    const d = this.rng() < 0.5 ? -1 : 1
    if (isGasish(this.at(x + d, y + 1))) { this.swap(x, y, x + d, y + 1); return }
    if (isGasish(this.at(x - d, y + 1))) { this.swap(x, y, x - d, y + 1); return }
    const disp = FLUID[e]!
    for (let s = 1; s <= disp; s++) {
      const t = this.at(x + d * s, y)
      if (isGasish(t)) { this.swap(x, y, x + d * s, y); return }
      if (t !== e && !(isLiquid(t) && DENS[t]! < myd)) break
    }
  }

  private gasMove(x: number, y: number): void {
    const d = this.rng() < 0.5 ? -1 : 1
    if (this.at(x, y - 1) === EMPTY && this.rng() < 0.8) { this.swap(x, y, x, y - 1); return }
    if (this.at(x + d, y - 1) === EMPTY) { this.swap(x, y, x + d, y - 1); return }
    if (this.at(x + d, y) === EMPTY && this.rng() < 0.5) this.swap(x, y, x + d, y)
  }

  /* ─────────────────────── behaviors ─────────────────────── */

  private neighbors4(x: number, y: number, fn: (nx: number, ny: number) => void): void {
    fn(x, y - 1); fn(x, y + 1); fn(x - 1, y); fn(x + 1, y)
  }

  /** Per-element behavior after reactions. Returns false if the cell was
   *  consumed/transformed and movement should be skipped. */
  private behave(x: number, y: number, i: number, e: number): boolean {
    const R = this.rng
    switch (e) {
      case FIRE:
      case SPIRIT: {
        const a = this.aux[i]!
        if (a <= 1) { this.set(x, y, EMPTY, 0); return false }
        this.aux[i] = a - 1
        if (R() < 0.6 && this.at(x, y - 1) === EMPTY && R() < 0.5) this.swap(x, y, x, y - 1)
        else if (R() < 0.2) {
          const d = R() < 0.5 ? -1 : 1
          if (this.at(x + d, y - 1) === EMPTY) this.swap(x, y, x + d, y - 1)
        }
        return false // fire handles its own motion
      }
      case STEAM: {
        const a = this.aux[i]!
        if (a <= 1) {
          if (R() < 0.35) {
            this.set(x, y, WATER, 0)
            this.emit({ t: 'disc', key: 'cond', x, y })
          } else this.set(x, y, EMPTY, 0)
          return false
        }
        this.aux[i] = a - 1
        return true
      }
      case GAS: {
        let lit = false
        this.neighbors4(x, y, (nx, ny) => {
          if (!lit && isHot(this.at(nx, ny))) { this.combust(x, y); lit = true }
        })
        if (lit) return false
        const a = this.aux[i]!
        if (a <= 1) { this.set(x, y, EMPTY, 0); return false }
        this.aux[i] = a - 1
        return true
      }
      case PLANT: {
        const en = this.aux[i]!
        let mud = 0
        this.neighbors4(x, y, (nx, ny) => { if (this.at(nx, ny) === MUD) mud++ })
        if (mud >= 2 && R() < 0.004) {
          this.set(x, y, GAS, (180 + R() * 60) | 0)
          this.emit({ t: 'disc', key: 'decay', x, y })
          return false
        }
        // fertile: the rules table consumed an ash neighbor → top up energy
        // (table can't increment aux, so detect: rule fired this frame if a
        // neighbor just became EMPTY is unknowable — instead do it here)
        if (en < 200 && R() < 0.05) {
          let fed = false
          this.neighbors4(x, y, (nx, ny) => {
            if (fed || this.at(nx, ny) !== ASH) return
            this.set(nx, ny, EMPTY, 0)
            this.aux[i] = Math.min(255, en + 12)
            this.emit({ t: 'disc', key: 'fertile', x, y })
            fed = true
          })
          if (fed) return false
        }
        if (en > 0 && R() < 0.1) {
          let grew = false
          this.neighbors4(x, y, (nx, ny) => {
            if (grew) return
            if (this.at(nx, ny) === WATER && R() < 0.5) {
              this.set(nx, ny, PLANT, en - 1)
              this.emit({ t: 'disc', key: 'photo', x, y })
              grew = true
            }
          })
          if (!grew && R() < 0.06 && this.at(x, y - 1) === EMPTY) {
            this.set(x, y - 1, PLANT, en - 1)
            this.aux[i] = Math.max(0, en - 2)
          }
        }
        return false // plant is rooted
      }
      case SPORE: {
        let done = false, clayN = false, waterN = false
        this.neighbors4(x, y, (nx, ny) => {
          const t = this.at(nx, ny)
          if (t === CLAY) clayN = true
          if (t === WATER) waterN = true
          if (done) return
          if (t === MUD) {
            this.set(x, y, PLANT, 18)
            this.emit({ t: 'disc', key: 'cultivate', x, y })
            done = true
            return
          }
          if (t === PLANT && R() < 0.03) {
            this.set(x, y, PLANT, 5)
            this.emit({ t: 'disc', key: 'myc', x, y })
            done = true
          }
        })
        if (!done && clayN && waterN) {
          this.set(x, y, PLANT, 18)
          this.emit({ t: 'disc', key: 'cultivate', x, y })
          done = true
        } else if (!done && waterN) {
          this.set(x, y, PLANT, 10)
          this.emit({ t: 'disc', key: 'germ', x, y })
          done = true
        }
        if (done) return false
        return R() < 0.4 // spores drift down lazily
      }
      case MWAX: {
        let heat = false
        this.neighbors4(x, y, (nx, ny) => { if (isHot(this.at(nx, ny))) heat = true })
        if (!heat && R() < 0.006) {
          this.set(x, y, WAX, 0)
          this.emit({ t: 'disc', key: 'congeal', x, y })
          return false
        }
        return true
      }
      case SOAP: {
        let scrubbed = false
        this.neighbors4(x, y, (nx, ny) => {
          if (scrubbed) return
          if (this.at(nx, ny) === OIL && R() < 0.2) {
            this.set(nx, ny, EMPTY, 0)
            this.aux[i] = this.aux[i]! + 1
            if (this.aux[i]! >= 6) { this.set(x, y, EMPTY, 0); scrubbed = true }
          }
        })
        return !scrubbed
      }
      case SAND: {
        const wet = this.aux[i] === 1
        if (!wet) {
          let wetted = false
          this.neighbors4(x, y, (nx, ny) => {
            if (!wetted && this.at(nx, ny) === WATER && R() < 0.25) {
              this.aux[i] = 1
              this.emit({ t: 'disc', key: 'wetting', x, y })
              wetted = true
            }
          })
        } else {
          let dry = false
          this.neighbors4(x, y, (nx, ny) => { if (isHot(this.at(nx, ny))) dry = true })
          if (dry && R() < 0.3) this.aux[i] = 0
        }
        return true
      }
      case OIL: {
        if (this.at(x, y + 1) === WATER && R() < 0.02) {
          this.emit({ t: 'disc', key: 'immis', x, y })
        }
        return true
      }
      case REBIS: {
        // Coagulation: 3-body — needs a sulphur neighbor AND a hot neighbor.
        let sx = -1, sy = -1, hot = false
        this.neighbors4(x, y, (nx, ny) => {
          const t = this.at(nx, ny)
          if (t === SULPHUR) { sx = nx; sy = ny }
          if (isHot(t)) hot = true
        })
        if (sx >= 0 && hot && R() < 0.15) {
          this.set(sx, sy, EMPTY, 0)
          this.set(x, y, GOLD, 0)
          this.emit({ t: 'disc', key: 'coagulate', x, y })
          return false
        }
        return true
      }
      default:
        return true
    }
  }

  /* ─────────────────────── step ─────────────────────── */

  step(): void {
    this.frame++
    this.events.length = 0
    this.moved.powder = 0
    this.moved.liquid = 0
    this.moved.gas = 0
    const f8 = this.frame & 255
    const { w, h, grid, stamp } = this
    for (let y = h - 1; y >= 0; y--) {
      const ltr = (this.frame + y) & 1
      for (let xi = 0; xi < w; xi++) {
        const x = ltr ? xi : w - 1 - xi
        const i = y * w + x
        if (stamp[i] === f8) continue
        const e = grid[i]!
        if (e === EMPTY || e === STONE || e === OBSID || e === GLASS || e === BRICK || e === WAX || e === ICE) continue
        stamp[i] = f8
        if (!this.applyReactions(x, y, i, e)) continue
        if (!this.behave(x, y, i, e)) continue
        const cls = MOVE[e]!
        if (cls === 1) this.powderMove(x, y, e)
        else if (cls === 2) this.liquidMove(x, y, e)
        else if (cls === 3) this.gasMove(x, y)
      }
    }
  }
}
