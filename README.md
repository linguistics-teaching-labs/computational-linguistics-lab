# Computational Linguistics Lab

Interactive, browser-based demonstrations for introductory computational linguistics.

**Live collection:** [Computational Linguistics Lab](https://linguistics-teaching-labs.github.io/computational-linguistics-lab/)

**Repository:** [linguistics-teaching-labs/computational-linguistics-lab](https://github.com/linguistics-teaching-labs/computational-linguistics-lab)

The project is designed for instructors and students who want to experiment with computational ideas without installing software or using an external API. Every calculation runs locally in the browser.

## Intended use and limitations

This project is designed for instruction and exploratory research. Its algorithms, corpora, annotations, and synthetic data are deliberately compact so learners can inspect the calculations. Outputs should not be treated as production NLP results, representative descriptions of language communities, or evidence for consequential decisions.

The intended-use statement describes the scope of the demonstrations; it does not narrow the permissions granted by the project's open-source and open-content licenses.

## Project co-owners

- [Wei Lai](https://github.com/weilaiPhonetics)
- [Desen Lin](https://github.com/desenlin)

## Available modules

### How a Language Model Learns

A guided activity in which students:

- inspect a small teaching corpus and its tokens;
- compare unigram, bigram, and trigram predictions;
- calculate conditional probabilities from visible counts;
- experiment with add-one smoothing and unseen contexts;
- generate and critique model output; and
- evaluate a new sentence using token probabilities and perplexity.

The module assumes only introductory probability. No programming is required.

### What Counts as a Word?

A guided activity in which students:

- compare whitespace, word-and-punctuation, and configurable rule-based tokenizers;
- test decisions about contractions and hyphenated forms;
- observe how tokenization changes token and vocabulary counts;
- step through a simplified byte-pair encoding procedure; and
- stress-test word-boundary assumptions beyond English.

The module focuses on conceptual interpretation. No programming is required.

### Why Can a Sentence Have Two Structures?

A guided activity in which students:

- inspect a compact context-free grammar;
- reveal a CKY parsing chart from short spans to the full sentence;
- compare noun-attachment and verb-attachment parse trees;
- adjust attachment preferences and observe the ranking change; and
- distinguish possible structures from their interpretations.

### How Far Apart Are Two Forms?

A guided activity in which students:

- compare forms as characters, words, or space-separated sound symbols;
- reveal an edit-distance matrix one cell at a time;
- trace one minimum-cost alignment;
- change insertion, deletion, and substitution costs; and
- explain why similarity in form is not the same as similarity in meaning.

### How Text Classifiers Make Mistakes

A guided activity in which students:

- train a multinomial Naive Bayes classifier on a small labeled corpus;
- compare unigram features with unigrams plus bigrams;
- inspect class probabilities and feature likelihoods;
- interpret a confusion matrix and audit individual test cases; and
- diagnose negation failures, domain shift, and spurious shortcuts.

### Meaning as Geometry: Word-Embedding Explorer

A guided activity in which students:

- inspect nearest neighbors in a transparent teaching embedding;
- compare vectors using cosine similarity;
- solve selected analogies with vector arithmetic;
- examine model-dependent associations with profession words; and
- test why removing one association direction is not a complete solution to bias.

The included embeddings are synthetic instructional data. They make the calculations traceable and should not be interpreted as empirical evidence about English.

### Speech Sounds Made Visible

A guided activity in which students:

- generate a transparent vowel-like signal without recording or uploading audio;
- distinguish a waveform, spectrum, and spectrogram;
- change fundamental frequency and connect it to periodicity;
- inspect illustrative vowel formant targets; and
- distinguish synthetic teaching values from measured speech data.

### From Sounds to Phonemes

A guided activity in which students:

- compare speech segments as bundles of phonological features;
- identify which features distinguish two sounds;
- use English minimal pairs as evidence for phonemic contrast;
- build natural classes from shared features; and
- identify limits of a compact, English-oriented feature inventory.

### Corpus Frequencies and Collocations

A guided activity in which students:

- change corpus composition and sample size;
- distinguish tokens, types, raw counts, and normalized frequency;
- inspect target words in concordance lines;
- rank adjacent pairs with pointwise mutual information; and
- evaluate an association using frequency, context, and sampling evidence.

### Evaluating Language Technology

A guided activity in which students:

- convert synthetic system scores into decisions with a threshold;
- trace true positives, false positives, true negatives, and false negatives;
- compare precision, recall, accuracy, and F1;
- observe threshold tradeoffs; and
- audit differences between aggregate and subgroup performance.

### How Attention Distributes Context

A guided activity in which students:

- adjust transparent token-to-token compatibility scores;
- convert raw scores into normalized weights with softmax;
- compare concentrated and diffuse attention using temperature;
- test bidirectional and causal attention masks; and
- build a weighted context vector from synthetic token features.

The activity does not call or imitate a commercial language model. Its scores and vectors are synthetic teaching data designed to make the calculation inspectable.

### Coreference and Discourse

A guided activity in which students:

- identify plausible antecedents for pronouns and other referring expressions;
- compare recency, grammatical prominence, compatibility, and repeated mention;
- adjust the influence of each discourse-salience factor;
- distinguish an antecedent ranking from an intended interpretation; and
- use possible continuations to evaluate coherence across sentences.

## Run locally

Because the project uses JavaScript modules, serve the repository with any simple local web server. For example:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

No packages or build step are required. The optional automated checks use Node's built-in test runner:

```bash
npm test
```

## Adapt the activity

- Edit `modules/ngram/corpora.js` to add or revise teaching corpora.
- Edit `modules/ngram/index.html` to change instructions and reflection questions.
- Edit `modules/tokenization/examples.js` to revise boundary examples.
- Edit `modules/parsing/grammar.js` to revise the teaching grammar and sentences.
- Edit `modules/edit-distance/examples.js` to add new form comparisons.
- Edit `modules/classification/data.js` to revise labeled training and test cases.
- Edit `modules/embeddings/data.js` to revise the synthetic teaching embedding.
- Edit `modules/acoustics/acoustics.js` to revise the illustrative vowel profiles and signal model.
- Edit `modules/phonology/features.js` to revise the teaching inventory, features, and minimal pairs.
- Edit `modules/corpus/data.js` to revise the original teaching corpora.
- Edit `modules/evaluation/data.js` to revise the synthetic predictions and reference labels.
- Edit `modules/attention/examples.js` to revise the synthetic scores, masks, and context vectors.
- Edit `modules/coreference/examples.js` to revise discourses, antecedent candidates, and continuations.
- Add one entry to `modules/catalog.js` when creating another demonstration. Assign its subject `category` and set its `sequence` value to control the default catalog order.
- Edit `moduleOrderOptions` and `getModules()` in `modules/catalog.js` to add or revise homepage ordering choices. The current choices are catalog order, newest first, title, and topic.

The shared header groups modules by subject using the same catalog. Homepage subject filters and search also read from that file, so a new activity does not require navigation changes on individual pages.

The sample corpora and multilingual examples are deliberately compact so students can trace behavior by hand. They are instructional examples, not representative language samples or substitutes for language-specific analysis.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the module conventions.

## Citation

Citation metadata is provided in [`CITATION.cff`](CITATION.cff). GitHub can generate APA and BibTeX formats from the repository's **Cite this repository** control.

## License

- Source code is licensed under the [MIT License](LICENSE).
- Original instructional text and teaching corpora are licensed under [CC BY 4.0](LICENSE-CONTENT.md).
