import {
  createNonogramLinePatterns,
  validateNonogramSize,
} from './nonogram-clues';
import type {
  NonogramAnalysis,
  NonogramClues,
  NonogramPixel,
  NonogramSolveLimits,
} from './nonogram.types';
import { NonogramError } from './nonogram.types';

class SearchLimit extends Error {}
interface Domains {
  rows: number[][];
  columns: number[][];
}
export class NonogramSolver {
  analyze(
    rowClues: NonogramClues,
    columnClues: NonogramClues,
    limits: NonogramSolveLimits = {},
  ): NonogramAnalysis {
    const rows = rowClues.length;
    const columns = columnClues.length;
    validateNonogramSize(rows, columns);
    const maxNodes = limits.maxNodes ?? 20_000;
    const maxWork = limits.maxWork ?? 2_000_000;
    if (
      !Number.isInteger(maxNodes) ||
      maxNodes < 1 ||
      !Number.isInteger(maxWork) ||
      maxWork < 1
    )
      throw new NonogramError('data');
    let nodes = 0;
    let work = 0;
    const solutions: NonogramPixel[][] = [];
    const state: Domains = {
      rows: rowClues.map((clues) => createNonogramLinePatterns(columns, clues)),
      columns: columnClues.map((clues) =>
        createNonogramLinePatterns(rows, clues),
      ),
    };
    const tick = () => {
      work += 1;
      if (work > maxWork) throw new SearchLimit();
    };
    const propagate = (domains: Domains): boolean => {
      let changed = true;
      while (changed) {
        changed = false;
        for (const axis of ['rows', 'columns'] as const) {
          const other = axis === 'rows' ? 'columns' : 'rows';
          const width = axis === 'rows' ? columns : rows;
          for (let line = 0; line < domains[axis].length; line += 1) {
            const patterns = domains[axis][line]!;
            if (patterns.length === 0) return false;
            let every = (1 << width) - 1;
            let some = 0;
            for (const pattern of patterns) {
              tick();
              every &= pattern;
              some |= pattern;
            }
            for (let offset = 0; offset < width; offset += 1) {
              const bit = 1 << offset;
              const required =
                (every & bit) !== 0 ? 1 : (some & bit) === 0 ? 0 : null;
              if (required === null) continue;
              const previous = domains[other][offset]!;
              const filtered = previous.filter((pattern) => {
                tick();
                return ((pattern >> line) & 1) === required;
              });
              if (filtered.length === 0) return false;
              if (filtered.length !== previous.length) {
                domains[other][offset] = filtered;
                changed = true;
              }
            }
          }
        }
      }
      return true;
    };
    const visit = (domains: Domains) => {
      if (solutions.length >= 2) return;
      if (nodes >= maxNodes) throw new SearchLimit();
      nodes += 1;
      if (!propagate(domains)) return;
      if (domains.rows.every((patterns) => patterns.length === 1)) {
        solutions.push(
          domains.rows.flatMap((patterns) =>
            Array.from(
              { length: columns },
              (_, column) => ((patterns[0]! >> column) & 1) as NonogramPixel,
            ),
          ),
        );
        return;
      }
      let selected: {
        axis: 'rows' | 'columns';
        index: number;
        patterns: number[];
      } | null = null;
      for (const axis of ['rows', 'columns'] as const)
        domains[axis].forEach((patterns, index) => {
          if (
            patterns.length > 1 &&
            (!selected || patterns.length < selected.patterns.length)
          )
            selected = { axis, index, patterns };
        });
      if (!selected) return;
      const choice = selected as {
        axis: 'rows' | 'columns';
        index: number;
        patterns: number[];
      };
      for (const pattern of choice.patterns) {
        const child: Domains = {
          rows: [...domains.rows],
          columns: [...domains.columns],
        };
        child[choice.axis][choice.index] = [pattern];
        visit(child);
        if (solutions.length >= 2) return;
      }
    };
    try {
      visit(state);
    } catch (error) {
      if (error instanceof SearchLimit) return { status: 'limit', nodes };
      throw error;
    }
    if (solutions.length >= 2)
      return { status: 'multiple', solution: solutions[0]!, nodes };
    if (solutions.length === 1)
      return { status: 'unique', solution: solutions[0]!, nodes };
    return { status: 'none', nodes };
  }
}