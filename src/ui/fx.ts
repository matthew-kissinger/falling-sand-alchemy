// Small DOM effects: parchment-slip toasts, the gold stamp, spark burst.

const toasts = (): HTMLElement => document.getElementById('toasts')!
const stage = (): HTMLElement => document.getElementById('stage')!

export function toast(html: string): void {
  const t = document.createElement('div')
  t.className = 'toast'
  t.innerHTML = html
  toasts().appendChild(t)
  setTimeout(() => t.classList.add('out'), 2600)
  setTimeout(() => t.remove(), 3300)
}

export function celebrate(text: string): void {
  const st = document.getElementById('stamp')!
  st.textContent = text
  st.classList.remove('show')
  void st.offsetWidth
  st.classList.add('show')
  for (let i = 0; i < 18; i++) {
    const s = document.createElement('div')
    s.className = 'spark'
    const a = Math.random() * Math.PI * 2
    const d = 60 + Math.random() * 150
    s.style.setProperty('--dx', Math.cos(a) * d + 'px')
    s.style.setProperty('--dy', Math.sin(a) * d * 0.7 + 'px')
    s.style.animationDelay = Math.random() * 0.12 + 's'
    stage().appendChild(s)
    setTimeout(() => s.remove(), 1400)
  }
}
