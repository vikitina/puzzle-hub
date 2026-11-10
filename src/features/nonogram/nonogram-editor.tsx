import { useId, useState } from 'react';
import { downloadFile } from '../../browser/download-file';
import { createNonogramPuzzle } from '../../engines/nonogram/nonogram-clues';
import { NonogramError } from '../../engines/nonogram/nonogram.types';
import type {
  NonogramGenerationOptions,
  NonogramPuzzle,
} from '../../engines/nonogram/nonogram.types';
import { useTranslation } from '../../i18n/use-translation';
import NonogramPixelGrid from './nonogram-pixel-grid';
import { NONOGRAM_PRESETS } from './nonogram-presets';
import type { NonogramPreset } from './nonogram-presets';
import type { useNonogramEditor } from './use-nonogram-editor';
import { nonogramErrorNotice } from './use-nonogram-worker';
import type { NonogramNotice } from './use-nonogram-worker';
import styles from './nonogram.module.scss';

interface Props {
  editor: ReturnType<typeof useNonogramEditor>;
  busy: boolean;
  onAnalyze: (puzzle: NonogramPuzzle) => void;
  onGenerate: (options: NonogramGenerationOptions) => void;
}
export default function NonogramEditor({
  editor,
  busy,
  onAnalyze,
  onGenerate,
}: Props) {
  const { t } = useTranslation();
  const id = useId();
  const { draft } = editor;
  const [error, setError] = useState<NonogramNotice | null>(null);
  const execute = (action: () => void) => {
    try {
      setError(null);
      action();
    } catch (error) {
      setError(nonogramErrorNotice(error));
    }
  };
  const puzzle = () =>
    createNonogramPuzzle(
      crypto.randomUUID(),
      draft.title,
      draft.rows,
      draft.columns,
      draft.solution,
    );
  return (
    <form
      className={styles.card}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (!busy) execute(() => onAnalyze(puzzle()));
      }}
    >
      <fieldset disabled={busy}>
        <legend>{t('nonogram.editor.title')}</legend>
        <div className={styles.fields}>
          <label className={styles.wide} htmlFor={`${id}-title`}>
            {t('nonogram.editor.titleLabel')}
            <input
              id={`${id}-title`}
              maxLength={120}
              value={draft.title}
              onChange={(event) => {
                editor.patch({ title: event.target.value });
                setError(null);
              }}
            />
          </label>
          <label htmlFor={`${id}-rows`}>
            {t('nonogram.editor.rows')}
            <select
              id={`${id}-rows`}
              value={draft.rows}
              onChange={(event) =>
                execute(() =>
                  editor.resize(Number(event.target.value), draft.columns),
                )
              }
            >
              {Array.from({ length: 19 }, (_, i) => i + 2).map((value) => (
                <option value={value} key={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <label htmlFor={`${id}-columns`}>
            {t('nonogram.editor.columns')}
            <select
              id={`${id}-columns`}
              value={draft.columns}
              onChange={(event) =>
                execute(() =>
                  editor.resize(draft.rows, Number(event.target.value)),
                )
              }
            >
              {Array.from({ length: 19 }, (_, i) => i + 2).map((value) => (
                <option value={value} key={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className={styles.hint}>{t('nonogram.editor.titleHint')}</p>
        <p className={styles.hint}>{t('nonogram.editor.sizeHint')}</p>
        <div
          className={styles.toolbar}
          role="group"
          aria-label={t('nonogram.editor.presets')}
        >
          {(Object.keys(NONOGRAM_PRESETS) as NonogramPreset[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => execute(() => editor.preset(key))}
            >
              {t(`nonogram.presets.${key}`)}
            </button>
          ))}
        </div>
        <div className={styles.boardViewport}>
          <NonogramPixelGrid
            rows={draft.rows}
            columns={draft.columns}
            values={draft.solution}
            kind="editor"
            label={t('nonogram.editor.grid')}
            disabled={busy}
            onPaint={editor.paint}
            onEmpty={(index) => editor.paint(index, 0)}
            onErase={(index) => editor.paint(index, 0)}
          />
        </div>
        <p className={styles.hint}>{t('nonogram.editor.drawHint')}</p>
        <p>
          {t('nonogram.editor.stats', {
            rows: draft.rows,
            columns: draft.columns,
            filled: draft.solution.filter((pixel) => pixel === 1).length,
          })}
        </p>
        <div className={styles.toolbar}>
          <button type="button" onClick={editor.clear}>
            {t('nonogram.editor.clear')}
          </button>
          <button type="button" onClick={editor.invert}>
            {t('nonogram.editor.invert')}
          </button>
          <button
            type="button"
            disabled={busy || editor.history.length === 0}
            onClick={editor.undo}
          >
            {t('nonogram.editor.undo')}
          </button>
          <button
            type="button"
            onClick={() =>
              execute(() =>
                downloadFile(
                  'nonogram-drawing.json',
                  JSON.stringify(puzzle(), null, 2),
                  'application/json;charset=utf-8',
                ),
              )
            }
          >
            {t('nonogram.editor.save')}
          </button>
        </div>
        <button type="submit" className={styles.primary}>
          {t('nonogram.editor.check')}
        </button>
        <div className={styles.randomSettings}>
          <label htmlFor={`${id}-density`}>
            {t('nonogram.editor.density')}
            <input
              id={`${id}-density`}
              type="number"
              inputMode="decimal"
              min={20}
              max={80}
              step={1}
              value={draft.density}
              onChange={(event) => {
                if (event.target.value.length <= 6)
                  editor.patch({ density: event.target.value });
              }}
            />
          </label>
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={draft.symmetric}
              onChange={(event) =>
                editor.patch({ symmetric: event.target.checked })
              }
            />
            {t('nonogram.editor.symmetric')}
          </label>
          <button
            type="button"
            onClick={() =>
              execute(() => {
                const density = Number(draft.density);
                if (
                  !draft.density.trim() ||
                  !Number.isFinite(density) ||
                  density < 20 ||
                  density > 80
                )
                  throw new NonogramError('density');
                const current = puzzle();
                onGenerate({
                  id: current.id,
                  title: current.title,
                  rows: draft.rows,
                  columns: draft.columns,
                  density: density / 100,
                  symmetric: draft.symmetric,
                });
              })
            }
          >
            {t('nonogram.editor.random')}
          </button>
        </div>
        {error && (
          <p role="alert" className={styles.error}>
            {t(error.key)}
          </p>
        )}
      </fieldset>
    </form>
  );
}