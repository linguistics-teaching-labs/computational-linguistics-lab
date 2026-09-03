import test from "node:test";
import assert from "node:assert/strict";
import { NGramModel, seededRandom, splitSentences, tokenize } from "../modules/ngram/ngram-model.js";

test("tokenizer handles Unicode words and apostrophes", () => {
  assert.deepEqual(tokenize("Café students don't stop."), ["café", "students", "don't", "stop"]);
});

test("sentence splitter removes punctuation and empty chunks", () => {
  assert.deepEqual(splitSentences("One test. Two tests!"), [["one", "test"], ["two", "tests"]]);
});

test("bigram probabilities are estimated from counts", () => {
  const model = new NGramModel("the student reads. the student writes.", 2);
  assert.equal(model.probability("reads", "student"), 0.5);
  assert.equal(model.probability("writes", "student"), 0.5);
  assert.equal(model.probability("student", "the"), 1);
});

test("trigram uses only the two most recent context words", () => {
  const model = new NGramModel("the student reads. a student writes.", 3);
  assert.equal(model.probability("reads", "ignore these the student"), 1);
  assert.equal(model.probability("writes", "a student"), 1);
});

test("unsmoothed unseen context has no predictions", () => {
  const model = new NGramModel("the student reads.", 2);
  assert.deepEqual(model.predictions("professor"), []);
});

test("add-one probabilities sum to one for unseen context", () => {
  const model = new NGramModel("the student reads.", 2, { smoothing: true });
  const sum = model.predictions("professor").reduce((total, item) => total + item.probability, 0);
  assert.ok(Math.abs(sum - 1) < 1e-12);
});

test("sentence evaluation detects a zero-probability transition", () => {
  const model = new NGramModel("the student reads.", 2);
  const result = model.evaluate("the professor reads");
  assert.equal(result.probability, 0);
  assert.equal(result.perplexity, Infinity);
  assert.ok(result.rows.some(row => row.probability === 0));
});

test("seeded generation is reproducible", () => {
  const model = new NGramModel("the student reads. the student writes.", 2);
  assert.deepEqual(model.generate("the", 5, seededRandom(42)), model.generate("the", 5, seededRandom(42)));
});
