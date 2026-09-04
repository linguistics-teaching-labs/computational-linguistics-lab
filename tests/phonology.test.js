import test from "node:test";
import assert from "node:assert/strict";

import {
  compareSounds,
  featureValues,
  filterInventory,
  getSound,
  sharedFeatures
} from "../modules/phonology/features.js";

test("a close stop contrast differs only in voicing", () => {
  const comparison = compareSounds("p", "b");
  assert.deepEqual(comparison.differences.map(row => row.feature), ["voice"]);
});

test("feature filters construct a predictable natural class", () => {
  const sounds = filterInventory([
    { feature: "voice", value: "voiceless" },
    { feature: "manner", value: "fricative" }
  ]);
  assert.deepEqual(sounds.map(sound => sound.id), ["f", "s", "ʃ"]);
});

test("shared features retain only values common to every sound", () => {
  const shared = sharedFeatures(["p", "b"]);
  assert.equal(shared.type, "consonant");
  assert.equal(shared.place, "bilabial");
  assert.equal(shared.manner, "stop");
  assert.equal(shared.voice, undefined);
});

test("feature values are unique and sound lookup rejects unknown ids", () => {
  assert.deepEqual(featureValues("voice"), ["voiced", "voiceless"]);
  assert.equal(getSound("ŋ").features.manner, "nasal");
  assert.throws(() => getSound("missing"), /Unknown sound/);
});
