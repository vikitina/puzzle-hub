export type NonogramPixel = 0 | 1;
export type NonogramMark = -1 | 0 | 1;
export type NonogramClues = readonly (readonly number[])[];

export interface NonogramPuzzle {
  readonly schemaVersion: 1;
  readonly type: 'nonogram';
  readonly id: string;
  readonly title: string;
  readonly rows: number;
  readonly columns: number;
  readonly rowClues: NonogramClues;
  readonly columnClues: NonogramClues;
  readonly solution: readonly NonogramPixel[];
}
export interface NonogramProgress {
  readonly schemaVersion: 1;
  readonly type: 'nonogram-progress';
  readonly puzzleId: string;
  readonly cells: readonly NonogramMark[];
}
export type NonogramErrorCode =
  | 'dimensions'
  | 'title'
  | 'data'
  | 'version'
  | 'progress'
  | 'density'
  | 'generation';
export class NonogramError extends Error {
  readonly code: NonogramErrorCode;
  constructor(code: NonogramErrorCode) {
    super(code);
    this.name = 'NonogramError';
    this.code = code;
  }
}
export type NonogramAnalysis =
  | {
      readonly status: 'unique';
      readonly solution: readonly NonogramPixel[];
      readonly nodes: number;
    }
  | {
      readonly status: 'multiple';
      readonly solution: readonly NonogramPixel[];
      readonly nodes: number;
    }
  | { readonly status: 'none' | 'limit'; readonly nodes: number };
export interface NonogramSolveLimits {
  readonly maxNodes?: number;
  readonly maxWork?: number;
}
export interface NonogramGenerationOptions {
  readonly id: string;
  readonly title: string;
  readonly rows: number;
  readonly columns: number;
  readonly density: number;
  readonly symmetric: boolean;
}
export interface NonogramGenerated {
  readonly puzzle: NonogramPuzzle;
  readonly analysis: Extract<NonogramAnalysis, { status: 'unique' }>;
}