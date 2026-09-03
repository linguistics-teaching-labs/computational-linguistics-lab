export const sentenceExamples = {
  telescope: {
    label: "Telescope ambiguity",
    text: "I saw the student with the telescope",
    question: "Who has—or uses—the telescope?"
  },
  park: {
    label: "Location ambiguity",
    text: "I saw the dog in the park",
    question: "Was the seeing in the park, or was the dog in the park?"
  },
  unambiguous: {
    label: "No prepositional phrase",
    text: "The student saw the dog",
    question: "How many complete parses does the grammar find without a prepositional phrase?"
  }
};

export const lexicalRules = {
  i: ["NP"],
  the: ["Det"],
  a: ["Det"],
  student: ["N"],
  dog: ["N"],
  telescope: ["N"],
  park: ["N"],
  saw: ["V"],
  watched: ["V"],
  with: ["P"],
  in: ["P"]
};

export const binaryRules = [
  { lhs: "S", left: "NP", right: "VP", weight: 1 },
  { lhs: "NP", left: "Det", right: "N", weight: 1 },
  { lhs: "NP", left: "NP", right: "PP", attachment: "noun" },
  { lhs: "VP", left: "V", right: "NP", weight: 1 },
  { lhs: "VP", left: "VP", right: "PP", attachment: "verb" },
  { lhs: "PP", left: "P", right: "NP", weight: 1 }
];
