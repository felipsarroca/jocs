const STORAGE_KEY = 'sudoku-progress-v3';
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

const keypad = document.getElementById('mobile-keypad');
const messageEl = document.getElementById('status-message');
const bestTimeEl = document.getElementById('best-time');
const timerEl = document.getElementById('timer');
const newGameBtn = document.getElementById('new-game-btn');
const checkBtn = document.getElementById('check-btn');
const notesBtn = document.getElementById('notes-btn');
const feedbackBtn = document.getElementById('feedback-btn');
const hintBtn = document.getElementById('hint-btn');
const viewBtn = document.getElementById('view-btn');
const optionsBtn = document.getElementById('options-btn');
const infoBtn = document.getElementById('info-btn');
const countersEl = document.getElementById('digit-counters');

initApp();

if (keypad) keypad.addEventListener('click', handleKeypadClick);
document.addEventListener('keydown', handleKeyDown);
if (newGameBtn) newGameBtn.addEventListener('click', () => loadSudoku(currentLevelId, true));
if (checkBtn) checkBtn.addEventListener('click', checkSolution);
if (notesBtn) notesBtn.addEventListener('click', toggleNotesMode);
if (feedbackBtn) feedbackBtn.addEventListener('click', toggleFeedbackMode);
if (hintBtn) hintBtn.addEventListener('click', giveHint);
if (viewBtn) viewBtn.addEventListener('click', cycleViewMode);
if (optionsBtn) optionsBtn.addEventListener('click', () => openModal('options-modal'));
if (infoBtn) infoBtn.addEventListener('click', () => openModal('info-modal'));

function initApp() {
  applyStoredTheme();
  applyStoredContrast();
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
        loadSudoku(config.levels?.[0]?.id, true);
      } else {
        setMessage('Partida recuperada. Continua jugant!', 'info');
      }
    })
    .catch((error) => {
      console.error("No s'ha pogut carregar la configuració.", error);
      const grid = document.getElementById('sudoku-grid');
      if (grid) grid.textContent = 'Error carregant els fitxers de configuració.';
      setMessage("No s'ha pogut carregar la configuració.", 'error');
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

async function loadSudoku(levelId, userRequest) {
  if (!levelId) levelId = configData?.levels?.[0]?.id;
  const grid = document.getElementById('sudoku-grid');
  if (!grid) return;
  const loadingText = configData?.messages?.loading ?? 'Carregant...';
  grid.textContent = loadingText;

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
  const puzzleStr = fresh?.puzzle ?? level.puzzle;
  const solutionStr = fresh?.solution ?? level.solution;

  solutionGrid = stringToGrid(solutionStr);
  currentBoard = stringToGrid(puzzleStr);
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
  undoStack = [];
  redoStack = [];
  updateUndoRedoButtons();

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
  updateDigitCounters();
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
  if (!cell) return;
  if (activeCell) activeCell.classList.remove('active');
  activeCell = cell;
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
  if (!activeCell || !event.target.matches('button')) return;
  const digit = Number.parseInt(event.target.dataset.num, 10) || 0;
  handleDigitInput(digit);
}

function handleKeyDown(event) {
  if (!cellElements.length) return;
  const actionableKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Backspace', 'Delete', '0'];
  if (!activeCell && (actionableKeys.includes(event.key) || /^[1-9]$/.test(event.key))) {
    focusFirstEditableCell();
  }
  if (!activeCell) return;
  if (/^[1-9]$/.test(event.key)) { handleDigitInput(Number(event.key)); event.preventDefault(); return; }
  if (event.key === '0') { handleDigitInput(0); event.preventDefault(); return; }
  if (event.key === 'Backspace' || event.key === 'Delete') { if (noteMode) { clearNotesForActiveCell(); } else { handleDigitInput(0); } event.preventDefault(); return; }
  const moves = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
  if (moves[event.key]) { moveSelection(moves[event.key][0], moves[event.key][1]); event.preventDefault(); }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') { undoAction(); event.preventDefault(); }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') { redoAction(); event.preventDefault(); }
}

function handleDigitInput(digit) {
  if (!activeCell || activeCell.dataset.fixed === 'true') return;
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
  do { row = (row + deltaRow + 9) % 9; col = (col + deltaCol + 9) % 9; attempts += 1; if (attempts > 81) return; } while (getCell(row, col)?.dataset.fixed === 'true');
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
  updateDigitCounters();
  if (noteMode && value !== 0) updateAutoNotesForPeers(row, col, value);
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
  updateDigitCounters();
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
  updateDigitCounters();
  saveProgress();
}

function getCell(row, col) { return cellElements[row * 9 + col] ?? null; }

function clearHighlights() {
  cellElements.forEach((cell) => { cell.classList.remove('active', 'peer', 'same-digit'); cell.setAttribute('aria-selected', 'false'); });
}
function updateHighlights() {
  if (!activeCell) return;
  clearHighlights();
  activeCell.classList.add('active');
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
      if (cell?.dataset.fixed === 'true') continue;
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
  if (!feedbackImmediate) { cellElements.forEach((cell) => cell.classList.remove('conflict')); return; }
  const conflictGrid = Array.from({ length: 9 }, () => Array(9).fill(false));
  for (let row = 0; row < 9; row += 1) {
    const map = new Map();
    for (let col = 0; col < 9; col += 1) {
      const value = currentBoard[row][col];
      if (value === 0) continue;
      if (!map.has(value)) map.set(value, []);
      map.get(value).push(col);
    }
    map.forEach((cols) => { if (cols.length > 1) cols.forEach((col) => { conflictGrid[row][col] = true; }); });
  }
  for (let col = 0; col < 9; col += 1) {
    const map = new Map();
    for (let row = 0; row < 9; row += 1) {
      const value = currentBoard[row][col];
      if (value === 0) continue;
      if (!map.has(value)) map.set(value, []);
      map.get(value).push(row);
    }
    map.forEach((rows) => { if (rows.length > 1) rows.forEach((row) => { conflictGrid[row][col] = true; }); });
  }
  for (let boxRow = 0; boxRow < 3; boxRow += 1) {
    for (let boxCol = 0; boxCol < 3; boxCol += 1) {
      const map = new Map();
      for (let r = 0; r < 3; r += 1) {
        for (let c = 0; c < 3; c += 1) {
          const row = boxRow * 3 + r; const col = boxCol * 3 + c; const value = currentBoard[row][col];
          if (value === 0) continue;
          if (!map.has(value)) map.set(value, []);
          map.get(value).push([row, col]);
        }
      }
      map.forEach((cells) => { if (cells.length > 1) cells.forEach(([row, col]) => { conflictGrid[row][col] = true; }); });
    }
  }
  cellElements.forEach((cell) => {
    const row = Number(cell.dataset.row); const col = Number(cell.dataset.col);
    if (cell.dataset.fixed === 'true') { cell.classList.remove('conflict'); return; }
    cell.classList.toggle('conflict', conflictGrid[row][col]);
  });
}

function toggleNotesMode() {
  noteMode = !noteMode;
  if (noteMode) recomputeAllNotes(); else clearAllNotes();
  updateNotesButton();
  setMessage(noteMode ? 'Mode notes activat.' : 'Mode notes desactivat.', 'info');
  saveProgress();
}
function updateNotesButton() { if (!notesBtn) return; notesBtn.dataset.active = String(noteMode); notesBtn.textContent = noteMode ? 'Notes activades' : 'Notes desactivades'; }
function toggleFeedbackMode() {
  feedbackImmediate = !feedbackImmediate;
  updateFeedbackButton();
  setMessage(feedbackImmediate ? 'Feedback immediat activat (conflictes marcats al moment).' : 'Mode clàssic: els conflictes no es mostren fins a comprovar.', 'info');
  updateConflicts();
  saveProgress();
}
function updateFeedbackButton() { if (!feedbackBtn) return; feedbackBtn.dataset.active = String(feedbackImmediate); feedbackBtn.textContent = feedbackImmediate ? 'Feedback immediat' : 'Feedback clàssic'; }
function setMessage(text, tone = 'info') { if (!messageEl) return; messageEl.textContent = text; messageEl.className = ''; messageEl.classList.add(`status-${tone}`); }

function startTimer() { stopTimer(); timerInterval = setInterval(() => { elapsedSeconds += 1; updateTimerDisplay(); if (!isRestoring && elapsedSeconds % 5 === 0) saveProgress(); }, 1000); }
function stopTimer() { if (timerInterval) { clearInterval(timerInterval); timerInterval = null; } }
function resetTimer() { stopTimer(); elapsedSeconds = 0; updateTimerDisplay(); }
function updateTimerDisplay() { if (!timerEl) return; timerEl.textContent = formatTime(elapsedSeconds); }
function formatTime(totalSeconds) { const m = String(Math.floor(totalSeconds / 60)).padStart(2, '0'); const s = String(totalSeconds % 60).padStart(2, '0'); return `${m}:${s}`; }

function saveProgress() {
  if (isRestoring || !currentLevelId) return;
  try {
    const payload = { levelId: currentLevelId, board: currentBoard.map((r) => r.slice()), notes: notesGrid.map((row) => row.map((set) => Array.from(set.values()).sort((a, b) => a - b))), noteMode, feedbackImmediate, elapsedSeconds, solution: gridToString(solutionGrid) };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (error) { console.warn("No s'ha pogut desar el progrés.", error); }
}
function clearProgress() { try { localStorage.removeItem(STORAGE_KEY); } catch (error) { console.warn("No s'ha pogut netejar el progrés.", error); } }

function loadStats() { try { const raw = localStorage.getItem(STATS_KEY); if (!raw) return; const data = JSON.parse(raw); if (data && typeof data === 'object' && data.bestTimes) { bestTimes = data.bestTimes; } } catch (error) { console.warn("No s'han pogut carregar les estadístiques.", error); } }
function saveStats() { try { localStorage.setItem(STATS_KEY, JSON.stringify({ bestTimes })); } catch (error) { console.warn("No s'han pogut desar les estadístiques.", error); } }
function updateBestTimeDisplay(levelId = currentLevelId) { if (!bestTimeEl) return; const best = levelId ? bestTimes[levelId] : null; bestTimeEl.textContent = best ? `Millor temps: ${formatTime(best)}` : 'Sense millor temps'; }
function recordBestTime(levelId, time) { if (!levelId) return false; const currentBest = bestTimes[levelId]; if (!currentBest || time < currentBest) { bestTimes[levelId] = time; saveStats(); updateBestTimeDisplay(levelId); return true; } return false; }

function restoreProgress() {
  let saved; try { const raw = localStorage.getItem(STORAGE_KEY); if (!raw) return false; saved = JSON.parse(raw); } catch (error) { console.warn("No s'ha pogut recuperar el progrés.", error); return false; }
  const level = saved?.levelId ? levelsById.get(saved.levelId) : null; if (!level) return false;
  const restoredBoard = normalizeBoard(saved.board); if (!restoredBoard) return false;
  isRestoring = true; currentLevelId = saved.levelId; solutionGrid = saved?.solution ? stringToGrid(saved.solution) : stringToGrid(level.solution); currentBoard = restoredBoard; notesGrid = createNotesGrid();
  if (Array.isArray(saved.notes)) { for (let row = 0; row < 9; row += 1) { for (let col = 0; col < 9; col += 1) { const cellNotes = saved.notes[row]?.[col]; if (Array.isArray(cellNotes)) { const cleanNotes = cellNotes.map((n) => Number(n)).filter((n) => Number.isInteger(n) && n >= 1 && n <= 9); notesGrid[row][col] = new Set(cleanNotes); } } } }
  noteMode = Boolean(saved.noteMode); feedbackImmediate = saved.feedbackImmediate !== false;
  renderGrid(currentBoard); setActiveLevel(currentLevelId); updateNotesButton(); updateFeedbackButton(); focusFirstEditableCell(); elapsedSeconds = Number(saved.elapsedSeconds) || 0; updateTimerDisplay(); updateConflicts(); updateBestTimeDisplay(currentLevelId); isRestoring = false; startTimer(); saveProgress(); return true;
}
function normalizeBoard(board) { if (!Array.isArray(board) || board.length !== 9) return null; const out = []; for (let r = 0; r < 9; r += 1) { const row = board[r]; if (!Array.isArray(row) || row.length !== 9) return null; out.push(row.map((v) => { const n = Number(v); return Number.isInteger(n) && n >= 0 && n <= 9 ? n : 0; })); } return out; }

// Fresh puzzle via symmetries
function randomInt(n) { return Math.floor(Math.random() * n); }
function shuffle(arr) { for (let i = arr.length - 1; i > 0; i -= 1) { const j = randomInt(i + 1); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }
function applyDigitPerm(str, perm) { return str.split('').map((ch) => { const d = Number.parseInt(ch, 10); return d ? String(perm[d]) : '0'; }).join(''); }
function transformSudoku(puzzleStr, solutionStr) {
  const perm = [0]; const digits = shuffle([1,2,3,4,5,6,7,8,9]); for (let i=0;i<9;i+=1) perm.push(digits[i]);
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
function undoAction(){ if(undoStack.length===0) return; const a=undoStack.pop(); applyInverse(a); redoStack.push(a); updateUndoRedoButtons(); saveProgress(); }
function redoAction(){ if(redoStack.length===0) return; const a=redoStack.pop(); applyForward(a); undoStack.push(a); updateUndoRedoButtons(); saveProgress(); }
function applyForward(a){ const {row,col}=a; if(a.type==='set'){ currentBoard[row][col]=a.newValue; notesGrid[row][col]=new Set(); renderCellContent(row,col); updateConflicts(); } else if(a.type==='note'){ notesGrid[row][col]=new Set(a.newNotes); renderCellContent(row,col); } }
function applyInverse(a){ const {row,col}=a; if(a.type==='set'){ currentBoard[row][col]=a.prevValue; notesGrid[row][col]=new Set(a.prevNotes); renderCellContent(row,col); updateConflicts(); } else if(a.type==='note'){ notesGrid[row][col]=new Set(a.prevNotes); renderCellContent(row,col); } }
function updateUndoRedoButtons(){ /* hidden controls: no UI buttons shown */ }

// Notes helpers
function recomputeAllNotes(){ for(let r=0;r<9;r+=1){ for(let c=0;c<9;c+=1){ if(currentBoard[r][c]!==0){ notesGrid[r][c].clear(); continue;} const cand=candidatesFor(r,c); notesGrid[r][c]=new Set(cand); renderCellContent(r,c); } } }
function clearAllNotes(){ for(let r=0;r<9;r+=1){ for(let c=0;c<9;c+=1){ notesGrid[r][c].clear(); renderCellContent(r,c); } } }
function candidatesFor(row,col){ const present=new Set(); for(let i=0;i<9;i+=1){ if(currentBoard[row][i]!==0) present.add(currentBoard[row][i]); if(currentBoard[i][col]!==0) present.add(currentBoard[i][col]); } const br=Math.floor(row/3)*3, bc=Math.floor(col/3)*3; for(let r=br;r<br+3;r+=1){ for(let c=bc;c<bc+3;c+=1){ if(currentBoard[r][c]!==0) present.add(currentBoard[r][c]); } } const out=[]; for(let d=1; d<=9; d+=1) if(!present.has(d)) out.push(d); return out; }
function updateAutoNotesForPeers(row,col,value){ for(let c=0;c<9;c+=1){ if(c===col) continue; if(notesGrid[row][c].delete(value)) renderCellContent(row,c); } for(let r=0;r<9;r+=1){ if(r===row) continue; if(notesGrid[r][col].delete(value)) renderCellContent(r,col); } const br=Math.floor(row/3)*3, bc=Math.floor(col/3)*3; for(let r=br;r<br+3;r+=1){ for(let c=bc;c<bc+3;c+=1){ if(r===row && c===col) continue; if(notesGrid[r][c].delete(value)) renderCellContent(r,c); } } }

// Theme
function applyStoredTheme(){ const theme=localStorage.getItem(THEME_KEY); if(theme) document.documentElement.setAttribute('data-theme', theme); }
function applyStoredContrast(){ const c=localStorage.getItem(CONTRAST_KEY); if(c) document.documentElement.setAttribute('data-contrast', c); }
function cycleViewMode(){
  const theme = document.documentElement.getAttribute('data-theme')==='dark'?'dark':'light';
  const contrast = document.documentElement.getAttribute('data-contrast')==='high'?'high':'normal';
  // order: classic (light+normal) -> contrast (light+high) -> dark (dark+normal) -> classic
  let nextTheme = theme, nextContrast = contrast;
  if (theme==='light' && contrast==='normal') { nextTheme='light'; nextContrast='high'; }
  else if (theme==='light' && contrast==='high') { nextTheme='dark'; nextContrast='normal'; }
  else { nextTheme='light'; nextContrast='normal'; }
  document.documentElement.setAttribute('data-theme', nextTheme);
  document.documentElement.setAttribute('data-contrast', nextContrast);
  localStorage.setItem(THEME_KEY, nextTheme);
  localStorage.setItem(CONTRAST_KEY, nextContrast);
  updateViewButtonsState();
}
function updateViewButtonsState(){
  const t = document.documentElement.getAttribute('data-theme')==='dark'?'dark':'light';
  const c = document.documentElement.getAttribute('data-contrast')==='high'?'high':'normal';
  const btn = document.getElementById('view-btn');
  if (!btn) return;
  if (t==='dark') btn.title='Visualització: Fosc';
  else if (c==='high') btn.title='Visualització: Alt contrast';
  else btn.title='Visualització: Clàssic';
}

// Counters
function updateDigitCounters(){ if(!countersEl) return; const counts=Array(10).fill(0); for(let r=0;r<9;r+=1){ for(let c=0;c<9;c+=1){ const v=currentBoard[r][c]; if(v>=1&&v<=9) counts[v]+=1; } } const remain=counts.map((cnt,d)=>(d===0?0:9-cnt)); countersEl.innerHTML=''; for(let d=1; d<=9; d+=1){ const el=document.createElement('div'); el.className='counter'; el.textContent=`${d} (${remain[d]})`; countersEl.appendChild(el);} }

// Hint
function giveHint(){ const empties=[]; for(let r=0;r<9;r+=1){ for(let c=0;c<9;c+=1){ if(currentBoard[r][c]===0 && getCell(r,c)?.dataset.fixed==='false') empties.push([r,c]); } } if(empties.length===0){ setMessage('No hi ha caselles disponibles per a pista.', 'info'); return; } const [row,col]=empties[Math.floor(Math.random()*empties.length)]; const cell=getCell(row,col); if(!cell) return; const value=solutionGrid[row][col]; activeCell=cell; pushUndo({ type:'set', row, col, prevValue:0, newValue:value, prevNotes:new Set(notesGrid[row][col]) }); currentBoard[row][col]=value; notesGrid[row][col].clear(); renderCellContent(row,col); updateConflicts(); updateDigitCounters(); if(noteMode) updateAutoNotesForPeers(row,col,value); saveProgress(); setMessage('Pista aplicada.', 'info'); }

// PWA registration
if('serviceWorker' in navigator){ window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => {}); }); }

// Modals
function openModal(id){ const el=document.getElementById(id); if(!el) return; el.setAttribute('aria-hidden','false'); attachModalSync(); }
function closeModal(id){ const el=document.getElementById(id); if(!el) return; el.setAttribute('aria-hidden','true'); }
document.addEventListener('click',(e)=>{ const target=e.target; if(target?.classList?.contains('modal-close')){ const id=target.getAttribute('data-close'); if(id) closeModal(id); }});
function attachModalSync(){
  // sync options toggles
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
function syncOptionsPanel(){ updateViewButtonsState(); }
document.addEventListener('change',(e)=>{
  const t=e.target;
  if (t?.id==='opt-feedback'){ toggleFeedbackMode(); t.checked = feedbackImmediate; }
  if (t?.id==='opt-notes'){ toggleNotesMode(); t.checked = noteMode; }
});
document.addEventListener('click',(e)=>{
  const t=e.target;
  if (t?.dataset?.view){ const key=t.dataset.view; if(key==='classic'){ document.documentElement.setAttribute('data-theme','light'); document.documentElement.setAttribute('data-contrast','normal'); localStorage.setItem(THEME_KEY,'light'); localStorage.setItem(CONTRAST_KEY,'normal'); } else if(key==='contrast'){ document.documentElement.setAttribute('data-theme','light'); document.documentElement.setAttribute('data-contrast','high'); localStorage.setItem(THEME_KEY,'light'); localStorage.setItem(CONTRAST_KEY,'high'); } else if(key==='dark'){ document.documentElement.setAttribute('data-theme','dark'); document.documentElement.setAttribute('data-contrast','normal'); localStorage.setItem(THEME_KEY,'dark'); localStorage.setItem(CONTRAST_KEY,'normal'); } updateViewButtonsState(); attachModalSync(); }
});
