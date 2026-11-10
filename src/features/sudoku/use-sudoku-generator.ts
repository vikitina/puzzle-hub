import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  SudokuGenerationOptions,
  SudokuGenerationResult,
} from '../../engines/sudoku/sudoku.types';
import {
  createSudokuGenerationTask,
  SudokuGenerationError,
} from './sudoku-generation-task';
import type { SudokuGenerationTask } from './sudoku-generation-task';

export type SudokuGenerationState =
  | { status: 'idle' }
  | { status: 'running' }
  | { status: 'cancelled' }
  | { status: 'error'; reason: 'timeout' | 'failed' };

export function useSudokuGenerator(
  onSuccess: (result: SudokuGenerationResult) => void,
) {
  const taskRef = useRef<SudokuGenerationTask | null>(null);
  const [state, setState] = useState<SudokuGenerationState>({ status: 'idle' });

  const cancel = useCallback(() => {
    const task = taskRef.current;
    if (!task) return;
    taskRef.current = null;
    task.cancel();
    setState({ status: 'cancelled' });
  }, []);

  const generate = useCallback(
    (options: SudokuGenerationOptions) => {
      const previous = taskRef.current;
      taskRef.current = null;
      previous?.cancel();
      setState({ status: 'running' });
      const task = createSudokuGenerationTask(options);
      taskRef.current = task;

      void task.promise.then(
        (result) => {
          if (taskRef.current !== task) return;
          taskRef.current = null;
          setState({ status: 'idle' });
          onSuccess(result);
        },
        (error: unknown) => {
          if (taskRef.current !== task) return;
          taskRef.current = null;
          if (
            error instanceof SudokuGenerationError &&
            error.code === 'cancelled'
          ) {
            setState({ status: 'cancelled' });
          } else {
            setState({
              status: 'error',
              reason:
                error instanceof SudokuGenerationError &&
                error.code === 'timeout'
                  ? 'timeout'
                  : 'failed',
            });
          }
        },
      );
    },
    [onSuccess],
  );

  useEffect(
    () => () => {
      const task = taskRef.current;
      taskRef.current = null;
      task?.cancel();
    },
    [],
  );

  return { state, isGenerating: state.status === 'running', generate, cancel };
}