# Computational Linguistics Lab

Interactive, browser-based demonstrations for introductory computational linguistics.

**First module:** [How a Language Model Learns](https://desenlin.github.io/computational-linguistics-lab/modules/ngram/)

The project is designed for instructors and students who want to experiment with computational ideas without installing software or using an external API. Every calculation runs locally in the browser.

## Available module

### How a Language Model Learns

A guided 20–30 minute activity in which students:

- inspect a small teaching corpus and its tokens;
- compare unigram, bigram, and trigram predictions;
- calculate conditional probabilities from visible counts;
- experiment with add-one smoothing and unseen contexts;
- generate and critique model output; and
- evaluate a new sentence using token probabilities and perplexity.

The module assumes only introductory probability. No programming is required.

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
- Reuse the structure under `modules/ngram/` when creating another demonstration.

The sample corpora are deliberately small and repetitive so that students can trace model behavior by hand. They are instructional datasets, not representative language samples.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the module conventions.

## Citation

Citation metadata is provided in [`CITATION.cff`](CITATION.cff). GitHub can generate APA and BibTeX formats from the repository's **Cite this repository** control.

## License

- Source code is licensed under the [MIT License](LICENSE).
- Original instructional text and teaching corpora are licensed under [CC BY 4.0](LICENSE-CONTENT.md).
