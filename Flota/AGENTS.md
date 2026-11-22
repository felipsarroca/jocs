# Enfonsar la flota

- Joc tradicional de batalla naval en català per a ordinador i mòbil (PWA), publicat a https://ja.cat/flota. Llegeix el README.
- Regles clàssiques: tauler 10 × 10, cinc vaixells, una casella d'aigua entre vaixells també en diagonal i un tret per torn. Les caselles del voltant només es marquen amb «tocat i enfonsat», mai amb «tocat».
- Codi de sala de quatre caràcters en minúscules i xifres (per exemple, `a3t5`); l'enllaç i el QR porten a la sala concreta.
- Estètica càlida i neta: Felip va rebutjar l'aspecte fred, el color crema i els marcs dins de marcs. Capçalera amb nom i icona grans. Favicon: vaixell dins d'una diana vermella, sense sol.
- Pantalla: cap desplaçament vertical a l'ordinador; les caselles s'adapten a l'alçada útil. Verifica a 1366 × 657, 1920 × 940, escalat del 125 % i mòbil. Al mòbil, el tauler queda sempre a la mateixa alçada entre torns, amb dues files fixes de text, i en acabar es veu el mar enemic. El tauler del mòbil no canvia mai sol (Felip, 1.3.0): un punt a «La teva flota» (blau, aigua; vermell, tocat) avisa del tret rival fins que s'hi entra.
- Textos: peu «Joc creat per Felip Sarroca», sense «amb assistència de la IA» ni enllaç de suggeriments; pantalla inicial sense redundàncies; pantalla final sense codi de sala ni hash, excepte un avís vermell si les flotes no coincideixen.
- So: breu i mai acumulat; cada so talla l'anterior. Aigua: xipoteig; tocat: cop metàl·lic i petita detonació; enfonsat: botzina d'alarma.
- A cada canvi, incrementa la versió del servei en segon pla i de la memòria cau, i comprova que la versió publicada és la nova.
- Velocitat (1.3.0): trets i respostes amb `updateDoc` i `arrayUnion`, mai amb transaccions (eren 4-6 vegades més lentes). Felip va trobar el joc «molt i molt lent»; mesura-ho amb dos navegadors abans i després de qualsevol canvi de xarxa.
