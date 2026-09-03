function prepare(text, lowercase) {
  const normalized = text.normalize("NFKC");
  return lowercase ? normalized.toLocaleLowerCase() : normalized;
}

export function toUnits(text, mode = "character", { lowercase = true } = {}) {
  const prepared = prepare(text, lowercase).trim();
  if (!prepared) return [];
  if (mode === "character") return Array.from(prepared.replace(/\s+/gu, ""));
  if (mode === "word") return prepared.match(/\p{L}+(?:['’]\p{L}+)*|\p{N}+(?:[.,]\p{N}+)?|[^\s]/gu) ?? [];
  if (mode === "sound") return prepared.split(/\s+/u);
  throw new RangeError("Mode must be character, word, or sound.");
}

function choose(candidates) {
  const priority = { match: 0, substitute: 1, delete: 2, insert: 3 };
  return candidates.sort((a, b) => a.cost - b.cost || priority[a.operation] - priority[b.operation])[0];
}

export function editDistance(sourceUnits, targetUnits, {
  insertion = 1,
  deletion = 1,
  substitution = 1
} = {}) {
  const rows = sourceUnits.length + 1;
  const columns = targetUnits.length + 1;
  const matrix = Array.from({ length: rows }, () => Array(columns));
  matrix[0][0] = { cost: 0, operation: "start", previous: null, candidates: [] };

  for (let row = 1; row < rows; row += 1) {
    matrix[row][0] = {
      cost: matrix[row - 1][0].cost + deletion,
      operation: "delete",
      previous: [row - 1, 0],
      candidates: []
    };
  }
  for (let column = 1; column < columns; column += 1) {
    matrix[0][column] = {
      cost: matrix[0][column - 1].cost + insertion,
      operation: "insert",
      previous: [0, column - 1],
      candidates: []
    };
  }

  for (let row = 1; row < rows; row += 1) {
    for (let column = 1; column < columns; column += 1) {
      const same = sourceUnits[row - 1] === targetUnits[column - 1];
      const candidates = [
        {
          cost: matrix[row - 1][column - 1].cost + (same ? 0 : substitution),
          operation: same ? "match" : "substitute",
          previous: [row - 1, column - 1]
        },
        {
          cost: matrix[row - 1][column].cost + deletion,
          operation: "delete",
          previous: [row - 1, column]
        },
        {
          cost: matrix[row][column - 1].cost + insertion,
          operation: "insert",
          previous: [row, column - 1]
        }
      ];
      const selected = choose(candidates);
      matrix[row][column] = { ...selected, candidates };
    }
  }

  const operations = [];
  let row = sourceUnits.length;
  let column = targetUnits.length;
  while (row > 0 || column > 0) {
    const cell = matrix[row][column];
    const [previousRow, previousColumn] = cell.previous;
    operations.push({
      operation: cell.operation,
      source: row > previousRow ? sourceUnits[row - 1] : null,
      target: column > previousColumn ? targetUnits[column - 1] : null,
      cost: cell.cost - matrix[previousRow][previousColumn].cost,
      cell: [row, column]
    });
    row = previousRow;
    column = previousColumn;
  }
  operations.reverse();

  return {
    sourceUnits,
    targetUnits,
    matrix,
    operations,
    distance: matrix.at(-1).at(-1).cost
  };
}
