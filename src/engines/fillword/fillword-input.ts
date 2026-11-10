import {
  FILLWORD_ALPHABETS,
  FILLWORD_LIMITS,
  validateFillwordConfig,
} from './fillword-config';
import type {
  FillwordAlphabet,
  FillwordGenerationOptions,
} from './fillword.types';
import { FillwordError } from './fillword.types';

export function normalizeFillwordWord(
  source: string,
  alphabet: FillwordAlphabet,
): { label: string; text: string } {
  const label = source.trim().normalize('NFC').toUpperCase();
  const text = label.replace(/['’ʼ-]/gu, '');
  const allowed = new Set<string>(FILLWORD_ALPHABETS[alphabet].letters);
  if (
    label.length > 800 ||
    text.length < 2 ||
    text.length > 400 ||
    [...text].some((letter) => !allowed.has(letter))
  ) {
    throw new FillwordError('letters', { word: label.slice(0, 60) });
  }
  return { label, text };
}

export function splitFillwordWords(source: string): string[] {
  return source
    .split(/[,;\n\r]+/u)
    .map((word) => word.trim())
    .filter(Boolean);
}

export function prepareFillwordOptions(options: FillwordGenerationOptions) {
  validateFillwordConfig(options.config);
  if (
    !options.id.trim() ||
    options.id.length > 100 ||
    !options.title.trim() ||
    options.title.length > 120
  ) {
    throw new FillwordError('data');
  }
  if (
    options.words.length < 1 ||
    options.words.length > FILLWORD_LIMITS.maxWords
  ) {
    throw new FillwordError('words');
  }
  const words = options.words.map((word) =>
    normalizeFillwordWord(word, options.config.alphabet),
  );
  if (new Set(words.map((word) => word.text)).size !== words.length)
    throw new FillwordError('duplicates');
  const letters = words.reduce((sum, word) => sum + word.text.length, 0);
  const cells = options.config.rows * options.config.columns;
  if (options.config.mode === 'snake' && letters !== cells) {
    throw new FillwordError('full-coverage', { letters, cells });
  }
  if (
    options.config.mode === 'straight' &&
    words.some(
      (word) =>
        word.text.length >
        Math.max(options.config.rows, options.config.columns),
    )
  ) {
    throw new FillwordError('word-too-long');
  }
  return { ...options, title: options.title.trim(), words };
}