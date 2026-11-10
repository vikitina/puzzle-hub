import { NonogramGenerator } from '../../engines/nonogram/nonogram-generator';
import { readNonogramPuzzle } from '../../engines/nonogram/nonogram-json';
import { NonogramSolver } from '../../engines/nonogram/nonogram-solver';
import { NonogramError } from '../../engines/nonogram/nonogram.types';
import type {
  NonogramWorkerRequest,
  NonogramWorkerResponse,
} from './nonogram-worker.types';
interface Scope {
  onmessage: ((event: MessageEvent<NonogramWorkerRequest>) => void) | null;
  postMessage: (message: NonogramWorkerResponse) => void;
}
const scope = self as unknown as Scope;
scope.onmessage = ({ data }) => {
  try {
    if (data.type === 'generate')
      scope.postMessage({
        type: 'success',
        result: new NonogramGenerator().generate(data.options),
      });
    else {
      const puzzle = readNonogramPuzzle(data.puzzle);
      const analysis = new NonogramSolver().analyze(
        puzzle.rowClues,
        puzzle.columnClues,
      );
      scope.postMessage({ type: 'success', result: { puzzle, analysis } });
    }
  } catch (error) {
    scope.postMessage({
      type: 'error',
      code: error instanceof NonogramError ? error.code : 'data',
    });
  }
};