const WORD_PATTERN = /\p{L}+(?:['’]\p{L}+)*|\p{N}+(?:[.,]\p{N}+)?/gu;
const SENTENCE_PATTERN = /[^.!?]+/gu;

export function tokenize(text, lowercase = true) {
  const normalized = text.normalize("NFKC");
  const prepared = lowercase ? normalized.toLocaleLowerCase("en-US") : normalized;
  return prepared.match(WORD_PATTERN) ?? [];
}

export function splitSentences(text, lowercase = true) {
  const chunks = text.normalize("NFKC").match(SENTENCE_PATTERN) ?? [];
  return chunks.map(chunk => tokenize(chunk, lowercase)).filter(tokens => tokens.length);
}

function contextKey(tokens) {
  return tokens.join("\u0001");
}

export class NGramModel {
  constructor(text, order = 2, { lowercase = true, smoothing = false } = {}) {
    if (![1, 2, 3].includes(order)) throw new RangeError("Order must be 1, 2, or 3.");
    this.order = order;
    this.lowercase = lowercase;
    this.smoothing = smoothing;
    this.sentences = splitSentences(text, lowercase);
    this.tokens = this.sentences.flat();
    this.vocabulary = [...new Set([...this.tokens, "</s>"])].sort((a, b) => a.localeCompare(b));
    this.counts = new Map();
    this.contextTotals = new Map();
    this.train();
  }

  train() {
    const prefix = Array(Math.max(0, this.order - 1)).fill("<s>");
    for (const sentence of this.sentences) {
      const sequence = [...prefix, ...sentence, "</s>"];
      for (let index = this.order - 1; index < sequence.length; index += 1) {
        const context = sequence.slice(index - this.order + 1, index);
        const next = sequence[index];
        const key = contextKey(context);
        if (!this.counts.has(key)) this.counts.set(key, new Map());
        const nextCounts = this.counts.get(key);
        nextCounts.set(next, (nextCounts.get(next) ?? 0) + 1);
        this.contextTotals.set(key, (this.contextTotals.get(key) ?? 0) + 1);
      }
    }
  }

  normalizeContext(input = "") {
    if (this.order === 1) return [];
    const tokens = Array.isArray(input) ? input : tokenize(input, this.lowercase);
    const required = this.order - 1;
    return [...Array(Math.max(0, required - tokens.length)).fill("<s>"), ...tokens.slice(-required)];
  }

  probability(next, contextInput = "") {
    const context = this.normalizeContext(contextInput);
    const key = contextKey(context);
    const count = this.counts.get(key)?.get(next) ?? 0;
    const total = this.contextTotals.get(key) ?? 0;
    if (this.smoothing) return (count + 1) / (total + this.vocabulary.length);
    return total === 0 ? 0 : count / total;
  }

  predictions(contextInput = "") {
    const context = this.normalizeContext(contextInput);
    const key = contextKey(context);
    const total = this.contextTotals.get(key) ?? 0;
    const nextCounts = this.counts.get(key) ?? new Map();
    const candidates = this.smoothing ? this.vocabulary : [...nextCounts.keys()];
    return candidates
      .map(token => ({
        token,
        count: nextCounts.get(token) ?? 0,
        probability: this.probability(token, context)
      }))
      .sort((a, b) => b.probability - a.probability || b.count - a.count || a.token.localeCompare(b.token));
  }

  sample(contextInput = "", random = Math.random) {
    const predictions = this.predictions(contextInput);
    if (!predictions.length) return null;
    let threshold = random();
    for (const candidate of predictions) {
      threshold -= candidate.probability;
      if (threshold <= 0) return candidate.token;
    }
    return predictions.at(-1).token;
  }

  generate(seed = "", maxTokens = 18, random = Math.random) {
    const output = tokenize(seed, this.lowercase);
    for (let step = 0; step < maxTokens; step += 1) {
      const next = this.sample(output, random);
      if (!next || next === "</s>") break;
      output.push(next);
    }
    return output;
  }

  evaluate(text) {
    const sentences = splitSentences(text, this.lowercase);
    const rows = [];
    let logProbability = 0;
    let hasZero = false;
    for (const sentence of sentences) {
      const prefix = Array(Math.max(0, this.order - 1)).fill("<s>");
      const sequence = [...prefix, ...sentence, "</s>"];
      for (let index = this.order - 1; index < sequence.length; index += 1) {
        const context = sequence.slice(index - this.order + 1, index);
        const token = sequence[index];
        const probability = this.probability(token, context);
        rows.push({ context, token, probability });
        if (probability === 0) hasZero = true;
        else logProbability += Math.log(probability);
      }
    }
    const tokenCount = rows.length;
    return {
      rows,
      tokenCount,
      probability: hasZero ? 0 : Math.exp(logProbability),
      perplexity: !tokenCount || hasZero ? Infinity : Math.exp(-logProbability / tokenCount)
    };
  }
}

export function seededRandom(seed = 1) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}
