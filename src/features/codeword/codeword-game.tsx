import { useMemo, useRef, useState } from 'react';
import { codewordAvailableLetters } from '../../engines/codeword/codeword-puzzle';
import {
  createCodewordProgress,
  inspectCodeword,
  setCodewordLetter,
} from '../../engines/codeword/codeword-rules';
import type {
  CodewordProgress,
  CodewordPuzzle,
} from '../../engines/codeword/codeword.types';
import { useTranslation } from '../../i18n/use-translation';
import CodewordBoard from './codeword-board';
import type { CodewordView } from './codeword-board';
import { codewordErrorNotice } from './use-codeword-worker';
import type { CodewordNotice } from './use-codeword-worker';
import styles from './codeword.module.scss';
interface Props {
  puzzle: CodewordPuzzle;
  progress: CodewordProgress;
  busy: boolean;
  onProgress: (progress: CodewordProgress) => void;
}
export default function CodewordGame({
  puzzle,
  progress,
  busy,
  onProgress,
}: Props) {
  const { t } = useTranslation();
  const [view, setView] = useState<CodewordView>('play');
  const [selected, setSelected] = useState<number | null>(
    () =>
      puzzle.key.findIndex(
        (_, index) => !puzzle.givens.some((given) => given.code === index + 1),
      ) + 1 || null,
  );
  const [showMistakes, setShowMistakes] = useState(false);
  const [history, setHistory] = useState<CodewordProgress[]>([]);
  const [notice, setNotice] = useState<CodewordNotice | null>(null);
  const refs = useRef(new Map<number, HTMLInputElement>());
  const inspection = useMemo(
    () => inspectCodeword(puzzle, progress),
    [puzzle, progress],
  );
  const given = new Map(
    puzzle.givens.map((entry) => [entry.code, entry.letter]),
  );
  const letters = codewordAvailableLetters(puzzle);
  const assign = (code: number, letter: string | null) => {
    if (busy || given.has(code)) return;
    try {
      const next = setCodewordLetter(puzzle, progress, code, letter);
      if (
        next.assignments.every((value, i) => value === progress.assignments[i])
      )
        return;
      setHistory((current) => [...current.slice(-99), progress]);
      onProgress(next);
      setNotice(null);
    } catch (error) {
      setNotice(codewordErrorNotice(error));
    }
  };
  const select = (code: number) => {
    setSelected(code);
    refs.current.get(code)?.focus();
    refs.current.get(code)?.select();
  };
  return (
    <section className={styles.card} data-codeword-game>
      <h2>
        {t('codeword.current.title')}: {puzzle.title}
      </h2>
      <p>
        {t('codeword.current.stats', {
          rows: puzzle.rows,
          columns: puzzle.columns,
          words: puzzle.words.length,
          letters: puzzle.key.length,
          cells: puzzle.cells.filter((code) => code !== null).length,
        })}
      </p>
      <div
        className={styles.toolbar}
        role="group"
        aria-label={t('codeword.views.label')}
      >
        {(['play', 'task', 'solution'] as const).map((mode) => (
          <button
            type="button"
            key={mode}
            aria-pressed={view === mode}
            onClick={() => setView(mode)}
          >
            {t(`codeword.views.${mode}`)}
          </button>
        ))}
      </div>
      <CodewordBoard
        puzzle={puzzle}
        view={view}
        entries={inspection.entries}
        selected={selected}
        busy={busy}
        conflicts={new Set(inspection.conflicts)}
        mistakes={new Set(showMistakes ? inspection.mistakes : [])}
        onSelect={select}
      />
      <h3>{t('codeword.current.key')}</h3>
      <div className={styles.keyTable}>
        {puzzle.key.map((answer, index) => {
          const code = index + 1;
          const value =
            view === 'solution'
              ? answer
              : view === 'task'
                ? (given.get(code) ?? '')
                : (inspection.entries[index] ?? '');
          return (
            <label
              key={code}
              className={styles.keyItem}
              data-selected={view === 'play' && selected === code}
              data-conflict={
                view === 'play' && inspection.conflicts.includes(code)
              }
            >
              <span>
                {code}
                {given.has(code) ? ' *' : ''}
              </span>
              {view === 'play' ? (
                <input
                  type="text"
                  inputMode="text"
                  maxLength={1}
                  autoComplete="off"
                  spellCheck={false}
                  readOnly={given.has(code)}
                  disabled={busy}
                  value={value}
                  aria-label={`${t('codeword.code', { code })}${given.has(code) ? `, ${t('codeword.given')}` : ''}`}
                  ref={(node) => {
                    if (node) refs.current.set(code, node);
                    else refs.current.delete(code);
                  }}
                  onFocus={(event) => {
                    setSelected(code);
                    event.currentTarget.select();
                  }}
                  onChange={(event) => assign(code, event.target.value || null)}
                />
              ) : (
                <span className={styles.keyLetter}>{value}</span>
              )}
            </label>
          );
        })}
      </div>
      <p className={styles.hint}>{t('codeword.given')}: *</p>
      <h3>{t('codeword.current.alphabet')}</h3>
      {view === 'play' ? (
        <>
          <p>{t('codeword.selected', { code: selected ?? '—' })}</p>
          <div className={styles.palette}>
            {letters.map((letter) => (
              <button
                type="button"
                key={letter}
                disabled={busy || selected === null || given.has(selected)}
                data-used={inspection.entries.includes(letter)}
                onClick={() => {
                  if (selected !== null) assign(selected, letter);
                }}
              >
                {letter}
              </button>
            ))}
          </div>
          <div className={styles.toolbar}>
            <button
              type="button"
              disabled={busy || selected === null || given.has(selected)}
              onClick={() => {
                if (selected !== null) assign(selected, null);
              }}
            >
              {t('codeword.play.clear')}
            </button>
            <button
              type="button"
              disabled={busy || history.length === 0}
              onClick={() => {
                const previous = history.at(-1);
                if (previous) {
                  onProgress(previous);
                  setHistory((current) => current.slice(0, -1));
                  setNotice(null);
                }
              }}
            >
              {t('codeword.play.undo')}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                onProgress(createCodewordProgress(puzzle));
                setHistory([]);
                setNotice(null);
              }}
            >
              {t('codeword.play.reset')}
            </button>
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={showMistakes}
                onChange={(event) => setShowMistakes(event.target.checked)}
              />
              {t('codeword.play.mistakes')}
            </label>
          </div>
          <p
            role="status"
            className={
              inspection.conflicts.length
                ? styles.error
                : inspection.solved
                  ? styles.success
                  : undefined
            }
          >
            {t(
              inspection.solved
                ? inspection.authorSolution
                  ? 'codeword.play.solved'
                  : 'codeword.play.alternative'
                : inspection.conflicts.length
                  ? 'codeword.play.duplicate'
                  : 'codeword.play.open',
              { filled: inspection.filled, total: puzzle.key.length },
            )}
          </p>
          <p className={styles.hint}>{t('codeword.rules.controls')}</p>
        </>
      ) : (
        <p className={styles.available}>{letters.join(' ')}</p>
      )}
      {puzzle.showWordBank && (
        <>
          <h3>{t('codeword.current.words')}</h3>
          <p className={styles.wordBank}>{puzzle.words.join(' · ')}</p>
        </>
      )}
      {notice && (
        <p role="status" className={styles.error}>
          {t(notice.key, notice.values)}
        </p>
      )}
    </section>
  );
}