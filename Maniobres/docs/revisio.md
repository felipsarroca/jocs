# Revisió crítica de Maniobres 1.0

Revisió feta durant el desenvolupament el 20 de novembre de 2026. No equival a un pilot amb alumnat.

## Problemes detectats i corregits

1. **Tauler massa alt en portàtil.** S’han compactat les targetes i s’ha eliminat espai redundant. A 1366 × 768 el joc i els controls caben en una pantalla.
2. **Vagons petits en mòbil.** Geometria SVG específica per a finestres estretes i recàlcul en canviar l’amplada. No hi ha desplaçament horitzontal a 390 px.
3. **Escalat del sistema.** S’han comprovat finestres equivalents al 125 % i 150 %. La vista curta prioritza el tauler, el recompte i els controls, mantenint desplaçament vertical quan l’espai és insuficient.
4. **Estat inicial mostrat com a bloquejat mentre es carregava la taula.** S’ha corregit l’ordre d’inicialització i es diferencia el càlcul pendent del resultat sense solució.
5. **Un moviment invàlid podia contaminar desfer.** Ara es valida i calcula el moviment abans d’afegir la còpia a l’historial. Prova específica amb una tecla invàlida seguida d’una maniobra vàlida.
6. **Àrea SVG de clic poc fiable.** S’ha ampliat la zona interactiva i s’han conservat botons de via i teclat com a alternatives completes.
7. **Partida lliure limitada al catàleg.** El Worker selecciona ara entre totes les situacions inicials del nivell. Els enllaços versionats reprodueixen la partida.
8. **Objectiu massa repetitiu.** Barreja determinista de les etiquetes visibles; el mateix repte conserva els mateixos números entre dispositius i fitxes.
9. **Rànquing potencialment acumulatiu.** Millor resultat per dia, reinici mensual, ocultació als 30 dies i neteja física programada. Prova d’enviament duplicat sense sumar punts.
10. **Classificació sense context.** Pòdium, temporada, termini de renovació, puntuació explícita, empats compartits i estat buit honest. Les captures de proves estan identificades; les dades temporals s’han eliminat.
11. **Sales gestionables per tercers.** Exportació i esborrament exigeixen el token del creador. Les taules no són accessibles des del client. Prova real de rebuig d’un altre jugador.
12. **Partides desades malformades.** Es comproven capacitats, identitats i historial; una dada invàlida inicia una partida segura.
13. **Historial inaccessible en pantalles petites.** També es pot obrir des de la barra d’eines.
14. **Pèrdua d’animació durant el càlcul.** La resposta del Worker respecta la transició visual abans de reconstruir el tauler.

## Comprovacions

- Enumeració completa del model clàssic: 356.160 estats, 67.200 inicials, 32 de 17 moviments.
- Solució òptima de tots els 818 puzles del catàleg i verificació de les set variants.
- Legalitat, conservació de vagons, capacitats i reversibilitat.
- Joc amb ratolí i teclat, victòria, desfer, reproducció òptima i recuperació de partida.
- Generació lliure, recuperació mitjançant URL, fitxa amb QR i recàrrega sense connexió.
- Navegació de tots els apartats sense errors JavaScript.
- Servidor real: rebuig de seqüències falses i dates passades, puntuació, millor resultat, sales, permisos, CSV i esborrament.
- RLS i permisos revisats. L’avís informatiu de RLS sense polítiques és intencional: l’accés directe està denegat i només opera el servei de validació.
- Tasca de caducitat activa; cap jugador ni sala de prova conservats després de les comprovacions.

## Límits explícits

El rànquing és lúdic: verificar una seqüència no demostra que el jugador no hagi utilitzat ajuda externa. Les sales no tenen recuperació de comptes i depenen del navegador creador. El Laboratori no permet configuracions arbitràriament grans. No s’han incorporat duels en temps real, traduccions, restriccions de mercaderies ni desbloquejos estètics: són ampliacions posteriors, no funcions simulades. Els èxits i la ratxa (1.1) són locals al dispositiu i no participen en el rànquing. La proposta inicial queda conservada com a document d’origen; aquest fitxer i el README descriuen la versió real.

Cal contrastar amb alumnat la comprensió de les maniobres, els temps i la dificultat percebuda. La distància mínima no és una mesura completa de la dificultat humana.
