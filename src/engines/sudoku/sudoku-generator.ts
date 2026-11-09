import { shuffle } from '../shared/random';
import type { RandomSource } from '../shared/random';
import { SudokuRules } from './sudoku-rules';
import { SudokuSolver } from './sudoku-solver';
import type { SudokuGenerationOptions, SudokuGenerationResult } from './sudoku.types';

export class SudokuGenerator {
  private readonly random: RandomSource;

  constructor(random: RandomSource = Math.random) {
    this.random = random;
  }

  generate(options: SudokuGenerationOptions): SudokuGenerationResult {
    const { size, targetClues } = options;
    const rules = new SudokuRules(size);
    const totalCells = size * size;

    if (!Number.isInteger(targetClues) || targetClues < 0 || targetClues > totalCells) {
      throw new RangeError(
        'Количество открытых клеток должно быть целым числом от 0 до количества клеток поля.',
      );
    }

    const solver = new SudokuSolver(size);
    const solution = solver.solve(rules.createEmptyBoard(), this.random);

    if (solution === null) {
      throw new Error('Не удалось построить заполненное поле судоку.');
    }

    const board = [...solution];
    const indexes = shuffle(
      Array.from({ length: totalCells }, (_, index) => index),
      this.random,
    );

    let actualClues = totalCells;

    for (const index of indexes) {
      if (actualClues === targetClues) {
        break;
      }

      const previousValue = board[index] ?? null;
      board[index] = null;

      if (solver.countSolutions(board, 2) === 1) {
        actualClues -= 1;
      } else {
        board[index] = previousValue;
      }
    }

    return {
      puzzle: { size, initialBoard: board, solution },
      targetClues,
      actualClues,
      targetReached: actualClues === targetClues,
    };
  }
}