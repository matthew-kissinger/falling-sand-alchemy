# Falling-Sand Alchemy — first game out of the lab

Status: v0.1.0 RELEASED (2026-06-11) — https://github.com/matthew-kissinger/falling-sand-alchemy/releases/tag/v0.1.0 with web zip + Windows NSIS installer + Android debug APK. PWA service worker live (offline + installable). Target ladder + per-platform build commands in `docs/SHIPPING.md`; portable JDK at `~/tools/jdk-21.0.11+10`. itch.io: butler is authenticated, page creation is Matt's web-UI step, then one butler push. All seven build steps from `docs/PLAN.md` landed in one pass: pure sim core (34 elements, unified `moveByDensity`, data-driven rule table, 40-discovery codex, Magnum Opus chain), WebGL2 renderer port + 2D fallback, Tone.js generative audio, diegetic chrome (desktop apothecary cabinet / mobile phial strip, in-flow parchment codex, native dialogs), 11 trials with achievements, localStorage persistence behind `src/platform/`. 18 Vitest sim tests green. Deployed via GitHub Pages (`.github/workflows/deploy.yml`): https://matthew-kissinger.github.io/falling-sand-alchemy/. Design note from Matt mid-build: first chrome pass was too close to the prototype's mobile dock and ignored PC ergonomics — redesigned to responsive cabinet/strip split; keep both form factors first-class from here on.

## What this is

A falling-sand cellular automaton with an alchemy discovery meta-layer (40 reactions, codex, 11 trial scenarios). Arrived as two single-file HTML downloads; rebuilt as a proper web app with a diegetic laboratory presentation. 2D now; a 3D variant (sim inside glassware on a 3D bench) is a plausible future fork.

## Layout

- `src/` — the game: `sim/` (pure core), `render/`, `audio/`, `ui/`, `platform/`
- `docs/` — design + ops docs: `PLAN.md` (locked decisions), `SHIPPING.md` (target ladder), `ANALYSIS.md`, `SIM_AUDIT.md`, `AUDIO_RESEARCH.md`, `STACK_RESEARCH.md`
- `reference/` — the two prototype HTML files; v2 is canonical (its trial persistence used `window.storage`, a claude.ai artifact API — silently no-ops locally)
- `src-tauri/` — Tauri 2 desktop shell; `android/` — Capacitor 8 project
- `.github/workflows/deploy.yml` — test-gated Pages deploy on every push to main

## Rules for this subtree

- The simulation core stays pure and framework-free (no DOM/audio imports in `src/sim/`) so it remains testable and portable to the 3D variant.
- Presentation doctrine: diegetic over chrome. No glass panels, no floating docks, no backdrop-blur. Ink, parchment, brass, chalk. Desktop and mobile are both first-class: cabinet on wide screens, thumb strip on narrow.
- Sandbox is never gated; trials only teach.
- Keep `package.json`, `src-tauri/tauri.conf.json`, and Android versionName in step when releasing; tag `vX.Y.Z` + `gh release create` with artifacts.
- Lab sequencing rules in `lab/CLAUDE.md` apply; this is a deliberate exception to "no new repos before inventory" per Matt's direction 2026-06-11 (first lab game).
