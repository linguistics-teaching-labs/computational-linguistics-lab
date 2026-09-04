import { generateVowel, magnitudeSpectrum, sampleWaveform, spectrogram, vowelProfiles } from "./acoustics.js";

const elements = {
  vowel: document.querySelector("#vowel-select"),
  f0: document.querySelector("#f0-slider"),
  f0Value: document.querySelector("#f0-value"),
  duration: document.querySelector("#duration-slider"),
  durationValue: document.querySelector("#duration-value"),
  play: document.querySelector("#play-vowel"),
  vowelSummary: document.querySelector("#vowel-summary"),
  waveform: document.querySelector("#waveform-canvas"),
  spectrum: document.querySelector("#spectrum-canvas"),
  spectrogram: document.querySelector("#spectrogram-canvas"),
  formantTable: document.querySelector("#formant-table"),
  interpretation: document.querySelector("#acoustic-interpretation")
};

let synthesis;

for (const [id, profile] of Object.entries(vowelProfiles)) {
  elements.vowel.add(new Option(`/${profile.symbol}/ as in “${profile.keyword}”`, id));
}

function clearCanvas(canvas, label) {
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#f8fbfc";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#526174";
  context.font = "13px system-ui";
  context.fillText(label, 14, 20);
  return context;
}

function drawWaveform(signal) {
  const canvas = elements.waveform;
  const context = clearCanvas(canvas, "Amplitude over time");
  const points = sampleWaveform(signal, canvas.width - 28);
  const middle = canvas.height / 2;
  context.strokeStyle = "#cbd9e2";
  context.beginPath();
  context.moveTo(14, middle);
  context.lineTo(canvas.width - 14, middle);
  context.stroke();
  context.strokeStyle = "#176b87";
  context.lineWidth = 1.6;
  context.beginPath();
  points.forEach((value, index) => {
    const x = 14 + index;
    const y = middle - value * (canvas.height * 0.39);
    if (index === 0) context.moveTo(x, y); else context.lineTo(x, y);
  });
  context.stroke();
}

function drawSpectrum(points, profile) {
  const canvas = elements.spectrum;
  const context = clearCanvas(canvas, "Relative energy by frequency");
  const left = 38;
  const bottom = canvas.height - 24;
  const width = canvas.width - left - 14;
  const height = canvas.height - 48;
  context.strokeStyle = "#176b87";
  context.lineWidth = 1.5;
  context.beginPath();
  points.forEach((point, index) => {
    const x = left + index / Math.max(1, points.length - 1) * width;
    const y = bottom - point.normalized * height;
    if (index === 0) context.moveTo(x, y); else context.lineTo(x, y);
  });
  context.stroke();
  for (const [index, frequency] of [profile.f1, profile.f2, profile.f3].entries()) {
    const x = left + frequency / 4000 * width;
    context.strokeStyle = index === 0 ? "#e66a2c" : "#9a4d24";
    context.setLineDash([4, 4]);
    context.beginPath();
    context.moveTo(x, 28);
    context.lineTo(x, bottom);
    context.stroke();
    context.setLineDash([]);
    context.fillStyle = "#633019";
    context.fillText(`F${index + 1}`, x + 3, 42 + index * 14);
  }
  context.fillStyle = "#526174";
  context.fillText("0 Hz", left, canvas.height - 7);
  context.fillText("4,000 Hz", canvas.width - 68, canvas.height - 7);
}

function heatColor(value) {
  const strength = Math.pow(Math.max(0, Math.min(1, value)), 0.55);
  const start = [238, 244, 247];
  const end = [230, 106, 44];
  return `rgb(${start.map((channel, index) => Math.round(channel + (end[index] - channel) * strength)).join(",")})`;
}

function drawSpectrogram(data) {
  const canvas = elements.spectrogram;
  const context = clearCanvas(canvas, "Time →     frequency ↑");
  const left = 38;
  const top = 28;
  const width = canvas.width - left - 12;
  const height = canvas.height - top - 22;
  const cellWidth = width / Math.max(1, data.frames.length);
  const cellHeight = height / data.bins;
  data.frames.forEach((frame, frameIndex) => {
    frame.forEach((value, bin) => {
      context.fillStyle = heatColor(value);
      context.fillRect(left + frameIndex * cellWidth, top + height - (bin + 1) * cellHeight, Math.ceil(cellWidth), Math.ceil(cellHeight));
    });
  });
  context.fillStyle = "#526174";
  context.fillText("4 kHz", 2, top + 7);
  context.fillText("0 Hz", 8, top + height);
}

function render() {
  synthesis = generateVowel({
    vowel: elements.vowel.value,
    f0: Number(elements.f0.value),
    duration: Number(elements.duration.value)
  });
  const { profile, signal, sampleRate } = synthesis;
  elements.f0Value.value = `${synthesis.f0} Hz`;
  elements.durationValue.value = `${synthesis.duration.toFixed(2)} s`;
  elements.vowelSummary.innerHTML = `<strong>/${profile.symbol}/</strong><span>${profile.description}</span><small>Illustrative profile based on “${profile.keyword}”</small>`;
  elements.formantTable.innerHTML = [profile.f1, profile.f2, profile.f3].map((frequency, index) => `<tr><th>F${index + 1}</th><td>${frequency.toLocaleString()} Hz</td></tr>`).join("");
  elements.interpretation.textContent = profile.f1 < 400
    ? `The low F1 is associated with a relatively high tongue position. F2 (${profile.f2.toLocaleString()} Hz) helps distinguish front–back position.`
    : `The higher F1 is associated with a relatively open vowel. F2 (${profile.f2.toLocaleString()} Hz) helps distinguish front–back position.`;
  drawWaveform(signal);
  drawSpectrum(magnitudeSpectrum(signal, sampleRate), profile);
  drawSpectrogram(spectrogram(signal, sampleRate));
}

async function playSignal() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    elements.play.textContent = "Audio unavailable";
    elements.play.disabled = true;
    return;
  }
  const context = new AudioContextClass();
  const buffer = context.createBuffer(1, synthesis.signal.length, synthesis.sampleRate);
  buffer.copyToChannel(synthesis.signal, 0);
  const source = context.createBufferSource();
  const gain = context.createGain();
  gain.gain.value = 0.45;
  source.buffer = buffer;
  source.connect(gain).connect(context.destination);
  source.start();
  elements.play.textContent = "Playing…";
  source.addEventListener("ended", () => {
    elements.play.textContent = "Play synthetic vowel";
    context.close();
  });
}

elements.vowel.addEventListener("change", render);
elements.f0.addEventListener("input", render);
elements.duration.addEventListener("input", render);
elements.play.addEventListener("click", playSignal);

render();
