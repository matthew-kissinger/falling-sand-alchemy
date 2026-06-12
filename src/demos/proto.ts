// Headless scene-prototyping harness (Node-side, dev-only). Runs ONE scene in
// the real sim and dumps upscaled PNG frames + an event/caption report, so a
// scene script can be judged on what it actually produces without a full
// video render. Each scene gets its own esbuild entry so a broken sibling
// scene never blocks iteration:
//
//   // video-out/proto/entry_candle.ts
//   import { runProto } from '../../src/demos/proto'
//   import { SCENE } from '../../src/demos/scenes/candle'
//   runProto(SCENE)
//
//   npx esbuild video-out/proto/entry_candle.ts --bundle --platform=node \
//     --format=cjs --outfile=video-out/proto/candle.cjs
//   node video-out/proto/candle.cjs --out video-out/proto/candle --every 150
//
// Flags: --out DIR (required) · --every N (capture cadence in sim frames) ·
// --frames a,b,c (extra capture points) · --scale N (default 6 → 1080x720) ·
// --seed N (default the recorder's seed formula won't apply; use --seed to
// match record.ts: 0xc0ffee + index*7333)

import { mkdirSync, writeFileSync } from 'node:fs'
import { deflateSync } from 'node:zlib'
import { World } from '../sim/world'
import { H, W, colorize, type Scene } from './lib'

function crc32(buf: Uint8Array): number {
  let c = ~0
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]!
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1))
  }
  return ~c >>> 0
}

function chunk(tag: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length)
  const dv = new DataView(out.buffer)
  dv.setUint32(0, data.length)
  out.set([...tag].map((ch) => ch.charCodeAt(0)), 4)
  out.set(data, 8)
  dv.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)))
  return out
}

/** Write an RGB buffer as a PNG (nearest-neighbor upscaled by `scale`). */
export function writePng(path: string, rgb: Uint8Array, scale: number): void {
  const ow = W * scale
  const oh = H * scale
  const raw = new Uint8Array(oh * (ow * 3 + 1))
  for (let y = 0; y < oh; y++) {
    const sy = (y / scale) | 0
    const row = y * (ow * 3 + 1)
    raw[row] = 0
    for (let x = 0; x < ow; x++) {
      const sx = (x / scale) | 0
      const si = (sy * W + sx) * 3
      const di = row + 1 + x * 3
      raw[di] = rgb[si]!
      raw[di + 1] = rgb[si + 1]!
      raw[di + 2] = rgb[si + 2]!
    }
  }
  const ihdr = new Uint8Array(13)
  const dv = new DataView(ihdr.buffer)
  dv.setUint32(0, ow)
  dv.setUint32(4, oh)
  ihdr.set([8, 2, 0, 0, 0], 8)
  const sig = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])
  const idat = deflateSync(raw, { level: 6 })
  const png = Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', new Uint8Array(0))])
  writeFileSync(path, png)
}

export function runProto(scene: Scene, argv = process.argv.slice(2)): void {
  const arg = (name: string): string | undefined => {
    const i = argv.indexOf(`--${name}`)
    return i >= 0 ? argv[i + 1] : undefined
  }
  const out = arg('out')
  if (!out) throw new Error('--out DIR is required')
  const every = Number(arg('every') ?? 0)
  const extra = (arg('frames') ?? '').split(',').filter(Boolean).map(Number)
  const scale = Number(arg('scale') ?? 6)
  const seed = Number(arg('seed') ?? 0xc0ffee)
  mkdirSync(out, { recursive: true })

  const capture = new Set<number>(extra)
  if (every > 0) for (let f = 0; f <= scene.duration; f += every) capture.add(f)
  capture.add(scene.duration - 1)

  const world = new World(W, H, seed)
  scene.setup(world)
  const buf = new Uint8Array(W * H * 3)
  const events: Record<string, { first: number; count: number }> = {}

  const snap = (f: number): void => {
    colorize(world, buf, 3)
    writePng(`${out}/f${String(f).padStart(5, '0')}.png`, buf, scale)
  }
  if (capture.has(0)) snap(0)
  for (let f = 0; f < scene.duration; f++) {
    scene.tick(world, f)
    world.step()
    for (const ev of world.events) {
      if (ev.t !== 'disc') continue
      const e = (events[ev.key] ??= { first: f, count: 0 })
      e.count++
    }
    if (capture.has(f + 1)) snap(f + 1)
  }

  // caption resolution preview: the sim frame each caption would land on
  const caps = scene.captions.map((c) => {
    let simF: number | null = c.at ?? null
    if (c.on !== undefined) {
      const ev = events[c.on]
      if (!ev || ev.count < (c.count ?? 1)) return { text: c.text, simFrame: null, note: `event '${c.on}' x${c.count ?? 1} never fired` }
      simF = ev.first + (c.delay ?? 24)
    }
    return { text: c.text, simFrame: simF }
  })
  const report = { title: scene.title, duration: scene.duration, seed, events, captions: caps }
  writeFileSync(`${out}/report.json`, JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report, null, 2))
}
