import { useCallback, useEffect, useRef, useState } from 'react';
import { FillwordError } from '../../engines/fillword/fillword.types';
import type {
  FillwordGenerationOptions,
  FillwordPuzzle,
} from '../../engines/fillword/fillword.types';
import type { TranslationKey } from '../../i18n/types';
import {
  createFillwordGenerationTask,
  FillwordTaskError,
} from './fillword-generation-task';
import type { FillwordGenerationTask } from './fillword-generation-task';

export interface FillwordNotice {
  key: TranslationKey;
  values?: Readonly<Record<string, string | number>>;
  danger?: boolean;
}
export function fillwordErrorNotice(error: unknown): FillwordNotice {
  if (error instanceof FillwordError)
    return {
      key: `fillword.errors.${error.code}`,
      values: error.values,
      danger: true,
    };
  return {
    key:
      error instanceof FillwordTaskError && error.code === 'timeout'
        ? 'fillword.messages.timeout'
        : 'fillword.messages.failed',
    danger: true,
  };
}
export function useFillwordGenerator(
  onSuccess: (puzzle: FillwordPuzzle) => void,
) {
  const taskRef = useRef<FillwordGenerationTask | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<FillwordNotice | null>(null);
  const cancel = useCallback(() => {
    const task = taskRef.current;
    if (!task) return;
    taskRef.current = null;
    task.cancel();
    setBusy(false);
    setNotice({ key: 'fillword.messages.cancelled' });
  }, []);
  const generate = useCallback(
    (options: FillwordGenerationOptions) => {
      taskRef.current?.cancel();
      setBusy(true);
      setNotice(null);
      const task = createFillwordGenerationTask(options);
      taskRef.current = task;
      void task.promise.then(
        (puzzle) => {
          if (taskRef.current !== task) return;
          taskRef.current = null;
          setBusy(false);
          setNotice({ key: 'fillword.messages.created' });
          onSuccess(puzzle);
        },
        (error: unknown) => {
          if (taskRef.current !== task) return;
          taskRef.current = null;
          setBusy(false);
          setNotice(fillwordErrorNotice(error));
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
  return { busy, notice, generate, cancel };
}