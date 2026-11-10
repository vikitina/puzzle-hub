import { FILLWORD_DIRECTION_STEPS } from './fillword-config';
import type {
  FillwordConfig,
  FillwordProgress,
  FillwordPuzzle,
  FoundFillwordWord,
} from './fillword.types';
import { FillwordError } from './fillword.types';

export function isFillwordPath(
  config: FillwordConfig,
  path: readonly number[],
  checkDirection = true,
): boolean {
  if (
    path.length < 1 ||
    new Set(path).size !== path.length ||
    path.some(
      (index) =>
        !Number.isInteger(index) ||
        index < 0 ||
        index >= config.rows * config.columns,
    )
  )
    return false;
  let firstStep: readonly [number, number] | undefined;
  for (let i = 1; i < path.length; i += 1) {
    const previous = path[i - 1]!;
    const current = path[i]!;
    const dr =
      Math.floor(current / config.columns) -
      Math.floor(previous / config.columns);
    const dc = (current % config.columns) - (previous % config.columns);
    if (config.mode === 'snake') {
      if (Math.abs(dr) + Math.abs(dc) !== 1) return false;
    } else {
      if (Math.max(Math.abs(dr), Math.abs(dc)) !== 1) return false;
      if (firstStep && (firstStep[0] !== dr || firstStep[1] !== dc))
        return false;
      firstStep ??= [dr, dc];
      const permitted = FILLWORD_DIRECTION_STEPS[config.directions];
      if (
        !permitted.some(
          ([r, c]) =>
            (r === dr && c === dc) ||
            (!checkDirection && r === -dr && c === -dc),
        )
      )
        return false;
    }
  }
  return true;
}

export function createFillwordProgress(
  puzzle: FillwordPuzzle,
): FillwordProgress {
  return {
    schemaVersion: 1,
    type: 'fillword-progress',
    puzzleId: puzzle.id,
    found: [],
  };
}

export function extendFillwordSelection(
  puzzle: FillwordPuzzle,
  selected: readonly number[],
  index: number,
): readonly number[] {
  const previous = selected.indexOf(index);
  if (previous !== -1) return selected.slice(0, previous);
  const next = [...selected, index];
  if (!isFillwordPath(puzzle.config, next, false))
    throw new FillwordError('selection');
  return next;
}

export function matchFillwordSelection(
  puzzle: FillwordPuzzle,
  progress: FillwordProgress,
  selected: readonly number[],
  wordId?: string,
): FoundFillwordWord {
  if (selected.length < 2 || !isFillwordPath(puzzle.config, selected, false))
    throw new FillwordError('selection');
  const text = selected.map((index) => puzzle.cells[index]).join('');
  const reverse = [...selected].reverse();
  const reversedText = reverse.map((index) => puzzle.cells[index]).join('');
  const candidates = puzzle.words.filter(
    (entry) =>
      (!wordId || entry.id === wordId) &&
      ((entry.text === text && isFillwordPath(puzzle.config, selected)) ||
        (entry.text === reversedText &&
          isFillwordPath(puzzle.config, reverse))),
  );
  if (candidates.length === 0) throw new FillwordError('unknown-word');
  const remaining = candidates.filter(
    (word) => !progress.found.some((entry) => entry.wordId === word.id),
  );
  if (remaining.length === 0) throw new FillwordError('already-found');
  if (puzzle.config.mode === 'snake') {
    const used = new Set(progress.found.flatMap((entry) => [...entry.path]));
    if (selected.some((index) => used.has(index)))
      throw new FillwordError('used-cell');
  }
  const same = (path: readonly number[], candidate: readonly number[]) =>
    path.length === candidate.length &&
    path.every((index, i) => index === candidate[i]);
  const word =
    remaining.find(
      (entry) => same(entry.path, selected) || same(entry.path, reverse),
    ) ??
    remaining.find((entry) => entry.text === text) ??
    remaining[0]!;
  return {
    wordId: word.id,
    path:
      word.text === text && isFillwordPath(puzzle.config, selected)
        ? [...selected]
        : reverse,
  };
}