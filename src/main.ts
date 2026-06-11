// Entry point: wires the pure sim core to renderer, audio, and bench chrome.

import './style.css'
import { AudioEngine } from './audio/engine'
import { loadJSON, saveJSON, vibrate } from './platform/storage'
import { Renderer } from './render/renderer'
import {
  CLAY, EMPTY, OIL, SAND, STONE, WATER, ELEMENTS, SAND as DEFAULT_EL,
} from './sim/elements'
import { DISCOVERIES, DISC_INDEX } from './sim/rules'
import { collectStats } from './sim/stats'
import { World } from './sim/world'
import { Codex, roman } from './ui/codex'
import { toast } from './ui/fx'
import { Shelf } from './ui/shelf'
import { Trials } from './ui/trials'

/* ─────────────────────── world sizing ─────────────────────── */

const stage = document.getElementById('stage')!
const cv = document.getElementById('cv') as HTMLCanvasElement

const coarse = matchMedia('(pointer: coarse)').matches
const TARGET_CELLS = coarse ? 32000 : 72000
const asp = Math.max(0.45, Math.min(2.4, (stage.clientWidth || 16) / (stage.clientHeight || 10)))
const W = Math.max(80, Math.min(420, Math.round(Math.sqrt(TARGET_CELLS * asp))))
const H = Math.max(80, Math.min(420, Math.round(W / asp)))

const world = new World(W, H, (Math.random() * 0xffffffff) >>> 0)
const renderer = new Renderer(cv, world)
const audio = new AudioEngine()

/* ─────────────────────── seed scene ─────────────────────── */

function seed(): void {
  const fx = (p: number): number => Math.round(W * p)
  const fy = (p: number): number => Math.round(H * p)
  const R = world.rng
  const shelfLine = (x1: number, x2: number, y: number): void => { for (let x = x1; x <= x2; x++) world.set(x, y, STONE) }
  const bx1 = fx(0.09), bx2 = fx(0.4), by = fy(0.715)
  shelfLine(bx1, bx2, by)
  for (let y = fy(0.657); y < by; y++) { world.set(bx1, y, STONE); world.set(bx2, y, STONE) }
  for (let x = bx1 + 2; x < bx2 - 2; x++) for (let y = fy(0.678); y < by; y++) if (R() < 0.9) world.set(x, y, WATER)
  const sy = fy(0.657)
  shelfLine(fx(0.58), fx(0.915), sy)
  for (let x = fx(0.647); x < fx(0.768); x++) for (let y = fy(0.571); y < sy; y++) if (R() < (sy - y) / (sy - fy(0.571) + 1)) world.set(x, y, SAND)
  for (let x = fx(0.777); x < fx(0.906); x++) for (let y = fy(0.6); y < sy; y++) if (R() < (sy - y) / (sy - fy(0.6) + 1)) world.set(x, y, CLAY)
  const oy = fy(0.443)
  shelfLine(fx(0.26), fx(0.49), oy)
  // end walls keep the oil cupped on its shelf (no self-discoveries at boot)
  for (let y = fy(0.39); y < oy; y++) { world.set(fx(0.26), y, STONE); world.set(fx(0.49), y, STONE) }
  for (let x = fx(0.295); x < fx(0.455); x++) for (let y = fy(0.4); y < oy; y++) if (R() < 0.85) world.set(x, y, OIL)
}
seed()

/* ─────────────────────── persistence ─────────────────────── */

const CODEX_KEY = 'fsa.v1.codex'
const SETTINGS_KEY = 'fsa.v1.settings'

interface Settings { muted: boolean; volume: number }
const settings = loadJSON<Settings>(SETTINGS_KEY, { muted: false, volume: 0.8 })
const saveSettings = (): void => saveJSON(SETTINGS_KEY, settings)

const codex = new Codex(loadJSON<string[]>(CODEX_KEY, []))

/* ─────────────────────── trials ─────────────────────── */

let paused = false

const trials = new Trials(world, {
  onStart() {
    shelf.setToolkit(trials.current?.toolkit ?? null)
    titleCard.style.opacity = '0'
    paused = false
    audio.tick()
  },
  onComplete() {
    renderer.flash = 1
    audio.trialChord()
  },
  onAllComplete() {
    audio.fanfare()
    renderer.flash = 1
  },
  onExit() {
    shelf.setToolkit(null)
    world.clear()
    seed()
  },
})

/* ─────────────────────── discoveries ─────────────────────── */

function panOf(x: number): number { return Math.max(-1, Math.min(1, (x / W) * 2 - 1)) }

function handleDisc(key: string, x: number, y: number): void {
  trials.handleReaction(key, x, y)
  const i = DISC_INDEX[key]
  if (i === undefined) return
  if (!codex.inscribe(key)) { audio.blip(i, panOf(x)); return }
  saveJSON(CODEX_KEY, [...codex.found])
  const d = DISCOVERIES[i]!
  toast(`<div class="name-line"><span class="star">✦</span> ${roman(i)}. ${d.name}</div><small>${d.recipe}</small>`)
  audio.chime(i, panOf(x))
  renderer.flash = 1
  vibrate([18, 40, 18])
  if (codex.complete) {
    setTimeout(() => {
      toast('<div class="name-line"><span class="star">✦✦✦</span> The Codex is Complete</div><small>forty reactions inscribed</small>')
      audio.fanfare()
      renderer.flash = 1
    }, 900)
  }
}

/* ─────────────────────── shelf + painting ─────────────────────── */

const titleCard = document.getElementById('title-card')!
const shelf = new Shelf(DEFAULT_EL, () => audio.tick())

let brush = 4
const pointers = new Map<number, [number, number]>()
const pointerEl = new Map<number, number>()

function toCell(ev: PointerEvent): [number, number] {
  const r = cv.getBoundingClientRect()
  return [
    Math.floor(((ev.clientX - r.left) / r.width) * W),
    Math.floor(((ev.clientY - r.top) / r.height) * H),
  ]
}

function stampBrush(cx: number, cy: number, el: number): void {
  if (el === EMPTY) trials.markErase()
  world.paint(cx, cy, brush, el, ELEMENTS[el]?.sparse ?? false)
}

function paintLine(pid: number, p2: [number, number]): void {
  const el = pointerEl.get(pid) ?? shelf.current
  const last = pointers.get(pid)
  if (!last) { stampBrush(p2[0], p2[1], el); pointers.set(pid, p2); return }
  const [x1, y1] = last
  const [x2, y2] = p2
  const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1), 1)
  for (let s = 0; s <= steps; s++) {
    stampBrush(Math.round(x1 + ((x2 - x1) * s) / steps), Math.round(y1 + ((y2 - y1) * s) / steps), el)
  }
  pointers.set(pid, p2)
}

const ring = document.getElementById('ring')!
function moveRing(ev: PointerEvent): void {
  const r = cv.getBoundingClientRect()
  const sr = stage.getBoundingClientRect()
  const d = brush * 2 * (r.width / W)
  ring.style.width = ring.style.height = d + 'px'
  ring.style.left = ev.clientX - sr.left - d / 2 + 'px'
  ring.style.top = ev.clientY - sr.top - d / 2 + 'px'
  const over = ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom
  ring.style.display = over ? 'block' : 'none'
}

cv.addEventListener('pointerdown', ev => {
  ev.preventDefault()
  void audio.init().then(() => { audio.setMuted(settings.muted); audio.setVolume(settings.volume) })
  titleCard.style.opacity = '0'
  pointers.delete(ev.pointerId)
  pointerEl.set(ev.pointerId, ev.button === 2 ? EMPTY : shelf.current)
  paintLine(ev.pointerId, toCell(ev))
  cv.setPointerCapture(ev.pointerId)
  moveRing(ev)
})
cv.addEventListener('pointermove', ev => {
  if (pointers.has(ev.pointerId) || ev.buttons) {
    if (cv.hasPointerCapture(ev.pointerId)) paintLine(ev.pointerId, toCell(ev))
  }
  moveRing(ev)
})
function release(ev: PointerEvent): void {
  pointers.delete(ev.pointerId)
  pointerEl.delete(ev.pointerId)
  if (ev.pointerType !== 'mouse') ring.style.display = 'none'
}
cv.addEventListener('pointerup', release)
cv.addEventListener('pointercancel', release)
cv.addEventListener('pointerleave', () => { ring.style.display = 'none' })
cv.addEventListener('contextmenu', ev => ev.preventDefault())

/* ─────────────────────── controls ─────────────────────── */

const PRESETS = [2, 4, 7, 11]
let presetIdx = 1
const brushDot = document.getElementById('brush-dot')!
function setBrush(v: number): void {
  brush = Math.max(1, Math.min(14, v))
  const d = 6 + brush * 2
  brushDot.style.width = brushDot.style.height = d + 'px'
}
document.getElementById('brush-btn')!.addEventListener('click', () => {
  presetIdx = (presetIdx + 1) % PRESETS.length
  setBrush(PRESETS[presetIdx]!)
  audio.tick()
})
setBrush(4)
cv.addEventListener('wheel', ev => { ev.preventDefault(); setBrush(brush + (ev.deltaY < 0 ? 1 : -1)) }, { passive: false })

const ICON_PAUSE = '<path d="M7 5h3.4v14H7zM13.6 5H17v14h-3.4z"/>'
const ICON_PLAY = '<path d="M8 5l11 7-11 7V5z"/>'
function togglePause(): void {
  paused = !paused
  const b = document.getElementById('pause-btn')!
  b.classList.toggle('active', paused)
  document.getElementById('pause-ic')!.innerHTML = paused ? ICON_PLAY : ICON_PAUSE
  b.setAttribute('aria-label', paused ? 'Resume simulation' : 'Pause simulation')
}
document.getElementById('pause-btn')!.addEventListener('click', togglePause)

function clearAll(): void {
  if (trials.active) { trials.restart(); return }
  world.clear()
  seed()
}
document.getElementById('clear-btn')!.addEventListener('click', clearAll)

function applyMuteUI(): void {
  const wave = document.getElementById('snd-wave')!
  wave.style.opacity = settings.muted ? '0.18' : '1'
  document.getElementById('mute-btn')!.classList.toggle('active', settings.muted)
}
function toggleMute(): void {
  settings.muted = !settings.muted
  audio.setMuted(settings.muted)
  saveSettings()
  applyMuteUI()
}
document.getElementById('mute-btn')!.addEventListener('click', toggleMute)
applyMuteUI()

document.getElementById('codex-btn')!.addEventListener('click', () => codex.toggle())
const narrowMQ = matchMedia('(max-width: 719px)')
stage.addEventListener('pointerdown', () => { if (narrowMQ.matches) codex.close() })
codex.openIfWide()

document.getElementById('trials-btn')!.addEventListener('click', () => trials.toggleDialog())

const helpDlg = document.getElementById('help-dlg') as HTMLDialogElement
document.getElementById('help-btn')!.addEventListener('click', () => helpDlg.showModal())
document.getElementById('help-close')!.addEventListener('click', () => helpDlg.close())
helpDlg.addEventListener('click', ev => { if (ev.target === helpDlg) helpDlg.close() })
const volSlider = document.getElementById('vol-slider') as HTMLInputElement
volSlider.value = String(Math.round(settings.volume * 100))
volSlider.addEventListener('input', () => {
  settings.volume = Number(volSlider.value) / 100
  audio.setVolume(settings.volume)
  saveSettings()
})

addEventListener('keydown', ev => {
  if (ev.repeat) return
  const tag = (ev.target as HTMLElement | null)?.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA') return
  const k = ev.key.toLowerCase()
  const byKey = shelf.byKey(k)
  if (byKey !== undefined) { shelf.select(byKey); audio.tick(); return }
  if (k === ' ') { ev.preventDefault(); togglePause() }
  else if (k === 'arrowright') { ev.preventDefault(); shelf.cycle(1) }
  else if (k === 'arrowleft') { ev.preventDefault(); shelf.cycle(-1) }
  else if (k === 'c') clearAll()
  else if (k === 'm') toggleMute()
  else if (k === 'x') codex.toggle()
  else if (k === 't') trials.toggleDialog()
  else if (k === '[') setBrush(brush - 1)
  else if (k === ']') setBrush(brush + 1)
  else if (k === '?') { if (helpDlg.open) helpDlg.close(); else helpDlg.showModal() }
})

/* ─────────────────────── sizing ─────────────────────── */

const app = document.getElementById('app')!
function resize(): void {
  const cw = stage.clientWidth
  const ch = stage.clientHeight
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  renderer.resize(cw, ch, dpr)
  trials.placeZone()
}
function fitApp(): void {
  const h = window.visualViewport ? window.visualViewport.height : window.innerHeight
  app.style.height = h + 'px'
  resize()
}
if (window.visualViewport) window.visualViewport.addEventListener('resize', fitApp)
addEventListener('resize', fitApp)
addEventListener('orientationchange', () => setTimeout(fitApp, 80))
// the stage also resizes when the codex folio or cabinet open/close in-flow
new ResizeObserver(() => resize()).observe(stage)
fitApp()

/* ─────────────────────── main loop ─────────────────────── */

const STEP = 1000 / 60
const AUDIO_EVERY = 6 // ~10 Hz census
let acc = 0
let last = performance.now()
let frameCount = 0

function loop(now: number): void {
  acc = Math.min(acc + (now - last), STEP * 3)
  last = now
  if (!paused) {
    while (acc >= STEP) {
      world.step()
      for (const ev of world.events) {
        if (ev.t === 'disc') handleDisc(ev.key, ev.x, ev.y)
        else if (ev.t === 'boom') { renderer.trauma = 1; vibrate(30); audio.boom(panOf(ev.x)) }
        else if (ev.t === 'combust') { renderer.trauma = Math.max(renderer.trauma, 0.45); audio.combust(panOf(ev.x)) }
      }
      acc -= STEP
    }
  } else acc = 0
  if (++frameCount % AUDIO_EVERY === 0 && audio.ready) audio.update(collectStats(world))
  renderer.render()
  requestAnimationFrame(loop)
}
requestAnimationFrame(loop)
