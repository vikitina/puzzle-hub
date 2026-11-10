import { useState } from 'react';
import {
  extendFillwordSelection,
  matchFillwordSelection,
} from '../../engines/fillword/fillword-rules';
import type {
  FillwordProgress,
  FillwordPuzzle,
} from '../../engines/fillword/fillword.types';
import { useTranslation } from '../../i18n/use-translation';
import { FILLWORD_LINE_COLORS } from '../../renderers/fillword-svg';
import FillwordBoard from './fillword-board';
import type { FillwordView } from './fillword-board';
import { fillwordErrorNotice } from './use-fillword-generator';
import type { FillwordNotice } from './use-fillword-generator';
import styles from './fillword.module.scss';

interface Props {
  puzzle: FillwordPuzzle;
  progress: FillwordProgress;
  busy: boolean;
  onProgress: (progress: FillwordProgress) => void;
  onUndo: () => void;
  onReset: () => void;
}
export default function FillwordGame({
  puzzle,
  progress,
  busy,
  onProgress,
  onUndo,
  onReset,
}: Props) {
  const { t } = useTranslation();
  const [view, setView] = useState<FillwordView>('play');
  const [selected, setSelected] = useState<readonly number[]>([]);
  const [notice, setNotice] = useState<FillwordNotice | null>(null);
  const foundIds = new Set(progress.found.map((entry) => entry.wordId));
  const clear = () => {
    setSelected([]);
    setNotice(null);
  };
  const check = () => {
    if (busy) return;
    try {
      const match = matchFillwordSelection(puzzle, progress, selected);
      onProgress({ ...progress, found: [...progress.found, match] });
      setSelected([]);
      setNotice({
        key: 'fillword.play.found',
        values: {
          word: puzzle.words.find((word) => word.id === match.wordId)!.label,
        },
      });
    } catch (error) {
      setNotice(fillwordErrorNotice(error));
    }
  };
  return (
    <section className={styles.current}>
      <h2>{puzzle.title}</h2>
      <div
        className={styles.toolbar}
        role="group"
        aria-label={t('fillword.views.label')}
      >
        {(['play', 'task', 'solution'] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            aria-pressed={view === mode}
            onClick={() => {
              setView(mode);
              clear();
            }}
          >
            {t(`fillword.views.${mode}`)}
          </button>
        ))}
      </div>
      <div className={styles.game}>
        <FillwordBoard
          puzzle={puzzle}
          view={view}
          progress={progress}
          selected={selected}
          busy={busy}
          onClear={clear}
          onSelect={(index) => {
            if (busy) return;
            try {
              setSelected(extendFillwordSelection(puzzle, selected, index));
              setNotice(null);
            } catch (error) {
              setNotice(fillwordErrorNotice(error));
            }
          }}
        />
        <aside className={styles.wordPanel}>
          <h3>{t('fillword.play.words')}</h3>
          <ul className={styles.wordList}>
            {puzzle.words.map((word, index) => (
              <li
                key={word.id}
                data-found={view === 'play' && foundIds.has(word.id)}
                style={{
                  borderInlineStartColor:
                    view === 'solution' ||
                    (view === 'play' && foundIds.has(word.id))
                      ? FILLWORD_LINE_COLORS[
                          index % FILLWORD_LINE_COLORS.length
                        ]
                      : 'transparent',
                }}
              >
                {word.label}
              </li>
            ))}
          </ul>
        </aside>
      </div>
      {view === 'play' && (
        <>
          <p className={styles.hint}>{t('fillword.rules.controls')}</p>
          <p>
            {t('fillword.play.selected', {
              text:
                selected.map((index) => puzzle.cells[index]).join('') || '—',
            })}
          </p>
          <div className={styles.toolbar}>
            <button
              type="button"
              className={styles.primary}
              disabled={busy || selected.length < 2}
              onClick={check}
            >
              {t('fillword.play.check')}
            </button>
            <button
              type="button"
              disabled={busy || selected.length === 0}
              onClick={clear}
            >
              {t('fillword.play.clear')}
            </button>
            <button
              type="button"
              disabled={busy || progress.found.length === 0}
              onClick={() => {
                onUndo();
                clear();
              }}
            >
              {t('fillword.play.undo')}
            </button>
            <button
              type="button"
              disabled={busy || progress.found.length === 0}
              onClick={() => {
                onReset();
                clear();
              }}
            >
              {t('fillword.play.reset')}
            </button>
          </div>
          <p role="status">
            {t(
              foundIds.size === puzzle.words.length
                ? 'fillword.play.solved'
                : 'fillword.play.progress',
              { found: foundIds.size, total: puzzle.words.length },
            )}
          </p>
          <p className={styles.hint}>{t('fillword.rules.alternatives')}</p>
        </>
      )}
      {notice && (
        <p
          role="status"
          className={notice.danger ? styles.error : styles.success}
        >
          {t(notice.key, notice.values)}
        </p>
      )}
    </section>
  );
}