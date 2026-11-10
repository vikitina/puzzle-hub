import { ScanwordGenerator } from '../../engines/scanword/scanword-generator';
import { readScanwordPuzzle } from '../../engines/scanword/scanword-json';
import { reviseScanwordPuzzle } from '../../engines/scanword/scanword-puzzle';
import { ScanwordError } from '../../engines/scanword/scanword.types';
import type {
  ScanwordWorkerRequest,
  ScanwordWorkerResponse,
} from './scanword-worker.types';
interface Scope {
  onmessage: ((event: MessageEvent<ScanwordWorkerRequest>) => void) | null;
  postMessage: (message: ScanwordWorkerResponse) => void;
}
const scope = self as unknown as Scope;
scope.onmessage = ({ data }) => {
  try {
    const puzzle =
      data.type === 'generate'
        ? new ScanwordGenerator().generate(data.options)
        : data.type === 'revise'
          ? reviseScanwordPuzzle(readScanwordPuzzle(data.puzzle), data.settings)
          : readScanwordPuzzle(data.puzzle);
    scope.postMessage({ type: 'success', puzzle });
  } catch (error) {
    scope.postMessage({
      type: 'error',
      code: error instanceof ScanwordError ? error.code : 'data',
      values: error instanceof ScanwordError ? error.values : {},
    });
  }
};