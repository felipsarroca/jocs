# Tantrix Discovery

Aplicació web progressiva en català per jugar els deu reptes oficials de Tantrix Discovery, de 3 a 10 fitxes. Funciona primer al dispositiu, sense registre ni contrasenya, i pot sincronitzar només les primeres superacions amb un Google Sheets privat.

## Posada en marxa

Cal tenir Node.js 20.19 o posterior.

```powershell
npm install
npm run dev
```

Vite mostrarà l’adreça local. La versió de producció es genera a `dist`:

```powershell
npm run build
npm run preview
```

Per preparar la versió estàtica que GitHub Pages publica des de la mateixa carpeta `Tantrix/`:

```powershell
npm run build:pages
```

La font HTML de Vite és `index.source.html`. L’ordre anterior genera `index.html`, `sw.js`, el manifest instal·lable i els actius compilats de l’arrel pública sense incloure dependències, resultats de proves ni configuració privada.

## Verificació

```powershell
npm run test
npm run build
npm run test:pwa
npm run test:pages
npm run test:e2e
npm run test:remote
```

`npm run test:all` executa la bateria local seguida. Les proves E2E cobreixen mòbil petit de 320 px, mòbil vertical, tauleta vertical, ordinador i mòbil horitzontal. `test:pwa` comprova una arrencada real sense xarxa després d’instal·lar el service worker. `test:remote` comprova des del navegador el backend de producció sense crear cap jugador ni fita al full.

## Google Sheets de producció

L’app està connectada a un Google Sheets privat mitjançant un projecte d’Apps Script gestionat amb `clasp`. L’adreça del full i l’endpoint no es mostren a la interfície ni es documenten aquí.

El full conté exactament quatre pestanyes:

- `CONFIG`
- `PLAYERS`
- `COMPLETIONS`
- `RANKING`

Per actualitzar el backend després de modificar `apps-script`:

```powershell
clasp push --force
clasp deploy --deploymentId $env:TANTRIX_DEPLOYMENT_ID --description "Descripció de la versió"
```

El fitxer local `.clasp.json` conserva la vinculació i està exclòs de Git. Si cal reconstruir-la en un altre ordinador, s’ha de clonar el projecte amb el seu Script ID i conservar `apps-script` com a `rootDir`.

Per crear una instal·lació nova, independent de l’actual:

1. Crea un Google Sheets privat anomenat `Tantrix Discovery – Progrés i rànquing`.
2. Crea un projecte de Google Apps Script i copia-hi els fitxers de `apps-script`.
3. A les propietats de l’script, afegeix `SPREADSHEET_ID` amb l’identificador del full.
4. Executa manualment `setupSpreadsheet()` i després `runSelfTests()`.
5. Desplega’l com a aplicació web, executada pel propietari i accessible per als jugadors que l’hagin d’utilitzar.
6. Configura `DEFAULT_APPS_SCRIPT_URL` a `src/config.js` amb l’URL acabada en `/exec`, sense publicar-la en captures ni documentació d’usuari.

Google Sheets només rep una fita quan un repte se supera per primera vegada. Moviments, girs, zoom, desfer/refer i repeticions es desen exclusivament al dispositiu. Si la xarxa o Google fallen, el joc continua i la cua es reintenta més endavant.

El full és exclusivament persistència privada: la graella de Sheets no s’incrusta ni es mostra dins l’app. El rànquing es renderitza amb targetes pròpies agrupades per progrés.

## Estructura

- `src/data`: fitxes i reptes immutables.
- `src/domain`: geometria, rotació, validació i rànquing.
- `src/game`: estat, historial i partida.
- `src/storage`: persistència local amb IndexedDB.
- `src/api`: cua local i sincronització per lots.
- `apps-script`: backend independent i validador de servidor.
- `tests`: 54 proves unitàries i 30 fluxos E2E, inclòs el catàleg visual de les deu fitxes.
- `qa`: informe i captures de revisió visual.

La font funcional de veritat és `especificacio_app_tantrix_discovery.md`.
