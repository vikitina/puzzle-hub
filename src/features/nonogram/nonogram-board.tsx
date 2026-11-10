import { useId } from 'react';
import type { CSSProperties } from 'react';
import type {
  NonogramMark,
  NonogramPuzzle,
} from '../../engines/nonogram/nonogram.types';
import type { NonogramLineStatus } from '../../engines/nonogram/nonogram-rules';
import { useTranslation } from '../../i18n/use-translation';
import NonogramPixelGrid from './nonogram-pixel-grid';
import styles from './nonogram.module.scss';

export type NonogramView = 'play' | 'task' | 'solution';
interface Props {
  puzzle: NonogramPuzzle;
  cells: readonly NonogramMark[];
  view: NonogramView;
  rowStatus: readonly NonogramLineStatus[];
  columnStatus: readonly NonogramLineStatus[];
  busy: boolean;
  mistakes: ReadonlySet<number>;
  onPaint: (index: number) => void;
  onEmpty: (index: number) => void;
  onErase: (index: number) => void;
}
export default function NonogramBoard({
  puzzle,
  cells,
  view,
  rowStatus,
  columnStatus,
  busy,
  mistakes,
  onPaint,
  onEmpty,
  onErase,
}: Props) {
  const { t } = useTranslation();
  const id = useId();
  const top = Math.max(1, ...puzzle.columnClues.map((line) => line.length));
  const left = Math.max(1, ...puzzle.rowClues.map((line) => line.length));
  const values =
    view === 'solution'
      ? puzzle.solution
      : view === 'task'
        ? puzzle.solution.map(() => 0 as const)
        : cells;
  return (
    <div className={styles.boardViewport}>
      <div
        className={styles.frame}
        style={
          {
            '--rows': puzzle.rows,
            '--columns': puzzle.columns,
            '--top-slots': top,
            '--left-slots': left,
          } as CSSProperties
        }
      >
        <div aria-hidden="true" />
        <div className={styles.columnHints}>
          {puzzle.columnClues.map((line, index) => (
            <div
              key={index}
              id={`${id}-column-${index}`}
              className={styles.columnHint}
              data-status={view === 'play' ? columnStatus[index] : undefined}
              role="group"
              aria-label={t('nonogram.columnClue', {
                index: index + 1,
                clues: line.join(' ') || '0',
              })}
            >
              {(line.length ? line : [0]).map((number, i) => (
                <span key={i} aria-hidden="true">
                  {number}
                </span>
              ))}
            </div>
          ))}
        </div>
        <div className={styles.rowHints}>
          {puzzle.rowClues.map((line, index) => (
            <div
              key={index}
              id={`${id}-row-${index}`}
              className={styles.rowHint}
              data-status={view === 'play' ? rowStatus[index] : undefined}
              role="group"
              aria-label={t('nonogram.rowClue', {
                index: index + 1,
                clues: line.join(' ') || '0',
              })}
            >
              {(line.length ? line : [0]).map((number, i) => (
                <span key={i} aria-hidden="true">
                  {number}
                </span>
              ))}
            </div>
          ))}
        </div>
        <NonogramPixelGrid
          rows={puzzle.rows}
          columns={puzzle.columns}
          values={values}
          kind={view === 'play' ? 'play' : 'static'}
          label={t('nonogram.board')}
          disabled={busy}
          mistakes={view === 'play' ? mistakes : undefined}
          onPaint={onPaint}
          onEmpty={onEmpty}
          onErase={onErase}
          describe={(index) =>
            `${id}-row-${Math.floor(index / puzzle.columns)} ${id}-column-${index % puzzle.columns}`
          }
        />
      </div>
    </div>
  );
}