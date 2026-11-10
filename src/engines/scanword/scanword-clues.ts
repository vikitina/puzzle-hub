import type { ScanwordEntry, ScanwordPuzzle } from './scanword.types';
export const SCANWORD_CELL = 96;
export interface ScanwordClueLayout {
  readonly fontSize: number;
  readonly lineHeight: number;
  readonly lines: readonly string[];
}
function characterUnits(character: string): number {
  if (/\p{Mark}/u.test(character) || character === '\u200d') return 0;
  return character.codePointAt(0)! >= 0x2e80 ||
    /\p{Extended_Pictographic}/u.test(character)
    ? 2
    : 1;
}
function units(value: string): number {
  return [...value].reduce(
    (sum, character) => sum + characterUnits(character),
    0,
  );
}
export function wrapScanwordText(text: string, max: number): string[] {
  if (!Number.isInteger(max) || max < 2)
    throw new RangeError('Text line width');
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/u)) {
    let rest = word;
    if (line && units(line) + units(rest) + 1 > max) {
      lines.push(line);
      line = '';
    }
    while (units(rest) > max) {
      const characters = [...rest];
      let length = 0,
        width = 0;
      for (const character of characters) {
        if (width + characterUnits(character) > max) break;
        width += characterUnits(character);
        length += 1;
      }
      lines.push(characters.slice(0, length).join(''));
      rest = characters.slice(length).join('');
    }
    line += `${line ? ' ' : ''}${rest}`;
  }
  if (line) lines.push(line);
  return lines;
}
export function layoutScanwordClue(
  clue: string,
  count: number,
): ScanwordClueLayout | null {
  const height = SCANWORD_CELL / count - 20;
  for (const allowWordBreak of [false, true]) {
    for (const fontSize of [20, 18, 16, 14, 13, 12, 11]) {
      const lineHeight = fontSize * 1.15;
      const max = Math.floor((SCANWORD_CELL - 12) / (fontSize * 0.64));
      if (
        !allowWordBreak &&
        clue.split(/\s+/u).some((word) => units(word) > max)
      )
        continue;
      const lines = wrapScanwordText(clue, max);
      if (lines.length * lineHeight <= height)
        return { fontSize, lineHeight, lines };
    }
  }
  return null;
}
export function scanwordClueGroups(
  puzzle: ScanwordPuzzle,
): Map<number, ScanwordEntry[]> {
  const groups = new Map<number, ScanwordEntry[]>();
  for (const entry of puzzle.entries)
    groups.set(entry.clueIndex, [
      ...(groups.get(entry.clueIndex) ?? []),
      entry,
    ]);
  for (const [index, entries] of groups)
    groups.set(
      index,
      entries.sort((a, b) =>
        a.direction === b.direction ? 0 : a.direction === 'across' ? -1 : 1,
      ),
    );
  return groups;
}
export function scanwordPublicationIssues(puzzle: ScanwordPuzzle): string[] {
  return [...scanwordClueGroups(puzzle).values()].flatMap((entries) =>
    entries
      .filter((entry) => !layoutScanwordClue(entry.clue, entries.length))
      .map((entry) => entry.id),
  );
}