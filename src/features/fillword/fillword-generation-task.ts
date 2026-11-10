import { FillwordError } from '../../engines/fillword/fillword.types';
import type {
  FillwordGenerationOptions,
  FillwordPuzzle,
} from '../../engines/fillword/fillword.types';
import type {
  FillwordWorkerRequest,
  FillwordWorkerResponse,
} from './fillword-worker.types';

export class FillwordTaskError extends Error {
  readonly code: 'cancelled' | 'timeout' | 'failed';
  constructor(code: 'cancelled' | 'timeout' | 'failed') {
    super(code);
    this.code = code;
    this.name = 'FillwordTaskError';
  }
}
export interface FillwordWorkerPort {
  onmessage: ((event: MessageEvent<FillwordWorkerResponse>) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
  onmessageerror: ((event: MessageEvent) => void) | null;
  postMessage: (request: FillwordWorkerRequest) => void;
  terminate: () => void;
}
export interface FillwordGenerationTask {
  promise: Promise<FillwordPuzzle>;
  cancel: () => void;
}
function createWorker(): FillwordWorkerPort {
  return new Worker(
    new URL('./fillword-generator.worker.ts', import.meta.url),
    { type: 'module' },
  );
}
export function createFillwordGenerationTask(
  options: FillwordGenerationOptions,
  factory: () => FillwordWorkerPort = createWorker,
  timeoutMs = 20_000,
): FillwordGenerationTask {
  let cancel = () => {};
  const promise = new Promise<FillwordPuzzle>((resolve, reject) => {
    let worker: FillwordWorkerPort | null = null;
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
    const fail = (code: 'cancelled' | 'timeout' | 'failed') =>
      finish(() => reject(new FillwordTaskError(code)));
    cancel = () => fail('cancelled');
    try {
      worker = factory();
      worker.onmessage = ({ data }) => {
        if (data.type === 'success') finish(() => resolve(data.puzzle));
        else finish(() => reject(new FillwordError(data.code, data.values)));
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