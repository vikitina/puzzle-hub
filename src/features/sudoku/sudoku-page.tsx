import { useState } from 'react';
import { SudokuRules } from '../../engines/sudoku/sudoku-rules';
import type { SudokuBoard, SudokuCell } from '../../engines/sudoku/sudoku.types';
import { useTranslation } from '../../i18n/use-translation';
import { demoSudoku } from './demo-sudoku';
import SudokuBoardView from './sudoku-board';
import styles from './sudoku.module.scss';

const rules = new SudokuRules(demoSudoku.size);

export default function SudokuPage() {
  const { t } = useTranslation();
  const [board, setBoard] = useState<SudokuBoard>(() => [...demoSudoku.initialBoard]);
  const solved = rules.isSolved(board);
  const hasConflicts = rules.getConflicts(board).length > 0;

  const changeCell = (index: number, value: SudokuCell) => {
    if (demoSudoku.initialBoard[index] !== null) return;
    setBoard((current) =>
      current.map((cell, cellIndex) => (cellIndex === index ? value : cell)),
    );
  };

  return (
    <section>
      <p className="eyebrow">4 × 4</p>
      <h1>{t('navigation.sudoku')}</h1>
      <div className={styles.game}>
        <SudokuBoardView puzzle={demoSudoku} board={board} onChange={changeCell} />
        <div className={styles.panel}>
          <p>{t('puzzles.sudoku')}</p>
          <p
            className={styles.status}
            role="status"
            data-error={hasConflicts}
            data-solved={solved}
          >
            {t(
              solved
                ? 'sudoku.solved'
                : hasConflicts
                  ? 'sudoku.conflict'
                  : 'sudoku.instructions',
            )}
          </p>
          <button
            className={styles.reset}
            type="button"
            onClick={() => setBoard([...demoSudoku.initialBoard])}
          >
            {t('sudoku.reset')}
          </button>
        </div>
      </div>
    </section>
  );
}