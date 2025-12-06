/* ==========================================
   PUZZLE DE KLOTSKI - Joc de trencaclosques
   ==========================================
   400 nivells únics pre-calculats amb solucionador BFS.
   Ordenats per dificultat real (moviments òptims).
   Nivell 400: Configuració clàssica Hua Rong Dao (90 mov)
   ========================================== */

const COLS = 4;
const ROWS = 5;
const TOTAL_LEVELS = 400;
const LEVELS_PER_PAGE = 50;
const WIN_POSITION = { col: 1, row: 3 };

// ==========================================
// Configuració Klotski clàssica
// Sempre 10 peces (18 caselles ocupades, 2 lliures)
// ==========================================
const KLOTSKI_PIECES = [
    { type: 'main', width: 2, height: 2 },      // 1 peça vermella (4 caselles)
    { type: 'vertical', width: 1, height: 2 },  // 4 peces verticals (8 caselles)
    { type: 'vertical', width: 1, height: 2 },
    { type: 'vertical', width: 1, height: 2 },
    { type: 'vertical', width: 1, height: 2 },
    { type: 'horizontal', width: 2, height: 1 },// 1 peça horitzontal (2 caselles)
    { type: 'small', width: 1, height: 1 },     // 4 peces petites (4 caselles)
    { type: 'small', width: 1, height: 1 },
    { type: 'small', width: 1, height: 1 },
    { type: 'small', width: 1, height: 1 },
];
// Total: 4 + 8 + 2 + 4 = 18 caselles (queden 2 lliures)

// Informació de dificultat basada en els moviments òptims del nivell
function getDifficultyInfo(level) {
    if (level <= 60) return { stars: 1, label: 'Fàcil', emoji: '⭐', minMoves: '5-8' };
    if (level <= 120) return { stars: 2, label: 'Fàcil+', emoji: '⭐⭐', minMoves: '9-12' };
    if (level <= 180) return { stars: 3, label: 'Normal', emoji: '⭐⭐⭐', minMoves: '13-18' };
    if (level <= 240) return { stars: 4, label: 'Difícil', emoji: '⭐⭐⭐⭐', minMoves: '19-30' };
    if (level <= 300) return { stars: 5, label: 'Expert', emoji: '⭐⭐⭐⭐⭐', minMoves: '31-49' };
    if (level === 400) return { stars: 6, label: 'Hua Rong Dao', emoji: '👑', minMoves: '90' };
    return { stars: 6, label: 'Mestre', emoji: '🔥', minMoves: '50+' };
}

// ==========================================
// Classe del joc
// ==========================================
class SuperSlideGame {
    constructor() {
        // DOM
        this.boardEl = document.getElementById('board');
        this.timerEl = document.getElementById('timer');
        this.movesEl = document.getElementById('moves');
        this.levelBtn = document.getElementById('level-btn');

        // Modals
        this.modalHowto = document.getElementById('modal-howto');
        this.modalLevels = document.getElementById('modal-levels');
        this.modalWin = document.getElementById('modal-win');

        // Events
        document.getElementById('btn-howto').onclick = () => this.showModal(this.modalHowto);
        document.getElementById('btn-start').onclick = () => this.hideModal(this.modalHowto);
        document.getElementById('btn-undo').onclick = () => this.undo();
        document.getElementById('btn-reset').onclick = () => this.resetLevel();
        document.getElementById('btn-next').onclick = () => this.nextLevel();
        document.getElementById('btn-replay').onclick = () => this.replayLevel();

        // Selector de nivells
        this.levelBtn.onclick = () => this.openLevelSelector();
        document.getElementById('btn-close-levels').onclick = () => this.hideModal(this.modalLevels);
        document.getElementById('prev-page').onclick = () => this.changePage(-1);
        document.getElementById('next-page').onclick = () => this.changePage(1);

        this.currentPage = 0;
        this.totalPages = Math.ceil(TOTAL_LEVELS / LEVELS_PER_PAGE);

        // Estat
        this.pieces = [];
        this.grid = [];
        this.moveHistory = [];
        this.moveCount = 0;
        this.seconds = 0;
        this.timerInterval = null;
        this.timerStarted = false;
        this.currentLevel = 1;

        // Drag
        this.dragging = null;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.pieceStartCol = 0;
        this.pieceStartRow = 0;

        // Carregar progrés
        this.loadProgress();
        this.generateLevel(this.currentLevel);
        this.updateLevelBtn();

        // Mostrar instruccions primera vegada
        if (!localStorage.getItem('superslide-intro')) {
            this.showModal(this.modalHowto);
            localStorage.setItem('superslide-intro', '1');
        }
    }

    // ==========================================
    // Modals
    // ==========================================
    showModal(modal) {
        modal.setAttribute('aria-hidden', 'false');
    }

    hideModal(modal) {
        modal.setAttribute('aria-hidden', 'true');
    }

    // ==========================================
    // Selector de nivells
    // ==========================================
    openLevelSelector() {
        this.currentPage = Math.floor((this.currentLevel - 1) / LEVELS_PER_PAGE);
        this.renderLevelGrid();
        this.showModal(this.modalLevels);
    }

    renderLevelGrid() {
        const grid = document.getElementById('level-grid');
        const pageIndicator = document.getElementById('page-indicator');
        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');
        const diffEl = document.getElementById('level-difficulty');

        grid.innerHTML = '';

        const start = this.currentPage * LEVELS_PER_PAGE + 1;
        const end = Math.min(start + LEVELS_PER_PAGE - 1, TOTAL_LEVELS);

        for (let i = start; i <= end; i++) {
            const btn = document.createElement('button');
            btn.className = 'level-btn';
            btn.textContent = i;

            if (this.completedLevels && this.completedLevels.has(i)) {
                btn.classList.add('completed');
            }
            if (i === this.currentLevel) {
                btn.classList.add('current');
            }

            btn.onclick = () => this.selectLevel(i);
            grid.appendChild(btn);
        }

        pageIndicator.textContent = `${this.currentPage + 1} / ${this.totalPages}`;
        prevBtn.disabled = this.currentPage === 0;
        nextBtn.disabled = this.currentPage >= this.totalPages - 1;

        // Mostrar dificultat de l'interval
        const midLevel = Math.floor((start + end) / 2);
        const diff = getDifficultyInfo(midLevel);
        diffEl.innerHTML = `<span class="diff-badge">${'⭐'.repeat(Math.min(diff.stars, 5))} ${diff.label}</span>`;
    }

    changePage(delta) {
        this.currentPage = Math.max(0, Math.min(this.totalPages - 1, this.currentPage + delta));
        this.renderLevelGrid();
    }

    selectLevel(level) {
        this.currentLevel = level;
        this.hideModal(this.modalLevels);
        this.generateLevel(level);
        this.updateLevelBtn();
        this.saveProgress();
    }

    updateLevelBtn() {
        this.levelBtn.textContent = this.currentLevel;
    }

    // ==========================================
    // Persistència
    // ==========================================
    loadProgress() {
        const saved = localStorage.getItem('superslide-data');
        if (saved) {
            const data = JSON.parse(saved);
            this.currentLevel = data.level || 1;
            this.bestTimes = data.bestTimes || {};
            this.completedLevels = new Set(data.completed || []);
        } else {
            this.bestTimes = {};
            this.completedLevels = new Set();
        }
    }

    saveProgress() {
        localStorage.setItem('superslide-data', JSON.stringify({
            level: this.currentLevel,
            bestTimes: this.bestTimes,
            completed: Array.from(this.completedLevels)
        }));
    }

    // ==========================================
    // Generació de nivells (des de dades pre-calculades)
    // ==========================================
    generateLevel(levelNum) {
        this.stopTimer();
        this.timerStarted = false;
        this.seconds = 0;
        this.moveCount = 0;
        this.moveHistory = [];
        this.updateTimerDisplay();
        this.updateMovesDisplay();

        // Inicialitzar grid
        this.grid = Array(ROWS).fill(null).map(() => Array(COLS).fill(null));

        // Crear peces amb la configuració base
        this.pieces = KLOTSKI_PIECES.map((p, i) => ({
            id: i,
            type: p.type,
            width: p.width,
            height: p.height,
            col: 0,
            row: 0,
        }));

        // Carregar posicions des de LEVELS_DATA (si existeix)
        if (typeof LEVELS_DATA !== 'undefined' && LEVELS_DATA[levelNum - 1]) {
            const levelData = LEVELS_DATA[levelNum - 1];
            for (let i = 0; i < this.pieces.length && i < levelData.positions.length; i++) {
                this.pieces[i].col = levelData.positions[i].c;
                this.pieces[i].row = levelData.positions[i].r;
            }
        } else {
            // Fallback: generar aleatòriament (per si no hi ha dades)
            this.generateLevelFallback(levelNum);
        }

        // Col·locar peces a la graella
        for (const piece of this.pieces) {
            this.placePieceOnGrid(piece);
        }

        this.render();
        console.log(`Nivell ${levelNum} carregat`);
    }

    // Generació de backup si no hi ha LEVELS_DATA
    generateLevelFallback(levelNum) {
        const seed = levelNum * 31337 + 12345;
        const random = this.seededRandom(seed);

        // Peça vermella a la sortida
        const mainPiece = this.pieces[0];
        mainPiece.col = WIN_POSITION.col;
        mainPiece.row = WIN_POSITION.row;
        this.placePieceOnGrid(mainPiece);

        // Col·locar altres peces
        this.placeRemainingPieces(this.pieces.slice(1), random);

        // Barrejar
        const shuffleMoves = 50 + levelNum;
        this.shuffleBoard(shuffleMoves, random);

        // Verificar que no estem ja guanyant
        if (mainPiece.col === WIN_POSITION.col && mainPiece.row === WIN_POSITION.row) {
            this.forceMove(mainPiece, random);
        }
    }

    placeRemainingPieces(pieces, random) {
        // Ordenar per mida descendent
        pieces.sort((a, b) => (b.width * b.height) - (a.width * a.height));

        for (const piece of pieces) {
            const positions = [];

            // Trobar totes les posicions vàlides
            for (let r = 0; r <= ROWS - piece.height; r++) {
                for (let c = 0; c <= COLS - piece.width; c++) {
                    piece.col = c;
                    piece.row = r;
                    if (this.canPlacePiece(piece)) {
                        positions.push({ col: c, row: r });
                    }
                }
            }

            if (positions.length > 0) {
                // Escollir posició aleatòria
                const pos = positions[Math.floor(random() * positions.length)];
                piece.col = pos.col;
                piece.row = pos.row;
                this.placePieceOnGrid(piece);
            }
        }
    }

    canPlacePiece(piece) {
        if (piece.col < 0 || piece.col + piece.width > COLS) return false;
        if (piece.row < 0 || piece.row + piece.height > ROWS) return false;

        for (let r = 0; r < piece.height; r++) {
            for (let c = 0; c < piece.width; c++) {
                if (this.grid[piece.row + r][piece.col + c] !== null) {
                    return false;
                }
            }
        }
        return true;
    }

    forceMove(piece, random) {
        const moves = this.getValidMoves(piece);
        if (moves.length > 0) {
            const move = moves[Math.floor(random() * moves.length)];
            this.removePieceFromGrid(piece);
            piece.col = move.newCol;
            piece.row = move.newRow;
            this.placePieceOnGrid(piece);
        } else {
            // Moure altre peça primer
            this.shuffleBoard(5, random);
        }
    }

    shuffleBoard(moves, random) {
        let done = 0;
        let attempts = 0;
        const maxAttempts = moves * 20;
        let lastPieceId = -1;

        while (done < moves && attempts < maxAttempts) {
            // Obtenir peces amb moviments vàlids
            const candidates = [];
            for (const piece of this.pieces) {
                if (piece.id === lastPieceId) continue; // Evitar moure la mateixa peça
                const validMoves = this.getValidMoves(piece);
                if (validMoves.length > 0) {
                    candidates.push({ piece, moves: validMoves });
                }
            }

            if (candidates.length > 0) {
                const chosen = candidates[Math.floor(random() * candidates.length)];
                const move = chosen.moves[Math.floor(random() * chosen.moves.length)];

                this.removePieceFromGrid(chosen.piece);
                chosen.piece.col = move.newCol;
                chosen.piece.row = move.newRow;
                this.placePieceOnGrid(chosen.piece);

                lastPieceId = chosen.piece.id;
                done++;
            }
            attempts++;
        }
    }

    seededRandom(seed) {
        let s = seed;
        return () => {
            s = Math.sin(s * 9999) * 10000;
            return s - Math.floor(s);
        };
    }

    getValidMoves(piece) {
        const moves = [];
        const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];

        for (const [dc, dr] of dirs) {
            let step = 1;
            while (step <= 4) {
                const newCol = piece.col + dc * step;
                const newRow = piece.row + dr * step;

                this.removePieceFromGrid(piece);
                const canMove = this.canMovePiece(piece, newCol, newRow);
                this.placePieceOnGrid(piece);

                if (canMove) {
                    moves.push({ newCol, newRow });
                    step++;
                } else {
                    break;
                }
            }
        }
        return moves;
    }

    canMovePiece(piece, newCol, newRow) {
        if (newCol < 0 || newCol + piece.width > COLS) return false;
        if (newRow < 0 || newRow + piece.height > ROWS) return false;

        for (let r = 0; r < piece.height; r++) {
            for (let c = 0; c < piece.width; c++) {
                const occ = this.grid[newRow + r][newCol + c];
                if (occ !== null && occ !== piece.id) return false;
            }
        }
        return true;
    }

    removePieceFromGrid(piece) {
        for (let r = 0; r < piece.height; r++) {
            for (let c = 0; c < piece.width; c++) {
                const row = piece.row + r;
                const col = piece.col + c;
                if (row >= 0 && row < ROWS && col >= 0 && col < COLS) {
                    if (this.grid[row][col] === piece.id) {
                        this.grid[row][col] = null;
                    }
                }
            }
        }
    }

    placePieceOnGrid(piece) {
        for (let r = 0; r < piece.height; r++) {
            for (let c = 0; c < piece.width; c++) {
                this.grid[piece.row + r][piece.col + c] = piece.id;
            }
        }
    }

    // ==========================================
    // Renderització
    // ==========================================
    render() {
        this.boardEl.innerHTML = '';
        this.boardEl.classList.add('loading');

        // Llegir la mida real del taulell renderitzat pel CSS
        const boardRect = this.boardEl.getBoundingClientRect();
        const boardWidth = boardRect.width;
        const boardHeight = boardRect.height;

        // El taulell és: width = 4*cell + 3*gap + 2*padding
        //               height = 5*cell + 4*gap + 2*padding
        // Amb padding = 3px fix
        const padding = 3;

        // Calcular cell i gap a partir de la mida del taulell
        // Assumint que gap ≈ cell * 0.04 (proporció petita)
        // width - 2*padding = 4*cell + 3*gap ≈ 4*cell + 3*(cell*0.04) = cell * 4.12
        const innerWidth = boardWidth - 2 * padding;
        const innerHeight = boardHeight - 2 * padding;

        // cell = innerWidth / (4 + 3*gapRatio) on gapRatio ≈ 0.035
        // Fem servir la relació height/width per ser precisos
        // innerWidth = 4*cell + 3*gap
        // innerHeight = 5*cell + 4*gap
        // Resolent: gap = (5*innerWidth - 4*innerHeight) / (3*5 - 4*4) = (5*innerWidth - 4*innerHeight) / (15-16) 
        // Però això pot donar negatiu, així que usem una aproximació més simple

        // Aproximació: gap és petit respecte cell
        const cellSize = innerWidth / 4.15; // 4 cells + 3 petits gaps
        const gap = (innerWidth - 4 * cellSize) / 3;

        for (const piece of this.pieces) {
            const el = document.createElement('div');
            el.className = `piece ${piece.type}`;
            el.dataset.id = piece.id;

            const width = piece.width * cellSize + (piece.width - 1) * gap;
            const height = piece.height * cellSize + (piece.height - 1) * gap;
            el.style.width = `${width}px`;
            el.style.height = `${height}px`;

            // Posició amb padding idèntic als 4 costats
            el.style.left = `${padding + piece.col * (cellSize + gap)}px`;
            el.style.top = `${padding + piece.row * (cellSize + gap)}px`;

            el.style.animationDelay = `${piece.id * 0.03}s`;

            el.onmousedown = (e) => this.startDrag(e, piece);
            el.ontouchstart = (e) => this.startDrag(e, piece);

            this.boardEl.appendChild(el);
        }

        // Guardar mides per a drag
        this._cellSize = cellSize;
        this._gap = gap;
        this._padding = padding;

        document.onmousemove = (e) => this.onDrag(e);
        document.onmouseup = () => this.endDrag();
        document.ontouchmove = (e) => this.onDrag(e);
        document.ontouchend = () => this.endDrag();

        setTimeout(() => this.boardEl.classList.remove('loading'), 50);
    }

    // Usar valors calculats durant render
    getCellSize() {
        return this._cellSize || 70;
    }

    getGap() {
        return this._gap || 3;
    }

    getBoardPadding() {
        return this._padding || 3;
    }

    // ==========================================
    // Drag & Drop
    // ==========================================
    startDrag(e, piece) {
        e.preventDefault();

        if (!this.timerStarted) {
            this.startTimer();
            this.timerStarted = true;
        }

        this.dragging = piece;
        this.pieceStartCol = piece.col;
        this.pieceStartRow = piece.row;

        const point = e.touches ? e.touches[0] : e;
        this.dragStartX = point.clientX;
        this.dragStartY = point.clientY;

        const el = this.boardEl.querySelector(`[data-id="${piece.id}"]`);
        if (el) el.classList.add('dragging');
    }

    onDrag(e) {
        if (!this.dragging) return;
        e.preventDefault();

        const point = e.touches ? e.touches[0] : e;
        const dx = point.clientX - this.dragStartX;
        const dy = point.clientY - this.dragStartY;

        const cellSize = this.getCellSize();
        const gap = this.getGap();
        const step = cellSize + gap;

        let newCol = this.pieceStartCol;
        let newRow = this.pieceStartRow;

        if (Math.abs(dx) > Math.abs(dy)) {
            newCol = this.pieceStartCol + Math.round(dx / step);
        } else {
            newRow = this.pieceStartRow + Math.round(dy / step);
        }

        const valid = this.findValidPosition(this.dragging, newCol, newRow);

        const el = this.boardEl.querySelector(`[data-id="${this.dragging.id}"]`);
        if (el) {
            const bp = this.getBoardPadding();
            el.style.left = `${bp + valid.col * step}px`;
            el.style.top = `${bp + valid.row * step}px`;
        }
    }

    findValidPosition(piece, targetCol, targetRow) {
        const dc = Math.sign(targetCol - this.pieceStartCol);
        const dr = Math.sign(targetRow - this.pieceStartRow);

        let validCol = this.pieceStartCol;
        let validRow = this.pieceStartRow;

        if (dc !== 0 && dr === 0) {
            let col = this.pieceStartCol;
            while (true) {
                const next = col + dc;
                this.removePieceFromGrid(piece);
                const ok = this.canMovePiece(piece, next, this.pieceStartRow);
                this.placePieceOnGrid(piece);
                if (ok) {
                    col = next;
                    validCol = col;
                    if ((dc > 0 && col >= targetCol) || (dc < 0 && col <= targetCol)) break;
                } else break;
            }
        }

        if (dr !== 0 && dc === 0) {
            let row = this.pieceStartRow;
            while (true) {
                const next = row + dr;
                this.removePieceFromGrid(piece);
                const ok = this.canMovePiece(piece, this.pieceStartCol, next);
                this.placePieceOnGrid(piece);
                if (ok) {
                    row = next;
                    validRow = row;
                    if ((dr > 0 && row >= targetRow) || (dr < 0 && row <= targetRow)) break;
                } else break;
            }
        }

        return { col: validCol, row: validRow };
    }

    endDrag() {
        if (!this.dragging) return;

        const piece = this.dragging;
        const el = this.boardEl.querySelector(`[data-id="${piece.id}"]`);

        const cellSize = this.getCellSize();
        const gap = this.getGap();
        const step = cellSize + gap;

        const left = parseFloat(el.style.left);
        const top = parseFloat(el.style.top);
        const bp = this.getBoardPadding();

        const newCol = Math.round((left - bp) / step);
        const newRow = Math.round((top - bp) / step);

        if (newCol !== piece.col || newRow !== piece.row) {
            this.moveHistory.push({
                pieceId: piece.id,
                fromCol: piece.col,
                fromRow: piece.row,
                toCol: newCol,
                toRow: newRow
            });

            this.removePieceFromGrid(piece);
            piece.col = newCol;
            piece.row = newRow;
            this.placePieceOnGrid(piece);

            this.moveCount++;
            this.updateMovesDisplay();

            this.checkWin();
        }

        const bpFinal = this.getBoardPadding();
        el.style.left = `${bpFinal + piece.col * step}px`;
        el.style.top = `${bpFinal + piece.row * step}px`;
        el.classList.remove('dragging');

        this.dragging = null;
    }

    // ==========================================
    // Victòria
    // ==========================================
    checkWin() {
        const main = this.pieces[0];
        if (main.col === WIN_POSITION.col && main.row === WIN_POSITION.row) {
            this.onWin();
        }
    }

    onWin() {
        this.stopTimer();

        // Guardar rècord
        this.completedLevels.add(this.currentLevel);
        const key = `l${this.currentLevel}`;
        if (!this.bestTimes[key] || this.seconds < this.bestTimes[key]) {
            this.bestTimes[key] = this.seconds;
        }
        this.saveProgress();

        // Efecte visual
        const mainEl = this.boardEl.querySelector('.piece.main');
        if (mainEl) mainEl.classList.add('winning');

        this.launchConfetti();
        this.playWinSound();

        setTimeout(() => {
            document.getElementById('win-title').textContent = `🎉 Nivell ${this.currentLevel}!`;
            document.getElementById('win-time').textContent = `⏱️ ${this.formatTime(this.seconds)}`;
            document.getElementById('win-moves').textContent = `📊 ${this.moveCount} mov.`;
            this.showModal(this.modalWin);
        }, 400);
    }

    // ==========================================
    // Confetti i so
    // ==========================================
    launchConfetti() {
        const container = document.getElementById('confetti');
        container.innerHTML = '';

        const colors = ['#ff6b81', '#5dade2', '#58d68d', '#f7dc6f', '#bb8fce'];

        for (let i = 0; i < 80; i++) {
            const p = document.createElement('div');
            p.className = 'confetti-piece';
            p.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            p.style.left = `${Math.random() * 100}%`;
            p.style.animationDelay = `${Math.random() * 0.5}s`;
            p.style.animationDuration = `${2 + Math.random() * 2}s`;
            if (Math.random() > 0.5) p.style.borderRadius = '50%';
            container.appendChild(p);
        }

        setTimeout(() => container.innerHTML = '', 4000);
    }

    playWinSound() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.frequency.value = freq;
                osc.type = 'sine';
                const t = ctx.currentTime + i * 0.12;
                gain.gain.setValueAtTime(0.15, t);
                gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);
                osc.start(t);
                osc.stop(t + 0.25);
            });
        } catch (e) { }
    }

    // ==========================================
    // Timer i UI
    // ==========================================
    startTimer() {
        this.seconds = 0;
        this.updateTimerDisplay();
        this.timerInterval = setInterval(() => {
            this.seconds++;
            this.updateTimerDisplay();
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    formatTime(s) {
        return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
    }

    updateTimerDisplay() {
        this.timerEl.textContent = this.formatTime(this.seconds);
    }

    updateMovesDisplay() {
        this.movesEl.textContent = this.moveCount;
    }

    // ==========================================
    // Controls
    // ==========================================
    undo() {
        if (this.moveHistory.length === 0) return;

        const last = this.moveHistory.pop();
        const piece = this.pieces.find(p => p.id === last.pieceId);

        if (piece) {
            this.removePieceFromGrid(piece);
            piece.col = last.fromCol;
            piece.row = last.fromRow;
            this.placePieceOnGrid(piece);

            const cellSize = this.getCellSize();
            const gap = this.getGap();
            const step = cellSize + gap;
            const bp = this.getBoardPadding();

            const el = this.boardEl.querySelector(`[data-id="${piece.id}"]`);
            el.style.left = `${bp + piece.col * step}px`;
            el.style.top = `${bp + piece.row * step}px`;

            this.moveCount--;
            this.updateMovesDisplay();
        }
    }

    resetLevel() {
        this.generateLevel(this.currentLevel);
    }

    nextLevel() {
        this.hideModal(this.modalWin);
        this.currentLevel = Math.min(this.currentLevel + 1, TOTAL_LEVELS);
        this.saveProgress();
        this.generateLevel(this.currentLevel);
        this.updateLevelBtn();
    }

    replayLevel() {
        this.hideModal(this.modalWin);
        this.resetLevel();
    }
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    window.game = new SuperSlideGame();
});

// Resize
window.addEventListener('resize', () => {
    if (window.game && window.game.pieces) {
        window.game.render();
    }
});
