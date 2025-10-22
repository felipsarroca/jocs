const SIZE = 9;
const BOX = 3;

export function createEmptyGrid() {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
}

export function cloneGrid(grid) {
  return grid.map((row) => row.slice());
}

export function isValidPlacement(grid, row, col, value) {
  for (let i = 0; i < SIZE; i++) {
    if (grid[row][i] === value && i !== col) return false;
    if (grid[i][col] === value && i !== row) return false;
  }

  const boxRow = Math.floor(row / BOX) * BOX;
  const boxCol = Math.floor(col / BOX) * BOX;

  for (let r = 0; r < BOX; r++) {
    for (let c = 0; c < BOX; c++) {
      const currentRow = boxRow + r;
      const currentCol = boxCol + c;
      if (
        grid[currentRow][currentCol] === value &&
        (currentRow !== row || currentCol !== col)
      ) {
        return false;
      }
    }
  }

  return true;
}

export function countSolutions(grid, limit = 2) {
  const board = cloneGrid(grid);
  let solutions = 0;

  function search() {
    let row = -1;
    let col = -1;
    outer: for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (board[r][c] === 0) {
          row = r;
          col = c;
          break outer;
        }
      }
    }

    if (row === -1) {
      solutions += 1;
      return;
    }

    for (let value = 1; value <= SIZE; value++) {
      if (isValidPlacement(board, row, col, value)) {
        board[row][col] = value;
        search();
        if (solutions >= limit) return;
        board[row][col] = 0;
      }
    }
  }

  search();
  return solutions;
}

export function solveGrid(grid) {
  const board = cloneGrid(grid);

  function solveCell(row = 0, col = 0) {
    if (col === SIZE) {
      col = 0;
      row += 1;
    }
    if (row === SIZE) return true;

    if (board[row][col] !== 0) {
      return solveCell(row, col + 1);
    }

    const digits = shuffleDigits();
    for (const value of digits) {
      if (isValidPlacement(board, row, col, value)) {
        board[row][col] = value;
        if (solveCell(row, col + 1)) return true;
        board[row][col] = 0;
      }
    }
    return false;
  }

  solveCell();
  return board;
}

export function findConflicts(grid) {
  const conflicts = createEmptyGrid().map((row) => row.map(() => false));

  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      const value = grid[row][col];
      if (value === 0) continue;
      if (!isValidPlacement(grid, row, col, value)) {
        conflicts[row][col] = true;
      }
    }
  }

  return conflicts;
}

function shuffleDigits() {
  const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  for (let i = digits.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [digits[i], digits[j]] = [digits[j], digits[i]];
  }
  return digits;
}
