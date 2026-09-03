export function dot(left, right) {
  if (left.length !== right.length) throw new RangeError("Vectors must have equal length.");
  return left.reduce((sum, value, index) => sum + value * right[index], 0);
}

export function magnitude(vector) {
  return Math.sqrt(dot(vector, vector));
}

export function cosineSimilarity(left, right) {
  const denominator = magnitude(left) * magnitude(right);
  return denominator ? dot(left, right) / denominator : 0;
}

export function add(left, right) {
  if (left.length !== right.length) throw new RangeError("Vectors must have equal length.");
  return left.map((value, index) => value + right[index]);
}

export function subtract(left, right) {
  if (left.length !== right.length) throw new RangeError("Vectors must have equal length.");
  return left.map((value, index) => value - right[index]);
}

export function analogyVector(a, b, c) {
  return add(subtract(b, a), c);
}

export function nearestNeighbors(queryVector, embeddings, { exclude = [], limit = 5 } = {}) {
  const excluded = new Set(exclude);
  return Object.entries(embeddings)
    .filter(([word]) => !excluded.has(word))
    .map(([word, entry]) => ({ word, similarity: cosineSimilarity(queryVector, entry.vector) }))
    .sort((a, b) => b.similarity - a.similarity || a.word.localeCompare(b.word))
    .slice(0, limit);
}

export function projectAway(vector, direction) {
  const scale = dot(vector, direction) / dot(direction, direction);
  return vector.map((value, index) => value - scale * direction[index]);
}

export function anchorAssociation(vector, firstAnchor, secondAnchor) {
  return cosineSimilarity(vector, firstAnchor) - cosineSimilarity(vector, secondAnchor);
}
