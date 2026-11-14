/* SPDX-License-Identifier: AGPL-3.0-or-later */
/* Generador lleuger de codis QR en SVG (mode Byte, nivell L, versions 1-5) */

const QR_SPECS = [
  { version: 1, size: 21, dataBytes: 19, ecBytes: 7, align: [] },
  { version: 2, size: 25, dataBytes: 34, ecBytes: 10, align: [6, 18] },
  { version: 3, size: 29, dataBytes: 55, ecBytes: 15, align: [6, 22] },
  { version: 4, size: 33, dataBytes: 80, ecBytes: 20, align: [6, 26] },
  { version: 5, size: 37, dataBytes: 108, ecBytes: 26, align: [6, 30] }
];

// Taules GF(256) amb polinomi primitiu 0x11D
const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) GF_EXP[i] = GF_EXP[i - 255];
})();

function gfMul(a, b) {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[GF_LOG[a] + GF_LOG[b]];
}

function rsGenerator(degree) {
  let poly = [1];
  for (let i = 0; i < degree; i++) {
    const next = new Array(poly.length + 1).fill(0);
    const root = GF_EXP[i];
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= poly[j];
      next[j + 1] ^= gfMul(poly[j], root);
    }
    poly = next;
  }
  return poly;
}

function rsRemainder(data, ecLen) {
  const gen = rsGenerator(ecLen);
  const res = new Uint8Array(data.length + ecLen);
  res.set(data);
  for (let i = 0; i < data.length; i++) {
    const factor = res[i];
    if (factor !== 0) {
      for (let j = 0; j < gen.length; j++) {
        res[i + j] ^= gfMul(gen[j], factor);
      }
    }
  }
  return res.slice(data.length);
}

function encodeBytes(text) {
  const bytes = new TextEncoder().encode(text);
  const spec = QR_SPECS.find((s) => bytes.length + 2 <= s.dataBytes);
  if (!spec) throw new Error('Text massa llarg per al codi QR');

  const bits = [];
  const pushBits = (val, len) => {
    for (let i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1);
  };

  pushBits(0b0100, 4); // Mode Byte
  pushBits(bytes.length, 8);
  for (const b of bytes) pushBits(b, 8);

  const maxBits = spec.dataBytes * 8;
  const termLen = Math.min(4, maxBits - bits.length);
  pushBits(0, termLen);
  while (bits.length % 8 !== 0) bits.push(0);

  const data = new Uint8Array(spec.dataBytes);
  for (let i = 0; i < bits.length / 8; i++) {
    let byte = 0;
    for (let b = 0; b < 8; b++) byte = (byte << 1) | bits[i * 8 + b];
    data[i] = byte;
  }
  const pads = [0xec, 0x11];
  for (let i = bits.length / 8, p = 0; i < spec.dataBytes; i++, p = 1 - p) {
    data[i] = pads[p];
  }

  const ec = rsRemainder(data, spec.ecBytes);
  const allBytes = new Uint8Array(data.length + ec.length);
  allBytes.set(data);
  allBytes.set(ec, data.length);

  return { spec, allBytes };
}

function buildMatrix(spec, allBytes) {
  const n = spec.size;
  const mod = Array.from({ length: n }, () => new Int8Array(n)); // 0 empty, 1 dark, -1 light
  const fn = Array.from({ length: n }, () => new Uint8Array(n));

  const setFn = (r, c, dark) => {
    if (r >= 0 && r < n && c >= 0 && c < n) {
      mod[r][c] = dark ? 1 : -1;
      fn[r][c] = 1;
    }
  };

  const drawFinder = (r0, c0) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const dark =
          r >= 0 && r <= 6 && c >= 0 && c <= 6 &&
          (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4));
        setFn(r0 + r, c0 + c, dark);
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, n - 7);
  drawFinder(n - 7, 0);

  // Patrons d'alineació
  for (const ar of spec.align) {
    for (const ac of spec.align) {
      if (fn[ar][ac]) continue;
      for (let r = -2; r <= 2; r++) {
        for (let c = -2; c <= 2; c++) {
          const dark = Math.max(Math.abs(r), Math.abs(c)) !== 1;
          setFn(ar + r, ac + c, dark);
        }
      }
    }
  }

  // Patrons de temporització
  for (let i = 8; i < n - 8; i++) {
    setFn(6, i, i % 2 === 0);
    setFn(i, 6, i % 2 === 0);
  }

  // Mòdul fosc obligatori i reserva de format
  setFn(n - 8, 8, true);
  for (let i = 0; i < 9; i++) {
    if (!fn[8][i]) fn[8][i] = 1;
    if (!fn[i][8]) fn[i][8] = 1;
  }
  for (let i = 0; i < 8; i++) {
    if (!fn[8][n - 1 - i]) fn[8][n - 1 - i] = 1;
    if (!fn[n - 1 - i][8]) fn[n - 1 - i][8] = 1;
  }

  // Col·locació dels bits en ziga-zaga
  const totalBits = allBytes.length * 8;
  let bitIdx = 0;
  let up = true;
  for (let col = n - 1; col >= 1; col -= 2) {
    if (col === 6) col--;
    for (let step = 0; step < n; step++) {
      const r = up ? n - 1 - step : step;
      for (let dc = 0; dc < 2; dc++) {
        const c = col - dc;
        if (fn[r][c]) continue;
        let bit = 0;
        if (bitIdx < totalBits) {
          bit = (allBytes[bitIdx >>> 3] >>> (7 - (bitIdx & 7))) & 1;
          bitIdx++;
        }
        mod[r][c] = bit ? 1 : -1;
      }
    }
    up = !up;
  }

  return { n, mod, fn };
}

const MASK_FNS = [
  (r, c) => (r + c) % 2 === 0,
  (r) => r % 2 === 0,
  (_, c) => c % 3 === 0,
  (r, c) => (r + c) % 3 === 0,
  (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
  (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
  (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
  (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0
];

function formatBits(maskId) {
  // EC Level L = 01
  const data = (0b01 << 3) | maskId;
  let rem = data << 10;
  const poly = 0b10100110111;
  for (let i = 14; i >= 10; i--) {
    if ((rem >>> i) & 1) rem ^= poly << (i - 10);
  }
  return ((data << 10) | rem) ^ 0b101010000010010;
}

function applyMaskAndFormat(base, maskId) {
  const { n, mod, fn } = base;
  const grid = mod.map((row) => new Int8Array(row));
  const mfn = MASK_FNS[maskId];

  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (!fn[r][c] && mfn(r, c)) {
        grid[r][c] = -grid[r][c];
      }
    }
  }

  const fmt = formatBits(maskId);
  const putFmt = (r, c, bit) => { grid[r][c] = bit ? 1 : -1; };
  for (let i = 0; i < 6; i++) putFmt(8, i, (fmt >>> i) & 1);
  putFmt(8, 7, (fmt >>> 6) & 1);
  putFmt(8, 8, (fmt >>> 7) & 1);
  putFmt(7, 8, (fmt >>> 8) & 1);
  for (let i = 9; i < 15; i++) putFmt(14 - i, 8, (fmt >>> i) & 1);

  for (let i = 0; i < 8; i++) putFmt(n - 1 - i, 8, (fmt >>> i) & 1);
  for (let i = 8; i < 15; i++) putFmt(8, n - 15 + i, (fmt >>> i) & 1);

  return grid;
}

function penaltyScore(grid, n) {
  let score = 0;
  // Regla 1: ratxes >= 5
  for (let r = 0; r < n; r++) {
    let runR = 1, runC = 1;
    for (let i = 1; i < n; i++) {
      if (grid[r][i] === grid[r][i - 1]) runR++;
      else { if (runR >= 5) score += runR - 2; runR = 1; }
      if (grid[i][r] === grid[i - 1][r]) runC++;
      else { if (runC >= 5) score += runC - 2; runC = 1; }
    }
    if (runR >= 5) score += runR - 2;
    if (runC >= 5) score += runC - 2;
  }
  // Regla 2: blocs 2x2
  for (let r = 0; r < n - 1; r++) {
    for (let c = 0; c < n - 1; c++) {
      const v = grid[r][c];
      if (v === grid[r][c + 1] && v === grid[r + 1][c] && v === grid[r + 1][c + 1]) score += 3;
    }
  }
  return score;
}

export function renderQrSvg(text, darkColor = '#17324d', lightColor = '#fffdf8') {
  const { spec, allBytes } = encodeBytes(text);
  const base = buildMatrix(spec, allBytes);

  let bestGrid = null;
  let bestScore = Infinity;
  for (let m = 0; m < 8; m++) {
    const g = applyMaskAndFormat(base, m);
    const s = penaltyScore(g, base.n);
    if (s < bestScore) {
      bestScore = s;
      bestGrid = g;
    }
  }

  const n = base.n;
  const pad = 2;
  const vb = n + pad * 2;
  let path = '';
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (bestGrid[r][c] === 1) {
        path += `M${c + pad},${r + pad}h1v1h-1z`;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vb} ${vb}" shape-rendering="crispEdges" role="img" aria-label="Codi QR de la sala"><rect width="${vb}" height="${vb}" rx="2" fill="${lightColor}"/><path d="${path}" fill="${darkColor}"/></svg>`;
}
