import { useCallback, useEffect, useState } from 'react';
import {
  parseNonogramProgressJSON,
  parseNonogramPuzzleJSON,
} from '../../engines/nonogram/nonogram-json';
import { createNonogramProgress } from '../../engines/nonogram/nonogram-rules';
import type {
  NonogramProgress,
  NonogramPuzzle,
} from '../../engines/nonogram/nonogram.types';
import { demoNonogram } from './nonogram-presets';

export const NONOGRAM_PUZZLE_STORAGE = 'puzzle-workshop-nonogram-puzzle-v1';
export const nonogramProgressKey = (id: string) =>
  `puzzle-workshop-nonogram-progress-v1:${encodeURIComponent(id)}`;
function loadProgress(puzzle: NonogramPuzzle) {
  try {
    const raw = localStorage.getItem(nonogramProgressKey(puzzle.id));
    return {
      progress: raw
        ? parseNonogramProgressJSON(raw, puzzle)
        : createNonogramProgress(puzzle),
      problem: false,
    };
  } catch {
    return { progress: createNonogramProgress(puzzle), problem: true };
  }
}
function initialSession() {
  try {
    const raw = localStorage.getItem(NONOGRAM_PUZZLE_STORAGE);
    const puzzle = raw ? parseNonogramPuzzleJSON(raw) : demoNonogram;
    return { puzzle, ...loadProgress(puzzle), verified: false };
  } catch {
    return {
      puzzle: demoNonogram,
      progress: createNonogramProgress(demoNonogram),
      problem: true,
      verified: false,
    };
  }
}
export function useNonogramSession() {
  const [session, setSession] = useState(initialSession);
  useEffect(() => {
    if (!session.verified) return;
    try {
      localStorage.setItem(
        NONOGRAM_PUZZLE_STORAGE,
        JSON.stringify(session.puzzle),
      );
      localStorage.setItem(
        nonogramProgressKey(session.puzzle.id),
        JSON.stringify(session.progress),
      );
    } catch {
      setSession((current) =>
        current.problem ? current : { ...current, problem: true },
      );
    }
  }, [session.puzzle, session.progress, session.verified]);
  const openVerifiedPuzzle = useCallback((puzzle: NonogramPuzzle) => {
    const restored = loadProgress(puzzle);
    setSession((current) => ({
      puzzle,
      progress: restored.progress,
      verified: true,
      problem: current.problem || restored.problem,
    }));
  }, []);
  const setProgress = useCallback(
    (progress: NonogramProgress) =>
      setSession((current) =>
        current.verified && progress.puzzleId === current.puzzle.id
          ? { ...current, progress }
          : current,
      ),
    [],
  );
  return { ...session, openVerifiedPuzzle, setProgress };
}