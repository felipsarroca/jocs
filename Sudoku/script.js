let activeCell = null;
let solutionGrid = [];
let currentLevelId = null;
let configData = null;
const levelsById = new Map();

initApp();

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
  board.flat().forEach((value, index) => {
    const row = Math.floor(index / 9);
    const col = index % 9;
    const cell = document.createElement('div');
    const isEditable = value === 0;
    cell.className = isEditable ? 'cell editable' : 'cell fixed';
    cell.textContent = isEditable ? '' : value;
    cell.dataset.index = index;

    if (col === 2 || col === 5) {
      cell.classList.add('block-right');
    }
    if (row === 2 || row === 5) {
      cell.classList.add('block-bottom');
    }

    if (isEditable) {
      cell.addEventListener('click', () => setActiveCell(cell));
    }
    grid.appendChild(cell);
  });
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
  if (activeCell) activeCell.classList.remove('active');
  activeCell = cell;
  activeCell.classList.add('active');
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
  activeCell.textContent = digit === '0' ? '' : digit;
});
