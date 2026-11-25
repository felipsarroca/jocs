# Materials i aplicació

**Cada grup treballa amb un mapa A3 plastificat, un o dos Chromebooks amb l'app «Pròxima sortida» i un full de càlculs.** El mapa serveix per descobrir per on passar i per dibuixar-hi el viatge. L'app té tres parts: l'encàrrec del client, la guixeta on es compren els bitllets i el viatge amb les preguntes. El full de càlculs recull les operacions que el grup fa per respondre. L'app s'utilitza des de la primera tanda.

**Llengua dels materials de l'alumnat.** Llenguatge planer de nivell A2: frases curtes, una instrucció per frase, noms sencers de ciutats i cap codi d'estació ni de tren. Els encàrrecs es diuen R1 a R9 i cadascun té tres nivells: Regional, Exprés i Alta velocitat.

**Noms.** La SdA es diu com l'app, «Pròxima sortida». La pregunta-títol és «Què hi guanyes i què hi perds quan tries un tren?» Els grups porten noms de trens (Talgo, Alvia, Avant, Intercity, Rodalies, Euromed…), que el docent pot canviar en crear la tanda. El logo del mapa i dels fulls és el de l'app.

## Peces que cal produir

**Generades el 24-11-2026** a la carpeta «2. Materials» amb `Verificador/materials.py` (document 06): mapa A3, full de regles, full de càlculs, prova individual, carpeta docent, guia de les quatre trobades i quadern de panells de reserva. Els números surten de les dades: si canvia l'horari o un encàrrec, es tornen a generar. La primera pàgina de la guia de les trobades («Què cal imprimir») diu la mida, les cares i les còpies de cada peça i on cal retallar. Tots els fulls són A4, menys el mapa (A3). Només es retallen les targetes d'accés (sis per full, enganxades, amb línies discontínues) i la prova individual (dues proves A5 per full, amb la línia de les tisores). Els fulls fan servir colors clars, iguals que l'app, i es llegeixen en blanc i negre.

| Peça | Com ha de ser | Quantitat |
|---|---|---|
| Mapa de la xarxa | A3 plastificat amb el logo de l'app. Les 39 ciutats amb el nom sencer i cada eix dibuixat com una successió de trams entre ciutats (és la unitat que es talla a R9). Llegenda amb línies que es distingeixen pel traç i pel nom. El mapa mostra per on passen les línies, però no on para cada tren: això ho diu la guixeta. Si en imprimir-lo no es llegeix bé, fer-lo amb dos A3 que es pleguin per la meitat. | 6 + 1 de reserva. |
| Retoladors i drap | Retoladors esborrables de dos colors (blau per al recorregut, vermell per al tram tallat) i un drap. | 6 lots + 1 de reserva. |
| Full de regles | A4 plastificat amb icones. Anvers: 10 minuts per canviar de tren · 2 hores per visitar una ciutat · la nit compta com a visita · tornada fins al dia 4 a les 21.00 · 180 €. Revers: com es llegeix una sortida a la guixeta, amb un exemple, i la taula de punts de reputació. | 6 + 1 de reserva. |
| Full de càlculs | A4 a doble cara per grup. Un requadre per a cada encàrrec R1–R6 amb espai per a hores, esperes i sumes. Per a R7, R8 i R9, una taula de les ciutats on baixen (arribada, sortida, temps i si és visita) i espai per a la suma, el saldo i les diferències amb el viatge original. | 1 per grup i tanda + reserva. |
| Targeta d'accés | Codi de la tanda, nom del grup i PIN de quatre xifres, nova a cada tanda. L'app la imprimeix des del panell. | 6 per tanda. |
| Prova individual | Mitja pàgina amb l'extracte de la guixeta, la situació i espai per a les operacions i la decisió. Versions A i B alternades per seient i versió de recuperació (document 02). | 60 de la versió A + 60 de la B + 6 de reserva. |
| Quadern de panells de reserva | Panells de sortides de totes les estacions (document 08) amb l'hora de sortida i la destinació final de cada tren. Només per si cau la connexió. | 2. |
| Carpeta docent | Solucionari (document 02), reparacions de la via tallada (document 09), taula de punts i nota, rúbrica de la prova individual i graella d'observació. | 1. |

**Prova de lectura del mapa.** Abans d'imprimir les set còpies, imprimir-ne una a mida real i comprovar des dels quatre costats de la taula que es llegeixen els noms, que es pot seguir un eix quan en creua un altre i que s'identifica cada tram. Comprovar-ho també en blanc i negre.

## L'app «Pròxima sortida»

Codi a `Github/jocs/Ferrocarril`. Funciona amb mòduls estàtics (sense servidor propi) i Firebase. L'estructura de dades i els permisos són al document 10.

### Accés

- **Alumnat (`index.html`).** Codi de la tanda (quatre lletres o xifres), nom del grup triat d'una llista i PIN de quatre xifres. No es demana cap dada personal. Si el grup canvia de Chromebook, reprèn la feina on l'havia deixada.
- **Docent (`docent.html`).** El panell crea la tanda i en genera el codi i els PIN. Cada tanda té els seus grups i les seves dades separades i caduca al cap de 120 dies.

### Les tres parts per a l'alumnat

A dalt, la reputació de l'agència (punts sobre 4.000) i el **carril** dels nou encàrrecs agrupats per blocs. Cada encàrrec mostra si està bloquejat, obert o lliurat i quins nivells té aconseguits.

| Part | Què mostra i què s'hi fa |
|---|---|
| 1 · Encàrrec | El client, el títol, la petició, els tres nivells amb els seus punts i la petició del nivell actiu. Etiquetes curtes amb les regles que s'hi apliquen. A R8 i R9, el viatge original; a R9, l'avís de via tallada. |
| 2 · Guixeta | Triar l'estació (llista alfabètica) i el dia. Es veu el panell de sortides: hora, destinació final i parades. En obrir un tren, cada parada amb l'hora d'arribada i el preu des d'allà, i les ciutats per on passa sense parar. Per comprar, el botó «Compra» de la parada on es baixa. A R9, els trens que passen pel tram tallat aquell dia porten l'etiqueta «Via tallada» i les parades de després del tall surten com a suprimides. |
| 3 · El vostre viatge | Els bitllets comprats (es poden treure d'un en un) i les preguntes del nivell: hores, preus, esperes, temps a cada ciutat, total, saldo o diferències. Botó «Comprova» i, quan el nivell Regional està aconseguit, «Lliura l'encàrrec» (amb confirmació) i «Següent». |

**L'app no fa els càlculs per l'alumnat.** La guixeta dona l'hora i el preu de cada bitllet, però no suma el total ni calcula esperes ni estones de visita. El grup ho calcula al full i ho escriu a les preguntes, i «Comprova» verifica també aquests números. Tampoc no hi ha cap cercador d'itineraris: el grup ha de trobar el camí al mapa i a la guixeta. Aquests càlculs i aquesta cerca són el contingut matemàtic de la SdA, i la prova individual es fa sense l'app.

**Com comprova.** «Comprova» diu si el nivell està aconseguit i dona els punts. Si no, diu el primer problema en llenguatge planer («El viatge ha d'acabar a Figueres», «Es pot fer més barat») sense donar la solució ni els números correctes. Als encàrrecs de millora (R7–R9), diu a quin nivell arriba el viatge i què falta per al següent. Cada comprovació queda registrada com a intent. L'avaluador de l'app és una còpia exacta del verificador del projecte (document 06).

**Encàrrecs oberts i lliurats.** L'encàrrec següent s'obre quan el grup aconsegueix el nivell Regional i el bloc ja és obert. Els blocs s'obren sols el dia de la seva trobada, segons el calendari de la tanda (bloc 1, trobada 1; blocs 2 i 3, trobada 2; bloc 4, trobada 4). Mentre no el lliura, el grup hi pot tornar. Un cop lliurat, l'app en mostra el resum i ja no es pot canviar, tret que el docent el reobri. R8 s'obre quan es lliura R7, i R9, el dia de la trobada 4, quan arriba l'avís de via tallada.

**Via tallada.** Quan arriba l'avís (el dia de la trobada 4), l'app de cada grup calcula el tall a partir del viatge lliurat a R7 (o del testimoni B-01 si no n'hi ha), el mostra i hi afegeix els preus dels nivells Exprés i Alta velocitat. El primer bitllet queda fix.

### Panell docent

- **Entrada del professorat:** botó «Professorat» a la pantalla d'accés de l'app. S'hi entra des de qualsevol aparell amb el codi de la tanda i la contrasenya del professorat, que el docent tria en crear la tanda (es desa en hash). En crear-la, el docent posa les dates de les quatre trobades.
- **Barra de la tanda:** codi, estat del dia (trobada, blocs oberts, data de la trobada següent), calendari editable, «Obrir abans d'hora» per a imprevistos (blocs i via tallada), targetes d'accés per imprimir, manual, exportació CSV i tancament o reobertura de la tanda.
- **Manual del professorat:** `manual.html`, enllaçat des del panell.
- **Graella de seguiment:** una fila per grup i una columna per encàrrec, amb els nivells aconseguits, si està lliurat i si hi ha hagut ajuda, i els punts, la nota i els aparells connectats. Els punts es recalculen a partir dels bitllets i les respostes desats; si no coincideixen amb els del grup, apareix un avís.
- **Detall d'un grup:** PIN, punts de cada encàrrec, caselles «amb ajuda» per nivell (val la meitat), botó «Reobre» per als encàrrecs lliurats, el tall de R9 i el botó per desconnectar els aparells del grup.
- **Exportació:** CSV amb grup, punts i nivells per encàrrec, ajudes, intents i nota de grup, per obrir-lo amb Google Sheets.

### Infraestructura i publicació

Firebase (Firestore amb accés anònim), com Subhasta i Maniobres. Sense configuració de Firebase, l'app funciona en **mode local**: les dades es desen al navegador i serveixen per provar-la. Les dades fixes (horari, encàrrecs, reparacions mínimes de la via tallada i testimoni B-01) es generen amb el verificador a `dades/dades.json`. Per publicar-la falten el projecte de Firebase, l'enllaç curt de ja.cat, la targeta al menú d'edu-apps i el README amb captures.

**Ús al Chromebook.** La interfície s'escala a l'espai útil de la finestra des de la primera obertura. A 1366 × 768 es veuen alhora l'encàrrec, la guixeta i el viatge, amb el botó «Comprova» sempre visible. En pantalles estretes passa a una sola columna amb desplaçament vertical. Comprovat a 1366 × 768, a 1920 × 1080 i en mòbil. Falta comprovar-ho amb escalats del 125 % i el 150 % en un Chromebook real.

**Sense connexió.** Si el tall és curt, Firestore desa la feina al Chromebook i l'envia quan torna la connexió. Si dura, els grups continuen amb el quadern de panells de reserva i el full de càlculs, i després entren els bitllets i les respostes a l'app.

**Control de versió.** Estampar «Ferrocarril · edició 4» i la data de les dades al mapa, al full de regles, al full de càlculs i a l'app (el panell docent mostra la versió de les dades). Durant una tanda no es canvien les dades.
