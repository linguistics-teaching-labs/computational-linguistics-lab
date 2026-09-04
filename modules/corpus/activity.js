import { analyzeCorpus, collocations, concordance, targetFrequency } from "./corpus-stats.js";
import { teachingCorpora } from "./data.js";

const elements = {
  corpus: document.querySelector("#corpus-select"), text: document.querySelector("#corpus-text"), note: document.querySelector("#corpus-note"),
  sample: document.querySelector("#sample-slider"), sampleValue: document.querySelector("#sample-value"),
  tokens: document.querySelector("#token-count"), types: document.querySelector("#type-count"), ratio: document.querySelector("#type-token-ratio"), available: document.querySelector("#available-count"),
  frequencyTable: document.querySelector("#frequency-table"), target: document.querySelector("#target-word"), targetSummary: document.querySelector("#target-summary"), concordance: document.querySelector("#concordance"),
  minCount: document.querySelector("#minimum-count"), collocationTable: document.querySelector("#collocation-table"), pmiNote: document.querySelector("#pmi-note")
};

let analysis;

function escapeHTML(value) {
  return String(value).replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
}

for (const [id, corpus] of Object.entries(teachingCorpora)) elements.corpus.add(new Option(corpus.label, id));

function loadCorpus() {
  const corpus = teachingCorpora[elements.corpus.value];
  elements.text.value = corpus.text;
  elements.note.textContent = corpus.note;
  elements.sample.value = "100";
  render();
}

function renderFrequency() {
  elements.frequencyTable.innerHTML = analysis.frequencies.slice(0, 12).map((item, index) => `<tr><td>${index + 1}</td><td><code>${escapeHTML(item.token)}</code></td><td>${item.count}</td><td>${item.perThousand.toFixed(1)}</td></tr>`).join("") || '<tr><td colspan="4">No tokens to count.</td></tr>';
}

function renderTarget() {
  const result = targetFrequency(analysis, elements.target.value);
  elements.targetSummary.innerHTML = `<div><small>Raw count</small><strong>${result.count}</strong></div><div><small>Per 1,000 tokens</small><strong>${result.perThousand.toFixed(1)}</strong></div>`;
  const rows = concordance(analysis.tokens, result.token);
  elements.concordance.innerHTML = rows.length
    ? rows.slice(0, 12).map(row => `<div><span>${escapeHTML(row.left)}</span><strong>${escapeHTML(row.target)}</strong><span>${escapeHTML(row.right)}</span></div>`).join("")
    : "<p>No matching token occurs in the current sample.</p>";
}

function renderCollocations() {
  const rows = collocations(analysis.tokens, { minCount: Number(elements.minCount.value) });
  elements.collocationTable.innerHTML = rows.slice(0, 12).map((item, index) => `<tr><td>${index + 1}</td><td><code>${escapeHTML(item.first)} ${escapeHTML(item.second)}</code></td><td>${item.count}</td><td>${item.pmi.toFixed(2)}</td></tr>`).join("") || '<tr><td colspan="4">No pair meets the minimum count.</td></tr>';
  const strongest = rows[0];
  elements.pmiNote.textContent = strongest
    ? `Highest displayed PMI: “${strongest.first} ${strongest.second}” (${strongest.pmi.toFixed(2)} bits, count ${strongest.count}). Raise the count threshold to test whether the ranking is stable.`
    : "Lower the minimum count or use a larger sample to reveal candidate collocations.";
}

function render() {
  analysis = analyzeCorpus(elements.text.value, { samplePercent: Number(elements.sample.value) });
  elements.sampleValue.value = `${elements.sample.value}%`;
  elements.tokens.textContent = analysis.tokenCount.toLocaleString();
  elements.types.textContent = analysis.typeCount.toLocaleString();
  elements.ratio.textContent = analysis.typeTokenRatio.toFixed(2);
  elements.available.textContent = analysis.totalAvailable.toLocaleString();
  renderFrequency(); renderTarget(); renderCollocations();
}

elements.corpus.addEventListener("change", loadCorpus);
elements.text.addEventListener("input", render);
elements.sample.addEventListener("input", render);
elements.target.addEventListener("input", renderTarget);
elements.minCount.addEventListener("change", renderCollocations);

loadCorpus();
