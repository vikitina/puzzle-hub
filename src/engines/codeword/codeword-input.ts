import type { CodewordAlphabet } from './codeword.types';
import { CodewordError } from './codeword.types';

export const CODEWORD_ALPHABETS = {
  uk: { name: 'Українська', letters: 'АБВГҐДЕЄЖЗИІЇЙКЛМНОПРСТУФХЦЧШЩЬЮЯ' },
  ru: { name: 'Русский', letters: 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ' },
  en: { name: 'English', letters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' },
} as const;
export function isCodewordAlphabet(value: unknown): value is CodewordAlphabet {
  return typeof value === 'string' && Object.hasOwn(CODEWORD_ALPHABETS, value);
}
export function validateCodewordSize(rows: number, columns: number): void {
  if (
    !Number.isInteger(rows) ||
    !Number.isInteger(columns) ||
    rows < 3 ||
    columns < 3 ||
    rows > 25 ||
    columns > 25
  )
    throw new CodewordError('dimensions');
}
export function splitCodewordWords(source: string): string[] {
  return source
    .split(/[,;\n\r]+/u)
    .map((word) => word.trim())
    .filter(Boolean);
}
export function normalizeCodewordWord(
  source: string,
  alphabet: CodewordAlphabet,
): string {
  const word = source.trim().normalize('NFC').toUpperCase();
  if (
    word.length < 2 ||
    word.length > 25 ||
    [...word].some(
      (letter) => !CODEWORD_ALPHABETS[alphabet].letters.includes(letter),
    )
  )
    throw new CodewordError('letters', { word: word.slice(0, 60) });
  return word;
}
export function normalizeCodewordWords(
  source: readonly string[],
  alphabet: CodewordAlphabet,
  dictionary = false,
): string[] {
  const max = dictionary ? 5000 : 40;
  if (source.length > max || (!dictionary && source.length < 2))
    throw new CodewordError(dictionary ? 'dictionary' : 'words');
  const words = source.map((word) => normalizeCodewordWord(word, alphabet));
  if (!dictionary && new Set(words).size !== words.length)
    throw new CodewordError('duplicates');
  return [...new Set(words)];
}
export function parseCodewordRevealedLetters(
  source: string,
  alphabet: CodewordAlphabet,
): string[] {
  const letters = [
    ...source
      .normalize('NFC')
      .toUpperCase()
      .replace(/[,;\s]+/gu, ''),
  ];
  if (
    letters.some(
      (letter) => !CODEWORD_ALPHABETS[alphabet].letters.includes(letter),
    )
  )
    throw new CodewordError('givens');
  return [...new Set(letters)];
}
export function parseCodewordFilledGrid(
  source: string,
  alphabet: CodewordAlphabet,
) {
  const lines = source
    .replaceAll('\r', '')
    .trim()
    .split('\n')
    .map((line) => line.replace(/[ \t]/gu, '').normalize('NFC').toUpperCase())
    .filter(Boolean);
  const rows = lines.length;
  const columns = lines[0]?.length ?? 0;
  validateCodewordSize(rows, columns);
  if (
    lines.some(
      (line) =>
        line.length !== columns ||
        [...line].some(
          (letter) =>
            letter !== '#' &&
            letter !== '.' &&
            !CODEWORD_ALPHABETS[alphabet].letters.includes(letter),
        ),
    )
  )
    throw new CodewordError('grid');
  return {
    rows,
    columns,
    letters: lines.flatMap((line) =>
      [...line].map((letter) =>
        letter === '#' || letter === '.' ? null : letter,
      ),
    ),
  };
}