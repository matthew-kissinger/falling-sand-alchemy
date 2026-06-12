# Compose the showcase score: one through-composed felt-piano piece in
# A minor / C major built around a single recurring theme, in the grammar of
# C418's Minecraft pieces (Sweden, Wet Hands) fused with our alchemy arc.
#
#   uv run compose.py          # reads ../video-out/timeline.json, writes out/score.mid
#   uv run compose.py --print  # also dump the section plan it built
#
# What keeps it in tune, on the beat, and symmetric:
#
# - ONE GLOBAL PULSE. 60 BPM, 1 beat = 1 second. Every scene's bar-zero is an
#   integer second nearest its cut, so the quarter-note pulse never breaks
#   across the whole film and every downbeat lands on (or a breath before) a
#   scene cut - nothing enters late.
# - A CONSTANT ARPEGGIO LEFT HAND (the Wet Hands device). Quarter-note broken
#   chords in calm scenes, eighth-note rise-and-fall in flowing ones; the root
#   is always exactly on the downbeat. The pulse is played, not implied.
# - ONE THEME, STATED AND RESTATED (the Sweden device). An 8-bar period:
#   a 4-bar antecedent over Am-Dm-G-C (descending fifths) that ends on the
#   relative major - the wistful non-resolution - and a 4-bar consequent over
#   F-G-Am that answers home. The film opens with the full period split
#   across its first two scenes, develops the head motif, recapitulates the
#   antecedent an octave up in C major (the reef), and states the full period
#   one last time over the Magnum Opus with the consequent re-harmonized to
#   end in C major: the Work transformed.
# - SYMMETRIC THEORY, NOT DICE. The melody is fixed, diatonic (white keys),
#   every long note a chord tone; non-chord tones are short, weak-beat, and
#   resolve by step (the bar-3 C over G is a 4-3 suspension into the next
#   bar). The consequent opens on E over F - the major-7th entry Wet Hands
#   opens with. No RNG chooses pitches or rhythms anywhere.
# - Structural film events (corrosion, ignition, detonation, the dam, the
#   gold) are caught by accents quantized to whole beats.

from __future__ import annotations

import json
import sys
from pathlib import Path

from music import Piece, p

HERE = Path(__file__).parent
TIMELINE = HERE.parent / "video-out" / "timeline.json"
OUT = HERE / "out"

BAR = 4.0

# ── harmony: white-key chords, left-hand arpeggio geometry ───────────────────

ROOT = {"Am": p("A", 2), "F": p("F", 2), "C": p("C", 3), "G": p("G", 2), "Dm": p("D", 3)}
TENTH = {"Am": 15, "Dm": 15, "C": 16, "F": 16, "G": 16}  # the third, an octave up
CREST = {"Am": 19, "F": 19, "C": 19, "G": 19, "Dm": 15}  # arpeggio peak (Dm capped
# at the tenth so its crest stays clear of the melody's low A4)

# ── the theme ────────────────────────────────────────────────────────────────
# Cells are one bar of melody: (beat-in-bar, midi, hold). The antecedent
# (A0..A3) sings E-C-D / A-D-E / D-B-C / C over Am-Dm-G-C; the consequent
# (B0..B3) opens with the same cell re-grounded on F (E = the major 7th),
# then B-D-C / C-B-A / A over G-Am-Am. D0 is the head sequenced down to Dm
# for developments. B2M/B3M are the major ending for the apotheosis.

MEL: dict[str, list[tuple[float, int, float]]] = {
    "A0": [(0, 76, 2.0), (2, 72, 1.0), (3, 74, 1.9)],
    "A1": [(0, 69, 2.0), (2, 74, 1.0), (3, 76, 1.9)],
    "A2": [(0, 74, 2.0), (2, 71, 1.0), (3, 72, 1.9)],
    "A3": [(0, 72, 3.6)],
    "B0": [(0, 76, 2.0), (2, 72, 1.0), (3, 74, 1.9)],
    "B1": [(0, 71, 2.0), (2, 74, 1.0), (3, 72, 1.9)],
    "B2": [(0, 72, 2.0), (2.5, 71, 0.5), (3, 69, 1.9)],
    "B3": [(0, 69, 3.6)],
    "D0": [(0, 74, 2.0), (2, 69, 1.0), (3, 72, 1.9)],
    "B2M": [(0, 76, 2.0), (2, 74, 1.0), (3, 72, 1.9)],
    "B3M": [(0, 72, 3.6)],
}

# ── the section plan ─────────────────────────────────────────────────────────
# One entry per scene. z = bar-zero (integer second nearest the cut; Settling
# elides at 16 so the antecedent's C resolution IS its opening downbeat, and
# Hourglass/Candle continue that same 4-second bar phase unbroken to 77.92).
# bars: (beat offset from z, chord, melody cell). A cell is a name, or
# (name, transpose, vel_bias). mode: calm = quarter-note left hand, flow =
# eighth-note. mel_double: ("up"|"down", from_offset) doubles the melody an
# octave away from that bar offset on - the Sweden octave restatement.

PLAN: list[dict] = [
    {"title": "Falling Sand", "z": 0, "mode": "calm", "vel": 44,
     "bars": [(0, "Am", None), (4, "Am", "A0"), (8, "Dm", "A1"), (12, "G", "A2")]},
    # the hook: the antecedent's C resolution lands ON the volcano's cut
    # (elision), then the ground turns minor while the mountain works
    {"title": "The Mountain Wakes", "z": 16, "mode": "flow", "vel": 56,
     "bars": [(0, "C", "A3"), (4, "Am", None), (8, "Dm", "D0"), (12, "Am", None)]},
    {"title": "The Settling", "z": 31, "mode": "calm", "vel": 48,
     "bars": [(0, "F", "B0"), (4, "G", "B1"), (8, "Am", "B2"), (12, "Am", "B3"), (16, "F", None)]},
    {"title": "The Hourglass, Corrupted", "z": 51, "mode": "calm", "vel": 52,
     "bars": [(0, "Am", None), (4, "Am", "A0"), (8, "Dm", None), (12, "Dm", "D0"),
              (16, "Am", None), (20, "Am", None)]},
    {"title": "The Candle That Remembers", "z": 73, "mode": "calm", "vel": 50,
     "bars": [(0, "F", "B0"), (4, "G", "B1"), (8, "Am", "B2"), (12, "Am", "B3"), (16, "F", None)]},
    {"title": "Wildfire", "z": 92, "mode": "flow", "vel": 58,
     "bars": [(0, "C", ("A0", 12, -6)), (4, "F", None), (8, "Am", ("A0", 0, 8)),
              (12, "Dm", "A1"), (16, "F", None), (20, "C", ("A0", 12, -8))]},
    {"title": "The Powder Keg Cathedral", "z": 115, "mode": "calm", "vel": 62, "dark": True,
     "bars": [(0, "Am", None), (4, "Am", None), (8, "F", "B0")]},
    {"title": "The Distillery", "z": 129, "mode": "calm", "vel": 42,
     "bars": [(0, "Dm", None), (4, "Dm", ("D0", 0, -4)), (8, "Am", None),
              (12, "Am", None), (16, "Am", None)]},
    # the mine: low, sparse, dark - the wisp and the blast are the voice
    {"title": "Firedamp", "z": 149, "mode": "calm", "vel": 50, "dark": True,
     "bars": [(0, "Am", None), (4, "Am", ("D0", 0, -4)), (8, "Dm", None), (12, "Am", None)]},
    {"title": "Obsidian Reef", "z": 166, "mode": "flow", "vel": 56, "mel_double": ("down", 0),
     "bars": [(0, "C", None), (4, "C", ("A0", 12, 0)), (8, "F", ("A1", 12, 0)),
              (12, "G", ("A2", 12, 0)), (16, "C", ("A3", 12, 0)), (20, "F", None)]},
    # the vines: the consequent, tender, while they grow and burn and one
    # is kept - the maj7 entry over F is the scene's whole mood
    {"title": "The Vines", "z": 189, "mode": "flow", "vel": 52,
     "bars": [(0, "F", "B0"), (4, "G", "B1"), (8, "Am", "B2"), (12, "Am", "B3")]},
    {"title": "The Dam Break", "z": 206, "mode": "flow", "vel": 58,
     "bars": [(0, "Dm", None), (4, "G", None), (8, "Dm", "D0"), (12, "G", None),
              (16, "F", "B0"), (20, "G", None)]},
    {"title": "The Magnum Opus, Performed", "z": 228, "mode": "flow", "vel": 62, "mel_double": ("up", 16),
     "bars": [(0, "Am", "A0"), (4, "Dm", "A1"), (8, "G", "A2"), (12, "C", "A3"),
              (16, "F", "B0"), (20, "G", "B1"), (24, "C", "B2M"), (28, "C", "B3M")]},
    {"title": "Falling Sand Alchemy", "z": 260, "mode": "calm", "vel": 40,
     "bars": [(0, "Am", "A0"), (4, "C", "A3"), (8, "C", None)]},
]


def lay_bar(pc: Piece, bt: float, name: str, mode: str, vel: int,
            dark: bool, trim: float) -> None:
    """One bar of left hand: pedal cleared on the downbeat, root exactly on
    the beat, broken chord through the bar. Never rolled - the pulse is dry."""
    r = ROOT[name]
    pc.pedal_change(bt)
    if dark:
        pc.n(bt, r - 12, vel + 2, dur=BAR * 1.4)
    if mode == "flow":
        steps = [0, 7, 12, TENTH[name], CREST[name], TENTH[name], 12, 7]
        vels = [vel, vel - 9, vel - 6, vel - 8, vel - 4, vel - 9, vel - 7, vel - 10]
        gap = 0.5
        dur = 1.5
    else:
        steps = [0, 7, TENTH[name], 7]
        vels = [vel, vel - 9, vel - 6, vel - 10]
        gap = 1.0
        dur = 2.3
    for i, (iv, v) in enumerate(zip(steps, vels)):
        t = bt + i * gap
        if t >= trim:
            break
        pc.n(t, r + iv, max(20, v), dur=dur)


def lay_cell(pc: Piece, bt: float, cell: str, transpose: int, mvel: int,
             double: int | None, trim: float) -> None:
    """One bar of melody from a theme cell; optional octave doubling."""
    for j, (beat, pitch, hold) in enumerate(MEL[cell]):
        t = bt + beat
        if t >= trim:
            break
        v = mvel if j == 0 else mvel - 6
        pc.n(t, pitch + transpose, max(24, min(84, v)), dur=hold)
        if double is not None:
            pc.n(t, pitch + transpose + double, max(22, min(84, v - 11)), dur=hold)


def accent_low(pc: Piece, t: float, vel: int, root: int) -> None:
    """A dark, contained low strike (corrosion, ignition, detonation, the dam).
    Quantized to a whole beat; the answering fifth lands on the next beat."""
    t = round(t)
    pc.pedal_change(t)
    pc.n(t, root, vel, dur=6.0)
    pc.n(t, root + 12, max(24, vel - 6), dur=6.0)
    pc.n(t + 1.0, root + 19, max(28, vel - 16), dur=5.0)


def accent_glint(pc: Piece, t: float, vel: int = 46) -> None:
    """A high glass gleam (vitrified sand, the salt crystal)."""
    t = round(t)
    pc.n(t, 88, vel, dur=3.5)
    pc.n(t + 1.0, 84, max(24, vel - 6), dur=3.0)


def the_gold(pc: Piece, t: float) -> None:
    """Coagulation: a luminous C-major strike; the consequent that follows
    carries the theme home in the major."""
    t = round(t)
    pc.pedal_change(t)
    pc.n(t, p("C", 2), 62, dur=8.0)
    pc.n(t, p("C", 3), 56, dur=8.0)
    pc.chord(t + 1.0, [p("G", 3), p("E", 4), p("C", 5)], 50, dur=7.0, roll=0.04)
    pc.n(t + 2.0, 88, 56, dur=6.0)


def event_time(scene: dict, keys: list[str]) -> float | None:
    ev = scene.get("events", {})
    for k in keys:
        if k in ev:
            return float(ev[k])
    return None


def build(timeline: dict, do_print: bool = False) -> Piece:
    pc = Piece()
    scenes = timeline["scenes"]
    total = float(timeline["totalSec"])
    by_title = {sc["title"]: sc for sc in scenes}

    plan_dump = []
    for i, sec in enumerate(PLAN):
        sc = by_title.get(sec["title"])
        if not sc:
            continue
        z = float(sec["z"])
        z_next = float(PLAN[i + 1]["z"]) if i + 1 < len(PLAN) else total
        end = float(sc["end"])
        trim = min(end - 0.3, z_next - 0.25, total - 0.5)
        dark = bool(sec.get("dark"))
        dbl = sec.get("mel_double")
        for off, chord, cell in sec["bars"]:
            bt = z + off
            if bt >= trim:
                break
            lay_bar(pc, bt, chord, sec["mode"], sec["vel"], dark, trim)
            if cell is not None:
                name, transpose, bias = (cell, 0, 0) if isinstance(cell, str) else cell
                mvel = sec["vel"] + 16 + bias
                double = None
                if dbl is not None and off >= dbl[1]:
                    double = 12 if dbl[0] == "up" else -12
                lay_cell(pc, bt, name, transpose, mvel, double, trim)
        plan_dump.append((sec["title"], z, round(z - float(sc["start"]), 2),
                          len(sec["bars"])))

    # structural accents, synced to the film and quantized to whole beats
    def ev(title: str, keys: list[str]) -> float | None:
        return event_time(by_title[title], keys) if title in by_title else None

    t = ev("The Mountain Wakes", ["flash"])
    if t:
        accent_low(pc, t, 56, p("D", 2))
    t = ev("The Mountain Wakes", ["detonate"])
    if t:
        accent_low(pc, t, 74, p("A", 1))
    t = ev("The Hourglass, Corrupted", ["corrode"])
    if t:
        accent_low(pc, t, 54, p("D", 2))
    t = ev("Wildfire", ["ignite"])
    if t:
        accent_low(pc, t, 64, p("A", 1))
    t = ev("The Powder Keg Cathedral", ["detonate"])
    if t:
        accent_low(pc, t, 76, p("A", 1))
    t = ev("The Powder Keg Cathedral", ["vitrify"])
    if t:
        accent_glint(pc, t + 1.0)  # a beat after the boom (they round together now)
    t = ev("The Distillery", ["crystal"])
    if t:
        accent_glint(pc, t, 34)
    t = ev("Firedamp", ["marsh"])
    if t:
        accent_glint(pc, t, 36)  # the wisp: a pale gleam, then -
    t = ev("Firedamp", ["detonate"])
    if t:
        accent_low(pc, t, 72, p("A", 1))
    t = ev("The Vines", ["wildfire"])
    if t:
        accent_low(pc, t, 56, p("A", 2))
    t = ev("The Dam Break", ["immis"])
    if t:
        accent_low(pc, t, 76, p("D", 2))
    t = ev("The Magnum Opus, Performed", ["calcine"])
    if t:
        accent_low(pc, t, 50, p("D", 2))
    t = ev("The Magnum Opus, Performed", ["coagulate"])
    if t:
        the_gold(pc, t)

    # the last gleam: a high E over the end card's C, left to ring into the fade
    pc.n(round(total - 8.0), 88, 38, dur=7.0)
    pc.pedal_up(total - 0.45)

    # barely-there humanization: life in the velocities, the grid stays a grid
    pc.humanize(time_sd=0.004, vel_sd=1.8)
    pc.notes.sort(key=lambda nn: nn.t)

    if do_print:
        print(f"total video: {total:.1f}s   piece notes: {len(pc.notes)}   piece end: {pc.duration():.1f}s")
        for row in plan_dump:
            print("  ", row)
    return pc


def main() -> None:
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    path = Path(args[0]) if args else TIMELINE
    if not path.exists():
        raise SystemExit(f"missing {path} - run the recorder (assemble) first")
    timeline = json.loads(path.read_text())
    OUT.mkdir(exist_ok=True)
    pc = build(timeline, do_print="--print" in sys.argv)
    pc.write(OUT / "score.mid")
    print(f"wrote {OUT / 'score.mid'}  ({len(pc.notes)} notes, {pc.duration():.1f}s)")


if __name__ == "__main__":
    main()
