import test from "node:test";
import assert from "node:assert/strict";

import { getModules, moduleNumber, modules, moduleOrderOptions } from "../modules/catalog.js";

test("module identifiers and sequence values are unique", () => {
  assert.equal(new Set(modules.map(({ id }) => id)).size, modules.length);
  assert.equal(new Set(modules.map(({ sequence }) => sequence)).size, modules.length);
});

test("teaching sequence is the default catalog order", () => {
  assert.deepEqual(getModules().map(({ sequence }) => sequence), [1, 2, 3, 4, 5, 6]);
  assert.equal(moduleNumber(modules[0]), "01");
});

test("every advertised catalog order returns every module", () => {
  const ids = [...modules.map(({ id }) => id)].sort();
  for (const { id } of moduleOrderOptions) {
    assert.deepEqual(getModules(id).map((module) => module.id).sort(), ids);
  }
});

test("newest, title, and topic ordering are deterministic", () => {
  const compare = (a, b) => a.localeCompare(b, "en", { sensitivity: "base" });
  assert.deepEqual(getModules("newest").map(({ sequence }) => sequence), [6, 5, 4, 3, 2, 1]);
  assert.deepEqual(getModules("title").map(({ title }) => title), [...modules.map(({ title }) => title)].sort(compare));
  assert.deepEqual(getModules("topic").map(({ topic }) => topic), [...modules.map(({ topic }) => topic)].sort(compare));
});
