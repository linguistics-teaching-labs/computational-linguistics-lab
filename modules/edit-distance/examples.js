export const distanceExamples = {
  classic: {
    label: "Classic spelling example",
    mode: "character",
    source: "kitten",
    target: "sitting",
    note: "The standard example requires substitutions and an insertion."
  },
  spelling: {
    label: "Spelling variation",
    mode: "character",
    source: "color",
    target: "colour",
    note: "One inserted character separates two conventional spellings."
  },
  words: {
    label: "Sentence forms",
    mode: "word",
    source: "the student reads",
    target: "the students read",
    note: "At the word level, inflectional differences appear as substitutions."
  },
  sounds: {
    label: "Sound sequences",
    mode: "sound",
    source: "k æ t",
    target: "k ʌ t",
    note: "Space-separated IPA symbols let the same algorithm align sound sequences."
  },
  meaning: {
    label: "A semantic warning",
    mode: "character",
    source: "cat",
    target: "bat",
    note: "A small form distance does not imply similar meanings. Try replacing “bat” with “dog.”"
  }
};
