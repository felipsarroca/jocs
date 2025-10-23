const SIZE = 9;

export class BoardView {
  constructor(container, { onCellSelect }) {
    this.container = container;
    this.onCellSelect = onCellSelect;
    this.cells = Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
    this.notesLayer = Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
    this.active = null;
  }

  render({ puzzle, user, notes }) {
    this.container.innerHTML = '';
    for (let row = 0; row < SIZE; row++) {
      for (let col = 0; col < SIZE; col++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.dataset.row = String(row);
        cell.dataset.col = String(col);

        const blockBorderRight = (col + 1) % 3 === 0 && col !== SIZE - 1;
        const blockBorderBottom = (row + 1) % 3 === 0 && row !== SIZE - 1;
        cell.dataset.blockBorderRight = String(blockBorderRight);
        cell.dataset.blockBorderBottom = String(blockBorderBottom);

        const givenValue = puzzle[row][col];
        const userValue = user[row][col];

        if (givenValue !== 0) {
          cell.textContent = givenValue;
          cell.classList.add('given');
          cell.setAttribute('role', 'gridcell');
          cell.setAttribute('aria-readonly', 'true');
          cell.setAttribute('tabindex', '-1');
        } else {
          cell.setAttribute('role', 'gridcell');
          cell.setAttribute('aria-readonly', 'false');
          cell.setAttribute('tabindex', '0');
          if (userValue !== 0) {
            cell.textContent = userValue;
          } else {
            this.renderNotes(cell, notes[row][col]);
          }
        }

        cell.addEventListener('click', () => {
          if (cell.classList.contains('given')) return;
          this.selectCell(row, col);
          this.onCellSelect?.(row, col);
        });

        cell.addEventListener('focus', () => {
          if (cell.classList.contains('given')) return;
          if (this.active && this.active.row === row && this.active.col === col) return;
          this.selectCell(row, col);
          this.onCellSelect?.(row, col);
        });

        cell.addEventListener('keydown', (event) => {
          if (event.key.startsWith('Arrow')) {
            event.preventDefault();
          }
        });

        this.container.appendChild(cell);
        this.cells[row][col] = cell;
      }
    }
  }

  selectCell(row, col) {
    this.clearHighlights();
    this.active = { row, col };
    const selectedCell = this.cells[row][col];
    if (!selectedCell) return;
    selectedCell.classList.add('active');

    const value =
      selectedCell.classList.contains('note') ? '' : selectedCell.textContent?.trim();
    this.highlightPeers(row, col);
    if (value) {
      this.highlightMatches(value);
    }
    selectedCell.focus({ preventScroll: false });
  }

  clearSelection() {
    this.clearHighlights();
    this.active = null;
  }

  updateValue(row, col, value) {
    const cell = this.cells[row][col];
    if (!cell || cell.classList.contains('given')) return;
    this.clearCellContent(cell);
    cell.classList.remove('note');
    cell.classList.remove('error', 'correct', 'conflict');
    cell.textContent = value === 0 ? '' : String(value);
    if (value === 0) {
      this.clearNotes(row, col);
    }

    if (this.active && this.active.row === row && this.active.col === col) {
      const text = cell.textContent?.trim();
      this.clearPeerHighlights();
      this.highlightPeers(row, col);
      if (text) this.highlightMatches(text);
    }
  }

  updateNotes(row, col, notesSet) {
    const cell = this.cells[row][col];
    if (!cell || cell.classList.contains('given')) return;
    if (cell.textContent?.trim()) return;
    this.renderNotes(cell, notesSet);
  }

  renderNotes(cell, notesSet) {
    this.clearCellContent(cell);
    if (!notesSet || notesSet.size === 0) {
      cell.textContent = '';
      return;
    }
    cell.classList.add('note');
    const wrapper = document.createElement('div');
    wrapper.classList.add('notes');
    for (let digit = 1; digit <= SIZE; digit++) {
      const span = document.createElement('span');
      span.textContent = notesSet.has(digit) ? String(digit) : '';
      wrapper.appendChild(span);
    }
    cell.appendChild(wrapper);
  }

  markError(row, col) {
    const cell = this.cells[row][col];
    if (!cell) return;
    cell.classList.remove('correct');
    cell.classList.add('error');
  }

  markCorrect(row, col) {
    const cell = this.cells[row][col];
    if (!cell) return;
    cell.classList.remove('error');
    cell.classList.add('correct');
  }

  highlightConflicts(conflictGrid) {
    for (let row = 0; row < SIZE; row++) {
      for (let col = 0; col < SIZE; col++) {
        const cell = this.cells[row][col];
        if (!cell || cell.classList.contains('given')) continue;
        if (conflictGrid[row]?.[col]) {
          cell.classList.add('conflict');
        } else {
          cell.classList.remove('conflict');
        }
      }
    }
  }

  clearConflicts() {
    for (const row of this.cells) {
      for (const cell of row) {
        if (!cell) continue;
        cell.classList.remove('conflict');
      }
    }
  }

  clearFeedback() {
    for (const row of this.cells) {
      for (const cell of row) {
        if (!cell) continue;
        cell.classList.remove('error', 'correct', 'conflict');
      }
    }
  }

  highlightPeers(row, col) {
    for (let i = 0; i < SIZE; i++) {
      if (i !== col) this.cells[row][i]?.classList.add('peer');
      if (i !== row) this.cells[i][col]?.classList.add('peer');
    }
    const startRow = Math.floor(row / 3) * 3;
    const startCol = Math.floor(col / 3) * 3;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const targetRow = startRow + r;
        const targetCol = startCol + c;
        if (targetRow === row && targetCol === col) continue;
        this.cells[targetRow][targetCol]?.classList.add('peer');
      }
    }
  }

  highlightMatches(value) {
    for (let row = 0; row < SIZE; row++) {
      for (let col = 0; col < SIZE; col++) {
        const cell = this.cells[row][col];
        if (!cell) continue;
        if (cell.textContent?.trim() === value && !cell.classList.contains('active')) {
          cell.classList.add('match');
        }
      }
    }
  }

  clearHighlights() {
    for (const row of this.cells) {
      for (const cell of row) {
        if (!cell) continue;
        cell.classList.remove('active', 'peer', 'match');
      }
    }
  }

  clearPeerHighlights() {
    for (const row of this.cells) {
      for (const cell of row) {
        if (!cell) continue;
        cell.classList.remove('peer', 'match');
      }
    }
  }

  clearNotes(row, col) {
    const cell = this.cells[row][col];
    if (!cell) return;
    this.clearCellContent(cell);
    cell.textContent = '';
  }

  clearCellContent(cell) {
    cell.classList.remove('note');
    const existing = cell.querySelector('.notes');
    if (existing) existing.remove();
  }
}
