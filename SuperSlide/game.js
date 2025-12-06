const BOARD_ROWS = 5;
const BOARD_COLS = 4;
const STORAGE_KEY = 'super-slide-progress';

let basePieces = [];
let goal = { row: 3, col: 1 };
let levelCount = 1000;

const state = {
  pieces: [],
  initialPieces: [],
  history: [],
  moves: 0,
  level: 1,
  variant: 1,
  seed: 0,
  minDistance: null,
  timerId: null,
  startTime: null,
  elapsed: 0,
  dragging: null,
};

const ui = {
  board: document.getElementById('board'),
  timer: document.getElementById('timer'),
  moves: document.getElementById('moves'),
  level: document.getElementById('level-label'),
  variant: document.getElementById('variant-label'),
  best: document.getElementById('best'),
  modalHow: document.getElementById('modal-howto'),
  modalWin: document.getElementById('modal-win'),
  winTitle: document.getElementById('win-title'),
  winTime: document.getElementById('win-time'),
  winMoves: document.getElementById('win-moves'),
  btnStart: document.getElementById('btn-start'),
  btnHow: document.getElementById('btn-howto'),
  btnNew: document.getElementById('btn-new'),
  btnReset: document.getElementById('btn-reset'),
  btnUndo: document.getElementById('btn-undo'),
  btnShuffle: document.getElementById('btn-shuffle'),
  btnNext: document.getElementById('btn-next'),
  btnReplay: document.getElementById('btn-replay'),
  confetti: document.getElementById('confetti'),
};

let cellSize = 0;
const pieceEls = new Map();

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = seed + 0x6d2b79f5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function levelSeed(level, variant) {
  // Determinista per nivell/variant perquè cada nivell tingui identitat pròpia
  return (level * 10007 + variant * 7919) >>> 0;
}

function targetRange(level) {
  const min = Math.min(32, Math.max(3, Math.round(4 + level * 0.08)));
  const max = Math.min(48, min + 8 + Math.floor(level / 60));
  return { min, max };
}

function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { highest: 1, best: {} };
  } catch {
    return { highest: 1, best: {} };
  }
}

function saveProgress(progress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

async function loadConfig() {
  const res = await fetch('levels.json');
  const data = await res.json();
  basePieces = data.basePieces;
  goal = data.goal;
  levelCount = data.levelCount || 1000;
}

function clonePieces(pieces) {
  return pieces.map(p => ({ ...p }));
}

function buildOccupancy(pieces, ignoreId) {
  const grid = Array.from({ length: BOARD_ROWS }, () => Array(BOARD_COLS).fill(null));
  for (const p of pieces) {
    if (p.id === ignoreId) continue;
    for (let r = 0; r < p.height; r++) {
      for (let c = 0; c < p.width; c++) {
        grid[p.row + r][p.col + c] = p.id;
      }
    }
  }
  return grid;
}

function maxSteps(piece, dir, pieces) {
  const grid = buildOccupancy(pieces, piece.id);
  let steps = 0;
  if (dir === 'left') {
    let col = piece.col - 1;
    while (col >= 0) {
      let clear = true;
      for (let r = piece.row; r < piece.row + piece.height; r++) {
        if (grid[r][col]) {
          clear = false;
          break;
        }
      }
      if (!clear) break;
      steps++;
      col--;
    }
  } else if (dir === 'right') {
    let col = piece.col + piece.width;
    while (col < BOARD_COLS) {
      let clear = true;
      for (let r = piece.row; r < piece.row + piece.height; r++) {
        if (grid[r][col]) {
          clear = false;
          break;
        }
      }
      if (!clear) break;
      steps++;
      col++;
    }
  } else if (dir === 'up') {
    let row = piece.row - 1;
    while (row >= 0) {
      let clear = true;
      for (let c = piece.col; c < piece.col + piece.width; c++) {
        if (grid[row][c]) {
          clear = false;
          break;
        }
      }
      if (!clear) break;
      steps++;
      row--;
    }
  } else if (dir === 'down') {
    let row = piece.row + piece.height;
    while (row < BOARD_ROWS) {
      let clear = true;
      for (let c = piece.col; c < piece.col + piece.width; c++) {
        if (grid[row][c]) {
          clear = false;
          break;
        }
      }
      if (!clear) break;
      steps++;
      row++;
    }
  }
  return steps;
}

function applySlide(piece, dir, steps) {
  if (dir === 'left') piece.col -= steps;
  if (dir === 'right') piece.col += steps;
  if (dir === 'up') piece.row -= steps;
  if (dir === 'down') piece.row += steps;
}

function generator(level, seed) {
  const range = targetRange(level);
  const maxAttempts = 120;
  let best = null;
  let bestGap = Infinity;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const rng = mulberry32((seed >>> 0) + attempt * 13);
    const pieces = buildLayout(rng, level);
    let distance = minSolutionMoves(pieces);
    if (distance === null) continue;
    const gap = distance < range.min ? range.min - distance : distance > range.max ? distance - range.max : 0;
    if (gap === 0) return { pieces, distance };
    if (gap < bestGap) {
      bestGap = gap;
      best = { pieces, distance };
    }
  }
  if (best) return best;
  return { pieces: buildLayout(mulberry32((seed >>> 0) ^ 0x9e3779b9), level), distance: null };
}

function buildLayout(rng, level) {
  const pieces = clonePieces(basePieces);
  const mix = Math.min(300, 50 + Math.floor(level * 2.2));
  for (let i = 0; i < mix; i++) randomMove(rng, pieces);
  const red = pieces.find(p => p.id === 'R');
  if (red && red.row === goal.row && red.col === goal.col) {
    const opts = ['left', 'up', 'right', 'down'];
    for (const d of opts) {
      const possible = maxSteps(red, d, pieces);
      if (possible > 0) {
        applySlide(red, d, 1);
        break;
      }
    }
  }
  return pieces;
}

function randomMove(rng, pieces) {
  const piece = pieces[Math.floor(rng() * pieces.length)];
  const dirs = [];
  const horiz = piece.width > piece.height && piece.height === 1;
  const vert = piece.height > piece.width && piece.width === 1;
  if (horiz || piece.width === piece.height) dirs.push('left', 'right');
  if (vert || piece.width === piece.height) dirs.push('up', 'down');
  if (dirs.length === 0) return;
  const dir = dirs[Math.floor(rng() * dirs.length)];
  const possible = maxSteps(piece, dir, pieces);
  if (possible === 0) return;
  const steps = 1 + Math.floor(rng() * possible);
  applySlide(piece, dir, steps);
}

function serialize(pieces) {
  return pieces
    .map(p => `${p.id}:${p.row},${p.col}`)
    .sort()
    .join('|');
}

function minSolutionMoves(pieces) {
  const startKey = serialize(pieces);
  const queue = [{ pieces: clonePieces(pieces), dist: 0 }];
  const seen = new Set([startKey]);
  const maxStates = 200000;
  let idx = 0;
  while (idx < queue.length && idx < maxStates) {
    const { pieces: current, dist } = queue[idx++];
    const red = current.find(p => p.id === 'R');
    if (red && red.row === goal.row && red.col === goal.col) return dist;
    for (const move of generateMoves(current)) {
      const key = serialize(move);
      if (seen.has(key)) continue;
      seen.add(key);
      queue.push({ pieces: move, dist: dist + 1 });
    }
  }
  return null;
}

function generateMoves(pieces) {
  const result = [];
  for (const piece of pieces) {
    const dirs = ['left', 'right', 'up', 'down'];
    for (const dir of dirs) {
      const steps = maxSteps(piece, dir, pieces);
      for (let s = 1; s <= steps; s++) {
        const copy = clonePieces(pieces);
        const target = copy.find(p => p.id === piece.id);
        applySlide(target, dir, s);
        result.push(copy);
      }
    }
  }
  return result;
}

function renderPieces() {
  pieceEls.clear();
  ui.board.innerHTML = '';
  updateCellSize();
  for (const p of state.pieces) {
    const el = document.createElement('div');
    el.className = `piece ${p.type}`;
    el.dataset.id = p.id;
    if (p.type === 'red') {
      const arrow = document.createElement('div');
      arrow.className = 'arrow';
      el.appendChild(arrow);
    }
    attachDragHandlers(el, p.id);
    ui.board.appendChild(el);
    pieceEls.set(p.id, el);
    placeElement(el, p);
  }
}

function updateCellSize() {
  const rect = ui.board.getBoundingClientRect();
  cellSize = rect.width / BOARD_COLS;
}

function placeElement(el, piece) {
  el.style.width = `${piece.width * cellSize}px`;
  el.style.height = `${piece.height * cellSize}px`;
  const x = piece.col * cellSize;
  const y = piece.row * cellSize;
  el.style.transform = `translate(${x}px, ${y}px)`;
}

function axisForPiece(piece) {
  if (piece.width > piece.height && piece.height === 1) return 'x';
  if (piece.height > piece.width && piece.width === 1) return 'y';
  return 'both';
}

function attachDragHandlers(el, id) {
  el.addEventListener('pointerdown', (ev) => startDrag(ev, id));
}

function startDrag(ev, id) {
  const piece = state.pieces.find(p => p.id === id);
  if (!piece) return;
  updateCellSize();
  state.dragging = {
    id,
    startX: ev.clientX,
    startY: ev.clientY,
    origRow: piece.row,
    origCol: piece.col,
    lastRow: piece.row,
    lastCol: piece.col,
  };
  pieceEls.get(id)?.classList.add('dragging');
  window.addEventListener('pointermove', onDrag);
  window.addEventListener('pointerup', endDrag, { once: true });
}

function onDrag(ev) {
  const drag = state.dragging;
  if (!drag) return;
  const piece = state.pieces.find(p => p.id === drag.id);
  if (!piece) return;
  // Calcular sempre a partir de la posició inicial per evitar acumulació d'errors
  piece.row = drag.origRow;
  piece.col = drag.origCol;
  const dx = ev.clientX - drag.startX;
  const dy = ev.clientY - drag.startY;
  const stepsX = Math.round(dx / cellSize);
  const stepsY = Math.round(dy / cellSize);
  const axis = axisForPiece(piece);
  let targetRow = drag.origRow;
  let targetCol = drag.origCol;
  if (axis === 'x' || (axis === 'both' && Math.abs(stepsX) >= Math.abs(stepsY))) {
    targetCol = clampMove(piece, 'x', drag.origCol + stepsX);
  } else {
    targetRow = clampMove(piece, 'y', drag.origRow + stepsY);
  }
  drag.lastRow = targetRow;
  drag.lastCol = targetCol;
  piece.row = targetRow;
  piece.col = targetCol;
  placeElement(pieceEls.get(piece.id), piece);
}

function clampMove(piece, axis, target) {
  if (axis === 'x') {
    const dir = Math.sign(target - piece.col);
    if (dir === 0) return piece.col;
    const steps = maxSteps(piece, dir === 1 ? 'right' : 'left', state.pieces);
    return piece.col + Math.max(-steps, Math.min(steps, target - piece.col));
  } else {
    const dir = Math.sign(target - piece.row);
    if (dir === 0) return piece.row;
    const steps = maxSteps(piece, dir === 1 ? 'down' : 'up', state.pieces);
    return piece.row + Math.max(-steps, Math.min(steps, target - piece.row));
  }
}

function endDrag() {
  const drag = state.dragging;
  if (!drag) return;
  const piece = state.pieces.find(p => p.id === drag.id);
  pieceEls.get(piece.id)?.classList.remove('dragging');
  window.removeEventListener('pointermove', onDrag);
  state.dragging = null;
  if (drag.origRow === piece.row && drag.origCol === piece.col) return;
  commitMove(piece, drag.origRow, drag.origCol);
}

function commitMove(piece, prevRow, prevCol) {
  state.history.push({ id: piece.id, row: prevRow, col: prevCol });
  state.moves += 1;
  ui.moves.textContent = state.moves;
  if (!state.startTime) startTimer();
  if (isComplete()) {
    finishLevel();
  }
}

function isComplete() {
  const red = state.pieces.find(p => p.id === 'R');
  return red && red.row === goal.row && red.col === goal.col;
}

function resetLevel(nextLevel = null, seedOverride = null, newVariant = false) {
  if (nextLevel) {
    state.level = Math.min(nextLevel, levelCount);
    state.variant = 1;
  }
  if (newVariant) state.variant += 1;
  state.seed = seedOverride ?? levelSeed(state.level, state.variant);
  const generated = generator(state.level, state.seed);
  state.pieces = generated.pieces;
  state.initialPieces = clonePieces(state.pieces);
  state.minDistance = generated.distance;
  state.history = [];
  state.moves = 0;
  state.startTime = null;
  state.elapsed = 0;
  stopTimer();
  renderPieces();
  updateUI();
}

function startTimer() {
  state.startTime = performance.now() - state.elapsed;
  state.timerId = setInterval(updateTimer, 200);
}

function stopTimer() {
  if (state.timerId) clearInterval(state.timerId);
  state.timerId = null;
}

function updateTimer() {
  if (!state.startTime) return;
  state.elapsed = performance.now() - state.startTime;
  ui.timer.textContent = formatTime(state.elapsed);
}

function formatTime(ms) {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60).toString().padStart(2, '0');
  const s = (total % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function undo() {
  const last = state.history.pop();
  if (!last) return;
  const piece = state.pieces.find(p => p.id === last.id);
  piece.row = last.row;
  piece.col = last.col;
  state.moves = Math.max(0, state.moves - 1);
  placeElement(pieceEls.get(piece.id), piece);
  ui.moves.textContent = state.moves;
}

function replayLevel() {
  const generated = generator(state.level, state.seed);
  state.pieces = generated.pieces;
  state.initialPieces = clonePieces(state.pieces);
  state.minDistance = generated.distance;
  state.history = [];
  state.moves = 0;
  state.startTime = null;
  state.elapsed = 0;
  stopTimer();
  renderPieces();
  updateUI();
}

function updateUI() {
  const progress = loadProgress();
  ui.level.textContent = `${state.level} / ${levelCount}`;
  ui.variant.textContent = `${state.variant}`;
  ui.moves.textContent = state.moves;
  ui.timer.textContent = formatTime(state.elapsed);
  const bestMs = progress.best[state.level];
  ui.best.textContent = bestMs ? formatTime(bestMs) : '--';
}

function finishLevel() {
  stopTimer();
  showWin();
  fireConfetti();
  playWinSound();
  saveBest();
}

function saveBest() {
  const progress = loadProgress();
  const time = state.elapsed;
  const prev = progress.best[state.level];
  if (!prev || time < prev) {
    progress.best[state.level] = time;
  }
  progress.highest = Math.max(progress.highest || 1, state.level + 1);
  saveProgress(progress);
}

function showWin() {
  ui.winTitle.textContent = `Nivell ${state.level} superat!`;
  ui.winTime.textContent = `Temps: ${formatTime(state.elapsed)}`;
  ui.winMoves.textContent = `Moviments: ${state.moves}`;
  ui.modalWin.classList.add('active');
}

function hideWin() {
  ui.modalWin.classList.remove('active');
}

function showHowto() {
  ui.modalHow.classList.add('active');
}

function hideHowto() {
  ui.modalHow.classList.remove('active');
}

function fireConfetti() {
  ui.confetti.innerHTML = '';
  const colors = ['#ff6b6b', '#feca57', '#54e0c7', '#7dd3fc', '#c084fc'];
  const total = 70;
  for (let i = 0; i < total; i++) {
    const el = document.createElement('div');
    el.className = 'confetto';
    const left = Math.random() * 100;
    const delay = Math.random() * 0.2;
    const duration = 1.2 + Math.random() * 0.5;
    el.style.left = `${left}vw`;
    el.style.background = colors[i % colors.length];
    el.style.animation = `confetti ${duration}s ease-out ${delay}s forwards`;
    ui.confetti.appendChild(el);
  }
}

function bindUI() {
  ui.btnHow.addEventListener('click', showHowto);
  ui.btnStart.addEventListener('click', hideHowto);
  ui.modalHow.addEventListener('click', (e) => {
    if (e.target === ui.modalHow) hideHowto();
  });

  ui.btnNew.addEventListener('click', () => {
    const progress = loadProgress();
    const target = Math.min(progress.highest || 1, levelCount);
    state.variant = 1;
    resetLevel(target);
  });

  ui.btnReset.addEventListener('click', replayLevel);
  ui.btnUndo.addEventListener('click', undo);
  ui.btnShuffle.addEventListener('click', () => {
    resetLevel(state.level, null, true);
  });
  ui.btnNext.addEventListener('click', () => {
    hideWin();
    const next = Math.min(state.level + 1, levelCount);
    state.variant = 1;
    resetLevel(next);
  });
  ui.btnReplay.addEventListener('click', () => {
    hideWin();
    replayLevel();
  });
  ui.modalWin.addEventListener('click', (e) => {
    if (e.target === ui.modalWin) hideWin();
  });

  window.addEventListener('resize', () => {
    updateCellSize();
    for (const p of state.pieces) {
      placeElement(pieceEls.get(p.id), p);
    }
  });
}

async function init() {
  await loadConfig();
  bindUI();
  const progress = loadProgress();
  state.level = Math.min(progress.highest || 1, levelCount);
  state.seed = levelSeed(state.level, state.variant);
  resetLevel(state.level);
  showHowto();
}

function playWinSound() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(740, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(520, ctx.currentTime + 0.25);
  gain.gain.setValueAtTime(0.18, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.4);
}

init().catch(err => {
  console.error('Error carregant el joc', err);
});
