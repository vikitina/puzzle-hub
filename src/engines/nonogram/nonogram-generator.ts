import type { RandomSource } from '../shared/random';
import { createNonogramPuzzle, validateNonogramSize } from './nonogram-clues';
import { NonogramSolver } from './nonogram-solver';
import type {
  NonogramGenerated,
  NonogramGenerationOptions,
  NonogramPixel,
} from './nonogram.types';
import { NonogramError } from './nonogram.types';

export class NonogramGenerator {
  private readonly random: RandomSource;
  constructor(random: RandomSource = Math.random) {
    this.random = random;
  }
  generate(options: NonogramGenerationOptions): NonogramGenerated {
    validateNonogramSize(options.rows, options.columns);
    if (
      !Number.isFinite(options.density) ||
      options.density < 0.2 ||
      options.density > 0.8
    )
      throw new NonogramError('density');
    if (typeof options.symmetric !== 'boolean') throw new NonogramError('data');
    const solver = new NonogramSolver();
    for (let attempt = 0; attempt < 24; attempt += 1) {
      const solution: NonogramPixel[] = Array<NonogramPixel>(
        options.rows * options.columns,
      ).fill(0);
      const width = options.symmetric
        ? Math.ceil(options.columns / 2)
        : options.columns;
      for (let row = 0; row < options.rows; row += 1)
        for (let column = 0; column < width; column += 1) {
          const value = this.random();
          if (!Number.isFinite(value) || value < 0 || value >= 1)
            throw new NonogramError('data');
          const pixel = value < options.density ? 1 : 0;
          solution[row * options.columns + column] = pixel;
          if (options.symmetric)
            solution[row * options.columns + options.columns - column - 1] =
              pixel;
        }
      if (
        solution.every((pixel) => pixel === 0) ||
        solution.every((pixel) => pixel === 1)
      )
        continue;
      const puzzle = createNonogramPuzzle(
        options.id,
        options.title,
        options.rows,
        options.columns,
        solution,
      );
      // Однозначность проверяется без предположения о симметрии.
      const analysis = solver.analyze(puzzle.rowClues, puzzle.columnClues);
      if (analysis.status === 'unique') return { puzzle, analysis };
    }
    throw new NonogramError('generation');
  }
}