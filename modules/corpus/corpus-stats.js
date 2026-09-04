export function tokenize(text) {
  return String(text).toLocaleLowerCase("en").match(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu) ?? [];
}

export function countItems(items) {
  const counts = new Map();
  for (const item of items) counts.set(item, (counts.get(item) ?? 0) + 1);
  return counts;
}

export function analyzeCorpus(text, { samplePercent = 100 } = {}) {
  if (!(samplePercent > 0 && samplePercent <= 100)) throw new Error("samplePercent must be between zero and 100");
  const allTokens = tokenize(text);
  const sampleSize = allTokens.length ? Math.max(1, Math.floor(allTokens.length * samplePercent / 100)) : 0;
  const tokens = allTokens.slice(0, sampleSize);
  const counts = countItems(tokens);
  const frequencies = [...counts.entries()].map(([token, count]) => ({
    token,
    count,
    perThousand: tokens.length ? count / tokens.length * 1000 : 0
  })).sort((a, b) => b.count - a.count || a.token.localeCompare(b.token));
  return {
    tokens,
    totalAvailable: allTokens.length,
    tokenCount: tokens.length,
    typeCount: counts.size,
    typeTokenRatio: tokens.length ? counts.size / tokens.length : 0,
    counts,
    frequencies
  };
}

export function collocations(tokens, { minCount = 1 } = {}) {
  if (!(minCount >= 1)) throw new Error("minCount must be at least one");
  const words = countItems(tokens);
  const pairs = [];
  for (let index = 0; index < tokens.length - 1; index += 1) pairs.push(`${tokens[index]}\u0000${tokens[index + 1]}`);
  const pairCounts = countItems(pairs);
  const pairTotal = Math.max(0, tokens.length - 1);
  return [...pairCounts.entries()].filter(([, count]) => count >= minCount).map(([key, count]) => {
    const [first, second] = key.split("\u0000");
    const pairProbability = pairTotal ? count / pairTotal : 0;
    const firstProbability = tokens.length ? words.get(first) / tokens.length : 0;
    const secondProbability = tokens.length ? words.get(second) / tokens.length : 0;
    const pmi = pairProbability && firstProbability && secondProbability
      ? Math.log2(pairProbability / (firstProbability * secondProbability))
      : 0;
    return { first, second, count, pmi };
  }).sort((a, b) => b.pmi - a.pmi || b.count - a.count || a.first.localeCompare(b.first));
}

export function targetFrequency(analysis, target) {
  const normalized = tokenize(target)[0] ?? "";
  const count = analysis.counts.get(normalized) ?? 0;
  return { token: normalized, count, perThousand: analysis.tokenCount ? count / analysis.tokenCount * 1000 : 0 };
}

export function concordance(tokens, target, windowSize = 4) {
  const normalized = tokenize(target)[0] ?? "";
  const rows = [];
  tokens.forEach((token, index) => {
    if (token !== normalized) return;
    rows.push({
      left: tokens.slice(Math.max(0, index - windowSize), index).join(" "),
      target: token,
      right: tokens.slice(index + 1, index + 1 + windowSize).join(" ")
    });
  });
  return rows;
}
