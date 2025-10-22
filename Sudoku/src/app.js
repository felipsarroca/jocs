import { generatePuzzle } from './generator.js';
import { cloneGrid, createEmptyGrid } from './solver.js';
import { BoardView } from './ui/board.js';
import { createKeypad } from './ui/keypad.js';
import { createHud } from './ui/hud.js';

const boardElement = document.getElementById('sudoku-board');
const messageElement = document.getElementById('message');
const difficultySelect = document.getElementById('difficulty');
const newGameBtn = document.getElementById('new-game-btn');
const checkBtn = document.getElementById('check-btn');
const toggleNotesBtn = document.getElementById('toggle-notes-btn');
const clearCellBtn = document.getElementById('clear-cell-btn');
const keypadElement = document.getElementById('keypad');

const hud = createHud(messageElement, toggleNotesBtn);
const boardView = new BoardView(boardElement, {
  onCellSelect: (row, col) => {
    state.selected = { row, col };
  },
});
const keypad = createKeypad(keypadElement, {
  onDigit: handleDigitInput,
  onClear: clearSelectedCell,
});

const state = {
  puzzle: createEmptyGrid(),
  solution: createEmptyGrid(),
  user: createEmptyGrid(),
  notes: createNotesGrid(),
  selected: null,
  pencilMode: false,
  difficulty: difficultySelect?.value ?? 'easy',
};

function init() {
  bindEvents();
  startNewGame();
}

function bindEvents() {
  newGameBtn?.addEventListener('click', () => startNewGame(true));
  checkBtn?.addEventListener('click', checkSolution);
  toggleNotesBtn?.addEventListener('click', toggleNotesMode);
  clearCellBtn?.addEventListener('click', clearSelectedCell);

  difficultySelect?.addEventListener('change', (event) => {
    const value = event.target.value;
    state.difficulty = value;
    startNewGame(true);
  });

  document.addEventListener('keydown', handleGlobalKey);
}

function startNewGame(userRequest = false) {
  const { puzzle, solution } = generatePuzzle(state.difficulty);
  state.puzzle = puzzle;
  state.solution = solution;
  state.user = cloneGrid(puzzle);
  state.notes = createNotesGrid();
  state.selected = null;
  state.pencilMode = false;

  boardView.render({
    puzzle: state.puzzle,
    user: state.user,
    notes: state.notes,
  });
  boardView.clearSelection();
  boardView.clearFeedback();
  hud.setNotesActive(state.pencilMode);

  const tone = userRequest ? 'success' : 'info';
  const message = userRequest
    ? `Nou Sudoku ${describeDifficulty(state.difficulty)} carregat.`, 
    : `Sudoku ${describeDifficulty(state.difficulty)} a punt. Bona sort!`;
  hud.setMessage(message, tone);
}

function handleDigitInput(digit) {
  if (!state.selected) {
    hud.setMessage('Selecciona una casella buida per escriure.', 'warning');
    return;
  }

  const { row, col } = state.selected;
  const isGiven = state.puzzle[row][col] !== 0;
  if (isGiven) return;

  if (state.pencilMode) {
    toggleNote(row, col, digit);
  } else {
    placeDigit(row, col, digit);
  }
}

function placeDigit(row, col, value) {
  state.user[row][col] = value;
  state.notes[row][col].clear();
  boardView.updateValue(row, col, value);
  boardView.updateNotes(row, col, state.notes[row][col]);
}

function toggleNote(row, col, digit) {
  const notes = state.notes[row][col];
  if (state.user[row][col] !== 0) {
    state.user[row][col] = 0;
    boardView.updateValue(row, col, 0);
  }
  if (notes.has(digit)) {
    notes.delete(digit);
  } else {
    notes.add(digit);
  }
  boardView.updateNotes(row, col, notes);
}

function clearSelectedCell() {
  if (!state.selected) return;
  const { row, col } = state.selected;
  if (state.puzzle[row][col] !== 0) return;
  state.user[row][col] = 0;
  state.notes[row][col].clear();
  boardView.updateValue(row, col, 0);
  boardView.updateNotes(row, col, state.notes[row][col]);
  hud.setMessage('Casella neta. Pots continuar!', 'info');
}

function toggleNotesMode() {
  state.pencilMode = !state.pencilMode;
  hud.setNotesActive(state.pencilMode);
  const message = state.pencilMode
    ? 'Mode notes activat: els números es guarden com a candidates.'
    : 'Mode notes desactivat: introdueixes valors definitius.';
  hud.setMessage(message, 'info');
}

function checkSolution() {
  boardView.clearFeedback();
  let allFilled = true;
  let allCorrect = true;

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (state.puzzle[row][col] !== 0) continue;
      const value = state.user[row][col];
      if (value === 0) {
        allFilled = false;
        continue;
      }
      if (value === state.solution[row][col]) {
        boardView.markCorrect(row, col);
      } else {
        allCorrect = false;
        boardView.markError(row, col);
      }
    }
  }

  if (!allFilled) {
    hud.setMessage('Encara queden caselles per omplir.', 'warning');
    return;
  }

  if (allCorrect) {
    hud.setMessage('Bravíssim! Has resolt el Sudoku.', 'success');
  } else {
    hud.setMessage('Revisa les caselles en vermell i corregeix-les.', 'error');
  }
}

function handleGlobalKey(event) {
  if (event.target.closest('input, select, textarea')) return;

  const { key } = event;

  if (key >= '1' && key <= '9') {
    const digit = Number(key);
    handleDigitInput(digit);
    event.preventDefault();
    return;
  }

  if (key === 'Backspace' || key === 'Delete') {
    clearSelectedCell();
    event.preventDefault();
    return;
  }

  if (!state.selected) return;

  const moves = {
    ArrowUp: [-1, 0],
    ArrowDown: [1, 0],
    ArrowLeft: [0, -1],
    ArrowRight: [0, 1],
  };

  if (key in moves) {
    const [dRow, dCol] = moves[key];
    moveSelection(dRow, dCol);
    event.preventDefault();
  }
}

function moveSelection(deltaRow, deltaCol) {
  if (!state.selected) return;
  let { row, col } = state.selected;

  let attempts = 0;
  do {
    row = (row + deltaRow + 9) % 9;
    col = (col + deltaCol + 9) % 9;
    attempts += 1;
    if (attempts > 81) return;
  } while (state.puzzle[row][col] !== 0);

  state.selected = { row, col };
  boardView.selectCell(row, col);
}

function describeDifficulty(value) {
  if (value === 'easy') return 'fàcil';
  if (value === 'medium') return 'mitjà';
  if (value === 'hard') return 'difícil';
  return value;
}

function createNotesGrid() {
  return Array.from({ length: 9 }, () =>
    Array.from({ length: 9 }, () => new Set()),
  );
}

init();
