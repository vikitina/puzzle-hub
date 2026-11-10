export type ScanwordAlphabet = 'uk' | 'en' | 'ru';
export type ScanwordDirection = 'across' | 'down';
export interface ScanwordDictionaryEntry {
  readonly answer: string;
  readonly clue: string;
}
export interface ScanwordEntry extends ScanwordDictionaryEntry {
  readonly id: string;
  readonly direction: ScanwordDirection;
  readonly clueIndex: number;
  readonly path: readonly number[];
}
export interface ScanwordGiven {
  readonly index: number;
  readonly letter: string;
}
export interface ScanwordPuzzle {
  readonly schemaVersion: 1;
  readonly type: 'scanword';
  readonly id: string;
  readonly title: string;
  readonly rows: number;
  readonly columns: number;
  readonly alphabet: ScanwordAlphabet;
  readonly maxCluesPerCell: 1 | 2;
  readonly cells: readonly (string | null)[];
  readonly entries: readonly ScanwordEntry[];
  readonly givens: readonly ScanwordGiven[];
}
export interface ScanwordGenerationOptions {
  readonly id: string;
  readonly title: string;
  readonly rows: number;
  readonly columns: number;
  readonly alphabet: ScanwordAlphabet;
  readonly dictionary: readonly ScanwordDictionaryEntry[];
  readonly useAll: boolean;
  readonly wordCount: number;
  readonly maxCluesPerCell: 1 | 2;
  readonly givenCount: number;
}
export interface ScanwordRevision {
  readonly id: string;
  readonly title: string;
  readonly alphabet: ScanwordAlphabet;
  readonly dictionary: readonly ScanwordDictionaryEntry[];
  readonly givenCount: number;
}
export interface ScanwordProgress {
  readonly schemaVersion: 1;
  readonly type: 'scanword-progress';
  readonly puzzleId: string;
  readonly cells: readonly (string | null)[];
}
export interface ScanwordPublicTask {
  readonly rows: number;
  readonly columns: number;
  readonly alphabet: ScanwordAlphabet;
  readonly letterIndices: readonly number[];
  readonly entries: readonly Omit<ScanwordEntry, 'answer'>[];
  readonly givens: readonly ScanwordGiven[];
}
export type ScanwordErrorCode =
  | 'dimensions'
  | 'dictionary'
  | 'line'
  | 'word'
  | 'clue'
  | 'duplicate'
  | 'options'
  | 'disconnected'
  | 'placement'
  | 'data'
  | 'version'
  | 'progress';
export class ScanwordError extends Error {
  readonly code: ScanwordErrorCode;
  readonly values: Readonly<Record<string, string | number>>;
  constructor(
    code: ScanwordErrorCode,
    values: Readonly<Record<string, string | number>> = {},
  ) {
    super(code);
    this.name = 'ScanwordError';
    this.code = code;
    this.values = values;
  }
}