# Maniobres

- Puzle ferroviari Inglenook en català (PWA estàtica, sense compilació), publicat a https://ja.cat/maniobres. Llegeix el README i `docs/revisio.md`.
- Des de la 2.0 només hi ha Jugar, Rànquing i Sobre el joc: Felip va demanar simplificar-la (fora campanya, diari, laboratori, aula, contrarellotge, progrés, fitxa i projector). No hi tornis a afegir modalitats sense que ho demani.
- Rànquing: Firebase `maniobres-cat` (compte personal de Felip, Firestore eur3, accés anònim). `src/ranking.js` és el client; les regles són a `firebase/firestore.rules` (`firebase deploy --only firestore:rules --project maniobres-cat` des de `firebase/`). Nom únic sense contrasenya; el dispositiu el recorda (`maniobres-me`) i es pot continuar des d’un altre dispositiu amb avís (`claim()`: el jugador es trasllada amb una còpia exacta, a petició de Felip a la 2.2; qualsevol pot prendre un nom, risc acceptat); cada puzle clàssic compta una vegada, sense pistes; resultats caducats al cap d'un any. El rànquing és una llista de tots els participants (Felip va descartar el podi a la 2.3), amb puzles i perfectes. Qui llegeix el rànquing reprodueix les solucions al Worker (`verify`) i calcula els punts amb `score()` del motor.
- Els identificadors de puzle del rànquing són la clau canònica de la posició inicial (`v1-classic-<clau>`): no canviïs la codificació de `key()` sense migrar els resultats.
- Estètica clara (cel, gespa, vagons de colors vius): Felip va trobar la versió fosca «molt fosca i trista» (2.0).
- L’estació (SVG) és la protagonista: Felip va rebutjar un tauler petit envoltat de columnes i títols (1.1). El tauler ocupa tota l’alçada restant; objectiu i xifres van en una franja fina, i el menú és una barra d’icones.
- Pantalla: a 1366 × 768 el joc no ha de fer desplaçament vertical; comprova també 1920 × 1080, escalat del 125 % i mòbil (390 px).
- Llicència doble dins del codi: SPDX AGPL-3.0-or-later a cada fitxer propi; `LICENSE` amb continguts CC BY-NC-SA 4.0; formulari `.github/ISSUE_TEMPLATE/maniobres.yml`.
- A cada canvi de recursos, incrementa `CACHE` a `sw.js` i la versió a `package.json`, `CHANGELOG.md` i «Sobre el joc», i comprova que la versió publicada és la nova.
- Proves: `npm test`; amb `npm run serve` en marxa, `node tests/browser.mjs` i `node tests/flows.mjs` (Playwright a `%LOCALAPPDATA%\maniobres-test-tools`).
