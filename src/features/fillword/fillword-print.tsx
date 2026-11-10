import { createPortal } from 'react-dom';
import { useEffect } from 'react';
import type { FillwordPuzzle } from '../../engines/fillword/fillword.types';
import { useTranslation } from '../../i18n/use-translation';
import FillwordBoard from './fillword-board';
import styles from './fillword.module.scss';

export function printFillword(kind: 'task' | 'solution' | 'both'): void {
  document.documentElement.dataset.fillwordPrint = kind;
  window.print();
}
export default function FillwordPrint({
  puzzle,
  ruleText,
}: {
  puzzle: FillwordPuzzle;
  ruleText: string;
}) {
  const { t } = useTranslation();
  useEffect(() => {
    const before = () => {
      document.documentElement.dataset.fillwordPrint ??= 'task';
    };
    const after = () => {
      delete document.documentElement.dataset.fillwordPrint;
    };
    window.addEventListener('beforeprint', before);
    window.addEventListener('afterprint', after);
    return () => {
      window.removeEventListener('beforeprint', before);
      window.removeEventListener('afterprint', after);
      after();
    };
  }, []);
  return createPortal(
    <div
      data-fillword-print-root
      className={styles.printRoot}
      aria-hidden="true"
    >
      {(['task', 'solution'] as const).map((view) => (
        <section
          key={view}
          className={`${styles.printSheet} ${view === 'task' ? styles.taskSheet : styles.solutionSheet}`}
        >
          <h1>{puzzle.title}</h1>
          <p>
            {t(`fillword.views.${view}`)} · {puzzle.config.rows} ×{' '}
            {puzzle.config.columns}
          </p>
          <p>{ruleText}</p>
          <FillwordBoard puzzle={puzzle} view={view} />
          <p className={styles.printWords}>
            {puzzle.words.map((word) => word.label).join(' · ')}
          </p>
        </section>
      ))}
    </div>,
    document.body,
  );
}