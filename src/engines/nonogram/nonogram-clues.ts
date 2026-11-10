import type {
  NonogramClues,
  NonogramPixel,
  NonogramPuzzle,
} from './nonogram.types';
import { NonogramError } from './nonogram.types';

export const NONOGRAM_LIMITS = { minSide: 2, maxSide: 20 } as const;
export function validateNonogramSize(rows: number, columns: number): void {
  if (
    !Number.isInteger(rows) ||
    !Number.isInteger(columns) ||
    rows < 2 ||
    columns < 2 ||
    rows > 20 ||
    columns > 20
  )
    throw new NonogramError('dimensions');
}
export function validateNonogramBitmap(
  rows: number,
  columns: number,
  solution: readonly NonogramPixel[],
): void {
  validateNonogramSize(rows, columns);
  if (
    solution.length !== rows * columns ||
    Array.from(solution).some((value) => value !== 0 && value !== 1)
  )
    throw new NonogramError('data');
}
export function getNonogramRuns(line: readonly number[]): number[] {
  const runs: number[] = [];
  let count = 0;
  for (const pixel of line) {
    if (pixel === 1) count += 1;
    else if (count) {
      runs.push(count);
      count = 0;
    }
  }
  if (count) runs.push(count);
  return runs;
}
export function sameNonogramClues(
  left: NonogramClues,
  right: NonogramClues,
): boolean {
  return (
    left.length === right.length &&
    left.every(
      (line, i) =>
        line.length === right[i]!.length &&
        line.every((value, j) => value === right[i]![j]),
    )
  );
}
export function createNonogramPuzzle(
  id: string,
  title: string,
  rows: number,
  columns: number,
  solution: readonly NonogramPixel[],
): NonogramPuzzle {
  validateNonogramBitmap(rows, columns, solution);
  if (!id.trim() || id.length > 100) throw new NonogramError('data');
  if (!title.trim() || title.length > 120) throw new NonogramError('title');
  const rowClues = Array.from({ length: rows }, (_, row) =>
    getNonogramRuns(solution.slice(row * columns, (row + 1) * columns)),
  );
  const columnClues = Array.from({ length: columns }, (_, column) =>
    getNonogramRuns(
      Array.from(
        { length: rows },
        (_, row) => solution[row * columns + column]!,
      ),
    ),
  );
  return {
    schemaVersion: 1,
    type: 'nonogram',
    id,
    title: title.trim(),
    rows,
    columns,
    rowClues,
    columnClues,
    solution: [...solution],
  };
}

export function createNonogramLinePatterns(
  length: number,
  clues: readonly number[],
): number[] {
  if (
    !Number.isInteger(length) ||
    length < 1 ||
    length > 20 ||
    clues.some((run) => !Number.isInteger(run) || run < 1 || run > length)
  )
    throw new NonogramError('data');
  if (clues.length === 0) return [0];
  const result: number[] = [];
  const minimum = clues.map(
    (_, i) =>
      clues.slice(i).reduce((sum, run) => sum + run, 0) + clues.length - i - 1,
  );
  const visit = (index: number, start: number, mask: number) => {
    if (index === clues.length) {
      result.push(mask);
      return;
    }
    const run = clues[index]!;
    for (
      let position = start;
      position <= length - minimum[index]!;
      position += 1
    ) {
      visit(
        index + 1,
        position + run + 1,
        mask | (((1 << run) - 1) << position),
      );
    }
  };
  visit(0, 0, 0);
  return result;
}