import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { ScanwordPuzzle } from '../../engines/scanword/scanword.types';
import { useTranslation } from '../../i18n/use-translation';
import { renderScanwordSVG } from '../../renderers/scanword-svg';
import type { ScanwordSVGLabels } from '../../renderers/scanword-svg';
import styles from './scanword.module.scss';
export async function printScanword(
  kind: 'task' | 'solution' | 'both',
): Promise<void> {
  const root = document.querySelector('[data-scanword-print-root]');
  if (!root) return;
  await Promise.all(
    Array.from(root.querySelectorAll('img')).map((image) =>
      typeof image.decode === 'function' ? image.decode() : Promise.resolve(),
    ),
  );
  if (!root.isConnected) return;
  document.documentElement.dataset.scanwordPrint = kind;
  try {
    window.print();
  } catch (error) {
    delete document.documentElement.dataset.scanwordPrint;
    throw error;
  }
}
export default function ScanwordPrint({
  puzzle,
  labels,
  cellMm,
  ready,
}: {
  puzzle: ScanwordPuzzle;
  labels: ScanwordSVGLabels;
  cellMm: number;
  ready: boolean;
}) {
  const { t } = useTranslation();
  useEffect(() => {
    const before = () => {
      document.documentElement.dataset.scanwordPrint ??= 'task';
    };
    const after = () => {
      delete document.documentElement.dataset.scanwordPrint;
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
      data-scanword-print-root
      aria-hidden="true"
    >
      {!ready ? (
        <p>{t('scanword.tools.blocked')}</p>
      ) : (
        (['task', 'solution'] as const).map((view) => (
          <section
            key={view}
            className={`${styles.printSheet} ${view === 'task' ? styles.taskSheet : styles.solutionSheet}`}
          >
            <img
              alt={t(`scanword.views.${view}`)}
              src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(renderScanwordSVG(puzzle, view === 'solution', labels, cellMm))}`}
            />
          </section>
        ))
      )}
    </div>,
    document.body,
  );
}