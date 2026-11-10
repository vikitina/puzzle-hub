import { useCallback, useEffect, useState } from 'react';
import {
  parseCodewordProgressJSON,
  parseCodewordPuzzleJSON,
} from '../../engines/codeword/codeword-json';
import { createCodewordProgress } from '../../engines/codeword/codeword-rules';
import type {
  CodewordAnalysis,
  CodewordProgress,
  CodewordPuzzle,
} from '../../engines/codeword/codeword.types';
import { demoCodeword } from './demo-codeword';
export const CODEWORD_PUZZLE_STORAGE = 'puzzle-workshop-codeword-puzzle-v1';
export const codewordProgressKey = (id: string) =>
  `puzzle-workshop-codeword-progress-v1:${encodeURIComponent(id)}`;
function loadProgress(puzzle: CodewordPuzzle) {
  try {
    const raw = localStorage.getItem(codewordProgressKey(puzzle.id));
    return {
      progress: raw
        ? parseCodewordProgressJSON(raw, puzzle)
        : createCodewordProgress(puzzle),
      problem: false,
    };
  } catch {
    return { progress: createCodewordProgress(puzzle), problem: true };
  }
}
function initialSession() {
  try {
    const raw = localStorage.getItem(CODEWORD_PUZZLE_STORAGE);
    const puzzle = raw ? parseCodewordPuzzleJSON(raw) : demoCodeword;
    return {
      puzzle,
      ...loadProgress(puzzle),
      analysis: null as CodewordAnalysis | null,
    };
  } catch {
    return {
      puzzle: demoCodeword,
      progress: createCodewordProgress(demoCodeword),
      problem: true,
      analysis: null as CodewordAnalysis | null,
    };
  }
}
export function useCodewordSession() {
  const [session, setSession] = useState(initialSession);
  useEffect(() => {
    if (!session.analysis) return;
    try {
      localStorage.setItem(
        CODEWORD_PUZZLE_STORAGE,
        JSON.stringify(session.puzzle),
      );
      localStorage.setItem(
        codewordProgressKey(session.puzzle.id),
        JSON.stringify(session.progress),
      );
    } catch {
      setSession((current) =>
        current.problem ? current : { ...current, problem: true },
      );
    }
  }, [session.puzzle, session.progress, session.analysis]);
  const openPuzzle = useCallback(
    (puzzle: CodewordPuzzle, analysis: CodewordAnalysis) => {
      const restored = loadProgress(puzzle);
      setSession((current) => ({
        puzzle,
        progress: restored.progress,
        analysis,
        problem: current.problem || restored.problem,
      }));
    },
    [],
  );
  const setProgress = useCallback(
    (progress: CodewordProgress) =>
      setSession((current) =>
        current.analysis && progress.puzzleId === current.puzzle.id
          ? { ...current, progress }
          : current,
      ),
    [],
  );
  return { ...session, openPuzzle, setProgress };
}