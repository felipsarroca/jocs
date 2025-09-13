# Slither Link

## Resum ràpid

- Joc de trencaclosques tipus Slither Link jugable al navegador.
- Sense dependències ni compilació: obre `index.html` i juga.
- Dificultats: molt fàcil, fàcil, normal, difícil i molt difícil.
- Controls: clic esquerre (traç), clic dret (marcar X/descartar), botons d’ajuda.
- Aplicació realitzada per Felip Sarroca amb l'assistència de la IA.
- Llicència: CC BY-SA 4.0 — https://creativecommons.org/licenses/by-sa/4.0/deed.ca

## Descripció

Slither Link és un trencaclosques l’objectiu del qual és dibuixar un únic **bucle tancat** que passi per les arestes d’una graella. Els números dins d’algunes cel·les indiquen quantes de les seves quatre arestes formen part del bucle. No es poden crear bifurcacions ni segments solts: el resultat final ha de ser un circuit tancat i continu.

Aquest projecte és una implementació en una sola pàgina (`index.html`) amb HTML, CSS i JavaScript (SVG) i es pot executar localment sense cap instal·lació prèvia.

## Com jugar

1. Obre el fitxer `index.html` amb un navegador modern (Chrome, Edge, Firefox o Safari).
2. Tria la dificultat al desplegable.
3. Prem «Nou puzzle» per generar una graella.
4. Interacció amb el tauler:
   - Clic esquerre sobre una aresta: dibuixa/elimina un segment del bucle.
   - Clic dret sobre una aresta: marca/desmarca una X per indicar que aquella aresta no formarà part del bucle.
5. Botons d’ajuda:
   - «Comprovar»: valida la solució. Si no és correcta, es pot mostrar la solució correcta i els errors quedaran destacats.
   - «Pista»: destaca en verd els números satisfets i marca en vermell incoherències o línies que no encaixen amb la solució.
   - «Netejar»: esborra totes les marques i línies del tauler.
   - «Instruccions»: obre una finestra amb les normes bàsiques.

## Dificultats

Les opcions de dificultat ajusten la mida de la graella:

- Molt fàcil: 4×4 o 5×5
- Fàcil: 6×6 o 7×7
- Normal: 8×8 o 9×9
- Difícil: 10×10 o 11×11
- Molt difícil: 12×12 o 13×13

## Característiques

- Interfície neta i responsiva amb SVG.
- Generació automàtica de puzles segons la dificultat escollida.
- Validació de solucions i sistema de pistes visual.
- Controls ràpids amb el ratolí (clic esquerre i dret).
- Sense dependències externes ni compilació.

## Execució local i desplegament

- Local: fes doble clic a `index.html` o obre’l des del navegador amb «Obre fitxer…». Si el navegador mostra caràcters estranys, assegura’t que la codificació sigui **UTF-8**.
- GitHub Pages: pots publicar el joc des de la branca principal configurant GitHub Pages perquè serveixi el contingut des de l’arrel del repositori. L’URL resultant (ex.: `https://usuari.github.io/SlitherLink/`) carregarà `index.html` automàticament.

## Estructura del projecte

- `index.html`: codi complet del joc (HTML, CSS i JS, amb SVG per al tauler i la interacció).

## Tecnologies utilitzades

- HTML5, CSS3 (disposició responsiva i estil) i JavaScript pur.
- SVG per al dibuix de la graella, nodes i arestes interactives.
- Google Fonts (Montserrat) per a la tipografia.

## Idees per a docents

- Matemàtiques: raonament lògic, estratègies d’inferència i verificació de restriccions; treball de patrons i grafisme bàsic (arestes, nodes, circuits tancats).
- Competència digital: ús d’eines interactives i interpretació de feedback visual.
- Metodologies: resolució de problemes en parelles o petits grups; pensament en veu alta; comparació d’estratègies i justificació de solucions.
- Avaluació formativa: demana als alumnes que expliquin per què una aresta pot o no pertànyer al bucle segons el número de la cel·la i el context del voltant.

### Rúbrica breu (orientativa)

- Comprensió de les regles: aplica correctament la relació número–arestes.
- Estratègia: utilitza pistes locals i globals (continuïtat del circuit) de manera coherent.
- Precisió: minimitza errors i corregeix-los amb l’ajuda del feedback.
- Autonomia i col·laboració: resol individualment i/o comparteix raonaments en grup.

## Crèdits i llicència

- Aplicació realitzada per Felip Sarroca amb l'assistència de la IA.
- Llicència: **Creative Commons BY-SA 4.0** — https://creativecommons.org/licenses/by-sa/4.0/deed.ca

Pots compartir i adaptar l’obra amb reconeixement d’autoria i compartint sota la mateixa llicència.

