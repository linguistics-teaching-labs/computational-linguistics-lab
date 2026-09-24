import { cosineSimilarity } from "./embedding-math.js";

const fields = [document.querySelector("#context-sentence-a"), document.querySelector("#context-sentence-b")];
const choices = [document.querySelector("#context-words-a"), document.querySelector("#context-words-b")];
const compare = document.querySelector("#context-compare");
const status = document.querySelector("#context-status");
const results = document.querySelector("#context-results");
const selected = [null, null];
let worker;
let requestId = 0;
let busy = false;

const segmenter = new Intl.Segmenter("en", { granularity: "word" });

function words(sentence) {
  return [...segmenter.segment(sentence)]
    .filter(item => item.isWordLike)
    .map(item => ({ text: item.segment, start: item.index, end: item.index + item.segment.length }));
}

function setStatus(message) { status.textContent = message; }

function setBusy(value) {
  busy = value;
  compare.disabled = value;
  fields.forEach(field => { field.disabled = value; });
  document.querySelectorAll("[data-context-example], .context-words button").forEach(button => {
    button.disabled = value;
  });
}

function renderWords(index) {
  const tokens = words(fields[index].value);
  choices[index].replaceChildren();
  for (const token of tokens) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = token.text;
    button.setAttribute("aria-label", `Select ${token.text} at character ${token.start + 1} in sentence ${index === 0 ? "A" : "B"}`);
    button.setAttribute("aria-pressed", String(selected[index]?.start === token.start));
    button.addEventListener("click", () => {
      selected[index] = token;
      results.hidden = true;
      renderWords(index);
      setStatus(`Selected “${token.text}” in sentence ${index === 0 ? "A" : "B"}.`);
    });
    choices[index].append(button);
  }
}

function selectExample(which) {
  fields[0].value = "I withdrew money from the bank.";
  fields[1].value = which === "different"
    ? "The river bank is wet."
    : "Bank of America is next to the restaurant.";
  for (let index = 0; index < 2; index++) {
    selected[index] = words(fields[index].value).find(word => word.text.toLowerCase() === "bank") || null;
    renderWords(index);
  }
  results.hidden = true;
  setStatus("The two occurrences of “bank” are selected. Compare when ready.");
}

function vectorCard(label, word, data) {
  const card = document.createElement("div");
  card.className = "context-vector-card";
  const heading = document.createElement("h3");
  heading.textContent = `${label}: “${word}”`;
  const note = document.createElement("p");
  note.textContent = `${data.vector.length} dimensions · ${data.pieces} model token${data.pieces === 1 ? "" : "s"}`;
  const preview = document.createElement("div");
  preview.className = "context-vector-preview";
  data.vector.slice(0, 12).forEach((value, index) => {
    const cell = document.createElement("code");
    cell.textContent = `${index + 1}: ${value.toFixed(3)}`;
    preview.append(cell);
  });
  const details = document.createElement("details");
  const summary = document.createElement("summary");
  summary.textContent = "Show all coordinates";
  const full = document.createElement("pre");
  full.textContent = data.vector.map((value, index) => `${index + 1}: ${value.toFixed(5)}`).join("\n");
  details.append(summary, full);
  card.append(heading, note, preview, details);
  return card;
}

function showResult(data) {
  const score = cosineSimilarity(data.a.vector, data.b.vector);
  document.querySelector("#context-cosine").textContent = score.toFixed(3);
  document.querySelector("#context-interpretation").textContent =
    `The selected occurrences of “${selected[0].text}” and “${selected[1].text}” have this similarity in DistilBERT. Compare it with another pair; the score alone does not establish whether their meanings match.`;
  document.querySelector("#context-vectors").replaceChildren(
    vectorCard("Sentence A", selected[0].text, data.a),
    vectorCard("Sentence B", selected[1].text, data.b)
  );
  results.hidden = false;
  setStatus("Comparison complete. Change either sentence to try another pair.");
}

function startWorker() {
  if (worker) return worker;
  worker = new Worker(new URL("./contextual-worker.js", import.meta.url), { type: "module" });
  worker.onmessage = ({ data }) => {
    if (data.type === "progress") {
      setStatus(`Downloading model: ${data.progress}%`);
    } else if (data.type === "status") {
      setStatus(data.message);
    } else if (data.id === requestId && data.type === "result") {
      setBusy(false);
      showResult(data);
    } else if (data.id === requestId && data.type === "error") {
      setBusy(false);
      setStatus(`Could not compare: ${data.message}`);
    }
  };
  worker.onerror = () => {
    setBusy(false);
    setStatus("The model could not load. Check your connection and try again.");
    worker.terminate();
    worker = null;
  };
  return worker;
}

fields.forEach((field, index) => field.addEventListener("input", () => {
  selected[index] = null;
  renderWords(index);
  results.hidden = true;
  setStatus("Select a word in each sentence, then compare.");
}));
document.querySelectorAll("[data-context-example]").forEach(button => {
  button.addEventListener("click", () => selectExample(button.dataset.contextExample));
});

compare.addEventListener("click", () => {
  if (busy) return;
  if (!selected[0] || !selected[1]) {
    setStatus("Select one word in each sentence before comparing.");
    return;
  }
  if (fields.some(field => !field.value.trim())) {
    setStatus("Enter two sentences before comparing.");
    return;
  }
  results.hidden = true;
  setBusy(true);
  const id = ++requestId;
  startWorker().postMessage({
    type: "compare", id,
    a: { sentence: fields[0].value, start: selected[0].start, end: selected[0].end },
    b: { sentence: fields[1].value, start: selected[1].start, end: selected[1].end }
  });
});

selectExample("different");
