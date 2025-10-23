let activeCell = null;
let solutionGrid = [];
let currentBoard = [];
let notesGrid = [];
let currentLevelId = null;
let configData = null;
const levelsById = new Map();
let cellElements = [];
let noteMode = false;
let feedbackImmediate = true;
let timerInterval = null;
let elapsedSeconds = 0;

const keypad = document.getElementById('mobile-keypad');
const messageEl = document.getElementById('status-message');
const timerEl = document.getElementById('timer');
const newGameBtn = document.getElementById('new-game-btn');
const checkBtn = document.getElementById('check-btn');
const notesBtn = document.getElementById('notes-btn');
const feedbackBtn = document.getElementById('feedback-btn');

initApp();

document.addEventListener('keydown', handleKeyDown);
keypad.addEventListener('click', handleKeypadClick);
newGameBtn.addEventListener('click', () => loadSudoku(currentLevelId, true));
checkBtn.addEventListener('click', checkSolution);
notesBtn.addEventListener('click', toggleNotesMode);
feedbackBtn.addEventListener('click', toggleFeedbackMode);

function initApp() {
  fetch('config.json')
    .then((response) => {
      if (!response.ok) throw new Error(`Config HTTP ${response.status}`);
      return response.json();
    })
    .then((config) => {
      configData = config;
      document.getElementById('app-title').textContent = config.title;
      renderLevelSelector(config.levels);
      loadSudoku(config.levels[0]?.id, false);
    })
    .catch((error) => {
      console.error('No s’ha pogut carregar la configuració.', error);
      const grid = document.getElementById('sudoku-grid');
      grid.textContent = 'Error carregant els fitxers de configuració.';
      setMessage('No s’ha pogut carregar la configuració.', 'error');
    });
}

function renderLevelSelector(levels = []) {
  const container = document.getElementById('level-selector');
  container.innerHTML = '';
  levels.forEach((level, index) => {
    levelsById.set(level.id, level);
    const button = document.createElement('button');
    button.textContent = level.label;
    button.type = 'button';
    button.dataset.level = level.id;
    button.className = 'level-btn';
    button.addEventListener('click', () => loadSudoku(level.id, true));
    if (index === 0) button.classList.add('active');
    container.appendChild(button);
  });
}

function loadSudoku(levelId, userRequest) {
  if (!levelId) {
    levelId = configData?.levels?.[0]?.id;
  }
  const grid = document.getElementById('sudoku-grid');
  const loadingText = configData?.messages?.loading ?? 'Carregant...';
  grid.textContent = loadingText;

  let level = levelsById.get(levelId);
  if (!level) {
    const firstEntry = levelsById.values().next();
    if (!firstEntry.done) {
      level = firstEntry.value;
      levelId = level.id;
    }
  }
  if (!level) {
    grid.textContent = 'Nivell no disponible.';
    setMessage('No s’ha trobat el nivell sol·licitat.', 'error');
    return;
  }

  solutionGrid = stringToGrid(level.solution);
  currentBoard = stringToGrid(level.puzzle);
  notesGrid = createNotesGrid();
  noteMode = false;
  updateNotesButton();
  updateFeedbackButton();

  renderGrid(currentBoard);
  setActiveLevel(levelId);
  focusFirstEditableCell();
  resetTimer();
  startTimer();
  updateConflicts();

  if (userRequest) {
    setMessage('Nou Sudoku carregat!', 'success');
  } else {
    setMessage('Sudoku carregat. Bona sort!', 'info');
  }
}

function renderGrid(board) {
  const grid = document.getElementById('sudoku-grid');
  grid.innerHTML = '';
  clearHighlights();
  activeCell = null;

  board.flat().forEach((value, index) => {
    const row = Math.floor(index / 9);
    const col = index % 9;
    const cell = document.createElement('div');
    const editable = value === 0;

    cell.className = editable ? 'cell editable' : 'cell fixed';
    cell.dataset.index = index;
    cell.dataset.row = row;
    cell.dataset.col = col;
    cell.dataset.fixed = String(!editable);

    if (col === 2 || col === 5) cell.classList.add('block-right');
    if (row === 2 || row === 5) cell.classList.add('block-bottom');

    cell.tabIndex = editable ? 0 : -1;
    cell.addEventListener('click', () => setActiveCell(cell));
    renderCellContent(row, col, cell);
    grid.appendChild(cell);
  });

  cellElements = Array.from(grid.querySelectorAll('.cell'));
}

function renderCellContent(row, col, cell = getCell(row, col)) {
  if (!cell) return;
  const value = currentBoard[row][col];
  const notes = notesGrid[row][col];

  cell.innerHTML = '';
  cell.classList.remove('has-notes');

  if (value !== 0) {
    cell.textContent = String(value);
    cell.classList.remove('incorrect', 'conflict');
  } else if (notes.size > 0) {
    cell.classList.add('has-notes');
    const wrapper = document.createElement('div');
    wrapper.className = 'notes-grid';
    for (let digit = 1; digit <= 9; digit += 1) {
      const span = document.createElement('span');
      span.textContent = notes.has(digit) ? String(digit) : '';
      wrapper.appendChild(span);
    }
    cell.appendChild(wrapper);
  } else {
    cell.textContent = '';
  }
}

function setActiveLevel(levelId) {
  currentLevelId = levelId;
  document.querySelectorAll('#level-selector .level-btn').forEach((button) => {
    button.classList.toggle('active', button.dataset.level === levelId);
  });
}

function setActiveCell(cell) {
  if (!cell) return;
  if (activeCell) activeCell.classList.remove('active');
  activeCell = cell;
  updateHighlights();
}

function focusFirstEditableCell() {
  const firstEditable = document.querySelector('.cell.editable');
  if (firstEditable) {
    setActiveCell(firstEditable);
  } else {
    activeCell = null;
  }
}

function stringToGrid(sequence) {
  if (!sequence || sequence.length !== 81) {
    return Array.from({ length: 9 }, () => Array(9).fill(0));
  }
  const values = sequence.split('').map((char) => Number.parseInt(char, 10) || 0);
  const grid = [];
  for (let i = 0; i < 9; i += 1) {
    grid.push(values.slice(i * 9, i * 9 + 9));
  }
  return grid;
}

function createNotesGrid() {
  return Array.from({ length: 9 }, () =>
    Array.from({ length: 9 }, () => new Set()),
  );
}

function handleKeypadClick(event) {
  if (!activeCell || !event.target.matches('button')) return;
  const digit = Number.parseInt(event.target.dataset.num, 10) || 0;
  handleDigitInput(digit);
}

function handleKeyDown(event) {
  if (!cellElements.length) return;

  const actionableKeys = [
    'ArrowUp',
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
    'Backspace',
    'Delete',
    '0',
  ];

  if (!activeCell && (actionableKeys.includes(event.key) || /^[1-9]$/.test(event.key))) {
    focusFirstEditableCell();
  }

  if (!activeCell) return;

  if (/^[1-9]$/.test(event.key)) {
    handleDigitInput(Number(event.key));
    event.preventDefault();
    return;
  }

  if (event.key === '0') {
    handleDigitInput(0);
    event.preventDefault();
    return;
  }

  if (event.key === 'Backspace' || event.key === 'Delete') {
    if (noteMode) {
      clearNotesForActiveCell();
    } else {
      handleDigitInput(0);
    }
    event.preventDefault();
    return;
  }

  const moves = {
    ArrowUp: [-1, 0],
    ArrowDown: [1, 0],
    ArrowLeft: [0, -1],
    ArrowRight: [0, 1],
  };

  if (moves[event.key]) {
    moveSelection(moves[event.key][0], moves[event.key][1]);
    event.preventDefault();
  }
}

function handleDigitInput(digit) {
  if (!activeCell || activeCell.dataset.fixed === 'true') return;
  if (noteMode) {
    if (digit === 0) {
      clearNotesForActiveCell();
    } else {
      toggleNoteValue(digit);
    }
  } else {
    setCellValue(digit);
  }
}

function moveSelection(deltaRow, deltaCol) {
  if (!activeCell) return;
  let row = Number(activeCell.dataset.row);
  let col = Number(activeCell.dataset.col);
  let attempts = 0;

  do {
    row = (row + deltaRow + 9) % 9;
    col = (col + deltaCol + 9) % 9;
    attempts += 1;
    if (attempts > 81) return;
  } while (getCell(row, col)?.dataset.fixed === 'true');

  setActiveCell(getCell(row, col));
}

function setCellValue(value) {
  if (!activeCell) return;
  const row = Number(activeCell.dataset.row);
  const col = Number(activeCell.dataset.col);
  currentBoard[row][col] = value;
  notesGrid[row][col].clear();
  renderCellContent(row, col);
  getCell(row, col).classList.remove('incorrect');
  updateConflicts();
}

function toggleNoteValue(digit) {
  if (digit < 1 || digit > 9) return;
  if (!activeCell) return;
  const row = Number(activeCell.dataset.row);
  const col = Number(activeCell.dataset.col);
  const notes = notesGrid[row][col];

  if (notes.has(digit)) {
    notes.delete(digit);
  } else {
    notes.add(digit);
  }
  renderCellContent(row, col);
}

function clearNotesForActiveCell() {
  if (!activeCell) return;
  const row = Number(activeCell.dataset.row);
  const col = Number(activeCell.dataset.col);
  notesGrid[row][col].clear();
  renderCellContent(row, col);
}

function getCell(row, col) {
  return cellElements[row * 9 + col] ?? null;
}

function clearHighlights() {
  cellElements.forEach((cell) => cell.classList.remove('active', 'peer'));
}

function updateHighlights() {
  if (!activeCell) return;
  clearHighlights();
  activeCell.classList.add('active');
  const row = Number(activeCell.dataset.row);
  const col = Number(activeCell.dataset.col);
  const boxRow = Math.floor(row / 3);
  const boxCol = Math.floor(col / 3);

  cellElements.forEach((cell) => {
    const r = Number(cell.dataset.row);
    const c = Number(cell.dataset.col);
    if (cell === activeCell) return;
    const sameRow = r === row;
    const sameCol = c === col;
    const sameBox = Math.floor(r / 3) === boxRow && Math.floor(c / 3) === boxCol;
    if (sameRow || sameCol || sameBox) {
      cell.classList.add('peer');
    }
  });
}

function checkSolution() {
  if (!cellElements.length) return;
  let complete = true;
  let correct = true;

  for (let row = 0; row < 9; row += 1) {
    for (let col = 0; col < 9; col += 1) {
      const cell = getCell(row, col);
      if (cell.dataset.fixed === 'true') continue;
      const currentValue = currentBoard[row][col];
      if (currentValue === 0) {
        complete = false;
        cell.classList.remove('incorrect');
        continue;
      }
      if (currentValue === solutionGrid[row][col]) {
        cell.classList.remove('incorrect');
      } else {
        correct = false;
        cell.classList.add('incorrect');
      }
    }
  }

  if (!complete) {
    setMessage('Encara hi ha caselles buides.', 'warning');
    return;
  }

  if (correct) {
    stopTimer();
    setMessage(`Felicitats! Has completat el Sudoku en ${formatTime(elapsedSeconds)}.`, 'success');
  } else {
    setMessage('Hi ha errors. Revisa les caselles en vermell.', 'error');
  }
}

function updateConflicts() {
  if (!feedbackImmediate) {
    cellElements.forEach((cell) => cell.classList.remove('conflict'));
    return;
  }

  const conflictGrid = Array.from({ length: 9 }, () => Array(9).fill(false));

  // Files
  for (let row = 0; row < 9; row += 1) {
    const map = new Map();
    for (let col = 0; col < 9; col += 1) {
      const value = currentBoard[row][col];
      if (value === 0) continue;
      if (!map.has(value)) {
        map.set(value, []);
      }
      map.get(value).push(col);
    }
    map.forEach((cols) => {
      if (cols.length > 1) {
        cols.forEach((col) => {
          conflictGrid[row][col] = true;
        });
      }
    });
  }

  // Columnes
  for (let col = 0; col < 9; col += 1) {
    const map = new Map();
    for (let row = 0; row < 9; row += 1) {
      const value = currentBoard[row][col];
      if (value === 0) continue;
      if (!map.has(value)) {
        map.set(value, []);
      }
      map.get(value).push(row);
    }
    map.forEach((rows) => {
      if (rows.length > 1) {
        rows.forEach((row) => {
          conflictGrid[row][col] = true;
        });
      }
    });
  }

  // Caixes
  for (let boxRow = 0; boxRow < 3; boxRow += 1) {
    for (let boxCol = 0; boxCol < 3; boxCol += 1) {
      const map = new Map();
      for (let r = 0; r < 3; r += 1) {
        for (let c = 0; c < 3; c += 1) {
          const row = boxRow * 3 + r;
          const col = boxCol * 3 + c;
          const value = currentBoard[row][col];
          if (value === 0) continue;
          if (!map.has(value)) {
            map.set(value, []);
          }
          map.get(value).push([row, col]);
        }
      }
      map.forEach((cells) => {
        if (cells.length > 1) {
          cells.forEach(([row, col]) => {
            conflictGrid[row][col] = true;
          });
        }
      });
    }
  }

  cellElements.forEach((cell) => {
    const row = Number(cell.dataset.row);
    const col = Number(cell.dataset.col);
    if (cell.dataset.fixed === 'true') {
      cell.classList.remove('conflict');
      return;
    }
    if (conflictGrid[row][col]) {
      cell.classList.add('conflict');
    } else {
      cell.classList.remove('conflict');
    }
  });
}

function toggleNotesMode() {
  noteMode = !noteMode;
  updateNotesButton();
  setMessage(noteMode ? 'Mode notes activat.' : 'Mode notes desactivat.', 'info');
}

function updateNotesButton() {
  notesBtn.dataset.active = String(noteMode);
  notesBtn.textContent = noteMode ? 'Notes activades' : 'Notes desactivades';
}

function toggleFeedbackMode() {
  feedbackImmediate = !feedbackImmediate;
  updateFeedbackButton();
  setMessage(
    feedbackImmediate
      ? 'Feedback immediat activat (conflictes marcats al moment).'
      : 'Mode clÃ ssic: els conflictes no es mostren fins que comprovis.',
    'info',
  );
  updateConflicts();
}

function updateFeedbackButton() {
  feedbackBtn.dataset.active = String(feedbackImmediate);
  feedbackBtn.textContent = feedbackImmediate ? 'Feedback immediat' : 'Feedback clÃ ssic';
}

function setMessage(text, tone = 'info') {
  if (!messageEl) return;
  messageEl.textContent = text;
  messageEl.className = '';
  messageEl.classList.add(`status-${tone}`);
}

function startTimer() {
  stopTimer();
  timerInterval = setInterval(() => {
    elapsedSeconds += 1;
    updateTimerDisplay();
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function resetTimer() {
  stopTimer();
  elapsedSeconds = 0;
  updateTimerDisplay();
}

function updateTimerDisplay() {
  if (!timerEl) return;
  timerEl.textContent = formatTime(elapsedSeconds);
}

function formatTime(totalSeconds) {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

// Inicialitzar botons de configuració
// Inicialitzar botons de configuració
updateFeedbackButton();
updateNotesButton();


