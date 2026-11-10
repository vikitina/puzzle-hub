import { useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent } from 'react';
import type { CodewordPuzzle } from '../../engines/codeword/codeword.types';
import { useTranslation } from '../../i18n/use-translation';
import styles from './codeword.module.scss';
export type CodewordView = 'play' | 'task' | 'solution';
interface Props {
  puzzle: CodewordPuzzle;
  view: CodewordView;
  entries: readonly (string | null)[];
  selected: number | null;
  busy: boolean;
  conflicts: ReadonlySet<number>;
  mistakes: ReadonlySet<number>;
  onSelect: (code: number) => void;
}
export default function CodewordBoard({
  puzzle,
  view,
  entries,
  selected,
  busy,
  conflicts,
  mistakes,
  onSelect,
}: Props) {
  const { t } = useTranslation();
  const [focus, setFocus] = useState(() =>
    puzzle.cells.findIndex((code) => code !== null),
  );
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const given = new Map(
    puzzle.givens.map((entry) => [entry.code, entry.letter]),
  );
  const move = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const steps: Record<string, readonly [number, number]> = {
      ArrowUp: [-1, 0],
      ArrowDown: [1, 0],
      ArrowLeft: [0, -1],
      ArrowRight: [0, 1],
    };
    const step = steps[event.key];
    if (!step) return;
    event.preventDefault();
    let row = Math.floor(index / puzzle.columns) + step[0],
      column = (index % puzzle.columns) + step[1];
    while (
      row >= 0 &&
      row < puzzle.rows &&
      column >= 0 &&
      column < puzzle.columns
    ) {
      const next = row * puzzle.columns + column;
      if (puzzle.cells[next] !== null) {
        refs.current[next]?.focus();
        return;
      }
      row += step[0];
      column += step[1];
    }
  };
  return (
    <div className={styles.boardViewport}>
      <div
        className={styles.board}
        role="group"
        aria-label={t('codeword.board')}
        style={{ '--columns': puzzle.columns } as CSSProperties}
      >
        {puzzle.cells.map((code, index) => {
          if (code === null)
            return (
              <span key={index} className={styles.blocked} aria-hidden="true" />
            );
          const letter =
            view === 'solution'
              ? puzzle.key[code - 1]
              : view === 'task'
                ? given.get(code)
                : entries[code - 1];
          const content = (
            <>
              <span className={styles.codeNumber}>{code}</span>
              <span className={styles.cellLetter}>{letter ?? ''}</span>
            </>
          );
          const data = {
            'data-code': code,
            'data-given': given.has(code),
            'data-selected': view === 'play' && selected === code,
            'data-conflict': view === 'play' && conflicts.has(code),
            'data-mistake': view === 'play' && mistakes.has(code),
          };
          return view === 'play' ? (
            <button
              type="button"
              key={index}
              ref={(node) => {
                refs.current[index] = node;
              }}
              className={styles.cell}
              {...data}
              disabled={busy}
              tabIndex={index === focus ? 0 : -1}
              aria-label={t('codeword.cell', {
                row: Math.floor(index / puzzle.columns) + 1,
                column: (index % puzzle.columns) + 1,
                code,
              })}
              onFocus={() => setFocus(index)}
              onKeyDown={(event) => move(event, index)}
              onClick={() => onSelect(code)}
            >
              {content}
            </button>
          ) : (
            <span key={index} className={styles.cell} {...data}>
              {content}
            </span>
          );
        })}
      </div>
    </div>
  );
}