import { binaryRules, lexicalRules } from "./grammar.js";

export function sentenceTokens(text) {
  return text.normalize("NFKC").toLocaleLowerCase("en-US").match(/\p{L}+(?:['’]\p{L}+)*/gu) ?? [];
}

function addNode(cell, label, node) {
  if (!cell.has(label)) cell.set(label, []);
  cell.get(label).push(node);
}

function ruleWeight(rule, nounAttachment) {
  if (rule.attachment === "noun") return nounAttachment;
  if (rule.attachment === "verb") return 1 - nounAttachment;
  return rule.weight;
}

export function parseSentence(text, { nounAttachment = 0.5 } = {}) {
  const tokens = sentenceTokens(text);
  const size = tokens.length;
  const chart = Array.from({ length: size }, () =>
    Array.from({ length: size + 1 }, () => new Map())
  );
  const unknown = [];

  tokens.forEach((token, index) => {
    const categories = lexicalRules[token] ?? [];
    if (!categories.length) unknown.push(token);
    for (const category of categories) {
      addNode(chart[index][index + 1], category, {
        label: category,
        word: token,
        score: 1,
        span: [index, index + 1],
        rule: `${category} → ${token}`
      });
    }
  });

  for (let length = 2; length <= size; length += 1) {
    for (let start = 0; start <= size - length; start += 1) {
      const end = start + length;
      for (let split = start + 1; split < end; split += 1) {
        const leftCell = chart[start][split];
        const rightCell = chart[split][end];
        for (const rule of binaryRules) {
          const leftNodes = leftCell.get(rule.left) ?? [];
          const rightNodes = rightCell.get(rule.right) ?? [];
          const weight = ruleWeight(rule, nounAttachment);
          for (const left of leftNodes) {
            for (const right of rightNodes) {
              addNode(chart[start][end], rule.lhs, {
                label: rule.lhs,
                children: [left, right],
                score: left.score * right.score * weight,
                span: [start, end],
                split,
                rule: `${rule.lhs} → ${rule.left} ${rule.right}`,
                attachment: rule.attachment ?? null
              });
            }
          }
        }
      }
    }
  }

  return {
    tokens,
    chart,
    unknown: [...new Set(unknown)],
    parses: size ? (chart[0][size].get("S") ?? []).sort((a, b) => b.score - a.score) : []
  };
}

export function chartSpans(result) {
  const spans = [];
  for (let length = 1; length <= result.tokens.length; length += 1) {
    for (let start = 0; start <= result.tokens.length - length; start += 1) {
      const end = start + length;
      spans.push({
        start,
        end,
        length,
        words: result.tokens.slice(start, end),
        labels: [...result.chart[start][end].keys()]
      });
    }
  }
  return spans;
}

export function attachmentType(node) {
  if (node.attachment) return node.attachment;
  for (const child of node.children ?? []) {
    const found = attachmentType(child);
    if (found) return found;
  }
  return null;
}

export function bracketedTree(node) {
  if (node.word) return `(${node.label} ${node.word})`;
  return `(${node.label} ${(node.children ?? []).map(bracketedTree).join(" ")})`;
}
