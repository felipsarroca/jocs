export const CHALLENGE_DEFINITIONS = Object.freeze([
  { id: "D03_Y", order: 1, pieceCount: 3, targetColor: "Y" },
  { id: "D04_R", order: 2, pieceCount: 4, targetColor: "R" },
  { id: "D05_R", order: 3, pieceCount: 5, targetColor: "R" },
  { id: "D06_B", order: 4, pieceCount: 6, targetColor: "B" },
  { id: "D07_R", order: 5, pieceCount: 7, targetColor: "R" },
  { id: "D08_B", order: 6, pieceCount: 8, targetColor: "B" },
  { id: "D09_Y", order: 7, pieceCount: 9, targetColor: "Y" },
  { id: "D10_R", order: 8, pieceCount: 10, targetColor: "R" },
  { id: "D10_B", order: 9, pieceCount: 10, targetColor: "B" },
  { id: "D10_Y", order: 10, pieceCount: 10, targetColor: "Y" }
]);

export const CHALLENGE_BY_ID = new Map(CHALLENGE_DEFINITIONS.map(challenge => [challenge.id, challenge]));

export function levelLabel(completedCount) {
  const labels = [
    "Comença amb 3 fitxes",
    "Circuit de 3 fitxes superat",
    "Circuit de 4 fitxes superat",
    "Circuit de 5 fitxes superat",
    "Circuit de 6 fitxes superat",
    "Circuit de 7 fitxes superat",
    "Circuit de 8 fitxes superat",
    "Circuit de 9 fitxes superat",
    "Circuit vermell de 10 fitxes superat",
    "Circuits vermell i blau de 10 superats",
    "Discovery completat"
  ];
  return labels[Math.max(0, Math.min(10, completedCount))];
}
