export type SudokuSize = 4 | 6 | 9;

export type SudokuCell = number | null;

export type SudokuBoard = readonly SudokuCell[];

export interface SudokuPuzzle {
  readonly size: SudokuSize;
  readonly initialBoard: SudokuBoard;
  readonly solution: SudokuBoard;
}

export interface SudokuGenerationOptions {
  readonly size: SudokuSize;
  readonly targetClues: number;
}

export interface SudokuGenerationResult {
  readonly puzzle: SudokuPuzzle;
  readonly targetClues: number;
  readonly actualClues: number;
  readonly targetReached: boolean;
}