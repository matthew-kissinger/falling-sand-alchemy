# Falling Sand Alchemy

A zen falling-sand game about transmutation. Pour, mix, burn, and distill pixel materials on an alchemist's bench; every reaction you cause for the first time is inscribed into a codex, building toward the Magnum Opus.

**Status: v0.1.0** ([releases](https://github.com/matthew-kissinger/falling-sand-alchemy/releases)). Play it at **https://matthew-kissinger.github.io/falling-sand-alchemy/** — installable PWA, works offline, deployed from `main` via GitHub Pages. Windows installer and Android APK on the release page. The original prototypes live in [`reference/`](reference/) (single-file HTML — open in a browser).

v0.1 ships: 34-element re-spined roster with one unified density rule (sand finally sinks through water; everything floats on mercury), a data-driven reaction table with 40 codex discoveries ending in a real four-step Magnum Opus (calcine → dissolve → conjoin → coagulate), WebGL2 bloom pipeline with Canvas-2D fallback, generative Tone.js audio (Eno-drift pad + sim-driven noise textures + pentatonic event chimes), 11 freely-selectable trial scenarios with achievements (first clear, best time, untouched), and localStorage persistence. Desktop gets a full apothecary cabinet (every reagent visible, hotkeys engraved, arrow-key cycling); mobile gets a thumb-reach phial strip.

## The film

A 4:34 showcase film — *created, directed, and choreographed by Fable 5 (Claude, Anthropic's AI)*. Every pixel in it is the live simulation: thirteen scenes staged from the engine's measured rules (a volcano waking by the sea, a firedamp blast bringing a meadow down into the old workings, fire climbing great looping vines, the Great Work resolving into gold), recorded headlessly at 4K, captioned in-engine, and scored with an original through-composed felt-piano piece composed, rendered, and mastered by the same pipeline.

The whole pipeline is in this repo: scenes in [`src/demos/`](src/demos/) (open `/demos.html` under `npm run dev` to watch them run live), music in [`score/`](score/), and full reproducibility notes in [`docs/VIDEO_PIPELINE.md`](docs/VIDEO_PIPELINE.md).

## Design pillars

- **Zen.** Meditative pace, generative ambient sound, no pressure. The sandbox is always fully unlocked — pure creative mode.
- **Diegetic, not chrome.** The UI is the laboratory: a codex folio, a shelf of reagent phials, chalk and brass — not panels floating over a canvas.
- **Honest chemistry.** One unified density-driven movement rule; every element earns its place with at least two meaningful interactions; the reaction graph is a tree with a real capstone (the Great Work), not a flat checklist.
- **Trials are secondary.** Curated scenario puzzles that teach the chemistry and grant achievements — never gates on the sandbox.

## Docs

- [`docs/PLAN.md`](docs/PLAN.md) — locked v0.1 decisions, architecture, build order
- [`docs/SHIPPING.md`](docs/SHIPPING.md) — the target ladder: web / PWA / itch.io / Tauri desktop / Capacitor Android
- [`docs/ANALYSIS.md`](docs/ANALYSIS.md) — teardown of the prototypes: what they are, what survives, what goes
- [`docs/SIM_AUDIT.md`](docs/SIM_AUDIT.md) — element-by-element simulation audit, the sand/water diagnosis, the re-spined roster
- [`docs/AUDIO_RESEARCH.md`](docs/AUDIO_RESEARCH.md) — zen/generative audio architecture
- [`docs/STACK_RESEARCH.md`](docs/STACK_RESEARCH.md) — June-2026 stack survey and the chosen approach
- [`docs/VIDEO_PIPELINE.md`](docs/VIDEO_PIPELINE.md) — the showcase film: scene staging, 4K recorder, score, mastering

## Development

```sh
npm install
npm run dev      # http://localhost:5190
npm run build    # type-check + production build (relative base, itch.io-ready)
npm test         # vitest
```

Layout: `src/sim/` (pure, dependency-free simulation core — elements, data-driven rules, world, stats), `src/render/` (WebGL2 blit + post pipeline, 2D fallback), `src/audio/` (Tone.js generative engine), `src/ui/` (bench chrome: cabinet, codex, trials, fx), `src/platform/` (storage/haptics adapter seam for Capacitor/Tauri later), `src/demos/` + `score/` (dev-only film pipeline — never part of the production build).

## License

MIT
