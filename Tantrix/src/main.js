import { CHALLENGE_DEFINITIONS, CHALLENGE_BY_ID, levelLabel } from "./data/challenges.js";
import { COLORS } from "./data/tiles.js";
import { axialToPixel, HEX_DIRECTIONS, pixelToAxial } from "./domain/hex.js";
import { groupRanking } from "./domain/ranking.js";
import { validateLayout } from "./domain/validation.js";
import { validateName } from "./domain/username.js";
import { GameState } from "./game/game-state.js";
import { createTileGroup, createTileSvg } from "./render/tile-renderer.js";
import { deleteRecord, getAllRecords, getRecord, putRecord } from "./storage/indexed-db.js";
import { fetchPlayer, fetchRanking, getEndpoint, queueCompletion, syncPending } from "./api/apps-script-client.js";

const app = document.querySelector("#app");
const announcer = document.querySelector("#announcer");
const SVG_NS = "http://www.w3.org/2000/svg";
const ACTIVE_PLAYER_KEY = "tantrix-active-player";
const PATTERNS_KEY = "tantrix-color-patterns";
const TUTORIAL_KEY = "tantrix-tutorial-complete";
const BOARD_RADIUS = 54;
const skipLink = document.querySelector(".skip-link");
let keyboardNavigation = false;

document.addEventListener("keydown", event => {
  if (event.key === "Tab") keyboardNavigation = true;
}, true);
document.addEventListener("pointerdown", () => {
  keyboardNavigation = false;
  skipLink?.classList.remove("is-visible");
}, true);
skipLink?.addEventListener("focus", () => skipLink.classList.toggle("is-visible", keyboardNavigation));
skipLink?.addEventListener("blur", () => skipLink.classList.remove("is-visible"));

const state = {
  route: "login",
  player: null,
  game: null,
  patterns: localStorage.getItem(PATTERNS_KEY) === "true",
  syncState: getEndpoint() ? "pending" : "local",
  syncLabel: getEndpoint() ? "Pendent" : "Només dispositiu",
  ranking: null,
  rankingUpdatedAt: null,
  tutorialStep: 0,
  tutorialPractice: null,
  deferredInstallPrompt: null,
  solving: false,
  success: null
};

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
}

function announce(message) {
  announcer.textContent = "";
  requestAnimationFrame(() => { announcer.textContent = message; });
}

function colorDot(color) {
  const details = COLORS[color];
  return `<span class="color-dot" style="background:${details.hex}" aria-hidden="true"></span>`;
}

const ICON_PATHS = {
  home: '<path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/>',
  exit: '<path d="M14 8l4 4-4 4"/><path d="M18 12H7"/><path d="M10 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5"/>',
  play: '<path d="m8 5 11 7-11 7Z"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  zoomIn: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5M10.5 7.5v6M7.5 10.5h6"/>',
  zoomOut: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5M7.5 10.5h6"/>',
  target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
  rotateLeft: '<path d="m12 7 4.3 2.5v5L12 17l-4.3-2.5v-5Z"/><path d="M19.5 18.5A9.5 9.5 0 1 0 2.5 12"/><path d="m2.5 7v5h5"/>',
  rotateRight: '<path d="m12 7 4.3 2.5v5L12 17l-4.3-2.5v-5Z"/><path d="M4.5 18.5A9.5 9.5 0 1 1 21.5 12"/><path d="m21.5 7v5h-5"/>',
  undo: '<path d="m9 7-5 5 5 5"/><path d="M5 12h8a6 6 0 0 1 6 6"/>',
  redo: '<path d="m15 7 5 5-5 5"/><path d="M19 12h-8a6 6 0 0 0-6 6"/>',
  tray: '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/>',
  reset: '<path d="M4 4v6h6"/><path d="M5.5 16a8 8 0 1 0 .5-9L4 10"/>',
  guide: '<path d="M4 5.5A3.5 3.5 0 0 1 7.5 2H12v18H7.5A3.5 3.5 0 0 0 4 23Z"/><path d="M20 5.5A3.5 3.5 0 0 0 16.5 2H12v18h4.5A3.5 3.5 0 0 1 20 23Z"/>',
  tutorial: '<path d="m12 2 2.1 5.1L19 9l-4.9 1.9L12 16l-2.1-5.1L5 9l4.9-1.9Z"/><path d="M5 16v5M2.5 18.5h5M19 15v4M17 17h4"/>',
  ranking: '<path d="M8 21h8M12 17v4"/><path d="M7 3h10v5a5 5 0 0 1-10 0Z"/><path d="M7 5H3v2a4 4 0 0 0 5 4M17 5h4v2a4 4 0 0 1-5 4"/>',
  settings: '<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>',
  refresh: '<path d="M20 7v5h-5"/><path d="M4 17v-5h5"/><path d="M6.1 8a7 7 0 0 1 11.7-2L20 8M4 16l2.2 2a7 7 0 0 0 11.7-2"/>',
  replay: '<path d="M4 4v6h6"/><path d="M5.5 16a8 8 0 1 0 .5-9L4 10"/>',
  next: '<path d="M5 12h14M14 7l5 5-5 5"/>',
  back: '<path d="M19 12H5M10 7l-5 5 5 5"/>',
  install: '<path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 20h14"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  sync: '<path d="M4 8h13"/><path d="m14 5 3 3-3 3"/><path d="M20 16H7"/><path d="m10 13-3 3 3 3"/>'
};

function iconSvg(name, className = "button-icon") {
  return `<svg class="${className}" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICON_PATHS[name]}</svg>`;
}

function footerTemplate() {
  return `<footer class="app-footer">
    <a class="app-footer-badge" href="https://creativecommons.org/licenses/by-nc-sa/4.0/deed.ca" target="_blank" rel="license noopener noreferrer" aria-label="Llicència Creative Commons Reconeixement-NoComercial-CompartirIgual 4.0 Internacional">
      <img src="./assets/cc-by-nc-sa.svg" alt="Creative Commons BY-NC-SA 4.0">
    </a>
    <div class="app-footer-copy"><p>Creada per <a href="https://ja.cat/felipsarroca" target="_blank" rel="author noopener noreferrer">Felip Sarroca</a> amb assistència d’IA</p><p>Obra sota llicència <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/deed.ca" target="_blank" rel="license noopener noreferrer">CC BY-NC-SA 4.0</a></p></div>
  </footer>`;
}

function syncTemplate(compact = false) {
  return `<div class="sync-chip" data-state="${state.syncState}" title="${escapeHtml(state.syncLabel)}"><span class="sync-dot" aria-hidden="true"></span><span>${compact ? "" : escapeHtml(state.syncLabel)}</span></div>`;
}

function headerTemplate({ back = false } = {}) {
  return `<header class="app-header">
    <button class="brand" type="button" data-action="${back ? "home" : "brand-home"}" aria-label="Ves a l’inici">
      <img src="./assets/favicon.svg" alt="">
      <span class="brand-copy"><strong>Tantrix Discovery</strong><span>Circuits progressius</span></span>
    </button>
    <div class="header-actions">
      ${state.player ? syncTemplate() : ""}
      ${state.player ? `<button type="button" class="quiet-button has-icon player-button" data-action="settings" aria-label="Configuració">${iconSvg("user")}<span>${escapeHtml(state.player.displayName)}</span></button>` : ""}
      ${state.player ? (back
        ? `<button type="button" class="header-home-button header-back-button" data-action="home" aria-label="Torna al menú">${iconSvg("back")}<span>Torna</span></button>`
        : `<button type="button" class="header-home-button" data-action="landing" aria-label="Ves a la portada d’accés">${iconSvg("home")}<span>Inici</span></button>`) : ""}
    </div>
  </header>`;
}

function pageTemplate(content, options = {}) {
  return `<div class="page">${headerTemplate(options)}<main id="app-main" class="page-main" tabindex="-1">${content}</main>${footerTemplate()}</div>`;
}

async function initialize() {
  const activeName = localStorage.getItem(ACTIVE_PLAYER_KEY);
  if (activeName) {
    const player = await getRecord("players", activeName);
    if (player) {
      state.player = player;
      state.route = "home";
      render();
      void mergeRemoteProgress();
      void attemptSync();
      return;
    }
  }
  render();
}

function render() {
  if (state.route === "login") renderLogin();
  else if (state.route === "home") renderHome();
  else if (state.route === "game") renderGame();
  else if (state.route === "ranking") void renderRanking();
  else if (state.route === "guide") renderGuide();
  else if (state.route === "settings") renderSettings();
  else if (state.route === "tutorial") renderTutorial();
  bindGlobalActions();
  window.scrollTo({ top: 0, left: 0 });
}

function renderLogin() {
  app.innerHTML = pageTemplate(`<section class="hero" aria-labelledby="welcome-title">
    <div class="hero-copy">
      <p class="eyebrow">De 3 a 10 fitxes</p>
      <h1 id="welcome-title">Cada circuit obre el següent.</h1>
      <p>Gira, mou i connecta les fitxes fins que el color indicat formi un únic circuit tancat.</p>
      <form class="name-form" id="name-form" novalidate>
        <label class="sr-only" for="player-name">Nom d’usuari</label>
        <input class="field" id="player-name" name="playerName" autocomplete="nickname" maxlength="24" placeholder="El teu nom d’usuari" required>
        <button class="primary-button has-icon" type="submit">${iconSvg("play")}<span>Comença</span></button>
        <p class="field-error" id="name-error" role="alert"></p>
      </form>
      <p class="privacy-note">Sense correu ni contrasenya. El nom identifica el progrés i pot aparèixer al rànquing lúdic.</p>
    </div>
    <div class="hero-tiles" aria-hidden="true" id="hero-tiles"></div>
  </section>`);
  const hero = document.querySelector("#hero-tiles");
  [1, 4, 8].forEach((tileId, index) => {
    const svg = createTileSvg(tileId, { rotation: index + 1, decorative: true });
    svg.classList.add("hero-tile");
    hero.append(svg);
  });
  document.querySelector("#name-form").addEventListener("submit", handleLogin);
}

async function handleLogin(event) {
  event.preventDefault();
  const validation = validateName(new FormData(event.currentTarget).get("playerName"));
  const error = document.querySelector("#name-error");
  if (!validation.valid) {
    error.textContent = validation.message;
    document.querySelector("#player-name").focus();
    return;
  }
  const existing = await getRecord("players", validation.normalizedName);
  state.player = existing || {
    key: validation.normalizedName,
    normalizedName: validation.normalizedName,
    displayName: validation.displayName,
    completedChallenges: [],
    completedChallengeCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  state.player.displayName = validation.displayName;
  await savePlayer();
  localStorage.setItem(ACTIVE_PLAYER_KEY, validation.normalizedName);
  state.route = localStorage.getItem(TUTORIAL_KEY) ? "home" : "tutorial";
  if (state.route === "tutorial") state.tutorialPractice = createTutorialPractice();
  render();
  void mergeRemoteProgress();
}

async function savePlayer() {
  state.player.completedChallengeCount = state.player.completedChallenges.length;
  state.player.updatedAt = new Date().toISOString();
  await putRecord("players", state.player.normalizedName, state.player);
}

function renderHome() {
  const completed = state.player.completedChallenges.length;
  const current = CHALLENGE_DEFINITIONS[Math.min(completed, 9)];
  const allComplete = completed === CHALLENGE_DEFINITIONS.length;
  const path = CHALLENGE_DEFINITIONS.map((challenge, index) => {
    const isComplete = index < completed;
    const isCurrent = !allComplete && index === completed;
    const canPlay = allComplete || isCurrent;
    const classes = ["challenge-node", isComplete ? "is-complete" : "", isCurrent ? "is-current" : "", !canPlay && !isComplete ? "is-locked" : ""].filter(Boolean).join(" ");
    const stateIcon = isComplete ? "check" : isCurrent ? "play" : "lock";
    const accessibleLabel = `Repte ${challenge.order}: ${challenge.pieceCount} fitxes, ${COLORS[challenge.targetColor].name}, ${isComplete ? "superat" : isCurrent ? "actual" : "pendent"}`;
    const content = `<span class="challenge-state" aria-hidden="true">${iconSvg(stateIcon, "challenge-state-icon")}</span><span class="challenge-number">${challenge.pieceCount}</span><span class="challenge-meta">${colorDot(challenge.targetColor)} ${COLORS[challenge.targetColor].name}</span>`;
    return canPlay ? `<button type="button" class="${classes}" data-challenge="${challenge.id}" aria-label="${accessibleLabel}">${content}</button>` : `<div class="${classes}" role="img" aria-label="${accessibleLabel}">${content}</div>`;
  }).join("");
  const continueText = allComplete ? "Tria qualsevol repte" : completed ? `Continua amb ${current.pieceCount} fitxes` : "Comença el Discovery";
  app.innerHTML = pageTemplate(`<section aria-labelledby="home-title">
    <div class="section-heading home-heading"><h1 id="home-title">El teu recorregut</h1><p>${escapeHtml(levelLabel(completed))}</p></div>
    <div class="home-grid">
      <article class="continue-card">
        <div><span class="progress-number">${completed}/10</span><p>${allComplete ? "Has completat tots els circuits. Ara pots tornar al repte que vulguis." : "Resol el repte actual per obrir el següent."}</p></div>
        <button class="primary-button has-icon continue-button" type="button" data-action="continue">${iconSvg("play")}<span>${continueText}</span></button>
      </article>
      <article class="journey-card"><div class="challenge-path" aria-label="Progressió dels reptes">${path}</div></article>
    </div>
    <nav class="quick-actions" aria-label="Altres opcions">
      <button class="secondary-button has-icon quick-action quick-action-guide" type="button" data-action="guide">${iconSvg("guide")}<span>Com es juga</span></button>
      <button class="secondary-button has-icon quick-action quick-action-tutorial" type="button" data-action="tutorial">${iconSvg("tutorial")}<span>Tutorial</span></button>
      <button class="secondary-button has-icon quick-action quick-action-ranking" type="button" data-action="ranking">${iconSvg("ranking")}<span>Rànquing</span></button>
      <button class="secondary-button has-icon quick-action quick-action-settings" type="button" data-action="settings">${iconSvg("settings")}<span>Configuració</span></button>
    </nav>
  </section>`);
  document.querySelectorAll("[data-challenge]").forEach(button => button.addEventListener("click", () => void startGame(button.dataset.challenge)));
}

async function startGame(challengeId) {
  const challenge = CHALLENGE_BY_ID.get(challengeId);
  if (!challenge) return;
  const completed = state.player.completedChallenges.length;
  if (completed < 10 && challenge.order !== completed + 1) return;
  const saved = await getRecord("games", gameKey(challenge.id));
  state.game = new GameState(challenge, saved);
  state.route = "game";
  state.success = null;
  render();
}

function gameKey(challengeId) {
  return `${state.player.normalizedName}|${challengeId}`;
}

function renderGame() {
  if (!state.game) {
    state.route = "home";
    render();
    return;
  }
  const challenge = state.game.challenge;
  const boardCount = state.game.boardLayout().length;
  const selected = state.game.pieces.find(piece => piece.tileId === state.game.selectedTileId);
  const controlPanelDensity = challenge.pieceCount >= 9 ? "is-max-density" : challenge.pieceCount >= 7 ? "is-dense" : "";
  app.innerHTML = `<div class="game-page">
    <header class="game-header">
      <div class="game-header-start">
        <div class="brand game-brand"><img src="./assets/favicon.svg" alt=""><span class="brand-copy"><strong>Tantrix Discovery</strong><span>Partida</span></span></div>
      </div>
      <div class="game-progress">Repte ${challenge.order} de 10</div>
      <div class="game-header-end">${syncTemplate(true)}<button class="game-exit-button" type="button" data-action="home" aria-label="Surt de la partida">${iconSvg("exit")}<span>Surt</span></button></div>
    </header>
    <main id="app-main" class="game-layout">
      <aside class="game-sidebar game-objective-sidebar" aria-label="Objectiu del repte">
        <p class="objective-label">Repte actual</p>
        <div class="objective-pills">
          <div class="objective-pill"><span>Fitxes</span><strong>${challenge.pieceCount}</strong></div>
          <div class="objective-pill"><span>Color</span><strong>${colorDot(challenge.targetColor)} ${COLORS[challenge.targetColor].name}</strong></div>
        </div>
        <p class="game-status" id="game-status">${boardCount} de ${challenge.pieceCount} col·locades</p>
        <div class="control-help"><h3>Sense pistes</h3><p>Observa els camins, gira les fitxes i comprova tots els contactes.</p></div>
      </aside>
      <section class="board-wrap" aria-label="Tauler de joc">
        <svg class="game-board" id="game-board" viewBox="0 0 900 650" role="application" aria-label="Tauler hexagonal. Utilitza les fitxes i els controls visibles."></svg>
        <div class="board-tools" aria-label="Controls del tauler">
          <button type="button" class="board-tool" data-game-action="zoom-out">${iconSvg("zoomOut", "control-icon")}<span>Allunya</span></button>
          <button type="button" class="board-tool" data-game-action="center">${iconSvg("target", "control-icon")}<span>Centra</span></button>
          <button type="button" class="board-tool" data-game-action="zoom-in">${iconSvg("zoomIn", "control-icon")}<span>Apropa</span></button>
        </div>
      </section>
      <aside class="game-sidebar game-control-sidebar ${controlPanelDensity}" aria-label="Fitxes i accions">
        <div><div class="tray-title"><h3>Fitxes</h3><span>${challenge.pieceCount - boardCount} disponibles</span></div><div class="tile-tray" id="tile-tray"></div></div>
        <div class="game-action-stack">
          <p class="control-group-label">Gira la fitxa</p>
          <div class="rotation-actions"><button class="secondary-button control-button rotate-left-button" type="button" data-game-action="rotate-left" aria-label="Gira a l’esquerra" ${selected ? "" : "disabled"}>${iconSvg("rotateLeft", "control-icon")}<span>Esquerra</span></button><button class="secondary-button control-button rotate-right-button" type="button" data-game-action="rotate-right" aria-label="Gira a la dreta" ${selected ? "" : "disabled"}>${iconSvg("rotateRight", "control-icon")}<span>Dreta</span></button></div>
          <div class="game-primary-actions">
            <button class="primary-button check-solution-button" type="button" data-game-action="check">${iconSvg("check", "control-icon")}<span>Comprova</span></button>
            <button class="secondary-button reset-game-button" type="button" data-game-action="reset">${iconSvg("reset", "control-icon")}<span>Reinicia</span></button>
          </div>
        </div>
      </aside>
    </main>
    ${state.success ? successTemplate() : ""}
  </div>`;
  renderBoard();
  renderTray();
  bindGameActions();
  bindBoardInteraction();
  bindGlobalActions();
  if (state.success) bindSuccessActions();
  window.scrollTo({ top: 0, left: 0 });
}

function renderBoard() {
  const svg = document.querySelector("#game-board");
  const defs = document.createElementNS(SVG_NS, "defs");
  svg.append(defs);
  const camera = document.createElementNS(SVG_NS, "g");
  camera.id = "camera-group";
  applyCameraTransform(camera);
  const grid = document.createElementNS(SVG_NS, "g");
  grid.classList.add("board-grid");
  const gridExtent = boardGridExtent();
  for (let q = -gridExtent; q <= gridExtent; q += 1) {
    for (let r = -gridExtent; r <= gridExtent; r += 1) {
      if (Math.abs(q + r) > gridExtent) continue;
      const { x, y } = axialToPixel(q, r, BOARD_RADIUS);
      const cell = document.createElementNS(SVG_NS, "polygon");
      cell.setAttribute("points", hexPoints(BOARD_RADIUS - 2));
      cell.setAttribute("transform", `translate(${x} ${y})`);
      cell.setAttribute("class", "board-cell");
      cell.dataset.q = q;
      cell.dataset.r = r;
      grid.append(cell);
    }
  }
  camera.append(grid);
  const tiles = document.createElementNS(SVG_NS, "g");
  tiles.id = "board-tiles";
  for (const piece of state.game.pieces.filter(item => item.location === "BOARD")) {
    const { x, y } = axialToPixel(piece.q, piece.r, BOARD_RADIUS);
    const positioned = document.createElementNS(SVG_NS, "g");
    positioned.setAttribute("transform", `translate(${x} ${y})`);
    positioned.dataset.positionedTile = piece.tileId;
    positioned.append(createTileGroup(piece.tileId, {
      rotation: piece.rotation,
      selected: piece.tileId === state.game.selectedTileId,
      patterns: state.patterns,
      tabindex: 0,
      ariaLabel: `Fitxa ${piece.tileId}, al tauler, rotació ${piece.rotation * 60} graus${piece.tileId === state.game.selectedTileId ? ", seleccionada" : ""}`
    }));
    tiles.append(positioned);
  }
  camera.append(tiles);
  svg.append(camera);
}

function boardGridExtent() {
  const pieceCount = state.game?.challenge.pieceCount ?? 10;
  return pieceCount <= 4 ? 2 : pieceCount <= 8 ? 3 : 4;
}

function isInsideBoardGrid(q, r) {
  const extent = boardGridExtent();
  return Math.abs(q) <= extent && Math.abs(r) <= extent && Math.abs(q + r) <= extent;
}

function renderTray() {
  const tray = document.querySelector("#tile-tray");
  for (const piece of state.game.pieces.filter(item => item.location === "TRAY")) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `tray-tile${piece.tileId === state.game.selectedTileId ? " is-selected" : ""}`;
    button.dataset.trayTile = piece.tileId;
    button.setAttribute("aria-label", `Fitxa ${piece.tileId}${piece.tileId === state.game.selectedTileId ? ", seleccionada" : ""}`);
    button.append(createTileSvg(piece.tileId, { rotation: piece.rotation, selected: piece.tileId === state.game.selectedTileId, patterns: state.patterns, decorative: true }));
    tray.append(button);
    bindTrayDrag(button, piece.tileId);
  }
  tray.querySelectorAll("[data-tray-tile]").forEach(button => button.addEventListener("click", event => {
    if (button.dataset.suppressClick === "true") {
      button.dataset.suppressClick = "false";
      event.preventDefault();
      return;
    }
    const tileId = Number(button.dataset.trayTile);
    if (state.game.selectedTileId === tileId) state.game.rotate(tileId, 1);
    else state.game.select(tileId);
    void persistAndRenderGame(false);
  }));
}

function bindTrayDrag(button, tileId) {
  let drag = null;
  let ghost = null;

  const moveGhost = event => {
    if (!ghost) return;
    const lift = event.pointerType === "touch" ? 42 : 0;
    ghost.style.left = `${event.clientX}px`;
    ghost.style.top = `${event.clientY - lift}px`;
  };

  const clearDrag = () => {
    ghost?.remove();
    ghost = null;
    button.classList.remove("is-dragging");
    document.querySelectorAll(".board-cell.is-drop-target").forEach(cell => cell.classList.remove("is-drop-target"));
  };

  button.addEventListener("pointerdown", event => {
    if (event.button !== 0) return;
    drag = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, active: false };
    button.setPointerCapture(event.pointerId);
  });

  button.addEventListener("pointermove", event => {
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (!drag.active && Math.hypot(event.clientX - drag.x, event.clientY - drag.y) > 8) {
      drag.active = true;
      button.classList.add("is-dragging");
      ghost = button.cloneNode(true);
      ghost.removeAttribute("id");
      ghost.removeAttribute("data-tray-tile");
      ghost.setAttribute("aria-hidden", "true");
      ghost.className = "tray-tile tray-drag-ghost";
      if (event.pointerType === "touch") ghost.classList.add("is-touch-drag");
      document.body.append(ghost);
    }
    if (!drag.active) return;
    event.preventDefault();
    moveGhost(event);
    document.querySelectorAll(".board-cell.is-drop-target").forEach(cell => cell.classList.remove("is-drop-target"));
    const board = document.querySelector("#game-board");
    const bounds = board.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) return;
    const world = screenToWorld(event.clientX, event.clientY);
    const target = pixelToAxial(world.x, world.y, BOARD_RADIUS);
    document.querySelector(`.board-cell[data-q="${target.q}"][data-r="${target.r}"]`)?.classList.add("is-drop-target");
  });

  const finish = event => {
    if (!drag || drag.pointerId !== event.pointerId) return;
    const wasActive = drag.active;
    drag = null;
    if (!wasActive) return;
    button.dataset.suppressClick = "true";
    const board = document.querySelector("#game-board");
    const bounds = board.getBoundingClientRect();
    if (event.clientX >= bounds.left && event.clientX <= bounds.right && event.clientY >= bounds.top && event.clientY <= bounds.bottom) {
      const world = screenToWorld(event.clientX, event.clientY);
      const { q, r } = pixelToAxial(world.x, world.y, BOARD_RADIUS);
      if (isInsideBoardGrid(q, r)) state.game.place(tileId, q, r);
    }
    clearDrag();
    void persistAndRenderGame(true);
  };

  button.addEventListener("pointerup", finish);
  button.addEventListener("pointercancel", () => {
    drag = null;
    clearDrag();
  });
}

function hexPoints(radius) {
  return Array.from({ length: 6 }, (_, index) => {
    const angle = index * Math.PI / 3;
    return `${Math.cos(angle) * radius},${Math.sin(angle) * radius}`;
  }).join(" ");
}

function applyCameraTransform(element = document.querySelector("#camera-group")) {
  if (!element) return;
  const { x, y, scale } = state.game.camera;
  element.setAttribute("transform", `translate(${450 + x} ${325 + y}) scale(${scale})`);
}

function bindGameActions() {
  document.querySelectorAll("[data-game-action]").forEach(button => button.addEventListener("click", () => handleGameAction(button.dataset.gameAction)));
}

function handleGameAction(action) {
  const selected = state.game.selectedTileId;
  if (action === "check") {
    const placed = state.game.boardLayout().length;
    if (placed < state.game.challenge.pieceCount) {
      const missing = state.game.challenge.pieceCount - placed;
      const status = document.querySelector("#game-status");
      status.textContent = missing === 1 ? "Falta col·locar 1 fitxa." : `Falten col·locar ${missing} fitxes.`;
      announce(status.textContent);
      return;
    }
    void persistAndRenderGame(true);
    return;
  }
  if (action === "rotate-left" && selected) state.game.rotate(selected, -1);
  if (action === "rotate-right" && selected) state.game.rotate(selected, 1);
  if (action === "remove" && selected) state.game.remove(selected);
  if (action === "undo") state.game.undo();
  if (action === "redo") state.game.redo();
  if (action === "reset" && (state.game.history.length || state.game.boardLayout().length)) {
    if (!window.confirm("Vols tornar totes les fitxes a la safata?")) return;
    state.game.reset();
  }
  if (action === "zoom-in") state.game.camera.scale = Math.min(1.8, state.game.camera.scale + .15);
  if (action === "zoom-out") state.game.camera.scale = Math.max(.65, state.game.camera.scale - .15);
  if (action === "center") centerBoard();
  void persistAndRenderGame(!["zoom-in", "zoom-out", "center"].includes(action));
}

function centerBoard() {
  const layout = state.game.boardLayout();
  if (!layout.length) {
    state.game.camera = { x: 0, y: 0, scale: 1 };
    return;
  }
  const points = layout.map(item => axialToPixel(item.q, item.r, BOARD_RADIUS));
  const minX = Math.min(...points.map(point => point.x)) - BOARD_RADIUS;
  const maxX = Math.max(...points.map(point => point.x)) + BOARD_RADIUS;
  const minY = Math.min(...points.map(point => point.y)) - BOARD_RADIUS;
  const maxY = Math.max(...points.map(point => point.y)) + BOARD_RADIUS;
  state.game.camera.x = -(minX + maxX) / 2;
  state.game.camera.y = -(minY + maxY) / 2;
  state.game.camera.scale = Math.max(.65, Math.min(1.35, Math.min(760 / (maxX - minX), 520 / (maxY - minY)) * .88));
}

function bindBoardInteraction() {
  const svg = document.querySelector("#game-board");
  const pointers = new Map();
  let gesture = null;
  let pinch = null;

  svg.addEventListener("pointerdown", event => {
    const tile = event.target.closest?.("[data-tile-id]");
    const cell = event.target.closest?.("[data-q]");
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    svg.setPointerCapture(event.pointerId);
    if (pointers.size === 2) {
      const values = [...pointers.values()];
      pinch = { distance: Math.hypot(values[0].x - values[1].x, values[0].y - values[1].y), scale: state.game.camera.scale };
      gesture = null;
      return;
    }
    gesture = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      lastY: event.clientY,
      tileId: tile ? Number(tile.dataset.tileId) : null,
      cell,
      dragged: false,
      camera: { ...state.game.camera }
    };
  });

  svg.addEventListener("pointermove", event => {
    if (!pointers.has(event.pointerId)) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size === 2 && pinch) {
      const values = [...pointers.values()];
      const distance = Math.hypot(values[0].x - values[1].x, values[0].y - values[1].y);
      state.game.camera.scale = Math.max(.65, Math.min(1.8, pinch.scale * distance / Math.max(1, pinch.distance)));
      applyCameraTransform();
      return;
    }
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    const distance = Math.hypot(event.clientX - gesture.startX, event.clientY - gesture.startY);
    if (distance > 8) gesture.dragged = true;
    if (!gesture.dragged) return;
    if (gesture.tileId) {
      const world = screenToWorld(event.clientX, event.clientY);
      const positioned = document.querySelector(`[data-positioned-tile="${gesture.tileId}"]`);
      if (positioned) {
        positioned.setAttribute("transform", `translate(${world.x} ${world.y}) scale(1.04)`);
        positioned.classList.add("dragging-tile");
      }
      const returnSurface = document.querySelector("#tile-tray")?.closest(".game-sidebar");
      const returnBounds = returnSurface?.getBoundingClientRect();
      returnSurface?.classList.toggle("is-return-target", Boolean(returnBounds && event.clientX >= returnBounds.left && event.clientX <= returnBounds.right && event.clientY >= returnBounds.top && event.clientY <= returnBounds.bottom));
    } else {
      state.game.camera.x = gesture.camera.x + (event.clientX - gesture.startX) / state.game.camera.scale;
      state.game.camera.y = gesture.camera.y + (event.clientY - gesture.startY) / state.game.camera.scale;
      applyCameraTransform();
    }
  });

  const finishPointer = event => {
    pointers.delete(event.pointerId);
    if (pointers.size < 2) pinch = null;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    const current = gesture;
    gesture = null;
    if (current.tileId && current.dragged) {
      const tray = document.querySelector("#tile-tray");
      const returnSurface = tray?.closest(".game-sidebar");
      const returnBounds = returnSurface?.getBoundingClientRect();
      returnSurface?.classList.remove("is-return-target");
      if (returnBounds && event.clientX >= returnBounds.left && event.clientX <= returnBounds.right && event.clientY >= returnBounds.top && event.clientY <= returnBounds.bottom) {
        state.game.remove(current.tileId);
        void persistAndRenderGame(true);
        return;
      }
      const world = screenToWorld(event.clientX, event.clientY);
      const { q, r } = pixelToAxial(world.x, world.y, BOARD_RADIUS);
      if (isInsideBoardGrid(q, r)) state.game.place(current.tileId, q, r);
      void persistAndRenderGame(true);
      return;
    }
    if (!current.tileId && current.dragged) {
      void persistGame();
      return;
    }
    if (current.tileId) {
      if (state.game.selectedTileId === current.tileId) state.game.rotate(current.tileId, 1);
      else state.game.select(current.tileId);
      void persistAndRenderGame(false);
      return;
    }
    if (current.cell && state.game.selectedTileId) {
      state.game.place(state.game.selectedTileId, Number(current.cell.dataset.q), Number(current.cell.dataset.r));
      void persistAndRenderGame(true);
    }
  };
  svg.addEventListener("pointerup", finishPointer);
  svg.addEventListener("pointercancel", event => {
    pointers.delete(event.pointerId);
    gesture = null;
    document.querySelector("#tile-tray")?.closest(".game-sidebar")?.classList.remove("is-return-target");
    renderGame();
  });
  svg.addEventListener("wheel", event => {
    event.preventDefault();
    state.game.camera.scale = Math.max(.65, Math.min(1.8, state.game.camera.scale + (event.deltaY < 0 ? .1 : -.1)));
    applyCameraTransform();
    void persistGame();
  }, { passive: false });
}

function screenToWorld(clientX, clientY) {
  const camera = document.querySelector("#camera-group");
  const point = new DOMPoint(clientX, clientY).matrixTransform(camera.getScreenCTM().inverse());
  return { x: point.x, y: point.y };
}

async function persistGame() {
  if (!state.game) return;
  await putRecord("games", gameKey(state.game.challenge.id), state.game.serialize());
}

async function persistAndRenderGame(checkSolution) {
  await persistGame();
  if (checkSolution && state.game.boardLayout().length === state.game.challenge.pieceCount) {
    const validation = validateLayout(state.game.challenge.id, state.game.boardLayout());
    if (validation.valid) {
      await completeCurrentChallenge();
      return;
    }
  }
  renderGame();
  if (checkSolution && state.game.boardLayout().length === state.game.challenge.pieceCount) {
    const status = document.querySelector("#game-status");
    status.textContent = "Encara no està resolt.";
    announce(status.textContent);
  }
}

function persistRenderAndRestoreTileFocus(checkSolution, tileId) {
  void persistAndRenderGame(checkSolution).then(() => {
    if (state.route !== "game" || state.success) return;
    document.querySelector(`[data-tile-id="${tileId}"]`)?.focus();
  });
}

async function completeCurrentChallenge() {
  if (state.solving) return;
  state.solving = true;
  const challenge = state.game.challenge;
  const alreadyCompleted = state.player.completedChallenges.includes(challenge.id);
  const layout = state.game.boardLayout();
  if (!alreadyCompleted) {
    state.player.completedChallenges.push(challenge.id);
    state.player.completedChallenges.sort((a, b) => CHALLENGE_BY_ID.get(a).order - CHALLENGE_BY_ID.get(b).order);
    await savePlayer();
    await queueCompletion(state.player.normalizedName, {
      requestId: crypto.randomUUID(),
      challengeId: challenge.id,
      order: challenge.order,
      layout,
      completedAt: new Date().toISOString()
    });
    state.syncState = getEndpoint() ? "pending" : "local";
    state.syncLabel = getEndpoint() ? "Pendent" : "Desat al dispositiu";
  }
  await deleteRecord("games", gameKey(challenge.id));
  state.success = { challenge, isReplay: alreadyCompleted, allComplete: state.player.completedChallenges.length === 10 };
  centerBoard();
  state.solving = false;
  renderGame();
  announce("Repte superat!");
  if (!alreadyCompleted) void attemptSync();
}

function successTemplate() {
  const { challenge, isReplay, allComplete } = state.success;
  const completedCount = state.player.completedChallenges.length;
  const nextChallenge = !allComplete && !isReplay ? CHALLENGE_DEFINITIONS[challenge.order] : null;
  const message = allComplete && !isReplay ? "Has completat tots els reptes del Discovery!" : `Has tancat el circuit ${COLORS[challenge.targetColor].name} amb ${challenge.pieceCount} fitxes.`;
  const nextPreview = nextChallenge
    ? `<div class="success-next"><span>Ja has desbloquejat</span><strong>Repte ${nextChallenge.order}: ${nextChallenge.pieceCount} fitxes · ${COLORS[nextChallenge.targetColor].name}</strong></div>`
    : allComplete && !isReplay
      ? `<div class="success-next"><span>Recorregut complet</span><strong>Ara pots triar qualsevol repte</strong></div>`
      : "";
  const confetti = Array.from({ length: 18 }, (_, index) => `<i style="--i:${index}" aria-hidden="true"></i>`).join("");
  return `<div class="success-overlay" role="dialog" aria-modal="true" aria-labelledby="success-title">
    <div class="success-confetti" aria-hidden="true">${confetti}</div>
    <section class="success-card">
      <div class="success-topline"><span>Repte ${challenge.order} de 10</span><strong>${completedCount}/10 superats</strong></div>
      <div class="success-mark" aria-hidden="true">✓</div>
      <p class="eyebrow">Circuit complet</p>
      <h2 id="success-title">Repte superat!</h2>
      <p class="success-message">${message}</p>
      <div class="success-progress" role="img" aria-label="Progrés: ${completedCount} de 10 reptes superats"><span style="width:${completedCount * 10}%"></span></div>
      ${nextPreview}
      <div class="success-actions">${nextChallenge ? `<button class="primary-button has-icon" type="button" data-success="next" aria-label="Següent repte"><span>Següent repte</span>${iconSvg("next")}</button>` : `<button class="primary-button has-icon" type="button" data-success="choose">${iconSvg("target")}<span>Tria un repte</span></button>`}<button class="secondary-button has-icon" type="button" data-success="replay">${iconSvg("replay")}<span>Torna a jugar</span></button><button class="quiet-button has-icon" type="button" data-success="home">${iconSvg("home")}<span>Inici</span></button></div>
    </section>
  </div>`;
}

function bindSuccessActions() {
  document.querySelectorAll("[data-success]").forEach(button => button.addEventListener("click", async () => {
    const action = button.dataset.success;
    const finished = state.success.challenge;
    document.querySelectorAll("[data-success]").forEach(control => { control.disabled = true; });
    state.success = null;
    if (action === "next") {
      const next = CHALLENGE_DEFINITIONS[finished.order];
      await startGame(next.id);
    } else if (action === "replay") {
      state.game = new GameState(finished);
      renderGame();
    } else {
      state.route = "home";
      state.game = null;
      render();
    }
  }));
  document.querySelector(".success-actions .primary-button")?.focus();
}

async function renderRanking(refreshRemote = false) {
  const localPlayers = await getAllRecords("players");
  if (!state.ranking) state.ranking = localPlayers;
  const totalPlayers = state.ranking.length;
  const finishers = state.ranking.filter(player => Number(player.completedChallengeCount) === 10).length;
  const currentProgress = state.player.completedChallenges.length;
  app.innerHTML = pageTemplate(`<section class="ranking-page" aria-labelledby="ranking-title">
    <div class="ranking-hero">
      <div class="ranking-intro"><p class="eyebrow">Progrés compartit</p><h1 id="ranking-title">Rànquing</h1><p>Cada jugador apareix al grup del seu progrés. No hi ha cronòmetre ni desempats: aquí compta arribar cada vegada més lluny.</p></div>
      <div class="ranking-own-progress" style="--own-progress:${currentProgress * 10}%"><span>El teu recorregut</span><strong>${currentProgress}<small>/10</small></strong></div>
    </div>
    <div class="ranking-summary" aria-label="Resum del rànquing">
      <article><strong>${totalPlayers}</strong><span>${totalPlayers === 1 ? "jugador" : "jugadors"}</span></article>
      <article><strong>${finishers}</strong><span>${finishers === 1 ? "Discovery completat" : "Discovery completats"}</span></article>
      <article><strong>${currentProgress}/10</strong><span>el teu progrés</span></article>
    </div>
    <div class="ranking-toolbar"><div><p class="eyebrow">Comunitat Discovery</p><h2>Grups de progrés</h2></div><button class="secondary-button has-icon refresh-button" type="button" id="refresh-ranking">${iconSvg("refresh")}<span>Actualitza</span></button></div>
    <div id="ranking-list" class="ranking-list">${rankingMarkup(state.ranking)}</div>
    <p class="ranking-updated" id="ranking-updated">${state.rankingUpdatedAt ? `Actualitzat ${new Date(state.rankingUpdatedAt).toLocaleString("ca")}` : "Mostrant les dades desades al dispositiu"}</p>
  </section>`, { back: true });
  bindGlobalActions();
  document.querySelector("#refresh-ranking").addEventListener("click", () => void refreshRanking());
  if (refreshRemote) void refreshRanking();
}

function rankingMarkup(players) {
  const groups = groupRanking(players);
  if (!groups.length) return `<div class="ranking-empty">Encara no hi ha cap progrés desat.</div>`;
  return groups.map(group => {
    const accent = group.count === 10 ? "#267a4a" : group.count >= 7 ? "#6658c9" : group.count >= 4 ? "#008fcc" : group.count ? "#c56b18" : "#7a828b";
    const playersMarkup = group.players.map(player => {
      const isCurrent = player.normalizedName === state.player.normalizedName;
      const initial = Array.from(String(player.displayName).trim())[0]?.toLocaleUpperCase("ca") || "•";
      return `<li class="${isCurrent ? "is-current" : ""}"><span class="ranking-avatar" aria-hidden="true">${escapeHtml(initial)}</span><span class="ranking-player-name"><strong>${escapeHtml(player.displayName)}</strong>${isCurrent ? "<small>Tu</small>" : ""}</span><span class="ranking-player-score"><strong>${player.completedChallengeCount}</strong><small>/10</small></span></li>`;
    }).join("");
    return `<section class="ranking-group ${group.count === 10 ? "is-finished" : ""}" style="--tier-progress:${group.count * 10}%;--tier-accent:${accent}">
      <header class="ranking-group-header">
        <div class="ranking-medallion" aria-hidden="true"><span><strong>${group.count}</strong><small>/10</small></span></div>
        <div class="ranking-group-copy"><h3>${escapeHtml(group.label)}</h3></div>
        <strong class="ranking-player-count">${group.players.length} ${group.players.length === 1 ? "jugador" : "jugadors"}</strong>
      </header>
      <ul class="ranking-players">${playersMarkup}</ul>
    </section>`;
  }).join("");
}

async function refreshRanking() {
  const button = document.querySelector("#refresh-ranking");
  if (button) { button.disabled = true; button.textContent = "Actualitzant…"; }
  try {
    const data = await fetchRanking();
    state.ranking = data.ranking.map(player => ({ ...player, normalizedName: String(player.displayName).normalize("NFKC").trim().toLocaleLowerCase("ca") }));
    state.rankingUpdatedAt = new Date().toISOString();
    await putRecord("meta", "ranking", { players: state.ranking, updatedAt: state.rankingUpdatedAt });
  } catch {
    const cached = await getRecord("meta", "ranking");
    if (cached?.players?.length) {
      state.ranking = cached.players;
      state.rankingUpdatedAt = cached.updatedAt;
    }
  }
  await renderRanking(false);
}

function renderGuide() {
  const cards = [
    {
      title: "Tres camins",
      text: `Cada fitxa té tres camins independents: <strong class="guide-color guide-color-red">vermell</strong>, <strong class="guide-color guide-color-blue">blau</strong> i <strong class="guide-color guide-color-yellow">groc</strong>. Cada camí entra per un costat i surt per un altre.`,
      visualLabel: "Una fitxa amb els tres camins vermell, blau i groc assenyalats"
    },
    {
      title: "Fes coincidir els colors",
      text: `Quan dues fitxes es toquen, els dos costats han de tenir <strong class="guide-emphasis">exactament el mateix color</strong>.`,
      visualLabel: "Dues fitxes ben col·locades, unides per dos costats grocs coincidents"
    },
    {
      title: "Gira i mou",
      text: `Selecciona una fitxa. Fes servir <span class="guide-inline-control guide-turn-left">${iconSvg("rotateLeft", "guide-inline-icon")}<strong>gira a l’esquerra</strong></span> o <span class="guide-inline-control guide-turn-right">${iconSvg("rotateRight", "guide-inline-icon")}<strong>gira a la dreta</strong></span> i després <span class="guide-inline-control guide-touch"><span class="guide-tap-symbol" aria-hidden="true">◎</span><strong>toca una cel·la</strong></span> per moure-la sense arrossegar.`,
      visualLabel: "Una fitxa seleccionada que gira i es mou cap a una cel·la tocada"
    },
    {
      title: "Tanca un únic circuit",
      text: `Segueix amb la mirada el <strong class="guide-color guide-color-yellow">color indicat</strong>: ha de passar per <strong>totes les fitxes</strong> i tornar al punt d’inici sense ramificar-se.`,
      visualLabel: "Tres petites fitxes connectades per un únic circuit groc tancat"
    },
    {
      title: "Utilitza-les totes",
      text: `Col·loca <strong>totes les fitxes</strong> en un únic conjunt connectat. El repte només es pot completar quan la <span class="guide-inline-status">safata marca 0</span>.`,
      visualLabel: "Quatre fitxes juntes al tauler i una safata buida marcada amb zero"
    },
    {
      title: "Sense forats",
      text: `La forma final ha de ser compacta: les fitxes <strong>no poden envoltar una cel·la buida</strong>. Compara la forma amb forat i la forma correcta.`,
      visualLabel: "Comparació entre una disposició amb un forat, marcada amb una creu, i una forma compacta, marcada amb un tic"
    }
  ];
  app.innerHTML = pageTemplate(`<section aria-labelledby="guide-title"><div class="section-heading"><div><p class="eyebrow">Regles essencials</p><h1 id="guide-title">Com es juga</h1><p>Tot el que necessites per jugar, sense revelar cap solució.</p></div><button class="primary-button has-icon" type="button" data-action="home">${iconSvg("check")}<span>Entesos</span></button></div><div class="guide-grid">${cards.map((card, index) => `<article class="guide-card"><div class="guide-visual" data-guide-visual="${index}" role="img" aria-label="${card.visualLabel}"></div><div class="guide-copy"><h3>${card.title}</h3><p>${card.text}</p></div></article>`).join("")}</div></section>`, { back: true });
  cards.forEach((card, index) => renderGuideDiagram(document.querySelector(`[data-guide-visual="${index}"]`), index));
}

function guideSvg(label) {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 240 150");
  svg.setAttribute("class", "guide-diagram");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  svg.dataset.diagram = label;
  return svg;
}

function guideTile(svg, tileId, x, y, scale, rotation = 0, selected = false) {
  const wrapper = document.createElementNS(SVG_NS, "g");
  wrapper.setAttribute("transform", `translate(${x} ${y}) scale(${scale})`);
  wrapper.classList.add("guide-rendered-tile");
  const tile = createTileGroup(tileId, { rotation, selected, patterns: state.patterns, tabindex: -1 });
  tile.removeAttribute("role");
  tile.removeAttribute("aria-label");
  wrapper.append(tile);
  svg.append(wrapper);
}

function guideTileAtAxial(svg, tileId, originX, originY, scale, q, r, rotation = 0, selected = false) {
  const offset = axialToPixel(q, r, BOARD_RADIUS);
  guideTile(svg, tileId, originX + offset.x * scale, originY + offset.y * scale, scale, rotation, selected);
  const wrapper = svg.lastElementChild;
  wrapper.dataset.q = q;
  wrapper.dataset.r = r;
  return wrapper;
}

function guideCell(svg, originX, originY, scale, q, r, className = "guide-board-cell") {
  const offset = axialToPixel(q, r, BOARD_RADIUS);
  const cell = document.createElementNS(SVG_NS, "polygon");
  cell.setAttribute("points", hexPoints((BOARD_RADIUS - 2) * scale));
  cell.setAttribute("transform", `translate(${originX + offset.x * scale} ${originY + offset.y * scale})`);
  cell.setAttribute("class", className);
  cell.dataset.q = q;
  cell.dataset.r = r;
  svg.append(cell);
  return cell;
}

function guideMarkup(svg, markup) {
  svg.insertAdjacentHTML("beforeend", markup);
}

function renderGuideDiagram(container, index) {
  const svg = guideSvg(`regla-${index + 1}`);
  container.append(svg);

  if (index === 0) {
    guideTile(svg, 1, 84, 75, .76, 0);
    guideMarkup(svg, `<g class="guide-legend">
      <path d="M130 39H151" class="guide-callout-line guide-red-stroke"/><circle cx="162" cy="39" r="6" class="guide-red-fill"/><text x="174" y="44">vermell</text>
      <path d="M128 75H151" class="guide-callout-line guide-blue-stroke"/><circle cx="162" cy="75" r="6" class="guide-blue-fill"/><text x="174" y="80">blau</text>
      <path d="M127 111H151" class="guide-callout-line guide-yellow-stroke"/><circle cx="162" cy="111" r="6" class="guide-yellow-fill"/><text x="174" y="116">groc</text>
    </g>`);
  } else if (index === 1) {
    const originX = 91;
    const originY = 56;
    const scale = .58;
    const neighbor = axialToPixel(1, 0, BOARD_RADIUS);
    const contactX = originX + neighbor.x * scale / 2;
    const contactY = originY + neighbor.y * scale / 2;
    guideMarkup(svg, `<circle cx="${contactX}" cy="${contactY}" r="15" class="guide-contact-glow"/>`);
    guideTileAtAxial(svg, 7, originX, originY, scale, 0, 0, 0);
    guideTileAtAxial(svg, 8, originX, originY, scale, 1, 0, 3);
    guideMarkup(svg, `<circle cx="${contactX}" cy="${contactY}" r="11" class="guide-contact-ring"/><circle cx="205" cy="30" r="17" class="guide-ok-badge"/><path d="m197 30 5 5 10-12" class="guide-ok-mark"/><g class="guide-match-label"><rect x="147" y="116" width="79" height="25" rx="12.5"/><circle cx="161" cy="128.5" r="5" class="guide-blue-fill"/><text x="172" y="133">blau = blau</text></g>`);
  } else if (index === 2) {
    const originX = 53;
    const originY = 77;
    const scale = .52;
    const target = axialToPixel(2, -1, BOARD_RADIUS);
    guideCell(svg, originX, originY, scale, 0, 0, "guide-board-cell is-origin");
    guideCell(svg, originX, originY, scale, 1, 0);
    guideCell(svg, originX, originY, scale, 2, -1, "guide-board-cell is-target");
    guideMarkup(svg, `<path d="M86 77H${originX + target.x * scale - 13}" class="guide-move-path"/><path d="m${originX + target.x * scale - 19} 69 10 8-10 8" class="guide-move-arrow"/><circle cx="${originX + target.x * scale}" cy="${originY + target.y * scale}" r="18" class="guide-touch-ring outer"/><circle cx="${originX + target.x * scale}" cy="${originY + target.y * scale}" r="7" class="guide-touch-ring inner"/><path d="M${originX + target.x * scale + 1} 85v29m0-18 10 4 8 15m-18-12-9 8" class="guide-hand"/>`);
    guideTileAtAxial(svg, 6, originX, originY, scale, 0, 0, 1, true);
    guideMarkup(svg, `<g class="guide-rotate-badges"><circle cx="31" cy="27" r="18"/><g transform="translate(19 15)">${ICON_PATHS.rotateLeft}</g><circle cx="76" cy="27" r="18"/><g transform="translate(64 15)">${ICON_PATHS.rotateRight}</g></g><g class="guide-tap-label"><rect x="153" y="119" width="54" height="23" rx="11.5"/><text x="180" y="135">TOCA</text></g>`);
  } else if (index === 3) {
    const originX = 94;
    const originY = 49;
    const scale = .48;
    guideTileAtAxial(svg, 1, originX, originY, scale, 0, 0, 0);
    guideTileAtAxial(svg, 2, originX, originY, scale, 1, 0, 2);
    guideTileAtAxial(svg, 5, originX, originY, scale, 0, 1, 4);
    guideMarkup(svg, `<path d="M117 62 117 88 140 75Z" class="guide-loop-guide"/><g class="guide-circuit-label"><rect x="11" y="14" width="77" height="25" rx="12.5"/><path d="m24 27 5 5 10-12"/><text x="47" y="31">TANCAT</text></g><g class="guide-eye-label"><path d="M166 120c14-14 32-14 46 0-14 14-32 14-46 0Z"/><circle cx="189" cy="120" r="5"/><text x="189" y="146">SEGUEIX EL GROC</text></g>`);
  } else if (index === 4) {
    const originX = 75;
    const originY = 47;
    const scale = .42;
    [[1, 0, 0, 0], [2, 1, 0, 1], [3, 0, 1, 2], [4, -1, 1, 3]].forEach(([tileId, q, r, rotation]) => guideTileAtAxial(svg, tileId, originX, originY, scale, q, r, rotation));
    guideMarkup(svg, `<path d="M157 48v45m-9-9 9 9 9-9" class="guide-to-tray-arrow"/><g class="guide-empty-tray"><path d="M176 62h50l-6 36h-38Z"/><text x="201" y="88">0</text></g><g class="guide-all-label"><rect x="163" y="108" width="70" height="27" rx="13.5"/><text x="198" y="126">TOTES ✓</text></g>`);
  } else {
    const scale = .25;
    const ringOrigin = { x: 59, y: 78 };
    HEX_DIRECTIONS.forEach(([q, r], tileIndex) => guideTileAtAxial(svg, tileIndex + 1, ringOrigin.x, ringOrigin.y, scale, q, r, tileIndex));
    const compactOrigin = { x: 176, y: 67 };
    [[0, 0], [1, 0], [0, 1], [1, -1], [-1, 1], [0, -1]].forEach(([q, r], tileIndex) => guideTileAtAxial(svg, tileIndex + 5, compactOrigin.x, compactOrigin.y, scale, q, r, tileIndex));
    guideMarkup(svg, `<text x="59" y="16" class="guide-compare-label bad">AMB FORAT</text><text x="181" y="16" class="guide-compare-label good">COMPACTA</text><circle cx="59" cy="78" r="13" class="guide-hole-warning"/><path d="m52 71 14 14m0-14-14 14" class="guide-bad-mark"/><circle cx="181" cy="128" r="15" class="guide-ok-badge"/><path d="m174 128 5 5 9-11" class="guide-ok-mark"/>`);
  }
}

function createTutorialPractice() {
  return { selected: false, rotation: 0, rotated: false, moveSelected: false, moved: false, contactChoice: null };
}

function tutorialStepComplete(step = state.tutorialStep) {
  const practice = state.tutorialPractice;
  return [practice.selected, practice.rotated, practice.moved, practice.contactChoice === "correct"][step];
}

function rerenderTutorial() {
  renderTutorial();
  bindGlobalActions();
  skipLink?.classList.remove("is-visible");
  const complete = tutorialStepComplete();
  const focusTarget = complete
    ? document.querySelector("#tutorial-next")
    : state.tutorialStep === 2 && state.tutorialPractice.moveSelected
      ? document.querySelector('.tutorial-move-cell[data-q="2"]')
      : state.tutorialStep === 3 && state.tutorialPractice.contactChoice === "wrong"
        ? document.querySelector('[data-contact="correct"]')
        : document.querySelector("#tutorial-stage button, #tutorial-stage [role='button']");
  focusTarget?.focus({ preventScroll: true });
}

function renderTutorial() {
  if (!state.tutorialPractice) state.tutorialPractice = createTutorialPractice();
  const steps = [
    { title: "Selecciona una fitxa", text: "Toca directament la fitxa de la safata. Quan quedi marcada amb un contorn violeta, estarà preparada per girar o moure.", instruction: "Toca la fitxa negra de la demostració." },
    { title: "Gira-la 60 graus", text: "Cada toc gira exactament una sisena part de volta. Prova els dos sentits i observa com canvien els colors que arriben a cada costat.", instruction: "Prem Esquerra o Dreta com ho faries durant la partida." },
    { title: "Mou-la sense arrossegar", text: "En una pantalla petita pots seleccionar una fitxa i després tocar una cel·la buida. És més precís que arrossegar-la.", instruction: "Toca la fitxa i, després, la cel·la verda." },
    { title: "Revisa el contacte", text: "Dues fitxes només encaixen cromàticament quan els dos costats que es toquen tenen el mateix color.", instruction: "Tria quin dels dos contactes és correcte." }
  ];
  const step = steps[state.tutorialStep];
  const complete = tutorialStepComplete();
  const progressDots = steps.map((_, index) => `<span class="tutorial-step-dot${index < state.tutorialStep ? " is-done" : index === state.tutorialStep ? " is-current" : ""}" aria-hidden="true">${index < state.tutorialStep ? "✓" : index + 1}</span>`).join("");
  app.innerHTML = pageTemplate(`<section class="tutorial-panel" aria-labelledby="tutorial-title">
    <div class="tutorial-progress"><span>Pas ${state.tutorialStep + 1} de ${steps.length}</span><div class="tutorial-stepper">${progressDots}</div></div>
    <p class="eyebrow">Tutorial pràctic</p><h1 id="tutorial-title">${step.title}</h1><p class="tutorial-explanation">${step.text}</p>
    <div class="tutorial-stage" id="tutorial-stage" data-step="${state.tutorialStep}"></div>
    <p class="tutorial-task${complete ? " is-complete" : ""}" id="tutorial-task" aria-live="polite">${complete ? `✓ Molt bé. ${state.tutorialStep === 3 ? "Ja saps identificar un contacte correcte." : "Pots continuar."}` : step.instruction}</p>
    <div class="tutorial-actions"><button class="primary-button has-icon" type="button" id="tutorial-next" ${complete ? "" : "disabled"}><span>${state.tutorialStep === steps.length - 1 ? "Acaba el tutorial" : "Continua"}</span>${iconSvg("next")}</button><button class="quiet-button" type="button" data-action="skip-tutorial">Omet el tutorial</button></div>
  </section>`, { back: true });
  renderTutorialStage(document.querySelector("#tutorial-stage"));
  document.querySelector("#tutorial-next").addEventListener("click", () => {
    if (!tutorialStepComplete()) return;
    if (state.tutorialStep < steps.length - 1) {
      state.tutorialStep += 1;
      rerenderTutorial();
    } else finishTutorial();
  });
}

function renderTutorialStage(stage) {
  const practice = state.tutorialPractice;
  if (state.tutorialStep === 0) {
    stage.innerHTML = `<div class="tutorial-tray-demo"><span class="tutorial-stage-label">Safata</span><button type="button" class="tutorial-piece-button${practice.selected ? " is-selected" : ""}" aria-label="Selecciona la fitxa de pràctica"><span class="tutorial-tap-callout">TOCA</span></button></div><div class="tutorial-stage-note">${practice.selected ? "Seleccionada" : "Encara no seleccionada"}</div>`;
    document.querySelector(".tutorial-piece-button").append(createTileSvg(4, { rotation: 0, selected: practice.selected, patterns: state.patterns, decorative: true }));
    document.querySelector(".tutorial-piece-button").addEventListener("click", () => { practice.selected = true; rerenderTutorial(); });
  } else if (state.tutorialStep === 1) {
    stage.innerHTML = `<div class="tutorial-rotate-demo"><div class="tutorial-rotating-tile"></div><div class="tutorial-rotation-controls"><button class="secondary-button has-icon tutorial-turn-left" type="button">${iconSvg("rotateLeft")}<span>Esquerra</span></button><button class="secondary-button has-icon tutorial-turn-right" type="button"><span>Dreta</span>${iconSvg("rotateRight")}</button></div><span class="tutorial-angle">${practice.rotation * 60}°</span></div>`;
    document.querySelector(".tutorial-rotating-tile").append(createTileSvg(4, { rotation: practice.rotation, selected: true, patterns: state.patterns, decorative: true }));
    document.querySelector(".tutorial-turn-left").addEventListener("click", () => { practice.rotation = (practice.rotation + 5) % 6; practice.rotated = true; rerenderTutorial(); });
    document.querySelector(".tutorial-turn-right").addEventListener("click", () => { practice.rotation = (practice.rotation + 1) % 6; practice.rotated = true; rerenderTutorial(); });
  } else if (state.tutorialStep === 2) {
    const svg = guideSvg("tutorial-moviment");
    svg.setAttribute("viewBox", "0 0 300 170");
    svg.classList.add("tutorial-move-board");
    svg.removeAttribute("aria-hidden");
    svg.setAttribute("role", "group");
    svg.setAttribute("aria-label", "Pràctica per seleccionar i moure una fitxa");
    stage.append(svg);
    const originX = 88;
    const originY = 84;
    const scale = .72;
    [[0, 0], [1, 0], [2, -1]].forEach(([q, r]) => guideCell(svg, originX, originY, scale, q, r, q === 2 ? `tutorial-move-cell${practice.moveSelected ? " is-ready" : ""}` : "tutorial-move-cell"));
    const tilePosition = practice.moved ? [2, -1] : [0, 0];
    const tile = guideTileAtAxial(svg, 4, originX, originY, scale, tilePosition[0], tilePosition[1], practice.rotation, practice.moveSelected || practice.moved);
    tile.setAttribute("role", "button");
    tile.setAttribute("tabindex", "0");
    tile.setAttribute("aria-label", "Selecciona la fitxa de pràctica");
    const target = svg.querySelector('.tutorial-move-cell[data-q="2"]');
    target.setAttribute("role", "button");
    target.setAttribute("tabindex", "0");
    target.setAttribute("aria-label", "Mou la fitxa a la cel·la verda");
    const activate = (element, callback) => {
      element.addEventListener("click", callback);
      element.addEventListener("keydown", event => { if (["Enter", " "].includes(event.key)) { event.preventDefault(); callback(); } });
    };
    activate(tile, () => { if (!practice.moved) { practice.moveSelected = true; rerenderTutorial(); } });
    activate(target, () => { if (practice.moveSelected) { practice.moved = true; rerenderTutorial(); } });
    guideMarkup(svg, practice.moved ? `<circle cx="${originX + axialToPixel(2, -1, BOARD_RADIUS).x * scale + 28}" cy="55" r="15" class="guide-ok-badge"/><path d="m${originX + axialToPixel(2, -1, BOARD_RADIUS).x * scale + 21} 55 5 5 9-11" class="guide-ok-mark"/>` : `<path d="M126 84H190" class="tutorial-move-arrow"/><path d="m183 76 9 8-9 8" class="tutorial-move-arrow"/>`);
  } else {
    stage.innerHTML = `<div class="tutorial-contact-options"><button type="button" class="tutorial-contact-choice" data-contact="wrong"><span>Contacte A</span><span class="tutorial-contact-svg"></span></button><button type="button" class="tutorial-contact-choice" data-contact="correct"><span>Contacte B</span><span class="tutorial-contact-svg"></span></button></div>`;
    stage.querySelectorAll(".tutorial-contact-choice").forEach(button => {
      button.querySelector(".tutorial-contact-svg").append(createTutorialContactDiagram(button.dataset.contact === "correct"));
      button.classList.toggle("is-wrong", practice.contactChoice === "wrong" && button.dataset.contact === "wrong");
      button.classList.toggle("is-correct", practice.contactChoice === "correct" && button.dataset.contact === "correct");
      button.addEventListener("click", () => { practice.contactChoice = button.dataset.contact; rerenderTutorial(); });
    });
    if (practice.contactChoice === "wrong") document.querySelector("#tutorial-task").textContent = "Encara no: aquí es toquen un costat blau i un de vermell. Compara-ho amb l’altre contacte.";
  }
}

function createTutorialContactDiagram(correct) {
  const svg = guideSvg(correct ? "contacte-correcte" : "contacte-incorrecte");
  svg.setAttribute("viewBox", "0 0 190 120");
  const originX = 70;
  const originY = 43;
  const scale = .55;
  guideTileAtAxial(svg, 7, originX, originY, scale, 0, 0, 0);
  guideTileAtAxial(svg, 8, originX, originY, scale, 1, 0, correct ? 3 : 0);
  const neighbor = axialToPixel(1, 0, BOARD_RADIUS);
  const contactX = originX + neighbor.x * scale / 2;
  const contactY = originY + neighbor.y * scale / 2;
  guideMarkup(svg, `<circle cx="${contactX}" cy="${contactY}" r="10" class="tutorial-contact-ring${correct ? " is-match" : " is-mismatch"}"/>`);
  return svg;
}

function finishTutorial() {
  localStorage.setItem(TUTORIAL_KEY, "true");
  state.tutorialStep = 0;
  state.tutorialPractice = null;
  state.route = "home";
  render();
}

function renderSettings() {
  app.innerHTML = pageTemplate(`<section aria-labelledby="settings-title"><div class="section-heading settings-heading"><div><p class="eyebrow">Preferències</p><h1 id="settings-title">Configuració</h1></div><button class="primary-button has-icon settings-done-button" type="button" data-action="home">${iconSvg("check")}<span>Fet</span></button></div><div class="settings-grid">
    <div class="setting-row"><div><h3>Diferencia millor els colors</h3><p>Afegeix punts al vermell i ratlles al blau.</p></div><label class="switch"><input id="patterns-setting" type="checkbox" ${state.patterns ? "checked" : ""}><span aria-hidden="true"></span><span class="sr-only">Patrons de color</span></label></div>
    <div class="setting-row"><div><h3>Instal·la l’app</h3><p>Disponible quan el navegador permet instal·lar aquesta PWA.</p></div><button class="secondary-button has-icon settings-button" type="button" id="install-app" ${state.deferredInstallPrompt ? "" : "disabled"}>${iconSvg("install")}<span>Instal·la</span></button></div>
    <div class="setting-row"><div><h3>Canvia de jugador</h3><p>El progrés d’aquest nom continuarà desat al dispositiu.</p></div><button class="secondary-button has-icon settings-button" type="button" data-action="change-player">${iconSvg("user")}<span>Canvia</span></button></div>
    <div class="setting-row sync-setting"><div><h3>Desat del progrés</h3><p>Les fites es desen primer al dispositiu i se sincronitzen automàticament en segon pla quan hi ha connexió.</p><div class="settings-sync-state">${syncTemplate()}</div></div><button class="secondary-button has-icon settings-button sync-now-button" type="button" id="sync-now" ${getEndpoint() ? "" : "disabled"}>${iconSvg("sync")}<span>Sincronitza ara</span></button></div>
  </div></section>`, { back: true });
  document.querySelector("#patterns-setting").addEventListener("change", event => {
    state.patterns = event.currentTarget.checked;
    localStorage.setItem(PATTERNS_KEY, String(state.patterns));
    announce(state.patterns ? "Patrons de color activats" : "Patrons de color desactivats");
  });
  document.querySelector("#sync-now").addEventListener("click", async event => {
    const button = event.currentTarget;
    button.disabled = true;
    button.textContent = "Sincronitzant…";
    await attemptSync();
    if (state.route === "settings") {
      renderSettings();
      bindGlobalActions();
      announce(state.syncState === "synced" ? "Progrés sincronitzat" : "El progrés continua desat al dispositiu");
    }
  });
  document.querySelector("#install-app").addEventListener("click", async () => {
    if (!state.deferredInstallPrompt) return;
    state.deferredInstallPrompt.prompt();
    await state.deferredInstallPrompt.userChoice;
    state.deferredInstallPrompt = null;
    renderSettings();
    bindGlobalActions();
  });
}

function bindGlobalActions() {
  document.querySelectorAll("[data-action]").forEach(element => {
    if (element.dataset.bound) return;
    element.dataset.bound = "true";
    element.addEventListener("click", async () => {
      const action = element.dataset.action;
      if (action === "landing") {
        if (state.game) await persistGame();
        localStorage.removeItem(ACTIVE_PLAYER_KEY);
        state.player = null;
        state.game = null;
        state.success = null;
        state.route = "login";
        render();
      } else if (action === "home" || action === "brand-home") {
        if (!state.player) return;
        if (state.game) await persistGame();
        state.route = "home";
        state.game = null;
        state.success = null;
        render();
      } else if (action === "continue") {
        const completed = state.player.completedChallenges.length;
        if (completed === 10) {
          document.querySelector(".challenge-path")?.scrollIntoView({ behavior: "smooth", block: "center" });
        } else void startGame(CHALLENGE_DEFINITIONS[completed].id);
      } else if (["ranking", "guide", "settings", "tutorial"].includes(action)) {
        if (action === "tutorial") {
          state.tutorialStep = 0;
          state.tutorialPractice = createTutorialPractice();
        }
        state.route = action;
        render();
      } else if (action === "skip-tutorial") finishTutorial();
      else if (action === "change-player") {
        localStorage.removeItem(ACTIVE_PLAYER_KEY);
        state.player = null;
        state.game = null;
        state.route = "login";
        render();
      }
    });
  });
}

async function mergeRemoteProgress() {
  if (!state.player || !getEndpoint()) return;
  try {
    const data = await fetchPlayer(state.player.displayName);
    const remote = data.player?.completedChallenges || [];
    state.player.completedChallenges = [...new Set([...state.player.completedChallenges, ...remote])]
      .filter(id => CHALLENGE_BY_ID.has(id))
      .sort((a, b) => CHALLENGE_BY_ID.get(a).order - CHALLENGE_BY_ID.get(b).order);
    await savePlayer();
    state.syncState = "synced";
    state.syncLabel = "Sincronitzat";
    if (state.route === "home") render();
  } catch {
    state.syncState = "pending";
    state.syncLabel = "Desat al dispositiu";
  }
}

async function attemptSync() {
  if (!state.player || !getEndpoint()) return;
  try {
    await syncPending(state.player.displayName, state.player.normalizedName);
    state.syncState = "synced";
    state.syncLabel = "Sincronitzat";
  } catch {
    state.syncState = "pending";
    state.syncLabel = "Desat al dispositiu";
  }
  if (state.route === "home" || (state.route === "game" && !state.success)) render();
}

document.addEventListener("keydown", event => {
  if (state.route !== "game" || !state.game || state.success) return;
  const focusedTile = event.target.closest?.("[data-tile-id]");
  const focusedTileId = focusedTile ? Number(focusedTile.dataset.tileId) : null;
  const selected = focusedTileId ?? state.game.selectedTileId;
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
    event.preventDefault();
    if (event.shiftKey) state.game.redo(); else state.game.undo();
    void persistAndRenderGame(true);
  } else if (selected && ["q", "e"].includes(event.key.toLowerCase())) {
    event.preventDefault();
    state.game.rotate(selected, event.key.toLowerCase() === "q" ? -1 : 1);
    persistRenderAndRestoreTileFocus(true, selected);
  } else if (focusedTile && ["Enter", " "].includes(event.key)) {
    event.preventDefault();
    state.game.select(Number(focusedTile.dataset.tileId));
    void persistAndRenderGame(false);
  } else if (selected && ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"].includes(event.key)) {
    event.preventDefault();
    const directionByKey = { ArrowRight: 0, ArrowDown: 1, ArrowLeft: 3, ArrowUp: 4 };
    const piece = state.game.pieces.find(item => item.tileId === selected);
    const [dq, dr] = HEX_DIRECTIONS[directionByKey[event.key]];
    let q = piece.location === "BOARD" ? piece.q + dq : 0;
    let r = piece.location === "BOARD" ? piece.r + dr : 0;
    const occupied = new Set(state.game.boardLayout().filter(item => item.tileId !== selected).map(item => `${item.q},${item.r}`));
    while (occupied.has(`${q},${r}`) && isInsideBoardGrid(q, r)) {
      q += dq;
      r += dr;
    }
    if (isInsideBoardGrid(q, r)) state.game.place(selected, q, r);
    persistRenderAndRestoreTileFocus(true, selected);
  } else if (["+", "="].includes(event.key)) handleGameAction("zoom-in");
  else if (event.key === "-") handleGameAction("zoom-out");
  else if (event.key === "0") handleGameAction("center");
  else if (event.key === "Escape") {
    state.game.selectedTileId = null;
    renderGame();
  }
});

window.addEventListener("online", () => void attemptSync());
window.addEventListener("beforeinstallprompt", event => {
  event.preventDefault();
  state.deferredInstallPrompt = event;
});
document.addEventListener("visibilitychange", () => { if (document.hidden && state.game) void persistGame(); });

if (import.meta.env.DEV && new URLSearchParams(location.search).has("test")) {
  window.__tantrixTest = {
    getState: () => state,
    openChallenge(challengeId) {
      const challenge = CHALLENGE_BY_ID.get(challengeId);
      if (!challenge) return false;
      state.game = new GameState(challenge);
      state.route = "game";
      state.success = null;
      renderGame();
      return true;
    },
    async stageLayout(layout) {
      if (!state.game) return false;
      state.game.pieces = state.game.pieces.map(piece => {
        const solved = layout.find(item => item.tileId === piece.tileId);
        return solved ? { ...piece, ...solved, location: "BOARD" } : piece;
      });
      await persistGame();
      renderGame();
      return true;
    },
    async placeLayout(layout) {
      if (!state.game) return false;
      state.game.pieces = state.game.pieces.map(piece => {
        const solved = layout.find(item => item.tileId === piece.tileId);
        return solved ? { ...piece, ...solved, location: "BOARD" } : piece;
      });
      await persistAndRenderGame(true);
      return true;
    }
  };
}

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("./sw.js", { updateViaCache: "none" });
      await registration.update();
    } catch {
      // L’app continua operativa encara que el navegador no permeti actualitzar la PWA.
    }
  });
}

initialize();
