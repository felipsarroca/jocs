// SPDX-License-Identifier: AGPL-3.0-or-later
// Progrés local: experiència, títols, ratxa del repte diari, rècords i èxits.

export const TITLES = [
  [0, "Aprenent de maniobres"],
  [100, "Guardaagulles"],
  [300, "Maquinista"],
  [700, "Cap d’estació"],
  [1500, "Mestre d’agulles"],
];

export const ACHIEVEMENTS = [
  ["primer", "Primer tren", "Resol el primer puzle."],
  ["perfecte", "Perfecció", "Resol un puzle amb el mínim de moviments."],
  ["deu", "Deu perfectes", "Resol deu puzles amb el mínim."],
  ["sensedesfer", "Sense desfer", "Resol un puzle difícil sense desfer cap moviment."],
  ["sensajuda", "Sense ajuda", "Resol vint puzles seguits sense pistes."],
  ["velocista", "Velocista", "Resol un puzle mitjà en menys d’un minut."],
  ["tossut", "Tossut", "Resol un puzle després de cinc intents."],
  ["expert", "Expert", "Resol un puzle de 16 o 17 moviments."],
  ["disset", "Els disset", "Resol un dels 32 puzles de 17 moviments."],
  ["mestre", "Mestre d’agulles", "Resol un puzle de 17 moviments amb el mínim."],
  ["setmana", "Setmana completa", "Arriba a una ratxa de 7 dies al repte diari."],
  ["mes", "Mes de servei", "Arriba a una ratxa de 30 dies al repte diari."],
  ["enginyer", "Enginyer", "Juga en una estació del Laboratori."],
  ["investigador", "Investigador", "Troba un repartiment sense solució."],
  ["minima", "Estació mínima", "Resol un repte del Laboratori a l’estació petita o intermèdia."],
  ["explorador", "Explorador", "Juga en lliure, diari, línies, laboratori i contrarellotge."],
  ["linia", "Línia completa", "Tres estrelles a tots els nivells d’una línia."],
];

export const EXPLORER_MODES = ["free", "daily", "campaign", "lab", "sprint"];

export function emptyProgress() {
  return {
    xp: 0,
    solved: 0,
    perfect: 0,
    noHintRun: 0,
    best: {},
    restarts: {},
    days: [],
    modes: [],
    ach: {},
  };
}

export function normalize(p) {
  const e = emptyProgress();
  if (!p || typeof p !== "object") return e;
  for (const k of Object.keys(e))
    if (typeof p[k] !== typeof e[k] || Array.isArray(p[k]) !== Array.isArray(e[k]))
      p[k] = e[k];
  return p;
}

export function title(xp) {
  let i = 0;
  while (i + 1 < TITLES.length && xp >= TITLES[i + 1][0]) i++;
  const [from, name] = TITLES[i],
    next = TITLES[i + 1];
  return { name, from, to: next ? next[0] : null, next: next ? next[1] : null, level: i + 1 };
}

function shift(day, n) {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

// Dies seguits amb repte diari resolt. Es permet un dia de marge per setmana:
// un forat d'un dia no trenca la ratxa si no n'hi ha cap altre en els set dies anteriors.
export function streak(days, today) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(today || "")) return 0;
  const set = new Set(days);
  let day = set.has(today) ? today : shift(today, -1),
    count = 0,
    lastGrace = null;
  for (let guard = 0; guard < 4000; guard++) {
    if (set.has(day)) {
      count++;
      day = shift(day, -1);
      continue;
    }
    const before = shift(day, -1);
    if (count && set.has(before) && (lastGrace === null || daysBetween(day, lastGrace) >= 7)) {
      lastGrace = day;
      day = before;
      continue;
    }
    break;
  }
  return count;
}

function daysBetween(a, b) {
  return Math.abs(Date.parse(a) - Date.parse(b)) / 864e5;
}

export function rating(moves, min, hints) {
  const base = min == null ? 1 : moves === min ? 3 : moves <= min + 2 ? 2 : 1;
  return Math.max(1, base - (hints ? 1 : 0));
}

export function unlock(p, code, at = Date.now()) {
  if (p.ach[code]) return false;
  p.ach[code] = at;
  return true;
}

// Registra una partida acabada i retorna què ha canviat.
// g: { id, config, mode, min, moves, hints, undos, seconds, level, date }
export function record(p, g, ctx = {}) {
  normalize(p);
  const out = { unlocked: [], previous: p.best[g.id] ?? null, improved: false, xp: 0 };
  const stars = rating(g.moves, g.min, g.hints),
    perfect = g.min != null && g.moves === g.min && !g.hints;
  p.solved++;
  if (perfect) p.perfect++;
  p.noHintRun = g.hints ? 0 : p.noHintRun + 1;
  if (out.previous === null || g.moves < out.previous) {
    out.improved = out.previous !== null;
    p.best[g.id] = g.moves;
  }
  const restarts = p.restarts[g.id] || 0;
  delete p.restarts[g.id];
  out.xp = stars * 10 + (g.mode === "daily" && !g.hints ? 5 : 0);
  p.xp += out.xp;
  if (g.mode === "daily" && !g.hints && g.date && !p.days.includes(g.date)) {
    p.days.push(g.date);
    p.days = p.days.sort().slice(-400);
  }
  const s = streak(p.days, ctx.today || g.date || "");
  const checks = [
    ["primer", true],
    ["perfecte", perfect],
    ["deu", p.perfect >= 10],
    ["sensedesfer", g.min >= 13 && !g.undos && !g.hints],
    ["sensajuda", p.noHintRun >= 20],
    ["velocista", g.min >= 9 && g.min <= 12 && g.seconds < 60 && !g.hints],
    ["tossut", restarts >= 5],
    ["expert", g.min >= 16 && !g.hints],
    ["disset", g.min === 17 && !g.hints],
    ["mestre", g.min === 17 && perfect],
    ["setmana", s >= 7],
    ["mes", s >= 30],
    ["minima", g.mode === "lab" && ["mini", "intermedia"].includes(g.config)],
    ["linia", !!ctx.lineComplete],
  ];
  for (const [code, ok] of checks) if (ok && unlock(p, code)) out.unlocked.push(code);
  return out;
}

// Registra que s'ha començat una partida en un mode.
export function visit(p, mode) {
  normalize(p);
  const out = [];
  if (EXPLORER_MODES.includes(mode) && !p.modes.includes(mode)) p.modes.push(mode);
  if (mode === "lab" && unlock(p, "enginyer")) out.push("enginyer");
  if (EXPLORER_MODES.every((m) => p.modes.includes(m)) && unlock(p, "explorador"))
    out.push("explorador");
  return out;
}
