# Handoff: re-author the Falling Sand Alchemy showcase video

You are taking over a showcase-video pipeline for **Falling Sand Alchemy**, a
falling-sand cellular-automaton game with an alchemy discovery layer. A first
pass exists and works end-to-end, but it reads like a "How It's Made" segment,
not the zen masterpiece it should be. Your job is to **re-evaluate the whole
thing — scenarios, visuals, pacing, captions, and especially the music — and
raise it to a genuinely beautiful, attention-holding piece.** Treat the existing
implementation as a working scaffold to improve or replace, not as a spec to
preserve. I am deferring heavily to your judgment; infer from intent below
rather than waiting for me to specify mechanics.

## What exists right now

- The sim core is pure and deterministic: `src/sim/world.ts` + `src/sim/elements.ts`
  + `src/sim/rules.ts`. 34 elements, a data-driven reaction table, discovery
  events emitted per `step()`. Read these first — every visual must be something
  the *real engine* produces. Do not fake physics.
- `src/demos/scenes.ts` — the 11 experiment scenes + an end card, as pure
  scripted setups with frame-clocked actions. Shared by the browser bench and
  the recorder. Helpers: `rect`, `line`, `dot` (1px precision), `igniteNear`,
  `jig`, `ramp` (per-scene speed curves), `colorize`.
- `src/demos/demos.ts` + `demos.html` — a dev-only browser "Experiment Bench"
  that runs all scenes live in cards (open `/demos.html` under `npm run dev`).
- `src/demos/record.ts` — a **headless Node recorder**: runs each scene in the
  real sim, pipes raw RGB frames into ffmpeg (1080p60, nearest-neighbor upscale,
  ASS subtitle captions, fades, per-scene speed ramps), two-pass event-synced
  captions, then concats + muxes a synthesized ambient bed into one showcase mp4.
  Bundle + run: `npx esbuild src/demos/record.ts --bundle --platform=node
  --format=cjs --outfile=video-out/record.cjs && node video-out/record.cjs`
  (append a scene index to render just one). Output lands in `video-out/`
  (gitignored). ffmpeg 7.1 and Node 24 are installed and on PATH.
- The current music is a **hand-rolled synthesized bed inside `record.ts`
  (`synthAmbient`)** — a sine drone, chord pad, and pentatonic bells written
  straight to a WAV buffer. **This is the weakest part and the main reason it
  feels cheap. Replace it.**

## The single most important instruction: the music

The soundtrack must be a **true zen masterpiece, composed by you**, not an
arcade-sounding synth bed. Specifically:

- **Do not use Tone.js or the existing `synthAmbient` function.** Tone.js and the
  hand-rolled sines sound like a game, not a meditative film score. Throw them
  out for the video's music.
- **Use whatever libraries, software, or tools you judge right** — you may
  install things (Python with `uv`, Node packages, a soundfont renderer,
  FluidSynth, a MIDI-to-audio pipeline, supercollider, csound, a sample-based
  renderer, an LLM-assisted MIDI composition step, whatever). Pick the approach
  that yields the most beautiful, organic result. Measure and audition; do not
  assume a tool is good enough — listen to it.
- **Piano should likely feature** — I find it an interesting, human, intimate
  instrument and think it fits the alchemical/contemplative mood. Sparse, felt,
  with space between notes. But this is a suggestion, not a constraint: include
  it if your ear agrees, build around whatever palette serves the piece (strings,
  pads, hand percussion, field-recording textures, glass, bells — your call).
- Aim for **a single continuous composed piece** that arcs across the whole
  video — not loops, not stems stitched arbitrarily. It should breathe, develop,
  and resolve. Slow. Patient. Lots of air. Think Nils Frahm / Eno / Ryuichi
  Sakamoto / Goldmund territory, rendered properly, not pastiched cheaply.
- Sync is welcome but subtle: let musical swells loosely follow the video's
  inflection points (a detonation, a dam breaking, the Magnum Opus resolving)
  without being literal or Mickey-Moused.
- The in-game audio engine is a *separate* concern (see `docs/AUDIO_RESEARCH.md`)
  — you are scoring the *video*, which can be a fixed composed track. You may
  optionally also capture/mix the game's diegetic sim sounds underneath, but the
  musical score is the priority.

## The visuals and scenarios — re-evaluate freely

The 11 scenes are a decent menu but were authored fast. Re-judge each one for
whether it actually reads, holds attention, and is beautiful. Concretely:

- **Verify every scene by inspecting real rendered frames** at start / middle /
  end and at each inflection point — not just by trusting the script. The prior
  author repeatedly shipped beats that didn't land because they didn't look:
  a spark that missed the plants, an acid dab that hit an already-empty bulb, a
  distillery that oversaturated into a white salt pile, an "amalgam" beat that
  was over before its caption appeared. Render, extract frames with ffmpeg,
  *look*, then adjust. Build this verification loop into your process.
- Known-shaky spots to scrutinize (fix, recompose, or cut): the **Fuse Garden**
  burn (dense growth regrows faster than a point ignition spreads — currently
  uses a sustained lava ribbon; make it genuinely read as fire running like a
  fuse, or rethink the scene); the **Distillery** (salt saturation + where the
  condensate actually rains); caption timing vs. the effect it describes.
- **Pacing**: the piece must hold a viewer's attention. Use speed ramps so dull
  growth/settling stretches compress while dramatic moments play in real time.
  Consider transitions beyond straight fades, a stronger opening hook, and an
  overall runtime that respects attention (the current cut is ~6 min; shorter
  and tighter may be better).
- **Captions / text**: currently ASS subtitles in Palatino with light blur and
  fades, event-synced so they react to the real discovery rather than announce
  it early. Re-evaluate the typography, motion, and whether text is even the
  right choice everywhere — maybe less text, maybe more elegant motion design,
  maybe title cards with more craft. Make it feel designed, not defaulted.
- **Color / rendering**: the sim renders at 180×120 upscaled nearest-neighbor
  for crisp pixels. Consider whether subtle bloom on glowing elements (fire,
  lava, azoth, spirit flame), vignette, grain, or a gentle CRT/parchment frame
  would elevate it — without betraying the clean pixel look. One real color note
  already fixed: azoth was too blue/teal and is now greener in `elements.ts`.

## Upscaling / output quality

"Upscaler" in the original ask means: make the final output look polished and
high-quality. The sim is tiny (180×120); it's currently scaled to 1620×1080 with
nearest-neighbor + padding to 1920×1080. Re-evaluate the upscale path — you might
integrate a real upscaler (e.g. an ESRGAN/Real-ESRGAN pass, or a shader-based
edge-preserving scale) if it genuinely helps, or keep crisp nearest-neighbor if
that's truer to the medium. Target a clean 1080p60 (or higher) H.264/H.265 master
suitable for YouTube. Judge by looking at frames.

## Working constraints / preferences

- Windows 11, PowerShell 7. ffmpeg 7.1, Node 24, Python via `uv` (never pip) all
  available. You may install tooling as needed.
- Keep the sim core pure — no DOM/audio imports in `src/sim/`. Everything visual
  must come from the real engine.
- No emojis. Hyphens over em dashes. Measure, don't assume — audition audio and
  inspect frames rather than trusting the script.
- Deterministic renders: scenes are seeded; the recorder probes events in a
  first pass so captions sync. Preserve that property if you refactor.
- The production game build only builds `index.html`; the demo/recorder pipeline
  is dev-only and must not leak into the shipped app.

## Definition of done — a ready-to-upload package

The goal is to **upload to YouTube immediately after your pass**, so deliver a
complete publish package, not just an mp4:

1. **The master file** — a single showcase video a stranger would watch to the
   end and call beautiful: coherent, paced, composed score that sounds like real
   music, every on-screen beat verified against actual rendered frames.
   Encode for YouTube's pipeline: 1080p60 minimum (consider a 4K master — YouTube
   gives higher-bitrate VP9/AV1 to 4K uploads, which markedly helps flat pixel
   art survive recompression; a clean integer upscale of the master is enough),
   H.264 high profile at generous bitrate or H.265/ProRes if you prefer,
   `+faststart`, yuv420p.
2. **Broadcast-sane audio** — normalize the final mix to YouTube loudness
   (≈ -14 LUFS integrated, true peak ≤ -1 dBTP; ffmpeg `loudnorm` two-pass).
   No clipping, no abrupt start/end; the piece should resolve before the video
   fades, not get cut off.
3. **QA on the real thing** — play the final file start-to-finish in a video
   player (not just probe frames): A/V sync, caption legibility at 1080p on a
   phone-sized window, no black-frame hiccups at concat joins, end card lands
   with the music's resolution.
4. **Thumbnail candidates** — export 3-5 full-res stills of the most striking
   frames (the Magnum Opus colors, the detonation, the pyramids, the end card)
   as PNG; pick moments that read at thumbnail size.
5. **Upload copy** — a short markdown file with: 2-3 title options (curiosity +
   honesty, no clickbait), a description (one evocative paragraph + a line that
   it's all real in-engine simulation + link slot for the playable game at
   https://matthew-kissinger.github.io/falling-sand-alchemy/), chapter
   timestamps matching the final cut (`00:00 Falling Sand`, ...), and a handful
   of tags.
6. **Reproducibility** — document the audio/composition pipeline and any new
   render steps (a short note in `docs/`) so the whole thing can be re-run after
   a sim or scene change.

You have wide latitude. Make it a masterpiece, then make it shippable.
