export const SUDOKU_PRESETS = [
  { size: 4, blockRows: 2, blockColumns: 2 },
  { size: 6, blockRows: 2, blockColumns: 3 },
  { size: 9, blockRows: 3, blockColumns: 3 },
] as const;

export type SudokuSize = (typeof SUDOKU_PRESETS)[number]['size'];
export type SudokuLayout = (typeof SUDOKU_PRESETS)[number];

export function isSudokuSize(value: unknown): value is SudokuSize {
  return SUDOKU_PRESETS.some((preset) => preset.size === value);
}

export function getSudokuLayout(size: SudokuSize): SudokuLayout {
  const layout = SUDOKU_PRESETS.find((preset) => preset.size === size);
  if (!layout) throw new RangeError('Поддерживаются размеры 4, 6 и 9.');
  return layout;
}