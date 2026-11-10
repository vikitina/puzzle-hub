import type {
  FillwordAlphabet,
  FillwordConfig,
  FillwordDirections,
} from './fillword.types';
import { FillwordError } from './fillword.types';

export const FILLWORD_ALPHABETS = {
  uk: { name: 'Українська', letters: 'АБВГҐДЕЄЖЗИІЇЙКЛМНОПРСТУФХЦЧШЩЬЮЯ' },
  ru: { name: 'Русский', letters: 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ' },
  en: { name: 'English', letters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' },
} as const;

export const FILLWORD_LIMITS = {
  minSide: 2,
  maxSide: 20,
  maxWords: 80,
} as const;
export const FILLWORD_DIRECTION_STEPS: Record<
  FillwordDirections,
  readonly (readonly [number, number])[]
> = {
  'right-down': [
    [0, 1],
    [1, 0],
  ],
  orthogonal: [
    [0, 1],
    [1, 0],
    [0, -1],
    [-1, 0],
  ],
  eight: [
    [0, 1],
    [1, 0],
    [0, -1],
    [-1, 0],
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ],
};

export function isFillwordAlphabet(value: unknown): value is FillwordAlphabet {
  return typeof value === 'string' && Object.hasOwn(FILLWORD_ALPHABETS, value);
}

export function validateFillwordConfig(config: FillwordConfig): void {
  if (
    !Number.isInteger(config.rows) ||
    !Number.isInteger(config.columns) ||
    config.rows < FILLWORD_LIMITS.minSide ||
    config.columns < FILLWORD_LIMITS.minSide ||
    config.rows > FILLWORD_LIMITS.maxSide ||
    config.columns > FILLWORD_LIMITS.maxSide
  ) {
    throw new FillwordError('dimensions');
  }
  if (
    !isFillwordAlphabet(config.alphabet) ||
    (config.mode !== 'snake' && config.mode !== 'straight') ||
    typeof config.directions !== 'string' ||
    !Object.hasOwn(FILLWORD_DIRECTION_STEPS, config.directions) ||
    (config.mode === 'snake' && config.directions !== 'orthogonal')
  ) {
    throw new FillwordError('data');
  }
}