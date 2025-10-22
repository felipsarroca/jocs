import { generatePuzzle } from '../src/generator.js';
import { countSolutions } from '../src/solver.js';

const levels = ['easy', 'medium', 'hard'];

for (const level of levels) {
  const { puzzle } = generatePuzzle(level);
  const clues = puzzle.flat().filter(Boolean).length;
  const solutions = countSolutions(puzzle, 2);
  console.log(level.padEnd(5), 'clues:', clues.toString().padStart(2), 'solutions:', solutions);
}
