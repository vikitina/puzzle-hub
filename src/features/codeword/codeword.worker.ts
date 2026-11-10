import {
  CodewordGenerator,
  createCodewordPuzzle,
  reviseCodewordPuzzle,
} from '../../engines/codeword/codeword-puzzle';
import { readCodewordPuzzle } from '../../engines/codeword/codeword-json';
import { analyzeCodewordPuzzle } from '../../engines/codeword/codeword-solver';
import { CodewordError } from '../../engines/codeword/codeword.types';
import type {
  CodewordWorkerRequest,
  CodewordWorkerResponse,
} from './codeword-worker.types';
interface Scope {
  onmessage: ((event: MessageEvent<CodewordWorkerRequest>) => void) | null;
  postMessage: (response: CodewordWorkerResponse) => void;
}
const scope = self as unknown as Scope;
scope.onmessage = ({ data }) => {
  try {
    const puzzle =
      data.type === 'generate'
        ? new CodewordGenerator().generate(data.options)
        : data.type === 'encode'
          ? createCodewordPuzzle(data.settings, data.letters)
          : data.type === 'revise'
            ? reviseCodewordPuzzle(
                readCodewordPuzzle(data.puzzle),
                data.settings,
              )
            : readCodewordPuzzle(data.puzzle);
    scope.postMessage({
      type: 'success',
      result: { puzzle, analysis: analyzeCodewordPuzzle(puzzle) },
    });
  } catch (error) {
    scope.postMessage({
      type: 'error',
      code: error instanceof CodewordError ? error.code : 'data',
      values: error instanceof CodewordError ? error.values : {},
    });
  }
};