export const modules = [
  {
    id: "ngram",
    sequence: 1,
    shortTitle: "Language models",
    title: "How a Language Model Learns",
    topic: "Language modeling",
    category: "models-evaluation",
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
    category: "data-methods",
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
    category: "structure-meaning",
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
    category: "data-methods",
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
    category: "models-evaluation",
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
    category: "structure-meaning",
    description: "Explore semantic neighborhoods, cosine similarity, vector analogies, and model-dependent associations in a transparent teaching embedding.",
    concepts: ["Cosine similarity", "Vector arithmetic", "Representation bias"],
    href: "modules/embeddings/"
  },
  {
    id: "acoustics",
    sequence: 7,
    shortTitle: "Acoustic phonetics",
    title: "Speech Sounds Made Visible",
    topic: "Acoustic phonetics",
    category: "speech-sound",
    description: "Generate an inspectable vowel-like signal and connect its waveform, spectrum, and spectrogram to fundamental frequency and formant patterns.",
    concepts: ["Waveforms", "Fundamental frequency", "Formants"],
    href: "modules/acoustics/"
  },
  {
    id: "phonology",
    sequence: 8,
    shortTitle: "Phonology",
    title: "From Sounds to Phonemes",
    topic: "Phonological features",
    category: "speech-sound",
    description: "Compare speech sounds as feature bundles, inspect minimal pairs, and build natural classes from shared phonological properties.",
    concepts: ["Distinctive features", "Minimal pairs", "Natural classes"],
    href: "modules/phonology/"
  },
  {
    id: "corpus",
    sequence: 9,
    shortTitle: "Corpus statistics",
    title: "Corpus Frequencies and Collocations",
    topic: "Corpus linguistics",
    category: "data-methods",
    description: "Compare raw and normalized frequency, inspect concordance lines, and test how association measures and sample size shape corpus claims.",
    concepts: ["Normalized frequency", "Concordance", "PMI"],
    href: "modules/corpus/"
  },
  {
    id: "evaluation",
    sequence: 10,
    shortTitle: "Evaluation",
    title: "Evaluating Language Technology",
    topic: "Model evaluation",
    category: "models-evaluation",
    description: "Move a decision threshold, read a confusion matrix, compare precision and recall, and audit how errors differ across synthetic user groups.",
    concepts: ["Precision and recall", "Thresholds", "Error disparities"],
    href: "modules/evaluation/"
  }
];

export const moduleCategories = [
  { id: "data-methods", label: "Language data & methods" },
  { id: "structure-meaning", label: "Structure & meaning" },
  { id: "models-evaluation", label: "Models & evaluation" },
  { id: "speech-sound", label: "Speech & sound" }
];

export const defaultModuleOrder = "sequence";

export const moduleOrderOptions = [
  { id: "sequence", label: "Catalog order" },
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

export function getCategory(categoryId) {
  return moduleCategories.find(category => category.id === categoryId);
}

export function getModulesByCategory(categoryId, order = defaultModuleOrder) {
  return getModules(order).filter(module => module.category === categoryId);
}

export function filterModules({ query = "", category = "", order = defaultModuleOrder } = {}) {
  const normalizedQuery = query.trim().toLocaleLowerCase("en");
  return getModules(order).filter(module => {
    if (category && module.category !== category) return false;
    if (!normalizedQuery) return true;
    const categoryLabel = getCategory(module.category)?.label ?? "";
    const searchableText = [
      module.title,
      module.shortTitle,
      module.topic,
      categoryLabel,
      module.description,
      ...module.concepts
    ].join(" ").toLocaleLowerCase("en");
    return searchableText.includes(normalizedQuery);
  });
}
