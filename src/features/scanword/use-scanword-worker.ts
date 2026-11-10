import { useCallback, useEffect, useRef, useState } from 'react';
import { WorkerTaskError } from '../../browser/worker-task';
import type { BrowserWorkerTask } from '../../browser/worker-task';
import { ScanwordError } from '../../engines/scanword/scanword.types';
import type { TranslationKey } from '../../i18n/types';
import { createScanwordTask } from './scanword-task';
import type { ScanwordWorkerRequest } from './scanword-worker.types';
import type { ScanwordPuzzle } from '../../engines/scanword/scanword.types';
export interface ScanwordNotice {
  key: TranslationKey;
  values?: Readonly<Record<string, string | number>>;
  danger?: boolean;
}
export function scanwordErrorNotice(error: unknown): ScanwordNotice {
  if (error instanceof ScanwordError)
    return {
      key: `scanword.errors.${error.code}`,
      values: error.values,
      danger: true,
    };
  return {
    key:
      error instanceof WorkerTaskError && error.code === 'timeout'
        ? 'scanword.messages.timeout'
        : 'scanword.messages.failed',
    danger: true,
  };
}
export function useScanwordWorker(
  onResult: (result: ScanwordPuzzle, request: ScanwordWorkerRequest) => void,
) {
  const taskRef = useRef<BrowserWorkerTask<ScanwordPuzzle> | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<ScanwordNotice | null>(null);
  const cancel = useCallback(() => {
    const task = taskRef.current;
    if (!task) return;
    taskRef.current = null;
    task.cancel();
    setBusy(false);
    setNotice({ key: 'scanword.messages.cancelled' });
  }, []);
  const run = useCallback(
    (request: ScanwordWorkerRequest) => {
      taskRef.current?.cancel();
      setBusy(true);
      setNotice(null);
      const task = createScanwordTask(request);
      taskRef.current = task;
      void task.promise.then(
        (result) => {
          if (taskRef.current !== task) return;
          taskRef.current = null;
          setBusy(false);
          setNotice(null);
          onResult(result, request);
        },
        (error: unknown) => {
          if (taskRef.current !== task) return;
          taskRef.current = null;
          setBusy(false);
          setNotice(scanwordErrorNotice(error));
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