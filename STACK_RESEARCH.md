# Stack Research — June 2026

Survey for a canvas/WebGL2 falling-sand game with diegetic "alchemist's lab" chrome. TS-first, Vite-native, anti-glassmorphism.

## Headlines

- **Vite 8** (Mar 2026, Rolldown default, 4-20x faster builds). Current 8.0.16. Vite stays the default scaffold; VoidZero→Cloudflare acquisition (Jun 2026) is a non-event with a neutrality pledge.
- **Vitest 4** (Oct 2025) — Browser Mode stable. Test sim rules headlessly as pure functions; test chrome in real Chromium.
- **WebGPU is Baseline as of Jan 2026** (Chrome/Firefox/Safari 26 all on by default). Still needs a WebGL2 fallback (Firefox Android flagged, Safari needs latest OS). Treat as a v2 spectacle upgrade, not the foundation.
- **Platform-native UI is the quiet revolution.** `<dialog>` + top layer, Popover API, **CSS Anchor Positioning (Baseline 2026)**, Declarative Shadow DOM, container queries, `@scope`, View Transitions — together cover ~90% of what Radix/Floating UI existed for. For a single-aesthetic diegetic UI this is a complete no-framework toolkit.

## UI layer for game chrome

The framework is a guest in a canvas app — the sim owns the rAF loop. That favors minimal runtime + easy imperative interop.

- **Svelte 5** (runes): 2-5 KB gzipped vs React's ~42 KB. Runes work in plain `.svelte.ts` (reactive sim state without components); `@attach` directive gives clean canvas interop. Ecosystem fully settled in 2026. **Best framework fit.**
- **Vanilla TS / Lit web components**: genuinely viable now that the platform provides dialog/popover/anchoring. For ~5 surfaces (codex, hotbar, modals, toasts, HUD), hand-rolling state→DOM sync is an afternoon. **Best for "aesthetic is the product."**
- **React 19.2** + Compiler 1.0: mature, but wrong shape and weight here; Tailwind+Radix is the gravitational center of the exact AI-generic look to avoid.
- **Solid 2.0**: still Beta (Mar 2026) — bad timing to start on it.

## Styling

Consensus for a bespoke single-aesthetic project: **modern vanilla CSS**, not Tailwind. Native nesting, `@layer`, custom properties, `:has()`, container queries, `color-mix()`, anchor positioning cover everything a one-person art-directed UI needs. **Open Props** for tokens (parchment/brass/verdigris). SVG filters (`feTurbulence`) for parchment grain / brass bevels — naturally expressed in handwritten CSS, awkward as utility classes. Tailwind's defaults (rounded-xl, shadow-lg, backdrop-blur) ARE the AI-generic look.

## Component libraries

Beyond shadcn/Radix: **Base UI 1.5** (React-only, MUI team), **Ark UI** (framework-agnostic, on Zag.js), **Zag.js** directly (framework-free state machines). Honest consensus for diegetic game UI: **roll your own** — an alchemist's hotbar and codex aren't conventional widgets; native dialog/popover already solve the hard a11y. Lift a single Zag machine only if one gnarly widget (searchable codex) appears.

## Falling-sand performance

1. **Typed-array CPU sim (current reference's approach)** — with chunking + dirty rects, ~512²-1024² at 60fps single-thread. Decisive advantage: **arbitrary N-ary reaction rules are trivial** — exactly what alchemy needs. This is the right foundation.
2. **Rust→WASM** (Sandspiel architecture) — 2-4x grid area, predictable frames; ~2048² with threads. Port the hot loop here only if profiling demands it.
3. **GPU compute (WebGPU / fragment ping-pong, Margolus blocks)** — 4096²+, fill-rate-bound. But complex multi-cell reaction chains + per-cell RNG are far harder in shader-parallel form (Noita itself is CPU for this reason). v2 spectacle.

Study repos: [MaxBittker/sandspiel](https://github.com/MaxBittker/sandspiel), [Sandspiel Studio](https://studio.sandspiel.club/), [GelamiSalami/GPU-Falling-Sand-CA](https://github.com/GelamiSalami/GPU-Falling-Sand-CA) (block-CA + JFA 2D lighting), [meatbatgames GPU postmortem](https://meatbatgames.com/blog/falling-sand-gpu/).

## Distribution

itch.io HTML5: zip with `index.html` at root, **`base: './'` in vite.config** (absolute paths 403 on itch), <1000 files, ≤240-char paths. Enable SharedArrayBuffer in project settings if going multithreaded WASM later.

## Ranked recommendations

**#1 — "Platform-native lab bench": Vite 8 + vanilla TS (or Lit) + handwritten modern CSS + typed-array sim → WebGL2.**
Zero framework runtime; dialog/popover/anchor cover modals/tooltips natively; handwritten CSS is the most direct route to a non-generic diegetic look. Cost: hand-rolled state→DOM sync, more CSS craft.

**#2 — "Svelte 5 chrome": same sim core, panels/hotbar/codex in Svelte 5 runes + vanilla CSS (Open Props).**
Best DX-per-KB; runes bridge sim↔UI elegantly; `@attach` for canvas. Cost: new framework (small tax), slight risk of app-structure creep.

**#3 — "Ship-fast React": React 19.2 + Base UI + Tailwind custom theme.**
Muscle memory, fastest to working. Cost: 40KB+ runtime for chrome that doesn't need it, and the tools pull toward the exact look we're avoiding.

**Recommendation: #1 or #2.** The sim core is pure TS and identical across all three — scaffold it framework-agnostic, decide chrome at alignment. CPU sim ~512², WebGL2 blit, WebGPU later. Spend the saved complexity budget on `feTurbulence` parchment and brass.
