import type { SudokuBoard, SudokuCell, SudokuSize } from './sudoku.types';

const layouts = {
  4: { blockRows: 2, blockColumns: 2 },
  6: { blockRows: 2, blockColumns: 3 },
  9: { blockRows: 3, blockColumns: 3 },
} as const;

export class SudokuRules {
  readonly size: SudokuSize;
  readonly blockRows: number;
  readonly blockColumns: number;

  private readonly values: readonly number[];

  constructor(size: SudokuSize = 9) {
    if (size !== 4 && size !== 6 && size !== 9) {
      throw new RangeError('Поддерживаются размеры 4, 6 и 9.');
    }

    const layout = layouts[size];

    this.size = size;
    this.blockRows = layout.blockRows;
    this.blockColumns = layout.blockColumns;
    this.values = Array.from({ length: size }, (_, index) => index + 1);
  }

  createEmptyBoard(): SudokuCell[] {
    return Array<SudokuCell>(this.size * this.size).fill(null);
  }

  canPlace(board: SudokuBoard, index: number, value: number): boolean {
    this.assertBoard(board);
    this.assertIndex(index);

    if (!Number.isInteger(value) || value < 1 || value > this.size) {
      return false;
    }

    return this.getPeerIndexes(index).every((peerIndex) => board[peerIndex] !== value);
  }

  getCandidates(board: SudokuBoard, index: number): number[] {
    this.assertBoard(board);
    this.assertIndex(index);

    if (board[index] !== null) {
      return [];
    }

    const usedValues = new Set(
      this.getPeerIndexes(index).map((peerIndex) => board[peerIndex]),
    );

    return this.values.filter((value) => !usedValues.has(value));
  }

  getConflicts(board: SudokuBoard): number[] {
    this.assertBoard(board);

    return board.flatMap((value, index) => {
      if (value === null) {
        return [];
      }

      const hasDuplicate = this.getPeerIndexes(index).some(
        (peerIndex) => board[peerIndex] === value,
      );

      return hasDuplicate ? [index] : [];
    });
  }

  isSolved(board: SudokuBoard): boolean {
    this.assertBoard(board);

    return (
      board.every((value) => value !== null) && this.getConflicts(board).length === 0
    );
  }

  private getPeerIndexes(index: number): number[] {
    const row = Math.floor(index / this.size);
    const column = index % this.size;
    const indexes = new Set<number>();

    for (let offset = 0; offset < this.size; offset += 1) {
      indexes.add(row * this.size + offset);
      indexes.add(offset * this.size + column);
    }

    const firstBlockRow = Math.floor(row / this.blockRows) * this.blockRows;
    const firstBlockColumn = Math.floor(column / this.blockColumns) * this.blockColumns;

    for (let rowOffset = 0; rowOffset < this.blockRows; rowOffset += 1) {
      for (let columnOffset = 0; columnOffset < this.blockColumns; columnOffset += 1) {
        const blockIndex =
          (firstBlockRow + rowOffset) * this.size + firstBlockColumn + columnOffset;

        indexes.add(blockIndex);
      }
    }

    indexes.delete(index);

    return [...indexes];
  }

  private assertBoard(board: SudokuBoard): void {
    if (board.length !== this.size * this.size) {
      throw new RangeError('Количество клеток не соответствует размеру поля.');
    }

    for (const value of board) {
      if (
        value !== null &&
        (!Number.isInteger(value) || value < 1 || value > this.size)
      ) {
        throw new TypeError('Клетка должна содержать null или допустимое число.');
      }
    }
  }

  private assertIndex(index: number): void {
    if (!Number.isInteger(index) || index < 0 || index >= this.size * this.size) {
      throw new RangeError('Индекс клетки находится за пределами поля.');
    }
  }
}