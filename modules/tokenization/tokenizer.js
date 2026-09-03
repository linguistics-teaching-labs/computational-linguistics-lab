const BARE_WORD = "\\p{L}+";
const NUMBER = "\\p{N}+(?:(?:[.:,])\\p{N}+)*";

function prepare(text, lowercase = true) {
  const normalized = text.normalize("NFKC");
  return lowercase ? normalized.toLocaleLowerCase() : normalized;
}

export function whitespaceTokens(text, { lowercase = true } = {}) {
  const prepared = prepare(text, lowercase).trim();
  return prepared ? prepared.split(/\s+/u) : [];
}

export function boundaryTokens(text, { lowercase = true } = {}) {
  const prepared = prepare(text, lowercase);
  const pattern = new RegExp(`${BARE_WORD}|${NUMBER}|[^\\s]`, "gu");
  return prepared.match(pattern) ?? [];
}

export function ruleTokens(text, {
  lowercase = true,
  keepContractions = true,
  keepHyphens = true
} = {}) {
  const prepared = prepare(text, lowercase);
  const joiners = [];
  if (keepContractions) joiners.push("['’]");
  if (keepHyphens) joiners.push("-");
  const continuation = joiners.length ? `(?:(?:${joiners.join("|")})\\p{L}+)*` : "";
  const pattern = new RegExp(`${BARE_WORD}${continuation}|${NUMBER}|[^\\s]`, "gu");
  return prepared.match(pattern) ?? [];
}

export function wordTokens(text, { lowercase = true } = {}) {
  return ruleTokens(text, { lowercase, keepContractions: true, keepHyphens: true })
    .filter(token => /[\p{L}\p{N}]/u.test(token));
}

export function tokenStats(tokens) {
  return {
    tokens: tokens.length,
    types: new Set(tokens).size
  };
}

function pairKey(left, right) {
  return `${left}\u0001${right}`;
}

function mergeSequence(sequence, left, right, merged) {
  const output = [];
  for (let index = 0; index < sequence.length; index += 1) {
    if (sequence[index] === left && sequence[index + 1] === right) {
      output.push(merged);
      index += 1;
    } else {
      output.push(sequence[index]);
    }
  }
  return output;
}

export function learnBPE(text, mergeLimit = 0, { lowercase = true } = {}) {
  const words = wordTokens(text, { lowercase });
  const frequencies = new Map();
  for (const word of words) frequencies.set(word, (frequencies.get(word) ?? 0) + 1);

  const sequences = new Map(
    [...frequencies.keys()].map(word => [word, ["▁", ...Array.from(word)]])
  );
  const history = [];

  for (let step = 0; step < mergeLimit; step += 1) {
    const pairCounts = new Map();
    for (const [word, sequence] of sequences) {
      const frequency = frequencies.get(word);
      for (let index = 0; index < sequence.length - 1; index += 1) {
        const key = pairKey(sequence[index], sequence[index + 1]);
        pairCounts.set(key, (pairCounts.get(key) ?? 0) + frequency);
      }
    }
    const ranked = [...pairCounts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    if (!ranked.length) break;
    const [key, count] = ranked[0];
    const [left, right] = key.split("\u0001");
    const merged = `${left}${right}`;
    for (const [word, sequence] of sequences) {
      sequences.set(word, mergeSequence(sequence, left, right, merged));
    }
    history.push({ left, right, merged, count });
  }

  const vocabulary = new Set();
  let totalTokens = 0;
  for (const [word, sequence] of sequences) {
    sequence.forEach(symbol => vocabulary.add(symbol));
    totalTokens += sequence.length * frequencies.get(word);
  }

  const analyzedWords = [...sequences.entries()]
    .map(([word, segments]) => ({ word, segments, count: frequencies.get(word) }))
    .sort((a, b) => b.count - a.count || a.word.localeCompare(b.word));

  return {
    words: analyzedWords,
    history,
    wordCount: words.length,
    wordTypes: frequencies.size,
    subwordTokens: totalTokens,
    vocabularySize: vocabulary.size
  };
}
