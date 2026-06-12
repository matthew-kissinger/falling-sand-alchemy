// Trials: curated scenario puzzles — a secondary mode, never a gate.
// Every trial is selectable from the start; completing one records an
// achievement (first clear, best time, untouched = no erasing).

import {
  ACID, AQUA, CLAY, EMPTY, FIRE, IRON, LAVA, MERCURY, OIL, PLANT, SALT, SAND,
  SPORE, STONE, SULPHUR, WATER,
} from '../sim/elements'
import { DISCOVERIES, DISC_INDEX } from '../sim/rules'
import type { World } from '../sim/world'
import { loadJSON, saveJSON, vibrate } from '../platform/storage'
import { roman } from './codex'
import { celebrate, toast } from './fx'

export interface TrialDef {
  key: string
  /** Discovery that must fire inside the seal. */
  need: string
  /** Reagents on the bench for this scenario (erase is always available). */
  toolkit: number[]
  hint: [string, string]
  /** Seal zone as fractions [x1, y1, x2, y2]. */
  zone: [number, number, number, number]
  build(w: World): void
}

type Frac = (p: number) => number

function helpers(w: World): { fx: Frac; fy: Frac; rect: (x1: number, y1: number, x2: number, y2: number, e: number, a?: number, p?: number) => void; box: (x1: number, y1: number, x2: number, y2: number) => void } {
  const fx: Frac = p => Math.round(w.w * p)
  const fy: Frac = p => Math.round(w.h * p)
  const rect = (x1: number, y1: number, x2: number, y2: number, e: number, a = 0, p = 1): void => {
    for (let x = fx(x1); x <= fx(x2); x++)
      for (let y = fy(y1); y <= fy(y2); y++)
        if (w.rng() <= p) w.set(x, y, e, a)
  }
  const box = (x1: number, y1: number, x2: number, y2: number): void => {
    for (let x = fx(x1); x <= fx(x2); x++) w.set(x, fy(y2), STONE)
    for (let y = fy(y1); y <= fy(y2); y++) { w.set(fx(x1), y, STONE); w.set(fx(x2), y, STONE) }
  }
  return { fx, fy, rect, box }
}

export const TRIALS: TrialDef[] = [
  {
    key: 'quench', need: 'quench', toolkit: [WATER],
    hint: ['the lava thirsts', 'pour water straight onto the lava pool, inside the seal'],
    zone: [0.36, 0.6, 0.64, 0.8],
    build(w) { const { rect, box } = helpers(w); box(0.3, 0.55, 0.7, 0.82); rect(0.32, 0.72, 0.68, 0.8, LAVA) },
  },
  {
    key: 'ignite', need: 'ignite', toolkit: [FIRE],
    hint: ['oil carries flame far from the spark', 'drop fire anywhere on the oil channel - the burn travels into the seal on its own'],
    zone: [0.44, 0.7, 0.62, 0.86],
    build(w) { const { rect } = helpers(w); rect(0.06, 0.86, 0.94, 0.87, STONE); rect(0.08, 0.8, 0.58, 0.85, OIL) },
  },
  {
    key: 'evap', need: 'evap', toolkit: [FIRE],
    hint: ['heat the pool', 'drop fire onto the water’s surface inside the seal'],
    zone: [0.36, 0.62, 0.64, 0.82],
    build(w) { const { rect, box } = helpers(w); box(0.3, 0.58, 0.7, 0.84); rect(0.32, 0.72, 0.68, 0.82, WATER) },
  },
  {
    key: 'wildfire', need: 'wildfire', toolkit: [SPORE, WATER, FIRE],
    hint: ['grow fuel where the seal waits', 'sprout plants on the high shelf with spores and water, then set them alight'],
    zone: [0.4, 0.32, 0.6, 0.5],
    build(w) { const { rect } = helpers(w); rect(0.38, 0.52, 0.62, 0.54, STONE); rect(0.06, 0.88, 0.94, 0.89, STONE) },
  },
  {
    key: 'germ', need: 'germ', toolkit: [SPORE],
    hint: ['seeds want the pool', 'drop spores into the water'],
    zone: [0.34, 0.6, 0.66, 0.8],
    build(w) { const { rect, box } = helpers(w); box(0.28, 0.55, 0.72, 0.82); rect(0.3, 0.68, 0.7, 0.8, WATER) },
  },
  {
    key: 'cultivate', need: 'cultivate', toolkit: [CLAY, WATER, SPORE],
    hint: ['the old triad: soil, water, seed', 'lay clay in the basin, pour water over it, then drop spores onto the wet earth'],
    zone: [0.34, 0.55, 0.66, 0.8],
    build(w) { const { box } = helpers(w); box(0.28, 0.5, 0.72, 0.82) },
  },
  {
    key: 'neutral', need: 'neutral', toolkit: [ACID],
    hint: ['venom against fire’s blood', 'pour acid onto the lava pool'],
    zone: [0.36, 0.62, 0.64, 0.82],
    build(w) { const { rect, box } = helpers(w); box(0.3, 0.58, 0.7, 0.84); rect(0.32, 0.74, 0.68, 0.82, LAVA) },
  },
  {
    key: 'distill', need: 'distill', toolkit: [SALT],
    hint: ['salt the pool - bitter water sinks below sweet', 'make brine with salt, then erase the stone plug under the pool. the heavy brine drains first, onto the lava'],
    zone: [0.38, 0.74, 0.62, 0.87],
    build(w) {
      const { fx, fy, rect, box } = helpers(w)
      box(0.32, 0.5, 0.68, 0.72)
      rect(0.34, 0.62, 0.66, 0.71, WATER)
      for (let y = fy(0.72); y <= fy(0.87); y++) { w.set(fx(0.4), y, STONE); w.set(fx(0.6), y, STONE) }
      for (let x = fx(0.4); x <= fx(0.6); x++) w.set(x, fy(0.87), STONE)
      rect(0.42, 0.81, 0.58, 0.86, LAVA)
    },
  },
  {
    key: 'potash', need: 'potash', toolkit: [FIRE],
    hint: ['burn from below - ash must reach the pool', 'light the grove at its base. fire climbs, and ash rains through the gap into the water'],
    zone: [0.34, 0.66, 0.66, 0.84],
    build(w) {
      const { rect, box } = helpers(w)
      box(0.28, 0.6, 0.72, 0.86)
      rect(0.3, 0.76, 0.7, 0.84, WATER)
      rect(0.32, 0.4, 0.43, 0.42, STONE)
      rect(0.57, 0.4, 0.68, 0.42, STONE)
      rect(0.36, 0.3, 0.64, 0.39, PLANT, 3, 0.8)
    },
  },
  {
    key: 'marsh', need: 'marsh', toolkit: [CLAY, WATER, PLANT, SPORE, FIRE],
    hint: ['make a marsh, then wait for it to breathe', 'mix clay and water into mud, root plants in it, let them rot into rising gas - and meet it with fire in the seal'],
    zone: [0.32, 0.26, 0.68, 0.48],
    build(w) { const { box } = helpers(w); box(0.24, 0.55, 0.76, 0.88) },
  },
  {
    key: 'magnum', need: 'coagulate', toolkit: [IRON, FIRE, AQUA, MERCURY, SULPHUR],
    hint: ['the Great Work: calcine, dissolve, conjoin, coagulate', 'burn iron to red calx · drown the calx in aqua vitae · feed the green water quicksilver · then sulphur, and flame - but never let sulphur touch the flame'],
    zone: [0.32, 0.5, 0.68, 0.83],
    build(w) { const { box } = helpers(w); box(0.3, 0.45, 0.7, 0.85) },
  },
]

export interface TrialRecord {
  done: boolean
  bestMs: number | null
  noErase: boolean
}

const SAVE_KEY = 'fsa.v1.trials'

export interface TrialHooks {
  onStart(t: TrialDef): void
  onComplete(t: TrialDef): void
  onAllComplete(): void
  onExit(): void
}

export class Trials {
  active = false
  private idx = 0
  private done = false
  private hintLvl = 0
  private zoneCells: [number, number, number, number] = [0, 0, 0, 0]
  private startedAt = 0
  private erased = false
  private records: Record<string, TrialRecord>
  private readonly world: World
  private readonly hooks: TrialHooks
  private readonly dlg = document.getElementById('trials-dlg') as HTMLDialogElement
  private readonly list = document.getElementById('trials-list') as HTMLElement
  private readonly hud = document.getElementById('trial-hud') as HTMLElement
  private readonly zone = document.getElementById('lockzone') as HTMLElement

  constructor(world: World, hooks: TrialHooks) {
    this.world = world
    this.hooks = hooks
    this.records = loadJSON<Record<string, TrialRecord>>(SAVE_KEY, {})
    this.updateBadge()
    document.getElementById('trials-exit')!.addEventListener('click', () => { this.dlg.close(); if (this.active) this.exit() })
    this.dlg.addEventListener('click', ev => { if (ev.target === this.dlg) this.dlg.close() })
    this.hud.addEventListener('click', ev => {
      const t = ev.target as HTMLElement
      if (t.id === 'hint-btn') { this.hintLvl++; this.renderHud() }
    })
  }

  get current(): TrialDef | null { return this.active ? TRIALS[this.idx]! : null }
  get completedCount(): number { return TRIALS.filter(t => this.records[t.key]?.done).length }

  openDialog(): void {
    this.renderList()
    this.dlg.showModal()
  }

  toggleDialog(): void {
    if (this.dlg.open) this.dlg.close()
    else this.openDialog()
  }

  private renderList(): void {
    this.list.innerHTML = ''
    TRIALS.forEach((t, i) => {
      const rec = this.records[t.key]
      const d = DISCOVERIES[DISC_INDEX[t.need]!]!
      const row = document.createElement('button')
      row.className = 'trow'
      if (rec?.done) {
        const time = rec.bestMs !== null ? `${(rec.bestMs / 1000).toFixed(1)}s` : ''
        const clean = rec.noErase ? '<small>untouched</small>' : ''
        row.innerHTML = `<span class="tn">${roman(i)}</span><span class="tt done">${d.name}</span><span class="tm">✦ ${time}${clean}</span>`
      } else {
        row.innerHTML = `<span class="tn">${roman(i)}</span><span class="tt">${d.hint}</span><span class="tm">▸</span>`
      }
      row.addEventListener('click', () => { this.dlg.close(); this.start(i) })
      this.list.appendChild(row)
    })
  }

  start(i: number): void {
    this.active = true
    this.idx = i
    this.done = false
    this.hintLvl = 0
    this.erased = false
    this.startedAt = performance.now()
    const t = TRIALS[i]!
    const w = this.world
    this.zoneCells = [
      Math.round(w.w * t.zone[0]), Math.round(w.h * t.zone[1]),
      Math.round(w.w * t.zone[2]), Math.round(w.h * t.zone[3]),
    ]
    w.clear()
    t.build(w)
    this.hud.hidden = false
    this.renderHud()
    this.placeZone()
    this.hooks.onStart(t)
  }

  restart(): void { if (this.active) this.start(this.idx) }

  exit(): void {
    this.active = false
    this.hud.hidden = true
    this.zone.hidden = true
    this.hooks.onExit()
  }

  markErase(): void { if (this.active) this.erased = true }

  /** Feed every discovery event here; completes the trial when matched in-zone. */
  handleReaction(key: string, x: number, y: number): void {
    if (!this.active || this.done) return
    const t = TRIALS[this.idx]!
    if (key !== t.need) return
    const [x1, y1, x2, y2] = this.zoneCells
    if (x < x1 || x > x2 || y < y1 || y > y2) return
    this.complete()
  }

  private complete(): void {
    this.done = true
    const t = TRIALS[this.idx]!
    const ms = performance.now() - this.startedAt
    const prev = this.records[t.key]
    this.records[t.key] = {
      done: true,
      bestMs: prev?.bestMs != null ? Math.min(prev.bestMs, ms) : ms,
      noErase: (prev?.noErase ?? false) || !this.erased,
    }
    saveJSON(SAVE_KEY, this.records)
    this.updateBadge()
    celebrate(`TRIAL ${roman(this.idx)} COMPLETE`)
    vibrate([20, 50, 20, 50, 40])
    this.hooks.onComplete(t)
    const allDone = this.completedCount === TRIALS.length
    setTimeout(() => {
      if (allDone && this.idx === TRIALS.length - 1) {
        celebrate('MAGNUM OPUS')
        toast('<div class="name-line"><span class="star">✦✦✦</span> ALL TRIALS COMPLETE</div><small>the laboratory is yours</small>')
        this.hooks.onAllComplete()
        setTimeout(() => this.exit(), 2800)
      } else {
        // return to the notebook so the player picks what to learn next
        this.exit()
        this.openDialog()
      }
    }, 2500)
  }

  private renderHud(): void {
    const t = TRIALS[this.idx]!
    const d = DISCOVERIES[DISC_INDEX[t.need]!]!
    let h = `<b>TRIAL ${roman(this.idx)}</b><span>${d.hint}</span>`
    if (this.hintLvl > 0) h += `<span class="hint-text">${t.hint[Math.min(this.hintLvl, 2) - 1]}</span>`
    if (this.hintLvl < 2) h += `<button id="hint-btn">${this.hintLvl === 0 ? 'HINT' : 'ANOTHER HINT'}</button>`
    this.hud.innerHTML = h
  }

  placeZone(): void {
    if (!this.active) { this.zone.hidden = true; return }
    const stage = document.getElementById('stage')!
    const sx = stage.clientWidth / this.world.w
    const sy = stage.clientHeight / this.world.h
    const [x1, y1, x2, y2] = this.zoneCells
    this.zone.hidden = false
    this.zone.style.left = x1 * sx + 'px'
    this.zone.style.top = y1 * sy + 'px'
    this.zone.style.width = (x2 - x1) * sx + 'px'
    this.zone.style.height = (y2 - y1) * sy + 'px'
    const zl = this.zone.querySelector('.zl')
    if (zl) zl.textContent = roman(DISC_INDEX[TRIALS[this.idx]!.need]!)
  }

  private updateBadge(): void {
    const badge = document.getElementById('trials-badge')
    if (badge) badge.textContent = `${this.completedCount}/${TRIALS.length}`
  }
}
