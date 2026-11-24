/* SPDX-License-Identifier: AGPL-3.0-or-later */
/* Utilitats de la interfície: creació d'elements, icones de línia i formats. */

export function h(tag, attrs = {}, ...fills) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const f of fills.flat()) {
    if (f == null || f === false) continue;
    el.append(f instanceof Node ? f : document.createTextNode(String(f)));
  }
  return el;
}

const P = {
  tren: '<rect x="5" y="3" width="14" height="14" rx="3"/><path d="M5 11h14M9 21l-2-4M15 21l2-4"/><circle cx="9" cy="14" r=".6"/><circle cx="15" cy="14" r=".6"/>',
  rellotge: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  moneder: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M16 12h3M3 9h18"/>',
  canvi: '<path d="M7 7h11l-3-3M17 17H6l3 3"/>',
  visita: '<path d="M12 21s-6-5.5-6-11a6 6 0 0 1 12 0c0 5.5-6 11-6 11z"/><circle cx="12" cy="10" r="2"/>',
  nit: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  creu: '<path d="M6 6l12 12M18 6L6 18"/>',
  cadenat: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  persona: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  avis: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/>',
  bitllet: '<path d="M3 7h18v3a2 2 0 0 0 0 4v3H3v-3a2 2 0 0 0 0-4z"/><path d="M14 7v10" stroke-dasharray="2 2"/>',
  estrella: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  sortida: '<path d="M10 4H5v16h5M14 8l4 4-4 4M18 12H9"/>',
  fletxa: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  calendari: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  copa: '<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H4a3 3 0 0 0 4 4M16 6h4a3 3 0 0 1-4 4M12 13v4M8 21h8M9 17h6"/>',
  mapa: '<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>',
  ull: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  impressora: '<path d="M6 9V3h12v6M6 18H4v-7h16v7h-2"/><rect x="6" y="14" width="12" height="7"/>',
  tisores: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4L8.1 15.9M14.5 14.5L20 20M8.1 8.1L12 12"/>',
  baixa: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  ajuda: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7M12 16.5v.5"/>',
  menys: '<path d="M6 12h12"/>',
  calculadora: '<rect x="5" y="3" width="14" height="18" rx="2.5"/><rect x="8" y="6" width="8" height="4" rx="1"/><path d="M8.5 14h.01M12 14h.01M15.5 14h.01M8.5 17.5h.01M12 17.5h.01M15.5 17.5h.01"/>',
  encarrec: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H11l-4.5 4v-4h0A2.5 2.5 0 0 1 4 13.5z"/><path d="M8 8h8M8 11.5h5"/>',
  ma: '<path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V10m0-1.5a1.5 1.5 0 0 1 3 0V11m0-1a1.5 1.5 0 0 1 3 0v4.5a6.5 6.5 0 0 1-6.5 6.5h-.6a6 6 0 0 1-4.6-2.2L4.2 15a1.6 1.6 0 0 1 2.5-2L9 15"/>',
  estacio: '<path d="M3 10l9-6 9 6"/><path d="M5 10v10h14V10M9 20v-5h6v5"/>',
  xevro: '<path d="M9 6l6 6-6 6"/>',
  avall: '<path d="M6 9l6 6 6-6"/>'
};

export function icona(nom, cls = '') {
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  s.setAttribute('viewBox', '0 0 24 24');
  s.setAttribute('class', `icona ${cls}`.trim());
  s.setAttribute('aria-hidden', 'true');
  s.innerHTML = P[nom] || '';
  return s;
}

const dos = (n) => String(n).padStart(2, '0');

/** hora del dia («07.40») a partir de minuts absoluts o del dia */
export const horaDia = (t, DAY = 1440) => `${dos(Math.floor((t % DAY) / 60))}.${dos(t % 60)}`;

/** «dia 2, 17.50» */
export const horaAmbDia = (t, DAY = 1440) => `dia ${Math.floor(t / DAY) + 1}, ${horaDia(t, DAY)}`;

/** «D4 21.00» -> «el dia 4 a les 21.00» */
export function horaText(txt) {
  const [d, hh] = txt.split(' ');
  return `el dia ${d.slice(1)} a les ${hh}`;
}

export const euros = (n) => `${n} €`;

export const punts = (n) => `${Number(n).toLocaleString('ca-ES')}`;

/** «8.05», «08:05», «805» -> minuts del dia (o null) */
export function llegeixHora(txt) {
  const m = String(txt || '').trim().match(/^(\d{1,2})\s*[.:,h' ]?\s*(\d{2})$/);
  if (!m) return null;
  const hh = Number(m[1]), mm = Number(m[2]);
  if (hh > 23 || mm > 59) return null;
  return hh * 60 + mm;
}

export function nombre(txt) {
  const s = String(txt ?? '').trim().replace(',', '.');
  if (s === '' || isNaN(Number(s))) return null;
  return Number(s);
}

export function avis(text, tipus = 'info', ms = 3500) {
  const caixa = document.getElementById('avisos');
  if (!caixa) return;
  const el = h('div', { class: `avis avis-${tipus}` }, text);
  caixa.append(el);
  setTimeout(() => el.classList.add('fora'), ms);
  setTimeout(() => el.remove(), ms + 400);
}
