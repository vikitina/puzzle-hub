import { SudokuGenerator } from '../../engines/sudoku/sudoku-generator';
import type {
  SudokuWorkerRequest,
  SudokuWorkerResponse,
} from './sudoku-worker.types';

interface SudokuWorkerScope {
  onmessage: ((event: MessageEvent<SudokuWorkerRequest>) => void) | null;
  postMessage: (message: SudokuWorkerResponse) => void;
}

const scope = self as unknown as SudokuWorkerScope;
scope.onmessage = (event) => {
  try {
    const result = new SudokuGenerator().generate(event.data.options);
    scope.postMessage({ type: 'success', result });
  } catch {
    scope.postMessage({ type: 'error' });
  }
};