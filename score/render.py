# Render pipeline: score.mid -> FluidSynth/Salamander (dry) -> felt treatment ->
# synthetic-IR convolution reverb -> gain staging -> master WAV.
#
#   uv run render.py            # renders out/score_dry.wav + out/score_master.wav
#   uv run render.py --quick    # skip convolution (fast audition of the dry+EQ stage)
#
# The IR is generated in numpy (exponentially decaying decorrelated noise with
# frequency-dependent RT60: long warm lows, faster-dying highs) so the whole
# pipeline is reproducible with zero external audio assets.

import subprocess
import sys
from pathlib import Path

import numpy as np
import soundfile as sf
from pedalboard import (
    Compressor, Convolution, Gain, HighpassFilter, HighShelfFilter,
    LowpassFilter, Pedalboard,
)

FLUIDSYNTH = Path.home() / "tools/fluidsynth/fluidsynth-v2.5.4-win10-x64-cpp11/bin/fluidsynth.exe"
SF2 = Path.home() / "tools/soundfonts/SalamanderGrandPiano-SF2-V3+20200602/SalamanderGrandPiano-V3+20200602.sf2"
HERE = Path(__file__).parent
OUT = HERE / "out"
SR = 48000


def make_ir(sr: int = SR, seconds: float = 4.5, seed: int = 41) -> Path:
    """Stereo IR: noise with RT60 ~3.8s at 100Hz tapering to ~1.0s at 8kHz.
    Kept on the shorter side: a longer tail smears adjacent harmonies into
    each other and the wash starts to read as out-of-tune."""
    rng = np.random.default_rng(seed)
    n = int(sr * seconds)
    t = np.arange(n) / sr
    # band-split decay: build the IR as a sum of octave bands, each with its own RT60
    bands = [(0, 150, 3.8), (150, 400, 3.3), (400, 1000, 2.7),
             (1000, 2500, 2.1), (2500, 5000, 1.5), (5000, 12000, 1.0)]
    ir = np.zeros((n, 2), dtype=np.float64)
    for lo, hi, rt60 in bands:
        for ch in range(2):
            noise = rng.standard_normal(n)
            spec = np.fft.rfft(noise)
            freqs = np.fft.rfftfreq(n, 1 / sr)
            mask = ((freqs >= lo) & (freqs < hi)).astype(np.float64)
            # soften band edges to avoid ringing
            edge = max(8, int(len(freqs) * 0.002))
            mask = np.convolve(mask, np.hanning(edge) / np.hanning(edge).sum(), mode="same")
            banded = np.fft.irfft(spec * mask, n)
            env = np.power(10.0, -3.0 * t / rt60)  # -60dB at rt60
            ir[:, ch] += banded * env
    # 8ms fade-in (no direct impulse: convolution supplies tail only; dry path carries direct)
    fade = int(0.008 * sr)
    ir[:fade] *= np.linspace(0, 1, fade)[:, None]
    ir /= np.max(np.abs(ir))
    ir *= 0.5
    path = OUT / "ir_chapel.wav"
    sf.write(path, ir.astype(np.float32), sr)
    return path


def render_midi(midi: Path, wav: Path, gain: float = 0.7) -> None:
    cmd = [
        str(FLUIDSYNTH), "-ni", "-F", str(wav), "-r", str(SR),
        "-o", "synth.reverb.active=0", "-o", "synth.chorus.active=0",
        "-o", "synth.polyphony=256",
        "-g", str(gain),
        str(SF2), str(midi),
    ]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        print(r.stderr[-2000:])
        raise SystemExit(f"fluidsynth failed ({r.returncode})")


def master(dry_path: Path, out_path: Path, quick: bool = False) -> None:
    audio, sr = sf.read(dry_path)
    if audio.ndim == 1:
        audio = np.stack([audio, audio], axis=1)
    x = audio.T.astype(np.float32)

    # normalize the dry render to a consistent working level (peak -12 dBFS)
    peak = float(np.max(np.abs(x))) or 1.0
    x *= (10 ** (-12 / 20)) / peak

    # felt treatment: tame hammers + air, keep warmth. The lowpass and shelf
    # are set just bright enough that note attacks stay articulate - dull them
    # further and the pulse starts to feel as if it lands late.
    felt = Pedalboard([
        HighpassFilter(38),
        LowpassFilter(8200),
        HighShelfFilter(cutoff_frequency_hz=2800, gain_db=-3.5),
        Compressor(threshold_db=-26, ratio=1.6, attack_ms=18, release_ms=320),
    ])
    dry = felt(x, sr)

    if quick:
        wet_mix = dry
    else:
        ir = make_ir()
        verb = Pedalboard([Convolution(str(ir), mix=1.0), LowpassFilter(6200)])
        tail = verb(dry, sr)
        # dry-forward intimate blend with a warm tail behind it
        wet_mix = dry * 0.84 + tail * 0.38

    out = Pedalboard([Gain(0)])(wet_mix, sr)
    peak = float(np.max(np.abs(out))) or 1.0
    out *= (10 ** (-1.5 / 20)) / peak  # master peaks at -1.5 dBFS; loudnorm happens at mux
    sf.write(out_path, out.T, sr)
    print(f"master: {out_path} peak {float(np.max(np.abs(out))):.3f} len {out.shape[1] / sr:.1f}s")


if __name__ == "__main__":
    quick = "--quick" in sys.argv
    OUT.mkdir(exist_ok=True)
    midi = OUT / "score.mid"
    if not midi.exists():
        raise SystemExit("run compose.py first (out/score.mid missing)")
    dry = OUT / "score_dry.wav"
    render_midi(midi, dry)
    master(dry, OUT / "score_master.wav", quick=quick)
