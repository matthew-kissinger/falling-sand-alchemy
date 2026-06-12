# Audition tooling: renders what the piece "looks like" so structure, dynamics,
# register, and density can be judged from images + numbers.
#
#   uv run analyze.py out/score_master.wav
#
# Writes out/analysis_spectrogram.png, out/analysis_levels.png and prints
# LUFS / true-ish peak / silence map / section RMS table.

import sys
from pathlib import Path

import numpy as np
import pyloudnorm as pyln
import soundfile as sf

OUT = Path(__file__).parent / "out"


def spectrogram_png(audio: np.ndarray, sr: int, path: Path) -> None:
    from scipy.signal import stft
    mono = audio.mean(axis=1)
    f, t, z = stft(mono, sr, nperseg=4096, noverlap=3072)
    mag = 20 * np.log10(np.abs(z) + 1e-9)
    mag = np.clip(mag, -90, -10)
    # log-frequency display up to 8kHz
    keep = f <= 8000
    f, mag = f[keep], mag[keep]
    logf = np.geomspace(max(f[1], 25), 8000, 480)
    rows = np.empty((len(logf), mag.shape[1]))
    for i, lf in enumerate(logf):
        rows[i] = mag[np.argmin(np.abs(f - lf))]
    img = (rows - rows.min()) / (rows.max() - rows.min() + 1e-9)
    # ink-on-parchment colormap: dark blue -> amber -> white
    h, w = img.shape
    rgb = np.zeros((h, w, 3), dtype=np.uint8)
    rgb[..., 0] = np.clip(img * 3.2, 0, 1) * 255
    rgb[..., 1] = np.clip(img * 1.9 - 0.25, 0, 1) * 255
    rgb[..., 2] = np.clip(img * 1.1 - 0.05, 0, 1) * 230
    rgb = rgb[::-1]  # low freq at bottom
    _write_png(path, rgb, scale_to_width=1600)


def levels_png(audio: np.ndarray, sr: int, path: Path) -> None:
    mono = audio.mean(axis=1)
    win = sr // 4
    n = len(mono) // win
    rms = np.array([np.sqrt(np.mean(mono[i * win:(i + 1) * win] ** 2)) for i in range(n)])
    db = 20 * np.log10(rms + 1e-9)
    db = np.clip(db, -70, 0)
    h, w = 200, n
    img = np.full((h, w, 3), 16, dtype=np.uint8)
    for x in range(w):
        y = int((db[x] + 70) / 70 * (h - 1))
        img[h - 1 - y:, x] = (201, 164, 92)
    # minute gridlines
    for m in range(1, int(n / (4 * 60)) + 1):
        x = m * 4 * 60
        if x < w:
            img[:, x] = (70, 70, 90)
    _write_png(path, img, scale_to_width=1600)


def _write_png(path: Path, rgb: np.ndarray, scale_to_width: int | None = None) -> None:
    import zlib
    import struct
    if scale_to_width and rgb.shape[1] != scale_to_width:
        idx = np.linspace(0, rgb.shape[1] - 1, scale_to_width).astype(int)
        rgb = rgb[:, idx]
        if rgb.shape[0] < 160:
            rgb = np.repeat(rgb, max(1, 160 // rgb.shape[0]), axis=0)
    h, w, _ = rgb.shape
    raw = b"".join(b"\x00" + rgb[y].tobytes() for y in range(h))

    def chunk(tag: bytes, data: bytes) -> bytes:
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data))

    png = (b"\x89PNG\r\n\x1a\n"
           + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0))
           + chunk(b"IDAT", zlib.compress(raw, 6))
           + chunk(b"IEND", b""))
    path.write_bytes(png)


def report(path: Path) -> None:
    audio, sr = sf.read(path)
    if audio.ndim == 1:
        audio = np.stack([audio, audio], axis=1)
    dur = len(audio) / sr
    meter = pyln.Meter(sr)
    lufs = meter.integrated_loudness(audio)
    peak_db = 20 * np.log10(np.max(np.abs(audio)) + 1e-12)
    print(f"file: {path}")
    print(f"duration: {dur:.1f}s  integrated: {lufs:.1f} LUFS  peak: {peak_db:.1f} dBFS")

    # silence map: >2.5s stretches under -55dB RMS (250ms windows)
    mono = audio.mean(axis=1)
    win = sr // 4
    n = len(mono) // win
    rms_db = np.array([20 * np.log10(np.sqrt(np.mean(mono[i * win:(i + 1) * win] ** 2)) + 1e-9) for i in range(n)])
    quiet = rms_db < -55
    runs, start = [], None
    for i, q in enumerate(list(quiet) + [False]):
        if q and start is None:
            start = i
        elif not q and start is not None:
            if (i - start) * 0.25 >= 2.5:
                runs.append((start * 0.25, i * 0.25))
            start = None
    print("silences >2.5s:", [(round(a, 1), round(b, 1)) for a, b in runs] or "none")

    # per-minute RMS arc
    print("per-30s RMS dB:", [round(float(20 * np.log10(np.sqrt(np.mean(mono[i * sr * 30:(i + 1) * sr * 30] ** 2)) + 1e-9)), 1)
                              for i in range(int(dur // 30))])

    spectrogram_png(audio, sr, OUT / "analysis_spectrogram.png")
    levels_png(audio, sr, OUT / "analysis_levels.png")
    print("wrote analysis_spectrogram.png + analysis_levels.png")


if __name__ == "__main__":
    target = Path(sys.argv[1]) if len(sys.argv) > 1 else OUT / "score_master.wav"
    report(target)
