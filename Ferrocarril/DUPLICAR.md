<!-- SPDX-License-Identifier: CC-BY-NC-SA-4.0 -->
# Com duplicar «Pròxima sortida» per a la vostra escola

Aquesta guia explica, pas a pas, com fer una còpia de l'app per fer-la servir en una altra escola, amb les vostres pròpies dades i la vostra adreça. No cal saber programar: tot es fa des del navegador, a les webs de GitHub i de Firebase.

**Què hi guanyeu.** Les tandes, els grups i els viatges del vostre alumnat queden en una base de dades vostra, que només administreu vosaltres. Teniu la vostra pròpia contrasenya del panell i podeu canviar els noms de les tandes i dels grups.

**Què necessiteu**

| | |
|---|---|
| Un compte de GitHub | Gratuït. Hi viurà l'app. Es crea a [github.com/signup](https://github.com/signup). |
| Un compte de Google | Per a Firebase, la base de dades. Pot ser el de l'escola, si permet fer servir Firebase, o un de personal. |
| La contrasenya inicial del panell | Demaneu-la a l'autor ([ja.cat/felipsarroca](https://ja.cat/felipsarroca)). Al pas 8 la canviareu per una de vostra. |
| Temps | Una hora, la primera vegada. |

**Quant costa.** Res. El pla gratuït de Firebase (Spark) inclou 50.000 lectures i 20.000 escriptures al dia, molt més del que gasten unes quantes classes treballant alhora. No cal posar cap targeta de crèdit.

---

## Resum dels passos

1. [Copieu l'app a GitHub](#1-copieu-lapp-a-github) (fork).
2. [Publiqueu-la amb GitHub Pages](#2-publiqueu-la-amb-github-pages).
3. [Creeu el projecte de Firebase](#3-creeu-el-projecte-de-firebase).
4. [Activeu l'accés anònim](#4-activeu-laccés-anònim).
5. [Creeu la base de dades i les regles](#5-creeu-la-base-de-dades-i-les-regles).
6. [Registreu l'app web i copieu-ne la configuració](#6-registreu-lapp-web-i-copieu-ne-la-configuració).
7. [Connecteu l'app amb Firebase](#7-connecteu-lapp-amb-firebase) (fitxer `js/config.js`).
8. [Canvieu la contrasenya del panell](#8-canvieu-la-contrasenya-del-panell).
9. [Proveu-ho tot](#9-proveu-ho-tot).

---

## 1. Copieu l'app a GitHub

L'app forma part del repositori públic [github.com/felipsarroca/jocs](https://github.com/felipsarroca/jocs), que conté diversos jocs. La manera més senzilla de copiar-la és fer-ne un *fork* (una còpia al vostre compte que podreu actualitzar quan hi hagi millores).

1. Entreu a GitHub amb el vostre compte.
2. Obriu [github.com/felipsarroca/jocs](https://github.com/felipsarroca/jocs).
3. A dalt a la dreta, toqueu **Fork**.
4. Deixeu el nom `jocs` i toqueu **Create fork**.

Ara teniu el repositori `github.com/EL-VOSTRE-USUARI/jocs`. L'app és a la carpeta `Ferrocarril`.

> En aquesta guia, **EL-VOSTRE-USUARI** és el vostre nom d'usuari de GitHub. Substituïu-lo sempre pel vostre.

## 2. Publiqueu-la amb GitHub Pages

1. Al vostre repositori `jocs`, toqueu **Settings** (la roda dentada de la barra superior).
2. Al menú de l'esquerra, toqueu **Pages**.
3. A **Build and deployment › Source**, trieu **Deploy from a branch**.
4. A **Branch**, trieu `main` i la carpeta `/ (root)`. Toqueu **Save**.
5. Espereu dos o tres minuts i recarregueu la pàgina. A dalt hi sortirà l'adreça del lloc.

L'adreça de l'app serà:

```
https://EL-VOSTRE-USUARI.github.io/jocs/Ferrocarril/
```

Si l'obriu ara, l'app encara està connectada a la base de dades de l'autor. No hi creeu cap tanda fins al pas 7.

## 3. Creeu el projecte de Firebase

1. Obriu [console.firebase.google.com](https://console.firebase.google.com) amb el compte de Google que fareu servir.
2. Toqueu **Create a project** (o **Crear un proyecto**).
3. Poseu-li un nom, per exemple `proxima-sortida-escola`. Firebase hi afegeix un identificador: apunteu-lo, és el **Project ID**.
4. Quan us pregunti per **Google Analytics**, desactiveu-lo: no cal.
5. Toqueu **Create project** i, quan acabi, **Continue**.

## 4. Activeu l'accés anònim

L'alumnat i el professorat entren sense compte ni correu: l'app fa servir usuaris anònims.

1. Al menú de l'esquerra, obriu **Build › Authentication** (o **Compilación › Authentication**) i toqueu **Get started**.
2. A la pestanya **Sign-in method**, toqueu **Anonymous**.
3. Activeu l'interruptor **Enable** i toqueu **Save**.
4. Ara obriu la pestanya **Settings › Authorized domains**, toqueu **Add domain** i escriviu `EL-VOSTRE-USUARI.github.io`. Toqueu **Add**.

## 5. Creeu la base de dades i les regles

**La base de dades**

1. Al menú de l'esquerra, obriu **Build › Firestore Database** i toqueu **Create database**.
2. Si us demana l'edició, deixeu **Standard edition**. Deixeu l'identificador `(default)`.
3. A **Location**, trieu una ubicació d'Europa: `eur3 (europe-west)` és la que fa servir l'app original. Aquesta tria no es pot canviar després.
4. Trieu **Start in production mode** i toqueu **Create**.

**Les regles de seguretat.** Són les que impedeixen que un grup vegi o canviï la feina d'un altre. Sense aquest pas, l'app no funciona.

1. En una altra pestanya, obriu el fitxer de regles del vostre repositori:
   `https://github.com/EL-VOSTRE-USUARI/jocs/blob/main/Ferrocarril/firebase/firestore.rules`
2. Toqueu el botó **Copy raw file** (dos quadrats, a dalt a la dreta del fitxer).
3. Torneu a Firebase, a **Firestore Database**, i obriu la pestanya **Rules**.
4. Esborreu tot el text que hi ha, enganxeu-hi el que heu copiat i toqueu **Publish**.

## 6. Registreu l'app web i copieu-ne la configuració

1. A Firebase, toqueu la roda dentada del costat de **Project Overview** i obriu **Project settings**.
2. A la pestanya **General**, baixeu fins a **Your apps** i toqueu la icona web **`</>`**.
3. Poseu-li un nom (per exemple `app`). **No** marqueu Firebase Hosting. Toqueu **Register app**.
4. Firebase mostra un codi amb un bloc com aquest:

   ```js
   const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "proxima-sortida-escola.firebaseapp.com",
     projectId: "proxima-sortida-escola",
     storageBucket: "proxima-sortida-escola.firebasestorage.app",
     messagingSenderId: "1234567890",
     appId: "1:1234567890:web:abcdef123456"
   };
   ```

   Copieu les sis línies de dins de les claus `{ … }`. Si tanqueu la finestra, les trobareu sempre a **Project settings › General › Your apps › SDK setup and configuration › Config**.

Aquestes dades no són secretes: qualsevol web de Firebase les mostra al navegador. El que protegeix les dades són les regles del pas 5.

## 7. Connecteu l'app amb Firebase

1. Al vostre repositori de GitHub, obriu `Ferrocarril/js/config.js`.
2. Toqueu el llapis (**Edit this file**).
3. Busqueu el bloc `export const FIREBASE_CONFIG = { … };` i substituïu les sis línies de dins per les vostres. Ha de quedar així (amb les vostres dades):

   ```js
   export const FIREBASE_CONFIG = {
     apiKey: 'AIza...',
     authDomain: 'proxima-sortida-escola.firebaseapp.com',
     projectId: 'proxima-sortida-escola',
     storageBucket: 'proxima-sortida-escola.firebasestorage.app',
     messagingSenderId: '1234567890',
     appId: '1:1234567890:web:abcdef123456'
   };
   ```

   Podeu deixar les cometes dobles (`"`) tal com les copieu de Firebase: també funcionen. Vigileu de no esborrar les comes del final de cada línia ni el `};` final.

4. Canvieu l'adreça que surt a les targetes d'accés. Busqueu la línia:

   ```js
   export const URL_APP = 'ja.cat/estaciodetren';
   ```

   i poseu-hi la vostra, sense `https://`:

   ```js
   export const URL_APP = 'EL-VOSTRE-USUARI.github.io/jocs/Ferrocarril';
   ```

   Si voleu una adreça més curta per a l'alumnat, feu-ne un enllaç curt (per exemple, amb el servei d'enllaços del vostre centre o un escurçador) i poseu-hi aquest.

5. **Opcional.** Els noms de les tandes (`NOMS_TANDES`) i dels grups (`NOMS_GRUPS`) són a la mateixa pàgina. Podeu canviar-los, per exemple `['1r A', '1r B', '2n A']`. No hi poseu mai noms d'alumnes.
6. Baixeu fins al final i toqueu **Commit changes** (dues vegades).
7. Espereu dos minuts perquè GitHub Pages publiqui el canvi.

## 8. Canvieu la contrasenya del panell

El panell del professorat i el solucionari estan protegits amb una contrasenya. No es desa enlloc: el solucionari es publica xifrat (`Ferrocarril/dades/solucionari.xifrat.json`) i només s'obre amb la contrasenya bona. La vostra còpia porta el fitxer de l'autor, que s'obre amb la contrasenya inicial. Canvieu-la perquè sigui només vostra:

1. Obriu `https://EL-VOSTRE-USUARI.github.io/jocs/Ferrocarril/docent.html`.
2. Escriviu la contrasenya inicial que us ha donat l'autor.
3. A la pantalla de les tandes, sota el requadre **Professorat**, toqueu **Canvia la contrasenya del panell**.
4. Escriviu la contrasenya nova dues vegades (sis caràcters com a mínim) i toqueu **Baixa el fitxer nou**. El navegador baixa el fitxer `solucionari.xifrat.json`.
5. Al vostre repositori de GitHub, obriu la carpeta `Ferrocarril/dades`.
6. Toqueu **Add file › Upload files**, arrossegueu-hi el fitxer que heu baixat (substitueix el que hi ha) i toqueu **Commit changes**.
7. Al cap de dos minuts, recarregueu el panell: us demanarà la contrasenya nova.

A partir d'aquí, cada aparell demana la contrasenya del panell una sola vegada. Doneu-la només al professorat. Per tancar el panell en un ordinador compartit, toqueu **Tanca el panell en aquest aparell**.

> **Si teniu Node.js** (opcional): des d'una còpia local del repositori, `node Ferrocarril/eines/solucionari.mjs canvia` fa el mateix canvi des de la consola, i `comprova` diu si una contrasenya obre el solucionari.

## 9. Proveu-ho tot

1. **Demostració.** Obriu `…/Ferrocarril/?demo`. S'hi entra sense codi i res del que hi feu no es desa a Firebase. Serveix per veure com treballa l'alumnat.
2. **Una tanda de prova.** Al panell, creeu una tanda (per exemple, `Prova`) amb dos grups i les dates d'avui. Si surt un error en crear-la, reviseu els passos 4, 5 i 7.
3. **Un grup.** En un altre aparell (o en una finestra d'incògnit), obriu l'app, escriviu el codi de la tanda, trieu un grup i escriviu el seu PIN. Resoleu l'encàrrec 1 i comproveu que el panell ho mostra.
4. **Targetes.** Al panell, toqueu **Targetes d'accés** i comproveu que hi surt la vostra adreça.
5. Quan acabeu, toqueu **Tanca la tanda** per a la tanda de prova.

A Firebase, a **Firestore Database › Data**, hi veureu la col·lecció `tandes` amb la tanda que heu creat.

---

## Materials per imprimir

Al panell, el botó **Imprimibles** reuneix tots els materials en paper, amb les targetes d'accés, la prova individual i la carpeta docent. Els materials sense solucions també es baixen des del **Manual** o des de la carpeta [`Ferrocarril/docs/materials`](docs/materials): mapa A3, full de regles, full de càlculs, guia de les quatre trobades i quadern de panells de reserva. La [presentació per al professorat](docs/presentacio-proxima-sortida.pdf) explica què cal imprimir, quantes còpies i què va a cada taula.

La prova individual i la carpeta docent porten les solucions. Per això es publiquen xifrades i només es baixen des del panell, amb la contrasenya. Les solucions de tots els encàrrecs també són al **Solucionari** del panell.

Els fulls impresos porten al peu l'adreça `ja.cat/estaciodetren`, que és la de l'app original. Digueu a l'alumnat que faci servir l'adreça de la seva targeta d'accés.

## Rebre les millores

Quan l'autor publica una versió nova, al vostre repositori de GitHub apareix l'avís *This branch is X commits behind*. Per actualitzar-vos:

1. Abans de res, copieu en un document el vostre bloc `FIREBASE_CONFIG` i la línia `URL_APP` de `js/config.js`, i guardeu el vostre fitxer `dades/solucionari.xifrat.json` (obriu-lo a GitHub i toqueu **Download raw file**).
2. Toqueu **Sync fork › Update branch**.
3. Si GitHub diu que hi ha conflictes, trieu **Discard commits**: el repositori queda igual que l'original.
4. Torneu a fer el pas 7 (configuració) i el pas 8 (contrasenya): amb el panell obert amb la contrasenya inicial, baixeu un fitxer nou amb la vostra contrasenya. Si l'autor no ha canviat els encàrrecs, també podeu tornar a pujar el fitxer que havíeu guardat.

Les tandes i el treball de l'alumnat són a Firebase i no es perden en actualitzar l'app.

## Dades i privacitat

- L'app no demana cap dada personal. Els grups porten noms de trens i entren amb un codi i un PIN.
- Les dades són al vostre projecte de Firebase, a la ubicació que vau triar al pas 5. Només hi pot accedir el compte de Google que l'ha creat (i els que hi afegiu a **Project settings › Users and permissions**).
- Al cap de 120 dies, cada tanda caduca i ja no s'hi pot entrar. Per esborrar-ne les dades del tot: a **Firestore Database › Data**, obriu `tandes`, toqueu els tres punts de la tanda i trieu **Delete document**, marcant que s'esborrin també les subcol·leccions.
- Les notes individuals no entren mai a l'app.

## Si alguna cosa no funciona

| Què passa | Què cal revisar |
|---|---|
| El panell diu «La contrasenya no és correcta» | La contrasenya del panell distingeix majúscules i minúscules. Si l'acabeu de canviar, espereu dos minuts i recarregueu amb Ctrl+F5. |
| No es pot crear una tanda | Pas 4 (accés anònim activat i domini autoritzat), pas 5 (regles publicades) i pas 7 (configuració sense comes ni claus esborrades). |
| L'app es queda en blanc | Normalment, un error en editar `js/config.js`. Obriu el fitxer a GitHub i compareu-lo amb l'exemple del pas 7. Amb el botó **History** podeu tornar a la versió anterior. |
| Les targetes mostren l'adreça antiga | Pas 7, punt 4 (`URL_APP`). |
| Al panell surt «Mode local: la tanda només existeix en aquest navegador» | `FIREBASE_CONFIG` és `null` o està mal escrit. |
| L'adreça de GitHub Pages dona error 404 | Pas 2: espereu uns minuts i comproveu que la font és `main` i `/ (root)`. |

## Llicència

El codi de l'app té llicència [AGPLv3](LICENSE) i els continguts (encàrrecs, horaris, mapa i materials), [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.ca). Podeu fer servir, adaptar i compartir l'app sense finalitat comercial, mantenint el peu amb l'autoria i la mateixa llicència. Si hi feu canvis i la publiqueu, el codi modificat també ha de ser públic.

Disseny de la situació d'aprenentatge i de l'app: Felip Sarroca, amb assistència de la IA. Suggeriments i errors: [formulari del repositori](https://github.com/felipsarroca/jocs/issues/new?template=ferrocarril.yml).
