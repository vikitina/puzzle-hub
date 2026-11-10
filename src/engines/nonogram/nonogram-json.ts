import { createNonogramPuzzle, sameNonogramClues } from './nonogram-clues';
import type {
  NonogramClues,
  NonogramMark,
  NonogramPixel,
  NonogramProgress,
  NonogramPuzzle,
} from './nonogram.types';
import { NonogramError } from './nonogram.types';

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new NonogramError('data');
  return value as Record<string, unknown>;
}
function text(value: unknown, max: number): string {
  if (typeof value !== 'string' || !value.trim() || value.length > max)
    throw new NonogramError('data');
  return value;
}
function clues(value: unknown): NonogramClues {
  if (
    !Array.isArray(value) ||
    value.length > 20 ||
    value.some(
      (line) =>
        !Array.isArray(line) ||
        line.length > 20 ||
        line.some((run) => !Number.isInteger(run) || run < 1 || run > 20),
    )
  )
    throw new NonogramError('data');
  return value as number[][];
}
function parse(source: string): unknown {
  if (source.length > 1_000_000) throw new NonogramError('data');
  try {
    return JSON.parse(source) as unknown;
  } catch {
    throw new NonogramError('data');
  }
}
export function readNonogramPuzzle(value: unknown): NonogramPuzzle {
  const data = record(value);
  if (data.schemaVersion !== 1) throw new NonogramError('version');
  if (
    data.type !== 'nonogram' ||
    typeof data.rows !== 'number' ||
    typeof data.columns !== 'number' ||
    !Array.isArray(data.solution)
  )
    throw new NonogramError('data');
  const puzzle = createNonogramPuzzle(
    text(data.id, 100),
    text(data.title, 120),
    data.rows,
    data.columns,
    data.solution as NonogramPixel[],
  );
  if (
    !sameNonogramClues(puzzle.rowClues, clues(data.rowClues)) ||
    !sameNonogramClues(puzzle.columnClues, clues(data.columnClues))
  )
    throw new NonogramError('data');
  return puzzle;
}
export function parseNonogramPuzzleJSON(source: string): NonogramPuzzle {
  return readNonogramPuzzle(parse(source));
}
export function readNonogramProgress(
  value: unknown,
  puzzle: NonogramPuzzle,
): NonogramProgress {
  const data = record(value);
  if (
    data.schemaVersion !== 1 ||
    data.type !== 'nonogram-progress' ||
    data.puzzleId !== puzzle.id ||
    !Array.isArray(data.cells) ||
    data.cells.length !== puzzle.rows * puzzle.columns ||
    Array.from(data.cells).some(
      (mark) => mark !== -1 && mark !== 0 && mark !== 1,
    )
  )
    throw new NonogramError('progress');
  return {
    schemaVersion: 1,
    type: 'nonogram-progress',
    puzzleId: puzzle.id,
    cells: [...data.cells] as NonogramMark[],
  };
}
export function parseNonogramProgressJSON(
  source: string,
  puzzle: NonogramPuzzle,
): NonogramProgress {
  return readNonogramProgress(parse(source), puzzle);
}