import { useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent } from 'react';
import type {
  FillwordProgress,
  FillwordPuzzle,
} from '../../engines/fillword/fillword.types';
import { useTranslation } from '../../i18n/use-translation';
import {
  FILLWORD_LINE_COLORS,
  fillwordPoints,
} from '../../renderers/fillword-svg';
import styles from './fillword.module.scss';

export type FillwordView = 'play' | 'task' | 'solution';
interface Props {
  puzzle: FillwordPuzzle;
  view: FillwordView;
  progress?: FillwordProgress;
  selected?: readonly number[];
  busy?: boolean;
  onSelect?: (index: number) => void;
  onClear?: () => void;
}
export default function FillwordBoard({
  puzzle,
  view,
  progress,
  selected = [],
  busy = false,
  onSelect,
  onClear,
}: Props) {
  const { t } = useTranslation();
  const [focus, setFocus] = useState(0);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const lines =
    view === 'solution'
      ? puzzle.words.map((word, index) => ({
          id: word.id,
          path: word.path,
          color: index,
        }))
      : view === 'play'
        ? (progress?.found ?? []).map((found) => ({
            id: found.wordId,
            path: found.path,
            color: puzzle.words.findIndex((word) => word.id === found.wordId),
          }))
        : [];
  const foundCells = new Set(lines.flatMap((line) => [...line.path]));
  const move = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClear?.();
      return;
    }
    const delta: Record<string, readonly [number, number]> = {
      ArrowUp: [-1, 0],
      ArrowDown: [1, 0],
      ArrowLeft: [0, -1],
      ArrowRight: [0, 1],
    };
    const step = delta[event.key];
    if (!step) return;
    event.preventDefault();
    const row = Math.max(
      0,
      Math.min(
        puzzle.config.rows - 1,
        Math.floor(index / puzzle.config.columns) + step[0],
      ),
    );
    const column = Math.max(
      0,
      Math.min(
        puzzle.config.columns - 1,
        (index % puzzle.config.columns) + step[1],
      ),
    );
    refs.current[row * puzzle.config.columns + column]?.focus();
  };
  return (
    <div className={styles.boardViewport}>
      <div
        className={styles.board}
        role="group"
        aria-label={t('fillword.board')}
        style={
          {
            '--columns': puzzle.config.columns,
            '--rows': puzzle.config.rows,
          } as CSSProperties
        }
      >
        <svg
          className={styles.lines}
          viewBox={`0 0 ${puzzle.config.columns} ${puzzle.config.rows}`}
          preserveAspectRatio="none"
          aria-hidden="true"
          data-testid="fillword-lines"
        >
          {lines.map((line) => (
            <polyline
              key={line.id}
              data-word-id={line.id}
              points={fillwordPoints(line.path, puzzle.config.columns)}
              fill="none"
              stroke={
                FILLWORD_LINE_COLORS[line.color % FILLWORD_LINE_COLORS.length]
              }
              strokeOpacity={0.28}
              strokeWidth={0.65}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
          {view === 'play' && selected.length > 0 && (
            <polyline
              points={fillwordPoints(selected, puzzle.config.columns)}
              fill="none"
              stroke="currentColor"
              strokeOpacity={0.22}
              strokeWidth={0.65}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </svg>
        {puzzle.cells.map((letter, index) =>
          view === 'play' ? (
            <button
              type="button"
              key={index}
              className={styles.cell}
              ref={(node) => {
                refs.current[index] = node;
              }}
              tabIndex={index === focus ? 0 : -1}
              disabled={busy}
              aria-label={t('fillword.cell', {
                row: Math.floor(index / puzzle.config.columns) + 1,
                column: (index % puzzle.config.columns) + 1,
                letter,
              })}
              aria-pressed={selected.includes(index)}
              data-found={foundCells.has(index)}
              onFocus={() => setFocus(index)}
              onKeyDown={(event) => move(event, index)}
              onClick={() => onSelect?.(index)}
            >
              {letter}
            </button>
          ) : (
            <span className={styles.cell} key={index}>
              {letter}
            </span>
          ),
        )}
      </div>
    </div>
  );
}