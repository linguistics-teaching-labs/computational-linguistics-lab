export const vowelProfiles = {
  i: { symbol: "i", keyword: "heed", f1: 300, f2: 2300, f3: 3000, description: "high front unrounded" },
  ae: { symbol: "æ", keyword: "had", f1: 700, f2: 1700, f3: 2500, description: "low front unrounded" },
  ah: { symbol: "ɑ", keyword: "hod", f1: 730, f2: 1090, f3: 2440, description: "low back unrounded" },
  u: { symbol: "u", keyword: "who'd", f1: 300, f2: 870, f3: 2240, description: "high back rounded" },
  schwa: { symbol: "ə", keyword: "sofa", f1: 500, f2: 1500, f3: 2500, description: "mid central unrounded" }
};

export function getVowelProfile(id) {
  const profile = vowelProfiles[id];
  if (!profile) throw new Error(`Unknown vowel profile: ${id}`);
  return profile;
}

export function generateVowel({ vowel = "i", f0 = 120, duration = 0.35, sampleRate = 8000 } = {}) {
  const profile = getVowelProfile(vowel);
  if (!(f0 > 0 && f0 < sampleRate / 2)) throw new Error("f0 must fall between zero and Nyquist");
  if (!(duration > 0 && duration <= 2)) throw new Error("duration must be between zero and two seconds");
  const length = Math.max(1, Math.floor(duration * sampleRate));
  const signal = new Float32Array(length);
  const formants = [profile.f1, profile.f2, profile.f3];
  const bandwidths = [90, 130, 180];
  const weights = [1, 0.72, 0.48];
  const harmonicCount = Math.floor((sampleRate / 2) / f0);

  for (let index = 0; index < length; index += 1) {
    const time = index / sampleRate;
    const attack = Math.min(1, index / (sampleRate * 0.025));
    const release = Math.min(1, (length - index - 1) / (sampleRate * 0.04));
    const envelope = Math.max(0, Math.min(attack, release));
    let sample = 0;
    for (let harmonic = 1; harmonic <= harmonicCount; harmonic += 1) {
      const frequency = harmonic * f0;
      const resonance = formants.reduce((sum, formant, formantIndex) => {
        const distance = (frequency - formant) / bandwidths[formantIndex];
        return sum + weights[formantIndex] * Math.exp(-0.5 * distance * distance);
      }, 0.035);
      sample += (resonance / Math.pow(harmonic, 0.72)) * Math.sin(2 * Math.PI * frequency * time);
    }
    signal[index] = sample * envelope;
  }

  let peak = 0;
  for (const sample of signal) peak = Math.max(peak, Math.abs(sample));
  if (peak > 0) for (let index = 0; index < signal.length; index += 1) signal[index] = signal[index] / peak * 0.88;
  return { signal, sampleRate, profile, f0, duration };
}

function hann(index, length) {
  return length <= 1 ? 1 : 0.5 - 0.5 * Math.cos((2 * Math.PI * index) / (length - 1));
}

export function magnitudeSpectrum(signal, sampleRate, bins = 160, start = 0, windowSize = 512) {
  const size = Math.min(windowSize, signal.length);
  const result = [];
  let maximum = 0;
  for (let bin = 0; bin < bins; bin += 1) {
    const frequency = (bin / Math.max(1, bins - 1)) * (sampleRate / 2);
    let real = 0;
    let imaginary = 0;
    for (let index = 0; index < size; index += 1) {
      const sample = signal[start + index] ?? 0;
      const angle = (2 * Math.PI * frequency * index) / sampleRate;
      const weighted = sample * hann(index, size);
      real += weighted * Math.cos(angle);
      imaginary -= weighted * Math.sin(angle);
    }
    const magnitude = Math.sqrt(real * real + imaginary * imaginary);
    maximum = Math.max(maximum, magnitude);
    result.push({ frequency, magnitude });
  }
  return result.map(point => ({ ...point, normalized: maximum ? point.magnitude / maximum : 0 }));
}

export function spectrogram(signal, sampleRate, { windowSize = 192, hopSize = 96, bins = 72 } = {}) {
  const frames = [];
  for (let start = 0; start < signal.length; start += hopSize) {
    const spectrum = magnitudeSpectrum(signal, sampleRate, bins, start, windowSize);
    frames.push(spectrum.map(point => point.normalized));
    if (start + windowSize >= signal.length) break;
  }
  return { frames, bins, frameDuration: hopSize / sampleRate, maxFrequency: sampleRate / 2 };
}

export function sampleWaveform(signal, points = 240) {
  if (!signal.length || points < 1) return [];
  return Array.from({ length: Math.min(points, signal.length) }, (_, index) => {
    const signalIndex = Math.round(index * (signal.length - 1) / Math.max(1, points - 1));
    return signal[signalIndex];
  });
}
