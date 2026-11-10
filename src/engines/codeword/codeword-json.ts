import { createCodewordPuzzle } from './codeword-puzzle';
import { CODEWORD_ALPHABETS, isCodewordAlphabet } from './codeword-input';
import type {
  CodewordGiven,
  CodewordProgress,
  CodewordPuzzle,
} from './codeword.types';
import { CodewordError } from './codeword.types';

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new CodewordError('data');
  return value as Record<string, unknown>;
}
function text(value: unknown, max: number): string {
  if (typeof value !== 'string' || !value.trim() || value.length > max)
    throw new CodewordError('data');
  return value;
}
function strings(value: unknown, max: number): string[] {
  if (
    !Array.isArray(value) ||
    value.length > max ||
    Array.from(value).some(
      (word) => typeof word !== 'string' || word.length > 25,
    )
  )
    throw new CodewordError('data');
  return value as string[];
}
function parse(source: string): unknown {
  if (source.length > 1_000_000) throw new CodewordError('data');
  try {
    return JSON.parse(source) as unknown;
  } catch {
    throw new CodewordError('data');
  }
}
export function readCodewordPuzzle(value: unknown): CodewordPuzzle {
  const data = record(value);
  if (data.schemaVersion !== 1) throw new CodewordError('version');
  if (
    data.type !== 'codeword' ||
    typeof data.rows !== 'number' ||
    typeof data.columns !== 'number' ||
    !isCodewordAlphabet(data.alphabet) ||
    !Array.isArray(data.cells) ||
    data.cells.length > 625 ||
    !Array.isArray(data.givens) ||
    data.givens.length > 33 ||
    typeof data.showWordBank !== 'boolean' ||
    typeof data.requireAllLetters !== 'boolean'
  )
    throw new CodewordError('data');
  const alphabet = data.alphabet;
  const key = strings(data.key, 33);
  if (
    key.length < 1 ||
    new Set(key).size !== key.length ||
    key.some(
      (letter) =>
        letter.length !== 1 ||
        !CODEWORD_ALPHABETS[alphabet].letters.includes(letter),
    )
  )
    throw new CodewordError('data');
  if (
    Array.from(data.cells).some(
      (code) =>
        code !== null &&
        (!Number.isInteger(code) || code < 1 || code > key.length),
    )
  )
    throw new CodewordError('data');
  const cells = data.cells as (number | null)[];
  const givens: CodewordGiven[] = data.givens.map((value) => {
    const given = record(value);
    if (
      typeof given.code !== 'number' ||
      !Number.isInteger(given.code) ||
      given.code < 1 ||
      given.code > key.length ||
      given.letter !== key[given.code - 1]
    )
      throw new CodewordError('data');
    return { code: given.code, letter: given.letter as string };
  });
  if (new Set(givens.map((given) => given.code)).size !== givens.length)
    throw new CodewordError('data');
  const puzzle = createCodewordPuzzle(
    {
      id: text(data.id, 100),
      title: text(data.title, 120),
      rows: data.rows,
      columns: data.columns,
      alphabet: data.alphabet,
      givenCount: givens.length,
      revealedLetters: givens.map((given) => given.letter),
      dictionary: strings(data.dictionary, 5000),
      showWordBank: data.showWordBank,
      requireAllLetters: data.requireAllLetters,
    },
    cells.map((code) => (code === null ? null : key[code - 1]!)),
    () => {
      throw new CodewordError('data');
    },
    key,
  );
  const words = strings(data.words, 40);
  if (
    words.length !== puzzle.words.length ||
    words.some((word, i) => word !== puzzle.words[i])
  )
    throw new CodewordError('data');
  return puzzle;
}
export function parseCodewordPuzzleJSON(source: string): CodewordPuzzle {
  return readCodewordPuzzle(parse(source));
}
export function readCodewordProgress(
  value: unknown,
  puzzle: CodewordPuzzle,
): CodewordProgress {
  const data = record(value);
  if (
    data.schemaVersion !== 1 ||
    data.type !== 'codeword-progress' ||
    data.puzzleId !== puzzle.id ||
    !Array.isArray(data.assignments) ||
    data.assignments.length !== puzzle.key.length ||
    Array.from(data.assignments).some(
      (letter, i) =>
        letter !== null &&
        (typeof letter !== 'string' ||
          letter.length !== 1 ||
          !CODEWORD_ALPHABETS[puzzle.alphabet].letters.includes(letter) ||
          !puzzle.key.includes(letter) ||
          puzzle.givens.some((given) => given.code === i + 1)),
    )
  )
    throw new CodewordError('progress');
  return {
    schemaVersion: 1,
    type: 'codeword-progress',
    puzzleId: puzzle.id,
    assignments: [...data.assignments] as (string | null)[],
  };
}
export function parseCodewordProgressJSON(
  source: string,
  puzzle: CodewordPuzzle,
): CodewordProgress {
  return readCodewordProgress(parse(source), puzzle);
}