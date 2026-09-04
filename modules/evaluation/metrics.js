function divide(numerator, denominator) {
  return denominator ? numerator / denominator : 0;
}

export function evaluateAtThreshold(records, threshold = 0.5) {
  if (!(threshold >= 0 && threshold <= 1)) throw new Error("threshold must fall between zero and one");
  const confusion = { tp: 0, fp: 0, tn: 0, fn: 0 };
  const cases = records.map(record => {
    const predicted = record.score >= threshold;
    const outcome = record.label ? (predicted ? "tp" : "fn") : (predicted ? "fp" : "tn");
    confusion[outcome] += 1;
    return { ...record, predicted, outcome, correct: predicted === record.label };
  });
  const { tp, fp, tn, fn } = confusion;
  const precision = divide(tp, tp + fp);
  const recall = divide(tp, tp + fn);
  const accuracy = divide(tp + tn, records.length);
  const specificity = divide(tn, tn + fp);
  const f1 = divide(2 * precision * recall, precision + recall);
  return { threshold, confusion, cases, total: records.length, metrics: { precision, recall, accuracy, specificity, f1 } };
}

export function thresholdTable(records, thresholds = [0.3, 0.4, 0.5, 0.6, 0.7]) {
  return thresholds.map(threshold => evaluateAtThreshold(records, threshold));
}

export function evaluateGroups(records, threshold = 0.5, groupKey = "style") {
  const groups = [...new Set(records.map(record => record[groupKey]))];
  return groups.map(group => ({ group, ...evaluateAtThreshold(records.filter(record => record[groupKey] === group), threshold) }));
}

export function outcomeLabel(outcome) {
  return ({ tp: "True positive", fp: "False positive", tn: "True negative", fn: "False negative" })[outcome] ?? "Unknown";
}
