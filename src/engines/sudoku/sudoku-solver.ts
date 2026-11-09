import { shuffle } from '../shared/random';
import type { RandomSource } from '../shared/random';
import { SudokuRules } from './sudoku-rules';
import type { SudokuBoard, SudokuSize } from './sudoku.types';

interface EmptyCell {
  index: number;
  candidates: number[];
}

interface SearchResult {
  count: number;
  solution: SudokuBoard | null;
}

export class SudokuSolver {
  private readonly rules: SudokuRules;

  constructor(size: SudokuSize = 9) {
    this.rules = new SudokuRules(size);
  }

  solve(board: SudokuBoard, random?: RandomSource): SudokuBoard | null {
    return this.search(board, 1, random).solution;
  }

  countSolutions(board: SudokuBoard, limit = 2): number {
    if (!Number.isInteger(limit) || limit < 1) {
      throw new RangeError(
        'Лимит должен быть положительным целым числом.',
      );
    }

    return this.search(board, limit).count;
  }

  private search(
    initialBoard: SudokuBoard,
    limit: number,
    random?: RandomSource,
  ): SearchResult {
    if (this.rules.getConflicts(initialBoard).length > 0) {
      return { count: 0, solution: null };
    }

    const board = [...initialBoard];
    const result: SearchResult = { count: 0, solution: null };

    const visit = (): boolean => {
      const emptyCell = this.findBestEmptyCell(board);

      if (emptyCell === null) {
        result.count += 1;
        result.solution ??= [...board];

        return result.count >= limit;
      }

      const candidates = random
        ? shuffle(emptyCell.candidates, random)
        : emptyCell.candidates;

      for (const value of candidates) {
        board[emptyCell.index] = value;

        const shouldStop = visit();

        board[emptyCell.index] = null;

        if (shouldStop) {
          return true;
        }
      }

      return false;
    };

    visit();

    return result;
  }

  private findBestEmptyCell(board: SudokuBoard): EmptyCell | null {
    let bestCell: EmptyCell | null = null;

    for (let index = 0; index < board.length; index += 1) {
      if (board[index] !== null) {
        continue;
      }

      const candidates = this.rules.getCandidates(board, index);
      const cell = { index, candidates };

      if (candidates.length === 0) {
        return cell;
      }

      if (
        bestCell === null ||
        candidates.length < bestCell.candidates.length
      ) {
        bestCell = cell;
      }
    }

    return bestCell;
  }
}
