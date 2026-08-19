import { describe, expect, it, vi } from "vitest";
import { CHALLENGE_DEFINITIONS } from "../../src/data/challenges.js";
import { GameState } from "../../src/game/game-state.js";

describe("estat local de partida", () => {
  it("desa moviment, gir, desfer i refer", () => {
    vi.spyOn(Math, "random").mockReturnValue(.1);
    const game = new GameState(CHALLENGE_DEFINITIONS[0]);
    expect(game.place(1, 0, 0)).toBe(true);
    expect(game.rotate(1, 1)).toBe(true);
    expect(game.boardLayout()[0].rotation).toBe(1);
    expect(game.undo()).toBe(true);
    expect(game.boardLayout()[0].rotation).toBe(0);
    expect(game.redo()).toBe(true);
    expect(game.boardLayout()[0].rotation).toBe(1);
    vi.restoreAllMocks();
  });

  it("impedeix superposar dues fitxes", () => {
    const game = new GameState(CHALLENGE_DEFINITIONS[0]);
    expect(game.place(1, 0, 0)).toBe(true);
    expect(game.place(2, 0, 0)).toBe(false);
  });
});
