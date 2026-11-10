export const scanwordEn = {
  intro:
    'Create an arrowword from word–clue pairs, play it and prepare a blank worksheet with answers.',
  rules: {
    title: 'How to play',
    main: 'Clues are inside the grid. An arrow points to the first answer cell: right or down. Crossings share a letter. Underlined letters are fixed starters.',
    controls:
      'Choose a clue or a white cell. Type letters, use the letter buttons or enter a whole answer. Clicking a crossing again changes the selected word.',
    review:
      'The app checks geometry and compares play with the author’s answers. A human editor checks meanings, alternative answers and publication quality.',
  },
  settings: {
    title: 'New puzzle settings',
    titleLabel: 'Publication title',
    rows: 'Rows',
    columns: 'Columns',
    alphabet: 'Answer alphabet',
    dictionary: 'Word–clue dictionary',
    hint: 'One pair per line: WORD | short clue. A tab also works. 2–200 distinct answers, 2–20 letters each. Clues: up to 40 characters. No spaces, hyphens or apostrophes inside answers.',
    useAll: 'Place every dictionary word (up to 40)',
    wordCount: 'Words to choose',
    maxClues: 'Clues per cell',
    one: 'One',
    two: 'Up to two',
    givens: 'Starter cells',
    create: 'Create a new puzzle',
    apply: 'Update clues and starters without rebuilding',
    applyHint:
      'Keeps the current cells, arrows and words. Uses the title, clues for current answers and starter count. Other settings require a new puzzle. A new revision gets its own ID.',
    example: 'Fill dictionary: {language}',
    import: 'Load dictionary TXT',
    importHint:
      'UTF-8 text, one WORD | clue pair per line. Loading fills the form; it does not start generation.',
    count: 'Dictionary entries: {count}',
  },
  current: {
    title: 'Current puzzle',
    stats:
      '{rows} × {columns}; words: {words}; white cells: {cells}; crossings: {crossings}.',
    checking: 'Checking the saved structure…',
    validated: 'Grid, arrows and author’s answers are structurally consistent.',
    layoutIssue:
      'Some clues do not fit. Shorten them or use separate clue cells before exporting for publication.',
    examples: 'Open a prepared example',
    example: 'Example {number}',
  },
  directions: {
    across: 'right',
    down: 'down',
  },
  views: {
    label: 'View',
    play: 'Play',
    task: 'Worksheet',
    solution: 'Answers',
  },
  board: 'Arrowword grid',
  cell: 'Row {row}, column {column}',
  clue: '{clue}, {direction}, {length} letters',
  given: 'starter letter',
  play: {
    selected: 'Selected clue',
    select: 'Choose a clue or a letter cell.',
    letter: 'Selected cell letter',
    word: 'Whole answer',
    putWord: 'Enter answer',
    clear: 'Erase selected cell',
    undo: 'Undo',
    reset: 'Reset progress',
    mistakes: 'Show differences from the author’s answers',
    progress:
      'Filled cells: {filled} of {total}; filled words: {words} of {entries}.',
    solved: 'Solved! All author’s answers are complete.',
    length: '{direction}, {length} letters',
    alphabet: 'Answer letters',
  },
  tools: {
    title: 'Files and publication',
    draft: 'Save working puzzle JSON',
    puzzleExport: 'Save checked puzzle JSON',
    puzzleImport: 'Load puzzle JSON',
    progressExport: 'Save progress JSON',
    progressImport: 'Load progress JSON',
    taskSvg: 'Download worksheet SVG',
    solutionSvg: 'Download answers SVG',
    printTask: 'Print worksheet',
    printAnswers: 'Print answers',
    printBoth: 'Print both versions',
    cellMm: 'Printed cell size, mm',
    size: 'SVG width: {width} mm; height: {height} mm. Choose suitable paper and check clue readability at the final scale.',
    small:
      'For small cells or split clue boxes, inspect the printed text carefully.',
    blocked:
      'Finish checking the grid and make all clues fit before publication.',
    review:
      'Structural checks do not prove that a clue has only one possible answer.',
  },
  messages: {
    busy: 'Building or checking the grid…',
    cancel: 'Cancel',
    cancelled: 'Operation cancelled. The previous puzzle is kept.',
    timeout:
      'The search took too long. Increase the field, reduce the word count or change the dictionary.',
    failed: 'The operation failed. Check the data and try again.',
    fileSize:
      'The file is too large. Puzzle files: under 1 MB; dictionaries: under 50 KB.',
    progressLoaded: 'Progress restored.',
    dictionaryLoaded: 'Dictionary loaded into the form.',
    storage:
      'Some local data could not be read or saved. You can use JSON files.',
    printFailed:
      'The print images could not be prepared. Download SVG instead.',
  },
  errors: {
    dimensions: 'Rows and columns must be integers from 4 to 20.',
    dictionary:
      'Use 2–200 word–clue pairs. To revise a puzzle, include every current answer.',
    line: 'Invalid dictionary line {line}. Use WORD | clue.',
    word: 'Check the answer, its length and alphabet. Words contain letters only.',
    clue: 'Use a non-empty clue of up to 40 characters, without |.',
    duplicate: 'The answer {word} appears more than once.',
    options:
      'Check word count, clue-cell setting and starter count. Starters cannot exceed the actual white cells.',
    disconnected:
      'The selected words cannot form one connected grid. Add connecting words or choose a subset.',
    placement:
      'No complete layout was found within the search limit. Words need space for a clue cell before their first letter. Enlarge the field or change the dictionary.',
    data: 'The puzzle file or its grid is invalid.',
    version: 'This puzzle JSON version is not supported.',
    progress:
      'The progress does not match this puzzle or tries to change a fixed/non-letter cell.',
  },
};