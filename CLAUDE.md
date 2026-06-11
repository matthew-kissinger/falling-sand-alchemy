# Falling-Sand Alchemy — first game out of the lab

Status: research surface (2026-06-11). No code yet — scaffold happens after stack alignment with Matt.

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
