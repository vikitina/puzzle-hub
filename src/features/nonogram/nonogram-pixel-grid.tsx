import { useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent } from 'react';
import type { NonogramMark } from '../../engines/nonogram/nonogram.types';
import { useTranslation } from '../../i18n/use-translation';
import styles from './nonogram.module.scss';

interface Props {
  rows: number;
  columns: number;
  values: readonly NonogramMark[];
  label: string;
  kind: 'editor' | 'play' | 'static';
  disabled?: boolean;
  mistakes?: ReadonlySet<number>;
  describe?: (index: number) => string;
  onPaint?: (index: number) => void;
  onEmpty?: (index: number) => void;
  onErase?: (index: number) => void;
}
export default function NonogramPixelGrid({
  rows,
  columns,
  values,
  label,
  kind,
  disabled = false,
  mistakes,
  describe,
  onPaint,
  onEmpty,
  onErase,
}: Props) {
  const { t } = useTranslation();
  const [focus, setFocus] = useState(0);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const tabStop = focus < values.length ? focus : 0;
  const keyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      onErase?.(index);
      return;
    }
    if (event.key.toLowerCase() === 'x') {
      event.preventDefault();
      onEmpty?.(index);
      return;
    }
    const steps: Record<string, readonly [number, number]> = {
      ArrowUp: [-1, 0],
      ArrowDown: [1, 0],
      ArrowLeft: [0, -1],
      ArrowRight: [0, 1],
    };
    const step = steps[event.key];
    if (!step) return;
    event.preventDefault();
    const row = Math.max(
      0,
      Math.min(rows - 1, Math.floor(index / columns) + step[0]),
    );
    const column = Math.max(
      0,
      Math.min(columns - 1, (index % columns) + step[1]),
    );
    refs.current[row * columns + column]?.focus();
  };
  return (
    <div
      className={styles.pixels}
      role="group"
      aria-label={label}
      style={{ '--columns': columns, '--rows': rows } as CSSProperties}
    >
      {values.map((mark, index) => {
        const state =
          mark === 1
            ? 'filled'
            : mark === -1
              ? 'crossed'
              : kind === 'play'
                ? 'unknown'
                : 'empty';
        const attributes = {
          'data-mark': mark,
          'data-mistake': mistakes?.has(index) ?? false,
          'data-block-right': ((index % columns) + 1) % 5 === 0,
          'data-block-bottom': (Math.floor(index / columns) + 1) % 5 === 0,
          'data-last-column': index % columns === columns - 1,
          'data-last-row': Math.floor(index / columns) === rows - 1,
        };
        return kind === 'static' ? (
          <span key={index} className={styles.pixel} {...attributes} />
        ) : (
          <button
            type="button"
            key={index}
            ref={(node) => {
              refs.current[index] = node;
            }}
            className={styles.pixel}
            {...attributes}
            disabled={disabled}
            tabIndex={index === tabStop ? 0 : -1}
            aria-label={t('nonogram.cell', {
              row: Math.floor(index / columns) + 1,
              column: (index % columns) + 1,
              state: t(`nonogram.pixel.${state}`),
            })}
            aria-describedby={describe?.(index)}
            aria-pressed={mark === 1}
            onFocus={() => setFocus(index)}
            onKeyDown={(event) => keyDown(event, index)}
            onClick={() => onPaint?.(index)}
            onContextMenu={(event) => {
              event.preventDefault();
              if (!disabled) onEmpty?.(index);
            }}
          >
            {mark === -1 ? '×' : ''}
          </button>
        );
      })}
    </div>
  );
}