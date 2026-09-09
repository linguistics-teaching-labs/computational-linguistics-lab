import { distanceExamples } from "./examples.js";
import { editDistance, toUnits } from "./edit-distance.js";

const elements = {
  example: document.querySelector("#distance-example"),
  note: document.querySelector("#distance-note"),
  unitInputs: [...document.querySelectorAll('input[name="unit"]')],
  source: document.querySelector("#source-form"),
  target: document.querySelector("#target-form"),
  compareForms: document.querySelector("#compare-forms"),
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
let inspectedCell = null;

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

function prefixText(units, length) {
  if (length === 0) return "∅";
  return units.slice(0, length).join(selectedMode() === "character" ? "" : " ");
}

function operationLabel(operation) {
  return ({
    match: "match",
    substitute: "substitution",
    delete: "deletion",
    insert: "insertion"
  })[operation] ?? operation;
}

function renderBaseExplanation() {
  const currentCosts = costs();
  elements.cellExplanation.innerHTML = `
    <p><strong>Base cases:</strong> <code>d(0, 0) = 0</code> because transforming an empty prefix into an empty prefix requires no edits.</p>
    <ul class="calculation-list">
      <li>The top row repeatedly inserts one target unit: <code>d(0, j) = d(0, j−1) + ${formatCost(currentCosts.insertion)}</code>.</li>
      <li>The first column repeatedly deletes one source unit: <code>d(i, 0) = d(i−1, 0) + ${formatCost(currentCosts.deletion)}</code>.</li>
    </ul>
    <p class="calculation-note">Move the slider to calculate an interior cell. Each interior value takes the minimum of its diagonal, upper, and left alternatives.</p>`;
}

function renderCellExplanation(row, column) {
  const cell = result.matrix[row][column];
  const sourceUnit = result.sourceUnits[row - 1];
  const targetUnit = result.targetUnits[column - 1];
  const sourcePrefix = prefixText(result.sourceUnits, row);
  const targetPrefix = prefixText(result.targetUnits, column);
  const candidateHTML = cell.candidates.map(candidate => {
    const [previousRow, previousColumn] = candidate.previous;
    const previousCost = result.matrix[previousRow][previousColumn].cost;
    const addedCost = candidate.cost - previousCost;
    let direction;
    let action;
    if (candidate.operation === "match" || candidate.operation === "substitute") {
      direction = "Diagonal";
      action = candidate.operation === "match"
        ? `match <code>${escapeHTML(sourceUnit)}</code> with <code>${escapeHTML(targetUnit)}</code>`
        : `substitute <code>${escapeHTML(sourceUnit)}</code> with <code>${escapeHTML(targetUnit)}</code>`;
    } else if (candidate.operation === "delete") {
      direction = "From above";
      action = `delete source unit <code>${escapeHTML(sourceUnit)}</code>`;
    } else {
      direction = "From the left";
      action = `insert target unit <code>${escapeHTML(targetUnit)}</code>`;
    }
    const selected = candidate.operation === cell.operation
      && candidate.previous[0] === cell.previous[0]
      && candidate.previous[1] === cell.previous[1];
    return `<li${selected ? ' class="selected-calculation"' : ""}><strong>${direction} — ${action}:</strong> start with adjacent cell <code>d(${previousRow}, ${previousColumn}) = ${formatCost(previousCost)}</code>, then add the ${operationLabel(candidate.operation)} cost <code>${formatCost(addedCost)}</code>. Therefore, <code>${formatCost(previousCost)} + ${formatCost(addedCost)} = ${formatCost(candidate.cost)}</code>.</li>`;
  }).join("");
  const candidateCosts = cell.candidates.map(candidate => formatCost(candidate.cost));
  const tied = cell.candidates.filter(candidate => candidate.cost === cell.cost);
  const tieNote = tied.length > 1
    ? ` There is a tie among ${tied.map(candidate => operationLabel(candidate.operation)).join(", ")}; the lab follows the ${operationLabel(cell.operation)} path to display one reproducible optimal alignment.`
    : ` The ${operationLabel(cell.operation)} alternative is uniquely cheapest.`;

  elements.cellExplanation.innerHTML = `
    <p><strong>Cell <code>d(${row}, ${column})</code>:</strong> compare source prefix <code>${escapeHTML(sourcePrefix)}</code> with target prefix <code>${escapeHTML(targetPrefix)}</code>. For the diagonal alternative, the final source unit <code>${escapeHTML(sourceUnit)}</code> is aligned with the final target unit <code>${escapeHTML(targetUnit)}</code>.</p>
    <ul class="calculation-list">${candidateHTML}</ul>
    <p class="calculation-result"><strong>Choose the minimum:</strong> <code>d(${row}, ${column}) = min(${candidateCosts.join(", ")}) = ${formatCost(cell.cost)}</code>.${tieNote}</p>`;
}

function renderMatrix() {
  const revealed = Number(elements.cellSlider.value);
  const total = result.sourceUnits.length * result.targetUnits.length;
  elements.cellCount.value = `${revealed} / ${total}`;
  elements.matrixProgress.textContent = revealed === total ? "Matrix complete" : `${total - revealed} interior cell${total - revealed === 1 ? "" : "s"} remaining`;

  const header = `<thead><tr><th aria-label="Empty prefix"></th><th class="unit-axis">∅</th>${result.targetUnits.map(unit => `<th class="unit-axis">${escapeHTML(unit)}</th>`).join("")}</tr></thead>`;
  const latestRow = revealed > 0 && result.targetUnits.length
    ? Math.floor((revealed - 1) / result.targetUnits.length) + 1
    : null;
  const latestColumn = revealed > 0 && result.targetUnits.length
    ? ((revealed - 1) % result.targetUnits.length) + 1
    : null;
  const inspectedVisible = inspectedCell
    && inspectedCell.row > 0
    && inspectedCell.column > 0
    && cellSequenceNumber(inspectedCell.row, inspectedCell.column) <= revealed;
  const explanationRow = inspectedVisible ? inspectedCell.row : latestRow;
  const explanationColumn = inspectedVisible ? inspectedCell.column : latestColumn;
  const rows = [];
  for (let row = 0; row <= result.sourceUnits.length; row += 1) {
    const label = row === 0 ? "∅" : result.sourceUnits[row - 1];
    const cells = [];
    for (let column = 0; column <= result.targetUnits.length; column += 1) {
      const base = row === 0 || column === 0;
      const sequence = base ? 0 : cellSequenceNumber(row, column);
      const visible = base || sequence <= revealed;
      const current = !base && row === explanationRow && column === explanationColumn;
      const cell = result.matrix[row][column];
      const operationClass = visible ? `operation-${cell.operation}` : "unrevealed";
      const interactive = visible && !base;
      cells.push(`<td class="${operationClass}${current ? " current-cell" : ""}" title="${interactive ? "Select to explain this calculation" : (visible ? escapeHTML(cell.operation) : "Not calculated yet")}"${interactive ? ` data-row="${row}" data-column="${column}" role="button" tabindex="0" aria-label="Explain cell ${row}, ${column}, value ${formatCost(cell.cost)}"` : ""}>${visible ? formatCost(cell.cost) : "·"}</td>`);
    }
    rows.push(`<tr><th class="unit-axis">${escapeHTML(label)}</th>${cells.join("")}</tr>`);
  }
  elements.matrix.innerHTML = `${header}<tbody>${rows.join("")}</tbody>`;

  if (revealed === 0 || !result.targetUnits.length || !result.sourceUnits.length) {
    renderBaseExplanation();
    return;
  }
  renderCellExplanation(explanationRow, explanationColumn);
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
  if (resetMatrix) {
    elements.cellSlider.value = "0";
    inspectedCell = null;
  }
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
  elements.example.value = key;
  elements.note.textContent = example.note;
  elements.source.value = example.source;
  elements.target.value = example.target;
  const input = elements.unitInputs.find(item => item.value === example.mode);
  if (input) input.checked = true;
  recompute({ resetMatrix: true });
}

function markAsCustom() {
  elements.example.value = "custom";
  elements.note.textContent = distanceExamples.custom.note;
}

function generateCompleteMatrix() {
  markAsCustom();
  recompute();
  elements.cellSlider.value = elements.cellSlider.max;
  inspectedCell = null;
  renderMatrix();
}

for (const [key, example] of Object.entries(distanceExamples)) {
  elements.example.add(new Option(example.label, key));
}

elements.example.addEventListener("change", event => loadExample(event.target.value));
elements.unitInputs.forEach(input => input.addEventListener("change", () => recompute({ resetMatrix: true })));
elements.source.addEventListener("input", () => { markAsCustom(); recompute({ resetMatrix: true }); });
elements.target.addEventListener("input", () => { markAsCustom(); recompute({ resetMatrix: true }); });
elements.compareForms.addEventListener("click", generateCompleteMatrix);
[elements.source, elements.target].forEach(input => input.addEventListener("keydown", event => {
  if (event.key === "Enter") generateCompleteMatrix();
}));
elements.lowercase.addEventListener("change", () => recompute({ resetMatrix: true }));
elements.cellSlider.addEventListener("input", () => { inspectedCell = null; renderMatrix(); });
elements.revealMatrix.addEventListener("click", () => {
  elements.cellSlider.value = elements.cellSlider.max;
  inspectedCell = null;
  renderMatrix();
});
elements.matrix.addEventListener("click", event => {
  const cell = event.target.closest("td[data-row][data-column]");
  if (!cell) return;
  inspectedCell = { row: Number(cell.dataset.row), column: Number(cell.dataset.column) };
  renderMatrix();
});
elements.matrix.addEventListener("keydown", event => {
  if (event.key !== "Enter" && event.key !== " ") return;
  const cell = event.target.closest("td[data-row][data-column]");
  if (!cell) return;
  event.preventDefault();
  inspectedCell = { row: Number(cell.dataset.row), column: Number(cell.dataset.column) };
  renderMatrix();
});
[elements.insertion, elements.deletion, elements.substitution].forEach(input => input.addEventListener("input", recompute));

loadExample("classic");
