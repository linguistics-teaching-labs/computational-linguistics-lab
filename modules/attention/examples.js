export const attentionExamples = [
  {
    id: "river-bank",
    label: "River-bank context",
    sentence: "The hikers rested near the river bank.",
    tokens: ["The", "hikers", "rested", "near", "the", "river", "bank"],
    focusIndex: 6,
    scores: [-0.8, 0.2, 0.7, 0.1, -0.6, 2.3, 0.9],
    featureLabels: ["River setting", "Financial setting", "Event link"],
    vectors: [
      [0, 0, 0], [0.2, 0, 0.2], [0.4, 0, 0.8], [0.2, 0, 0.2],
      [0, 0, 0], [1, 0, 0.3], [0.5, 0.4, 0.1]
    ],
    note: "The high score for “river” makes the weighted context more strongly associated with the river-bank reading."
  },
  {
    id: "financial-bank",
    label: "Financial-bank context",
    sentence: "The bank approved the loan quickly.",
    tokens: ["The", "bank", "approved", "the", "loan", "quickly"],
    focusIndex: 1,
    scores: [-0.7, 0.5, 1.5, -0.8, 2.2, 0.2],
    featureLabels: ["River setting", "Financial setting", "Event link"],
    vectors: [
      [0, 0, 0], [0.4, 0.5, 0.1], [0, 0.6, 1], [0, 0, 0], [0, 1, 0.5], [0, 0, 0.2]
    ],
    note: "In bidirectional attention, “approved” and “loan” support the financial reading. A causal mask hides those later tokens from “bank.”"
  },
  {
    id: "agreement",
    label: "Agreement context",
    sentence: "The reports from the analyst were clear.",
    tokens: ["The", "reports", "from", "the", "analyst", "were", "clear"],
    focusIndex: 5,
    scores: [-0.8, 2.1, -0.2, -0.7, 1.1, 0.4, 0.2],
    featureLabels: ["Plural cue", "Singular cue", "Predicate link"],
    vectors: [
      [0, 0, 0], [1, 0, 0.4], [0, 0, 0.1], [0, 0, 0], [0, 1, 0.3], [0.4, 0.2, 0.8], [0.1, 0.1, 0.7]
    ],
    note: "The plural head “reports” competes with the nearer singular noun “analyst.” The scores determine which cue contributes more."
  }
];

export function getAttentionExample(id) {
  const example = attentionExamples.find(item => item.id === id);
  if (!example) throw new Error(`Unknown attention example: ${id}`);
  return example;
}
