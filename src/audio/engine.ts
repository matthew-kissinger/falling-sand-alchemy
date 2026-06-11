// Zen generative audio on Tone.js — three-bus tree into a lowpass+compressor
// master (same voicing as the reference synth, rebuilt on Tone units):
//   bed      — Eno-drift pad: three pentatonic sines on mutually-prime LFO
//              periods (17/23/31 s), phases rarely align
//   texture  — filtered-noise voices per material class, gain-driven by the
//              sim census (O(materials) per update, never O(cells))
//   events   — discovery chimes, paint blips, detonations; ducks the texture
// Everything stays silent until init() runs from a user gesture.

import * as Tone from 'tone'
import type { SimStats } from '../sim/stats'

const PENT = [0, 2, 4, 7, 9]
const fOf = (i: number): number =>
  130.81 * Math.pow(2, (PENT[i % 5]! + (((i / 5) | 0) % 2) * 12) / 12)

interface TextureVoice {
  gain: Tone.Gain
  set(level: number): void
}

export class AudioEngine {
  ready = false
  muted = false
  private starting = false
  private master!: Tone.Gain
  private bedBus!: Tone.Gain
  private texBus!: Tone.Gain
  private evBus!: Tone.Gain
  private voices: Record<string, TextureVoice> = {}
  private lastBlip = 0
  private lastBoom = 0
  private volume = 0.8

  async init(): Promise<void> {
    if (this.ready || this.starting) return
    this.starting = true
    await Tone.start()

    // master: gain → lowpass → compressor → destination
    const comp = new Tone.Compressor({ threshold: -22, knee: 18, ratio: 8, attack: 0.004, release: 0.3 }).toDestination()
    const lp = new Tone.Filter({ type: 'lowpass', frequency: 1100, Q: 0.4 }).connect(comp)
    this.master = new Tone.Gain(0.22 * this.volume).connect(lp)

    this.bedBus = new Tone.Gain(1).connect(this.master)
    this.texBus = new Tone.Gain(1).connect(this.master)
    this.evBus = new Tone.Gain(1).connect(this.master)

    this.buildBed()
    this.buildTextures()
    this.ready = true
    this.applyMute()
  }

  setVolume(v: number): void {
    this.volume = v
    if (this.ready) this.master.gain.rampTo(0.22 * v, 0.1)
  }

  setMuted(m: boolean): void {
    this.muted = m
    if (this.ready) this.applyMute()
  }

  private applyMute(): void {
    const g = this.muted ? 0 : 1
    this.bedBus.gain.rampTo(this.muted ? 0 : 1, 0.2)
    this.texBus.gain.rampTo(g, 0.2)
    this.evBus.gain.rampTo(g, 0.05)
  }

  /* ─────────────────────── bed ─────────────────────── */

  private buildBed(): void {
    // C3 / G3 / D4 — stacked fifths from the pentatonic root
    const notes: [number, number][] = [[130.81, 17], [196.0, 23], [293.66, 31]]
    const bedLp = new Tone.Filter({ type: 'lowpass', frequency: 520, Q: 0.3 }).connect(this.bedBus)
    for (const [freq, period] of notes) {
      const g = new Tone.Gain(0).connect(bedLp)
      const osc = new Tone.Oscillator({ frequency: freq, type: 'sine' }).connect(g)
      const sub = new Tone.Oscillator({ frequency: freq / 2, type: 'sine', volume: -14 }).connect(g)
      // slow swell, mutually-prime period: sin LFO 0→peak
      const lfo = new Tone.LFO({ frequency: 1 / period, min: 0, max: 0.05, type: 'sine' })
      lfo.connect(g.gain)
      // slight detune drift so held tones never sit still
      const drift = new Tone.LFO({ frequency: 1 / (period + 4), min: -6, max: 6, type: 'sine' })
      drift.connect(osc.detune)
      osc.start(); sub.start(); lfo.start(); drift.start()
    }
  }

  /* ─────────────────────── textures ─────────────────────── */

  private noiseVoice(
    type: 'pink' | 'brown' | 'white',
    filter: Partial<Tone.FilterOptions>,
    flutterHz = 0,
  ): TextureVoice {
    const gain = new Tone.Gain(0).connect(this.texBus)
    const f = new Tone.Filter(filter).connect(gain)
    const noise = new Tone.Noise(type).connect(f)
    noise.start()
    if (flutterHz > 0) {
      const fl = new Tone.LFO({ frequency: flutterHz, min: 0.4, max: 1, type: 'square' })
      const flGain = new Tone.Gain(1)
      // re-route noise through flutter gain
      noise.disconnect(); noise.connect(flGain); flGain.connect(f)
      fl.connect(flGain.gain)
      fl.start()
    }
    let target = 0
    return {
      gain,
      set(level: number) {
        if (Math.abs(level - target) < 0.002) return
        target = level
        gain.gain.rampTo(level, 0.4)
      },
    }
  }

  private buildTextures(): void {
    this.voices.water = this.noiseVoice('pink', { type: 'lowpass', frequency: 320, Q: 0.6 })
    this.voices.fire = this.noiseVoice('brown', { type: 'bandpass', frequency: 850, Q: 0.8 }, 7)
    this.voices.steam = this.noiseVoice('white', { type: 'highpass', frequency: 3200, Q: 0.4 })
    this.voices.powder = this.noiseVoice('pink', { type: 'bandpass', frequency: 2400, Q: 1.2 })
    // water voice gets a slow lapping LFO on its filter
    const lap = new Tone.LFO({ frequency: 0.23, min: 180, max: 460, type: 'sine' })
    // (re-create the filter handle by tapping the voice's chain is overkill —
    //  a second slow gain wobble reads as lapping just as well)
    const wob = new Tone.LFO({ frequency: 0.31, min: 0.6, max: 1, type: 'sine' })
    wob.connect(this.voices.water.gain.gain)
    lap.dispose() // not wired; keep the wobble only
    wob.start()
  }

  /** Feed the census. Call at ~10 Hz. Gains are O(materials), not O(cells). */
  update(stats: SimStats): void {
    if (!this.ready || this.muted) return
    const v = this.voices
    v.water?.set(Math.min(0.06, Math.sqrt(stats.liquidMoved) * 0.004 + Math.sqrt(stats.water) * 0.0006))
    v.fire?.set(Math.min(0.09, Math.sqrt(stats.fire) * 0.006))
    v.steam?.set(Math.min(0.04, Math.sqrt(stats.gasMoved + stats.steam) * 0.003))
    v.powder?.set(Math.min(0.05, Math.sqrt(stats.powderMoved) * 0.005))
  }

  /* ─────────────────────── events ─────────────────────── */

  /** pan: -1..1 from the reaction's x position. */
  private tone(freq: number, dur: number, vol: number, attack = 0.05, pan = 0, delay = 0): void {
    if (!this.ready || this.muted) return
    const t = Tone.now() + delay
    const panner = new Tone.Panner(pan).connect(this.evBus)
    const g = new Tone.Gain(0).connect(panner)
    const o = new Tone.Oscillator({ frequency: freq, type: 'sine' }).connect(g)
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(vol, t + attack)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    o.start(t)
    o.stop(t + dur + 0.1)
    setTimeout(() => { o.dispose(); g.dispose(); panner.dispose() }, (delay + dur + 0.3) * 1000)
  }

  private duck(): void {
    if (!this.ready) return
    this.texBus.gain.cancelScheduledValues(Tone.now())
    this.texBus.gain.rampTo(0.35, 0.05)
    this.texBus.gain.rampTo(this.muted ? 0 : 1, 1.2, Tone.now() + 0.4)
  }

  chime(i: number, pan = 0): void {
    if (!this.ready || this.muted) return
    this.duck()
    const f = fOf(i)
    const steps: [number, number][] = [[0.5, 0], [1, 0.22], [1.5, 0.46]]
    for (const [m, dt] of steps) this.tone(f * m, 2.2, 0.13, 0.07, pan, dt)
    this.tone(f * 0.25, 2.8, 0.06, 0.3, 0)
  }

  blip(i: number, pan = 0): void {
    if (!this.ready || this.muted) return
    const now = Tone.now()
    if (now - this.lastBlip < 0.09 || Math.random() < 0.6) return
    this.lastBlip = now
    const f = fOf(i)
    this.tone(f, 0.5, 0.09, 0.03, pan)
    this.tone(f * 0.5, 0.7, 0.04, 0.06, pan)
  }

  tick(): void {
    this.tone(392, 0.18, 0.035, 0.02)
  }

  boom(pan = 0): void {
    if (!this.ready || this.muted) return
    const now = Tone.now()
    if (now - this.lastBoom < 0.25) return
    this.lastBoom = now
    this.duck()
    const panner = new Tone.Panner(pan).connect(this.evBus)
    const lp = new Tone.Filter({ type: 'lowpass', frequency: 420 }).connect(panner)
    const noise = new Tone.NoiseSynth({
      noise: { type: 'brown' },
      envelope: { attack: 0.002, decay: 0.7, sustain: 0 },
      volume: -12,
    }).connect(lp)
    lp.frequency.exponentialRampTo(50, 0.8)
    noise.triggerAttackRelease(0.7)
    const thud = new Tone.MembraneSynth({ pitchDecay: 0.06, octaves: 4, volume: -10 }).connect(panner)
    thud.triggerAttackRelease(49, 0.9)
    setTimeout(() => { noise.dispose(); thud.dispose(); lp.dispose(); panner.dispose() }, 2000)
  }

  combust(pan = 0): void {
    this.tone(73, 0.6, 0.16, 0.02, pan)
    this.tone(146, 0.3, 0.05, 0.02, pan)
  }

  fanfare(): void {
    if (!this.ready || this.muted) return
    this.duck()
    const steps = [0, 4, 7, 12, 16, 19, 24]
    steps.forEach((s, i) => this.tone(98 * Math.pow(2, s / 12), 2.4, 0.1, 0.12, 0, i * 0.28))
  }

  trialChord(): void {
    if (!this.ready || this.muted) return
    this.duck()
    this.tone(98, 3, 0.1, 0.2)
    this.tone(196, 2.6, 0.12, 0.15, 0, 0.05)
    this.tone(294, 2.2, 0.07, 0.15, 0, 0.15)
    this.tone(392, 2, 0.05, 0.18, 0, 0.3)
  }

  sealNudge(): void {
    this.tone(165, 0.3, 0.06, 0.04)
  }
}
