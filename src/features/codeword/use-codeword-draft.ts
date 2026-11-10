import { useEffect, useState } from 'react';
import { isCodewordAlphabet } from '../../engines/codeword/codeword-input';
import type {
  CodewordAlphabet,
  CodewordPuzzle,
} from '../../engines/codeword/codeword.types';
export const CODEWORD_DRAFT_STORAGE = 'puzzle-workshop-codeword-draft-v1';
export interface CodewordDraft {
  title: string;
  source: 'words' | 'grid';
  rows: string;
  columns: string;
  alphabet: CodewordAlphabet;
  words: string;
  grid: string;
  givenCount: string;
  revealed: string;
  dictionary: string;
  showWordBank: boolean;
  requireAllLetters: boolean;
}
function fromPuzzle(puzzle: CodewordPuzzle): CodewordDraft {
  return {
    title: puzzle.title,
    source: 'words',
    rows: String(puzzle.rows),
    columns: String(puzzle.columns),
    alphabet: puzzle.alphabet,
    words: puzzle.words.join(', '),
    grid: Array.from({ length: puzzle.rows }, (_, row) =>
      puzzle.cells
        .slice(row * puzzle.columns, (row + 1) * puzzle.columns)
        .map((code) => (code === null ? '#' : puzzle.key[code - 1]))
        .join(''),
    ).join('\n'),
    givenCount: String(puzzle.givens.length),
    revealed: puzzle.givens.map((given) => given.letter).join(', '),
    dictionary: puzzle.dictionary.join('\n'),
    showWordBank: puzzle.showWordBank,
    requireAllLetters: puzzle.requireAllLetters,
  };
}
function initial(puzzle: CodewordPuzzle) {
  try {
    const raw = localStorage.getItem(CODEWORD_DRAFT_STORAGE);
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
      data.type !== 'codeword-draft' ||
      !data.draft ||
      typeof data.draft !== 'object'
    )
      throw new Error();
    const draft = data.draft as Record<string, unknown>;
    for (const [key, max] of [
      ['title', 120],
      ['rows', 2],
      ['columns', 2],
      ['givenCount', 2],
      ['revealed', 100],
      ['words', 2000],
      ['grid', 2000],
      ['dictionary', 200000],
    ] as const)
      if (typeof draft[key] !== 'string' || draft[key].length > max)
        throw new Error();
    if (
      !isCodewordAlphabet(draft.alphabet) ||
      (draft.source !== 'words' && draft.source !== 'grid') ||
      typeof draft.showWordBank !== 'boolean' ||
      typeof draft.requireAllLetters !== 'boolean'
    )
      throw new Error();
    return { draft: draft as unknown as CodewordDraft, problem: false };
  } catch {
    return { draft: fromPuzzle(puzzle), problem: true };
  }
}
export function useCodewordDraft(puzzle: CodewordPuzzle) {
  const [state, setState] = useState(() => initial(puzzle));
  useEffect(() => {
    try {
      localStorage.setItem(
        CODEWORD_DRAFT_STORAGE,
        JSON.stringify({
          schemaVersion: 1,
          type: 'codeword-draft',
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
    patch: (patch: Partial<CodewordDraft>) =>
      setState((current) => ({
        ...current,
        draft: { ...current.draft, ...patch },
      })),
  };
}