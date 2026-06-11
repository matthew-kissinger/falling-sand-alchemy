# Simulation Audit & Rebuild Design

Audit of `reference/falling-sand-alchemy-v2.html` against the critique "sand doesn't mix with water, forms hard boundaries." Feeds the v0.1 build plan. Date: 2026-06-11.

## 1. Current-state map (26 elements + erase)

| Element | Class | Movement | Reactions |
|---|---|---|---|
| STONE | solid | inert | acid corrodes it |
| OBSID | solid | inert | product of quench; blast-proof |
| GLASS | solid | inert | product of vitrify; blast-proof |
| BRICK | solid | inert | product of kiln; blast-proof |
| ICE | solid | inert | thaw, crystallize seed, condensation seed, de-ice |
| WAX | solid | inert | render (→molten); acid eats it |
| SAND | powder | `trySink` | **vitrify only** |
| DIRT | powder | `trySink` | slurry (→mud), fertile (ash flag) |
| SALT | powder | `trySink` | dissolve (→brine), de-ice |
| ASH | powder | `trySink` (50%) | potash (→lye), feeds dirt fertility |
| POWDER | powder | `trySink` | detonation |
| SPORE | powder | `trySink` (40%) | germ, mycelium, cultivate |
| WATER | liquid d20 | `liquidMove` | hub: quench, evap, photo, crystallize, slurry, dissolve, germ, potash... |
| OIL | liquid d10 | `liquidMove` | ignite, flash, immiscible, saponify |
| ACID | liquid d21 | `liquidMove` | corrode, wither, neutralize, titrate |
| LAVA | liquid d30 | `liquidMove` | quench, vitrify, flash, wildfire, render, thaw, kiln, detonate, distill |
| BRINE | liquid d23 | `liquidMove` | distill, salted-earth |
| LYE | liquid d22 | `liquidMove` | titrate, saponify |
| MUD | liquid d28 | hybrid | kiln, decay |
| MWAX | liquid d25 | `liquidMove` | congeal |
| SOAP | liquid (no density!) | hand-rolled fall | scrubs oil — **no codex entry** |
| FIRE | energy | rises, fuel counter | evap, ignite, wildfire, cremate, render, thaw, detonate, marsh |
| STEAM | gas | `gasMove`, life ctr | condensation |
| SMOKE | gas | `gasMove`, life ctr | nothing — pure visual |
| GAS | gas | `gasMove`, life ctr | marsh-fire, decay product |
| PLANT | solid-ish | grows | wildfire, cremate, photo, wither, salted, decay, fertile, mycelium |

**Dead/thin elements (≤1 interaction):** SAND (ironic, for a game named after it), STONE, SMOKE, GLASS/OBSID/BRICK (terminal dead-ends), SOAP (orphan — substance with no discovery payoff).

**Orphan reactions:** soap's oil-scrub (no codex entry); dirt+ash fertility (nearly invisible); cremate only fires as a 25% sub-branch inside wildfire — a "discovery inside a discovery."

## 2. The sand/water diagnosis

Two incompatible movement models that don't share a density contract:

- Sand uses `trySink`: falls into empty/gas, swaps with ANY liquid below — but stops dead when the cell below is another grain. No diagonal-through-liquid.
- Water uses `liquidMove` with `DENSITY={WATER:20, OIL:10, ...}` — **sand has no density entry**, so water's displacement check (`isLiquid(b) && DENSITY[b] < myd`) never recognizes sand as something to flow through or around.

Net effect: a sand column in water freezes solid the instant grains stack; water pins beside it. Sand and water meet at a flat shelf, neither penetrating — the hard boundary. No wet-sand state, no settling, no suspension to soften the seam.

**The canon fix (Sandspiel / Powder Toy / Noita all do this):** one unified rule — every mobile material carries a density; a cell swap-displaces any lower-density cell below or diagonally-below. Sand (high density) rains *through* water (low) and settles on the bottom, water closing over the top. Noita devs: "to make liquids have different densities you just compare the densities... and then swap the pixels." Sandspiel adds wet/absorb states (dirt absorbs water → mud; the author calls this out as a favorite).

**Rebuild fix:** single `moveByDensity()` replacing `trySink`/`liquidMove`; fluidity parameter controls horizontal spread (high for liquids, near-zero for powders → piles); `wet` aux-bit on sand/dirt near water (darken, clump, steeper repose). One rule makes oil-on-water, brine-sinking (distill trial), and mud-settling all just work.

## 3. Proposed element roster (alchemy-coherent)

Through-line is **transmutation**: map the roster onto the real alchemical ontology — four classical elements, the **tria prima** (sulphur / mercury / salt), metals, the acid-base (vitriol/alkali) axis. Every paintable element gets ≥2 reactions; terminal products exist but come off the hotbar.

- **KEEP (12):** water, oil, fire, steam, lava, sand, salt, plant, spore, acid, lye, ice.
- **KEEP-BUT-REROLE (5):** dirt→earth/clay chain (merge dirt+mud+brick into clay→mud→fired ceramic), ash (potash hub), gunpowder→**sulphur** (same detonation + tria prima role), brine, wax→resin/wax.
- **CUT/MERGE (6):** SMOKE (fold into steam/ash visuals), SOAP off hotbar (becomes a product WITH a codex entry), OBSID/GLASS/BRICK stay as products but off the hotbar, GAS folded or given a second reaction.
- **ADD:**

| New | Class | Role | Key reactions |
|---|---|---|---|
| Mercury | very dense liquid | tria prima liquid metal | +sulphur→cinnabar; +gold→amalgam; sinks below all |
| Sulphur | powder | the combustible principle | +fire→detonate; +mercury+salt→Tria Prima capstone |
| Iron (base metal) | solid powder | the metal to transmute | +acid→rust; +lava→molten metal; molten+water→quench-cast |
| Gold | dense solid | the telos | product of philosopher's-stone capstone; inert, glints |
| Aqua Vitae (spirit) | light volatile liquid | distillation product | burns blue; wine/brine+heat→distill |
| Air/aether (optional) | gas | 4th classical element | feeds/intensifies fire |

**Resulting graph:** three crossing axes — thermal (fire/lava ↔ ice/water ↔ steam), acid-base (vitriol ↔ alkali → titration), and the NEW tria-prima/metals spine ending in a real multi-step **Magnum Opus recipe** (calcine → dissolve → conjoin → coagulate into gold). ~20 paintable + ~6 product-only: leaner than today's 26, every paintable ≥2 interactions, codex becomes a tree with a visible final goal instead of a flat list of 33.

## 4. Ranked physics improvements (feel vs cost, typed-array ~512²)

| Rank | Improvement | Payoff | Cost | Notes |
|---|---|---|---|---|
| 1 | Unified density displacement | Very high — fixes the #1 complaint | Low | One `moveByDensity`; delete the split. Do first. |
| 2 | Wet/saturation aux-bit on powders | High — sand darkens/clumps, mud emerges | Low | 1 bit; water-adjacency; modulate repose + color |
| 3 | Temperature as a propagated field | High — replaces ~6 ad-hoc counters (fire fuel, steam life, distill) with one coherent system; boiling/freezing/glow become emergent | Medium | Temp array + cheap 4-neighbor diffusion; phase thresholds. Biggest coherence win — v0.2 headline. |
| 4 | Dissolution/concentration (saturation → precipitate) | Med-high | Medium | Per-liquid solute counter in aux |
| 5 | Liquid pressure/equalization (water finds level) | Medium | Med-high | Matters for bench-of-glassware framing; can fake with spread + settle sweep |
| 6 | Gas pressure/buoyancy field | Low-med | High | Defer; temp field (rank 3) gets 80% free |

Ship 1-2 in v0.1; rank 3 is the v0.2 headline.

## 5. Meta-layer implications (sandbox-free + trials-secondary directive)

- **Rip all gating out of sandbox:** `allowedFor`/`allowedNow`/`sandboxAllowed`/`refreshHotbar` blocking, `lockedNudge`, `.dis` chips — gone. Full palette always paintable. Unlock chains exist only inside trial mode as scenario constraints.
- **Codex persists independently** of trials, in `localStorage` (currently the `found` set resets on reload and trial progress uses the non-existent `window.storage`). Discovery is the always-on reward layer across both modes.
- **Trials become curated, independently-selectable scenarios** with win-conditions + achievement hooks (first-clear, no-erase, speed) — keep the lock-zone + target-reaction mechanic and vessel `build()`/`zone`/`hint` data shape, drop `give[]` and the linear `prog` math. A trial poses a constraint puzzle ("achieve quench using only what's on the bench"), not an element ransom.
- **Capstone reframe:** Magnum Opus = completing the Great Work (the gold recipe), pursuable in free sandbox — not "found all 33 flat entries."
- **Hotbar at ~20 reagents:** the diegetic shelf-of-phials scales better than a scrolling chip row — group by alchemical class (classical / tria prima / metals / salts & solutions).

Bottom line for v0.1: (1) one density-driven movement rule, (2) ungated sandbox + localStorage codex, (3) re-spined roster with gold capstone, (4) data-driven reaction rule table so the richer graph stays cheap to author. Temperature field is v0.2.

Sources: [Sandspiel info](https://sandspiel.club/info/), [Making Sandspiel](https://maxbittker.com/making-sandspiel/), [Powder Toy elements wiki](https://powdertoy.co.uk/Wiki/W/Category:Elements.html), [Noita density](https://noita.wiki.gg/wiki/Density), [Noita materials](https://noita.wiki.gg/wiki/Materials).
