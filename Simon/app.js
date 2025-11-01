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

    // Always show the name modal at the beginning
    nameModal.classList.remove('hidden');
    gameContent.classList.add('hidden');
    
    // Pre-fill with saved name if available
    if (savedName) {
        nameInput.value = savedName;
        rememberCheckbox.checked = rememberPreference;
        
        // Set player name for later use
        playerName = savedName;
        bestScore = localStorage.getItem('simonBestScore') || 0;
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

            // Keep the game title as "Simon" always
            gameTitleEl.textContent = 'Simon';
            
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
    
    // Focus the input field when modal appears
    setTimeout(() => nameInput.focus(), 100); // Slight delay to ensure modal is visible
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
        
        // Ask user if they want to send their score
        showSendScoreDialog();
    } else {
        messageEl.textContent = `Error! Has arribat al nivell ${level}.`;
    }
    
    document.body.classList.add('game-over');
    setTimeout(() => document.body.classList.remove('game-over'), 500);

    startButton.disabled = false;
    startButton.textContent = 'Torna a Jugar';
}

function showSendScoreDialog() {
    // Create a confirmation modal
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
    
    // Add styling for the buttons container
    const style = document.createElement('style');
    style.textContent = `
        #confirm-modal .modal-buttons {
            display: flex;
            gap: 1rem;
            justify-content: center;
            margin-top: 1.5rem;
        }
        
        #confirm-modal #send-score-yes,
        #confirm-modal #send-score-no {
            padding: 0.75rem 1.5rem;
            border-radius: 9999px;
            font-weight: 700;
            border: none;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        #confirm-modal #send-score-yes {
            background: linear-gradient(135deg, var(--accent-color) 0%, var(--accent-hover) 100%);
            color: var(--primary-bg-color);
        }
        
        #confirm-modal #send-score-no {
            background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
            color: white;
        }
        
        #confirm-modal #send-score-yes:hover,
        #confirm-modal #send-score-no:hover {
            transform: translateY(-2px) scale(1.05);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(confirmModal);

    // Add event listeners
    document.getElementById('send-score-yes').addEventListener('click', () => {
        sendScore(playerName, bestScore);
        document.body.removeChild(confirmModal);
        // Remove the added style element when done
        document.head.removeChild(style);
    });
    
    document.getElementById('send-score-no').addEventListener('click', () => {
        document.body.removeChild(confirmModal);
        // Remove the added style element when done
        document.head.removeChild(style);
    });
    
    // Allow closing modal by clicking outside
    confirmModal.addEventListener('click', (e) => {
        if (e.target === confirmModal) {
            document.body.removeChild(confirmModal);
            // Remove the added style element when done
            document.head.removeChild(style);
        }
    });
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
    // Show loading message first
    let rankingHtml = '<h2>🏆 Rànquing Global</h2><div class="loading-container"><p>Carregant dades...</p><div class="spinner"></div></div>';
    
    // Check if modal already exists
    let existingModal = document.getElementById('ranking-modal');
    if (existingModal) {
        document.body.removeChild(existingModal);
    }
    
    const rankingModal = document.createElement('div');
    rankingModal.id = 'ranking-modal';
    rankingModal.innerHTML = `<div class="modal-content">${rankingHtml}<button id="close-ranking">Tancar</button></div>`;
    document.body.appendChild(rankingModal);

    // Add spinner styling
    const spinnerStyle = document.createElement('style');
    spinnerStyle.textContent = `
        .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 2rem 0;
        }
        
        .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid rgba(245, 158, 11, 0.2);
            border-top: 4px solid var(--accent-color);
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-top: 1rem;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(spinnerStyle);

    // Now fetch the actual data
    fetch('https://script.google.com/macros/s/AKfycbyTnaRWXneulJ2E3w2t_lx7GDslA_2NtN9-o4cR6WUal3m9q3op8KNf-FtQIoAOV_wbFg/exec')
        .then(response => response.json())
        .then(ranking => {
            // Sort ranking by score descending
            ranking.sort((a, b) => b.score - a.score);
            
            let rankingContent = '<div class="ranking-header"><h2>🏆 Rànquing global</h2><div class="ranking-columns"><span class="col-player">Jugador</span><span class="col-score">Nivell</span></div></div><ol class="ranking-list">';
            if (ranking.length > 0) {
                ranking.slice(0, 20).forEach((player, index) => { // Show top 20 instead of 10
                    // Highlight current player if in ranking
                    const isCurrentPlayer = player.name === playerName;
                    const playerClass = isCurrentPlayer ? ' current-player' : '';
                    
                    // Add medal icons for top 3
                    let medal = '';
                    if (index === 0) medal = '🥇';
                    else if (index === 1) medal = '🥈';
                    else if (index === 2) medal = '🥉';
                    
                    // Add special class for top 3
                    const topClass = index < 3 ? ' top-player' : '';
                    
                    rankingContent += `<li class="${playerClass}${topClass}"><span class="rank-number">${index + 1}.</span><span class="player-name">${player.name}</span><span class="player-score">${player.score}</span></li>`;
                });
            } else {
                rankingContent += '<li class="no-scores">No hi ha puntuacions encara</li>';
            }
            rankingContent += '</ol>';
            
            // Update the modal content
            const modalContent = rankingModal.querySelector('.modal-content');
            modalContent.innerHTML = `${rankingContent}<button id="close-ranking">Tancar</button>`;
            
            document.getElementById('close-ranking').addEventListener('click', () => {
                document.body.removeChild(rankingModal);
                document.head.removeChild(spinnerStyle);
            });
        })
        .catch(error => {
            console.error('Error fetching ranking:', error);
            
            // Show error message
            let rankingContent = '<h2>🏆 Rànquing Global</h2><p>Hi ha hagut un error carregant el rànquing. Torna-ho a provar més tard.</p>';
            
            // Update the modal content
            const modalContent = rankingModal.querySelector('.modal-content');
            modalContent.innerHTML = `${rankingContent}<button id="close-ranking">Tancar</button>`;
            
            document.getElementById('close-ranking').addEventListener('click', () => {
                document.body.removeChild(rankingModal);
                document.head.removeChild(spinnerStyle);
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