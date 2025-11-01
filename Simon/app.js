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

const synth = new Tone.Synth().toDestination();
const sounds = {
    green: 'C4',
    red: 'E4',
    yellow: 'G4',
    blue: 'C5'
};

let level = 1;
let sequence = [];
let playerSequenceIndex = 0;
let gameState = 'waiting';
let playerName = '';
let bestScore = 0;

    function initializeNameEntry() {
    const savedName = localStorage.getItem('simonPlayerName');
    const rememberPreference = localStorage.getItem('rememberPreference') === 'true';

    if (savedName) {
        playerName = savedName;
        bestScore = localStorage.getItem('simonBestScore') || 0;
        nameInput.value = savedName;
        rememberCheckbox.checked = rememberPreference;
        
        nameModal.classList.add('hidden');
        gameContent.classList.remove('hidden');
        
        // Update game title with player name
        gameTitleEl.textContent = `${playerName.toUpperCase()} DE COLORES`;
    } else {
        nameModal.classList.remove('hidden');
        gameContent.classList.add('hidden');
        setTimeout(() => nameInput.focus(), 100); // Slight delay to ensure modal is visible
    }

    // Submit name via button click
    submitNameButton.addEventListener('click', submitName);
    
    // Also submit on Enter key in input field
    nameInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            submitName();
        }
    });

    function submitName() {
        const name = nameInput.value.trim();
        if (name) {
            playerName = name;
            
            if (rememberCheckbox.checked) {
                localStorage.setItem('simonPlayerName', playerName);
                localStorage.setItem('rememberPreference', 'true');
            } else {
                localStorage.removeItem('simonPlayerName');
                localStorage.removeItem('rememberPreference');
            }

            // Update game title with player name
            gameTitleEl.textContent = `${playerName.toUpperCase()} DE COLORES`;
            
            nameModal.classList.add('hidden');
            gameContent.classList.remove('hidden');
        } else {
            // Show error if name is empty
            nameInput.placeholder = "¡Por favor, escribe un nombre!";
            nameInput.classList.add('placeholder-error');
            setTimeout(() => {
                nameInput.placeholder = "Escriu el teu nom";
                nameInput.classList.remove('placeholder-error');
                nameInput.focus();
            }, 2000);
        }
    }
}

function playSound(color) {
    if (Tone.context.state !== 'running') {
        Tone.context.resume();
    }
    synth.triggerAttackRelease(sounds[color], '8n');
}

function lightUpButton(color) {
    const button = colorButtons[color];
    button.classList.add('lit');
    playSound(color);
    setTimeout(() => {
        button.classList.remove('lit');
    }, 400);
}

function showSequence() {
    gameState = 'showing';
    messageEl.textContent = 'Memoritza la seqüència...';
    startButton.disabled = true;

    let i = 0;
    const interval = setInterval(() => {
        lightUpButton(sequence[i]);
        i++;
        if (i >= sequence.length) {
            clearInterval(interval);
            gameState = 'playing';
            playerSequenceIndex = 0;
            messageEl.textContent = 'El teu torn!';
        }
    }, 700);
}

function nextTurn() {
    levelEl.textContent = level;
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    sequence.push(randomColor);
    showSequence();
}

function startGame() {
    if (gameState === 'showing') return;

    level = 1;
    sequence = [];
    gameState = 'waiting';
    startButton.textContent = 'Inicia';
    messageEl.textContent = "Concentra't...";
    levelEl.textContent = level;

    setTimeout(nextTurn, 1000);
}

function handlePlayerInput(color) {
    if (gameState !== 'playing') return;

    lightUpButton(color);

    if (color === sequence[playerSequenceIndex]) {
        playerSequenceIndex++;
        if (playerSequenceIndex >= sequence.length) {
            messageEl.textContent = 'Correcte!';
            level++;
            gameState = 'waiting';
            setTimeout(nextTurn, 1500);
        }
    } else {
        endGame();
    }
}

function endGame() {
    gameState = 'gameover';
    
    // Check if it's a personal best
    if (level > bestScore) {
        bestScore = level;
        localStorage.setItem('simonBestScore', bestScore);
        messageEl.textContent = `Nova marca personal! Has arribat al nivell ${level}.`;
        sendScore(playerName, bestScore);
    } else {
        messageEl.textContent = `Error! Has arribat al nivell ${level}.`;
    }
    
    document.body.classList.add('game-over');
    setTimeout(() => document.body.classList.remove('game-over'), 500);

    startButton.disabled = false;
    startButton.textContent = 'Torna a Jugar';
}

function sendScore(name, score) {
    fetch('https://script.google.com/macros/s/AKfycbyTnaRWXneulJ2E3w2t_lx7GDslA_2NtN9-o4cR6WUal3m9q3op8KNf-FtQIoAOV_wbFg/exec', {
        method: 'POST',
        mode: 'no-cors',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, score })
    });
}

function showRanking() {
    fetch('https://script.google.com/macros/s/AKfycbyTnaRWXneulJ2E3w2t_lx7GDslA_2NtN9-o4cR6WUal3m9q3op8KNf-FtQIoAOV_wbFg/exec')
        .then(response => response.json())
        .then(ranking => {
            // Sort ranking by score descending
            ranking.sort((a, b) => b.score - a.score);
            
            let rankingHtml = '<h2>🏆 Rànquing Global</h2><ol>';
            if (ranking.length > 0) {
                ranking.slice(0, 10).forEach((player, index) => {
                    // Highlight current player if in ranking
                    const isCurrentPlayer = player.name === playerName;
                    const playerClass = isCurrentPlayer ? ' class="current-player"' : '';
                    rankingHtml += `<li${playerClass}>${player.name}: ${player.score}</li>`;
                });
            } else {
                rankingHtml += '<li>No hi ha puntuacions encara</li>';
            }
            rankingHtml += '</ol>';
            
            // Check if modal already exists
            let existingModal = document.getElementById('ranking-modal');
            if (existingModal) {
                document.body.removeChild(existingModal);
            }
            
            const rankingModal = document.createElement('div');
            rankingModal.id = 'ranking-modal';
            rankingModal.innerHTML = `<div class="modal-content">${rankingHtml}<button id="close-ranking">Tancar</button></div>`;
            document.body.appendChild(rankingModal);

            document.getElementById('close-ranking').addEventListener('click', () => {
                document.body.removeChild(rankingModal);
            });
            
            // Allow closing modal by clicking outside
            rankingModal.addEventListener('click', (e) => {
                if (e.target === rankingModal) {
                    document.body.removeChild(rankingModal);
                }
            });
        })
        .catch(error => {
            console.error('Error fetching ranking:', error);
            
            // Show error message
            let rankingHtml = '<h2>🏆 Rànquing Global</h2><p>Hi ha hagut un error carregant el rànquing. Torna-ho a provar més tard.</p>';
            
            // Check if modal already exists
            let existingModal = document.getElementById('ranking-modal');
            if (existingModal) {
                document.body.removeChild(existingModal);
            }
            
            const rankingModal = document.createElement('div');
            rankingModal.id = 'ranking-modal';
            rankingModal.innerHTML = `<div class="modal-content">${rankingHtml}<button id="close-ranking">Tancar</button></div>`;
            document.body.appendChild(rankingModal);

            document.getElementById('close-ranking').addEventListener('click', () => {
                document.body.removeChild(rankingModal);
            });
            
            // Allow closing modal by clicking outside
            rankingModal.addEventListener('click', (e) => {
                if (e.target === rankingModal) {
                    document.body.removeChild(rankingModal);
                }
            });
        });
}

startButton.addEventListener('click', startGame);

Object.values(colorButtons).forEach(button => {
    button.addEventListener('click', () => {
        handlePlayerInput(button.dataset.color);
    });
    button.addEventListener('touchstart', (e) => {
        e.preventDefault(); // Prevent default touch behavior
        handlePlayerInput(button.dataset.color);
    });
});

rankingButton.addEventListener('click', showRanking);

// Add keyboard support for accessibility
document.addEventListener('keydown', (e) => {
    switch(e.key.toLowerCase()) {
        case 'q':
        case 'a':
            handlePlayerInput('green');
            break;
        case 'w':
        case 's':
            handlePlayerInput('red');
            break;
        case 'z':
        case 'x':
            handlePlayerInput('yellow');
            break;
        case 'e':
        case 'd':
            handlePlayerInput('blue');
            break;
        case ' ':
            e.preventDefault(); // Prevent space from scrolling page
            startGame();
            break;
    }
});

initializeNameEntry();