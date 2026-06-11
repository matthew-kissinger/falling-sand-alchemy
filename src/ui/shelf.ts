// The reagent shelf: grouped phials along the bench edge.
// Sandbox shows everything, always — no gating. Trials swap in a toolkit.

import { ELEMENTS, EMPTY, SHELF_GROUPS } from '../sim/elements'

export class Shelf {
  current: number = EMPTY
  private readonly root = document.getElementById('shelf') as HTMLElement
  private readonly onSelect: (id: number) => void
  private toolkit: Set<number> | null = null

  constructor(initial: number, onSelect: (id: number) => void) {
    this.onSelect = onSelect
    this.build()
    this.select(initial)
    // mouse-wheel scrolls the strip when it overflows (narrow layouts)
    this.root.addEventListener('wheel', ev => {
      if (this.root.scrollWidth > this.root.clientWidth) {
        ev.preventDefault()
        this.root.scrollLeft += ev.deltaY + ev.deltaX
      }
    }, { passive: false })
  }

  private build(): void {
    this.root.innerHTML = ''
    for (const group of SHELF_GROUPS) {
      const g = document.createElement('div')
      g.className = 'sgroup'
      g.dataset.label = group.label
      for (const id of group.ids) {
        const d = ELEMENTS[id]!
        const c = d.color
        const b = document.createElement('button')
        b.className = 'el'
        b.dataset.id = String(id)
        b.setAttribute('aria-label', d.name)
        if (d.hotkey) {
          b.title = `${d.name} (${d.hotkey})`
          b.dataset.key = d.hotkey
        }
        // the erase phial stays empty — no draught
        const fill = id === EMPTY ? '' : `style="--c:rgb(${c[0]},${c[1]},${c[2]})"`
        b.innerHTML = `<span class="sw" ${fill}></span><span class="lb">${d.name}</span>`
        b.addEventListener('click', () => { this.select(id); this.onSelect(id) })
        g.appendChild(b)
      }
      this.root.appendChild(g)
    }
  }

  /** Step selection through shelf order (arrow keys on desktop). */
  cycle(dir: 1 | -1): void {
    const order = SHELF_GROUPS.flatMap(g => g.ids)
      .filter(id => this.toolkit === null || this.toolkit.has(id))
    if (order.length === 0) return
    const cur = order.indexOf(this.current)
    const next = order[(cur + dir + order.length) % order.length]!
    this.select(next)
    this.onSelect(next)
  }

  select(id: number): void {
    if (this.toolkit && !this.toolkit.has(id)) return
    this.current = id
    this.root.querySelectorAll('.el').forEach(el => {
      const sel = Number((el as HTMLElement).dataset.id) === id
      el.classList.toggle('sel', sel)
      if (sel) el.scrollIntoView({ inline: 'nearest', block: 'nearest', behavior: 'smooth' })
    })
  }

  /** Trial mode: only the scenario's toolkit is on the bench. null = sandbox (all). */
  setToolkit(ids: number[] | null): void {
    this.toolkit = ids ? new Set([...ids, EMPTY]) : null
    this.root.querySelectorAll('.el').forEach(el => {
      const id = Number((el as HTMLElement).dataset.id)
      el.classList.toggle('dis', this.toolkit !== null && !this.toolkit.has(id))
    })
    if (this.toolkit && !this.toolkit.has(this.current)) {
      const first = ids?.[0]
      if (first !== undefined) { this.select(first); this.onSelect(first) }
    }
  }

  byKey(key: string): number | undefined {
    const d = ELEMENTS.find(e => e?.hotkey === key && (this.toolkit === null || this.toolkit.has(e.id)))
    return d?.id
  }
}
