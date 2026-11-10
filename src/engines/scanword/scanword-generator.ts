import { shuffle } from '../shared/random';
import type { RandomSource } from '../shared/random';
import { layoutScanwordClue } from './scanword-clues';
import {
  normalizeScanwordDictionary,
  validateScanwordSize,
} from './scanword-input';
import {
  chooseScanwordGivens,
  validateScanwordPuzzle,
} from './scanword-puzzle';
import type {
  ScanwordDirection,
  ScanwordEntry,
  ScanwordGenerationOptions,
  ScanwordPuzzle,
} from './scanword.types';
import { ScanwordError } from './scanword.types';
export class ScanwordGenerator {
  private readonly random: RandomSource;
  constructor(random: RandomSource = Math.random) {
    this.random = random;
  }
  generate(options: ScanwordGenerationOptions): ScanwordPuzzle {
    validateScanwordSize(options.rows, options.columns);
    const dictionary = normalizeScanwordDictionary(
      options.dictionary,
      options.alphabet,
    );
    const target = options.useAll ? dictionary.length : options.wordCount;
    if (
      typeof options.useAll !== 'boolean' ||
      !Number.isInteger(target) ||
      target < 2 ||
      target > 40 ||
      target > dictionary.length ||
      ![1, 2].includes(options.maxCluesPerCell)
    )
      throw new ScanwordError('options');
    const words = shuffle(dictionary, this.random).filter(
      (entry) => entry.answer.length < Math.max(options.rows, options.columns),
    );
    if (
      words.length < target ||
      (options.useAll && words.length !== dictionary.length)
    )
      throw new ScanwordError('placement');
    if (options.useAll) {
      const connected = new Set([0]);
      let grew = true;
      while (grew) {
        grew = false;
        words.forEach((word, i) => {
          if (
            !connected.has(i) &&
            [...connected].some((j) =>
              [...word.answer].some((letter) =>
                words[j]!.answer.includes(letter),
              ),
            )
          ) {
            connected.add(i);
            grew = true;
          }
        });
      }
      if (connected.size !== words.length)
        throw new ScanwordError('disconnected');
    }
    const { rows, columns } = options;
    const cells = Array<string | null>(rows * columns).fill(null);
    const horizontal = Array<boolean>(cells.length).fill(false),
      vertical = Array<boolean>(cells.length).fill(false);
    const anchors = new Map<number, ScanwordEntry[]>();
    let attempts = 0,
      work = 0;
    interface Candidate {
      path: number[];
      clueIndex: number;
      direction: ScanwordDirection;
      score: number;
    }
    const candidate = (
      answer: string,
      clue: string,
      row: number,
      col: number,
      direction: ScanwordDirection,
      first = false,
    ): Candidate | null => {
      if (++work > 3_000_000) throw new ScanwordError('placement');
      const dr = direction === 'down' ? 1 : 0,
        dc = direction === 'across' ? 1 : 0;
      const er = row + dr * (answer.length - 1),
        ec = col + dc * (answer.length - 1);
      const cr = row - dr,
        cc = col - dc;
      if (row < 0 || col < 0 || er >= rows || ec >= columns || cr < 0 || cc < 0)
        return null;
      const clueIndex = cr * columns + cc;
      if (cells[clueIndex] !== null) return null;
      const siblings = anchors.get(clueIndex) ?? [];
      if (
        siblings.length >= options.maxCluesPerCell ||
        siblings.some((entry) => entry.direction === direction) ||
        ![...siblings.map((entry) => entry.clue), clue].every((text) =>
          layoutScanwordClue(text, siblings.length + 1),
        )
      )
        return null;
      const occupied = (r: number, c: number) =>
        r >= 0 &&
        r < rows &&
        c >= 0 &&
        c < columns &&
        cells[r * columns + c] !== null;
      if (occupied(er + dr, ec + dc)) return null;
      const path: number[] = [];
      let crossings = 0;
      for (let i = 0; i < answer.length; i += 1) {
        const r = row + dr * i,
          c = col + dc * i,
          index = r * columns + c;
        path.push(index);
        if (anchors.has(index)) return null;
        if (cells[index] !== null) {
          if (
            cells[index] !== answer[i] ||
            (direction === 'across' ? horizontal[index] : vertical[index])
          )
            return null;
          crossings += 1;
        } else if (
          direction === 'across'
            ? occupied(r - 1, c) || occupied(r + 1, c)
            : occupied(r, c - 1) || occupied(r, c + 1)
        )
          return null;
      }
      if (!first && crossings === 0) return null;
      return {
        path,
        clueIndex,
        direction,
        score:
          crossings * 100 -
          Math.abs(row + er - rows + 1) -
          Math.abs(col + ec - columns + 1),
      };
    };
    const place = (
      wordIndex: number,
      value: Candidate,
      placed: readonly ScanwordEntry[],
    ): ScanwordEntry[] => {
      const word = words[wordIndex]!;
      const entry: ScanwordEntry = {
        ...word,
        id: `e${placed.length + 1}`,
        direction: value.direction,
        clueIndex: value.clueIndex,
        path: value.path,
      };
      entry.path.forEach((index, i) => {
        cells[index] = word.answer[i]!;
        (entry.direction === 'across' ? horizontal : vertical)[index] = true;
      });
      anchors.set(entry.clueIndex, [
        ...(anchors.get(entry.clueIndex) ?? []),
        entry,
      ]);
      return [...placed, entry];
    };
    const unplace = (entry: ScanwordEntry) => {
      const list = anchors
        .get(entry.clueIndex)!
        .filter((item) => item.id !== entry.id);
      if (list.length) anchors.set(entry.clueIndex, list);
      else anchors.delete(entry.clueIndex);
      entry.path.forEach((index) => {
        (entry.direction === 'across' ? horizontal : vertical)[index] = false;
        if (!horizontal[index] && !vertical[index]) cells[index] = null;
      });
    };
    const search = (
      placed: readonly ScanwordEntry[],
      remaining: readonly number[],
    ): readonly ScanwordEntry[] | null => {
      if (placed.length === target) return placed;
      if (++attempts > 30_000) throw new ScanwordError('placement');
      const choices: { wordIndex: number; candidates: Candidate[] }[] = [];
      for (const wordIndex of remaining) {
        const word = words[wordIndex]!,
          choicesForWord = new Map<string, Candidate>();
        cells.forEach((letter, index) => {
          if (letter === null) return;
          for (let i = 0; i < word.answer.length; i += 1) {
            if (word.answer[i] !== letter) continue;
            for (const direction of ['across', 'down'] as const) {
              const value = candidate(
                word.answer,
                word.clue,
                Math.floor(index / columns) - (direction === 'down' ? i : 0),
                (index % columns) - (direction === 'across' ? i : 0),
                direction,
              );
              if (value)
                choicesForWord.set(`${direction}:${value.path[0]}`, value);
            }
          }
        });
        if (choicesForWord.size)
          choices.push({
            wordIndex,
            candidates: shuffle([...choicesForWord.values()], this.random).sort(
              (a, b) => b.score - a.score,
            ),
          });
      }
      choices.sort(
        (a, b) =>
          a.candidates.length - b.candidates.length ||
          words[b.wordIndex]!.answer.length - words[a.wordIndex]!.answer.length,
      );
      for (const choice of choices.slice(0, 3)) {
        for (const value of choice.candidates) {
          const next = place(choice.wordIndex, value, placed);
          const result = search(
            next,
            remaining.filter((index) => index !== choice.wordIndex),
          );
          if (result) return result;
          unplace(next.at(-1)!);
        }
      }
      return null;
    };
    const seeds = words
      .map((_, index) => index)
      .sort((a, b) => words[b]!.answer.length - words[a]!.answer.length)
      .slice(0, 4);
    for (const seed of seeds) {
      const word = words[seed]!;
      for (const direction of shuffle(
        ['across', 'down'] as const,
        this.random,
      )) {
        for (const offset of [0, -2, 2, -4, 4]) {
          const row =
            direction === 'across'
              ? Math.floor(rows / 2) + offset
              : Math.max(1, Math.floor((rows - word.answer.length) / 2));
          const col =
            direction === 'down'
              ? Math.floor(columns / 2) + offset
              : Math.max(1, Math.floor((columns - word.answer.length) / 2));
          const value = candidate(
            word.answer,
            word.clue,
            row,
            col,
            direction,
            true,
          );
          if (!value) continue;
          const first = place(seed, value, []);
          const result = search(
            first,
            words.map((_, index) => index).filter((index) => index !== seed),
          );
          if (result)
            return validateScanwordPuzzle({
              schemaVersion: 1,
              type: 'scanword',
              id: options.id,
              title: options.title.trim(),
              rows,
              columns,
              alphabet: options.alphabet,
              maxCluesPerCell: options.maxCluesPerCell,
              cells: [...cells],
              entries: result,
              givens: chooseScanwordGivens(
                cells,
                options.givenCount,
                this.random,
              ),
            });
          unplace(first[0]!);
        }
      }
    }
    throw new ScanwordError('placement');
  }
}