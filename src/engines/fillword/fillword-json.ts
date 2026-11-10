import {
  FILLWORD_ALPHABETS,
  FILLWORD_LIMITS,
  validateFillwordConfig,
} from './fillword-config';
import { normalizeFillwordWord } from './fillword-input';
import {
  createFillwordProgress,
  isFillwordPath,
  matchFillwordSelection,
} from './fillword-rules';
import type {
  FillwordConfig,
  FillwordProgress,
  FillwordPuzzle,
  FillwordWord,
} from './fillword.types';
import { FillwordError } from './fillword.types';

function record(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    throw new FillwordError('data');
  return value as Record<string, unknown>;
}

function string(value: unknown, max: number): string {
  if (typeof value !== 'string' || value.trim() === '' || value.length > max)
    throw new FillwordError('data');
  return value;
}

function numbers(value: unknown): number[] {
  if (
    !Array.isArray(value) ||
    value.length > 400 ||
    value.some((entry) => typeof entry !== 'number' || !Number.isInteger(entry))
  )
    throw new FillwordError('data');
  return value as number[];
}

function parse(source: string): unknown {
  if (source.length > 1_000_000) throw new FillwordError('data');
  try {
    return JSON.parse(source) as unknown;
  } catch {
    throw new FillwordError('data');
  }
}

export function readFillwordPuzzle(value: unknown): FillwordPuzzle {
  const data = record(value);
  if (data.schemaVersion !== 1) throw new FillwordError('version');
  if (data.type !== 'fillword') throw new FillwordError('data');
  const rawConfig = record(data.config);
  const config = {
    rows: rawConfig.rows,
    columns: rawConfig.columns,
    alphabet: rawConfig.alphabet,
    mode: rawConfig.mode,
    directions: rawConfig.directions,
  } as FillwordConfig;
  validateFillwordConfig(config);
  const count = config.rows * config.columns;
  const allowed = new Set<string>(FILLWORD_ALPHABETS[config.alphabet].letters);
  if (
    !Array.isArray(data.cells) ||
    data.cells.length !== count ||
    data.cells.some(
      (cell) =>
        typeof cell !== 'string' || cell.length !== 1 || !allowed.has(cell),
    )
  )
    throw new FillwordError('data');
  const cells = [...data.cells] as string[];
  if (
    !Array.isArray(data.words) ||
    data.words.length < 1 ||
    data.words.length > FILLWORD_LIMITS.maxWords
  )
    throw new FillwordError('data');
  const words: FillwordWord[] = data.words.map((value) => {
    const word = record(value);
    const label = string(word.label, 800);
    const text = string(word.text, 400);
    if (normalizeFillwordWord(label, config.alphabet).text !== text)
      throw new FillwordError('data');
    const path = numbers(word.path);
    if (
      path.length !== text.length ||
      !isFillwordPath(config, path) ||
      path.map((index) => cells[index]).join('') !== text
    )
      throw new FillwordError('data');
    return { id: string(word.id, 100), label, text, path: [...path] };
  });
  if (
    new Set(words.map((word) => word.id)).size !== words.length ||
    new Set(words.map((word) => word.text)).size !== words.length
  )
    throw new FillwordError('duplicates');
  if (config.mode === 'snake') {
    const used = words.flatMap((word) => [...word.path]);
    if (used.length !== count || new Set(used).size !== count)
      throw new FillwordError('data');
  }
  return {
    schemaVersion: 1,
    type: 'fillword',
    id: string(data.id, 100),
    title: string(data.title, 120),
    config,
    cells,
    words,
  };
}

export function parseFillwordPuzzleJSON(source: string): FillwordPuzzle {
  return readFillwordPuzzle(parse(source));
}

export function readFillwordProgress(
  value: unknown,
  puzzle: FillwordPuzzle,
): FillwordProgress {
  try {
    const data = record(value);
    if (
      data.schemaVersion !== 1 ||
      data.type !== 'fillword-progress' ||
      data.puzzleId !== puzzle.id ||
      !Array.isArray(data.found) ||
      data.found.length > puzzle.words.length
    )
      throw new FillwordError('progress');
    let progress = createFillwordProgress(puzzle);
    for (const value of data.found) {
      const found = record(value);
      const match = matchFillwordSelection(
        puzzle,
        progress,
        numbers(found.path),
        string(found.wordId, 100),
      );
      if (match.wordId !== found.wordId) throw new FillwordError('progress');
      progress = { ...progress, found: [...progress.found, match] };
    }
    return progress;
  } catch {
    throw new FillwordError('progress');
  }
}

export function parseFillwordProgressJSON(
  source: string,
  puzzle: FillwordPuzzle,
): FillwordProgress {
  return readFillwordProgress(parse(source), puzzle);
}