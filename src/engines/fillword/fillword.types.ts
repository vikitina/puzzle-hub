export type FillwordAlphabet = 'uk' | 'ru' | 'en';
export type FillwordMode = 'snake' | 'straight';
export type FillwordDirections = 'right-down' | 'orthogonal' | 'eight';

export interface FillwordConfig {
  readonly rows: number;
  readonly columns: number;
  readonly alphabet: FillwordAlphabet;
  readonly mode: FillwordMode;
  readonly directions: FillwordDirections;
}

export interface FillwordWord {
  readonly id: string;
  readonly label: string;
  readonly text: string;
  readonly path: readonly number[];
}

export interface FillwordPuzzle {
  readonly schemaVersion: 1;
  readonly type: 'fillword';
  readonly id: string;
  readonly title: string;
  readonly config: FillwordConfig;
  readonly cells: readonly string[];
  readonly words: readonly FillwordWord[];
}

export interface FillwordGenerationOptions {
  readonly id: string;
  readonly title: string;
  readonly config: FillwordConfig;
  readonly words: readonly string[];
}

export interface FoundFillwordWord {
  readonly wordId: string;
  readonly path: readonly number[];
}

export interface FillwordProgress {
  readonly schemaVersion: 1;
  readonly type: 'fillword-progress';
  readonly puzzleId: string;
  readonly found: readonly FoundFillwordWord[];
}

export type FillwordErrorCode =
  | 'dimensions'
  | 'words'
  | 'letters'
  | 'duplicates'
  | 'full-coverage'
  | 'word-too-long'
  | 'placement'
  | 'data'
  | 'version'
  | 'progress'
  | 'selection'
  | 'unknown-word'
  | 'already-found'
  | 'used-cell';

export class FillwordError extends Error {
  readonly code: FillwordErrorCode;
  readonly values: Readonly<Record<string, string | number>>;

  constructor(
    code: FillwordErrorCode,
    values: Readonly<Record<string, string | number>> = {},
  ) {
    super(code);
    this.name = 'FillwordError';
    this.code = code;
    this.values = values;
  }
}