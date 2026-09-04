import test from "node:test";
import assert from "node:assert/strict";

import {
  filterModules,
  getModules,
  getModulesByCategory,
  moduleCategories,
  moduleNumber,
  modules,
  moduleOrderOptions
} from "../modules/catalog.js";

test("module identifiers and sequence values are unique", () => {
  assert.equal(new Set(modules.map(({ id }) => id)).size, modules.length);
  assert.equal(new Set(modules.map(({ sequence }) => sequence)).size, modules.length);
  assert.ok(modules.every(module => !("duration" in module)));
  const categoryIds = new Set(moduleCategories.map(({ id }) => id));
  assert.ok(modules.every(module => categoryIds.has(module.category)));
});

test("subject groups cover every module exactly once", () => {
  const groupedIds = moduleCategories.flatMap(category => getModulesByCategory(category.id).map(module => module.id));
  assert.deepEqual(groupedIds.sort(), modules.map(module => module.id).sort());
  assert.equal(modules.find(module => module.id === "attention").category, "models-evaluation");
  assert.equal(modules.find(module => module.id === "coreference").category, "structure-meaning");
});

test("catalog filtering searches content and combines with subject", () => {
  assert.deepEqual(filterModules({ query: "spectrogram" }).map(module => module.id), ["acoustics"]);
  assert.deepEqual(filterModules({ category: "speech-sound" }).map(module => module.id), ["acoustics", "phonology"]);
  assert.deepEqual(filterModules({ query: "features", category: "speech-sound" }).map(module => module.id), ["phonology"]);
  assert.deepEqual(filterModules({ query: "no matching concept" }), []);
});

test("sequence is the default catalog order", () => {
  assert.deepEqual(getModules().map(({ sequence }) => sequence), Array.from({ length: modules.length }, (_, index) => index + 1));
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
  assert.deepEqual(getModules("newest").map(({ sequence }) => sequence), [...modules.map(({ sequence }) => sequence)].sort((a, b) => b - a));
  assert.deepEqual(getModules("title").map(({ title }) => title), [...modules.map(({ title }) => title)].sort(compare));
  assert.deepEqual(getModules("topic").map(({ topic }) => topic), [...modules.map(({ topic }) => topic)].sort(compare));
});
