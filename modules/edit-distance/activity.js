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
  traceGate: document.querySelector("#trace-gate"),
  traceActivity: document.querySelector("#trace-activity"),
  traceRoundLabel: document.querySelector("#trace-round-label"),
  tracePrompt: document.querySelector("#trace-prompt"),
  traceInstruction: document.querySelector("#trace-instruction"),
  traceCost: document.querySelector("#trace-cost"),
  traceMatrix: document.querySelector("#trace-matrix"),
  tracePosition: document.querySelector("#trace-position"),
  traceOptions: document.querySelector("#trace-options"),
  alignment: document.querySelector("#alignment-strip"),
  operationSummary: document.querySelector("#operation-summary"),
  undoTrace: document.querySelector("#undo-trace"),
  resetTrace: document.querySelector("#reset-trace"),
  traceFeedback: document.querySelector("#trace-feedback"),
  startHigherPath: document.querySelector("#start-higher-path"),
  retryTrace: document.querySelector("#retry-trace"),
  pathComparison: document.querySelector("#path-comparison"),
  comparisonPaths: document.querySelector("#comparison-paths"),
  comparisonConclusion: document.querySelector("#comparison-conclusion")
};

let result;
let inspectedCell = null;
let traceState;

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

function traceChoices() {
  if (!traceState || traceState.complete) return [];
  const { row, column } = traceState;
  const currentCosts = costs();
  const choices = [];
  if (row > 0 && column > 0) {
    const same = result.sourceUnits[row - 1] === result.targetUnits[column - 1];
    choices.push({
      key: "diagonal",
      direction: "Diagonal ↖",
      operation: same ? "match" : "substitute",
      previous: [row - 1, column - 1],
      source: result.sourceUnits[row - 1],
      target: result.targetUnits[column - 1],
      cost: same ? 0 : currentCosts.substitution
    });
  }
  if (row > 0) {
    choices.push({
      key: "up",
      direction: "Up ↑",
      operation: "delete",
      previous: [row - 1, column],
      source: result.sourceUnits[row - 1],
      target: null,
      cost: currentCosts.deletion
    });
  }
  if (column > 0) {
    choices.push({
      key: "left",
      direction: "Left ←",
      operation: "insert",
      previous: [row, column - 1],
      source: null,
      target: result.targetUnits[column - 1],
      cost: currentCosts.insertion
    });
  }
  return choices.map(choice => ({
    ...choice,
    optimal: Math.abs(result.matrix[choice.previous[0]][choice.previous[1]].cost + choice.cost
      - result.matrix[row][column].cost) < 1e-9
  }));
}

function traceOperationsForward() {
  return [...(traceState?.operations ?? [])].reverse();
}

function traceTotal(operations = traceState?.operations ?? []) {
  return operations.reduce((sum, item) => sum + item.cost, 0);
}

function operationParts(operations) {
  const counts = operations.filter(item => item.operation !== "match").reduce((summary, item) => {
    summary[item.operation] = (summary[item.operation] ?? 0) + 1;
    return summary;
  }, {});
  const labels = {
    substitute: ["substitution", "substitutions"],
    insert: ["insertion", "insertions"],
    delete: ["deletion", "deletions"]
  };
  return ["substitute", "insert", "delete"]
    .filter(operation => counts[operation])
    .map(operation => `${counts[operation]} ${labels[operation][counts[operation] === 1 ? 0 : 1]}`);
}

function renderOperationStrip(operations, target) {
  const names = { match: "match", substitute: "substitute", delete: "delete", insert: "insert" };
  target.innerHTML = operations.map(item => `
    <div class="alignment-step ${item.operation}">
      <span class="alignment-source">${escapeHTML(item.source ?? "∅")}</span>
      <span class="alignment-operation">${escapeHTML(names[item.operation])}<small>+${formatCost(item.cost)}</small></span>
      <span class="alignment-target">${escapeHTML(item.target ?? "∅")}</span>
    </div>`).join("") || '<p class="empty-units">No moves chosen yet.</p>';
}

function renderTraceMatrix() {
  const choices = traceChoices();
  const choiceByCell = new Map(choices.map(choice => [choice.previous.join(","), choice]));
  const visited = new Set((traceState?.visited ?? []).map(cell => cell.join(",")));
  const header = `<thead><tr><th aria-label="Empty prefix"></th><th class="unit-axis">∅</th>${result.targetUnits.map(unit => `<th class="unit-axis">${escapeHTML(unit)}</th>`).join("")}</tr></thead>`;
  const rows = [];
  for (let row = 0; row <= result.sourceUnits.length; row += 1) {
    const label = row === 0 ? "∅" : result.sourceUnits[row - 1];
    const cells = [];
    for (let column = 0; column <= result.targetUnits.length; column += 1) {
      const key = `${row},${column}`;
      const choice = choiceByCell.get(key);
      const current = traceState && row === traceState.row && column === traceState.column;
      const classes = [
        `operation-${result.matrix[row][column].operation}`,
        visited.has(key) ? "trace-visited" : "",
        current ? "trace-current" : "",
        choice ? "trace-choice" : "",
        choice?.optimal ? "trace-optimal-choice" : ""
      ].filter(Boolean).join(" ");
      const interactive = Boolean(choice);
      const title = choice
        ? `${choice.direction}: ${operationLabel(choice.operation)}, +${formatCost(choice.cost)}`
        : `Cell ${row}, ${column}: ${formatCost(result.matrix[row][column].cost)}`;
      cells.push(`<td class="${classes}" title="${escapeHTML(title)}"${interactive ? ` data-trace-move="${choice.key}" role="button" tabindex="0" aria-label="${escapeHTML(title)}"` : ""}>${formatCost(result.matrix[row][column].cost)}</td>`);
    }
    rows.push(`<tr><th class="unit-axis">${escapeHTML(label)}</th>${cells.join("")}</tr>`);
  }
  elements.traceMatrix.innerHTML = `${header}<tbody>${rows.join("")}</tbody>`;
}

function resetCurrentTrace() {
  traceState.row = result.sourceUnits.length;
  traceState.column = result.targetUnits.length;
  traceState.operations = [];
  traceState.visited = [[traceState.row, traceState.column]];
  traceState.complete = traceState.row === 0 && traceState.column === 0;
}

function resetTraceActivity() {
  traceState = {
    round: 1,
    minimumPath: null,
    row: result.sourceUnits.length,
    column: result.targetUnits.length,
    operations: [],
    visited: [[result.sourceUnits.length, result.targetUnits.length]],
    complete: result.sourceUnits.length === 0 && result.targetUnits.length === 0
  };
  elements.traceFeedback.className = "trace-feedback";
  elements.traceFeedback.innerHTML = "";
  elements.startHigherPath.hidden = true;
  elements.retryTrace.hidden = true;
  elements.pathComparison.hidden = true;
}

function renderComparison() {
  const minimum = traceState.minimumPath;
  const higher = { operations: traceOperationsForward(), cost: traceTotal() };
  const card = (title, path, className) => {
    const parts = operationParts(path.operations);
    return `<article class="comparison-path ${className}">
      <p class="callout-label">${escapeHTML(title)}</p>
      <p class="comparison-cost"><span>Total cost</span><strong>${formatCost(path.cost)}</strong></p>
      <div class="alignment-strip compact-alignment">${path.operations.map(item => `
        <div class="alignment-step ${item.operation}">
          <span class="alignment-source">${escapeHTML(item.source ?? "∅")}</span>
          <span class="alignment-operation">${escapeHTML(item.operation)}<small>+${formatCost(item.cost)}</small></span>
          <span class="alignment-target">${escapeHTML(item.target ?? "∅")}</span>
        </div>`).join("")}</div>
      <p>${parts.length ? `Edits: ${escapeHTML(parts.join(", "))}.` : "No non-matching edits."}</p>
    </article>`;
  };
  elements.comparisonPaths.innerHTML = card("Minimum-cost path", minimum, "minimum-path")
    + card("Higher-cost path", higher, "higher-path");
  elements.comparisonConclusion.innerHTML = `<strong>Cost difference:</strong> ${formatCost(higher.cost)} − ${formatCost(minimum.cost)} = <strong>${formatCost(higher.cost - minimum.cost)}</strong>. Both paths transform the same source into the same target, but the second path uses a more expensive sequence of edits.`;
  elements.pathComparison.hidden = false;
}

function finishTraceRound() {
  const total = traceTotal();
  if (traceState.round === 1) {
    if (Math.abs(total - result.distance) < 1e-9) {
      traceState.minimumPath = { operations: traceOperationsForward(), cost: total };
      elements.traceFeedback.className = "trace-feedback success";
      elements.traceFeedback.innerHTML = `<strong>Minimum path found.</strong> Your edits cost ${formatCost(total)}, exactly the value in the bottom-right cell. Now construct a different path whose cost is higher.`;
      elements.startHigherPath.hidden = false;
    } else {
      elements.traceFeedback.className = "trace-feedback needs-retry";
      elements.traceFeedback.innerHTML = `<strong>This path costs ${formatCost(total)}, not the minimum ${formatCost(result.distance)}.</strong> Try Round 1 again and choose predecessor cells marked “keeps minimum.”`;
      elements.retryTrace.hidden = false;
    }
  } else if (total > traceState.minimumPath.cost + 1e-9) {
    elements.traceFeedback.className = "trace-feedback success";
    elements.traceFeedback.innerHTML = `<strong>Higher-cost path found.</strong> Its edits cost ${formatCost(total)}, compared with ${formatCost(traceState.minimumPath.cost)} for your minimum path.`;
    renderComparison();
  } else {
    elements.traceFeedback.className = "trace-feedback needs-retry";
    elements.traceFeedback.innerHTML = `<strong>You found another minimum-cost path.</strong> That is a useful tie, but this round asks for a cost above ${formatCost(traceState.minimumPath.cost)}. Try again and include at least one option marked “raises cost.”`;
    elements.retryTrace.hidden = false;
  }
}

function chooseTraceMove(key) {
  const choice = traceChoices().find(item => item.key === key);
  if (!choice) return;
  traceState.operations.push(choice);
  [traceState.row, traceState.column] = choice.previous;
  traceState.visited.push(choice.previous);
  traceState.complete = traceState.row === 0 && traceState.column === 0;
  renderTraceActivity();
  if (traceState.complete) finishTraceRound();
}

function renderTraceActivity() {
  const totalCells = result.sourceUnits.length * result.targetUnits.length;
  const matrixComplete = Number(elements.cellSlider.value) === totalCells;
  elements.distanceValue.textContent = formatCost(result.distance);
  elements.editCount.textContent = result.operations.filter(item => item.operation !== "match").length.toLocaleString();
  elements.unitLabel.textContent = ({ character: "Character", word: "Word", sound: "Sound symbol" })[selectedMode()];
  elements.traceGate.innerHTML = matrixComplete
    ? `<strong>Matrix complete.</strong> Backtracing is unlocked. The number in each cell is its minimum prefix cost; your chosen path cost is the sum of the edits you make.`
    : `<strong>Complete Step 2 first.</strong> Reveal all ${totalCells} interior cells to unlock the backtrace activity.`;
  elements.traceActivity.hidden = !matrixComplete;
  if (!matrixComplete || !traceState) return;

  elements.traceRoundLabel.textContent = `Round ${traceState.round} of 2`;
  elements.tracePrompt.textContent = traceState.round === 1 ? "Find a minimum-cost path" : "Find a different, higher-cost path";
  elements.traceInstruction.textContent = traceState.round === 1
    ? "At every cell, choose a predecessor marked “keeps minimum.” Continue until you reach d(0, 0)."
    : "Deliberately choose at least one predecessor marked “raises cost,” then continue to d(0, 0).";
  elements.traceCost.textContent = formatCost(traceTotal());
  elements.tracePosition.innerHTML = traceState.complete
    ? `<strong>Reached <code>d(0, 0)</code>.</strong>`
    : `Current cell: <strong><code>d(${traceState.row}, ${traceState.column})</code></strong>. Choose where it came from:`;
  elements.traceOptions.innerHTML = traceChoices().map(choice => `
    <button class="trace-option${choice.optimal ? " optimal" : " costly"}" type="button" data-trace-move="${choice.key}">
      <span>${escapeHTML(choice.direction)}</span>
      <strong>${escapeHTML(operationLabel(choice.operation))} <small>+${formatCost(choice.cost)}</small></strong>
      <em>${choice.optimal ? "keeps minimum" : "raises cost"}</em>
    </button>`).join("");
  elements.undoTrace.disabled = traceState.operations.length === 0 || traceState.complete;
  elements.resetTrace.disabled = traceState.operations.length === 0;
  renderTraceMatrix();

  const operations = traceOperationsForward();
  renderOperationStrip(operations, elements.alignment);
  const parts = operationParts(operations);
  elements.operationSummary.textContent = operations.length
    ? `${operations.length} move${operations.length === 1 ? "" : "s"} chosen${parts.length ? `: ${parts.join(", ")}` : "; all are matches"}. Current cost: ${formatCost(traceTotal())}.`
    : "Choose a direction to begin. The edit list will appear here in source-to-target order.";
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
  resetTraceActivity();
  renderUnits();
  renderMatrix();
  renderTraceActivity();
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
  renderTraceActivity();
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
  renderTraceActivity();
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

elements.cellSlider.addEventListener("input", renderTraceActivity);
elements.traceOptions.addEventListener("click", event => {
  const option = event.target.closest("[data-trace-move]");
  if (option) chooseTraceMove(option.dataset.traceMove);
});
elements.traceMatrix.addEventListener("click", event => {
  const cell = event.target.closest("[data-trace-move]");
  if (cell) chooseTraceMove(cell.dataset.traceMove);
});
elements.traceMatrix.addEventListener("keydown", event => {
  if (event.key !== "Enter" && event.key !== " ") return;
  const cell = event.target.closest("[data-trace-move]");
  if (!cell) return;
  event.preventDefault();
  chooseTraceMove(cell.dataset.traceMove);
});
elements.undoTrace.addEventListener("click", () => {
  if (!traceState.operations.length) return;
  traceState.operations.pop();
  traceState.visited.pop();
  [traceState.row, traceState.column] = traceState.visited.at(-1);
  traceState.complete = false;
  elements.traceFeedback.innerHTML = "";
  elements.startHigherPath.hidden = true;
  elements.retryTrace.hidden = true;
  elements.pathComparison.hidden = true;
  renderTraceActivity();
});
elements.resetTrace.addEventListener("click", () => {
  resetCurrentTrace();
  elements.traceFeedback.innerHTML = "";
  elements.startHigherPath.hidden = true;
  elements.retryTrace.hidden = true;
  elements.pathComparison.hidden = true;
  renderTraceActivity();
});
elements.retryTrace.addEventListener("click", () => {
  resetCurrentTrace();
  elements.traceFeedback.innerHTML = "";
  elements.retryTrace.hidden = true;
  elements.pathComparison.hidden = true;
  renderTraceActivity();
});
elements.startHigherPath.addEventListener("click", () => {
  traceState.round = 2;
  resetCurrentTrace();
  elements.traceFeedback.innerHTML = "";
  elements.startHigherPath.hidden = true;
  renderTraceActivity();
});

loadExample("classic");
