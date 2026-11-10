import {
  layoutScanwordClue,
  SCANWORD_CELL,
  scanwordClueGroups,
  scanwordPublicationIssues,
  wrapScanwordText,
} from '../engines/scanword/scanword-clues';
import type { ScanwordPuzzle } from '../engines/scanword/scanword.types';
export interface ScanwordSVGLabels {
  readonly rules: string;
}
function escape(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}
function geometry(puzzle: ScanwordPuzzle, labels: ScanwordSVGLabels) {
  const cell = SCANWORD_CELL,
    margin = 24,
    width = puzzle.columns * cell + 2 * margin;
  const wrap = (text: string) =>
    wrapScanwordText(text, Math.max(8, Math.floor((width - 2 * margin) / 9)));
  const heading = [...wrap(puzzle.title), ...wrap(labels.rules)],
    top = 24 + heading.length * 22;
  const height = top + puzzle.rows * cell + margin;
  return { cell, margin, width, heading, top, height };
}
export function scanwordSVGSize(
  puzzle: ScanwordPuzzle,
  labels: ScanwordSVGLabels,
  cellMm = 18,
) {
  const { width, height } = geometry(puzzle, labels);
  return {
    width: Number(((width / SCANWORD_CELL) * cellMm).toFixed(1)),
    height: Number(((height / SCANWORD_CELL) * cellMm).toFixed(1)),
  };
}
export function renderScanwordSVG(
  puzzle: ScanwordPuzzle,
  answers: boolean,
  labels: ScanwordSVGLabels,
  cellMm = 18,
): string {
  if (
    !Number.isFinite(cellMm) ||
    cellMm < 12 ||
    cellMm > 24 ||
    scanwordPublicationIssues(puzzle).length
  )
    throw new Error('Scanword publication layout');
  const { cell, margin, width, heading, top, height } = geometry(
    puzzle,
    labels,
  );
  const text = (value: string, x: number, y: number, attrs = '') =>
    `<text x="${x}" y="${y}" ${attrs}>${escape(value)}</text>`;
  const groups = scanwordClueGroups(puzzle),
    givens = new Map(puzzle.givens.map((given) => [given.index, given.letter]));
  const content = puzzle.cells
    .map((answer, index) => {
      const x = margin + (index % puzzle.columns) * cell,
        y = top + Math.floor(index / puzzle.columns) * cell;
      const entries = groups.get(index);
      const rect = `<rect data-cell="${index}" x="${x}" y="${y}" width="${cell}" height="${cell}" fill="${answer !== null ? '#fff' : entries ? '#f4f4f4' : '#222'}" stroke="#555" stroke-width="1"/>`;
      if (answer !== null) {
        const letter = answers ? answer : givens.get(index);
        return (
          rect +
          (letter
            ? text(
                letter,
                x + cell / 2,
                y + cell / 2 + 11,
                `data-letter-cell="${index}" font-size="34" text-anchor="middle"${givens.has(index) ? ' font-weight="700" text-decoration="underline"' : ''}`,
              )
            : '')
        );
      }
      return (
        rect +
        (entries
          ?.map((entry, part) => {
            const section = cell / entries.length,
              base = y + part * section;
            const layout = layoutScanwordClue(entry.clue, entries.length)!;
            const arrow =
              entry.direction === 'across'
                ? `M ${x + cell - 24} ${base + section - 9} H ${x + cell - 5} m -6 -5 l 6 5 -6 5`
                : `M ${x + cell / 2} ${base + section - 13} V ${base + section - 4} m -5 -6 l 5 6 5 -6`;
            return (
              (part
                ? `<path d="M ${x} ${base} H ${x + cell}" stroke="#555" fill="none"/>`
                : '') +
              layout.lines
                .map((line, i) =>
                  text(
                    line,
                    x + 6,
                    base + 6 + layout.fontSize + i * layout.lineHeight,
                    `font-size="${layout.fontSize}"`,
                  ),
                )
                .join('') +
              `<path data-direction="${entry.direction}" d="${arrow}" stroke="#111" stroke-width="2" fill="none"/>`
            );
          })
          .join('') ?? '')
      );
    })
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${((width / cell) * cellMm).toFixed(2)}mm" height="${((height / cell) * cellMm).toFixed(2)}mm" viewBox="0 0 ${width} ${height}" role="img"><title>${escape(puzzle.title)}</title><rect width="100%" height="100%" fill="#fff"/><g font-family="monospace" font-size="15" fill="#111">${heading.map((line, i) => text(line, margin, 22 + i * 22)).join('')}${content}</g></svg>`;
}