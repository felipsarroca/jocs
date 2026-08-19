export function colorAtWorldEdge(tile, rotation, worldEdge) {
  const sourceEdge = (worldEdge - rotation + 6) % 6;
  return tile.edges[sourceEdge];
}

export function normalizeRotation(rotation) {
  return ((Math.trunc(rotation) % 6) + 6) % 6;
}
