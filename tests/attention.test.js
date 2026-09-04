import test from "node:test";
import assert from "node:assert/strict";

import { getAttentionExample } from "../modules/attention/examples.js";
import { attentionMask, attentionSummary, rankAttention, softmax, weightedContext } from "../modules/attention/attention.js";

test("softmax produces nonnegative weights that sum to one", () => {
  const weights = softmax([0, 1, 2]);
  assert.ok(weights.every(weight => weight >= 0));
  assert.ok(Math.abs(weights.reduce((sum, weight) => sum + weight, 0) - 1) < 1e-12);
  assert.ok(weights[2] > weights[1] && weights[1] > weights[0]);
});

test("lower temperature concentrates the distribution", () => {
  const cool = attentionSummary([0, 1, 2], 0.5);
  const warm = attentionSummary([0, 1, 2], 2);
  assert.ok(cool.weights[2] > warm.weights[2]);
  assert.ok(cool.effectiveTokens < warm.effectiveTokens);
});

test("causal masking excludes positions after the focus", () => {
  const mask = attentionMask(5, 2, "causal");
  assert.deepEqual(mask, [true, true, true, false, false]);
  const weights = softmax([0, 0, 0, 5, 5], 1, mask);
  assert.deepEqual(weights.slice(3), [0, 0]);
});

test("weighted context is a dimension-wise weighted sum", () => {
  assert.deepEqual(weightedContext([0.25, 0.75], [[1, 0], [0, 2]]), [0.25, 1.5]);
});

test("attention ranking retains token positions for ties", () => {
  assert.deepEqual(rankAttention(["a", "b", "c"], [0.2, 0.6, 0.2]).map(item => item.token), ["b", "a", "c"]);
});

test("teaching examples align tokens, scores, and vectors", () => {
  const example = getAttentionExample("financial-bank");
  assert.equal(example.tokens.length, example.scores.length);
  assert.equal(example.tokens.length, example.vectors.length);
  assert.throws(() => getAttentionExample("missing"), /Unknown attention example/);
});

test("invalid attention inputs fail explicitly", () => {
  assert.throws(() => softmax([], 1, []), /same nonzero length/);
  assert.throws(() => softmax([1], 0), /temperature/);
  assert.throws(() => attentionMask(2, 3), /focusIndex/);
  assert.throws(() => weightedContext([1], [[1], [2]]), /align/);
});
