import { useId, useState } from 'react';
import {
  CODEWORD_ALPHABETS,
  isCodewordAlphabet,
  normalizeCodewordWords,
  parseCodewordFilledGrid,
  parseCodewordRevealedLetters,
  splitCodewordWords,
  validateCodewordSize,
} from '../../engines/codeword/codeword-input';
import type {
  CodewordPuzzle,
  CodewordSettings,
} from '../../engines/codeword/codeword.types';
import { CodewordError } from '../../engines/codeword/codeword.types';
import { useTranslation } from '../../i18n/use-translation';
import { CODEWORD_EXAMPLES } from './codeword-examples';
import { useCodewordDraft } from './use-codeword-draft';
import { codewordErrorNotice } from './use-codeword-worker';
import type { CodewordNotice } from './use-codeword-worker';
import type { CodewordWorkerRequest } from './codeword-worker.types';
import styles from './codeword.module.scss';
export default function CodewordSettingsForm({
  puzzle,
  busy,
  onRun,
}: {
  puzzle: CodewordPuzzle;
  busy: boolean;
  onRun: (request: CodewordWorkerRequest) => void;
}) {
  const { t } = useTranslation();
  const id = useId();
  const { draft, patch, problem } = useCodewordDraft(puzzle);
  const [error, setError] = useState<CodewordNotice | null>(null);
  const execute = (action: () => void) => {
    try {
      setError(null);
      action();
    } catch (error) {
      setError(codewordErrorNotice(error));
    }
  };
  const settings = (): CodewordSettings => {
    if (!draft.title.trim()) throw new CodewordError('title');
    const count = Number(draft.givenCount);
    if (
      !draft.givenCount.trim() ||
      !Number.isInteger(count) ||
      count < 0 ||
      count > CODEWORD_ALPHABETS[draft.alphabet].letters.length
    )
      throw new CodewordError('givens');
    return {
      id: crypto.randomUUID(),
      title: draft.title,
      rows: Number(draft.rows),
      columns: Number(draft.columns),
      alphabet: draft.alphabet,
      givenCount: count,
      revealedLetters: parseCodewordRevealedLetters(
        draft.revealed,
        draft.alphabet,
      ),
      dictionary: draft.showWordBank
        ? []
        : normalizeCodewordWords(
            splitCodewordWords(draft.dictionary),
            draft.alphabet,
            true,
          ),
      showWordBank: draft.showWordBank,
      requireAllLetters: draft.requireAllLetters,
    };
  };
  const create = () => {
    const options = settings();
    if (draft.source === 'grid') {
      const grid = parseCodewordFilledGrid(draft.grid, draft.alphabet);
      onRun({
        type: 'encode',
        settings: { ...options, rows: grid.rows, columns: grid.columns },
        letters: grid.letters,
      });
    } else {
      validateCodewordSize(options.rows, options.columns);
      onRun({
        type: 'generate',
        options: {
          ...options,
          words: normalizeCodewordWords(
            splitCodewordWords(draft.words),
            draft.alphabet,
          ),
        },
      });
    }
  };
  const words = splitCodewordWords(draft.words);
  const letters = new Set([...words.join('').normalize('NFC').toUpperCase()]);
  return (
    <form
      className={styles.card}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (!busy) execute(create);
      }}
    >
      <fieldset disabled={busy}>
        <legend>{t('codeword.settings.title')}</legend>
        <div className={styles.toolbar}>
          {(['en', 'uk', 'ru'] as const).map((alphabet) => (
            <button
              type="button"
              key={alphabet}
              onClick={() => {
                const example = CODEWORD_EXAMPLES[alphabet];
                patch({
                  alphabet,
                  source: 'words',
                  words: example.words.join(', '),
                  dictionary: example.dictionary.join('\n'),
                  rows: '15',
                  columns: '15',
                  givenCount: example.givenCount,
                  revealed: example.revealed,
                  showWordBank: example.showWordBank,
                  requireAllLetters: example.requireAllLetters,
                });
                setError(null);
              }}
            >
              {t('codeword.settings.example', {
                language: CODEWORD_ALPHABETS[alphabet].name,
              })}
            </button>
          ))}
        </div>
        <div className={styles.fields}>
          <label className={styles.wide} htmlFor={`${id}-title`}>
            {t('codeword.settings.titleLabel')}
            <input
              id={`${id}-title`}
              maxLength={120}
              value={draft.title}
              onChange={(event) => patch({ title: event.target.value })}
            />
          </label>
          <label htmlFor={`${id}-alphabet`}>
            {t('codeword.settings.alphabet')}
            <select
              id={`${id}-alphabet`}
              value={draft.alphabet}
              onChange={(event) => {
                if (isCodewordAlphabet(event.target.value))
                  patch({ alphabet: event.target.value });
              }}
            >
              {Object.entries(CODEWORD_ALPHABETS).map(([code, entry]) => (
                <option key={code} value={code}>
                  {entry.name}
                </option>
              ))}
            </select>
          </label>
          <label htmlFor={`${id}-source`}>
            {t('codeword.settings.source')}
            <select
              id={`${id}-source`}
              value={draft.source}
              onChange={(event) => {
                if (
                  event.target.value === 'words' ||
                  event.target.value === 'grid'
                )
                  patch({ source: event.target.value });
              }}
            >
              <option value="words">{t('codeword.settings.fromWords')}</option>
              <option value="grid">{t('codeword.settings.fromGrid')}</option>
            </select>
          </label>
          {draft.source === 'words' ? (
            <>
              <label htmlFor={`${id}-rows`}>
                {t('codeword.settings.rows')}
                <input
                  id={`${id}-rows`}
                  type="number"
                  inputMode="numeric"
                  min={3}
                  max={25}
                  step={1}
                  value={draft.rows}
                  onChange={(event) => {
                    if (event.target.value.length <= 2)
                      patch({ rows: event.target.value });
                  }}
                />
              </label>
              <label htmlFor={`${id}-columns`}>
                {t('codeword.settings.columns')}
                <input
                  id={`${id}-columns`}
                  type="number"
                  inputMode="numeric"
                  min={3}
                  max={25}
                  step={1}
                  value={draft.columns}
                  onChange={(event) => {
                    if (event.target.value.length <= 2)
                      patch({ columns: event.target.value });
                  }}
                />
              </label>
              <label className={styles.wide} htmlFor={`${id}-words`}>
                {t('codeword.settings.words')}
                <textarea
                  id={`${id}-words`}
                  rows={4}
                  maxLength={2000}
                  value={draft.words}
                  onChange={(event) => patch({ words: event.target.value })}
                />
                <small>{t('codeword.settings.wordsHint')}</small>
              </label>
              <p className={styles.hint}>
                {t('codeword.settings.stats', {
                  words: words.length,
                  letters: letters.size,
                })}
              </p>
            </>
          ) : (
            <label className={styles.wide} htmlFor={`${id}-grid`}>
              {t('codeword.settings.grid')}
              <textarea
                id={`${id}-grid`}
                rows={10}
                maxLength={2000}
                value={draft.grid}
                spellCheck={false}
                onChange={(event) => patch({ grid: event.target.value })}
              />
              <small>{t('codeword.settings.gridHint')}</small>
            </label>
          )}
          <label htmlFor={`${id}-count`}>
            {t('codeword.settings.givenCount')}
            <input
              id={`${id}-count`}
              type="number"
              inputMode="numeric"
              min={0}
              max={CODEWORD_ALPHABETS[draft.alphabet].letters.length}
              step={1}
              value={draft.givenCount}
              onChange={(event) => {
                if (event.target.value.length <= 2)
                  patch({ givenCount: event.target.value });
              }}
            />
          </label>
          <label htmlFor={`${id}-revealed`}>
            {t('codeword.settings.revealed')}
            <input
              id={`${id}-revealed`}
              maxLength={100}
              value={draft.revealed}
              onChange={(event) => patch({ revealed: event.target.value })}
            />
            <small>{t('codeword.settings.revealedHint')}</small>
          </label>
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={draft.requireAllLetters}
              onChange={(event) =>
                patch({ requireAllLetters: event.target.checked })
              }
            />
            {t('codeword.settings.full')}
          </label>
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={draft.showWordBank}
              onChange={(event) =>
                patch({ showWordBank: event.target.checked })
              }
            />
            {t('codeword.settings.bank')}
          </label>
          <label className={styles.wide} htmlFor={`${id}-dictionary`}>
            {t('codeword.settings.dictionary')}
            <textarea
              id={`${id}-dictionary`}
              rows={5}
              maxLength={200000}
              disabled={busy || draft.showWordBank}
              value={draft.dictionary}
              onChange={(event) => patch({ dictionary: event.target.value })}
            />
            <small>{t('codeword.settings.dictionaryHint')}</small>
          </label>
        </div>
        {error && (
          <p role="alert" className={styles.error}>
            {t(error.key, error.values)}
          </p>
        )}
        <div className={styles.toolbar}>
          <button type="submit" className={styles.primary}>
            {t('codeword.settings.create')}
          </button>
          <button
            type="button"
            onClick={() =>
              execute(() =>
                onRun({ type: 'revise', puzzle, settings: settings() }),
              )
            }
          >
            {t('codeword.settings.apply')}
          </button>
        </div>
        <p className={styles.hint}>{t('codeword.settings.applyHint')}</p>
        {problem && (
          <p className={styles.warning}>{t('codeword.messages.storage')}</p>
        )}
      </fieldset>
    </form>
  );
}