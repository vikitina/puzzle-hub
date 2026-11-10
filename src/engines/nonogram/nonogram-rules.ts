import {
  createNonogramLinePatterns,
  getNonogramRuns,
  sameNonogramClues,
} from './nonogram-clues';
import type {
  NonogramMark,
  NonogramProgress,
  NonogramPuzzle,
} from './nonogram.types';
import { NonogramError } from './nonogram.types';

export type NonogramLineStatus = 'open' | 'complete' | 'conflict';
export function createNonogramProgress(
  puzzle: NonogramPuzzle,
): NonogramProgress {
  return {
    schemaVersion: 1,
    type: 'nonogram-progress',
    puzzleId: puzzle.id,
    cells: Array<NonogramMark>(puzzle.rows * puzzle.columns).fill(0),
  };
}
export class NonogramRules {
  private readonly puzzle: NonogramPuzzle;
  private readonly rowPatterns: number[][];
  private readonly columnPatterns: number[][];
  constructor(puzzle: NonogramPuzzle) {
    this.puzzle = puzzle;
    this.rowPatterns = puzzle.rowClues.map((clues) =>
      createNonogramLinePatterns(puzzle.columns, clues),
    );
    this.columnPatterns = puzzle.columnClues.map((clues) =>
      createNonogramLinePatterns(puzzle.rows, clues),
    );
  }
  inspect(cells: readonly NonogramMark[]) {
    if (
      cells.length !== this.puzzle.rows * this.puzzle.columns ||
      cells.some((cell) => cell !== -1 && cell !== 0 && cell !== 1)
    )
      throw new NonogramError('progress');
    const rows = Array.from({ length: this.puzzle.rows }, (_, row) =>
      cells.slice(row * this.puzzle.columns, (row + 1) * this.puzzle.columns),
    );
    const columns = Array.from({ length: this.puzzle.columns }, (_, column) =>
      Array.from(
        { length: this.puzzle.rows },
        (_, row) => cells[row * this.puzzle.columns + column]!,
      ),
    );
    const status = (
      line: readonly NonogramMark[],
      patterns: readonly number[],
      clues: readonly number[],
    ): NonogramLineStatus => {
      let filled = 0;
      let empty = 0;
      line.forEach((mark, index) => {
        if (mark === 1) filled |= 1 << index;
        else if (mark === -1) empty |= 1 << index;
      });
      if (
        !patterns.some(
          (pattern) => (pattern & filled) === filled && (pattern & empty) === 0,
        )
      )
        return 'conflict';
      return sameNonogramClues([getNonogramRuns(line)], [clues])
        ? 'complete'
        : 'open';
    };
    const rowStatus = rows.map((line, index) =>
      status(line, this.rowPatterns[index]!, this.puzzle.rowClues[index]!),
    );
    const columnStatus = columns.map((line, index) =>
      status(
        line,
        this.columnPatterns[index]!,
        this.puzzle.columnClues[index]!,
      ),
    );
    const mistakes = cells.flatMap((mark, index) =>
      (mark === 1 && this.puzzle.solution[index] === 0) ||
      (mark === -1 && this.puzzle.solution[index] === 1)
        ? [index]
        : [],
    );
    return {
      rowStatus,
      columnStatus,
      mistakes,
      solved:
        rowStatus.every((value) => value === 'complete') &&
        columnStatus.every((value) => value === 'complete'),
    };
  }
}