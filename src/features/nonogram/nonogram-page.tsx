import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { downloadFile } from '../../browser/download-file';
import {
  parseNonogramProgressJSON,
  parseNonogramPuzzleJSON,
} from '../../engines/nonogram/nonogram-json';
import { useTranslation } from '../../i18n/use-translation';
import { renderNonogramSVG } from '../../renderers/nonogram-svg';
import NonogramEditor from './nonogram-editor';
import NonogramGame from './nonogram-game';
import NonogramPrint, { printNonogram } from './nonogram-print';
import { useNonogramEditor } from './use-nonogram-editor';
import { useNonogramSession } from './use-nonogram-session';
import { nonogramErrorNotice, useNonogramWorker } from './use-nonogram-worker';
import type { NonogramNotice, NonogramOperation } from './use-nonogram-worker';
import type { NonogramWorkerResult } from './nonogram-worker.types';
import styles from './nonogram.module.scss';

export default function NonogramPage() {
  const { t } = useTranslation();
  const id = useId();
  const session = useNonogramSession();
  const { puzzle, progress, openVerifiedPuzzle } = session;
  const editor = useNonogramEditor(puzzle);
  const { replaceDrawing } = editor;
  const bootPuzzle = useRef(puzzle);
  const mounted = useRef(true);
  const [importing, setImporting] = useState(false);
  const [notice, setNotice] = useState<NonogramNotice | null>(null);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const onResult = useCallback(
    (result: NonogramWorkerResult, operation: NonogramOperation) => {
      if (result.analysis.status !== 'unique') return;
      openVerifiedPuzzle(result.puzzle);
      if (operation !== 'boot') replaceDrawing(result.puzzle);
    },
    [openVerifiedPuzzle, replaceDrawing],
  );
  const worker = useNonogramWorker(onResult);
  const { run } = worker;
  useEffect(() => {
    run({ type: 'analyze', puzzle: bootPuzzle.current }, 'boot');
  }, [run]);
  const busy = worker.busy || importing;
  const blocked = busy || !session.verified;
  const ruleText = t('nonogram.rules.text');
  const name = `nonogram-${puzzle.id.replace(/[^a-zA-Z0-9_-]/gu, '_').slice(0, 80)}`;
  const load = async (
    event: ChangeEvent<HTMLInputElement>,
    kind: 'puzzle' | 'progress',
  ) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file || busy) return;
    if (file.size >= 1_000_000) {
      setNotice({ key: 'nonogram.messages.fileSize', danger: true });
      return;
    }
    setImporting(true);
    setNotice(null);
    try {
      const source = await file.text();
      if (!mounted.current) return;
      if (kind === 'puzzle') {
        const drawing = parseNonogramPuzzleJSON(source);
        replaceDrawing(drawing);
        run({ type: 'analyze', puzzle: drawing }, 'import');
      } else {
        session.setProgress(parseNonogramProgressJSON(source, puzzle));
        setRevision((value) => value + 1);
        setNotice({ key: 'nonogram.messages.progressLoaded' });
      }
    } catch (error) {
      if (mounted.current) setNotice(nonogramErrorNotice(error));
    } finally {
      if (mounted.current) setImporting(false);
    }
  };
  const message = notice ?? worker.notice;
  return (
    <section className={styles.page}>
      <h1>{t('navigation.nonogram')}</h1>
      <p>{t('nonogram.intro')}</p>
      <details className={styles.card} open>
        <summary>{t('nonogram.rules.title')}</summary>
        <p>{ruleText}</p>
        <p>{t('nonogram.rules.example')}</p>
        <p>{t('nonogram.rules.zero')}</p>
        <p>{t('nonogram.rules.marks')}</p>
      </details>
      <NonogramEditor
        editor={editor}
        busy={busy}
        onAnalyze={(drawing) => {
          setNotice(null);
          run({ type: 'analyze', puzzle: drawing }, 'manual');
        }}
        onGenerate={(options) => {
          setNotice(null);
          run({ type: 'generate', options }, 'random');
        }}
      />
      {worker.busy && (
        <div className={styles.toolbar}>
          <p role="status">{t('nonogram.messages.busy')}</p>
          <button type="button" onClick={worker.cancel}>
            {t('nonogram.messages.cancel')}
          </button>
        </div>
      )}
      {message && (
        <p
          role="status"
          className={message.danger ? styles.error : styles.success}
        >
          {t(message.key)}
        </p>
      )}
      {(session.problem || editor.problem) && (
        <p className={styles.warning}>{t('nonogram.messages.storage')}</p>
      )}
      <NonogramGame
        key={`${puzzle.id}:${revision}`}
        puzzle={puzzle}
        progress={progress}
        verified={session.verified}
        busy={busy}
        onProgress={session.setProgress}
      />
      <section className={styles.card}>
        <h3>
          {t('nonogram.tools.title')}: {puzzle.title}
        </h3>
        <div className={styles.toolbar}>
          <button
            type="button"
            disabled={blocked}
            onClick={() =>
              downloadFile(
                `${name}.json`,
                JSON.stringify(puzzle, null, 2),
                'application/json;charset=utf-8',
              )
            }
          >
            {t('nonogram.tools.puzzleExport')}
          </button>
          <button
            type="button"
            disabled={blocked}
            onClick={() =>
              downloadFile(
                `${name}-progress.json`,
                JSON.stringify(progress, null, 2),
                'application/json;charset=utf-8',
              )
            }
          >
            {t('nonogram.tools.progressExport')}
          </button>
          <button
            type="button"
            disabled={blocked}
            onClick={() =>
              downloadFile(
                `${name}-task.svg`,
                renderNonogramSVG(puzzle, false, ruleText),
                'image/svg+xml;charset=utf-8',
              )
            }
          >
            {t('nonogram.tools.taskSvg')}
          </button>
          <button
            type="button"
            disabled={blocked}
            onClick={() =>
              downloadFile(
                `${name}-answers.svg`,
                renderNonogramSVG(puzzle, true, ruleText),
                'image/svg+xml;charset=utf-8',
              )
            }
          >
            {t('nonogram.tools.solutionSvg')}
          </button>
          <button
            type="button"
            disabled={blocked}
            onClick={() => {
              void printNonogram('task');
            }}
          >
            {t('nonogram.tools.taskPrint')}
          </button>
          <button
            type="button"
            disabled={blocked}
            onClick={() => {
              void printNonogram('solution');
            }}
          >
            {t('nonogram.tools.solutionPrint')}
          </button>
          <button
            type="button"
            disabled={blocked}
            onClick={() => {
              void printNonogram('both');
            }}
          >
            {t('nonogram.tools.bothPrint')}
          </button>
        </div>
        <div className={styles.fileInputs}>
          <label htmlFor={`${id}-puzzle-file`}>
            {t('nonogram.tools.puzzleImport')}
            <input
              id={`${id}-puzzle-file`}
              disabled={busy}
              type="file"
              accept=".json,application/json"
              onChange={(event) => {
                void load(event, 'puzzle');
              }}
            />
          </label>
          <label htmlFor={`${id}-progress-file`}>
            {t('nonogram.tools.progressImport')}
            <input
              id={`${id}-progress-file`}
              disabled={blocked}
              type="file"
              accept=".json,application/json"
              onChange={(event) => {
                void load(event, 'progress');
              }}
            />
          </label>
        </div>
      </section>
      <NonogramPrint
        puzzle={puzzle}
        verified={session.verified}
        ruleText={ruleText}
      />
    </section>
  );
}