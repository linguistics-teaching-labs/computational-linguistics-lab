export const featureLabels = {
  type: "segment type",
  voice: "voicing",
  place: "place",
  manner: "manner",
  continuant: "continuant",
  nasal: "nasal",
  sonorant: "sonorant",
  height: "vowel height",
  backness: "vowel backness",
  round: "rounding",
  tense: "tenseness"
};

const consonant = (id, example, voice, place, manner, extra = {}) => ({
  id,
  symbol: id,
  example,
  features: {
    type: "consonant",
    voice,
    place,
    manner,
    continuant: ["fricative", "approximant", "lateral"].includes(manner) ? "+" : "−",
    nasal: manner === "nasal" ? "+" : "−",
    sonorant: ["nasal", "approximant", "lateral"].includes(manner) ? "+" : "−",
    ...extra
  }
});

const vowel = (id, example, height, backness, round, tense) => ({
  id,
  symbol: id,
  example,
  features: { type: "vowel", height, backness, round, tense, voice: "voiced", sonorant: "+" }
});

export const inventory = [
  consonant("p", "pin", "voiceless", "bilabial", "stop"),
  consonant("b", "bin", "voiced", "bilabial", "stop"),
  consonant("t", "tin", "voiceless", "alveolar", "stop"),
  consonant("d", "din", "voiced", "alveolar", "stop"),
  consonant("k", "kin", "voiceless", "velar", "stop"),
  consonant("g", "gain", "voiced", "velar", "stop"),
  consonant("f", "fan", "voiceless", "labiodental", "fricative"),
  consonant("v", "van", "voiced", "labiodental", "fricative"),
  consonant("s", "sip", "voiceless", "alveolar", "fricative"),
  consonant("z", "zip", "voiced", "alveolar", "fricative"),
  consonant("ʃ", "ship", "voiceless", "postalveolar", "fricative"),
  consonant("ʒ", "measure", "voiced", "postalveolar", "fricative"),
  consonant("m", "map", "voiced", "bilabial", "nasal"),
  consonant("n", "nap", "voiced", "alveolar", "nasal"),
  consonant("ŋ", "sing", "voiced", "velar", "nasal"),
  consonant("l", "lip", "voiced", "alveolar", "lateral"),
  consonant("ɹ", "rip", "voiced", "postalveolar", "approximant"),
  consonant("j", "yes", "voiced", "palatal", "approximant"),
  consonant("w", "wet", "voiced", "labial-velar", "approximant"),
  vowel("i", "fleece", "high", "front", "unrounded", "tense"),
  vowel("ɪ", "kit", "high", "front", "unrounded", "lax"),
  vowel("ɛ", "dress", "mid", "front", "unrounded", "lax"),
  vowel("æ", "trap", "low", "front", "unrounded", "lax"),
  vowel("ə", "comma", "mid", "central", "unrounded", "lax"),
  vowel("ɑ", "lot", "low", "back", "unrounded", "tense"),
  vowel("ɔ", "thought", "mid", "back", "rounded", "tense"),
  vowel("ʊ", "foot", "high", "back", "rounded", "lax"),
  vowel("u", "goose", "high", "back", "rounded", "tense")
];

export const minimalPairs = [
  { words: ["pat", "bat"], sounds: ["p", "b"], note: "Initial voicing distinguishes the words." },
  { words: ["sip", "zip"], sounds: ["s", "z"], note: "The fricatives share place and manner but differ in voicing." },
  { words: ["fan", "van"], sounds: ["f", "v"], note: "A single laryngeal contrast changes the lexical item." },
  { words: ["ten", "ken"], sounds: ["t", "k"], note: "The stops share voicing and manner but differ in place." },
  { words: ["sum", "sun"], sounds: ["m", "n"], note: "The nasals differ in place of articulation." },
  { words: ["sheep", "ship"], sounds: ["i", "ɪ"], note: "This teaching representation contrasts tense and lax high front vowels." }
];

export function getSound(id) {
  const sound = inventory.find(item => item.id === id);
  if (!sound) throw new Error(`Unknown sound: ${id}`);
  return sound;
}

export function compareSounds(firstId, secondId) {
  const first = getSound(firstId);
  const second = getSound(secondId);
  const keys = [...new Set([...Object.keys(first.features), ...Object.keys(second.features)])];
  const rows = keys.map(feature => ({
    feature,
    first: first.features[feature] ?? "not applicable",
    second: second.features[feature] ?? "not applicable",
    differs: first.features[feature] !== second.features[feature]
  }));
  return { first, second, rows, differences: rows.filter(row => row.differs) };
}

export function featureValues(feature) {
  return [...new Set(inventory.map(sound => sound.features[feature]).filter(Boolean))].sort();
}

export function filterInventory(filters) {
  const active = filters.filter(filter => filter?.feature && filter?.value);
  return inventory.filter(sound => active.every(filter => sound.features[filter.feature] === filter.value));
}

export function sharedFeatures(soundIds) {
  if (!soundIds.length) return {};
  const sounds = soundIds.map(getSound);
  const keys = Object.keys(sounds[0].features);
  return Object.fromEntries(keys.filter(key => sounds.every(sound => sound.features[key] === sounds[0].features[key])).map(key => [key, sounds[0].features[key]]));
}
