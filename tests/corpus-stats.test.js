import test from "node:test";
import assert from "node:assert/strict";

import {
  analyzeCorpus,
  collocations,
  concordance,
  targetFrequency,
  tokenize
} from "../modules/corpus/corpus-stats.js";

test("tokenization supports Unicode letters, numbers, and internal apostrophes", () => {
  assert.deepEqual(tokenize("Café students' data: 2026!"), ["café", "students", "data", "2026"]);
});

test("corpus analysis distinguishes available data from a prefix sample", () => {
  const analysis = analyzeCorpus("one two two three", { samplePercent: 50 });
  assert.equal(analysis.totalAvailable, 4);
  assert.equal(analysis.tokenCount, 2);
  assert.equal(analysis.typeCount, 2);
  assert.equal(analysis.typeTokenRatio, 1);
});

test("target frequency reports counts and normalized rates", () => {
  const analysis = analyzeCorpus("lab data lab methods");
  assert.deepEqual(targetFrequency(analysis, "LAB"), { token: "lab", count: 2, perThousand: 500 });
});

test("collocations count repeated adjacent pairs and apply minimum frequency", () => {
  const rows = collocations(["new", "data", "new", "data", "new"], { minCount: 2 });
  assert.equal(rows.length, 2);
  assert.deepEqual(rows.map(row => [row.first, row.second, row.count]), [
    ["data", "new", 2],
    ["new", "data", 2]
  ]);
  assert.ok(rows.every(row => Number.isFinite(row.pmi)));
});

test("concordance preserves bounded left and right context", () => {
  const rows = concordance(["we", "inspect", "the", "data", "and", "share", "data"], "data", 2);
  assert.deepEqual(rows, [
    { left: "inspect the", target: "data", right: "and share" },
    { left: "and share", target: "data", right: "" }
  ]);
});

test("invalid sampling and count controls are rejected", () => {
  assert.throws(() => analyzeCorpus("text", { samplePercent: 0 }), /samplePercent/);
  assert.throws(() => collocations(["a", "b"], { minCount: 0 }), /minCount/);
});
