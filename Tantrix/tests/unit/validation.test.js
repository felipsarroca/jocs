import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CHALLENGE_DEFINITIONS } from "../../src/data/challenges.js";
import { validateLayout } from "../../src/domain/validation.js";

const fixtures = JSON.parse(readFileSync(new URL("../fixtures/solutions.json", import.meta.url), "utf8"));

describe("validador complet", () => {
  it.each(CHALLENGE_DEFINITIONS)("accepta la fixture de $id", challenge => {
    expect(validateLayout(challenge.id, fixtures[challenge.id])).toEqual(expect.objectContaining({ valid: true, code: "VALID" }));
  });

  it("rebutja una fitxa absent", () => {
    expect(validateLayout("D04_R", fixtures.D04_R.slice(1)).code).toBe("WRONG_TILE_SET");
  });

  it("rebutja una superposició", () => {
    const layout = structuredClone(fixtures.D05_R);
    Object.assign(layout[1], { q: layout[0].q, r: layout[0].r });
    expect(validateLayout("D05_R", layout).code).toBe("OVERLAP");
  });

  it("rebutja una orientació cromàtica incorrecta", () => {
    const layout = structuredClone(fixtures.D06_B);
    layout[2].rotation = (layout[2].rotation + 1) % 6;
    expect(validateLayout("D06_B", layout).valid).toBe(false);
  });

  it("rebutja coordenades fora de límit", () => {
    const layout = structuredClone(fixtures.D03_Y);
    layout[0].q = 21;
    expect(validateLayout("D03_Y", layout).code).toBe("INVALID_PAYLOAD");
  });
});
