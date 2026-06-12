# Showcase video pipeline

How the YouTube showcase film is built - end to end, reproducibly. Everything
here is dev-only; the production game build (`npm run build`) only ever builds
`index.html` and never touches this pipeline.

The film is a single continuous take of the real simulation core: thirteen
scripted scenes plus an end card, each one the actual `src/sim/` engine stepped
frame by frame, recorded to 4K, scored with an original felt-piano piece, and
mastered.

## Pieces

```
src/demos/
  lib.ts             scene contract (Scene, Cap) + paint helpers + colorizer
  scenes/*.ts        the 11 scenes - pure, DOM-free, one file each
  scenes.ts          assembles SCENES[] + END_CARD
  proto.ts           headless single-scene frame harness (PNG + event report)
  record.ts          the 4K recorder: sim -> rawvideo -> ffmpeg, ASS captions,
                     speed ramps, bloom + vignette, concat, timeline.json
score/               the music (uv project, Python)
  music.py           Piece/Note model -> MIDI at 60 BPM (1 sec == 1 beat)
  compose.py         the composition, driven by timeline.json
  check_grid.py      structural audit: grid adherence + chord-tone discipline
  render.py          FluidSynth + Salamander piano -> felt chain -> IR reverb
  analyze.py         spectrogram + levels + LUFS report (audition)
  finalize.py        two-pass loudnorm + mux onto the 4K video
  make_publish.py    thumbnails + UPLOAD_COPY.md from timeline.json
video-out/           all build artifacts (gitignored)
```

## The simulation is the source of truth

`src/sim/` stays pure and framework-free (no DOM, no audio). Every scene is
deterministic: a scene runs the same way every time for a given seed, so the
recorder can do a silent probe pass to find exactly when a discovery fires
(`vitrify`, `immis`, `coagulate`, ...) and land a caption on it. The recorder's
per-scene seed is `0xc0ffee + index * 7333`; the proto harness takes `--seed` so
a scene can be inspected on the exact frames the recorder will produce.

Scene authoring rule of thumb: build the geometry from measured engine truths,
then verify on real frames with `proto.ts` before trusting a beat. The sim has
no hydrostatic pressure, liquids never displace powders upward, gold is eaten by
mercury but gleams on glass, fire is a gas that flees up (it NEVER moves
sideways - behave() handles its motion and returns before gasMove), plant
fuses self-block with their own ash while oil fuses cannot (fire+oil has no
ash branch, and debris sinks through the liquid), and a spore that meets a
falling raindrop germinates into a plant frozen midair - each scene's comments
record the failure mode its staging guards.

The third cut's scenes added more measured truths: scenes pin their RNG seed
(`Scene.seed`) so inserting or reordering scenes never re-rolls verified
staging; wet-packed powder (aux=1 sand/clay) holds crisp strata and vertical
faces yet still falls straight down when undermined - but STANDING lava dries
adjacent wet powder and the dried grains slough diagonally INTO the melt, so
only hard rock contains a lava well; powder can never roof a void (galleries
are carved in stone, and the layers respond to blasts through soft backfilled
shafts floored with plant lagging); marsh gas pools under roofs and a hot
neighbor combusts it in chaining r=3 whoomphs that can chase a dense gas
column DOWN a shaft - but a sparse rising thread never carries the chain, and
the only guaranteed flame path downward is a standing oil column (the keg's
fuse stood upright; plant ladders ash-block at 25% per cell); an upward plant
burn outruns any rain curtain, while a crown-spark's downward creep can be
held by rain spawned LOW (a drop released at the sky line takes ~80 frames to
arrive); and torches must be set ON stem cells - ground sparks land in
leftover rain puddles and steam out.

## Build the video

```powershell
# inspect one scene on the frames the recorder will see
npx esbuild video-out/proto/entry_<scene>.ts --bundle --platform=node --format=cjs --outfile=video-out/proto/<scene>.cjs
node video-out/proto/<scene>.cjs --out video-out/proto/<scene> --every 150 --seed <seed>

# render the whole film to 4K (silent) + timeline.json   (~30-45 min)
npx esbuild src/demos/record.ts --bundle --platform=node --format=cjs --outfile=video-out/record.cjs
node video-out/record.cjs                # all scenes + concat + timeline.json
node video-out/record.cjs <N>            # one scene only
node video-out/record.cjs assemble       # re-concat existing clips + rebuild timeline.json
node video-out/record.cjs --preview      # 1080p fast pass for iteration
```

Output: `video-out/showcase-silent.mp4` (4K, H.264, no audio) and
`video-out/timeline.json` (scene boundaries, caption times, discovery-event
times - the score is composed against this).

### 4K master detail

The sim canvas is 180x120. The recorder nearest-neighbour upscales 18x to
3240x2160 and pads to 3840x2160 on a near-black field. The bloom bright-pass and
screen blend run in planar RGB (`format=gbrp`) - doing it in YUV shifts the
chroma and the whole frame goes purple. Then vignette, ASS subtitles, fades, and
`format=yuv420p`. CRF 16, H.264 high. Captions use a Palatino italic ink style
with a soft halo so they stay legible over bright material; they sit in each
scene's negative space (`capAnchor: 'top' | 'bottom'`).

## Build the score

The music is one through-composed felt-piano piece in A minor / C major, driven
by the video's own timeline, written in the grammar of C418's Minecraft pieces
(Sweden, Wet Hands) fused with the alchemy arc. Time is in seconds throughout:
the MIDI is written at 60 BPM with 960 ticks/beat, so one second of music is
one second of video.

What keeps it in tune, on the beat, and symmetric:

- One global pulse. Every scene's bar-zero is an integer second nearest its
  cut, so the quarter-note pulse never breaks across the film and every
  downbeat lands on (or a breath before) a cut - nothing enters late.
- A constant arpeggio left hand (the Wet Hands device): quarter-note broken
  chords in calm scenes, eighth-note rise-and-fall in flowing ones, root
  always exactly on the downbeat, never rolled. The pulse is played, not
  implied.
- One theme, stated and restated (the Sweden device): an 8-bar period whose
  antecedent (Am-Dm-G-C, descending fifths) ends on the relative major - the
  wistful non-resolution - and whose consequent (F-G-Am) answers home. The
  film opens with the period split across its first two scenes, develops the
  head motif, recapitulates the antecedent an octave up in C major over the
  reef, and states the full period over the Magnum Opus with the consequent
  re-harmonized to end in C major: the Work transformed.
- Symmetric theory, not dice: the melody is fixed and diatonic (white keys),
  every long note a chord tone; the only dissonances are designed - a 4-3
  suspension at each antecedent's third bar and a Dm(add9) reach - and no RNG
  chooses pitches or rhythms anywhere. Structural film events (corrosion,
  ignition, detonation, the dam, the gold) are caught by accents quantized to
  whole beats. `check_grid.py` audits all of this against the built piece.

```powershell
cd score
uv run compose.py --print      # reads ../video-out/timeline.json -> out/score.mid
uv run render.py               # FluidSynth/Salamander -> felt -> IR -> out/score_master.wav
uv run analyze.py out/score_master.wav   # LUFS + spectrogram + levels (audition)
```

Synthesis: FluidSynth with the Salamander Grand (dry - reverb/chorus off), then
a felt treatment (HPF 38, LPF 8200, high-shelf -3.5 dB at 2.8 kHz, gentle
compression - set just bright enough that attacks stay articulate; duller and
the pulse reads as landing late), then a synthetic band-split IR convolution reverb generated in
numpy (RT60 ~3.8 s in the lows tapering to ~1.0 s in the highs, seed 41 - no
external audio assets; longer tails smear adjacent harmonies into mud). Master
peaks at -1.5 dBFS; loudness is set at mux.

## Master + publish

```powershell
cd score
uv run finalize.py             # two-pass loudnorm -14 LUFS / -1 dBTP, mux -> falling-sand-alchemy-master.mp4
uv run make_publish.py         # thumbnails/ + ../docs/UPLOAD_COPY.md
```

`finalize.py` copies the 4K video stream untouched and writes only a 320 kbps
AAC track normalised to the YouTube target (-14 LUFS integrated, true peak under
-1 dBTP) with `+faststart`. The music resolves a few seconds before the video
fades, then rings out under the end card.

Final artifacts: `video-out/falling-sand-alchemy-master.mp4`,
`video-out/thumbnails/*.png`, `docs/UPLOAD_COPY.md`.
