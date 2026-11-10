import { useCallback, useEffect, useRef, useState } from 'react';
import { WorkerTaskError } from '../../browser/worker-task';
import type { BrowserWorkerTask } from '../../browser/worker-task';
import { CodewordError } from '../../engines/codeword/codeword.types';
import type { TranslationKey } from '../../i18n/types';
import { createCodewordTask } from './codeword-task';
import type {
  CodewordWorkerRequest,
  CodewordWorkerResult,
} from './codeword-worker.types';
export interface CodewordNotice {
  key: TranslationKey;
  values?: Readonly<Record<string, string | number>>;
  danger?: boolean;
}
export function codewordErrorNotice(error: unknown): CodewordNotice {
  if (error instanceof CodewordError)
    return {
      key: `codeword.errors.${error.code}`,
      values: error.values,
      danger: true,
    };
  return {
    key:
      error instanceof WorkerTaskError && error.code === 'timeout'
        ? 'codeword.messages.timeout'
        : 'codeword.messages.failed',
    danger: true,
  };
}
export function useCodewordWorker(
  onResult: (result: CodewordWorkerResult) => void,
) {
  const taskRef = useRef<BrowserWorkerTask<CodewordWorkerResult> | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<CodewordNotice | null>(null);
  const cancel = useCallback(() => {
    const task = taskRef.current;
    if (!task) return;
    taskRef.current = null;
    task.cancel();
    setBusy(false);
    setNotice({ key: 'codeword.messages.cancelled' });
  }, []);
  const run = useCallback(
    (request: CodewordWorkerRequest) => {
      taskRef.current?.cancel();
      setBusy(true);
      setNotice(null);
      const task = createCodewordTask(request);
      taskRef.current = task;
      void task.promise.then(
        (result) => {
          if (taskRef.current !== task) return;
          taskRef.current = null;
          setBusy(false);
          setNotice(null);
          onResult(result);
        },
        (error: unknown) => {
          if (taskRef.current !== task) return;
          taskRef.current = null;
          setBusy(false);
          setNotice(codewordErrorNotice(error));
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