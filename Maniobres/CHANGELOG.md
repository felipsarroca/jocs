# Registre de canvis

## 2.8.3 · 21 de novembre de 2026

- Interruptors de Preferències refets: la bola queda centrada (l’estil general dels camps hi afegia vora i farciment) i llisca amb suavitat.

## 2.8.2 · 21 de novembre de 2026

- Fora el botó «Repta un amic»: l’avís de l’enllaç copiat quedava borrós darrere el diàleg.

## 2.8.1 · 21 de novembre de 2026

- Títol «Maniobres» i icona un 20 % més grans. Al mòbil, la icona creix només a partir de 380 px d’amplada perquè als més estrets no hi cap.

## 2.8.0 · 21 de novembre de 2026

- Resultat nou: el tren format dibuixat, estrelles animades, fitxes amb moviments, mínim, temps i punts, i el lloc al rànquing («Ocupes el 3r lloc: has pujat!»).
- En acabar, la locomotora s’enganxa al tren de la via A i se l’emporta.
- L’objectiu de dalt es mostra amb vagons petits com els del tauler.
- Nou repte amb targetes del color de cada nivell i barres de dificultat.
- Preferències amb interruptors i icones, dreceres de teclat i opció d’instal·lar el joc.
- Decorat discret: andana, edifici de l’estació i arbres.
- Mòbil: vies més separades i estació més gran.
- Pista visual: el vagó que cal moure batega i una fletxa marca el recorregut.
- Botons «sola / 1 vagó…» més discrets; la instrucció es redueix a una línia després de tres partides.
- Repta un amic: comparteix o copia l’enllaç del mateix puzle.
- Rànquing amb pestanyes per nivell. Ordinals corregits (2n, 4t, 5è…).
- Dreceres: Ctrl+Z, P (pista), N (nou repte) i Esc.

## 2.7.0 · 21 de novembre de 2026

- «Com s’hi juga» nou: cinc passos curts, cadascun amb una escena animada de l’estació (el vagó llisca amb el dit a sobre) i una sola frase. Acaba amb una partida de pràctica.
- «Sobre el joc» redissenyat: capçalera petita, les regles en quatre fitxes amb icona, la puntuació en etiquetes de colors, el que s’hi aprèn en xips, l’origen en una línia i les xifres de l’estació. Molt menys text.

## 2.6.0 · 20 de novembre de 2026

- Els vagons llisquen pels rails: en arrossegar-los segueixen el recorregut de la via (també les corbes, girant amb la via) en lloc de volar, i s'aturen en tocar la locomotora o els vagons de la via. Des de la locomotora, el tren entra a la via més propera al dit. L'animació de cada maniobra també segueix els rails.
- Vagons més treballats: bastidor, topalls rodons, enganxall, caixa amb taulons, muntants i ombres. Locomotora nova amb passadís metàl·lic i baranes, cabina, capó amb reixeta, ventiladors i tub d'escapament.
- La palanca de les agulles queda per sota dels vagons que hi passen.

## 2.5.0 · 20 de novembre de 2026

- Estació redibuixada: vies amb balast, travesses de fusta i rails a ample constant també a les corbes (abans les vies A i C s'estrenyien); topalls de final de via vermells i blancs i una palanca d'agulles.
- Vagons nous vistos des de dalt: caixa oberta amb taulons, topalls, enganxalls, rodes i el número en un disc blanc. Locomotora dièsel nova amb cabina, capó amb ventiladors, fars i franges d'avís.
- La locomotora fa una petita sacsejada a cada maniobra, a més del lliscament dels vagons (sense animacions si es demana moviment reduït).
- Corregit: tocar un vagó de la via B seleccionava la via C, perquè la zona de C tapava les agulles. Ara es tria la via més propera al punt tocat.

## 2.4.0 · 20 de novembre de 2026

- Fitxa de cada jugador: toca'l al rànquing i hi veuràs els puzles resolts (dificultat, data, moviments respecte del mínim, temps i punts), el millor temps i la mitjana de moviments de més. El botó ▷ obre el mateix puzle per intentar-lo.
- El rànquing desa el temps de cada partida (només a partir d'aquesta versió).
- Corregit: els perfectes podien sortir com a «undefined» si el navegador conservava una còpia antiga dels fitxers. El service worker ara els baixa sempre de nou en actualitzar-se.

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
