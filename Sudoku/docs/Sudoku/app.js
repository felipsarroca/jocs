import { generatePuzzle } from './generator.js';
import { cloneGrid, createEmptyGrid, findConflicts } from './solver.js';
import { BoardView } from './ui/board.js';
import { createKeypad } from './ui/keypad.js';
import { createHud } from './ui/hud.js';
import {
  loadGameState,
  saveGameState,
  clearGameState,
} from './state/storage.js';
import { createHistoryManager } from './state/undo.js';

const boardElement = document.getElementById('sudoku-board');
const messageElement = document.getElementById('message');
const difficultySelect = document.getElementById('difficulty');
const newGameBtn = document.getElementById('new-game-btn');
const checkBtn = document.getElementById('check-btn');
const toggleNotesBtn = document.getElementById('toggle-notes-btn');
const clearCellBtn = document.getElementById('clear-cell-btn');
const undoBtn = document.getElementById('undo-btn');
const redoBtn = document.getElementById('redo-btn');
const feedbackSelect = document.getElementById('feedback-mode');
const keypadElement = document.getElementById('keypad');

const hud = createHud(messageElement, toggleNotesBtn);
const boardView = new BoardView(boardElement, {
  onCellSelect: (row, col) => {
    state.selected = { row, col };
    persistState();
    updateHistoryButtons();
  },
});
const keypad = createKeypad(keypadElement, {
  onDigit: handleDigitInput,
  onClear: clearSelectedCell,
});
const history = createHistoryManager();
let isRestoring = false;

const state = {
  puzzle: createEmptyGrid(),
  solution: createEmptyGrid(),
  user: createEmptyGrid(),
  notes: createNotesGrid(),
  selected: null,
  pencilMode: false,
  difficulty: difficultySelect?.value ?? 'easy',
  feedbackMode: feedbackSelect?.value ?? 'immediate',
};

function init() {
  bindEvents();
  const restored = loadGameState();
  if (tryRestoreState(restored)) {
    return;
  }
  startNewGame();
}

function bindEvents() {
  newGameBtn?.addEventListener('click', () => startNewGame(true));
  checkBtn?.addEventListener('click', checkSolution);
  toggleNotesBtn?.addEventListener('click', toggleNotesMode);
  clearCellBtn?.addEventListener('click', clearSelectedCell);
  undoBtn?.addEventListener('click', undoMove);
  redoBtn?.addEventListener('click', redoMove);
  feedbackSelect?.addEventListener('change', (event) => {
    state.feedbackMode = event.target.value;
    hud.setMessage(
      state.feedbackMode === 'immediate'
        ? 'Feedback immediat activat: les repeticions es marquen al moment.'
        : 'Mode clàssic: els errors només es mostren en prémer Comprova.',
      'info',
    );
    updateConflicts();
    persistState();
  });

  difficultySelect?.addEventListener('change', (event) => {
    const value = event.target.value;
    state.difficulty = value;
    startNewGame(true);
  });

  document.addEventListener('keydown', handleGlobalKey);
}

function startNewGame(userRequest = false) {
  history.clear();
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
  updateConflicts();

  const tone = userRequest ? 'success' : 'info';
  const message = userRequest
    ? `Nou Sudoku ${describeDifficulty(state.difficulty)} carregat.`, 
    : `Sudoku ${describeDifficulty(state.difficulty)} a punt. Bona sort!`;
  hud.setMessage(message, tone);
  persistState();
  updateHistoryButtons();
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
  const previousValue = state.user[row][col];
  if (previousValue === value) return;
  recordHistory();
  state.user[row][col] = value;
  state.notes[row][col].clear();
  boardView.updateValue(row, col, value);
  boardView.updateNotes(row, col, state.notes[row][col]);
  updateConflicts();
  persistState();
  updateHistoryButtons();
}

function toggleNote(row, col, digit) {
  const notes = state.notes[row][col];
  const hadDigit = notes.has(digit);
  recordHistory();
  if (state.user[row][col] !== 0) {
    state.user[row][col] = 0;
    boardView.updateValue(row, col, 0);
  }
  if (hadDigit) {
    notes.delete(digit);
  } else {
    notes.add(digit);
  }
  boardView.updateNotes(row, col, notes);
  updateConflicts();
  persistState();
  updateHistoryButtons();
}

function clearSelectedCell() {
  if (!state.selected) return;
  const { row, col } = state.selected;
  if (state.puzzle[row][col] !== 0) return;
  if (state.user[row][col] === 0 && state.notes[row][col].size === 0) return;
  recordHistory();
  state.user[row][col] = 0;
  state.notes[row][col].clear();
  boardView.updateValue(row, col, 0);
  boardView.updateNotes(row, col, state.notes[row][col]);
  hud.setMessage('Casella neta. Pots continuar!', 'info');
  updateConflicts();
  persistState();
  updateHistoryButtons();
}

function toggleNotesMode() {
  recordHistory();
  state.pencilMode = !state.pencilMode;
  hud.setNotesActive(state.pencilMode);
  const message = state.pencilMode
    ? 'Mode notes activat: els números es guarden com a candidates.'
    : 'Mode notes desactivat: introdueixes valors definitius.';
  hud.setMessage(message, 'info');
  persistState();
  updateHistoryButtons();
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
      clearGameState();
    } else {
      hud.setMessage('Revisa les caselles en vermell i corregeix-les.', 'error');
      persistState();
    }
    updateConflicts();
    updateHistoryButtons();
  }

function handleGlobalKey(event) {
  if (event.target.closest('input, select, textarea')) return;

  const { key } = event;

  if ((event.ctrlKey || event.metaKey) && key.toLowerCase() === 'z') {
    if (event.shiftKey) {
      redoMove();
    } else {
      undoMove();
    }
    event.preventDefault();
    return;
  }

  if ((event.ctrlKey || event.metaKey) && key.toLowerCase() === 'y') {
    redoMove();
    event.preventDefault();
    return;
  }

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
  persistState();
  updateHistoryButtons();
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

function tryRestoreState(restored) {
  if (
    !restored ||
    !restored.puzzle ||
    !restored.solution ||
    !restored.user ||
    !restored.notes
  ) {
    return false;
  }

  state.difficulty = restored.difficulty ?? state.difficulty;
  if (difficultySelect) {
    difficultySelect.value = state.difficulty;
  }

  state.puzzle = restored.puzzle;
  state.solution = restored.solution;
  state.user = restored.user;
  state.notes = restored.notes;
  state.selected = restored.selected;
  state.pencilMode = restored.pencilMode;
  state.feedbackMode = restored.feedbackMode ?? state.feedbackMode;

  if (feedbackSelect) {
    feedbackSelect.value = state.feedbackMode;
  }

  boardView.render({
    puzzle: state.puzzle,
    user: state.user,
    notes: state.notes,
  });
  boardView.clearFeedback();
  hud.setNotesActive(state.pencilMode);
  updateConflicts();

  if (state.selected) {
    const { row, col } = state.selected;
    if (state.puzzle[row][col] === 0) {
      boardView.selectCell(row, col);
    } else {
      state.selected = null;
      boardView.clearSelection();
    }
  } else {
    boardView.clearSelection();
  }

  hud.setMessage('Partida recuperada. Continua la partida on la vas deixar!', 'success');
  history.clear();
  updateHistoryButtons();
  return true;
}

function persistState() {
  saveGameState({
    difficulty: state.difficulty,
    pencilMode: state.pencilMode,
    feedbackMode: state.feedbackMode,
    selected: state.selected,
    puzzle: state.puzzle,
    solution: state.solution,
    user: state.user,
    notes: state.notes,
  });
}

function recordHistory() {
  if (isRestoring) return;
  history.record(buildSnapshot());
}

function buildSnapshot() {
  return {
    user: cloneGrid(state.user),
    notes: state.notes.map((row) => row.map((set) => Array.from(set))),
    selected: state.selected ? { ...state.selected } : null,
    pencilMode: state.pencilMode,
  };
}

function applySnapshot(snapshot) {
  if (!snapshot) return;
  isRestoring = true;
  state.user = cloneGrid(snapshot.user);
  state.notes = snapshot.notes.map((row) =>
    row.map((values) => new Set(values)),
  );
  state.selected = snapshot.selected;
  state.pencilMode = snapshot.pencilMode;
  hud.setNotesActive(state.pencilMode);

  boardView.render({
    puzzle: state.puzzle,
    user: state.user,
    notes: state.notes,
  });
  boardView.clearFeedback();
  updateConflicts();

  if (state.selected && state.puzzle[state.selected.row][state.selected.col] === 0) {
    boardView.selectCell(state.selected.row, state.selected.col);
  } else {
    state.selected = null;
    boardView.clearSelection();
  }

  isRestoring = false;
  persistState();
  updateHistoryButtons();
}

function undoMove() {
  if (!history.canUndo()) return;
  const snapshot = history.undo(buildSnapshot());
  applySnapshot(snapshot);
}

function redoMove() {
  if (!history.canRedo()) return;
  const snapshot = history.redo(buildSnapshot());
  applySnapshot(snapshot);
}

function updateHistoryButtons() {
  if (undoBtn) {
    undoBtn.disabled = !history.canUndo();
  }
  if (redoBtn) {
    redoBtn.disabled = !history.canRedo();
  }
}

function updateConflicts() {
  if (state.feedbackMode !== 'immediate') {
    boardView.clearConflicts();
    return;
  }

  const conflicts = findConflicts(state.user);
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (state.puzzle[row][col] !== 0 || state.user[row][col] === 0) {
        conflicts[row][col] = false;
      }
    }
  }
  boardView.highlightConflicts(conflicts);
}

init();
