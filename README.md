# Computational Linguistics Lab

Interactive, browser-based demonstrations for introductory computational linguistics.

**Live collection:** [Computational Linguistics Lab](https://desenlin.com/computational-linguistics-lab/)

The project is designed for instructors and students who want to experiment with computational ideas without installing software or using an external API. Every calculation runs locally in the browser.

## Available modules

### How a Language Model Learns

A guided 20–30 minute activity in which students:

- inspect a small teaching corpus and its tokens;
- compare unigram, bigram, and trigram predictions;
- calculate conditional probabilities from visible counts;
- experiment with add-one smoothing and unseen contexts;
- generate and critique model output; and
- evaluate a new sentence using token probabilities and perplexity.

The module assumes only introductory probability. No programming is required.

### What Counts as a Word?

A guided 20–30 minute activity in which students:

- compare whitespace, word-and-punctuation, and configurable rule-based tokenizers;
- test decisions about contractions and hyphenated forms;
- observe how tokenization changes token and vocabulary counts;
- step through a simplified byte-pair encoding procedure; and
- stress-test word-boundary assumptions beyond English.

The module focuses on conceptual interpretation. No programming is required.

### Why Can a Sentence Have Two Structures?

A guided 20–30 minute activity in which students:

- inspect a compact context-free grammar;
- reveal a CKY parsing chart from short spans to the full sentence;
- compare noun-attachment and verb-attachment parse trees;
- adjust attachment preferences and observe the ranking change; and
- distinguish possible structures from their interpretations.

### How Far Apart Are Two Forms?

A guided 20–30 minute activity in which students:

- compare forms as characters, words, or space-separated sound symbols;
- reveal an edit-distance matrix one cell at a time;
- trace one minimum-cost alignment;
- change insertion, deletion, and substitution costs; and
- explain why similarity in form is not the same as similarity in meaning.

### How Text Classifiers Make Mistakes

A guided 20–30 minute activity in which students:

- train a multinomial Naive Bayes classifier on a small labeled corpus;
- compare unigram features with unigrams plus bigrams;
- inspect class probabilities and feature likelihoods;
- interpret a confusion matrix and audit individual test cases; and
- diagnose negation failures, domain shift, and spurious shortcuts.

### Meaning as Geometry: Word-Embedding Explorer

A guided 20–30 minute activity in which students:

- inspect nearest neighbors in a transparent teaching embedding;
- compare vectors using cosine similarity;
- solve selected analogies with vector arithmetic;
- examine model-dependent associations with profession words; and
- test why removing one association direction is not a complete solution to bias.

The included embeddings are synthetic instructional data. They make the calculations traceable and should not be interpreted as empirical evidence about English.

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
- Add one entry to `modules/catalog.js` when creating another demonstration.

The sample corpora and multilingual examples are deliberately compact so students can trace behavior by hand. They are instructional examples, not representative language samples or substitutes for language-specific analysis.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the module conventions.

## Citation

Citation metadata is provided in [`CITATION.cff`](CITATION.cff). GitHub can generate APA and BibTeX formats from the repository's **Cite this repository** control.

## License

- Source code is licensed under the [MIT License](LICENSE).
- Original instructional text and teaching corpora are licensed under [CC BY 4.0](LICENSE-CONTENT.md).
