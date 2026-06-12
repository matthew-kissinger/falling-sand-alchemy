// Codex folio: grouped parchment list, ink-bleed inscription on discovery.

import { CODEX_GROUPS, DISCOVERIES, DISC_INDEX } from '../sim/rules'

const ROMAN = [
  'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
  'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX',
  'XXI', 'XXII', 'XXIII', 'XXIV', 'XXV', 'XXVI', 'XXVII', 'XXVIII', 'XXIX', 'XXX',
  'XXXI', 'XXXII', 'XXXIII', 'XXXIV', 'XXXV', 'XXXVI', 'XXXVII', 'XXXVIII', 'XXXIX', 'XL',
]

export const roman = (i: number): string => ROMAN[i] ?? String(i + 1)

export class Codex {
  readonly found = new Set<string>()
  private readonly panel = document.getElementById('codex') as HTMLElement
  private readonly list = document.getElementById('codex-list') as HTMLElement

  constructor(initial: string[]) {
    for (const k of initial) if (DISC_INDEX[k] !== undefined) this.found.add(k)
    this.build()
    this.updateCounts()
  }

  private build(): void {
    this.list.innerHTML = ''
    for (const group of CODEX_GROUPS) {
      const head = document.createElement('div')
      head.className = 'cgroup'
      head.textContent = group
      this.list.appendChild(head)
      DISCOVERIES.forEach((d, i) => {
        if (d.group !== group) return
        const div = document.createElement('div')
        div.className = 'entry'
        div.id = 'entry-' + i
        const known = this.found.has(d.key)
        div.innerHTML = `<div class="num">${roman(i)}</div><div class="name">${known ? d.name : '— — —'}</div><div class="sub">${known ? d.recipe + ' - ' + d.hint : d.hint}</div>`
        if (known) div.classList.add('found')
        this.list.appendChild(div)
      })
    }
  }

  /** Returns true if this was a new inscription. */
  inscribe(key: string): boolean {
    if (this.found.has(key)) return false
    const i = DISC_INDEX[key]
    if (i === undefined) return false
    this.found.add(key)
    const d = DISCOVERIES[i]!
    const el = document.getElementById('entry-' + i)
    if (el) {
      el.classList.add('found', 'fresh')
      const name = el.querySelector('.name')
      const sub = el.querySelector('.sub')
      if (name) name.textContent = d.name
      if (sub) sub.textContent = d.recipe + ' - ' + d.hint
      el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
    this.updateCounts()
    return true
  }

  get count(): number { return this.found.size }
  get total(): number { return DISCOVERIES.length }
  get complete(): boolean { return this.found.size === DISCOVERIES.length }

  private updateCounts(): void {
    const n = this.found.size
    const total = DISCOVERIES.length
    const label = document.getElementById('progress-label')
    if (label) label.innerHTML = `<b>${n}</b>/${total}`
    const count = document.getElementById('codex-count')
    if (count) count.textContent = `${n} of ${total} inscribed`
    const badge = document.getElementById('codex-badge')
    if (badge) badge.textContent = `${n}/${total}`
    const ring = document.getElementById('seal-ring')
    if (ring) ring.style.strokeDashoffset = (62.83 * (1 - n / total)).toFixed(2)
  }

  toggle(): void { this.panel.classList.toggle('open') }
  close(): void { this.panel.classList.remove('open') }
  get isOpen(): boolean { return this.panel.classList.contains('open') }
  openIfWide(): void { if (innerWidth >= 1100) this.panel.classList.add('open') }
}
