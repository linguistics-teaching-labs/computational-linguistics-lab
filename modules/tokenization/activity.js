import { examples } from "./examples.js";
import {
  boundaryTokens,
  learnBPE,
  ruleTokens,
  tokenStats,
  whitespaceTokens
} from "./tokenizer.js";

const elements = {
  exampleSelect: document.querySelector("#example-select"),
  exampleNote: document.querySelector("#example-note"),
  sourceText: document.querySelector("#source-text"),
  lowercase: document.querySelector("#lowercase-toggle"),
  contractions: document.querySelector("#contraction-toggle"),
  hyphens: document.querySelector("#hyphen-toggle"),
  comparison: document.querySelector("#comparison-grid"),
  mergeSlider: document.querySelector("#merge-slider"),
  mergeCount: document.querySelector("#merge-count"),
  wordTokenCount: document.querySelector("#word-token-count"),
  subwordTokenCount: document.querySelector("#subword-token-count"),
  subwordVocabulary: document.querySelector("#subword-vocabulary"),
  segmentedWords: document.querySelector("#segmented-words"),
  mergeHistory: document.querySelector("#merge-history"),
  mergeExplanation: document.querySelector("#merge-explanation"),
  stressButtons: [...document.querySelectorAll("[data-example]")],
  stressResult: document.querySelector("#stress-result")
};

function escapeHTML(value) {
  return String(value).replace(/[&<>'"]/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
  })[character]);
}

function tokenChip(token) {
  const punctuation = !/[\p{L}\p{N}]/u.test(token);
  return `<span class="token-chip${punctuation ? " punctuation-token" : ""}">${escapeHTML(token)}</span>`;
}

function settings() {
  return {
    lowercase: elements.lowercase.checked,
    keepContractions: elements.contractions.checked,
    keepHyphens: elements.hyphens.checked
  };
}

function tokenizerCard(title, description, tokens) {
  const stats = tokenStats(tokens);
  return `
    <article class="tokenizer-card">
      <header class="tokenizer-card-header">
        <h3>${escapeHTML(title)}</h3>
        <p>${escapeHTML(description)}</p>
        <div class="token-stats"><span>${stats.tokens} tokens</span><span>${stats.types} types</span></div>
      </header>
      <div class="token-output">${tokens.map(tokenChip).join("") || '<span class="merge-empty">Enter some text.</span>'}</div>
    </article>`;
}

function renderComparison() {
  const text = elements.sourceText.value;
  const options = settings();
  const whitespace = whitespaceTokens(text, options);
  const boundaries = boundaryTokens(text, options);
  const configured = ruleTokens(text, options);
  elements.comparison.innerHTML = [
    tokenizerCard("Whitespace", "Break only where a space or line break occurs.", whitespace),
    tokenizerCard("Words + punctuation", "Group adjacent letters; make every mark its own token.", boundaries),
    tokenizerCard("Configurable rules", "Apply the contraction and hyphen decisions selected above.", configured)
  ].join("");
}

function renderSubwords() {
  const mergeLimit = Number(elements.mergeSlider.value);
  const result = learnBPE(elements.sourceText.value, mergeLimit, { lowercase: elements.lowercase.checked });
  elements.mergeCount.value = String(mergeLimit);
  elements.wordTokenCount.textContent = result.wordCount.toLocaleString();
  elements.subwordTokenCount.textContent = result.subwordTokens.toLocaleString();
  elements.subwordVocabulary.textContent = result.vocabularySize.toLocaleString();

  elements.segmentedWords.innerHTML = result.words.slice(0, 12).map(item => `
    <div class="segmented-word">
      <span class="word-label" title="${escapeHTML(item.word)}">${escapeHTML(item.word)}${item.count > 1 ? ` ×${item.count}` : ""}</span>
      <span class="segment-list">${item.segments.map(segment => `<span class="segment-chip">${escapeHTML(segment)}</span>`).join("")}</span>
    </div>`).join("") || '<p class="merge-empty">Enter text containing letters or numbers.</p>';

  elements.mergeHistory.innerHTML = result.history.map(item => `
    <li><code>${escapeHTML(item.left)} + ${escapeHTML(item.right)} → ${escapeHTML(item.merged)}</code> <span class="merge-frequency">${item.count} occurrence${item.count === 1 ? "" : "s"}</span></li>`).join("");
  if (!result.history.length) {
    elements.mergeHistory.innerHTML = '<li class="merge-empty">Move the slider to perform a merge.</li>';
    elements.mergeExplanation.innerHTML = "<strong>Starting point:</strong> each word is represented by individual characters plus <code>▁</code>, a word-boundary symbol.";
  } else {
    const last = result.history.at(-1);
    elements.mergeExplanation.innerHTML = `<strong>Merge ${result.history.length}:</strong> the most frequent remaining pair was <code>${escapeHTML(last.left)} + ${escapeHTML(last.right)}</code>, observed ${last.count} time${last.count === 1 ? "" : "s"}. Every occurrence became <code>${escapeHTML(last.merged)}</code>.`;
  }
}

function renderAll() {
  renderComparison();
  renderSubwords();
}

function loadExample(key, isStressTest = false) {
  const example = examples[key];
  elements.exampleSelect.value = key;
  elements.exampleNote.textContent = example.note;
  elements.sourceText.value = example.text;
  renderAll();

  if (isStressTest) {
    const whitespaceCount = whitespaceTokens(example.text, settings()).length;
    const ruleCount = ruleTokens(example.text, settings()).length;
    const interpretation = key === "noSpaces"
      ? "Both word-oriented methods group long sequences of Chinese characters together. Spaces cannot recover the lexical words that occur inside those sequences."
      : "All four written forms count as individual space-delimited words, even though recurring material inside them expresses related meanings.";
    elements.stressResult.innerHTML = `<p><strong>${escapeHTML(example.name)}:</strong> whitespace gives ${whitespaceCount} token${whitespaceCount === 1 ? "" : "s"}; the configured rules give ${ruleCount}. ${escapeHTML(interpretation)}</p>`;
  }
}

for (const [key, example] of Object.entries(examples)) {
  elements.exampleSelect.add(new Option(example.name, key));
}

elements.exampleSelect.addEventListener("change", event => loadExample(event.target.value));
elements.sourceText.addEventListener("input", renderAll);
elements.lowercase.addEventListener("change", renderAll);
elements.contractions.addEventListener("change", renderComparison);
elements.hyphens.addEventListener("change", renderComparison);
elements.mergeSlider.addEventListener("input", renderSubwords);
elements.stressButtons.forEach(button => button.addEventListener("click", () => loadExample(button.dataset.example, true)));

loadExample("edgeCases");
