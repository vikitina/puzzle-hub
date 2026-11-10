import type {
  FillwordErrorCode,
  FillwordGenerationOptions,
  FillwordPuzzle,
} from '../../engines/fillword/fillword.types';
export interface FillwordWorkerRequest {
  type: 'generate';
  options: FillwordGenerationOptions;
}
export type FillwordWorkerResponse =
  | { type: 'success'; puzzle: FillwordPuzzle }
  | {
      type: 'error';
      code: FillwordErrorCode;
      values: Readonly<Record<string, string | number>>;
    };