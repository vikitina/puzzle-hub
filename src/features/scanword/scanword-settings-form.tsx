import { useEffect, useId, useRef, useState } from 'react';
import {
  isScanwordAlphabet,
  parseScanwordDictionary,
  SCANWORD_ALPHABETS,
  validateScanwordSize,
} from '../../engines/scanword/scanword-input';
import type { ScanwordPuzzle } from '../../engines/scanword/scanword.types';
import { ScanwordError } from '../../engines/scanword/scanword.types';
import { useTranslation } from '../../i18n/use-translation';
import { SCANWORD_DICTIONARIES } from './scanword-examples';
import { useScanwordDraft } from './use-scanword-draft';
import { scanwordErrorNotice } from './use-scanword-worker';
import type { ScanwordNotice } from './use-scanword-worker';
import type { ScanwordWorkerRequest } from './scanword-worker.types';
import styles from './scanword.module.scss';
export default function ScanwordSettingsForm({
  puzzle,
  busy,
  onRun,
}: {
  puzzle: ScanwordPuzzle;
  busy: boolean;
  onRun: (request: ScanwordWorkerRequest) => void;
}) {
  const { t } = useTranslation();
  const id = useId(),
    mounted = useRef(true);
  const { draft, patch, problem } = useScanwordDraft(puzzle);
  const [reading, setReading] = useState(false),
    [notice, setNotice] = useState<ScanwordNotice | null>(null);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const execute = (revise: boolean) => {
    if (busy || reading) return;
    try {
      setNotice(null);
      const dictionary = parseScanwordDictionary(
        draft.dictionary,
        draft.alphabet,
      );
      const givenCount = Number(draft.givenCount);
      if (
        !draft.title.trim() ||
        !draft.givenCount.trim() ||
        !Number.isInteger(givenCount) ||
        givenCount < 0 ||
        givenCount > 400
      )
        throw new ScanwordError('options');
      const settings = {
        id: crypto.randomUUID(),
        title: draft.title,
        alphabet: draft.alphabet,
        dictionary,
        givenCount,
      };
      if (revise) onRun({ type: 'revise', puzzle, settings });
      else {
        const rows = Number(draft.rows),
          columns = Number(draft.columns),
          wordCount = draft.useAll
            ? dictionary.length
            : Number(draft.wordCount);
        validateScanwordSize(rows, columns);
        if (
          !Number.isInteger(wordCount) ||
          wordCount < 2 ||
          wordCount > 40 ||
          wordCount > dictionary.length
        )
          throw new ScanwordError('options');
        onRun({
          type: 'generate',
          options: {
            ...settings,
            rows,
            columns,
            useAll: draft.useAll,
            wordCount,
            maxCluesPerCell: draft.maxCluesPerCell === '1' ? 1 : 2,
          },
        });
      }
    } catch (error) {
      setNotice(scanwordErrorNotice(error));
    }
  };
  return (
    <form
      className={styles.card}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        execute(false);
      }}
    >
      <fieldset disabled={busy || reading}>
        <legend>{t('scanword.settings.title')}</legend>
        <div className={styles.toolbar}>
          {(['uk', 'en', 'ru'] as const).map((alphabet) => (
            <button
              type="button"
              key={alphabet}
              onClick={() => {
                patch({
                  alphabet,
                  dictionary: SCANWORD_DICTIONARIES[alphabet],
                  rows: '15',
                  columns: '15',
                  givenCount: '0',
                  maxCluesPerCell: '1',
                  useAll: true,
                  wordCount: '8',
                });
                setNotice(null);
              }}
            >
              {t('scanword.settings.example', {
                language: SCANWORD_ALPHABETS[alphabet].name,
              })}
            </button>
          ))}
        </div>
        <div className={styles.fields}>
          <label className={styles.wide} htmlFor={`${id}-title`}>
            {t('scanword.settings.titleLabel')}
            <input
              id={`${id}-title`}
              maxLength={120}
              value={draft.title}
              onChange={(event) => patch({ title: event.target.value })}
            />
          </label>
          <label htmlFor={`${id}-alphabet`}>
            {t('scanword.settings.alphabet')}
            <select
              id={`${id}-alphabet`}
              value={draft.alphabet}
              onChange={(event) => {
                if (isScanwordAlphabet(event.target.value))
                  patch({ alphabet: event.target.value });
              }}
            >
              {(['uk', 'en', 'ru'] as const).map((alphabet) => (
                <option value={alphabet} key={alphabet}>
                  {SCANWORD_ALPHABETS[alphabet].name}
                </option>
              ))}
            </select>
          </label>
          <label htmlFor={`${id}-max`}>
            {t('scanword.settings.maxClues')}
            <select
              id={`${id}-max`}
              value={draft.maxCluesPerCell}
              onChange={(event) =>
                patch({
                  maxCluesPerCell: event.target.value === '1' ? '1' : '2',
                })
              }
            >
              <option value="1">{t('scanword.settings.one')}</option>
              <option value="2">{t('scanword.settings.two')}</option>
            </select>
          </label>
          <label htmlFor={`${id}-rows`}>
            {t('scanword.settings.rows')}
            <input
              id={`${id}-rows`}
              type="number"
              min={4}
              max={20}
              step={1}
              inputMode="numeric"
              value={draft.rows}
              onChange={(event) => {
                if (event.target.value.length <= 2)
                  patch({ rows: event.target.value });
              }}
            />
          </label>
          <label htmlFor={`${id}-columns`}>
            {t('scanword.settings.columns')}
            <input
              id={`${id}-columns`}
              type="number"
              min={4}
              max={20}
              step={1}
              inputMode="numeric"
              value={draft.columns}
              onChange={(event) => {
                if (event.target.value.length <= 2)
                  patch({ columns: event.target.value });
              }}
            />
          </label>
          <div className={styles.wide}>
            <label htmlFor={`${id}-dictionary`}>
              {t('scanword.settings.dictionary')}
            </label>
            <textarea
              id={`${id}-dictionary`}
              aria-describedby={`${id}-dictionary-hint`}
              rows={8}
              maxLength={20000}
              value={draft.dictionary}
              spellCheck={false}
              onChange={(event) => patch({ dictionary: event.target.value })}
            />
            <p className={styles.hint} id={`${id}-dictionary-hint`}>
              {t('scanword.settings.hint')}
            </p>
            <p className={styles.hint}>
              {t('scanword.settings.count', {
                count: draft.dictionary
                  .split('\n')
                  .filter((line) => line.trim()).length,
              })}
            </p>
          </div>
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={draft.useAll}
              onChange={(event) => patch({ useAll: event.target.checked })}
            />
            {t('scanword.settings.useAll')}
          </label>
          <label htmlFor={`${id}-count`}>
            {t('scanword.settings.wordCount')}
            <input
              id={`${id}-count`}
              type="number"
              min={2}
              max={40}
              step={1}
              inputMode="numeric"
              disabled={draft.useAll}
              value={draft.wordCount}
              onChange={(event) => {
                if (event.target.value.length <= 2)
                  patch({ wordCount: event.target.value });
              }}
            />
          </label>
          <label htmlFor={`${id}-givens`}>
            {t('scanword.settings.givens')}
            <input
              id={`${id}-givens`}
              type="number"
              min={0}
              max={400}
              step={1}
              inputMode="numeric"
              value={draft.givenCount}
              onChange={(event) => {
                if (event.target.value.length <= 3)
                  patch({ givenCount: event.target.value });
              }}
            />
          </label>
          <div className={styles.wide}>
            <label htmlFor={`${id}-import`}>
              {t('scanword.settings.import')}
            </label>
            <input
              id={`${id}-import`}
              type="file"
              accept=".txt,.tsv,text/plain,text/tab-separated-values"
              onChange={(event) => {
                const file = event.currentTarget.files?.[0];
                event.currentTarget.value = '';
                if (!file || busy || reading) return;
                if (file.size >= 50000) {
                  setNotice({
                    key: 'scanword.messages.fileSize',
                    danger: true,
                  });
                  return;
                }
                setReading(true);
                setNotice(null);
                void file
                  .text()
                  .then((source) => {
                    if (!mounted.current) return;
                    parseScanwordDictionary(source, draft.alphabet);
                    patch({ dictionary: source });
                    setNotice({ key: 'scanword.messages.dictionaryLoaded' });
                  })
                  .catch((error: unknown) => {
                    if (mounted.current) setNotice(scanwordErrorNotice(error));
                  })
                  .finally(() => {
                    if (mounted.current) setReading(false);
                  });
              }}
            />
            <p className={styles.hint}>{t('scanword.settings.importHint')}</p>
          </div>
        </div>
        <div className={styles.toolbar}>
          <button type="submit" className={styles.primary}>
            {t('scanword.settings.create')}
          </button>
          <button type="button" onClick={() => execute(true)}>
            {t('scanword.settings.apply')}
          </button>
        </div>
      </fieldset>
      <p className={styles.hint}>{t('scanword.settings.applyHint')}</p>
      {notice && (
        <p role="status" className={notice.danger ? styles.error : undefined}>
          {t(notice.key, notice.values)}
        </p>
      )}
      {problem && (
        <p className={styles.warning}>{t('scanword.messages.storage')}</p>
      )}
    </form>
  );
}