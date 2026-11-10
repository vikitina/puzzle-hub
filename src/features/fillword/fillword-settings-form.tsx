import { useId, useState } from 'react';
import {
  FILLWORD_ALPHABETS,
  isFillwordAlphabet,
} from '../../engines/fillword/fillword-config';
import {
  prepareFillwordOptions,
  splitFillwordWords,
} from '../../engines/fillword/fillword-input';
import type {
  FillwordDirections,
  FillwordGenerationOptions,
  FillwordPuzzle,
} from '../../engines/fillword/fillword.types';
import { useTranslation } from '../../i18n/use-translation';
import { fillwordErrorNotice } from './use-fillword-generator';
import styles from './fillword.module.scss';

interface Props {
  puzzle: FillwordPuzzle;
  busy: boolean;
  generating: boolean;
  onGenerate: (options: FillwordGenerationOptions) => void;
  onCancel: () => void;
}
export default function FillwordSettingsForm({
  puzzle,
  busy,
  generating,
  onGenerate,
  onCancel,
}: Props) {
  const { t } = useTranslation();
  const id = useId();
  const [draft, setDraft] = useState(() => ({
    title: puzzle.title,
    rows: String(puzzle.config.rows),
    columns: String(puzzle.config.columns),
    alphabet: puzzle.config.alphabet,
    mode: puzzle.config.mode,
    directions: puzzle.config.directions,
    words: puzzle.words.map((word) => word.label).join(', '),
  }));
  const [showError, setShowError] = useState(false);
  const words = splitFillwordWords(draft.words);
  const letters = words.reduce(
    (sum, word) =>
      sum +
      word
        .normalize('NFC')
        .toUpperCase()
        .replace(/['’ʼ-]/gu, '').length,
    0,
  );
  const options: FillwordGenerationOptions = {
    id: 'draft',
    title: draft.title,
    config: {
      rows: Number(draft.rows),
      columns: Number(draft.columns),
      alphabet: draft.alphabet,
      mode: draft.mode,
      directions: draft.mode === 'snake' ? 'orthogonal' : draft.directions,
    },
    words,
  };
  let error = null;
  try {
    prepareFillwordOptions(options);
  } catch (value) {
    error = fillwordErrorNotice(value);
  }
  const patch = (value: Partial<typeof draft>) => {
    setDraft((current) => ({ ...current, ...value }));
    setShowError(false);
  };
  return (
    <form
      className={styles.settings}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (busy) return;
        if (error) {
          setShowError(true);
          return;
        }
        onGenerate({ ...options, id: crypto.randomUUID() });
      }}
    >
      <fieldset disabled={busy}>
        <legend>{t('fillword.settings.title')}</legend>
        <p>{t('fillword.settings.draft')}</p>
        <div className={styles.fields}>
          <label className={styles.wide} htmlFor={`${id}-title`}>
            {t('fillword.settings.titleLabel')}
            <input
              id={`${id}-title`}
              value={draft.title}
              maxLength={120}
              onChange={(event) => patch({ title: event.target.value })}
            />
          </label>
          <label htmlFor={`${id}-rows`}>
            {t('fillword.settings.rows')}
            <input
              id={`${id}-rows`}
              type="number"
              inputMode="numeric"
              min={2}
              max={20}
              step={1}
              value={draft.rows}
              onChange={(event) => patch({ rows: event.target.value })}
            />
          </label>
          <label htmlFor={`${id}-columns`}>
            {t('fillword.settings.columns')}
            <input
              id={`${id}-columns`}
              type="number"
              inputMode="numeric"
              min={2}
              max={20}
              step={1}
              value={draft.columns}
              onChange={(event) => patch({ columns: event.target.value })}
            />
          </label>
          <label className={styles.wide} htmlFor={`${id}-mode`}>
            {t('fillword.settings.mode')}
            <select
              id={`${id}-mode`}
              value={draft.mode}
              onChange={(event) => {
                const mode = event.target.value;
                if (mode === 'snake' || mode === 'straight')
                  patch({
                    mode,
                    directions: mode === 'snake' ? 'orthogonal' : 'right-down',
                  });
              }}
            >
              <option value="snake">{t('fillword.modes.snake')}</option>
              <option value="straight">{t('fillword.modes.straight')}</option>
            </select>
          </label>
          <label htmlFor={`${id}-alphabet`}>
            {t('fillword.settings.alphabet')}
            <select
              id={`${id}-alphabet`}
              value={draft.alphabet}
              onChange={(event) => {
                if (isFillwordAlphabet(event.target.value))
                  patch({ alphabet: event.target.value });
              }}
            >
              {Object.entries(FILLWORD_ALPHABETS).map(([code, entry]) => (
                <option key={code} value={code}>
                  {entry.name}
                </option>
              ))}
            </select>
          </label>
          {draft.mode === 'straight' && (
            <label htmlFor={`${id}-directions`}>
              {t('fillword.settings.directions')}
              <select
                id={`${id}-directions`}
                value={draft.directions}
                onChange={(event) => {
                  const directions = event.target.value;
                  if (
                    ['right-down', 'orthogonal', 'eight'].includes(directions)
                  )
                    patch({ directions: directions as FillwordDirections });
                }}
              >
                {(['right-down', 'orthogonal', 'eight'] as const).map(
                  (directions) => (
                    <option key={directions} value={directions}>
                      {t(`fillword.directions.${directions}`)}
                    </option>
                  ),
                )}
              </select>
            </label>
          )}
          <label className={styles.wide} htmlFor={`${id}-words`}>
            {t('fillword.settings.words')}
            <textarea
              id={`${id}-words`}
              rows={4}
              maxLength={40_000}
              value={draft.words}
              aria-describedby={`${id}-hint ${id}-stats`}
              onChange={(event) => patch({ words: event.target.value })}
            />
          </label>
        </div>
        <p id={`${id}-hint`} className={styles.hint}>
          {t('fillword.settings.hint')}
        </p>
        <p id={`${id}-stats`} className={styles.hint}>
          {t('fillword.settings.stats', {
            words: words.length,
            letters,
            cells: Number.isInteger(
              options.config.rows * options.config.columns,
            )
              ? options.config.rows * options.config.columns
              : '—',
          })}
        </p>
        {showError && error && (
          <p className={styles.error} role="alert">
            {t(error.key, error.values)}
          </p>
        )}
        <button className={styles.primary} type="submit">
          {t(
            generating
              ? 'fillword.settings.running'
              : 'fillword.settings.create',
          )}
        </button>
      </fieldset>
      {generating && (
        <button type="button" onClick={onCancel}>
          {t('fillword.settings.cancel')}
        </button>
      )}
    </form>
  );
}