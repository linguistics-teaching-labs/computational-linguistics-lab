import test from "node:test";
import assert from "node:assert/strict";

import {
  generateVowel,
  getVowelProfile,
  magnitudeSpectrum,
  sampleWaveform,
  spectrogram
} from "../modules/acoustics/acoustics.js";

test("vowel profiles are explicit and unknown profiles fail clearly", () => {
  assert.equal(getVowelProfile("i").symbol, "i");
  assert.throws(() => getVowelProfile("missing"), /Unknown vowel profile/);
});

test("vowel generation is deterministic, bounded, and sized by duration", () => {
  const first = generateVowel({ vowel: "ae", f0: 120, duration: 0.35, sampleRate: 8000 });
  const second = generateVowel({ vowel: "ae", f0: 120, duration: 0.35, sampleRate: 8000 });
  assert.equal(first.signal.length, 2800);
  assert.deepEqual(first.signal, second.signal);
  assert.ok(Math.max(...first.signal.map(Math.abs)) <= 0.881);
  assert.ok(first.signal.some(value => value !== 0));
});

test("spectrum output spans Nyquist and is normalized", () => {
  const { signal, sampleRate } = generateVowel({ duration: 0.1 });
  const spectrum = magnitudeSpectrum(signal, sampleRate, 40);
  assert.equal(spectrum.length, 40);
  assert.equal(spectrum[0].frequency, 0);
  assert.equal(spectrum.at(-1).frequency, sampleRate / 2);
  assert.ok(spectrum.every(point => point.normalized >= 0 && point.normalized <= 1));
  assert.equal(Math.max(...spectrum.map(point => point.normalized)), 1);
});

test("spectrogram and waveform sampling return display-ready arrays", () => {
  const { signal, sampleRate } = generateVowel({ duration: 0.12 });
  const display = spectrogram(signal, sampleRate, { bins: 24, windowSize: 96, hopSize: 48 });
  assert.ok(display.frames.length > 1);
  assert.ok(display.frames.every(frame => frame.length === 24));
  assert.equal(sampleWaveform(signal, 50).length, 50);
  assert.deepEqual(sampleWaveform(new Float32Array(), 50), []);
});

test("invalid synthesis controls are rejected", () => {
  assert.throws(() => generateVowel({ f0: 0 }), /f0/);
  assert.throws(() => generateVowel({ duration: 3 }), /duration/);
});
