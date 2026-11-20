# Registre de canvis

## 2.3.0 · 20 de novembre de 2026

- Rànquing sense podi: una llista amb tots els participants ordenats per punts, medalla per als tres primers, puzles resolts, puzles perfectes (amb el mínim de moviments) i una barra de punts. La fitxa del jugador també mostra els perfectes. Amb empat de punts, passa davant qui té més perfectes.
- Benvinguda més neta: només el logo, el nom i el quadre per escriure el nom de jugador. Al mòbil, el botó «Comença a jugar» va centrat i més separat del quadre.

## 2.2.0 · 20 de novembre de 2026

- El dispositiu recorda el nom de jugador: si el navegador perd la sessió (Safari, navegadors interns de WhatsApp o Classroom…), el joc el recupera sol amb tots els punts. També demana al navegador que no esborri les dades.
- Continuar des d’un altre dispositiu: si el nom ja s’ha fet servir, el joc ho avisa i ofereix «És meu, continua». El jugador es trasllada amb tots els resultats i l’altre dispositiu en queda desvinculat fins que hi torni a continuar. Les regles de Firestore només permeten el trasllat com a còpia exacta, sense duplicats al rànquing.

## 2.1.1 · 20 de novembre de 2026

- Mòbil: la pantalla de joc ocupa tota l’alçada amb més aire entre elements; l’estació creix per omplir l’espai i els botons (Desfer, Reiniciar, Pista, Nou repte) queden a baix en una fila d’icones, a l’abast del polze. Pestanyes sense salts de línia i opcions de vagons més compactes.

## 2.1.0 · 20 de novembre de 2026

- Benvinguda amb el logo que demana el nom de jugador abans de jugar: tothom surt al rànquing. Només es pot jugar sense nom si no hi ha connexió.
- Rànquing redissenyat: capçalera fina, podi com a protagonista i una columna amb la fitxa del jugador (lloc, punts i puzles) i com es puntua.

## 2.0.1 · 20 de novembre de 2026

- Logo i favicon nous, clars i llegibles a 16 px: fons verd, una agulla blanca, la locomotora vermella i un vagó groc.

## 2.0.0 · 20 de novembre de 2026

- Aplicació simplificada: només Jugar, Rànquing i Sobre el joc. Fora la campanya, el repte diari, el laboratori, les sales de classe, la contrarellotge, el progrés local, la fitxa imprimible i el mode projector.
- Rànquing públic nou amb Firebase: nom de jugador únic sense contrasenya, cada puzle sense pistes compta una vegada (10 punts per moviment del mínim, −5 per moviment de més) i els resultats caduquen al cap d’un any. Pòdium, barres de punts, canvi de nom i esborrament.
- Les solucions del rànquing es comproven reproduint-les amb el motor.
- Estètica clara i alegre: cel, gespa, vagons de colors vius i locomotora vermella.
- «Sobre el joc» renovat: origen, regles, què s’hi aprèn, com puntua i xifres de l’estació.

## 1.3.0 · 20 de novembre de 2026

- Arrossegar vagons amb el ratolí o el dit: d’una via a la locomotora per endur-se’ls, o del tren de la locomotora a una via per deixar-los. Les vies de destinació s’il·luminen en verd o en vermell, i un moviment no permès torna enrere amb el motiu.
- En completar el tren, el tauler el mostra uns segons, amb la seqüència de maniobres, abans del resultat. El resultat també inclou la solució del jugador.

## 1.2.0 · 20 de novembre de 2026

- L’estació és la protagonista: el tauler ocupa tota l’alçada disponible i els vagons es veuen unes tres vegades més grans.
- Menú lateral en una barra estreta d’icones; objectiu, moviments, mínim i temps en una franja fina a sobre del tauler.
- Sobre cada plaça de la via A hi ha el vagó que hi ha d’anar; es ressalta en verd quan és al seu lloc.
- Instrucció del pas actual dins del tauler, etiquetes de locomotora i via de maniobra, i tutorial automàtic la primera vegada.
- Dificultat de la partida lliure al botó «Nou repte».

## 1.1.0 · 20 de novembre de 2026

- El meu progrés: experiència, títols, ratxa del repte diari amb un dia de marge setmanal, rècords personals i 17 èxits.
- Es pot tallar el tren tocant directament el vagó o la locomotora; fletxes i Retorn entre les opcions.
- Cada pista resta una estrella possible. Missatges de «gairebé» i de rècord personal en acabar.
- La partida lliure evita els puzles que ja has resolt.
- Sons d’enganxada i xiulet final, breus i sense acumular-se.
- Text per compartir sense revelar el puzle ni la solució.
- Llicència doble: codi AGPLv3 i continguts CC BY-NC-SA 4.0, amb formulari de suggeriments i errors.

## 1.0.0 · 20 de novembre de 2026

- Primera versió de Maniobres, amb motor verificat, set estacions, campanya de 60 nivells i generació de partida lliure.
- Repte diari, rànquing mensual amb caducitat, sales de classe i exportació CSV.
- Disseny ferroviari SVG, tutorial, informació històrica, accessibilitat, impressió amb QR i funcionament sense connexió.
- Revisió crítica i correccions documentades a `docs/revisio.md`.
