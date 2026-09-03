export function wordTokens(text) {
  return text.normalize("NFKC").toLocaleLowerCase("en-US").match(/\p{L}+(?:['’]\p{L}+)*/gu) ?? [];
}

export function textFeatures(text, { bigrams = false } = {}) {
  const words = wordTokens(text);
  if (!bigrams) return words;
  const pairs = words.slice(0, -1).map((word, index) => `${word}·${words[index + 1]}`);
  return [...words, ...pairs];
}

function increment(map, key, amount = 1) {
  map.set(key, (map.get(key) ?? 0) + amount);
}

export function trainNaiveBayes(examples, { alpha = 1, bigrams = false } = {}) {
  if (!examples.length) throw new RangeError("Training data must contain at least one example.");
  if (!(alpha > 0)) throw new RangeError("Smoothing alpha must be greater than zero.");

  const labels = [...new Set(examples.map(example => example.label))];
  const documentCounts = new Map(labels.map(label => [label, 0]));
  const tokenCounts = new Map(labels.map(label => [label, new Map()]));
  const tokenTotals = new Map(labels.map(label => [label, 0]));
  const vocabulary = new Set();

  for (const example of examples) {
    increment(documentCounts, example.label);
    for (const feature of textFeatures(example.text, { bigrams })) {
      vocabulary.add(feature);
      increment(tokenCounts.get(example.label), feature);
      increment(tokenTotals, example.label);
    }
  }

  return { alpha, bigrams, labels, documentCounts, tokenCounts, tokenTotals, vocabulary, documentTotal: examples.length };
}

export function featureProbability(model, label, feature) {
  const count = model.tokenCounts.get(label)?.get(feature) ?? 0;
  return (count + model.alpha) / (model.tokenTotals.get(label) + model.alpha * model.vocabulary.size);
}

export function predict(model, text) {
  const allFeatures = textFeatures(text, { bigrams: model.bigrams });
  const featureCounts = new Map();
  const unknown = new Set();
  for (const feature of allFeatures) {
    if (model.vocabulary.has(feature)) increment(featureCounts, feature);
    else unknown.add(feature);
  }

  const logScores = Object.fromEntries(model.labels.map(label => {
    let score = Math.log(model.documentCounts.get(label) / model.documentTotal);
    for (const [feature, count] of featureCounts) {
      score += count * Math.log(featureProbability(model, label, feature));
    }
    return [label, score];
  }));
  const maximum = Math.max(...Object.values(logScores));
  const exponentials = Object.fromEntries(model.labels.map(label => [label, Math.exp(logScores[label] - maximum)]));
  const denominator = Object.values(exponentials).reduce((sum, value) => sum + value, 0);
  const probabilities = Object.fromEntries(model.labels.map(label => [label, exponentials[label] / denominator]));
  const predicted = [...model.labels].sort((a, b) => probabilities[b] - probabilities[a])[0];

  const evidence = [...featureCounts].map(([feature, count]) => {
    const probabilitiesByLabel = Object.fromEntries(model.labels.map(label => [label, featureProbability(model, label, feature)]));
    const logRatio = model.labels.length === 2
      ? count * Math.log(probabilitiesByLabel[model.labels[0]] / probabilitiesByLabel[model.labels[1]])
      : 0;
    return { feature, count, probabilities: probabilitiesByLabel, logRatio };
  });

  return { predicted, probabilities, logScores, evidence, unknown: [...unknown], features: allFeatures };
}

export function rankFeatures(model) {
  if (model.labels.length !== 2) return [];
  return [...model.vocabulary].map(feature => ({
    feature,
    logRatio: Math.log(
      featureProbability(model, model.labels[0], feature) /
      featureProbability(model, model.labels[1], feature)
    )
  })).sort((a, b) => b.logRatio - a.logRatio);
}

export function evaluate(model, examples) {
  const confusion = Object.fromEntries(model.labels.map(actual => [
    actual,
    Object.fromEntries(model.labels.map(predicted => [predicted, 0]))
  ]));
  const cases = examples.map(example => {
    const prediction = predict(model, example.text);
    confusion[example.label][prediction.predicted] += 1;
    return { ...example, prediction, correct: prediction.predicted === example.label };
  });
  const correct = cases.filter(item => item.correct).length;
  return { cases, confusion, correct, total: cases.length, accuracy: cases.length ? correct / cases.length : 0 };
}
