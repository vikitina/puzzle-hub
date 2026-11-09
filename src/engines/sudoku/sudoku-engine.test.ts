import { describe, expect, it } from 'vitest';
import { SudokuGenerator } from './sudoku-generator';
import { SudokuRules } from './sudoku-rules';
import { SudokuSolver } from './sudoku-solver';

describe('SudokuSolver', () => {
  it('решает судоку 9 × 9, сохраняет исходные числа и не меняет вход', () => {
    const board = Object.freeze([
      5, 3, null, null, 7, null, null, null, null,
      6, null, null, 1, 9, 5, null, null, null,
      null, 9, 8, null, null, null, null, 6, null,
      8, null, null, null, 6, null, null, null, 3,
      4, null, null, 8, null, 3, null, null, 1,
      7, null, null, null, 2, null, null, null, 6,
      null, 6, null, null, null, null, 2, 8, null,
      null, null, null, 4, 1, 9, null, null, 5,
      null, null, null, null, 8, null, null, 7, 9,
    ]);

    const solver = new SudokuSolver(9);
    const solution = solver.solve(board);

    if (solution === null) {
      throw new Error('Ожидалось решение.');
    }

    expect(new SudokuRules(9).isSolved(solution)).toBe(true);
    expect(solver.countSolutions(board)).toBe(1);

    board.forEach((value, index) => {
      if (value !== null) {
        expect(solution[index]).toBe(value);
      }
    });
  });

  it('возвращает отсутствие решения для поля с конфликтом', () => {
    const board = new SudokuRules(4).createEmptyBoard();
    board[0] = 1;
    board[1] = 1;

    const solver = new SudokuSolver(4);

    expect(solver.solve(board)).toBeNull();
    expect(solver.countSolutions(board)).toBe(0);
  });

  it('распознаёт неразрешимое поле без прямых конфликтов', () => {
    const board = [
      1, 2, 3, null,
      null, null, null, 4,
      null, null, null, null,
      null, null, null, null,
    ];

    expect(new SudokuRules(4).getConflicts(board)).toEqual([]);

    const solver = new SudokuSolver(4);

    expect(solver.solve(board)).toBeNull();
    expect(solver.countSolutions(board)).toBe(0);
  });

  it('останавливает подсчёт на указанном лимите', () => {
    const board = new SudokuRules(4).createEmptyBoard();
    const solver = new SudokuSolver(4);

    expect(solver.countSolutions(board, 1)).toBe(1);
    expect(solver.countSolutions(board, 2)).toBe(2);
    expect(solver.countSolutions(board, 3)).toBe(3);
  });

  it('отклоняет некорректный лимит', () => {
    const board = new SudokuRules(4).createEmptyBoard();

    expect(() =>
      new SudokuSolver(4).countSolutions(board, 0),
    ).toThrow(RangeError);
  });
});

describe('SudokuGenerator', () => {
  it.each([4, 6, 9] as const)(
    'генерирует корректное поле со стороной %s',
    (size) => {
      const targetClues = Math.ceil((size * size) / 2);
      const generator = new SudokuGenerator(() => 0.5);
      const result = generator.generate({ size, targetClues });
      const { puzzle } = result;

      const actualClues = puzzle.initialBoard.filter(
        (value) => value !== null,
      ).length;

      expect(
        new SudokuRules(size).isSolved(puzzle.solution),
      ).toBe(true);

      expect(
        new SudokuSolver(size).countSolutions(
          puzzle.initialBoard,
        ),
      ).toBe(1);

      expect(result.actualClues).toBe(actualClues);
      expect(actualClues).toBeGreaterThanOrEqual(targetClues);
      expect(result.targetReached).toBe(
        actualClues === targetClues,
      );

      puzzle.initialBoard.forEach((value, index) => {
        if (value !== null) {
          expect(puzzle.solution[index]).toBe(value);
        }
      });
    },
  );

  it('сохраняет все числа, если запрошено полностью открытое поле', () => {
    const result = new SudokuGenerator(() => 0.5).generate({
      size: 4,
      targetClues: 16,
    });

    expect(result.puzzle.initialBoard).toEqual(
      result.puzzle.solution,
    );

    expect(result.actualClues).toBe(16);
    expect(result.targetReached).toBe(true);
  });

  it('сообщает о недостигнутой цели и сохраняет единственное решение', () => {
    const result = new SudokuGenerator(() => 0.5).generate({
      size: 4,
      targetClues: 0,
    });

    expect(result.targetReached).toBe(false);
    expect(result.actualClues).toBeGreaterThan(0);

    expect(
      new SudokuSolver(4).countSolutions(
        result.puzzle.initialBoard,
      ),
    ).toBe(1);
  });

  it.each([-1, 17, 1.5, Number.NaN])(
    'отклоняет неправильное число подсказок %s',
    (targetClues) => {
      expect(() =>
        new SudokuGenerator().generate({
          size: 4,
          targetClues,
        }),
      ).toThrow(RangeError);
    },
  );
});