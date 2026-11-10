import { SCANWORD_ALPHABETS } from './scanword-input';
import type { ScanwordProgress, ScanwordPuzzle } from './scanword.types';
import { ScanwordError } from './scanword.types';
export function createScanwordProgress(
  puzzle: ScanwordPuzzle,
): ScanwordProgress {
  return {
    schemaVersion: 1,
    type: 'scanword-progress',
    puzzleId: puzzle.id,
    cells: Array<string | null>(puzzle.cells.length).fill(null),
  };
}
export function scanwordCellLetter(
  puzzle: ScanwordPuzzle,
  progress: ScanwordProgress,
  index: number,
): string | null {
  return (
    puzzle.givens.find((given) => given.index === index)?.letter ??
    progress.cells[index] ??
    null
  );
}
export function setScanwordCell(
  puzzle: ScanwordPuzzle,
  progress: ScanwordProgress,
  index: number,
  source: string | null,
): ScanwordProgress {
  const letter =
    source === null || source === ''
      ? null
      : source.normalize('NFC').toUpperCase();
  if (
    progress.puzzleId !== puzzle.id ||
    progress.cells.length !== puzzle.cells.length ||
    !Number.isInteger(index) ||
    index < 0 ||
    index >= puzzle.cells.length ||
    puzzle.cells[index] === null ||
    puzzle.givens.some((given) => given.index === index)
  )
    throw new ScanwordError('progress');
  if (
    letter !== null &&
    (letter.length !== 1 ||
      !SCANWORD_ALPHABETS[puzzle.alphabet].letters.includes(letter))
  )
    throw new ScanwordError('word');
  return {
    ...progress,
    cells: progress.cells.map((value, i) => (i === index ? letter : value)),
  };
}
export function setScanwordEntry(
  puzzle: ScanwordPuzzle,
  progress: ScanwordProgress,
  entryId: string,
  source: string,
): ScanwordProgress {
  if (
    progress.puzzleId !== puzzle.id ||
    progress.cells.length !== puzzle.cells.length
  )
    throw new ScanwordError('progress');
  const entry = puzzle.entries.find((item) => item.id === entryId);
  const letters = [...source.normalize('NFC').toUpperCase().trim()];
  if (
    !entry ||
    letters.length !== entry.path.length ||
    letters.some(
      (letter) => !SCANWORD_ALPHABETS[puzzle.alphabet].letters.includes(letter),
    )
  )
    throw new ScanwordError('word');
  for (const given of puzzle.givens) {
    const position = entry.path.indexOf(given.index);
    if (position >= 0 && letters[position] !== given.letter)
      throw new ScanwordError('progress');
  }
  let next = progress;
  entry.path.forEach((index, i) => {
    if (!puzzle.givens.some((given) => given.index === index))
      next = setScanwordCell(puzzle, next, index, letters[i]!);
  });
  return next;
}
export function inspectScanword(
  puzzle: ScanwordPuzzle,
  progress: ScanwordProgress,
) {
  const letters = puzzle.cells.map((answer, index) =>
    answer === null ? null : scanwordCellLetter(puzzle, progress, index),
  );
  const white = puzzle.cells.flatMap((answer, index) =>
    answer === null ? [] : [index],
  );
  return {
    letters,
    filled: white.filter((index) => letters[index] !== null).length,
    total: white.length,
    mistakes: white.filter(
      (index) =>
        letters[index] !== null && letters[index] !== puzzle.cells[index],
    ),
    filledEntries: puzzle.entries.filter((entry) =>
      entry.path.every((index) => letters[index] !== null),
    ).length,
    solved: white.every((index) => letters[index] === puzzle.cells[index]),
  };
}