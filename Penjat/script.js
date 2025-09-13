(() => {
  'use strict';

  // Elements
  const setupPanel = document.getElementById('setupPanel');
  const gamePanel = document.getElementById('gamePanel');
  const secretInput = document.getElementById('secretInput');
  const toggleSecret = document.getElementById('toggleSecret');
  const startBtn = document.getElementById('startBtn');
  const demoBtn = document.getElementById('demoBtn');
  const resetBtn = document.getElementById('resetBtn');

  const statusMsg = document.getElementById('statusMsg');
  const wordSlots = document.getElementById('wordSlots');
  const letterInput = document.getElementById('letterInput');
  const guessBtn = document.getElementById('guessBtn');
  const wrongLettersEl = document.getElementById('wrongLetters');
  const keyboardEl = document.getElementById('keyboard');

  const canvas = document.getElementById('hangmanCanvas');
  const ctx = canvas.getContext('2d');

  // Overlays
  const winOverlay = document.getElementById('winOverlay');
  const loseOverlay = document.getElementById('loseOverlay');
  const winWordEl = document.getElementById('winWord');
  const loseWordEl = document.getElementById('loseWord');
  const playAgainWin = document.getElementById('playAgainWin');
  const playAgainLose = document.getElementById('playAgainLose');
  const confettiWrap = document.getElementById('confetti');
  const loseCanvas = document.getElementById('loseCanvas');
  const loseCtx = loseCanvas.getContext('2d');

  // State
  const lettersAZ = 'ABCDEFGHIJKLMNOPQRSTUVWXYZÇ'.split('');
  let secretOriginal = '';
  let secretNormalized = '';
  let revealed = [];
  let guessed = new Set();
  let wrong = new Set();
  const MAX_WRONG = 8;
  let gameOver = false;

  // Utils
  const normalize = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const isLetter = (ch) => /[a-zç]/i.test(ch);
  const toUpper = (s) => s.toLocaleUpperCase('ca-ES');

  function setStatus(text, kind = 'info') {
    statusMsg.textContent = text;
    statusMsg.style.color = kind === 'ok' ? 'var(--ok)'
      : kind === 'bad' ? 'var(--bad)'
      : kind === 'warn' ? 'var(--warn)'
      : 'var(--accent)';
  }

  // Keyboard build
  function buildKeyboard() {
    keyboardEl.innerHTML = '';
    lettersAZ.forEach((L) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'key';
      b.textContent = L;
      b.addEventListener('click', () => onGuess(L));
      keyboardEl.appendChild(b);
    });
  }

  function updateKeyboardStyles() {
    const map = new Map();
    lettersAZ.forEach((L) => map.set(L, ''));
    guessed.forEach((g) => map.set(g, 'used'));
    wrong.forEach((w) => map.set(w, 'used bad'));
    // Mark good letters as used good
    for (let i = 0; i < secretOriginal.length; i++) {
      const ch = secretOriginal[i];
      const norm = normalize(ch).toUpperCase();
      if (revealed[i] && isLetter(norm)) {
        map.set(norm, 'used good');
      }
    }
    // Apply
    const keys = keyboardEl.querySelectorAll('.key');
    keys.forEach((el) => {
      const label = el.textContent;
      el.className = 'key';
      const extra = map.get(label);
      if (extra) el.className += ' ' + extra;
      el.disabled = el.className.includes('used');
    });
  }

  // Word rendering
  function renderWord() {
    wordSlots.innerHTML = '';
    for (let i = 0; i < secretOriginal.length; i++) {
      const wrap = document.createElement('div');
      const ch = secretOriginal[i];
      if (ch === ' ') {
        wrap.className = 'slot space';
        wrap.textContent = '';
      } else if (!isLetter(ch)) {
        // Symbols like hyphen get revealed automatically
        wrap.className = 'slot revealed';
        wrap.textContent = ch;
      } else {
        wrap.className = 'slot' + (revealed[i] ? ' revealed' : '');
        wrap.textContent = revealed[i] ? toUpper(ch) : '';
      }
      wordSlots.appendChild(wrap);
    }
  }

  // Canvas drawing
  function clearCanvasGeneric(c, context) {
    context.clearRect(0, 0, c.width, c.height);
    const g = context.createLinearGradient(0, 0, c.width, c.height);
    g.addColorStop(0, 'rgba(255, 215, 64, 0.15)');
    g.addColorStop(1, 'rgba(0, 188, 212, 0.12)');
    context.fillStyle = g;
    context.fillRect(0, 0, c.width, c.height);
  }
  function clearCanvas() { clearCanvasGeneric(canvas, ctx); }

  function drawBase(context) {
    context.lineWidth = 6;
    context.strokeStyle = '#7c4dff';
    context.beginPath();
    context.moveTo(30, 300); context.lineTo(180, 300);
    context.stroke();
    context.strokeStyle = '#00bcd4';
    context.beginPath();
    context.moveTo(60, 300); context.lineTo(60, 60);
    context.lineTo(220, 60);
    context.lineTo(220, 95);
    context.stroke();
  }

  function drawHead(context) {
    context.lineWidth = 5;
    context.strokeStyle = '#ff8f00';
    context.beginPath();
    context.arc(220, 125, 28, 0, Math.PI * 2);
    context.stroke();
  }

  function drawBody(context) {
    context.lineWidth = 5;
    context.strokeStyle = '#00c853';
    context.beginPath();
    context.moveTo(220, 153); context.lineTo(220, 215);
    context.stroke();
  }

  function drawArmLeft(context) {
    context.lineWidth = 5;
    context.strokeStyle = '#e53935';
    context.beginPath();
    context.moveTo(220, 165); context.lineTo(190, 195);
    context.stroke();
  }

  function drawArmRight(context) {
    context.lineWidth = 5;
    context.strokeStyle = '#e53935';
    context.beginPath();
    context.moveTo(220, 165); context.lineTo(250, 195);
    context.stroke();
  }

  function drawLegLeft(context) {
    context.lineWidth = 5;
    context.strokeStyle = '#7c4dff';
    context.beginPath();
    context.moveTo(220, 215); context.lineTo(195, 260);
    context.stroke();
  }

  function drawLegRight(context) {
    context.lineWidth = 5;
    context.strokeStyle = '#7c4dff';
    context.beginPath();
    context.moveTo(220, 215); context.lineTo(245, 260);
    context.stroke();
  }

  function drawFaceSad(context) {
    context.lineWidth = 3;
    context.strokeStyle = '#e53935';
    // eyes
    context.beginPath(); context.moveTo(210, 115); context.lineTo(216, 121); context.moveTo(216, 115); context.lineTo(210, 121); context.stroke();
    context.beginPath(); context.moveTo(224, 115); context.lineTo(230, 121); context.moveTo(230, 115); context.lineTo(224, 121); context.stroke();
    // mouth
    context.beginPath(); context.arc(220, 135, 8, Math.PI * 0.1, Math.PI - Math.PI * 0.1, true); context.stroke();
  }

  function drawProgressOn(context, canvasEl, n) {
    clearCanvasGeneric(canvasEl, context);
    drawBase(context);
    const steps = [drawHead, drawBody, drawArmLeft, drawArmRight, drawLegLeft, drawLegRight, drawFaceSad];
    for (let i = 0; i < Math.min(n, steps.length); i++) steps[i](context);
  }
  function drawProgress(n) { drawProgressOn(ctx, canvas, n); }

  // Wrong letters rendering
  function renderWrong() {
    wrongLettersEl.innerHTML = '';
    Array.from(wrong).sort().forEach((L) => {
      const c = document.createElement('span');
      c.className = 'chip';
      c.textContent = L;
      wrongLettersEl.appendChild(c);
    });
  }

  function won() {
    return revealed.every((v, i) => v || secretOriginal[i] === ' ' || !isLetter(secretOriginal[i]));
  }

  function lose() {
    return wrong.size >= MAX_WRONG;
  }

  function finishGame(win) {
    gameOver = true;
    letterInput.disabled = true;
    guessBtn.disabled = true;
    // reveal the whole word
    for (let i = 0; i < revealed.length; i++) {
      if (!revealed[i] && isLetter(secretOriginal[i])) revealed[i] = true;
    }
    renderWord();
    updateKeyboardStyles();
    if (win) {
      winWordEl.textContent = toUpper(secretOriginal);
      showWinOverlay();
    } else {
      loseWordEl.textContent = toUpper(secretOriginal);
      showLoseOverlay();
    }
  }

  // Overlays control
  function showWinOverlay() {
    winOverlay.classList.remove('hidden');
    spawnConfetti(60);
  }
  function hideWinOverlay() {
    winOverlay.classList.add('hidden');
    clearConfetti();
  }
  function showLoseOverlay() {
    loseOverlay.classList.remove('hidden');
    drawProgressOn(loseCtx, loseCanvas, MAX_WRONG);
  }
  function hideLoseOverlay() { loseOverlay.classList.add('hidden'); }

  function spawnConfetti(n) {
    if (!confettiWrap) return;
    confettiWrap.innerHTML = '';
    const colors = ['#ff5252','#ffca28','#66bb6a','#42a5f5','#ab47bc','#ec407a','#26c6da'];
    for (let i = 0; i < n; i++) {
      const el = document.createElement('div');
      el.className = 'piece';
      el.style.left = Math.random() * 100 + '%';
      el.style.background = colors[Math.floor(Math.random() * colors.length)];
      const dur = 2.5 + Math.random() * 2.5;
      const delay = Math.random() * 0.8;
      el.style.animationDuration = dur + 's';
      el.style.animationDelay = delay + 's';
      el.style.transform = `translateY(-120%) rotate(${Math.random() * 360}deg)`;
      confettiWrap.appendChild(el);
    }
  }
  function clearConfetti() { if (confettiWrap) confettiWrap.innerHTML = ''; }

  function onGuess(ch) {
    if (gameOver) return;
    const letter = toUpper(ch).trim();
    if (!letter || !isLetter(letter)) {
      setStatus('Introdueix una lletra vàlida.', 'warn');
      return;
    }
    if (guessed.has(letter) || wrong.has(letter)) {
      setStatus('Aquesta lletra ja està provada.', 'warn');
      return;
    }

    const letterNorm = normalize(letter).toUpperCase();
    guessed.add(letter);

    let hit = false;
    for (let i = 0; i < secretOriginal.length; i++) {
      const orig = secretOriginal[i];
      const norm = normalize(orig).toUpperCase();
      if (isLetter(orig) && norm === letterNorm) {
        revealed[i] = true;
        hit = true;
      }
    }

    if (hit) {
      setStatus('✔️ Bona! Continua!', 'ok');
    } else {
      wrong.add(letter);
      setStatus('✖️ No… Prova una altra!', 'bad');
    }

    renderWord();
    renderWrong();
    updateKeyboardStyles();
    drawProgress(wrong.size);

    if (won()) finishGame(true);
    else if (lose()) finishGame(false);
  }

  function startGame(word) {
    secretOriginal = word.trim();
    secretNormalized = normalize(secretOriginal);
    const hasLetter = /[a-zç]/i.test(secretOriginal);
    if (!secretOriginal || !hasLetter) {
      setStatus('Introdueix una paraula amb lletres.', 'warn');
      return false;
    }

    revealed = Array.from(secretOriginal, (ch) => (ch === ' ' || !isLetter(ch) ? true : false));
    guessed = new Set();
    wrong = new Set();
    gameOver = false;

    setupPanel.classList.add('hidden');
    gamePanel.classList.remove('hidden');

    renderWord();
    renderWrong();
    buildKeyboard();
    updateKeyboardStyles();
    drawProgress(0);
    setStatus('Endevina la paraula!');
    letterInput.value = '';
    letterInput.disabled = false;
    guessBtn.disabled = false;
    setTimeout(() => letterInput.focus(), 50);
    return true;
  }

  function resetAll() {
    setupPanel.classList.remove('hidden');
    gamePanel.classList.add('hidden');
    secretInput.value = '';
    letterInput.value = '';
    clearCanvas();
  }

  // Events
  toggleSecret.addEventListener('click', () => {
    if (secretInput.type === 'password') {
      secretInput.type = 'text';
      toggleSecret.textContent = '🙈';
    } else {
      secretInput.type = 'password';
      toggleSecret.textContent = '👁️';
    }
    secretInput.focus();
  });

  startBtn.addEventListener('click', () => {
    const ok = startGame(secretInput.value);
    if (!ok) secretInput.focus();
  });

  demoBtn.addEventListener('click', () => {
    startGame('xarop de llimona');
  });

  resetBtn.addEventListener('click', resetAll);

  // Pressing Enter in the secret input starts the game
  secretInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      startBtn.click();
    }
  });

  playAgainWin.addEventListener('click', () => { hideWinOverlay(); resetAll(); });
  playAgainLose.addEventListener('click', () => { hideLoseOverlay(); resetAll(); });

  guessBtn.addEventListener('click', () => {
    const v = letterInput.value;
    if (!v) { setStatus('Escriu una lletra.', 'warn'); return; }
    onGuess(v[0]);
    letterInput.value = '';
    letterInput.focus();
  });

  letterInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      guessBtn.click();
    } else if (!e.ctrlKey && !e.metaKey && e.key.length === 1) {
      // keep only last char, uppercase visually
      setTimeout(() => { letterInput.value = toUpper(letterInput.value.slice(-1)); }, 0);
    }
  });

  // Initialize
  clearCanvas();
})();
