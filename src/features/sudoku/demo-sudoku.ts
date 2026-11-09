import type { SudokuPuzzle } from '../../engines/sudoku/sudoku.types';

export const demoSudoku: SudokuPuzzle = {
  size: 4,
  initialBoard: [1, null, null, 4, null, 4, 1, null, 2, null, 4, null, null, 3, null, 1],
  solution: [1, 2, 3, 4, 3, 4, 1, 2, 2, 1, 4, 3, 4, 3, 2, 1],
};