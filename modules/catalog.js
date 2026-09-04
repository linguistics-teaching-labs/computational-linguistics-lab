export const modules = [
  {
    id: "ngram",
    sequence: 1,
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
    sequence: 2,
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
    sequence: 3,
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
    sequence: 4,
    shortTitle: "Edit distance",
    title: "How Far Apart Are Two Forms?",
    topic: "Linguistic similarity",
    duration: "20–30 minutes",
    description: "Construct an edit-distance matrix, inspect the optimal alignment, and test how units and operation costs shape a similarity judgment.",
    concepts: ["Alignment", "Edit operations", "Measurement"],
    href: "modules/edit-distance/"
  },
  {
    id: "classification",
    sequence: 5,
    shortTitle: "Classification",
    title: "How Text Classifiers Make Mistakes",
    topic: "Text classification",
    duration: "20–30 minutes",
    description: "Train a small Naive Bayes classifier, inspect feature evidence and a confusion matrix, and diagnose negation failures, domain shift, and shortcut learning.",
    concepts: ["Bayes’ rule", "Evaluation", "Error analysis"],
    href: "modules/classification/"
  },
  {
    id: "embeddings",
    sequence: 6,
    shortTitle: "Embeddings",
    title: "Meaning as Geometry: Word-Embedding Explorer",
    topic: "Distributional semantics",
    duration: "20–30 minutes",
    description: "Explore semantic neighborhoods, cosine similarity, vector analogies, and model-dependent associations in a transparent teaching embedding.",
    concepts: ["Cosine similarity", "Vector arithmetic", "Representation bias"],
    href: "modules/embeddings/"
  }
];

export const defaultModuleOrder = "sequence";

export const moduleOrderOptions = [
  { id: "sequence", label: "Teaching sequence" },
  { id: "newest", label: "Newest module first" },
  { id: "title", label: "Title, A–Z" },
  { id: "topic", label: "Topic, A–Z" }
];

const collator = new Intl.Collator("en", { sensitivity: "base" });

export function moduleNumber(module) {
  return String(module.sequence).padStart(2, "0");
}

export function getModules(order = defaultModuleOrder) {
  const sorted = [...modules];

  if (order === "newest") return sorted.sort((a, b) => b.sequence - a.sequence);
  if (order === "title") return sorted.sort((a, b) => collator.compare(a.title, b.title));
  if (order === "topic") return sorted.sort((a, b) => collator.compare(a.topic, b.topic));
  return sorted.sort((a, b) => a.sequence - b.sequence);
}
