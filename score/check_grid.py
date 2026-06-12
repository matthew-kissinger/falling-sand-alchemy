# One-shot audit of the composed score: every onset must sit on the half-beat
# grid (within humanize tolerance), long melody notes must be chord tones of
# the bar they sound in, and downbeat roots must be present every laid bar.
import json
from pathlib import Path

from compose import MEL, PLAN, ROOT, build

timeline = json.loads((Path(__file__).parent.parent / "video-out" / "timeline.json").read_text())
pc = build(timeline)

# grid adherence
off_grid = [n for n in pc.notes if abs(n.t * 2 - round(n.t * 2)) > 0.03]
print(f"notes: {len(pc.notes)}  off-grid(>15ms from half-beat): {len(off_grid)}")
for n in off_grid[:8]:
    print(f"  t={n.t:.3f} pitch={n.pitch}")

# bar map from the plan
TONES = {"Am": {9, 0, 4}, "F": {5, 9, 0, 4}, "C": {0, 4, 7, 11}, "G": {7, 11, 2}, "Dm": {2, 5, 9, 0}}
bars = []
for i, sec in enumerate(PLAN):
    z = sec["z"]
    for off, chord, cell in sec["bars"]:
        bars.append((z + off, chord))
bars.sort()

def chord_at(t):
    cur = None
    for bt, ch in bars:
        if t >= bt - 0.05:
            cur = ch
    return cur

# long (>=1.5s) notes above the left hand should be chord tones (maj7/9 allowed via TONES)
bad = []
for n in pc.notes:
    if n.dur >= 1.5 and n.pitch >= 69:
        ch = chord_at(n.t)
        if ch and n.pitch % 12 not in TONES[ch] and n.pitch % 12 not in {2, 9}:  # 9ths breathe
            bad.append((round(n.t, 1), n.pitch, ch))
print(f"long high notes off-chord: {len(bad)}")
for row in bad[:10]:
    print("  ", row)

# every bar has its root on the downbeat
missing = []
for bt, ch in bars:
    hit = [n for n in pc.notes if abs(n.t - bt) < 0.05 and n.pitch % 12 == ROOT[ch] % 12]
    if not hit:
        missing.append((bt, ch))
print(f"bars missing downbeat root: {len(missing)}  {missing[:6]}")
