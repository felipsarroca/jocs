/* SPDX-License-Identifier: AGPL-3.0-or-later */
/* Textos de l'app i missatges dels errors de l'avaluador, en llenguatge planer (A2).
   Els missatges diuen què falla, però mai no donen el càlcul fet. */

const pl = (n, u, p) => (n === 1 ? u : p);

/** Converteix un error de l'avaluador [codi, ...dades] en una frase per a l'alumnat */
export function textError(err, ctx) {
  const [codi, a, b] = err;
  const nom = (s) => ctx.nom(s);
  const est = (k) => nom(ctx.bitllets[k]?.[2]);
  switch (codi) {
    case 'buit': return 'Encara no heu comprat cap bitllet.';
    case 'tren': case 'parada': return `El bitllet ${a + 1} no és correcte. Esborreu-lo i torneu-lo a comprar.`;
    case 'origen': return `El viatge ha de començar a ${nom(a)}.`;
    case 'primer_dia': return 'El primer tren ha de sortir el dia 1.';
    case 'continuitat': return `El bitllet ${a + 1} no surt de l'estació on arriba el bitllet ${a}.`;
    case 'mateix_tren': return `Els bitllets ${a} i ${a + 1} són del mateix tren. Compreu un sol bitllet fins a l'estació on baixeu.`;
    case 'canvi': return `A ${est(a)} no teniu temps de canviar de tren: calen 10 minuts com a mínim.`;
    case 'torna_abans': return 'Torneu a Barcelona abans d\'acabar el viatge.';
    case 'primer_fix': return 'El primer bitllet no es pot canviar.';
    case 'tallat': return `El bitllet ${a + 1} passa pel tram tallat.`;
    case 'desti': return `El viatge ha d'acabar a ${nom(a)}.`;
    case 'termini': return `Arribeu massa tard. Heu d'arribar com a molt tard ${ctx.horaText(a)}.`;
    case 'arribada_dia': return `Heu de tornar a Barcelona el dia ${a}.`;
    case 'pressupost': return `El viatge costa més de ${a} €.`;
    case 'pressupost_reparacio': return `El viatge reparat costa més de ${a} €.`;
    case 'max_bitllets': return a === 1 ? 'Ha de ser un tren directe, sense canvis.' : `Feu-ho amb ${a} bitllets com a màxim.`;
    case 'min_bitllets': return 'Heu de canviar de tren.';
    case 'primer_surt': return `El primer tren ha de sortir a les ${a}.`;
    case 'primer_fins': return `El primer bitllet ha d'anar fins a ${nom(a)}.`;
    case 'primer_cap_a': return `El primer tren ha d'anar cap a ${nom(a)}.`;
    case 'visita': return `No visiteu ${nom(a)}: hi heu de ser 2 hores com a mínim, o passar-hi la nit.`;
    case 'min_visites': return `Heu de visitar ${a} ${pl(a, 'ciutat', 'ciutats')} com a mínim.`;
    case 'alguna_de': return 'Encara no heu aconseguit cap de les millores que demana el client.';
    case 'objectiu':
      if (a === 'mes_barat') return 'El viatge és correcte, però n\'hi ha un de més barat.';
      if (a === 'arriba_abans') return 'El viatge és correcte, però hi ha un tren que arriba abans.';
      if (a === 'max_estada') return 'El viatge és correcte, però podeu ser-hi més temps.';
      return 'El viatge és correcte, però encara no és el que demana el client.';
    default: return 'Hi ha alguna cosa que no quadra.';
  }
}

export const TEXTOS = {
  app: 'Pròxima sortida',
  lema: 'Agència de viatges en tren',
  acces: {
    titol: 'Entreu a la vostra agència',
    codi: 'Codi de la tanda',
    grup: 'Quin és el vostre grup?',
    pin: 'PIN del grup',
    entra: 'Entra',
    codiDolent: 'Aquest codi no existeix o ja ha caducat.',
    pinDolent: 'El PIN no és correcte.',
    xarxa: 'No hi ha connexió. Torneu-ho a provar.',
    local: 'Mode local: les dades es desen només en aquest navegador.'
  },
  nivells: ['Regional', 'Exprés', 'Alta velocitat'],
  botons: {
    comprova: 'Comprova',
    lliura: 'Lliura l\'encàrrec',
    seguent: 'Proveu el nivell',
    compra: 'Compra',
    esborra: 'Treu el bitllet',
    surt: 'Surt'
  }
};
