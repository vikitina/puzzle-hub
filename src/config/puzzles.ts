import type { TranslationKey } from '../i18n/types';

interface PuzzleDefinition {
  id: string;
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
  available: boolean;
}

export const PUZZLES = [
  {
    id: 'sudoku',
    titleKey: 'navigation.sudoku',
    descriptionKey: 'puzzles.sudoku',
    available: true,
  },
  {
    id: 'nonogram',
    titleKey: 'navigation.nonogram',
    descriptionKey: 'puzzles.nonogram',
    available: true,
  },
  {
    id: 'word-search',
    titleKey: 'navigation.wordSearch',
    descriptionKey: 'puzzles.wordSearch',
    available: true,
  },
  {
    id: 'codeword',
    titleKey: 'navigation.codeword',
    descriptionKey: 'puzzles.codeword',
    available: false,
  },
  {
    id: 'scanword',
    titleKey: 'navigation.scanword',
    descriptionKey: 'puzzles.scanword',
    available: false,
  },
] as const satisfies readonly PuzzleDefinition[];