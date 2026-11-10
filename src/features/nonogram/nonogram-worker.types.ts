import type {
  NonogramAnalysis,
  NonogramErrorCode,
  NonogramGenerationOptions,
  NonogramPuzzle,
} from '../../engines/nonogram/nonogram.types';
export type NonogramWorkerRequest =
  | { type: 'analyze'; puzzle: NonogramPuzzle }
  | { type: 'generate'; options: NonogramGenerationOptions };
export interface NonogramWorkerResult {
  puzzle: NonogramPuzzle;
  analysis: NonogramAnalysis;
}
export type NonogramWorkerResponse =
  | { type: 'success'; result: NonogramWorkerResult }
  | { type: 'error'; code: NonogramErrorCode };