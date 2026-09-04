import { requestDetectionData } from "./data.js";
import { evaluateAtThreshold, evaluateGroups, outcomeLabel, thresholdTable } from "./metrics.js";

const elements = {
  threshold: document.querySelector("#threshold-slider"), thresholdValue: document.querySelector("#threshold-value"),
  accuracy: document.querySelector("#metric-accuracy"), precision: document.querySelector("#metric-precision"), recall: document.querySelector("#metric-recall"), f1: document.querySelector("#metric-f1"),
  tp: document.querySelector("#matrix-tp"), fp: document.querySelector("#matrix-fp"), tn: document.querySelector("#matrix-tn"), fn: document.querySelector("#matrix-fn"),
  cases: document.querySelector("#case-table"), thresholdTable: document.querySelector("#threshold-table"), groupTable: document.querySelector("#group-table"),
  tradeoff: document.querySelector("#tradeoff-note"), disparity: document.querySelector("#disparity-note")
};

const percentage = value => `${(value * 100).toFixed(0)}%`;

function escapeHTML(value) {
  return String(value).replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
}

function render() {
  const threshold = Number(elements.threshold.value);
  const evaluation = evaluateAtThreshold(requestDetectionData, threshold);
  elements.thresholdValue.value = threshold.toFixed(2);
  elements.accuracy.textContent = percentage(evaluation.metrics.accuracy);
  elements.precision.textContent = percentage(evaluation.metrics.precision);
  elements.recall.textContent = percentage(evaluation.metrics.recall);
  elements.f1.textContent = percentage(evaluation.metrics.f1);
  elements.tp.textContent = evaluation.confusion.tp;
  elements.fp.textContent = evaluation.confusion.fp;
  elements.tn.textContent = evaluation.confusion.tn;
  elements.fn.textContent = evaluation.confusion.fn;
  elements.cases.innerHTML = evaluation.cases.map(item => `<tr class="${item.correct ? "correct" : "error"}"><td><span class="outcome ${item.outcome}">${outcomeLabel(item.outcome)}</span></td><td>${escapeHTML(item.text)}</td><td>${item.style}</td><td>${item.score.toFixed(2)}</td><td>${item.label ? "Request" : "Not request"}</td><td>${item.predicted ? "Request" : "Not request"}</td></tr>`).join("");

  const thresholdRows = thresholdTable(requestDetectionData);
  elements.thresholdTable.innerHTML = thresholdRows.map(row => `<tr class="${Math.abs(row.threshold - threshold) < 0.001 ? "selected" : ""}"><td>${row.threshold.toFixed(2)}</td><td>${percentage(row.metrics.precision)}</td><td>${percentage(row.metrics.recall)}</td><td>${percentage(row.metrics.f1)}</td><td>${row.confusion.fp}</td><td>${row.confusion.fn}</td></tr>`).join("");
  const low = thresholdRows[0];
  const high = thresholdRows.at(-1);
  elements.tradeoff.textContent = `From threshold ${low.threshold.toFixed(1)} to ${high.threshold.toFixed(1)}, false positives change from ${low.confusion.fp} to ${high.confusion.fp}, while false negatives change from ${low.confusion.fn} to ${high.confusion.fn}. A threshold encodes which error is more costly.`;

  const groups = evaluateGroups(requestDetectionData, threshold);
  elements.groupTable.innerHTML = groups.map(row => `<tr><td>${row.group}</td><td>${row.total}</td><td>${percentage(row.metrics.precision)}</td><td>${percentage(row.metrics.recall)}</td><td>${percentage(row.metrics.f1)}</td><td>${row.confusion.fp}</td><td>${row.confusion.fn}</td></tr>`).join("");
  const recalls = groups.map(group => group.metrics.recall);
  const gap = Math.max(...recalls) - Math.min(...recalls);
  elements.disparity.textContent = `Recall differs by ${(gap * 100).toFixed(0)} percentage points between the two writing styles at this threshold. The dataset is synthetic, so the gap is a teaching prompt—not an empirical estimate about real users.`;
}

elements.threshold.addEventListener("input", render);
render();
