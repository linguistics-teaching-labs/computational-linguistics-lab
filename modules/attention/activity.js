import { attentionExamples, getAttentionExample } from "./examples.js";
import { attentionMask, attentionSummary, rankAttention, weightedContext } from "./attention.js";

const elements = {
  example: document.querySelector("#attention-example"),
  sentence: document.querySelector("#attention-sentence"),
  focus: document.querySelector("#focus-token"),
  mode: document.querySelector("#attention-mode"),
  scoreControls: document.querySelector("#score-controls"),
  reset: document.querySelector("#reset-scores"),
  temperature: document.querySelector("#temperature-slider"),
  temperatureValue: document.querySelector("#temperature-value"),
  weights: document.querySelector("#attention-weights"),
  weightSum: document.querySelector("#weight-sum"),
  effectiveTokens: document.querySelector("#effective-tokens"),
  context: document.querySelector("#context-vector"),
  interpretation: document.querySelector("#attention-interpretation")
};

let scores = [];

for (const example of attentionExamples) {
  const option = document.createElement("option");
  option.value = example.id;
  option.textContent = example.label;
  elements.example.append(option);
}

function currentExample() {
  return getAttentionExample(elements.example.value);
}

function loadExample() {
  const example = currentExample();
  scores = [...example.scores];
  elements.sentence.textContent = example.sentence;
  elements.focus.textContent = example.tokens[example.focusIndex];
  renderScoreControls();
  render();
}

function renderScoreControls() {
  const example = currentExample();
  elements.scoreControls.replaceChildren(...example.tokens.map((token, index) => {
    const label = document.createElement("label");
    label.className = "score-control";
    if (index === example.focusIndex) label.classList.add("focus-score");
    const heading = document.createElement("span");
    heading.innerHTML = `<strong>${token}</strong><output>${scores[index].toFixed(1)}</output>`;
    const input = document.createElement("input");
    input.type = "range";
    input.min = "-2";
    input.max = "3";
    input.step = "0.1";
    input.value = scores[index];
    input.setAttribute("aria-label", `Raw attention score for ${token}`);
    input.addEventListener("input", () => {
      scores[index] = Number(input.value);
      heading.querySelector("output").textContent = scores[index].toFixed(1);
      render();
    });
    label.append(heading, input);
    return label;
  }));
}

function render() {
  const example = currentExample();
  const temperature = Number(elements.temperature.value);
  const mask = attentionMask(example.tokens.length, example.focusIndex, elements.mode.value);
  const summary = attentionSummary(scores, temperature, mask);
  const context = weightedContext(summary.weights, example.vectors);
  const ranking = rankAttention(example.tokens, summary.weights);

  elements.temperatureValue.value = temperature.toFixed(1);
  elements.weights.replaceChildren(...example.tokens.map((token, index) => {
    const row = document.createElement("div");
    row.className = `weight-row${mask[index] ? "" : " masked"}`;
    const label = document.createElement("span");
    label.textContent = token;
    const track = document.createElement("div");
    track.className = "weight-track";
    const bar = document.createElement("span");
    bar.style.width = `${summary.weights[index] * 100}%`;
    track.append(bar);
    const value = document.createElement("strong");
    value.textContent = mask[index] ? summary.weights[index].toFixed(3) : "masked";
    row.append(label, track, value);
    return row;
  }));

  elements.weightSum.textContent = summary.total.toFixed(3);
  elements.effectiveTokens.textContent = summary.effectiveTokens.toFixed(2);
  elements.context.replaceChildren(...example.featureLabels.map((label, index) => {
    const item = document.createElement("div");
    item.innerHTML = `<span>${label}</span><div><i style="width:${Math.min(100, context[index] * 100)}%"></i></div><strong>${context[index].toFixed(2)}</strong>`;
    return item;
  }));

  const leader = ranking[0];
  elements.interpretation.textContent = `${example.note} At the current settings, “${leader.token}” receives the largest weight (${leader.weight.toFixed(3)}). These scores and vectors are synthetic teaching data, not output from a trained model.`;
}

elements.example.addEventListener("change", loadExample);
elements.mode.addEventListener("change", render);
elements.temperature.addEventListener("input", render);
elements.reset.addEventListener("click", loadExample);
loadExample();
