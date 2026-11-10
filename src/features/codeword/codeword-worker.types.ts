import type {
  CodewordAnalysis,
  CodewordErrorCode,
  CodewordGenerationOptions,
  CodewordPuzzle,
  CodewordSettings,
} from '../../engines/codeword/codeword.types';
export type CodewordWorkerRequest =
  | { type: 'generate'; options: CodewordGenerationOptions }
  | {
      type: 'encode';
      settings: CodewordSettings;
      letters: readonly (string | null)[];
    }
  | { type: 'revise'; puzzle: CodewordPuzzle; settings: CodewordSettings }
  | { type: 'analyze'; puzzle: CodewordPuzzle };
export interface CodewordWorkerResult {
  puzzle: CodewordPuzzle;
  analysis: CodewordAnalysis;
}
export type CodewordWorkerResponse =
  | { type: 'success'; result: CodewordWorkerResult }
  | {
      type: 'error';
      code: CodewordErrorCode;
      values: Readonly<Record<string, string | number>>;
    };