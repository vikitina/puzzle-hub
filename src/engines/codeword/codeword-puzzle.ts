import { shuffle } from '../shared/random';
import type { RandomSource } from '../shared/random';
import {
  CODEWORD_ALPHABETS,
  isCodewordAlphabet,
  normalizeCodewordWords,
  validateCodewordSize,
} from './codeword-input';
import {
  generateCodewordLayout,
  validateCodewordLayout,
} from './codeword-layout';
import type {
  CodewordGenerationOptions,
  CodewordPublicTask,
  CodewordPuzzle,
  CodewordSettings,
} from './codeword.types';
import { CodewordError } from './codeword.types';

export function codewordAvailableLetters(puzzle: CodewordPuzzle): string[] {
  return [...CODEWORD_ALPHABETS[puzzle.alphabet].letters].filter((letter) =>
    puzzle.key.includes(letter),
  );
}
export function toCodewordPublicTask(
  puzzle: CodewordPuzzle,
): CodewordPublicTask {
  return {
    rows: puzzle.rows,
    columns: puzzle.columns,
    alphabet: puzzle.alphabet,
    cells: [...puzzle.cells],
    givens: puzzle.givens.map((given) => ({ ...given })),
    letters: codewordAvailableLetters(puzzle),
    ...(puzzle.showWordBank ? { wordBank: [...puzzle.words] } : {}),
  };
}
export function createCodewordPuzzle(
  settings: CodewordSettings,
  letters: readonly (string | null)[],
  random: RandomSource = Math.random,
  providedKey?: readonly string[],
): CodewordPuzzle {
  const { rows, columns, alphabet } = settings;
  validateCodewordSize(rows, columns);
  if (!isCodewordAlphabet(alphabet)) throw new CodewordError('alphabet');
  if (!settings.id.trim() || settings.id.length > 100)
    throw new CodewordError('data');
  if (!settings.title.trim() || settings.title.length > 120)
    throw new CodewordError('title');
  if (
    typeof settings.showWordBank !== 'boolean' ||
    typeof settings.requireAllLetters !== 'boolean' ||
    letters.length !== rows * columns ||
    Array.from(letters).some(
      (letter) =>
        letter !== null &&
        (typeof letter !== 'string' ||
          letter.length !== 1 ||
          !CODEWORD_ALPHABETS[alphabet].letters.includes(letter)),
    )
  )
    throw new CodewordError('grid');
  const slots = validateCodewordLayout(rows, columns, letters);
  const words = slots.map((slot) =>
    slot.path.map((index) => letters[index]).join(''),
  );
  normalizeCodewordWords(words, alphabet);
  const available = [...CODEWORD_ALPHABETS[alphabet].letters].filter((letter) =>
    letters.includes(letter),
  );
  if (
    settings.requireAllLetters &&
    available.length !== CODEWORD_ALPHABETS[alphabet].letters.length
  )
    throw new CodewordError('coverage', {
      used: available.length,
      total: CODEWORD_ALPHABETS[alphabet].letters.length,
    });
  const key = providedKey ? [...providedKey] : shuffle(available, random);
  if (
    key.length !== available.length ||
    new Set(key).size !== key.length ||
    key.some((letter) => !available.includes(letter))
  )
    throw new CodewordError('data');
  const explicit = [
    ...new Set(
      settings.revealedLetters.map((letter) =>
        letter.trim().normalize('NFC').toUpperCase(),
      ),
    ),
  ];
  if (
    !Number.isInteger(settings.givenCount) ||
    settings.givenCount < 0 ||
    settings.givenCount > key.length ||
    explicit.length > settings.givenCount ||
    explicit.some(
      (letter) => letter.length !== 1 || !available.includes(letter),
    )
  )
    throw new CodewordError('givens', { max: key.length });
  const revealed = new Set(explicit);
  if (revealed.size < settings.givenCount) {
    const extras = shuffle(
      available.filter((letter) => !revealed.has(letter)),
      random,
    );
    for (const letter of extras) {
      revealed.add(letter);
      if (revealed.size === settings.givenCount) break;
    }
  }
  const givens = key.flatMap((letter, index) =>
    revealed.has(letter) ? [{ code: index + 1, letter }] : [],
  );
  const dictionary = normalizeCodewordWords(
    settings.dictionary,
    alphabet,
    true,
  );
  if (!settings.showWordBank && dictionary.length > 0) {
    const missing = words.find((word) => !dictionary.includes(word));
    if (missing)
      throw new CodewordError('dictionary-missing', { word: missing });
  }
  return {
    schemaVersion: 1,
    type: 'codeword',
    id: settings.id,
    title: settings.title.trim(),
    rows,
    columns,
    alphabet,
    cells: letters.map((letter) =>
      letter === null ? null : key.indexOf(letter) + 1,
    ),
    key,
    givens,
    words,
    dictionary,
    showWordBank: settings.showWordBank,
    requireAllLetters: settings.requireAllLetters,
  };
}
export class CodewordGenerator {
  private readonly random: RandomSource;
  constructor(random: RandomSource = Math.random) {
    this.random = random;
  }
  generate(options: CodewordGenerationOptions): CodewordPuzzle {
    if (!isCodewordAlphabet(options.alphabet))
      throw new CodewordError('alphabet');
    const words = normalizeCodewordWords(options.words, options.alphabet);
    const used = new Set([...words.join('')]);
    if (
      options.requireAllLetters &&
      used.size !== CODEWORD_ALPHABETS[options.alphabet].letters.length
    )
      throw new CodewordError('coverage', {
        used: used.size,
        total: CODEWORD_ALPHABETS[options.alphabet].letters.length,
      });
    const letters = generateCodewordLayout(
      options.rows,
      options.columns,
      options.alphabet,
      options.words,
      this.random,
    );
    return createCodewordPuzzle(options, letters, this.random);
  }
}
export function reviseCodewordPuzzle(
  puzzle: CodewordPuzzle,
  settings: CodewordSettings,
  random: RandomSource = Math.random,
): CodewordPuzzle {
  if (settings.alphabet !== puzzle.alphabet)
    throw new CodewordError('alphabet');
  return createCodewordPuzzle(
    { ...settings, rows: puzzle.rows, columns: puzzle.columns },
    puzzle.cells.map((code) => (code === null ? null : puzzle.key[code - 1]!)),
    random,
    puzzle.key,
  );
}