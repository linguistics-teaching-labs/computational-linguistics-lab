import { corpora } from "./corpora.js";
import { NGramModel, seededRandom, tokenize } from "./ngram-model.js";

const elements = {
  corpusSelect: document.querySelector("#corpus-select"),
  corpusDescription: document.querySelector("#corpus-description"),
  corpusText: document.querySelector("#corpus-text"),
  lowercase: document.querySelector("#lowercase-toggle"),
  smoothing: document.querySelector("#smoothing-toggle"),
  applyCorpus: document.querySelector("#apply-corpus"),
  status: document.querySelector("#model-status"),
  sentenceCount: document.querySelector("#sentence-count"),
  tokenCount: document.querySelector("#token-count"),
  typeCount: document.querySelector("#type-count"),
  ratio: document.querySelector("#type-token-ratio"),
  tokenPreview: document.querySelector("#token-preview"),
  orderInputs: [...document.querySelectorAll('input[name="order"]')],
  contextInput: document.querySelector("#context-input"),
  contextHelp: document.querySelector("#context-help"),
  activeContext: document.querySelector("#active-context"),
  predictionChart: document.querySelector("#prediction-chart"),
  predictionEmpty: document.querySelector("#prediction-empty"),
  countExplanation: document.querySelector("#count-explanation"),
  smoothingFormula: document.querySelector("#smoothing-formula"),
  seedInput: document.querySelector("#seed-input"),
  generateButton: document.querySelector("#generate-button"),
  generatedOutput: document.querySelector("#generated-output"),
  testInput: document.querySelector("#test-input"),
  evaluateButton: document.querySelector("#evaluate-button"),
  sentenceProbability: document.querySelector("#sentence-probability"),
  perplexity: document.querySelector("#perplexity"),
  evaluationRows: document.querySelector("#evaluation-rows")
};

let model;
let generationNumber = 0;

function escapeHTML(value) {
  return String(value).replace(/[&<>'"]/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
  })[character]);
}

function displayToken(token) {
  if (token === "<s>") return "[start]";
  if (token === "</s>") return "[end]";
  return token;
}

function selectedOrder() {
  return Number(elements.orderInputs.find(input => input.checked)?.value ?? 2);
}

function formatProbability(value) {
  if (value === 0) return "0";
  if (value < 0.0001) return value.toExponential(2);
  return value.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
}

function rebuildModel(announce = false) {
  model = new NGramModel(elements.corpusText.value, selectedOrder(), {
    lowercase: elements.lowercase.checked,
    smoothing: elements.smoothing.checked
  });
  renderCorpusSummary();
  renderPredictions();
  renderSmoothing();
  evaluateSentence();
  if (announce) {
    elements.status.textContent = "Model rebuilt from the edited corpus.";
    window.setTimeout(() => { elements.status.textContent = ""; }, 3000);
  }
}

function renderCorpusSummary() {
  const types = new Set(model.tokens);
  elements.sentenceCount.textContent = model.sentences.length.toLocaleString();
  elements.tokenCount.textContent = model.tokens.length.toLocaleString();
  elements.typeCount.textContent = types.size.toLocaleString();
  elements.ratio.textContent = model.tokens.length ? (types.size / model.tokens.length).toFixed(2) : "0";
  const preview = model.tokens.slice(0, 32);
  elements.tokenPreview.innerHTML = preview.map(token => `<span class="token-chip">${escapeHTML(token)}</span>`).join("");
  if (model.tokens.length > preview.length) {
    elements.tokenPreview.insertAdjacentHTML("beforeend", `<span class="token-chip">+${model.tokens.length - preview.length} more</span>`);
  }
}

function renderPredictions() {
  const order = model.order;
  const orderNames = { 1: "unigram", 2: "bigram", 3: "trigram" };
  elements.contextHelp.textContent = order === 1
    ? "A unigram ignores the words entered here."
    : `For a ${orderNames[order]}, only the final ${order - 1} word${order === 3 ? "s are" : " is"} used.`;

  const context = model.normalizeContext(elements.contextInput.value);
  elements.activeContext.textContent = order === 1
    ? "No context"
    : `Context: ${context.map(displayToken).join(" ")}`;

  const predictions = model.predictions(elements.contextInput.value);
  const visible = predictions.filter(item => item.count > 0 || item.probability > 0).slice(0, 8);
  elements.predictionEmpty.hidden = visible.length > 0;
  elements.predictionChart.innerHTML = "";
  const maximum = Math.max(...visible.map(item => item.probability), 0);
  for (const item of visible) {
    const width = maximum ? (item.probability / maximum) * 100 : 0;
    elements.predictionChart.insertAdjacentHTML("beforeend", `
      <div class="bar-row">
        <span class="bar-label" title="${escapeHTML(displayToken(item.token))}">${escapeHTML(displayToken(item.token))}</span>
        <span class="bar-track" aria-hidden="true"><span class="bar-fill" style="width:${width.toFixed(2)}%"></span></span>
        <span class="bar-value">${(item.probability * 100).toFixed(1)}%</span>
      </div>`);
  }

  const top = predictions[0];
  if (!top) {
    elements.countExplanation.innerHTML = `<strong>No matching count.</strong> The model has never observed this context. Its unsmoothed probability for every next word is <code>0</code>.`;
    return;
  }
  const keyContext = context.map(displayToken).join(" ") || "any position";
  const total = predictions.reduce((sum, item) => sum + item.count, 0);
  const numerator = model.smoothing ? `${top.count} + 1` : String(top.count);
  const denominator = model.smoothing ? `${total} + ${model.vocabulary.length}` : String(total);
  elements.countExplanation.innerHTML = `<strong>Most likely:</strong> after <code>${escapeHTML(keyContext)}</code>, the model assigns <code>${escapeHTML(displayToken(top.token))}</code> a probability of <code>${numerator} / ${denominator} = ${formatProbability(top.probability)}</code>.`;
}

function renderSmoothing() {
  if (model.smoothing) {
    elements.smoothingFormula.innerHTML = `<strong>Add-one smoothing is on.</strong> P(next | context) = <code>(count + 1) / (context count + vocabulary size)</code>. The current vocabulary has <code>${model.vocabulary.length}</code> possible next tokens.`;
  } else {
    elements.smoothingFormula.innerHTML = `<strong>Smoothing is off.</strong> P(next | context) = <code>count(context, next) / count(context)</code>. An unseen event receives probability <code>0</code>.`;
  }
}

function generateSentence() {
  generationNumber += 1;
  const random = seededRandom(Date.now() + generationNumber);
  const words = model.generate(elements.seedInput.value, 18, random);
  if (!words.length) {
    elements.generatedOutput.textContent = "The model could not continue from that opening. Try smoothing or a context found in the corpus.";
    return;
  }
  const text = words.join(" ");
  elements.generatedOutput.textContent = text.charAt(0).toLocaleUpperCase() + text.slice(1) + ".";
}

function evaluateSentence() {
  const result = model.evaluate(elements.testInput.value);
  elements.sentenceProbability.textContent = result.tokenCount ? formatProbability(result.probability) : "—";
  elements.perplexity.textContent = !result.tokenCount ? "—" : Number.isFinite(result.perplexity) ? result.perplexity.toFixed(2) : "∞";
  elements.evaluationRows.innerHTML = result.rows.map(row => {
    const context = row.context.length ? row.context.map(displayToken).join(" ") : "—";
    const probabilityClass = row.probability === 0 ? "zero-probability" : "";
    return `<tr><td><code>${escapeHTML(context)}</code></td><td><code>${escapeHTML(displayToken(row.token))}</code></td><td class="${probabilityClass}">${formatProbability(row.probability)}</td></tr>`;
  }).join("");
}

function loadCorpus(key) {
  const corpus = corpora[key];
  elements.corpusDescription.textContent = corpus.description;
  elements.corpusText.value = corpus.text;
  rebuildModel();
}

for (const [key, corpus] of Object.entries(corpora)) {
  elements.corpusSelect.add(new Option(corpus.name, key));
}

elements.corpusSelect.addEventListener("change", event => loadCorpus(event.target.value));
elements.lowercase.addEventListener("change", () => rebuildModel());
elements.smoothing.addEventListener("change", () => rebuildModel());
elements.applyCorpus.addEventListener("click", () => rebuildModel(true));
elements.orderInputs.forEach(input => input.addEventListener("change", () => rebuildModel()));
elements.contextInput.addEventListener("input", renderPredictions);
elements.generateButton.addEventListener("click", generateSentence);
elements.evaluateButton.addEventListener("click", evaluateSentence);
elements.testInput.addEventListener("keydown", event => {
  if (event.key === "Enter") evaluateSentence();
});

loadCorpus("campus");
