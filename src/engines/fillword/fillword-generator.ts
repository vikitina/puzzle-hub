import { shuffle } from '../shared/random';
import type { RandomSource } from '../shared/random';
import {
  FILLWORD_ALPHABETS,
  FILLWORD_DIRECTION_STEPS,
} from './fillword-config';
import { prepareFillwordOptions } from './fillword-input';
import type {
  FillwordConfig,
  FillwordGenerationOptions,
  FillwordPuzzle,
  FillwordWord,
} from './fillword.types';
import { FillwordError } from './fillword.types';

export class FillwordGenerator {
  private readonly random: RandomSource;
  constructor(random: RandomSource = Math.random) {
    this.random = random;
  }

  generate(options: FillwordGenerationOptions): FillwordPuzzle {
    const prepared = prepareFillwordOptions(options);
    const config = prepared.config;
    const cells: (string | null)[] = Array<string | null>(
      config.rows * config.columns,
    ).fill(null);
    const words = prepared.words.map((word, index) => ({
      ...word,
      id: `word-${index + 1}`,
    }));
    const placements = new Map<string, readonly number[]>();

    if (config.mode === 'snake') {
      const path = this.coveringPath(config);
      let offset = 0;
      for (const word of shuffle(words, this.random)) {
        const segment = path.slice(offset, offset + word.text.length);
        segment.forEach((index, letter) => {
          cells[index] = word.text[letter]!;
        });
        placements.set(word.id, segment);
        offset += word.text.length;
      }
    } else {
      const ordered = shuffle(words, this.random).sort(
        (a, b) => b.text.length - a.text.length,
      );
      const candidates = new Map(
        ordered.map((word) => [
          word.id,
          shuffle(this.straightPaths(config, word.text.length), this.random),
        ]),
      );
      let attempts = 0;
      const place = (depth: number): boolean => {
        if (depth === ordered.length) return true;
        const word = ordered[depth]!;
        for (const path of candidates.get(word.id)!) {
          attempts += 1;
          if (attempts > 30_000) return false;
          if (
            path.some(
              (index, letter) =>
                cells[index] !== null && cells[index] !== word.text[letter],
            )
          )
            continue;
          const changed = path.filter((index) => cells[index] === null);
          path.forEach((index, letter) => {
            cells[index] = word.text[letter]!;
          });
          placements.set(word.id, path);
          if (place(depth + 1)) return true;
          changed.forEach((index) => {
            cells[index] = null;
          });
          placements.delete(word.id);
        }
        return false;
      };
      if (!place(0)) throw new FillwordError('placement');
    }

    const alphabet = FILLWORD_ALPHABETS[config.alphabet].letters;
    const complete = cells.map(
      (cell) => cell ?? alphabet[Math.floor(this.random() * alphabet.length)]!,
    );
    const result: FillwordWord[] = words.map((word) => ({
      ...word,
      path: placements.get(word.id)!,
    }));
    return {
      schemaVersion: 1,
      type: 'fillword',
      id: prepared.id,
      title: prepared.title,
      config: { ...config },
      cells: complete,
      words: result,
    };
  }

  private straightPaths(config: FillwordConfig, length: number): number[][] {
    const result: number[][] = [];
    for (let row = 0; row < config.rows; row += 1) {
      for (let column = 0; column < config.columns; column += 1) {
        for (const [dr, dc] of FILLWORD_DIRECTION_STEPS[config.directions]) {
          const endRow = row + dr * (length - 1);
          const endColumn = column + dc * (length - 1);
          if (
            endRow < 0 ||
            endRow >= config.rows ||
            endColumn < 0 ||
            endColumn >= config.columns
          )
            continue;
          result.push(
            Array.from(
              { length },
              (_, i) => (row + dr * i) * config.columns + column + dc * i,
            ),
          );
        }
      }
    }
    return result;
  }

  private coveringPath(config: FillwordConfig): number[] {
    let path: number[] = [];
    const vertical = this.random() < 0.5;
    const outer = vertical ? config.columns : config.rows;
    const inner = vertical ? config.rows : config.columns;
    for (let a = 0; a < outer; a += 1) {
      for (let b = 0; b < inner; b += 1) {
        const value = a % 2 === 0 ? b : inner - b - 1;
        path.push(
          vertical ? value * config.columns + a : a * config.columns + value,
        );
      }
    }
    // Разворот префикса меняет форму пути, сохраняя покрытие и соседство.
    for (let step = 0; step < path.length * 12; step += 1) {
      if (this.random() < 0.5) path.reverse();
      const first = path[0]!;
      const row = Math.floor(first / config.columns);
      const column = first % config.columns;
      const neighbors = FILLWORD_DIRECTION_STEPS.orthogonal.flatMap(
        ([dr, dc]) => {
          const r = row + dr;
          const c = column + dc;
          return r >= 0 && r < config.rows && c >= 0 && c < config.columns
            ? [r * config.columns + c]
            : [];
        },
      );
      const neighbor = neighbors[Math.floor(this.random() * neighbors.length)]!;
      const position = path.indexOf(neighbor);
      if (position > 1)
        path = [...path.slice(0, position).reverse(), ...path.slice(position)];
    }
    return path;
  }
}