import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RefreshCw, Trophy, Palette, Clock, Zap } from 'lucide-react';

type GameMode = 'menu' | 'classic' | 'countdown';

type Grid = number[][];

type SwipeStart = {
  x: number;
  y: number;
};

type RecordEntry = {
  name: string;
  score: number;
  time: number;
  mode: GameMode;
  savedAt: number;
};

const GRID_SIZE = 4;
const INITIAL_COUNTDOWN = 180;
const RECORDS_STORAGE_KEY = 'math-game-2048-records';

const TILE_COLORS: Record<number, string> = {
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

const MILESTONE_MESSAGES: Record<number, string> = {
  128: 'Vas per bon camí! 🔥',
  256: 'Meitat del camí! ⚡',
  512: 'Espectacular! 🌟',
  1024: 'Quasi allà! 🧠'
};

const MODE_LABELS: Record<GameMode, string> = {
  menu: 'Menú',
  classic: '⌛ Clàssic',
  countdown: '⚡ Contrarellotge'
};

const SCORE_POSITIONS = ['🥇', '🥈', '🥉'];

const formatTime = (seconds: number): string => {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const createEmptyGrid = (): Grid => Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));

const canMoveOnBoard = (board: Grid): boolean => {
  for (let i = 0; i < GRID_SIZE; i += 1) {
    for (let j = 0; j < GRID_SIZE; j += 1) {
      if (board[i][j] === 0) return true;
      if (j < GRID_SIZE - 1 && board[i][j] === board[i][j + 1]) return true;
      if (i < GRID_SIZE - 1 && board[i][j] === board[i + 1][j]) return true;
    }
  }
  return false;
};

const MathGame2048: React.FC = () => {
  const [grid, setGrid] = useState<Grid>([]);
  const [score, setScore] = useState<number>(0);
  const [time, setTime] = useState<number>(0);
  const [gameMode, setGameMode] = useState<GameMode>('menu');
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [won, setWon] = useState<boolean>(false);
  const [records, setRecords] = useState<RecordEntry[]>([]);
  const [showRecords, setShowRecords] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [lastMoveTime, setLastMoveTime] = useState<number>(() => Date.now());
  const [touchStart, setTouchStart] = useState<SwipeStart | null>(null);
  const [countdown, setCountdown] = useState<number>(INITIAL_COUNTDOWN);
  const [showInstructions, setShowInstructions] = useState<boolean>(false);
  const [playerName, setPlayerName] = useState<string>('');

  const messageTimeoutRef = useRef<number | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  const addRandomTile = useCallback((board: Grid) => {
    const emptyCells: Array<{ i: number; j: number }> = [];
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

  const showTemporaryMessage = useCallback((text: string, duration = 2000) => {
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
    (value: number) => {
      const text = MILESTONE_MESSAGES[value];
      if (text) {
        showTemporaryMessage(text, 3000);
      }
    },
    [showTemporaryMessage]
  );

  const move = useCallback(
    (direction: 'left' | 'right' | 'up' | 'down') => {
      if (gameMode === 'menu' || showRecords || showInstructions) return;
      if (gameOver || won || grid.length === 0) return;

      let newGrid = grid.map((row) => [...row]);
      let moved = false;
      let currentScore = score;
      const now = Date.now();
      const timeDiff = (now - lastMoveTime) / 1000;
      let bonusPoints = 0;

      const moveLeft = (board: Grid) => {
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

      const rotate = (board: Grid): Grid => {
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
      const parsed: RecordEntry[] = JSON.parse(stored);
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
    const handleKeyDown = (event: KeyboardEvent) => {
      if (gameMode === 'menu' || showRecords || showInstructions) return;
      const keyMap: Record<string, 'left' | 'right' | 'up' | 'down'> = {
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
    (event: React.TouchEvent<HTMLDivElement>) => {
      if (gameMode === 'menu' || showRecords || showInstructions) return;
      setTouchStart({
        x: event.touches[0].clientX,
        y: event.touches[0].clientY
      });
    },
    [gameMode, showInstructions, showRecords]
  );

  const handleTouchEnd = useCallback(
    (event: React.TouchEvent<HTMLDivElement>) => {
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
    (mode: GameMode) => {
      setGameMode(mode);
      setShowRecords(false);
      setShowInstructions(false);
      initializeGrid();
    },
    [initializeGrid]
  );

  const saveRecord = useCallback(
    (name: string): boolean => {
      const trimmed = name.trim();
      if (!trimmed) return false;
      const elapsed = gameMode === 'classic' ? time : INITIAL_COUNTDOWN - countdown;
      const newRecord: RecordEntry = {
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

  return (
    <div className={`min-h-screen transition-colors duration-500 ${activeGradient}`}>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-2 text-white drop-shadow-lg animate-pulse">
            ✨ 2048 Matemàtic
          </h1>
          <p className={`text-xl ${darkMode ? 'text-purple-200' : 'text-white'} font-semibold`}>
            Combina i arriba al 2048!
          </p>
        </div>

        {gameMode === 'menu' && !showRecords && !showInstructions && (
          <div className="space-y-6 animate-fade-in">
            <div className={`${darkMode ? 'bg-gray-800/90' : 'bg-white/90'} backdrop-blur-lg rounded-3xl p-8 shadow-2xl`}>
              <h2 className={`text-3xl font-bold text-center mb-6 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                Tria el mode de joc
              </h2>
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => startGame('classic')}
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-6 px-8 rounded-2xl text-xl font-bold hover:scale-105 transform transition-all shadow-lg hover:shadow-2xl flex items-center justify-center gap-3"
                >
                  <Clock className="w-8 h-8" />
                  Mode clàssic
                </button>
                <button
                  type="button"
                  onClick={() => startGame('countdown')}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-6 px-8 rounded-2xl text-xl font-bold hover:scale-105 transform transition-all shadow-lg hover:shadow-2xl flex items-center justify-center gap-3"
                >
                  <Zap className="w-8 h-8" />
                  Contrarellotge (3 min)
                </button>
                <button
                  type="button"
                  onClick={() => setShowInstructions(true)}
                  className={`w-full ${darkMode ? 'bg-purple-600' : 'bg-purple-500'} text-white py-4 px-8 rounded-2xl text-lg font-bold hover:scale-105 transform transition-all`}
                >
                  📘 Instruccions
                </button>
                <button
                  type="button"
                  onClick={() => setShowRecords(true)}
                  className={`w-full ${darkMode ? 'bg-green-600' : 'bg-green-500'} text-white py-4 px-8 rounded-2xl text-lg font-bold hover:scale-105 transform transition-all flex items-center justify-center gap-2`}
                >
                  <Trophy className="w-6 h-6" />
                  Rècords
                </button>
              </div>
            </div>
          </div>
        )}

        {showInstructions && (
          <div className={`${darkMode ? 'bg-gray-800/95' : 'bg-white/95'} backdrop-blur-lg rounded-3xl p-8 shadow-2xl animate-fade-in`}>
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
          <div className={`${darkMode ? 'bg-gray-800/95' : 'bg-white/95'} backdrop-blur-lg rounded-3xl p-8 shadow-2xl animate-fade-in`}>
            <h2 className={`text-3xl font-bold text-center mb-6 ${darkMode ? 'text-white' : 'text-gray-800'} flex items-center justify-center gap-3`}>
              <Trophy className="w-10 h-10 text-yellow-400" />
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
          <div className="space-y-6">
            <div className={`${darkMode ? 'bg-gray-800/90' : 'bg-white/90'} backdrop-blur-lg rounded-2xl p-6 shadow-xl`}>
              <div className="flex justify-between items-center mb-4 gap-4">
                <div className={`${darkMode ? 'bg-gradient-to-r from-yellow-600 to-orange-600' : 'bg-gradient-to-r from-yellow-400 to-orange-400'} text-white px-6 py-3 rounded-xl text-center shadow-lg`}>
                  <p className="text-sm font-semibold uppercase tracking-wide">Puntuació</p>
                  <p className="text-3xl font-bold">{score}</p>
                </div>
                <div
                  className={`text-center px-6 py-3 rounded-xl shadow-lg ${
                    gameMode === 'countdown' && countdown < 30
                      ? 'bg-red-500 text-white animate-pulse'
                      : darkMode
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                      : 'bg-gradient-to-r from-blue-400 to-purple-400 text-white'
                  }`}
                >
                  <p className="text-sm font-semibold uppercase tracking-wide">
                    {gameMode === 'classic' ? 'Temps' : 'Temps restant'}
                  </p>
                  <p className="text-3xl font-bold">
                    {formatTime(gameMode === 'classic' ? time : countdown)}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleReturnToMenu}
                  className={`flex-1 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2`}
                >
                  ⬅️ Menú
                </button>
                <button
                  type="button"
                  onClick={initializeGrid}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 rounded-xl font-semibold hover:scale-105 transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-5 h-5" />
                  Reiniciar
                </button>
                <button
                  type="button"
                  onClick={() => setDarkMode((value) => !value)}
                  className={`${darkMode ? 'bg-yellow-500 hover:bg-yellow-400' : 'bg-indigo-600 hover:bg-indigo-700'} text-white py-3 px-4 rounded-xl font-semibold transition-all`}
                >
                  <Palette className="w-5 h-5" />
                </button>
              </div>
            </div>

            {message && (
              <div className="bg-gradient-to-r from-pink-500 to-purple-500 text-white text-center py-4 rounded-2xl text-xl font-bold animate-bounce shadow-lg">
                {message}
              </div>
            )}

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
                      className={`aspect-square rounded-2xl flex items-center justify-center text-3xl font-bold transition-all duration-300 shadow-lg ${
                        cell === 0
                          ? darkMode
                            ? 'bg-gray-600/30'
                            : 'bg-gray-200/50'
                          : `bg-gradient-to-br ${TILE_COLORS[cell] || 'from-emerald-600 to-teal-600'} text-white transform hover:scale-105`
                      }`}
                      style={{ animation: cell !== 0 ? 'pop 0.3s ease-out' : 'none' }}
                    >
                      {cell !== 0 && cell}
                    </div>
                  ))
                )}
              </div>
            </div>

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
    </div>
  );
};

export default MathGame2048;
