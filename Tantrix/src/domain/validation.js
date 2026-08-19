import { CHALLENGE_BY_ID } from "../data/challenges.js";
import { TILE_BY_ID } from "../data/tiles.js";
import { HEX_DIRECTIONS, coordKey, neighbor, oppositeEdge } from "./hex.js";
import { colorAtWorldEdge } from "./rotation.js";

export const VALIDATION_CODES = Object.freeze({
  VALID: "VALID",
  WRONG_TILE_SET: "WRONG_TILE_SET",
  DUPLICATE_TILE: "DUPLICATE_TILE",
  OVERLAP: "OVERLAP",
  DISCONNECTED: "DISCONNECTED",
  COLOR_MISMATCH: "COLOR_MISMATCH",
  HOLE: "HOLE",
  OPEN_TARGET_PATH: "OPEN_TARGET_PATH",
  TARGET_NOT_USING_ALL_TILES: "TARGET_NOT_USING_ALL_TILES",
  INVALID_PAYLOAD: "INVALID_PAYLOAD"
});

const result = (valid, code, details = {}) => ({ valid, code, details });

export function validateLayout(challengeId, layout) {
  const challenge = CHALLENGE_BY_ID.get(challengeId);
  if (!challenge || !Array.isArray(layout)) return result(false, VALIDATION_CODES.INVALID_PAYLOAD);
  if (layout.length !== challenge.pieceCount) return result(false, VALIDATION_CODES.WRONG_TILE_SET);

  const ids = layout.map(item => item.tileId);
  if (new Set(ids).size !== ids.length) return result(false, VALIDATION_CODES.DUPLICATE_TILE);
  const expected = Array.from({ length: challenge.pieceCount }, (_, index) => index + 1);
  if (ids.slice().sort((a, b) => a - b).some((id, index) => id !== expected[index])) {
    return result(false, VALIDATION_CODES.WRONG_TILE_SET);
  }

  for (const item of layout) {
    if (!Number.isInteger(item.q) || !Number.isInteger(item.r) || Math.abs(item.q) > 20 || Math.abs(item.r) > 20 ||
      !Number.isInteger(item.rotation) || item.rotation < 0 || item.rotation > 5) {
      return result(false, VALIDATION_CODES.INVALID_PAYLOAD);
    }
  }

  const board = new Map();
  for (const item of layout) {
    const key = coordKey(item.q, item.r);
    if (board.has(key)) return result(false, VALIDATION_CODES.OVERLAP);
    board.set(key, item);
  }

  const connected = floodTiles(layout[0], board);
  if (connected.size !== layout.length) return result(false, VALIDATION_CODES.DISCONNECTED);

  for (const item of layout) {
    const tile = TILE_BY_ID.get(item.tileId);
    for (let edge = 0; edge < 6; edge += 1) {
      const nextCoord = neighbor(item.q, item.r, edge);
      const adjacent = board.get(coordKey(nextCoord.q, nextCoord.r));
      if (!adjacent || item.tileId > adjacent.tileId) continue;
      const adjacentTile = TILE_BY_ID.get(adjacent.tileId);
      const left = colorAtWorldEdge(tile, item.rotation, edge);
      const right = colorAtWorldEdge(adjacentTile, adjacent.rotation, oppositeEdge(edge));
      if (left !== right) return result(false, VALIDATION_CODES.COLOR_MISMATCH, { tileId: item.tileId, edge });
    }
  }

  if (hasHole(layout, board)) return result(false, VALIDATION_CODES.HOLE);

  const targetAdjacency = new Map(layout.map(item => [item.tileId, []]));
  for (const item of layout) {
    const tile = TILE_BY_ID.get(item.tileId);
    for (let edge = 0; edge < 6; edge += 1) {
      if (colorAtWorldEdge(tile, item.rotation, edge) !== challenge.targetColor) continue;
      const nextCoord = neighbor(item.q, item.r, edge);
      const adjacent = board.get(coordKey(nextCoord.q, nextCoord.r));
      if (!adjacent) return result(false, VALIDATION_CODES.OPEN_TARGET_PATH, { tileId: item.tileId, edge });
      const adjacentTile = TILE_BY_ID.get(adjacent.tileId);
      if (colorAtWorldEdge(adjacentTile, adjacent.rotation, oppositeEdge(edge)) !== challenge.targetColor) {
        return result(false, VALIDATION_CODES.OPEN_TARGET_PATH, { tileId: item.tileId, edge });
      }
      targetAdjacency.get(item.tileId).push(adjacent.tileId);
    }
  }

  if ([...targetAdjacency.values()].some(entries => entries.length !== 2)) {
    return result(false, VALIDATION_CODES.OPEN_TARGET_PATH);
  }
  const seen = new Set();
  const stack = [layout[0].tileId];
  while (stack.length) {
    const id = stack.pop();
    if (seen.has(id)) continue;
    seen.add(id);
    stack.push(...targetAdjacency.get(id));
  }
  if (seen.size !== layout.length) return result(false, VALIDATION_CODES.TARGET_NOT_USING_ALL_TILES);
  return result(true, VALIDATION_CODES.VALID);
}

function floodTiles(start, board) {
  const seen = new Set();
  const queue = [start];
  while (queue.length) {
    const item = queue.shift();
    const key = coordKey(item.q, item.r);
    if (seen.has(key)) continue;
    seen.add(key);
    for (let edge = 0; edge < 6; edge += 1) {
      const next = neighbor(item.q, item.r, edge);
      const adjacent = board.get(coordKey(next.q, next.r));
      if (adjacent && !seen.has(coordKey(next.q, next.r))) queue.push(adjacent);
    }
  }
  return seen;
}

function hasHole(layout, board) {
  const qs = layout.map(item => item.q);
  const rs = layout.map(item => item.r);
  const minQ = Math.min(...qs) - 2;
  const maxQ = Math.max(...qs) + 2;
  const minR = Math.min(...rs) - 2;
  const maxR = Math.max(...rs) + 2;
  const exterior = new Set();
  const queue = [{ q: minQ, r: minR }];
  while (queue.length) {
    const current = queue.shift();
    const key = coordKey(current.q, current.r);
    if (exterior.has(key) || board.has(key) || current.q < minQ || current.q > maxQ || current.r < minR || current.r > maxR) continue;
    exterior.add(key);
    for (const [dq, dr] of HEX_DIRECTIONS) queue.push({ q: current.q + dq, r: current.r + dr });
  }
  for (let q = minQ; q <= maxQ; q += 1) {
    for (let r = minR; r <= maxR; r += 1) {
      const key = coordKey(q, r);
      if (!board.has(key) && !exterior.has(key)) return true;
    }
  }
  return false;
}
