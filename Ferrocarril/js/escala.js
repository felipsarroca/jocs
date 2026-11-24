/* SPDX-License-Identifier: AGPL-3.0-or-later */
/* Escala de la interfície a l'espai útil de la finestra (com edu-apps/Equacions).
   La interfície està pensada per a 1440 × 740 px útils. En portàtils més petits (1366 × 768,
   o amb l'escalat del sistema al 125 % o 150 %) es redueix sencera, amb les mateixes proporcions,
   fins a un mínim llegible. En pantalles grans (1920 × 1080) s'amplia una mica perquè s'aprofiti
   l'espai i es llegeixi millor a distància. En tauletes, mòbils i finestres estretes no s'escala i
   s'aplica la disposició responsiva. Es recalcula en redimensionar o canviar de monitor. */
const BASE_W = 1440, BASE_H = 740, MIN_ZOOM = 0.72, MAX_ZOOM = 1.25, MIN_ESCRIPTORI = 1000;

export function ajustaEscala() {
  const w = window.innerWidth, h = window.innerHeight;
  let z = Math.min(MAX_ZOOM, w / BASE_W, h / BASE_H);
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
