import type { FillwordPuzzle } from '../engines/fillword/fillword.types';

export const FILLWORD_LINE_COLORS = [
  '#18794e',
  '#b42318',
  '#175cd3',
  '#9333a3',
  '#965300',
  '#007c91',
];

function escape(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

export function fillwordPoints(
  path: readonly number[],
  columns: number,
  cell = 1,
  margin = 0,
): string {
  return path
    .map(
      (index) =>
        `${margin + ((index % columns) + 0.5) * cell},${margin + (Math.floor(index / columns) + 0.5) * cell}`,
    )
    .join(' ');
}

export function renderFillwordSVG(
  puzzle: FillwordPuzzle,
  answers: boolean,
  ruleText: string,
): string {
  const cell = 40;
  const margin = 24;
  const width = Math.max(360, puzzle.config.columns * cell + margin * 2);
  const wrap = (text: string): string[] => {
    const limit = Math.max(20, Math.floor((width - margin * 2) / 9));
    const lines: string[] = [];
    let line = '';
    for (const token of text.split(/\s+/u)) {
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
  const top = 30 + heading.length * 22;
  const footer = wrap(puzzle.words.map((word) => word.label).join(' · '));
  const bottom = top + puzzle.config.rows * cell;
  const height = bottom + 32 + footer.length * 22;
  const text = (value: string, x: number, y: number, attributes = '') =>
    `<text x="${x}" y="${y}" ${attributes}>${escape(value)}</text>`;
  const grid = puzzle.cells
    .map((letter, index) => {
      const x = margin + (index % puzzle.config.columns) * cell;
      const y = top + Math.floor(index / puzzle.config.columns) * cell;
      return `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" fill="none" stroke="#888" stroke-width="0.8"/>${text(letter, x + cell / 2, y + cell / 2, 'text-anchor="middle" dominant-baseline="central" font-size="22"')}`;
    })
    .join('');
  const lines = answers
    ? puzzle.words
        .map(
          (word, index) =>
            `<polyline points="${fillwordPoints(word.path, puzzle.config.columns, cell)}" fill="none" stroke="${FILLWORD_LINE_COLORS[index % FILLWORD_LINE_COLORS.length]}" stroke-width="${cell * 0.62}" stroke-opacity="0.28" stroke-linecap="round" stroke-linejoin="round"/>`,
        )
        .join('')
    : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img"><title>${escape(puzzle.title)}</title><rect width="100%" height="100%" fill="white"/><g font-family="monospace" fill="#111" font-size="15">${heading.map((line, index) => text(line, margin, 24 + index * 22)).join('')}<g transform="translate(${margin},${top})">${lines}</g>${grid}${footer.map((line, index) => text(line, margin, bottom + 28 + index * 22)).join('')}</g></svg>`;
}