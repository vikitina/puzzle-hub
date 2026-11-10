import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { downloadFile } from '../../browser/download-file';
import { scanwordPublicationIssues } from '../../engines/scanword/scanword-clues';
import {
  parseScanwordProgressJSON,
  parseScanwordPuzzleJSON,
} from '../../engines/scanword/scanword-json';
import type { ScanwordPuzzle } from '../../engines/scanword/scanword.types';
import { useTranslation } from '../../i18n/use-translation';
import {
  renderScanwordSVG,
  scanwordSVGSize,
} from '../../renderers/scanword-svg';
import ScanwordGame from './scanword-game';
import ScanwordPrint, { printScanword } from './scanword-print';
import ScanwordSettingsForm from './scanword-settings-form';
import { SCANWORD_EXAMPLES } from './scanword-examples';
import { useScanwordPrintSettings } from './use-scanword-print-settings';
import { useScanwordSession } from './use-scanword-session';
import { preserveScanwordDraft } from './use-scanword-draft';
import type { ScanwordWorkerRequest } from './scanword-worker.types';
import { scanwordErrorNotice, useScanwordWorker } from './use-scanword-worker';
import type { ScanwordNotice } from './use-scanword-worker';
import styles from './scanword.module.scss';
export default function ScanwordPage() {
  const { t } = useTranslation(),
    id = useId();
  const session = useScanwordSession(),
    { puzzle, progress, validated, openPuzzle } = session;
  const boot = useRef(puzzle),
    mounted = useRef(true);
  const [importing, setImporting] = useState(false),
    [revision, setRevision] = useState(0),
    [notice, setNotice] = useState<ScanwordNotice | null>(null);
  const { cellMm, setCellMm } = useScanwordPrintSettings();
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const onResult = useCallback(
    (next: ScanwordPuzzle, request: ScanwordWorkerRequest) => {
      const draftSaved =
        request.type === 'validate' || preserveScanwordDraft(next, request);
      openPuzzle(next);
      setNotice(
        draftSaved ? null : { key: 'scanword.messages.storage', danger: true },
      );
    },
    [openPuzzle],
  );
  const worker = useScanwordWorker(onResult),
    { run } = worker;
  useEffect(() => {
    run({ type: 'validate', puzzle: boot.current });
  }, [run]);
  const busy = worker.busy || importing,
    issues = scanwordPublicationIssues(puzzle),
    ready = validated && issues.length === 0;
  const labels = { rules: t('scanword.rules.main') },
    size = scanwordSVGSize(puzzle, labels, cellMm);
  const name = `scanword-${puzzle.id.replace(/[^a-zA-Z0-9_-]/gu, '_').slice(0, 80)}`;
  const load = async (
    event: ChangeEvent<HTMLInputElement>,
    kind: 'puzzle' | 'progress',
  ) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file || busy) return;
    if (file.size >= 1_000_000) {
      setNotice({ key: 'scanword.messages.fileSize', danger: true });
      return;
    }
    setImporting(true);
    setNotice(null);
    try {
      const source = await file.text();
      if (!mounted.current) return;
      if (kind === 'puzzle')
        run({ type: 'validate', puzzle: parseScanwordPuzzleJSON(source) });
      else {
        session.setProgress(parseScanwordProgressJSON(source, puzzle));
        setRevision((value) => value + 1);
        setNotice({ key: 'scanword.messages.progressLoaded' });
      }
    } catch (error) {
      if (mounted.current) setNotice(scanwordErrorNotice(error));
    } finally {
      if (mounted.current) setImporting(false);
    }
  };
  const message = notice ?? worker.notice;
  const white = puzzle.cells.flatMap((letter, index) =>
    letter === null ? [] : [index],
  );
  const crossings = white.filter(
    (index) =>
      puzzle.entries.filter((entry) => entry.path.includes(index)).length === 2,
  ).length;
  return (
    <section className={styles.page}>
      <h1>{t('navigation.scanword')}</h1>
      <p>{t('scanword.intro')}</p>
      <details className={styles.card} open>
        <summary>{t('scanword.rules.title')}</summary>
        <p>{t('scanword.rules.main')}</p>
        <p>{t('scanword.rules.controls')}</p>
        <p className={styles.hint}>{t('scanword.rules.review')}</p>
      </details>
      <ScanwordSettingsForm
        key={puzzle.id}
        puzzle={puzzle}
        busy={busy}
        onRun={(request) => {
          setNotice(null);
          run(request);
        }}
      />
      <div
        className={styles.toolbar}
        role="group"
        aria-label={t('scanword.current.examples')}
      >
        {SCANWORD_EXAMPLES.map((example, index) => (
          <button
            type="button"
            key={example.id}
            disabled={busy}
            onClick={() => {
              setNotice(null);
              run({ type: 'validate', puzzle: example });
            }}
          >
            {t('scanword.current.example', { number: index + 1 })}
          </button>
        ))}
      </div>
      {worker.busy && (
        <div className={styles.toolbar}>
          <p role="status">{t('scanword.messages.busy')}</p>
          <button type="button" onClick={worker.cancel}>
            {t('scanword.messages.cancel')}
          </button>
        </div>
      )}
      {message && (
        <p role="status" className={message.danger ? styles.error : undefined}>
          {t(message.key, message.values)}
        </p>
      )}
      <p role="status" className={validated ? styles.success : styles.warning}>
        {t(
          validated
            ? 'scanword.current.validated'
            : 'scanword.current.checking',
        )}
      </p>
      <p>
        {t('scanword.current.stats', {
          rows: puzzle.rows,
          columns: puzzle.columns,
          words: puzzle.entries.length,
          cells: white.length,
          crossings,
        })}
      </p>
      {issues.length > 0 && (
        <p role="status" className={styles.warning}>
          {t('scanword.current.layoutIssue')}
        </p>
      )}
      {session.problem && (
        <p className={styles.warning}>{t('scanword.messages.storage')}</p>
      )}
      <ScanwordGame
        key={`${puzzle.id}:${revision}`}
        puzzle={puzzle}
        progress={progress}
        busy={busy || !validated}
        onProgress={session.setProgress}
      />
      <section className={styles.card}>
        <h3>
          {t('scanword.tools.title')}: {puzzle.title}
        </h3>
        <p className={styles.hint}>{t('scanword.tools.review')}</p>
        <label className={styles.printSize} htmlFor={`${id}-mm`}>
          {t('scanword.tools.cellMm')}
          <select
            id={`${id}-mm`}
            value={cellMm}
            onChange={(event) => setCellMm(Number(event.target.value))}
          >
            {[12, 14, 16, 18, 20, 22, 24].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <p className={styles.hint}>{t('scanword.tools.size', size)}</p>
        {(cellMm < 18 || puzzle.maxCluesPerCell === 2) && (
          <p className={styles.warning}>{t('scanword.tools.small')}</p>
        )}
        {!ready && (
          <p className={styles.warning}>{t('scanword.tools.blocked')}</p>
        )}
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
            {t('scanword.tools.draft')}
          </button>
          <button
            type="button"
            disabled={busy || !ready}
            onClick={() =>
              downloadFile(
                `${name}.json`,
                JSON.stringify(puzzle, null, 2),
                'application/json;charset=utf-8',
              )
            }
          >
            {t('scanword.tools.puzzleExport')}
          </button>
          <button
            type="button"
            disabled={busy || !validated}
            onClick={() =>
              downloadFile(
                `${name}-progress.json`,
                JSON.stringify(progress, null, 2),
                'application/json;charset=utf-8',
              )
            }
          >
            {t('scanword.tools.progressExport')}
          </button>
          <button
            type="button"
            disabled={busy || !ready}
            onClick={() =>
              downloadFile(
                `${name}-task.svg`,
                renderScanwordSVG(puzzle, false, labels, cellMm),
                'image/svg+xml;charset=utf-8',
              )
            }
          >
            {t('scanword.tools.taskSvg')}
          </button>
          <button
            type="button"
            disabled={busy || !ready}
            onClick={() =>
              downloadFile(
                `${name}-answers.svg`,
                renderScanwordSVG(puzzle, true, labels, cellMm),
                'image/svg+xml;charset=utf-8',
              )
            }
          >
            {t('scanword.tools.solutionSvg')}
          </button>
          {(['task', 'solution', 'both'] as const).map((kind) => (
            <button
              type="button"
              key={kind}
              disabled={busy || !ready}
              onClick={() => {
                void printScanword(kind).catch(() =>
                  setNotice({
                    key: 'scanword.messages.printFailed',
                    danger: true,
                  }),
                );
              }}
            >
              {t(
                kind === 'task'
                  ? 'scanword.tools.printTask'
                  : kind === 'solution'
                    ? 'scanword.tools.printAnswers'
                    : 'scanword.tools.printBoth',
              )}
            </button>
          ))}
        </div>
        <div className={styles.fileInputs}>
          <label htmlFor={`${id}-puzzle`}>
            {t('scanword.tools.puzzleImport')}
            <input
              id={`${id}-puzzle`}
              type="file"
              accept=".json,application/json"
              disabled={busy}
              onChange={(event) => {
                void load(event, 'puzzle');
              }}
            />
          </label>
          <label htmlFor={`${id}-progress`}>
            {t('scanword.tools.progressImport')}
            <input
              id={`${id}-progress`}
              type="file"
              accept=".json,application/json"
              disabled={busy || !validated}
              onChange={(event) => {
                void load(event, 'progress');
              }}
            />
          </label>
        </div>
      </section>
      <ScanwordPrint
        puzzle={puzzle}
        labels={labels}
        ready={ready}
        cellMm={cellMm}
      />
    </section>
  );
}