export const defaultSalienceWeights = {
  recency: 1.2,
  subject: 1.1,
  compatibility: 1.6,
  mentions: 0.7
};

export function candidateBreakdown(candidate, weights = defaultSalienceWeights) {
  const contributions = Object.fromEntries(Object.entries(weights).map(([feature, weight]) => {
    const value = candidate.features[feature] ?? 0;
    return [feature, value * weight];
  }));
  const score = Object.values(contributions).reduce((sum, value) => sum + value, 0);
  return { candidate, contributions, score };
}

export function normalizeCandidateScores(scores) {
  if (!scores.length) throw new Error("at least one candidate is required");
  const maximum = Math.max(...scores);
  const exponentials = scores.map(score => Math.exp(score - maximum));
  const total = exponentials.reduce((sum, value) => sum + value, 0);
  return exponentials.map(value => value / total);
}

export function rankCandidates(candidates, weights = defaultSalienceWeights) {
  if (!candidates.length) throw new Error("at least one candidate is required");
  const analyses = candidates.map(candidate => candidateBreakdown(candidate, weights));
  const probabilities = normalizeCandidateScores(analyses.map(item => item.score));
  return analyses.map((item, index) => ({ ...item, probability: probabilities[index] }))
    .sort((a, b) => b.probability - a.probability || a.candidate.name.localeCompare(b.candidate.name));
}

export function ambiguitySummary(ranking) {
  if (!ranking.length) throw new Error("ranking cannot be empty");
  if (ranking.length === 1) return { margin: 1, label: "No competitor" };
  const margin = ranking[0].probability - ranking[1].probability;
  const label = margin < 0.15 ? "High ambiguity" : margin < 0.4 ? "Moderate ambiguity" : "Lower ambiguity";
  return { margin, label };
}
