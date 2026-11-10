import type {
  ScanwordEntry,
  ScanwordGiven,
  ScanwordPublicTask,
  ScanwordPuzzle,
  ScanwordRevision,
} from './scanword.types';
import { ScanwordError } from './scanword.types';
import {
  isScanwordAlphabet,
  normalizeScanwordAnswer,
  normalizeScanwordClue,
  normalizeScanwordDictionary,
  SCANWORD_ALPHABETS,
  validateScanwordSize,
} from './scanword-input';
import { shuffle } from '../shared/random';
import type { RandomSource } from '../shared/random';

export function validateScanwordPuzzle(puzzle: ScanwordPuzzle): ScanwordPuzzle {
  validateScanwordSize(puzzle.rows, puzzle.columns);
  const { rows, columns, cells, entries, alphabet } = puzzle;
  if (
    puzzle.schemaVersion !== 1 ||
    puzzle.type !== 'scanword' ||
    !isScanwordAlphabet(alphabet) ||
    !puzzle.id.trim() ||
    puzzle.id.length > 100 ||
    !puzzle.title.trim() ||
    puzzle.title.length > 120 ||
    [puzzle.id, puzzle.title].some((text) =>
      /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\ud800-\udfff]/u.test(text),
    ) ||
    ![1, 2].includes(puzzle.maxCluesPerCell) ||
    cells.length !== rows * columns ||
    entries.length < 2 ||
    entries.length > 40 ||
    Array.from(cells).some(
      (letter) =>
        letter !== null &&
        (typeof letter !== 'string' ||
          letter.length !== 1 ||
          !SCANWORD_ALPHABETS[alphabet].letters.includes(letter)),
    )
  )
    throw new ScanwordError('data');
  const ids = new Set<string>(),
    answers = new Set<string>(),
    anchors = new Map<number, ScanwordEntry[]>();
  const coverage = cells.map(() => new Set<string>());
  for (const entry of entries) {
    if (
      !entry.id.trim() ||
      entry.id.length > 100 ||
      ids.has(entry.id) ||
      answers.has(entry.answer) ||
      normalizeScanwordAnswer(entry.answer, alphabet) !== entry.answer ||
      normalizeScanwordClue(entry.clue) !== entry.clue ||
      !['across', 'down'].includes(entry.direction) ||
      !Number.isInteger(entry.clueIndex) ||
      entry.clueIndex < 0 ||
      entry.clueIndex >= cells.length ||
      cells[entry.clueIndex] !== null ||
      entry.path.length !== entry.answer.length
    )
      throw new ScanwordError('data');
    ids.add(entry.id);
    answers.add(entry.answer);
    const related = [...(anchors.get(entry.clueIndex) ?? []), entry];
    if (
      related.length > puzzle.maxCluesPerCell ||
      new Set(related.map((item) => item.direction)).size !== related.length
    )
      throw new ScanwordError('data');
    anchors.set(entry.clueIndex, related);
    const r0 = Math.floor(entry.clueIndex / columns),
      c0 = entry.clueIndex % columns;
    for (let i = 0; i < entry.path.length; i += 1) {
      const row = r0 + (entry.direction === 'down' ? i + 1 : 0);
      const col = c0 + (entry.direction === 'across' ? i + 1 : 0);
      const index = row * columns + col;
      if (
        row >= rows ||
        col >= columns ||
        entry.path[i] !== index ||
        cells[index] !== entry.answer[i] ||
        coverage[index]!.has(entry.direction)
      )
        throw new ScanwordError('data');
      coverage[index]!.add(entry.direction);
    }
    const end = entry.path.at(-1)!;
    const row =
      Math.floor(end / columns) + (entry.direction === 'down' ? 1 : 0);
    const col = (end % columns) + (entry.direction === 'across' ? 1 : 0);
    if (row < rows && col < columns && cells[row * columns + col] !== null)
      throw new ScanwordError('data');
  }
  const white = cells.flatMap((cell, index) => (cell === null ? [] : [index]));
  if (white.some((index) => coverage[index]!.size === 0))
    throw new ScanwordError('data');
  for (const direction of ['across', 'down'] as const) {
    const outer = direction === 'across' ? rows : columns,
      inner = direction === 'across' ? columns : rows;
    for (let a = 0; a < outer; a += 1) {
      let path: number[] = [];
      for (let b = 0; b <= inner; b += 1) {
        const index =
          direction === 'across' ? a * columns + b : b * columns + a;
        if (b < inner && cells[index] !== null) path.push(index);
        else {
          if (
            path.length >= 2 &&
            !entries.some(
              (entry) =>
                entry.direction === direction &&
                entry.path.length === path.length &&
                entry.path.every((value, i) => value === path[i]),
            )
          )
            throw new ScanwordError('data');
          path = [];
        }
      }
    }
  }
  const seen = new Set<number>([white[0]!]),
    queue = [white[0]!];
  for (let i = 0; i < queue.length; i += 1) {
    const index = queue[i]!,
      row = Math.floor(index / columns),
      col = index % columns;
    for (const [dr, dc] of [
      [0, 1],
      [1, 0],
      [0, -1],
      [-1, 0],
    ] as const) {
      const r = row + dr,
        c = col + dc,
        next = r * columns + c;
      if (
        r >= 0 &&
        r < rows &&
        c >= 0 &&
        c < columns &&
        cells[next] !== null &&
        !seen.has(next)
      ) {
        seen.add(next);
        queue.push(next);
      }
    }
  }
  if (seen.size !== white.length) throw new ScanwordError('disconnected');
  const givenIndices = new Set<number>();
  for (const given of puzzle.givens) {
    if (
      !Number.isInteger(given.index) ||
      given.index < 0 ||
      given.index >= cells.length ||
      cells[given.index] === null ||
      given.letter !== cells[given.index] ||
      givenIndices.has(given.index)
    )
      throw new ScanwordError('data');
    givenIndices.add(given.index);
  }
  return puzzle;
}
export function chooseScanwordGivens(
  cells: readonly (string | null)[],
  count: number,
  random: RandomSource = Math.random,
  previous: readonly ScanwordGiven[] = [],
): ScanwordGiven[] {
  const white = cells.flatMap((letter, index) =>
    letter === null ? [] : [index],
  );
  if (!Number.isInteger(count) || count < 0 || count > white.length)
    throw new ScanwordError('options', { max: white.length });
  const indices = previous.slice(0, count).map((given) => given.index);
  const extras =
    count > indices.length
      ? shuffle(
          white.filter((index) => !indices.includes(index)),
          random,
        )
      : [];
  return [...indices, ...extras.slice(0, count - indices.length)]
    .sort((a, b) => a - b)
    .map((index) => ({ index, letter: cells[index]! }));
}
export function reviseScanwordPuzzle(
  puzzle: ScanwordPuzzle,
  settings: ScanwordRevision,
  random: RandomSource = Math.random,
): ScanwordPuzzle {
  if (settings.alphabet !== puzzle.alphabet) throw new ScanwordError('options');
  const dictionary = normalizeScanwordDictionary(
    settings.dictionary,
    settings.alphabet,
  );
  const entries = puzzle.entries.map((entry) => {
    const match = dictionary.find((item) => item.answer === entry.answer);
    if (!match) throw new ScanwordError('dictionary', { word: entry.answer });
    return { ...entry, clue: match.clue, path: [...entry.path] };
  });
  return validateScanwordPuzzle({
    ...puzzle,
    id: settings.id,
    title: settings.title.trim(),
    entries,
    givens: chooseScanwordGivens(
      puzzle.cells,
      settings.givenCount,
      random,
      puzzle.givens,
    ),
  });
}
export function toScanwordPublicTask(
  puzzle: ScanwordPuzzle,
): ScanwordPublicTask {
  return {
    rows: puzzle.rows,
    columns: puzzle.columns,
    alphabet: puzzle.alphabet,
    letterIndices: puzzle.cells.flatMap((letter, index) =>
      letter === null ? [] : [index],
    ),
    entries: puzzle.entries.map((entry) => ({
      id: entry.id,
      clue: entry.clue,
      direction: entry.direction,
      clueIndex: entry.clueIndex,
      path: [...entry.path],
    })),
    givens: puzzle.givens.map((given) => ({ ...given })),
  };
}