import { useId, useState } from 'react';
import type { CSSProperties } from 'react';
import {
  getSudokuLayout,
  isSudokuSize,
  SUDOKU_PRESETS,
} from '../../engines/sudoku/sudoku-config';
import type { SudokuGenerationOptions } from '../../engines/sudoku/sudoku.types';
import { useTranslation } from '../../i18n/use-translation';
import { createSudokuSettings, parseSudokuSettings } from './sudoku-settings';
import type { SudokuGenerationState } from './use-sudoku-generator';
import styles from './sudoku.module.scss';

interface Props {
  state: SudokuGenerationState;
  onGenerate: (options: SudokuGenerationOptions) => void;
  onCancel: () => void;
}

export default function SudokuSettingsForm({
  state,
  onGenerate,
  onCancel,
}: Props) {
  const { t } = useTranslation();
  const id = useId();
  const [draft, setDraft] = useState(() => createSudokuSettings(4));
  const [showError, setShowError] = useState(false);
  const layout = getSudokuLayout(draft.size);
  const totalCells = draft.size ** 2;
  const options = parseSudokuSettings(draft);
  const busy = state.status === 'running';

  return (
    <form
      className={styles.settings}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (busy) return;
        if (!options) {
          setShowError(true);
          return;
        }
        setShowError(false);
        onGenerate(options);
      }}
    >
      <fieldset className={styles.settingsFields} disabled={busy}>
        <legend>{t('sudoku.settings.title')}</legend>
        <p className={styles.settingsHint}>
          {t('sudoku.settings.description')}
        </p>

        <div className={styles.settingsContent}>
          <div className={styles.fields}>
            <div className={styles.field}>
              <label htmlFor={`${id}-size`}>{t('sudoku.settings.size')}</label>
              <select
                id={`${id}-size`}
                value={draft.size}
                onChange={(event) => {
                  const size = Number(event.currentTarget.value);
                  if (isSudokuSize(size)) {
                    setDraft(createSudokuSettings(size));
                    setShowError(false);
                  }
                }}
              >
                {SUDOKU_PRESETS.map((preset) => (
                  <option key={preset.size} value={preset.size}>
                    {preset.size} × {preset.size}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label htmlFor={`${id}-clues`}>
                {t('sudoku.settings.clues')}
              </label>
              <input
                id={`${id}-clues`}
                type="number"
                inputMode="numeric"
                min={0}
                max={totalCells}
                step={1}
                value={draft.targetClues}
                aria-invalid={showError && !options}
                aria-describedby={`${id}-hint${showError && !options ? ` ${id}-error` : ''}`}
                onBlur={() => setShowError(true)}
                onChange={(event) => {
                  const value = event.currentTarget.value;
                  setDraft((current) => ({ ...current, targetClues: value }));
                  setShowError(false);
                }}
              />
              <small id={`${id}-hint`}>
                {t('sudoku.settings.cluesHint', { max: totalCells })}
              </small>
              {showError && !options && (
                <p id={`${id}-error`} className={styles.error} role="alert">
                  {t('sudoku.settings.invalid', { max: totalCells })}
                </p>
              )}
            </div>
          </div>

          <div className={styles.previewArea}>
            <div
              className={styles.preview}
              aria-hidden="true"
              style={{ '--board-size': draft.size } as CSSProperties}
            >
              {Array.from({ length: totalCells }, (_, index) => {
                const row = Math.floor(index / draft.size);
                const column = index % draft.size;
                return (
                  <span
                    key={index}
                    className={styles.previewCell}
                    data-block-right={(column + 1) % layout.blockColumns === 0}
                    data-block-bottom={(row + 1) % layout.blockRows === 0}
                    data-last-column={column === draft.size - 1}
                    data-last-row={row === draft.size - 1}
                  />
                );
              })}
            </div>

            <dl className={styles.metadata}>
              <div>
                <dt>{t('sudoku.settings.block')}</dt>
                <dd>
                  {layout.blockRows} × {layout.blockColumns}
                </dd>
              </div>
              <div>
                <dt>{t('sudoku.settings.blocks')}</dt>
                <dd>
                  {draft.size / layout.blockColumns} ×{' '}
                  {draft.size / layout.blockRows}
                </dd>
              </div>
              <div>
                <dt>{t('sudoku.settings.cells')}</dt>
                <dd>{totalCells}</dd>
              </div>
              <div>
                <dt>{t('sudoku.settings.empty')}</dt>
                <dd>{options ? totalCells - options.targetClues : '—'}</dd>
              </div>
            </dl>
          </div>
        </div>

        <button className={styles.primary} type="submit">
          {t(busy ? 'sudoku.generation.running' : 'sudoku.settings.create')}
        </button>
      </fieldset>

      {busy && (
        <button className={styles.reset} type="button" onClick={onCancel}>
          {t('sudoku.generation.cancel')}
        </button>
      )}
      {state.status !== 'idle' && (
        <p
          className={styles.generationStatus}
          role="status"
          data-error={state.status === 'error'}
        >
          {t(
            state.status === 'running'
              ? 'sudoku.generation.running'
              : state.status === 'cancelled'
                ? 'sudoku.generation.cancelled'
                : state.reason === 'timeout'
                  ? 'sudoku.generation.timeout'
                  : 'sudoku.generation.failed',
          )}
        </p>
      )}
    </form>
  );
}