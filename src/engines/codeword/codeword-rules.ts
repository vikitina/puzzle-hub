import { CODEWORD_ALPHABETS } from './codeword-input';
import { getCodewordSlots } from './codeword-layout';
import type { CodewordProgress, CodewordPuzzle } from './codeword.types';
import { CodewordError } from './codeword.types';

export function createCodewordProgress(
  puzzle: CodewordPuzzle,
): CodewordProgress {
  return {
    schemaVersion: 1,
    type: 'codeword-progress',
    puzzleId: puzzle.id,
    assignments: Array<string | null>(puzzle.key.length).fill(null),
  };
}
export function codewordLetter(
  puzzle: CodewordPuzzle,
  progress: CodewordProgress,
  code: number,
): string | null {
  return (
    puzzle.givens.find((given) => given.code === code)?.letter ??
    progress.assignments[code - 1] ??
    null
  );
}
export function setCodewordLetter(
  puzzle: CodewordPuzzle,
  progress: CodewordProgress,
  code: number,
  source: string | null,
): CodewordProgress {
  if (
    progress.puzzleId !== puzzle.id ||
    progress.assignments.length !== puzzle.key.length ||
    !Number.isInteger(code) ||
    code < 1 ||
    code > puzzle.key.length ||
    puzzle.givens.some((given) => given.code === code)
  )
    throw new CodewordError('progress');
  const letter =
    source === null || source === ''
      ? null
      : source.normalize('NFC').toUpperCase();
  if (
    letter !== null &&
    (letter.length !== 1 ||
      !CODEWORD_ALPHABETS[puzzle.alphabet].letters.includes(letter) ||
      !puzzle.key.includes(letter))
  )
    throw new CodewordError('letters', { word: source ?? '' });
  return {
    ...progress,
    assignments: progress.assignments.map((value, index) =>
      index === code - 1 ? letter : value,
    ),
  };
}
export function inspectCodeword(
  puzzle: CodewordPuzzle,
  progress: CodewordProgress,
) {
  const entries = puzzle.key.map((_, i) =>
    codewordLetter(puzzle, progress, i + 1),
  );
  const conflicts: number[] = [],
    mistakes: number[] = [];
  entries.forEach((letter, i) => {
    if (
      letter !== null &&
      entries.some((other, j) => j !== i && other === letter)
    )
      conflicts.push(i + 1);
    if (letter !== null && letter !== puzzle.key[i]) mistakes.push(i + 1);
  });
  const complete = entries.every((letter) => letter !== null);
  const authorSolution =
    complete && entries.every((letter, index) => letter === puzzle.key[index]);
  let lexicalSolution = false;
  if (complete && conflicts.length === 0) {
    const decoded = getCodewordSlots(
      puzzle.rows,
      puzzle.columns,
      puzzle.cells,
    ).map((slot) =>
      slot.path.map((index) => entries[puzzle.cells[index]! - 1]).join(''),
    );
    const dictionary = puzzle.showWordBank ? puzzle.words : puzzle.dictionary;
    lexicalSolution =
      dictionary.length > 0 &&
      decoded.every((word) => dictionary.includes(word)) &&
      (!puzzle.showWordBank || new Set(decoded).size === puzzle.words.length);
  }
  return {
    entries,
    conflicts,
    mistakes,
    solved: authorSolution || lexicalSolution,
    authorSolution,
    filled: entries.filter((letter) => letter !== null).length,
  };
}