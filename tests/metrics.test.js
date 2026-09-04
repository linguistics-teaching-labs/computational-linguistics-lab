import test from "node:test";
import assert from "node:assert/strict";

import { requestDetectionData } from "../modules/evaluation/data.js";
import {
  evaluateAtThreshold,
  evaluateGroups,
  outcomeLabel,
  thresholdTable
} from "../modules/evaluation/metrics.js";

test("the default threshold produces a traceable confusion matrix", () => {
  const result = evaluateAtThreshold(requestDetectionData, 0.5);
  assert.deepEqual(result.confusion, { tp: 8, fp: 4, tn: 8, fn: 4 });
  assert.equal(result.metrics.accuracy, 2 / 3);
  assert.equal(result.metrics.precision, 2 / 3);
  assert.equal(result.metrics.recall, 2 / 3);
  assert.equal(result.metrics.f1, 2 / 3);
});

test("raising the threshold reduces false positives and increases false negatives", () => {
  const result = evaluateAtThreshold(requestDetectionData, 0.7);
  assert.deepEqual(result.confusion, { tp: 7, fp: 0, tn: 12, fn: 5 });
});

test("group evaluation exposes the designed recall difference", () => {
  const groups = evaluateGroups(requestDetectionData, 0.5);
  const formal = groups.find(group => group.group === "formal");
  const conversational = groups.find(group => group.group === "conversational");
  assert.equal(formal.metrics.recall, 1);
  assert.equal(conversational.metrics.recall, 1 / 3);
});

test("threshold tables preserve the requested values", () => {
  assert.deepEqual(thresholdTable(requestDetectionData, [0.25, 0.75]).map(row => row.threshold), [0.25, 0.75]);
});

test("labels and invalid thresholds have explicit behavior", () => {
  assert.equal(outcomeLabel("fn"), "False negative");
  assert.equal(outcomeLabel("other"), "Unknown");
  assert.throws(() => evaluateAtThreshold(requestDetectionData, 1.1), /threshold/);
});
