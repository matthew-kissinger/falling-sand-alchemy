// Headless showcase recorder. Runs each scene in the real sim core, pipes raw
// RGB frames into ffmpeg (4K60 master: 18x nearest-neighbor integer upscale to
// 3240x2160 padded to 3840x2160, subtle bloom + vignette, ASS captions with
// per-scene anchors and enforced minimum display, fade-through-black joins),
// and emits a timeline.json (scene boundaries, caption times, discovery-event
// times) that the score composition is written against.
//
//   npx esbuild src/demos/record.ts --bundle --platform=node --format=cjs --outfile=video-out/record.cjs
//   node video-out/record.cjs               # all scenes + end card + concat + timeline
//   node video-out/record.cjs 3             # just scene index 3 (no concat)
//   node video-out/record.cjs assemble      # concat existing clips + timeline
//   add --preview for fast 1080p drafts (no bloom chain)
//
// The score is muxed separately (see score/ and docs/VIDEO_PIPELINE.md).

import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { World } from '../sim/world'
import { END_CARD, H, SCENES, W, colorize, type Scene } from './scenes'

const OUT = 'video-out'
const FPS = 60
const DEF_HOLD_IN = 36
const DEF_HOLD_OUT = 60
const FADE = 0.5
const END_FADE = 2.0
const MIN_CAP_SEC = 2.4

const PREVIEW = process.argv.includes('--preview')
const ARGS = process.argv.slice(2).filter((a) => a !== '--preview')

// palette (ASS is &HAABBGGRR with AA=00 opaque)
const INK = '&H00B8CDD8' // warm parchment d8cdb8
const BRASS = '&H005CA4C9' // c9a45c
const HALO = '&H50060808' // deep warm near-black, ~31% transparent, for soft outline

const t = (sec: number): string => {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  return `${h}:${String(m).padStart(2, '0')}:${s.toFixed(2).padStart(5, '0')}`
}

const holdIn = (s: Scene): number => s.holdIn ?? DEF_HOLD_IN
const holdOut = (s: Scene): number => s.holdOut ?? DEF_HOLD_OUT

/** Walk the speed ramp: simAtOut[outputFrame] = sim frame shown there. */
function schedule(scene: Scene): number[] {
  const rate = scene.rate ?? (() => 1)
  const simAtOut: number[] = []
  let simF = 0
  while (simF < scene.duration) {
    simAtOut.push(simF)
    simF += Math.max(1, rate(simF) | 0)
  }
  return simAtOut
}

/** Output-time (seconds) at which a given sim frame appears. */
function outTime(scene: Scene, simAtOut: number[], simFrame: number): number {
  let lo = 0
  while (lo < simAtOut.length && simAtOut[lo]! < simFrame) lo++
  return (holdIn(scene) + lo) / FPS
}

/** Pass 1: run the scene (same seed as the encode pass) and record every sim
 *  frame at which each codex discovery fires — captions sync to these. */
function probeEvents(scene: Scene, seed: number): Map<string, number[]> {
  const world = new World(W, H, seed)
  scene.setup(world)
  const fired = new Map<string, number[]>()
  for (let f = 0; f < scene.duration; f++) {
    scene.tick(world, f)
    world.step()
    for (const ev of world.events) {
      if (ev.t !== 'disc') continue
      let arr = fired.get(ev.key)
      if (!arr) fired.set(ev.key, (arr = []))
      if (arr.length < 500) arr.push(f)
    }
  }
  return fired
}

interface ResolvedCap { sec: number; until: number; text: string }

/** Resolve captions to on-screen seconds: event-synced (with count), clamped,
 *  sorted, then spaced so each line holds at least MIN_CAP_SEC. */
function resolveCaptions(
  scene: Scene,
  simAtOut: number[],
  totalSec: number,
  events: Map<string, number[]>,
): ResolvedCap[] {
  const raw: { sec: number; text: string }[] = []
  for (const cap of scene.captions) {
    let simF: number | null = cap.at ?? null
    if (cap.on !== undefined) {
      const fired = events.get(cap.on)
      const need = cap.count ?? 1
      if (!fired || fired.length < need) continue // never (sufficiently) happened — say nothing
      simF = fired[need - 1]! + (cap.delay ?? 24)
    }
    if (simF === null) continue
    raw.push({ sec: Math.max(outTime(scene, simAtOut, Math.min(simF, scene.duration - 1)), 0.8), text: cap.text })
  }
  raw.sort((a, b) => a.sec - b.sec)
  // enforce minimum display: push collisions later; drop what falls off the end
  const placed: ResolvedCap[] = []
  let cursor = 0
  for (const c of raw) {
    const start = Math.max(c.sec, cursor)
    if (start > totalSec - 1.8) continue
    placed.push({ sec: start, until: totalSec - FADE, text: c.text })
    cursor = start + MIN_CAP_SEC
  }
  for (let i = 0; i + 1 < placed.length; i++) placed[i]!.until = placed[i + 1]!.sec
  return placed
}

function assFor(scene: Scene, index: number, totalSec: number, endCard: boolean, caps: ResolvedCap[]): string {
  const anchorTop = (scene.capAnchor ?? 'bottom') === 'top'
  const head = `[Script Info]
ScriptType: v4.00+
PlayResX: 3840
PlayResY: 2160
WrapStyle: 2

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Title,Palatino Linotype,150,${BRASS},${INK},${HALO},${HALO},0,0,0,0,100,100,18,0,1,6,0,8,120,120,250,1
Style: Caption,Palatino Linotype,80,${INK},${INK},${HALO},${HALO},0,1,0,0,100,100,2,0,1,5,0,${anchorTop ? 8 : 2},160,160,${anchorTop ? 200 : 170},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`
  const lines: string[] = []
  if (endCard) {
    lines.push(
      `Dialogue: 0,${t(2.0)},${t(totalSec - 2.2)},Title,,0,0,900,,{\\an5\\fad(1400,1600)\\blur1\\fsp26\\t(0,12000,\\fsp36)}FALLING SAND ALCHEMY`,
    )
  } else {
    if (index === 0) {
      lines.push(
        `Dialogue: 0,${t(0.9)},${t(6.2)},Title,,0,0,0,,{\\fad(1100,1100)\\blur1\\fsp26\\t(0,5300,\\fsp34)}FALLING SAND ALCHEMY`,
      )
    }
    for (const c of caps) {
      lines.push(`Dialogue: 0,${t(c.sec)},${t(c.until)},Caption,,0,0,0,,{\\fad(450,550)\\blur0.8}${c.text}`)
    }
  }
  return head + lines.join('\n') + '\n'
}

function videoFilter(stem: string, totalSec: number, endCard: boolean): string {
  const fadeOut = endCard ? END_FADE : FADE
  if (PREVIEW) {
    return [
      'scale=1620:1080:flags=neighbor',
      'pad=1920:1080:150:0:color=0x0e0c0a',
      `subtitles=${OUT}/${stem}.ass`,
      `fade=t=in:st=0:d=${FADE}`,
      `fade=t=out:st=${(totalSec - fadeOut).toFixed(2)}:d=${fadeOut}`,
    ].join(',')
  }
  // 4K master: integer 18x nearest upscale, soft bloom on highlights, gentle
  // vignette, captions crisp on top, fade joins. The bloom bright-pass and
  // screen blend run in planar RGB (gbrp) — screen-blending YUV chroma planes
  // shifts everything purple. Labeled segments are ';'-separated chains.
  const bright = "if(gt(val\\,175)\\,val\\,0)"
  const pre = 'scale=3240:2160:flags=neighbor,pad=3840:2160:300:0:color=0x0e0c0a,format=gbrp,split[base][hl]'
  const glow = `[hl]lutrgb=r='${bright}':g='${bright}':b='${bright}',gblur=sigma=22[glow]`
  const post = [
    '[base][glow]blend=all_mode=screen:all_opacity=0.25',
    'format=yuv444p',
    'vignette=angle=PI/10',
    `subtitles=${OUT}/${stem}.ass`,
    `fade=t=in:st=0:d=${FADE}`,
    `fade=t=out:st=${(totalSec - fadeOut).toFixed(2)}:d=${fadeOut}`,
    'format=yuv420p',
  ].join(',')
  return `${pre};${glow};${post}`
}

interface SceneRender {
  file: string
  seconds: number
  title: string
  captions: { sec: number; text: string }[]
  events: Record<string, number>
}

async function renderScene(scene: Scene, index: number): Promise<SceneRender> {
  const endCard = scene === END_CARD
  const simAtOut = schedule(scene)
  const totalFrames = holdIn(scene) + simAtOut.length + holdOut(scene)
  const totalSec = totalFrames / FPS
  const stem = `scene_${String(index).padStart(2, '0')}`
  const assPath = `${OUT}/${stem}.ass`
  const outPath = `${OUT}/${stem}.mp4`
  const seed = scene.seed ?? 0xc0ffee + index * 7333
  const events = probeEvents(scene, seed)
  const caps = resolveCaptions(scene, simAtOut, totalSec, events)
  writeFileSync(assPath, assFor(scene, index, totalSec, endCard, caps))

  const ff = spawn(
    'ffmpeg',
    [
      '-hide_banner', '-loglevel', 'warning', '-y',
      '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', `${W}x${H}`, '-r', String(FPS), '-i', 'pipe:0',
      '-vf', videoFilter(stem, totalSec, endCard),
      '-c:v', 'libx264', '-crf', PREVIEW ? '20' : '16', '-preset', PREVIEW ? 'fast' : 'medium',
      '-movflags', '+faststart',
      outPath,
    ],
    { stdio: ['pipe', 'ignore', 'inherit'] },
  )
  const done = new Promise<void>((res, rej) => {
    ff.on('close', (code) => (code === 0 ? res() : rej(new Error(`ffmpeg exited ${code} for ${stem}`))))
  })

  const world = new World(W, H, seed)
  scene.setup(world)
  const rate = scene.rate ?? (() => 1)
  const buf = new Uint8Array(W * H * 3)

  const writeFrame = (b: Uint8Array): Promise<void> =>
    new Promise((res) => {
      if (ff.stdin.write(Buffer.from(b))) res()
      else ff.stdin.once('drain', () => res())
    })

  colorize(world, buf, 3)
  for (let k = 0; k < holdIn(scene); k++) await writeFrame(buf)
  let simF = 0
  while (simF < scene.duration) {
    const steps = Math.max(1, rate(simF) | 0)
    for (let k = 0; k < steps && simF < scene.duration; k++) {
      scene.tick(world, simF)
      world.step()
      simF++
    }
    colorize(world, buf, 3)
    await writeFrame(buf)
  }
  for (let k = 0; k < holdOut(scene); k++) {
    world.step()
    colorize(world, buf, 3)
    await writeFrame(buf)
  }
  ff.stdin.end()
  await done
  console.log(`rendered ${outPath} (${totalSec.toFixed(1)}s)`)
  return {
    file: outPath,
    seconds: totalSec,
    title: scene.title,
    captions: caps.map((c) => ({ sec: c.sec, text: c.text })),
    events: Object.fromEntries(
      [...events.entries()].map(([k, fs]) => [k, outTime(scene, simAtOut, fs[0]!)]),
    ),
  }
}

/* ───────────────────────── assembly ───────────────────────── */

function run(args: string[], cwd?: string): Promise<void> {
  const p = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'warning', '-y', ...args],
    { stdio: ['ignore', 'ignore', 'inherit'], ...(cwd ? { cwd } : {}) })
  return new Promise((res, rej) => {
    p.on('close', (code) => (code === 0 ? res() : rej(new Error(`ffmpeg exited ${code}`))))
  })
}

async function assemble(renders: SceneRender[]): Promise<void> {
  const list = renders.map((f) => `file '${f.file.replace(`${OUT}/`, '')}'`).join('\n') + '\n'
  writeFileSync(`${OUT}/concat.txt`, list)
  await run(['-f', 'concat', '-safe', '0', '-i', 'concat.txt', '-c', 'copy', 'showcase-silent.mp4'], OUT)
  // timeline for the score: absolute times of scene starts, captions, events
  let clock = 0
  const timeline = renders.map((r) => {
    const entry = {
      title: r.title,
      file: r.file,
      start: Number(clock.toFixed(2)),
      end: Number((clock + r.seconds).toFixed(2)),
      captions: r.captions.map((c) => ({ at: Number((clock + c.sec).toFixed(2)), text: c.text })),
      events: Object.fromEntries(
        Object.entries(r.events).map(([k, sec]) => [k, Number((clock + sec).toFixed(2))]),
      ),
    }
    clock += r.seconds
    return entry
  })
  writeFileSync(`${OUT}/timeline.json`, JSON.stringify({ totalSec: Number(clock.toFixed(2)), scenes: timeline }, null, 2))
  console.log(`assembled ${OUT}/showcase-silent.mp4 (${(clock / 60).toFixed(1)} min) + timeline.json`)
}

async function main(): Promise<void> {
  mkdirSync(OUT, { recursive: true })
  const all = [...SCENES, END_CARD]
  const arg = ARGS[0]
  if (arg !== undefined && arg !== 'assemble') {
    await renderScene(all[Number(arg)]!, Number(arg))
    return
  }
  const renders: SceneRender[] = []
  if (arg === 'assemble') {
    // re-probe cheaply to rebuild the timeline without re-encoding
    for (let i = 0; i < all.length; i++) {
      const scene = all[i]!
      const simAtOut = schedule(scene)
      const totalSec = (holdIn(scene) + simAtOut.length + holdOut(scene)) / FPS
      const events = probeEvents(scene, scene.seed ?? 0xc0ffee + i * 7333)
      const caps = resolveCaptions(scene, simAtOut, totalSec, events)
      renders.push({
        file: `${OUT}/scene_${String(i).padStart(2, '0')}.mp4`,
        seconds: totalSec,
        title: scene.title,
        captions: caps.map((c) => ({ sec: c.sec, text: c.text })),
        events: Object.fromEntries(
          [...events.entries()].map(([k, fs]) => [k, outTime(scene, simAtOut, fs[0]!)]),
        ),
      })
    }
  } else {
    for (let i = 0; i < all.length; i++) renders.push(await renderScene(all[i]!, i))
  }
  await assemble(renders)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
