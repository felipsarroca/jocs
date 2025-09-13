# Joc del Penjat

Aplicació web senzilla del joc del Penjat, en català. No requereix cap servidor ni dependència: només obrir `index.html` en un navegador modern.

**Com jugar**
- A l’inici, escriu la paraula secreta al camp "Paraula secreta" i prem "Inicia".
- Opcional: prem "Prova ràpida" per començar amb una paraula d’exemple.
- Endevina lletres amb el teu teclat o amb el teclat en pantalla.
- Pots utilitzar paraules amb espais i accents. Els accents es normalitzen: encertaràs la lletra encara que no posis l’accent.
- Tens fins a 8 intents erronis; es va dibuixant el penjat a mesura que t’equivoques.
- En guanyar o perdre, apareix una pantalla amb el resultat i l’opció de tornar a jugar.

**Característiques**
- Interfície responsiva amb teclat virtual i indicadors d’estat.
- Accepta lletres amb accents i espais; símbols com guions es revelen automàticament.
- Dibuix del penjat en `canvas` amb progrés visual.
- Celebració amb confeti quan guanyes; resum visual quan perds.
- Millores d’accessibilitat: etiquetes ARIA, elements "sr-only", `aria-live` i diàlegs modal.
- Idioma del document: `lang="ca"`.

**Com executar**
- Opció ràpida: fes doble clic a `index.html` (no cal servidor).
- Opció recomanada en desenvolupament: servir la carpeta amb qualsevol servidor local (per ex., extensió "Live Server" de VS Code, `python -m http.server`, etc.).

**Estructura del projecte**
- `index.html` — Estructura de l’aplicació i capes d’accessibilitat.
- `styles.css` — Estils, paleta i maquetació responsiva.
- `script.js` — Lògica del joc, dibuix en `canvas`, gestió d’events i teclat virtual.
- `assets/cc-by-sa-4.0.svg` — Insígnia de la llicència.

**Personalització ràpida**
- Intents màxims: modifica `MAX_WRONG` a `script.js`.
- Alfabet del teclat: edita `lettersAZ` a `script.js` (per afegir/retocar lletres específiques).
- Missatges i textos: tots els literals es troben a `index.html` i `script.js`.

**Crèdits i llicència**
- Autor: Felip Sarroca (amb assistència de la IA).
- Llicència: Creative Commons BY-SA 4.0. Consulta l’enllaç a `index.html` o https://creativecommons.org/licenses/by-sa/4.0/deed.ca

Gaudeix del joc i, si vols, adapta’l a les teves necessitats!
