import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { CodewordPuzzle } from '../../engines/codeword/codeword.types';
import { useTranslation } from '../../i18n/use-translation';
import { renderCodewordSVG } from '../../renderers/codeword-svg';
import type { CodewordSVGLabels } from '../../renderers/codeword-svg';
import styles from './codeword.module.scss';
export async function printCodeword(
  kind: 'task' | 'solution' | 'both',
): Promise<void> {
  const images = Array.from(
    document.querySelectorAll<HTMLImageElement>(
      '[data-codeword-print-root] img',
    ),
  );
  await Promise.all(
    images.map((image) =>
      typeof image.decode === 'function'
        ? image.decode().catch(() => {})
        : Promise.resolve(),
    ),
  );
  document.documentElement.dataset.codewordPrint = kind;
  window.print();
}
export default function CodewordPrint({
  puzzle,
  labels,
  ready,
}: {
  puzzle: CodewordPuzzle;
  labels: CodewordSVGLabels;
  ready: boolean;
}) {
  const { t } = useTranslation();
  useEffect(() => {
    const before = () => {
      document.documentElement.dataset.codewordPrint ??= 'task';
    };
    const after = () => {
      delete document.documentElement.dataset.codewordPrint;
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
      data-codeword-print-root
      aria-hidden="true"
    >
      {!ready ? (
        <p>{t('codeword.current.blocked')}</p>
      ) : (
        (['task', 'solution'] as const).map((view) => (
          <section
            key={view}
            className={`${styles.printSheet} ${view === 'task' ? styles.taskSheet : styles.solutionSheet}`}
          >
            <img
              alt={t(`codeword.views.${view}`)}
              src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(renderCodewordSVG(puzzle, view === 'solution', labels))}`}
            />
          </section>
        ))
      )}
    </div>,
    document.body,
  );
}