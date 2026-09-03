import test from "node:test";
import assert from "node:assert/strict";

import { teachingEmbeddings } from "../modules/embeddings/data.js";
import {
  anchorAssociation,
  analogyVector,
  cosineSimilarity,
  dot,
  nearestNeighbors,
  projectAway,
  subtract
} from "../modules/embeddings/embedding-math.js";

const vector = word => teachingEmbeddings[word].vector;

test("dot product rejects unequal dimensions", () => {
  assert.throws(() => dot([1, 2], [1]), RangeError);
});

test("cosine similarity is one for the same nonzero vector", () => {
  assert.ok(Math.abs(cosineSimilarity(vector("king"), vector("king")) - 1) < 1e-12);
});

test("cosine similarity returns zero when one vector has zero magnitude", () => {
  assert.equal(cosineSimilarity([0, 0], [1, 2]), 0);
});

test("the royal analogy retrieves queen", () => {
  const query = analogyVector(vector("man"), vector("king"), vector("woman"));
  const [nearest] = nearestNeighbors(query, teachingEmbeddings, { exclude: ["man", "king", "woman"] });
  assert.equal(nearest.word, "queen");
  assert.ok(Math.abs(nearest.similarity - 1) < 1e-12);
});

test("the family analogy retrieves mother", () => {
  const query = analogyVector(vector("man"), vector("father"), vector("woman"));
  const [nearest] = nearestNeighbors(query, teachingEmbeddings, { exclude: ["man", "father", "woman"] });
  assert.equal(nearest.word, "mother");
});

test("nearestNeighbors respects exclusions and limits", () => {
  const result = nearestNeighbors(vector("cat"), teachingEmbeddings, { exclude: ["cat", "dog"], limit: 3 });
  assert.equal(result.length, 3);
  assert.ok(result.every(item => !["cat", "dog"].includes(item.word)));
});

test("projectAway removes the selected direction", () => {
  const direction = subtract(vector("man"), vector("woman"));
  const projected = projectAway(vector("engineer"), direction);
  assert.ok(Math.abs(dot(projected, direction)) < 1e-12);
});

test("removing the anchor direction equalizes the two anchor associations", () => {
  const direction = subtract(vector("man"), vector("woman"));
  const projected = projectAway(vector("nurse"), direction);
  assert.ok(Math.abs(anchorAssociation(projected, vector("woman"), vector("man"))) < 1e-12);
});
