let activeCell = null;
let solutionGrid = [];
let currentBoard = [];
let currentLevelId = null;
let configData = null;
const levelsById = new Map();
let cellElements = [];

initApp();
document.addEventListener('keydown', handleKeyDown);

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
      loadSudoku(config.levels[0]?.id);
    })
    .catch((error) => {
      console.error('No s’ha pogut carregar la configuració.', error);
      const grid = document.getElementById('sudoku-grid');
      grid.textContent = 'Error carregant els fitxers de configuració.';
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
    button.addEventListener('click', () => loadSudoku(level.id));
    if (index === 0) button.classList.add('active');
    container.appendChild(button);
  });
}

function loadSudoku(levelId) {
  const grid = document.getElementById('sudoku-grid');
  const loadingText = configData?.messages?.loading ?? 'Carregant...';
  grid.textContent = loadingText;

  const level = levelsById.get(levelId);
  if (!level) {
    grid.textContent = 'Nivell no disponible.';
    return;
  }

  solutionGrid = stringToGrid(level.solution);
  const boardGrid = stringToGrid(level.puzzle);
  renderGrid(boardGrid);
  setActiveLevel(levelId);
  focusFirstEditableCell();
}

function renderGrid(board) {
  const grid = document.getElementById('sudoku-grid');
  grid.innerHTML = '';
  currentBoard = board.map((row) => row.slice());
  clearHighlights();
  activeCell = null;

  board.flat().forEach((value, index) => {
    const row = Math.floor(index / 9);
    const col = index % 9;
    const cell = document.createElement('div');
    const isEditable = value === 0;
    cell.className = isEditable ? 'cell editable' : 'cell fixed';
    cell.textContent = isEditable ? '' : value;
    cell.dataset.index = index;
    cell.dataset.row = row;
    cell.dataset.col = col;
    cell.dataset.fixed = String(!isEditable);

    if (col === 2 || col === 5) {
      cell.classList.add('block-right');
    }
    if (row === 2 || row === 5) {
      cell.classList.add('block-bottom');
    }

    cell.tabIndex = isEditable ? 0 : -1;
    cell.addEventListener('click', () => setActiveCell(cell));
    grid.appendChild(cell);
  });

  cellElements = Array.from(grid.querySelectorAll('.cell'));
}

function setActiveLevel(levelId) {
  currentLevelId = levelId;
  document.querySelectorAll('#level-selector .level-btn').forEach((button) => {
    if (button.dataset.level === levelId) {
      button.classList.add('active');
    } else {
      button.classList.remove('active');
    }
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

document.getElementById('mobile-keypad').addEventListener('click', (event) => {
  if (!activeCell || !event.target.matches('button')) return;
  const digit = event.target.dataset.num;
  if (!activeCell.classList.contains('editable')) return;
  setCellValue(Number.parseInt(digit, 10) || 0);
});

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
    if (activeCell.classList.contains('editable')) {
      setCellValue(Number(event.key));
    }
    event.preventDefault();
    return;
  }

  if (event.key === '0' || event.key === 'Backspace' || event.key === 'Delete') {
    if (activeCell.classList.contains('editable')) {
      setCellValue(0);
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

function moveSelection(deltaRow, deltaCol) {
  if (!activeCell) return;
  let row = Number(activeCell.dataset.row);
  let col = Number(activeCell.dataset.col);

  row = (row + deltaRow + 9) % 9;
  col = (col + deltaCol + 9) % 9;

  const nextCell = getCell(row, col);
  setActiveCell(nextCell);
}

function setCellValue(value) {
  if (!activeCell) return;
  const row = Number(activeCell.dataset.row);
  const col = Number(activeCell.dataset.col);
  currentBoard[row][col] = value;
  activeCell.textContent = value === 0 ? '' : String(value);
}

function getCell(row, col) {
  return cellElements[row * 9 + col] ?? null;
}

function clearHighlights() {
  cellElements.forEach((cell) => {
    cell.classList.remove('active', 'peer');
  });
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
