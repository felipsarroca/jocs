# Bases de dades de l'app «Pròxima sortida»

L'app treballa amb dues capes de dades:

- **Dades fixes.** Xarxa, horaris, reptes, punts i reparacions mínimes. Són iguals per a totes les tandes i surten del verificador.
- **Dades de cada tanda.** Grups, viatges, respostes, intents i valoracions del docent. Es desen a Cloud Firestore.

Aquest document en descriu el contingut, qui pot llegir i escriure cada part i com circulen les dades durant les quatre trobades.

## Principis

- **Una sola font.** Els documents 01 i 02 i `Verificador/reptes.json` són l'origen de tot. `Verificador/exporta.py` genera les dades de l'app, i a l'app no hi ha cap horari ni cap solució escrits a mà.
- **Sense servidor propi.** L'app és estàtica (GitHub Pages) i fa servir Firestore des del navegador amb usuaris anònims i regles estrictes, com Subhasta. No hi ha funcions al núvol ni Storage.
- **Sense dades personals.** Els grups s'identifiquen pel nom del grup, i el docent fa la correspondència amb l'alumnat en paper. Les notes individuals (prova, observació i Maniobres) no entren a l'app.
- **Tot es pot tornar a avaluar.** Es desen els bitllets i les respostes, no només els punts. El panell docent recalcula els punts amb el mateix avaluador i avisa si no coincideixen.
- **Mateix avaluador a tot arreu.** `Verificador/avaluador.py` és la referència. `js/avaluador.js` n'és una còpia exacta, i la prova `proves/prova-avaluador.mjs` compara tots dos sobre 2.926 viatges. Resultat del 24-11-2026: idèntics en tots els casos.

## 1. Dades fixes (`dades/dades.json`)

Fitxer JSON de 30 kB, generat per `exporta.py`.

| Bloc | Contingut | Origen |
|---|---|---|
| `versio`, `generat` | Edició de les dades i data de generació. L'app la mostra al peu del panell docent. | `reptes.json` |
| `regles` | Minuts del dia (1440), canvi mínim (10), visita mínima (120), pressupost (180) i termini (D4 21.00, en minuts). | `xarxa.py` |
| `estacions` | 39 estacions: codi intern i nom sencer. Més endavant hi anirà la posició al mapa. | `fisic.py` |
| `eixos` | Eixos del mapa amb les estacions en ordre, per dibuixar-lo. | Document 01 |
| `trens` | 96 circulacions. Per a cada una: parades amb l'hora (minuts del dia), tarifes entre parades i recorregut físic de cada salt, incloses les estacions per on passa sense parar. | Document 01 |
| `reptes` | L'agència, els nivells, les regles i els blocs. Per a cada repte: client, encàrrec, modalitat, nivells amb punts, condicions del viatge, objectiu, solució de referència i preguntes. | `reptes.json` |
| `reparacions` | Cost mínim del viatge reparat del repte 9 per a cada primer bitllet i cada tall (155 casos, entre 66 i 86 €). La clau és `tren1\|estació1\|dia\|tram`. | `nivells.py` |
| `testimonis` | Bitllets del testimoni B-01, que l'app fa servir com a viatge original als grups que arriben al repte 9 sense haver lliurat el repte 7. | Document 02 |

L'alumnat no veu mai els codis d'estació ni de tren. A la guixeta, cada tren s'identifica per l'hora de sortida i la destinació final.

**Format dels reptes.** Hi ha dues modalitats:

- **Escala (R1–R6).** Tres peticions curtes del mateix client, cadascuna amb el seu viatge i les seves preguntes. Per passar al nivell següent cal superar l'anterior.
- **Millora (R7–R9).** Un sol viatge que el grup millora abans de lliurar-lo. L'app indica a quin nivell arriba el viatge: el nivell 2 inclou totes les condicions del nivell 1, i el 3 totes les del 2.

| Camp d'un nivell | Significat |
|---|---|
| `viatge` | Condicions: `desti`, `visites`, `termini`, `pressupost`, `arribada_dia`, `max_bitllets`, `min_bitllets`, `primer` (sortida, destinació o tren obligats), `min_visites`, `alguna_de` (una condició o l'altra), `gran_viatge` (regles completes), `via_tallada` i `marge_reparacio`. |
| `objectiu` | `valid` (n'hi ha prou que compleixi les condicions), `mes_barat`, `arriba_abans` o `max_estada:ESTACIÓ`. |
| `solucio` | Valor de referència comprovat pel verificador: preu mínim, hora d'arribada, estada màxima o nombre d'opcions. |
| `preguntes` | Què ha de calcular el grup a partir del seu viatge: hores, preu total, saldo, esperes i estades, diferències de preu o d'hora amb un viatge anterior i percentatge de canvi. |

**Exemple.** La petició Exprés de la família Puig (R5.2) es descriu així: «destinació Barcelona, visita Lleida, termini D1 23.59, objectiu el més barat». La solució de referència és 16 €. L'app accepta qualsevol viatge que compleixi les condicions i costi 16 €.

## 2. Dades de cada tanda (Cloud Firestore)

```
codis/{codi}                                   codi de 4 caràcters → tanda
tandes/{tandaId}                               la tanda (és del docent)
tandes/{tandaId}/claus/{grupId}                PIN del grup (només el docent)
tandes/{tandaId}/grups/{grupId}                l'agència: nom, punts i testimoni
tandes/{tandaId}/grups/{grupId}/membres/{uid}  aparells que han entrat amb el PIN
tandes/{tandaId}/grups/{grupId}/reptes/{codi}  R1…R9: esborrany, nivells assolits, viatges i respostes
tandes/{tandaId}/grups/{grupId}/intents/{id}   registre de comprovacions (només s'hi afegeix)
tandes/{tandaId}/valoracio/{grupId}            ajudes i notes del docent
```

### Professorat: `tandes/{tandaId}/clauDocent/clau` i `docents/{uid}`

La contrasenya del professorat no es desa mai: només el seu hash SHA-256 (amb el codi de la tanda com a sal), a `clauDocent/clau`, que només el docent pot llegir. Un aparell entra com a docent creant `docents/{uid}` amb el mateix hash; les regles el comparen amb el desat i, si coincideix, aquell aparell dirigeix la tanda com el propietari (però no en pot canviar el propietari).

### `tandes/{tandaId}`

| Camp | Tipus | Significat |
|---|---|---|
| `propietariUid` | text | Usuari del docent que l'ha creada. La dirigeixen aquest usuari i els aparells que han entrat amb la contrasenya del professorat (`docents/{uid}`). |
| `nom` | text (≤ 60) | Per exemple, «Tanda 1 · desembre 2026». |
| `codi` | text | Codi d'accés de 4 caràcters sense lletres confusibles (per exemple, `K7Q2`). |
| `grups` | llista | `{id, nom}` de cada grup, per a la pantalla d'accés. |
| `calendari` | 4 dates (ms) | Dia de cada trobada (mitjanit local). El bloc 1 s'obre el dia de la trobada 1; els blocs 2 i 3, el de la 2; el bloc 4 i l'avís de via tallada, el de la 4. Les regles ho comproven amb l'hora del servidor. |
| `blocObert` | 1–4 | Bloc obert a mà abans d'hora (només per a imprevistos). Val el més alt entre aquest i el del calendari. |
| `avisViaTallada` | sí/no | Avís activat a mà abans d'hora. Si no, arriba sol el dia de la trobada 4. |
| `estat` | text | `preparacio`, `en_curs` o `tancada`. Amb `tancada`, ningú no pot escriure. |
| `versioDades` | text | Edició de `dades.json` amb què es va crear. L'app avisa si no coincideix. |
| `creadaMs`, `expiraMs` | nombres | La tanda caduca com a molt al cap de 400 dies. |

### `codis/{codi}`

`tandaId` i `expiraMs`. Qualsevol usuari pot llegir un codi concret, però no se'n pot obtenir la llista.

### `claus/{grupId}`

`pin`: quatre xifres. Només el docent el pot llegir. Les regles el consulten quan un aparell entra al grup.

### `grups/{grupId}`

| Camp | Qui l'escriu | Significat |
|---|---|---|
| `nom`, `ordre` | Docent | Noms de trens: «Talgo», «Alvia», «Avant»… |
| `testimoni` | Docent | Reservat. L'origen real del tall (`R7` o `B-01`) es desa a `reptes/R9.tall.origen`. |
| `repteActual` | Grup | Repte que té obert. |
| `punts`, `nivells` | Grup | Punts i nivells assolits per repte. És una còpia per al panell: el docent els recalcula. |
| `darreraActivitatMs` | Grup | Per veure al panell qui està treballant. |

### `membres/{uid}`

`pin` i `entratMs`. Un aparell crea el seu document en entrar. Les regles hi admeten l'escriptura només si el PIN coincideix amb `claus/{grupId}`. A partir d'aquí, totes les escriptures del grup exigeixen que hi hagi aquest document.

### `reptes/{codi}` (un document per repte i grup)

| Camp | Significat |
|---|---|
| `estat` | `obert` o `lliurat`. Un encàrrec lliurat ja no es pot tocar, tret que el docent el reobri. |
| `esborrany` | Bitllets i respostes en què el grup treballa ara. Es desa uns segons després de cada canvi, perquè no es perdi en recarregar o en canviar de trobada. |
| `nivells` | Per a cada nivell assolit: bitllets, respostes, nombre d'intents i hora. |
| `nivellAssolit`, `punts` | Còpia del resultat per al panell. |
| `tall` | Només R9: dia, tram tallat, primer bitllet, estació, cost mínim de la reparació i origen (`R7` o `B-01`). |
| `lliuratMs` | Hora del lliurament. |

### `intents/{id}`

Cada vegada que el grup prem «Comprova» es desa el repte, el nivell, els bitllets, les respostes, els codis d'error i el resultat. Els grups només poden afegir-ne. Serveix per a l'observació: nombre d'intents, errors més freqüents i temps per repte.

### `valoracio/{grupId}`

`ajuda`: llista dels nivells fets amb ajuda del docent (per exemple, `R3.2`), que valen la meitat. `notes`: observacions de grup, sense noms de l'alumnat. El grup la pot llegir però no la pot modificar.

## 3. Qui pot fer què

| Dades | Aparell del grup | Aparell d'un altre grup | Docent de la tanda |
|---|---|---|---|
| `codis` | Llegir el seu codi | Llegir el seu codi | Crear i esborrar |
| `tandes` | Llegir | Llegir | Tot |
| `claus` | No | No | Tot |
| `grups/{grupId}` | Llegir i actualitzar el progrés | Llegir el nom | Tot |
| `membres` | Entrar amb el PIN i sortir | No | Llegir i esborrar |
| `reptes` | Llegir i escriure mentre està obert | No | Tot |
| `intents` | Afegir i llegir | No | Llegir |
| `valoracio` | Llegir | No | Tot |

Cap grup no pot veure ni modificar el treball d'un altre. També queda tancat escriure en un bloc que el docent encara no ha obert o en una tanda tancada o caducada.

## 4. Com circulen les dades

1. **Preparació (docent).** Crea la tanda, l'app genera el codi i un PIN per grup, i el docent imprimeix les targetes d'accés: nom del grup, enllaç curt, codi de la tanda i PIN.
2. **Entrada (grup).** Enllaç curt → codi de la tanda → nom del grup → PIN. El Chromebook recorda la tanda i el grup per a les trobades següents.
3. **Treball.** El grup compra bitllets a la guixeta (es desen a `esborrany`), respon les preguntes i prem «Comprova». L'avaluador del navegador dona el resultat, i l'app desa l'intent i, si és correcte, el nivell assolit.
4. **Lliurament.** «Lliura l'encàrrec» tanca el repte amb el nivell més alt assolit i suma els punts.
5. **Blocs.** Cada bloc s'obre sol el dia de la seva trobada, segons `calendari`. L'encàrrec següent s'obre quan el grup té el nivell Regional de l'actual; R8, quan ha lliurat R7, i R9, amb l'avís. Qui acaba abans prova els nivells Exprés i Alta velocitat.
6. **Via tallada.** L'avís arriba sol el dia de la trobada 4. L'app de cada grup calcula el tall a partir del viatge lliurat al repte 7 (o del testimoni B-01), el desa a `reptes/R9.tall` i hi afegeix el preu de referència de `reparacions`.
7. **Ajuda.** Si un grup supera un nivell amb ajuda, el docent ho apunta a la graella i ho marca al panell en acabar la sessió.
8. **Tancament.** El docent exporta un CSV amb grup, punts i nivells per repte, ajudes, intents i nota de grup. Després tanca la tanda.

## 5. Punts i nota

| Repte | Regional | Exprés | Alta velocitat | Total |
|---|---|---|---|---|
| R1–R6 (cadascun) | 100 | 50 | 50 | 200 |
| R7 · El gran viatge | 400 | 200 | 200 | 800 |
| R8 · Feu-lo millor | 400 | 200 | 200 | 800 |
| R9 · Via tallada | 600 | 300 | 300 | 1.200 |
| **Total** | | | | **4.000** |

- Un nivell fet amb ajuda del docent val la meitat. Els intents no resten punts.
- **Nota de grup = punts / 1000**, amb un decimal. Tots els nivells Regional donen un 2,0, tots els Exprés un 3,0 i tots els Alta velocitat un 4,0. L'escala d'1 a 4 correspon als nivells d'assoliment (NA, AS, AN i AE).
- La nota final la calcula el docent fora de l'app: 60 % nota de grup, 30 % prova individual i 10 % observació. Maniobres serveix de complement en la proporció que decideixi el docent.

## 6. Sense connexió i mode local

- **Talls de xarxa curts.** Firestore guarda una còpia al navegador i envia els canvis quan torna la connexió. L'avaluador funciona sense xarxa, perquè les dades fixes ja s'han carregat.
- **Mode local.** Si no hi ha configuració de Firebase, l'app ho desa tot al navegador (`localStorage`) amb la mateixa estructura. Serveix per provar l'app i per fer la SdA amb un sol aparell. El panell docent ha d'estar al mateix navegador.

## 7. Límits coneguts

- **El PIN és de quatre xifres.** Algú podria provar PIN a l'atzar. El panell mostra quants aparells hi ha a cada grup, i el docent pot treure'n un i canviar el PIN.
- **Els punts es calculen al navegador.** Un alumne amb coneixements tècnics podria escriure punts falsos. Per això el panell recalcula sempre els punts amb els bitllets i les respostes desats.
- **Les solucions de referència són a `dades.json`.** L'avaluador les necessita per saber si un viatge és el més barat. Qui obri el fitxer veu el preu objectiu, però no el viatge. El preu mínim del repte 9 ja es mostra a l'enunciat del nivell Alta velocitat.
- **Sense noms reals.** Cal recordar a l'alumnat que el nom del grup no pot ser el nom de ningú.

## 8. Fitxers

| Fitxer | Lloc | Funció |
|---|---|---|
| `reptes.json` | `Verificador` | Reptes, nivells, punts i textos. Font única. |
| `avaluador.py` | `Verificador` | Avaluador de referència. |
| `nivells.py` | `Verificador` | Comprova que cada nivell té solució i calcula les reparacions mínimes. És la secció 6 de `comprova.py`. |
| `exporta.py` | `Verificador` | Escriu `dades.json` i `vectors.json` a la carpeta de l'app. |
| `js/avaluador.js` | App | Còpia exacta de l'avaluador. |
| `proves/prova-avaluador.mjs` | App | Compara els dos avaluadors (`node proves/prova-avaluador.mjs`). |
| `firebase/firestore.rules` | App | Regles de seguretat d'aquest document. |

**Ordre de treball quan canvia una dada:** edita el document 01, el 02 o `reptes.json` → `python comprova.py` → `python exporta.py` → `node proves/prova-avaluador.mjs`.
