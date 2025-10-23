const STORAGE_KEY = 'sudoku-progress-v5';
const STATS_KEY = 'sudoku-stats-v1';
const THEME_KEY = 'sudoku-theme';
const CONTRAST_KEY = 'sudoku-contrast';

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
let undoStack = [];
let redoStack = [];
let hintsUsed = 0;
const MAX_HINTS = 3;

// Element cache
const keypad = document.getElementById('mobile-keypad');
const messageEl = document.getElementById('status-message');
const bestTimeEl = document.getElementById('best-time');
const timerEl = document.getElementById('timer');
const newGameBtn = document.getElementById('new-game-btn');
const checkBtn = document.getElementById('check-btn');
const notesBtn = document.getElementById('notes-btn');
const feedbackBtn = document.getElementById('feedback-btn');
const hintBtn = document.getElementById('hint-btn');
const optionsBtn = document.getElementById('options-btn');
const infoBtn = document.getElementById('info-btn');
const undoBtn = document.getElementById('undo-btn');
const redoBtn = document.getElementById('redo-btn');

initApp();

function initApp() {
  applyStoredTheme();
  applyStoredContrast();
  addEventListeners();
  fetch('config.json')
    .then(response => {
      if (!response.ok) throw new Error(`Config HTTP ${response.status}`);
      return response.json();
    })
    .then(config => {
      configData = config;
      document.getElementById('app-title').textContent = config.title;
      renderLevelSelector(config.levels);
      loadStats();
      updateBestTimeDisplay(config.levels?.[0]?.id ?? null);
      if (!restoreProgress()) {
        loadSudoku(config.levels?.[0]?.id, true);
      } else {
        setMessage('Partida recuperada. Continua jugant!', 'info');
      }
    })
    .catch(error => {
      console.error("No s'ha pogut carregar la configuració.", error);
      const grid = document.getElementById('sudoku-grid');
      if (grid) grid.textContent = 'Error carregant els fitxers de configuració.';
      setMessage("No s'ha pogut carregar la configuració.", 'error');
    });
}

function addEventListeners() {
  if (keypad) keypad.addEventListener('click', handleKeypadClick);
  if (newGameBtn) newGameBtn.addEventListener('click', () => loadSudoku(currentLevelId, true));
  if (checkBtn) checkBtn.addEventListener('click', checkSolution);
  if (notesBtn) notesBtn.addEventListener('click', toggleNotesMode);
  if (feedbackBtn) feedbackBtn.addEventListener('click', toggleFeedbackMode);
  if (hintBtn) hintBtn.addEventListener('click', giveHint);
  if (optionsBtn) optionsBtn.addEventListener('click', () => openModal('options-modal'));
  if (infoBtn) infoBtn.addEventListener('click', () => openModal('info-modal'));
  if (undoBtn) undoBtn.addEventListener('click', undoAction);
  if (redoBtn) redoBtn.addEventListener('click', redoAction);

  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('click', handleDocumentClick);
  document.addEventListener('change', handleDocumentChange);
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

async function loadSudoku(levelId, userRequest) {
  if (!levelId) levelId = configData?.levels?.[0]?.id;
  const grid = document.getElementById('sudoku-grid');
  if (!grid) return;
  grid.innerHTML = `<div class="loading">${configData?.messages?.loading ?? 'Carregant...'}</div>`;

  let level = levelsById.get(levelId);
  if (!level) {
    const iterator = levelsById.values().next();
    if (!iterator.done) { level = iterator.value; levelId = level.id; }
  }
  if (!level) {
    grid.textContent = 'Nivell no disponible.';
    setMessage("No s'ha trobat el nivell sol·licitat.", 'error');
    return;
  }
  if (userRequest) clearProgress();

  isRestoring = true;
  currentLevelId = levelId;

  const fresh = await getFreshPuzzle(levelId);
  solutionGrid = stringToGrid(fresh?.solution ?? level.solution);
  currentBoard = stringToGrid(fresh?.puzzle ?? level.puzzle);
  notesGrid = createNotesGrid();
  
  undoStack = [];
  redoStack = [];
  hintsUsed = 0;

  renderGrid(currentBoard);
  setActiveLevel(levelId);
  updateNotesButton();
  updateFeedbackButton();
  updateUndoRedoButtons();
  updateHintButton();
  updateKeypadState();
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
    cell.setAttribute('role', 'gridcell');
    cell.setAttribute('aria-selected', 'false');
    const labelValue = value === 0 ? 'buida' : String(value);
    cell.setAttribute('aria-label', `fila ${row + 1}, columna ${col + 1}, ${labelValue}`);
    if (col === 2 || col === 5) cell.classList.add('block-right');
    if (row === 2 || row === 5) cell.classList.add('block-bottom');
    cell.tabIndex = editable ? 0 : -1;
    cell.addEventListener('click', () => setActiveCell(cell));
    renderCellContent(row, col, cell);
    grid.appendChild(cell);
  });
  cellElements = Array.from(grid.querySelectorAll('.cell'));
  updateKeypadState();
}

function renderAllCells() {
    for (let i = 0; i < 81; i++) {
        const row = Math.floor(i / 9);
        const col = i % 9;
        renderCellContent(row, col);
    }
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
  } else if (notes.size > 0 && noteMode) {
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
  updateBestTimeDisplay(levelId);
  syncOptionsPanel();
}

function setActiveCell(cell) {
  if (!cell || cell.classList.contains('fixed')) return;
  if (activeCell === cell) return;
  if (activeCell) activeCell.classList.remove('active');
  activeCell = cell;
  activeCell.classList.add('active');
  updateHighlights();
  cell.setAttribute('aria-selected', 'true');
}

function focusFirstEditableCell() {
  const firstEditable = document.querySelector('.cell.editable');
  if (firstEditable) setActiveCell(firstEditable);
  else activeCell = null;
}

function stringToGrid(sequence) {
  if (!sequence || sequence.length !== 81) return Array.from({ length: 9 }, () => Array(9).fill(0));
  const values = sequence.split('').map((char) => Number.parseInt(char, 10) || 0);
  const grid = [];
  for (let i = 0; i < 9; i += 1) grid.push(values.slice(i * 9, i * 9 + 9));
  return grid;
}
function gridToString(grid) { return grid.flat().map((n) => String(n ?? 0)).join(''); }
function createNotesGrid() { return Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => new Set())); }

function handleKeypadClick(event) {
  const button = event.target.closest('button');
  if (!activeCell || !button) return;
  const digit = Number.parseInt(button.dataset.num, 10);
  if (!isNaN(digit)) {
    handleDigitInput(digit);
  }
}

function handleKeyDown(event) {
  if (!cellElements.length) return;
  const actionableKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Backspace', 'Delete', '0'];
  if (!activeCell && (actionableKeys.includes(event.key) || /^[1-9]$/.test(event.key))) {
    focusFirstEditableCell();
  }
  if (!activeCell) return;
  if (/^[1-9]$/.test(event.key)) { handleDigitInput(Number(event.key)); event.preventDefault(); return; }
  if (event.key === '0' || event.key === 'Backspace' || event.key === 'Delete') { handleDigitInput(0); event.preventDefault(); return; }
  const moves = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
  if (moves[event.key]) { moveSelection(moves[event.key][0], moves[event.key][1]); event.preventDefault(); }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') { undoAction(); event.preventDefault(); }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') { redoAction(); event.preventDefault(); }
}

function handleDigitInput(digit) {
  if (!activeCell || activeCell.classList.contains('fixed')) return;
  if (noteMode) {
    if (digit === 0) { clearNotesForActiveCell(); } else { toggleNoteValue(digit); }
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
  } while (getCell(row, col)?.classList.contains('fixed'));
  setActiveCell(getCell(row, col));
}

function setCellValue(value) {
  if (!activeCell) return;
  const row = Number(activeCell.dataset.row);
  const col = Number(activeCell.dataset.col);
  const prevValue = currentBoard[row][col];
  if (prevValue === value) return;
  pushUndo({ type: 'set', row, col, prevValue, newValue: value, prevNotes: new Set(notesGrid[row][col]) });
  currentBoard[row][col] = value;
  notesGrid[row][col].clear();
  renderCellContent(row, col);
  const cell = getCell(row, col);
  if (cell) cell.classList.remove('incorrect');
  updateConflicts();
  updateKeypadState();
  updateAutoNotesForPeers(row, col, value);
  saveProgress();
}

function toggleNoteValue(digit) {
  if (!activeCell || digit < 1 || digit > 9) return;
  const row = Number(activeCell.dataset.row);
  const col = Number(activeCell.dataset.col);
  const notes = notesGrid[row][col];
  const before = new Set(notes);
  if (notes.has(digit)) notes.delete(digit); else notes.add(digit);
  pushUndo({ type: 'note', row, col, prevNotes: before, newNotes: new Set(notes) });
  renderCellContent(row, col);
  saveProgress();
}

function clearNotesForActiveCell() {
  if (!activeCell) return;
  const row = Number(activeCell.dataset.row);
  const col = Number(activeCell.dataset.col);
  const before = new Set(notesGrid[row][col]);
  if (before.size === 0) return;
  notesGrid[row][col].clear();
  pushUndo({ type: 'note', row, col, prevNotes: before, newNotes: new Set() });
  renderCellContent(row, col);
  saveProgress();
}

function getCell(row, col) { return cellElements[row * 9 + col] ?? null; }

function clearHighlights() {
  cellElements.forEach((cell) => { cell.classList.remove('active', 'peer', 'same-digit'); cell.setAttribute('aria-selected', 'false'); });
}
function updateHighlights() {
  cellElements.forEach(c => c.classList.remove('peer', 'same-digit'));
  if (!activeCell) return;
  const row = Number(activeCell.dataset.row);
  const col = Number(activeCell.dataset.col);
  const boxRow = Math.floor(row / 3);
  const boxCol = Math.floor(col / 3);
  const activeVal = currentBoard[row][col];
  cellElements.forEach((cell) => {
    const r = Number(cell.dataset.row);
    const c = Number(cell.dataset.col);
    if (cell === activeCell) return;
    if (r === row || c === col || (Math.floor(r / 3) === boxRow && Math.floor(c / 3) === boxCol)) cell.classList.add('peer');
    if (activeVal && currentBoard[r][c] === activeVal) cell.classList.add('same-digit');
  });
}

function checkSolution() {
  if (!cellElements.length) return;
  let complete = true;
  let correct = true;
  for (let row = 0; row < 9; row += 1) {
    for (let col = 0; col < 9; col += 1) {
      const cell = getCell(row, col);
      if (cell?.classList.contains('fixed')) continue;
      const currentValue = currentBoard[row][col];
      if (currentValue === 0) { complete = false; if (cell) cell.classList.remove('incorrect'); continue; }
      if (currentValue === solutionGrid[row][col]) { if (cell) cell.classList.remove('incorrect'); }
      else { correct = false; if (cell) cell.classList.add('incorrect'); }
    }
  }
  if (!complete) { setMessage('Encara hi ha caselles buides.', 'warning'); saveProgress(); return; }
  if (correct) {
    stopTimer();
    const isRecord = recordBestTime(currentLevelId, elapsedSeconds);
    clearProgress();
    setMessage(isRecord ? `Nou rècord! Has completat el Sudoku en ${formatTime(elapsedSeconds)}.` : `Felicitats! Has completat el Sudoku en ${formatTime(elapsedSeconds)}.`, 'success');
  } else {
    setMessage('Hi ha errors. Revisa les caselles en vermell.', 'error');
    saveProgress();
  }
}

function updateConflicts() {
  cellElements.forEach((cell) => cell.classList.remove('conflict'));
  if (!feedbackImmediate) return;

  const getCellCoords = (type, unitIndex, itemIndex) => {
    if (type === 'row') return [unitIndex, itemIndex];
    if (type === 'col') return [itemIndex, unitIndex];
    const boxRow = Math.floor(unitIndex / 3);
    const boxCol = unitIndex % 3;
    const cellRow = Math.floor(itemIndex / 3);
    const cellCol = itemIndex % 3;
    return [boxRow * 3 + cellRow, boxCol * 3 + cellCol];
  };

  const markConflicts = (unit, type, unitIndex) => {
    const seen = new Map();
    for (let i = 0; i < 9; i++) {
      const value = unit[i];
      if (value === 0) continue;
      if (seen.has(value)) {
        const originalCoords = getCellCoords(type, unitIndex, seen.get(value));
        getCell(originalCoords[0], originalCoords[1])?.classList.add('conflict');
        const currentCoords = getCellCoords(type, unitIndex, i);
        getCell(currentCoords[0], currentCoords[1])?.classList.add('conflict');
      } else {
        seen.set(value, i);
      }
    }
  };

  // Check rows and columns
  for (let i = 0; i < 9; i++) {
    markConflicts(currentBoard[i], 'row', i);
    markConflicts(currentBoard.map(row => row[i]), 'col', i);
  }

  // Check 3x3 boxes
  for (let i = 0; i < 9; i++) {
    const box = [];
    const boxRow = Math.floor(i / 3);
    const boxCol = i % 3;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        box.push(currentBoard[boxRow * 3 + r][boxCol * 3 + c]);
      }
    }
    markConflicts(box, 'box', i);
  }
}

function toggleNotesMode() {
  noteMode = !noteMode;
  renderAllCells(); // Re-render to show/hide notes without deleting data
  updateNotesButton();
  setMessage(noteMode ? 'Mode notes activat.' : 'Mode notes desactivat.', 'info');
  saveProgress();
}

function updateNotesButton() { if (!notesBtn) return; notesBtn.dataset.active = String(noteMode); }

function toggleFeedbackMode() {
  feedbackImmediate = !feedbackImmediate;
  updateFeedbackButton();
  setMessage(feedbackImmediate ? 'Feedback immediat activat.' : 'Feedback desactivat.', 'info');
  updateConflicts();
  saveProgress();
}

function updateFeedbackButton() { if (!feedbackBtn) return; feedbackBtn.dataset.active = String(feedbackImmediate); }

function setMessage(text, tone = 'info') { if (!messageEl) return; messageEl.textContent = text; messageEl.className = ''; messageEl.classList.add(`status-${tone}`); }

function startTimer() { stopTimer(); timerInterval = setInterval(() => { elapsedSeconds += 1; updateTimerDisplay(); if (!isRestoring && elapsedSeconds % 5 === 0) saveProgress(); }, 1000); }
function stopTimer() { if (timerInterval) { clearInterval(timerInterval); timerInterval = null; } }
function resetTimer() { stopTimer(); elapsedSeconds = 0; updateTimerDisplay(); }
function updateTimerDisplay() { if (!timerEl) return; timerEl.textContent = formatTime(elapsedSeconds); }
function formatTime(totalSeconds) { const m = String(Math.floor(totalSeconds / 60)).padStart(2, '0'); const s = String(totalSeconds % 60).padStart(2, '0'); return `${m}:${s}`; }

function saveProgress() {
  if (isRestoring || !currentLevelId) return;
  try {
    const payload = { levelId: currentLevelId, board: currentBoard.map((r) => r.slice()), notes: notesGrid.map((row) => row.map((set) => Array.from(set.values()).sort((a, b) => a - b))), noteMode, feedbackImmediate, elapsedSeconds, hintsUsed, solution: gridToString(solutionGrid) };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (error) { console.warn("No s'ha pogut desar el progrés.", error); }
}
function clearProgress() { try { localStorage.removeItem(STORAGE_KEY); } catch (error) { console.warn("No s'ha pogut netejar el progrés.", error); } }

function loadStats() { try { const raw = localStorage.getItem(STATS_KEY); if (!raw) return; const data = JSON.parse(raw); if (data && typeof data === 'object' && data.bestTimes) { bestTimes = data.bestTimes; } } catch (error) { console.warn("No s'han pogut carregar les estadístiques.", error); } }
function saveStats() { try { localStorage.setItem(STATS_KEY, JSON.stringify({ bestTimes })); } catch (error) { console.warn("No s'han pogut desar les estadístiques.", error); } }
function updateBestTimeDisplay(levelId = currentLevelId) { if (!bestTimeEl) return; const best = levelId ? bestTimes[levelId] : null; bestTimeEl.textContent = best ? formatTime(best) : '--:--'; }
function recordBestTime(levelId, time) { if (!levelId) return false; const currentBest = bestTimes[levelId]; if (!currentBest || time < currentBest) { bestTimes[levelId] = time; saveStats(); updateBestTimeDisplay(levelId); return true; } return false; }

function restoreProgress() {
  let saved; try { const raw = localStorage.getItem(STORAGE_KEY); if (!raw) return false; saved = JSON.parse(raw); } catch (error) { console.warn("No s'ha pogut recuperar el progrés.", error); return false; }
  const level = saved?.levelId ? levelsById.get(saved.levelId) : null; if (!level) return false;
  const restoredBoard = normalizeBoard(saved.board); if (!restoredBoard) return false;
  isRestoring = true; currentLevelId = saved.levelId; solutionGrid = saved?.solution ? stringToGrid(saved.solution) : stringToGrid(level.solution); currentBoard = restoredBoard; notesGrid = createNotesGrid();
  if (Array.isArray(saved.notes)) { for (let row = 0; row < 9; row += 1) { for (let col = 0; col < 9; col += 1) { const cellNotes = saved.notes[row]?.[col]; if (Array.isArray(cellNotes)) { const cleanNotes = cellNotes.map((n) => Number(n)).filter((n) => Number.isInteger(n) && n >= 1 && n <= 9); notesGrid[row][col] = new Set(cleanNotes); } } } }
  noteMode = Boolean(saved.noteMode); feedbackImmediate = saved.feedbackImmediate !== false; hintsUsed = saved.hintsUsed || 0;
  renderGrid(currentBoard);
  setActiveLevel(currentLevelId);
  updateNotesButton();
  updateFeedbackButton();
  updateHintButton();
  updateKeypadState();
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
function normalizeBoard(board) { if (!Array.isArray(board) || board.length !== 9) return null; const out = []; for (let r = 0; r < 9; r += 1) { const row = board[r]; if (!Array.isArray(row) || row.length !== 9) return null; out.push(row.map((v) => { const n = Number(v); return Number.isInteger(n) && n >= 0 && n <= 9 ? n : 0; })); } return out; }

// Fresh puzzle via symmetries
function randomInt(n) { return Math.floor(Math.random() * n); }
function shuffle(arr) { for (let i = arr.length - 1; i > 0; i -= 1) { const j = randomInt(i + 1); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }
function applyDigitPerm(str, perm) { return str.split('').map((ch) => { const d = Number.parseInt(ch, 10); return d ? String(perm[d]) : '0'; }).join(''); }
function transformSudoku(puzzleStr, solutionStr) {
  const perm = [0, ...shuffle([1,2,3,4,5,6,7,8,9])];
  let p = applyDigitPerm(puzzleStr, perm); let s = applyDigitPerm(solutionStr, perm);
  let pg = stringToGrid(p); let sg = stringToGrid(s);
  for (let band=0; band<3; band+=1){ const base=band*3; const order=shuffle([0,1,2]); const rows=[pg[base],pg[base+1],pg[base+2]]; const rowsS=[sg[base],sg[base+1],sg[base+2]]; for(let i=0;i<3;i+=1){ pg[base+i]=rows[order[i]]; sg[base+i]=rowsS[order[i]]; } }
  for (let stack=0; stack<3; stack+=1){ const base=stack*3; const order=shuffle([0,1,2]); for (let r=0;r<9;r+=1){ const cols=[pg[r][base],pg[r][base+1],pg[r][base+2]]; const colsS=[sg[r][base],sg[r][base+1],sg[r][base+2]]; pg[r][base]=cols[order[0]]; pg[r][base+1]=cols[order[1]]; pg[r][base+2]=cols[order[2]]; sg[r][base]=colsS[order[0]]; sg[r][base+1]=colsS[order[1]]; sg[r][base+2]=colsS[order[2]]; } }
  const bandOrder=shuffle([0,1,2]); const newPg=[]; const newSg=[]; for(let i=0;i<3;i+=1){ const b=bandOrder[i]; newPg.push(pg[b*3],pg[b*3+1],pg[b*3+2]); newSg.push(sg[b*3],sg[b*3+1],sg[b*3+2]); } pg=newPg; sg=newSg;
  const stackOrder=shuffle([0,1,2]); for(let r=0;r<9;r+=1){ const cols=[pg[r].slice(0,3),pg[r].slice(3,6),pg[r].slice(6,9)]; const colsS=[sg[r].slice(0,3),sg[r].slice(3,6),sg[r].slice(6,9)]; pg[r]=[...cols[stackOrder[0]],...cols[stackOrder[1]],...cols[stackOrder[2]]]; sg[r]=[...colsS[stackOrder[0]],...colsS[stackOrder[1]],...colsS[stackOrder[2]]]; }
  return { puzzle: gridToString(pg), solution: gridToString(sg) };
}
async function getFreshPuzzle(levelId){ const level=levelsById.get(levelId); if(!level) return null; if (Array.isArray(level.puzzles)&&level.puzzles.length>0){ const pick=level.puzzles[Math.floor(Math.random()*level.puzzles.length)]; return transformSudoku(pick.puzzle,pick.solution);} return transformSudoku(level.puzzle,level.solution); }

// Undo / Redo
function pushUndo(a){ undoStack.push(a); redoStack=[]; updateUndoRedoButtons(); }
function undoAction(){ if(undoStack.length===0) return; const a=undoStack.pop(); applyAction(a, true); redoStack.push(a); updateUndoRedoButtons(); saveProgress(); }
function redoAction(){ if(redoStack.length===0) return; const a=redoStack.pop(); applyAction(a, false); undoStack.push(a); updateUndoRedoButtons(); saveProgress(); }
function applyAction(a, isUndo){
    const {row, col} = a;
    if (a.type === 'set') {
        currentBoard[row][col] = isUndo ? a.prevValue : a.newValue;
        notesGrid[row][col] = new Set(isUndo ? a.prevNotes : []);
    } else if (a.type === 'note') {
        notesGrid[row][col] = new Set(isUndo ? a.prevNotes : a.newNotes);
    }
    renderCellContent(row, col);
    updateConflicts();
    updateKeypadState();
}
function updateUndoRedoButtons(){ if(undoBtn) undoBtn.disabled = undoStack.length === 0; if(redoBtn) redoBtn.disabled = redoStack.length === 0; }

// Notes helpers
function updateAutoNotesForPeers(row,col,value){ if (!noteMode) return; for(let c=0;c<9;c+=1){ if(c===col) continue; if(notesGrid[row][c].delete(value)) renderCellContent(row,c); } for(let r=0;r<9;r+=1){ if(r===row) continue; if(notesGrid[r][col].delete(value)) renderCellContent(r,col); } const br=Math.floor(row/3)*3, bc=Math.floor(col/3)*3; for(let r=br;r<br+3;r+=1){ for(let c=bc;c<bc+3;c+=1){ if(r===row && c===col) continue; if(notesGrid[r][c].delete(value)) renderCellContent(r,c); } } }

// Theme
function applyStoredTheme(){ const theme=localStorage.getItem(THEME_KEY); if(theme) document.documentElement.setAttribute('data-theme', theme); }
function applyStoredContrast(){ const c=localStorage.getItem(CONTRAST_KEY); if(c) document.documentElement.setAttribute('data-contrast', c); }

// Keypad state
function updateKeypadState() {
    if (!keypad) return;
    const counts = Array(10).fill(0);
    for (const row of currentBoard) {
        for (const v of row) {
            if (v >= 1 && v <= 9) counts[v]++;
        }
    }
    for (let i = 1; i <= 9; i++) {
        const btn = keypad.querySelector(`[data-num="${i}"]`);
        if (btn) {
            btn.classList.toggle('completed', counts[i] === 9);
        }
    }
}

// Hint
function giveHint(){ if (hintsUsed >= MAX_HINTS) { setMessage(`Has esgotat les ${MAX_HINTS} pistes disponibles.`, 'warn'); return; } const empties=[]; for(let r=0;r<9;r+=1){ for(let c=0;c<9;c+=1){ if(currentBoard[r][c]===0) empties.push([r,c]); } } if(empties.length===0){ setMessage('No hi ha caselles buides per a una pista.', 'info'); return; } const [row,col]=empties[Math.floor(Math.random()*empties.length)]; const value=solutionGrid[row][col];
  const cell = getCell(row, col);
  if (cell) setActiveCell(cell);
  setCellValue(value); 
  hintsUsed++; 
  updateHintButton(); 
  saveProgress(); 
  setMessage(`Pista ${hintsUsed} de ${MAX_HINTS} utilitzada.`, 'info');
}

function updateHintButton() {
  if (!hintBtn) return;
  const remaining = MAX_HINTS - hintsUsed;
  hintBtn.disabled = remaining <= 0;
  const label = hintBtn.querySelector('.label');
  if (label) {
    label.textContent = `Pista (${remaining})`;
  }
}

// PWA registration
if('serviceWorker' in navigator){ window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => {}); }); }

// Modals
function openModal(id){ const el=document.getElementById(id); if(!el) return; el.setAttribute('aria-hidden','false'); attachModalSync(); }
function closeModal(id){ const el=document.getElementById(id); if(!el) return; el.setAttribute('aria-hidden','true'); }
function handleDocumentClick(e) {
  const target=e.target.closest('[data-close]');
  if(target){ const id=target.getAttribute('data-close'); if(id) closeModal(id); }
  
  const viewTarget = e.target.closest('[data-view]');
  if (viewTarget){ 
    const key=viewTarget.dataset.view; 
    if(key==='classic'){ document.documentElement.setAttribute('data-theme','light'); document.documentElement.setAttribute('data-contrast','normal'); localStorage.setItem(THEME_KEY,'light'); localStorage.setItem(CONTRAST_KEY,'normal'); } 
    else if(key==='contrast'){ document.documentElement.setAttribute('data-theme','light'); document.documentElement.setAttribute('data-contrast','high'); localStorage.setItem(THEME_KEY,'light'); localStorage.setItem(CONTRAST_KEY,'high'); } 
    else if(key==='dark'){ document.documentElement.setAttribute('data-theme','dark'); document.documentElement.setAttribute('data-contrast','normal'); localStorage.setItem(THEME_KEY,'dark'); localStorage.setItem(CONTRAST_KEY,'normal'); } 
    attachModalSync(); 
  }
}
function handleDocumentChange(e){
  const t=e.target;
  if (t?.id==='opt-feedback'){ toggleFeedbackMode(); t.checked = feedbackImmediate; }
  if (t?.id==='opt-notes'){ toggleNotesMode(); t.checked = noteMode; }
}

function attachModalSync(){
  const fb = document.getElementById('opt-feedback'); if (fb) fb.checked = feedbackImmediate;
  const nt = document.getElementById('opt-notes'); if (nt) nt.checked = noteMode;
  document.querySelectorAll('.segmented .seg').forEach(b=>{
    b.classList.remove('active');
  });
  const t = document.documentElement.getAttribute('data-theme')==='dark'?'dark':'light';
  const c = document.documentElement.getAttribute('data-contrast')==='high'?'high':'normal';
  const activeKey = (t==='dark')? 'dark' : (c==='high' ? 'contrast' : 'classic');
  const activeBtn = document.querySelector(`.segmented .seg[data-view="${activeKey}"]`);
  if (activeBtn) activeBtn.classList.add('active');
}
function syncOptionsPanel(){ attachModalSync(); }
