import { SCANWORD_ALPHABETS } from './scanword-input';
import { validateScanwordPuzzle } from './scanword-puzzle';
import type { ScanwordProgress, ScanwordPuzzle } from './scanword.types';
import { ScanwordError } from './scanword.types';
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new ScanwordError('data');
  return value as Record<string, unknown>;
}
function parse(source: string): unknown {
  if (source.length > 1_000_000) throw new ScanwordError('data');
  try {
    return JSON.parse(source) as unknown;
  } catch {
    throw new ScanwordError('data');
  }
}
export function readScanwordPuzzle(value: unknown): ScanwordPuzzle {
  const data = record(value);
  if (data.schemaVersion !== 1) throw new ScanwordError('version');
  if (
    data.type !== 'scanword' ||
    typeof data.id !== 'string' ||
    typeof data.title !== 'string' ||
    typeof data.rows !== 'number' ||
    typeof data.columns !== 'number' ||
    typeof data.alphabet !== 'string' ||
    !Array.isArray(data.cells) ||
    data.cells.length > 400 ||
    !Array.isArray(data.entries) ||
    data.entries.length > 40 ||
    !Array.isArray(data.givens) ||
    data.givens.length > 400
  )
    throw new ScanwordError('data');
  for (const value of data.entries) {
    const entry = record(value);
    if (
      typeof entry.id !== 'string' ||
      typeof entry.answer !== 'string' ||
      typeof entry.clue !== 'string' ||
      typeof entry.direction !== 'string' ||
      typeof entry.clueIndex !== 'number' ||
      !Array.isArray(entry.path) ||
      entry.path.length > 20 ||
      Array.from(entry.path).some((index) => !Number.isInteger(index))
    )
      throw new ScanwordError('data');
  }
  for (const value of data.givens) {
    const given = record(value);
    if (typeof given.index !== 'number' || typeof given.letter !== 'string')
      throw new ScanwordError('data');
  }
  const puzzle = data as unknown as ScanwordPuzzle;
  validateScanwordPuzzle(puzzle);
  return {
    schemaVersion: 1,
    type: 'scanword',
    id: puzzle.id,
    title: puzzle.title,
    rows: puzzle.rows,
    columns: puzzle.columns,
    alphabet: puzzle.alphabet,
    maxCluesPerCell: puzzle.maxCluesPerCell,
    cells: [...puzzle.cells],
    entries: puzzle.entries.map((entry) => ({
      id: entry.id,
      answer: entry.answer,
      clue: entry.clue,
      direction: entry.direction,
      clueIndex: entry.clueIndex,
      path: [...entry.path],
    })),
    givens: puzzle.givens.map((given) => ({
      index: given.index,
      letter: given.letter,
    })),
  };
}
export function parseScanwordPuzzleJSON(source: string): ScanwordPuzzle {
  return readScanwordPuzzle(parse(source));
}
export function readScanwordProgress(
  value: unknown,
  puzzle: ScanwordPuzzle,
): ScanwordProgress {
  const data = record(value);
  if (
    data.schemaVersion !== 1 ||
    data.type !== 'scanword-progress' ||
    data.puzzleId !== puzzle.id ||
    !Array.isArray(data.cells) ||
    data.cells.length !== puzzle.cells.length ||
    Array.from(data.cells).some(
      (letter, index) =>
        letter !== null &&
        (typeof letter !== 'string' ||
          letter.length !== 1 ||
          !SCANWORD_ALPHABETS[puzzle.alphabet].letters.includes(letter) ||
          puzzle.cells[index] === null ||
          puzzle.givens.some((given) => given.index === index)),
    )
  )
    throw new ScanwordError('progress');
  return {
    schemaVersion: 1,
    type: 'scanword-progress',
    puzzleId: puzzle.id,
    cells: [...data.cells] as (string | null)[],
  };
}
export function parseScanwordProgressJSON(
  source: string,
  puzzle: ScanwordPuzzle,
): ScanwordProgress {
  return readScanwordProgress(parse(source), puzzle);
}