export const en = {
  app: { name: 'Puzzle Workshop', subtitle: 'Create and solve puzzles' },
  navigation: {
    label: 'Puzzles',
    menu: 'Menu',
    home: 'Home',
    sudoku: 'Sudoku',
    nonogram: 'Nonogram',
    wordSearch: 'Word search',
    codeword: 'Codeword',
    scanword: 'Arrowword',
  },
  theme: { light: 'Switch to light theme', dark: 'Switch to dark theme' },
  language: { label: 'Interface language' },
  common: {
    open: 'Open',
    back: 'Back to home',
    comingSoon: 'In development',
    skip: 'Skip to main content',
  },
  home: {
    title: 'A place for puzzles',
    description:
      'Choose a puzzle to play. More puzzle types will be available here.',
  },
  puzzles: {
    sudoku:
      'Fill the grid so every row, column and block contains each number once.',
    nonogram: 'Reveal a picture using the number clues beside the grid.',
    wordSearch: 'Find the hidden words in a grid of letters.',
    codeword: 'Discover which letter each number represents.',
    scanword: 'Solve the clues and fill in the words following the arrows.',
  },
  notFound: {
    title: 'Page not found',
    description: 'This address does not match a page.',
  },
  sudoku: {
    instructions:
      'Enter numbers from 1 to {size}. The original numbers cannot be changed.',
    solved: 'Solved! All numbers are in their places.',
    conflict: 'Some numbers repeat in a row, column or block.',
    reset: 'Start again',
    board: 'Sudoku grid',
    row: 'Row',
    column: 'column',
    given: 'original number',
    settings: {
      title: 'New game settings',
      description:
        'Choose the next grid, then create a new game. The current game stays until the new one is ready.',
      size: 'Grid size',
      clues: 'Open cells',
      cluesHint: 'A whole number from 0 to {max}.',
      invalid: 'Enter a whole number from 0 to {max}.',
      block: 'Block (rows × columns)',
      blocks: 'Blocks (across × down)',
      cells: 'Total cells',
      empty: 'Cells to hide',
      create: 'Create new game',
    },
    generation: {
      running: 'Creating a puzzle…',
      cancel: 'Cancel',
      cancelled: 'Creation cancelled. The current game was kept.',
      failed: 'Could not create a puzzle. Try again.',
      timeout: 'Creation took too long. Try again with more open cells.',
      targetNotReached:
        'Requested {target} open cells. Kept {actual} to preserve a unique solution.',
      gameInfo: 'Open cells: {actual} of {total}.',
    },
  },
};