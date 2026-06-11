# Project Plan — Falling Sand Alchemy

Decisions locked 2026-06-11 with Matt. Supersedes nothing; built on ANALYSIS.md + SIM_AUDIT.md + AUDIO_RESEARCH.md + STACK_RESEARCH.md.

## Locked decisions

- **Name:** Falling Sand Alchemy. (Bare "Falling Sand" is taken on Play Store and is the itch.io genre tag — zero store searchability. "Athanor" reserved as in-game flavor.)
- **Chrome stack:** vanilla TS + modern CSS (`@layer`, custom properties, native `<dialog>`/popover, progressive anchor positioning). No framework, no Tailwind, no component libs.
- **Sim:** typed-array CPU sim, WebGL2 blit + post pipeline (port the bloom/heat-shimmer from the reference). WASM/WebGPU are explicitly deferred.
- **Audio:** synthesis-first hybrid on Tone.js ^15 — port the reference event synth verbatim, add the continuous layer. Elementary Audio is the documented stretch migration.
- **v0.1 scope:** re-spined roster (the audit applied), not a faithful port.
- **Modes:** sandbox is always free creative (full palette, no gating). Trials are a separate secondary mode: independently selectable scenario puzzles with achievements.
- **Targets:** web first (itch.io-ready, `base:'./'`). Then Android Play Store free via Capacitor; iOS later via the same wrapper; desktop via Tauri 2. Platform APIs (storage, haptics, fullscreen, share) behind an adapter seam from day one.

## Architecture

```
src/
├── sim/          pure, dependency-free, testable
│   ├── elements.ts     element defs: density, fluidity, class, color, aux semantics
│   ├── rules.ts        data-driven reaction table (replaces the giant switch)
│   ├── world.ts        typed arrays, moveByDensity(), step()
│   └── stats.ts        per-frame material counts + activity scalar (feeds audio)
├── render/       WebGL2: texture blit, bright/blur/composite passes, 2D fallback
├── audio/        Tone.js: bed / texture / event buses, sim-as-conductor
├── ui/           vanilla chrome: codex folio, phial shelf, trials, settings
├── platform/     adapter seam: storage, haptics, fullscreen (web impl now, Capacitor later)
└── main.ts       loop, input (pointer/keyboard), mode switching
```

## v0.1 build order

1. **Sim core port + density fix.** Port grid/step to `src/sim/` with the unified `moveByDensity()` rule (every mobile material in one density table; powders displace lighter liquids; fluidity controls spread). Wet-bit on sand/dirt. Vitest rules tests (sand sinks through water, oil floats, brine sinks below water).
2. **Re-spined roster.** Apply SIM_AUDIT §3: keep 12, re-role 5 (dirt→clay chain, gunpowder→sulphur, etc.), cut/demote 6 (smoke folded, soap/glass/obsidian/brick become products off the hotbar), add mercury, sulphur, iron, gold, aqua vitae. Reactions live in a data-driven rule table. Codex becomes a tree with the Magnum Opus recipe (calcine → dissolve → conjoin → coagulate) as capstone.
3. **Renderer port.** WebGL2 pipeline from the reference (bright → blur → composite with heat shimmer, trauma shake, vignette, grain) + Canvas-2D fallback. Adaptive grid resolution by device.
4. **Audio engine.** Port event synth (tone/blip/chime/boom/fanfare + master lowpass/compressor); add three-bus tree, filtered-noise texture voices per material class driven by `stats.ts` counts, Eno-drift pentatonic pad (prime-period LFOs), x-position panning, event ducking. Mute + volume in settings.
5. **Diegetic chrome.** Codex as folio (ink-bleed inscription on discovery), hotbar as grouped phial shelf (classical / tria prima / metals / salts), trials as bench scenarios, native `<dialog>` for overlays. No glass, no blur, no floating dock. Parchment/brass via feTurbulence + layered gradients.
6. **Modes + persistence.** Ungated sandbox; trials as selectable scenarios (lock-zone + target-reaction mechanic kept, `give[]`/linear unlock dropped) with achievement records (first-clear, no-erase, speed). Codex + achievements persist via `platform/storage` (localStorage web impl) — fixes the reference's `window.storage` bug and the codex-resets-on-reload gap.
7. **Ship v0.1:** itch.io web build + repo release. Play Store packaging (Capacitor) is v0.2-track, after the web build proves out.

## Deferred (v0.2+)

- Temperature as a propagated field (retires the ad-hoc fuel/life counters; boiling/freezing/metal-glow become emergent) — the v0.2 headline.
- Dissolution/saturation, liquid level equalization.
- Capacitor Android release; Tauri desktop; iOS.
- Elementary Audio migration; granulated CC0 grains.
- WebGPU spectacle renderer; 3D bench variant (sim inside glassware).

## Risks / watch items

- Roster re-spine changes trial chemistry — the 10 reference trials need re-validation against new rules (some recipes shift, e.g. gunpowder→sulphur).
- ~20 paintable elements on a phone screen: the phial shelf must group well at small sizes; prototype early on mobile.
- Tone.js main-thread scheduling under heavy sim load — keep texture-voice updates O(materials), not O(cells); profile before optimizing.
