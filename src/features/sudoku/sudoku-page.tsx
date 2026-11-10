import { useCallback, useMemo, useState } from 'react';
import { SudokuRules } from '../../engines/sudoku/sudoku-rules';
import type {
  SudokuBoard,
  SudokuCell,
  SudokuGenerationResult,
  SudokuPuzzle,
} from '../../engines/sudoku/sudoku.types';
import { useTranslation } from '../../i18n/use-translation';
import { demoSudoku } from './demo-sudoku';
import SudokuBoardView from './sudoku-board';
import SudokuSettingsForm from './sudoku-settings-form';
import { useSudokuGenerator } from './use-sudoku-generator';
import styles from './sudoku.module.scss';

interface Game {
  puzzle: SudokuPuzzle;
  board: SudokuBoard;
  generation: Pick<
    SudokuGenerationResult,
    'targetClues' | 'actualClues' | 'targetReached'
  > | null;
}

export default function SudokuPage() {
  const { t } = useTranslation();
  const [game, setGame] = useState<Game>(() => ({
    puzzle: demoSudoku,
    board: [...demoSudoku.initialBoard],
    generation: null,
  }));
  const rules = useMemo(
    () => new SudokuRules(game.puzzle.size),
    [game.puzzle.size],
  );
  const solved = rules.isSolved(game.board);
  const hasConflicts = rules.getConflicts(game.board).length > 0;
  const actualClues = game.puzzle.initialBoard.filter(
    (value) => value !== null,
  ).length;

  const onGenerated = useCallback((result: SudokuGenerationResult) => {
    setGame({
      puzzle: result.puzzle,
      board: [...result.puzzle.initialBoard],
      generation: {
        targetClues: result.targetClues,
        actualClues: result.actualClues,
        targetReached: result.targetReached,
      },
    });
  }, []);

  const { state, isGenerating, generate, cancel } =
    useSudokuGenerator(onGenerated);

  const changeCell = (index: number, value: SudokuCell) => {
    if (isGenerating) return;
    setGame((current) => {
      if (current.puzzle.initialBoard[index] !== null) return current;
      return {
        ...current,
        board: current.board.map((cell, cellIndex) =>
          cellIndex === index ? value : cell,
        ),
      };
    });
  };

  return (
    <section>
      <p className="eyebrow">
        {game.puzzle.size} × {game.puzzle.size}
      </p>
      <h1>{t('navigation.sudoku')}</h1>
      <SudokuSettingsForm
        state={state}
        onGenerate={generate}
        onCancel={cancel}
      />

      {game.generation && !game.generation.targetReached && (
        <p className={styles.warning}>
          {t('sudoku.generation.targetNotReached', {
            target: game.generation.targetClues,
            actual: game.generation.actualClues,
          })}
        </p>
      )}

      <div className={styles.game}>
        <SudokuBoardView
          puzzle={game.puzzle}
          board={game.board}
          onChange={changeCell}
          disabled={isGenerating}
        />
        <div className={styles.panel}>
          <p>{t('puzzles.sudoku')}</p>
          <p>
            {t('sudoku.generation.gameInfo', {
              actual: actualClues,
              total: game.puzzle.size ** 2,
            })}
          </p>
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
              { size: game.puzzle.size },
            )}
          </p>
          <button
            className={styles.reset}
            type="button"
            disabled={isGenerating}
            onClick={() =>
              setGame((current) => ({
                ...current,
                board: [...current.puzzle.initialBoard],
              }))
            }
          >
            {t('sudoku.reset')}
          </button>
        </div>
      </div>
    </section>
  );
}