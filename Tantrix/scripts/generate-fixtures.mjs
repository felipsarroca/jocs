import { writeFile } from "node:fs/promises";
import { CHALLENGE_DEFINITIONS } from "../src/data/challenges.js";
import { TILE_BY_ID } from "../src/data/tiles.js";
import { coordKey, neighbor, oppositeEdge } from "../src/domain/hex.js";
import { colorAtWorldEdge } from "../src/domain/rotation.js";
import { validateLayout } from "../src/domain/validation.js";

function targetEdges(tileId, rotation, color) {
  const tile = TILE_BY_ID.get(tileId);
  return Array.from({ length: 6 }, (_, edge) => edge).filter(edge => colorAtWorldEdge(tile, rotation, edge) === color);
}

function fitsContacts(candidate, board) {
  const tile = TILE_BY_ID.get(candidate.tileId);
  for (let edge = 0; edge < 6; edge += 1) {
    const next = neighbor(candidate.q, candidate.r, edge);
    const adjacent = board.get(coordKey(next.q, next.r));
    if (!adjacent) continue;
    const adjacentTile = TILE_BY_ID.get(adjacent.tileId);
    if (colorAtWorldEdge(tile, candidate.rotation, edge) !== colorAtWorldEdge(adjacentTile, adjacent.rotation, oppositeEdge(edge))) return false;
  }
  return true;
}

function solve(challenge) {
  const start = { tileId: 1, q: 0, r: 0, rotation: 0 };
  const startEdges = targetEdges(1, 0, challenge.targetColor);
  const firstOutgoing = startEdges[0];
  const requiredReturnEdge = startEdges[1];
  const board = new Map([[coordKey(0, 0), start]]);
  const path = [start];
  const remaining = new Set(Array.from({ length: challenge.pieceCount - 1 }, (_, index) => index + 2));

  function search(current, outgoingEdge) {
    if (!remaining.size) {
      const closure = neighbor(current.q, current.r, outgoingEdge);
      if (closure.q !== 0 || closure.r !== 0 || oppositeEdge(outgoingEdge) !== requiredReturnEdge) return null;
      const validation = validateLayout(challenge.id, path);
      return validation.valid ? path.map(item => ({ ...item })) : null;
    }
    const position = neighbor(current.q, current.r, outgoingEdge);
    if (board.has(coordKey(position.q, position.r))) return null;
    for (const tileId of [...remaining]) {
      for (let rotation = 0; rotation < 6; rotation += 1) {
        const edges = targetEdges(tileId, rotation, challenge.targetColor);
        const entryEdge = oppositeEdge(outgoingEdge);
        if (!edges.includes(entryEdge)) continue;
        const nextOutgoing = edges[0] === entryEdge ? edges[1] : edges[0];
        const candidate = { tileId, q: position.q, r: position.r, rotation };
        if (!fitsContacts(candidate, board)) continue;
        board.set(coordKey(position.q, position.r), candidate);
        path.push(candidate);
        remaining.delete(tileId);
        const solved = search(candidate, nextOutgoing);
        if (solved) return solved;
        remaining.add(tileId);
        path.pop();
        board.delete(coordKey(position.q, position.r));
      }
    }
    return null;
  }

  return search(start, firstOutgoing);
}

const fixtures = {};
for (const challenge of CHALLENGE_DEFINITIONS) {
  const solution = solve(challenge);
  if (!solution) throw new Error(`No solution found for ${challenge.id}`);
  fixtures[challenge.id] = solution.sort((a, b) => a.tileId - b.tileId);
  console.log(`${challenge.id}: ${solution.length} tiles`);
}

await writeFile(new URL("../tests/fixtures/solutions.json", import.meta.url), `${JSON.stringify(fixtures, null, 2)}\n`, "utf8");
