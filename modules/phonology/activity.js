import { compareSounds, featureLabels, featureValues, filterInventory, inventory, minimalPairs } from "./features.js";

const elements = {
  first: document.querySelector("#sound-a"),
  second: document.querySelector("#sound-b"),
  comparison: document.querySelector("#feature-comparison"),
  distance: document.querySelector("#feature-distance"),
  pair: document.querySelector("#minimal-pair"),
  pairDisplay: document.querySelector("#pair-display"),
  pairExplanation: document.querySelector("#pair-explanation"),
  filterFeatureA: document.querySelector("#filter-feature-a"),
  filterValueA: document.querySelector("#filter-value-a"),
  filterFeatureB: document.querySelector("#filter-feature-b"),
  filterValueB: document.querySelector("#filter-value-b"),
  classResults: document.querySelector("#class-results"),
  classCount: document.querySelector("#class-count")
};

function soundLabel(sound) {
  return `/${sound.symbol}/ — ${sound.example}`;
}

for (const sound of inventory) {
  elements.first.add(new Option(soundLabel(sound), sound.id));
  elements.second.add(new Option(soundLabel(sound), sound.id));
}
elements.first.value = "p";
elements.second.value = "b";

for (const [index, pair] of minimalPairs.entries()) {
  elements.pair.add(new Option(`${pair.words[0]} / ${pair.words[1]}`, index));
}

const filterFeatures = ["type", "voice", "place", "manner", "continuant", "nasal", "sonorant", "height", "backness", "round", "tense"];
for (const feature of filterFeatures) {
  const label = featureLabels[feature];
  elements.filterFeatureA.add(new Option(label, feature));
  elements.filterFeatureB.add(new Option(label, feature));
}
elements.filterFeatureA.value = "voice";
elements.filterFeatureB.value = "manner";

function populateValues(featureSelect, valueSelect, preferred) {
  const values = featureValues(featureSelect.value);
  valueSelect.replaceChildren(...values.map(value => new Option(value, value)));
  valueSelect.value = values.includes(preferred) ? preferred : values[0];
}

function renderComparison() {
  const result = compareSounds(elements.first.value, elements.second.value);
  elements.comparison.innerHTML = result.rows.map(row => `<tr class="${row.differs ? "feature-difference" : ""}"><th>${featureLabels[row.feature]}</th><td>${row.first}</td><td>${row.second}</td><td>${row.differs ? "Different" : "Shared"}</td></tr>`).join("");
  elements.distance.innerHTML = `<strong>${result.differences.length}</strong><span>feature difference${result.differences.length === 1 ? "" : "s"}</span><small>in this teaching representation</small>`;
}

function renderPair() {
  const pair = minimalPairs[Number(elements.pair.value)];
  const result = compareSounds(...pair.sounds);
  elements.pairDisplay.innerHTML = `<div><strong>${pair.words[0]}</strong><span>/${pair.sounds[0]}/</span></div><b>↔</b><div><strong>${pair.words[1]}</strong><span>/${pair.sounds[1]}/</span></div>`;
  const differences = result.differences.map(row => `${featureLabels[row.feature]}: ${row.first} → ${row.second}`).join("; ");
  elements.pairExplanation.innerHTML = `<p>${pair.note}</p><p><strong>Contrasting representation:</strong> ${differences}.</p>`;
}

function renderClass() {
  const matches = filterInventory([
    { feature: elements.filterFeatureA.value, value: elements.filterValueA.value },
    { feature: elements.filterFeatureB.value, value: elements.filterValueB.value }
  ]);
  elements.classCount.textContent = `${matches.length} matching sound${matches.length === 1 ? "" : "s"}`;
  elements.classResults.innerHTML = matches.length
    ? matches.map(sound => `<span title="${sound.example}">/${sound.symbol}/</span>`).join("")
    : "<p>No sound in this compact inventory matches both filters.</p>";
}

function changeFilter(featureSelect, valueSelect) {
  populateValues(featureSelect, valueSelect);
  renderClass();
}

populateValues(elements.filterFeatureA, elements.filterValueA, "voiceless");
populateValues(elements.filterFeatureB, elements.filterValueB, "fricative");
elements.first.addEventListener("change", renderComparison);
elements.second.addEventListener("change", renderComparison);
elements.pair.addEventListener("change", renderPair);
elements.filterFeatureA.addEventListener("change", () => changeFilter(elements.filterFeatureA, elements.filterValueA));
elements.filterFeatureB.addEventListener("change", () => changeFilter(elements.filterFeatureB, elements.filterValueB));
elements.filterValueA.addEventListener("change", renderClass);
elements.filterValueB.addEventListener("change", renderClass);

renderComparison();
renderPair();
renderClass();
