# Audio Design & Engine Research — Zen/Generative

Date: 2026-06-11. Brief: zen/meditative feel; "actual sounds or a better sound engine."

## Current engine (reference, lines ~562-625)

A tasteful zero-payload one-shot event synth: sine `tone()` atom with envelope; `blip` (throttled + probabilistic, repeated reactions); `chime` (discovery arpeggio); `boom` (windowed noise buffer through a sweeping lowpass + 49 Hz thump); `fanfare`; all through a lowpass (1100 Hz) + compressor master bus. Pitch mapping locks every sound to C pentatonic (`PENT=[0,2,4,7,9]`) keyed by discovery index — nothing can sound "wrong."

**Hard ceiling:** it's a one-shot sampler with a synth voice. No continuous, sim-driven layer — the defining textures of falling sand (sand pouring, water trickling, fire crackling) are continuous density-modulated streams, and the engine has no sustained parameter-driven voice. Silence between reactions. The sim's richest signal (per-frame material activity) is computed every `step()` and thrown away acoustically.

## Samples vs synthesis vs hybrid

The decisive axis: **samples repeat; synthesis stays fresh.** Looped WAV textures reveal their loop seam in seconds and kill the meditative spell. For continuous flow textures, synthesis wins; samples earn a place only as short **granulated grains** (a single water drop, one ember, a glass ding) with randomized pitch/offset/density so they never repeat — the generative.fm move (samples as raw material, never fixed loops). What meditative web experiences actually do: generative.fm (Alex Bainter, 50+ systems) schedules short samples generatively on Tone.js; Eno-style systems drift incommensurate-length loops out of phase.

## Library landscape (June 2026)

- **Tone.js ^15** (15.1.22 stable, 15.5.x-next active) — still the default. Transport, Loop/Pattern/Sequence, GrainPlayer (granular), Noise, full TS. DAW-shaped scheduler, mostly main-thread.
- **Elementary Audio** (`@elemaudio/web-renderer`) — the interesting 2026 alternative: functional/declarative DSP in an AudioWorklet; you `render(graph)` as a pure function of app state. Philosophically perfect for a cellular automaton (audio = f(simState)), off-main-thread. Cost: smaller ecosystem, more DSP by hand. Stretch target, not v0.1.
- **Raw WebAudio + AudioWorklet** — reserve for one custom granular processor if profiling demands.
- **Strudel** (TidalCycles-in-JS) — algorithmic pattern brilliance, but a live-coding paradigm; awkward to embed. Stretch-only.
- **Howler.js** — sample one-shots only; no generative/DSP story. Skip Pizzicato.

## The zen architecture

- **Three-bus tree:** `bedBus` (drone/pad) + `textureBus` (continuous material voices) + `eventBus` (blips/chimes/booms) → existing lowpass+compressor master. Event-triggered ducking of bed+texture so rewards punch through without loudness creep.
- **Material texture voices = filtered noise, one per material CLASS** (not per cell): sand = bandpass pink noise, gain tracks falling-sand cell count; water = lower bandpass + trickle modulation; fire = randomized crackle grains over a rumble. N material counts → N continuous voice gains. This is the heart of the new engine.
- **Sim as conductor:** compute `activity = movedCells/totalCells` + per-material counts in `step()`, push to the engine every frame. Calm screen → dark, sparse, spacious; busy reactions → brighter, denser (master cutoff, pad density, reverb send all follow).
- **Eno-drift pad:** 3-4 sustained voices on pentatonic degrees, amplitude-swelled by LFOs with mutually-prime periods (17 s, 23 s, 31 s) — never realigns, infinite non-repetition. Mode-drift as progression: discoveries deepen the mode (pentatonic → Dorian → Lydian).
- **Spatialization:** StereoPanner per texture/event voice keyed to grid x (`±0.6` max). Bed stays centered. Cheap, big "alive bench" payoff.
- **Polyphony:** event bus capped ~6-8 voices (the existing blip throttle is a primitive version); texture voices are fixed-count.

## Asset path (if/when samples)

CC0 from freesound.org / OpenGameArt; short grains only; Opus (~64-96 kbps mono) — total payload under ~500 KB; decode once, granulate via Tone.GrainPlayer or a worklet.

## Recommendation

**v0.1: synthesis-first hybrid on Tone.js ^15 + the existing master bus.** Port the prototype's event synth verbatim into a TS `AudioEngine`; add the Eno-drift pad and continuous filtered-noise material voices, gain/pan-driven by live sim counts, on the three-bus tree with ducking. Zero asset payload, no loop seams, textures literally cannot repeat.

**Stretch: migrate the continuous engine to Elementary Audio** (AudioWorklet, `render(f(simState))`) once the sim is busy; optionally fold in granulated CC0 grains for moments where a recorded grain out-evokes an oscillator.

Sources: [Tone.js](https://github.com/Tonejs/Tone.js/releases) · [Elementary Audio](https://www.elementary.audio/) · [generative.fm](https://generative.fm/) · [pieces-alex-bainter](https://github.com/generative-music/pieces-alex-bainter) · [Strudel](https://strudel.cc/learn/strudel-vs-tidal/) · [Freesound](https://freesound.org/) · [MDN audio codec guide](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Audio_codecs)
