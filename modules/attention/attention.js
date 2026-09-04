export function attentionMask(length, focusIndex, mode = "bidirectional") {
  if (!Number.isInteger(length) || length < 1) throw new Error("length must be a positive integer");
  if (!Number.isInteger(focusIndex) || focusIndex < 0 || focusIndex >= length) throw new Error("focusIndex is outside the sequence");
  if (mode === "bidirectional") return Array(length).fill(true);
  if (mode === "causal") return Array.from({ length }, (_, index) => index <= focusIndex);
  throw new Error(`Unknown attention mode: ${mode}`);
}

export function softmax(scores, temperature = 1, mask = scores.map(() => true)) {
  if (!scores.length || scores.length !== mask.length) throw new Error("scores and mask must have the same nonzero length");
  if (!(temperature > 0)) throw new Error("temperature must be positive");
  const available = scores.map((score, index) => mask[index] ? score / temperature : -Infinity);
  const maximum = Math.max(...available);
  if (!Number.isFinite(maximum)) throw new Error("at least one position must be available");
  const exponentials = available.map(value => Number.isFinite(value) ? Math.exp(value - maximum) : 0);
  const total = exponentials.reduce((sum, value) => sum + value, 0);
  return exponentials.map(value => value / total);
}

export function attentionSummary(scores, temperature = 1, mask = scores.map(() => true)) {
  const weights = softmax(scores, temperature, mask);
  const entropy = -weights.reduce((sum, weight) => weight > 0 ? sum + weight * Math.log(weight) : sum, 0);
  return {
    weights,
    entropy,
    effectiveTokens: Math.exp(entropy),
    total: weights.reduce((sum, weight) => sum + weight, 0)
  };
}

export function weightedContext(weights, vectors) {
  if (!weights.length || weights.length !== vectors.length) throw new Error("weights and vectors must align");
  const dimensions = vectors[0].length;
  if (!vectors.every(vector => vector.length === dimensions)) throw new Error("all vectors must have the same dimensions");
  return Array.from({ length: dimensions }, (_, dimension) =>
    vectors.reduce((sum, vector, index) => sum + weights[index] * vector[dimension], 0)
  );
}

export function rankAttention(tokens, weights) {
  if (tokens.length !== weights.length) throw new Error("tokens and weights must align");
  return tokens.map((token, index) => ({ token, index, weight: weights[index] }))
    .sort((a, b) => b.weight - a.weight || a.index - b.index);
}
