import { COLORS, TILE_BY_ID } from "../data/tiles.js";

const SVG_NS = "http://www.w3.org/2000/svg";
export const TILE_RADIUS = 54;
export const TILE_APOTHEM = TILE_RADIUS * Math.cos(Math.PI / 6);

function svgElement(name, attributes = {}) {
  const element = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, String(value));
  return element;
}

export function pointForEdge(edge, radius = TILE_APOTHEM) {
  const angle = (30 + edge * 60) * Math.PI / 180;
  return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
}

const coordinate = value => Number(value.toFixed(4));

export function pathForLink({ from, to, shape }) {
  const start = pointForEdge(from);
  const end = pointForEdge(to);
  const move = `M ${coordinate(start.x)} ${coordinate(start.y)}`;
  if (shape === "straight") return `${move} L ${coordinate(end.x)} ${coordinate(end.y)}`;

  const radius = shape === "tight" ? TILE_RADIUS / 2 : TILE_RADIUS * 1.5;
  const clockwiseDistance = ((to - from) % 6 + 6) % 6;
  const sweep = clockwiseDistance > 3 ? 1 : 0;
  return `${move} A ${radius} ${radius} 0 0 ${sweep} ${coordinate(end.x)} ${coordinate(end.y)}`;
}

export function createTileGroup(tileId, options = {}) {
  const { rotation = 0, selected = false, patterns = false, className = "tantrix-tile" } = options;
  const tile = TILE_BY_ID.get(tileId);
  const group = svgElement("g", {
    class: `${className}${selected ? " is-selected" : ""}`,
    "data-tile-id": tileId,
    transform: `rotate(${rotation * 60})`,
    tabindex: options.tabindex ?? -1,
    role: "button",
    "aria-label": options.ariaLabel ?? `Fitxa ${tileId}, rotació ${rotation * 60} graus${selected ? ", seleccionada" : ""}`
  });
  const polygonPoints = Array.from({ length: 6 }, (_, index) => {
    const angle = index * Math.PI / 3;
    return `${coordinate(Math.cos(angle) * TILE_RADIUS)},${coordinate(Math.sin(angle) * TILE_RADIUS)}`;
  }).join(" ");
  group.append(svgElement("polygon", { points: polygonPoints, class: "tile-hit" }));
  group.append(svgElement("polygon", { points: polygonPoints, class: "tile-body" }));

  for (const connection of tile.links) {
    const { color, shape } = connection;
    const d = pathForLink(connection);
    group.append(svgElement("path", { d, class: "tile-link-outline", "data-connection-shape": shape }));
    const link = svgElement("path", { d, class: `tile-link tile-link-${color.toLowerCase()}`, stroke: COLORS[color].hex, "data-connection-color": color, "data-connection-shape": shape });
    if (patterns && color !== "Y") {
      link.setAttribute("stroke-dasharray", color === "R" ? "2 7" : "9 5");
    }
    group.append(link);
  }
  group.append(svgElement("polygon", { points: polygonPoints, class: "tile-border" }));
  group.append(svgElement("polygon", { points: polygonPoints, class: "tile-selection-ring" }));
  return group;
}

export function createTileSvg(tileId, options = {}) {
  const size = options.size ?? 120;
  const svg = svgElement("svg", {
    viewBox: "-64 -64 128 128",
    width: size,
    height: size,
    class: "tile-svg",
    "aria-hidden": options.decorative ? "true" : "false"
  });
  svg.append(createTileGroup(tileId, options));
  return svg;
}
