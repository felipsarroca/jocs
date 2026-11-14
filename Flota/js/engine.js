/* SPDX-License-Identifier: AGPL-3.0-or-later */
/* Motor del joc tradicional Enfonsar la flota (tauler 10x10, flota clàssica de 5 vaixells) */

export const GRID_SIZE = 10;
export const ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
export const COLS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export const FLEET_SPEC = [
  { id: 'portaavions', name: 'Portaavions', size: 5 },
  { id: 'cuirassat', name: 'Cuirassat', size: 4 },
  { id: 'creuer', name: 'Creuer', size: 3 },
  { id: 'submari', name: 'Submarí', size: 3 },
  { id: 'patrullera', name: 'Patrullera', size: 2 }
];

export function coordLabel(r, c) {
  return `${ROWS[r]}${COLS[c]}`;
}

export function keyOf(r, c) {
  return `${r},${c}`;
}

export function getShipCells(r, c, size, orientation) {
  const cells = [];
  for (let i = 0; i < size; i++) {
    const nr = orientation === 'V' ? r + i : r;
    const nc = orientation === 'H' ? c + i : c;
    if (nr < 0 || nr >= GRID_SIZE || nc < 0 || nc >= GRID_SIZE) return null;
    cells.push({ r: nr, c: nc });
  }
  return cells;
}

export function canPlaceShip(ships, shipId, r, c, size, orientation) {
  const candidate = getShipCells(r, c, size, orientation);
  if (!candidate) return false;
  const occupied = new Set();
  for (const s of ships) {
    if (s.id === shipId) continue;
    const cells = getShipCells(s.r, s.c, s.size, s.o);
    if (!cells) continue;
    for (const cell of cells) occupied.add(keyOf(cell.r, cell.c));
  }
  return candidate.every((cell) => !occupied.has(keyOf(cell.r, cell.c)));
}

export function generateRandomFleet() {
  const placed = [];
  for (const spec of FLEET_SPEC) {
    const candidates = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        for (const o of ['H', 'V']) {
          if (canPlaceShip(placed, spec.id, r, c, spec.size, o)) {
            candidates.push({ id: spec.id, name: spec.name, size: spec.size, r, c, o });
          }
        }
      }
    }
    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    placed.push(pick);
  }
  return placed;
}

export function validateCompleteFleet(ships) {
  if (!Array.isArray(ships) || ships.length !== FLEET_SPEC.length) return false;
  const seenIds = new Set();
  const occupied = new Set();
  for (const spec of FLEET_SPEC) {
    const s = ships.find((item) => item.id === spec.id);
    if (!s || seenIds.has(spec.id) || (s.o !== 'H' && s.o !== 'V')) return false;
    seenIds.add(spec.id);
    const cells = getShipCells(s.r, s.c, spec.size, s.o);
    if (!cells) return false;
    for (const cell of cells) {
      const k = keyOf(cell.r, cell.c);
      if (occupied.has(k)) return false;
      occupied.add(k);
    }
  }
  return true;
}

export function evaluateShot(ships, previousHitsMap, r, c) {
  for (const s of ships) {
    const cells = getShipCells(s.r, s.c, s.size, s.o);
    const hitIndex = cells.findIndex((cell) => cell.r === r && cell.c === c);
    if (hitIndex !== -1) {
      const allCells = cells.map((cell) => keyOf(cell.r, cell.c));
      const hitAfter = new Set(Object.keys(previousHitsMap));
      hitAfter.add(keyOf(r, c));
      const isSunk = allCells.every((k) => hitAfter.has(k));
      const sunkCount = ships.filter((ship) => {
        const sc = getShipCells(ship.r, ship.c, ship.size, ship.o);
        return sc.every((cell) => hitAfter.has(keyOf(cell.r, cell.c)));
      }).length;

      return {
        result: isSunk ? 'enfonsat' : 'tocat',
        sunkShip: isSunk ? { ...s, cells } : null,
        allSunk: sunkCount === ships.length
      };
    }
  }
  return { result: 'aigua', sunkShip: null, allSunk: false };
}

export async function hashFleet(ships, salt) {
  const ordered = FLEET_SPEC.map((spec) => {
    const s = ships.find((item) => item.id === spec.id);
    return `${s.id}:${s.r}:${s.c}:${s.o}`;
  }).join('|');
  const payload = `${salt}::${ordered}`;
  const bytes = new TextEncoder().encode(payload);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function randomSalt() {
  const arr = new Uint8Array(12);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * IA per al mode contra la màquina.
 * @param {'grumet'|'capita'|'almirall'} difficulty
 * @param {Object<string, 'aigua'|'tocat'|'enfonsat'>} shotsMap - Tret realitzat per la IA ("r,c" -> resultat)
 * @param {number[]} remainingSizes - Mides dels vaixells encara vius del jugador
 */
export function chooseAiShot(difficulty, shotsMap, remainingSizes) {
  const unshot = [];
  const activeHits = [];

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const k = keyOf(r, c);
      const val = shotsMap[k];
      if (!val) {
        unshot.push({ r, c });
      } else if (val === 'tocat') {
        activeHits.push({ r, c });
      }
    }
  }

  if (unshot.length === 0) return null;

  if (difficulty === 'grumet') {
    return unshot[Math.floor(Math.random() * unshot.length)];
  }

  if (difficulty === 'capita') {
    if (activeHits.length > 0) {
      const neighbors = [];
      const linePriority = [];
      const hitSet = new Set(activeHits.map((p) => keyOf(p.r, p.c)));
      const dirs = [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1]
      ];
      for (const h of activeHits) {
        for (const [dr, dc] of dirs) {
          const nr = h.r + dr;
          const nc = h.c + dc;
          if (nr < 0 || nr >= GRID_SIZE || nc < 0 || nc >= GRID_SIZE) continue;
          const nk = keyOf(nr, nc);
          if (shotsMap[nk]) continue;
          const opp = keyOf(h.r - dr, h.c - dc);
          if (hitSet.has(opp)) {
            linePriority.push({ r: nr, c: nc });
          } else {
            neighbors.push({ r: nr, c: nc });
          }
        }
      }
      const pool = linePriority.length > 0 ? linePriority : neighbors;
      if (pool.length > 0) {
        return pool[Math.floor(Math.random() * pool.length)];
      }
    }
    const parity = unshot.filter(({ r, c }) => (r + c) % 2 === 0);
    const pool = parity.length > 0 ? parity : unshot;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  // Almirall: mapa de densitat probabilística tenint en compte vaixells restants i impactes actius
  const scores = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));
  const activeSet = new Set(activeHits.map((p) => keyOf(p.r, p.c)));

  for (const size of remainingSizes) {
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        for (const o of ['H', 'V']) {
          const cells = getShipCells(r, c, size, o);
          if (!cells) continue;

          let blocked = false;
          let hitsCovered = 0;
          for (const cell of cells) {
            const st = shotsMap[keyOf(cell.r, cell.c)];
            if (st === 'aigua' || st === 'enfonsat') {
              blocked = true;
              break;
            }
            if (st === 'tocat') hitsCovered++;
          }
          if (blocked) continue;

          const weight = activeSet.size > 0
            ? (hitsCovered > 0 ? Math.pow(18, hitsCovered) : 0)
            : 1;
          if (weight === 0) continue;

          for (const cell of cells) {
            if (!shotsMap[keyOf(cell.r, cell.c)]) {
              scores[cell.r][cell.c] += weight;
            }
          }
        }
      }
    }
  }

  let bestScore = -1;
  let bestCells = [];
  for (const { r, c } of unshot) {
    const s = scores[r][c];
    if (s > bestScore) {
      bestScore = s;
      bestCells = [{ r, c }];
    } else if (s === bestScore) {
      bestCells.push({ r, c });
    }
  }

  if (bestScore <= 0) {
    return chooseAiShot('capita', shotsMap, remainingSizes);
  }
  return bestCells[Math.floor(Math.random() * bestCells.length)];
}
