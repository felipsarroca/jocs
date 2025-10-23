const STORAGE_KEY = 'sudoku-progress-v1';
const STATS_KEY = 'sudoku-stats-v1';

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
let isRestoring = false;
let bestTimes = {};

const keypad = document.getElementById('mobile-keypad');
const messageEl = document.getElementById('status-message');
const bestTimeEl = document.getElementById('best-time');
const timerEl = document.getElementById('timer');
const newGameBtn = document.getElementById('new-game-btn');
const checkBtn = document.getElementById('check-btn');
const notesBtn = document.getElementById('notes-btn');
const feedbackBtn = document.getElementById('feedback-btn');

initApp();

if (keypad) keypad.addEventListener('click', handleKeypadClick);
document.addEventListener('keydown', handleKeyDown);
if (newGameBtn) newGameBtn.addEventListener('click', () => loadSudoku(currentLevelId, true));
if (checkBtn) checkBtn.addEventListener('click', checkSolution);
if (notesBtn) notesBtn.addEventListener('click', toggleNotesMode);
if (feedbackBtn) feedbackBtn.addEventListener('click', toggleFeedbackMode);

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
      loadStats();
      updateBestTimeDisplay(config.levels?.[0]?.id ?? null);
      if (!restoreProgress()) {
        loadSudoku(config.levels?.[0]?.id, false);
      } else {
        setMessage('Partida recuperada. Continua jugant!', 'info');
      }
    })
    .catch((error) => {
      console.error('No s\'ha pogut carregar la configuració.', error);
      const grid = document.getElementById('sudoku-grid');
      if (grid) {
        grid.textContent = 'Error carregant els fitxers de configuració.';
      }
      setMessage('No s\'ha pogut carregar la configuració.', 'error');
    });
}

function renderLevelSelector(levels = []) {
  const container = document.getElementById('level-selector');
  if (!container) return;
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
  if (!grid) return;
  const loadingText = configData?.messages?.loading ?? 'Carregant...';
  grid.textContent = loadingText;

  let level = levelsById.get(levelId);
  if (!level) {
    const iterator = levelsById.values().next();
    if (!iterator.done) {
      level = iterator.value;
      levelId = level.id;
    }
  }
  if (!level) {
    grid.textContent = 'Nivell no disponible.';
    setMessage('No s\'ha trobat el nivell sol·licitat.', 'error');
    return;
  }

  if (userRequest) {
    clearProgress();
  }

  isRestoring = true;
  currentLevelId = levelId;
  solutionGrid = stringToGrid(level.solution);
  currentBoard = stringToGrid(level.puzzle);
  notesGrid = createNotesGrid();

  renderGrid(currentBoard);
  setActiveLevel(levelId);
  updateNotesButton();
  updateFeedbackButton();
  focusFirstEditableCell();
  resetTimer();
  startTimer();
  updateConflicts();
  updateBestTimeDisplay(levelId);

  isRestoring = false;
  saveProgress();

  setMessage(userRequest ? 'Nou Sudoku carregat!' : 'Sudoku carregat. Bona sort!', userRequest ? 'success' : 'info');
}

function renderGrid(board) {
  const grid = document.getElementById('sudoku-grid');
  if (!grid) return;
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
  }
}

function setActiveLevel(levelId) {
  currentLevelId = levelId;
  document.querySelectorAll('#level-selector .level-btn').forEach((button) => {
    button.classList.toggle('active', button.dataset.level === levelId);
  });
  updateBestTimeDisplay(levelId);
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
  const cell = getCell(row, col);
  if (cell) cell.classList.remove('incorrect');
  updateConflicts();
  saveProgress();
}

function toggleNoteValue(digit) {
  if (!activeCell || digit < 1 || digit > 9) return;
  const row = Number(activeCell.dataset.row);
  const col = Number(activeCell.dataset.col);
  const notes = notesGrid[row][col];

  if (notes.has(digit)) {
    notes.delete(digit);
  } else {
    notes.add(digit);
  }
  renderCellContent(row, col);
  saveProgress();
}

function clearNotesForActiveCell() {
  if (!activeCell) return;
  const row = Number(activeCell.dataset.row);
  const col = Number(activeCell.dataset.col);
  notesGrid[row][col].clear();
  renderCellContent(row, col);
  saveProgress();
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
      if (cell?.dataset.fixed === 'true') continue;
      const currentValue = currentBoard[row][col];
      if (currentValue === 0) {
        complete = false;
        if (cell) cell.classList.remove('incorrect');
        continue;
      }
      if (currentValue === solutionGrid[row][col]) {
        if (cell) cell.classList.remove('incorrect');
      } else {
        correct = false;
        if (cell) cell.classList.add('incorrect');
      }
    }
  }

  if (!complete) {
    setMessage('Encara hi ha caselles buides.', 'warning');
    saveProgress();
    return;
  }

  if (correct) {
    stopTimer();
    const isRecord = recordBestTime(currentLevelId, elapsedSeconds);
    clearProgress();
    setMessage(
      isRecord
        ? `Nou rècord! Has completat el Sudoku en ${formatTime(elapsedSeconds)}.`
        : `Felicitats! Has completat el Sudoku en ${formatTime(elapsedSeconds)}.`,
      'success',
    );
  } else {
    setMessage('Hi ha errors. Revisa les caselles en vermell.', 'error');
    saveProgress();
  }
}

function updateConflicts() {
  if (!feedbackImmediate) {
    cellElements.forEach((cell) => cell.classList.remove('conflict'));
    return;
  }

  const conflictGrid = Array.from({ length: 9 }, () => Array(9).fill(false));

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
    cell.classList.toggle('conflict', conflictGrid[row][col]);
  });
}

function toggleNotesMode() {
  noteMode = !noteMode;
  updateNotesButton();
  setMessage(noteMode ? 'Mode notes activat.' : 'Mode notes desactivat.', 'info');
  saveProgress();
}

function updateNotesButton() {
  if (!notesBtn) return;
  notesBtn.dataset.active = String(noteMode);
  notesBtn.textContent = noteMode ? 'Notes activades' : 'Notes desactivades';
}

function toggleFeedbackMode() {
  feedbackImmediate = !feedbackImmediate;
  updateFeedbackButton();
  setMessage(
    feedbackImmediate
      ? 'Feedback immediat activat (conflictes marcats al moment).'
      : 'Mode clàssic: els conflictes no es mostren fins a comprovar.',
    'info',
  );
  updateConflicts();
  saveProgress();
}

function updateFeedbackButton() {
  if (!feedbackBtn) return;
  feedbackBtn.dataset.active = String(feedbackImmediate);
  feedbackBtn.textContent = feedbackImmediate ? 'Feedback immediat' : 'Feedback clàssic';
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
    if (!isRestoring && elapsedSeconds % 5 === 0) {
      saveProgress();
    }
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

function saveProgress() {
  if (isRestoring || !currentLevelId) return;
  try {
    const payload = {
      levelId: currentLevelId,
      board: currentBoard.map((row) => row.slice()),
      notes: notesGrid.map((row) => row.map((set) => Array.from(set.values()).sort((a, b) => a - b))),
      noteMode,
      feedbackImmediate,
      elapsedSeconds,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn('No s\'ha pogut desar el progrés.', error);
  }
}

function clearProgress() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('No s\'ha pogut netejar el progrés.', error);
  }
}

function loadStats() {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (data && typeof data === 'object' && data.bestTimes) {
      bestTimes = data.bestTimes;
    }
  } catch (error) {
    console.warn('No s\'han pogut carregar les estadístiques.', error);
  }
}

function saveStats() {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify({ bestTimes }));
  } catch (error) {
    console.warn('No s\'han pogut desar les estadístiques.', error);
  }
}

function updateBestTimeDisplay(levelId = currentLevelId) {
  if (!bestTimeEl) return;
  const best = levelId ? bestTimes[levelId] : null;
  bestTimeEl.textContent = best
    ? `Millor temps: ${formatTime(best)}`
    : 'Sense millor temps';
}

function recordBestTime(levelId, time) {
  if (!levelId) return false;
  const currentBest = bestTimes[levelId];
  if (!currentBest || time < currentBest) {
    bestTimes[levelId] = time;
    saveStats();
    updateBestTimeDisplay(levelId);
    return true;
  }
  return false;
}

function restoreProgress() {
  let saved;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    saved = JSON.parse(raw);
  } catch (error) {
    console.warn('No s\'ha pogut recuperar el progrés.', error);
    return false;
  }

  const level = saved?.levelId ? levelsById.get(saved.levelId) : null;
  if (!level) return false;

  const restoredBoard = normalizeBoard(saved.board);
  if (!restoredBoard) return false;

  isRestoring = true;
  currentLevelId = saved.levelId;
  solutionGrid = stringToGrid(level.solution);
  currentBoard = restoredBoard;
  notesGrid = createNotesGrid();

  if (Array.isArray(saved.notes)) {
    for (let row = 0; row < 9; row += 1) {
      for (let col = 0; col < 9; col += 1) {
        const cellNotes = saved.notes[row]?.[col];
        if (Array.isArray(cellNotes)) {
          const cleanNotes = cellNotes
            .map((n) => Number(n))
            .filter((n) => Number.isInteger(n) && n >= 1 && n <= 9);
          notesGrid[row][col] = new Set(cleanNotes);
        }
      }
    }
  }

  noteMode = Boolean(saved.noteMode);
  feedbackImmediate = saved.feedbackImmediate !== false;
  renderGrid(currentBoard);
  setActiveLevel(currentLevelId);
  updateNotesButton();
  updateFeedbackButton();
  focusFirstEditableCell();
  elapsedSeconds = Number(saved.elapsedSeconds) || 0;
  updateTimerDisplay();
  updateConflicts();
  updateBestTimeDisplay(currentLevelId);
  isRestoring = false;
  startTimer();
  saveProgress();
  return true;
}

function normalizeBoard(board) {
  if (!Array.isArray(board) || board.length !== 9) return null;
  const normalized = [];
  for (let row = 0; row < 9; row += 1) {
    const currentRow = board[row];
    if (!Array.isArray(currentRow) || currentRow.length !== 9) return null;
    normalized.push(
      currentRow.map((value) => {
        const num = Number(value);
        return Number.isInteger(num) && num >= 0 && num <= 9 ? num : 0;
      }),
    );
  }
  return normalized;
}

updateFeedbackButton();
updateNotesButton();
updateBestTimeDisplay();
