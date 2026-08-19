import { describe, expect, it } from "vitest";
import { axialToPixel, neighbor, oppositeEdge, pixelToAxial } from "../../src/domain/hex.js";

describe("coordenades hexagonals", () => {
  it("converteix axial a píxel i torna sense pèrdua", () => {
    for (let q = -4; q <= 4; q += 1) for (let r = -4; r <= 4; r += 1) expect(pixelToAxial(...Object.values(axialToPixel(q, r, 54)), 54)).toEqual({ q, r });
  });

  it("cada direcció té un costat oposat", () => {
    for (let edge = 0; edge < 6; edge += 1) {
      const first = neighbor(0, 0, edge);
      expect(neighbor(first.q, first.r, oppositeEdge(edge))).toEqual({ q: 0, r: 0 });
    }
  });
});
