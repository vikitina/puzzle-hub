import { shuffle } from '../shared/random';
import type { RandomSource } from '../shared/random';
import { normalizeCodewordWords, validateCodewordSize } from './codeword-input';
import type { CodewordAlphabet, CodewordSlot } from './codeword.types';
import { CodewordError } from './codeword.types';

export function getCodewordSlots<T>(
  rows: number,
  columns: number,
  cells: readonly (T | null)[],
): CodewordSlot[] {
  validateCodewordSize(rows, columns);
  if (cells.length !== rows * columns) throw new CodewordError('grid');
  const slots: CodewordSlot[] = [];
  for (const direction of ['across', 'down'] as const) {
    const outer = direction === 'across' ? rows : columns;
    const inner = direction === 'across' ? columns : rows;
    for (let a = 0; a < outer; a += 1) {
      let path: number[] = [];
      for (let b = 0; b <= inner; b += 1) {
        const index =
          direction === 'across' ? a * columns + b : b * columns + a;
        if (b < inner && cells[index] !== null) path.push(index);
        else {
          if (path.length >= 2) slots.push({ direction, path });
          path = [];
        }
      }
    }
  }
  return slots;
}
export function validateCodewordLayout<T>(
  rows: number,
  columns: number,
  cells: readonly (T | null)[],
): CodewordSlot[] {
  const slots = getCodewordSlots(rows, columns, cells);
  const white = cells.flatMap((cell, index) => (cell === null ? [] : [index]));
  const covered = new Set(slots.flatMap((slot) => [...slot.path]));
  if (
    slots.length < 2 ||
    slots.length > 40 ||
    white.length === 0 ||
    white.some((index) => !covered.has(index))
  )
    throw new CodewordError('grid');
  const seen = new Set<number>([white[0]!]);
  const queue = [white[0]!];
  for (let i = 0; i < queue.length; i += 1) {
    const index = queue[i]!;
    const row = Math.floor(index / columns);
    const col = index % columns;
    for (const [dr, dc] of [
      [0, 1],
      [1, 0],
      [0, -1],
      [-1, 0],
    ] as const) {
      const r = row + dr,
        c = col + dc;
      if (r < 0 || r >= rows || c < 0 || c >= columns) continue;
      const next = r * columns + c;
      if (cells[next] !== null && !seen.has(next)) {
        seen.add(next);
        queue.push(next);
      }
    }
  }
  if (seen.size !== white.length) throw new CodewordError('disconnected');
  return slots;
}

export function generateCodewordLayout(
  rows: number,
  columns: number,
  alphabet: CodewordAlphabet,
  source: readonly string[],
  random: RandomSource = Math.random,
): readonly (string | null)[] {
  validateCodewordSize(rows, columns);
  const words = normalizeCodewordWords(source, alphabet);
  if (words.some((word) => word.length > Math.max(rows, columns)))
    throw new CodewordError('placement');
  const connected = new Set([0]);
  let changed = true;
  while (changed) {
    changed = false;
    words.forEach((word, i) => {
      if (connected.has(i)) return;
      if (
        [...connected].some((j) =>
          [...word].some((letter) => words[j]!.includes(letter)),
        )
      ) {
        connected.add(i);
        changed = true;
      }
    });
  }
  if (connected.size !== words.length) throw new CodewordError('disconnected');
  const cells: (string | null)[] = Array<string | null>(rows * columns).fill(
    null,
  );
  const across = Array<boolean>(cells.length).fill(false);
  const down = Array<boolean>(cells.length).fill(false);
  let attempts = 0;
  interface Candidate {
    path: number[];
    direction: 'across' | 'down';
    crossings: number;
    score: number;
  }
  const candidate = (
    word: string,
    row: number,
    column: number,
    direction: 'across' | 'down',
    first = false,
  ): Candidate | null => {
    const dr = direction === 'down' ? 1 : 0,
      dc = direction === 'across' ? 1 : 0;
    const endRow = row + dr * (word.length - 1),
      endColumn = column + dc * (word.length - 1);
    if (row < 0 || column < 0 || endRow >= rows || endColumn >= columns)
      return null;
    const occupied = (r: number, c: number) =>
      r >= 0 &&
      r < rows &&
      c >= 0 &&
      c < columns &&
      cells[r * columns + c] !== null;
    if (
      occupied(row - dr, column - dc) ||
      occupied(endRow + dr, endColumn + dc)
    )
      return null;
    const path: number[] = [];
    let crossings = 0;
    for (let i = 0; i < word.length; i += 1) {
      const r = row + dr * i,
        c = column + dc * i,
        index = r * columns + c;
      path.push(index);
      if (cells[index] !== null) {
        if (
          cells[index] !== word[i] ||
          (direction === 'across' ? across[index] : down[index])
        )
          return null;
        crossings += 1;
      } else if (occupied(r - dc, c - dr) || occupied(r + dc, c + dr))
        return null;
    }
    if (!first && crossings === 0) return null;
    return {
      path,
      direction,
      crossings,
      score:
        crossings * 100 -
        Math.abs(row + (dr * word.length) / 2 - rows / 2) -
        Math.abs(column + (dc * word.length) / 2 - columns / 2),
    };
  };
  const candidates = (word: string): Candidate[] => {
    const found = new Map<string, Candidate>();
    cells.forEach((letter, index) => {
      if (letter === null) return;
      for (let i = 0; i < word.length; i += 1)
        if (word[i] === letter) {
          const row = Math.floor(index / columns),
            col = index % columns;
          for (const direction of ['across', 'down'] as const) {
            const r = row - (direction === 'down' ? i : 0),
              c = col - (direction === 'across' ? i : 0);
            const choice = candidate(word, r, c, direction);
            if (choice) found.set(`${direction}:${r}:${c}`, choice);
          }
        }
    });
    return shuffle([...found.values()], random).sort(
      (a, b) => b.score - a.score,
    );
  };
  const apply = (word: string, choice: Candidate) => {
    choice.path.forEach((index, i) => {
      cells[index] = word[i]!;
      (choice.direction === 'across' ? across : down)[index] = true;
    });
  };
  const undo = (choice: Candidate) => {
    choice.path.forEach((index) => {
      (choice.direction === 'across' ? across : down)[index] = false;
      if (!across[index] && !down[index]) cells[index] = null;
    });
  };
  const visit = (remaining: readonly string[]): boolean => {
    if (remaining.length === 0) return true;
    const feasible = remaining
      .map((word) => ({ word, choices: candidates(word) }))
      .filter((entry) => entry.choices.length > 0)
      .sort(
        (a, b) =>
          a.choices.length - b.choices.length || b.word.length - a.word.length,
      );
    for (const entry of feasible.slice(0, 2))
      for (const choice of entry.choices) {
        attempts += 1;
        if (attempts > 30_000) return false;
        apply(entry.word, choice);
        if (visit(remaining.filter((word) => word !== entry.word))) return true;
        undo(choice);
      }
    return false;
  };
  const seeds = shuffle(words, random)
    .sort((a, b) => b.length - a.length)
    .slice(0, 3);
  for (const word of seeds)
    for (const direction of shuffle(['across', 'down'] as const, random)) {
      for (const offset of [0, -2, 2, -4, 4]) {
        const row =
          Math.floor((rows - (direction === 'down' ? word.length : 1)) / 2) +
          (direction === 'across' ? offset : 0);
        const column =
          Math.floor(
            (columns - (direction === 'across' ? word.length : 1)) / 2,
          ) + (direction === 'down' ? offset : 0);
        const choice = candidate(word, row, column, direction, true);
        if (!choice) continue;
        apply(word, choice);
        if (visit(words.filter((entry) => entry !== word))) {
          const slots = validateCodewordLayout(rows, columns, cells);
          const actual = slots.map((slot) =>
            slot.path.map((index) => cells[index]).join(''),
          );
          if (
            actual.length !== words.length ||
            new Set(actual).size !== words.length ||
            words.some((entry) => !actual.includes(entry))
          )
            throw new CodewordError('placement');
          return [...cells];
        }
        undo(choice);
        if (attempts > 30_000) throw new CodewordError('placement');
      }
    }
  throw new CodewordError('placement');
}