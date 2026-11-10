import type { NonogramPuzzle } from '../engines/nonogram/nonogram.types';

function escape(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}
export function renderNonogramSVG(
  puzzle: NonogramPuzzle,
  answers: boolean,
  ruleText: string,
): string {
  const cell = 32;
  const margin = 20;
  const hint = 18;
  const left =
    Math.max(1, ...puzzle.rowClues.map((line) => line.length)) * hint + 12;
  const top =
    Math.max(1, ...puzzle.columnClues.map((line) => line.length)) * hint + 12;
  const width = Math.max(360, margin * 2 + left + puzzle.columns * cell);
  const wrap = (value: string) => {
    const limit = Math.floor((width - margin * 2) / 8);
    const lines: string[] = [];
    let line = '';
    for (const token of value.split(/\s+/u)) {
      if (line && line.length + token.length + 1 > limit) {
        lines.push(line);
        line = '';
      }
      let rest = token;
      while (rest.length > limit) {
        if (line) {
          lines.push(line);
          line = '';
        }
        lines.push(rest.slice(0, limit));
        rest = rest.slice(limit);
      }
      line += `${line ? ' ' : ''}${rest}`;
    }
    if (line) lines.push(line);
    return lines;
  };
  const heading = [...wrap(puzzle.title), ...wrap(ruleText)];
  const offsetY = 28 + heading.length * 20;
  const gridX = margin + left;
  const gridY = offsetY + top;
  const height = gridY + puzzle.rows * cell + margin;
  const text = (value: string, x: number, y: number, attrs = '') =>
    `<text x="${x}" y="${y}" ${attrs}>${escape(value)}</text>`;
  const rowHints = puzzle.rowClues
    .map((clues, row) =>
      (clues.length ? clues : [0])
        .map((value, index, list) =>
          text(
            String(value),
            gridX - 8 - (list.length - index - 1) * hint,
            gridY + (row + 0.5) * cell,
            'text-anchor="end" dominant-baseline="central"',
          ),
        )
        .join(''),
    )
    .join('');
  const columnHints = puzzle.columnClues
    .map((clues, column) =>
      (clues.length ? clues : [0])
        .map((value, index, list) =>
          text(
            String(value),
            gridX + (column + 0.5) * cell,
            gridY - 8 - (list.length - index - 1) * hint,
            'text-anchor="middle"',
          ),
        )
        .join(''),
    )
    .join('');
  const cells = puzzle.solution
    .map(
      (pixel, index) =>
        `<rect data-cell="${index}" x="${gridX + (index % puzzle.columns) * cell}" y="${gridY + Math.floor(index / puzzle.columns) * cell}" width="${cell}" height="${cell}" fill="${answers && pixel === 1 ? '#111' : '#fff'}" stroke="#999" stroke-width="0.6"/>`,
    )
    .join('');
  const lines: string[] = [];
  for (let row = 0; row <= puzzle.rows; row += 1)
    if (row % 5 === 0 || row === puzzle.rows)
      lines.push(
        `<line x1="${gridX}" x2="${gridX + puzzle.columns * cell}" y1="${gridY + row * cell}" y2="${gridY + row * cell}" stroke="#111" stroke-width="1.6"/>`,
      );
  for (let column = 0; column <= puzzle.columns; column += 1)
    if (column % 5 === 0 || column === puzzle.columns)
      lines.push(
        `<line x1="${gridX + column * cell}" x2="${gridX + column * cell}" y1="${gridY}" y2="${gridY + puzzle.rows * cell}" stroke="#111" stroke-width="1.6"/>`,
      );
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img"><title>${escape(puzzle.title)}</title><rect width="100%" height="100%" fill="#fff"/><g font-family="monospace" font-size="13" fill="#111">${heading.map((line, i) => text(line, margin, 22 + i * 20)).join('')}${rowHints}${columnHints}${cells}${lines.join('')}</g></svg>`;
}