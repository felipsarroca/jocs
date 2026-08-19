import { TILE_DEFINITIONS } from "../data/tiles.js";
import { normalizeRotation } from "../domain/rotation.js";

export class GameState {
  constructor(challenge, saved = null) {
    this.challenge = challenge;
    this.history = [];
    this.future = [];
    this.selectedTileId = null;
    this.camera = saved?.camera ?? { x: 0, y: 0, scale: 1 };
    this.pieces = saved?.pieces?.length === challenge.pieceCount
      ? saved.pieces.map(piece => ({ ...piece }))
      : TILE_DEFINITIONS.slice(0, challenge.pieceCount).map(tile => ({
          tileId: tile.id,
          location: "TRAY",
          q: null,
          r: null,
          rotation: Math.floor(Math.random() * 6)
        })).sort(() => Math.random() - 0.5);
  }

  snapshot() {
    return { pieces: this.pieces.map(piece => ({ ...piece })), camera: { ...this.camera } };
  }

  record() {
    this.history.push(this.snapshot());
    if (this.history.length > 100) this.history.shift();
    this.future = [];
  }

  select(tileId) {
    this.selectedTileId = this.selectedTileId === tileId ? tileId : tileId;
  }

  rotate(tileId, amount) {
    const piece = this.pieces.find(item => item.tileId === tileId);
    if (!piece) return false;
    this.record();
    piece.rotation = normalizeRotation(piece.rotation + amount);
    this.selectedTileId = tileId;
    return true;
  }

  place(tileId, q, r) {
    const piece = this.pieces.find(item => item.tileId === tileId);
    if (!piece || this.pieces.some(item => item.tileId !== tileId && item.location === "BOARD" && item.q === q && item.r === r)) return false;
    if (piece.location === "BOARD" && piece.q === q && piece.r === r) return false;
    this.record();
    Object.assign(piece, { location: "BOARD", q, r });
    this.selectedTileId = tileId;
    return true;
  }

  remove(tileId) {
    const piece = this.pieces.find(item => item.tileId === tileId);
    if (!piece || piece.location !== "BOARD") return false;
    this.record();
    Object.assign(piece, { location: "TRAY", q: null, r: null });
    this.selectedTileId = tileId;
    return true;
  }

  undo() {
    const previous = this.history.pop();
    if (!previous) return false;
    this.future.push(this.snapshot());
    this.pieces = previous.pieces.map(piece => ({ ...piece }));
    this.camera = { ...previous.camera };
    return true;
  }

  redo() {
    const next = this.future.pop();
    if (!next) return false;
    this.history.push(this.snapshot());
    this.pieces = next.pieces.map(piece => ({ ...piece }));
    this.camera = { ...next.camera };
    return true;
  }

  reset() {
    this.record();
    this.pieces = this.pieces.map(piece => ({ ...piece, location: "TRAY", q: null, r: null, rotation: Math.floor(Math.random() * 6) })).sort(() => Math.random() - 0.5);
    this.selectedTileId = null;
    this.camera = { x: 0, y: 0, scale: 1 };
  }

  boardLayout() {
    return this.pieces.filter(piece => piece.location === "BOARD").map(({ tileId, q, r, rotation }) => ({ tileId, q, r, rotation }));
  }

  serialize() {
    return { challengeId: this.challenge.id, pieces: this.pieces, camera: this.camera, updatedAt: new Date().toISOString() };
  }
}
