import { distanceExamples } from "./examples.js";
import { editDistance, toUnits } from "./edit-distance.js";

const elements = {
  example: document.querySelector("#distance-example"),
  note: document.querySelector("#distance-note"),
  unitInputs: [...document.querySelectorAll('input[name="unit"]')],
  source: document.querySelector("#source-form"),
  target: document.querySelector("#target-form"),
  lowercase: document.querySelector("#distance-lowercase"),
  sourceUnits: document.querySelector("#source-units"),
  targetUnits: document.querySelector("#target-units"),
  cellSlider: document.querySelector("#cell-slider"),
  cellCount: document.querySelector("#cell-count"),
  revealMatrix: document.querySelector("#reveal-matrix"),
  matrixProgress: document.querySelector("#matrix-progress"),
  matrix: document.querySelector("#distance-matrix"),
  cellExplanation: document.querySelector("#cell-explanation"),
  insertion: document.querySelector("#insertion-cost"),
  deletion: document.querySelector("#deletion-cost"),
  substitution: document.querySelector("#substitution-cost"),
  insertionValue: document.querySelector("#insertion-value"),
  deletionValue: document.querySelector("#deletion-value"),
  substitutionValue: document.querySelector("#substitution-value"),
  distanceValue: document.querySelector("#distance-value"),
  editCount: document.querySelector("#edit-count"),
  unitLabel: document.querySelector("#unit-label"),
  alignment: document.querySelector("#alignment-strip"),
  operationSummary: document.querySelector("#operation-summary")
};

let result;

function escapeHTML(value) {
  return String(value).replace(/[&<>'"]/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
  })[character]);
}

function selectedMode() {
  return elements.unitInputs.find(input => input.checked)?.value ?? "character";
}

function costs() {
  return {
    insertion: Number(elements.insertion.value),
    deletion: Number(elements.deletion.value),
    substitution: Number(elements.substitution.value)
  };
}

function formatCost(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0$/, "");
}

function renderUnits() {
  const chip = unit => `<span class="unit-chip">${escapeHTML(unit)}</span>`;
  elements.sourceUnits.innerHTML = result.sourceUnits.map(chip).join("") || '<span class="empty-units">No units</span>';
  elements.targetUnits.innerHTML = result.targetUnits.map(chip).join("") || '<span class="empty-units">No units</span>';
}

function cellSequenceNumber(row, column) {
  return (row - 1) * result.targetUnits.length + column;
}

function renderMatrix() {
  const revealed = Number(elements.cellSlider.value);
  const total = result.sourceUnits.length * result.targetUnits.length;
  elements.cellCount.value = `${revealed} / ${total}`;
  elements.matrixProgress.textContent = revealed === total ? "Matrix complete" : `${total - revealed} interior cell${total - revealed === 1 ? "" : "s"} remaining`;

  const header = `<thead><tr><th aria-label="Empty prefix"></th><th class="unit-axis">∅</th>${result.targetUnits.map(unit => `<th class="unit-axis">${escapeHTML(unit)}</th>`).join("")}</tr></thead>`;
  const rows = [];
  for (let row = 0; row <= result.sourceUnits.length; row += 1) {
    const label = row === 0 ? "∅" : result.sourceUnits[row - 1];
    const cells = [];
    for (let column = 0; column <= result.targetUnits.length; column += 1) {
      const base = row === 0 || column === 0;
      const sequence = base ? 0 : cellSequenceNumber(row, column);
      const visible = base || sequence <= revealed;
      const recent = !base && sequence === revealed;
      const cell = result.matrix[row][column];
      const operationClass = visible ? `operation-${cell.operation}` : "unrevealed";
      cells.push(`<td class="${operationClass}${recent ? " current-cell" : ""}" title="${visible ? escapeHTML(cell.operation) : "Not calculated yet"}">${visible ? formatCost(cell.cost) : "·"}</td>`);
    }
    rows.push(`<tr><th class="unit-axis">${escapeHTML(label)}</th>${cells.join("")}</tr>`);
  }
  elements.matrix.innerHTML = `${header}<tbody>${rows.join("")}</tbody>`;

  if (revealed === 0 || !result.targetUnits.length || !result.sourceUnits.length) {
    elements.cellExplanation.innerHTML = "<strong>Base cases:</strong> the top row accumulates insertion costs; the first column accumulates deletion costs. Interior cells will compare three possible previous paths.";
    return;
  }
  const row = Math.floor((revealed - 1) / result.targetUnits.length) + 1;
  const column = ((revealed - 1) % result.targetUnits.length) + 1;
  const cell = result.matrix[row][column];
  const labels = { match: "match/substitute", delete: "delete", insert: "insert" };
  elements.cellExplanation.innerHTML = `<strong>Cell (${row}, ${column}):</strong> aligning <code>${escapeHTML(result.sourceUnits[row - 1])}</code> with <code>${escapeHTML(result.targetUnits[column - 1])}</code> compares ${cell.candidates.map(candidate => `${labels[candidate.operation] ?? candidate.operation} = <code>${formatCost(candidate.cost)}</code>`).join(", ")}. The minimum is <code>${formatCost(cell.cost)}</code>.`;
}

function renderAlignment() {
  const edited = result.operations.filter(item => item.operation !== "match");
  const names = { match: "match", substitute: "substitute", delete: "delete", insert: "insert" };
  elements.distanceValue.textContent = formatCost(result.distance);
  elements.editCount.textContent = edited.length.toLocaleString();
  elements.unitLabel.textContent = ({ character: "Character", word: "Word", sound: "Sound symbol" })[selectedMode()];
  elements.alignment.innerHTML = result.operations.map(item => `
    <div class="alignment-step ${item.operation}">
      <span class="alignment-source">${escapeHTML(item.source ?? "∅")}</span>
      <span class="alignment-operation">${escapeHTML(names[item.operation])}<small>+${formatCost(item.cost)}</small></span>
      <span class="alignment-target">${escapeHTML(item.target ?? "∅")}</span>
    </div>`).join("") || '<p class="empty-units">Enter two forms to construct an alignment.</p>';

  const counts = edited.reduce((summary, item) => {
    summary[item.operation] = (summary[item.operation] ?? 0) + 1;
    return summary;
  }, {});
  const operationNames = {
    substitute: ["substitution", "substitutions"],
    insert: ["insertion", "insertions"],
    delete: ["deletion", "deletions"]
  };
  const parts = ["substitute", "insert", "delete"]
    .filter(operation => counts[operation])
    .map(operation => `${counts[operation]} ${operationNames[operation][counts[operation] === 1 ? 0 : 1]}`);
  elements.operationSummary.textContent = parts.length
    ? `One cheapest path uses ${parts.join(", ")}. Matches add no cost.`
    : "The two sequences match under the selected units and normalization.";
}

function recompute({ resetMatrix = false } = {}) {
  const mode = selectedMode();
  const options = { lowercase: elements.lowercase.checked };
  const sourceUnits = toUnits(elements.source.value, mode, options);
  const targetUnits = toUnits(elements.target.value, mode, options);
  result = editDistance(sourceUnits, targetUnits, costs());

  const total = sourceUnits.length * targetUnits.length;
  elements.cellSlider.max = String(total);
  if (resetMatrix) elements.cellSlider.value = "0";
  if (Number(elements.cellSlider.value) > total) elements.cellSlider.value = String(total);

  elements.insertionValue.value = Number(elements.insertion.value).toFixed(2);
  elements.deletionValue.value = Number(elements.deletion.value).toFixed(2);
  elements.substitutionValue.value = Number(elements.substitution.value).toFixed(2);
  renderUnits();
  renderMatrix();
  renderAlignment();
}

function loadExample(key) {
  const example = distanceExamples[key];
  elements.note.textContent = example.note;
  elements.source.value = example.source;
  elements.target.value = example.target;
  const input = elements.unitInputs.find(item => item.value === example.mode);
  if (input) input.checked = true;
  recompute({ resetMatrix: true });
}

for (const [key, example] of Object.entries(distanceExamples)) {
  elements.example.add(new Option(example.label, key));
}

elements.example.addEventListener("change", event => loadExample(event.target.value));
elements.unitInputs.forEach(input => input.addEventListener("change", () => recompute({ resetMatrix: true })));
elements.source.addEventListener("input", () => recompute({ resetMatrix: true }));
elements.target.addEventListener("input", () => recompute({ resetMatrix: true }));
elements.lowercase.addEventListener("change", () => recompute({ resetMatrix: true }));
elements.cellSlider.addEventListener("input", renderMatrix);
elements.revealMatrix.addEventListener("click", () => {
  elements.cellSlider.value = elements.cellSlider.max;
  renderMatrix();
});
[elements.insertion, elements.deletion, elements.substitution].forEach(input => input.addEventListener("input", recompute));

loadExample("classic");
