# Auditoria del disseny · edició 4

## Dictamen docent

L'edició 2 va obrir la xarxa a 39 ciutats i va donar llibertat per triar ciutats, trens, nits i tornada. L'edició 3 (revisió crítica «Claude 5.0» i contrarevisió) hi va afegir visites de 2 hores, objectius i reptes d'or, una regla única per a la via tallada i panells de sortides per estació. Tenia, però, un inici massa carregat: dos reptes curts amb pedaços perquè quadressin amb l'horari complet, totes les regles explicades de cop, tres bases, tres clients i una revisió entre grups.

L'edició 4 (24-11-2026) aplica tres decisions de Felip:

- **Sense prova prèvia.** L'app s'utilitza des de la primera tanda.
- **Cap grup no revisa la feina d'un altre.** Els grups tenen ritmes i nivells diferents, i la revisió creuada no seria justa. Comprova l'app i valora el docent.
- **Reptes de més fàcils a més difícils, iguals per a tothom.** Nou reptes amb una sola idea nova cadascun, en quatre blocs, i tots els viatges surten de Barcelona.

El mateix dia s'hi van afegir tres decisions més:

- **Fil conductor.** Cada grup porta una oficina de l'agència de viatges Pròxima sortida, que dona nom a l'app. Cada repte és l'encàrrec d'un client amb nom, i la via tallada és la crisi de l'agència.
- **Tres nivells per encàrrec.** Regional (la fita), Exprés i Alta velocitat. Els grups ràpids fan els nivells alts en lloc dels extres.
- **Punts de reputació.** 4.000 punts en total; la nota de grup és punts / 1000. Un nivell fet amb ajuda val la meitat. Maniobres complementa la nota.

La xarxa, les regles, els preus i els horaris no canvien.

## Proves efectuades

El verificador llegeix les taules dels documents 01 i 02 i `reptes.json`, i comprova cada resposta i cada nivell. Resultat de l'execució del 24-11-2026: «tot correcte».

| Comprovació | Resultat |
|---|---|
| Horari | 96 circulacions diàries, 39 estacions i 215 sortides entre parades, amb hores creixents i tarifes positives. 19 salts passen per una estació sense parar-hi i cadascun correspon a un sol recorregut del mapa. |
| R1 a R6 | Cada repte té la resposta del document 02. Les trampes previstes existeixen: a R3, el tren de les 09.05 deixa 5 minuts; a R5, quatre tornades de Lleida no arriben a 2 hores; a R6, hi ha 10 viatges vàlids amb 55 € i el més barat en costa 50. |
| Antics extres X1 a X5 | X1 a 35 €, X2 a 32 €, X3 amb 4 combinacions de ciutats, X4 amb una sola combinació i X5 des de 89 €. X1 i X3 continuen com a nivells Alta velocitat de R4 i R8. |
| Nivells (secció 6) | Els 27 nivells tenen solució i les solucions declarades a `reptes.json` són les òptimes. R8: 58 combinacions de ciutats al Regional, 4 a l'Exprés i 4 a l'Alta velocitat. R9: 155 casos (primer bitllet i tall), amb una reparació mínima d'entre 66 i 86 €. Els punts sumen 4.000. |
| Avaluador de l'app | L'avaluador en JavaScript dona el mateix resultat que el de Python en 2.926 casos (errors, nivells, valors de les preguntes i punts). |
| App al navegador | En mode local: accés amb codi i PIN, R1 (correcte i erroni), R7 amb B-01, R8 obert en lliurar R7, via tallada amb B-01 (avís, preus dels nivells i trens suprimits a la guixeta) i panell docent. Sense errors a la consola. |
| Gran viatge (R7) | Cost mínim de 66 €, tornada més aviat el D2 a les 09.45 i fins a nou visites amb 180 €. 21 testimonis vàlids amb 20 seqüències de ciutats diferents. |
| Millora (R8) | 30 combinacions de ciutats (30.150 viatges) per 80 € o menys, i 35 combinacions (3.059 viatges) tornant el D2 abans de les 18.00. |
| Via tallada (R9) | Els 764 inicis possibles del gran viatge tenen reparació. El document 09 en dona una per a cada primer bitllet i cada tall. |
| Prova individual | Les fitxes A, B i de recuperació tenen una sola condició al límit i les solucions previstes. |
| Organització | Les quatre trobades cobreixen exactament 60, 120, 60 i 120 minuts. La prova individual té 15 minuts reservats. |

## Correccions de l'edició 4

- **Inici graduat.** R1 a R4 introdueixen, d'una en una, la lectura de la guixeta, els trens que no paren, el canvi de 10 minuts i la comparació entre dues opcions. R5 i R6 introdueixen la visita de 2 hores, la nit i el pressupost. Les regles completes no arriben fins al gran viatge.
- **Fora els pedaços.** Desapareixen la pregunta «Trobeu una opció millor?» i l'arribada a les 07.40. La idea de trobar una opció més barata canviant de tren passa al nivell Alta velocitat de R4.
- **Una sola base.** Tots els viatges surten de Barcelona, amb Madrid com a visita obligatòria. Desapareixen les bases de Madrid i Lisboa, els tres clients i les parelles de taules. Els objectius dels clients passen a R8 i els reptes d'or, als nivells alts.
- **Sense revisió entre grups.** Desapareixen l'intercanvi de passaports de la trobada 3 i el criteri 9.4.
- **L'app és l'eina principal.** Té tres parts (encàrrec, guixeta i viatge) i un panell docent. Calcula l'avís de la via tallada: no cal preparar sobres. Es manté el principi que l'app no fa els càlculs per l'alumnat.
- **Menys paper.** El passaport de sis pàgines es substitueix per un full de càlculs. Desapareixen els bitllets de cartolina i els adhesius.
- **Sense codis.** L'alumnat no veu codis d'estació ni de tren: a la guixeta cada tren s'identifica per l'hora de sortida i la destinació final.
- **Criteri 4.1.** Ara es pot acreditar a totes les tandes, perquè l'app s'utilitza sempre.

**Es mantenen de l'edició 3:** les visites de 2 hores, la regla única de la via tallada, la prova individual en versions A i B amb crèdit parcial, el llenguatge planer A2 i els noms sencers de ciutat.

## Límits coneguts

- Una mateixa ruta barata (B-01: 71 € i tornada el D2 a les 17.20) arriba a l'Alta velocitat de R8. Un grup que la trobi a R7 té R8 gairebé fet. És acceptable: R7 premia les ciutats i R8, el preu i l'hora, i el grup ha de calcular igualment les diferències.
- Els nivells es poden fer amb ajuda d'un altre grup que ja els tingui. El docent ho detecta a l'observació i amb el mapa de cada taula; l'app no ho impedeix.
- L'app mostra a la guixeta quins trens passen pel tram tallat. Identificar-los al mapa continua sent la primera tasca de la trobada 4, però la guixeta ho confirma.
- Els viatges barats queden gairebé sempre a l'eix interior: de les 30.150 rutes de 80 € o menys, només 95 passen per la costa. És una propietat de la xarxa, no un error.
- Amb una sola base, dos grups poden fer el mateix viatge. Les respostes obertes, el mapa de cada taula i l'explicació oral permeten distingir qui l'ha construït.
- La reparació més habitual de la via tallada pot ser agafar el mateix tram un altre dia. Per això R9 demana les diferències de preu, d'hora i de percentatge amb el viatge original, i els nivells alts premien la reparació més barata.
- Les bases de Madrid i Lisboa i els seus testimonis es conserven a «0. Antigues propostes\Disseny edició 3 (tres bases)» per si es vol fer una SdA amb reptes diferenciats.

## Què s'ha de mirar a la primera tanda

El temps real de cada bloc, els nivells que es fan amb ajuda, les visites de menys de 2 hores comptades malament, quants grups arriben a cada nivell, els grups que arriben a R9 sense el testimoni i la qualitat de les respostes individuals. Amb aquests indicadors es poden ajustar els blocs i els nivells sense baixar el nivell d'exigència.
