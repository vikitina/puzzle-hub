import { useMemo } from 'react';
import type { CSSProperties } from 'react';
import { SudokuRules } from '../../engines/sudoku/sudoku-rules';
import type {
  SudokuBoard,
  SudokuCell,
  SudokuPuzzle,
} from '../../engines/sudoku/sudoku.types';
import { useTranslation } from '../../i18n/use-translation';
import styles from './sudoku.module.scss';

interface Props {
  puzzle: SudokuPuzzle;
  board: SudokuBoard;
  onChange: (index: number, value: SudokuCell) => void;
  disabled?: boolean;
}

export default function SudokuBoardView({
  puzzle,
  board,
  onChange,
  disabled = false,
}: Props) {
  const { t } = useTranslation();
  const rules = useMemo(() => new SudokuRules(puzzle.size), [puzzle.size]);
  const conflicts = new Set(rules.getConflicts(board));

  return (
    <div
      className={styles.board}
      role="group"
      aria-label={t('sudoku.board')}
      style={{ '--board-size': puzzle.size } as CSSProperties}
    >
      {board.map((value, index) => {
        const row = Math.floor(index / puzzle.size);
        const column = index % puzzle.size;
        const given = puzzle.initialBoard[index] !== null;
        const label = `${t('sudoku.row')} ${row + 1}, ${t('sudoku.column')} ${column + 1}`;

        return (
          <input
            key={index}
            className={styles.cell}
            type="text"
            inputMode="numeric"
            maxLength={1}
            autoComplete="off"
            spellCheck={false}
            value={value ?? ''}
            onFocus={(event) => event.currentTarget.select()}
            readOnly={given}
            disabled={disabled}
            aria-label={given ? `${label}, ${t('sudoku.given')}` : label}
            aria-invalid={conflicts.has(index)}
            data-block-right={(column + 1) % rules.blockColumns === 0}
            data-block-bottom={(row + 1) % rules.blockRows === 0}
            data-last-column={column === puzzle.size - 1}
            data-last-row={row === puzzle.size - 1}
            onChange={(event) => {
              const input = event.currentTarget.value;
              if (input === '') onChange(index, null);
              else if (/^[1-9]$/.test(input) && Number(input) <= puzzle.size)
                onChange(index, Number(input));
            }}
          />
        );
      })}
    </div>
  );
}