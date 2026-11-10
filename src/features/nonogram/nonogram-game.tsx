import { useMemo, useState } from 'react';
import {
  NonogramRules,
  createNonogramProgress,
} from '../../engines/nonogram/nonogram-rules';
import type {
  NonogramMark,
  NonogramProgress,
  NonogramPuzzle,
} from '../../engines/nonogram/nonogram.types';
import { useTranslation } from '../../i18n/use-translation';
import NonogramBoard from './nonogram-board';
import type { NonogramView } from './nonogram-board';
import styles from './nonogram.module.scss';

interface Props {
  puzzle: NonogramPuzzle;
  progress: NonogramProgress;
  busy: boolean;
  verified: boolean;
  onProgress: (progress: NonogramProgress) => void;
}
export default function NonogramGame({
  puzzle,
  progress,
  busy,
  verified,
  onProgress,
}: Props) {
  const { t } = useTranslation();
  const [view, setView] = useState<NonogramView>('play');
  const [tool, setTool] = useState<NonogramMark>(1);
  const [showMistakes, setShowMistakes] = useState(false);
  const [history, setHistory] = useState<(readonly NonogramMark[])[]>([]);
  const rules = useMemo(() => new NonogramRules(puzzle), [puzzle]);
  const inspection = useMemo(
    () => rules.inspect(progress.cells),
    [rules, progress.cells],
  );
  const locked = busy || !verified;
  const paint = (index: number, action: NonogramMark) => {
    if (locked) return;
    const value = action !== 0 && progress.cells[index] === action ? 0 : action;
    if (value === progress.cells[index]) return;
    setHistory((current) => [...current.slice(-99), progress.cells]);
    onProgress({
      ...progress,
      cells: progress.cells.map((mark, i) => (i === index ? value : mark)),
    });
  };
  const filled = puzzle.solution.filter((pixel) => pixel === 1).length;
  return (
    <section className={styles.card}>
      <h2>
        {t('nonogram.current.title')}: {puzzle.title}
      </h2>
      <p className={verified ? styles.success : styles.warning}>
        {t(verified ? 'nonogram.current.verified' : 'nonogram.current.pending')}
      </p>
      <p>
        {t('nonogram.current.stats', {
          rows: puzzle.rows,
          columns: puzzle.columns,
          filled,
          density: Math.round((filled / puzzle.solution.length) * 100),
        })}
      </p>
      {!verified && (
        <p className={styles.hint}>{t('nonogram.current.blocked')}</p>
      )}
      <div
        className={styles.toolbar}
        role="group"
        aria-label={t('nonogram.views.label')}
      >
        {(['play', 'task', 'solution'] as const).map((mode) => (
          <button
            type="button"
            key={mode}
            aria-pressed={view === mode}
            onClick={() => setView(mode)}
          >
            {t(`nonogram.views.${mode}`)}
          </button>
        ))}
      </div>
      {view === 'play' && (
        <div className={styles.toolbar}>
          {([1, -1, 0] as const).map((mark) => (
            <button
              type="button"
              key={mark}
              aria-pressed={tool === mark}
              onClick={() => setTool(mark)}
            >
              {t(
                mark === 1
                  ? 'nonogram.play.fill'
                  : mark === -1
                    ? 'nonogram.play.empty'
                    : 'nonogram.play.erase',
              )}
            </button>
          ))}
        </div>
      )}
      <NonogramBoard
        puzzle={puzzle}
        cells={progress.cells}
        view={view}
        rowStatus={inspection.rowStatus}
        columnStatus={inspection.columnStatus}
        busy={locked}
        mistakes={new Set(showMistakes ? inspection.mistakes : [])}
        onPaint={(index) => paint(index, tool)}
        onEmpty={(index) => paint(index, -1)}
        onErase={(index) => paint(index, 0)}
      />
      {view === 'play' && (
        <>
          <div className={styles.toolbar}>
            <button
              type="button"
              disabled={locked || history.length === 0}
              onClick={() => {
                const previous = history.at(-1);
                if (previous) {
                  onProgress({ ...progress, cells: previous });
                  setHistory((current) => current.slice(0, -1));
                }
              }}
            >
              {t('nonogram.play.undo')}
            </button>
            <button
              type="button"
              disabled={locked}
              onClick={() => {
                onProgress(createNonogramProgress(puzzle));
                setHistory([]);
              }}
            >
              {t('nonogram.play.reset')}
            </button>
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={showMistakes}
                onChange={(event) => setShowMistakes(event.target.checked)}
              />
              {t('nonogram.play.mistakes')}
            </label>
          </div>
          <p role="status">
            {t(
              !verified
                ? 'nonogram.current.pending'
                : inspection.solved
                  ? 'nonogram.play.solved'
                  : [
                        ...inspection.rowStatus,
                        ...inspection.columnStatus,
                      ].includes('conflict')
                    ? 'nonogram.play.conflict'
                    : 'nonogram.play.open',
            )}
          </p>
          <p className={styles.hint}>{t('nonogram.play.lineHint')}</p>
          <p className={styles.hint}>{t('nonogram.rules.keyboard')}</p>
        </>
      )}
    </section>
  );
}