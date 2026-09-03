export const modules = [
  {
    id: "ngram",
    number: "01",
    shortTitle: "Language models",
    title: "How a Language Model Learns",
    topic: "Language modeling",
    duration: "20–30 minutes",
    description: "Build unigram, bigram, and trigram models from a small corpus. Inspect their counts, test smoothing, generate text, and diagnose what the models miss.",
    concepts: ["Conditional probability", "Context", "Data sparsity"],
    href: "modules/ngram/"
  },
  {
    id: "tokenization",
    number: "02",
    shortTitle: "Tokenization",
    title: "What Counts as a Word?",
    topic: "Tokens and subwords",
    duration: "20–30 minutes",
    description: "Compare boundary rules, stress-test them across writing systems, and watch a small subword vocabulary emerge through repeated pair merges.",
    concepts: ["Word boundaries", "Morphology", "Subword units"],
    href: "modules/tokenization/"
  },
  {
    id: "parsing",
    number: "03",
    shortTitle: "Parsing",
    title: "Why Can a Sentence Have Two Structures?",
    topic: "Syntax and parsing",
    duration: "20–30 minutes",
    description: "Reveal a CKY chart span by span, compare competing parse trees, and see how attachment preferences change a probabilistic ranking.",
    concepts: ["Constituency", "Ambiguity", "Dynamic programming"],
    href: "modules/parsing/"
  },
  {
    id: "edit-distance",
    number: "04",
    shortTitle: "Edit distance",
    title: "How Far Apart Are Two Forms?",
    topic: "Linguistic similarity",
    duration: "20–30 minutes",
    description: "Construct an edit-distance matrix, inspect the optimal alignment, and test how units and operation costs shape a similarity judgment.",
    concepts: ["Alignment", "Edit operations", "Measurement"],
    href: "modules/edit-distance/"
  }
];
