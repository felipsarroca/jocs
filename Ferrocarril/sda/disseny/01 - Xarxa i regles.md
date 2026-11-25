# Xarxa peninsular i reglament · edició 4

**39 ciutats, 96 circulacions al dia, quatre dies simulats.** Cada fila és un tren que es repeteix els dies D1, D2, D3 i D4. El codi del tren i el dia junts identifiquen la circulació. Les ciutats i els grans eixos tenen referents geogràfics reals. Els serveis, les parades seleccionades, els preus i els horaris estan dissenyats per al joc. En particular, les continuïtats internacionals de les files de joc representen connexions simplificades.

## Com llegir i dibuixar el mapa

Mapa complet des del primer dia. Marcar els següents eixos amb noms de ciutats sencers. Les files de l'horari que se salten una estació no generen un enllaç físic nou al mapa. Per exemple, I3 uneix Barcelona i Madrid amb poques dades per llegir, mentre que AX s'atura a Lleida, Saragossa i Calataiud. Una ciutat representa les seves terminals mitjançant una sola estació de joc.

| Eix de la xarxa | Estacions en ordre |
|---|---|
| AX | Barcelona — Lleida — Saragossa — Calataiud — Madrid |
| NE | Barcelona — Girona — Figueres |
| NO | Saragossa — Pamplona |
| EB | Saragossa — Logronyo — Burgos |
| NP | Pamplona — Burgos — Valladolid |
| CA | Madrid — Segòvia — Valladolid — Burgos |
| GL | Madrid — Segòvia — Ourense — Santiago de Compostel·la |
| MI | Santiago de Compostel·la — Vigo — Valença — Viana do Castelo — Porto |
| PT | Lisboa — Entroncamento — Coïmbra — Aveiro — Porto |
| OE | Lisboa — Caldas da Rainha — Leiria — Coïmbra |
| XP | Entroncamento — Elvas — Badajoz |
| EX | Badajoz — Mèrida — Càceres — Madrid |
| SU | Madrid — Ciutat Real — Còrdova — Sevilla |
| MA | Còrdova — Màlaga |
| LV | València — Albacete — Alacant |
| AM | Madrid — Conca — Albacete — Alacant |
| LN | Valladolid — Lleó |
| VG | Ourense — Vigo |
| Costa mediterrània | Barcelona — Tarragona — Castelló de la Plana — València |
| Centre i llevant | Madrid — Conca — València |

En dibuixar l'esquema, M–Q–ALB i M–Q–V comparteixen el primer tram. En els serveis PT i PX, el ràpid passa pel mateix eix. La trama compta amb dues entrades a Portugal, per Badajoz–Elvas i pel corredor Vigo–Valença. Per evitar una falsa unió cartogràfica a la zona de Saragossa, representar cada eix amb el seu nom i indicar només a les ciutats etiquetades on es pot canviar de tren.

**Trens que passen sense parar.** Aquests 19 salts de l'horari recorren trams del mapa on el tren no s'atura. No s'hi pot baixar, però un tall de via en qualsevol d'aquests trams també els atura (R9). El mapa, els panells de sortides i l'app han de mostrar-ho igual. Cada salt correspon a un sol recorregut del mapa; el verificador ho comprova.

| Tren | Tram | Passa sense parar per |
|---|---|---|
| I2 | Saragossa → Madrid | Calataiud |
| I3 | Barcelona → Madrid | Lleida, Saragossa, Calataiud |
| I4 | Madrid → Saragossa | Calataiud |
| I6 | Saragossa → Barcelona | Lleida |
| E3 | Tarragona → València | Castelló de la Plana |
| E5 | València → Barcelona | Castelló de la Plana, Tarragona |
| E7 | Tarragona → València | Castelló de la Plana |
| PXA1, PXA2 | Lisboa → Porto | Entroncamento, Coïmbra, Aveiro |
| PXR1, PXR2 | Porto → Lisboa | Aveiro, Coïmbra, Entroncamento |
| MXA1, MXA2 | Madrid → Saragossa → Barcelona | Calataiud i Lleida |
| MXR1, MXR2 | Barcelona → Saragossa → Madrid | Lleida i Calataiud |

**Clau de noms.** Al material de l'alumnat i a l'app s'escriuen sempre els noms sencers de les ciutats (per exemple, Valença i València no es poden confondre). Els codis d'estació només apareixen en aquest horari mestre i al solucionari docent. B = Barcelona · L = Lleida · Z = Saragossa · M = Madrid · Q = Conca · V = València · K = Castelló de la Plana · T = Tarragona · CAL = Calataiud · GIR = Girona · FIG = Figueres · PAM = Pamplona · LOG = Logronyo · BUR = Burgos · VLL = Valladolid · SEG = Segòvia · LEO = Lleó · OUR = Ourense · VIG = Vigo · SAN = Santiago de Compostel·la · COR = Còrdova · SEV = Sevilla · MAL = Màlaga · CR = Ciutat Real · MER = Mèrida · CAC = Càceres · BAD = Badajoz · ELV = Elvas · ENT = Entroncamento · LIS = Lisboa · COI = Coïmbra · AVE = Aveiro · POR = Porto · VIA = Viana do Castelo · VAL = Valença · LEI = Leiria · CLD = Caldas da Rainha · ALI = Alacant · ALB = Albacete.

Referències per a la cartografia de producció: [mapa de línies de Renfe](https://www.renfe.com/es/es/viajar/informacion-util/mapas-y-lineas/ave-y-larga-distancia), [xarxa ferroviària d'Adif](https://www.adif.es/sobre-adif/red-ferroviaria/mapa), [mapa de Comboios de Portugal](https://www.cp.pt/info/documents/d/cp/mapa-servicos-comboios) i [connexió internacional per Entroncamento i Badajoz](https://cp.pt/info/pt/raiano).

## Reglament comú

- **Trajecte.** Es pot comprar qualsevol porció contínua d'una fila en el sentit imprès. Cal sumar els preus dels segments recorreguts. Un bitllet cobreix totes les parades intermèdies. Per continuar en el mateix tren no cal baixar, comprar un segon bitllet ni aplicar un marge de canvi.
- **Temps.** Una sola hora de joc a tota la península. A cada parada intermèdia s'utilitza el mateix minut per a l'arribada i la sortida. Calen 10 minuts o més per canviar de circulació a la mateixa ciutat. Una visita exigeix baixar i quedar-s'hi **almenys 2 hores (120 minuts)** abans del tren següent. Inclou el temps de canvi. Una parada d'entre 10 i 119 minuts és un canvi de tren i no compta com a visita. La nit compta: n'hi ha prou d'escriure «nit», sense comptar els minuts. Al final del viatge Barcelona no compta com a visita. Una ciutat només puntua una vegada. Si la reparació de R9 prolonga una estada a l'estació de l'avís, es compta des de l'arribada efectiva fins a la nova sortida. Passar per Barcelona assegut dins del mateix tren permet continuar el viatge. Baixar-hi de tornada el tanca. Els càlculs entre dies sumen 1.440 minuts per dia.
- **Gran viatge (R7, R8 i R9).** Surt de Barcelona el D1 i acaba en baixar per primera vegada de tornada a Barcelona, fins al D4 a les 21.00 incloses. El pressupost de 180 € representa un viatger per grup. Allotjament i àpats coberts. Ha de visitar Madrid i dues ciutats diferents més. Totes les ciutats fora de Barcelona són elegibles. S'accepta qualsevol itinerari vàlid. Els reptes curts (R1 a R6) tenen les seves pròpies condicions, indicades a l'enunciat.
- **Via tallada (R9).** Una sola regla per a tots els grups, aplicada al viatge lliurat a R7. En baixar del primer tren, el grup rep l'avís (l'app el calcula): **el primer tram del mapa que havia de recórrer el seu segon tren queda tallat tot aquell dia, en tots dos sentits.** Cap tren hi pot circular aquell dia, tampoc els que hi passen sense parar. Els altres dies el tram funciona amb normalitat. Es mantenen el primer bitllet i la seva despesa. Els bitllets futurs es poden canviar amb reemborsament complet. La nova partida surt de l'estació on han baixat i a l'hora en què hi han arribat; el còmput de visita i canvi comença en baixar. El pressupost i el termini es mantenen. S'ha comprovat que l'avís té reparació per a qualsevol inici vàlid del gran viatge (documents 07 i 09).
- **Desempat.** Viabilitat i preferència s'avaluen per separat. Si dues ofertes compleixen igualment el que demana el repte, és vàlid defensar-ne qualsevol amb dades. Els llindars dels nivells de R8 figuren al document 02.

## Horari mestre

Llegir d'esquerra a dreta. Les files d'anada A1/A2 i de retorn R1/R2 indiquen dues sortides en cada sentit de la família corresponent. La línia de l'oest es diu OE (no PO) perquè cap codi de tren no recordi Porto. L'alumnat no veu mai aquests codis: a la guixeta de l'app cada tren s'identifica per l'hora de sortida i la destinació final, i els encàrrecs es diuen R1 a R9. L'alumnat no consulta aquesta taula sinó la guixeta, que mostra el **panell de sortides** de cada estació (document 08, generat automàticament). La taula per eixos queda per al docent.

| Tren | Estacions i hores | Euros per segment |
|---|---|---|
| I1 | B 08.00 · L 09.00 · Z 10.00 | 9 + 9 |
| I2 | Z 11.00 · M 12.40 | 22 |
| I3 | B 09.30 · M 12.15 | 48 |
| I4 | M 08.00 · Z 09.40 | 22 |
| I5 | Z 12.00 · L 13.00 · B 14.00 | 9 + 9 |
| I6 | Z 13.10 · B 14.40 | 27 |
| I7 | Z 14.00 · L 15.10 · B 16.30 | 7 + 7 |
| C1 | M 14.00 · Q 15.00 · V 16.00 | 13 + 13 |
| C2 | V 14.00 · Q 15.00 · M 16.00 | 13 + 13 |
| E1 | B 08.00 · T 09.00 | 10 |
| E2 | T 10.00 · K 11.30 · V 12.30 | 12 + 8 |
| E3 | B 09.00 · T 10.00 · V 12.00 | 14 + 18 |
| E4 | V 12.00 · K 13.00 · T 14.30 · B 15.30 | 8 + 10 + 8 |
| E5 | V 13.30 · B 16.00 | 33 |
| E6 | V 14.00 · K 15.10 · T 16.40 · B 17.50 | 7 + 8 + 7 |
| E7 | T 09.05 · V 11.05 | 20 |
| AXA1 | B 07.00 · L 08.05 · Z 09.00 · CAL 09.35 · M 10.50 | 10 + 9 + 6 + 11 |
| AXA2 | B 13.30 · L 14.35 · Z 15.30 · CAL 16.05 · M 17.20 | 10 + 9 + 6 + 11 |
| AXR1 | M 07.00 · CAL 08.15 · Z 08.50 · L 09.45 · B 10.50 | 11 + 6 + 9 + 10 |
| AXR2 | M 13.30 · CAL 14.45 · Z 15.20 · L 16.15 · B 17.20 | 11 + 6 + 9 + 10 |
| NEA1 | B 07.00 · GIR 07.40 · FIG 08.05 | 8 + 5 |
| NEA2 | B 13.30 · GIR 14.10 · FIG 14.35 | 8 + 5 |
| NER1 | FIG 07.00 · GIR 07.25 · B 08.05 | 5 + 8 |
| NER2 | FIG 13.30 · GIR 13.55 · B 14.35 | 5 + 8 |
| NOA1 | Z 07.00 · PAM 08.45 | 15 |
| NOA2 | Z 13.30 · PAM 15.15 | 15 |
| NOR1 | PAM 07.00 · Z 08.45 | 15 |
| NOR2 | PAM 13.30 · Z 15.15 | 15 |
| EBA1 | Z 07.00 · LOG 08.35 · BUR 10.15 | 12 + 14 |
| EBA2 | Z 13.30 · LOG 15.05 · BUR 16.45 | 12 + 14 |
| EBR1 | BUR 07.00 · LOG 08.40 · Z 10.15 | 14 + 12 |
| EBR2 | BUR 13.30 · LOG 15.10 · Z 16.45 | 14 + 12 |
| NPA1 | PAM 07.00 · BUR 09.10 · VLL 10.05 | 18 + 8 |
| NPA2 | PAM 13.30 · BUR 15.40 · VLL 16.35 | 18 + 8 |
| NPR1 | VLL 07.00 · BUR 07.55 · PAM 10.05 | 8 + 18 |
| NPR2 | VLL 13.30 · BUR 14.25 · PAM 16.35 | 8 + 18 |
| CAA1 | M 07.00 · SEG 07.45 · VLL 08.30 · BUR 09.30 | 8 + 7 + 9 |
| CAA2 | M 13.30 · SEG 14.15 · VLL 15.00 · BUR 16.00 | 8 + 7 + 9 |
| CAR1 | BUR 07.00 · VLL 08.00 · SEG 08.45 · M 09.30 | 9 + 7 + 8 |
| CAR2 | BUR 13.30 · VLL 14.30 · SEG 15.15 · M 16.00 | 9 + 7 + 8 |
| GLA1 | M 07.00 · SEG 07.45 · OUR 10.20 · SAN 11.10 | 9 + 23 + 8 |
| GLA2 | M 13.30 · SEG 14.15 · OUR 16.50 · SAN 17.40 | 9 + 23 + 8 |
| GLR1 | SAN 07.00 · OUR 07.50 · SEG 10.25 · M 11.10 | 8 + 23 + 9 |
| GLR2 | SAN 13.30 · OUR 14.20 · SEG 16.55 · M 17.40 | 8 + 23 + 9 |
| MIA1 | SAN 07.00 · VIG 08.05 · VAL 08.50 · VIA 09.35 · POR 10.40 | 9 + 6 + 6 + 8 |
| MIA2 | SAN 13.30 · VIG 14.35 · VAL 15.20 · VIA 16.05 · POR 17.10 | 9 + 6 + 6 + 8 |
| MIR1 | POR 07.00 · VIA 08.05 · VAL 08.50 · VIG 09.35 · SAN 10.40 | 8 + 6 + 6 + 9 |
| MIR2 | POR 13.30 · VIA 14.35 · VAL 15.20 · VIG 16.05 · SAN 17.10 | 8 + 6 + 6 + 9 |
| PTA1 | LIS 07.00 · ENT 08.05 · COI 09.00 · AVE 09.35 · POR 10.30 | 8 + 7 + 5 + 8 |
| PTA2 | LIS 13.30 · ENT 14.35 · COI 15.30 · AVE 16.05 · POR 17.00 | 8 + 7 + 5 + 8 |
| PTR1 | POR 07.00 · AVE 07.55 · COI 08.30 · ENT 09.25 · LIS 10.30 | 8 + 5 + 7 + 8 |
| PTR2 | POR 13.30 · AVE 14.25 · COI 15.00 · ENT 15.55 · LIS 17.00 | 8 + 5 + 7 + 8 |
| OEA1 | LIS 07.00 · CLD 08.30 · LEI 09.30 · COI 10.45 | 8 + 6 + 7 |
| OEA2 | LIS 13.30 · CLD 15.00 · LEI 16.00 · COI 17.15 | 8 + 6 + 7 |
| OER1 | COI 07.00 · LEI 08.15 · CLD 09.15 · LIS 10.45 | 7 + 6 + 8 |
| OER2 | COI 13.30 · LEI 14.45 · CLD 15.45 · LIS 17.15 | 7 + 6 + 8 |
| XPA1 | ENT 07.00 · ELV 09.05 · BAD 09.35 | 12 + 5 |
| XPA2 | ENT 13.30 · ELV 15.35 · BAD 16.05 | 12 + 5 |
| XPR1 | BAD 07.00 · ELV 07.30 · ENT 09.35 | 5 + 12 |
| XPR2 | BAD 13.30 · ELV 14.00 · ENT 16.05 | 5 + 12 |
| EXA1 | BAD 07.00 · MER 07.45 · CAC 08.45 · M 11.50 | 6 + 8 + 21 |
| EXA2 | BAD 13.30 · MER 14.15 · CAC 15.15 · M 18.20 | 6 + 8 + 21 |
| EXR1 | M 07.00 · CAC 10.05 · MER 11.05 · BAD 11.50 | 21 + 8 + 6 |
| EXR2 | M 13.30 · CAC 16.35 · MER 17.35 · BAD 18.20 | 21 + 8 + 6 |
| SUA1 | M 07.00 · CR 07.55 · COR 09.00 · SEV 09.50 | 9 + 11 + 8 |
| SUA2 | M 13.30 · CR 14.25 · COR 15.30 · SEV 16.20 | 9 + 11 + 8 |
| SUR1 | SEV 07.00 · COR 07.50 · CR 08.55 · M 09.50 | 8 + 11 + 9 |
| SUR2 | SEV 13.30 · COR 14.20 · CR 15.25 · M 16.20 | 8 + 11 + 9 |
| MAA1 | COR 07.00 · MAL 08.05 | 10 |
| MAA2 | COR 13.30 · MAL 14.35 | 10 |
| MAR1 | MAL 07.00 · COR 08.05 | 10 |
| MAR2 | MAL 13.30 · COR 14.35 | 10 |
| LVA1 | V 07.00 · ALB 08.45 · ALI 09.50 | 13 + 9 |
| LVA2 | V 13.30 · ALB 15.15 · ALI 16.20 | 13 + 9 |
| LVR1 | ALI 07.00 · ALB 08.05 · V 09.50 | 9 + 13 |
| LVR2 | ALI 13.30 · ALB 14.35 · V 16.20 | 9 + 13 |
| AMA1 | M 07.00 · Q 08.05 · ALB 08.55 · ALI 10.05 | 10 + 8 + 12 |
| AMA2 | M 13.30 · Q 14.35 · ALB 15.25 · ALI 16.35 | 10 + 8 + 12 |
| AMR1 | ALI 07.00 · ALB 08.10 · Q 09.00 · M 10.05 | 12 + 8 + 10 |
| AMR2 | ALI 13.30 · ALB 14.40 · Q 15.30 · M 16.35 | 12 + 8 + 10 |
| LNA1 | VLL 07.00 · LEO 08.05 | 10 |
| LNA2 | VLL 13.30 · LEO 14.35 | 10 |
| LNR1 | LEO 07.00 · VLL 08.05 | 10 |
| LNR2 | LEO 13.30 · VLL 14.35 | 10 |
| VGA1 | OUR 07.00 · VIG 08.20 | 11 |
| VGA2 | OUR 13.30 · VIG 14.50 | 11 |
| VGR1 | VIG 07.00 · OUR 08.20 | 11 |
| VGR2 | VIG 13.30 · OUR 14.50 | 11 |
| PXA1 | LIS 07.00 · POR 09.35 | 38 |
| PXA2 | LIS 13.30 · POR 16.05 | 38 |
| PXR1 | POR 07.00 · LIS 09.35 | 38 |
| PXR2 | POR 13.30 · LIS 16.05 | 38 |
| MXA1 | M 07.00 · Z 08.15 · B 09.45 | 27 + 27 |
| MXA2 | M 13.30 · Z 14.45 · B 16.15 | 27 + 27 |
| MXR1 | B 07.00 · Z 08.30 · M 09.45 | 27 + 27 |
| MXR2 | B 13.30 · Z 15.00 · M 16.15 | 27 + 27 |
