// Video Experiment Bench (dev-only page, served at /demos.html via `npm run dev`).
// Each card runs the REAL sim core with a scripted setup + timed actions, so the
// previews are exactly what the game engine produces - nothing is mocked.
// The scenes themselves live in scenes.ts, shared with the headless recorder.

import { World } from '../sim/world'
import { DISCOVERIES } from '../sim/rules'
import { H, SCENES, W, colorize, type Scene } from './scenes'

interface Run {
  scene: Scene
  world: World
  frame: number
  seed: number
  visible: boolean
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  img: ImageData
  captionEl: HTMLElement
  discEl: HTMLElement
  seen: Set<string>
  /** First sim frame each discovery fired, for event-synced captions. */
  evFrame: Map<string, number>
}

const DISC_NAME: Record<string, string> = {}
for (const d of DISCOVERIES) DISC_NAME[d.key] = d.name

function makeRun(scene: Scene, card: HTMLElement, seed: number): Run {
  const canvas = card.querySelector('canvas')!
  const run: Run = {
    scene,
    world: new World(W, H, seed),
    frame: 0,
    seed,
    visible: false,
    canvas,
    ctx: canvas.getContext('2d')!,
    img: new ImageData(W, H),
    captionEl: card.querySelector('.caption')!,
    discEl: card.querySelector('.discs')!,
    seen: new Set(),
    evFrame: new Map(),
  }
  scene.setup(run.world)
  return run
}

function reset(run: Run): void {
  run.seed = (run.seed + 0x9e37) >>> 0
  run.world = new World(W, H, run.seed)
  run.frame = 0
  run.seen.clear()
  run.evFrame.clear()
  run.discEl.textContent = ''
  run.scene.setup(run.world)
}

function render(run: Run): void {
  colorize(run.world, run.img.data, 4)
  run.ctx.putImageData(run.img, 0, 0)
}

function stepRun(run: Run): void {
  const { scene, world } = run
  if (run.frame >= scene.duration) { reset(run); return }
  scene.tick(world, run.frame)
  world.step()
  run.frame++
  // surface real discovery events fired by the engine
  for (const ev of world.events) {
    if (ev.t === 'disc' && !run.evFrame.has(ev.key)) run.evFrame.set(ev.key, run.frame)
    if (ev.t === 'disc' && !run.seen.has(ev.key) && DISC_NAME[ev.key]) {
      run.seen.add(ev.key)
      const names = [...run.seen].slice(-4).map((k) => DISC_NAME[k])
      run.discEl.textContent = 'inscribed: ' + names.join(' · ')
    }
  }
  // captions: fixed-frame or event-synced, latest applicable wins
  let cap = ''
  let best = -1
  for (const c of scene.captions) {
    let show: number | null = c.at ?? null
    if (c.on !== undefined) {
      const ev = run.evFrame.get(c.on)
      if (ev === undefined) continue
      show = ev + (c.delay ?? 24)
    }
    if (show !== null && run.frame >= show && show >= best) { best = show; cap = c.text }
  }
  run.captionEl.textContent = cap
}

/* ───────────────────────── page build ───────────────────────── */

const cardsEl = document.getElementById('cards')!
const runs: Run[] = []

SCENES.forEach((scene, i) => {
  const card = document.createElement('section')
  card.className = 'card'
  card.innerHTML = `
    <h2><span class="num">${String(i + 1).padStart(2, '0')}</span>${scene.title}</h2>
    <p class="blurb">${scene.blurb}</p>
    <div class="stage">
      <canvas width="${W}" height="${H}"></canvas>
      <div class="caption"></div>
    </div>
    <div class="toolbar">
      <button type="button">restart</button>
      <span class="discs"></span>
    </div>
    <details>
      <summary>How to film it in the game</summary>
      <ol>${scene.film.map((s) => `<li>${s}</li>`).join('')}</ol>
    </details>
  `
  cardsEl.appendChild(card)
  const run = makeRun(scene, card, scene.seed ?? 0xc0ffee + i * 7333)
  card.querySelector('button')!.addEventListener('click', () => reset(run))
  runs.push(run)
})

const io = new IntersectionObserver(
  (entries) => {
    for (const en of entries) {
      const run = runs.find((r) => r.canvas === en.target.querySelector('canvas'))
      if (run) run.visible = en.isIntersecting
    }
  },
  { threshold: 0.15 },
)
for (const card of cardsEl.children) io.observe(card)

function loop(): void {
  for (const run of runs) {
    if (!run.visible) continue
    stepRun(run)
    render(run)
  }
  requestAnimationFrame(loop)
}
requestAnimationFrame(loop)
