import type { CSSProperties, KeyboardEvent } from 'react';
import {
  layoutScanwordClue,
  scanwordClueGroups,
  SCANWORD_CELL,
} from '../../engines/scanword/scanword-clues';
import type { ScanwordPuzzle } from '../../engines/scanword/scanword.types';
import { useTranslation } from '../../i18n/use-translation';
import styles from './scanword.module.scss';
export type ScanwordView = 'play' | 'task' | 'solution';
export function nextScanwordCell(
  puzzle: ScanwordPuzzle,
  index: number,
  dr: number,
  dc: number,
): number | null {
  let row = Math.floor(index / puzzle.columns) + dr,
    col = (index % puzzle.columns) + dc;
  while (row >= 0 && row < puzzle.rows && col >= 0 && col < puzzle.columns) {
    const next = row * puzzle.columns + col;
    if (puzzle.cells[next] !== null) return next;
    row += dr;
    col += dc;
  }
  return null;
}
export default function ScanwordBoard({
  puzzle,
  letters,
  view,
  entryId,
  selected,
  mistakes,
  busy,
  onCell,
  onEntry,
}: {
  puzzle: ScanwordPuzzle;
  letters: readonly (string | null)[];
  view: ScanwordView;
  entryId: string | null;
  selected: number | null;
  mistakes: ReadonlySet<number>;
  busy: boolean;
  onCell: (index: number) => void;
  onEntry: (id: string) => void;
}) {
  const { t } = useTranslation();
  const groups = scanwordClueGroups(puzzle),
    givens = new Map(puzzle.givens.map((given) => [given.index, given.letter]));
  const entry = puzzle.entries.find((item) => item.id === entryId);
  const first = puzzle.cells.findIndex((letter) => letter !== null);
  const keyboard = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const moves = {
      ArrowRight: [0, 1],
      ArrowDown: [1, 0],
      ArrowLeft: [0, -1],
      ArrowUp: [-1, 0],
    } as const;
    if (!(event.key in moves)) return;
    event.preventDefault();
    const [dr, dc] = moves[event.key as keyof typeof moves];
    const next = nextScanwordCell(puzzle, index, dr, dc);
    if (next !== null) onCell(next);
  };
  return (
    <div
      className={styles.boardViewport}
      tabIndex={0}
      role="region"
      aria-label={t('scanword.board')}
    >
      <div
        className={styles.board}
        role="group"
        aria-label={t('scanword.board')}
        style={{ '--columns': puzzle.columns } as CSSProperties}
      >
        {puzzle.cells.map((answer, index) => {
          const label = t('scanword.cell', {
            row: Math.floor(index / puzzle.columns) + 1,
            column: (index % puzzle.columns) + 1,
          });
          if (answer !== null) {
            const letter =
              view === 'solution'
                ? answer
                : view === 'task'
                  ? (givens.get(index) ?? '')
                  : (letters[index] ?? '');
            const attributes = {
              className: styles.letterCell,
              'data-letter-cell': index,
              'data-selected': view === 'play' && selected === index,
              'data-word':
                view === 'play' && Boolean(entry?.path.includes(index)),
              'data-given': givens.has(index),
              'data-mistake': view === 'play' && mistakes.has(index),
              'aria-label': `${label}${givens.has(index) ? `, ${t('scanword.given')}` : ''}`,
            };
            return view === 'play' ? (
              <button
                type="button"
                key={index}
                {...attributes}
                disabled={busy}
                tabIndex={index === (selected ?? first) ? 0 : -1}
                onClick={() => onCell(index)}
                onKeyDown={(event) => keyboard(event, index)}
              >
                {letter}
              </button>
            ) : (
              <span key={index} {...attributes}>
                {letter}
              </span>
            );
          }
          const clues = groups.get(index);
          if (!clues)
            return (
              <span key={index} className={styles.blocked} aria-hidden="true" />
            );
          return (
            <div className={styles.clueCell} key={index}>
              {clues.map((clue) => {
                const layout = layoutScanwordClue(clue.clue, clues.length),
                  height = SCANWORD_CELL / clues.length;
                const label = t('scanword.clue', {
                  clue: clue.clue,
                  direction: t(`scanword.directions.${clue.direction}`),
                  length: clue.path.length,
                });
                return (
                  <button
                    type="button"
                    key={clue.id}
                    className={styles.clueButton}
                    disabled={view !== 'play' || busy}
                    aria-label={label}
                    title={label}
                    aria-pressed={view === 'play' && entryId === clue.id}
                    onClick={() => onEntry(clue.id)}
                  >
                    {layout ? (
                      <svg
                        aria-hidden="true"
                        viewBox={`0 0 ${SCANWORD_CELL} ${height}`}
                      >
                        {layout.lines.map((line, i) => (
                          <text
                            key={i}
                            x={6}
                            y={6 + layout.fontSize + i * layout.lineHeight}
                            fontSize={layout.fontSize}
                          >
                            {line}
                          </text>
                        ))}
                        <path
                          d={
                            clue.direction === 'across'
                              ? `M 72 ${height - 9} H 91 m -6 -5 l 6 5 -6 5`
                              : `M 48 ${height - 13} V ${height - 4} m -5 -6 l 5 6 5 -6`
                          }
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                        />
                      </svg>
                    ) : (
                      <span className={styles.overflowClue}>
                        {clue.clue} {clue.direction === 'across' ? '→' : '↓'}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}