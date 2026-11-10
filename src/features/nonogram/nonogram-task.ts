import { createBrowserWorkerTask } from '../../browser/worker-task';
import type { BrowserWorkerPort } from '../../browser/worker-task';
import { NonogramError } from '../../engines/nonogram/nonogram.types';
import type {
  NonogramWorkerRequest,
  NonogramWorkerResponse,
} from './nonogram-worker.types';
function createWorker(): BrowserWorkerPort<
  NonogramWorkerRequest,
  NonogramWorkerResponse
> {
  return new Worker(new URL('./nonogram.worker.ts', import.meta.url), {
    type: 'module',
  });
}
export function createNonogramTask(
  request: NonogramWorkerRequest,
  factory = createWorker,
  timeoutMs = 20_000,
) {
  return createBrowserWorkerTask(
    request,
    factory,
    (response) => {
      if (response.type === 'error') throw new NonogramError(response.code);
      return response.result;
    },
    timeoutMs,
  );
}