import test from "node:test";
import assert from "node:assert/strict";

import { editDistance, toUnits } from "../modules/edit-distance/edit-distance.js";

test("character units omit spaces and normalize case", () => {
  assert.deepEqual(toUnits("A b", "character"), ["a", "b"]);
});

test("word units keep punctuation separate", () => {
  assert.deepEqual(toUnits("Students read, too.", "word"), ["students", "read", ",", "too", "."]);
});

test("sound units use space-separated symbols", () => {
  assert.deepEqual(toUnits("k  æ   t", "sound"), ["k", "æ", "t"]);
});

test("an unsupported unit mode is rejected", () => {
  assert.throws(() => toUnits("abc", "syllable"), RangeError);
});

test("kitten and sitting have unit-cost distance three", () => {
  const result = editDistance(toUnits("kitten"), toUnits("sitting"));
  assert.equal(result.distance, 3);
  assert.equal(result.operations.filter(item => item.operation !== "match").length, 3);
});

test("color and colour differ by one insertion", () => {
  const result = editDistance(toUnits("color"), toUnits("colour"));
  assert.equal(result.distance, 1);
  assert.equal(result.operations.filter(item => item.operation === "insert").length, 1);
});

test("empty sequences accumulate weighted insertion and deletion costs", () => {
  assert.equal(editDistance([], ["a", "b"], { insertion: 0.5 }).distance, 1);
  assert.equal(editDistance(["a", "b"], [], { deletion: 1.5 }).distance, 3);
});

test("an expensive substitution is replaced by deletion plus insertion", () => {
  const result = editDistance(["a"], ["b"], { substitution: 3, deletion: 1, insertion: 1 });
  assert.equal(result.distance, 2);
  assert.deepEqual(result.operations.map(item => item.operation), ["insert", "delete"]);
});

test("each interior cell records calculations from its three adjacent predecessors", () => {
  const result = editDistance(toUnits("ba"), toUnits("c"));
  const cell = result.matrix[2][1];

  assert.deepEqual(cell.candidates.map(candidate => ({
    operation: candidate.operation,
    previous: candidate.previous,
    cost: candidate.cost
  })), [
    { operation: "substitute", previous: [1, 0], cost: 2 },
    { operation: "delete", previous: [1, 1], cost: 2 },
    { operation: "insert", previous: [2, 0], cost: 3 }
  ]);
  assert.equal(cell.cost, 2);
  assert.equal(cell.operation, "substitute");
});
