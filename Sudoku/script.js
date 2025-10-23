let solution = [];
let activeCell = null;

fetch('config.json')
  .then(r => r.json())
  .then(config => {
    document.getElementById('app-title').textContent = config.title;
    renderLevelSelector(config.levels);
    loadSudoku(config.levels[0].id);
  });

function renderLevelSelector(levels) {
  const container = document.getElementById('level-selector');
  container.innerHTML = '';
  levels.forEach(level => {
    const btn = document.createElement('button');
    btn.textContent = level.label;
    btn.addEventListener('click', () => loadSudoku(level.id));
    container.appendChild(btn);
  });
}

async function loadSudoku(difficulty) {
  const grid = document.getElementById('sudoku-grid');
  grid.innerHTML = 'Carregant...';
  const res = await fetch(`https://you-do-sudoku-api.vercel.app/api?difficulty=${difficulty}`);
  const data = await res.json();
  solution = data.solution;
  renderGrid(data.board);
}

function renderGrid(board) {
  const grid = document.getElementById('sudoku-grid');
  grid.innerHTML = '';
  board.flat().forEach((num, index) => {
    const cell = document.createElement('div');
    cell.className = num === 0 ? 'cell editable' : 'cell fixed';
    cell.textContent = num === 0 ? '' : num;
    cell.dataset.index = index;
    if (num === 0) {
      cell.addEventListener('click', () => setActiveCell(cell));
    }
    grid.appendChild(cell);
  });
}

function setActiveCell(cell) {
  if (activeCell) activeCell.classList.remove('active');
  activeCell = cell;
  activeCell.classList.add('active');
}

document.getElementById('mobile-keypad').addEventListener('click', e => {
  if (!activeCell || !e.target.matches('button')) return;
  const num = e.target.dataset.num;
  activeCell.textContent = num === '0' ? '' : num;
});
