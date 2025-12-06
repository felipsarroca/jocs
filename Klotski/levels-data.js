// Nivells pre-calculats per al Puzzle de Klotski
// Generats automàticament - 400 nivells únics ordenats per dificultat
// Rang de dificultat: 5 - 90 moviments òptims
// Nivell 400: Configuració clàssica Hua Rong Dao

const LEVELS_DATA = [
  { // Nivell 1: 5 moviments
    positions: [{c:0,r:3},{c:3,r:2},{c:2,r:3},{c:3,r:0},{c:0,r:0},{c:1,r:1},{c:2,r:2},{c:3,r:4},{c:0,r:2},{c:1,r:2}]
  },
  { // Nivell 2: 5 moviments
    positions: [{c:0,r:3},{c:2,r:3},{c:2,r:1},{c:0,r:0},{c:3,r:2},{c:2,r:0},{c:3,r:4},{c:1,r:0},{c:1,r:1},{c:3,r:1}]
  },
  { // Nivell 3: 5 moviments
    positions: [{c:2,r:3},{c:2,r:0},{c:1,r:3},{c:0,r:2},{c:1,r:0},{c:2,r:2},{c:0,r:1},{c:0,r:0},{c:0,r:4},{c:1,r:2}]
  },
  { // Nivell 4: 5 moviments
    positions: [{c:0,r:3},{c:2,r:3},{c:3,r:1},{c:3,r:3},{c:1,r:1},{c:0,r:0},{c:2,r:2},{c:2,r:0},{c:3,r:0},{c:2,r:1}]
  },
  { // Nivell 5: 5 moviments
    positions: [{c:0,r:3},{c:2,r:0},{c:3,r:1},{c:0,r:1},{c:3,r:3},{c:0,r:0},{c:1,r:2},{c:2,r:4},{c:2,r:3},{c:3,r:0}]
  },
  { // Nivell 6: 5 moviments
    positions: [{c:0,r:3},{c:3,r:0},{c:0,r:0},{c:2,r:0},{c:3,r:3},{c:2,r:2},{c:2,r:3},{c:1,r:0},{c:0,r:2},{c:1,r:1}]
  },
  { // Nivell 7: 5 moviments
    positions: [{c:0,r:3},{c:2,r:0},{c:1,r:0},{c:2,r:3},{c:3,r:3},{c:0,r:2},{c:3,r:1},{c:3,r:2},{c:3,r:0},{c:2,r:2}]
  },
  { // Nivell 8: 5 moviments
    positions: [{c:2,r:3},{c:3,r:1},{c:2,r:1},{c:0,r:0},{c:0,r:3},{c:1,r:0},{c:0,r:2},{c:1,r:2},{c:1,r:3},{c:1,r:1}]
  },
  { // Nivell 9: 5 moviments
    positions: [{c:2,r:3},{c:0,r:2},{c:3,r:1},{c:1,r:3},{c:1,r:1},{c:0,r:0},{c:2,r:0},{c:0,r:1},{c:0,r:4},{c:2,r:1}]
  },
  { // Nivell 10: 5 moviments
    positions: [{c:1,r:2},{c:0,r:1},{c:0,r:3},{c:3,r:1},{c:3,r:3},{c:1,r:1},{c:3,r:0},{c:0,r:0},{c:2,r:0},{c:2,r:4}]
  },
  { // Nivell 11: 5 moviments
    positions: [{c:2,r:3},{c:3,r:1},{c:1,r:2},{c:2,r:1},{c:0,r:2},{c:1,r:0},{c:3,r:0},{c:1,r:4},{c:0,r:4},{c:0,r:0}]
  },
  { // Nivell 12: 5 moviments
    positions: [{c:2,r:3},{c:0,r:1},{c:1,r:3},{c:3,r:1},{c:2,r:0},{c:0,r:0},{c:1,r:2},{c:3,r:0},{c:0,r:4},{c:1,r:1}]
  },
  { // Nivell 13: 5 moviments
    positions: [{c:2,r:3},{c:1,r:3},{c:2,r:1},{c:0,r:2},{c:3,r:0},{c:0,r:0},{c:1,r:1},{c:0,r:1},{c:3,r:2},{c:1,r:2}]
  },
  { // Nivell 14: 5 moviments
    positions: [{c:2,r:3},{c:1,r:1},{c:2,r:1},{c:1,r:3},{c:3,r:1},{c:1,r:0},{c:3,r:0},{c:0,r:1},{c:0,r:2},{c:0,r:4}]
  },
  { // Nivell 15: 5 moviments
    positions: [{c:2,r:3},{c:0,r:3},{c:1,r:3},{c:0,r:1},{c:2,r:0},{c:0,r:0},{c:3,r:0},{c:3,r:2},{c:2,r:2},{c:1,r:2}]
  },
  { // Nivell 16: 5 moviments
    positions: [{c:0,r:3},{c:1,r:1},{c:2,r:1},{c:0,r:1},{c:3,r:1},{c:1,r:0},{c:3,r:4},{c:3,r:3},{c:2,r:4},{c:0,r:0}]
  },
  { // Nivell 17: 5 moviments
    positions: [{c:0,r:3},{c:3,r:3},{c:2,r:3},{c:0,r:1},{c:3,r:1},{c:1,r:0},{c:1,r:2},{c:2,r:2},{c:0,r:0},{c:2,r:1}]
  },
  { // Nivell 18: 5 moviments
    positions: [{c:2,r:3},{c:0,r:2},{c:1,r:0},{c:2,r:0},{c:3,r:0},{c:1,r:2},{c:3,r:2},{c:1,r:4},{c:0,r:1},{c:0,r:4}]
  },
  { // Nivell 19: 5 moviments
    positions: [{c:0,r:3},{c:2,r:3},{c:2,r:1},{c:3,r:3},{c:3,r:1},{c:1,r:0},{c:0,r:0},{c:1,r:2},{c:3,r:0},{c:0,r:2}]
  },
  { // Nivell 20: 5 moviments
    positions: [{c:0,r:3},{c:3,r:0},{c:2,r:3},{c:0,r:1},{c:3,r:2},{c:1,r:2},{c:0,r:0},{c:1,r:0},{c:3,r:4},{c:1,r:1}]
  },
  { // Nivell 21: 6 moviments
    positions: [{c:0,r:2},{c:2,r:3},{c:0,r:0},{c:3,r:3},{c:3,r:1},{c:1,r:0},{c:2,r:2},{c:3,r:0},{c:1,r:1},{c:2,r:1}]
  },
  { // Nivell 22: 6 moviments
    positions: [{c:2,r:3},{c:1,r:1},{c:2,r:1},{c:1,r:3},{c:3,r:1},{c:0,r:0},{c:0,r:4},{c:2,r:0},{c:0,r:3},{c:0,r:1}]
  },
  { // Nivell 23: 6 moviments
    positions: [{c:0,r:3},{c:2,r:2},{c:0,r:0},{c:3,r:2},{c:1,r:0},{c:2,r:1},{c:0,r:2},{c:3,r:4},{c:1,r:2},{c:2,r:4}]
  },
  { // Nivell 24: 6 moviments
    positions: [{c:0,r:3},{c:2,r:1},{c:1,r:1},{c:2,r:3},{c:3,r:1},{c:1,r:0},{c:3,r:4},{c:3,r:0},{c:0,r:2},{c:0,r:1}]
  },
  { // Nivell 25: 6 moviments
    positions: [{c:2,r:3},{c:0,r:1},{c:1,r:3},{c:2,r:0},{c:3,r:1},{c:0,r:0},{c:0,r:4},{c:1,r:1},{c:0,r:3},{c:2,r:2}]
  },
  { // Nivell 26: 6 moviments
    positions: [{c:0,r:3},{c:3,r:2},{c:0,r:0},{c:2,r:3},{c:2,r:1},{c:1,r:0},{c:3,r:1},{c:1,r:2},{c:3,r:4},{c:1,r:1}]
  },
  { // Nivell 27: 6 moviments
    positions: [{c:0,r:3},{c:2,r:1},{c:0,r:1},{c:3,r:1},{c:3,r:3},{c:0,r:0},{c:1,r:1},{c:2,r:3},{c:2,r:4},{c:1,r:2}]
  },
  { // Nivell 28: 6 moviments
    positions: [{c:2,r:2},{c:3,r:0},{c:0,r:0},{c:1,r:3},{c:0,r:3},{c:0,r:2},{c:2,r:0},{c:1,r:0},{c:1,r:1},{c:2,r:1}]
  },
  { // Nivell 29: 6 moviments
    positions: [{c:2,r:3},{c:1,r:3},{c:0,r:1},{c:3,r:1},{c:2,r:1},{c:0,r:0},{c:2,r:0},{c:0,r:4},{c:1,r:2},{c:1,r:1}]
  },
  { // Nivell 30: 6 moviments
    positions: [{c:0,r:3},{c:0,r:0},{c:1,r:0},{c:2,r:2},{c:3,r:1},{c:2,r:0},{c:2,r:1},{c:3,r:3},{c:3,r:4},{c:1,r:2}]
  },
  { // Nivell 31: 6 moviments
    positions: [{c:2,r:3},{c:1,r:1},{c:0,r:1},{c:3,r:1},{c:2,r:1},{c:0,r:0},{c:0,r:4},{c:2,r:0},{c:1,r:3},{c:0,r:3}]
  },
  { // Nivell 32: 6 moviments
    positions: [{c:0,r:3},{c:3,r:1},{c:2,r:2},{c:0,r:1},{c:1,r:1},{c:1,r:0},{c:2,r:1},{c:2,r:4},{c:3,r:4},{c:3,r:0}]
  },
  { // Nivell 33: 6 moviments
    positions: [{c:0,r:3},{c:2,r:3},{c:0,r:0},{c:2,r:1},{c:1,r:1},{c:2,r:0},{c:3,r:1},{c:3,r:2},{c:0,r:2},{c:3,r:4}]
  },
  { // Nivell 34: 6 moviments
    positions: [{c:0,r:3},{c:3,r:0},{c:3,r:3},{c:0,r:1},{c:2,r:0},{c:2,r:2},{c:2,r:4},{c:1,r:1},{c:1,r:2},{c:1,r:0}]
  },
  { // Nivell 35: 6 moviments
    positions: [{c:2,r:3},{c:0,r:0},{c:3,r:1},{c:2,r:1},{c:0,r:3},{c:0,r:2},{c:1,r:1},{c:1,r:0},{c:1,r:4},{c:2,r:0}]
  },
  { // Nivell 36: 6 moviments
    positions: [{c:2,r:3},{c:0,r:1},{c:3,r:1},{c:2,r:1},{c:1,r:3},{c:0,r:0},{c:0,r:3},{c:1,r:1},{c:1,r:2},{c:0,r:4}]
  },
  { // Nivell 37: 6 moviments
    positions: [{c:0,r:3},{c:2,r:2},{c:0,r:1},{c:3,r:2},{c:1,r:0},{c:2,r:0},{c:2,r:4},{c:3,r:1},{c:0,r:0},{c:2,r:1}]
  },
  { // Nivell 38: 6 moviments
    positions: [{c:0,r:3},{c:3,r:1},{c:0,r:1},{c:2,r:1},{c:3,r:3},{c:2,r:0},{c:0,r:0},{c:1,r:0},{c:2,r:4},{c:1,r:2}]
  },
  { // Nivell 39: 6 moviments
    positions: [{c:2,r:3},{c:0,r:0},{c:3,r:1},{c:1,r:2},{c:0,r:3},{c:1,r:0},{c:1,r:4},{c:3,r:0},{c:2,r:1},{c:1,r:1}]
  },
  { // Nivell 40: 7 moviments
    positions: [{c:2,r:3},{c:0,r:3},{c:1,r:0},{c:0,r:1},{c:2,r:1},{c:2,r:0},{c:1,r:2},{c:1,r:4},{c:1,r:3},{c:0,r:0}]
  },
  { // Nivell 41: 7 moviments
    positions: [{c:0,r:3},{c:3,r:1},{c:3,r:3},{c:0,r:1},{c:2,r:1},{c:2,r:0},{c:2,r:4},{c:0,r:0},{c:1,r:0},{c:1,r:1}]
  },
  { // Nivell 42: 7 moviments
    positions: [{c:0,r:3},{c:0,r:1},{c:1,r:0},{c:3,r:2},{c:2,r:2},{c:2,r:0},{c:2,r:4},{c:3,r:1},{c:3,r:4},{c:0,r:0}]
  },
  { // Nivell 43: 7 moviments
    positions: [{c:2,r:3},{c:0,r:0},{c:2,r:1},{c:0,r:2},{c:1,r:0},{c:2,r:0},{c:1,r:3},{c:1,r:2},{c:0,r:4},{c:1,r:4}]
  },
  { // Nivell 44: 7 moviments
    positions: [{c:0,r:2},{c:3,r:3},{c:2,r:3},{c:1,r:0},{c:2,r:0},{c:2,r:2},{c:3,r:0},{c:3,r:1},{c:0,r:0},{c:0,r:1}]
  },
  { // Nivell 45: 7 moviments
    positions: [{c:0,r:3},{c:2,r:3},{c:1,r:1},{c:3,r:0},{c:2,r:0},{c:0,r:0},{c:3,r:3},{c:3,r:2},{c:0,r:1},{c:3,r:4}]
  },
  { // Nivell 46: 7 moviments
    positions: [{c:0,r:3},{c:2,r:3},{c:3,r:2},{c:3,r:0},{c:0,r:0},{c:1,r:1},{c:3,r:4},{c:1,r:2},{c:2,r:2},{c:1,r:0}]
  },
  { // Nivell 47: 7 moviments
    positions: [{c:2,r:3},{c:0,r:3},{c:1,r:1},{c:2,r:0},{c:1,r:3},{c:0,r:0},{c:0,r:2},{c:0,r:1},{c:3,r:2},{c:3,r:1}]
  },
  { // Nivell 48: 7 moviments
    positions: [{c:2,r:3},{c:0,r:0},{c:2,r:0},{c:1,r:1},{c:3,r:0},{c:0,r:3},{c:1,r:4},{c:1,r:0},{c:3,r:2},{c:0,r:4}]
  },
  { // Nivell 49: 7 moviments
    positions: [{c:0,r:3},{c:2,r:3},{c:1,r:0},{c:0,r:0},{c:3,r:2},{c:2,r:0},{c:3,r:1},{c:2,r:1},{c:1,r:2},{c:2,r:2}]
  },
  { // Nivell 50: 7 moviments
    positions: [{c:2,r:3},{c:0,r:3},{c:3,r:1},{c:2,r:1},{c:0,r:0},{c:0,r:2},{c:2,r:0},{c:1,r:1},{c:1,r:3},{c:1,r:0}]
  },
  { // Nivell 51: 7 moviments
    positions: [{c:0,r:3},{c:1,r:1},{c:3,r:2},{c:2,r:2},{c:0,r:1},{c:2,r:0},{c:2,r:1},{c:1,r:0},{c:2,r:4},{c:3,r:1}]
  },
  { // Nivell 52: 7 moviments
    positions: [{c:0,r:3},{c:1,r:0},{c:2,r:1},{c:0,r:0},{c:3,r:3},{c:2,r:0},{c:3,r:2},{c:2,r:3},{c:2,r:4},{c:0,r:2}]
  },
  { // Nivell 53: 8 moviments
    positions: [{c:2,r:2},{c:0,r:2},{c:1,r:3},{c:1,r:0},{c:0,r:0},{c:2,r:1},{c:0,r:4},{c:3,r:0},{c:1,r:2},{c:2,r:0}]
  },
  { // Nivell 54: 8 moviments
    positions: [{c:2,r:3},{c:0,r:3},{c:3,r:1},{c:2,r:0},{c:1,r:0},{c:0,r:2},{c:1,r:4},{c:0,r:1},{c:1,r:3},{c:2,r:2}]
  },
  { // Nivell 55: 8 moviments
    positions: [{c:2,r:2},{c:0,r:3},{c:1,r:3},{c:2,r:0},{c:1,r:1},{c:0,r:0},{c:0,r:2},{c:3,r:0},{c:3,r:1},{c:0,r:1}]
  },
  { // Nivell 56: 8 moviments
    positions: [{c:0,r:3},{c:2,r:2},{c:0,r:1},{c:1,r:1},{c:3,r:3},{c:2,r:0},{c:1,r:0},{c:2,r:1},{c:3,r:2},{c:2,r:4}]
  },
  { // Nivell 57: 8 moviments
    positions: [{c:2,r:3},{c:1,r:1},{c:0,r:2},{c:2,r:1},{c:3,r:0},{c:0,r:0},{c:2,r:0},{c:0,r:4},{c:1,r:3},{c:1,r:4}]
  },
  { // Nivell 58: 8 moviments
    positions: [{c:0,r:3},{c:3,r:0},{c:0,r:1},{c:1,r:1},{c:3,r:3},{c:2,r:2},{c:0,r:0},{c:2,r:3},{c:1,r:0},{c:2,r:0}]
  },
  { // Nivell 59: 8 moviments
    positions: [{c:0,r:3},{c:0,r:0},{c:2,r:1},{c:1,r:1},{c:3,r:2},{c:2,r:0},{c:3,r:1},{c:2,r:4},{c:2,r:3},{c:1,r:0}]
  },
  { // Nivell 60: 8 moviments
    positions: [{c:2,r:3},{c:2,r:1},{c:1,r:0},{c:3,r:0},{c:0,r:0},{c:0,r:2},{c:1,r:4},{c:0,r:4},{c:2,r:0},{c:0,r:3}]
  },
  { // Nivell 61: 9 moviments
    positions: [{c:0,r:3},{c:3,r:3},{c:1,r:0},{c:2,r:3},{c:0,r:0},{c:2,r:1},{c:0,r:2},{c:2,r:2},{c:1,r:2},{c:3,r:0}]
  },
  { // Nivell 62: 9 moviments
    positions: [{c:2,r:3},{c:0,r:3},{c:0,r:1},{c:3,r:0},{c:1,r:2},{c:0,r:0},{c:1,r:1},{c:1,r:4},{c:2,r:1},{c:2,r:0}]
  },
  { // Nivell 63: 9 moviments
    positions: [{c:2,r:3},{c:1,r:0},{c:2,r:1},{c:1,r:3},{c:0,r:3},{c:2,r:0},{c:0,r:0},{c:0,r:2},{c:1,r:2},{c:0,r:1}]
  },
  { // Nivell 64: 9 moviments
    positions: [{c:2,r:3},{c:1,r:3},{c:2,r:1},{c:1,r:0},{c:0,r:0},{c:0,r:2},{c:0,r:3},{c:2,r:0},{c:3,r:2},{c:0,r:4}]
  },
  { // Nivell 65: 9 moviments
    positions: [{c:0,r:2},{c:3,r:3},{c:2,r:3},{c:3,r:0},{c:2,r:0},{c:0,r:0},{c:3,r:2},{c:0,r:1},{c:1,r:1},{c:2,r:2}]
  },
  { // Nivell 66: 9 moviments
    positions: [{c:0,r:3},{c:2,r:2},{c:1,r:1},{c:3,r:3},{c:0,r:0},{c:2,r:0},{c:3,r:2},{c:2,r:4},{c:3,r:1},{c:1,r:0}]
  },
  { // Nivell 67: 9 moviments
    positions: [{c:0,r:2},{c:3,r:2},{c:2,r:0},{c:3,r:0},{c:2,r:3},{c:0,r:0},{c:1,r:1},{c:2,r:2},{c:3,r:4},{c:0,r:1}]
  },
  { // Nivell 68: 9 moviments
    positions: [{c:0,r:3},{c:3,r:0},{c:2,r:3},{c:3,r:2},{c:0,r:0},{c:1,r:1},{c:1,r:0},{c:2,r:0},{c:3,r:4},{c:1,r:2}]
  },
  { // Nivell 69: 9 moviments
    positions: [{c:2,r:3},{c:0,r:0},{c:2,r:0},{c:0,r:3},{c:1,r:0},{c:1,r:2},{c:1,r:3},{c:1,r:4},{c:3,r:0},{c:0,r:2}]
  },
  { // Nivell 70: 9 moviments
    positions: [{c:0,r:2},{c:3,r:2},{c:2,r:1},{c:3,r:0},{c:0,r:0},{c:1,r:0},{c:0,r:4},{c:2,r:3},{c:1,r:1},{c:1,r:4}]
  },
  { // Nivell 71: 9 moviments
    positions: [{c:0,r:2},{c:3,r:1},{c:2,r:3},{c:2,r:0},{c:3,r:3},{c:0,r:0},{c:0,r:1},{c:2,r:2},{c:3,r:0},{c:1,r:1}]
  },
  { // Nivell 72: 9 moviments
    positions: [{c:0,r:3},{c:3,r:0},{c:3,r:2},{c:2,r:3},{c:2,r:0},{c:0,r:2},{c:3,r:4},{c:0,r:1},{c:1,r:1},{c:0,r:0}]
  },
  { // Nivell 73: 9 moviments
    positions: [{c:2,r:3},{c:1,r:2},{c:0,r:0},{c:1,r:0},{c:0,r:2},{c:2,r:1},{c:2,r:2},{c:3,r:2},{c:0,r:4},{c:3,r:0}]
  },
  { // Nivell 74: 9 moviments
    positions: [{c:0,r:3},{c:3,r:0},{c:3,r:3},{c:0,r:0},{c:2,r:3},{c:1,r:1},{c:0,r:2},{c:2,r:0},{c:1,r:2},{c:1,r:0}]
  },
  { // Nivell 75: 9 moviments
    positions: [{c:2,r:3},{c:0,r:0},{c:0,r:2},{c:1,r:0},{c:1,r:3},{c:1,r:2},{c:3,r:1},{c:2,r:0},{c:3,r:0},{c:0,r:4}]
  },
  { // Nivell 76: 9 moviments
    positions: [{c:2,r:3},{c:3,r:0},{c:1,r:0},{c:0,r:0},{c:0,r:2},{c:1,r:2},{c:0,r:4},{c:2,r:0},{c:1,r:4},{c:1,r:3}]
  },
  { // Nivell 77: 9 moviments
    positions: [{c:0,r:2},{c:2,r:1},{c:3,r:2},{c:1,r:0},{c:0,r:0},{c:2,r:0},{c:2,r:3},{c:0,r:4},{c:1,r:4},{c:2,r:4}]
  },
  { // Nivell 78: 9 moviments
    positions: [{c:1,r:2},{c:3,r:1},{c:0,r:1},{c:3,r:3},{c:0,r:3},{c:1,r:1},{c:1,r:0},{c:2,r:4},{c:0,r:0},{c:1,r:4}]
  },
  { // Nivell 79: 9 moviments
    positions: [{c:2,r:3},{c:0,r:0},{c:2,r:1},{c:0,r:3},{c:1,r:3},{c:2,r:0},{c:1,r:2},{c:3,r:2},{c:1,r:0},{c:1,r:1}]
  },
  { // Nivell 80: 10 moviments
    positions: [{c:2,r:2},{c:1,r:3},{c:2,r:0},{c:0,r:3},{c:3,r:0},{c:0,r:1},{c:0,r:0},{c:1,r:2},{c:1,r:0},{c:0,r:2}]
  },
  { // Nivell 81: 10 moviments
    positions: [{c:2,r:3},{c:1,r:3},{c:0,r:2},{c:1,r:1},{c:2,r:0},{c:2,r:2},{c:0,r:1},{c:1,r:0},{c:0,r:0},{c:0,r:4}]
  },
  { // Nivell 82: 10 moviments
    positions: [{c:0,r:2},{c:2,r:3},{c:2,r:1},{c:1,r:0},{c:0,r:0},{c:2,r:0},{c:3,r:3},{c:3,r:2},{c:3,r:4},{c:3,r:1}]
  },
  { // Nivell 83: 10 moviments
    positions: [{c:2,r:2},{c:3,r:0},{c:0,r:0},{c:0,r:2},{c:1,r:3},{c:1,r:1},{c:1,r:0},{c:1,r:2},{c:0,r:4},{c:2,r:0}]
  },
  { // Nivell 84: 10 moviments
    positions: [{c:2,r:3},{c:0,r:3},{c:0,r:1},{c:1,r:1},{c:2,r:0},{c:2,r:2},{c:1,r:3},{c:1,r:4},{c:1,r:0},{c:0,r:0}]
  },
  { // Nivell 85: 10 moviments
    positions: [{c:0,r:3},{c:3,r:3},{c:0,r:0},{c:3,r:1},{c:2,r:3},{c:1,r:1},{c:0,r:2},{c:1,r:0},{c:1,r:2},{c:2,r:0}]
  },
  { // Nivell 86: 10 moviments
    positions: [{c:0,r:3},{c:3,r:0},{c:2,r:0},{c:2,r:3},{c:1,r:0},{c:0,r:2},{c:3,r:4},{c:0,r:0},{c:3,r:2},{c:3,r:3}]
  },
  { // Nivell 87: 10 moviments
    positions: [{c:2,r:3},{c:0,r:3},{c:2,r:0},{c:1,r:2},{c:3,r:1},{c:0,r:1},{c:1,r:4},{c:0,r:2},{c:2,r:2},{c:0,r:0}]
  },
  { // Nivell 88: 10 moviments
    positions: [{c:0,r:3},{c:2,r:0},{c:1,r:0},{c:0,r:0},{c:3,r:1},{c:2,r:3},{c:2,r:4},{c:1,r:2},{c:3,r:0},{c:3,r:4}]
  },
  { // Nivell 89: 10 moviments
    positions: [{c:2,r:2},{c:0,r:0},{c:0,r:3},{c:3,r:0},{c:1,r:2},{c:1,r:0},{c:1,r:4},{c:0,r:2},{c:3,r:4},{c:2,r:1}]
  },
  { // Nivell 90: 10 moviments
    positions: [{c:2,r:3},{c:0,r:0},{c:3,r:0},{c:0,r:3},{c:1,r:0},{c:2,r:2},{c:0,r:2},{c:1,r:4},{c:1,r:3},{c:2,r:0}]
  },
  { // Nivell 91: 10 moviments
    positions: [{c:2,r:3},{c:1,r:1},{c:0,r:3},{c:2,r:0},{c:1,r:3},{c:2,r:2},{c:0,r:0},{c:0,r:2},{c:0,r:1},{c:1,r:0}]
  },
  { // Nivell 92: 10 moviments
    positions: [{c:0,r:3},{c:0,r:0},{c:2,r:2},{c:3,r:0},{c:3,r:2},{c:1,r:1},{c:0,r:2},{c:1,r:2},{c:3,r:4},{c:1,r:0}]
  },
  { // Nivell 93: 10 moviments
    positions: [{c:2,r:3},{c:3,r:0},{c:0,r:2},{c:0,r:0},{c:1,r:2},{c:1,r:1},{c:2,r:2},{c:0,r:4},{c:1,r:0},{c:3,r:2}]
  },
  { // Nivell 94: 10 moviments
    positions: [{c:0,r:2},{c:1,r:0},{c:0,r:0},{c:2,r:2},{c:3,r:2},{c:2,r:0},{c:1,r:4},{c:2,r:1},{c:3,r:1},{c:3,r:4}]
  },
  { // Nivell 95: 10 moviments
    positions: [{c:0,r:3},{c:0,r:1},{c:2,r:3},{c:3,r:1},{c:2,r:1},{c:0,r:0},{c:2,r:0},{c:3,r:4},{c:3,r:0},{c:1,r:1}]
  },
  { // Nivell 96: 10 moviments
    positions: [{c:2,r:3},{c:0,r:2},{c:2,r:0},{c:0,r:0},{c:1,r:0},{c:2,r:2},{c:1,r:4},{c:1,r:3},{c:3,r:0},{c:0,r:4}]
  },
  { // Nivell 97: 11 moviments
    positions: [{c:2,r:3},{c:1,r:2},{c:0,r:3},{c:2,r:0},{c:0,r:0},{c:2,r:2},{c:3,r:1},{c:1,r:1},{c:0,r:2},{c:1,r:0}]
  },
  { // Nivell 98: 11 moviments
    positions: [{c:2,r:3},{c:3,r:1},{c:0,r:1},{c:1,r:2},{c:1,r:0},{c:2,r:0},{c:2,r:1},{c:0,r:4},{c:1,r:4},{c:0,r:0}]
  },
  { // Nivell 99: 11 moviments
    positions: [{c:0,r:3},{c:2,r:3},{c:3,r:3},{c:2,r:0},{c:3,r:1},{c:0,r:1},{c:2,r:2},{c:0,r:2},{c:3,r:0},{c:1,r:2}]
  },
  { // Nivell 100: 11 moviments
    positions: [{c:0,r:3},{c:2,r:0},{c:2,r:3},{c:3,r:2},{c:3,r:0},{c:0,r:1},{c:3,r:4},{c:0,r:2},{c:1,r:2},{c:2,r:2}]
  },
  { // Nivell 101: 11 moviments
    positions: [{c:1,r:1},{c:0,r:1},{c:0,r:3},{c:3,r:0},{c:3,r:2},{c:0,r:0},{c:2,r:3},{c:1,r:4},{c:2,r:0},{c:3,r:4}]
  },
  { // Nivell 102: 11 moviments
    positions: [{c:2,r:3},{c:3,r:0},{c:0,r:3},{c:1,r:0},{c:0,r:0},{c:2,r:2},{c:0,r:2},{c:1,r:3},{c:2,r:1},{c:1,r:4}]
  },
  { // Nivell 103: 11 moviments
    positions: [{c:0,r:2},{c:3,r:0},{c:2,r:1},{c:3,r:3},{c:0,r:0},{c:1,r:0},{c:2,r:4},{c:1,r:4},{c:1,r:1},{c:0,r:4}]
  },
  { // Nivell 104: 11 moviments
    positions: [{c:0,r:3},{c:3,r:0},{c:2,r:3},{c:2,r:1},{c:3,r:3},{c:0,r:2},{c:0,r:0},{c:1,r:1},{c:3,r:2},{c:1,r:0}]
  },
  { // Nivell 105: 11 moviments
    positions: [{c:2,r:3},{c:0,r:1},{c:1,r:0},{c:3,r:1},{c:2,r:0},{c:0,r:3},{c:2,r:2},{c:0,r:0},{c:0,r:4},{c:1,r:4}]
  },
  { // Nivell 106: 11 moviments
    positions: [{c:2,r:3},{c:1,r:3},{c:1,r:1},{c:0,r:2},{c:2,r:0},{c:2,r:2},{c:0,r:0},{c:0,r:1},{c:0,r:4},{c:3,r:0}]
  },
  { // Nivell 107: 11 moviments
    positions: [{c:0,r:3},{c:3,r:3},{c:2,r:1},{c:3,r:0},{c:2,r:3},{c:0,r:2},{c:1,r:0},{c:1,r:1},{c:3,r:2},{c:0,r:1}]
  },
  { // Nivell 108: 11 moviments
    positions: [{c:0,r:3},{c:3,r:0},{c:1,r:0},{c:3,r:3},{c:2,r:1},{c:0,r:2},{c:3,r:2},{c:2,r:3},{c:0,r:1},{c:2,r:4}]
  },
  { // Nivell 109: 11 moviments
    positions: [{c:2,r:3},{c:0,r:2},{c:3,r:0},{c:0,r:0},{c:1,r:0},{c:2,r:2},{c:2,r:0},{c:0,r:4},{c:1,r:2},{c:1,r:4}]
  },
  { // Nivell 110: 11 moviments
    positions: [{c:0,r:3},{c:1,r:0},{c:2,r:0},{c:3,r:3},{c:2,r:3},{c:0,r:2},{c:2,r:2},{c:0,r:0},{c:3,r:1},{c:3,r:0}]
  },
  { // Nivell 111: 11 moviments
    positions: [{c:0,r:3},{c:2,r:3},{c:0,r:1},{c:2,r:0},{c:1,r:0},{c:2,r:2},{c:1,r:2},{c:3,r:3},{c:3,r:4},{c:0,r:0}]
  },
  { // Nivell 112: 11 moviments
    positions: [{c:0,r:3},{c:2,r:0},{c:2,r:3},{c:3,r:0},{c:3,r:2},{c:0,r:2},{c:2,r:2},{c:0,r:1},{c:1,r:1},{c:0,r:0}]
  },
  { // Nivell 113: 11 moviments
    positions: [{c:2,r:3},{c:0,r:0},{c:3,r:0},{c:0,r:2},{c:1,r:0},{c:2,r:2},{c:2,r:1},{c:1,r:3},{c:1,r:4},{c:0,r:4}]
  },
  { // Nivell 114: 11 moviments
    positions: [{c:1,r:2},{c:3,r:2},{c:0,r:0},{c:0,r:2},{c:3,r:0},{c:1,r:0},{c:0,r:4},{c:1,r:1},{c:3,r:4},{c:2,r:4}]
  },
  { // Nivell 115: 11 moviments
    positions: [{c:2,r:3},{c:0,r:1},{c:1,r:0},{c:0,r:3},{c:1,r:3},{c:2,r:1},{c:3,r:2},{c:2,r:2},{c:0,r:0},{c:1,r:2}]
  },
  { // Nivell 116: 11 moviments
    positions: [{c:2,r:3},{c:1,r:0},{c:0,r:2},{c:0,r:0},{c:1,r:3},{c:2,r:1},{c:1,r:2},{c:3,r:2},{c:0,r:4},{c:2,r:2}]
  },
  { // Nivell 117: 11 moviments
    positions: [{c:0,r:3},{c:3,r:0},{c:2,r:0},{c:0,r:0},{c:3,r:2},{c:0,r:2},{c:2,r:3},{c:1,r:1},{c:2,r:4},{c:3,r:4}]
  },
  { // Nivell 118: 11 moviments
    positions: [{c:1,r:2},{c:3,r:2},{c:0,r:0},{c:0,r:3},{c:3,r:0},{c:1,r:0},{c:1,r:4},{c:2,r:4},{c:0,r:2},{c:1,r:1}]
  },
  { // Nivell 119: 11 moviments
    positions: [{c:2,r:3},{c:1,r:0},{c:2,r:0},{c:0,r:0},{c:1,r:2},{c:2,r:2},{c:0,r:4},{c:0,r:3},{c:0,r:2},{c:3,r:0}]
  },
  { // Nivell 120: 11 moviments
    positions: [{c:0,r:3},{c:3,r:3},{c:3,r:0},{c:2,r:0},{c:2,r:3},{c:0,r:1},{c:0,r:2},{c:2,r:2},{c:1,r:2},{c:3,r:2}]
  },
  { // Nivell 121: 11 moviments
    positions: [{c:0,r:3},{c:1,r:0},{c:3,r:0},{c:2,r:0},{c:2,r:3},{c:0,r:2},{c:3,r:4},{c:3,r:3},{c:0,r:1},{c:2,r:2}]
  },
  { // Nivell 122: 11 moviments
    positions: [{c:2,r:3},{c:0,r:0},{c:1,r:3},{c:1,r:0},{c:0,r:3},{c:2,r:2},{c:2,r:1},{c:2,r:0},{c:1,r:2},{c:3,r:1}]
  },
  { // Nivell 123: 11 moviments
    positions: [{c:0,r:3},{c:3,r:2},{c:3,r:0},{c:0,r:1},{c:2,r:3},{c:1,r:1},{c:2,r:0},{c:0,r:0},{c:1,r:2},{c:3,r:4}]
  },
  { // Nivell 124: 12 moviments
    positions: [{c:0,r:2},{c:0,r:0},{c:2,r:3},{c:3,r:3},{c:1,r:0},{c:2,r:1},{c:0,r:4},{c:1,r:4},{c:2,r:2},{c:3,r:2}]
  },
  { // Nivell 125: 12 moviments
    positions: [{c:0,r:2},{c:2,r:1},{c:0,r:0},{c:2,r:3},{c:3,r:2},{c:2,r:0},{c:1,r:1},{c:0,r:4},{c:1,r:4},{c:1,r:0}]
  },
  { // Nivell 126: 12 moviments
    positions: [{c:0,r:3},{c:3,r:2},{c:3,r:0},{c:2,r:2},{c:0,r:1},{c:1,r:0},{c:0,r:0},{c:2,r:4},{c:2,r:1},{c:3,r:4}]
  },
  { // Nivell 127: 12 moviments
    positions: [{c:2,r:3},{c:0,r:3},{c:1,r:3},{c:1,r:1},{c:2,r:0},{c:2,r:2},{c:0,r:1},{c:3,r:0},{c:0,r:2},{c:1,r:0}]
  },
  { // Nivell 128: 12 moviments
    positions: [{c:2,r:3},{c:0,r:0},{c:1,r:2},{c:3,r:1},{c:0,r:2},{c:1,r:1},{c:1,r:0},{c:0,r:4},{c:3,r:0},{c:2,r:2}]
  },
  { // Nivell 129: 12 moviments
    positions: [{c:0,r:3},{c:3,r:0},{c:3,r:2},{c:2,r:0},{c:1,r:0},{c:0,r:2},{c:2,r:3},{c:2,r:2},{c:0,r:0},{c:3,r:4}]
  },
  { // Nivell 130: 12 moviments
    positions: [{c:2,r:3},{c:1,r:0},{c:1,r:3},{c:0,r:1},{c:2,r:0},{c:2,r:2},{c:0,r:4},{c:1,r:2},{c:3,r:0},{c:0,r:3}]
  },
  { // Nivell 131: 12 moviments
    positions: [{c:0,r:3},{c:3,r:0},{c:1,r:0},{c:2,r:2},{c:2,r:0},{c:0,r:2},{c:3,r:2},{c:3,r:3},{c:2,r:4},{c:0,r:1}]
  },
  { // Nivell 132: 12 moviments
    positions: [{c:0,r:2},{c:0,r:0},{c:3,r:1},{c:3,r:3},{c:2,r:3},{c:1,r:0},{c:2,r:1},{c:1,r:4},{c:2,r:2},{c:1,r:1}]
  },
  { // Nivell 133: 12 moviments
    positions: [{c:0,r:3},{c:0,r:1},{c:3,r:1},{c:2,r:0},{c:1,r:1},{c:2,r:3},{c:3,r:4},{c:2,r:2},{c:3,r:0},{c:2,r:4}]
  },
  { // Nivell 134: 12 moviments
    positions: [{c:2,r:2},{c:3,r:0},{c:0,r:0},{c:1,r:1},{c:1,r:3},{c:1,r:0},{c:0,r:3},{c:2,r:1},{c:3,r:4},{c:2,r:4}]
  },
  { // Nivell 135: 12 moviments
    positions: [{c:2,r:3},{c:1,r:0},{c:3,r:0},{c:0,r:0},{c:0,r:2},{c:2,r:2},{c:0,r:4},{c:1,r:2},{c:2,r:0},{c:1,r:3}]
  },
  { // Nivell 136: 12 moviments
    positions: [{c:0,r:3},{c:3,r:0},{c:2,r:2},{c:1,r:0},{c:2,r:0},{c:0,r:2},{c:3,r:3},{c:0,r:0},{c:2,r:4},{c:3,r:2}]
  },
  { // Nivell 137: 12 moviments
    positions: [{c:2,r:3},{c:0,r:0},{c:2,r:0},{c:1,r:0},{c:0,r:2},{c:2,r:2},{c:1,r:3},{c:1,r:2},{c:0,r:4},{c:3,r:0}]
  },
  { // Nivell 138: 12 moviments
    positions: [{c:2,r:2},{c:1,r:3},{c:3,r:0},{c:0,r:2},{c:1,r:1},{c:0,r:0},{c:2,r:0},{c:2,r:1},{c:2,r:4},{c:3,r:4}]
  },
  { // Nivell 139: 12 moviments
    positions: [{c:2,r:2},{c:1,r:3},{c:3,r:0},{c:0,r:1},{c:0,r:3},{c:1,r:0},{c:0,r:0},{c:3,r:4},{c:1,r:1},{c:2,r:4}]
  },
  { // Nivell 140: 12 moviments
    positions: [{c:1,r:2},{c:3,r:2},{c:0,r:3},{c:0,r:0},{c:3,r:0},{c:1,r:0},{c:1,r:1},{c:3,r:4},{c:1,r:4},{c:0,r:2}]
  },
  { // Nivell 141: 12 moviments
    positions: [{c:2,r:3},{c:1,r:0},{c:0,r:3},{c:2,r:0},{c:0,r:0},{c:2,r:2},{c:0,r:2},{c:1,r:2},{c:3,r:1},{c:1,r:3}]
  },
  { // Nivell 142: 12 moviments
    positions: [{c:0,r:3},{c:3,r:3},{c:1,r:0},{c:2,r:0},{c:3,r:1},{c:0,r:2},{c:2,r:3},{c:2,r:4},{c:2,r:2},{c:0,r:0}]
  },
  { // Nivell 143: 12 moviments
    positions: [{c:0,r:3},{c:2,r:1},{c:3,r:2},{c:2,r:3},{c:1,r:0},{c:0,r:2},{c:3,r:4},{c:3,r:1},{c:0,r:1},{c:2,r:0}]
  },
  { // Nivell 144: 12 moviments
    positions: [{c:0,r:3},{c:3,r:0},{c:3,r:2},{c:2,r:2},{c:1,r:0},{c:0,r:2},{c:2,r:0},{c:0,r:1},{c:2,r:4},{c:2,r:1}]
  },
  { // Nivell 145: 12 moviments
    positions: [{c:2,r:3},{c:1,r:0},{c:2,r:1},{c:0,r:1},{c:1,r:2},{c:2,r:0},{c:3,r:2},{c:1,r:4},{c:0,r:4},{c:0,r:3}]
  },
  { // Nivell 146: 12 moviments
    positions: [{c:2,r:3},{c:3,r:0},{c:0,r:3},{c:0,r:0},{c:1,r:0},{c:2,r:2},{c:1,r:2},{c:2,r:1},{c:1,r:4},{c:0,r:2}]
  },
  { // Nivell 147: 12 moviments
    positions: [{c:2,r:3},{c:1,r:3},{c:0,r:3},{c:1,r:1},{c:2,r:0},{c:2,r:2},{c:1,r:0},{c:0,r:2},{c:3,r:1},{c:0,r:1}]
  },
  { // Nivell 148: 12 moviments
    positions: [{c:0,r:3},{c:3,r:0},{c:2,r:0},{c:1,r:0},{c:3,r:2},{c:0,r:2},{c:2,r:3},{c:2,r:2},{c:2,r:4},{c:0,r:1}]
  },
  { // Nivell 149: 12 moviments
    positions: [{c:0,r:2},{c:2,r:1},{c:2,r:3},{c:0,r:0},{c:3,r:0},{c:1,r:0},{c:1,r:1},{c:0,r:4},{c:1,r:4},{c:3,r:4}]
  },
  { // Nivell 150: 12 moviments
    positions: [{c:2,r:3},{c:1,r:0},{c:0,r:1},{c:1,r:3},{c:0,r:3},{c:2,r:2},{c:2,r:0},{c:1,r:2},{c:3,r:0},{c:3,r:1}]
  },
  { // Nivell 151: 12 moviments
    positions: [{c:2,r:2},{c:1,r:3},{c:3,r:0},{c:0,r:3},{c:2,r:0},{c:0,r:1},{c:1,r:2},{c:3,r:4},{c:0,r:2},{c:2,r:4}]
  },
  { // Nivell 152: 12 moviments
    positions: [{c:2,r:3},{c:0,r:2},{c:1,r:0},{c:0,r:0},{c:2,r:0},{c:2,r:2},{c:1,r:2},{c:1,r:3},{c:3,r:1},{c:0,r:4}]
  },
  { // Nivell 153: 12 moviments
    positions: [{c:2,r:3},{c:3,r:0},{c:0,r:3},{c:1,r:0},{c:0,r:0},{c:2,r:2},{c:1,r:3},{c:1,r:4},{c:2,r:1},{c:1,r:2}]
  },
  { // Nivell 154: 12 moviments
    positions: [{c:0,r:3},{c:2,r:2},{c:3,r:2},{c:3,r:0},{c:0,r:1},{c:1,r:1},{c:2,r:0},{c:3,r:4},{c:1,r:2},{c:0,r:0}]
  },
  { // Nivell 155: 12 moviments
    positions: [{c:2,r:2},{c:3,r:0},{c:2,r:0},{c:0,r:2},{c:1,r:2},{c:0,r:0},{c:3,r:4},{c:1,r:4},{c:2,r:4},{c:0,r:4}]
  },
  { // Nivell 156: 12 moviments
    positions: [{c:0,r:3},{c:1,r:1},{c:3,r:2},{c:2,r:0},{c:2,r:2},{c:0,r:0},{c:0,r:2},{c:2,r:4},{c:3,r:4},{c:3,r:1}]
  },
  { // Nivell 157: 12 moviments
    positions: [{c:2,r:3},{c:0,r:3},{c:1,r:0},{c:2,r:1},{c:1,r:3},{c:0,r:2},{c:3,r:1},{c:3,r:0},{c:3,r:2},{c:2,r:0}]
  },
  { // Nivell 158: 12 moviments
    positions: [{c:2,r:3},{c:3,r:1},{c:0,r:1},{c:1,r:0},{c:2,r:1},{c:0,r:3},{c:1,r:4},{c:1,r:2},{c:0,r:0},{c:0,r:4}]
  },
  { // Nivell 159: 12 moviments
    positions: [{c:0,r:3},{c:2,r:0},{c:3,r:0},{c:2,r:2},{c:3,r:3},{c:0,r:2},{c:1,r:1},{c:0,r:1},{c:0,r:0},{c:2,r:4}]
  },
  { // Nivell 160: 12 moviments
    positions: [{c:0,r:3},{c:2,r:1},{c:1,r:0},{c:3,r:3},{c:2,r:3},{c:0,r:2},{c:2,r:0},{c:0,r:0},{c:3,r:2},{c:3,r:1}]
  },
  { // Nivell 161: 12 moviments
    positions: [{c:2,r:2},{c:1,r:1},{c:2,r:0},{c:0,r:0},{c:3,r:0},{c:0,r:3},{c:0,r:4},{c:2,r:4},{c:0,r:2},{c:1,r:0}]
  },
  { // Nivell 162: 12 moviments
    positions: [{c:2,r:3},{c:0,r:2},{c:1,r:3},{c:1,r:0},{c:0,r:0},{c:2,r:2},{c:2,r:1},{c:3,r:0},{c:1,r:2},{c:2,r:0}]
  },
  { // Nivell 163: 12 moviments
    positions: [{c:0,r:3},{c:2,r:3},{c:3,r:2},{c:2,r:0},{c:1,r:0},{c:0,r:2},{c:3,r:1},{c:0,r:1},{c:3,r:0},{c:2,r:2}]
  },
  { // Nivell 164: 12 moviments
    positions: [{c:0,r:2},{c:0,r:0},{c:3,r:3},{c:2,r:2},{c:3,r:1},{c:1,r:0},{c:1,r:4},{c:3,r:0},{c:2,r:1},{c:0,r:4}]
  },
  { // Nivell 165: 12 moviments
    positions: [{c:2,r:2},{c:1,r:1},{c:0,r:1},{c:3,r:0},{c:2,r:0},{c:0,r:0},{c:3,r:4},{c:0,r:3},{c:1,r:4},{c:1,r:3}]
  },
  { // Nivell 166: 12 moviments
    positions: [{c:2,r:3},{c:0,r:2},{c:1,r:2},{c:0,r:0},{c:3,r:1},{c:1,r:0},{c:0,r:4},{c:1,r:1},{c:3,r:0},{c:1,r:4}]
  },
  { // Nivell 167: 12 moviments
    positions: [{c:2,r:3},{c:1,r:0},{c:0,r:0},{c:1,r:3},{c:2,r:0},{c:2,r:2},{c:0,r:2},{c:0,r:4},{c:3,r:0},{c:1,r:2}]
  },
  { // Nivell 168: 12 moviments
    positions: [{c:2,r:2},{c:0,r:3},{c:3,r:0},{c:1,r:2},{c:0,r:1},{c:1,r:0},{c:1,r:4},{c:1,r:1},{c:3,r:4},{c:2,r:1}]
  },
  { // Nivell 169: 12 moviments
    positions: [{c:2,r:3},{c:1,r:2},{c:3,r:0},{c:2,r:0},{c:0,r:2},{c:0,r:1},{c:2,r:2},{c:1,r:0},{c:1,r:4},{c:0,r:0}]
  },
  { // Nivell 170: 12 moviments
    positions: [{c:0,r:3},{c:2,r:3},{c:0,r:0},{c:2,r:0},{c:3,r:0},{c:0,r:2},{c:3,r:2},{c:1,r:0},{c:2,r:2},{c:3,r:4}]
  },
  { // Nivell 171: 12 moviments
    positions: [{c:0,r:3},{c:3,r:3},{c:3,r:0},{c:1,r:0},{c:2,r:0},{c:0,r:2},{c:0,r:1},{c:2,r:3},{c:3,r:2},{c:2,r:2}]
  },
  { // Nivell 172: 12 moviments
    positions: [{c:2,r:2},{c:3,r:0},{c:0,r:1},{c:1,r:2},{c:0,r:3},{c:0,r:0},{c:2,r:1},{c:1,r:1},{c:1,r:4},{c:3,r:4}]
  },
  { // Nivell 173: 12 moviments
    positions: [{c:0,r:2},{c:1,r:0},{c:0,r:0},{c:2,r:2},{c:3,r:2},{c:2,r:1},{c:1,r:4},{c:3,r:4},{c:2,r:0},{c:3,r:0}]
  },
  { // Nivell 174: 12 moviments
    positions: [{c:2,r:2},{c:3,r:0},{c:0,r:0},{c:0,r:3},{c:1,r:3},{c:1,r:0},{c:0,r:2},{c:2,r:4},{c:3,r:4},{c:1,r:1}]
  },
  { // Nivell 175: 12 moviments
    positions: [{c:2,r:3},{c:1,r:3},{c:0,r:2},{c:2,r:0},{c:1,r:1},{c:2,r:2},{c:0,r:4},{c:1,r:0},{c:0,r:1},{c:3,r:1}]
  },
  { // Nivell 176: 12 moviments
    positions: [{c:2,r:2},{c:3,r:0},{c:1,r:1},{c:2,r:0},{c:0,r:1},{c:0,r:0},{c:0,r:3},{c:0,r:4},{c:2,r:4},{c:1,r:4}]
  },
  { // Nivell 177: 12 moviments
    positions: [{c:2,r:2},{c:3,r:0},{c:0,r:1},{c:1,r:2},{c:0,r:3},{c:0,r:0},{c:3,r:4},{c:2,r:0},{c:2,r:4},{c:1,r:1}]
  },
  { // Nivell 178: 12 moviments
    positions: [{c:0,r:3},{c:2,r:3},{c:0,r:1},{c:1,r:0},{c:3,r:3},{c:2,r:2},{c:1,r:2},{c:0,r:0},{c:3,r:0},{c:2,r:0}]
  },
  { // Nivell 179: 12 moviments
    positions: [{c:2,r:3},{c:0,r:3},{c:1,r:2},{c:3,r:0},{c:0,r:0},{c:1,r:1},{c:1,r:0},{c:2,r:0},{c:1,r:4},{c:2,r:2}]
  },
  { // Nivell 180: 12 moviments
    positions: [{c:2,r:3},{c:1,r:0},{c:0,r:2},{c:0,r:0},{c:3,r:0},{c:2,r:2},{c:0,r:4},{c:1,r:2},{c:1,r:4},{c:2,r:1}]
  },
  { // Nivell 181: 12 moviments
    positions: [{c:0,r:3},{c:0,r:0},{c:2,r:1},{c:3,r:0},{c:2,r:3},{c:0,r:2},{c:3,r:3},{c:3,r:2},{c:1,r:1},{c:3,r:4}]
  },
  { // Nivell 182: 12 moviments
    positions: [{c:0,r:3},{c:2,r:1},{c:3,r:0},{c:3,r:3},{c:2,r:3},{c:0,r:2},{c:2,r:0},{c:3,r:2},{c:0,r:0},{c:1,r:1}]
  },
  { // Nivell 183: 12 moviments
    positions: [{c:0,r:2},{c:1,r:0},{c:0,r:0},{c:3,r:1},{c:2,r:2},{c:2,r:0},{c:0,r:4},{c:2,r:4},{c:3,r:4},{c:1,r:4}]
  },
  { // Nivell 184: 12 moviments
    positions: [{c:0,r:3},{c:2,r:2},{c:3,r:0},{c:0,r:0},{c:3,r:3},{c:1,r:1},{c:1,r:2},{c:2,r:4},{c:2,r:0},{c:1,r:0}]
  },
  { // Nivell 185: 12 moviments
    positions: [{c:0,r:2},{c:2,r:3},{c:3,r:2},{c:2,r:1},{c:0,r:0},{c:1,r:0},{c:1,r:4},{c:1,r:1},{c:3,r:0},{c:0,r:4}]
  },
  { // Nivell 186: 12 moviments
    positions: [{c:0,r:3},{c:1,r:0},{c:3,r:0},{c:3,r:2},{c:2,r:0},{c:0,r:2},{c:3,r:4},{c:2,r:3},{c:2,r:2},{c:0,r:1}]
  },
  { // Nivell 187: 13 moviments
    positions: [{c:2,r:3},{c:0,r:2},{c:0,r:0},{c:1,r:1},{c:2,r:0},{c:2,r:2},{c:0,r:4},{c:1,r:0},{c:1,r:3},{c:1,r:4}]
  },
  { // Nivell 188: 13 moviments
    positions: [{c:2,r:3},{c:0,r:3},{c:2,r:0},{c:1,r:1},{c:0,r:0},{c:2,r:2},{c:1,r:0},{c:0,r:2},{c:1,r:4},{c:1,r:3}]
  },
  { // Nivell 189: 13 moviments
    positions: [{c:0,r:3},{c:1,r:0},{c:3,r:0},{c:2,r:3},{c:2,r:1},{c:0,r:2},{c:2,r:0},{c:3,r:4},{c:3,r:3},{c:3,r:2}]
  },
  { // Nivell 190: 13 moviments
    positions: [{c:0,r:3},{c:3,r:2},{c:2,r:1},{c:1,r:0},{c:3,r:0},{c:0,r:2},{c:2,r:0},{c:2,r:3},{c:3,r:4},{c:2,r:4}]
  },
  { // Nivell 191: 13 moviments
    positions: [{c:0,r:3},{c:3,r:2},{c:2,r:0},{c:0,r:0},{c:3,r:0},{c:0,r:2},{c:2,r:3},{c:1,r:1},{c:3,r:4},{c:2,r:2}]
  },
  { // Nivell 192: 13 moviments
    positions: [{c:2,r:3},{c:0,r:2},{c:1,r:3},{c:2,r:0},{c:1,r:1},{c:2,r:2},{c:3,r:1},{c:1,r:0},{c:0,r:0},{c:0,r:4}]
  },
  { // Nivell 193: 13 moviments
    positions: [{c:0,r:3},{c:2,r:2},{c:3,r:3},{c:0,r:0},{c:3,r:1},{c:1,r:1},{c:0,r:2},{c:3,r:0},{c:1,r:0},{c:2,r:4}]
  },
  { // Nivell 194: 13 moviments
    positions: [{c:2,r:3},{c:1,r:1},{c:1,r:3},{c:0,r:0},{c:2,r:0},{c:2,r:2},{c:0,r:3},{c:1,r:0},{c:0,r:4},{c:0,r:2}]
  },
  { // Nivell 195: 13 moviments
    positions: [{c:2,r:2},{c:0,r:1},{c:3,r:0},{c:0,r:3},{c:1,r:3},{c:0,r:0},{c:2,r:0},{c:1,r:2},{c:2,r:4},{c:3,r:4}]
  },
  { // Nivell 196: 13 moviments
    positions: [{c:2,r:3},{c:1,r:2},{c:1,r:0},{c:2,r:0},{c:0,r:0},{c:2,r:2},{c:3,r:1},{c:0,r:2},{c:1,r:4},{c:0,r:4}]
  },
  { // Nivell 197: 13 moviments
    positions: [{c:0,r:3},{c:1,r:0},{c:2,r:1},{c:3,r:3},{c:2,r:3},{c:0,r:2},{c:0,r:1},{c:3,r:0},{c:3,r:2},{c:2,r:0}]
  },
  { // Nivell 198: 13 moviments
    positions: [{c:0,r:3},{c:3,r:3},{c:0,r:0},{c:2,r:2},{c:3,r:1},{c:1,r:1},{c:2,r:0},{c:2,r:4},{c:1,r:0},{c:1,r:2}]
  },
  { // Nivell 199: 13 moviments
    positions: [{c:0,r:3},{c:2,r:3},{c:3,r:3},{c:1,r:1},{c:0,r:0},{c:2,r:1},{c:1,r:0},{c:3,r:0},{c:2,r:2},{c:0,r:2}]
  },
  { // Nivell 200: 13 moviments
    positions: [{c:0,r:2},{c:0,r:0},{c:3,r:1},{c:3,r:3},{c:2,r:1},{c:2,r:0},{c:2,r:4},{c:1,r:4},{c:1,r:1},{c:0,r:4}]
  },
  { // Nivell 201: 13 moviments
    positions: [{c:0,r:3},{c:2,r:2},{c:3,r:3},{c:2,r:0},{c:3,r:0},{c:0,r:2},{c:2,r:4},{c:1,r:1},{c:0,r:0},{c:1,r:0}]
  },
  { // Nivell 202: 13 moviments
    positions: [{c:0,r:3},{c:1,r:0},{c:2,r:1},{c:3,r:2},{c:2,r:3},{c:0,r:2},{c:3,r:0},{c:3,r:4},{c:0,r:1},{c:2,r:0}]
  },
  { // Nivell 203: 13 moviments
    positions: [{c:2,r:2},{c:1,r:3},{c:0,r:1},{c:3,r:0},{c:0,r:3},{c:0,r:0},{c:2,r:1},{c:2,r:0},{c:1,r:2},{c:2,r:4}]
  },
  { // Nivell 204: 13 moviments
    positions: [{c:2,r:2},{c:3,r:0},{c:0,r:2},{c:2,r:0},{c:1,r:2},{c:0,r:1},{c:0,r:4},{c:1,r:4},{c:3,r:4},{c:2,r:4}]
  },
  { // Nivell 205: 13 moviments
    positions: [{c:0,r:3},{c:3,r:0},{c:2,r:1},{c:1,r:0},{c:3,r:3},{c:0,r:2},{c:2,r:4},{c:3,r:2},{c:2,r:0},{c:2,r:3}]
  },
  { // Nivell 206: 13 moviments
    positions: [{c:0,r:3},{c:1,r:1},{c:3,r:0},{c:2,r:2},{c:3,r:2},{c:0,r:0},{c:2,r:0},{c:0,r:2},{c:3,r:4},{c:2,r:4}]
  },
  { // Nivell 207: 13 moviments
    positions: [{c:0,r:2},{c:1,r:0},{c:2,r:2},{c:0,r:0},{c:3,r:2},{c:2,r:1},{c:2,r:4},{c:0,r:4},{c:1,r:4},{c:3,r:4}]
  },
  { // Nivell 208: 13 moviments
    positions: [{c:0,r:3},{c:3,r:0},{c:3,r:2},{c:2,r:2},{c:1,r:1},{c:0,r:0},{c:3,r:4},{c:2,r:4},{c:2,r:0},{c:0,r:1}]
  },
  { // Nivell 209: 13 moviments
    positions: [{c:2,r:2},{c:3,r:0},{c:1,r:3},{c:0,r:3},{c:0,r:1},{c:1,r:0},{c:3,r:4},{c:1,r:2},{c:2,r:1},{c:2,r:4}]
  },
  { // Nivell 210: 13 moviments
    positions: [{c:2,r:2},{c:1,r:3},{c:0,r:1},{c:1,r:1},{c:3,r:0},{c:1,r:0},{c:2,r:4},{c:2,r:1},{c:3,r:4},{c:0,r:3}]
  },
  { // Nivell 211: 13 moviments
    positions: [{c:0,r:3},{c:2,r:2},{c:0,r:0},{c:3,r:3},{c:1,r:0},{c:2,r:1},{c:2,r:4},{c:2,r:0},{c:3,r:0},{c:1,r:2}]
  },
  { // Nivell 212: 13 moviments
    positions: [{c:2,r:2},{c:1,r:2},{c:0,r:1},{c:0,r:3},{c:3,r:0},{c:0,r:0},{c:2,r:4},{c:3,r:4},{c:2,r:1},{c:1,r:1}]
  },
  { // Nivell 213: 13 moviments
    positions: [{c:2,r:3},{c:0,r:0},{c:3,r:0},{c:1,r:0},{c:1,r:3},{c:2,r:2},{c:1,r:2},{c:0,r:4},{c:0,r:2},{c:2,r:1}]
  },
  { // Nivell 214: 13 moviments
    positions: [{c:2,r:3},{c:1,r:3},{c:0,r:3},{c:2,r:0},{c:1,r:1},{c:2,r:2},{c:0,r:2},{c:1,r:0},{c:3,r:1},{c:0,r:0}]
  },
  { // Nivell 215: 13 moviments
    positions: [{c:0,r:3},{c:1,r:0},{c:2,r:2},{c:3,r:0},{c:2,r:0},{c:0,r:2},{c:3,r:2},{c:2,r:4},{c:0,r:0},{c:3,r:4}]
  },
  { // Nivell 216: 13 moviments
    positions: [{c:0,r:3},{c:3,r:2},{c:1,r:0},{c:2,r:3},{c:2,r:1},{c:0,r:2},{c:0,r:0},{c:3,r:0},{c:2,r:0},{c:3,r:4}]
  },
  { // Nivell 217: 13 moviments
    positions: [{c:2,r:3},{c:1,r:3},{c:2,r:0},{c:0,r:0},{c:1,r:0},{c:2,r:2},{c:0,r:2},{c:0,r:3},{c:1,r:2},{c:3,r:1}]
  },
  { // Nivell 218: 13 moviments
    positions: [{c:0,r:3},{c:3,r:2},{c:2,r:2},{c:1,r:1},{c:0,r:0},{c:2,r:1},{c:3,r:0},{c:1,r:0},{c:3,r:4},{c:0,r:2}]
  },
  { // Nivell 219: 13 moviments
    positions: [{c:2,r:3},{c:0,r:3},{c:0,r:0},{c:1,r:2},{c:1,r:0},{c:2,r:2},{c:2,r:0},{c:3,r:1},{c:2,r:1},{c:1,r:4}]
  },
  { // Nivell 220: 14 moviments
    positions: [{c:1,r:1},{c:3,r:2},{c:0,r:0},{c:0,r:2},{c:2,r:3},{c:2,r:0},{c:1,r:3},{c:1,r:0},{c:1,r:4},{c:0,r:4}]
  },
  { // Nivell 221: 14 moviments
    positions: [{c:1,r:1},{c:1,r:3},{c:3,r:2},{c:0,r:2},{c:3,r:0},{c:0,r:0},{c:2,r:4},{c:3,r:4},{c:2,r:3},{c:2,r:0}]
  },
  { // Nivell 222: 14 moviments
    positions: [{c:2,r:2},{c:3,r:0},{c:0,r:0},{c:1,r:3},{c:0,r:2},{c:1,r:1},{c:3,r:4},{c:1,r:2},{c:0,r:4},{c:2,r:4}]
  },
  { // Nivell 223: 14 moviments
    positions: [{c:1,r:1},{c:0,r:3},{c:2,r:3},{c:3,r:2},{c:0,r:0},{c:2,r:0},{c:1,r:3},{c:1,r:4},{c:1,r:0},{c:0,r:2}]
  },
  { // Nivell 224: 14 moviments
    positions: [{c:2,r:3},{c:0,r:1},{c:2,r:0},{c:0,r:3},{c:1,r:2},{c:2,r:2},{c:1,r:4},{c:1,r:1},{c:3,r:1},{c:1,r:0}]
  },
  { // Nivell 225: 14 moviments
    positions: [{c:2,r:2},{c:2,r:0},{c:0,r:2},{c:1,r:3},{c:1,r:1},{c:0,r:0},{c:3,r:1},{c:3,r:0},{c:2,r:4},{c:3,r:4}]
  },
  { // Nivell 226: 14 moviments
    positions: [{c:0,r:3},{c:2,r:0},{c:3,r:1},{c:2,r:2},{c:3,r:3},{c:0,r:2},{c:1,r:0},{c:0,r:0},{c:2,r:4},{c:0,r:1}]
  },
  { // Nivell 227: 14 moviments
    positions: [{c:2,r:3},{c:3,r:0},{c:1,r:2},{c:0,r:2},{c:0,r:0},{c:1,r:1},{c:2,r:2},{c:2,r:0},{c:1,r:4},{c:0,r:4}]
  },
  { // Nivell 228: 14 moviments
    positions: [{c:0,r:2},{c:0,r:0},{c:3,r:3},{c:3,r:1},{c:2,r:3},{c:1,r:1},{c:2,r:2},{c:1,r:0},{c:3,r:0},{c:2,r:0}]
  },
  { // Nivell 229: 14 moviments
    positions: [{c:2,r:2},{c:2,r:0},{c:3,r:0},{c:1,r:2},{c:0,r:3},{c:0,r:1},{c:3,r:4},{c:2,r:4},{c:0,r:0},{c:1,r:0}]
  },
  { // Nivell 230: 14 moviments
    positions: [{c:2,r:2},{c:1,r:1},{c:0,r:0},{c:2,r:0},{c:3,r:0},{c:0,r:4},{c:0,r:2},{c:2,r:4},{c:3,r:4},{c:1,r:0}]
  },
  { // Nivell 231: 14 moviments
    positions: [{c:2,r:2},{c:0,r:3},{c:1,r:3},{c:3,r:0},{c:2,r:0},{c:0,r:1},{c:1,r:2},{c:0,r:0},{c:1,r:0},{c:3,r:4}]
  },
  { // Nivell 232: 14 moviments
    positions: [{c:2,r:3},{c:1,r:2},{c:0,r:1},{c:2,r:1},{c:0,r:3},{c:2,r:0},{c:1,r:1},{c:3,r:1},{c:1,r:4},{c:0,r:0}]
  },
  { // Nivell 233: 14 moviments
    positions: [{c:0,r:2},{c:2,r:2},{c:1,r:0},{c:3,r:3},{c:0,r:0},{c:2,r:1},{c:0,r:4},{c:2,r:0},{c:3,r:0},{c:2,r:4}]
  },
  { // Nivell 234: 14 moviments
    positions: [{c:0,r:3},{c:2,r:2},{c:2,r:0},{c:3,r:0},{c:1,r:0},{c:0,r:2},{c:0,r:0},{c:2,r:4},{c:3,r:4},{c:3,r:3}]
  },
  { // Nivell 235: 14 moviments
    positions: [{c:0,r:3},{c:3,r:0},{c:0,r:0},{c:2,r:2},{c:2,r:0},{c:0,r:2},{c:3,r:4},{c:1,r:0},{c:3,r:3},{c:2,r:4}]
  },
  { // Nivell 236: 14 moviments
    positions: [{c:2,r:2},{c:3,r:0},{c:1,r:3},{c:0,r:1},{c:1,r:1},{c:0,r:0},{c:3,r:4},{c:2,r:1},{c:0,r:4},{c:2,r:4}]
  },
  { // Nivell 237: 14 moviments
    positions: [{c:0,r:2},{c:3,r:2},{c:2,r:3},{c:2,r:1},{c:1,r:0},{c:2,r:0},{c:0,r:4},{c:0,r:0},{c:1,r:4},{c:0,r:1}]
  },
  { // Nivell 238: 14 moviments
    positions: [{c:0,r:3},{c:2,r:2},{c:3,r:3},{c:3,r:1},{c:0,r:1},{c:1,r:1},{c:2,r:4},{c:1,r:2},{c:2,r:0},{c:1,r:0}]
  },
  { // Nivell 239: 14 moviments
    positions: [{c:0,r:2},{c:2,r:3},{c:3,r:3},{c:3,r:0},{c:0,r:0},{c:1,r:1},{c:1,r:4},{c:3,r:2},{c:0,r:4},{c:2,r:2}]
  },
  { // Nivell 240: 14 moviments
    positions: [{c:2,r:2},{c:3,r:0},{c:1,r:3},{c:0,r:0},{c:0,r:3},{c:1,r:1},{c:3,r:4},{c:1,r:2},{c:2,r:4},{c:0,r:2}]
  },
  { // Nivell 241: 14 moviments
    positions: [{c:1,r:1},{c:0,r:2},{c:3,r:0},{c:1,r:3},{c:3,r:3},{c:0,r:0},{c:3,r:2},{c:2,r:4},{c:2,r:3},{c:2,r:0}]
  },
  { // Nivell 242: 14 moviments
    positions: [{c:2,r:2},{c:1,r:3},{c:3,r:0},{c:0,r:1},{c:0,r:3},{c:1,r:1},{c:1,r:2},{c:2,r:0},{c:0,r:0},{c:1,r:0}]
  },
  { // Nivell 243: 14 moviments
    positions: [{c:2,r:3},{c:2,r:1},{c:3,r:0},{c:1,r:3},{c:0,r:3},{c:0,r:1},{c:1,r:0},{c:3,r:2},{c:2,r:0},{c:1,r:2}]
  },
  { // Nivell 244: 14 moviments
    positions: [{c:2,r:2},{c:0,r:3},{c:3,r:0},{c:0,r:1},{c:1,r:3},{c:0,r:0},{c:2,r:4},{c:2,r:0},{c:1,r:1},{c:1,r:2}]
  },
  { // Nivell 245: 14 moviments
    positions: [{c:0,r:3},{c:1,r:1},{c:0,r:0},{c:2,r:2},{c:3,r:2},{c:2,r:1},{c:2,r:0},{c:1,r:0},{c:3,r:4},{c:0,r:2}]
  },
  { // Nivell 246: 14 moviments
    positions: [{c:2,r:3},{c:1,r:0},{c:2,r:0},{c:1,r:2},{c:0,r:3},{c:2,r:2},{c:0,r:2},{c:1,r:4},{c:3,r:1},{c:0,r:0}]
  },
  { // Nivell 247: 14 moviments
    positions: [{c:0,r:3},{c:0,r:0},{c:3,r:1},{c:2,r:2},{c:3,r:3},{c:1,r:1},{c:1,r:2},{c:3,r:0},{c:1,r:0},{c:2,r:4}]
  },
  { // Nivell 248: 14 moviments
    positions: [{c:0,r:2},{c:0,r:0},{c:2,r:3},{c:3,r:0},{c:3,r:2},{c:1,r:1},{c:1,r:4},{c:2,r:2},{c:3,r:4},{c:0,r:4}]
  },
  { // Nivell 249: 14 moviments
    positions: [{c:0,r:3},{c:2,r:2},{c:3,r:3},{c:1,r:1},{c:3,r:1},{c:0,r:0},{c:2,r:4},{c:2,r:1},{c:3,r:0},{c:0,r:1}]
  },
  { // Nivell 250: 14 moviments
    positions: [{c:0,r:3},{c:2,r:3},{c:1,r:0},{c:2,r:1},{c:3,r:3},{c:0,r:2},{c:2,r:0},{c:0,r:0},{c:3,r:0},{c:3,r:1}]
  },
  { // Nivell 251: 14 moviments
    positions: [{c:2,r:3},{c:1,r:2},{c:0,r:3},{c:1,r:0},{c:0,r:1},{c:2,r:2},{c:2,r:0},{c:3,r:0},{c:3,r:1},{c:1,r:4}]
  },
  { // Nivell 252: 15 moviments
    positions: [{c:0,r:2},{c:2,r:2},{c:3,r:0},{c:1,r:0},{c:2,r:0},{c:2,r:4},{c:3,r:3},{c:3,r:2},{c:1,r:4},{c:0,r:4}]
  },
  { // Nivell 253: 15 moviments
    positions: [{c:2,r:2},{c:1,r:1},{c:0,r:3},{c:1,r:3},{c:0,r:0},{c:2,r:1},{c:1,r:0},{c:0,r:2},{c:2,r:0},{c:3,r:0}]
  },
  { // Nivell 254: 15 moviments
    positions: [{c:2,r:2},{c:1,r:2},{c:0,r:0},{c:1,r:0},{c:2,r:0},{c:0,r:4},{c:2,r:4},{c:0,r:2},{c:0,r:3},{c:3,r:4}]
  },
  { // Nivell 255: 15 moviments
    positions: [{c:0,r:3},{c:3,r:3},{c:1,r:1},{c:3,r:1},{c:2,r:2},{c:1,r:0},{c:3,r:0},{c:0,r:2},{c:2,r:1},{c:2,r:4}]
  },
  { // Nivell 256: 15 moviments
    positions: [{c:2,r:3},{c:1,r:0},{c:0,r:3},{c:2,r:0},{c:1,r:2},{c:2,r:2},{c:0,r:2},{c:1,r:4},{c:0,r:1},{c:3,r:1}]
  },
  { // Nivell 257: 15 moviments
    positions: [{c:2,r:2},{c:1,r:0},{c:3,r:0},{c:0,r:2},{c:2,r:0},{c:0,r:4},{c:3,r:4},{c:0,r:0},{c:2,r:4},{c:1,r:2}]
  },
  { // Nivell 258: 15 moviments
    positions: [{c:2,r:3},{c:0,r:1},{c:2,r:0},{c:1,r:2},{c:0,r:3},{c:2,r:2},{c:1,r:1},{c:3,r:0},{c:1,r:4},{c:0,r:0}]
  },
  { // Nivell 259: 15 moviments
    positions: [{c:2,r:3},{c:2,r:0},{c:1,r:2},{c:1,r:0},{c:0,r:1},{c:2,r:2},{c:3,r:0},{c:0,r:3},{c:0,r:4},{c:1,r:4}]
  },
  { // Nivell 260: 15 moviments
    positions: [{c:0,r:3},{c:1,r:0},{c:2,r:2},{c:3,r:3},{c:2,r:0},{c:0,r:2},{c:2,r:4},{c:0,r:1},{c:3,r:2},{c:3,r:1}]
  },
  { // Nivell 261: 15 moviments
    positions: [{c:2,r:2},{c:0,r:2},{c:0,r:0},{c:1,r:3},{c:1,r:1},{c:2,r:1},{c:1,r:0},{c:3,r:0},{c:0,r:4},{c:2,r:0}]
  },
  { // Nivell 262: 15 moviments
    positions: [{c:0,r:2},{c:2,r:1},{c:2,r:3},{c:3,r:0},{c:3,r:3},{c:0,r:1},{c:3,r:2},{c:2,r:0},{c:0,r:0},{c:1,r:0}]
  },
  { // Nivell 263: 15 moviments
    positions: [{c:0,r:2},{c:3,r:0},{c:2,r:3},{c:2,r:1},{c:3,r:2},{c:0,r:1},{c:0,r:0},{c:2,r:0},{c:1,r:0},{c:3,r:4}]
  },
  { // Nivell 264: 15 moviments
    positions: [{c:0,r:2},{c:0,r:0},{c:2,r:1},{c:2,r:3},{c:3,r:3},{c:2,r:0},{c:1,r:0},{c:0,r:4},{c:1,r:4},{c:3,r:2}]
  },
  { // Nivell 265: 15 moviments
    positions: [{c:2,r:3},{c:1,r:2},{c:0,r:3},{c:2,r:1},{c:3,r:0},{c:0,r:1},{c:0,r:0},{c:1,r:4},{c:3,r:2},{c:2,r:0}]
  },
  { // Nivell 266: 15 moviments
    positions: [{c:0,r:3},{c:2,r:0},{c:1,r:0},{c:2,r:2},{c:3,r:1},{c:0,r:2},{c:3,r:3},{c:2,r:4},{c:0,r:1},{c:3,r:4}]
  },
  { // Nivell 267: 15 moviments
    positions: [{c:2,r:3},{c:2,r:0},{c:1,r:2},{c:1,r:0},{c:0,r:3},{c:2,r:2},{c:3,r:0},{c:0,r:2},{c:1,r:4},{c:0,r:1}]
  },
  { // Nivell 268: 15 moviments
    positions: [{c:0,r:2},{c:1,r:0},{c:3,r:2},{c:0,r:0},{c:2,r:3},{c:2,r:1},{c:1,r:4},{c:2,r:0},{c:3,r:0},{c:2,r:2}]
  },
  { // Nivell 269: 15 moviments
    positions: [{c:0,r:3},{c:1,r:0},{c:2,r:3},{c:3,r:1},{c:2,r:1},{c:0,r:2},{c:3,r:3},{c:2,r:0},{c:3,r:0},{c:0,r:0}]
  },
  { // Nivell 270: 16 moviments
    positions: [{c:0,r:2},{c:3,r:2},{c:1,r:0},{c:0,r:0},{c:2,r:3},{c:2,r:1},{c:3,r:4},{c:2,r:2},{c:1,r:4},{c:0,r:4}]
  },
  { // Nivell 271: 16 moviments
    positions: [{c:0,r:2},{c:3,r:1},{c:1,r:0},{c:2,r:3},{c:3,r:3},{c:2,r:0},{c:1,r:4},{c:2,r:1},{c:0,r:4},{c:2,r:2}]
  },
  { // Nivell 272: 16 moviments
    positions: [{c:2,r:2},{c:0,r:2},{c:1,r:3},{c:3,r:0},{c:2,r:0},{c:0,r:1},{c:3,r:4},{c:2,r:4},{c:1,r:2},{c:0,r:4}]
  },
  { // Nivell 273: 16 moviments
    positions: [{c:2,r:2},{c:0,r:1},{c:1,r:2},{c:0,r:3},{c:2,r:0},{c:0,r:0},{c:1,r:1},{c:1,r:4},{c:2,r:4},{c:3,r:4}]
  },
  { // Nivell 274: 16 moviments
    positions: [{c:0,r:2},{c:0,r:0},{c:2,r:1},{c:1,r:0},{c:3,r:1},{c:2,r:4},{c:2,r:3},{c:3,r:0},{c:0,r:4},{c:1,r:4}]
  },
  { // Nivell 275: 16 moviments
    positions: [{c:1,r:2},{c:3,r:0},{c:1,r:0},{c:0,r:0},{c:2,r:0},{c:1,r:4},{c:0,r:2},{c:3,r:2},{c:3,r:3},{c:0,r:4}]
  },
  { // Nivell 276: 16 moviments
    positions: [{c:0,r:3},{c:3,r:3},{c:2,r:2},{c:3,r:1},{c:1,r:0},{c:0,r:2},{c:0,r:0},{c:2,r:0},{c:3,r:0},{c:2,r:4}]
  },
  { // Nivell 277: 16 moviments
    positions: [{c:2,r:2},{c:0,r:0},{c:1,r:3},{c:3,r:0},{c:0,r:3},{c:1,r:1},{c:2,r:0},{c:1,r:2},{c:3,r:4},{c:2,r:4}]
  },
  { // Nivell 278: 16 moviments
    positions: [{c:2,r:2},{c:0,r:0},{c:3,r:0},{c:2,r:0},{c:1,r:2},{c:0,r:4},{c:2,r:4},{c:0,r:2},{c:3,r:4},{c:1,r:1}]
  },
  { // Nivell 279: 16 moviments
    positions: [{c:2,r:2},{c:0,r:3},{c:2,r:0},{c:0,r:1},{c:1,r:3},{c:0,r:0},{c:2,r:4},{c:1,r:1},{c:3,r:4},{c:1,r:2}]
  },
  { // Nivell 280: 16 moviments
    positions: [{c:2,r:2},{c:0,r:0},{c:0,r:2},{c:1,r:0},{c:2,r:0},{c:0,r:4},{c:2,r:4},{c:1,r:2},{c:3,r:4},{c:1,r:3}]
  },
  { // Nivell 281: 16 moviments
    positions: [{c:0,r:2},{c:3,r:0},{c:2,r:0},{c:3,r:2},{c:1,r:0},{c:2,r:4},{c:2,r:3},{c:1,r:4},{c:2,r:2},{c:0,r:4}]
  },
  { // Nivell 282: 16 moviments
    positions: [{c:0,r:2},{c:3,r:1},{c:2,r:2},{c:1,r:0},{c:3,r:3},{c:2,r:0},{c:2,r:4},{c:2,r:1},{c:0,r:4},{c:1,r:4}]
  },
  { // Nivell 283: 16 moviments
    positions: [{c:0,r:3},{c:2,r:1},{c:3,r:3},{c:3,r:1},{c:1,r:1},{c:0,r:0},{c:3,r:0},{c:2,r:0},{c:2,r:4},{c:0,r:1}]
  },
  { // Nivell 284: 16 moviments
    positions: [{c:0,r:2},{c:3,r:1},{c:0,r:0},{c:1,r:0},{c:2,r:1},{c:2,r:4},{c:2,r:0},{c:0,r:4},{c:3,r:3},{c:1,r:4}]
  },
  { // Nivell 285: 16 moviments
    positions: [{c:1,r:1},{c:3,r:3},{c:0,r:2},{c:1,r:3},{c:3,r:1},{c:1,r:0},{c:3,r:0},{c:2,r:3},{c:2,r:4},{c:0,r:1}]
  },
  { // Nivell 286: 16 moviments
    positions: [{c:0,r:2},{c:0,r:0},{c:3,r:3},{c:3,r:0},{c:2,r:3},{c:1,r:1},{c:2,r:2},{c:1,r:4},{c:2,r:0},{c:0,r:4}]
  },
  { // Nivell 287: 17 moviments
    positions: [{c:2,r:2},{c:0,r:2},{c:2,r:0},{c:1,r:0},{c:3,r:0},{c:0,r:4},{c:1,r:3},{c:0,r:1},{c:3,r:4},{c:2,r:4}]
  },
  { // Nivell 288: 17 moviments
    positions: [{c:0,r:2},{c:1,r:0},{c:3,r:3},{c:2,r:2},{c:0,r:0},{c:2,r:1},{c:3,r:2},{c:1,r:4},{c:2,r:4},{c:0,r:4}]
  },
  { // Nivell 289: 17 moviments
    positions: [{c:1,r:1},{c:0,r:1},{c:3,r:3},{c:0,r:3},{c:3,r:1},{c:1,r:0},{c:3,r:0},{c:2,r:3},{c:1,r:3},{c:1,r:4}]
  },
  { // Nivell 290: 17 moviments
    positions: [{c:1,r:1},{c:2,r:3},{c:3,r:2},{c:0,r:1},{c:0,r:3},{c:2,r:0},{c:0,r:0},{c:1,r:0},{c:1,r:4},{c:1,r:3}]
  },
  { // Nivell 291: 17 moviments
    positions: [{c:2,r:2},{c:2,r:0},{c:1,r:2},{c:3,r:0},{c:0,r:3},{c:0,r:1},{c:3,r:4},{c:1,r:4},{c:0,r:2},{c:2,r:4}]
  },
  { // Nivell 292: 17 moviments
    positions: [{c:2,r:2},{c:3,r:0},{c:1,r:2},{c:2,r:0},{c:0,r:0},{c:0,r:4},{c:1,r:1},{c:3,r:4},{c:0,r:3},{c:2,r:4}]
  },
  { // Nivell 293: 17 moviments
    positions: [{c:0,r:2},{c:2,r:2},{c:0,r:0},{c:3,r:1},{c:1,r:0},{c:2,r:4},{c:1,r:4},{c:3,r:0},{c:0,r:4},{c:3,r:3}]
  },
  { // Nivell 294: 17 moviments
    positions: [{c:0,r:2},{c:1,r:0},{c:3,r:0},{c:2,r:2},{c:0,r:0},{c:2,r:4},{c:0,r:4},{c:2,r:1},{c:1,r:4},{c:3,r:3}]
  },
  { // Nivell 295: 17 moviments
    positions: [{c:1,r:1},{c:1,r:3},{c:3,r:1},{c:0,r:2},{c:3,r:3},{c:0,r:0},{c:2,r:0},{c:2,r:4},{c:3,r:0},{c:2,r:3}]
  },
  { // Nivell 296: 17 moviments
    positions: [{c:1,r:1},{c:3,r:3},{c:1,r:3},{c:0,r:3},{c:3,r:1},{c:0,r:0},{c:2,r:4},{c:3,r:0},{c:0,r:2},{c:2,r:3}]
  },
  { // Nivell 297: 17 moviments
    positions: [{c:0,r:2},{c:2,r:2},{c:0,r:0},{c:3,r:1},{c:3,r:3},{c:1,r:1},{c:2,r:0},{c:1,r:0},{c:0,r:4},{c:3,r:0}]
  },
  { // Nivell 298: 17 moviments
    positions: [{c:2,r:2},{c:0,r:2},{c:2,r:0},{c:3,r:0},{c:1,r:1},{c:0,r:4},{c:2,r:4},{c:3,r:4},{c:1,r:3},{c:0,r:0}]
  },
  { // Nivell 299: 17 moviments
    positions: [{c:1,r:1},{c:0,r:1},{c:3,r:3},{c:1,r:3},{c:3,r:1},{c:1,r:0},{c:2,r:4},{c:0,r:0},{c:0,r:4},{c:2,r:3}]
  },
  { // Nivell 300: 17 moviments
    positions: [{c:0,r:2},{c:1,r:0},{c:2,r:1},{c:0,r:0},{c:3,r:1},{c:2,r:4},{c:1,r:4},{c:2,r:0},{c:2,r:3},{c:0,r:4}]
  },
  { // Nivell 301: 17 moviments
    positions: [{c:1,r:2},{c:1,r:0},{c:2,r:0},{c:0,r:1},{c:3,r:0},{c:0,r:4},{c:0,r:0},{c:0,r:3},{c:3,r:4},{c:2,r:4}]
  },
  { // Nivell 302: 18 moviments
    positions: [{c:2,r:3},{c:0,r:3},{c:1,r:1},{c:2,r:0},{c:0,r:1},{c:2,r:2},{c:0,r:0},{c:1,r:0},{c:1,r:3},{c:3,r:0}]
  },
  { // Nivell 303: 18 moviments
    positions: [{c:1,r:1},{c:3,r:1},{c:3,r:3},{c:0,r:0},{c:0,r:3},{c:1,r:0},{c:3,r:0},{c:2,r:4},{c:2,r:3},{c:1,r:3}]
  },
  { // Nivell 304: 18 moviments
    positions: [{c:2,r:3},{c:0,r:1},{c:0,r:3},{c:1,r:1},{c:3,r:1},{c:1,r:0},{c:1,r:4},{c:0,r:0},{c:3,r:0},{c:2,r:2}]
  },
  { // Nivell 305: 18 moviments
    positions: [{c:0,r:3},{c:2,r:2},{c:3,r:3},{c:0,r:1},{c:3,r:1},{c:1,r:0},{c:0,r:0},{c:2,r:4},{c:3,r:0},{c:1,r:1}]
  },
  { // Nivell 306: 18 moviments
    positions: [{c:1,r:2},{c:2,r:0},{c:1,r:0},{c:0,r:2},{c:0,r:0},{c:2,r:4},{c:3,r:1},{c:3,r:3},{c:0,r:4},{c:1,r:4}]
  },
  { // Nivell 307: 18 moviments
    positions: [{c:1,r:2},{c:2,r:0},{c:3,r:0},{c:1,r:0},{c:0,r:1},{c:0,r:4},{c:0,r:3},{c:2,r:4},{c:0,r:0},{c:3,r:3}]
  },
  { // Nivell 308: 18 moviments
    positions: [{c:0,r:1},{c:3,r:2},{c:1,r:3},{c:0,r:3},{c:2,r:1},{c:1,r:0},{c:2,r:3},{c:2,r:4},{c:3,r:0},{c:0,r:0}]
  },
  { // Nivell 309: 18 moviments
    positions: [{c:0,r:3},{c:3,r:1},{c:1,r:0},{c:2,r:1},{c:3,r:3},{c:0,r:2},{c:0,r:1},{c:3,r:0},{c:2,r:3},{c:2,r:0}]
  },
  { // Nivell 310: 19 moviments
    positions: [{c:0,r:2},{c:3,r:1},{c:1,r:0},{c:2,r:2},{c:2,r:0},{c:2,r:4},{c:3,r:3},{c:1,r:4},{c:0,r:4},{c:3,r:0}]
  },
  { // Nivell 311: 19 moviments
    positions: [{c:2,r:2},{c:2,r:0},{c:1,r:2},{c:0,r:1},{c:1,r:0},{c:0,r:4},{c:0,r:0},{c:2,r:4},{c:0,r:3},{c:3,r:4}]
  },
  { // Nivell 312: 19 moviments
    positions: [{c:0,r:1},{c:3,r:0},{c:2,r:3},{c:3,r:3},{c:1,r:3},{c:0,r:0},{c:3,r:2},{c:2,r:2},{c:2,r:1},{c:2,r:0}]
  },
  { // Nivell 313: 19 moviments
    positions: [{c:2,r:1},{c:0,r:0},{c:2,r:3},{c:0,r:2},{c:1,r:3},{c:2,r:0},{c:1,r:1},{c:0,r:4},{c:1,r:2},{c:1,r:0}]
  },
  { // Nivell 314: 19 moviments
    positions: [{c:0,r:3},{c:3,r:3},{c:0,r:1},{c:3,r:1},{c:2,r:1},{c:1,r:0},{c:0,r:0},{c:2,r:3},{c:3,r:0},{c:1,r:2}]
  },
  { // Nivell 315: 19 moviments
    positions: [{c:1,r:2},{c:2,r:0},{c:0,r:2},{c:3,r:0},{c:0,r:0},{c:0,r:4},{c:1,r:1},{c:3,r:4},{c:3,r:3},{c:1,r:0}]
  },
  { // Nivell 316: 20 moviments
    positions: [{c:2,r:2},{c:1,r:0},{c:2,r:0},{c:0,r:2},{c:1,r:2},{c:0,r:4},{c:0,r:1},{c:3,r:4},{c:2,r:4},{c:0,r:0}]
  },
  { // Nivell 317: 20 moviments
    positions: [{c:0,r:2},{c:1,r:0},{c:2,r:0},{c:2,r:2},{c:3,r:2},{c:2,r:4},{c:0,r:4},{c:3,r:0},{c:3,r:1},{c:1,r:4}]
  },
  { // Nivell 318: 20 moviments
    positions: [{c:2,r:2},{c:1,r:3},{c:2,r:0},{c:0,r:3},{c:1,r:0},{c:0,r:2},{c:0,r:0},{c:0,r:1},{c:3,r:4},{c:2,r:4}]
  },
  { // Nivell 319: 20 moviments
    positions: [{c:2,r:1},{c:1,r:3},{c:2,r:3},{c:0,r:1},{c:0,r:3},{c:1,r:0},{c:3,r:0},{c:1,r:1},{c:0,r:0},{c:1,r:2}]
  },
  { // Nivell 320: 20 moviments
    positions: [{c:0,r:2},{c:3,r:2},{c:1,r:0},{c:2,r:0},{c:3,r:0},{c:0,r:4},{c:2,r:4},{c:0,r:1},{c:3,r:4},{c:0,r:0}]
  },
  { // Nivell 321: 20 moviments
    positions: [{c:1,r:1},{c:3,r:3},{c:0,r:0},{c:3,r:1},{c:0,r:2},{c:1,r:0},{c:3,r:0},{c:0,r:4},{c:1,r:4},{c:2,r:3}]
  },
  { // Nivell 322: 20 moviments
    positions: [{c:0,r:2},{c:2,r:3},{c:2,r:0},{c:1,r:0},{c:3,r:3},{c:2,r:2},{c:3,r:1},{c:0,r:4},{c:3,r:0},{c:1,r:4}]
  },
  { // Nivell 323: 20 moviments
    positions: [{c:0,r:1},{c:2,r:3},{c:3,r:3},{c:1,r:3},{c:3,r:1},{c:1,r:0},{c:0,r:0},{c:3,r:0},{c:2,r:2},{c:2,r:1}]
  },
  { // Nivell 324: 20 moviments
    positions: [{c:0,r:2},{c:0,r:0},{c:2,r:2},{c:3,r:0},{c:3,r:3},{c:1,r:1},{c:2,r:4},{c:1,r:4},{c:3,r:2},{c:1,r:0}]
  },
  { // Nivell 325: 21 moviments
    positions: [{c:1,r:2},{c:3,r:1},{c:1,r:0},{c:2,r:0},{c:0,r:1},{c:1,r:4},{c:0,r:4},{c:3,r:0},{c:3,r:3},{c:0,r:3}]
  },
  { // Nivell 326: 21 moviments
    positions: [{c:1,r:2},{c:3,r:2},{c:3,r:0},{c:2,r:0},{c:0,r:1},{c:0,r:4},{c:3,r:4},{c:2,r:4},{c:0,r:3},{c:1,r:0}]
  },
  { // Nivell 327: 21 moviments
    positions: [{c:1,r:1},{c:3,r:2},{c:0,r:2},{c:2,r:3},{c:0,r:0},{c:2,r:0},{c:1,r:0},{c:0,r:4},{c:1,r:3},{c:3,r:1}]
  },
  { // Nivell 328: 21 moviments
    positions: [{c:1,r:2},{c:3,r:1},{c:2,r:0},{c:0,r:0},{c:1,r:0},{c:1,r:4},{c:0,r:4},{c:0,r:3},{c:3,r:0},{c:3,r:4}]
  },
  { // Nivell 329: 21 moviments
    positions: [{c:1,r:1},{c:0,r:3},{c:3,r:0},{c:3,r:2},{c:1,r:3},{c:0,r:0},{c:3,r:4},{c:2,r:0},{c:2,r:3},{c:0,r:2}]
  },
  { // Nivell 330: 21 moviments
    positions: [{c:1,r:2},{c:0,r:0},{c:2,r:0},{c:1,r:0},{c:3,r:1},{c:1,r:4},{c:3,r:3},{c:0,r:2},{c:3,r:0},{c:0,r:3}]
  },
  { // Nivell 331: 21 moviments
    positions: [{c:1,r:2},{c:0,r:3},{c:3,r:0},{c:2,r:0},{c:0,r:0},{c:1,r:4},{c:3,r:4},{c:1,r:0},{c:1,r:1},{c:3,r:3}]
  },
  { // Nivell 332: 22 moviments
    positions: [{c:1,r:2},{c:0,r:0},{c:2,r:0},{c:1,r:0},{c:3,r:3},{c:1,r:4},{c:3,r:0},{c:3,r:1},{c:0,r:4},{c:0,r:2}]
  },
  { // Nivell 333: 22 moviments
    positions: [{c:1,r:2},{c:0,r:2},{c:1,r:0},{c:3,r:0},{c:2,r:0},{c:1,r:4},{c:0,r:4},{c:3,r:4},{c:3,r:3},{c:0,r:0}]
  },
  { // Nivell 334: 22 moviments
    positions: [{c:2,r:1},{c:0,r:1},{c:2,r:3},{c:1,r:3},{c:1,r:1},{c:1,r:0},{c:0,r:3},{c:0,r:4},{c:3,r:0},{c:0,r:0}]
  },
  { // Nivell 335: 22 moviments
    positions: [{c:1,r:2},{c:3,r:1},{c:1,r:0},{c:2,r:0},{c:0,r:0},{c:1,r:4},{c:3,r:0},{c:3,r:4},{c:0,r:3},{c:0,r:2}]
  },
  { // Nivell 336: 22 moviments
    positions: [{c:1,r:1},{c:3,r:2},{c:3,r:0},{c:1,r:3},{c:0,r:2},{c:1,r:0},{c:2,r:4},{c:3,r:4},{c:0,r:1},{c:0,r:4}]
  },
  { // Nivell 337: 22 moviments
    positions: [{c:0,r:1},{c:2,r:1},{c:3,r:1},{c:1,r:3},{c:2,r:3},{c:1,r:0},{c:3,r:3},{c:3,r:4},{c:3,r:0},{c:0,r:0}]
  },
  { // Nivell 338: 23 moviments
    positions: [{c:1,r:2},{c:0,r:0},{c:3,r:2},{c:2,r:0},{c:1,r:0},{c:0,r:4},{c:0,r:2},{c:3,r:4},{c:0,r:3},{c:3,r:0}]
  },
  { // Nivell 339: 23 moviments
    positions: [{c:0,r:1},{c:2,r:3},{c:1,r:3},{c:3,r:0},{c:2,r:0},{c:0,r:0},{c:3,r:2},{c:3,r:3},{c:2,r:2},{c:3,r:4}]
  },
  { // Nivell 340: 23 moviments
    positions: [{c:1,r:2},{c:0,r:2},{c:3,r:1},{c:0,r:0},{c:2,r:0},{c:2,r:4},{c:1,r:1},{c:1,r:0},{c:0,r:4},{c:1,r:4}]
  },
  { // Nivell 341: 23 moviments
    positions: [{c:2,r:1},{c:2,r:3},{c:0,r:1},{c:1,r:0},{c:1,r:3},{c:2,r:0},{c:0,r:4},{c:1,r:2},{c:0,r:0},{c:0,r:3}]
  },
  { // Nivell 342: 23 moviments
    positions: [{c:0,r:1},{c:2,r:3},{c:3,r:1},{c:1,r:3},{c:2,r:0},{c:0,r:0},{c:3,r:4},{c:3,r:3},{c:3,r:0},{c:2,r:2}]
  },
  { // Nivell 343: 23 moviments
    positions: [{c:1,r:2},{c:1,r:0},{c:3,r:0},{c:0,r:3},{c:2,r:0},{c:1,r:4},{c:0,r:2},{c:0,r:0},{c:3,r:3},{c:3,r:4}]
  },
  { // Nivell 344: 23 moviments
    positions: [{c:1,r:2},{c:2,r:0},{c:0,r:3},{c:3,r:1},{c:1,r:0},{c:1,r:4},{c:0,r:0},{c:0,r:1},{c:3,r:3},{c:3,r:4}]
  },
  { // Nivell 345: 23 moviments
    positions: [{c:1,r:2},{c:0,r:2},{c:1,r:0},{c:3,r:0},{c:0,r:0},{c:2,r:4},{c:0,r:4},{c:1,r:4},{c:3,r:3},{c:2,r:1}]
  },
  { // Nivell 346: 23 moviments
    positions: [{c:1,r:2},{c:0,r:0},{c:2,r:0},{c:3,r:2},{c:3,r:0},{c:0,r:4},{c:2,r:4},{c:0,r:3},{c:3,r:4},{c:1,r:1}]
  },
  { // Nivell 347: 24 moviments
    positions: [{c:1,r:2},{c:0,r:0},{c:3,r:3},{c:3,r:1},{c:1,r:0},{c:0,r:4},{c:2,r:1},{c:0,r:2},{c:0,r:3},{c:3,r:0}]
  },
  { // Nivell 348: 24 moviments
    positions: [{c:0,r:1},{c:1,r:3},{c:2,r:0},{c:3,r:2},{c:2,r:3},{c:0,r:0},{c:2,r:2},{c:3,r:4},{c:3,r:0},{c:3,r:1}]
  },
  { // Nivell 349: 25 moviments
    positions: [{c:2,r:1},{c:0,r:3},{c:2,r:3},{c:1,r:1},{c:1,r:3},{c:1,r:0},{c:0,r:1},{c:0,r:0},{c:0,r:2},{c:3,r:0}]
  },
  { // Nivell 350: 25 moviments
    positions: [{c:0,r:2},{c:1,r:0},{c:3,r:0},{c:3,r:3},{c:2,r:0},{c:0,r:4},{c:0,r:0},{c:2,r:2},{c:3,r:2},{c:0,r:1}]
  },
  { // Nivell 351: 25 moviments
    positions: [{c:1,r:2},{c:0,r:0},{c:3,r:0},{c:3,r:3},{c:0,r:2},{c:1,r:1},{c:2,r:0},{c:0,r:4},{c:1,r:4},{c:2,r:4}]
  },
  { // Nivell 352: 25 moviments
    positions: [{c:0,r:1},{c:1,r:3},{c:2,r:3},{c:3,r:0},{c:2,r:1},{c:0,r:0},{c:3,r:2},{c:3,r:3},{c:2,r:0},{c:3,r:4}]
  },
  { // Nivell 353: 25 moviments
    positions: [{c:1,r:1},{c:1,r:3},{c:0,r:3},{c:3,r:0},{c:3,r:2},{c:0,r:0},{c:2,r:4},{c:2,r:3},{c:3,r:4},{c:0,r:2}]
  },
  { // Nivell 354: 25 moviments
    positions: [{c:0,r:1},{c:3,r:3},{c:2,r:1},{c:1,r:3},{c:2,r:3},{c:1,r:0},{c:0,r:0},{c:3,r:1},{c:3,r:2},{c:3,r:0}]
  },
  { // Nivell 355: 26 moviments
    positions: [{c:2,r:3},{c:0,r:0},{c:1,r:0},{c:1,r:3},{c:0,r:3},{c:0,r:2},{c:3,r:0},{c:2,r:1},{c:3,r:2},{c:2,r:2}]
  },
  { // Nivell 356: 27 moviments
    positions: [{c:1,r:2},{c:0,r:3},{c:2,r:0},{c:0,r:0},{c:1,r:0},{c:2,r:4},{c:0,r:2},{c:3,r:3},{c:1,r:4},{c:3,r:1}]
  },
  { // Nivell 357: 27 moviments
    positions: [{c:0,r:2},{c:3,r:2},{c:3,r:0},{c:2,r:2},{c:0,r:0},{c:0,r:4},{c:2,r:4},{c:1,r:0},{c:3,r:4},{c:2,r:1}]
  },
  { // Nivell 358: 27 moviments
    positions: [{c:0,r:2},{c:2,r:2},{c:0,r:0},{c:3,r:2},{c:3,r:0},{c:0,r:4},{c:2,r:0},{c:3,r:4},{c:1,r:1},{c:2,r:4}]
  },
  { // Nivell 359: 28 moviments
    positions: [{c:2,r:0},{c:3,r:2},{c:1,r:3},{c:2,r:2},{c:0,r:3},{c:0,r:0},{c:3,r:4},{c:0,r:1},{c:1,r:2},{c:2,r:4}]
  },
  { // Nivell 360: 28 moviments
    positions: [{c:2,r:1},{c:0,r:3},{c:2,r:3},{c:3,r:3},{c:0,r:0},{c:1,r:0},{c:1,r:2},{c:1,r:4},{c:1,r:3},{c:3,r:0}]
  },
  { // Nivell 361: 28 moviments
    positions: [{c:2,r:1},{c:0,r:2},{c:0,r:0},{c:1,r:3},{c:2,r:3},{c:1,r:0},{c:1,r:2},{c:0,r:4},{c:3,r:0},{c:1,r:1}]
  },
  { // Nivell 362: 28 moviments
    positions: [{c:0,r:1},{c:1,r:3},{c:3,r:0},{c:2,r:3},{c:3,r:2},{c:1,r:0},{c:2,r:2},{c:3,r:4},{c:2,r:1},{c:0,r:0}]
  },
  { // Nivell 363: 28 moviments
    positions: [{c:0,r:2},{c:2,r:2},{c:2,r:0},{c:3,r:2},{c:1,r:0},{c:0,r:4},{c:2,r:4},{c:0,r:0},{c:0,r:1},{c:3,r:0}]
  },
  { // Nivell 364: 28 moviments
    positions: [{c:0,r:2},{c:2,r:0},{c:3,r:0},{c:3,r:2},{c:1,r:0},{c:0,r:4},{c:3,r:4},{c:2,r:4},{c:2,r:3},{c:2,r:2}]
  },
  { // Nivell 365: 29 moviments
    positions: [{c:2,r:0},{c:2,r:2},{c:1,r:3},{c:3,r:3},{c:0,r:3},{c:0,r:1},{c:3,r:2},{c:2,r:4},{c:1,r:2},{c:0,r:2}]
  },
  { // Nivell 366: 29 moviments
    positions: [{c:2,r:0},{c:0,r:3},{c:1,r:3},{c:2,r:3},{c:3,r:3},{c:0,r:1},{c:0,r:2},{c:1,r:2},{c:2,r:2},{c:3,r:2}]
  },
  { // Nivell 367: 30 moviments
    positions: [{c:0,r:0},{c:3,r:2},{c:2,r:2},{c:1,r:2},{c:0,r:3},{c:2,r:0},{c:1,r:4},{c:3,r:4},{c:2,r:4},{c:2,r:1}]
  },
  { // Nivell 368: 30 moviments
    positions: [{c:2,r:1},{c:1,r:3},{c:0,r:2},{c:0,r:0},{c:1,r:1},{c:2,r:3},{c:3,r:0},{c:3,r:4},{c:0,r:4},{c:1,r:0}]
  },
  { // Nivell 369: 30 moviments
    positions: [{c:0,r:2},{c:1,r:0},{c:2,r:0},{c:2,r:3},{c:3,r:1},{c:0,r:4},{c:0,r:1},{c:3,r:4},{c:3,r:0},{c:0,r:0}]
  },
  { // Nivell 370: 31 moviments
    positions: [{c:1,r:1},{c:3,r:3},{c:0,r:0},{c:1,r:3},{c:2,r:3},{c:1,r:0},{c:3,r:2},{c:0,r:4},{c:0,r:2},{c:0,r:3}]
  },
  { // Nivell 371: 32 moviments
    positions: [{c:0,r:1},{c:3,r:0},{c:2,r:0},{c:3,r:2},{c:2,r:3},{c:0,r:3},{c:2,r:2},{c:0,r:0},{c:1,r:0},{c:3,r:4}]
  },
  { // Nivell 372: 32 moviments
    positions: [{c:1,r:1},{c:3,r:3},{c:0,r:3},{c:0,r:1},{c:3,r:1},{c:1,r:4},{c:3,r:0},{c:1,r:3},{c:1,r:0},{c:2,r:3}]
  },
  { // Nivell 373: 32 moviments
    positions: [{c:2,r:2},{c:0,r:3},{c:3,r:0},{c:0,r:1},{c:2,r:0},{c:2,r:4},{c:1,r:0},{c:1,r:3},{c:0,r:0},{c:1,r:1}]
  },
  { // Nivell 374: 32 moviments
    positions: [{c:2,r:0},{c:2,r:2},{c:3,r:2},{c:0,r:2},{c:1,r:2},{c:0,r:1},{c:2,r:4},{c:0,r:4},{c:3,r:4},{c:1,r:4}]
  },
  { // Nivell 375: 32 moviments
    positions: [{c:2,r:2},{c:1,r:0},{c:0,r:3},{c:2,r:0},{c:0,r:0},{c:2,r:4},{c:1,r:3},{c:1,r:4},{c:0,r:2},{c:1,r:2}]
  },
  { // Nivell 376: 32 moviments
    positions: [{c:0,r:2},{c:2,r:1},{c:0,r:0},{c:2,r:3},{c:3,r:1},{c:0,r:4},{c:3,r:0},{c:3,r:4},{c:1,r:1},{c:3,r:3}]
  },
  { // Nivell 377: 32 moviments
    positions: [{c:1,r:1},{c:3,r:3},{c:0,r:2},{c:3,r:0},{c:2,r:3},{c:0,r:0},{c:2,r:0},{c:0,r:4},{c:1,r:4},{c:0,r:1}]
  },
  { // Nivell 378: 33 moviments
    positions: [{c:2,r:2},{c:1,r:3},{c:2,r:0},{c:1,r:0},{c:0,r:0},{c:2,r:4},{c:0,r:2},{c:0,r:3},{c:0,r:4},{c:1,r:2}]
  },
  { // Nivell 379: 33 moviments
    positions: [{c:2,r:3},{c:0,r:2},{c:2,r:1},{c:0,r:0},{c:3,r:1},{c:0,r:4},{c:1,r:0},{c:3,r:0},{c:1,r:2},{c:1,r:3}]
  },
  { // Nivell 380: 33 moviments
    positions: [{c:0,r:1},{c:2,r:0},{c:3,r:0},{c:3,r:3},{c:2,r:3},{c:0,r:3},{c:2,r:2},{c:1,r:4},{c:1,r:0},{c:0,r:0}]
  },
  { // Nivell 381: 33 moviments
    positions: [{c:0,r:1},{c:2,r:1},{c:1,r:3},{c:3,r:1},{c:3,r:3},{c:1,r:0},{c:0,r:0},{c:2,r:4},{c:3,r:0},{c:2,r:3}]
  },
  { // Nivell 382: 34 moviments
    positions: [{c:2,r:0},{c:2,r:2},{c:0,r:3},{c:1,r:2},{c:3,r:2},{c:0,r:1},{c:2,r:4},{c:1,r:4},{c:3,r:4},{c:0,r:2}]
  },
  { // Nivell 383: 34 moviments
    positions: [{c:2,r:0},{c:1,r:3},{c:3,r:2},{c:2,r:2},{c:0,r:2},{c:0,r:1},{c:2,r:4},{c:0,r:4},{c:3,r:4},{c:1,r:2}]
  },
  { // Nivell 384: 35 moviments
    positions: [{c:1,r:0},{c:3,r:3},{c:3,r:1},{c:0,r:3},{c:0,r:1},{c:1,r:4},{c:1,r:3},{c:3,r:0},{c:0,r:0},{c:2,r:2}]
  },
  { // Nivell 385: 36 moviments
    positions: [{c:2,r:3},{c:0,r:0},{c:1,r:1},{c:2,r:1},{c:3,r:1},{c:0,r:4},{c:3,r:0},{c:0,r:3},{c:2,r:0},{c:0,r:2}]
  },
  { // Nivell 386: 37 moviments
    positions: [{c:1,r:0},{c:0,r:1},{c:3,r:3},{c:3,r:1},{c:0,r:3},{c:1,r:3},{c:3,r:0},{c:2,r:2},{c:0,r:0},{c:1,r:2}]
  },
  { // Nivell 387: 38 moviments
    positions: [{c:0,r:3},{c:0,r:0},{c:2,r:1},{c:3,r:1},{c:1,r:0},{c:2,r:3},{c:1,r:2},{c:0,r:2},{c:3,r:0},{c:2,r:0}]
  },
  { // Nivell 388: 38 moviments
    positions: [{c:0,r:2},{c:3,r:2},{c:0,r:0},{c:2,r:2},{c:2,r:0},{c:0,r:4},{c:3,r:0},{c:3,r:4},{c:2,r:4},{c:1,r:0}]
  },
  { // Nivell 389: 38 moviments
    positions: [{c:0,r:2},{c:2,r:3},{c:0,r:0},{c:3,r:0},{c:2,r:1},{c:0,r:4},{c:1,r:1},{c:1,r:0},{c:2,r:0},{c:3,r:4}]
  },
  { // Nivell 390: 39 moviments
    positions: [{c:0,r:3},{c:1,r:1},{c:2,r:0},{c:0,r:1},{c:3,r:0},{c:2,r:3},{c:0,r:0},{c:2,r:2},{c:1,r:0},{c:3,r:2}]
  },
  { // Nivell 391: 39 moviments
    positions: [{c:0,r:3},{c:2,r:0},{c:1,r:1},{c:3,r:0},{c:0,r:0},{c:2,r:4},{c:2,r:2},{c:2,r:3},{c:3,r:3},{c:1,r:0}]
  },
  { // Nivell 392: 40 moviments
    positions: [{c:2,r:0},{c:2,r:3},{c:0,r:3},{c:0,r:1},{c:1,r:3},{c:2,r:2},{c:1,r:0},{c:3,r:4},{c:3,r:3},{c:0,r:0}]
  },
  { // Nivell 393: 40 moviments
    positions: [{c:2,r:3},{c:0,r:1},{c:2,r:1},{c:3,r:0},{c:1,r:1},{c:0,r:3},{c:0,r:0},{c:3,r:2},{c:2,r:0},{c:1,r:0}]
  },
  { // Nivell 394: 42 moviments
    positions: [{c:2,r:1},{c:1,r:0},{c:1,r:3},{c:0,r:0},{c:0,r:3},{c:2,r:3},{c:2,r:0},{c:0,r:2},{c:1,r:2},{c:3,r:0}]
  },
  { // Nivell 395: 42 moviments
    positions: [{c:2,r:3},{c:3,r:1},{c:2,r:0},{c:1,r:0},{c:0,r:1},{c:0,r:3},{c:3,r:0},{c:1,r:2},{c:2,r:2},{c:0,r:0}]
  },
  { // Nivell 396: 42 moviments
    positions: [{c:0,r:3},{c:3,r:1},{c:2,r:0},{c:1,r:0},{c:0,r:1},{c:2,r:3},{c:3,r:0},{c:2,r:2},{c:0,r:0},{c:1,r:2}]
  },
  { // Nivell 397: 43 moviments
    positions: [{c:2,r:3},{c:2,r:1},{c:1,r:0},{c:3,r:0},{c:0,r:1},{c:0,r:3},{c:0,r:0},{c:3,r:2},{c:2,r:0},{c:1,r:2}]
  },
  { // Nivell 398: 44 moviments
    positions: [{c:2,r:1},{c:0,r:1},{c:1,r:0},{c:0,r:3},{c:1,r:3},{c:2,r:3},{c:0,r:0},{c:1,r:2},{c:3,r:0},{c:2,r:0}]
  },
  { // Nivell 399: 45 moviments
    positions: [{c:0,r:2},{c:1,r:0},{c:3,r:3},{c:2,r:3},{c:3,r:0},{c:0,r:4},{c:2,r:0},{c:2,r:1},{c:3,r:2},{c:2,r:2}]
  },
  { // Nivell 400: 90 moviments (HUA RONG DAO CLÀSSIC)
    positions: [{c:1,r:0},{c:0,r:0},{c:3,r:0},{c:0,r:2},{c:3,r:2},{c:1,r:2},{c:0,r:4},{c:1,r:3},{c:2,r:3},{c:3,r:4}]
  }
];

// Exportar per al joc
if (typeof module !== 'undefined') module.exports = LEVELS_DATA;
