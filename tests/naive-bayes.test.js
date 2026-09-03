import test from "node:test";
import assert from "node:assert/strict";

import { reviewCorpora } from "../modules/classification/data.js";
import {
  evaluate,
  featureProbability,
  predict,
  textFeatures,
  trainNaiveBayes,
  wordTokens
} from "../modules/classification/naive-bayes.js";

test("wordTokens normalizes case and keeps apostrophes inside words", () => {
  assert.deepEqual(wordTokens("It's WARM!"), ["it's", "warm"]);
});

test("bigram representation contains words and adjacent pairs", () => {
  assert.deepEqual(textFeatures("not very funny", { bigrams: true }), ["not", "very", "funny", "not·very", "very·funny"]);
});

test("training records balanced class priors", () => {
  const model = trainNaiveBayes(reviewCorpora.balanced.training);
  assert.equal(model.documentCounts.get("favorable"), 7);
  assert.equal(model.documentCounts.get("unfavorable"), 7);
});

test("additive smoothing gives unseen class-feature combinations nonzero probability", () => {
  const model = trainNaiveBayes(reviewCorpora.balanced.training);
  assert.ok(featureProbability(model, "unfavorable", "excellent") > 0);
});

test("strong known evidence supports the expected class", () => {
  const model = trainNaiveBayes(reviewCorpora.balanced.training);
  assert.equal(predict(model, "excellent charming memorable").predicted, "favorable");
  assert.equal(predict(model, "terrible dull forgettable").predicted, "unfavorable");
});

test("unseen features are reported and excluded from evidence", () => {
  const model = trainNaiveBayes(reviewCorpora.balanced.training);
  const result = predict(model, "spectacular acting");
  assert.ok(result.unknown.includes("spectacular"));
  assert.ok(result.evidence.some(item => item.feature === "acting"));
});

test("evaluation totals every confusion-matrix cell", () => {
  const model = trainNaiveBayes(reviewCorpora.balanced.training);
  const result = evaluate(model, reviewCorpora.balanced.test);
  const total = Object.values(result.confusion).flatMap(row => Object.values(row)).reduce((sum, value) => sum + value, 0);
  assert.equal(total, reviewCorpora.balanced.test.length);
  assert.equal(result.correct, result.cases.filter(item => item.correct).length);
});

test("training rejects empty data and nonpositive smoothing", () => {
  assert.throws(() => trainNaiveBayes([]), RangeError);
  assert.throws(() => trainNaiveBayes(reviewCorpora.balanced.training, { alpha: 0 }), RangeError);
});
