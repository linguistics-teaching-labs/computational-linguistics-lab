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
  bpeText: document.querySelector("#bpe-text"),
  topPairs: document.querySelector("#top-pairs"),
  mergeSlider: document.querySelector("#merge-slider"),
  mergeCount: document.querySelector("#merge-count"),
  previousMerge: document.querySelector("#previous-merge"),
  nextMerge: document.querySelector("#next-merge"),
  resetMerges: document.querySelector("#reset-merges"),
  wordTokenCount: document.querySelector("#word-token-count"),
  currentRound: document.querySelector("#current-round"),
  subwordTokenCount: document.querySelector("#subword-token-count"),
  subwordVocabulary: document.querySelector("#subword-vocabulary"),
  segmentedWords: document.querySelector("#segmented-words"),
  currentStageLabel: document.querySelector("#current-stage-label"),
  currentVocabulary: document.querySelector("#current-vocabulary"),
  currentVocabularySize: document.querySelector("#current-vocabulary-size"),
  currentPairRanking: document.querySelector("#current-pair-ranking"),
  tieNote: document.querySelector("#tie-note"),
  previewTitle: document.querySelector("#preview-title"),
  previewRule: document.querySelector("#preview-rule"),
  previewSegmentedWords: document.querySelector("#preview-segmented-words"),
  previewPairRanking: document.querySelector("#preview-pair-ranking"),
  previewVocabulary: document.querySelector("#preview-vocabulary"),
  previewVocabularySize: document.querySelector("#preview-vocabulary-size"),
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

function pairMarkup(pair) {
  return `<code><span>${escapeHTML(pair.left)}</span> + <span>${escapeHTML(pair.right)}</span></code>`;
}

function renderPairRows(pairs, limit, highlightFirst = false) {
  if (!pairs.length) return '<tr><td colspan="3" class="bpe-empty-cell">No adjacent pairs remain.</td></tr>';
  return pairs.slice(0, limit).map((pair, index) => `
    <tr${highlightFirst && index === 0 ? ' class="selected-pair"' : ""}>
      <td><span class="rank-number">${index + 1}</span>${highlightFirst && index === 0 ? '<span class="next-label">next</span>' : ""}</td>
      <td>${pairMarkup(pair)}</td>
      <td>${pair.count.toLocaleString()}</td>
    </tr>`).join("");
}

function renderWords(words, highlightedToken = "") {
  return words.slice(0, 12).map(item => `
    <div class="segmented-word">
      <span class="word-label" title="${escapeHTML(item.word)}">${escapeHTML(item.word)}${item.count > 1 ? ` ×${item.count}` : ""}</span>
      <span class="segment-list">${item.segments.map(segment => `<span class="segment-chip${segment === highlightedToken ? " new-segment" : ""}">${escapeHTML(segment)}</span>`).join("")}</span>
    </div>`).join("") || '<p class="merge-empty">Enter text containing letters or numbers.</p>';
}

function renderVocabulary(symbols, highlightedToken = "") {
  if (!symbols.length) return '<span class="merge-empty">No symbols yet.</span>';
  return symbols.map(symbol => `<span class="vocabulary-chip${symbol === highlightedToken ? " new-vocabulary-token" : ""}">${escapeHTML(symbol)}</span>`).join("");
}

function vocabularyThroughRound(result, round) {
  return [...new Set([
    ...result.initialVocabulary,
    ...result.history.slice(0, round).map(item => item.merged)
  ])];
}

function renderSubwords() {
  const requestedRound = Number(elements.mergeSlider.value);
  const topN = Number(elements.topPairs.value);
  const result = learnBPE(elements.bpeText.value, requestedRound, { lowercase: elements.lowercase.checked });
  const completedRound = result.history.length;
  if (completedRound !== requestedRound) elements.mergeSlider.value = String(completedRound);

  elements.mergeCount.value = String(completedRound);
  elements.currentRound.textContent = completedRound.toLocaleString();
  elements.wordTokenCount.textContent = result.wordCount.toLocaleString();
  elements.subwordTokenCount.textContent = result.subwordTokens.toLocaleString();
  elements.subwordVocabulary.textContent = result.learnedVocabularySize.toLocaleString();
  elements.currentStageLabel.textContent = completedRound ? `After round ${completedRound}` : "Character starting point";
  elements.segmentedWords.innerHTML = renderWords(result.words);
  elements.currentVocabulary.innerHTML = renderVocabulary(result.learnedVocabulary);
  elements.currentVocabularySize.textContent = `${result.learnedVocabularySize} symbol${result.learnedVocabularySize === 1 ? "" : "s"}`;
  elements.currentPairRanking.innerHTML = renderPairRows(result.rankedPairs, topN, true);

  const tiedAtTop = result.rankedPairs.filter(pair => pair.count === result.rankedPairs[0]?.count).length;
  elements.tieNote.textContent = tiedAtTop > 1
    ? `${tiedAtTop} pairs tie at ${result.rankedPairs[0].count}. This learner selects the pair encountered first from left to right in the training text.`
    : result.rankedPairs.length
      ? "Counts include every occurrence of each word form. The highest count determines the next merge."
      : "A fully merged one-symbol word has no adjacent pair left to count.";

  const nextPair = result.rankedPairs[0];
  const preview = nextPair
    ? learnBPE(elements.bpeText.value, completedRound + 1, { lowercase: elements.lowercase.checked })
    : null;

  elements.previousMerge.disabled = completedRound === 0;
  elements.nextMerge.disabled = !nextPair;

  if (preview) {
    elements.previewTitle.textContent = `Round ${completedRound + 1}: merge the current winner`;
    elements.previewRule.innerHTML = `${pairMarkup(nextPair)} <span aria-hidden="true">→</span> <code>${escapeHTML(nextPair.merged)}</code><small>${nextPair.count} occurrence${nextPair.count === 1 ? "" : "s"}</small>`;
    elements.previewSegmentedWords.innerHTML = renderWords(preview.words, nextPair.merged);
    elements.previewPairRanking.innerHTML = renderPairRows(preview.rankedPairs, topN, true);
    elements.previewVocabulary.innerHTML = renderVocabulary(preview.learnedVocabulary, nextPair.merged);
    const vocabularyGrowth = preview.learnedVocabularySize - result.learnedVocabularySize;
    elements.previewVocabularySize.textContent = `${preview.learnedVocabularySize} symbols · ${vocabularyGrowth} new`;
  } else {
    elements.previewTitle.textContent = result.wordCount ? "No further merge is available" : "Enter training text to begin";
    elements.previewRule.innerHTML = "";
    elements.previewSegmentedWords.innerHTML = renderWords(result.words);
    elements.previewPairRanking.innerHTML = renderPairRows([], topN);
    elements.previewVocabulary.innerHTML = renderVocabulary(result.learnedVocabulary);
    elements.previewVocabularySize.textContent = `${result.learnedVocabularySize} symbol${result.learnedVocabularySize === 1 ? "" : "s"}`;
  }

  elements.mergeHistory.innerHTML = result.history.map((item, index) => {
    const vocabulary = vocabularyThroughRound(result, index + 1);
    return `<li>
      <div class="history-rule"><span class="history-round">Round ${index + 1}</span>${pairMarkup(item)} <span aria-hidden="true">→</span> <code>${escapeHTML(item.merged)}</code><span class="merge-frequency">${item.count} occurrence${item.count === 1 ? "" : "s"}</span></div>
      <details><summary>Vocabulary after this round (${vocabulary.length})</summary><div class="vocabulary-list history-vocabulary">${renderVocabulary(vocabulary, item.merged)}</div></details>
    </li>`;
  }).join("");
  if (!result.history.length) {
    elements.mergeHistory.innerHTML = '<li class="merge-empty">No merges completed. Select “Merge top pair” to accept the previewed rule.</li>';
    elements.mergeExplanation.innerHTML = "<strong>Starting point:</strong> each word is represented by grapheme characters plus <code>▁</code>, a word-boundary symbol. The learned vocabulary begins with those symbols.";
  } else {
    const last = result.history.at(-1);
    elements.mergeExplanation.innerHTML = `<strong>Round ${result.history.length}:</strong> <code>${escapeHTML(last.left)} + ${escapeHTML(last.right)}</code> occurred ${last.count} time${last.count === 1 ? "" : "s"}. Every non-overlapping occurrence became <code>${escapeHTML(last.merged)}</code>, and all adjacent-pair counts were then recalculated.`;
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
  elements.bpeText.value = example.text;
  elements.mergeSlider.value = "0";
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
elements.sourceText.addEventListener("input", () => {
  elements.bpeText.value = elements.sourceText.value;
  elements.mergeSlider.value = "0";
  renderAll();
});
elements.bpeText.addEventListener("input", () => {
  elements.sourceText.value = elements.bpeText.value;
  elements.mergeSlider.value = "0";
  renderAll();
});
elements.lowercase.addEventListener("change", () => {
  elements.mergeSlider.value = "0";
  renderAll();
});
elements.contractions.addEventListener("change", renderComparison);
elements.hyphens.addEventListener("change", renderComparison);
elements.mergeSlider.addEventListener("input", renderSubwords);
elements.topPairs.addEventListener("change", renderSubwords);
elements.previousMerge.addEventListener("click", () => {
  elements.mergeSlider.value = String(Math.max(0, Number(elements.mergeSlider.value) - 1));
  renderSubwords();
});
elements.nextMerge.addEventListener("click", () => {
  const nextRound = Number(elements.mergeSlider.value) + 1;
  if (nextRound > Number(elements.mergeSlider.max)) elements.mergeSlider.max = String(nextRound);
  elements.mergeSlider.value = String(nextRound);
  renderSubwords();
});
elements.resetMerges.addEventListener("click", () => {
  elements.mergeSlider.value = "0";
  renderSubwords();
});
elements.stressButtons.forEach(button => button.addEventListener("click", () => loadExample(button.dataset.example, true)));

loadExample("edgeCases");
