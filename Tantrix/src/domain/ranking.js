import { levelLabel } from "../data/challenges.js";

export function groupRanking(players, locale = "ca") {
  const groups = new Map();
  for (const player of players) {
    const count = Math.max(0, Math.min(10, Number(player.completedChallengeCount) || 0));
    if (!groups.has(count)) groups.set(count, []);
    groups.get(count).push({ ...player, completedChallengeCount: count });
  }
  return [...groups.entries()]
    .sort(([left], [right]) => right - left)
    .map(([count, entries]) => ({
      count,
      label: count === 10 ? "Discovery completat" : count === 0 ? "Començant" : `${count} ${count === 1 ? "nivell superat" : "nivells superats"}`,
      levelLabel: levelLabel(count),
      players: entries.sort((a, b) => a.displayName.localeCompare(b.displayName, locale, { sensitivity: "base" }))
    }));
}
