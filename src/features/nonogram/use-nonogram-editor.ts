import { useCallback, useEffect, useState } from 'react';
import {
  createNonogramPuzzle,
  validateNonogramBitmap,
  validateNonogramSize,
} from '../../engines/nonogram/nonogram-clues';
import type {
  NonogramPixel,
  NonogramPuzzle,
} from '../../engines/nonogram/nonogram.types';
import { getNonogramPreset } from './nonogram-presets';
import type { NonogramPreset } from './nonogram-presets';

export const NONOGRAM_DRAFT_STORAGE = 'puzzle-workshop-nonogram-draft-v1';
export interface NonogramDraft {
  schemaVersion: 1;
  type: 'nonogram-draft';
  title: string;
  rows: number;
  columns: number;
  solution: readonly NonogramPixel[];
  density: string;
  symmetric: boolean;
}
function fromPuzzle(puzzle: NonogramPuzzle): NonogramDraft {
  return {
    schemaVersion: 1,
    type: 'nonogram-draft',
    title: puzzle.title,
    rows: puzzle.rows,
    columns: puzzle.columns,
    solution: [...puzzle.solution],
    density: '50',
    symmetric: true,
  };
}
function initialDraft(puzzle: NonogramPuzzle) {
  try {
    const source = localStorage.getItem(NONOGRAM_DRAFT_STORAGE);
    if (!source) return { draft: fromPuzzle(puzzle), problem: false };
    const value: unknown = JSON.parse(source);
    if (!value || typeof value !== 'object') throw new Error();
    const data = value as Record<string, unknown>;
    if (
      data.schemaVersion !== 1 ||
      data.type !== 'nonogram-draft' ||
      typeof data.title !== 'string' ||
      data.title.length > 120 ||
      typeof data.rows !== 'number' ||
      typeof data.columns !== 'number' ||
      !Array.isArray(data.solution) ||
      typeof data.density !== 'string' ||
      data.density.length > 6 ||
      typeof data.symmetric !== 'boolean'
    )
      throw new Error();
    const checked = createNonogramPuzzle(
      'draft',
      data.title.trim() || 'Draft',
      data.rows,
      data.columns,
      data.solution as NonogramPixel[],
    );
    return {
      draft: {
        ...fromPuzzle(checked),
        title: data.title,
        density: data.density,
        symmetric: data.symmetric,
      },
      problem: false,
    };
  } catch {
    return { draft: fromPuzzle(puzzle), problem: true };
  }
}
export function useNonogramEditor(puzzle: NonogramPuzzle) {
  const [state, setState] = useState(() => ({
    ...initialDraft(puzzle),
    history: [] as NonogramDraft[],
  }));
  useEffect(() => {
    try {
      localStorage.setItem(NONOGRAM_DRAFT_STORAGE, JSON.stringify(state.draft));
    } catch {
      setState((current) =>
        current.problem ? current : { ...current, problem: true },
      );
    }
  }, [state.draft]);
  const update = useCallback(
    (change: (draft: NonogramDraft) => NonogramDraft, remember = true) => {
      setState((current) => {
        const draft = change(current.draft);
        return draft === current.draft
          ? current
          : {
              ...current,
              draft,
              history: remember
                ? [...current.history.slice(-49), current.draft]
                : current.history,
            };
      });
    },
    [],
  );
  const patch = useCallback(
    (patch: Partial<Pick<NonogramDraft, 'title' | 'density' | 'symmetric'>>) =>
      update((draft) => ({ ...draft, ...patch }), false),
    [update],
  );
  const resize = useCallback(
    (rows: number, columns: number) => {
      validateNonogramSize(rows, columns);
      update((draft) => ({
        ...draft,
        rows,
        columns,
        solution: Array.from({ length: rows * columns }, (_, index) => {
          const row = Math.floor(index / columns);
          const column = index % columns;
          return row < draft.rows && column < draft.columns
            ? draft.solution[row * draft.columns + column]!
            : 0;
        }),
      }));
    },
    [update],
  );
  const paint = useCallback(
    (index: number, value?: NonogramPixel) =>
      update((draft) => {
        if (
          !Number.isInteger(index) ||
          index < 0 ||
          index >= draft.solution.length
        )
          return draft;
        const next = value ?? (draft.solution[index] === 1 ? 0 : 1);
        return next === draft.solution[index]
          ? draft
          : {
              ...draft,
              solution: draft.solution.map((pixel, i) =>
                i === index ? next : pixel,
              ),
            };
      }),
    [update],
  );
  const clear = useCallback(
    () =>
      update((draft) => ({ ...draft, solution: draft.solution.map(() => 0) })),
    [update],
  );
  const invert = useCallback(
    () =>
      update((draft) => ({
        ...draft,
        solution: draft.solution.map((pixel) => (pixel === 1 ? 0 : 1)),
      })),
    [update],
  );
  const preset = useCallback(
    (key: NonogramPreset) =>
      update((draft) => ({ ...draft, ...getNonogramPreset(key) })),
    [update],
  );
  const replaceDrawing = useCallback(
    (next: NonogramPuzzle) => {
      validateNonogramBitmap(next.rows, next.columns, next.solution);
      update((draft) => ({
        ...draft,
        title: next.title,
        rows: next.rows,
        columns: next.columns,
        solution: [...next.solution],
      }));
    },
    [update],
  );
  const undo = useCallback(
    () =>
      setState((current) => {
        const previous = current.history.at(-1);
        return previous
          ? {
              ...current,
              draft: {
                ...previous,
                title: current.draft.title,
                density: current.draft.density,
                symmetric: current.draft.symmetric,
              },
              history: current.history.slice(0, -1),
            }
          : current;
      }),
    [],
  );
  return {
    ...state,
    patch,
    resize,
    paint,
    clear,
    invert,
    preset,
    replaceDrawing,
    undo,
  };
}