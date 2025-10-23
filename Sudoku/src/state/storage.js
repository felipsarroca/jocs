const STORAGE_KEY = 'sudoku-acolorit-state-v1';
const VERSION = 1;

export function saveGameState(state) {
  if (typeof window === 'undefined') return;
  try {
    const payload = {
      version: VERSION,
      timestamp: Date.now(),
      difficulty: state.difficulty,
      pencilMode: state.pencilMode,
      feedbackMode: state.feedbackMode,
      selected: state.selected,
      puzzle: cloneMatrix(state.puzzle),
      solution: cloneMatrix(state.solution),
      user: cloneMatrix(state.user),
      notes: serializeNotes(state.notes),
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn('No s’ha pogut desar la partida de Sudoku:', error);
  }
}

export function loadGameState() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== VERSION) return null;
    return {
      difficulty: parsed.difficulty ?? 'easy',
      pencilMode: Boolean(parsed.pencilMode),
      feedbackMode: parsed.feedbackMode ?? 'immediate',
      selected: sanitizeSelection(parsed.selected),
      puzzle: parsed.puzzle ? cloneMatrix(parsed.puzzle) : null,
      solution: parsed.solution ? cloneMatrix(parsed.solution) : null,
      user: parsed.user ? cloneMatrix(parsed.user) : null,
      notes: parsed.notes ? deserializeNotes(parsed.notes) : null,
    };
  } catch (error) {
    console.warn('No s’ha pogut carregar la partida guardada:', error);
    return null;
  }
}

export function clearGameState() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('No s’ha pogut eliminar la partida guardada:', error);
  }
}

function cloneMatrix(matrix) {
  if (!Array.isArray(matrix)) return null;
  return matrix.map((row) => (Array.isArray(row) ? row.slice() : []));
}

function serializeNotes(notesGrid) {
  if (!Array.isArray(notesGrid)) return null;
  return notesGrid.map((row) =>
    row.map((cell) => {
      if (!cell) return [];
      if (cell instanceof Set) return Array.from(cell);
      if (Array.isArray(cell)) return cell.slice();
      return [];
    }),
  );
}

function deserializeNotes(serialized) {
  if (!Array.isArray(serialized)) return null;
  return serialized.map((row) =>
    row.map((values) => new Set(Array.isArray(values) ? values : [])),
  );
}

function sanitizeSelection(selection) {
  if (!selection) return null;
  const { row, col } = selection;
  if (
    Number.isInteger(row) &&
    Number.isInteger(col) &&
    row >= 0 &&
    row < 9 &&
    col >= 0 &&
    col < 9
  ) {
    return { row, col };
  }
  return null;
}
