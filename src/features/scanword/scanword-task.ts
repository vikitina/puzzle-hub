import { createBrowserWorkerTask } from '../../browser/worker-task';
import type { BrowserWorkerPort } from '../../browser/worker-task';
import { ScanwordError } from '../../engines/scanword/scanword.types';
import type {
  ScanwordWorkerRequest,
  ScanwordWorkerResponse,
} from './scanword-worker.types';
function factory(): BrowserWorkerPort<
  ScanwordWorkerRequest,
  ScanwordWorkerResponse
> {
  return new Worker(new URL('./scanword.worker.ts', import.meta.url), {
    type: 'module',
  });
}
export function createScanwordTask(request: ScanwordWorkerRequest) {
  return createBrowserWorkerTask(request, factory, (response) => {
    if (response.type === 'error')
      throw new ScanwordError(response.code, response.values);
    return response.puzzle;
  });
}