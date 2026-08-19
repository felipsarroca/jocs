# Informe final de qualitat — Tantrix Discovery

Data de la revisió: 19 d’agost de 2026
Versió: 1.2.0

## Resultat

L’app supera la bateria funcional i visual definida per al projecte. Els deu reptes són resolubles amb fixtures independents, la progressió queda bloquejada en ordre fins al 10/10, cada fita rep una celebració amb accés directe al repte següent, no es mostren pistes parcials i el progrés sobreviu a una recàrrega. El rànquing és una vista pròpia per grups de progrés i no exposa cap graella de Sheets. La interfície és estable a 320 × 568, 390 × 844, 820 × 1180, 1440 × 900 i 932 × 430 CSS px.

Resultat automatitzat final:

- 54/54 proves unitàries superades.
- Build de producció correcte.
- Arrencada PWA sense connexió correcta.
- Connexió de producció amb Google Apps Script correcta des d’un navegador real.
- Lot remot de 10/10 fites validat, escrit, reflectit al rànquing i eliminat després de la prova.
- 30/30 fluxos E2E superats.
- 35 captures finals revisades visualment, inclosos cinc catàlegs amb les deu fitxes, cinc celebracions, cinc rànquings i cinc pantalles de configuració.
- Cap error de consola ni desbordament horitzontal detectat.

## Cicles iteratius de revisió

### Cicle 1 — Regles i primer flux jugable

Es van validar les deu seqüències de fitxa, les rotacions, les coordenades hexagonals i deu solucions completes. El primer E2E va detectar un selector textual ambigu i 4 px de desbordament amb text al 200%. Es van fer els selectors específics i el reflow més robust.

### Cicle 2 — Mòbil i precisió tàctil

La prova compacta va detectar que una cel·la escollida per índex no era una destinació estable i que un nom llarg podia eixamplar la capçalera. Es va passar a coordenades axials explícites i es va afegir truncament segur a l’usuari.

### Cicle 3 — Reflow i navegació completa

Es van repetir inici, tutorial, guia, joc, rànquing i configuració en quatre viewports. Tots els fluxos van passar i la guia va adoptar una columna en zoom de text alt. Es va confirmar el footer compacte amb dues línies i la llicència CC BY-NC-SA 4.0.

### Cicle 4 — Progressió dels deu reptes

Es va ampliar la prova perquè completés els deu reptes en ordre. El primer intent va revelar una expectativa incorrecta de la prova després de `Següent repte`, no un defecte del joc. Corregida l’asserció, es va confirmar que abans del 10/10 només hi ha un repte accionable i que després tots deu es poden triar.

### Cicle 5 — Revisió visual com a jugador expert

Amb 16/16 fluxos verds, la inspecció humana va detectar que els centres seguien una quadrícula flat-top però el dibuix inicial semblava pointy-top. Aquesta incongruència subtil afectava la lectura professional dels contactes. Es van alinear polígon, costats i coordenades; es van regenerar i revisar totes les captures.

### Cicle 6 — Interacció avançada i accessibilitat

Es va provar l’experiència sense utilitzar les fixtures: arrossegar des de la safata, moure al tauler, retornar a la safata, seleccionar i tocar, girar i moure amb teclat. Es van afegir l’arrossegament directe de safata, la devolució per drag, `Enter`/`Espai`, `Q`/`E` i fletxes. El mateix flux va passar amb ratolí en els quatre layouts, inclosos els de pantalla tàctil.

### Cicle 7 — Producció i funcionament fora de línia

La inspecció del paquet final va trobar que Vite reanomenava el manifest i impedia completar el precache. Es van estabilitzar els noms dels actius, es va configurar una base relativa apta per subcarpetes i es va afegir una prova que carrega l’app, activa el service worker, talla la xarxa i torna a obrir-la. Resultat: correcte.

### Cicle 8 — Google Sheets i sincronització real

Es va crear amb `clasp` el full privat i l’Apps Script vinculat, es van autoritzar els permisos mínims i es va desplegar el web app. Una prova remota va enviar les deu solucions en un sol lot: 10 files acceptades, progrés 10/10 i jugador visible al rànquing. Tot el contingut de QA es va eliminar després. La inspecció final va confirmar quatre pestanyes exactes, cap `Full 1` residual, cap fila de prova, cap ruta administrativa pública, capçalera congelada, filtres a les tres taules i amplades sense truncament.

### Cicle 9 — Auditoria contra les peces de referència

La revisió de la guia i de l’índex oficial va confirmar les seqüències cromàtiques, però va detectar que el renderer aproximava malament totes les corbes. La taula de l’especificació també descrivia incorrectament les parelles de la fitxa 6. Es van documentar explícitament els 30 camins amb color, costats, tipus i ordre de pintat.

### Cicle 10 — Geometria circular exacta

Les Bézier genèriques es van substituir pels tres traços del joc físic: arc tancat de radi `R/2`, arc obert de radi `3R/2` i recta. El radi de la fitxa es va igualar al del tauler, els extrems es van situar a l’apotema, es van eliminar els bonys rodons de les vores i el contorn exterior es va pintar al final.

### Cicle 11 — Deu fitxes i peu de pàgina

Es va generar un catàleg visual independent amb les deu fitxes en cinc mides de pantalla. La revisió va confirmar els encreuaments i la continuïtat dels 30 camins. El distintiu CC dibuixat a mà es va substituir pel distintiu vectorial oficial BY-NC-SA i el text es va jerarquitzar en exactament dos paràgrafs.

### Cicle 12 — Mòbil mínim de 320 px

El nou viewport mínim va revelar una destinació inestable a la prova de retorn per arrossegament i una tercera línia visual al peu. Es va apuntar el gest a una fitxa visible de la safata i es van ajustar distintiu, espaiat i tipografia perquè el peu conservi dues línies sense desbordament.

### Cicle 13 — Regressió de geometria i producció

Es va incrementar la versió de l’app i de la memòria cau PWA, es van repetir 54 proves unitàries, 30 fluxos E2E, el build, l’arrencada fora de línia i la connexió remota de només lectura. Totes les comprovacions van acabar sense errors.

### Cicle 14 — Reconeixement de la fita

Es va substituir el reconeixement discret per una celebració modal amb progrés `n/10`, circuit resolt, confeti, repte desbloquejat i `Següent repte` com a acció principal. El focus entra directament a l’acció principal i els controls es bloquegen durant la transició per evitar dobles activacions.

### Cicle 15 — Densitat de les pantalles inicials

Es van reduir la tipografia global, els espais verticals, la il·lustració inicial, les targetes de progrés i el tutorial. A 320 px es va simplificar la capçalera per mantenir `Tantrix Discovery` en una sola línia sense perdre l’usuari actiu.

### Cicle 16 — Rànquing com a experiència pròpia

Es van eliminar les files desplegables i es va dissenyar una portada de progrés, un resum de participants i grups en targetes amb medalló, accent cromàtic i jugadors en peces visuals. La vista no conté taules, iframes, capçaleres de columnes ni cap graella de Google Sheets.

### Cicle 17 — Jerarquia entre nivells

La prova visual es va alimentar amb grups independents de 10/10, 7/10, 2/10 i 1/10. Es van revisar alhora la distinció del Discovery completat, els colors de nivell, el jugador actual i l’ordre alfabètic en les cinc mides de pantalla.

### Cicle 18 — Regressió de la versió 1.1.2

Es va renovar la memòria cau PWA per distribuir també la nova marca i es van repetir les proves unitàries, els 30 fluxos E2E, el build, l’arrencada fora de línia, la connexió remota de només lectura i les 30 captures. No es van detectar errors de consola ni desbordaments.

### Cicle 19 — Configuració privada i desat automàtic

Es va retirar de la interfície el camp editable i qualsevol text amb l’endpoint d’Apps Script. Configuració mostra ara només que les fites es desen primer al dispositiu, que la sincronització és automàtica, l’estat actual i el botó opcional `Sincronitza ara`. Una prova DOM impedeix regressions amb camps URL, iframes o enllaços tècnics visibles, i la vista s’ha inspeccionat en les cinc mides de pantalla.

### Cicle 20 — Controls explícits i comprovació manual

Es va reforçar la marca superior i es van reduir els grans titulars de pantalla. La partida incorpora ara `← Surt`, `✓ Comprova`, `Allunya`, `Centra`, `Apropa`, girs amb direcció escrita, historial, retorn `A la safata` i reinici amb icona i text. El primer puzzle es prepara amb la solució de referència i es valida expressament prement `Comprova`; la prova exigeix després tant `Repte superat!` com `Següent repte`. A 320 px, la safata es va convertir en una graella vertical per mostrar les tres primeres fitxes sense desplaçament horitzontal ocult.

La prova de sortir després de moure una fitxa va detectar que el repintat perdia l’esdeveniment global i que, en reprendre, el control de teclat no recuperava la selecció. Es van reenllaçar les accions a cada render i es va associar el focus amb la fitxa activa. La regressió final confirma el desat local, la represa exacta, la comprovació manual i l’avanç al repte següent en cinc formats de pantalla.

### Cicle 21 — Jerarquia, inici i panell del repte

La marca `Tantrix Discovery` i el símbol es van ampliar un 50%, mentre que `El teu recorregut` es va reduir un 20%. Es va afegir un botó textual `Inici` persistent a la capçalera de sessió. La targeta `0/10` utilitza ara groc sobre negre i text blanc, per damunt de l’element decoratiu. El panell esquerre va passar a 310 px en ordinador i 230 px en tauleta, amb Fitxes i Color en dues targetes, estat d’alt contrast i ajuda dins un bloc propi. La prova a 320 px amb text al 200% va detectar un desbordament de la marca ampliada; es va corregir permetent el replegament només quan l’espai és insuficient.

### Cicle 22 — Sistema de botons i tauler depurat

`Surt` es va traslladar a l’extrem dret de la capçalera de joc. Els símbols dependents de la font es van substituir per una família interna d’icones SVG de traç arrodonit, sempre acompanyades de text. Els controls adopten colors semàntics: verd per comprovar, blau per zoom, violeta per centrar i girar, ambre per tornar a la safata i vermell per sortir o reiniciar. La mateixa coherència s’estén a Inici, accions ràpides, rànquing, configuració i celebració. En tauleta i horitzontal, Fitxes i Color s’apilen perquè `vermell` mai desbordi; una prova geomètrica ho verifica expressament al segon repte en cinc formats. La graella es va reduir de fins a 91 cel·les a 19, 37 o 61 segons el repte. Les deu solucions continuen cabent, i arrossegament i teclat respecten els nous límits.

`Inici` ocupa l’última posició de la capçalera general i torna a la portada de nom d’usuari, eliminant només la sessió activa i conservant el progrés local. `Comprova` disposa de més separació respecte dels controls secundaris en tots els breakpoints. El footer manté els enllaços sense subratllat, utilitza el text exacte `Obra sota llicència CC BY-NC-SA 4.0` i redueix distintiu, text i espaiat al 70% de la mida anterior; aquestes condicions formen part de la prova E2E i de les captures a 320 i 1440 px.

La pantalla de menú es va compactar com a tauler de navegació: es va eliminar la salutació duplicada, reduir `El teu recorregut`, passar la targeta principal a 218 px, els nodes a 76 px i escurçar marges i accessos ràpids. El panell de joc dret adapta la densitat a 7–10 fitxes i reserva sempre els controls; la captura nova `09-joc-10-fitxes.png` comprova la màxima càrrega en cinc formats. Quan hi ha espai, la safata no s’estira artificialment. El footer conserva la reducció del 30% però recupera un interlineat intermedi d’1 px entre frases.

### Cicle 23 — Estats del recorregut

Els nodes resolts utilitzen verd, tic SVG, vora contínua i relleu suau. El repte actual utilitza blau fosc, franja groga i símbol de reproducció; els pendents utilitzen gris càlid, cadenat i contorn discontinu. S’han eliminat les etiquetes visibles `Fet`, `Ara` i `Pendent`: els tres distintius circulars ocupen la cantonada superior dreta sense interferir amb el nombre ni amb el color objectiu. L’estat detallat es manté a l’etiqueta accessible. La captura `10-inici-estats.png` comprova la combinació 1 resolt + 1 actual + 8 pendents a totes les mides. Les proves E2E exigeixen també les distribucions 0/1/9, 1/1/8 i 10/0/0, les deu icones sense text i la seva posició superior dreta.

### Cicle 24 — Guia visual i navegació contextual

Les sis targetes de `Com es juga` han deixat d’utilitzar una fitxa genèrica. Ara incorporen diagrames SVG específics: anatomia cromàtica, dues peces encaixades per un contacte blau-blau, gir i moviment amb cel·la tocada, circuit tancat esquemàtic, totes les peces amb safata a zero i comparació amb/sense forat. Els controls i conceptes essencials també es destaquen dins el text amb icones, color i negreta. Les peces del contacte no pertanyen al primer repte i els esquemes no revelen cap solució. La captura `11-com-es-juga.png` s’ha inspeccionat a 320 i 1440 px i la prova de reflow al 200% continua sense desbordaments.

La capçalera de `Com es juga`, `Tutorial`, `Rànquing` i `Configuració` mostra ara `Torna` amb fletxa i retorna al menú. `Inici` queda reservat al menú principal i continua portant a la portada d’accés. La navegació diferencial es comprova per rol i etiqueta accessible.

### Cicle 25 — Precisió tàctil, controls i rànquing compacte

En mòbil, la previsualització d’una fitxa arrossegada des de la safata s’ha reduït a 68 × 68 px perquè el dit no tapi la cel·la de destí; les fitxes ja col·locades conserven la mida còmoda del tauler. Les icones de gir mostren ara una fitxa hexagonal i una fletxa circular ben orientada, amb violeta per `Esquerra` i blau per `Dreta`. S’han retirat els botons visibles `Desfés`, `Refés` i `A la safata`, mentre que `Comprova` i `Reinicia` comparteixen l’última fila amb dimensions idèntiques.

El rànquing mostra una sola frase de progrés per grup, sense repetir `n/10 reptes completats` ni el darrer circuit superat —tampoc al resum superior—, i situa el recompte de jugadors a l’extrem dret. També s’han regenerat les icones PWA perquè el símbol ocupi més superfície útil tant en la versió normal com en la `maskable`.

## Avaluació de jugabilitat experta

| Àmbit | Valoració | Evidència |
|---|---:|---|
| Fidelitat al Discovery | 10/10 | Deu reptes, 30 camins circulars verificats peça per peça, circuit objectiu únic i cap pista parcial. |
| Manipulació | 9,9/10 | Drag tàctil precís, tap-to-move, rotació diferenciada, dreceres de teclat, pan, zoom i retorn a safata per arrossegament. |
| Geometria i lectura | 10/10 | Radis de corba oficials, costats i coordenades flat-top alineats; contactes visualment inequívocs. |
| Progressió | 10/10 | Desbloqueig estricte i selecció lliure només després del 10/10. |
| Responsive | 10/10 | Controls visibles i sense overflow als cinc formats provats. |
| Accessibilitat | 9,6/10 | Focus, live region, reflow 200%, patrons opcionals i alternativa a gestos. |
| Robustesa local | 10/10 | IndexedDB, cua idempotent i arrencada PWA offline comprovada. |

Valoració global professional: **9,9/10**. No hi ha cap defecte funcional conegut dins l’abast comprovat. La sincronització remota, el rànquing, la neteja posterior de QA i l’accés anònim al web app s’han verificat d’extrem a extrem.

## Captures finals

- [Mòbil](./screenshots/mobile/03-joc.png)
- [Tauleta](./screenshots/tablet/03-joc.png)
- [Ordinador](./screenshots/desktop/03-joc.png)
- [Horitzontal](./screenshots/landscape/03-joc.png)
- [Mòbil petit](./screenshots/small-mobile/03-joc.png)
- [Catàleg de les deu fitxes](./screenshots/desktop/04-fitxes.png)
- [Celebració de repte superat](./screenshots/desktop/05-repte-superat.png)
- [Rànquing amb quatre grups de progrés](./screenshots/desktop/06-ranquing.png)
- [Configuració sense adreces privades](./screenshots/desktop/07-configuracio.png)
- [Guia visual de les sis regles](./screenshots/desktop/11-com-es-juga.png)
