import { analogyPresets, associationWords, embeddingDimensions, representationComparison, teachingEmbeddings } from "./data.js";
import {
  anchorAssociation,
  analogyVector,
  cosineSimilarity,
  nearestNeighbors,
  projectAway,
  subtract
} from "./embedding-math.js";

const elements = {
  representationTabs: [...document.querySelectorAll("[data-representation]")],
  contextOptions: [...document.querySelectorAll("[data-context]")],
  representationKicker: document.querySelector("#representation-kicker"),
  representationTitle: document.querySelector("#representation-title"),
  representationDescription: document.querySelector("#representation-description"),
  representationUnit: document.querySelector("#representation-unit"),
  representationSize: document.querySelector("#representation-size"),
  representationExamples: document.querySelector("#representation-examples"),
  representationCosine: document.querySelector("#representation-cosine"),
  selectedVectorLabel: document.querySelector("#selected-vector-label"),
  coordinateChange: document.querySelector("#coordinate-change"),
  representationVector: document.querySelector("#representation-vector"),
  representationResult: document.querySelector("#representation-result"),
  conceptOptions: [...document.querySelectorAll("[data-concept-answer]")],
  conceptFeedback: document.querySelector("#concept-feedback"),
  focal: document.querySelector("#focal-word"),
  neighbors: document.querySelector("#neighbor-bars"),
  map: document.querySelector("#embedding-map"),
  first: document.querySelector("#first-word"),
  second: document.querySelector("#second-word"),
  cosineValue: document.querySelector("#cosine-value"),
  cosineInterpretation: document.querySelector("#cosine-interpretation"),
  vectorHead: document.querySelector("#vector-head"),
  vectorBody: document.querySelector("#vector-body"),
  analogyPresets: document.querySelector("#analogy-presets"),
  analogyA: document.querySelector("#analogy-a"),
  analogyB: document.querySelector("#analogy-b"),
  analogyC: document.querySelector("#analogy-c"),
  analogyEquation: document.querySelector("#analogy-equation"),
  analogyAnswer: document.querySelector("#analogy-answer"),
  analogyCandidates: document.querySelector("#analogy-candidates"),
  neutralize: document.querySelector("#neutralize-toggle"),
  associationChart: document.querySelector("#association-chart"),
  associationNote: document.querySelector("#association-note")
};

let activeRepresentation = "sparse";
let activeContext = "financial";

function escapeHTML(value) {
  return String(value).replace(/[&<>'"]/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
  })[character]);
}

function vector(word) {
  return teachingEmbeddings[word].vector;
}

const representationCopy = {
  sparse: {
    kicker: "Count-based embedding",
    title: "Sparse count vector",
    description: "Each dimension names a context word and stores how often it appeared near the target across a corpus. Most coordinates are zero.",
    unit: "One word type",
    size: "About |V| dimensions",
    examples: "Word-context matrix"
  },
  dense: {
    kicker: "Predictive embedding",
    title: "Dense static vector",
    description: "Training compresses distributional patterns into a shorter vector. Most coordinates are non-zero, but individual dimensions lack simple labels.",
    unit: "One word type",
    size: "Often 50–300 dimensions",
    examples: "Word2Vec, GloVe, fastText"
  },
  contextual: {
    kicker: "Context-sensitive embedding",
    title: "Contextual vector",
    description: "The model represents this occurrence of the word after combining information from the surrounding sentence.",
    unit: "One word token",
    size: "Often hundreds of dimensions",
    examples: "ELMo, BERT"
  }
};

function representationVectors(kind) {
  if (kind === "sparse") {
    return {
      labels: representationComparison.sparse.labels,
      financial: representationComparison.sparse.vector,
      river: representationComparison.sparse.vector
    };
  }
  if (kind === "dense") {
    return {
      labels: representationComparison.denseStatic.labels,
      financial: representationComparison.denseStatic.vector,
      river: representationComparison.denseStatic.vector
    };
  }
  return {
    labels: embeddingDimensions.map((_, index) => `H${index + 1}`),
    financial: representationComparison.contexts.financial.contextualVector,
    river: representationComparison.contexts.river.contextualVector
  };
}

function renderRepresentation() {
  const copy = representationCopy[activeRepresentation];
  const vectors = representationVectors(activeRepresentation);
  const current = vectors[activeContext];
  const otherContext = activeContext === "financial" ? "river" : "financial";
  const other = vectors[otherContext];
  const changed = current.filter((value, index) => Math.abs(value - other[index]) > 0.001).length;
  const cosine = cosineSimilarity(vectors.financial, vectors.river);

  for (const button of elements.representationTabs) {
    const selected = button.dataset.representation === activeRepresentation;
    button.setAttribute("aria-selected", String(selected));
    button.tabIndex = selected ? 0 : -1;
  }
  for (const button of elements.contextOptions) {
    button.setAttribute("aria-pressed", String(button.dataset.context === activeContext));
  }

  elements.representationKicker.textContent = copy.kicker;
  elements.representationTitle.textContent = copy.title;
  elements.representationDescription.textContent = copy.description;
  elements.representationUnit.textContent = copy.unit;
  elements.representationSize.textContent = copy.size;
  elements.representationExamples.textContent = copy.examples;
  elements.representationCosine.textContent = cosine.toFixed(3);
  elements.selectedVectorLabel.textContent = `Vector for “bank” in the ${representationComparison.contexts[activeContext].label.toLowerCase()} sentence`;
  elements.coordinateChange.textContent = `${changed} of ${current.length} shown coordinates change`;

  const maximum = Math.max(...current.map(value => Math.abs(value)), 1);
  elements.representationVector.innerHTML = current.map((value, index) => {
    const strength = Math.abs(value) / maximum * 100;
    const displayValue = activeRepresentation === "sparse" ? value : value.toFixed(2);
    return `<div class="representation-cell ${value < 0 ? "negative" : "positive"}" style="--strength:${strength}%">
      <span>${escapeHTML(vectors.labels[index])}</span><strong>${displayValue}</strong>
    </div>`;
  }).join("");

  if (activeRepresentation === "contextual") {
    const neighbors = representationComparison.contexts[activeContext].neighbors.map(word => `<span>${escapeHTML(word)}</span>`).join("");
    elements.representationResult.innerHTML = `<strong>The vector changes with the token’s context.</strong><p>Nearest sense words in this teaching example:</p><div class="sense-neighbors">${neighbors}</div>`;
  } else if (activeRepresentation === "sparse") {
    elements.representationResult.innerHTML = "<strong>The vector stays the same.</strong><p>This word-type vector pools counts from financial and river uses of <em>bank</em>. Its dimensions remain interpretable, but it combines the two senses.</p>";
  } else {
    elements.representationResult.innerHTML = "<strong>The vector stays the same.</strong><p>A static embedding compresses the word’s overall distribution into one dense vector, so both occurrences of <em>bank</em> receive the same representation.</p>";
  }
}

function checkConcept(answer) {
  const correct = answer === "contextual";
  for (const button of elements.conceptOptions) {
    button.classList.toggle("selected", button.dataset.conceptAnswer === answer);
    button.classList.toggle("correct", correct && button.dataset.conceptAnswer === answer);
  }
  elements.conceptFeedback.className = `concept-feedback ${correct ? "is-correct" : "needs-revision"}`;
  elements.conceptFeedback.textContent = correct
    ? "Correct. A contextual model creates a representation for each token, so sentence context can separate the two senses."
    : "Not quite. This is a word-type representation, so the same stored vector is reused in both sentences.";
}

function wordOptions(select) {
  for (const word of Object.keys(teachingEmbeddings)) select.add(new Option(word, word));
}

function renderNeighbors() {
  const focal = elements.focal.value;
  const neighbors = nearestNeighbors(vector(focal), teachingEmbeddings, { exclude: [focal], limit: 5 });
  elements.neighbors.innerHTML = neighbors.map(item => `
    <button type="button" class="neighbor-row" data-neighbor="${escapeHTML(item.word)}">
      <span>${escapeHTML(item.word)}</span>
      <i><b style="width:${Math.max(0, item.similarity) * 100}%"></b></i>
      <strong>${item.similarity.toFixed(3)}</strong>
    </button>`).join("");
  for (const button of elements.neighbors.querySelectorAll("[data-neighbor]")) {
    button.addEventListener("click", () => {
      elements.focal.value = button.dataset.neighbor;
      renderNeighbors();
    });
  }
  renderMap(focal, new Set(neighbors.map(item => item.word)));
}

function renderMap(focal, neighborSet) {
  const oldPoints = elements.map.querySelector("#map-points");
  if (oldPoints) oldPoints.remove();
  const namespace = "http://www.w3.org/2000/svg";
  const group = document.createElementNS(namespace, "g");
  group.id = "map-points";
  for (const [word, entry] of Object.entries(teachingEmbeddings)) {
    const point = document.createElementNS(namespace, "g");
    const activeClass = word === focal ? " focal" : neighborSet.has(word) ? " neighbor" : "";
    point.setAttribute("class", `map-point ${entry.group}${activeClass}`);
    point.setAttribute("transform", `translate(${entry.plot[0]} ${entry.plot[1]})`);
    const circle = document.createElementNS(namespace, "circle");
    circle.setAttribute("r", word === focal ? "2.5" : "1.7");
    const label = document.createElementNS(namespace, "text");
    label.setAttribute("x", "2.8");
    label.setAttribute("y", "1.2");
    label.textContent = word;
    point.append(circle, label);
    group.append(point);
  }
  elements.map.append(group);
}

function interpretation(similarity) {
  if (similarity >= 0.9) return "The vectors point in very similar directions in this embedding.";
  if (similarity >= 0.6) return "The vectors share substantial contextual structure, with meaningful differences.";
  if (similarity >= 0.2) return "The vectors have a modest positive relationship.";
  if (similarity > -0.2) return "The vectors are close to orthogonal, with little directional similarity.";
  return "The vectors point in substantially different directions.";
}

function renderSimilarity() {
  const first = elements.first.value;
  const second = elements.second.value;
  const similarity = cosineSimilarity(vector(first), vector(second));
  elements.cosineValue.textContent = similarity.toFixed(3);
  elements.cosineInterpretation.textContent = interpretation(similarity);
  elements.vectorHead.innerHTML = `<tr><th>Word</th>${embeddingDimensions.map(dimension => `<th>${dimension}</th>`).join("")}</tr>`;
  elements.vectorBody.innerHTML = [first, second].map(word => `<tr><th>${escapeHTML(word)}</th>${vector(word).map(value => `<td>${value.toFixed(2)}</td>`).join("")}</tr>`).join("");
}

function renderAnalogy() {
  const a = elements.analogyA.value;
  const b = elements.analogyB.value;
  const c = elements.analogyC.value;
  const query = analogyVector(vector(a), vector(b), vector(c));
  const candidates = nearestNeighbors(query, teachingEmbeddings, { exclude: [a, b, c], limit: 5 });
  elements.analogyEquation.textContent = `${b} − ${a} + ${c}`;
  elements.analogyAnswer.textContent = candidates[0]?.word ?? "No candidate";
  elements.analogyCandidates.innerHTML = candidates.map((item, index) => `
    <div class="analogy-candidate ${index === 0 ? "best" : ""}">
      <span>${index + 1}</span><strong>${escapeHTML(item.word)}</strong><small>cosine ${item.similarity.toFixed(3)}</small>
    </div>`).join("");
}

function loadPreset(key) {
  const preset = analogyPresets[key];
  elements.analogyA.value = preset.a;
  elements.analogyB.value = preset.b;
  elements.analogyC.value = preset.c;
  renderAnalogy();
}

function renderAssociations() {
  const woman = vector("woman");
  const man = vector("man");
  const direction = subtract(man, woman);
  const removeDirection = elements.neutralize.checked;
  const rows = associationWords.map(word => {
    const source = removeDirection ? projectAway(vector(word), direction) : vector(word);
    return { word, score: anchorAssociation(source, woman, man) };
  });
  const maximum = Math.max(0.01, ...rows.map(item => Math.abs(item.score)));
  elements.associationChart.innerHTML = rows.map(item => {
    const width = Math.abs(item.score) / maximum * 50;
    const side = item.score >= 0 ? "right" : "left";
    return `<div class="association-row">
      <span>${escapeHTML(item.word)}</span>
      <div class="association-track"><i class="${side}" style="width:${width}%"></i></div>
      <strong>${item.score > 0 ? "+" : ""}${item.score.toFixed(3)}</strong>
    </div>`;
  }).join("");
  elements.associationNote.innerHTML = removeDirection
    ? "The displayed scores shrink after one direction is removed. This geometric intervention does <strong>not</strong> prove that the representation or a downstream system is unbiased."
    : "Positive scores are closer to the “woman” anchor; negative scores are closer to the “man” anchor. These synthetic values intentionally demonstrate how unequal associations can appear.";
}

for (const button of elements.representationTabs) {
  button.addEventListener("click", () => {
    activeRepresentation = button.dataset.representation;
    renderRepresentation();
  });
  button.addEventListener("keydown", event => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const currentIndex = elements.representationTabs.indexOf(button);
    const nextIndex = event.key === "Home"
      ? 0
      : event.key === "End"
        ? elements.representationTabs.length - 1
        : (currentIndex + (event.key === "ArrowRight" ? 1 : -1) + elements.representationTabs.length) % elements.representationTabs.length;
    elements.representationTabs[nextIndex].click();
    elements.representationTabs[nextIndex].focus();
  });
}
for (const button of elements.contextOptions) {
  button.addEventListener("click", () => {
    activeContext = button.dataset.context;
    renderRepresentation();
  });
}
for (const button of elements.conceptOptions) button.addEventListener("click", () => checkConcept(button.dataset.conceptAnswer));

for (const select of [elements.focal, elements.first, elements.second, elements.analogyA, elements.analogyB, elements.analogyC]) wordOptions(select);
elements.focal.value = "king";
elements.first.value = "king";
elements.second.value = "queen";

for (const [key, preset] of Object.entries(analogyPresets)) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "button secondary";
  button.dataset.preset = key;
  button.textContent = preset.label;
  button.addEventListener("click", () => loadPreset(key));
  elements.analogyPresets.append(button);
}

elements.focal.addEventListener("change", renderNeighbors);
elements.first.addEventListener("change", renderSimilarity);
elements.second.addEventListener("change", renderSimilarity);
[elements.analogyA, elements.analogyB, elements.analogyC].forEach(select => select.addEventListener("change", renderAnalogy));
elements.neutralize.addEventListener("change", renderAssociations);

loadPreset("royal");
renderRepresentation();
renderNeighbors();
renderSimilarity();
renderAssociations();
