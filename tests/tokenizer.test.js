import test from "node:test";
import assert from "node:assert/strict";
import {
  boundaryTokens,
  learnBPE,
  ruleTokens,
  tokenStats,
  whitespaceTokens
} from "../modules/tokenization/tokenizer.js";

test("whitespace tokenization preserves attached punctuation", () => {
  assert.deepEqual(whitespaceTokens("Hello, world!"), ["hello,", "world!"]);
});

test("boundary tokenization separates contractions and punctuation", () => {
  assert.deepEqual(boundaryTokens("Can't stop."), ["can", "'", "t", "stop", "."]);
});

test("configurable rules can preserve contractions and hyphens", () => {
  assert.deepEqual(ruleTokens("Can't re-enter."), ["can't", "re-enter", "."]);
});

test("configurable rules can expose internal marks", () => {
  assert.deepEqual(
    ruleTokens("Can't re-enter.", { keepContractions: false, keepHyphens: false }),
    ["can", "'", "t", "re", "-", "enter", "."]
  );
});

test("token statistics distinguish tokens from types", () => {
  assert.deepEqual(tokenStats(["word", "word", "."]), { tokens: 3, types: 2 });
});

test("BPE starts from characters plus word-boundary symbols", () => {
  const result = learnBPE("teach teach", 0);
  assert.equal(result.wordCount, 2);
  assert.equal(result.wordTypes, 1);
  assert.deepEqual(result.words[0].segments, ["▁", "t", "e", "a", "c", "h"]);
});

test("BPE merges the most frequent pair", () => {
  const result = learnBPE("teach teach team", 1);
  assert.deepEqual(result.history[0], { left: "▁", right: "t", merged: "▁t", count: 3 });
  assert.equal(result.words.find(item => item.word === "teach").segments[0], "▁t");
});

test("BPE produces no more subword tokens after additional merges", () => {
  const initial = learnBPE("teach teacher teaching", 0);
  const merged = learnBPE("teach teacher teaching", 8);
  assert.ok(merged.subwordTokens <= initial.subwordTokens);
});
