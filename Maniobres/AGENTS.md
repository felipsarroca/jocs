# Maniobres

- Puzle ferroviari Inglenook en català (PWA estàtica, sense compilació), publicat a https://ja.cat/maniobres. Llegeix el README i `docs/revisio.md`.
- El motor (`src/engine.js`) és compartit amb l'Edge Function de Supabase (projecte «Maniobres», `zcwsqrgxoxvjbvpulroq`). Si canvien les regles, cal regenerar les taules (`npm run generate`), mantenir els identificadors publicats i tornar a desplegar la funció.
- El progrés (`src/progress.js`: experiència, títols, ratxa i èxits) és només local i no entra al rànquing.
- Pantalla: a 1366 × 768 el joc no ha de fer desplaçament vertical; comprova també 1920 × 1080, escalat del 125 % i mòbil (390 px).
- Llicència doble dins del codi: SPDX AGPL-3.0-or-later a cada fitxer propi; `LICENSE` amb continguts CC BY-NC-SA 4.0; formulari `.github/ISSUE_TEMPLATE/maniobres.yml`.
- A cada canvi de recursos, incrementa `CACHE` a `sw.js` i la versió a `package.json`, `CHANGELOG.md` i «Sobre el joc», i comprova que la versió publicada és la nova.
- Proves: `npm test`; amb `npm run serve` en marxa, `node tests/browser.mjs` i `node tests/flows.mjs` (Playwright a `%LOCALAPPDATA%\maniobres-test-tools`).
