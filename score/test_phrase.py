# Chain validation: a 30s musical sketch through music.py -> render.py chain.
from pathlib import Path

from music import Piece, p
from render import OUT, master, render_midi

OUT.mkdir(exist_ok=True)
piece = Piece()
piece.pedal_down(0.2)

# Am9 station, sparse
piece.chord(0.5, [p("A", 1), p("E", 2)], vel=38, dur=6)
piece.n(2.2, p("C", 4), 46, 3)
piece.n(4.1, p("E", 4), 42, 3)
piece.n(6.6, p("B", 3), 39, 3)
piece.pedal_change(8.5)
piece.chord(8.5, [p("F", 1), p("C", 2), p("A", 2)], vel=36, dur=7)
piece.n(10.4, p("G", 4), 48, 3)
piece.n(13.2, p("E", 4), 41, 3)
piece.pedal_change(16.0)
piece.chord(16.0, [p("C", 2), p("G", 2)], vel=37, dur=7)
piece.n(17.8, p("E", 4), 44, 2.5)
piece.n(19.1, p("G", 4), 47, 2.5)
piece.n(21.5, p("D", 5), 52, 4)
piece.pedal_change(24.0)
piece.chord(24.0, [p("A", 1), p("E", 2), p("C", 3)], vel=40, dur=8, roll=0.05)
piece.n(26.5, p("A", 4), 45, 5)
piece.pedal_up(31.5)

piece.humanize()
midi = OUT / "test_phrase.mid"
piece.write(midi)
dry = OUT / "test_phrase_dry.wav"
render_midi(midi, dry)
master(dry, OUT / "test_phrase_master.wav")
print("done")
