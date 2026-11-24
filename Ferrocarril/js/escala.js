/* SPDX-License-Identifier: AGPL-3.0-or-later */
/* Escala de la interfície en pantalles d'ordinador petites (com edu-apps/Equacions).
   La interfície està pensada per a 1440 × 800 px útils. En portàtils més petits
   (1366 × 768, o amb l'escalat del sistema al 125 % o 150 %) es redueix sencera, amb les
   mateixes proporcions. En tauletes, mòbils i finestres estretes no s'escala i
   s'aplica la disposició responsiva. Es recalcula en redimensionar o canviar de monitor. */
const BASE_W = 1440, BASE_H = 800, MIN_ZOOM = 0.7, MIN_ESCRIPTORI = 1100;

export function ajustaEscala() {
  const w = window.innerWidth, h = window.innerHeight;
  let z = Math.min(1, w / BASE_W, h / BASE_H);
  z = Math.max(MIN_ZOOM, Math.floor(z * 40) / 40);
  if (w < MIN_ESCRIPTORI) z = 1;
  const root = document.documentElement;
  root.style.setProperty('--ui-zoom', String(z));
  root.classList.toggle('compacte', w < MIN_ESCRIPTORI);
  root.classList.toggle('baix', h / z <= 700);
}

export function iniciaEscala() {
  ajustaEscala();
  window.addEventListener('resize', ajustaEscala);
  window.matchMedia?.('(resolution: 1dppx)')?.addEventListener?.('change', ajustaEscala);
}
