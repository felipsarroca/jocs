/**
 * Generador de nivells Klotski amb solucionador BFS CORREGIT
 * 
 * IMPORTANT: Ara compta moviments REALS - moure una peça qualsevol 
 * distància en una direcció = 1 moviment (no cada pas individual)
 * 
 * Inclou configuració clàssica Hua Rong Dao (Nivell 400)
 * 
 * Ús: node generate-levels.js
 */

const COLS = 4;
const ROWS = 5;
const WIN_POSITION = { col: 1, row: 3 };

// Configuració Klotski clàssica: 10 peces
const PIECE_TEMPLATES = [
    { type: 'main', width: 2, height: 2 },      // 0: Cao Cao (peça vermella 2x2)
    { type: 'vertical', width: 1, height: 2 },  // 1-4: Generals (blaves 1x2)
    { type: 'vertical', width: 1, height: 2 },
    { type: 'vertical', width: 1, height: 2 },
    { type: 'vertical', width: 1, height: 2 },
    { type: 'horizontal', width: 2, height: 1 }, // 5: Guan Yu (verda 2x1)
    { type: 'small', width: 1, height: 1 },      // 6-9: Soldats (grogues 1x1)
    { type: 'small', width: 1, height: 1 },
    { type: 'small', width: 1, height: 1 },
    { type: 'small', width: 1, height: 1 },
];

// ==========================================
// CONFIGURACIÓ CLÀSSICA HUA RONG DAO
// Requereix ~81 moviments per resoldre
// ==========================================
const HUA_RONG_DAO_CLASSIC = [
    { col: 1, row: 0 },  // 0: Cao Cao (2x2) - centre dalt
    { col: 0, row: 0 },  // 1: General esquerra dalt
    { col: 3, row: 0 },  // 2: General dreta dalt
    { col: 0, row: 2 },  // 3: General esquerra baix
    { col: 3, row: 2 },  // 4: General dreta baix
    { col: 1, row: 2 },  // 5: Guan Yu (horitzontal) - centre
    { col: 0, row: 4 },  // 6: Soldat
    { col: 1, row: 3 },  // 7: Soldat (a la sortida!)
    { col: 2, row: 3 },  // 8: Soldat
    { col: 3, row: 4 },  // 9: Soldat
];

// ==========================================
// Generador de nombres aleatoris amb llavor
// ==========================================
function seededRandom(seed) {
    let s = seed;
    return () => {
        s = Math.sin(s * 9999) * 10000;
        return s - Math.floor(s);
    };
}

// ==========================================
// Classe per gestionar l'estat del taulell
// ==========================================
class BoardState {
    constructor(pieces) {
        this.pieces = pieces.map(p => ({ ...p }));
    }

    serialize() {
        const sorted = [...this.pieces].sort((a, b) => {
            if (a.type !== b.type) return a.type.localeCompare(b.type);
            if (a.row !== b.row) return a.row - b.row;
            return a.col - b.col;
        });
        return sorted.map(p => `${p.type}:${p.col},${p.row}`).join('|');
    }

    isWin() {
        const main = this.pieces[0];
        return main.col === WIN_POSITION.col && main.row === WIN_POSITION.row;
    }

    createGrid() {
        const grid = Array(ROWS).fill(null).map(() => Array(COLS).fill(null));
        for (let i = 0; i < this.pieces.length; i++) {
            const p = this.pieces[i];
            for (let r = 0; r < p.height; r++) {
                for (let c = 0; c < p.width; c++) {
                    if (p.row + r < ROWS && p.col + c < COLS) {
                        grid[p.row + r][p.col + c] = i;
                    }
                }
            }
        }
        return grid;
    }

    // CORREGIT: Retorna tots els moviments vàlids
    // On cada "moviment" és moure UNA peça en UNA direcció
    // fins a qualsevol distància vàlida (1, 2, 3... caselles)
    getValidMoves() {
        const moves = [];
        const grid = this.createGrid();
        const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]]; // esquerra, dreta, amunt, avall

        for (let i = 0; i < this.pieces.length; i++) {
            const piece = this.pieces[i];

            for (const [dc, dr] of dirs) {
                // Trobar la màxima distància que pot moure's en aquesta direcció
                let maxDist = 0;
                for (let dist = 1; dist <= 4; dist++) {
                    const newCol = piece.col + dc * dist;
                    const newRow = piece.row + dr * dist;

                    if (this.canMoveTo(piece, newCol, newRow, grid, i)) {
                        maxDist = dist;
                    } else {
                        break;
                    }
                }

                // Si pot moure's almenys 1 casella, afegir el moviment
                // (el moviment màxim en aquesta direcció)
                if (maxDist > 0) {
                    moves.push({
                        pieceIndex: i,
                        newCol: piece.col + dc * maxDist,
                        newRow: piece.row + dr * maxDist
                    });

                    // També afegir moviments intermitjos per explorar més estats
                    for (let dist = 1; dist < maxDist; dist++) {
                        moves.push({
                            pieceIndex: i,
                            newCol: piece.col + dc * dist,
                            newRow: piece.row + dr * dist
                        });
                    }
                }
            }
        }
        return moves;
    }

    canMoveTo(piece, newCol, newRow, grid, pieceIndex) {
        if (newCol < 0 || newCol + piece.width > COLS) return false;
        if (newRow < 0 || newRow + piece.height > ROWS) return false;

        for (let r = 0; r < piece.height; r++) {
            for (let c = 0; c < piece.width; c++) {
                const occ = grid[newRow + r][newCol + c];
                if (occ !== null && occ !== pieceIndex) return false;
            }
        }
        return true;
    }

    applyMove(move) {
        const newPieces = this.pieces.map(p => ({ ...p }));
        newPieces[move.pieceIndex].col = move.newCol;
        newPieces[move.pieceIndex].row = move.newRow;
        return new BoardState(newPieces);
    }
}

// ==========================================
// Solucionador BFS - Compta moviments REALS
// ==========================================
function solveBFS(initialState, maxMoves = 200) {
    const visited = new Set();
    const queue = [{ state: initialState, moves: 0, lastPieceIndex: -1 }];
    visited.add(initialState.serialize());

    while (queue.length > 0) {
        const { state, moves, lastPieceIndex } = queue.shift();

        if (state.isWin()) {
            return moves;
        }

        if (moves >= maxMoves) continue;

        for (const move of state.getValidMoves()) {
            const newState = state.applyMove(move);
            const key = newState.serialize();

            if (!visited.has(key)) {
                visited.add(key);
                // Comptar com a 1 moviment (independentment de la distància)
                queue.push({
                    state: newState,
                    moves: moves + 1,
                    lastPieceIndex: move.pieceIndex
                });
            }
        }
    }

    return -1;
}

// ==========================================
// Generador de nivells
// ==========================================
function generateLevel(seed) {
    const random = seededRandom(seed);
    const pieces = PIECE_TEMPLATES.map((p, i) => ({
        id: i,
        type: p.type,
        width: p.width,
        height: p.height,
        col: 0,
        row: 0,
    }));

    const grid = Array(ROWS).fill(null).map(() => Array(COLS).fill(null));

    function placePieceOnGrid(piece) {
        for (let r = 0; r < piece.height; r++) {
            for (let c = 0; c < piece.width; c++) {
                grid[piece.row + r][piece.col + c] = piece.id;
            }
        }
    }

    function canPlace(piece, col, row) {
        if (col < 0 || col + piece.width > COLS) return false;
        if (row < 0 || row + piece.height > ROWS) return false;
        for (let r = 0; r < piece.height; r++) {
            for (let c = 0; c < piece.width; c++) {
                if (grid[row + r][col + c] !== null) return false;
            }
        }
        return true;
    }

    // Peça principal a la sortida (row 3)
    pieces[0].col = WIN_POSITION.col;
    pieces[0].row = WIN_POSITION.row;
    placePieceOnGrid(pieces[0]);

    // Col·locar resta de peces
    for (let i = 1; i < pieces.length; i++) {
        const piece = pieces[i];
        const positions = [];
        for (let r = 0; r <= ROWS - piece.height; r++) {
            for (let c = 0; c <= COLS - piece.width; c++) {
                if (canPlace(piece, c, r)) {
                    positions.push({ col: c, row: r });
                }
            }
        }
        if (positions.length > 0) {
            const pos = positions[Math.floor(random() * positions.length)];
            piece.col = pos.col;
            piece.row = pos.row;
            placePieceOnGrid(piece);
        }
    }

    // Molt de barreja per nivells més difícils
    const shuffleMoves = 200 + Math.floor(seed % 500);
    let state = new BoardState(pieces);
    let lastPieceIndex = -1;

    for (let i = 0; i < shuffleMoves; i++) {
        const moves = state.getValidMoves().filter(m => m.pieceIndex !== lastPieceIndex);
        if (moves.length > 0) {
            const move = moves[Math.floor(random() * moves.length)];
            state = state.applyMove(move);
            lastPieceIndex = move.pieceIndex;
        }
    }

    // Assegurar que no estem a la posició guanyadora
    if (state.isWin()) {
        const moves = state.getValidMoves().filter(m => m.pieceIndex === 0);
        if (moves.length > 0) {
            state = state.applyMove(moves[0]);
        }
    }

    return state.pieces;
}

// ==========================================
// Programa principal
// ==========================================
async function main() {
    console.log('🧩 Generador de nivells Klotski (SOLUCIONADOR CORREGIT)');
    console.log('=========================================================\n');

    // FASE 1: Verificar configuració clàssica Hua Rong Dao
    console.log('📌 Verificant configuració clàssica Hua Rong Dao...');
    const huaRongPieces = PIECE_TEMPLATES.map((p, i) => ({
        id: i,
        type: p.type,
        width: p.width,
        height: p.height,
        col: HUA_RONG_DAO_CLASSIC[i].col,
        row: HUA_RONG_DAO_CLASSIC[i].row,
    }));
    const huaRongState = new BoardState(huaRongPieces);
    const huaRongMoves = solveBFS(huaRongState, 150);
    console.log(`   Hua Rong Dao clàssic: ${huaRongMoves} moviments\n`);

    // FASE 2: Generar nivells
    const candidates = [];
    const seenStates = new Set();
    const MAX_CANDIDATES = 20000;
    const MIN_MOVES_BASIC = 5;

    console.log('Generant candidats per a 400 nivells...');

    for (let seed = 1; seed <= MAX_CANDIDATES && candidates.length < 1500; seed++) {
        const pieces = generateLevel(seed * 31337 + 12345);
        const state = new BoardState(pieces);
        const stateKey = state.serialize();

        if (seenStates.has(stateKey)) continue;
        seenStates.add(stateKey);

        const moves = solveBFS(state);

        if (moves >= MIN_MOVES_BASIC && moves !== -1) {
            candidates.push({
                seed: seed * 31337 + 12345,
                pieces: pieces.map(p => ({ col: p.col, row: p.row })),
                optimalMoves: moves
            });

            if (candidates.length % 200 === 0) {
                console.log(`  ✓ ${candidates.length} candidats trobats...`);
            }
        }
    }

    console.log(`\n📊 Candidats totals: ${candidates.length}`);
    candidates.sort((a, b) => a.optimalMoves - b.optimalMoves);

    // FASE 3: Seleccionar 399 nivells + Hua Rong Dao
    const selected = [];

    // Nivells 1-60: Fàcil (5-8 mov)
    const facil = candidates.filter(c => c.optimalMoves >= 5 && c.optimalMoves <= 8);
    // Nivells 61-120: Fàcil+ (9-12 mov)
    const facilPlus = candidates.filter(c => c.optimalMoves >= 9 && c.optimalMoves <= 12);
    // Nivells 121-180: Normal (13-18 mov)
    const normal = candidates.filter(c => c.optimalMoves >= 13 && c.optimalMoves <= 18);
    // Nivells 181-240: Difícil (19-30 mov)
    const dificil = candidates.filter(c => c.optimalMoves >= 19 && c.optimalMoves <= 30);
    // Nivells 241-300: Expert (31-49 mov)
    const expert = candidates.filter(c => c.optimalMoves >= 31 && c.optimalMoves <= 49);
    // Nivells 301-399: Mestre (50+ mov)
    const mestre = candidates.filter(c => c.optimalMoves >= 50);

    console.log(`\n📈 Distribució trobada:`);
    console.log(`   Fàcil (5-8 mov): ${facil.length} candidats`);
    console.log(`   Fàcil+ (9-12 mov): ${facilPlus.length} candidats`);
    console.log(`   Normal (13-18 mov): ${normal.length} candidats`);
    console.log(`   Difícil (19-30 mov): ${dificil.length} candidats`);
    console.log(`   Expert (31-49 mov): ${expert.length} candidats`);
    console.log(`   Mestre (50+ mov): ${mestre.length} candidats`);

    function selectFromBucket(bucket, max) {
        const step = Math.max(1, Math.floor(bucket.length / max));
        const result = [];
        for (let i = 0; i < max && i * step < bucket.length; i++) {
            result.push(bucket[i * step]);
        }
        // Completar si cal
        while (result.length < max && bucket.length > result.length) {
            const remaining = bucket.filter(b => !result.includes(b));
            if (remaining.length > 0) result.push(remaining[0]);
            else break;
        }
        return result;
    }

    selected.push(...selectFromBucket(facil, 60));
    selected.push(...selectFromBucket(facilPlus, 60));
    selected.push(...selectFromBucket(normal, 60));
    selected.push(...selectFromBucket(dificil, 60));
    selected.push(...selectFromBucket(expert, 60));
    selected.push(...selectFromBucket(mestre, 99)); // 99 per deixar espai per Hua Rong Dao

    // Completar fins a 399 amb els més difícils
    const remaining = candidates.filter(c => !selected.includes(c))
        .sort((a, b) => b.optimalMoves - a.optimalMoves);
    while (selected.length < 399 && remaining.length > 0) {
        selected.push(remaining.shift());
    }

    // Ordenar tots per dificultat
    selected.sort((a, b) => a.optimalMoves - b.optimalMoves);

    // Afegir Hua Rong Dao com a nivell 400
    selected.push({
        seed: 0,
        pieces: HUA_RONG_DAO_CLASSIC,
        optimalMoves: huaRongMoves,
        isClassic: true
    });

    // Estadístiques
    const minMoves = Math.min(...selected.map(l => l.optimalMoves));
    const maxMoves = Math.max(...selected.map(l => l.optimalMoves));
    const avgMoves = Math.round(selected.reduce((s, l) => s + l.optimalMoves, 0) / selected.length);

    console.log(`\n📈 Estadístiques dels ${selected.length} nivells:`);
    console.log(`   Mínim: ${minMoves} moviments`);
    console.log(`   Màxim: ${maxMoves} moviments (Hua Rong Dao)`);
    console.log(`   Mitjana: ${avgMoves} moviments`);

    // Generar JavaScript
    const output = `// Nivells pre-calculats per al Puzzle de Klotski
// Generats automàticament - ${selected.length} nivells únics ordenats per dificultat
// Rang de dificultat: ${minMoves} - ${maxMoves} moviments òptims
// Nivell 400: Configuració clàssica Hua Rong Dao

const LEVELS_DATA = [
${selected.map((l, i) =>
        `  { // Nivell ${i + 1}: ${l.optimalMoves} moviments${l.isClassic ? ' (HUA RONG DAO CLÀSSIC)' : ''}
    positions: [${l.pieces.map(p => `{c:${p.col},r:${p.row}}`).join(',')}]
  }`
    ).join(',\n')}
];

// Exportar per al joc
if (typeof module !== 'undefined') module.exports = LEVELS_DATA;
`;

    const fs = require('fs');
    fs.writeFileSync('levels-data.js', output);
    console.log(`\n✅ Fitxer 'levels-data.js' generat amb ${selected.length} nivells!`);
    console.log(`   Nivell 400: Hua Rong Dao clàssic (${huaRongMoves} moviments)`);
}

main().catch(console.error);
