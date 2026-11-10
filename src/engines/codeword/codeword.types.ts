export type CodewordAlphabet = 'uk' | 'ru' | 'en';
export interface CodewordGiven {
  readonly code: number;
  readonly letter: string;
}
export interface CodewordPuzzle {
  readonly schemaVersion: 1;
  readonly type: 'codeword';
  readonly id: string;
  readonly title: string;
  readonly rows: number;
  readonly columns: number;
  readonly alphabet: CodewordAlphabet;
  readonly cells: readonly (number | null)[];
  readonly key: readonly string[];
  readonly givens: readonly CodewordGiven[];
  readonly words: readonly string[];
  readonly dictionary: readonly string[];
  readonly showWordBank: boolean;
  readonly requireAllLetters: boolean;
}
export interface CodewordSettings {
  readonly id: string;
  readonly title: string;
  readonly rows: number;
  readonly columns: number;
  readonly alphabet: CodewordAlphabet;
  readonly givenCount: number;
  readonly revealedLetters: readonly string[];
  readonly dictionary: readonly string[];
  readonly showWordBank: boolean;
  readonly requireAllLetters: boolean;
}
export interface CodewordGenerationOptions extends CodewordSettings {
  readonly words: readonly string[];
}
export interface CodewordPublicTask {
  readonly rows: number;
  readonly columns: number;
  readonly alphabet: CodewordAlphabet;
  readonly cells: readonly (number | null)[];
  readonly givens: readonly CodewordGiven[];
  readonly letters: readonly string[];
  readonly wordBank?: readonly string[];
}
export interface CodewordProgress {
  readonly schemaVersion: 1;
  readonly type: 'codeword-progress';
  readonly puzzleId: string;
  readonly assignments: readonly (string | null)[];
}
export interface CodewordSlot {
  readonly direction: 'across' | 'down';
  readonly path: readonly number[];
}
export type CodewordAnalysisStatus =
  'unique' | 'multiple' | 'none' | 'limit' | 'not-checked';
export interface CodewordAnalysis {
  readonly status: CodewordAnalysisStatus;
  readonly scope: 'word-bank' | 'dictionary' | 'none';
  readonly wordCount: number;
  readonly nodes: number;
}
export type CodewordErrorCode =
  | 'dimensions'
  | 'title'
  | 'alphabet'
  | 'words'
  | 'letters'
  | 'duplicates'
  | 'disconnected'
  | 'placement'
  | 'grid'
  | 'coverage'
  | 'givens'
  | 'dictionary'
  | 'dictionary-missing'
  | 'data'
  | 'version'
  | 'progress';
export class CodewordError extends Error {
  readonly code: CodewordErrorCode;
  readonly values: Readonly<Record<string, string | number>>;
  constructor(
    code: CodewordErrorCode,
    values: Readonly<Record<string, string | number>> = {},
  ) {
    super(code);
    this.name = 'CodewordError';
    this.code = code;
    this.values = values;
  }
}