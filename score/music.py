# Composition primitives. Time is in SECONDS throughout; the MIDI is written at
# 60 BPM with 960 ticks per beat, so 1 second = 1 beat = 960 ticks and note
# times line up 1:1 with video timestamps.

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path

import mido
import numpy as np

TPB = 960


@dataclass
class Note:
    t: float      # onset, seconds
    pitch: int    # MIDI note number
    vel: int      # 1..127
    dur: float    # seconds held (pedal usually carries the ring anyway)


@dataclass
class Piece:
    notes: list[Note] = field(default_factory=list)
    pedal: list[tuple[float, bool]] = field(default_factory=list)  # (t, down)
    rng: np.random.Generator = field(default_factory=lambda: np.random.default_rng(7))

    def n(self, t: float, pitch: int, vel: int, dur: float = 2.0) -> None:
        self.notes.append(Note(t, pitch, vel, dur))

    def chord(self, t: float, pitches: list[int], vel: int, dur: float = 3.0,
              roll: float = 0.028, vel_taper: int = 4) -> None:
        """Rolled chord, bottom-up; upper voices land late and slightly softer."""
        for i, p in enumerate(sorted(pitches)):
            jitter = float(self.rng.normal(0, roll * 0.25))
            self.n(t + i * roll + abs(jitter), p, max(1, vel - i * vel_taper), dur)

    def phrase(self, t: float, steps: list[tuple[float, int, int]], dur: float = 1.8) -> float:
        """Melodic line: steps are (gap_after_previous, pitch, vel). Returns end time."""
        clock = t
        for gap, pitch, vel in steps:
            clock += gap
            self.n(clock, pitch, vel, dur)
        return clock

    def pedal_change(self, t: float) -> None:
        """Lift + re-press around a harmony change (clears the wash)."""
        self.pedal.append((t - 0.06, False))
        self.pedal.append((t + 0.07, True))

    def pedal_down(self, t: float) -> None:
        self.pedal.append((t, True))

    def pedal_up(self, t: float) -> None:
        self.pedal.append((t, False))

    def humanize(self, time_sd: float = 0.012, vel_sd: float = 2.5) -> None:
        for note in self.notes:
            note.t = max(0.0, note.t + float(self.rng.normal(0, time_sd)))
            note.vel = int(np.clip(note.vel + self.rng.normal(0, vel_sd), 1, 127))

    def duration(self) -> float:
        return max((n.t + n.dur for n in self.notes), default=0.0)

    def write(self, path: Path) -> None:
        mid = mido.MidiFile(ticks_per_beat=TPB)
        track = mido.MidiTrack()
        mid.tracks.append(track)
        track.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(60), time=0))
        events: list[tuple[int, int, mido.Message]] = []  # (tick, order, msg)
        for t, down in self.pedal:
            tick = max(0, round(t * TPB))
            events.append((tick, 0, mido.Message("control_change", control=64,
                                                 value=127 if down else 0, time=0)))
        for note in self.notes:
            on = max(0, round(note.t * TPB))
            off = on + max(1, round(note.dur * TPB))
            events.append((on, 1, mido.Message("note_on", note=note.pitch, velocity=note.vel, time=0)))
            events.append((off, 2, mido.Message("note_off", note=note.pitch, velocity=0, time=0)))
        events.sort(key=lambda e: (e[0], e[1]))
        prev = 0
        for tick, _, msg in events:
            msg.time = tick - prev
            track.append(msg)
            prev = tick
        mid.save(path)


# pitch helpers
NAMES = {"C": 0, "Db": 1, "D": 2, "Eb": 3, "E": 4, "F": 5,
         "Gb": 6, "G": 7, "Ab": 8, "A": 9, "Bb": 10, "B": 11}


def p(name: str, octave: int) -> int:
    """p('A', 2) -> 45. Octave convention: A4 = 69."""
    return 12 * (octave + 1) + NAMES[name]
