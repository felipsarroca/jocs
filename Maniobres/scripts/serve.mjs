// SPDX-License-Identifier: AGPL-3.0-or-later
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname } from "node:path";
const root = resolve(".");
const mime = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webmanifest": "application/manifest+json",
};
createServer(async (req, res) => {
  try {
    const path = resolve(
      root,
      "." + decodeURIComponent(new URL(req.url, "http://localhost").pathname),
    );
    if (!path.startsWith(root)) throw 0;
    const f =
      path.endsWith("\\") || path === root ? resolve(path, "index.html") : path;
    res.setHeader(
      "Content-Type",
      mime[extname(f)] || "application/octet-stream",
    );
    res.end(await readFile(f));
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
}).listen(4173, "127.0.0.1", () => console.log("http://127.0.0.1:4173"));
