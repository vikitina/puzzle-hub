import { expect, it } from 'vitest';
import { SudokuRules } from '../../engines/sudoku/sudoku-rules';
import { SudokuSolver } from '../../engines/sudoku/sudoku-solver';
import { demoSudoku } from './demo-sudoku';

it('демонстрационная раскладка имеет единственное решение и согласованные исходные числа', () => {
  expect(new SudokuRules(4).isSolved(demoSudoku.solution)).toBe(true);
  expect(new SudokuSolver(4).countSolutions(demoSudoku.initialBoard)).toBe(1);
  demoSudoku.initialBoard.forEach((value, index) => {
    if (value !== null) expect(value).toBe(demoSudoku.solution[index]);
  });
});