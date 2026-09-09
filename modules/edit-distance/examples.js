export const distanceExamples = {
  custom: {
    label: "Custom word or form pair",
    mode: "character",
    source: "",
    target: "",
    note: "Enter any two forms below. The rows represent source units, and the columns represent target units."
  },
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
  }
};
