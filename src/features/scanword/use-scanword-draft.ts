import { useEffect, useState } from 'react';
import {
  formatScanwordDictionary,
  isScanwordAlphabet,
} from '../../engines/scanword/scanword-input';
import type {
  ScanwordAlphabet,
  ScanwordPuzzle,
} from '../../engines/scanword/scanword.types';
import type { ScanwordWorkerRequest } from './scanword-worker.types';
export const SCANWORD_DRAFT_STORAGE = 'puzzle-workshop-scanword-draft-v1';
export interface ScanwordDraft {
  title: string;
  rows: string;
  columns: string;
  alphabet: ScanwordAlphabet;
  dictionary: string;
  useAll: boolean;
  wordCount: string;
  maxCluesPerCell: '1' | '2';
  givenCount: string;
}
function fromPuzzle(puzzle: ScanwordPuzzle): ScanwordDraft {
  return {
    title: puzzle.title,
    rows: String(puzzle.rows),
    columns: String(puzzle.columns),
    alphabet: puzzle.alphabet,
    dictionary: formatScanwordDictionary(puzzle.entries),
    useAll: true,
    wordCount: String(puzzle.entries.length),
    maxCluesPerCell: String(puzzle.maxCluesPerCell) as '1' | '2',
    givenCount: String(puzzle.givens.length),
  };
}
function initial(puzzle: ScanwordPuzzle) {
  try {
    const raw = localStorage.getItem(SCANWORD_DRAFT_STORAGE);
    if (!raw) return { draft: fromPuzzle(puzzle), problem: false };
    const data = JSON.parse(raw) as {
      schemaVersion?: unknown;
      type?: unknown;
      puzzleId?: unknown;
      draft?: unknown;
    };
    if (data.puzzleId !== puzzle.id)
      return { draft: fromPuzzle(puzzle), problem: false };
    if (
      data.schemaVersion !== 1 ||
      data.type !== 'scanword-draft' ||
      !data.draft ||
      typeof data.draft !== 'object'
    )
      throw new Error();
    const draft = data.draft as Record<string, unknown>;
    for (const [key, max] of [
      ['title', 120],
      ['rows', 2],
      ['columns', 2],
      ['wordCount', 2],
      ['givenCount', 3],
      ['dictionary', 20000],
    ] as const)
      if (typeof draft[key] !== 'string' || draft[key].length > max)
        throw new Error();
    if (
      !isScanwordAlphabet(draft.alphabet) ||
      typeof draft.useAll !== 'boolean' ||
      (draft.maxCluesPerCell !== '1' && draft.maxCluesPerCell !== '2')
    )
      throw new Error();
    return { draft: draft as unknown as ScanwordDraft, problem: false };
  } catch {
    return { draft: fromPuzzle(puzzle), problem: true };
  }
}
export function preserveScanwordDraft(
  puzzle: ScanwordPuzzle,
  request: Exclude<ScanwordWorkerRequest, { type: 'validate' }>,
): boolean {
  const draft =
    request.type === 'generate'
      ? {
          ...fromPuzzle(puzzle),
          dictionary: formatScanwordDictionary(request.options.dictionary),
          useAll: request.options.useAll,
          wordCount: String(request.options.wordCount),
        }
      : {
          ...initial(request.puzzle).draft,
          title: puzzle.title,
          dictionary: formatScanwordDictionary(request.settings.dictionary),
          givenCount: String(puzzle.givens.length),
        };
  try {
    localStorage.setItem(
      SCANWORD_DRAFT_STORAGE,
      JSON.stringify({
        schemaVersion: 1,
        type: 'scanword-draft',
        puzzleId: puzzle.id,
        draft,
      }),
    );
    return true;
  } catch {
    return false;
  }
}
export function useScanwordDraft(puzzle: ScanwordPuzzle) {
  const [state, setState] = useState(() => initial(puzzle));
  useEffect(() => {
    try {
      localStorage.setItem(
        SCANWORD_DRAFT_STORAGE,
        JSON.stringify({
          schemaVersion: 1,
          type: 'scanword-draft',
          puzzleId: puzzle.id,
          draft: state.draft,
        }),
      );
    } catch {
      setState((current) =>
        current.problem ? current : { ...current, problem: true },
      );
    }
  }, [puzzle.id, state.draft]);
  return {
    ...state,
    patch: (patch: Partial<ScanwordDraft>) =>
      setState((current) => ({
        ...current,
        draft: { ...current.draft, ...patch },
      })),
  };
}