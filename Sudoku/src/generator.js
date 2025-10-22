import { cloneGrid, createEmptyGrid, countSolutions, solveGrid } from './solver.js';

const SIZE = 9;
const BOX = 3;

const difficultySettings = {
  easy: { clues: 40 },
  medium: { clues: 32 },
  hard: { clues: 26 },
};

export function generatePuzzle(difficulty = 'easy') {
  const settings = difficultySettings[difficulty] ?? difficultySettings.easy;
  const generator = new SudokuGenerator();
  const solution = generator.generateSolution();
  const puzzle = generator.createPuzzle(solution, settings.clues);

  return {
    puzzle,
    solution,
  };
}

class SudokuGenerator {
  constructor() {
    this.size = SIZE;
    this.boxSize = BOX;
  }

  generateSolution() {
    const grid = createEmptyGrid();
    this.fillDiagonalBoxes(grid);
    this.fillRemaining(grid, 0, this.boxSize);
    return grid;
  }

  fillDiagonalBoxes(grid) {
    for (let i = 0; i < this.size; i += this.boxSize) {
      this.fillBox(grid, i, i);
    }
  }

  fillBox(grid, row, col) {
    const digits = shuffleDigits();
    let k = 0;
    for (let i = 0; i < this.boxSize; i++) {
      for (let j = 0; j < this.boxSize; j++) {
        grid[row + i][col + j] = digits[k];
        k += 1;
      }
    }
  }

  fillRemaining(grid, row, col) {
    if (col >= this.size && row < this.size - 1) {
      row += 1;
      col = 0;
    }

    if (row >= this.size && col >= this.size) {
      return true;
    }

    if (row < this.boxSize) {
      if (col < this.boxSize) {
        col = this.boxSize;
      }
    } else if (row < this.size - this.boxSize) {
      if (col === Math.floor(row / this.boxSize) * this.boxSize) {
        col += this.boxSize;
      }
    } else {
      if (col === this.size - this.boxSize) {
        row += 1;
        col = 0;
        if (row >= this.size) {
          return true;
        }
      }
    }

    for (const num of shuffleDigits()) {
      if (this.isSafe(grid, row, col, num)) {
        grid[row][col] = num;
        if (this.fillRemaining(grid, row, col + 1)) {
          return true;
        }
        grid[row][col] = 0;
      }
    }
    return false;
  }

  isSafe(grid, row, col, num) {
    for (let x = 0; x < this.size; x++) {
      if (grid[row][x] === num || grid[x][col] === num) {
        return false;
      }
    }

    const startRow = row - (row % this.boxSize);
    const startCol = col - (col % this.boxSize);

    for (let i = 0; i < this.boxSize; i++) {
      for (let j = 0; j < this.boxSize; j++) {
        if (grid[startRow + i][startCol + j] === num) {
          return false;
        }
      }
    }
    return true;
  }

  createPuzzle(solution, targetClues) {
    const puzzle = cloneGrid(solution);
    const pairs = buildSymmetricPairs();
    shuffleArray(pairs);

    let clues = this.size * this.size;

    for (const pair of pairs) {
      const removalCount = pair.length;
      if (clues - removalCount < targetClues) continue;

      const previousValues = pair.map(({ row, col }) => ({
        row,
        col,
        value: puzzle[row][col],
      }));

      for (const { row, col } of pair) {
        puzzle[row][col] = 0;
      }

      const solutions = countSolutions(puzzle, 2);

      if (solutions === 1) {
        clues -= removalCount;
      } else {
        for (const { row, col, value } of previousValues) {
          puzzle[row][col] = value;
        }
      }
    }

    // Si ens hem quedat amb massa pistes, fem un últim intent amb backtracking
    if (clues > targetClues) {
      this.trimWithSearch(puzzle, clues, targetClues);
    }

    return puzzle;
  }

  trimWithSearch(puzzle, clues, targetClues) {
    // Estratègia senzilla: ordenar les cel·les per rand i provar-ne una a una.
    const cells = [];
    for (let row = 0; row < this.size; row++) {
      for (let col = 0; col < this.size; col++) {
        if (puzzle[row][col] !== 0) {
          cells.push({ row, col });
        }
      }
    }
    shuffleArray(cells);

    for (const { row, col } of cells) {
      if (clues <= targetClues) break;
      const prev = puzzle[row][col];
      puzzle[row][col] = 0;
      const solutions = countSolutions(puzzle, 2);
      if (solutions === 1) {
        clues -= 1;
      } else {
        puzzle[row][col] = prev;
      }
    }
  }
}

function buildSymmetricPairs() {
  const pairs = [];
  const size = SIZE;
  const total = size * size;
  const used = new Set();

  for (let index = 0; index < total; index++) {
    const row = Math.floor(index / size);
    const col = index % size;
    const symRow = size - 1 - row;
    const symCol = size - 1 - col;

    const key = `${row},${col}`;
    const symKey = `${symRow},${symCol}`;
    if (used.has(key) || used.has(symKey)) continue;

    if (row === symRow && col === symCol) {
      pairs.push([{ row, col }]);
    } else {
      pairs.push([
        { row, col },
        { row: symRow, col: symCol },
      ]);
    }
    used.add(key);
    used.add(symKey);
  }
  return pairs;
}

function shuffleDigits() {
  const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  shuffleArray(digits);
  return digits;
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// utilitzat per a futurs desenvolupaments (tutorials o validacions)
export function regenerateSolutionFromPuzzle(puzzle) {
  return solveGrid(puzzle);
}
