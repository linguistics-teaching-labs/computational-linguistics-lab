// Model inference stays off the UI thread so students can still edit sentences while it loads.
let extractorPromise;

function getExtractor() {
  if (!extractorPromise) {
    extractorPromise = import("https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1")
      .then(({ pipeline }) => pipeline("feature-extraction", "Xenova/distilbert-base-uncased", {
        dtype: "q8",
        progress_callback: event => {
          if (event.status === "progress" && event.progress != null) {
            self.postMessage({ type: "progress", progress: Math.round(event.progress) });
          }
        }
      }))
      .catch(error => {
        extractorPromise = null; // Allow a retry after a network failure.
        throw error;
      });
  }
  return extractorPromise;
}

function tokenIds(tokenizer, text) {
  return Array.from(tokenizer(text, { add_special_tokens: true }).input_ids.data, Number);
}

async function selectedVector(extractor, { sentence, start, end }) {
  const tokenizer = extractor.tokenizer;
  const full = tokenIds(tokenizer, sentence);
  const before = tokenIds(tokenizer, sentence.slice(0, start));
  const through = tokenIds(tokenizer, sentence.slice(0, end));
  // Each encoding begins with [CLS]. The final [SEP] is excluded from counts.
  const first = before.length - 1;
  const last = through.length - 1;
  if (first >= last || last > full.length - 1 ||
      through.slice(0, -1).some((id, index) => id !== full[index])) {
    throw new Error("Could not align that word with the model tokens. Try another word or shorter sentence.");
  }
  const output = await extractor(sentence, { pooling: "none", normalize: false, truncation: false });
  const [, sequenceLength, dimensions] = output.dims;
  if (last > sequenceLength - 1) throw new Error("The selected word is outside the model's input limit.");
  const result = new Array(dimensions).fill(0);
  for (let position = first; position < last; position++) {
    for (let dimension = 0; dimension < dimensions; dimension++) {
      result[dimension] += output.data[position * dimensions + dimension] / (last - first);
    }
  }
  return { vector: result, pieces: last - first };
}

self.onmessage = async ({ data }) => {
  if (data.type !== "compare") return;
  try {
    self.postMessage({ type: "status", message: "Loading DistilBERT (the first download may take a while)…" });
    const extractor = await getExtractor();
    self.postMessage({ type: "status", message: "Computing the two word vectors…" });
    const a = await selectedVector(extractor, data.a);
    const b = await selectedVector(extractor, data.b);
    self.postMessage({ type: "result", id: data.id, a, b });
  } catch (error) {
    self.postMessage({ type: "error", id: data.id, message: error.message || "The model could not run in this browser." });
  }
};
