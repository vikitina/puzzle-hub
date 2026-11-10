import { isSudokuSize } from '../../engines/sudoku/sudoku-config';
import type {
  SudokuGenerationOptions,
  SudokuSize,
} from '../../engines/sudoku/sudoku.types';

const DEFAULT_CLUES: Record<SudokuSize, number> = { 4: 8, 6: 18, 9: 36 };
export interface SudokuSettingsDraft {
  size: SudokuSize;
  targetClues: string;
}

export function createSudokuSettings(size: SudokuSize): SudokuSettingsDraft {
  return { size, targetClues: String(DEFAULT_CLUES[size]) };
}

export function parseSudokuSettings(
  draft: SudokuSettingsDraft,
): SudokuGenerationOptions | null {
  if (!isSudokuSize(draft.size) || draft.targetClues.trim() === '') return null;
  const targetClues = Number(draft.targetClues);
  if (
    !Number.isInteger(targetClues) ||
    targetClues < 0 ||
    targetClues > draft.size ** 2
  )
    return null;
  return { size: draft.size, targetClues };
}