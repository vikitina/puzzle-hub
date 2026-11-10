import type {
  ScanwordErrorCode,
  ScanwordGenerationOptions,
  ScanwordPuzzle,
  ScanwordRevision,
} from '../../engines/scanword/scanword.types';
export type ScanwordWorkerRequest =
  | { type: 'generate'; options: ScanwordGenerationOptions }
  | { type: 'validate'; puzzle: ScanwordPuzzle }
  | { type: 'revise'; puzzle: ScanwordPuzzle; settings: ScanwordRevision };
export type ScanwordWorkerResponse =
  | { type: 'success'; puzzle: ScanwordPuzzle }
  | {
      type: 'error';
      code: ScanwordErrorCode;
      values: Readonly<Record<string, string | number>>;
    };