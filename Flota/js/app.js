/* SPDX-License-Identifier: AGPL-3.0-or-later */
/* Controlador principal d'Enfonsar la flota */

import {
  GRID_SIZE,
  ROWS,
  COLS,
  FLEET_SPEC,
  coordLabel,
  keyOf,
  getShipCells,
  getWaterHaloKeys,
  canPlaceShip,
  generateRandomFleet,
  validateCompleteFleet,
  evaluateShot,
  hashFleet,
  randomSalt,
  chooseAiShot
} from './engine.js';
import { soundFX } from './audio.js';
import { renderQrSvg } from './qr.js';
import { OnlineRoomClient, normalizeRoomCode } from './net.js';
import { ONLINE_SESSION_KEY, ROOM_CODE_LENGTH } from './config.js';

const AI_LEVEL_LABELS = {
  grumet: 'Grumet (fàcil)',
  capita: 'Capità (mitjà)',
  almirall: 'Almirall (difícil)'
};

const roomClient = new OnlineRoomClient();

const state = {
  screen: 'home',
  mode: null, // 'ai' | 'online'
  aiDifficulty: 'capita',
  orientation: 'H',
  selectedShipId: FLEET_SPEC[0].id,
  ships: [],
  salt: randomSalt(),
  readySubmitted: false,

  // Estat combat contra IA
  aiShips: [],
  myShots: {},      // "r,c" -> { result, seq }
  aiShots: {},      // "r,c" -> { result, seq }
  mySunkShips: [],  // vaixells rivals enfonsats
  aiSunkShips: [],  // vaixells propis enfonsats
  turn: 'me',       // 'me' | 'rival'
  shotSeq: 0,
  lastMyShotKey: null,
  lastRivalShotKey: null,
  lastEventText: '1 tret per torn · Que comenci la batalla!',
  winner: null,     // 'me' | 'rival' | null

  // Estat en línia
  room: null,
  resolvingPendingSeq: null,
  revealSubmitted: false,
  fairPlayStatus: null, // null | 'ok' | 'mismatch'
  lastHandledShotSeq: 0,
  endSoundPlayed: false,

  // Mòbil i PWA
  pendingAim: null,
  flashTimer: null,
  deferredPrompt: null
};

const $ = (id) => document.getElementById(id);

function showToast(msg) {
  const el = $('toast');
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => {
    el.hidden = true;
  }, 2400);
}

function setHomeError(msg) {
  const el = $('home-error');
  if (!msg) {
    el.hidden = true;
    el.textContent = '';
  } else {
    el.textContent = msg;
    el.hidden = false;
  }
}

function showScreen(name) {
  state.screen = name;
  document.body.classList.toggle('in-game', name !== 'home');
  $('screen-home').hidden = name !== 'home';
  $('screen-place').hidden = name !== 'place';
  $('screen-battle').hidden = name !== 'battle';
  $('btn-exit').hidden = name === 'home';
}

function saveOnlineSession() {
  if (state.mode !== 'online' || !roomClient.roomCode) return;
  try {
    localStorage.setItem(
      ONLINE_SESSION_KEY,
      JSON.stringify({
        roomCode: roomClient.roomCode,
        role: roomClient.role,
        ships: state.ships,
        salt: state.salt,
        savedAt: Date.now()
      })
    );
  } catch (_) {}
}

function loadOnlineSession() {
  try {
    const raw = localStorage.getItem(ONLINE_SESSION_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data?.roomCode || Date.now() - (data.savedAt || 0) > 12 * 3600 * 1000) {
      localStorage.removeItem(ONLINE_SESSION_KEY);
      return null;
    }
    return data;
  } catch (_) {
    return null;
  }
}

function clearOnlineSession() {
  try {
    localStorage.removeItem(ONLINE_SESSION_KEY);
  } catch (_) {}
}

function refreshResumeBar() {
  const saved = loadOnlineSession();
  const bar = $('resume-bar');
  if (saved && saved.roomCode) {
    $('resume-code').textContent = saved.roomCode;
    bar.hidden = false;
  } else {
    bar.hidden = true;
  }
}

/* ---------- Instal·lació PWA ---------- */
function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

function updateInstallUI() {
  const installed = isStandalone();
  $('btn-install-top').hidden = installed;
  $('mobile-install-card').hidden = installed;
}

function openInstallGuide() {
  const ua = navigator.userAgent || '';
  const isIOS = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const body = $('install-guide-body');

  if (isIOS) {
    body.innerHTML = `
      <p>A l'iPhone o l'iPad pots desar el joc a la pantalla d'inici en dos passos:</p>
      <ol class="install-steps">
        <li>Prem el botó <strong>Compartir</strong> (el quadrat amb una fletxa cap amunt) a la barra inferior o superior de Safari.</li>
        <li>Desplaça't avall i toca <strong>«Afegeix a la pantalla d'inici»</strong>.</li>
      </ol>
    `;
  } else {
    body.innerHTML = `
      <p>Pots instal·lar l'aplicació directament des del navegador:</p>
      <ol class="install-steps">
        <li>Obre el menú del navegador (les tres ratlles o els tres punts <strong>⋮</strong>).</li>
        <li>Tria <strong>«Instal·la l'aplicació»</strong> o <strong>«Afegeix a la pantalla d'inici»</strong>.</li>
      </ol>
    `;
  }
  $('modal-install').showModal();
}

async function handleInstallClick() {
  if (state.deferredPrompt) {
    state.deferredPrompt.prompt();
    try {
      const choice = await state.deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        showToast('Aplicació instal·lada!');
      }
    } catch (_) {}
    state.deferredPrompt = null;
    updateInstallUI();
    return;
  }
  openInstallGuide();
}

/* ---------- Utilitats de tauler ---------- */
function buildBoardGrid(container, { interactive = false, onCellClick, onCellHover, onBoardLeave, onDropCell } = {}) {
  container.innerHTML = '';
  const grid = document.createElement('div');
  grid.className = 'board-grid';

  // Cantonada buida
  grid.appendChild(document.createElement('div'));

  for (let c = 0; c < GRID_SIZE; c++) {
    const lbl = document.createElement('div');
    lbl.className = 'coord-label';
    lbl.textContent = String(COLS[c]);
    grid.appendChild(lbl);
  }

  for (let r = 0; r < GRID_SIZE; r++) {
    const rowLbl = document.createElement('div');
    rowLbl.className = 'coord-label';
    rowLbl.textContent = ROWS[r];
    grid.appendChild(rowLbl);

    for (let c = 0; c < GRID_SIZE; c++) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cell' + (interactive ? ' interactive' : '');
      btn.dataset.r = String(r);
      btn.dataset.c = String(c);
      btn.setAttribute('aria-label', coordLabel(r, c));

      if (onCellClick) {
        btn.addEventListener('click', () => onCellClick(r, c));
      }
      if (onCellHover) {
        btn.addEventListener('mouseenter', () => onCellHover(r, c));
      }
      if (onDropCell) {
        btn.addEventListener('dragover', (e) => {
          e.preventDefault();
          if (onCellHover) onCellHover(r, c);
        });
        btn.addEventListener('drop', (e) => {
          e.preventDefault();
          const shipId = e.dataTransfer?.getData('text/plain');
          onDropCell(r, c, shipId);
        });
      }
      grid.appendChild(btn);
    }
  }

  if (onBoardLeave) {
    grid.addEventListener('mouseleave', onBoardLeave);
  }
  container.appendChild(grid);
}

function paintShipsOnGrid(gridContainer, ships, extraClass = 'ship') {
  for (const s of ships) {
    const cells = getShipCells(s.r, s.c, s.size, s.o);
    if (!cells) continue;
    cells.forEach((cell, idx) => {
      const el = gridContainer.querySelector(`.cell[data-r="${cell.r}"][data-c="${cell.c}"]`);
      if (!el) return;
      el.classList.add(extraClass, s.o === 'H' ? 'ship-h' : 'ship-v');
      if (idx === 0) el.classList.add('ship-start');
      if (idx === cells.length - 1) el.classList.add('ship-end');
    });
  }
}

/* ---------- Fase 1: Col·locació ---------- */
function enterPlacement(mode) {
  state.mode = mode;
  state.ships = [];
  state.salt = randomSalt();
  state.readySubmitted = false;
  state.selectedShipId = FLEET_SPEC[0].id;
  state.orientation = 'H';
  state.pendingAim = null;
  state.lastHandledShotSeq = 0;
  state.endSoundPlayed = false;
  state.fairPlayStatus = null;
  state.revealSubmitted = false;

  if (mode === 'ai') {
    $('place-mode-badge').textContent = `Contra la màquina · ${AI_LEVEL_LABELS[state.aiDifficulty]}`;
    $('room-share-bar').hidden = true;
    $('place-status-text').textContent = 'Col·loca els 5 vaixells al teu tauler';
  } else {
    $('place-mode-badge').textContent = 'Partida en línia';
    $('place-room-code').textContent = roomClient.roomCode || '-----';
    $('room-share-bar').hidden = false;
    updateOnlinePlacementBanner();
  }

  $('rotate-label').textContent = state.orientation === 'H' ? 'Horitzontal' : 'Vertical';
  buildBoardGrid($('board-place'), {
    interactive: true,
    onCellClick: handlePlaceCellClick,
    onCellHover: handlePlaceHover,
    onBoardLeave: clearPlacePreview,
    onDropCell: handlePlaceDrop
  });

  renderPlacement();
  showScreen('place');
}

function updateOnlinePlacementBanner() {
  if (state.mode !== 'online' || !state.room) return;
  const otherRole = roomClient.role === 'p1' ? 'p2' : 'p1';
  const other = state.room[otherRole];
  if (!other) {
    $('place-status-text').textContent = 'Esperant que el rival entri amb el codi… Pots anar col·locant la flota.';
  } else if (state.readySubmitted && !other.ready) {
    $('place-status-text').textContent = 'Estàs a punt! Esperant que el rival acabi de col·locar els vaixells…';
  } else if (other.ready) {
    $('place-status-text').textContent = 'El rival ja té la flota col·locada!';
  } else {
    $('place-status-text').textContent = 'Rival connectat! Col·loca els teus 5 vaixells.';
  }
}

function clearPlacePreview() {
  $('board-place')
    .querySelectorAll('.preview-ok, .preview-bad')
    .forEach((c) => c.classList.remove('preview-ok', 'preview-bad'));
}

function handlePlaceHover(r, c) {
  if (state.readySubmitted) return;
  clearPlacePreview();
  const spec = FLEET_SPEC.find((s) => s.id === state.selectedShipId);
  if (!spec) return;

  const cells = getShipCells(r, c, spec.size, state.orientation);
  const ok = canPlaceShip(state.ships, spec.id, r, c, spec.size, state.orientation);
  if (!cells) {
    // Mostra fins on cap dins del tauler en vermell
    for (let i = 0; i < spec.size; i++) {
      const nr = state.orientation === 'V' ? r + i : r;
      const nc = state.orientation === 'H' ? c + i : c;
      const cell = $('board-place').querySelector(`.cell[data-r="${nr}"][data-c="${nc}"]`);
      if (cell) cell.classList.add('preview-bad');
    }
    return;
  }
  const cls = ok ? 'preview-ok' : 'preview-bad';
  for (const cell of cells) {
    const el = $('board-place').querySelector(`.cell[data-r="${cell.r}"][data-c="${cell.c}"]`);
    if (el) el.classList.add(cls);
  }
}

function placeShipAt(shipId, r, c, orientation) {
  if (state.readySubmitted) return false;
  const spec = FLEET_SPEC.find((s) => s.id === shipId);
  if (!spec) return false;
  if (!canPlaceShip(state.ships, spec.id, r, c, spec.size, orientation)) {
    return false;
  }
  state.ships = state.ships.filter((s) => s.id !== spec.id);
  state.ships.push({ id: spec.id, name: spec.name, size: spec.size, r, c, o: orientation });
  soundFX.ping(580, 0.08);

  const nextUnplaced = FLEET_SPEC.find((s) => !state.ships.some((p) => p.id === s.id));
  if (nextUnplaced) state.selectedShipId = nextUnplaced.id;
  saveOnlineSession();
  renderPlacement();
  return true;
}

function handlePlaceCellClick(r, c) {
  if (state.readySubmitted) return;

  // Si clica damunt d'un vaixell ja col·locat i no està col·locant-ne un altre a sobre:
  const clickedShip = state.ships.find((s) => {
    const cells = getShipCells(s.r, s.c, s.size, s.o);
    return cells && cells.some((cell) => cell.r === r && cell.c === c);
  });

  if (clickedShip && clickedShip.id === state.selectedShipId) {
    // Intenta girar-lo al mateix lloc; si no cap, el treu al moll
    const alt = clickedShip.o === 'H' ? 'V' : 'H';
    if (canPlaceShip(state.ships, clickedShip.id, clickedShip.r, clickedShip.c, clickedShip.size, alt)) {
      state.orientation = alt;
      $('rotate-label').textContent = alt === 'H' ? 'Horitzontal' : 'Vertical';
      placeShipAt(clickedShip.id, clickedShip.r, clickedShip.c, alt);
    } else {
      state.ships = state.ships.filter((s) => s.id !== clickedShip.id);
      renderPlacement();
    }
    return;
  }

  if (!placeShipAt(state.selectedShipId, r, c, state.orientation) && clickedShip) {
    state.selectedShipId = clickedShip.id;
    state.orientation = clickedShip.o;
    $('rotate-label').textContent = state.orientation === 'H' ? 'Horitzontal' : 'Vertical';
    renderPlacement();
  }
}

function handlePlaceDrop(r, c, droppedId) {
  const id = droppedId || state.selectedShipId;
  clearPlacePreview();
  if (!placeShipAt(id, r, c, state.orientation)) {
    showToast('Deixa 1 casella d’aigua al voltant de cada vaixell.');
  }
}

function toggleOrientation() {
  if (state.readySubmitted) return;
  state.orientation = state.orientation === 'H' ? 'V' : 'H';
  $('rotate-label').textContent = state.orientation === 'H' ? 'Horitzontal' : 'Vertical';
  soundFX.ping(440, 0.06);
}

function renderPlacement() {
  const boardEl = $('board-place');
  boardEl.querySelectorAll('.cell').forEach((cell) => {
    cell.classList.remove('ship', 'ship-h', 'ship-v', 'ship-start', 'ship-end', 'ship-halo', 'preview-ok', 'preview-bad');
    cell.draggable = false;
  });
  paintShipsOnGrid(boardEl, state.ships, 'ship');
  for (const hk of getWaterHaloKeys(state.ships)) {
    const [hr, hc] = hk.split(',');
    const cell = boardEl.querySelector(`.cell[data-r="${hr}"][data-c="${hc}"]`);
    if (cell) cell.classList.add('ship-halo');
  }

  // Permet arrossegar els vaixells ja col·locats
  for (const s of state.ships) {
    const cells = getShipCells(s.r, s.c, s.size, s.o);
    if (!cells) continue;
    for (const cell of cells) {
      const btn = boardEl.querySelector(`.cell[data-r="${cell.r}"][data-c="${cell.c}"]`);
      if (btn && !state.readySubmitted) {
        btn.draggable = true;
        btn.ondragstart = (e) => {
          state.selectedShipId = s.id;
          state.orientation = s.o;
          $('rotate-label').textContent = s.o === 'H' ? 'Horitzontal' : 'Vertical';
          e.dataTransfer?.setData('text/plain', s.id);
        };
      }
    }
  }

  const dock = $('ship-dock');
  dock.innerHTML = '';
  for (const spec of FLEET_SPEC) {
    const placed = state.ships.some((s) => s.id === spec.id);
    const selected = state.selectedShipId === spec.id;
    const item = document.createElement('button');
    item.type = 'button';
    item.className = `dock-item${placed ? ' placed' : ''}${selected ? ' selected' : ''}`;
    item.draggable = !state.readySubmitted;
    item.disabled = state.readySubmitted;
    item.innerHTML = `
      <span class="dock-item-name">${spec.name} (${spec.size})</span>
      <span class="dock-pips">${'<span class="pip"></span>'.repeat(spec.size)}</span>
    `;
    item.addEventListener('click', () => {
      state.selectedShipId = spec.id;
      renderPlacement();
    });
    item.addEventListener('dragstart', (e) => {
      state.selectedShipId = spec.id;
      e.dataTransfer?.setData('text/plain', spec.id);
    });
    dock.appendChild(item);
  }

  $('dock-count').textContent = `${state.ships.length} / ${FLEET_SPEC.length}`;
  const allPlaced = validateCompleteFleet(state.ships);
  const readyBtn = $('btn-ready');
  readyBtn.disabled = !allPlaced || state.readySubmitted;
  readyBtn.textContent = state.readySubmitted ? 'Esperant el rival…' : 'Llesta per combatre!';

  $('btn-random-fleet').disabled = state.readySubmitted;
  $('btn-clear-fleet').disabled = state.readySubmitted;
  $('btn-rotate').disabled = state.readySubmitted;
}

/* ---------- Fase 2: Combat ---------- */
function enterAiBattle() {
  state.aiShips = generateRandomFleet();
  state.myShots = {};
  state.aiShots = {};
  state.mySunkShips = [];
  state.aiSunkShips = [];
  state.turn = 'me';
  state.shotSeq = 0;
  state.lastMyShotKey = null;
  state.lastRivalShotKey = null;
  state.lastEventText = '1 tret per torn · Que comenci la batalla!';
  state.winner = null;
  state.pendingAim = null;
  state.endSoundPlayed = false;

  setupBattleBoards();
  renderBattle();
  showScreen('battle');
}

function setupBattleBoards() {
  buildBoardGrid($('board-mine'), { interactive: false });
  buildBoardGrid($('board-enemy'), {
    interactive: true,
    onCellClick: handleEnemyBoardClick
  });
  $('gameover-banner').hidden = true;
  setMobileBoardView('enemy');
}

function setMobileBoardView(view) {
  $('battle-boards').dataset.mobileView = view;
  document.querySelectorAll('.mobile-tab').forEach((tab) => {
    const active = tab.dataset.tab === view;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-selected', String(active));
  });
}

function flashOwnBoardOnMobile() {
  if (window.innerWidth > 820) return;
  clearTimeout(state.flashTimer);
  setMobileBoardView('mine');
  state.flashTimer = setTimeout(() => {
    if (state.screen === 'battle' && !state.winner) {
      setMobileBoardView('enemy');
    }
  }, 1150);
}

function getShotsMapsFromOnlineRoom(room) {
  const myRole = roomClient.role;
  const rivalRole = myRole === 'p1' ? 'p2' : 'p1';
  const myShots = {};
  const rivalShots = {};
  const mySunkShips = [];
  const rivalSunkShips = [];
  let lastMyShotKey = null;
  let lastRivalShotKey = null;

  const list = Array.isArray(room.shots) ? room.shots : [];
  for (const s of list) {
    const k = keyOf(s.r, s.c);
    if (s.by === myRole) {
      myShots[k] = { result: s.result, seq: s.seq };
      lastMyShotKey = k;
      if (s.sunkShip) mySunkShips.push(s.sunkShip);
    } else if (s.by === rivalRole) {
      rivalShots[k] = { result: s.result, seq: s.seq };
      lastRivalShotKey = k;
      if (s.sunkShip) rivalSunkShips.push(s.sunkShip);
    }
  }
  return { myShots, rivalShots, mySunkShips, rivalSunkShips, lastMyShotKey, lastRivalShotKey, list };
}

async function handleEnemyBoardClick(r, c) {
  if (state.winner) return;
  if (state.turn !== 'me') {
    showToast('Espera el teu torn.');
    return;
  }

  const k = keyOf(r, c);
  if (state.myShots[k]) return;
  if (getWaterHaloKeys(state.mySunkShips).has(k)) {
    showToast('Aquí només hi pot haver aigua.');
    return;
  }

  // Confirmació de doble toc en mòbil si està activada
  const confirmMobile = window.innerWidth <= 820 && $('chk-confirm-shot').checked;
  if (confirmMobile) {
    if (!state.pendingAim || state.pendingAim.r !== r || state.pendingAim.c !== c) {
      state.pendingAim = { r, c };
      renderBattle();
      showToast(`Torna a tocar ${coordLabel(r, c)} per disparar`);
      return;
    }
    state.pendingAim = null;
    $('toast').hidden = true;
  }

  if (state.mode === 'ai') {
    fireAgainstAi(r, c);
  } else if (state.mode === 'online') {
    if (state.room?.pendingShot) return;
    try {
      state.turn = 'pending';
      state.pendingShotKey = k;
      renderBattle();
      await roomClient.sendShot(r, c);
    } catch (err) {
      state.pendingShotKey = null;
      state.turn = 'me';
      renderBattle();
      showToast('No s’ha pogut enviar el tret. Torna-ho a provar.');
    }
  }
}

function fireAgainstAi(r, c) {
  const hitsMap = {};
  for (const [k, v] of Object.entries(state.myShots)) {
    if (v.result !== 'aigua') hitsMap[k] = true;
  }

  const outcome = evaluateShot(state.aiShips, hitsMap, r, c);
  state.shotSeq += 1;
  const k = keyOf(r, c);
  state.myShots[k] = { result: outcome.result, seq: state.shotSeq };
  state.lastMyShotKey = k;

  if (outcome.result === 'aigua') {
    soundFX.water();
    state.lastEventText = `Tu → ${coordLabel(r, c)}: Aigua!`;
  } else if (outcome.result === 'tocat') {
    soundFX.hit();
    state.lastEventText = `Tu → ${coordLabel(r, c)}: Tocat!`;
  } else {
    soundFX.sunk();
    state.mySunkShips.push(outcome.sunkShip);
    state.lastEventText = `Tu → ${coordLabel(r, c)}: ${outcome.sunkShip.name} tocat i enfonsat!`;
  }

  if (outcome.allSunk) {
    state.winner = 'me';
    state.turn = 'done';
    renderBattle();
    return;
  }

  state.turn = 'rival';
  renderBattle();

  const delayMs = outcome.result === 'aigua' ? 560 : 760;
  setTimeout(() => {
    if (state.screen !== 'battle' || state.mode !== 'ai' || state.winner) return;
    performAiTurn();
  }, delayMs);
}

function performAiTurn() {
  const aiHitsMap = {};
  const aiShotsSimple = {};
  for (const [k, v] of Object.entries(state.aiShots)) {
    aiShotsSimple[k] = v.result;
    if (v.result !== 'aigua') aiHitsMap[k] = true;
  }
  // Marca els enfonsats perquè Almirall sàpiga quins impactes ja pertanyen a vaixells enfonsats
  for (const sunk of state.aiSunkShips) {
    const cells = getShipCells(sunk.r, sunk.c, sunk.size, sunk.o);
    if (cells) {
      for (const cell of cells) aiShotsSimple[keyOf(cell.r, cell.c)] = 'enfonsat';
    }
  }

  const sunkIds = new Set(state.aiSunkShips.map((s) => s.id));
  const remainingSizes = FLEET_SPEC.filter((s) => !sunkIds.has(s.id)).map((s) => s.size);
  const clearedHalo = getWaterHaloKeys(state.aiSunkShips);
  const pick = chooseAiShot(state.aiDifficulty, aiShotsSimple, remainingSizes, clearedHalo);
  if (!pick) return;

  const outcome = evaluateShot(state.ships, aiHitsMap, pick.r, pick.c);
  state.shotSeq += 1;
  const k = keyOf(pick.r, pick.c);
  state.aiShots[k] = { result: outcome.result, seq: state.shotSeq };
  state.lastRivalShotKey = k;

  if (outcome.result === 'aigua') {
    soundFX.water();
    state.lastEventText = `Màquina → ${coordLabel(pick.r, pick.c)}: Aigua!`;
  } else if (outcome.result === 'tocat') {
    soundFX.hit();
    state.lastEventText = `Màquina → ${coordLabel(pick.r, pick.c)}: Tocat!`;
  } else {
    soundFX.sunk();
    state.aiSunkShips.push(outcome.sunkShip);
    state.lastEventText = `Màquina → ${coordLabel(pick.r, pick.c)}: T'ha enfonsat el ${outcome.sunkShip.name.toLowerCase()}!`;
  }

  if (outcome.allSunk) {
    state.winner = 'rival';
    state.turn = 'done';
  } else {
    state.turn = 'me';
    flashOwnBoardOnMobile();
  }
  renderBattle();
}

function paintShotsOnGrid(gridContainer, shotsMap, sunkShips, lastShotKey) {
  const isEnemyBoard = gridContainer.id === 'board-enemy';
  gridContainer.querySelectorAll('.cell').forEach((cell) => {
    cell.classList.remove('shot-aigua', 'shot-tocat', 'shot-enfonsat', 'shot-halo', 'shot-pending', 'last-shot', 'aim-pending', 'ship-reveal');
    if (isEnemyBoard) cell.classList.add('interactive');
  });

  for (const hk of getWaterHaloKeys(sunkShips)) {
    if (shotsMap[hk]) continue;
    const [hr, hc] = hk.split(',');
    const cell = gridContainer.querySelector(`.cell[data-r="${hr}"][data-c="${hc}"]`);
    if (cell) {
      cell.classList.add('shot-halo');
      cell.classList.remove('interactive');
    }
  }

  for (const [k, info] of Object.entries(shotsMap)) {
    const [r, c] = k.split(',');
    const cell = gridContainer.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`);
    if (!cell) continue;
    cell.classList.add(`shot-${info.result}`);
    cell.classList.remove('interactive');
    if (k === lastShotKey) cell.classList.add('last-shot');
  }

  for (const sunk of sunkShips) {
    const cells = getShipCells(sunk.r, sunk.c, sunk.size, sunk.o);
    if (!cells) continue;
    cells.forEach((p, idx) => {
      const cell = gridContainer.querySelector(`.cell[data-r="${p.r}"][data-c="${p.c}"]`);
      if (!cell) return;
      cell.classList.remove('shot-tocat', 'interactive');
      cell.classList.add('shot-enfonsat', 'ship', sunk.o === 'H' ? 'ship-h' : 'ship-v');
      if (idx === 0) cell.classList.add('ship-start');
      if (idx === cells.length - 1) cell.classList.add('ship-end');
    });
  }
}

function renderFleetStrip(container, sunkShips) {
  const sunkIds = new Set(sunkShips.map((s) => s.id));
  container.innerHTML = FLEET_SPEC.map(
    (s) => `<span class="fleet-chip${sunkIds.has(s.id) ? ' sunk' : ''}">${s.name} (${s.size})</span>`
  ).join('');
}

function renderBattle() {
  const mineGrid = $('board-mine');
  const enemyGrid = $('board-enemy');

  // Neteja classes de vaixell prèvies i pinta els propis
  mineGrid.querySelectorAll('.cell').forEach((c) => {
    c.classList.remove('ship', 'ship-h', 'ship-v', 'ship-start', 'ship-end');
  });
  paintShipsOnGrid(mineGrid, state.ships, 'ship');

  enemyGrid.querySelectorAll('.cell').forEach((c) => {
    c.classList.remove('ship', 'ship-h', 'ship-v', 'ship-start', 'ship-end');
  });

  const rivalShots = state.mode === 'ai' ? state.aiShots : state.rivalShotsOnline || {};
  paintShotsOnGrid(mineGrid, rivalShots, state.aiSunkShips, state.lastRivalShotKey);
  paintShotsOnGrid(enemyGrid, state.myShots, state.mySunkShips, state.lastMyShotKey);

  if (state.pendingAim) {
    const aimEl = enemyGrid.querySelector(`.cell[data-r="${state.pendingAim.r}"][data-c="${state.pendingAim.c}"]`);
    if (aimEl) aimEl.classList.add('aim-pending');
  }
  if (state.turn === 'pending' && state.pendingShotKey && !state.myShots[state.pendingShotKey]) {
    const [pr, pc] = state.pendingShotKey.split(',');
    const pEl = enemyGrid.querySelector(`.cell[data-r="${pr}"][data-c="${pc}"]`);
    if (pEl) pEl.classList.add('shot-pending');
  }

  // En acabar, mostra els vaixells rivals que han quedat intactes
  if (state.winner) {
    const revealFleet = state.mode === 'ai' ? state.aiShips : state.rivalRevealShips || [];
    const sunkIds = new Set(state.mySunkShips.map((s) => s.id));
    const remaining = revealFleet.filter((s) => !sunkIds.has(s.id));
    paintShipsOnGrid(enemyGrid, remaining, 'ship-reveal');
  }

  // Resums i HUD
  const myAlive = FLEET_SPEC.length - state.aiSunkShips.length;
  const enemyRemaining = FLEET_SPEC.length - state.mySunkShips.length;
  $('mine-summary').textContent = `${myAlive} ${myAlive === 1 ? 'vaixell operatiu' : 'vaixells operatius'}`;
  $('enemy-summary').textContent = `${enemyRemaining} ${enemyRemaining === 1 ? 'vaixell per enfonsar' : 'vaixells per enfonsar'}`;
  $('badge-enemy-sunk').textContent = `${state.mySunkShips.length}/${FLEET_SPEC.length}`;
  $('badge-mine-sunk').textContent = `${state.aiSunkShips.length}/${FLEET_SPEC.length}`;

  renderFleetStrip($('fleet-status-mine'), state.aiSunkShips);
  renderFleetStrip($('fleet-status-enemy'), state.mySunkShips);

  const turnPill = $('turn-pill');
  const turnText = $('turn-text');
  if (state.winner) {
    turnPill.dataset.turn = 'done';
    turnText.textContent = state.winner === 'me' ? 'Partida acabada · Has guanyat!' : 'Partida acabada · Has perdut';
  } else if (state.turn === 'me') {
    turnPill.dataset.turn = 'me';
    turnText.textContent = 'El teu torn · Dispara al mar enemic';
  } else {
    turnPill.dataset.turn = 'rival';
    turnText.textContent = state.mode === 'ai' ? 'Torn de la màquina…' : 'Torn del rival…';
  }
  $('last-event').textContent = state.lastEventText;

  // Pantalla de victòria/derrota
  const banner = $('gameover-banner');
  if (state.winner) {
    banner.hidden = false;
    banner.className = `gameover-banner ${state.winner === 'me' ? 'win' : 'lose'}`;
    $('gameover-title').textContent = state.winner === 'me' ? 'Victòria! Has enfonsat tota la flota!' : 'Derrota! Han enfonsat la teva flota';
    $('gameover-subtitle').textContent =
      state.mode === 'ai'
        ? `Partida contra ${AI_LEVEL_LABELS[state.aiDifficulty]}.`
        : `Sala ${roomClient.roomCode}.`;

    const shotsArr = Object.values(state.myShots);
    const totalShots = shotsArr.length;
    const hits = shotsArr.filter((s) => s.result !== 'aigua').length;
    const acc = totalShots > 0 ? Math.round((hits / totalShots) * 100) : 0;

    $('gameover-stats').innerHTML = `
      <div class="stat-box"><strong>${totalShots}</strong><span>Trets fets</span></div>
      <div class="stat-box"><strong>${acc}%</strong><span>Precisió</span></div>
      <div class="stat-box"><strong>${myAlive}/5</strong><span>Vaixells salvats</span></div>
    `;

    const fp = $('gameover-fairplay');
    if (state.mode === 'online' && state.fairPlayStatus === 'ok') {
      fp.textContent = 'Flota rival verificada amb hash SHA-256 (joc net confirmat).';
      fp.hidden = false;
    } else if (state.mode === 'online' && state.fairPlayStatus === 'mismatch') {
      fp.textContent = 'Avís: el tauler revelat no coincideix amb l’empremta inicial.';
      fp.hidden = false;
    } else {
      fp.hidden = true;
    }

    const rematchBtn = $('btn-rematch');
    if (state.mode === 'online' && state.room?.rematch?.[roomClient.role]) {
      rematchBtn.disabled = true;
      rematchBtn.textContent = 'Esperant el rival…';
    } else {
      rematchBtn.disabled = false;
      rematchBtn.textContent = 'Tornar a jugar';
    }

    if (!state.endSoundPlayed) {
      state.endSoundPlayed = true;
      if (state.winner === 'me') soundFX.win();
      else soundFX.lose();
    }
  } else {
    banner.hidden = true;
  }
}

/* ---------- Sincronització en línia ---------- */
async function handleOnlineRoomUpdate(room) {
  state.room = room;
  const myRole = roomClient.role;
  const rivalRole = myRole === 'p1' ? 'p2' : 'p1';
  const me = room[myRole];
  const rival = room[rivalRole];

  // Si venim d'una represa/revanxa on tots dos van reiniciar
  if ((room.status === 'waiting' || room.status === 'placing') && state.screen === 'battle') {
    enterPlacement('online');
    return;
  }

  if (room.status === 'waiting' || room.status === 'placing') {
    state.readySubmitted = Boolean(me?.ready);
    if (state.screen !== 'place') {
      enterPlacement('online');
    } else {
      updateOnlinePlacementBanner();
      renderPlacement();
    }
    return;
  }

  // Estem en 'playing' o 'finished'
  if (state.screen !== 'battle') {
    setupBattleBoards();
    showScreen('battle');
  }

  const parsed = getShotsMapsFromOnlineRoom(room);
  state.myShots = parsed.myShots;
  if (state.pendingShotKey && state.myShots[state.pendingShotKey]) {
    state.pendingShotKey = null;
  }
  state.rivalShotsOnline = parsed.rivalShots;
  state.mySunkShips = parsed.mySunkShips;
  state.aiSunkShips = parsed.rivalSunkShips;
  state.lastMyShotKey = parsed.lastMyShotKey;
  state.lastRivalShotKey = parsed.lastRivalShotKey;

  if (parsed.list.length > 0) {
    const last = parsed.list[parsed.list.length - 1];
    const who = last.by === myRole ? 'Tu' : 'Rival';
    const label = coordLabel(last.r, last.c);
    if (last.result === 'aigua') state.lastEventText = `${who} → ${label}: Aigua!`;
    else if (last.result === 'tocat') state.lastEventText = `${who} → ${label}: Tocat!`;
    else state.lastEventText = `${who} → ${label}: ${last.sunkShip?.name || 'Vaixell'} tocat i enfonsat!`;

    if (last.seq > state.lastHandledShotSeq) {
      state.lastHandledShotSeq = last.seq;
      if (last.result === 'aigua') soundFX.water();
      else if (last.result === 'tocat') soundFX.hit();
      else soundFX.sunk();

      if (last.by !== myRole && room.status === 'playing') {
        flashOwnBoardOnMobile();
      }
    }
  } else {
    state.lastEventText = '1 tret per torn · Que comenci la batalla!';
  }

  // Si hi ha un tret pendent dirigit contra mi, l'avaluo automàticament
  if (
    room.status === 'playing' &&
    room.pendingShot &&
    room.pendingShot.by !== myRole &&
    state.resolvingPendingSeq !== room.pendingShot.seq
  ) {
    state.resolvingPendingSeq = room.pendingShot.seq;
    const prevHits = {};
    for (const [k, v] of Object.entries(parsed.rivalShots)) {
      if (v.result !== 'aigua') prevHits[k] = true;
    }
    const outcome = evaluateShot(state.ships, prevHits, room.pendingShot.r, room.pendingShot.c);
    const revealIfDone = outcome.allSunk ? { ships: state.ships, salt: state.salt } : null;
    if (revealIfDone) state.revealSubmitted = true;

    try {
      await roomClient.resolvePendingShot(room.pendingShot.seq, outcome, revealIfDone);
    } catch (err) {
      state.resolvingPendingSeq = null;
    }
    return;
  }

  if (room.status === 'finished') {
    state.winner = room.winner === myRole ? 'me' : 'rival';
    state.turn = 'done';

    if (!state.revealSubmitted && !me?.reveal && validateCompleteFleet(state.ships)) {
      state.revealSubmitted = true;
      roomClient.submitReveal({ ships: state.ships, salt: state.salt }).catch(() => {
        state.revealSubmitted = false;
      });
    }

    if (rival?.reveal?.ships && rival?.reveal?.salt) {
      state.rivalRevealShips = rival.reveal.ships;
      if (rival.hash && state.fairPlayStatus === null) {
        const computed = await hashFleet(rival.reveal.ships, rival.reveal.salt);
        state.fairPlayStatus = computed === rival.hash ? 'ok' : 'mismatch';
      }
    }
  } else {
    state.winner = null;
    state.turn = room.turn === myRole ? 'me' : 'rival';
  }

  renderBattle();
}

async function createOnlineGame() {
  setHomeError('');
  const btn = $('btn-create-room');
  btn.disabled = true;
  btn.textContent = 'Creant sala…';
  try {
    await roomClient.createRoom(handleOnlineRoomUpdate, () => {
      showToast('Connexió interrompuda. Reintentant…');
    });
    enterPlacement('online');
    saveOnlineSession();
  } catch (err) {
    setHomeError(err.message || 'No s’ha pogut crear la sala.');
  } finally {
    btn.disabled = false;
    btn.innerHTML = `
      <svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M12 5v14M5 12h14"/>
      </svg>
      Crea una sala i genera codi
    `;
  }
}

async function joinOnlineGame(rawCode, savedSession = null) {
  setHomeError('');
  const btn = $('btn-join-room');
  btn.disabled = true;
  try {
    await roomClient.joinRoom(rawCode, handleOnlineRoomUpdate, () => {
      showToast('Connexió interrompuda. Reintentant…');
    });
    if (savedSession && Array.isArray(savedSession.ships) && savedSession.ships.length) {
      state.ships = savedSession.ships;
      state.salt = savedSession.salt || randomSalt();
    }
    enterPlacement('online');
    saveOnlineSession();
  } catch (err) {
    setHomeError(err.message || 'No s’ha pogut entrar a la sala.');
  } finally {
    btn.disabled = false;
  }
}

/* ---------- Inicialització i esdeveniments ---------- */
function init() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    state.deferredPrompt = e;
    updateInstallUI();
  });

  window.addEventListener('appinstalled', () => {
    state.deferredPrompt = null;
    updateInstallUI();
    showToast('Enfonsar la flota instal·lada!');
  });

  updateInstallUI();
  $('btn-install-top').addEventListener('click', handleInstallClick);
  $('btn-install-card').addEventListener('click', handleInstallClick);

  // So (utilitza toggleAttribute perquè SVGElement no vincula .hidden a l'atribut)
  const syncSoundBtn = () => {
    const btn = $('btn-sound');
    const isMuted = soundFX.muted;
    btn.setAttribute('aria-pressed', String(isMuted));
    btn.setAttribute('aria-label', isMuted ? 'Activa el so' : 'Silencia el so');
    btn.title = isMuted ? 'So silenciat (clica per activar-lo)' : 'So activat (clica per silenciar-lo)';
    btn.classList.toggle('is-muted', isMuted);
    btn.querySelector('.ic-sound-on').toggleAttribute('hidden', isMuted);
    btn.querySelector('.ic-sound-off').toggleAttribute('hidden', !isMuted);
  };
  syncSoundBtn();

  // Desbloqueig automàtic de Web Audio al primer gest d'usuari
  window.addEventListener('pointerdown', () => soundFX.unlock(), { once: true, passive: true });
  window.addEventListener('keydown', () => soundFX.unlock(), { once: true, passive: true });

  $('btn-sound').addEventListener('click', () => {
    soundFX.toggleMute();
    syncSoundBtn();
    if (!soundFX.muted) {
      soundFX.ping(720, 0.12);
      showToast('So activat');
    } else {
      showToast('So silenciat');
    }
  });

  // Modals
  document.querySelectorAll('[data-close]').forEach((btn) => {
    btn.addEventListener('click', () => $(btn.dataset.close)?.close());
  });
  document.querySelectorAll('dialog.modal').forEach((dlg) => {
    dlg.addEventListener('click', (ev) => {
      if (ev.target === dlg) dlg.close();
    });
  });
  $('btn-rules').addEventListener('click', () => $('modal-rules').showModal());

  // Navegació i sortida
  const exitToHome = () => {
    clearTimeout(state.flashTimer);
    if (state.mode === 'online') {
      roomClient.disconnect();
    }
    state.mode = null;
    state.room = null;
    state.winner = null;
    refreshResumeBar();
    showScreen('home');
  };

  $('btn-brand').addEventListener('click', () => {
    if (state.screen !== 'home') exitToHome();
  });
  $('btn-exit').addEventListener('click', exitToHome);
  $('btn-gameover-home').addEventListener('click', () => {
    clearOnlineSession();
    exitToHome();
  });

  // Nivells IA
  document.querySelectorAll('.level-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      state.aiDifficulty = chip.dataset.level;
      document.querySelectorAll('.level-chip').forEach((c) => {
        const active = c === chip;
        c.classList.toggle('active', active);
        c.setAttribute('aria-checked', String(active));
      });
    });
  });

  $('btn-play-ai').addEventListener('click', () => enterPlacement('ai'));
  $('btn-create-room').addEventListener('click', createOnlineGame);

  $('input-room-code').addEventListener('input', (e) => {
    e.target.value = normalizeRoomCode(e.target.value);
  });
  $('form-join-room').addEventListener('submit', (e) => {
    e.preventDefault();
    joinOnlineGame($('input-room-code').value);
  });

  // Represa de sessió guardada
  refreshResumeBar();
  $('btn-resume').addEventListener('click', () => {
    const saved = loadOnlineSession();
    if (saved) joinOnlineGame(saved.roomCode, saved);
  });
  $('btn-discard-session').addEventListener('click', () => {
    clearOnlineSession();
    refreshResumeBar();
  });

  // Eines de col·locació
  $('btn-rotate').addEventListener('click', toggleOrientation);
  document.addEventListener('keydown', (e) => {
    if (state.screen === 'place' && (e.key === 'r' || e.key === 'R')) {
      toggleOrientation();
    }
  });

  $('btn-random-fleet').addEventListener('click', () => {
    if (state.readySubmitted) return;
    state.ships = generateRandomFleet();
    soundFX.ping(680, 0.1);
    saveOnlineSession();
    renderPlacement();
  });

  $('btn-clear-fleet').addEventListener('click', () => {
    if (state.readySubmitted) return;
    state.ships = [];
    state.selectedShipId = FLEET_SPEC[0].id;
    saveOnlineSession();
    renderPlacement();
  });

  $('btn-ready').addEventListener('click', async () => {
    if (!validateCompleteFleet(state.ships)) return;
    if (state.mode === 'ai') {
      enterAiBattle();
      return;
    }
    state.readySubmitted = true;
    renderPlacement();
    saveOnlineSession();
    try {
      const hash = await hashFleet(state.ships, state.salt);
      await roomClient.setReady(hash);
    } catch (err) {
      state.readySubmitted = false;
      renderPlacement();
      showToast('Error en confirmar la flota. Torna-ho a provar.');
    }
  });

  // Compartir codi / enllaç / QR
  const inviteUrl = () => {
    const u = new URL(window.location.href);
    u.search = `?sala=${roomClient.roomCode}`;
    u.hash = '';
    return u.toString();
  };

  $('btn-copy-code').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(roomClient.roomCode || '');
      showToast('Codi copiat!');
    } catch (_) {
      showToast(`Codi: ${roomClient.roomCode}`);
    }
  });

  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl());
      showToast('Enllaç d’invitació copiat!');
    } catch (_) {
      showToast(inviteUrl());
    }
  };
  $('btn-copy-link').addEventListener('click', copyInvite);
  $('btn-qr-copy-link').addEventListener('click', copyInvite);

  $('btn-qr-share').addEventListener('click', async () => {
    const url = inviteUrl();
    try {
      await navigator.share({
        title: 'Enfonsar la flota',
        text: `Entra a la meva sala (${roomClient.roomCode}) d'Enfonsar la flota:`,
        url
      });
    } catch (_) {}
  });

  $('btn-show-qr').addEventListener('click', () => {
    const url = inviteUrl();
    $('qr-code-text').textContent = roomClient.roomCode || '----';
    $('qr-url-text').textContent = url;
    $('qr-container').innerHTML = renderQrSvg(url);
    $('btn-qr-share').hidden = typeof navigator.share !== 'function';
    $('modal-qr').showModal();
  });

  // Tabs mòbils de combat
  document.querySelectorAll('.mobile-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      clearTimeout(state.flashTimer);
      setMobileBoardView(tab.dataset.tab);
    });
  });

  // Revanxa
  $('btn-rematch').addEventListener('click', async () => {
    if (state.mode === 'ai') {
      enterPlacement('ai');
      return;
    }
    try {
      await roomClient.requestRematch();
    } catch (_) {
      showToast('No s’ha pogut sol·licitar la revanxa.');
    }
  });

  // Entrada directa per URL ?sala=xxxx
  const params = new URLSearchParams(window.location.search);
  const urlCode = normalizeRoomCode(params.get('sala'));
  if (urlCode.length === ROOM_CODE_LENGTH) {
    $('input-room-code').value = urlCode;
    const saved = loadOnlineSession();
    joinOnlineGame(urlCode, saved?.roomCode === urlCode ? saved : null);
  }
}

document.addEventListener('DOMContentLoaded', init);
