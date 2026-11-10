import { useCallback, useEffect, useState } from 'react';
import {
  parseScanwordProgressJSON,
  parseScanwordPuzzleJSON,
} from '../../engines/scanword/scanword-json';
import { createScanwordProgress } from '../../engines/scanword/scanword-rules';
import type {
  ScanwordProgress,
  ScanwordPuzzle,
} from '../../engines/scanword/scanword.types';
import { demoScanword } from './scanword-examples';
export const SCANWORD_PUZZLE_STORAGE = 'puzzle-workshop-scanword-puzzle-v1';
export const scanwordProgressKey = (id: string) =>
  `puzzle-workshop-scanword-progress-v1:${encodeURIComponent(id)}`;
function loadProgress(puzzle: ScanwordPuzzle) {
  try {
    const raw = localStorage.getItem(scanwordProgressKey(puzzle.id));
    return {
      progress: raw
        ? parseScanwordProgressJSON(raw, puzzle)
        : createScanwordProgress(puzzle),
      problem: false,
    };
  } catch {
    return { progress: createScanwordProgress(puzzle), problem: true };
  }
}
function initialSession() {
  try {
    const raw = localStorage.getItem(SCANWORD_PUZZLE_STORAGE);
    const puzzle = raw ? parseScanwordPuzzleJSON(raw) : demoScanword;
    return {
      puzzle,
      ...loadProgress(puzzle),
      validated: false,
    };
  } catch {
    return {
      puzzle: demoScanword,
      progress: createScanwordProgress(demoScanword),
      problem: true,
      validated: false,
    };
  }
}
export function useScanwordSession() {
  const [session, setSession] = useState(initialSession);
  useEffect(() => {
    if (!session.validated) return;
    try {
      localStorage.setItem(
        SCANWORD_PUZZLE_STORAGE,
        JSON.stringify(session.puzzle),
      );
      localStorage.setItem(
        scanwordProgressKey(session.puzzle.id),
        JSON.stringify(session.progress),
      );
    } catch {
      setSession((current) =>
        current.problem ? current : { ...current, problem: true },
      );
    }
  }, [session.puzzle, session.progress, session.validated]);
  const openPuzzle = useCallback((puzzle: ScanwordPuzzle) => {
    const restored = loadProgress(puzzle);
    setSession((current) => ({
      puzzle,
      progress: restored.progress,
      validated: true,
      problem: current.problem || restored.problem,
    }));
  }, []);
  const setProgress = useCallback(
    (progress: ScanwordProgress) =>
      setSession((current) =>
        current.validated && progress.puzzleId === current.puzzle.id
          ? { ...current, progress }
          : current,
      ),
    [],
  );
  return { ...session, openPuzzle, setProgress };
}