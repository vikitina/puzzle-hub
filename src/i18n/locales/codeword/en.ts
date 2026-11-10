export const codewordEn = {
  intro:
    'Build or encode a crossword, choose starter letters, check the cipher and prepare a worksheet with an answer key.',
  rules: {
    title: 'How to play',
    main: 'Each number stands for one letter. Equal numbers have equal letters; different numbers must have different letters. Decode the words across and down.',
    full: 'Every letter of the selected alphabet appears in this grid.',
    partial:
      'This is a reduced-alphabet variant. The available letters are listed below; all of them are used.',
    bank: 'Use each word from the visible list once.',
    classic: 'There are no word definitions or answer words on the worksheet.',
    controls:
      'Select a numbered cell or a key entry, then type a letter or use the letter buttons. The letter fills every cell with that number. Starter letters cannot be changed.',
    scope:
      'Dictionary verification applies only to the supplied word list. It does not prove uniqueness in the entire language; vocabulary and publication quality need editorial review.',
  },
  settings: {
    title: 'New puzzle settings',
    titleLabel: 'Publication title',
    source: 'Grid source',
    fromWords: 'Place a word list',
    fromGrid: 'Encode a completed grid',
    alphabet: 'Word alphabet',
    rows: 'Rows',
    columns: 'Columns',
    words: 'Words to place',
    wordsHint:
      'Use commas, semicolons or new lines. Enter 2–40 distinct words, 2–25 letters each. Spaces, hyphens and apostrophes inside words are not supported.',
    grid: 'Completed letter grid',
    gridHint:
      'One row per line. Use # or . for blocked cells. Spaces are ignored. Dimensions are taken from this grid. Sides: 3–25 cells.',
    givenCount: 'Starter letters',
    revealed: 'Specific starter letters',
    revealedHint:
      'Optional letters, separated by spaces or commas. They must occur in the grid and fit the starter count.',
    full: 'Require the whole alphabet',
    bank: 'Show the word list on the worksheet (training variant)',
    dictionary: 'Verification dictionary',
    dictionaryHint:
      'Up to 5,000 comma-separated words or one word per line. Include every answer word and plausible alternatives. Used only when the answer list is hidden. An empty dictionary leaves verification incomplete.',
    create: 'Create new puzzle',
    apply: 'Update starters and checks without rebuilding',
    applyHint:
      'This button keeps the current grid and code numbers. It applies the title, starter letters, word-bank option and dictionary. To change words or dimensions, create a new puzzle.',
    stats: 'Words: {words}; letters available: {letters}.',
    example: 'Example {language}',
  },
  analysis: {
    pending: 'The current puzzle has not been checked yet.',
    uniqueBank: 'One decoding fits the visible word bank.',
    uniqueDictionary:
      'One decoding fits the supplied dictionary of {count} words. This is not a whole-language guarantee.',
    multiple:
      'Several decodings are possible. Add starter letters or revise the words and dictionary. Publication export is blocked.',
    none: 'No decoding fits the supplied dictionary. Check the word list and starter letters.',
    limit:
      'The search limit was reached. Uniqueness has not been confirmed; publication export is blocked.',
    'not-checked':
      'Add a verification dictionary or show the word bank before publication.',
  },
  current: {
    title: 'Current puzzle',
    stats:
      '{rows} × {columns}; words: {words}; letters: {letters}; open cells: {cells}.',
    blocked:
      'Publication export requires a unique decoding within the visible word bank or supplied dictionary. Draft JSON and online testing remain available.',
    alphabet: 'Available letters',
    words: 'Words to use',
    key: 'Number-to-letter key',
  },
  views: {
    label: 'View',
    play: 'Play',
    task: 'Worksheet',
    solution: 'Answer key',
  },
  board: 'Codeword grid',
  cell: 'Row {row}, column {column}, code {code}',
  code: 'Code {code}',
  given: 'starter letter',
  selected: 'Selected code: {code}',
  play: {
    clear: 'Erase selected letter',
    undo: 'Undo',
    reset: 'Reset progress',
    mistakes: 'Show differences from the author key',
    duplicate: 'A letter has been assigned to more than one number.',
    open: 'Decoded {filled} of {total} letters.',
    solved: 'Solved! The author key has been restored.',
    alternative:
      'Solved within the selected word list. This is an alternative decoding.',
  },
  tools: {
    title: 'Files and publication',
    draft: 'Save draft JSON',
    puzzleExport: 'Save checked puzzle JSON',
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
    busy: 'Building and checking the puzzle…',
    cancel: 'Cancel operation',
    cancelled: 'Operation cancelled. The current puzzle was kept.',
    timeout:
      'The operation took too long. Change the grid or words and try again.',
    failed: 'Could not finish the operation.',
    storage:
      'Browser storage is unavailable or saved data is invalid. Use JSON files to keep your work.',
    progressLoaded: 'Progress restored.',
    fileSize: 'The file must be smaller than 1 MB.',
  },
  errors: {
    dimensions: 'Rows and columns must be whole numbers from 3 to 25.',
    title: 'Enter a title, up to 120 characters.',
    alphabet:
      'Check the word alphabet. Updating an existing grid requires the same alphabet.',
    words: 'Enter 2–40 distinct words.',
    letters:
      'Check “{word}”: use 2–25 letters from the selected alphabet; for a key entry use one available letter.',
    duplicates:
      'A word occurs more than once. Repeated answer words are not supported.',
    disconnected:
      'The words or grid are disconnected. Add crossing words or use a connected completed grid.',
    placement:
      'Could not place every word within the search limit. Increase the grid or change the list.',
    grid: 'Invalid grid. All white cells must belong to complete words of at least two letters.',
    coverage:
      'The grid uses {used} of {total} alphabet letters. Add the missing letters or turn off the full-alphabet requirement.',
    givens:
      'Check the starter letters and count. The count must fit the letters actually used, and include all explicitly selected letters.',
    dictionary: 'The verification dictionary may contain up to 5,000 words.',
    'dictionary-missing':
      'The verification dictionary does not contain “{word}”. Add it or correct the grid.',
    data: 'Invalid puzzle data or file.',
    version: 'Unsupported JSON schema version.',
    progress:
      'The progress file does not match the puzzle or tries to overwrite a starter letter.',
  },
};