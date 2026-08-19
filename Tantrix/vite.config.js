import { defineConfig } from "vite";
import { existsSync, renameSync } from "node:fs";
import path from "node:path";

export default defineConfig({
  base: "./",
  plugins: [
    {
      name: "tantrix-source-entry",
      configureServer(server) {
        server.middlewares.use((request, _response, next) => {
          if (request.url === "/" || request.url?.startsWith("/?")) request.url = `/index.source.html${request.url.slice(1)}`;
          next();
        });
      }
    },
    {
      name: "tantrix-pages-index",
      apply: "build",
      closeBundle() {
        const source = path.resolve("dist/index.source.html");
        const target = path.resolve("dist/index.html");
        if (existsSync(source)) renameSync(source, target);
      }
    }
  ],
  build: {
    rollupOptions: {
      input: path.resolve("index.source.html"),
      output: {
        entryFileNames: "assets/app.js",
        chunkFileNames: "assets/chunk-[name].js",
        assetFileNames: assetInfo => assetInfo.names?.some(name => name.endsWith(".css")) ? "assets/app.css" : "assets/[name][extname]"
      }
    }
  }
});
