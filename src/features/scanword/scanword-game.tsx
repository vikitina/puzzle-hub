import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { SCANWORD_ALPHABETS } from '../../engines/scanword/scanword-input';
import {
  createScanwordProgress,
  inspectScanword,
  setScanwordCell,
  setScanwordEntry,
} from '../../engines/scanword/scanword-rules';
import type {
  ScanwordProgress,
  ScanwordPuzzle,
} from '../../engines/scanword/scanword.types';
import { useTranslation } from '../../i18n/use-translation';
import ScanwordBoard, { nextScanwordCell } from './scanword-board';
import type { ScanwordView } from './scanword-board';
import { scanwordErrorNotice } from './use-scanword-worker';
import type { ScanwordNotice } from './use-scanword-worker';
import styles from './scanword.module.scss';
export default function ScanwordGame({
  puzzle,
  progress,
  busy,
  onProgress,
}: {
  puzzle: ScanwordPuzzle;
  progress: ScanwordProgress;
  busy: boolean;
  onProgress: (progress: ScanwordProgress) => void;
}) {
  const { t } = useTranslation();
  const id = useId(),
    letterInput = useRef<HTMLInputElement>(null),
    focusRequested = useRef(false);
  const [view, setView] = useState<ScanwordView>('play'),
    [entryId, setEntryId] = useState(puzzle.entries[0]!.id);
  const [selected, setSelected] = useState<number>(
    () =>
      puzzle.entries[0]!.path.find(
        (index) => !puzzle.givens.some((given) => given.index === index),
      ) ?? puzzle.entries[0]!.path[0]!,
  );
  const [word, setWord] = useState(''),
    [history, setHistory] = useState<ScanwordProgress[]>([]),
    [showMistakes, setShowMistakes] = useState(false),
    [notice, setNotice] = useState<ScanwordNotice | null>(null);
  const inspection = useMemo(
    () => inspectScanword(puzzle, progress),
    [puzzle, progress],
  );
  const entry = puzzle.entries.find((item) => item.id === entryId)!;
  const fixed = puzzle.givens.some((given) => given.index === selected);
  useEffect(() => {
    if (focusRequested.current) {
      letterInput.current?.focus();
      letterInput.current?.select();
      focusRequested.current = false;
    }
  }, [selected, entryId]);
  const selectEntry = (targetId: string) => {
    const target = puzzle.entries.find((item) => item.id === targetId);
    if (!target) return;
    focusRequested.current = true;
    setEntryId(target.id);
    setWord('');
    setNotice(null);
    setSelected(
      target.path.find(
        (index) => !puzzle.givens.some((given) => given.index === index),
      ) ?? target.path[0]!,
    );
    letterInput.current?.focus();
    letterInput.current?.select();
  };
  const selectCell = (index: number) => {
    const owners = puzzle.entries.filter((item) => item.path.includes(index));
    const current = owners.findIndex((item) => item.id === entryId);
    const target =
      selected === index && owners.length > 1
        ? owners[(current + 1) % owners.length]!
        : (owners.find((item) => item.id === entryId) ?? owners[0]!);
    focusRequested.current = true;
    setEntryId(target.id);
    setSelected(index);
    setWord('');
    setNotice(null);
    letterInput.current?.focus();
    letterInput.current?.select();
  };
  const commit = (next: ScanwordProgress) => {
    if (next.cells.every((value, index) => value === progress.cells[index]))
      return;
    setHistory((current) => [...current.slice(-99), progress]);
    onProgress(next);
    setNotice(null);
  };
  const assign = (letter: string | null) => {
    if (busy || fixed) return;
    try {
      commit(setScanwordCell(puzzle, progress, selected, letter));
      if (letter) {
        const next = entry.path
          .slice(entry.path.indexOf(selected) + 1)
          .find(
            (index) => !puzzle.givens.some((given) => given.index === index),
          );
        if (next !== undefined) {
          focusRequested.current = true;
          setSelected(next);
        }
      }
    } catch (error) {
      setNotice(scanwordErrorNotice(error));
    }
  };
  return (
    <section className={styles.card} data-scanword-game>
      <h2>
        {t('scanword.current.title')}: {puzzle.title}
      </h2>
      <div
        className={styles.toolbar}
        role="group"
        aria-label={t('scanword.views.label')}
      >
        {(['play', 'task', 'solution'] as const).map((mode) => (
          <button
            type="button"
            aria-pressed={view === mode}
            key={mode}
            onClick={() => setView(mode)}
          >
            {t(`scanword.views.${mode}`)}
          </button>
        ))}
      </div>
      <ScanwordBoard
        puzzle={puzzle}
        letters={inspection.letters}
        view={view}
        entryId={entryId}
        selected={selected}
        mistakes={new Set(showMistakes ? inspection.mistakes : [])}
        busy={busy}
        onCell={selectCell}
        onEntry={selectEntry}
      />
      {view === 'play' && (
        <>
          <div className={styles.activeClue} aria-live="polite">
            <strong>
              {t('scanword.play.selected')}: {entry.clue}
            </strong>
            <p>
              {t('scanword.play.length', {
                direction: t(`scanword.directions.${entry.direction}`),
                length: entry.path.length,
              })}
            </p>
          </div>
          <fieldset className={styles.playControls} disabled={busy}>
            <div className={styles.fields}>
              <label htmlFor={`${id}-letter`}>
                {t('scanword.play.letter')}
                <input
                  id={`${id}-letter`}
                  ref={letterInput}
                  className={styles.singleLetter}
                  value={inspection.letters[selected] ?? ''}
                  maxLength={1}
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  readOnly={fixed}
                  onFocus={(event) => event.currentTarget.select()}
                  onChange={(event) => assign(event.target.value || null)}
                  onKeyDown={(event) => {
                    const moves = {
                      ArrowRight: [0, 1],
                      ArrowDown: [1, 0],
                      ArrowLeft: [0, -1],
                      ArrowUp: [-1, 0],
                    } as const;
                    if (event.key in moves) {
                      event.preventDefault();
                      const [dr, dc] = moves[event.key as keyof typeof moves];
                      const next = nextScanwordCell(puzzle, selected, dr, dc);
                      if (next !== null) selectCell(next);
                    } else if (event.key === 'Delete') {
                      event.preventDefault();
                      assign(null);
                    }
                  }}
                />
              </label>
              <div>
                <label htmlFor={`${id}-word`}>{t('scanword.play.word')}</label>
                <div className={styles.answerInput}>
                  <input
                    id={`${id}-word`}
                    value={word}
                    maxLength={20}
                    autoComplete="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                    onChange={(event) => setWord(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        try {
                          commit(
                            setScanwordEntry(puzzle, progress, entryId, word),
                          );
                          setWord('');
                        } catch (error) {
                          setNotice(scanwordErrorNotice(error));
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        commit(
                          setScanwordEntry(puzzle, progress, entryId, word),
                        );
                        setWord('');
                      } catch (error) {
                        setNotice(scanwordErrorNotice(error));
                      }
                    }}
                  >
                    {t('scanword.play.putWord')}
                  </button>
                </div>
              </div>
            </div>
            <div
              className={styles.palette}
              role="group"
              aria-label={t('scanword.play.alphabet')}
            >
              {[...SCANWORD_ALPHABETS[puzzle.alphabet].letters].map(
                (letter) => (
                  <button
                    type="button"
                    key={letter}
                    disabled={fixed}
                    onClick={() => assign(letter)}
                  >
                    {letter}
                  </button>
                ),
              )}
            </div>
            <div className={styles.toolbar}>
              <button
                type="button"
                disabled={fixed}
                onClick={() => assign(null)}
              >
                {t('scanword.play.clear')}
              </button>
              <button
                type="button"
                disabled={!history.length}
                onClick={() => {
                  const previous = history.at(-1);
                  if (previous) {
                    onProgress(previous);
                    setHistory((current) => current.slice(0, -1));
                    setNotice(null);
                  }
                }}
              >
                {t('scanword.play.undo')}
              </button>
              <button
                type="button"
                onClick={() => commit(createScanwordProgress(puzzle))}
              >
                {t('scanword.play.reset')}
              </button>
            </div>
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={showMistakes}
                onChange={(event) => setShowMistakes(event.target.checked)}
              />
              {t('scanword.play.mistakes')}
            </label>
          </fieldset>
          <p
            role="status"
            className={inspection.solved ? styles.success : undefined}
          >
            {inspection.solved
              ? t('scanword.play.solved')
              : t('scanword.play.progress', {
                  filled: inspection.filled,
                  total: inspection.total,
                  words: inspection.filledEntries,
                  entries: puzzle.entries.length,
                })}
          </p>
          {notice && (
            <p role="status" className={styles.error}>
              {t(notice.key, notice.values)}
            </p>
          )}
        </>
      )}
    </section>
  );
}