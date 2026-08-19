import { describe, expect, it } from "vitest";
import { normalizeName, validateName } from "../../src/domain/username.js";

describe("noms d’usuari", () => {
  it("normalitza Unicode, espais i majúscules", () => {
    expect(normalizeName("  Àlex   7 ")).toBe("àlex 7");
  });

  it.each(["=SUM(A1:A2)", "+ordre", "a", "nom\nmaliciós", "🙂🙂"])("rebutja %s", value => {
    expect(validateName(value).valid).toBe(false);
  });

  it.each(["Joan", "Laia_4", "M. Àngels", "Grup-7"])("admet %s", value => {
    expect(validateName(value).valid).toBe(true);
  });
});
