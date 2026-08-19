import { describe, expect, it } from "vitest";
import { COLORS, TILE_DEFINITIONS } from "../../src/data/tiles.js";
import { colorAtWorldEdge } from "../../src/domain/rotation.js";
import { TILE_APOTHEM, TILE_RADIUS, pathForLink } from "../../src/render/tile-renderer.js";

const EXPECTED = ["YYBRBR", "YYBRRB", "RRBBYY", "YRBRYB", "YYRBBR", "RBYBRY", "BBYRYR", "BBRYRY", "YBRBYR", "YYRBRB"];
const EXPECTED_LINKS = [
  ["Y:0-1:tight", "R:3-5:wide", "B:2-4:wide"],
  ["R:3-4:tight", "Y:0-1:tight", "B:2-5:straight"],
  ["Y:4-5:tight", "R:0-1:tight", "B:2-3:tight"],
  ["Y:0-4:wide", "R:1-3:wide", "B:2-5:straight"],
  ["B:3-4:tight", "Y:0-1:tight", "R:2-5:straight"],
  ["R:0-4:wide", "B:1-3:wide", "Y:2-5:straight"],
  ["B:0-1:tight", "Y:2-4:wide", "R:3-5:wide"],
  ["B:0-1:tight", "R:2-4:wide", "Y:3-5:wide"],
  ["Y:0-4:wide", "B:1-3:wide", "R:2-5:straight"],
  ["Y:0-1:tight", "R:2-4:wide", "B:3-5:wide"]
];

describe("definicions de fitxes", () => {
  it("usa la paleta Tantrix especificada", () => {
    expect(Object.fromEntries(Object.entries(COLORS).map(([code, details]) => [code, details.hex]))).toEqual({
      R: "#e50000",
      B: "#008fcc",
      Y: "#f2ca00"
    });
  });

  it("conserva les deu seqüències oficials", () => {
    expect(TILE_DEFINITIONS.map(tile => tile.edges)).toEqual(EXPECTED);
  });

  it.each(TILE_DEFINITIONS)("la fitxa $id té dues sortides de cada color", tile => {
    for (const color of ["R", "B", "Y"]) expect([...tile.edges].filter(value => value === color)).toHaveLength(2);
  });

  it("conserva les connexions, les formes i l'ordre visual oficials", () => {
    const actual = TILE_DEFINITIONS.map(tile => tile.links.map(({ color, from, to, shape }) => `${color}:${from}-${to}:${shape}`));
    expect(actual).toEqual(EXPECTED_LINKS);
  });

  it.each(TILE_DEFINITIONS)("la geometria explícita de la fitxa $id coincideix amb els colors dels costats", tile => {
    for (const { color, from, to } of tile.links) {
      expect(tile.edges[from]).toBe(color);
      expect(tile.edges[to]).toBe(color);
    }
  });

  it("usa arcs circulars oficials i fa acabar els camins exactament al costat", () => {
    expect(TILE_RADIUS).toBe(54);
    expect(TILE_APOTHEM).toBeCloseTo(46.7654, 4);
    expect(pathForLink({ from: 0, to: 1, shape: "tight" })).toContain("A 27 27 0 0 0");
    expect(pathForLink({ from: 0, to: 4, shape: "wide" })).toContain("A 81 81 0 0 1");
    expect(pathForLink({ from: 2, to: 5, shape: "straight" })).toContain(" L ");
  });

  it("sis girs tornen a l’orientació original", () => {
    const tile = TILE_DEFINITIONS[3];
    for (let edge = 0; edge < 6; edge += 1) expect(colorAtWorldEdge(tile, 6, edge)).toBe(colorAtWorldEdge(tile, 0, edge));
  });
});
