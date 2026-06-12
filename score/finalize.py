# Final master: two-pass EBU R128 loudness-normalise the score, then mux it onto
# the silent 4K video with a broadcast-sane AAC track and +faststart.
#
#   uv run finalize.py
#
# Two-pass loudnorm (measure, then apply with the measured values) lands the
# integrated loudness on -14 LUFS with true peak under -1 dBTP — the YouTube
# target — without the pumping a single-pass linear=false would add. The video
# stream is copied (no re-encode of the 4K master); only audio is written.

import json
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).parent
OUT = HERE / "out"
VIDEO = HERE.parent / "video-out" / "showcase-silent.mp4"
SCORE = OUT / "score_master.wav"
NORM = OUT / "score_norm.wav"
MASTER = HERE.parent / "video-out" / "falling-sand-alchemy-master.mp4"

# TP target is -1.5, not -1.0: lossy AAC adds ~0.1-0.2 dB of inter-sample peak
# on top of the loudnorm-limited PCM, so aiming at -1.5 keeps the encoded file
# comfortably under the -1 dBTP ceiling.
I, TP, LRA = -14.0, -1.5, 11.0


def run(args: list[str], capture: bool = False) -> str:
    r = subprocess.run(["ffmpeg", "-hide_banner", "-y", *args],
                       capture_output=True, text=True)
    if r.returncode != 0:
        sys.stderr.write(r.stderr[-3000:])
        raise SystemExit(f"ffmpeg failed: {' '.join(args[:6])} ...")
    return r.stderr if capture else ""


def measure() -> dict:
    log = run(["-i", str(SCORE),
               "-af", f"loudnorm=I={I}:TP={TP}:LRA={LRA}:print_format=json",
               "-f", "null", "-"], capture=True)
    block = log[log.rindex("{"):log.rindex("}") + 1]
    return json.loads(block)


def main() -> None:
    if not VIDEO.exists():
        raise SystemExit(f"missing {VIDEO} — run the recorder first")
    if not SCORE.exists():
        raise SystemExit(f"missing {SCORE} — run compose.py then render.py")

    print("loudnorm pass 1 (measure)...")
    m = measure()
    print(f"  measured: I={m['input_i']} TP={m['input_tp']} LRA={m['input_lra']} thresh={m['input_thresh']}")

    print("loudnorm pass 2 (apply)...")
    af = (f"loudnorm=I={I}:TP={TP}:LRA={LRA}"
          f":measured_I={m['input_i']}:measured_TP={m['input_tp']}"
          f":measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}"
          f":offset={m['target_offset']}:linear=true:print_format=summary")
    run(["-i", str(SCORE), "-af", af, "-ar", "48000", "-c:a", "pcm_s24le", str(NORM)])

    print("mux onto 4K video...")
    run(["-i", str(VIDEO), "-i", str(NORM),
         "-map", "0:v:0", "-map", "1:a:0",
         "-c:v", "copy", "-c:a", "aac", "-b:a", "320k", "-ar", "48000",
         "-movflags", "+faststart", "-shortest", str(MASTER)])
    print(f"wrote {MASTER}")


if __name__ == "__main__":
    main()
