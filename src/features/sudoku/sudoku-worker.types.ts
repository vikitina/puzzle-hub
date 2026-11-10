import type {
  SudokuGenerationOptions,
  SudokuGenerationResult,
} from '../../engines/sudoku/sudoku.types';

export interface SudokuWorkerRequest {
  type: 'generate';
  options: SudokuGenerationOptions;
}
export type SudokuWorkerResponse =
  { type: 'success'; result: SudokuGenerationResult } | { type: 'error' };