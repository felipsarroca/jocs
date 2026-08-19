import { copyFileSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const projectRoot = path.resolve(import.meta.dirname, "..");
const buildRoot = path.join(projectRoot, "dist");
const buildAssets = path.join(buildRoot, "assets");
const publicAssets = path.join(projectRoot, "assets");

mkdirSync(publicAssets, { recursive: true });

for (const filename of ["index.html", "sw.js"]) {
  const target = path.join(projectRoot, filename);
  copyFileSync(path.join(buildRoot, filename), target);
  writeFileSync(target, readFileSync(target, "utf8").replace(/\r\n/g, "\n"));
}

for (const filename of readdirSync(buildAssets)) {
  copyFileSync(path.join(buildAssets, filename), path.join(publicAssets, filename));
}

console.log("Fitxers de GitHub Pages preparats a Tantrix/.");
