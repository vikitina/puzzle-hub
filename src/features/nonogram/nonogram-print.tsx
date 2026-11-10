import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { NonogramPuzzle } from '../../engines/nonogram/nonogram.types';
import { useTranslation } from '../../i18n/use-translation';
import { renderNonogramSVG } from '../../renderers/nonogram-svg';
import styles from './nonogram.module.scss';

export async function printNonogram(
  kind: 'task' | 'solution' | 'both',
): Promise<void> {
  const images = Array.from(
    document.querySelectorAll<HTMLImageElement>(
      '[data-nonogram-print-root] img',
    ),
  );
  await Promise.all(
    images.map((image) =>
      typeof image.decode === 'function'
        ? image.decode().catch(() => {})
        : Promise.resolve(),
    ),
  );
  document.documentElement.dataset.nonogramPrint = kind;
  window.print();
}
export default function NonogramPrint({
  puzzle,
  ruleText,
  verified,
}: {
  puzzle: NonogramPuzzle;
  ruleText: string;
  verified: boolean;
}) {
  const { t } = useTranslation();
  useEffect(() => {
    const before = () => {
      document.documentElement.dataset.nonogramPrint ??= 'task';
    };
    const after = () => {
      delete document.documentElement.dataset.nonogramPrint;
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
      className={styles.printRoot}
      data-nonogram-print-root
      aria-hidden="true"
    >
      {!verified ? (
        <p>{t('nonogram.current.blocked')}</p>
      ) : (
        (['task', 'solution'] as const).map((view) => (
          <section
            key={view}
            className={`${styles.printSheet} ${view === 'task' ? styles.taskSheet : styles.solutionSheet}`}
          >
            <img
              alt={t(`nonogram.views.${view}`)}
              src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(renderNonogramSVG(puzzle, view === 'solution', ruleText))}`}
            />
          </section>
        ))
      )}
    </div>,
    document.body,
  );
}