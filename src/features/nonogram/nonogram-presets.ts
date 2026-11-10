import { createNonogramPuzzle } from '../../engines/nonogram/nonogram-clues';
import type { NonogramPixel } from '../../engines/nonogram/nonogram.types';

export const NONOGRAM_PRESETS = {
  heart: ['01010', '11111', '11111', '01110', '00100'],
  house: [
    '0000110000',
    '0001111000',
    '0011111100',
    '0111111110',
    '1111111111',
    '0011111100',
    '0010011100',
    '0010011100',
    '0011111100',
    '0000000000',
  ],
  tree: [
    '0000110000',
    '0001111000',
    '0011111100',
    '0001111000',
    '0011111100',
    '0111111110',
    '1111111111',
    '0000110000',
    '0000110000',
    '0001111000',
  ],
} as const;
export type NonogramPreset = keyof typeof NONOGRAM_PRESETS;
export function getNonogramPreset(key: NonogramPreset) {
  const lines = NONOGRAM_PRESETS[key];
  return {
    rows: lines.length,
    columns: lines[0].length,
    solution: lines.flatMap((line) =>
      [...line].map((pixel) => Number(pixel) as NonogramPixel),
    ),
  };
}
const heart = getNonogramPreset('heart');
export const demoNonogram = createNonogramPuzzle(
  'demo-nonogram-v1',
  'Nonogram 01',
  heart.rows,
  heart.columns,
  heart.solution,
);