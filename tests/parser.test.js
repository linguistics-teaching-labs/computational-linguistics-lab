import test from "node:test";
import assert from "node:assert/strict";

import {
  attachmentType,
  bracketedTree,
  chartSpans,
  parseSentence,
  sentenceTokens
} from "../modules/parsing/parser.js";

test("sentenceTokens normalizes case and ignores punctuation", () => {
  assert.deepEqual(sentenceTokens("I watched the DOG!"), ["i", "watched", "the", "dog"]);
});

test("the telescope example has two complete parses", () => {
  const result = parseSentence("I saw the student with the telescope");
  assert.equal(result.parses.length, 2);
  assert.deepEqual(new Set(result.parses.map(attachmentType)), new Set(["noun", "verb"]));
});

test("a sentence without a PP has one complete parse", () => {
  const result = parseSentence("The student saw the dog");
  assert.equal(result.parses.length, 1);
  assert.equal(attachmentType(result.parses[0]), null);
});

test("attachment preference changes the ranking", () => {
  const nounFavored = parseSentence("I saw the dog in the park", { nounAttachment: 0.8 });
  const verbFavored = parseSentence("I saw the dog in the park", { nounAttachment: 0.2 });
  assert.equal(attachmentType(nounFavored.parses[0]), "noun");
  assert.equal(attachmentType(verbFavored.parses[0]), "verb");
  assert.equal(nounFavored.parses[0].score, 0.8);
});

test("unknown vocabulary is reported and blocks a complete parse", () => {
  const result = parseSentence("I admired the dog");
  assert.deepEqual(result.unknown, ["admired"]);
  assert.equal(result.parses.length, 0);
});

test("chartSpans exposes lexical and full-sentence cells", () => {
  const result = parseSentence("The student saw the dog");
  const spans = chartSpans(result);
  assert.deepEqual(spans.find(span => span.start === 0 && span.end === 1)?.labels, ["Det"]);
  assert.deepEqual(spans.find(span => span.start === 0 && span.end === 5)?.labels, ["S"]);
});

test("bracketedTree serializes a parse for inspection", () => {
  const [parse] = parseSentence("The student saw the dog").parses;
  assert.equal(bracketedTree(parse), "(S (NP (Det the) (N student)) (VP (V saw) (NP (Det the) (N dog))))");
});
