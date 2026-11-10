import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { downloadFile } from '../../browser/download-file';
import { CODEWORD_ALPHABETS } from '../../engines/codeword/codeword-input';
import {
  parseCodewordProgressJSON,
  parseCodewordPuzzleJSON,
} from '../../engines/codeword/codeword-json';
import { useTranslation } from '../../i18n/use-translation';
import { renderCodewordSVG } from '../../renderers/codeword-svg';
import CodewordGame from './codeword-game';
import CodewordPrint, { printCodeword } from './codeword-print';
import CodewordSettingsForm from './codeword-settings-form';
import { useCodewordSession } from './use-codeword-session';
import { codewordErrorNotice, useCodewordWorker } from './use-codeword-worker';
import type { CodewordNotice } from './use-codeword-worker';
import type { CodewordWorkerResult } from './codeword-worker.types';
import styles from './codeword.module.scss';
export default function CodewordPage() {
  const { t } = useTranslation();
  const id = useId();
  const session = useCodewordSession();
  const { puzzle, progress, openPuzzle, analysis } = session;
  const boot = useRef(puzzle);
  const mounted = useRef(true);
  const [importing, setImporting] = useState(false);
  const [revision, setRevision] = useState(0);
  const [notice, setNotice] = useState<CodewordNotice | null>(null);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const onResult = useCallback(
    (result: CodewordWorkerResult) => {
      openPuzzle(result.puzzle, result.analysis);
      setNotice(null);
    },
    [openPuzzle],
  );
  const worker = useCodewordWorker(onResult);
  const { run } = worker;
  useEffect(() => {
    run({ type: 'analyze', puzzle: boot.current });
  }, [run]);
  const busy = worker.busy || importing;
  const ready = analysis?.status === 'unique';
  const blocked = busy || !ready;
  const full =
    puzzle.key.length === CODEWORD_ALPHABETS[puzzle.alphabet].letters.length;
  const ruleText = `${t('codeword.rules.main')} ${t(full ? 'codeword.rules.full' : 'codeword.rules.partial')} ${t(puzzle.showWordBank ? 'codeword.rules.bank' : 'codeword.rules.classic')}`;
  const labels = {
    rules: ruleText,
    alphabet: t('codeword.current.alphabet'),
    words: t('codeword.current.words'),
    key: t('codeword.current.key'),
  };
  const name = `codeword-${puzzle.id.replace(/[^a-zA-Z0-9_-]/gu, '_').slice(0, 80)}`;
  const load = async (
    event: ChangeEvent<HTMLInputElement>,
    kind: 'puzzle' | 'progress',
  ) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file || busy) return;
    if (file.size >= 1_000_000) {
      setNotice({ key: 'codeword.messages.fileSize', danger: true });
      return;
    }
    setImporting(true);
    setNotice(null);
    try {
      const source = await file.text();
      if (!mounted.current) return;
      if (kind === 'puzzle')
        run({ type: 'analyze', puzzle: parseCodewordPuzzleJSON(source) });
      else {
        session.setProgress(parseCodewordProgressJSON(source, puzzle));
        setRevision((value) => value + 1);
        setNotice({ key: 'codeword.messages.progressLoaded' });
      }
    } catch (error) {
      if (mounted.current) setNotice(codewordErrorNotice(error));
    } finally {
      if (mounted.current) setImporting(false);
    }
  };
  const message = notice ?? worker.notice;
  return (
    <section className={styles.page}>
      <h1>{t('navigation.codeword')}</h1>
      <p>{t('codeword.intro')}</p>
      <details className={styles.card} open>
        <summary>{t('codeword.rules.title')}</summary>
        <p>{ruleText}</p>
        <p>{t('codeword.rules.controls')}</p>
        <p className={styles.hint}>{t('codeword.rules.scope')}</p>
      </details>
      <CodewordSettingsForm
        key={puzzle.id}
        puzzle={puzzle}
        busy={busy}
        onRun={(request) => {
          setNotice(null);
          run(request);
        }}
      />
      {worker.busy && (
        <div className={styles.toolbar}>
          <p role="status">{t('codeword.messages.busy')}</p>
          <button type="button" onClick={worker.cancel}>
            {t('codeword.messages.cancel')}
          </button>
        </div>
      )}
      {message && (
        <p role="status" className={message.danger ? styles.error : undefined}>
          {t(message.key, message.values)}
        </p>
      )}
      <p role="status" className={ready ? styles.success : styles.warning}>
        {t(
          !analysis
            ? 'codeword.analysis.pending'
            : analysis.status === 'unique'
              ? analysis.scope === 'word-bank'
                ? 'codeword.analysis.uniqueBank'
                : 'codeword.analysis.uniqueDictionary'
              : `codeword.analysis.${analysis.status}`,
          { count: analysis?.wordCount ?? 0 },
        )}
      </p>
      {!ready && <p className={styles.hint}>{t('codeword.current.blocked')}</p>}
      {session.problem && (
        <p className={styles.warning}>{t('codeword.messages.storage')}</p>
      )}
      <CodewordGame
        key={`${puzzle.id}:${revision}`}
        puzzle={puzzle}
        progress={progress}
        busy={busy || analysis === null}
        onProgress={session.setProgress}
      />
      <section className={styles.card}>
        <h3>
          {t('codeword.tools.title')}: {puzzle.title}
        </h3>
        <div className={styles.toolbar}>
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              downloadFile(
                `${name}-draft.json`,
                JSON.stringify(puzzle, null, 2),
                'application/json;charset=utf-8',
              )
            }
          >
            {t('codeword.tools.draft')}
          </button>
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
            {t('codeword.tools.puzzleExport')}
          </button>
          <button
            type="button"
            disabled={busy || analysis === null}
            onClick={() =>
              downloadFile(
                `${name}-progress.json`,
                JSON.stringify(progress, null, 2),
                'application/json;charset=utf-8',
              )
            }
          >
            {t('codeword.tools.progressExport')}
          </button>
          <button
            type="button"
            disabled={blocked}
            onClick={() =>
              downloadFile(
                `${name}-task.svg`,
                renderCodewordSVG(puzzle, false, labels),
                'image/svg+xml;charset=utf-8',
              )
            }
          >
            {t('codeword.tools.taskSvg')}
          </button>
          <button
            type="button"
            disabled={blocked}
            onClick={() =>
              downloadFile(
                `${name}-answers.svg`,
                renderCodewordSVG(puzzle, true, labels),
                'image/svg+xml;charset=utf-8',
              )
            }
          >
            {t('codeword.tools.solutionSvg')}
          </button>
          <button
            type="button"
            disabled={blocked}
            onClick={() => {
              void printCodeword('task');
            }}
          >
            {t('codeword.tools.taskPrint')}
          </button>
          <button
            type="button"
            disabled={blocked}
            onClick={() => {
              void printCodeword('solution');
            }}
          >
            {t('codeword.tools.solutionPrint')}
          </button>
          <button
            type="button"
            disabled={blocked}
            onClick={() => {
              void printCodeword('both');
            }}
          >
            {t('codeword.tools.bothPrint')}
          </button>
        </div>
        <div className={styles.fileInputs}>
          <label htmlFor={`${id}-puzzle-file`}>
            {t('codeword.tools.puzzleImport')}
            <input
              id={`${id}-puzzle-file`}
              type="file"
              accept=".json,application/json"
              disabled={busy}
              onChange={(event) => {
                void load(event, 'puzzle');
              }}
            />
          </label>
          <label htmlFor={`${id}-progress-file`}>
            {t('codeword.tools.progressImport')}
            <input
              id={`${id}-progress-file`}
              type="file"
              accept=".json,application/json"
              disabled={busy || analysis === null}
              onChange={(event) => {
                void load(event, 'progress');
              }}
            />
          </label>
        </div>
      </section>
      <CodewordPrint puzzle={puzzle} labels={labels} ready={ready} />
    </section>
  );
}