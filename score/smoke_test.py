# Smoke test: MIDI -> FluidSynth/Salamander -> WAV -> measured.
import subprocess
import sys
from pathlib import Path

import mido
import numpy as np
import soundfile as sf

FLUIDSYNTH = Path.home() / "tools/fluidsynth/fluidsynth-v2.5.4-win10-x64-cpp11/bin/fluidsynth.exe"
SF2 = Path.home() / "tools/soundfonts/SalamanderGrandPiano-SF2-V3+20200602/SalamanderGrandPiano-V3+20200602.sf2"
OUT = Path(__file__).parent / "out"
OUT.mkdir(exist_ok=True)

mid = mido.MidiFile(ticks_per_beat=480)
track = mido.MidiTrack()
mid.tracks.append(track)
track.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(60)))
track.append(mido.Message("control_change", control=64, value=127, time=0))  # sustain pedal down
# sparse low-velocity phrase: A2, E3, C4, B3 with space
notes = [(45, 40, 0, 1920), (52, 38, 480, 1920), (60, 44, 960, 2400), (59, 36, 1440, 2400)]
events = []
for note, vel, on, dur in notes:
    events.append((on, mido.Message("note_on", note=note, velocity=vel, time=0)))
    events.append((on + dur, mido.Message("note_off", note=note, velocity=0, time=0)))
events.sort(key=lambda e: e[0])
prev = 0
for t, msg in events:
    msg.time = t - prev
    track.append(msg)
    prev = t
midi_path = OUT / "smoke.mid"
mid.save(midi_path)

wav_path = OUT / "smoke.wav"
cmd = [
    str(FLUIDSYNTH), "-ni", "-F", str(wav_path), "-r", "48000",
    "-o", "synth.reverb.active=0", "-o", "synth.chorus.active=0",
    "-g", "0.6",
    str(SF2), str(midi_path),
]
r = subprocess.run(cmd, capture_output=True, text=True)
print("fluidsynth exit:", r.returncode)
if r.returncode != 0:
    print(r.stderr[-2000:])
    sys.exit(1)

audio, sr = sf.read(wav_path)
peak = float(np.max(np.abs(audio)))
rms = float(np.sqrt(np.mean(audio**2)))
dur = len(audio) / sr
print(f"rendered {dur:.2f}s at {sr}Hz, peak {peak:.4f}, rms {rms:.5f}")
# crude spectral sanity: energy should be concentrated below 2kHz for soft piano
spec = np.abs(np.fft.rfft(audio[:, 0] if audio.ndim > 1 else audio))
freqs = np.fft.rfftfreq(len(audio[:, 0] if audio.ndim > 1 else audio), 1 / sr)
lo = float(spec[freqs < 2000].sum())
hi = float(spec[freqs >= 2000].sum())
print(f"spectral energy <2kHz: {lo / (lo + hi) * 100:.1f}%")
