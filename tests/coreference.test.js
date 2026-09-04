import test from "node:test";
import assert from "node:assert/strict";

import { getCoreferenceExample } from "../modules/coreference/examples.js";
import { ambiguitySummary, candidateBreakdown, defaultSalienceWeights, normalizeCandidateScores, rankCandidates } from "../modules/coreference/coreference.js";

test("candidate score is the sum of weighted evidence", () => {
  const candidate = { features: { recency: 0.5, subject: 1 } };
  const result = candidateBreakdown(candidate, { recency: 2, subject: 0.5 });
  assert.deepEqual(result.contributions, { recency: 1, subject: 0.5 });
  assert.equal(result.score, 1.5);
});

test("normalized candidate scores sum to one and preserve ranking", () => {
  const values = normalizeCandidateScores([1, 3, 2]);
  assert.ok(Math.abs(values.reduce((sum, value) => sum + value, 0) - 1) < 1e-12);
  assert.ok(values[1] > values[2] && values[2] > values[0]);
});

test("compatibility favors the committee over the singular candidate", () => {
  const example = getCoreferenceExample("committee");
  const ranking = rankCandidates(example.candidates, defaultSalienceWeights);
  assert.equal(ranking[0].candidate.id, "committee");
});

test("raising recency can change an ambiguous antecedent ranking", () => {
  const example = getCoreferenceExample("seminar-call");
  const subjectFocused = rankCandidates(example.candidates, { recency: 0, subject: 3, compatibility: 1, mentions: 0 });
  const recencyFocused = rankCandidates(example.candidates, { recency: 3, subject: 0, compatibility: 1, mentions: 0 });
  assert.equal(subjectFocused[0].candidate.id, "maya");
  assert.equal(recencyFocused[0].candidate.id, "elena");
});

test("ambiguity labels reflect the probability gap", () => {
  assert.equal(ambiguitySummary([{ probability: 0.55 }, { probability: 0.45 }]).label, "High ambiguity");
  assert.equal(ambiguitySummary([{ probability: 0.75 }, { probability: 0.25 }]).label, "Lower ambiguity");
});

test("example lookup and empty inputs fail explicitly", () => {
  assert.equal(getCoreferenceExample("open-device").pronoun, "It");
  assert.throws(() => getCoreferenceExample("missing"), /Unknown coreference example/);
  assert.throws(() => normalizeCandidateScores([]), /at least one candidate/);
  assert.throws(() => rankCandidates([]), /at least one candidate/);
  assert.throws(() => ambiguitySummary([]), /cannot be empty/);
});
