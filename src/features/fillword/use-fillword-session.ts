import { useCallback, useEffect, useState } from 'react';
import {
  parseFillwordProgressJSON,
  parseFillwordPuzzleJSON,
} from '../../engines/fillword/fillword-json';
import { createFillwordProgress } from '../../engines/fillword/fillword-rules';
import type {
  FillwordProgress,
  FillwordPuzzle,
} from '../../engines/fillword/fillword.types';
import { demoFillword } from './demo-fillword';

export const FILLWORD_PUZZLE_STORAGE = 'puzzle-workshop-fillword-puzzle-v1';
export const fillwordProgressStorageKey = (id: string) =>
  `puzzle-workshop-fillword-progress-v1:${encodeURIComponent(id)}`;

function loadProgress(puzzle: FillwordPuzzle): {
  progress: FillwordProgress;
  problem: boolean;
} {
  try {
    const source = window.localStorage.getItem(
      fillwordProgressStorageKey(puzzle.id),
    );
    return {
      progress: source
        ? parseFillwordProgressJSON(source, puzzle)
        : createFillwordProgress(puzzle),
      problem: false,
    };
  } catch {
    return { progress: createFillwordProgress(puzzle), problem: true };
  }
}
function initialSession() {
  try {
    const source = window.localStorage.getItem(FILLWORD_PUZZLE_STORAGE);
    const puzzle = source ? parseFillwordPuzzleJSON(source) : demoFillword;
    const restored = loadProgress(puzzle);
    return { puzzle, progress: restored.progress, problem: restored.problem };
  } catch {
    return {
      puzzle: demoFillword,
      progress: createFillwordProgress(demoFillword),
      problem: true,
    };
  }
}

export function useFillwordSession() {
  const [session, setSession] = useState(initialSession);
  useEffect(() => {
    try {
      window.localStorage.setItem(
        FILLWORD_PUZZLE_STORAGE,
        JSON.stringify(session.puzzle),
      );
      window.localStorage.setItem(
        fillwordProgressStorageKey(session.puzzle.id),
        JSON.stringify(session.progress),
      );
    } catch {
      setSession((current) =>
        current.problem ? current : { ...current, problem: true },
      );
    }
  }, [session.puzzle, session.progress]);
  const openPuzzle = useCallback((puzzle: FillwordPuzzle) => {
    const restored = loadProgress(puzzle);
    setSession({
      puzzle,
      progress: restored.progress,
      problem: restored.problem,
    });
  }, []);
  const setProgress = useCallback((progress: FillwordProgress) => {
    setSession((current) =>
      progress.puzzleId === current.puzzle.id
        ? { ...current, progress }
        : current,
    );
  }, []);
  const undo = useCallback(
    () =>
      setSession((current) => ({
        ...current,
        progress: {
          ...current.progress,
          found: current.progress.found.slice(0, -1),
        },
      })),
    [],
  );
  const reset = useCallback(
    () =>
      setSession((current) => ({
        ...current,
        progress: createFillwordProgress(current.puzzle),
      })),
    [],
  );
  return { ...session, openPuzzle, setProgress, undo, reset };
}