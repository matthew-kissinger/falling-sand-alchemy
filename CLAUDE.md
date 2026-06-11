# Falling-Sand Alchemy — first game out of the lab

Status: v0.1 BUILT (2026-06-11). All seven PLAN.md build steps landed in one pass: pure sim core (34 elements, unified `moveByDensity`, data-driven rule table, 40-discovery codex, Magnum Opus chain), WebGL2 renderer port + 2D fallback, Tone.js generative audio, diegetic chrome (desktop apothecary cabinet / mobile phial strip, in-flow parchment codex, native dialogs), 11 trials with achievements, localStorage persistence behind `src/platform/`. 18 Vitest sim tests green. Deployed via GitHub Pages (`.github/workflows/deploy.yml`): https://matthew-kissinger.github.io/falling-sand-alchemy/. Design note from Matt mid-build: first chrome pass was too close to the prototype's mobile dock and ignored PC ergonomics — redesigned to responsive cabinet/strip split; keep both form factors first-class from here on.

## What this is

A falling-sand cellular automaton with an alchemy discovery meta-layer (33 reactions, codex, 10-trial campaign). Arrived as two single-file HTML downloads; being rebuilt as a proper web app with a diegetic laboratory presentation instead of the glassmorphism web-UI shell it came with. 2D now; a 3D variant (sim inside glassware on a 3D bench) is a plausible future fork.

## Files

- `reference/falling-sand-alchemy-v2.html` — canonical reference. Open directly in a browser to play (note: trial persistence uses `window.storage`, a claude.ai artifact API — silently no-ops locally).
- `reference/falling-sand-alchemy-v1.html` — earlier sandbox-only version, kept for lineage.
- `ANALYSIS.md` — full teardown: what the game is, what to keep (sim core, WebGL2 bloom pipeline, discovery content, trials), what to strip (app chrome), design direction, debts, open questions.
- `STACK_RESEARCH.md` — June-2026 stack survey + ranked recommendations.

## Rules for this subtree

- The simulation core ports verbatim first, gets refactored second. Keep it pure and framework-free so it stays testable and portable to the 3D variant.
- Presentation doctrine: diegetic over chrome. No glass panels, no floating docks, no toast stacks. Ink, parchment, brass, chalk.
- Don't regress mobile (the reference's touch/viewport handling is good).
- Lab sequencing rules in `lab/CLAUDE.md` apply; this is a deliberate exception to "no new repos before inventory" per Matt's direction 2026-06-11 (first lab game).
