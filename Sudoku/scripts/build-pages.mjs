import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const publicDir = path.join(rootDir, 'public');
const srcDir = path.join(rootDir, 'src');
const docsDir = path.join(rootDir, 'docs');
const sudokuDir = path.join(docsDir, 'Sudoku');

async function ensureCleanDocs() {
  await fs.rm(docsDir, { recursive: true, force: true });
  await fs.mkdir(docsDir, { recursive: true });
}

async function copyDir(from, to) {
  await fs.mkdir(to, { recursive: true });
  const entries = await fs.readdir(from, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(from, entry.name);
    const destPath = path.join(to, entry.name);

    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else if (entry.isFile()) {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

async function buildPages() {
  await ensureCleanDocs();

  // Prepare Sudoku subdirectori
  await fs.mkdir(sudokuDir, { recursive: true });

  // Copy CSS and assets from public
  const stylesSrc = path.join(publicDir, 'styles');
  await copyDir(stylesSrc, path.join(sudokuDir, 'styles'));

  // Copy source modules (app.js, generator.js, etc.)
  await copyDir(srcDir, sudokuDir);

  // Prepare index.html for docs
  const indexSrc = path.join(publicDir, 'index.html');
  let indexContent = await fs.readFile(indexSrc, 'utf8');

  indexContent = indexContent.replace('../src/app.js', './app.js');

  await fs.writeFile(path.join(sudokuDir, 'index.html'), indexContent, 'utf8');

  const rootIndex = `<!DOCTYPE html>
<html lang="ca">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="0; url=./Sudoku/">
  <title>Redirecció Sudoku</title>
</head>
<body>
  <p>Redirigint cap a <a href="./Sudoku/">Sudoku acolorit</a>…</p>
</body>
</html>
`;

  await fs.writeFile(path.join(docsDir, 'index.html'), rootIndex, 'utf8');
}

buildPages().catch((error) => {
  console.error('Error generant la carpeta docs:', error);
  process.exitCode = 1;
});
