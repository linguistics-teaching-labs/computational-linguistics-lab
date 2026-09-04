import { coreferenceExamples, featureLabels, getCoreferenceExample } from "./examples.js";
import { ambiguitySummary, defaultSalienceWeights, rankCandidates } from "./coreference.js";

const elements = {
  example: document.querySelector("#coreference-example"),
  before: document.querySelector("#discourse-before"),
  pronoun: document.querySelector("#discourse-pronoun"),
  after: document.querySelector("#discourse-after"),
  features: document.querySelector("#candidate-features"),
  controls: document.querySelector("#salience-controls"),
  reset: document.querySelector("#reset-salience"),
  ranking: document.querySelector("#candidate-ranking"),
  ambiguity: document.querySelector("#ambiguity-label"),
  margin: document.querySelector("#ambiguity-margin"),
  interpretation: document.querySelector("#interpretation-select"),
  paraphrase: document.querySelector("#interpretation-paraphrase"),
  continuation: document.querySelector("#interpretation-continuation"),
  explanation: document.querySelector("#interpretation-explanation")
};

let weights = { ...defaultSalienceWeights };

for (const example of coreferenceExamples) {
  const option = document.createElement("option");
  option.value = example.id;
  option.textContent = example.label;
  elements.example.append(option);
}

function currentExample() {
  return getCoreferenceExample(elements.example.value);
}

function renderFeatureTable() {
  const example = currentExample();
  elements.features.innerHTML = example.candidates.map(candidate => `<tr><th>${candidate.name}</th>${Object.keys(featureLabels).map(feature => `<td>${candidate.features[feature].toFixed(2)}</td>`).join("")}</tr>`).join("");
}

function renderControls() {
  elements.controls.replaceChildren(...Object.entries(featureLabels).map(([feature, labelText]) => {
    const label = document.createElement("label");
    label.className = "salience-control";
    const heading = document.createElement("span");
    heading.innerHTML = `<strong>${labelText}</strong><output>${weights[feature].toFixed(1)}</output>`;
    const input = document.createElement("input");
    input.type = "range";
    input.min = "0";
    input.max = "3";
    input.step = "0.1";
    input.value = weights[feature];
    input.addEventListener("input", () => {
      weights[feature] = Number(input.value);
      heading.querySelector("output").textContent = weights[feature].toFixed(1);
      renderRanking();
    });
    label.append(heading, input);
    return label;
  }));
}

function renderInterpretation() {
  const example = currentExample();
  const candidate = example.candidates.find(item => item.id === elements.interpretation.value) ?? example.candidates[0];
  elements.paraphrase.textContent = candidate.paraphrase;
  elements.continuation.textContent = candidate.continuation;
  elements.explanation.textContent = candidate.note;
}

function renderRanking() {
  const ranking = rankCandidates(currentExample().candidates, weights);
  const ambiguity = ambiguitySummary(ranking);
  elements.ambiguity.textContent = ambiguity.label;
  elements.margin.textContent = `${(ambiguity.margin * 100).toFixed(0)}-point gap`;
  elements.ranking.replaceChildren(...ranking.map((item, index) => {
    const row = document.createElement("div");
    row.className = "candidate-row";
    const rank = document.createElement("span");
    rank.textContent = String(index + 1);
    const body = document.createElement("div");
    body.innerHTML = `<strong>${item.candidate.name}</strong><div class="candidate-track"><i style="width:${item.probability * 100}%"></i></div>`;
    const value = document.createElement("b");
    value.textContent = `${(item.probability * 100).toFixed(0)}%`;
    row.append(rank, body, value);
    return row;
  }));
}

function loadExample() {
  const example = currentExample();
  elements.before.textContent = example.before;
  elements.pronoun.textContent = example.pronoun;
  elements.after.textContent = example.after;
  elements.interpretation.replaceChildren(...example.candidates.map(candidate => {
    const option = document.createElement("option");
    option.value = candidate.id;
    option.textContent = candidate.name;
    return option;
  }));
  renderFeatureTable();
  renderRanking();
  renderInterpretation();
}

elements.example.addEventListener("change", loadExample);
elements.interpretation.addEventListener("change", renderInterpretation);
elements.reset.addEventListener("click", () => {
  weights = { ...defaultSalienceWeights };
  renderControls();
  renderRanking();
});

renderControls();
loadExample();
