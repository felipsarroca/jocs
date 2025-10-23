const DEFAULT_LIMIT = 120;

export function createHistoryManager(limit = DEFAULT_LIMIT) {
  const undoStack = [];
  const redoStack = [];

  return {
    record(snapshot) {
      if (!snapshot) return;
      undoStack.push(snapshot);
      if (undoStack.length > limit) {
        undoStack.shift();
      }
      redoStack.length = 0;
    },
    undo(currentSnapshot) {
      if (!undoStack.length) return null;
      if (currentSnapshot) {
        redoStack.push(currentSnapshot);
      }
      return undoStack.pop() ?? null;
    },
    redo(currentSnapshot) {
      if (!redoStack.length) return null;
      if (currentSnapshot) {
        undoStack.push(currentSnapshot);
      }
      return redoStack.pop() ?? null;
    },
    canUndo() {
      return undoStack.length > 0;
    },
    canRedo() {
      return redoStack.length > 0;
    },
    clear() {
      undoStack.length = 0;
      redoStack.length = 0;
    },
  };
}
