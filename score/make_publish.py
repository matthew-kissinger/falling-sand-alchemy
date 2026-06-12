# Build the publish package from the finished master + timeline.json:
#   - 5 full-res thumbnail PNGs pulled at hero moments (caption-free where it can)
#   - docs/UPLOAD_COPY.md: titles, description, chapter timestamps, tags
#
#   uv run make_publish.py
#
# Chapters come straight from the scene boundaries in timeline.json, so they
# stay correct whatever the final runtime is. Thumbnails are pulled from the
# 4K master (bloom + vignette baked in) at moments chosen to land between
# captions.

import json
import subprocess
from pathlib import Path

HERE = Path(__file__).parent
ROOT = HERE.parent
TIMELINE = ROOT / "video-out" / "timeline.json"
MASTER = ROOT / "video-out" / "falling-sand-alchemy-master.mp4"
SILENT = ROOT / "video-out" / "showcase-silent.mp4"
THUMBS = ROOT / "video-out" / "thumbnails"
DOCS = ROOT / "docs"
GAME_URL = "https://matthew-kissinger.github.io/falling-sand-alchemy/"


def mmss(sec: float) -> str:
    s = int(round(sec))
    return f"{s // 60}:{s % 60:02d}"


def grab(src: Path, t: float, dest: Path) -> None:
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
                    "-ss", f"{t:.2f}", "-i", str(src), "-frames:v", "1",
                    "-q:v", "1", str(dest)], check=True)


def hero_times(scenes: list[dict]) -> list[tuple[str, float]]:
    """Pick caption-free hero moments: scene event peaks, else scene midpoints."""
    by = {s["title"]: s for s in scenes}

    def near_caption(s: dict, t: float, guard: float = 1.4) -> bool:
        return any(abs(t - c["at"]) < guard for c in s.get("captions", []))

    picks: list[tuple[str, float]] = []

    def add(title: str, ev_keys: list[str], frac_fallback: float,
            ev_offset: float = 1.0, nudge: bool = True) -> None:
        s = by.get(title)
        if not s:
            return
        t = None
        for k in ev_keys:
            if k in s.get("events", {}):
                t = float(s["events"][k]) + ev_offset
                break
        if t is None:
            t = s["start"] + (s["end"] - s["start"]) * frac_fallback
        # nudge off any caption (skipped for action peaks: the barrage and the
        # burn are seconds long and captioned throughout - nudging walks the
        # pick into the aftermath, and a caption in a thumbnail is fine)
        if nudge:
            for _ in range(6):
                if not near_caption(s, t):
                    break
                t += 0.8
        picks.append((title, min(t, s["end"] - 0.3)))

    # chosen for thumbnail strength: large, legible, colourful subjects. The
    # opus close-up is skipped here (small subject) - the Great Work is better
    # represented by the spectacle scenes.
    add("The Mountain Wakes", ["detonate"], 0.5, ev_offset=1.0, nudge=False)
    add("Wildfire", ["wildfire"], 0.55, ev_offset=0.8, nudge=False)
    add("The Powder Keg Cathedral", ["detonate"], 0.45, ev_offset=0.6, nudge=False)
    add("Firedamp", ["detonate"], 0.55, ev_offset=1.2, nudge=False)
    add("The Vines", ["wildfire"], 0.5, ev_offset=1.0, nudge=False)
    add("The Hourglass, Corrupted", [], 0.62)
    return picks


def main() -> None:
    timeline = json.loads(TIMELINE.read_text())
    scenes = timeline["scenes"]
    total = timeline["totalSec"]
    src = MASTER if MASTER.exists() else SILENT
    THUMBS.mkdir(parents=True, exist_ok=True)
    DOCS.mkdir(exist_ok=True)

    # thumbnails
    for i, (title, t) in enumerate(hero_times(scenes), 1):
        dest = THUMBS / f"thumb_{i}_{title.split(',')[0].replace(' ', '_').lower()}.png"
        grab(src, t, dest)
        print(f"thumb {i}: {title} @ {t:.1f}s -> {dest.name}")

    # chapters (first must be 0:00)
    chapters = []
    for i, s in enumerate(scenes):
        start = 0.0 if i == 0 else s["start"]
        chapters.append(f"{mmss(start)} {s['title']}")
    chapter_block = "\n".join(chapters)

    copy = f"""# Falling Sand Alchemy - YouTube upload copy

Runtime: {mmss(total)}  |  Master: video-out/falling-sand-alchemy-master.mp4 (4K, H.264, -14 LUFS)

## Title options
1. Falling Sand Alchemy - a cellular automaton, performed
2. I built a falling-sand alchemy game. Every frame here is the real engine.
3. Falling Sand Alchemy: from a grain of sand to the Magnum Opus

## Description
Every pixel in this film is a live cellular-automaton simulation - no compositing,
no after-effects, no rendered overlays. The same engine you can play in your
browser drew each frame: a stratified volcano waking by the sea, a firedamp
whoomph bringing a meadow down into the old mine workings, fire climbing every
limb of gardens and great looping vines, three powder kegs answering one stroke
of lava, and the four-stage alchemical Great Work resolving, at last, into gold.

Play it (free, in-browser, no install):
{GAME_URL}

Built with TypeScript over a pure, framework-free simulation core; the soundtrack
is a single through-composed felt-piano piece built around one recurring theme.
Made in the open.

## Chapters
{chapter_block}

## Tags
falling sand, cellular automaton, falling sand game, powder game, alchemy game,
indie game, sandbox, simulation, pixel art, generative, TypeScript, WebGL,
game dev, devlog, zen, ambient piano, the great work, magnum opus
"""
    (DOCS / "UPLOAD_COPY.md").write_text(copy, encoding="utf-8")
    print(f"wrote {DOCS / 'UPLOAD_COPY.md'}")


if __name__ == "__main__":
    main()
