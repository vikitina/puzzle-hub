import { useCallback, useEffect, useRef, useState } from 'react';
import { WorkerTaskError } from '../../browser/worker-task';
import type { BrowserWorkerTask } from '../../browser/worker-task';
import { NonogramError } from '../../engines/nonogram/nonogram.types';
import type { TranslationKey } from '../../i18n/types';
import { createNonogramTask } from './nonogram-task';
import type {
  NonogramWorkerRequest,
  NonogramWorkerResult,
} from './nonogram-worker.types';

export type NonogramOperation = 'boot' | 'manual' | 'import' | 'random';
export interface NonogramNotice {
  key: TranslationKey;
  danger?: boolean;
}
export function nonogramErrorNotice(error: unknown): NonogramNotice {
  if (error instanceof NonogramError)
    return { key: `nonogram.errors.${error.code}`, danger: true };
  return {
    key:
      error instanceof WorkerTaskError && error.code === 'timeout'
        ? 'nonogram.messages.timeout'
        : 'nonogram.messages.failed',
    danger: true,
  };
}
export function useNonogramWorker(
  onResult: (
    result: NonogramWorkerResult,
    operation: NonogramOperation,
  ) => void,
) {
  const taskRef = useRef<BrowserWorkerTask<NonogramWorkerResult> | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<NonogramNotice | null>(null);
  const cancel = useCallback(() => {
    const task = taskRef.current;
    if (!task) return;
    taskRef.current = null;
    task.cancel();
    setBusy(false);
    setNotice({ key: 'nonogram.messages.cancelled' });
  }, []);
  const run = useCallback(
    (request: NonogramWorkerRequest, operation: NonogramOperation) => {
      taskRef.current?.cancel();
      setBusy(true);
      setNotice(null);
      const task = createNonogramTask(request);
      taskRef.current = task;
      void task.promise.then(
        (result) => {
          if (taskRef.current !== task) return;
          taskRef.current = null;
          setBusy(false);
          setNotice({
            key: `nonogram.analysis.${result.analysis.status}`,
            danger: result.analysis.status !== 'unique',
          });
          onResult(result, operation);
        },
        (error: unknown) => {
          if (taskRef.current !== task) return;
          taskRef.current = null;
          setBusy(false);
          setNotice(nonogramErrorNotice(error));
        },
      );
    },
    [onResult],
  );
  useEffect(
    () => () => {
      const task = taskRef.current;
      taskRef.current = null;
      task?.cancel();
    },
    [],
  );
  return { busy, notice, run, cancel };
}