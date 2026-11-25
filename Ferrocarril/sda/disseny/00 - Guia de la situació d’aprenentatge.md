# Pròxima sortida · guia docent

**La SdA i l'app es diuen «Pròxima sortida». Pregunta-títol: «Què hi guanyes i què hi perds quan tries un tren?»** Cada grup porta una oficina de l'agència de viatges en tren Pròxima sortida. Els clients li fan encàrrecs cada vegada més difícils: llegir una sortida, canviar de tren, fer una excursió, organitzar un viatge de quatre dies per 180 € i salvar-lo quan es talla una via. Cada encàrrec ben resolt dona punts de reputació a l'agència, fins a 4.000. Els grups han de demostrar amb horaris i bitllets què hi guanyen i què hi perden.

**Edició de disseny 4 (24-11-2026).** L'edició 2 va obrir la xarxa a 39 ciutats. L'edició 3 hi va afegir les visites de 2 hores, la regla única de la via tallada i els panells de sortides. L'edició 4 ordena els reptes de més fàcil a més difícil, iguals per a tots els grups, fa sortir tots els viatges de Barcelona, treu la revisió entre grups i converteix l'app en l'eina principal des de la primera tanda. El mateix dia s'hi van afegir el fil conductor de l'agència, tres nivells per encàrrec i la puntuació de 4.000 punts. Aquesta carpeta és la referència vigent. Les edicions anteriors són a «0. Antigues propostes».

## Decisions per començar la producció

| Element | Decisió |
|---|---|
| Grup i calendari | 24 alumnes de 1r a 4t d'ESO, sis grups barrejats de quatre (o de tres i cinc si cal), un docent. Dimarts 60 min (45 útils) i dimecres 120 min (105 útils) durant dues setmanes. Cinc tandes, una per grup classe: Alfa, Beta, Gamma, Delta i Èpsilon. Sense prova prèvia. |
| Material de cada grup | Mapa A3 plastificat amb retoladors esborrables, un o dos Chromebooks amb l'app, full de regles i full de càlculs. El grup gestiona el material, el temps i quan lliura cada encàrrec. |
| App | «Pròxima sortida». Tres parts: l'encàrrec, la guixeta per comprar bitllets i la resposta. El panell docent mostra l'estat de cada grup, recalcula els punts i permet marcar ajudes. L'app no fa els càlculs per l'alumnat. |
| Encàrrecs | Nou encàrrecs de clients, iguals per a tothom, en quatre blocs. R1–R4: llegir la guixeta. R5–R6: visites, nits i diners. R7–R8: el gran viatge i la seva millora. R9: la via tallada. Cada encàrrec té tres nivells: Regional (la fita), Exprés i Alta velocitat. Els grups ràpids fan els nivells alts. |
| Regles | 10 minuts per canviar de tren, 2 hores per visitar una ciutat i la nit compta com a visita. El gran viatge surt de Barcelona el dia 1, visita Madrid i dues ciutats més i torna fins al dia 4 a les 21.00, amb 180 €. |
| Avaluació | Nota de grup = punts / 1000 (de 0 a 4). Tots els nivells Regional donen un 2,0 i tots els Alta velocitat, un 4,0. Un nivell fet amb ajuda val la meitat. Nota final: 60 % grup, 30 % prova individual en paper i 10 % observació. El joc Maniobres hi fa de complement. Criteris del Decret 175/2022. Cap grup no revisa la feina d'un altre. |

## Per què funciona a l'aula

Cada encàrrec afegeix una sola idea nova, i les regles arriben quan es necessiten. Quan comença el gran viatge, el grup ja ha llegit sortides, ha vist trens que passen sense parar, ha calculat canvis i ha fet una excursió i un viatge de dos dies. Els blocs mantenen tota la classe junta: qui acaba abans prova els nivells Exprés i Alta velocitat en comptes d'avançar. Així tothom arriba alhora a la via tallada i el docent fa una sola explicació per a tots. Els clients i la reputació donen sentit a cada càlcul: no es calcula un preu perquè sí, sinó perquè la Laia arribi a temps a la reunió.

Totes les dades, els nivells i les respostes es comproven amb el programa de la carpeta `Verificador` (document 06). Cada nivell té solució, el gran viatge té prou llibertat (30 combinacions de ciutats per 80 € o menys) i la via tallada té solució per a qualsevol viatge vàlid.

## Documents de treball

1. [Xarxa i regles](01%20-%20Xarxa%20i%20regles.md). Estacions, eixos, trens que passen sense parar, regles i horari mestre.
2. [Reptes i solucionari docent](02%20-%20Reptes%20i%20solucionari%20docent.md). L'agència, els encàrrecs amb els tres nivells i les solucions, els punts, la via tallada, els testimonis i la prova individual.
3. [Conducció de les quatre trobades](03%20-%20Conducci%C3%B3%20de%20les%20quatre%20trobades.md). Temps, funcions i resposta als imprevistos.
4. [Materials i aplicació](04%20-%20Materials%20i%20aplicaci%C3%B3.md). Peces impreses i especificació de l'app.
5. [Avaluació i seguiment](05%20-%20Avaluaci%C3%B3%20i%20seguiment.md). Marc curricular, rúbrica, observació i recuperació.
6. [Producció i verificació](06%20-%20Producci%C3%B3%20i%20verificaci%C3%B3.md). Verificador, passos de producció i proves de l'app.
7. [Revisió crítica](07%20-%20Revisi%C3%B3%20cr%C3%ADtica.md). Auditoria de l'edició 4 i límits coneguts.
8. [Panells de sortides](08%20-%20Panells%20de%20sortides.md). Dades de la guixeta i del quadern de reserva (generat).
9. [Reparacions de la via tallada](09%20-%20Reparacions%20de%20la%20via%20tallada.md). Una reparació per a cada primer bitllet i cada tall (generat, només per al docent).
10. [Bases de dades](10%20-%20Bases%20de%20dades.md). Dades fixes de l'app, dades de cada tanda a Firestore, permisos, punts i nota.

**Estat (24-11-2026).** L'app «Pròxima sortida» és publicada a https://ja.cat/estaciodetren (codi a `jocs/Ferrocarril`, Firebase `proxima-sortida-cat`), amb el panell docent a `docent.html`. El mapa i tots els fulls impresos són a la carpeta «2. Materials». Falten la revisió i la prova d'impressió dels materials i una prova a l'aula amb sis grups.
