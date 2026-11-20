# Document de disseny del joc de maniobres (Inglenook)

**20 nov 2026 · @Felip Sarroca i Gil**  
**Origen:** [Artefacte de Claude](https://claude.ai/artifact/YSfx8ZCEk3ZzbeKZ3Krpnm#a7edd7d0-b74e)

Joc web gratuït, en català i de codi obert, basat en el puzle de maniobres Inglenook Sidings: cal formar un tren de 5 vagons en un ordre concret dins d'una estació amb vies curtes. Funciona al navegador i al mòbil sense instal·lar res, es pot jugar sol o en classe, i és la peça central de la SdA ferroviària.

## Visió del joc

**Què és:** un puzle de lògica amb regles molt simples i una dificultat real, perquè l'espai és limitat. Cada partida és diferent i el joc sempre sap quin és el mínim de moviments possible.

**Per a qui:** alumnat d'ESO (de 1r a 4t) com a públic principal; també famílies i aficionats al modelisme.

**Propostes de nom (cal triar-ne un):**

- **Agulles:** en català ferroviari, les agulles són la part mòbil del desviament. Curt, propi i fàcil de recordar.
- **Via Morta:** el nom de les vies sense sortida on es deixen els vagons.
- **Maniobra!:** directe, s'entén en català, castellà i anglès.

**Principis de disseny:**

1. **Un minut per aprendre, mesos per dominar.** Les normes caben en tres frases; el mínim de moviments sempre és un repte.
2. **El joc no enganya.** Cada partida té solució i el joc ho garanteix; el resultat es compara amb el mínim real.
3. **Partides curtes.** Una partida dura de 2 a 5 minuts, perfecte per encadenar-ne «només una més».
4. **Addictiu però ètic.** Recompenses, rànquings i ratxes, sense compres, sense anuncis ni notificacions.
5. **Pensat per a l'aula.** Mode classe, dades exportables i versió imprimible dels mateixos puzles.

## Normes del joc

Una partida es guanya quan la via llarga conté exactament els 5 vagons demanats, en l'ordre demanat. Es puntua pel nombre de moviments.

**L'estació clàssica:**

| Element | Capacitat | Funció |
| --- | --- | --- |
| Via de maniobra | 3 vagons + locomotora | Per on es mou la locomotora; connecta amb les tres vies |
| Via A (llarga) | 5 vagons | On s'ha de formar el tren final |
| Via B | 3 vagons | Via auxiliar |
| Via C | 3 vagons | Via auxiliar |

**Inici:** 8 vagons numerats repartits a l'atzar entre les vies A, B i C. El joc sorteja el tren objectiu: 5 dels 8 vagons, en un ordre concret.

**Què és un moviment:** la locomotora entra en una via empenyent els vagons que porta enganxats, hi deixa els que vulgui i en surt arrossegant els que vulgui, fins a un màxim de 3. Entrar en una via i tornar a sortir compta com a 1 moviment.

**Normes:**

1. Cap via pot superar la seva capacitat.
2. La locomotora no pot portar més de 3 vagons enganxats, perquè a la via de maniobra no n'hi caben més.
3. Només es poden agafar els vagons que queden més a prop del desviament: els del fons queden atrapats darrere dels altres.
4. Els vagons que no formen part del tren poden quedar en qualsevol lloc.

**Vocabulari del joc:** locomotora, vagó, via de maniobra, vies A, B i C, desviament (agulles), enganxar, desenganxar, tren objectiu, mínim (el nombre de moviments de la millor solució possible).

**Notació de moviments** (es mostra a l'historial i es pot fer servir a classe): B2 vol dir «entra a la via B i surt amb 2 vagons». Una partida sencera es pot escriure com una seqüència: C3 · A0 · B1 · …

## Base de dades de combinacions

El joc clàssic té uns 2.700 milions de partides diferents, i totes tenen solució: ho he comprovat per ordinador, calculant el mínim de moviments de totes les situacions possibles. El mínim va de 0 a 17 moviments, amb una mitjana d'11,5.

**D'on surt la xifra:** hi ha 403.200 maneres de col·locar els 8 vagons a les vies (8! × 10 repartiments) i 6.720 trens objectiu possibles (8 × 7 × 6 × 5 × 4). En total, 403.200 × 6.720 = 2.709.504.000 partides.

**Per què és fàcil de gestionar:** la dificultat només depèn de la posició dels 5 vagons del tren, no del número que porten. Els altres 3 vagons són intercanviables. Això redueix el problema a 356.160 estats possibles de l'estació, i un sol càlcul dona el mínim de moviments de tots. Es pot desar en un fitxer d'uns 350 kB o calcular directament al navegador.

**Classes de dificultat** (sobre les 67.200 situacions inicials diferents del joc clàssic):

| Nivell | Mínim de moviments | Situacions | Percentatge | Ús al joc |
| --- | ---: | ---: | ---: | --- |
| Fàcil | 0–8 | 5.342 | 7,9 % | Tutorial i primers nivells |
| Mitjà | 9–12 | 38.578 | 57,4 % | Partida estàndard |
| Difícil | 13–15 | 22.536 | 33,5 % | Campanya avançada |
| Expert | 16–17 | 744 | 1,1 % | Reptes especials i èxits |

Només 32 situacions inicials necessiten 17 moviments: són candidates perfectes a «els puzles més difícils del món» dins del joc.

**Variants d'estació** (per al mode Laboratori i la SdA). Percentatge de situacions inicials que tenen solució:

| Estació (A-B-C) | Via de maniobra | Vagons | Tren | Amb solució | Mínim màxim | Mínim mitjà |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 3-2-2 | 2 | 5 | 3 | 100 % | 12 | 7,5 |
| 4-3-3 | 3 | 7 | 4 | 100 % | 12 | 8,4 |
| 5-3-3 (clàssica) | 3 | 8 | 5 | 100 % | 17 | 11,5 |
| 5-3-3 | 2 | 8 | 5 | 12,5 % | 19 | 11,9 |
| 5-3-2 | 3 | 8 | 5 | 12,5 % | 14 | 9,3 |
| 5-2-2 | 3 | 7 | 5 | 14,3 % | 12 | 8,2 |
| 4-2-2 | 2 | 6 | 4 | 16,7 % | 12 | 7,5 |

La conclusió és molt útil per a la SdA: l'estació clàssica està just al límit. Si s'escurça una sola via o la via de maniobra, de cop la majoria de partides deixen de tenir solució.

**Com es guarda cada partida:** una llavor (un número) que genera sempre la mateixa posició inicial i el mateix tren. Així el repte diari, els nivells de la campanya i els puzles impresos són reproduïbles i ocupen molt poc.

**Nota:** aquestes xifres s'han calculat amb la definició de moviment d'aquest document. Caldrà tornar-les a validar amb el codi definitiu del joc.

## Modes de joc

El joc té vuit modes, i l'ordre de la taula és el d'implementació recomanat: els tres primers ja fan un joc complet.

| Mode | Què és | Per què enganxa | Versió |
| --- | --- | --- | --- |
| Tutorial | 5 pantalles guiades amb 2, 3 i 4 vagons fins al puzle clàssic | Ningú no queda perdut en el primer minut | v0.1 |
| Partida lliure | Puzle a l'atzar del nivell triat (Fàcil, Mitjà, Difícil, Expert) | Infinites partides; sempre es veu el mínim | v0.1 |
| Campanya | 60 nivells en 6 «línies» de 10, de dificultat creixent, amb estrelles | Progrés visible i desbloquejos | v0.2 |
| Repte diari | El mateix puzle per a tothom cada dia, generat per la data | Hàbit diari, ratxes i comparació amb els amics, com el Wordle | v0.3 |
| Contrarellotge | Tants puzles Fàcils i Mitjans com es puguin resoldre en 5 minuts | Ritme i rejugabilitat | v0.3 |
| Laboratori | Editor d'estacions: canviar la llargada de les vies, el nombre de vagons i el tren | El joc diu si l'estació sempre té solució; enllaça amb la sessió 4 de la SdA | v0.4 |
| Mode classe | El docent crea un codi; la classe juga els mateixos puzles i veu el seu rànquing | Competició sana dins el grup | v1.0 |
| Duel | Dos jugadors, el mateix puzle alhora; guanya qui ho fa amb menys moviments | Repte directe entre companys | v1.x |

**La campanya per línies** (els noms són una proposta i es poden canviar):

1. Línia d'aprenentatge: menys vagons i vies més llargues.
2. Línia clàssica: l'estació 5-3-3, nivells Fàcil i Mitjà.
3. Línia de mercaderies: vagons amb restriccions, com un vagó cisterna que no pot anar a la via C o dos vagons que han d'anar sempre junts.
4. Línia de muntanya: estacions més petites, al límit del que té solució.
5. Línia d'expert: nivells Difícil i Expert.
6. Línia mestra: les 32 situacions de 17 moviments i altres reptes especials.

## Progressió, recompenses i èxits

El motor de l'addicció és la distància al mínim: el jugador sempre sap quants moviments li sobren i, per tant, sempre té un motiu per tornar-ho a provar.

**Estrelles per partida:**

| Estrelles | Condició |
| ---: | --- |
| 3 | Resolt amb el mínim de moviments |
| 2 | Resolt amb un màxim de 2 moviments més que el mínim |
| 1 | Resolt |

Demanar una pista (el joc mostra el millor moviment següent) treu una estrella possible.

**Altres mecàniques que enganxen:**

- Missatge de «gairebé»: «A 1 moviment del mínim!» quan el jugador s'hi ha quedat a prop.
- Repetició de la solució òptima: en acabar, el jugador pot veure com es resolia amb el mínim. Això ensenya estratègies noves.
- Rècord personal per a cada puzle i millora visible respecte de l'intent anterior.
- Experiència i títols: Aprenent de maniobres, Guardaagulles, Maquinista, Cap d'estació, Mestre d'agulles.
- Ratxa del repte diari: dies seguits jugant, amb un dia de marge a la setmana perquè perdre-la no desmotivi.
- Desbloquejos només estètics: locomotores de vapor, dièsel i elèctriques, colors de vagons i estils d'estació. No donen cap avantatge.
- Compartir el resultat del repte diari amb un text curt, sense revelar la solució: «Agulles #42 · 13 moviments (mínim 12) · ★★».

**Èxits** (proposta inicial; cada un amb icona i data d'obtenció):

| Èxit | Com s'aconsegueix |
| --- | --- |
| Primer tren | Resoldre el primer puzle |
| Perfecció | Resoldre un puzle amb el mínim de moviments |
| Deu perfectes | 10 puzles resolts amb el mínim |
| Sense desfer | Resoldre un puzle Difícil sense desfer cap moviment |
| Sense ajuda | 20 puzles seguits sense pistes |
| Velocista | Resoldre un puzle Mitjà en menys de 60 segons |
| Tossut | Resoldre un puzle després de 5 intents fallits |
| Expert | Resoldre un puzle Expert |
| Els 17 | Resoldre un dels 32 puzles de 17 moviments |
| Mestre d'agulles | Resoldre un dels 32 puzles de 17 moviments amb el mínim |
| Setmana completa | 7 dies de ratxa al repte diari |
| Mes de servei | 30 dies de ratxa al repte diari |
| Enginyer | Crear una estació al Laboratori |
| Investigador | Trobar una estació on alguna partida no té solució |
| Estació mínima | Trobar una estació més petita que la clàssica on totes les partides tenen solució |
| Explorador | Jugar a tots els modes |
| Línia completa | Acabar una línia de la campanya amb 3 estrelles a tots els nivells |

**Límits ètics** (el públic principal són menors):

- Cap compra, cap anunci i cap caixa de premis a l'atzar.
- Cap notificació que reclami tornar al joc.
- Després de 30 minuts seguits, un avís discret que suggereix fer una pausa.
- Els rànquings mostren només pseudònims, mai noms reals.

## Experiència d'usuari i disseny visual

Tot s'ha de poder fer amb un dit al mòbil i amb dos tocs per moviment: tocar on es vol tallar el tren i tocar la via de destí.

**Com es juga un moviment:**

1. El jugador toca la via on vol entrar. La locomotora hi entra amb els vagons que porta.
2. Els vagons de la via s'il·luminen. El jugador toca el vagó per on vol tallar: la locomotora surt arrossegant els vagons fins a aquell punt. Si no en vol cap, toca la locomotora.
3. Si un moviment no és permès (via plena, més de 3 vagons), el joc no el fa i ho explica en una frase curta.

**Pantalla de partida:**

- L'estació dibuixada en vista zenital, gran i clara, que ocupa la major part de la pantalla.
- A dalt: el tren objectiu, amb els vagons en l'ordre demanat.
- Comptadors visibles: moviments fets, mínim possible i temps.
- Botons: desfer (sense límit, però el moviment continua comptant), reiniciar, pista i historial.
- L'historial mostra la notació dels moviments (B2 · A0 · …).

**Estil visual:** il·lustració plana i neta, inspirada en els esquemes de via reals. Animacions curtes: la locomotora avança i recula, els vagons s'enganxen amb un petit rebot.

**So:** efectes discrets d'enganxar, desenganxar i xiulet en acabar, amb un botó per silenciar-los.

**Accessibilitat:**

- Cada vagó té un número gran, no només un color, perquè l'alumnat amb daltonisme el pugui distingir.
- Contrast alt i botons grans.
- Es pot jugar amb teclat (A, B, C per triar via; fletxes i Retorn per triar el tall).
- Opció per reduir les animacions.

**Idiomes:** català per defecte; castellà i anglès com a traduccions. Tots els textos en fitxers separats, perquè altres persones puguin afegir-ne més des de GitHub.

**Funciona sense connexió:** un cop carregat, el joc es pot fer servir sense internet. Només el rànquing necessita connexió.

## Rànquing i resultats

Un rànquing visible és viable i pràctic, però necessita un petit servei extern: GitHub Pages només publica fitxers i no pot guardar resultats. La recomanació és el joc a GitHub Pages i els resultats a Supabase, amb una còpia local al dispositiu perquè el joc funcioni sempre, fins i tot sense connexió.

El joc arriba des de GitHub Pages i funciona sol al navegador; només envia al servidor la llavor i els moviments de cada partida, i en rep els rànquings.

**Opcions per guardar els resultats:**

| Opció | Rànquing compartit | Cost | Feina de manteniment | Valoració |
| --- | --- | --- | --- | --- |
| Només al dispositiu (emmagatzematge del navegador) | No, només rècords personals | Cap | Cap | Necessària igualment, com a base |
| Supabase (base de dades amb API) | Sí, global i per classe | Pla gratuït | Baixa: crear un projecte i configurar els permisos | Recomanada |
| Firebase, de Google | Sí, global i per classe | Pla gratuït | Baixa | Alternativa equivalent |
| Full de càlcul de Google amb Apps Script | Sí, per a una classe o un centre | Cap | Mínima | Bona per a una primera prova; no aguanta gaire trànsit |

Les condicions dels plans gratuïts canvien: cal comprovar-les en el moment de muntar-ho.

**Rànquings visibles:**

- Repte diari: ordenat per moviments i, en cas d'empat, pel temps.
- Classe: estrelles i experiència acumulades durant la setmana, visibles només dins del codi de classe.
- Rècords de la campanya: qui ha resolt cada nivell amb el mínim, i qui ho ha fet primer.
- Saló de la fama: els jugadors que han resolt els 32 puzles de 17 moviments.

**Antitrampes:** el joc no envia la puntuació, sinó la partida sencera: la llavor del puzle, l'estació i la llista de moviments. El servidor torna a jugar la partida amb el mateix motor, comprova que cada moviment és legal i que el tren final és el correcte, i compta ell mateix els moviments. Un resultat inventat no passa la comprovació. Per al temps, es rebutgen partides impossiblement ràpides i es limita el nombre d'enviaments per minut.

**Privacitat dels menors:**

- No es demana nom, correu ni edat.
- Cada jugador rep un pseudònim generat a l'atzar, com «Locomotora Blava 42». No hi ha cap camp de text lliure, i per tant no hi pot haver noms ofensius.
- A classe, el docent apunta fora del sistema quin pseudònim correspon a cada alumne.
- Un botó permet esborrar totes les dades del jugador.
- Sense dades personals el risc és mínim, però cal consultar-ho amb el centre abans de fer-lo servir amb alumnes: a Espanya, l'edat de consentiment per a serveis digitals és de 14 anys.

**Model de dades:**

| Taula | Camps principals | Per a què serveix |
| --- | --- | --- |
| estacions | id, capacitat de les vies (p. ex. 5-3-3), via de maniobra, nombre de vagons, llargada del tren | Definir l'estació clàssica i les variants |
| puzles | id, estació, llavor, mínim de moviments, nivell | Campanya i repte diari |
| jugadors | id anònim, pseudònim, codi de classe, data d'alta | Identificar sense dades personals |
| partides | id, jugador, puzle, llista de moviments, nombre de moviments, temps, pistes, vàlida, data | Resultats i rànquings |
| exits | jugador, codi de l'èxit, data | Èxits aconseguits |
| classes | codi, nom, clau del docent (xifrada), data de fi | Mode classe |

Els rànquings no es guarden: es calculen a partir de les partides vàlides.

## Arquitectura tècnica i publicació a GitHub

El joc és una aplicació web estàtica en TypeScript, publicada amb GitHub Pages i desplegada automàticament cada vegada que es canvia el codi. El cor és un motor de joc petit i ben provat, que fan servir alhora el joc, el solucionador i la validació del servidor.

**Tecnologia:**

- TypeScript + Vite, sense marcs pesats, per mantenir el codi senzill i ràpid.
- Gràfics en SVG, nítids a qualsevol mida de pantalla i fàcils d'animar.
- Motor de joc (engine): les normes i els moviments. Sense res de pantalla, perquè es pugui reutilitzar i provar.
- Solucionador (solver): calcula el mínim de moviments i la pista següent recorrent tots els estats possibles. S'executa en segon pla perquè la pantalla no es congeli.
- Taula precalculada del joc clàssic (els 356.160 estats), generada per un script del mateix repositori.
- Aplicació web progressiva (PWA): es pot instal·lar al mòbil i funciona sense connexió.
- Proves automàtiques (Vitest) de les normes i del solucionador, que han de reproduir les xifres d'aquest document.

**Estructura del repositori:**

```text
agulles/
├─ src/
│  ├─ engine/      normes, estat de l'estació, moviments, notació
│  ├─ solver/      càlcul del mínim i de les pistes
│  ├─ game/        modes de joc, progressió, èxits
│  ├─ ui/          pantalles, dibuix SVG, animacions, so
│  ├─ online/      connexió amb el servidor de resultats
│  └─ i18n/        textos en català, castellà i anglès
├─ data/          estacions, nivells de la campanya, taula precalculada
├─ scripts/       generació de la taula i dels nivells
├─ server/        taules i funció de validació del servidor
├─ tests/
├─ docs/          guia docent i fitxes imprimibles
├─ README.md
├─ CONTRIBUTING.md
└─ LICENSE
```

**Publicació a GitHub:**

1. Repositori públic amb un README atractiu: una animació del joc, l'enllaç per jugar, les normes en tres línies i una secció per a docents.
2. Una acció de GitHub que, a cada canvi, passa les proves, construeix el joc i el publica a GitHub Pages.
3. Llicències: MIT per al codi i Creative Commons BY-SA per als dibuixos, sons i materials didàctics.
4. Guia de contribució i plantilles d'incidències, perquè altres docents puguin proposar nivells, traduccions o millores.
5. Versions numerades (0.1, 0.2…) amb un registre de canvis.

**Seguretat:** la clau pública de Supabase pot anar al codi, perquè està pensada per ser pública. El que protegeix les dades són les regles d'accés de la base de dades: un jugador només pot afegir partides, i només la funció de validació les pot marcar com a vàlides.

## Ús a l'aula i connexió amb la SdA

El joc és l'eina de la SdA, no la substitueix: cada sessió fa servir el mode que respon la seva pregunta, i el tauler de paper i el kit de fusta continuen tenint el seu paper.

| Sessió de la SdA | Què aporta el joc |
| --- | --- |
| 1. Com funciona l'estació | Tutorial i primeres partides Fàcils |
| 2. Quant costa en moviments | Historial amb notació i comparació amb el mínim; exportar les dades del grup |
| 3. Hi ha un mètode que funcioni sempre | Repetició de la solució òptima; provar l'algorisme del grup en partides noves |
| 4. I si l'estació és més petita | Laboratori: el joc diu quines estacions tenen sempre solució |
| 5. Quin és el millor disseny | Dades del Laboratori (mínim mitjà i màxim) per a la fórmula de cost |
| 6. Funciona de veritat | Prova final amb un puzle nou en mode classe, projectat a la pissarra |

**Eines per al docent:**

- Codi de classe per a cada grup classe, amb els seus puzles i el seu rànquing. Un codi diferent per a cada una de les 5 classes.
- Exportació en CSV dels resultats de la classe per avaluar o per treballar estadística amb les dades reals.
- Mode projector: tauler gran i sense distraccions per jugar en gran grup.
- Fitxes imprimibles generades a partir de les mateixes llavors: el puzle en paper, amb un codi QR que obre la mateixa partida al joc per comprovar la solució.
- Guia docent al repositori, amb les normes, les sessions i les solucions.

## Full de ruta per versions

La versió 0.1 ja és jugable a classe; cada versió següent afegeix una capa sense trencar l'anterior.

| Versió | Què inclou | Ja serveix per a |
| --- | --- | --- |
| 0.1 | Estació clàssica, partida lliure per nivells, comptador, mínim, desfer, historial, tutorial | Sessions 1 a 3 de la SdA |
| 0.2 | Campanya amb estrelles, èxits i rècords personals guardats al dispositiu | Ús autònom de l'alumnat |
| 0.3 | Repte diari, ratxes, compartir el resultat, contrarellotge | Enganxar fora de classe |
| 0.4 | Laboratori d'estacions | Sessions 4 i 5 de la SdA |
| 1.0 | Rànquings en línia, mode classe, exportació CSV, fitxes imprimibles amb QR | Les 5 classes i la competició entre grups |
| 1.x | Duel, altres puzles com el Timesaver, més idiomes | Ampliacions |

## Decisions pendents

- [ ] Nom del joc: Agulles, Via Morta, Maniobra! o un altre.
- [ ] Servidor de resultats: Supabase, Firebase o full de càlcul de Google per començar.
- [ ] Qui crea i manté el compte del servidor (a títol personal o del centre).
- [ ] Validació amb el centre de l'ús del rànquing amb alumnes menors.
- [ ] Estil gràfic: il·lustració plana, estil esquema de via o estil maqueta de fusta.
- [ ] Si l'alumnat programarà una part (per exemple, una versió simplificada a Scratch) o només jugarà.
- [ ] Fins a quina versió cal tenir el joc a punt abans de començar la SdA.

## Referències

- Inglenook Sidings: origen del puzle (Alan Wright) i normes clàssiques.
- Inglenook Shunting Puzzles, Simon R. Blackburn: anàlisi matemàtica de quan el puzle té solució i del mínim de moviments.
- Model Railways Shunting Puzzles, Adrian Wymann: descripció completa i normes d'operació.
- Beaver Games: Inglenook Shunting: versió en línia existent, per comparar-la.
- Train shunting puzzle: altres puzles de maniobres, com el Timesaver.

Les xifres de la base de dades de combinacions són càlculs propis fets per a aquest document.
