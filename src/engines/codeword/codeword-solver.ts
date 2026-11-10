import {
  CODEWORD_ALPHABETS,
  isCodewordAlphabet,
  normalizeCodewordWords,
} from './codeword-input';
import { validateCodewordLayout } from './codeword-layout';
import { toCodewordPublicTask } from './codeword-puzzle';
import type {
  CodewordAnalysis,
  CodewordPublicTask,
  CodewordPuzzle,
} from './codeword.types';
import { CodewordError } from './codeword.types';

export function codewordPattern(values: readonly (string | number)[]): string {
  const seen = new Map<string | number, number>();
  return values
    .map((value) => {
      if (!seen.has(value)) seen.set(value, seen.size);
      return seen.get(value)!;
    })
    .join('.');
}
class CodewordSearchLimit extends Error {}
export class CodewordSolver {
  analyze(
    task: CodewordPublicTask,
    source: readonly string[],
    limits: { maxNodes?: number; maxWork?: number } = {},
  ): CodewordAnalysis {
    const scope = task.wordBank ? 'word-bank' : 'dictionary';
    if (
      !isCodewordAlphabet(task.alphabet) ||
      task.letters.length < 1 ||
      new Set(task.letters).size !== task.letters.length ||
      task.letters.some(
        (letter) =>
          letter.length !== 1 ||
          !CODEWORD_ALPHABETS[task.alphabet].letters.includes(letter),
      ) ||
      Array.from(task.cells).some(
        (code) =>
          code !== null &&
          (!Number.isInteger(code) || code < 1 || code > task.letters.length),
      )
    )
      throw new CodewordError('data');
    const slots = validateCodewordLayout(
      task.rows,
      task.columns,
      task.cells,
    ).map((slot) => slot.path.map((index) => task.cells[index]!));
    const used = [
      ...new Set(task.cells.filter((code): code is number => code !== null)),
    ].sort((a, b) => a - b);
    if (used.length !== task.letters.length) throw new CodewordError('data');
    const dictionary = normalizeCodewordWords(
      task.wordBank ?? source,
      task.alphabet,
      true,
    );
    const maxNodes = limits.maxNodes ?? 20_000,
      maxWork = limits.maxWork ?? 1_500_000;
    if (
      !Number.isInteger(maxNodes) ||
      maxNodes < 1 ||
      !Number.isInteger(maxWork) ||
      maxWork < 1
    )
      throw new CodewordError('data');
    let nodes = 0,
      work = 0;
    const tick = () => {
      work += 1;
      if (work > maxWork) throw new CodewordSearchLimit();
    };
    const mapping = new Map<number, string>(),
      inverse = new Map<string, number>();
    for (const given of task.givens) {
      if (
        !used.includes(given.code) ||
        !task.letters.includes(given.letter) ||
        mapping.has(given.code) ||
        inverse.has(given.letter)
      )
        throw new CodewordError('data');
      mapping.set(given.code, given.letter);
      inverse.set(given.letter, given.code);
    }
    const groups = new Map<string, string[]>();
    for (const word of dictionary) {
      if ([...word].some((letter) => !task.letters.includes(letter))) continue;
      const signature = codewordPattern([...word]);
      groups.set(signature, [...(groups.get(signature) ?? []), word]);
    }
    const candidates = slots.map(
      (codes) => groups.get(codewordPattern(codes)) ?? [],
    );
    const solutions = new Set<string>();
    const visit = (
      map: Map<number, string>,
      reverse: Map<string, number>,
      placed: readonly (string | null)[],
      taken: ReadonlySet<string>,
    ) => {
      if (solutions.size >= 2) return;
      if (nodes >= maxNodes) throw new CodewordSearchLimit();
      nodes += 1;
      let selected = -1;
      let options: string[] | null = null;
      for (let index = 0; index < slots.length; index += 1) {
        if (placed[index] !== null) continue;
        const codes = slots[index]!;
        const valid = candidates[index]!.filter((word) => {
          tick();
          if (task.wordBank && taken.has(word)) return false;
          for (let i = 0; i < codes.length; i += 1) {
            tick();
            const code = codes[i]!,
              letter = word[i]!;
            if (
              (map.has(code) && map.get(code) !== letter) ||
              (reverse.has(letter) && reverse.get(letter) !== code)
            )
              return false;
          }
          return true;
        });
        if (valid.length === 0) return;
        if (options === null || valid.length < options.length) {
          selected = index;
          options = valid;
        }
      }
      if (selected === -1) {
        if (map.size === used.length)
          solutions.add(used.map((code) => map.get(code)).join(''));
        return;
      }
      for (const word of options!) {
        const next = new Map(map),
          nextReverse = new Map(reverse);
        slots[selected]!.forEach((code, i) => {
          next.set(code, word[i]!);
          nextReverse.set(word[i]!, code);
        });
        const words = [...placed];
        words[selected] = word;
        visit(next, nextReverse, words, new Set([...taken, word]));
        if (solutions.size >= 2) return;
      }
    };
    if (
      task.wordBank &&
      (dictionary.length !== slots.length ||
        new Set(task.wordBank).size !== task.wordBank.length)
    )
      return { status: 'none', scope, wordCount: dictionary.length, nodes };
    try {
      visit(
        mapping,
        inverse,
        Array<string | null>(slots.length).fill(null),
        new Set(),
      );
    } catch (error) {
      if (error instanceof CodewordSearchLimit)
        return { status: 'limit', scope, wordCount: dictionary.length, nodes };
      throw error;
    }
    return {
      status:
        solutions.size === 0
          ? 'none'
          : solutions.size === 1
            ? 'unique'
            : 'multiple',
      scope,
      wordCount: dictionary.length,
      nodes,
    };
  }
}
export function analyzeCodewordPuzzle(
  puzzle: CodewordPuzzle,
): CodewordAnalysis {
  if (!puzzle.showWordBank && puzzle.dictionary.length === 0)
    return { status: 'not-checked', scope: 'none', wordCount: 0, nodes: 0 };
  return new CodewordSolver().analyze(
    toCodewordPublicTask(puzzle),
    puzzle.dictionary,
  );
}