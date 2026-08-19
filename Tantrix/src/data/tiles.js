export const COLORS = Object.freeze({
  R: Object.freeze({ code: "R", name: "vermell", hex: "#e50000" }),
  B: Object.freeze({ code: "B", name: "blau", hex: "#008fcc" }),
  Y: Object.freeze({ code: "Y", name: "groc", hex: "#f2ca00" })
});

const link = (color, from, to, shape) => Object.freeze({ color, from, to, shape });
const tile = (id, edges, links) => Object.freeze({ id, edges, links: Object.freeze(links) });

// Connexions i ordre de pintat verificats peça per peça amb l'índex oficial.
// L'ordre és important als encreuaments: l'últim camí queda visualment al damunt.
export const TILE_DEFINITIONS = Object.freeze([
  tile(1, "YYBRBR", [link("Y", 0, 1, "tight"), link("R", 3, 5, "wide"), link("B", 2, 4, "wide")]),
  tile(2, "YYBRRB", [link("R", 3, 4, "tight"), link("Y", 0, 1, "tight"), link("B", 2, 5, "straight")]),
  tile(3, "RRBBYY", [link("Y", 4, 5, "tight"), link("R", 0, 1, "tight"), link("B", 2, 3, "tight")]),
  tile(4, "YRBRYB", [link("Y", 0, 4, "wide"), link("R", 1, 3, "wide"), link("B", 2, 5, "straight")]),
  tile(5, "YYRBBR", [link("B", 3, 4, "tight"), link("Y", 0, 1, "tight"), link("R", 2, 5, "straight")]),
  tile(6, "RBYBRY", [link("R", 0, 4, "wide"), link("B", 1, 3, "wide"), link("Y", 2, 5, "straight")]),
  tile(7, "BBYRYR", [link("B", 0, 1, "tight"), link("Y", 2, 4, "wide"), link("R", 3, 5, "wide")]),
  tile(8, "BBRYRY", [link("B", 0, 1, "tight"), link("R", 2, 4, "wide"), link("Y", 3, 5, "wide")]),
  tile(9, "YBRBYR", [link("Y", 0, 4, "wide"), link("B", 1, 3, "wide"), link("R", 2, 5, "straight")]),
  tile(10, "YYRBRB", [link("Y", 0, 1, "tight"), link("R", 2, 4, "wide"), link("B", 3, 5, "wide")])
]);

export const TILE_BY_ID = new Map(TILE_DEFINITIONS.map(tile => [tile.id, tile]));
