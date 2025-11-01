// --- Elements del DOM ---
const nameModal = document.getElementById('name-modal');
const gameContent = document.getElementById('game-content');
const nameInput = document.getElementById('name-input');
const rememberCheckbox = document.getElementById('remember-checkbox');
const submitNameButton = document.getElementById('submit-name-button');

const gameTitleEl = document.getElementById('game-title');
const startButton = document.getElementById('start-button');
const rankingButton = document.getElementById('ranking-button');
const levelEl = document.getElementById('level');
const messageEl = document.getElementById('message');

const colorButtons = {
  green: document.getElementById('green'),
  red: document.getElementById('red'),
  yellow: document.getElementById('yellow'),
  blue: document.getElementById('blue')
};
const colors = Object.keys(colorButtons);

// --- Àudio (Tone.js) ---
const synth = new Tone.Synth().toDestination();
const sounds = { green: 'C4', red: 'E4', yellow: 'G4', blue: 'C5' };

// --- Estat del joc ---
let level = 1;
let sequence = [];
let playerSequenceIndex = 0;
let gameState = 'waiting'; // 'waiting' | 'showing' | 'playing' | 'gameover'
let playerName = '';
let bestScore = 0;

// Timer per mostrar seqüència
let sequenceTimer = null;

// --- Helpers globals ---
function isNameModalOpen() {
  return !nameModal.classList.contains('hidden');
}
function ensureAudioContext() {
  if (Tone.context.state !== 'running') Tone.context.resume();
}
function clearSequenceTimer() {
  if (sequenceTimer !== null) {
    clearInterval(sequenceTimer);
    sequenceTimer = null;
  }
}

// --- Entrada del nom i preferències ---
function initializeNameEntry() {
  const savedName = localStorage.getItem('simonPlayerName');
  const rememberPreference = localStorage.getItem('rememberPreference') === 'true';

  // Mostra sempre el modal d'entrada de nom d'entrada
  nameModal.classList.remove('hidden');
  gameContent.classList.add('hidden');

  if (savedName) {
    nameInput.value = savedName;
    rememberCheckbox.checked = rememberPreference;
    playerName = savedName;
    bestScore = Number(localStorage.getItem('simonBestScore') || 0);
  }

  submitNameButton.addEventListener('click', submitName);
  nameInput.addEventListener('keyup', (event) => {
    if (event.key === 'Enter') submitName();
  });

  setTimeout(() => nameInput.focus(), 100);

  function submitName() {
    const name = nameInput.value.trim();
    if (!name) {
      nameInput.placeholder = "¡Por favor, escribe un nombre!";
      nameInput.classList.add('placeholder-error');
      setTimeout(() => {
        nameInput.placeholder = "Escriu el teu nom";
        nameInput.classList.remove('placeholder-error');
        nameInput.focus();
      }, 2000);
      return;
    }

    playerName = name;
    if (rememberCheckbox.checked) {
      localStorage.setItem('simonPlayerName', playerName);
      localStorage.setItem('rememberPreference', 'true');
    } else {
      localStorage.removeItem('simonPlayerName');
      localStorage.removeItem('rememberPreference');
    }

    gameTitleEl.textContent = 'Simon';
    nameModal.classList.add('hidden');
    gameContent.classList.remove('hidden');
    messageEl.textContent = 'Pulsa "Inicia" per jugar';
  }
}

// --- So i il·luminació ---
function playSound(color) {
  ensureAudioContext();
  synth.triggerAttackRelease(sounds[color], '8n');
}
function lightUpButton(color) {
  const button = colorButtons[color];
  button.classList.add('lit');
  playSound(color);
  setTimeout(() => button.classList.remove('lit'), 400);
}

// --- Mostrar seqüència ---
function showSequence() {
  gameState = 'showing';
  messageEl.textContent = 'Memoritza la seqüència...';
  startButton.disabled = true;

  let i = 0;
  clearSequenceTimer();

  // Mostra 1 color cada 700 ms
  sequenceTimer = setInterval(() => {
    const c = sequence[i];
    if (!c) {
      // Guard: si per qualsevol motiu no hi ha color, tanquem net
      clearSequenceTimer();
      gameState = 'playing';
      playerSequenceIndex = 0;
      messageEl.textContent = 'El teu torn!';
      return;
    }
    lightUpButton(c);
    i++;
    if (i >= sequence.length) {
      clearSequenceTimer();
      // Petit marge abans de començar el torn del jugador
      setTimeout(() => {
        gameState = 'playing';
        playerSequenceIndex = 0;
        messageEl.textContent = 'El teu torn!';
      }, 200);
    }
  }, 700);
}

// --- Torn següent ---
function nextTurn() {
  levelEl.textContent = level;
  const randomColor = colors[Math.floor(Math.random() * colors.length)];
  sequence.push(randomColor);
  showSequence();
}

// --- Inici de partida ---
function startGame() {
  // Si s'està mostrant seqüència, ignorem reentrada
  if (gameState === 'showing') return;

  ensureAudioContext();
  clearSequenceTimer();

  level = 1;
  sequence = [];
  playerSequenceIndex = 0;
  gameState = 'waiting';

  startButton.textContent = 'Inicia';
  messageEl.textContent = "Concentra't...";
  startButton.disabled = true;

  setTimeout(nextTurn, 600);
}

// --- Entrada del jugador ---
function handlePlayerInput(color) {
  // Bloqueja si modal de nom visible o no és torn de jugador
  if (isNameModalOpen() || gameState !== 'playing') return;

  lightUpButton(color);

  if (color === sequence[playerSequenceIndex]) {
    playerSequenceIndex++;
    if (playerSequenceIndex >= sequence.length) {
      messageEl.textContent = 'Correcte!';
      level++;
      gameState = 'waiting';
      setTimeout(nextTurn, 900);
    }
  } else {
    endGame();
  }
}

// --- Fi de partida ---
function endGame() {
  gameState = 'gameover';
  messageEl.textContent = `Error! Has arribat al nivell ${level}.`;

  document.body.classList.add('bg-red-900');
  setTimeout(() => document.body.classList.remove('bg-red-900'), 500);

  startButton.disabled = false;
  startButton.textContent = 'Torna a Jugar';

  if (level > bestScore) {
    bestScore = level;
    localStorage.setItem('simonBestScore', String(bestScore));
    messageEl.textContent = `Nova marca personal! Has arribat al nivell ${level}.`;
    showSendScoreDialog();
  }
}

// --- Diàleg d'enviament de marca ---
function showSendScoreDialog() {
  const confirmModal = document.createElement('div');
  confirmModal.id = 'confirm-modal';
  confirmModal.innerHTML = `
    <div class="modal-content">
      <h2>🏆 Nova Marca Personal!</h2>
      <p>Vols enviar el teu rècord al rànquing global?</p>
      <div class="modal-buttons">
        <button id="send-score-yes">Sí, enviar</button>
        <button id="send-score-no">No, gràcies</button>
      </div>
    </div>
  `;

  const style = document.createElement('style');
  style.textContent = `
    #confirm-modal .modal-buttons { display:flex; gap:1rem; justify-content:center; margin-top:1.5rem; }
    #confirm-modal #send-score-yes, #confirm-modal #send-score-no {
      padding:0.75rem 1.5rem; border-radius:9999px; font-weight:700; border:none; cursor:pointer; transition:all .3s ease;
    }
    #confirm-modal #send-score-yes { background:linear-gradient(135deg, var(--accent-color) 0%, var(--accent-hover) 100%); color:var(--primary-bg-color); }
    #confirm-modal #send-score-no { background:linear-gradient(135deg, #6b7280 0%, #4b5563 100%); color:white; }
    #confirm-modal #send-score-yes:hover, #confirm-modal #send-score-no:hover { transform:translateY(-2px) scale(1.05); box-shadow:0 4px 8px rgba(0,0,0,.2); }
  `;
  document.head.appendChild(style);
  document.body.appendChild(confirmModal);

  const close = () => {
    if (confirmModal.parentNode) document.body.removeChild(confirmModal);
    if (style.parentNode) document.head.removeChild(style);
    startButton.disabled = false;
    startButton.textContent = 'Torna a Jugar';
  };

  document.getElementById('send-score-yes').addEventListener('click', () => {
    sendScore(playerName, bestScore);
    close();
  });
  document.getElementById('send-score-no').addEventListener('click', close);
  confirmModal.addEventListener('click', (e) => { if (e.target === confirmModal) close(); });
}

// --- API rànquing ---
function sendScore(name, score) {
  fetch('https://script.google.com/macros/s/AKfycbyTnaRWXneulJ2E3w2t_lx7GDslA_2NtN9-o4cR6WUal3m9q3op8KNf-FtQIoAOV_wbFg/exec', {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, score })
  });
}

function showRanking() {
  if (isNameModalOpen()) return;

  let existingModal = document.getElementById('ranking-modal');
  if (existingModal) document.body.removeChild(existingModal);

  const rankingModal = document.createElement('div');
  rankingModal.id = 'ranking-modal';
  rankingModal.innerHTML = `
    <div class="modal-content">
      <h2>🏆 Rànquing Global</h2>
      <div class="loading-container">
        <p>Carregant dades...</p><div class="spinner"></div>
      </div>
      <button id="close-ranking">Tancar</button>
    </div>
  `;
  document.body.appendChild(rankingModal);

  const spinnerStyle = document.createElement('style');
  spinnerStyle.textContent = `
    .loading-container { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:2rem 0; }
    .spinner { width:40px; height:40px; border:4px solid rgba(245,158,11,.2); border-top:4px solid var(--accent-color); border-radius:50%; animation:spin 1s linear infinite; margin-top:1rem; }
    @keyframes spin { 0%{transform:rotate(0)} 100%{transform:rotate(360deg)} }
  `;
  document.head.appendChild(spinnerStyle);

  const close = () => {
    if (rankingModal.parentNode) document.body.removeChild(rankingModal);
    if (spinnerStyle.parentNode) document.head.removeChild(spinnerStyle);
  };
  document.getElementById('close-ranking').addEventListener('click', close);

  fetch('https://script.google.com/macros/s/AKfycbyTnaRWXneulJ2E3w2t_lx7GDslA_2NtN9-o4cR6WUal3m9q3op8KNf-FtQIoAOV_wbFg/exec')
    .then(r => r.json())
    .then(ranking => {
      ranking.sort((a, b) => b.score - a.score);
      let html = `
        <div class="ranking-header">
          <h2>🏆 Rànquing global</h2>
        </div>
        <ol class="ranking-list">
      `;
      if (ranking.length) {
        ranking.slice(0, 20).forEach((p, i) => {
          const isCurrent = p.name === playerName;
          const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '';
          const extra = (i < 3 ? ' top-player' : '') + (isCurrent ? ' current-player' : '');
          html += `<li class="${extra}"><span class="rank-number">${i + 1}.</span><span class="player-name">${medal} ${p.name}</span><span class="player-score">${p.score}</span></li>`;
        });
      } else {
        html += `<li class="no-scores">No hi ha puntuacions encara</li>`;
      }
      html += `</ol>`;

      rankingModal.querySelector('.modal-content').innerHTML = `${html}<button id="close-ranking">Tancar</button>`;
      document.getElementById('close-ranking').addEventListener('click', close);
    })
    .catch(err => {
      console.error('Error fetching ranking:', err);
      const html = `<h2>🏆 Rànquing Global</h2><p>Hi ha hagut un error carregant el rànquing. Torna-ho a provar més tard.</p>`;
      rankingModal.querySelector('.modal-content').innerHTML = `${html}<button id="close-ranking">Tancar</button>`;
      document.getElementById('close-ranking').addEventListener('click', close);
    });
}

// --- Esdeveniments (una sola vegada, sense duplicats) ---
startButton.addEventListener('click', () => {
  if (isNameModalOpen()) return;
  startGame();
});

// Unifica entrada a colors amb pointerdown (serveix per mouse i touch)
Object.values(colorButtons).forEach(btn => {
  btn.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    handlePlayerInput(btn.dataset.color);
  }, { passive: false });
});

rankingButton.addEventListener('click', () => {
  if (isNameModalOpen()) return;
  showRanking();
});

// Teclat (només quan no hi ha modal)
document.addEventListener('keydown', (e) => {
  if (isNameModalOpen()) return;

  const k = e.key.toLowerCase();
  if (k === ' ') {
    e.preventDefault();
    startGame();
    return;
  }
  const map = { q: 'green', a: 'green', w: 'red', s: 'red', z: 'yellow', x: 'yellow', e: 'blue', d: 'blue' };
  if (map[k]) handlePlayerInput(map[k]);
});

// --- Inicialització ---
initializeNameEntry();