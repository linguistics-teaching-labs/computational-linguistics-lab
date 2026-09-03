import { sentenceExamples } from "./grammar.js";
import { attachmentType, bracketedTree, chartSpans, parseSentence } from "./parser.js";

const elements = {
  sentenceSelect: document.querySelector("#sentence-select"),
  sentenceQuestion: document.querySelector("#sentence-question"),
  sentenceInput: document.querySelector("#sentence-input"),
  parseStatus: document.querySelector("#parse-status"),
  nounRuleWeight: document.querySelector("#noun-rule-weight"),
  verbRuleWeight: document.querySelector("#verb-rule-weight"),
  spanSlider: document.querySelector("#span-slider"),
  spanCount: document.querySelector("#span-count"),
  revealChart: document.querySelector("#reveal-chart"),
  chartProgress: document.querySelector("#chart-progress"),
  chart: document.querySelector("#cky-chart"),
  chartExplanation: document.querySelector("#chart-explanation"),
  preferenceSlider: document.querySelector("#preference-slider"),
  preferenceValue: document.querySelector("#preference-value"),
  parseSummary: document.querySelector("#parse-summary"),
  treeComparison: document.querySelector("#tree-comparison")
};

let result;

function escapeHTML(value) {
  return String(value).replace(/[&<>'"]/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
  })[character]);
}

function renderTreeNode(node) {
  const children = node.children?.length
    ? `<div class="tree-children">${node.children.map(renderTreeNode).join("")}</div>`
    : `<span class="tree-word">${escapeHTML(node.word)}</span>`;
  return `<div class="tree-node"><span class="tree-label">${escapeHTML(node.label)}</span>${children}</div>`;
}

function renderChart() {
  const revealLength = Number(elements.spanSlider.value);
  elements.spanCount.value = String(revealLength);
  const spans = chartSpans(result).filter(span => span.length <= revealLength);
  const groups = [];
  for (let length = 1; length <= revealLength; length += 1) {
    const row = spans.filter(span => span.length === length);
    groups.push(`
      <div class="chart-row">
        <span class="chart-length">Length ${length}</span>
        <div class="chart-cells">${row.map(span => `
          <div class="span-card ${span.labels.length ? "filled" : "empty"}">
            <span class="span-words">${escapeHTML(span.words.join(" "))}</span>
            <span class="span-labels">${span.labels.length ? span.labels.map(label => `<b>${escapeHTML(label)}</b>`).join("") : "—"}</span>
          </div>`).join("")}
        </div>
      </div>`);
  }
  elements.chart.innerHTML = groups.join("");
  elements.chartProgress.textContent = revealLength === result.tokens.length
    ? `Complete chart: ${result.tokens.length} token${result.tokens.length === 1 ? "" : "s"}`
    : `Showing lengths 1–${revealLength} of ${result.tokens.length}`;

  if (revealLength === 1) {
    elements.chartExplanation.innerHTML = "<strong>Base case:</strong> lexical rules assign one or more grammatical categories to each known word.";
  } else {
    const filled = spans.filter(span => span.length === revealLength && span.labels.length);
    const example = filled[0];
    elements.chartExplanation.innerHTML = example
      ? `<strong>Combination:</strong> the span <code>${escapeHTML(example.words.join(" "))}</code> can be labeled <code>${escapeHTML(example.labels.join(", "))}</code> by combining categories already found in shorter adjacent spans.`
      : `<strong>No constituent at this length:</strong> none of the available category pairs match a grammar rule for these spans.`;
  }
}

function attachmentDescription(type) {
  if (type === "noun") return { title: "Noun attachment", text: "The prepositional phrase is inside the object noun phrase." };
  if (type === "verb") return { title: "Verb attachment", text: "The prepositional phrase is inside the verb phrase but outside the object noun phrase." };
  return { title: "Single structure", text: "This parse does not contain a prepositional-phrase attachment choice." };
}

function renderTrees() {
  if (!result.parses.length) {
    elements.parseSummary.innerHTML = "<strong>No complete S parse.</strong> The grammar cannot cover the entire sentence as an <code>S → NP VP</code> structure.";
    elements.treeComparison.innerHTML = "";
    return;
  }

  const totalScore = result.parses.reduce((sum, parse) => sum + parse.score, 0);
  elements.parseSummary.innerHTML = `<strong>${result.parses.length} complete parse${result.parses.length === 1 ? "" : "s"}</strong> found. Relative probabilities below normalize the scores across these alternatives.`;
  elements.treeComparison.innerHTML = result.parses.map((parse, index) => {
    const type = attachmentType(parse);
    const interpretation = attachmentDescription(type);
    const share = totalScore ? parse.score / totalScore : 0;
    return `
      <article class="parse-card">
        <header>
          <div><span class="parse-number">Parse ${index + 1}</span><h3>${interpretation.title}</h3></div>
          <strong>${(share * 100).toFixed(1)}%</strong>
        </header>
        <p>${interpretation.text}</p>
        <div class="tree-scroll">${renderTreeNode(parse)}</div>
        <details><summary>Bracketed notation</summary><code>${escapeHTML(bracketedTree(parse))}</code></details>
      </article>`;
  }).join("");
}

function parseCurrent({ resetChart = false } = {}) {
  const nounAttachment = Number(elements.preferenceSlider.value) / 100;
  result = parseSentence(elements.sentenceInput.value, { nounAttachment });
  elements.preferenceValue.value = `${Math.round(nounAttachment * 100)}%`;
  elements.nounRuleWeight.textContent = nounAttachment.toFixed(2);
  elements.verbRuleWeight.textContent = (1 - nounAttachment).toFixed(2);

  const maximum = Math.max(1, result.tokens.length);
  elements.spanSlider.max = String(maximum);
  if (resetChart) elements.spanSlider.value = "1";
  if (Number(elements.spanSlider.value) > maximum) elements.spanSlider.value = String(maximum);

  if (result.unknown.length) {
    elements.parseStatus.className = "parse-status error";
    elements.parseStatus.innerHTML = `<strong>Unknown vocabulary:</strong> ${escapeHTML(result.unknown.join(", "))}. The parser cannot assign these words a lexical category.`;
  } else {
    elements.parseStatus.className = "parse-status success";
    elements.parseStatus.textContent = `${result.tokens.length} tokens recognized; ${result.parses.length} complete parse${result.parses.length === 1 ? "" : "s"} found.`;
  }
  renderChart();
  renderTrees();
}

function loadSentence(key) {
  const example = sentenceExamples[key];
  elements.sentenceInput.value = example.text;
  elements.sentenceQuestion.textContent = example.question;
  parseCurrent({ resetChart: true });
}

for (const [key, example] of Object.entries(sentenceExamples)) {
  elements.sentenceSelect.add(new Option(example.label, key));
}

elements.sentenceSelect.addEventListener("change", event => loadSentence(event.target.value));
elements.sentenceInput.addEventListener("input", () => parseCurrent({ resetChart: true }));
elements.spanSlider.addEventListener("input", renderChart);
elements.revealChart.addEventListener("click", () => {
  elements.spanSlider.value = elements.spanSlider.max;
  renderChart();
});
elements.preferenceSlider.addEventListener("input", () => parseCurrent());

loadSentence("telescope");
