import type {
  SudokuGenerationOptions,
  SudokuGenerationResult,
} from '../../engines/sudoku/sudoku.types';
import type {
  SudokuWorkerRequest,
  SudokuWorkerResponse,
} from './sudoku-worker.types';

export type SudokuGenerationErrorCode = 'cancelled' | 'timeout' | 'failed';
export class SudokuGenerationError extends Error {
  readonly code: SudokuGenerationErrorCode;
  constructor(code: SudokuGenerationErrorCode) {
    super(code);
    this.name = 'SudokuGenerationError';
    this.code = code;
  }
}

export interface SudokuWorkerPort {
  onmessage: ((event: MessageEvent<SudokuWorkerResponse>) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
  onmessageerror: ((event: MessageEvent) => void) | null;
  postMessage: (message: SudokuWorkerRequest) => void;
  terminate: () => void;
}

export interface SudokuGenerationTask {
  promise: Promise<SudokuGenerationResult>;
  cancel: () => void;
}

function createWorker(): SudokuWorkerPort {
  return new Worker(new URL('./sudoku-generator.worker.ts', import.meta.url), {
    type: 'module',
  });
}

export function createSudokuGenerationTask(
  options: SudokuGenerationOptions,
  workerFactory: () => SudokuWorkerPort = createWorker,
  timeoutMs = 20_000,
): SudokuGenerationTask {
  let cancel: () => void = () => {};
  const promise = new Promise<SudokuGenerationResult>((resolve, reject) => {
    let worker: SudokuWorkerPort | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let settled = false;

    const finish = (complete: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (worker) {
        worker.onmessage = null;
        worker.onerror = null;
        worker.onmessageerror = null;
        worker.terminate();
      }
      complete();
    };

    const fail = (code: SudokuGenerationErrorCode) =>
      finish(() => reject(new SudokuGenerationError(code)));
    cancel = () => fail('cancelled');

    try {
      worker = workerFactory();
      worker.onmessage = (event) => {
        if (event.data.type === 'success') {
          const result = event.data.result;
          finish(() => resolve(result));
        } else fail('failed');
      };
      worker.onerror = (event) => {
        event.preventDefault();
        fail('failed');
      };
      worker.onmessageerror = () => fail('failed');
      timer = setTimeout(() => fail('timeout'), timeoutMs);
      worker.postMessage({ type: 'generate', options });
    } catch {
      fail('failed');
    }
  });
  return { promise, cancel: () => cancel() };
}