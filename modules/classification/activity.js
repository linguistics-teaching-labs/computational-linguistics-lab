import { labelNames, reviewCorpora } from "./data.js";
import { evaluate, predict, rankFeatures, trainNaiveBayes } from "./naive-bayes.js";

const elements = {
  corpus: document.querySelector("#corpus-select"),
  corpusNote: document.querySelector("#corpus-note"),
  featureInputs: [...document.querySelectorAll('input[name="features"]')],
  alpha: document.querySelector("#alpha-slider"),
  alphaValue: document.querySelector("#alpha-value"),
  trainingCount: document.querySelector("#training-count"),
  favorableCount: document.querySelector("#favorable-count"),
  unfavorableCount: document.querySelector("#unfavorable-count"),
  featureCount: document.querySelector("#feature-count"),
  trainingTable: document.querySelector("#training-table"),
  favorableFeatures: document.querySelector("#favorable-features"),
  unfavorableFeatures: document.querySelector("#unfavorable-features"),
  reviewInput: document.querySelector("#review-input"),
  predictionResult: document.querySelector("#prediction-result"),
  probabilityBars: document.querySelector("#probability-bars"),
  unknownNote: document.querySelector("#unknown-note"),
  evidenceTable: document.querySelector("#evidence-table"),
  accuracyValue: document.querySelector("#accuracy-value"),
  accuracyCount: document.querySelector("#accuracy-count"),
  confusionFF: document.querySelector("#confusion-ff"),
  confusionFU: document.querySelector("#confusion-fu"),
  confusionUF: document.querySelector("#confusion-uf"),
  confusionUU: document.querySelector("#confusion-uu"),
  testTable: document.querySelector("#test-table"),
  auditCard: document.querySelector("#audit-card")
};

let model;
let evaluation;
let selectedCase = 0;

function escapeHTML(value) {
  return String(value).replace(/[&<>'"]/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
  })[character]);
}

function corpus() {
  return reviewCorpora[elements.corpus.value];
}

function usesBigrams() {
  return elements.featureInputs.find(input => input.checked)?.value === "bigram";
}

function percentage(value, digits = 1) {
  return `${(value * 100).toFixed(digits)}%`;
}

function featureLabel(feature) {
  return feature.includes("·") ? feature.replace("·", " + ") : feature;
}

function renderTraining() {
  const data = corpus();
  const favorable = data.training.filter(item => item.label === "favorable").length;
  const unfavorable = data.training.length - favorable;
  elements.corpusNote.textContent = data.note;
  elements.alphaValue.value = Number(elements.alpha.value).toFixed(2);
  elements.trainingCount.textContent = data.training.length.toLocaleString();
  elements.favorableCount.textContent = favorable.toLocaleString();
  elements.unfavorableCount.textContent = unfavorable.toLocaleString();
  elements.featureCount.textContent = model.vocabulary.size.toLocaleString();
  elements.trainingTable.innerHTML = data.training.map(item => `
    <tr><td><span class="label-chip ${item.label}">${labelNames[item.label]}</span></td><td>${escapeHTML(item.text)}</td></tr>`).join("");

  const ranked = rankFeatures(model);
  const featureChip = item => `<span title="log-likelihood ratio ${item.logRatio.toFixed(2)}">${escapeHTML(featureLabel(item.feature))}</span>`;
  elements.favorableFeatures.innerHTML = ranked.slice(0, 6).map(featureChip).join("");
  elements.unfavorableFeatures.innerHTML = ranked.slice(-6).reverse().map(featureChip).join("");
}

function renderPrediction() {
  const result = predict(model, elements.reviewInput.value);
  const confidence = result.probabilities[result.predicted];
  elements.predictionResult.className = `prediction-result ${result.predicted}`;
  elements.predictionResult.innerHTML = `<small>Predicted label</small><strong>${labelNames[result.predicted]}</strong><span>${percentage(confidence)} model probability</span>`;
  elements.probabilityBars.innerHTML = model.labels.map(label => `
    <div class="probability-row">
      <span>${labelNames[label]}</span>
      <div><i class="${label}" style="width:${(result.probabilities[label] * 100).toFixed(2)}%"></i></div>
      <strong>${percentage(result.probabilities[label])}</strong>
    </div>`).join("");

  elements.unknownNote.textContent = result.unknown.length
    ? `${result.unknown.length} feature${result.unknown.length === 1 ? " is" : "s are"} outside the training vocabulary and ignored: ${result.unknown.map(featureLabel).join(", ")}.`
    : "Every extracted feature occurs in the training vocabulary.";

  const evidence = [...result.evidence].sort((a, b) => Math.abs(b.logRatio) - Math.abs(a.logRatio));
  elements.evidenceTable.innerHTML = evidence.map(item => {
    const direction = item.logRatio > 0.01 ? "favorable" : item.logRatio < -0.01 ? "unfavorable" : "neutral";
    return `<tr>
      <td><code>${escapeHTML(featureLabel(item.feature))}</code></td>
      <td>${item.count}</td>
      <td>${item.probabilities.favorable.toFixed(3)}</td>
      <td>${item.probabilities.unfavorable.toFixed(3)}</td>
      <td><span class="direction ${direction}">${direction}</span></td>
    </tr>`;
  }).join("") || '<tr><td colspan="5" class="empty-evidence">No recognized features. The prediction uses only the class priors.</td></tr>';
}

function renderAudit() {
  const item = evaluation.cases[selectedCase] ?? evaluation.cases[0];
  if (!item) {
    elements.auditCard.textContent = "No test cases are available.";
    return;
  }
  const strongest = [...item.prediction.evidence]
    .sort((a, b) => Math.abs(b.logRatio) - Math.abs(a.logRatio))
    .slice(0, 4)
    .map(entry => `<code>${escapeHTML(featureLabel(entry.feature))}</code>`)
    .join(", ") || "no recognized content features";
  elements.auditCard.className = `audit-card ${item.correct ? "correct" : "error"}`;
  elements.auditCard.innerHTML = `
    <div class="audit-heading"><span>${item.correct ? "Correct case" : "Misclassified case"}</span><strong>${escapeHTML(item.text)}</strong></div>
    <div class="audit-comparison">
      <div><small>Actual label</small><strong>${labelNames[item.label]}</strong></div>
      <div><small>Prediction</small><strong>${labelNames[item.prediction.predicted]} · ${percentage(item.prediction.probabilities[item.prediction.predicted])}</strong></div>
    </div>
    <p><strong>Why this case matters:</strong> ${escapeHTML(item.reason)}</p>
    <p><strong>Most influential recognized features:</strong> ${strongest}.</p>`;
}

function renderEvaluation() {
  evaluation = evaluate(model, corpus().test);
  if (selectedCase >= evaluation.cases.length) selectedCase = 0;
  elements.accuracyValue.textContent = percentage(evaluation.accuracy, 0);
  elements.accuracyCount.textContent = `${evaluation.correct} of ${evaluation.total} cases correct`;
  elements.confusionFF.textContent = evaluation.confusion.favorable.favorable;
  elements.confusionFU.textContent = evaluation.confusion.favorable.unfavorable;
  elements.confusionUF.textContent = evaluation.confusion.unfavorable.favorable;
  elements.confusionUU.textContent = evaluation.confusion.unfavorable.unfavorable;
  elements.testTable.innerHTML = evaluation.cases.map((item, index) => `
    <tr class="${index === selectedCase ? "selected" : ""}">
      <td><button type="button" data-case="${index}" class="case-button ${item.correct ? "correct" : "error"}" aria-label="Audit this ${item.correct ? "correct" : "misclassified"} case">${item.correct ? "Correct" : "Error"}</button></td>
      <td>${escapeHTML(item.text)}</td>
      <td>${labelNames[item.label]}</td>
      <td>${labelNames[item.prediction.predicted]}</td>
      <td>${percentage(item.prediction.probabilities[item.prediction.predicted])}</td>
    </tr>`).join("");
  for (const button of elements.testTable.querySelectorAll("[data-case]")) {
    button.addEventListener("click", () => {
      selectedCase = Number(button.dataset.case);
      renderEvaluation();
      document.querySelector("#audit").scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }
  renderAudit();
}

function retrain() {
  model = trainNaiveBayes(corpus().training, {
    alpha: Number(elements.alpha.value),
    bigrams: usesBigrams()
  });
  renderTraining();
  renderPrediction();
  renderEvaluation();
}

for (const [key, data] of Object.entries(reviewCorpora)) {
  elements.corpus.add(new Option(data.label, key));
}

elements.corpus.addEventListener("change", () => { selectedCase = 0; retrain(); });
elements.featureInputs.forEach(input => input.addEventListener("change", retrain));
elements.alpha.addEventListener("input", retrain);
elements.reviewInput.addEventListener("input", renderPrediction);

retrain();
