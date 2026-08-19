import { describe, expect, it } from "vitest";
import { groupRanking } from "../../src/domain/ranking.js";

describe("rànquing visual", () => {
  it("agrupa per fites i ordena els noms en català", () => {
    const groups = groupRanking([
      { displayName: "Zoè", completedChallengeCount: 2 },
      { displayName: "Àlex", completedChallengeCount: 10 },
      { displayName: "Anna", completedChallengeCount: 2 }
    ]);
    expect(groups.map(group => group.count)).toEqual([10, 2]);
    expect(groups[1].players.map(player => player.displayName)).toEqual(["Anna", "Zoè"]);
    expect(groups[0].label).toBe("Discovery completat");
  });
});
