import { FillwordGenerator } from '../../engines/fillword/fillword-generator';
import { FillwordError } from '../../engines/fillword/fillword.types';
import type {
  FillwordWorkerRequest,
  FillwordWorkerResponse,
} from './fillword-worker.types';
interface Scope {
  onmessage: ((event: MessageEvent<FillwordWorkerRequest>) => void) | null;
  postMessage: (message: FillwordWorkerResponse) => void;
}
const scope = self as unknown as Scope;
scope.onmessage = (event) => {
  try {
    scope.postMessage({
      type: 'success',
      puzzle: new FillwordGenerator().generate(event.data.options),
    });
  } catch (error) {
    scope.postMessage({
      type: 'error',
      code: error instanceof FillwordError ? error.code : 'data',
      values: error instanceof FillwordError ? error.values : {},
    });
  }
};