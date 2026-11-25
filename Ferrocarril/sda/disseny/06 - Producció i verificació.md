# Producció i verificació de la SdA

Les dades del joc (document 01), els encàrrecs amb els nivells i les solucions (document 02), la conducció (document 03) i l'avaluació (document 05) estan tancats. Els documents 08 (panells de sortides) i 09 (reparacions de la via tallada) es generen automàticament. No es fa cap prova prèvia amb alumnat: l'app s'utilitza des de la primera tanda.

## Verificador del projecte

La carpeta `Verificador` conté els programes en Python que comproven les dades i generen les de l'app. Llegeixen el document 01 (horari i preus), el document 02 (testimonis i prova individual) i `reptes.json`, que és la font única dels encàrrecs: textos, nivells, condicions, preguntes i punts.

- `python comprova.py` (uns 20 segons) comprova l'horari, els testimonis, les respostes de R1 a R6, les tres fitxes de la prova individual, els llindars de R8 i la regla de la via tallada sobre tots els inicis possibles del gran viatge. La secció 6 comprova amb l'avaluador de l'app que cada nivell de cada encàrrec té solució, que les solucions declarades són les correctes i que els punts sumen 4.000. Acaba amb «tot correcte» o amb la llista d'errors.
- `python genera.py` torna a escriure els documents 08 i 09.
- `python exporta.py` escriu les dades de l'app (`dades/dades.json`) i els casos de prova (`proves/vectors.json`) a `Github/jocs/Ferrocarril`.
- `node proves/prova-avaluador.mjs`, a la carpeta de l'app, comprova que l'avaluador de l'app dona el mateix resultat que el del verificador en tots els casos de prova.
- `python materials.py` (un minut) escriu els set PDF de la carpeta «2. Materials»: mapa, full de regles, full de càlculs, prova individual, carpeta docent, guia de les trobades i quadern de panells de reserva. Els horaris, els preus, els punts i les solucions de la prova surten de les dades; els textos de la guia i del solucionari, dels documents 02, 03 i 05. Amb `python materials.py mapa` es refà una sola peça.

Qualsevol canvi a l'horari, als preus o als encàrrecs es fa al document 01 o a `reptes.json`, i s'hi passen les cinc ordres, per aquest ordre, abans d'imprimir res o de publicar l'app.

## Feina que cal fer abans de la primera tanda

| Pas | Responsable i dedicació | Què cal fer | Quan està acabat |
|---|---|---|---|
| 1. Noms | Docent, en una conversa | La SdA i l'app es diuen «Pròxima sortida». Pregunta-títol: «Què hi guanyes i què hi perds quan tries un tren?» Grups amb noms de trens. | Fet el 24-11-2026. |
| 2. Mapa | Docent, 1 h | Fet el 24-11-2026 (`mapa.py`): 39 ciutats en posició geogràfica aproximada, 45 trams dibuixats a partir dels eixos del document 01 (els trams compartits, amb dues línies paral·leles), llegenda i logo. Falta la prova de lectura a mida real i en blanc i negre. | Prova de lectura feta. |
| 3. Fulls impresos | Docent, 1 h de revisió | Fets el 24-11-2026 (`materials.py`): full de regles, full de càlculs, prova individual A, B i de recuperació, carpeta docent (solucionari, prova, rúbrica i graella d'observació), guia d'una cara per trobada i quadern de panells de reserva. Falta que el docent els revisi i n'imprimeixi un lot de prova. Les targetes d'accés les imprimeix l'app. | Un lot complet imprès. |
| 4. App | Claude amb el docent | Fet en mode local (24-11-2026): app de l'alumnat, panell docent, avaluador idèntic al verificador i regles de Firestore. Falta crear el projecte de Firebase, provar-la amb sis grups alhora i publicar-la. | Superació de totes les proves de la taula següent. |
| 5. Fabricació | Docent, 2 h | Imprimir i plastificar mapes i fulls de regles, preparar retoladors i drap, imprimir els fulls de càlculs i les proves i preparar els dos quaderns de reserva. | Material de la taula del document 04 a punt. |

**Dedicació docent prevista: unes 4 hores** (revisió dels fulls, prova de lectura del mapa i fabricació), a més de la tria de noms. **Feina per tanda:** 10 minuts per obrir la tanda i imprimir les targetes d'accés, 5 minuts entre les trobades 3 i 4 per comprovar que tothom ha lliurat R7 i 45–60 minuts per corregir les 24 proves individuals. La nota de grup surt del CSV de punts.

## Proves de l'app abans de publicar-la

Les faig mentre programo l'app, amb grups de prova i sense alumnat. La columna «Estat» recull el que ja s'ha comprovat (24-11-2026).

| Cas | Resultat esperat | Estat |
|---|---|---|
| Avaluador | L'avaluador de l'app dona el mateix resultat que el del verificador en els 2.926 casos de `proves/vectors.json`: errors, nivell, valors de les preguntes i punts. | Fet. |
| Guixeta | Cada parada del document 01 apareix al panell de la seva estació amb l'hora i el preu correctes. Els 19 trams sense parar es mostren. No hi ha cap cercador d'itineraris. La guixeta no mostra cap total, espera ni estona de visita. | Pendent de revisar estació per estació. |
| R1 a R6 | L'app accepta les solucions del document 02, nivell per nivell, i rebutja les trampes: el tren de les 09.05 a Tarragona (5 minuts), les tornades de Lleida de menys de 2 hores i un viatge de R6 de més de 55 €. | Fet amb l'avaluador; al navegador, R1. |
| Regles al límit | Acceptar 10 minuts de canvi, 120 minuts de visita, 180 € i tornada el D4 a les 21.00. Rebutjar 9 minuts, 119 minuts (és un canvi, no una visita), 181 € i el D4 a les 21.01. Una nit compta com a visita. Passar assegut per una ciutat no la visita. | Fet amb l'avaluador. |
| Càlculs del grup | Si el grup escriu un total, una espera o una estona de visita equivocats, «Comprova» ho assenyala encara que el viatge sigui vàlid. | Fet. |
| Gran viatge | Acceptar viatges diferents que compleixen les regles, encara que no siguin al catàleg. Rebutjar un viatge sense Madrid o amb Barcelona com a visita. Dir a quin nivell arriba i què falta per al següent. | Fet amb B-01 al navegador. |
| Via tallada | Per a un viatge donat, l'avís és el primer tram del mapa que recorre el segon tren, el dia d'aquest tren, en tots dos sentits. A la guixeta, els trens que hi passen aquell dia, també sense parar, porten l'etiqueta «Via tallada» i no es poden comprar més enllà del tall. El primer bitllet queda fix. Els preus dels nivells Exprés i Alta velocitat surten del cas de cada grup. | Fet amb B-01; falta provar-ne més casos al navegador. |
| Panell docent | Sis grups alhora en una tanda de prova. Obrir un bloc, activar la via tallada, marcar «amb ajuda», reobrir un encàrrec, imprimir les targetes i exportar el CSV. Els punts del panell coincideixen amb els del grup. | Fet en mode local amb un grup; falta amb sis grups i Firebase. |
| Accés i continuïtat | Entrar amb el codi, el nom i el PIN, tancar i reprendre en un altre Chromebook. Un PIN equivocat no entra. Dues tandes no es barregen. | Fet en mode local; falta amb Firebase. |
| Permisos | Un grup no pot llegir ni modificar la feina d'un altre, ni obrir blocs, ni canviar les ajudes. Un encàrrec lliurat no es pot tocar. | Fet amb l'emulador de Firestore (`firebase/prova-regles.mjs`, 57 casos correctes). La prova va trobar que un aparell que sortia i tornava a entrar al mateix grup quedava bloquejat amb el missatge de PIN incorrecte; corregit a `js/agencia.js`. |
| Pantalla | 1366 × 768 amb escalats del 100 %, el 125 % i el 150 %, pantalla gran i zoom de l'usuari, sense retalls ni desplaçament horitzontal. Navegació per teclat i contrast suficient. | 1366 × 768, 1920 × 1080 i mòbil fets; falten els escalats en un Chromebook. |
| Sense connexió | Tallar internet a mig encàrrec: l'app no perd el que ja estava desat i ho envia en tornar la connexió. | Pendent: Firebase. |

## Després de la primera tanda

Anotar quants minuts necessita cada grup per a cada encàrrec, quants nivells es fan amb ajuda, quantes visites de menys de 2 hores es compten malament, quants grups arriben a cada nivell i quants arriben a R9 sense el testimoni. El CSV del panell dona els punts i els intents. Si més de dos grups no aconsegueixen el Regional d'un bloc a temps, escurçar-lo. Si quatre grups fan tots els nivells d'un bloc molt abans, afegir-hi un encàrrec o endurir un nivell Alta velocitat a `reptes.json`. Registrar els canvis entre tandes i compensar els grups afectats per una errada del material.
