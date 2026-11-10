import type { CodewordPuzzle } from '../engines/codeword/codeword.types';
import { codewordAvailableLetters } from '../engines/codeword/codeword-puzzle';
export interface CodewordSVGLabels {
  rules: string;
  alphabet: string;
  words: string;
  key: string;
}
function escape(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}
export function renderCodewordSVG(
  puzzle: CodewordPuzzle,
  answers: boolean,
  labels: CodewordSVGLabels,
): string {
  const cell = 36,
    margin = 24,
    width = Math.max(400, puzzle.columns * cell + margin * 2);
  const wrap = (value: string) => {
    const max = Math.floor((width - margin * 2) / 8);
    const lines: string[] = [];
    let line = '';
    for (const token of value.split(/\s+/u)) {
      if (line && line.length + token.length + 1 > max) {
        lines.push(line);
        line = '';
      }
      let rest = token;
      while (rest.length > max) {
        if (line) {
          lines.push(line);
          line = '';
        }
        lines.push(rest.slice(0, max));
        rest = rest.slice(max);
      }
      line += `${line ? ' ' : ''}${rest}`;
    }
    if (line) lines.push(line);
    return lines;
  };
  const heading = [...wrap(puzzle.title), ...wrap(labels.rules)];
  const top = 30 + heading.length * 20;
  const text = (value: string, x: number, y: number, attrs = '') =>
    `<text x="${x}" y="${y}" ${attrs}>${escape(value)}</text>`;
  const given = new Map(
    puzzle.givens.map((entry) => [entry.code, entry.letter]),
  );
  const grid = puzzle.cells
    .map((code, index) => {
      const x = margin + (index % puzzle.columns) * cell,
        y = top + Math.floor(index / puzzle.columns) * cell;
      const letter =
        code === null
          ? null
          : answers
            ? puzzle.key[code - 1]!
            : given.get(code);
      return (
        `<rect data-cell="${index}" x="${x}" y="${y}" width="${cell}" height="${cell}" fill="${code === null ? '#111' : '#fff'}" stroke="#777" stroke-width="0.7"/>` +
        (code === null
          ? ''
          : text(String(code), x + 3, y + 10, 'font-size="9"') +
            (letter
              ? text(
                  letter,
                  x + cell / 2,
                  y + cell / 2 + 5,
                  `data-letter-cell="${index}" font-size="21" text-anchor="middle" dominant-baseline="central"`,
                )
              : ''))
      );
    })
    .join('');
  let y = top + puzzle.rows * cell + 26;
  const footer: string[] = [];
  for (const line of wrap(
    `${labels.alphabet}: ${codewordAvailableLetters(puzzle).join(' ')}`,
  )) {
    footer.push(text(line, margin, y));
    y += 20;
  }
  if (puzzle.showWordBank)
    for (const line of wrap(`${labels.words}: ${puzzle.words.join(' · ')}`)) {
      footer.push(text(line, margin, y));
      y += 20;
    }
  y += 8;
  footer.push(text(labels.key, margin, y));
  y += 12;
  const perRow = Math.floor((width - margin * 2) / 34);
  puzzle.key.forEach((letter, index) => {
    const x = margin + (index % perRow) * 34,
      base = y + Math.floor(index / perRow) * 48;
    footer.push(
      `<rect x="${x}" y="${base}" width="34" height="44" fill="#fff" stroke="#777" stroke-width="0.7"/>` +
        text(String(index + 1), x + 4, base + 11, 'font-size="9"') +
        ((answers ? letter : given.get(index + 1))
          ? text(
              answers ? letter : given.get(index + 1)!,
              x + 17,
              base + 30,
              'font-size="19" text-anchor="middle"',
            )
          : ''),
    );
  });
  const height = y + Math.ceil(puzzle.key.length / perRow) * 48 + margin;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img"><title>${escape(puzzle.title)}</title><rect width="100%" height="100%" fill="#fff"/><g font-family="monospace" font-size="13" fill="#111">${heading.map((line, index) => text(line, margin, 23 + index * 20)).join('')}${grid}${footer.join('')}</g></svg>`;
}