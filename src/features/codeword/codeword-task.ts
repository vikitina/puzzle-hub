import { createBrowserWorkerTask } from '../../browser/worker-task';
import type { BrowserWorkerPort } from '../../browser/worker-task';
import { CodewordError } from '../../engines/codeword/codeword.types';
import type {
  CodewordWorkerRequest,
  CodewordWorkerResponse,
} from './codeword-worker.types';
function factory(): BrowserWorkerPort<
  CodewordWorkerRequest,
  CodewordWorkerResponse
> {
  return new Worker(new URL('./codeword.worker.ts', import.meta.url), {
    type: 'module',
  });
}
export function createCodewordTask(request: CodewordWorkerRequest) {
  return createBrowserWorkerTask(request, factory, (response) => {
    if (response.type === 'error')
      throw new CodewordError(response.code, response.values);
    return response.result;
  });
}