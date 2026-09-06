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

test("BPE ranks every adjacent pair by corpus frequency", () => {
  const result = learnBPE("teach teach team", 0);
  assert.deepEqual(result.rankedPairs.slice(0, 3), [
    { left: "▁", right: "t", merged: "▁t", count: 3 },
    { left: "t", right: "e", merged: "te", count: 3 },
    { left: "e", right: "a", merged: "ea", count: 3 }
  ]);
});

test("BPE breaks frequency ties by first corpus occurrence", () => {
  const result = learnBPE("ba ab", 0);
  assert.deepEqual(result.rankedPairs.map(pair => `${pair.left}+${pair.right}`), ["▁+b", "b+a", "▁+a", "a+b"]);
});

test("pair rankings are recalculated after every merge", () => {
  const initial = learnBPE("teach teach team", 0);
  const next = learnBPE("teach teach team", 1);
  assert.equal(initial.rankedPairs[0].merged, "▁t");
  assert.deepEqual(next.rankedPairs[0], { left: "▁t", right: "e", merged: "▁te", count: 3 });
});

test("the learned vocabulary retains base symbols and adds merge tokens", () => {
  const initial = learnBPE("teach teach team", 0);
  const afterTwo = learnBPE("teach teach team", 2);
  assert.equal(afterTwo.learnedVocabularySize, initial.learnedVocabularySize + 2);
  assert.ok(afterTwo.learnedVocabulary.includes("▁t"));
  assert.ok(afterTwo.learnedVocabulary.includes("▁te"));
  assert.ok(afterTwo.learnedVocabulary.includes("t"));
});
