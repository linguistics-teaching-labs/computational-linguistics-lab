export const embeddingDimensions = ["D1", "D2", "D3", "D4", "D5", "D6", "D7", "D8"];

export const teachingEmbeddings = {
  man:       { vector: [0, 1, 1, 0.2, 0.1, 0.1, 0.1, 0], group: "people", plot: [22, 45] },
  woman:     { vector: [0, 1, -1, 0.2, 0.1, 0.1, 0.1, 0], group: "people", plot: [22, 58] },
  king:      { vector: [1, 1, 1, 0.1, 0, 0, 0, 0], group: "royalty", plot: [15, 20] },
  queen:     { vector: [1, 1, -1, 0.1, 0, 0, 0, 0], group: "royalty", plot: [16, 31] },
  prince:    { vector: [0.85, 0.45, 1, 0.2, 0, 0, 0, 0], group: "royalty", plot: [29, 20] },
  princess:  { vector: [0.85, 0.45, -1, 0.2, 0, 0, 0, 0], group: "royalty", plot: [30, 31] },
  father:    { vector: [0, 1, 1, 1, 0.05, 0.35, 0, 0], group: "family", plot: [38, 43] },
  mother:    { vector: [0, 1, -1, 1, 0.05, 0.35, 0, 0], group: "family", plot: [38, 59] },
  son:       { vector: [0, 0.45, 1, 1, 0, 0.2, 0, 0], group: "family", plot: [49, 43] },
  daughter:  { vector: [0, 0.45, -1, 1, 0, 0.2, 0, 0], group: "family", plot: [49, 59] },
  doctor:    { vector: [0, 1, 0.12, 0, 0.9, 0.65, 0.05, 0], group: "professions", plot: [63, 25] },
  nurse:     { vector: [0, 1, -0.35, 0, 0.25, 1, 0.05, 0], group: "professions", plot: [68, 40] },
  engineer:  { vector: [0, 1, 0.3, 0, 1, 0.15, 0.05, 0], group: "professions", plot: [75, 18] },
  teacher:   { vector: [0, 1, -0.18, 0.2, 0.4, 0.75, 0.25, 0], group: "professions", plot: [62, 52] },
  scientist: { vector: [0, 1, 0.1, 0, 1, 0.25, 0.05, 0], group: "professions", plot: [73, 29] },
  artist:    { vector: [0, 1, -0.05, 0, 0.1, 0.1, 1, 0], group: "arts", plot: [79, 58] },
  painter:   { vector: [0, 1, 0, 0, 0.05, 0.1, 0.95, 0], group: "arts", plot: [86, 51] },
  musician:  { vector: [0, 1, -0.05, 0, 0.05, 0.15, 0.9, 0], group: "arts", plot: [88, 64] },
  cat:       { vector: [0, 0.2, -0.05, 0.15, 0, 0.2, 0.05, 1], group: "animals", plot: [60, 78] },
  dog:       { vector: [0, 0.2, 0.05, 0.15, 0, 0.25, 0.05, 1], group: "animals", plot: [70, 79] },
  horse:     { vector: [0, 0.2, 0.1, 0.05, 0, 0.1, 0.05, 1], group: "animals", plot: [82, 82] },
  pet:       { vector: [0, 0.1, 0, 0.2, 0, 0.5, 0, 1], group: "animals", plot: [66, 91] }
};

export const analogyPresets = {
  royal: { label: "man : king :: woman : ?", a: "man", b: "king", c: "woman" },
  family: { label: "man : father :: woman : ?", a: "man", b: "father", c: "woman" },
  generation: { label: "king : prince :: queen : ?", a: "king", b: "prince", c: "queen" }
};

export const associationWords = ["doctor", "nurse", "engineer", "teacher", "scientist", "artist"];
