const { useState, useEffect, useCallback, useRef } = React;

const GRID_SIZE = 4;
const INITIAL_COUNTDOWN = 180;
const RECORDS_STORAGE_KEY = 'math-game-2048-records';

const TILE_COLORS = {
  2: 'from-yellow-300 to-yellow-400',
  4: 'from-yellow-400 to-orange-400',
  8: 'from-orange-400 to-orange-500',
  16: 'from-orange-500 to-red-500',
  32: 'from-red-500 to-pink-500',
  64: 'from-pink-500 to-purple-500',
  128: 'from-purple-500 to-indigo-500',
  256: 'from-indigo-500 to-blue-500',
  512: 'from-blue-500 to-cyan-500',
  1024: 'from-cyan-500 to-teal-500',
  2048: 'from-teal-500 to-emerald-600'
};

const MOTIVATIONAL_MESSAGES = [
  'Fantàstic! 🎉',
  'Brillant! ✨',
  'Campió de les combinacions! 🏆',
  'Increïble! 🚀',
  'Espectacular! 💎',
  'Imparable! 💥'
];

const MILESTONE_MESSAGES = {
  128: 'Vas per bon camí! 🔥',
  256: 'Meitat del camí! ⚡',
  512: 'Espectacular! 🌟',
  1024: 'Quasi allà! 🧠'
};

const MODE_LABELS = {
  menu: 'Menú',
  classic: '⌛ Clàssic',
  countdown: '⚡ Contrarellotge'
};

const SCORE_POSITIONS = ['🥇', '🥈', '🥉'];

const formatTime = (seconds) => {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const createEmptyGrid = () => Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));

const canMoveOnBoard = (board) => {
  for (let i = 0; i < GRID_SIZE; i += 1) {
    for (let j = 0; j < GRID_SIZE; j += 1) {
      if (board[i][j] === 0) return true;
      if (j < GRID_SIZE - 1 && board[i][j] === board[i][j + 1]) return true;
      if (i < GRID_SIZE - 1 && board[i][j] === board[i + 1][j]) return true;
    }
  }
  return false;
};

const IconBase = ({ children, className = 'w-6 h-6' }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {children}
    </svg>
);

const IconRefreshCw = ({ className }) => (
    <IconBase className={className}>
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </IconBase>
);

const IconTrophy = ({ className }) => (
    <IconBase className={className}>
      <path d="M10 14.66v1.626a2 2 0 0 1-.976 1.696A5 5 0 0 0 7 21.978" />
      <path d="M14 14.66v1.626a2 2 0 0 0 .976 1.696A5 5 0 0 1 17 21.978" />
      <path d="M18 9h1.5a1 1 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z" />
      <path d="M6 9H4.5a1 1 0 0 1 0-5H6" />
    </IconBase>
);

const IconPalette = ({ className }) => (
    <IconBase className={className}>
      <path d="M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z" />
      <circle cx="13.5" cy="6.5" r="0.5" fill="currentColor" />
      <circle cx="17.5" cy="10.5" r="0.5" fill="currentColor" />
      <circle cx="6.5" cy="12.5" r="0.5" fill="currentColor" />
      <circle cx="8.5" cy="7.5" r="0.5" fill="currentColor" />
    </IconBase>
);

const IconClock = ({ className }) => (
    <IconBase className={className}>
      <path d="M12 6v6l4 2" />
      <circle cx="12" cy="12" r="10" />
    </IconBase>
);

const IconZap = ({ className }) => (
    <IconBase className={className}>
      <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
    </IconBase>
);

const IconLayout = ({ className }) => (
  <IconBase className={className}>
    <rect x="3" y="4" width="8" height="16" rx="2" />
    <rect x="13" y="4" width="8" height="7" rx="2" />
    <rect x="13" y="13" width="8" height="7" rx="2" />
  </IconBase>
);

const MathGame2048 = () => {
  const [grid, setGrid] = useState([]);
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(0);
  const [gameMode, setGameMode] = useState('menu');
  const [darkMode, setDarkMode] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [records, setRecords] = useState([]);
  const [showRecords, setShowRecords] = useState(false);
  const [message, setMessage] = useState('');
  const [lastMoveTime, setLastMoveTime] = useState(() => Date.now());
  const [touchStart, setTouchStart] = useState(null);
  const [countdown, setCountdown] = useState(INITIAL_COUNTDOWN);
  const [showInstructions, setShowInstructions] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [layoutMode, setLayoutMode] = useState('auto');
  const [isLandscape, setIsLandscape] = useState(() => window.innerWidth > window.innerHeight);

  const messageTimeoutRef = useRef(null);
  const nameInputRef = useRef(null);

  const cycleLayoutMode = useCallback(() => {
    setLayoutMode((current) => {
      if (current === 'auto') return 'portrait';
      if (current === 'portrait') return 'landscape';
      return 'auto';
    });
  }, []);

  const addRandomTile = useCallback((board) => {
    const emptyCells = [];
    for (let i = 0; i < GRID_SIZE; i += 1) {
      for (let j = 0; j < GRID_SIZE; j += 1) {
        if (board[i][j] === 0) emptyCells.push({ i, j });
      }
    }
    if (emptyCells.length === 0) return;
    const { i, j } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    board[i][j] = Math.random() < 0.9 ? 2 : 4;
  }, []);

  const resetMessage = useCallback(() => {
    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current);
      messageTimeoutRef.current = null;
    }
    setMessage('');
  }, []);

  const showTemporaryMessage = useCallback((text, duration = 2000) => {
    if (!text) return;
    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current);
    }
    setMessage(text);
    messageTimeoutRef.current = window.setTimeout(() => {
      setMessage('');
      messageTimeoutRef.current = null;
    }, duration);
  }, []);

  const initializeGrid = useCallback(() => {
    const freshGrid = createEmptyGrid();
    addRandomTile(freshGrid);
    addRandomTile(freshGrid);
    setGrid(freshGrid);
    setScore(0);
    setTime(0);
    setCountdown(INITIAL_COUNTDOWN);
    setGameOver(false);
    setWon(false);
    setPlayerName('');
    setLastMoveTime(Date.now());
    setTouchStart(null);
    resetMessage();
  }, [addRandomTile, resetMessage]);

  const showMilestone = useCallback(
    (value) => {
      const text = MILESTONE_MESSAGES[value];
      if (text) {
        showTemporaryMessage(text, 3000);
      }
    },
    [showTemporaryMessage]
  );

  const move = useCallback(
    (direction) => {
      if (gameMode === 'menu' || showRecords || showInstructions) return;
      if (gameOver || won || grid.length === 0) return;

      let newGrid = grid.map((row) => [...row]);
      let moved = false;
      let currentScore = score;
      const now = Date.now();
      const timeDiff = (now - lastMoveTime) / 1000;
      let bonusPoints = 0;

      const moveLeft = (board) => {
        for (let i = 0; i < GRID_SIZE; i += 1) {
          let row = board[i].filter((value) => value !== 0);
          for (let j = 0; j < row.length - 1; j += 1) {
            if (row[j] === row[j + 1]) {
              row[j] *= 2;
              row[j + 1] = 0;
              currentScore += row[j];
              if (timeDiff < 3) bonusPoints += row[j] / 2;
              if (row[j] >= 128) showMilestone(row[j]);
              if (row[j] === 2048) setWon(true);
            }
          }
          row = row.filter((value) => value !== 0);
          while (row.length < GRID_SIZE) row.push(0);
          if (JSON.stringify(board[i]) !== JSON.stringify(row)) moved = true;
          board[i] = row;
        }
      };

      const rotate = (board) => {
        const rotated = createEmptyGrid();
        for (let i = 0; i < GRID_SIZE; i += 1) {
          for (let j = 0; j < GRID_SIZE; j += 1) {
            rotated[j][GRID_SIZE - 1 - i] = board[i][j];
          }
        }
        return rotated;
      };

      if (direction === 'left') {
        moveLeft(newGrid);
      } else if (direction === 'right') {
        newGrid = rotate(rotate(newGrid));
        moveLeft(newGrid);
        newGrid = rotate(rotate(newGrid));
      } else if (direction === 'up') {
        newGrid = rotate(rotate(rotate(newGrid)));
        moveLeft(newGrid);
        newGrid = rotate(newGrid);
      } else if (direction === 'down') {
        newGrid = rotate(newGrid);
        moveLeft(newGrid);
        newGrid = rotate(rotate(rotate(newGrid)));
      }

      if (moved) {
        addRandomTile(newGrid);
        setGrid(newGrid);
        const updatedScore = currentScore + Math.floor(bonusPoints);
        setScore(updatedScore);
        if (bonusPoints > 0) {
          const bonusMessage = MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)];
          showTemporaryMessage(`${bonusMessage} +${Math.floor(bonusPoints)} punts extra!`);
        }
        setLastMoveTime(now);
        if (!canMoveOnBoard(newGrid)) {
          setGameOver(true);
        }
      }
    },
    [addRandomTile, gameMode, gameOver, grid, lastMoveTime, score, showInstructions, showMilestone, showRecords, showTemporaryMessage, won]
  );

  useEffect(() => {
    const updateOrientation = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };
    updateOrientation();
    window.addEventListener('resize', updateOrientation);
    window.addEventListener('orientationchange', updateOrientation);
    return () => {
      window.removeEventListener('resize', updateOrientation);
      window.removeEventListener('orientationchange', updateOrientation);
    };
  }, []);

  useEffect(() => {
    if (gameMode !== 'classic' || gameOver || won) return;
    const timer = window.setInterval(() => setTime((current) => current + 1), 1000);
    return () => window.clearInterval(timer);
  }, [gameMode, gameOver, won]);

  useEffect(() => {
    if (gameMode !== 'countdown' || gameOver || won || countdown <= 0) return;
    const timer = window.setInterval(() => {
      setCountdown((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          setGameOver(true);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [countdown, gameMode, gameOver, won]);

  useEffect(() => {
    if (gameMode === 'menu') {
      setTouchStart(null);
    }
  }, [gameMode]);

  useEffect(() => {
    if (!gameOver && !won) return;
    const timeout = window.setTimeout(() => {
      nameInputRef.current?.focus();
    }, 150);
    return () => window.clearTimeout(timeout);
  }, [gameOver, won]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = window.localStorage.getItem(RECORDS_STORAGE_KEY);
      if (!stored) return;
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        setRecords(parsed);
      }
    } catch (error) {
      console.error("No s'han pogut carregar els rècords", error);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(RECORDS_STORAGE_KEY, JSON.stringify(records));
    } catch (error) {
      console.error("No s'han pogut desar els rècords", error);
    }
  }, [records]);

  useEffect(
    () => () => {
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
      }
    },
    []
  );

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (gameMode === 'menu' || showRecords || showInstructions) return;
      const keyMap = {
        ArrowLeft: 'left',
        ArrowRight: 'right',
        ArrowUp: 'up',
        ArrowDown: 'down'
      };
      const direction = keyMap[event.key];
      if (direction) {
        event.preventDefault();
        move(direction);
      }
    };
    window.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameMode, move, showInstructions, showRecords]);

  const handleTouchStart = useCallback(
    (event) => {
      if (gameMode === 'menu' || showRecords || showInstructions) return;
      setTouchStart({
        x: event.touches[0].clientX,
        y: event.touches[0].clientY
      });
    },
    [gameMode, showInstructions, showRecords]
  );

  const handleTouchEnd = useCallback(
    (event) => {
      if (!touchStart) return;
      if (gameMode === 'menu' || showRecords || showInstructions) return;
      const deltaX = event.changedTouches[0].clientX - touchStart.x;
      const deltaY = event.changedTouches[0].clientY - touchStart.y;
      const minSwipe = 50;

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (Math.abs(deltaX) > minSwipe) {
          move(deltaX > 0 ? 'right' : 'left');
        }
      } else if (Math.abs(deltaY) > minSwipe) {
        move(deltaY > 0 ? 'down' : 'up');
      }
      setTouchStart(null);
    },
    [gameMode, move, showInstructions, showRecords, touchStart]
  );

  const startGame = useCallback(
    (mode) => {
      setGameMode(mode);
      setShowRecords(false);
      setShowInstructions(false);
      initializeGrid();
    },
    [initializeGrid]
  );

  const saveRecord = useCallback(
    (name) => {
      const trimmed = name.trim();
      if (!trimmed) return false;
      const elapsed = gameMode === 'classic' ? time : INITIAL_COUNTDOWN - countdown;
      const newRecord = {
        name: trimmed,
        score,
        time: Math.max(0, elapsed),
        mode: gameMode,
        savedAt: Date.now()
      };
      const updated = [...records, newRecord]
        .sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          return a.time - b.time;
        })
        .slice(0, 5);
      setRecords(updated);
      return true;
    },
    [countdown, gameMode, records, score, time]
  );

  const handleReturnToMenu = useCallback(() => {
    setGameMode('menu');
    setShowRecords(false);
    setShowInstructions(false);
    resetMessage();
  }, [resetMessage]);

  const handleSaveAndExit = useCallback(() => {
    if (saveRecord(playerName)) {
      handleReturnToMenu();
    }
  }, [handleReturnToMenu, playerName, saveRecord]);

  const activeGradient = darkMode
    ? 'bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900'
    : 'bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400';

  const showLandscape = (layoutMode === 'auto' && isLandscape) || layoutMode === 'landscape';
  const showPortrait = (layoutMode === 'auto' && !isLandscape) || layoutMode === 'portrait';

  return (
    <div className={`min-h-screen transition-colors duration-500 ${activeGradient}`}>
      <div className="container mx-auto px-4 py-8 max-w-5xl pb-24">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-2 text-white drop-shadow-lg animate-pulse">
            ✨ 2048 Matemàtic
          </h1>
          <p className={`text-xl ${darkMode ? 'text-purple-200' : 'text-white'} font-semibold`}>
            Combina i arriba al 2048!
          </p>
        </div>

        {gameMode === 'menu' && !showRecords && !showInstructions && (
          <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
            <div className={`${darkMode ? 'bg-gray-800/90' : 'bg-white/90'} backdrop-blur-lg rounded-3xl p-8 shadow-2xl`}>
              <h2 className={`text-3xl font-bold text-center mb-6 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                Tria el mode de joc
              </h2>
                    <div className="space-y-4 px-6">
                      <button
                        type="button"
                        onClick={() => startGame('classic')}
                        className="w-full bg-gradient-to-r from-blue-400 to-cyan-400 text-white py-6 px-8 rounded-2xl text-xl font-bold hover:scale-105 transform transition-all shadow-lg hover:shadow-2xl flex items-center justify-center gap-3"
                      >
                        <IconClock className="w-8 h-8" />
                        Mode clàssic
                      </button>
                      <button
                        type="button"
                        onClick={() => startGame('countdown')}
                        className="w-full bg-gradient-to-r from-orange-400 to-red-400 text-white py-6 px-8 rounded-2xl text-xl font-bold hover:scale-105 transform transition-all shadow-lg hover:shadow-2xl flex items-center justify-center gap-3"
                      >
                        <IconZap className="w-8 h-8" />
                        Contrarellotge (3 min)
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowInstructions(true)}
                        className={`w-full ${darkMode ? 'bg-purple-500' : 'bg-purple-400'} text-white py-4 px-8 rounded-2xl text-lg font-bold hover:scale-105 transform transition-all`}
                      >
                        📘 Instruccions
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowRecords(true)}
                        className={`w-full ${darkMode ? 'bg-green-500' : 'bg-green-400'} text-white py-4 px-8 rounded-2xl text-lg font-bold hover:scale-105 transform transition-all flex items-center justify-center gap-2`}
                      >
                        <IconTrophy className="w-6 h-6" />
                        Rècords
                      </button>
                    </div>            </div>
          </div>
        )}

        {showInstructions && (
          <div className={`${darkMode ? 'bg-gray-800/95' : 'bg-white/95'} backdrop-blur-lg rounded-3xl p-8 shadow-2xl animate-fade-in max-w-2xl mx-auto`}>
            <h2 className={`text-3xl font-bold text-center mb-6 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              Com jugar
            </h2>
            <div className={`space-y-4 text-lg ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              <p>🎯 <strong>Objectiu:</strong> Combina nombres fins arribar a 2048.</p>
              <p>🕹️ <strong>Controls:</strong> Utilitza les fletxes del teclat o llisca el dit al mòbil.</p>
              <p>➕ <strong>Combinacions:</strong> Quan dues caselles iguals es toquen, es fusionen.</p>
              <p>⚡ <strong>Bonus:</strong> Combina en menys de 3 segons per sumar punts extra.</p>
              <p>🎮 <strong>Modes:</strong></p>
              <ul className="ml-8 space-y-2 list-disc">
                <li>⌛ Clàssic: juga sense límit de temps.</li>
                <li>⚡ Contrarellotge: 3 minuts per fer el màxim de punts.</li>
              </ul>
            </div>
            <button
              type="button"
              onClick={() => setShowInstructions(false)}
              className="w-full mt-6 bg-gradient-to-r from-blue-500 to-purple-500 text-white py-4 px-8 rounded-2xl text-xl font-bold hover:scale-105 transform transition-all"
            >
              Tornar
            </button>
          </div>
        )}

        {showRecords && (
          <div className={`${darkMode ? 'bg-gray-800/95' : 'bg-white/95'} backdrop-blur-lg rounded-3xl p-8 shadow-2xl animate-fade-in max-w-2xl mx-auto`}>
            <h2 className={`text-3xl font-bold text-center mb-6 ${darkMode ? 'text-white' : 'text-gray-800'} flex items-center justify-center gap-3`}>
              <IconTrophy className="w-10 h-10 text-yellow-400" />
              Millors puntuacions
            </h2>
            {records.length === 0 ? (
              <p className={`text-center text-xl ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Encara no hi ha rècords. Sigues el primer! 🎯
              </p>
            ) : (
              <div className="space-y-3">
                {records.map((record, index) => (
                  <div
                    key={`${record.name}-${record.savedAt}`}
                    className={`${darkMode ? 'bg-gray-700' : 'bg-gradient-to-r from-yellow-100 to-orange-100'} p-4 rounded-xl flex justify-between items-center`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl font-bold">
                        {SCORE_POSITIONS[index] ?? `${index + 1}.`}
                      </span>
                      <div>
                        <p className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                          {record.name || 'Jugador'}
                        </p>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {MODE_LABELS[record.mode]}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${darkMode ? 'text-yellow-400' : 'text-orange-600'}`}>
                        {record.score}
                      </p>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {formatTime(record.time)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={() => setShowRecords(false)}
              className="w-full mt-6 bg-gradient-to-r from-blue-500 to-purple-500 text-white py-4 px-8 rounded-2xl text-xl font-bold hover:scale-105 transform transition-all"
            >
              Tornar
            </button>
          </div>
        )}

        {gameMode !== 'menu' && !showRecords && !showInstructions && (
          <div>
            {/* Vista d'escriptori (Horitzontal) */}
            {showLandscape && (
              <div className="flex items-start gap-4">
                <div className="w-52 shrink-0 space-y-4">
                  <div className={`${darkMode ? 'bg-gray-800/90' : 'bg-white/90'} backdrop-blur-lg rounded-2xl p-4 shadow-xl`}>
                    <div className={`${darkMode ? 'bg-gradient-to-r from-yellow-600 to-orange-600' : 'bg-gradient-to-r from-yellow-400 to-orange-400'} text-white px-4 py-2 rounded-xl text-center shadow-lg mb-3`}>
                      <p className="text-sm font-semibold uppercase tracking-wide">Puntuació</p>
                      <p className="text-3xl font-bold">{score}</p>
                    </div>
                    <div className={`text-center px-4 py-2 rounded-xl shadow-lg ${(gameMode === 'countdown' && countdown < 30) ? 'bg-red-500 text-white animate-pulse' : darkMode ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' : 'bg-gradient-to-r from-blue-400 to-purple-400 text-white'}`}>
                      <p className="text-sm font-semibold uppercase tracking-wide">{gameMode === 'classic' ? 'Temps' : 'Temps restant'}</p>
                      <p className="text-3xl font-bold">{formatTime(gameMode === 'classic' ? time : countdown)}</p>
                    </div>
                  </div>
                </div>

                <div className="flex-1">
                  <div
                    className={`${darkMode ? 'bg-gray-700/50' : 'bg-white/50'} backdrop-blur-sm p-4 rounded-3xl shadow-2xl`}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                  >
                    <div className="grid grid-cols-4 gap-3">
                      {grid.map((row, i) =>
                        row.map((cell, j) => (
                          <div
                            key={`${i}-${j}`}
                            className={`aspect-square rounded-2xl flex items-center justify-center text-4xl font-bold transition-all duration-300 shadow-lg ${(cell === 0) ? (darkMode ? 'bg-gray-600/30' : 'bg-gray-200/50') : `bg-gradient-to-br ${TILE_COLORS[cell] || 'from-emerald-600 to-teal-600'} text-white transform hover:scale-105`}`}
                            style={{ animation: cell !== 0 ? 'pop 0.3s ease-out' : 'none' }}
                          >
                            {cell !== 0 && cell}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  {message && (
                    <div className="mt-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-center py-3 rounded-2xl text-base font-bold animate-bounce shadow-lg">
                      {message}
                    </div>
                  )}
                </div>

                <div className="w-52 shrink-0 space-y-2">
                    <div className={`${darkMode ? 'bg-gray-800/90' : 'bg-white/90'} backdrop-blur-lg rounded-2xl p-4 shadow-xl flex flex-col gap-3`}>
                        <button type="button" onClick={handleReturnToMenu} className={`w-full ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} px-3 py-2 rounded-xl font-semibold transition-all text-base flex items-center justify-center gap-2`}>Menú</button>
                        <button type="button" onClick={initializeGrid} className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-2 rounded-xl font-semibold hover:scale-105 transition-all text-base flex items-center justify-center gap-2"><IconRefreshCw className="w-5 h-5"/>Reinicia</button>
                        <button type="button" onClick={() => setDarkMode(v => !v)} className={`w-full ${darkMode ? 'bg-yellow-500 hover:bg-yellow-400' : 'bg-indigo-600 hover:bg-indigo-700'} text-white py-2 px-3 rounded-xl font-semibold transition-all text-base flex items-center justify-center gap-2`}><IconPalette className="w-5 h-5"/>Tema</button>
                        <button type="button" onClick={cycleLayoutMode} className={`w-full ${darkMode ? 'bg-purple-600 hover:bg-purple-500' : 'bg-purple-500 hover:bg-purple-600'} text-white py-2 px-3 rounded-xl font-semibold transition-all text-base flex items-center justify-center gap-2`}><IconLayout className="w-5 h-5"/>Vista: {layoutMode === 'auto' ? 'Auto' : layoutMode === 'portrait' ? 'Vert.' : 'Horitz.'}</button>
                    </div>
                </div>
              </div>
            )}

            {/* Vista de mòbil (Vertical) */}
            {showPortrait && (
              <div className="space-y-4 max-w-lg mx-auto">
                <div className={`${darkMode ? 'bg-gray-800/90' : 'bg-white/90'} backdrop-blur-lg rounded-2xl p-4 shadow-xl`}>
                  <div className="flex justify-between items-center mb-3 gap-3">
                    <div className={`${darkMode ? 'bg-gradient-to-r from-yellow-600 to-orange-600' : 'bg-gradient-to-r from-yellow-400 to-orange-400'} text-white px-4 py-2 rounded-xl text-center shadow-lg`}>
                      <p className="text-xs font-semibold uppercase tracking-wide">Puntuació</p>
                      <p className="text-2xl font-bold">{score}</p>
                    </div>
                    <div className={`text-center px-4 py-2 rounded-xl shadow-lg ${(gameMode === 'countdown' && countdown < 30) ? 'bg-red-500 text-white animate-pulse' : darkMode ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' : 'bg-gradient-to-r from-blue-400 to-purple-400 text-white'}`}>
                      <p className="text-xs font-semibold uppercase tracking-wide">{gameMode === 'classic' ? 'Temps' : 'Temps restant'}</p>
                      <p className="text-2xl font-bold">{formatTime(gameMode === 'classic' ? time : countdown)}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                     <button type="button" onClick={handleReturnToMenu} className={`flex-1 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} py-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 text-sm`}>Menú</button>
                     <button type="button" onClick={initializeGrid} className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white py-2 rounded-lg font-semibold hover:scale-105 transition-all flex items-center justify-center gap-2 text-sm"><IconRefreshCw className="w-4 h-4" />Reiniciar</button>
                     <button type="button" onClick={() => setDarkMode((value) => !value)} className={`${darkMode ? 'bg-yellow-500 hover:bg-yellow-400' : 'bg-indigo-600 hover:bg-indigo-700'} text-white p-2 rounded-lg font-semibold transition-all`}><IconPalette className="w-4 h-4" /></button>
                     <button type="button" onClick={cycleLayoutMode} className={`${darkMode ? 'bg-purple-600 hover:bg-purple-500' : 'bg-purple-500 hover:bg-purple-600'} text-white p-2 rounded-lg font-semibold transition-all`}><IconLayout className="w-4 h-4" /></button>
                  </div>
                </div>

                {message && (
                  <div className="bg-gradient-to-r from-pink-500 to-purple-500 text-white text-center py-3 rounded-xl text-lg font-bold animate-bounce shadow-lg">
                    {message}
                  </div>
                )}

                <div
                  className={`${darkMode ? 'bg-gray-700/50' : 'bg-white/50'} backdrop-blur-sm p-2 rounded-2xl shadow-2xl`}
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                >
                  <div className="grid grid-cols-4 gap-2">
                    {grid.map((row, i) =>
                      row.map((cell, j) => (
                        <div
                          key={`${i}-${j}`}
                          className={`aspect-square rounded-lg flex items-center justify-center text-2xl font-bold transition-all duration-300 shadow-lg ${(cell === 0) ? (darkMode ? 'bg-gray-600/30' : 'bg-gray-200/50') : `bg-gradient-to-br ${TILE_COLORS[cell] || 'from-emerald-600 to-teal-600'} text-white transform hover:scale-105`}`}
                          style={{ animation: cell !== 0 ? 'pop 0.3s ease-out' : 'none' }}
                        >
                          {cell !== 0 && cell}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {(gameOver || won) && (
              <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in px-4">
                <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-3xl p-8 max-w-md w-full text-center shadow-2xl space-y-4`}>
                  <div className="text-7xl">{won ? '🏆' : '💥'}</div>
                  <h2 className={`text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    {won ? 'Has guanyat!' : 'Partida acabada'}
                  </h2>
                  <p className={`text-2xl ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Puntuació final: <span className="font-bold text-orange-500">{score}</span>
                  </p>
                  <input
                    ref={nameInputRef}
                    type="text"
                    placeholder="El teu nom"
                    maxLength={15}
                    value={playerName}
                    onChange={(event) => setPlayerName(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        handleSaveAndExit();
                      }
                    }}
                    className={`w-full ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100'} px-4 py-3 rounded-xl text-center text-lg font-semibold outline-none focus:ring-2 focus:ring-purple-400`}
                  />
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={handleSaveAndExit}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-4 px-6 rounded-xl text-lg font-bold hover:scale-105 transition-all"
                    >
                      💾 Guardar i tornar
                    </button>
                    <button
                      type="button"
                      onClick={initializeGrid}
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-4 px-6 rounded-xl text-lg font-bold hover:scale-105 transition-all"
                    >
                      🔁 Jugar de nou
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
       <footer className="fixed bottom-0 left-0 right-0 px-4 py-2 text-center text-white/85 space-y-1 bg-gray-900/50 backdrop-blur-sm">
        <p className="text-xs md:text-sm">Aplicació creada per Felip Sarroca amb l'assistència de la IA</p>
        <div className="flex items-center justify-center gap-2 text-[10px] md:text-xs text-white/80">
          <span>Obra sota llicència</span>
          <img src="./CC_BY-NC-SA.svg" alt="Icona llicència CC-BY-NC-SA" className="h-5 w-auto" />
          <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/deed.ca" target="_blank" rel="noopener noreferrer" className="underline hover:text-white">CC-BY-NC-SA 4.0</a>
        </div>
      </footer>
    </div>
  );
};