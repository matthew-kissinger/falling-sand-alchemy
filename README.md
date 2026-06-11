# Falling Sand Alchemy

A zen falling-sand game about transmutation. Pour, mix, burn, and distill pixel materials on an alchemist's bench; every reaction you cause for the first time is inscribed into a codex, building toward the Magnum Opus.

**Status: pre-v0.1.** The playable prototypes live in [`reference/`](reference/) (single-file HTML — open in a browser). The rebuild from those prototypes is being planned in the design docs below.

## Design pillars

- **Zen.** Meditative pace, generative ambient sound, no pressure. The sandbox is always fully unlocked — pure creative mode.
- **Diegetic, not chrome.** The UI is the laboratory: a codex folio, a shelf of reagent phials, chalk and brass — not panels floating over a canvas.
- **Honest chemistry.** One unified density-driven movement rule; every element earns its place with at least two meaningful interactions; the reaction graph is a tree with a real capstone (the Great Work), not a flat checklist.
- **Trials are secondary.** Curated scenario puzzles that teach the chemistry and grant achievements — never gates on the sandbox.

## Docs

- [`ANALYSIS.md`](ANALYSIS.md) — teardown of the prototypes: what they are, what survives, what goes
- [`SIM_AUDIT.md`](SIM_AUDIT.md) — element-by-element simulation audit, the sand/water diagnosis, proposed roster + physics roadmap
- [`AUDIO_RESEARCH.md`](AUDIO_RESEARCH.md) — zen/generative audio architecture
- [`STACK_RESEARCH.md`](STACK_RESEARCH.md) — June-2026 stack survey and the chosen approach

## Development

```sh
npm install
npm run dev      # http://localhost:5190
npm run build    # type-check + production build (relative base, itch.io-ready)
npm test         # vitest
```

Planned layout: `src/sim/` (pure, dependency-free simulation core), `src/render/` (WebGL2 blit + post pipeline), `src/audio/` (generative engine), `src/ui/` (bench chrome).

## License

MIT
