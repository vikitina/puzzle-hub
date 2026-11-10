import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import {
  parseFillwordProgressJSON,
  parseFillwordPuzzleJSON,
} from '../../engines/fillword/fillword-json';
import type { FillwordPuzzle } from '../../engines/fillword/fillword.types';
import { useTranslation } from '../../i18n/use-translation';
import { renderFillwordSVG } from '../../renderers/fillword-svg';
import { downloadFillwordFile } from './fillword-files';
import FillwordGame from './fillword-game';
import FillwordPrint, { printFillword } from './fillword-print';
import FillwordSettingsForm from './fillword-settings-form';
import {
  fillwordErrorNotice,
  useFillwordGenerator,
} from './use-fillword-generator';
import type { FillwordNotice } from './use-fillword-generator';
import { useFillwordSession } from './use-fillword-session';
import styles from './fillword.module.scss';

export default function FillwordPage() {
  const { t } = useTranslation();
  const id = useId();
  const session = useFillwordSession();
  const { puzzle, progress, openPuzzle } = session;
  const [notice, setNotice] = useState<FillwordNotice | null>(null);
  const [importing, setImporting] = useState(false);
  const [revision, setRevision] = useState(0);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const onGenerated = useCallback(
    (puzzle: FillwordPuzzle) => {
      openPuzzle(puzzle);
      setNotice(null);
    },
    [openPuzzle],
  );
  const generation = useFillwordGenerator(onGenerated);
  const busy = generation.busy || importing;
  const ruleText =
    puzzle.config.mode === 'snake'
      ? t('fillword.rules.snake')
      : `${t('fillword.rules.straight')} ${t('fillword.rules.direction', { directions: t(`fillword.directions.${puzzle.config.directions}`) })}`;
  const name = `fillword-${puzzle.id.replace(/[^a-zA-Z0-9_-]/gu, '_').slice(0, 80)}`;
  const load = async (
    event: ChangeEvent<HTMLInputElement>,
    kind: 'puzzle' | 'progress',
  ) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file || busy) return;
    if (file.size >= 1_000_000) {
      setNotice({ key: 'fillword.messages.largeFile', danger: true });
      return;
    }
    setImporting(true);
    setNotice(null);
    try {
      const source = await file.text();
      if (!mounted.current) return;
      if (kind === 'puzzle') {
        openPuzzle(parseFillwordPuzzleJSON(source));
        setNotice({ key: 'fillword.messages.puzzleLoaded' });
      } else {
        session.setProgress(parseFillwordProgressJSON(source, puzzle));
        setNotice({ key: 'fillword.messages.progressLoaded' });
      }
      setRevision((current) => current + 1);
    } catch (error) {
      if (mounted.current) setNotice(fillwordErrorNotice(error));
    } finally {
      if (mounted.current) setImporting(false);
    }
  };
  const message = notice ?? generation.notice;
  return (
    <section className={styles.page}>
      <p className="eyebrow">
        {puzzle.config.rows} × {puzzle.config.columns}
      </p>
      <h1>{t('navigation.wordSearch')}</h1>
      <p>{t('fillword.intro')}</p>
      <FillwordSettingsForm
        key={puzzle.id}
        puzzle={puzzle}
        busy={busy}
        generating={generation.busy}
        onCancel={generation.cancel}
        onGenerate={(options) => {
          setNotice(null);
          generation.generate(options);
        }}
      />
      {generation.busy && <p role="status">{t('fillword.settings.running')}</p>}
      {message && (
        <p
          role="status"
          className={message.danger ? styles.error : styles.success}
        >
          {t(message.key, message.values)}
        </p>
      )}
      {session.problem && (
        <p className={styles.warning}>{t('fillword.messages.storage')}</p>
      )}
      <p className={styles.rules}>{ruleText}</p>
      <FillwordGame
        key={`${puzzle.id}:${revision}`}
        puzzle={puzzle}
        progress={progress}
        busy={busy}
        onProgress={session.setProgress}
        onUndo={session.undo}
        onReset={session.reset}
      />
      <section className={styles.tools}>
        <h3>{t('fillword.tools.title')}</h3>
        <fieldset disabled={busy}>
          <div className={styles.toolbar}>
            <button
              type="button"
              onClick={() =>
                downloadFillwordFile(
                  `${name}.json`,
                  JSON.stringify(puzzle, null, 2),
                  'application/json;charset=utf-8',
                )
              }
            >
              {t('fillword.tools.puzzleExport')}
            </button>
            <button
              type="button"
              onClick={() =>
                downloadFillwordFile(
                  `${name}-progress.json`,
                  JSON.stringify(progress, null, 2),
                  'application/json;charset=utf-8',
                )
              }
            >
              {t('fillword.tools.progressExport')}
            </button>
            <button
              type="button"
              onClick={() =>
                downloadFillwordFile(
                  `${name}-task.svg`,
                  renderFillwordSVG(puzzle, false, ruleText),
                  'image/svg+xml;charset=utf-8',
                )
              }
            >
              {t('fillword.tools.taskSvg')}
            </button>
            <button
              type="button"
              onClick={() =>
                downloadFillwordFile(
                  `${name}-answers.svg`,
                  renderFillwordSVG(puzzle, true, ruleText),
                  'image/svg+xml;charset=utf-8',
                )
              }
            >
              {t('fillword.tools.solutionSvg')}
            </button>
          </div>
          <div className={styles.fileInputs}>
            <label htmlFor={`${id}-puzzle-file`}>
              {t('fillword.tools.puzzleImport')}
              <input
                id={`${id}-puzzle-file`}
                type="file"
                accept=".json,application/json"
                onChange={(event) => {
                  void load(event, 'puzzle');
                }}
              />
            </label>
            <label htmlFor={`${id}-progress-file`}>
              {t('fillword.tools.progressImport')}
              <input
                id={`${id}-progress-file`}
                type="file"
                accept=".json,application/json"
                onChange={(event) => {
                  void load(event, 'progress');
                }}
              />
            </label>
          </div>
          <div className={styles.toolbar}>
            <button type="button" onClick={() => printFillword('task')}>
              {t('fillword.tools.taskPrint')}
            </button>
            <button type="button" onClick={() => printFillword('solution')}>
              {t('fillword.tools.solutionPrint')}
            </button>
            <button type="button" onClick={() => printFillword('both')}>
              {t('fillword.tools.bothPrint')}
            </button>
          </div>
        </fieldset>
      </section>
      <FillwordPrint puzzle={puzzle} ruleText={ruleText} />
    </section>
  );
}