# 🧩 Puzzle de Klotski

Un joc de trencaclosques clàssic implementat en HTML5, CSS3 i JavaScript pur.

## 📖 Descripció

El **Puzzle de Klotski** (també conegut com **Hua Rong Dao** en xinès) és un dels trencaclosques lliscants més famosos del món. L'objectiu és moure la peça vermella 2×2 fins a la sortida situada a la part inferior central del taulell.

## 🎮 Com jugar

1. **Objectiu**: Porta la peça vermella (2×2) fins a la sortida (marcada amb "SORTIDA")
2. **Moviment**: Arrossega les peces amb el ratolí o el dit (dispositius tàctils)
3. **Regla**: Les peces només es poden moure horitzontalment o verticalment
4. **Repte**: Intenta resoldre cada nivell amb el mínim de moviments possible

## 🧱 Tipus de peces

| Peça | Mida | Color | Quantitat |
|------|------|-------|-----------|
| Cao Cao (Principal) | 2×2 | 🟥 Vermell | 1 |
| Generals | 1×2 | 🟦 Blau | 4 |
| Guan Yu | 2×1 | 🟩 Verd | 1 |
| Soldats | 1×1 | 🟨 Groc | 4 |

## 📊 Nivells de dificultat

El joc inclou **400 nivells únics** ordenats per dificultat real (nombre mínim de moviments necessaris):

| Nivells | Moviments | Dificultat |
|---------|-----------|------------|
| 1-60 | 5-8 | ⭐ Fàcil |
| 61-120 | 9-12 | ⭐⭐ Fàcil+ |
| 121-180 | 13-18 | ⭐⭐⭐ Normal |
| 181-240 | 19-30 | ⭐⭐⭐⭐ Difícil |
| 241-300 | 31-49 | ⭐⭐⭐⭐⭐ Expert |
| 301-399 | Variable | 🔥 Mestre |
| **400** | **90** | **👑 Hua Rong Dao** |

> ℹ️ El nivell 400 és la configuració clàssica xinesa "Hua Rong Dao" que requereix 90 moviments per resoldre.

## ✨ Característiques

- ✅ **400 nivells únics** generats i verificats amb solucionador BFS
- ✅ **Sense nivells impossibles** - tots estan garantits solucionables
- ✅ **Dificultat progressiva** - ordenats per nombre de moviments
- ✅ **Selector de nivells** visual amb paginació
- ✅ **Cronòmetre** i comptador de moviments
- ✅ **Funció desfer** - corregeix els teus errors
- ✅ **Disseny responsive** - funciona en mòbil i escriptori
- ✅ **Animacions** i efectes visuals moderns
- ✅ **Confetti** i so de victòria
- ✅ **Persistència** - el progrés es guarda automàticament

## 🚀 Instal·lació

No cal instal·lació! Simplement obre el fitxer `index.html` en un navegador modern.

```bash
# Clonar el repositori (si és a GitHub)
git clone https://github.com/el-teu-usuari/puzzle-klotski.git

# Obrir el joc
start index.html  # Windows
open index.html   # macOS
```

## 📁 Estructura de fitxers

```
SuperSlide/
├── index.html          # Estructura HTML
├── styles.css          # Estils CSS
├── game.js             # Lògica del joc
├── levels-data.js      # 400 nivells pre-calculats
├── generate-levels.js  # Script per generar nivells (Node.js)
├── favicon.svg         # Icona del navegador
├── cc-license.png      # Imatge de llicència CC
├── nivells-klotski.csv # Taula Excel amb tots els nivells
└── README.md           # Aquest fitxer
```

## 🛠️ Tecnologies

- **HTML5** - Estructura
- **CSS3** - Estils moderns (gradients, animacions, flexbox, grid)
- **JavaScript ES6+** - Lògica del joc
- **Web Audio API** - Sons de victòria
- **LocalStorage** - Persistència de dades

## 📱 Compatibilitat

- ✅ Chrome, Firefox, Safari, Edge
- ✅ Dispositius tàctils (mòbils i tablets)
- ✅ Responsive design

## 📄 Llicència

Obra sota llicència **CC BY-NC-SA 4.0** (Creative Commons Reconeixement-NoComercial-CompartirIgual 4.0 Internacional)

## 👤 Autor

**Felip Sarroca** - [ja.cat/felipsarroca](https://ja.cat/felipsarroca)

Joc creat amb l'assistència de la IA.

---

*Gaudeix resolent els puzzles!* 🎉
