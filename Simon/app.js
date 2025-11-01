'use strict';

console.log('app.js loaded');

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded event fired');
    const nameModal = document.getElementById('name-modal');
    const nameInput = document.getElementById('name-input');
    const rememberCheckbox = document.getElementById('remember-checkbox');
    const submitNameButton = document.getElementById('submit-name-button');
    const gameContent = document.getElementById('game-content');
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
        if (savedName) {
            playerName = savedName;
            bestScore = localStorage.getItem('simonBestScore') || 0;

            nameModal.classList.add('hidden');
            gameContent.classList.remove('hidden');
        } else {
            nameModal.classList.remove('hidden');
        }

        submitNameButton.addEventListener('click', () => {
            alert('Botó Comença clicat!');
            nameModal.classList.add('hidden');
            gameContent.classList.remove('hidden');
        });

        submitNameButton.addEventListener('touchstart', () => {
            alert('Botó Comença tocat!');
            nameModal.classList.add('hidden');
            gameContent.classList.remove('hidden');
        });

        nameInput.addEventListener('keyup', (event) => {
            if (event.key === 'Enter') {
                submitNameButton.click();
            }
        });
        nameInput.focus();
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
        messageEl.textContent = `Error! Has arribat al nivell ${level}.`;
        document.body.classList.add('game-over');
        setTimeout(() => document.body.classList.remove('game-over'), 500);

        if (level > bestScore) {
            bestScore = level;
            localStorage.setItem('simonBestScore', bestScore);
            sendScore(playerName, bestScore);
        }

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
                let rankingHtml = '<h2>🏆 Rànquing Global</h2><ol>';
                ranking.forEach(player => {
                    rankingHtml += `<li>${player.name}: ${player.score}</li>`;
                });
                rankingHtml += '</ol>';
                const rankingModal = document.createElement('div');
                rankingModal.id = 'ranking-modal';
                rankingModal.innerHTML = `<div class="modal-content">${rankingHtml}<button id="close-ranking">Tancar</button></div>`;
                document.body.appendChild(rankingModal);

                document.getElementById('close-ranking').addEventListener('click', () => {
                    document.body.removeChild(rankingModal);
                });
            });
    }

    startButton.addEventListener('click', startGame);

    Object.values(colorButtons).forEach(button => {
        button.addEventListener('click', () => {
            handlePlayerInput(button.dataset.color);
        });
        button.addEventListener('touchstart', () => {
            handlePlayerInput(button.dataset.color);
        });
    });

    rankingButton.addEventListener('click', showRanking);

    initializeNameEntry();
});