export const nonogramEn = {
  intro:
    'Draw a picture or generate a pattern, verify its unique solution, play and prepare a worksheet with an answer key.',
  rules: {
    title: 'How to play',
    text: 'The numbers give the lengths of filled groups in each row and column, in order. Leave at least one empty cell between groups. All row and column clues must agree.',
    example:
      'For example, 2 1 means a group of two filled cells, a gap of at least one cell and a single filled cell.',
    zero: 'A displayed 0 means the whole line is empty.',
    marks:
      'Use filled cells for the picture and crosses for cells you know are empty. Crosses are optional for completion.',
    keyboard:
      'Click cells or use arrow keys and Enter/Space. Right click or X marks an empty cell; Delete clears a mark. The editor supports clicks and keyboard selection.',
  },
  editor: {
    title: 'Drawing editor',
    titleLabel: 'Publication title',
    titleHint:
      'The title appears on the worksheet: avoid revealing the hidden picture.',
    rows: 'Rows',
    columns: 'Columns',
    sizeHint:
      'Sides: 2–20 cells. Reducing a side crops the drawing; Undo restores it.',
    grid: 'Drawing grid',
    drawHint:
      'Click a cell to switch it between black and white. Right click clears it.',
    clear: 'Clear drawing',
    invert: 'Invert drawing',
    undo: 'Undo drawing change',
    check: 'Verify drawing and open game',
    random: 'Generate a unique pattern',
    density: 'Target density (%)',
    symmetric: 'Vertical symmetry for generated patterns',
    save: 'Save drawing JSON',
    stats: 'Drawing: {rows} × {columns}; filled cells: {filled}.',
    presets: 'Example drawings',
  },
  presets: { heart: 'Heart', house: 'House', tree: 'Tree' },
  analysis: {
    unique:
      'The clues have exactly one solution. The current puzzle is ready for export.',
    multiple:
      'This drawing has several solutions. Edit it and verify again. This drawing is not ready for publication.',
    none: 'The clues have no solution. Check the puzzle data.',
    limit:
      'Verification reached its search limit. Uniqueness is not confirmed; this drawing is not ready for publication.',
  },
  current: {
    title: 'Current puzzle',
    verified: 'Unique solution verified',
    pending: 'Uniqueness has not been confirmed',
    stats: '{rows} × {columns}; filled: {filled} ({density}%).',
    blocked:
      'Printing, puzzle export and play become available after the current puzzle passes verification.',
  },
  views: {
    label: 'View',
    play: 'Play',
    task: 'Worksheet',
    solution: 'Answer key',
  },
  pixel: {
    filled: 'filled',
    empty: 'empty',
    unknown: 'unknown',
    crossed: 'marked empty',
  },
  cell: 'Row {row}, column {column}: {state}',
  rowClue: 'Row {index}: {clues}',
  columnClue: 'Column {index}: {clues}',
  board: 'Nonogram grid',
  play: {
    fill: 'Fill',
    empty: 'Mark empty',
    erase: 'Erase',
    undo: 'Undo move',
    reset: 'Reset progress',
    mistakes: 'Show mistakes using the answer',
    solved: 'Picture complete!',
    open: 'Use the row and column clues to reveal the picture.',
    conflict:
      'Some lines cannot match their clues. Check the highlighted clues.',
    lineHint:
      'Green clues match the filled groups. Red clues contradict the current marks. This checks each line; it does not reveal every incorrect guess.',
  },
  tools: {
    title: 'Publication files and printing',
    puzzleExport: 'Save verified puzzle JSON',
    puzzleImport: 'Load drawing or puzzle JSON',
    progressExport: 'Save progress JSON',
    progressImport: 'Load progress JSON',
    taskSvg: 'Worksheet SVG',
    solutionSvg: 'Answer SVG',
    taskPrint: 'Print worksheet',
    solutionPrint: 'Print answers',
    bothPrint: 'Print both',
  },
  messages: {
    busy: 'Checking the puzzle…',
    cancel: 'Cancel operation',
    cancelled: 'Operation cancelled. The previous puzzle was kept.',
    timeout:
      'The operation took too long. Uniqueness was not confirmed. Try a smaller grid or edit the drawing.',
    failed: 'Could not finish the operation. Try again.',
    storage:
      'Browser storage is unavailable or saved data is invalid. Use JSON files to keep your work.',
    progressLoaded: 'Progress restored.',
    fileSize: 'The file must be smaller than 1 MB.',
  },
  errors: {
    dimensions: 'Rows and columns must be whole numbers from 2 to 20.',
    title: 'Enter a publication title, up to 120 characters.',
    data: 'Invalid puzzle data, clues or file.',
    version: 'Unsupported JSON schema version.',
    progress:
      'The progress file does not match this puzzle or contains invalid marks.',
    density: 'Enter a target density from 20 to 80 percent.',
    generation:
      'No unique pattern was found within 24 attempts. Change the density or grid size, or draw a picture yourself.',
  },
};