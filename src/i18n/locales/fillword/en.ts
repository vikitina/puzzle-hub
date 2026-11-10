export const fillwordEn = {
  intro:
    'Create a letter puzzle, play it or prepare a worksheet and an answer key.',
  board: 'Fillword grid',
  cell: 'Row {row}, column {column}: {letter}',
  settings: {
    title: 'New puzzle settings',
    titleLabel: 'Puzzle title',
    rows: 'Rows',
    columns: 'Columns',
    mode: 'Puzzle type',
    alphabet: 'Word alphabet',
    directions: 'Word directions',
    words: 'Words',
    hint: 'Separate words with commas, semicolons or new lines. Use one alphabet. Apostrophes and hyphens are omitted from the grid. Maximum: 80 words; sides: 2–20 cells.',
    stats: 'Words: {words}; letters: {letters}; cells: {cells}.',
    draft: 'These settings apply when you create a new puzzle.',
    create: 'Create puzzle',
    running: 'Creating a puzzle…',
    cancel: 'Cancel creation',
  },
  modes: {
    snake: 'Hungarian fillword: turning paths, no spare letters',
    straight: 'Word search: straight lines and filler letters',
  },
  directions: {
    'right-down': 'Right and down → ↓',
    orthogonal: 'Four directions → ↓ ← ↑',
    eight: 'Eight directions, including diagonals',
  },
  rules: {
    snake:
      'Words follow neighboring cells up, down, left or right and may turn. No diagonal moves or shared cells. Every cell belongs to one word.',
    straight:
      'Words run in straight lines. They may share matching letters. The remaining cells contain filler letters.',
    direction: 'Directions: {directions}.',
    controls:
      'Select neighboring letters one by one, then press Check word. You may start at either end. Click a selected letter to remove it and the following letters. Arrow keys move focus; Enter or Space selects a cell; Escape clears the selection.',
    alternatives:
      'Valid alternative paths are accepted. In the Hungarian variant they can occupy cells needed by another word: use Undo word if necessary. The answer key shows one author solution.',
  },
  views: {
    label: 'View',
    play: 'Play',
    task: 'Worksheet',
    solution: 'Answer key',
  },
  play: {
    words: 'Words to find',
    check: 'Check word',
    clear: 'Clear selection',
    undo: 'Undo word',
    reset: 'Reset progress',
    selected: 'Selected: {text}',
    progress: 'Found {found} of {total}.',
    solved: 'All words found!',
    found: 'Found: {word}.',
  },
  tools: {
    title: 'Files and printing',
    puzzleExport: 'Save puzzle JSON',
    puzzleImport: 'Load puzzle JSON',
    progressExport: 'Save progress JSON',
    progressImport: 'Load progress JSON',
    taskSvg: 'Worksheet SVG',
    solutionSvg: 'Answer SVG',
    taskPrint: 'Print worksheet',
    solutionPrint: 'Print answers',
    bothPrint: 'Print both',
  },
  messages: {
    created: 'New puzzle created.',
    cancelled: 'Creation cancelled. The current puzzle was kept.',
    timeout: 'Creation took too long. Try a larger grid or fewer words.',
    failed: 'Could not create a puzzle. Try again.',
    storage:
      'Browser storage is unavailable or saved data is invalid. Use JSON files to save your work.',
    puzzleLoaded: 'Puzzle loaded without regeneration.',
    progressLoaded: 'Progress restored.',
    largeFile: 'The file must be smaller than 1 MB.',
  },
  errors: {
    dimensions: 'Rows and columns must be whole numbers from 2 to 20.',
    words: 'Enter from 1 to 80 words.',
    letters:
      'Check “{word}”: use at least two letters from the selected alphabet. Separate different words with commas.',
    duplicates: 'The list contains duplicate words after normalization.',
    'full-coverage':
      'The Hungarian variant requires exactly {cells} letters; entered: {letters}. Change the words or grid size.',
    'word-too-long':
      'A word is longer than both sides of the grid. Increase the grid size or use turning paths.',
    placement:
      'Could not place every word within the search limit. Increase the grid, allow more directions or reduce the list.',
    data: 'Invalid puzzle data or file.',
    version: 'Unsupported JSON schema version.',
    progress:
      'This progress file does not match the current puzzle or contains invalid paths.',
    selection: 'Select adjacent cells following the current puzzle rules.',
    'unknown-word':
      'The selected letters do not form a word from the list in an allowed direction.',
    'already-found': 'This word has already been found.',
    'used-cell':
      'These cells already belong to a found word. Undo that word if needed.',
  },
};