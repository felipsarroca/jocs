# Pròxima sortida · Agència de viatges en tren

[![HTML · CSS · JS](https://img.shields.io/badge/HTML_·_CSS_·_JS-mòduls_ES_natius-3a63e0?style=flat-square)](#arquitectura)
[![Codi](https://img.shields.io/badge/codi-AGPLv3-3a63e0?style=flat-square)](LICENSE)
[![Continguts](https://img.shields.io/badge/continguts-CC_BY--NC--SA_4.0-8A5A00?style=flat-square)](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.ca)

**Pròxima sortida** és l'app de la situació d'aprenentatge de ferrocarril de matemàtiques (1r a 4t d'ESO). Cada grup porta una oficina d'una agència de viatges en tren. Els clients li fan encàrrecs cada vegada més difícils: llegir una sortida, canviar de tren, fer una excursió, organitzar un viatge de quatre dies per 180 € i salvar-lo quan es talla una via. Cada encàrrec ben resolt dona punts de reputació, fins a 4.000.

L'app **no fa els càlculs per l'alumnat**: la guixeta dona l'hora i el preu de cada bitllet, però les esperes, les estones de visita, els totals i les diferències els calcula el grup i els escriu. L'app comprova si són correctes.

> Enllaç: **[ja.cat/estaciodetren](https://ja.cat/estaciodetren)** · Professorat: botó «Professorat» de l'app ([docent.html](https://felipsarroca.github.io/jocs/Ferrocarril/docent.html)) · [Manual del professorat](https://felipsarroca.github.io/jocs/Ferrocarril/manual.html)

---

## Captures de pantalla

### La pantalla de treball: 1 encàrrec, 2 guixeta, 3 el vostre viatge
![Encàrrec R7 a 1366 × 768](docs/captures/01-gran-viatge-1366x768.png)

### Accés: codi de la tanda, grup i PIN
![Accés a 1366 × 768](docs/captures/02-acces-1366x768.png)

### «Com funciona»: la guia de tres passos que surt en entrar
![Guia a 1366 × 768](docs/captures/05-com-funciona-1366x768.png)

### Cada nivell aconseguit es celebra i diu què es pot fer després
![Nivell aconseguit a 1366 × 768](docs/captures/06-nivell-aconseguit-1366x768.png)

### Panell del professorat: calendari de les trobades, nivells i punts de cada grup
![Panell docent a 1366 × 768](docs/captures/03-panell-docent-1366x768.png)

### Al mòbil, en una sola columna
![Guixeta al mòbil a 390 × 844](docs/captures/04-mobil-390x844.png)

---

## Disseny

- **Clar i juvenil.** Fons blau molt clar, targetes blanques, tipografia arrodonida (Nunito, inclosa a l'app) i un logo nou: un tren de cara, groc sobre blau, que es reconeix a 16 px.
- **Tres passos numerats.** La pantalla de treball té tres columnes: **1 Encàrrec**, **2 Guixeta** i **3 El vostre viatge**. El pas que toca (comprar o calcular) es ressalta sol, i la guia «Com funciona» (botó **?**) ho explica amb tres dibuixos.
- **La petició del client, ben visible.** Cada encàrrec mostra el nivell que toca (Regional, Exprés o Alta velocitat) amb els seus punts. Als encàrrecs de millora (7, 8 i 9) es veuen els tres objectius alhora.
- **La línia dels encàrrecs.** Els nou encàrrecs són les parades d'una línia de tren, amb el nom de cada bloc i un color per bloc: blau (llegir la guixeta), verd (visites, nits i diners), taronja (el gran viatge) i vermell (via tallada).
- **La guixeta.** Un botó gran per triar l'estació (totes en una graella), els dies en pestanyes i les sortides amb l'hora en groc. Si toqueu un tren, les parades es dibuixen com una línia amb l'hora, el preu i el botó «Compra».
- **Bitllets amb forma de bitllet,** del color del bloc. L'app no suma mai els preus.
- **Celebració de cada nivell,** amb els punts guanyats i el pas següent (provar el nivell següent, passar a l'encàrrec següent o lliurar).
- **Aprofita la pantalla.** S'escala a l'espai útil: es redueix als portàtils de 1366 × 768 (també amb l'escalat del sistema al 125 %) i s'amplia una mica a les pantalles grans.

---

## Com funciona a l'aula

- **Nou encàrrecs iguals per a tothom**, en quatre blocs que s'obren sols el dia de cada trobada: llegir la guixeta (R1–R4), visites, nits i diners (R5–R6), el gran viatge (R7–R8) i la via tallada (R9).
- **Tres nivells per encàrrec:** Regional (la fita), Exprés i Alta velocitat. L'encàrrec següent s'obre quan el grup aconsegueix el Regional. L'app no diu mai quan s'ha de lliurar: el grup gestiona el temps i decideix què lliura i quan.
- **Cinc grups classe (Alfa, Beta, Gamma, Delta, Èpsilon):** una tanda per a cadascun, amb els mateixos noms de grups de treball (Talgo, Alvia…). La targeta d'accés i la capçalera de l'alumnat mostren el grup classe.
- **Punts de reputació:** 100/50/50 a R1–R6, 400/200/200 a R7 i R8 i 600/300/300 a R9. Un nivell fet amb ajuda del docent val la meitat. Nota de grup = punts / 1000.
- **«Comprova»** diu el primer problema en llenguatge planer, sense donar mai la solució.
- **Seguiment al panell:** marca «Encallat» (3 intents seguits amb errors o 12 min sense cap nivell), mostra els darrers errors de cada grup en paraules planeres i el viatge en curs, i una franja «Errors de la classe» amb els errors repetits en dos o més grups (darrers 30 min).
- **Via tallada:** el dia de la trobada 4, cada grup rep un tall diferent calculat a partir del seu gran viatge, amb una reparació mínima precalculada.

## Accés

- **Alumnat (`index.html`):** codi de la tanda, nom del grup i PIN de quatre xifres. Cap dada personal.
- **Professorat (`docent.html`, botó «Professorat»):** s'hi entra des de qualsevol aparell amb el codi de la tanda i la contrasenya del professorat. En crear la tanda, el docent posa les dates de les quatre trobades: els blocs i la via tallada s'obren sols, i durant la sessió no cal tocar res. Després de cada sessió marca les ajudes; al final exporta un CSV. Hi ha un botó «Obrir abans d'hora» per a imprevistos.
- **Demostració (`?demo`):** [felipsarroca.github.io/jocs/Ferrocarril/?demo](https://felipsarroca.github.io/jocs/Ferrocarril/?demo) entra sense codi com el grup Talgo, amb els nou encàrrecs oberts. Les dades es desen només al navegador, separades de les tandes reals; la barra de baix permet tornar a començar i obrir el panell del professorat de la demo.
- **Manual (`manual.html`):** guia breu del professorat, enllaçada des del panell.

## Arquitectura

- JavaScript natiu amb mòduls ES, sense dependències ni compilació.
- Firestore (projecte `proxima-sortida-cat`, eur3) amb accés anònim i regles a `firebase/firestore.rules`; es despleguen des de `firebase/` amb `firebase deploy --only firestore:rules,auth --project proxima-sortida-cat`. Amb `FIREBASE_CONFIG = null` a `js/config.js`, funciona en **mode local** amb `localStorage`.
- `dades/dades.json` (horari, encàrrecs, reparacions mínimes) i `proves/vectors.json` es generen amb el verificador de la SdA (`Verificador/exporta.py`). No s'editen a mà.
- `js/avaluador.js` és una còpia exacta de l'avaluador de referència en Python. Prova: `node proves/prova-avaluador.mjs` (2.926 casos idèntics).
- Les regles de Firestore es proven amb l'emulador local: `firebase/prova-regles.mjs` (57 casos; instruccions a la capçalera del fitxer).
- La interfície s'escala a l'espai útil de la finestra (referència 1440 × 740, entre el 72 % i el 125 %) i passa a una columna en pantalles estretes.

| Fitxer | Funció |
|---|---|
| `js/alumnat.js` | App de l'alumnat: accés, carril d'encàrrecs, guixeta i viatge. |
| `js/docent.js` | Panell docent. |
| `js/agencia.js` | Tandes, grups, desbloqueig, correcció de respostes i punts. |
| `js/avaluador.js` | Regles del viatge, nivells i valors de les preguntes. |
| `js/magatzem.js` | Desament a Firestore o en local amb la mateixa interfície. |
| `js/textos.js` | Missatges a l'alumnat. |
| `js/escala.js` | Adaptació a la pantalla. |

## Autoria i llicència

Aplicació creada per [Felip Sarroca](https://ja.cat/felipsarroca) amb assistència de la IA.

Codi: [AGPLv3](LICENSE) · Continguts: [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.ca) · [Suggeriments i errors](https://github.com/felipsarroca/jocs/issues/new?template=ferrocarril.yml)
