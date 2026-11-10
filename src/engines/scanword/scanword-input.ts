import type {
  ScanwordAlphabet,
  ScanwordDictionaryEntry,
} from './scanword.types';
import { ScanwordError } from './scanword.types';
export const SCANWORD_ALPHABETS = {
  uk: { name: 'Українська', letters: 'АБВГҐДЕЄЖЗИІЇЙКЛМНОПРСТУФХЦЧШЩЬЮЯ' },
  en: { name: 'English', letters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' },
  ru: { name: 'Русский', letters: 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ' },
} as const;
export function isScanwordAlphabet(value: unknown): value is ScanwordAlphabet {
  return typeof value === 'string' && Object.hasOwn(SCANWORD_ALPHABETS, value);
}
export function validateScanwordSize(rows: number, columns: number): void {
  if (
    !Number.isInteger(rows) ||
    !Number.isInteger(columns) ||
    rows < 4 ||
    columns < 4 ||
    rows > 20 ||
    columns > 20
  )
    throw new ScanwordError('dimensions');
}
export function normalizeScanwordAnswer(
  source: string,
  alphabet: ScanwordAlphabet,
): string {
  const word = source.trim().normalize('NFC').toUpperCase();
  if (
    word.length < 2 ||
    word.length > 20 ||
    [...word].some(
      (letter) => !SCANWORD_ALPHABETS[alphabet].letters.includes(letter),
    )
  )
    throw new ScanwordError('word', { word: word.slice(0, 30) });
  return word;
}
export function normalizeScanwordClue(source: string): string {
  const clue = source.trim().normalize('NFC').replace(/\s+/gu, ' ');
  if (
    !clue ||
    [...clue].length > 40 ||
    /[\u0000-\u001f\u007f|\ud800-\udfff]/u.test(clue)
  )
    throw new ScanwordError('clue');
  return clue;
}
export function normalizeScanwordDictionary(
  source: readonly ScanwordDictionaryEntry[],
  alphabet: ScanwordAlphabet,
): ScanwordDictionaryEntry[] {
  if (!isScanwordAlphabet(alphabet)) throw new ScanwordError('options');
  if (source.length < 2 || source.length > 200)
    throw new ScanwordError('dictionary');
  const result = source.map((entry) => ({
    answer: normalizeScanwordAnswer(entry.answer, alphabet),
    clue: normalizeScanwordClue(entry.clue),
  }));
  const seen = new Set<string>();
  for (const entry of result) {
    if (seen.has(entry.answer))
      throw new ScanwordError('duplicate', { word: entry.answer });
    seen.add(entry.answer);
  }
  return result;
}
export function parseScanwordDictionary(
  source: string,
  alphabet: ScanwordAlphabet,
): ScanwordDictionaryEntry[] {
  if (source.length > 20000) throw new ScanwordError('dictionary');
  const entries: ScanwordDictionaryEntry[] = [];
  source
    .replaceAll('\r', '')
    .split('\n')
    .forEach((line, index) => {
      if (!line.trim()) return;
      const pieces = line.split(/[|\t]/u);
      if (pieces.length !== 2 || !pieces[0]?.trim() || !pieces[1]?.trim())
        throw new ScanwordError('line', { line: index + 1 });
      try {
        entries.push({
          answer: normalizeScanwordAnswer(pieces[0], alphabet),
          clue: normalizeScanwordClue(pieces[1]),
        });
      } catch (error) {
        if (error instanceof ScanwordError)
          throw new ScanwordError(error.code, {
            ...error.values,
            line: index + 1,
          });
        throw error;
      }
    });
  return normalizeScanwordDictionary(entries, alphabet);
}
export function formatScanwordDictionary(
  entries: readonly ScanwordDictionaryEntry[],
): string {
  return entries.map((entry) => `${entry.answer} | ${entry.clue}`).join('\n');
}