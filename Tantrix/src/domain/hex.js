export const HEX_DIRECTIONS = Object.freeze([
  [1, 0],
  [0, 1],
  [-1, 1],
  [-1, 0],
  [0, -1],
  [1, -1]
]);

export const oppositeEdge = edge => (edge + 3) % 6;
export const coordKey = (q, r) => `${q},${r}`;

export function axialToPixel(q, r, radius) {
  return {
    x: radius * 1.5 * q,
    y: radius * Math.sqrt(3) * (r + q / 2)
  };
}

export function pixelToAxial(x, y, radius) {
  const q = (2 / 3 * x) / radius;
  const r = (-1 / 3 * x + Math.sqrt(3) / 3 * y) / radius;
  return roundAxial(q, r);
}

export function roundAxial(q, r) {
  const x = q;
  const z = r;
  const y = -x - z;
  let rx = Math.round(x);
  let ry = Math.round(y);
  let rz = Math.round(z);
  const dx = Math.abs(rx - x);
  const dy = Math.abs(ry - y);
  const dz = Math.abs(rz - z);
  if (dx > dy && dx > dz) rx = -ry - rz;
  else if (dy > dz) ry = -rx - rz;
  else rz = -rx - ry;
  return { q: Object.is(rx, -0) ? 0 : rx, r: Object.is(rz, -0) ? 0 : rz };
}

export function neighbor(q, r, edge) {
  const [dq, dr] = HEX_DIRECTIONS[edge];
  return { q: q + dq, r: r + dr };
}

export function rotateAxial(q, r, turns = 1) {
  let x = q;
  let z = r;
  let y = -x - z;
  for (let index = 0; index < ((turns % 6) + 6) % 6; index += 1) {
    [x, y, z] = [-z, -x, -y];
  }
  return { q: x, r: z };
}
