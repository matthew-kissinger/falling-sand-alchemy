# Falling-Sand Alchemy — Reference Analysis

Date: 2026-06-11. Source: two single-file HTML downloads (likely claude.ai artifacts), moved from `~/Downloads` into `reference/`. This is the seed for the first game shipped out of the lab. Goal of the rebuild: keep the scene, strip the web-app chrome, make it feel like a laboratory.

## Versions

- `reference/falling-sand-alchemy-v1.html` (39 KB, 2026-06-10) — pure sandbox. Element set + 33-discovery codex + WebGL2 renderer. No progression.
- `reference/falling-sand-alchemy-v2.html` (68 KB, 2026-06-11) — canonical. Adds the 10-trial campaign (element gating, lock zones, hint ladder, persistence via `window.storage`), extended chemistry (dirt/mud/salt/brine/lye/soap/gas/brick), gamification chrome (CTA, badges, stamps, spark particles).

## What the game actually is

A falling-sand cellular automaton (Noita/Powder-Toy lineage) with an alchemy discovery meta-layer:

- **Grid:** aspect-fit, ~32k cells (capped 80-300 per axis). Four parallel `Uint8Array`s: `grid` (element id), `aux` (per-element counter: fire fuel, steam life, plant energy, dirt fertilizer flag, soap scrub count), `shade` (per-cell color jitter), `stamp` (frame parity guard so a cell moves once per step).
- **Elements:** 26 + erase. Solids (stone, obsidian, glass, brick, ice, wax = inert; sand, dirt, salt, powder, ash, spore = falling), liquids with a density table (water 20, acid 21, lye 22, brine 23, molten wax 25, mud 28, lava 30, oil 10 — drives sink/float and the oil-over-water immiscibility discovery), gases (steam, smoke, gas) with lifetime decay, fire as a self-extinguishing particle with fuel counter.
- **Simulation step:** bottom-up scan, alternating left/right per row parity (classic bias fix), big switch per element. Reactions are neighbor-checks with probabilities (e.g. lava+water → obsidian+steam, acid+lye → salt+water titration, plant rotting in mud → gas → marsh-fire combustion). Fixed 60 Hz timestep with accumulator, max 3 steps of catch-up.
- **Discovery system (the soul):** 33 named reactions (`DISC`), each with a key, recipe string, and a one-line riddle in alchemical voice ("The sea meets the mountain's blood"). First trigger inscribes it into the codex with roman numerals, toast, chime, haptic. Completion = "Magnum Opus."
- **Trials (v2):** 10 staged puzzles. Each builds a stone vessel scene, designates a lock-zone rectangle where the target reaction must fire, restricts the palette to earned elements, and grants new elements on completion. Two-level hint ladder. Linear unlock chain ending in the genuinely clever ones (distill-by-draining-brine, potash ash-rain, marsh gas farming).
- **Renderer:** CPU sim → RGBA buffer → WebGL2 texture → 3-pass pipeline: bright extract → separable gaussian blur (bloom) → composite with heat-shimmer displacement above hot cells, screen-shake from `trauma`, vignette, gold flash on discovery, film grain. Canvas-2D fallback path exists and is fully playable.
- **Audio:** lazy-init WebAudio. Pentatonic tone ladder keyed to discovery index, lowpass+compressor master bus, noise-buffer explosion, fanfare arpeggio. No assets — fully synthesized.
- **Input:** pointer events with per-pointer element maps (multi-touch paint), line interpolation, right-drag erase, scroll/[-] brush size, full keyboard map, brush ring cursor.

## What's worth keeping (the scene)

1. The entire simulation core — element table, density model, aux-counter idioms, reaction graph. It's compact and tuned; port to TypeScript modules nearly verbatim.
2. The WebGL2 post pipeline — bloom + heat shimmer + trauma shake is what makes the sand feel alive. Port as-is, consider upgrading later.
3. The discovery/codex content — all 33 entries' names, recipes, riddle prose. This is authored content, not chrome.
4. The 10 trial designs — vessel layouts, zones, gating, hint text.
5. The audio synth approach (no-asset, pentatonic-keyed).
6. The seed scene (shelved vessels of water/sand/dirt/oil) — it already gestures at "laboratory bench."

## What goes (the web-UI smell)

- Glassmorphism everything: `backdrop-filter: blur()` panels, translucent cards, rounded-corner floating dock, pill badges, toast stack. This is 2024 mobile-app dialect.
- The floating header bar with icon buttons + progress ring — app chrome, not lab furniture.
- Google Fonts dependency (Marcellus + Space Grotesk) and the gold-gradient-text-on-dark "premium app" treatment.
- The hotbar as a row of rounded chips with tiny labels.
- The hero-overlay CTA button ("BEGIN THE TRIALS" breathing gradient pill).
- Generic modal overlays for trials list and shortcuts.

## Direction the rebuild should explore (for alignment)

The premise does half the work: the player IS an alchemist at a bench. UI should be diegetic — drawn into the world or rendered as period instruments, not floated over it as glass:

- Codex = an actual open book/folio surface (paper texture, ink that bleeds in on discovery), not a slide-over panel.
- Hotbar = a shelf of labeled reagent jars / phials; brush = selecting a different scoop or pour.
- Trials = wax-sealed letters or chalk diagrams on the bench, not a modal list.
- Progress = the seal ring is already good; make it an engraved instrument, not a header widget.
- Typography/materials: ink, parchment, brass, chalk, smoke — rendered with real texture, not CSS gradients on flat panes.
- The sim canvas could sit inside a vessel/retort in a larger bench scene rather than being the full viewport — this is also the bridge to the eventual 3D variant (bench becomes a 3D scene, sim stays 2D inside glassware).

## Technical notes / debts in the reference

- `window.storage` is a claude.ai artifact API — does not exist in a normal browser. Replace with `localStorage` (and persist discoveries too; currently only trial progress saves, the codex resets on reload).
- Sim is CPU-bound single-thread; ~32k cells is the comfortable ceiling. A bigger canvas wants a Worker, WASM, or GPU compute (see STACK_RESEARCH).
- All state is module-global; the port should isolate sim (pure, testable) from presentation. The reaction switch is a candidate for a data-driven rule table, which would also make new chemistry cheap.
- Mobile support is genuinely good in the reference (visualViewport fitting, safe-area insets, touch) — don't regress it.

## Open questions for Matt

1. Name: keep "Falling Sand Alchemy" or rename for the lab release? (Candidate: Athanor — the alchemist's furnace; Magnum Opus is taken thematically by the end-state.)
2. Scope of v1 rebuild: faithful port with diegetic reskin, or also extend the sim (bigger grid via Worker/WASM/WebGPU)?
3. Public posture: instruktlabs or matthew-kissinger surface? itch.io build?
