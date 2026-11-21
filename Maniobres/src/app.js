// SPDX-License-Identifier: AGPL-3.0-or-later
import {
  CONFIGS,
  clone,
  key,
  canonical,
  move,
  moves,
  won,
  score,
  stars,
  hash,
  rng,
  puzzleFromKey,
} from "./engine.js";
import * as online from "./ranking.js";

const $ = (s) => document.querySelector(s),
  root = $("#app"),
  dialog = $("#dialog");
// En tancar, buida el diàleg perquè els seus botons no dupliquin els de la pàgina.
dialog.addEventListener("close", () => {
  // L'esdeveniment arriba més tard: si ja s'ha obert un altre diàleg, no l'esborris.
  if (dialog.open) return;
  dialog.innerHTML = "";
  delete dialog.dataset.locked;
});
dialog.addEventListener("cancel", (e) => {
  if (dialog.dataset.locked) e.preventDefault();
});
const paths = {
  play: "M5 3l14 9-14 9z",
  calendar: "M4 5h16v16H4zM8 2v6m8-6v6M4 10h16",
  route: "M5 4v14a3 3 0 006 0V6a3 3 0 016 0v14M2 4h6m6 16h6",
  trophy:
    "M7 3h10v7a5 5 0 01-10 0zM7 5H3v3a4 4 0 004 4m10-7h4v3a4 4 0 01-4 4m-5 3v6m-4 0h8",
  lab: "M9 3h6m-5 0v6L4 19a1 1 0 001 2h14a1 1 0 001-2L14 9V3M7 15h10",
  users:
    "M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2m18 0v-2a4 4 0 00-3-4M9 3a4 4 0 110 8 4 4 0 010-8m8 0a4 4 0 010 8",
  info: "M12 8h.01M12 11v6M22 12a10 10 0 11-20 0 10 10 0 0120 0",
  undo: "M9 5L3 11l6 6M3 11h11a6 6 0 016 6",
  reset: "M3 4v6h6M3 10a9 9 0 119 11",
  bulb: "M9 18h6m-6 3h6M8 15a7 7 0 118 0l-1 3H9z",
  print: "M6 8V2h12v6M6 17H3V8h18v9h-3M6 14h12v8H6z",
  sound: "M4 9h4l5-5v16l-5-5H4zM17 8a6 6 0 010 8m3-11a10 10 0 010 14",
  settings:
    "M12 8a4 4 0 110 8 4 4 0 010-8M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10l2 2M5 19l2-2M17 7l2-2",
  screen: "M3 3h18v14H3zM8 21h8m-4-4v4",
  clock: "M12 6v6l4 2M22 12a10 10 0 11-20 0 10 10 0 0120 0",
  arrow: "M4 12h16m-6-6l6 6-6 6",
  download: "M12 3v12m-5-5l5 5 5-5M4 16v5h16v-5",
  lock: "M6 11h12v10H6zM8 11V7a4 4 0 018 0v4",
  target: "M12 3a9 9 0 100 18 9 9 0 000-18zm0 4a5 5 0 100 10 5 5 0 000-10zm0 4.2a.8.8 0 100 1.6.8.8 0 000-1.6",
  train: "M7 4h10a3 3 0 013 3v8a3 3 0 01-3 3H7a3 3 0 01-3-3V7a3 3 0 013-3zM4 11h16M8.5 14.5h.01M15.5 14.5h.01M8 18l-2 3m10-3l2 3",
  swap: "M4 8h15m0 0l-3-3m3 3l-3 3M20 16H5m0 0l3-3m-3 3l3 3",
  rotate: "M7 3h7a2 2 0 012 2v8M3 14h14a2 2 0 012 2v3a2 2 0 01-2 2H5a2 2 0 01-2-2zM18 4l2 2-2 2M20 6h-2",
  help: "M9.1 9a3 3 0 015.8 1c0 2-3 3-3 3M12 17h.01M22 12a10 10 0 11-20 0 10 10 0 0120 0",
  menu: "M4 6h16M4 12h16M4 18h16",
  keyboard: "M3 6h18v12H3zM7 10h.01M11 10h.01M15 10h.01M7 14h10",
  motion: "M3 12h4l3-8 4 16 3-8h4",
  eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zm10-3a3 3 0 100 6 3 3 0 000-6",
  star: "M12 3.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z",
  check: "M20 6L9 17l-5-5",
  medal: "M12 15a6 6 0 100-12 6 6 0 000 12zM8.5 13.5L7 22l5-3 5 3-1.5-8.5",
};
function icon(n) {
  return `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[n] || paths.info}"/></svg>`;
}
const colors = [
  "#c9d3da",
  "#ff7a6b",
  "#ffb347",
  "#ffe066",
  "#7bd88f",
  "#5ccfe6",
  "#7ab8ff",
  "#b69cff",
  "#ff9ccf",
];
const esc = (x) =>
  String(x).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
let storageOK = true;
function read(k, f) {
  try {
    return JSON.parse(localStorage.getItem("maniobres-" + k)) ?? f;
  } catch {
    return f;
  }
}
function save(k, v) {
  try {
    localStorage.setItem("maniobres-" + k, JSON.stringify(v));
  } catch {
    storageOK = false;
  }
}
let prefs = read("prefs", {
  sound: false,
  reduced: matchMedia("(prefers-reduced-motion: reduce)").matches,
  minimum: true,
});
let solvedLocal = read("solved", []);
document.body.classList.toggle("reduced", prefs.reduced);
let catalog;
try {
  const r = await fetch("data/catalog.json");
  if (!r.ok) throw Error();
  catalog = await r.json();
} catch {
  root.innerHTML =
    '<p class="loading">No s’han pogut carregar les dades. Comprova la connexió i torna a obrir el joc.</p>';
  throw Error("Dades no disponibles");
}
let view = "play",
  difficulty = "facil",
  selected = 0,
  game = null,
  remaining = null,
  nextMove = null,
  solving = false,
  animationUntil = 0,
  requestId = 0,
  solverResolve = null,
  autoplay = false,
  preview = null,
  tutorialStep = 0,
  hintMove = null,
  rankLevel = "all",
  installEvent = null,
  player = null,
  board_ = null;
const LEVELS = {
  facil: ["Fàcil", 2, 8],
  mitja: ["Mitjà", 9, 12],
  dificil: ["Difícil", 13, 15],
  expert: ["Expert", 16, 17],
};
// Ordinals en català: 1r, 2n, 3r, 4t, 5è…
const ord = (n) => n + (n === 1 || n === 3 ? "r" : n === 2 ? "n" : n === 4 ? "t" : "è");
const levelOf = (min) =>
  Object.values(LEVELS).find(([, lo, hi]) => min >= lo && min <= hi)?.[0] || "";

const worker = new Worker(new URL("./solver-worker.js", import.meta.url), {
  type: "module",
});
worker.onmessage = ({ data }) => {
  if (data.verified) {
    verifyResolve?.(data.verified);
    verifyResolve = null;
    return;
  }
  if (data.generated) {
    start(data.generated);
    return;
  }
  if (data.request !== requestId) return;
  solving = false;
  remaining = data.d;
  nextMove = data.next;
  if (game.min === null && game.log.length === 0 && data.d != null) {
    game.min = data.d;
    persist();
  }
  if (data.error) toast(data.error);
  if (solverResolve) {
    solverResolve(data);
    solverResolve = null;
  }
  setTimeout(() => {
    if (view === "play" && data.request === requestId) renderGame();
  }, Math.max(0, animationUntil - Date.now()));
};
function solve() {
  solving = true;
  const id = ++requestId;
  worker.postMessage({ request: id, config: game.config, state: game.state });
}
function persist() {
  if (game) save("game", game);
}
function config() {
  return CONFIGS.find((c) => c.id === game.config);
}
function notify(msg) {
  onlineMessage = msg;
  const el = $("#online-message");
  if (el) el.textContent = msg;
}
function toast(s) {
  $("#toast").textContent = s;
  $("#toast").style.display = "block";
  clearTimeout(toast.t);
  toast.t = setTimeout(() => ($("#toast").style.display = "none"), 4500);
}
function elapsed() {
  return game ? Math.floor((Date.now() - game.started) / 1000) : 0;
}
function time(s) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
let audio = null,
  voice = null;
function sound(kind = "couple") {
  if (!prefs.sound) return;
  try {
    audio ||= new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === "suspended") audio.resume();
    voice?.disconnect();
    const t = audio.currentTime,
      out = audio.createGain();
    out.connect(audio.destination);
    voice = out;
    if (kind === "whistle") {
      // Xiulet de dues notes, curt i suau.
      for (const [f, a, b] of [
        [784, 0, 0.32],
        [988, 0.36, 0.85],
      ]) {
        const o = audio.createOscillator(),
          g = audio.createGain(),
          v = audio.createOscillator(),
          vg = audio.createGain();
        o.type = "triangle";
        o.frequency.value = f;
        v.frequency.value = 6;
        vg.gain.value = 9;
        v.connect(vg).connect(o.frequency);
        g.gain.setValueAtTime(0.0001, t + a);
        g.gain.exponentialRampToValueAtTime(0.06, t + a + 0.04);
        g.gain.exponentialRampToValueAtTime(0.0001, t + b);
        o.connect(g).connect(out);
        o.start(t + a);
        v.start(t + a);
        o.stop(t + b + 0.02);
        v.stop(t + b + 0.02);
      }
      return;
    }
    // Enganxada: soroll filtrat molt breu més un to metàl·lic greu.
    const len = Math.floor(audio.sampleRate * 0.09),
      buf = audio.createBuffer(1, len, audio.sampleRate),
      d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3;
    const n = audio.createBufferSource(),
      bp = audio.createBiquadFilter(),
      ng = audio.createGain(),
      o = audio.createOscillator(),
      og = audio.createGain();
    n.buffer = buf;
    bp.type = "bandpass";
    bp.frequency.value = 1900;
    bp.Q.value = 3;
    ng.gain.value = 0.22;
    n.connect(bp).connect(ng).connect(out);
    o.type = "square";
    o.frequency.setValueAtTime(240, t);
    o.frequency.exponentialRampToValueAtTime(120, t + 0.08);
    og.gain.setValueAtTime(0.025, t);
    og.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
    o.connect(og).connect(out);
    n.start(t);
    o.start(t);
    o.stop(t + 0.11);
  } catch {}
}
function pick(level = difficulty, cfg = "classic") {
  const ranges = {
    facil: [2, 8],
    mitja: [9, 12],
    dificil: [13, 15],
    expert: [16, 20],
  };
  const [lo, hi] = ranges[level] || [2, 20];
  let a = catalog.filter((p) => p.config === cfg && p.min >= lo && p.min <= hi);
  if (!a.length) a = catalog.filter((p) => p.config === cfg);
  return a[Math.floor(Math.random() * a.length)];
}
function start(p, mode = "free", extra = {}) {
  autoplay = false;
  const labels = Array.from(
      { length: CONFIGS.find((c) => c.id === p.config).n },
      (_, i) => i + 1,
    ),
    random = rng(hash(p.id));
  for (let i = labels.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [labels[i], labels[j]] = [labels[j], labels[i]];
  }
  game = {
    ...structuredClone(p),
    labels,
    initial: clone(p.state),
    log: [],
    undo: [],
    hints: 0,
    undos: 0,
    started: Date.now(),
    finished: false,
    mode,
    ...extra,
  };
  selected = 0;
  remaining = null;
  nextMove = null;
  preview = null;
  hintMove = null;
  view = "play";
  persist();
  solve();
  render();
}
// Clau del puzle per al rànquing: la posició inicial canònica del joc clàssic.
function puzzleKey(g = game) {
  return g.config === "classic" ? String(key(canonical(g.initial, 5))) : null;
}
function render() {
  root.innerHTML = `<div class="shell"><header class="topbar"><button class="brand" data-nav="play" aria-label="Maniobres, anar al joc"><img src="assets/favicon.svg" alt=""><span><strong>Maniobres</strong><small>Cada moviment compta</small></span></button><nav class="tabs-top" aria-label="Seccions"><button data-nav="play" class="${view === "play" ? "active" : ""}">${icon("play")} Jugar</button><button data-nav="ranking" class="${view === "ranking" ? "active" : ""}">${icon("trophy")} Rànquing</button><button data-nav="about" class="${view === "about" ? "active" : ""}">${icon("info")} Sobre el joc</button></nav><div class="top-actions"><button data-action="tutorial" aria-label="Com s’hi juga">${icon("help")} Com s’hi juga</button>${installEvent && !standalone() ? `<button class="install-btn" data-action="install" aria-label="Instal·la el joc">${icon("download")} Instal·la</button>` : ""}<button data-action="settings" aria-label="Preferències">${icon("settings")}</button></div></header><main id="main"></main></div>`;
  if (view === "play") renderGame();
  else if (view === "about") renderAbout();
  else renderRanking();
}
// Vagó de mercaderies vist des de dalt: bastidor, topalls, enganxall, caixa oberta amb taulons i
// muntants, i el número en un disc. Es dibuixa de x = 0 a 52, centrat en y = 0.
function wagon(w, x, y, extra = "") {
  return wagonArt(game.labels?.[w - 1] ?? w, x, y, extra);
}
function wagonArt(w, x, y, extra = "") {
  return `<g class="wagon" data-wagon="${w}" ${extra} transform="translate(${x} ${y})"><g fill="#262e30"><rect x="5" y="-23.5" width="14" height="6" rx="2.5"/><rect x="33" y="-23.5" width="14" height="6" rx="2.5"/><rect x="5" y="17.5" width="14" height="6" rx="2.5"/><rect x="33" y="17.5" width="14" height="6" rx="2.5"/></g><rect x="-2.5" y="-17" width="57" height="34" rx="2" fill="#323b3d"/><path d="M-9 0h9M52 0h9" stroke="#262e30" stroke-width="2.6" stroke-linecap="round"/><g stroke="#262e30" stroke-width="3"><path d="M-5 -12h5M-5 12h5M52 -12h5M52 12h5"/></g><g fill="#6c7778" stroke="#262e30" stroke-width="1"><circle cx="-5.5" cy="-12" r="3.3"/><circle cx="-5.5" cy="12" r="3.3"/><circle cx="57.5" cy="-12" r="3.3"/><circle cx="57.5" cy="12" r="3.3"/></g><rect x="0" y="-20" width="52" height="40" rx="4.5" fill="${colors[w]}"/><rect x="0" y="-20" width="52" height="40" rx="4.5" fill="url(#wagon-shade)" stroke="#1d2b3885" stroke-width="1.4"/><rect x="4" y="-16" width="44" height="32" rx="2" fill="url(#wagon-floor)"/><path d="M4.5 -10.6h43M4.5 -5.3h43M4.5 0h43M4.5 5.3h43M4.5 10.6h43" stroke="#1d2b381a" stroke-width=".9"/><rect x="4" y="-16" width="44" height="32" rx="2" fill="none" stroke="#ffffff80" stroke-width="1.1"/><g fill="#1d2b3838"><rect x="12.5" y="-20" width="2.4" height="4"/><rect x="24.8" y="-20" width="2.4" height="4"/><rect x="37.1" y="-20" width="2.4" height="4"/><rect x="12.5" y="16" width="2.4" height="4"/><rect x="24.8" y="16" width="2.4" height="4"/><rect x="37.1" y="16" width="2.4" height="4"/></g><circle cx="26" cy="1" r="11.6" fill="#1d2b3826"/><circle cx="26" cy="0" r="11.4" fill="#fff"/><text x="26" y="6" text-anchor="middle" font-family="system-ui" font-size="16.5" font-weight="900" fill="#1d2b38">${w}</text></g>`;
}
// Via amb balast, travesses i rails a ample constant (desplaçats sobre la normal, també a les corbes).
function trackPath(pts, rail = "#5f6c6d") {
  const n = pts.map((_, i) => {
      const p = pts[Math.max(0, i - 1)],
        q = pts[Math.min(pts.length - 1, i + 1)],
        dx = q[0] - p[0],
        dy = q[1] - p[1],
        l = Math.hypot(dx, dy) || 1;
      return [-dy / l, dx / l];
    }),
    line = (d) =>
      "M" + pts.map((p, i) => `${(p[0] + n[i][0] * d).toFixed(1)} ${(p[1] + n[i][1] * d).toFixed(1)}`).join("L"),
    c = line(0);
  return `<path d="${c}" fill="none" stroke="#cbbd9b" stroke-opacity=".55" stroke-width="34" stroke-linejoin="round"/><path d="${c}" fill="none" stroke="#b9a988" stroke-opacity=".5" stroke-width="26" stroke-linejoin="round" stroke-dasharray="1 3"/><path d="${c}" fill="none" stroke="#8d6e4f" stroke-width="25" stroke-dasharray="5.5 9.5" stroke-linejoin="bevel"/><path d="${line(-7)}${line(7)}" fill="none" stroke="${rail}" stroke-width="3.4" stroke-linejoin="round"/><path d="${line(-7.6)}${line(6.4)}" fill="none" stroke="#ffffff8c" stroke-width="1" stroke-linejoin="round"/>`;
}
function curvePoints(x0, y0, cx, cy, x1, y1, end) {
  const pts = [];
  for (let i = 0; i <= 28; i++) {
    const t = i / 28,
      u = 1 - t;
    pts.push([u * u * x0 + 2 * u * t * cx + t * t * x1, u * u * y0 + 2 * u * t * cy + t * t * y1]);
  }
  if (end > x1) pts.push([end, y1]);
  return pts;
}
// Topall de final de via: travessa amb franges vermelles i blanques.
function bufferStop(x, y) {
  return `<g transform="translate(${x} ${y})"><rect x="-1" y="-15" width="10" height="30" rx="2" fill="#5b4636"/><rect x="1" y="-19" width="7" height="38" rx="2" fill="#fff" stroke="#9b2a1c" stroke-width="1.2"/><path d="M1 -13h7M1 -5h7M1 3h7M1 11h7" stroke="#e5533d" stroke-width="4"/><rect x="-4" y="-12" width="5" height="6" rx="1.5" fill="#3b4547"/><rect x="-4" y="6" width="5" height="6" rx="1.5" fill="#3b4547"/></g>`;
}
// Locomotora de maniobres dièsel vista des de dalt: passadís metàl·lic amb baranes, cabina,
// capó llarg amb reixeta, ventiladors i tub d'escapament, fars i franges d'avís davant.
const LOCO = `<g class="loco-body"><g fill="#262e30"><rect x="4" y="-24.5" width="16" height="6" rx="2.5"/><rect x="36" y="-24.5" width="16" height="6" rx="2.5"/><rect x="4" y="18.5" width="16" height="6" rx="2.5"/><rect x="36" y="18.5" width="16" height="6" rx="2.5"/></g><g stroke="#262e30" stroke-width="3"><path d="M-6 -12h6M-6 12h6M56 -12h6M56 12h6"/></g><g fill="#6c7778" stroke="#262e30" stroke-width="1"><circle cx="-6" cy="-12" r="3.3"/><circle cx="-6" cy="12" r="3.3"/><circle cx="62" cy="-12" r="3.3"/><circle cx="62" cy="12" r="3.3"/></g><path d="M56 0h8" stroke="#262e30" stroke-width="2.6" stroke-linecap="round"/><rect x="0" y="-21" width="56" height="42" rx="4" fill="#9aa5a8" stroke="#4a5557" stroke-width="1.2"/><rect x="1.5" y="-19.5" width="53" height="39" rx="3" fill="url(#loco-deck)"/><path d="M2 -19.5h52M2 19.5h52" stroke="#f4f7f8" stroke-width="1.1"/><g fill="#f4f7f8"><circle cx="8" cy="-19.5" r="1"/><circle cx="24" cy="-19.5" r="1"/><circle cx="40" cy="-19.5" r="1"/><circle cx="8" cy="19.5" r="1"/><circle cx="24" cy="19.5" r="1"/><circle cx="40" cy="19.5" r="1"/></g><path d="M52 -21h4v42h-4z" fill="#ffd34d"/><path d="M52 -17l4 -4M52 -9l4 -4M52 -1l4 -4M52 7l4 -4M52 15l4 -4M52 21l4 -2" stroke="#262e30" stroke-width="2"/><rect x="3" y="-17.5" width="17" height="35" rx="3.5" fill="url(#loco-red)" stroke="#9b2f20" stroke-width="1.2"/><rect x="5.5" y="-14.5" width="12" height="29" rx="2.5" fill="#ffffff26" stroke="#ffffff55" stroke-width=".8"/><rect x="8" y="-6" width="7" height="12" rx="1.5" fill="#dfe5e7" stroke="#8b979a" stroke-width=".7"/><path d="M3.6 -12v24" stroke="#24333f" stroke-width="2.2" stroke-linecap="round"/><path d="M19.4 -12v24" stroke="#24333f" stroke-width="2.2" stroke-linecap="round"/><rect x="22.5" y="-12.5" width="28" height="25" rx="5" fill="url(#loco-red)" stroke="#9b2f20" stroke-width="1.2"/><path d="M45 -9.5v19M47.5 -9.5v19" stroke="#9b2f20" stroke-width="1.1"/><g fill="#7f2618" stroke="#ffb8a8" stroke-width=".7"><circle cx="30" cy="-4.5" r="4.6"/><circle cx="39" cy="-4.5" r="4.6"/></g><path d="M30 -9.1v9.2M25.4 -4.5h9.2M39 -9.1v9.2M34.4 -4.5h9.2" stroke="#ffb8a8" stroke-width=".7"/><circle cx="34.5" cy="6" r="2.8" fill="#2b2f31" stroke="#5c6466" stroke-width="1"/><circle cx="50" cy="-9.5" r="2.2" fill="#fff8d0" stroke="#c9a227" stroke-width=".7"/><circle cx="50" cy="9.5" r="2.2" fill="#fff8d0" stroke="#c9a227" stroke-width=".7"/></g>`;
const ART_DEFS = `<linearGradient id="wagon-shade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#1d2b38" stop-opacity=".18"/></linearGradient><linearGradient id="wagon-floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1d2b38" stop-opacity=".34"/><stop offset=".22" stop-color="#1d2b38" stop-opacity=".16"/><stop offset="1" stop-color="#1d2b38" stop-opacity=".1"/></linearGradient><linearGradient id="loco-red" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff8a72"/><stop offset=".5" stop-color="#e5533d"/><stop offset="1" stop-color="#c43e2a"/></linearGradient><linearGradient id="loco-deck" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c9d1d4"/><stop offset="1" stop-color="#a7b1b4"/></linearGradient>`;
// Disposició de l'estació (la comparteixen el dibuix, l'arrossegament i les animacions).
function layout(c = config()) {
  const narrow = innerWidth < 650;
  return {
    narrow,
    ys: narrow ? [64, 220, 376] : [100, 220, 340],
    view: narrow ? [4, 404] : [36, 340],
    loco: narrow ? 4 : 16,
    headX: narrow ? 66 : 84,
    headStep: narrow ? 54 : 64,
    pt: narrow ? 232 : 300,
    cv: narrow ? 250 : 340,
    tx: narrow ? 280 : 400,
    step: narrow ? 64 : 70,
    caps: c.caps,
  };
}
// Recorregut d'una via: la via de maniobra (s = x) i, després de les agulles, la corba i la recta.
const routes = new Map();
function route(L, v) {
  const id = [L.pt, L.cv, L.tx, v, L.caps[v - 1]].join();
  if (routes.has(id)) return routes.get(id);
  const y = L.ys[v - 1],
    pts = [[-300, 220], ...curvePoints(L.pt, 220, L.cv, y, L.tx, y, L.tx + L.caps[v - 1] * L.step + 200)],
    cum = [-300];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const r = { pts, cum, sTx: cum[29] };
  routes.set(id, r);
  return r;
}
// Punt i angle del recorregut a la distància s.
function along(r, s) {
  const { pts, cum } = r;
  let i = 0;
  while (i < pts.length - 2 && cum[i + 1] < s) i++;
  const [x0, y0] = pts[i],
    [x1, y1] = pts[i + 1],
    t = (s - cum[i]) / (cum[i + 1] - cum[i] || 1);
  return [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, (Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI];
}
// Distància del recorregut més propera a un punt (i a quina distància queda).
function project(r, p) {
  let best = { s: 0, d: Infinity };
  for (let i = 0; i < r.pts.length - 1; i++) {
    const [x0, y0] = r.pts[i],
      [x1, y1] = r.pts[i + 1],
      dx = x1 - x0,
      dy = y1 - y0,
      l2 = dx * dx + dy * dy || 1,
      t = Math.max(0, Math.min(1, ((p.x - x0) * dx + (p.y - y0) * dy) / l2)),
      d = Math.hypot(p.x - x0 - dx * t, p.y - y0 - dy * t);
    if (d < best.d) best = { s: r.cum[i] + Math.sqrt(l2) * t, d };
  }
  return best;
}
// Centre d'un vagó aparcat: al tren de la locomotora (src 0) o a la plaça j d'una via.
function parked(L, src, j) {
  return src === 0 ? L.headX + j * L.headStep + 26 : route(L, src).sTx + j * L.step + 26;
}
function placeAt(el, r, s) {
  const [x, y, a] = along(r, s);
  el.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${a.toFixed(1)}) translate(-26 0)`);
}
// On és cada vagó (per etiqueta): [via, posició].
function locations(state) {
  const m = new Map();
  state.forEach((line, src) => line.forEach((w, j) => m.set(String(game.labels?.[w - 1] ?? w), [src, j])));
  return m;
}
// Quan el tren és format, la locomotora s'enganxa a la via A i se l'emporta.
let departToken = 0;
// Si la locomotora encara porta vagons, primer els deixa en una via auxiliar amb lloc.
function departDrop(L) {
  const s = game.state,
    n0 = s[0].length;
  if (!n0) return null;
  const v = [2, 3]
    .filter((i) => s[i].length + n0 <= L.caps[i - 1])
    .sort((a, b) => L.caps[b - 1] - s[b].length - (L.caps[a - 1] - s[a].length))[0];
  return v ? { v, n0, k: s[v].length } : { v: 0, n0 };
}
function depart(wait = 0) {
  if (prefs.reduced || autoplay) return sound("whistle");
  const token = ++departToken;
  setTimeout(() => {
    const svg = $("#main .board");
    if (!svg || token !== departToken || !game?.finished) return;
    const L = layout(),
      r = route(L, 1),
      loco = svg.querySelector(".loco"),
      cars = [...svg.querySelectorAll('[data-src="1"]')];
    if (!loco || !cars.length) return;
    loco.querySelector("text")?.remove();
    const put = (el, s, half, rr = r) => {
        const [x, y, a] = along(rr, s);
        el.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${a.toFixed(1)}) translate(${-half} 0)`);
      },
      sc = cars.map((_, j) => parked(L, 1, j)),
      l0 = L.loco + 28,
      l1 = sc[0] - 63,
      wrap = svg.closest(".board-wrap")?.getBoundingClientRect(),
      m = svg.getScreenCTM(),
      left = wrap && m ? (wrap.left - m.e) / m.a : 0,
      away = sc.at(-1) - left + 70,
      ease = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2),
      drop = departDrop(L),
      held = [...svg.querySelectorAll('[data-src="0"]')].sort((a, b) => a.dataset.idx - b.dataset.idx),
      // Fase prèvia: empènyer els vagons de la locomotora cap a la via auxiliar i tornar.
      push = drop ? (drop.v ? 900 : 450) : 0,
      back = drop?.v ? 700 : 0,
      pre = push ? push + 150 + back + 150 : 0,
      approach = 750,
      pause = 180,
      leave = 1500,
      t0 = performance.now();
    let moved = [];
    if (drop?.v) {
      const rv = route(L, drop.v),
        gap = parked(L, 0, 0) - l0;
      moved = [
        ...held.map((el, j) => ({ el, a: parked(L, 0, j), b: parked(L, drop.v, j) })),
        ...[...svg.querySelectorAll(`[data-src="${drop.v}"]`)].map((el) => ({ el, a: parked(L, drop.v, +el.dataset.idx), b: parked(L, drop.v, +el.dataset.idx + drop.n0) })),
      ];
      moved.rv = rv;
      moved.lp = parked(L, drop.v, 0) - gap;
    }
    let whistled = false;
    const frame = (now) => {
      if (token !== departToken || !loco.isConnected) return;
      const e = now - t0;
      if (e < pre) {
        if (drop.v) {
          const rv = moved.rv;
          if (e < push) {
            const t = ease(e / push);
            put(loco, l0 + (moved.lp - l0) * t, 28, rv);
            moved.forEach((x) => put(x.el, x.a + (x.b - x.a) * t, 26, rv));
          } else if (e < push + 150) {
            const tag = svg.querySelector(`[data-via="${drop.v}"] .track-label tspan`);
            if (tag) tag.textContent = `${drop.k + drop.n0}/${L.caps[drop.v - 1]}`;
            put(loco, moved.lp, 28, rv);
            moved.forEach((x) => put(x.el, x.b, 26, rv));
          } else {
            const t = ease(Math.min(1, (e - push - 150) / back));
            put(loco, moved.lp + (l0 - moved.lp) * t, 28, rv);
          }
        } else {
          // Sense lloc a cap via auxiliar: els vagons s'esvaeixen.
          const t = Math.min(1, e / push);
          held.forEach((el) => el.setAttribute("opacity", (1 - t).toFixed(2)));
        }
      } else {
        const f = e - pre;
        if (f < approach) put(loco, l0 + (l1 - l0) * ease(f / approach), 28);
        else if (f < approach + pause) put(loco, l1, 28);
        else {
          if (!whistled) {
            whistled = true;
            sound("whistle");
          }
          const t = Math.min(1, (f - approach - pause) / leave),
            d = away * t * t;
          put(loco, l1 - d, 28);
          cars.forEach((el, j) => put(el, sc[j] - d, 26));
          if (t >= 1) return;
        }
      }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }, wait + 120);
}
// Fa lliscar els vagons que canvien de lloc seguint els rails de la via v.
let rideToken = 0;
function ride(before, v, from) {
  const svg = $("#main .board");
  if (prefs.reduced || !svg) return 0;
  const L = layout(),
    r = route(L, v),
    after = locations(game.state),
    token = ++rideToken,
    items = [];
  svg.querySelectorAll("[data-wagon]").forEach((el) => {
    const w = el.dataset.wagon,
      a = after.get(w),
      b = before.get(w);
    if (!a || !b || (b[0] !== 0 && b[0] !== v)) return;
    const s0 = from?.get(w) ?? parked(L, b[0], b[1]),
      s1 = parked(L, a[0], a[1]);
    if (Math.abs(s1 - s0) > 0.5) items.push({ el, s0, s1, end: el.getAttribute("transform") });
  });
  if (!items.length) return 0;
  const longest = Math.max(...items.map((x) => Math.abs(x.s1 - x.s0))),
    duration = Math.min(650, 220 + longest * 0.9),
    t0 = performance.now(),
    ease = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
  items.forEach((x) => placeAt(x.el, r, x.s0));
  const frame = (now) => {
    if (token !== rideToken) return;
    const t = Math.min(1, (now - t0) / duration);
    items.forEach((x) => (t < 1 ? placeAt(x.el, r, x.s0 + (x.s1 - x.s0) * ease(t)) : x.el.setAttribute("transform", x.end)));
    if (t < 1) requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
  return duration;
}
// Decorat discret als racons buits: andana, edifici de l'estació, arbres i matolls.
function scenery(narrow, pt) {
  const tree = ([x, y, r]) =>
      `<g transform="translate(${x} ${y})"><circle cx="3" cy="4" r="${r + 1}" fill="#1d3a2224"/><circle r="${r}" fill="#6fae58"/><circle cx="${-r * 0.28}" cy="${-r * 0.28}" r="${r * 0.6}" fill="#8ccb6f"/><circle cx="${r * 0.3}" cy="${r * 0.25}" r="${r * 0.35}" fill="#5d9c4a" opacity=".7"/></g>`,
    [bx, bw] = narrow ? [26, 112] : [62, 140],
    trees = narrow
      ? [[178, 96, 15], [204, 58, 10], [14, 66, 9], [30, 330, 13], [56, 352, 8], [178, 352, 14]]
      : [[238, 96, 18], [268, 58, 11], [26, 74, 12], [40, 330, 15], [70, 352, 10], [218, 338, 16], [250, 362, 9]];
  return `<g class="scenery" aria-hidden="true"><rect x="10" y="180" width="${pt - 48}" height="19" rx="3" fill="#e4dfd2" stroke="#cbc3b0"/><path d="M12 195.5H${pt - 40}" stroke="#f5c542" stroke-width="2" stroke-dasharray="7 4"/><g transform="translate(${bx} 116)"><rect x="4" y="5" width="${bw}" height="60" rx="3" fill="#1d3a2226"/><rect width="${bw}" height="30" rx="2" fill="#e27d62"/><rect y="30" width="${bw}" height="30" rx="2" fill="#c65a41"/><path d="M0 9H${bw}M0 19H${bw}M0 41H${bw}M0 51H${bw}" stroke="#00000014"/><path d="M0 30H${bw}" stroke="#a9442f" stroke-width="2.5"/><rect x="${bw * 0.72}" y="10" width="11" height="13" rx="1.5" fill="#9c7b68" stroke="#6b4f40"/><rect x="${bw * 0.2}" y="58" width="${bw * 0.6}" height="6" rx="2" fill="#5b4636" opacity=".55"/></g>${trees.map(tree).join("")}</g>`;
}
// Pista visual: el vagó que cal arrossegar i el recorregut fins on ha d'anar.
function hintInfo(s, c) {
  if (!hintMove || game.finished) return null;
  const [v, k] = hintMove,
    n0 = s[0].length,
    [src, idx] = k > n0 ? [v, k - n0 - 1] : [0, k];
  if (!s[src]?.[idx]) return null;
  let after;
  try {
    after = move(s, c, v, k);
  } catch {
    return null;
  }
  const w = s[src][idx],
    dst = after.findIndex((line) => line.includes(w)),
    L = layout(c),
    r = route(L, v),
    s0 = parked(L, src, idx),
    s1 = parked(L, dst, after[dst].indexOf(w)),
    pts = [];
  for (let i = 0; i <= 40; i++) pts.push(along(r, s0 + ((s1 - s0) * i) / 40));
  const [ex, ey, ea] = pts.at(-1),
    a = ea + (s1 < s0 ? 180 : 0),
    d = "M" + pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join("L");
  return {
    src,
    moving: (j) => (src ? j <= idx : j >= idx),
    svg: `<g class="hint-route" aria-hidden="true"><path d="${d}" stroke="#fff" stroke-width="9" fill="none" stroke-linecap="round" opacity=".85"/><path class="hint-dash" d="${d}" stroke="#ff8a3d" stroke-width="4.5" fill="none" stroke-linecap="round" stroke-dasharray="10 8"/><g transform="translate(${ex.toFixed(1)} ${ey.toFixed(1)}) rotate(${a.toFixed(1)})"><path d="M8 0L-8 -10L-4 0L-8 10z" fill="#ff8a3d" stroke="#fff" stroke-width="2.5" stroke-linejoin="round" paint-order="stroke"/></g></g>`,
  };
}
function board(s = game.state, c = config(), interactive = true) {
  const { narrow, ys, view: vb, loco, headX, headStep, pt, cv, tx, step } = layout(c),
    hint = interactive ? hintInfo(s, c) : null,
    hinted = (src, j, html) => (hint && hint.src === src && hint.moving(j) ? `<g class="hint-wagon">${html}</g>` : html),
    width = tx + Math.max(...c.caps) * step + 22,
    lbl = (w) => game.labels?.[w - 1] ?? w,
    lineTxt = (a) => a.map(lbl).join(", ") || "buida";
  let a = `<svg class="board" data-pt="${pt}" viewBox="0 ${vb[0]} ${width} ${vb[1]}" preserveAspectRatio="xMidYMid meet" role="group" aria-label="Estació. Via de maniobra: ${lineTxt(s[0])}. ${s
    .slice(1)
    .map((x, i) => `Via ${"ABC"[i]}: ${lineTxt(x)}`)
    .join(". ")}"><defs>${ART_DEFS}</defs>${scenery(narrow, pt)}`;
  // Via de maniobra
  a += `<path class="maniobra-halo" d="M10 220H${pt}" stroke="#8bd7bd55" stroke-width="66" stroke-linecap="round"/>${trackPath([[2, 220], [pt, 220]])}<text x="${headX}" y="276" fill="#53625c" font-family="system-ui" font-size="13" font-weight="700">${narrow ? "Maniobra" : "Via de maniobra"} <tspan font-weight="400">· màx. ${c.h}${narrow ? "" : " vagons"}</tspan></text>`;
  a += `<g transform="translate(${pt - 2} 246)"><rect x="-7" y="-4" width="14" height="8" rx="2" fill="#4d5b5c"/><path d="M0 0l7 -9" stroke="#e5533d" stroke-width="3" stroke-linecap="round"/><circle cx="7" cy="-9" r="2.6" fill="#fff" stroke="#e5533d" stroke-width="1.4"/></g><text x="${pt - 14}" y="250" text-anchor="end" font-family="system-ui" font-size="11" fill="#64736b">Agulles</text>`;
  for (let i = 1; i <= 3; i++) {
    const y = ys[i - 1],
      cap = c.caps[i - 1],
      end = tx + cap * step - 12,
      dest = i === 1;
    a += `<g class="siding ${selected === i ? "selected" : ""} ${dest ? "dest" : ""}" ${interactive ? `data-via="${i}" tabindex="0" role="button" aria-label="Via ${"ABC"[i - 1]}, ${s[i].length} de ${cap} vagons"` : ""}><path class="track-halo" d="M${pt} 220 Q${cv} ${y} ${tx} ${y}H${end}" fill="none" stroke="#f2b35d66" stroke-width="62" stroke-linecap="round"/>${trackPath(curvePoints(pt, 220, cv, y, tx, y, end), dest ? "#3d6f5c" : "#5f6c6d")}${bufferStop(end, y)}<rect x="${tx - 40}" y="${y - 52}" width="28" height="24" rx="5" fill="${dest ? "#2f6a55" : "#546766"}"/><text x="${tx - 26}" y="${y - 35}" fill="white" text-anchor="middle" font-size="15" font-weight="800" font-family="system-ui">${"ABC"[i - 1]}</text>`;
    if (dest) {
      // El tren objectiu, plaça per plaça, just a sobre de la via A.
      for (let k = 0; k < c.t; k++) {
        const w = lbl(k + 1),
          ok = s[1].length === c.t && s[1][k] === k + 1;
        a += `<g class="goal-tag" transform="translate(${tx + k * step + 26} ${y - 40})"><rect x="-17" y="-12" width="34" height="23" rx="5" fill="${colors[w]}" stroke="${ok ? "#2f6a55" : "#263e43"}" stroke-width="${ok ? 3 : 1.2}" opacity=".95"/><text y="5" text-anchor="middle" font-family="system-ui" font-size="14" font-weight="800" fill="#21333b">${w}</text></g>`;
      }
    } else
      a += `<text x="${tx - 4}" y="${y - 35}" class="track-label" font-family="system-ui" font-size="13">Via auxiliar <tspan fill="#738079" font-weight="400">${s[i].length}/${cap}</tspan></text>`;
    for (let k = 0; k < cap; k++)
      a += `<rect x="${tx + k * step}" y="${y - 21}" width="52" height="42" rx="6" fill="#ffffff1f" stroke="#ffffffb3" stroke-width="1.5" stroke-dasharray="4 4"/>`;
    s[i].forEach(
      (w, j) =>
        (a += cutTarget(
          hinted(i, j, wagon(w, tx + j * step, y, interactive ? `data-src="${i}" data-idx="${j}"` : "")),
          i,
          s[0].length + j + 1,
          s,
          c,
          interactive,
        )),
    );
    a += "</g>";
  }
  a += cutTarget(
    `<g class="loco" transform="translate(${loco} 220)">${LOCO}<text x="28" y="44" text-anchor="middle" font-family="system-ui" font-size="11" fill="#53625c">Locomotora</text></g>`,
    selected,
    0,
    s,
    c,
    interactive,
    "Locomotora sola",
  );
  s[0].forEach(
    (w, j) =>
      (a += cutTarget(
        hinted(0, j, wagon(w, headX + j * headStep, 220, interactive ? `data-src="0" data-idx="${j}"` : "")),
        selected,
        j + 1,
        s,
        c,
        interactive,
      )),
  );
  if (hint) a += hint.svg;
  a += "</svg>";
  return a;
}
// Amb una via triada, tocar un vagó vol dir «torna amb els vagons fins a aquest».
function cutTarget(svg, via, k, s, c, interactive, label) {
  if (
    !interactive ||
    !selected ||
    via !== selected ||
    autoplay ||
    game.finished ||
    !moves(s, c).some((m) => m[0] === via && m[1] === k)
  )
    return svg;
  return `<g class="cut-target" data-cut="${k}" aria-label="${label || "Torna amb " + k + (k === 1 ? " vagó" : " vagons")}">${svg}</g>`;
}
function renderGame() {
  if (!game || view !== "play") return;
  const c = config(),
    isWon = won(game.state, c),
    blocked = remaining === null && !solving && !isWon,
    show = (x) => (prefs.minimum ? (x ?? "—") : "?"),
    notation = game.log.map(([v, k]) => "ABC"[v - 1] + k).join(" · "),
    played = read("played", 0),
    instruction = isWon
      ? `<b class="ok">✓</b> Tren format amb ${game.log.length} moviments: <span class="solution">${notation}</span>`
      : blocked
        ? "Aquest repartiment no té solució: cap seqüència de maniobres pot formar el tren."
        : selected
          ? `<b>2</b> Via ${"ABC"[selected - 1]}: toca el darrer vagó que vols endur-te, o la locomotora per tornar sola.`
          : played >= 3
            ? `Arrossega vagons entre les vies i la locomotora.`
            : `<b>1</b> Arrossega vagons: d’una via a la locomotora per endur-te’ls, o del tren de la locomotora a una via per deixar-los.`;
  $("#main").innerHTML =
    `<div class="stage"><div class="stage-head"><div class="goal"><div class="eyebrow">${game.mode === "tutorial" ? "Partida de pràctica · no puntua" : game.min ? levelOf(game.min) + " · " + score(game.min, game.min) + " punts amb el mínim" : "Preparant…"}</div><div class="goal-line"><span>Forma aquest tren a la <b>via A</b></span><span class="target-train" aria-label="Tren objectiu: ${Array.from({ length: c.t }, (_, i) => game.labels?.[i] ?? i + 1).join(", ")}">${Array.from({ length: c.t }, (_, i) => `<svg class="mini-wagon" viewBox="-7 -24 66 48" aria-hidden="true">${wagonArt(game.labels?.[i] ?? i + 1, 0, 0).replace(" data-wagon=", " data-mini=")}</svg>`).join("")}</span></div></div><button class="menu-btn" data-action="menu" aria-label="Menú">${icon("menu")}</button><div class="stage-stats"><div><b>${game.log.length}</b><small>moviments</small></div><div><b>${show(game.min)}</b><small>mínim${prefs.minimum && !isWon && remaining != null && game.log.length ? ` · en queden ${solving ? "…" : remaining}` : ""}</small></div><div><b id="timer">${time(game.finished ? game.seconds : elapsed())}</b><small>temps</small></div></div></div><div class="board-wrap ${selected ? "choosing" : ""} ${isWon ? "complete" : ""}">${read("rotate-tip", true) ? `<button class="rotate-tip" data-action="rotate-tip">${icon("rotate")} Gira el mòbil per veure-ho més gran</button>` : ""}${board()}<p class="board-caption ${blocked ? "warning" : ""}">${instruction}${preview ? `<span class="hint-line">${esc(preview)}</span>` : ""}</p></div><div class="stage-controls">${isWon ? `<div class="choice-row"><button class="primary" data-action="result">Veure el resultat</button><button data-action="new">Una altra partida ${icon("arrow")}</button></div>` : `<div class="choice-row">${selected ? `<span class="choice-label">Via ${"ABC"[selected - 1]} · la locomotora torna</span>` + Array.from({ length: c.h + 1 }, (_, k) => `<button class="chip" data-cut="${k}" ${!moves(game.state, c).some((m) => m[0] === selected && m[1] === k) || autoplay ? "disabled" : ""}>${k === 0 ? "sola" : `<span class="amb">amb </span>${k} ${k === 1 ? "vagó" : "vagons"}`}</button>`).join("") + `<button class="ghost chip" data-action="cancel">Cancel·la</button>` : ""}</div>`}<div class="tool-row"><button data-action="undo" ${!game.log.length || autoplay ? "disabled" : ""}>${icon("undo")} Desfer</button><button data-action="restart">${icon("reset")} Reiniciar</button><button data-action="hint" ${isWon || autoplay || solving ? "disabled" : ""}>${icon("bulb")} Pista</button><button class="primary" data-action="new-menu">${icon("play")} Nou repte</button></div></div></div>`;
}
function select(v) {
  if (!game || game.finished || autoplay) return;
  selected = v;
  preview = null;
  hintMove = null;
  renderGame();
  $("#main .choice-row button:not(:disabled)")?.focus({ preventScroll: true });
}
function doMove(v, k) {
  if (game.finished) return;
  const before = locations(game.state),
    from = dragFrom;
  dragFrom = null;
  try {
    const updated = move(game.state, config(), v, k);
    game.undo.push(clone(game.state));
    game.state = updated;
    animationUntil = prefs.reduced ? 0 : Date.now() + 650;
    game.log.push([v, k]);
    selected = 0;
    preview = null;
    hintMove = null;
    sound("couple");
    persist();
    if (won(game.state, config())) finish();
    else {
      solve();
      renderGame();
    }
    const took = ride(before, v, from);
    if (took) animationUntil = Date.now() + took;
    if (game.finished) depart(took);
    if (!prefs.reduced)
      document.querySelector("#main .board .loco-body")?.animate(
        [{ transform: "translateX(0)" }, { transform: "translateX(5px)" }, { transform: "translateX(-1px)" }, { transform: "translateX(0)" }],
        { duration: 360, easing: "ease-out" },
      );
  } catch (e) {
    toast(e.message);
  }
}
function finish() {
  game.finished = true;
  game.seconds = elapsed();
  remaining = 0;
  nextMove = null;
  requestId++;
  solving = false;
  const k = puzzleKey();
  if (!autoplay) save("played", read("played", 0) + 1);
  if (!autoplay && k && !solvedLocal.includes(k)) {
    solvedLocal = [...solvedLocal, k].slice(-5000);
    save("solved", solvedLocal);
  }
  game.ranked = !autoplay && !game.hints && !!k ? "pending" : null;
  persist();
  renderGame();
  if (autoplay) return;
  if (game.ranked && player?.name) publish();
  const g = game;
  setTimeout(
    () => {
      if (game === g && view === "play" && !dialog.open) showResult();
    },
    prefs.reduced ? 1200 : 3300 + (game.state[0].length ? 1900 : 0),
  );
}
function modal(html, locked = false) {
  if (locked) dialog.dataset.locked = "1";
  else delete dialog.dataset.locked;
  dialog.innerHTML = `${locked ? "" : '<button class="close" data-action="close" aria-label="Tancar">×</button>'}${html}`;
  const heading = dialog.querySelector("h2");
  if (heading) {
    heading.id = "dialog-title";
    dialog.setAttribute("aria-labelledby", "dialog-title");
  }
  if (!dialog.open) dialog.showModal();
}
function welcome() {
  modal(
    `<div class="welcome"><img class="welcome-logo" src="assets/favicon.svg" alt=""><div class="eyebrow">Et donem la benvinguda a</div><h2>Maniobres</h2><span class="name-form"><input id="name-input" maxlength="16" placeholder="El teu nom de jugador" aria-label="Nom de jugador" autocomplete="off" value="${esc(read("me", null)?.name || "")}"><button class="primary" data-action="welcome-save">Comença a jugar</button></span><p class="name-error" id="name-error" role="alert"></p></div>`,
    true,
  );
  setTimeout(() => $("#name-input")?.focus(), 50);
}
function afterWelcome() {
  if (!read("seen-tutorial", false)) {
    save("seen-tutorial", true);
    tutorial();
  }
}
function rankingNote() {
  const g = game;
  if (g.mode === "tutorial") return "Partida de pràctica: no puntua al rànquing.";
  if (g.hints) return "Amb pistes o veient la solució, la partida no puntua al rànquing.";
  if (!g.ranked) return "";
  if (!player?.name)
    return `<b>Vols sortir al rànquing?</b> Tria un nom de jugador i aquesta partida hi sumarà ${score(g.min, g.log.length)} punts.<span class="name-form"><input id="name-input" maxlength="16" placeholder="El teu nom de jugador" aria-label="Nom de jugador"><button class="primary" data-action="register">Desa</button></span><small>Serà públic. No hi posis el teu nom i cognoms reals.</small>`;
  if (g.ranked === "pending") return "Desant el resultat al rànquing…";
  if (g.ranked === "kept") return "Ja tenies aquest puzle resolt amb menys moviments o igual: el rànquing conserva el millor resultat.";
  if (g.ranked === "error") return `No s’ha pogut desar el resultat. <button class="ghost" data-action="retry">Torna-ho a provar</button>`;
  return `+${score(g.min, g.log.length)} punts al rànquing per a <b>${esc(player.name)}</b>.${g.rank ? ` Ocupes el <b>${ord(g.rank)} lloc</b>${g.rankUp ? ": has pujat!" : "."}` : ""}`;
}
function resultArt() {
  const c = config(),
    W = 70 + c.t * 62;
  return `<svg class="result-train" viewBox="0 2 ${W + 8} 56" aria-hidden="true"><defs>${ART_DEFS}</defs>${trackPath([[0, 30], [W + 8, 30]])}<g transform="translate(6 30)">${LOCO}</g>${Array.from({ length: c.t }, (_, i) => wagonArt(game.labels?.[i] ?? i + 1, 76 + i * 62, 30).replace(" data-wagon=", " data-mini=")).join("")}</svg>`;
}
function showResult() {
  const n = stars(game.log.length, game.min),
    extra = game.min != null ? game.log.length - game.min : null,
    counts = game.mode !== "tutorial" && !game.hints && game.min != null;
  modal(
    `<div class="result"><div class="result-art">${resultArt()}<div class="result-stars" aria-label="${n} de 3 estrelles">${[0, 1, 2].map((i) => `<span class="${i < n ? "on" : ""}" style="--d:${0.15 + i * 0.18}s">${icon("star")}</span>`).join("")}</div></div><div class="eyebrow">Tren format</div><h2>${extra === 0 ? "Una maniobra perfecta." : "El tren ja pot sortir."}</h2><p class="result-msg">${extra === 0 ? "Has trobat un dels camins més curts possibles." : extra === 1 ? "A 1 moviment del mínim!" : extra != null ? `T’has quedat a ${extra} moviments del mínim.` : ""}</p><div class="result-tiles"><div><b>${game.log.length}</b><small>moviments</small></div><div><b>${game.min ?? "?"}</b><small>mínim</small></div><div><b>${time(game.seconds)}</b><small>temps</small></div><div class="${counts ? "pts" : ""}"><b>${counts ? "+" + score(game.min, game.log.length) : "—"}</b><small>punts</small></div></div><p class="your-solution">La teva solució: <b>${esc(game.log.map(([v, k]) => "ABC"[v - 1] + k).join(" · "))}</b></p><div class="rank-note" id="rank-note">${rankingNote()}</div><div class="dialog-actions"><button class="primary" data-action="next">Següent repte ${icon("arrow")}</button><button class="ghost" data-action="optimal">Veure la solució òptima</button></div></div>`,
  );
}
function refreshNote() {
  const el = $("#rank-note");
  if (el) el.innerHTML = rankingNote();
}
async function publish() {
  const g = game;
  g.ranked = "pending";
  refreshNote();
  try {
    const x = await online.submit(puzzleKey(g), g.log, g.seconds);
    g.ranked = x.kept ? "kept" : "done";
    board_ = null;
    if (!x.kept) {
      refreshNote();
      try {
        const mine = (await fetchBoard()).rows.find((r) => r.me),
          before = read("rank", null);
        if (mine) {
          g.rank = mine.rank;
          g.rankUp = before != null && mine.rank < before;
          save("rank", mine.rank);
          if (g.rankUp) toast(`Has pujat al ${ord(mine.rank)} lloc del rànquing!`);
        }
      } catch {}
    }
  } catch {
    g.ranked = "error";
  }
  persist();
  if (game === g) refreshNote();
}
// El nom també es recorda al dispositiu: si el navegador perd la sessió anònima,
// el joc continua amb el mateix nom (i els punts) sense demanar res.
async function loadPlayer() {
  try {
    player = await online.me();
    const remembered = read("me", null);
    if (!player.name && remembered?.name) {
      try {
        if (await online.claim(remembered.name, true)) {
          player = await online.me();
          toast(`Hola de nou, ${player.name}!`);
        }
      } catch {}
    }
    if (player.name) save("me", { name: player.name });
  } catch {
    player = null;
  }
  return player;
}
let pendingClaim = null;
// Nom ja agafat: avisa i permet continuar-hi (canvi de dispositiu) o triar-ne un altre.
function offerClaim(name) {
  pendingClaim = name;
  const form = $("#name-input")?.closest(".name-form");
  if (!form) return toast("Aquest nom ja s’ha fet servir.");
  form.parentElement.querySelector(".claim-box")?.remove();
  $("#name-error") && ($("#name-error").textContent = "");
  form.insertAdjacentHTML(
    "afterend",
    `<div class="claim-box" role="alert"><p><b>«${esc(name)}» ja s’ha fet servir.</b> Si és teu i jugues des d’un altre dispositiu, pots continuar-hi amb els teus punts. Si no és teu, tria’n un altre.</p>${player?.name ? `<p class="muted">Deixaràs el nom «${esc(player.name)}» i els seus punts.</p>` : ""}<div class="claim-actions"><button class="primary" data-action="claim">És meu, continua</button><button class="ghost" data-action="claim-cancel">Tria’n un altre</button></div></div>`,
  );
}
let verifyResolve = null;
function verify(list) {
  return new Promise((resolve) => {
    verifyResolve = resolve;
    worker.postMessage({ type: "verify", config: "classic", players: list, now: Date.now(), request: -1 });
  });
}
const avatarColor = (name) => colors[1 + (hash(name) % 8)];
const initial = (name) => esc([...name.trim()][0]?.toUpperCase() || "?");
function avatar(name) {
  return `<span class="avatar" style="--a:${avatarColor(name)}">${initial(name)}</span>`;
}
function meCard() {
  if (player?.name) {
    const mine = board_?.rows.find((r) => r.me);
    return `<div class="me-head">${avatar(player.name)}<div><small>Jugues com a</small><strong>${esc(player.name)}</strong></div></div><div class="me-stats"><div><b>${mine ? ord(mine.rank) : "—"}</b><small>lloc</small></div><div><b>${mine?.points ?? 0}</b><small>punts</small></div><div><b>${mine?.solved ?? 0}</b><small>puzles</small></div><div><b>${mine?.perfect ?? 0}</b><small>perfectes</small></div></div><div class="me-actions"><button class="ghost" data-action="rename">Canvia el nom</button><button class="ghost" data-action="erase">Esborra’m</button></div>`;
  }
  return `<b>Tria un nom de jugador</b><span class="name-form"><input id="name-input" maxlength="16" placeholder="El teu nom" aria-label="Nom de jugador"><button class="primary" data-action="register">Desa</button></span><small>Serà públic. No hi posis el teu nom i cognoms reals.</small>`;
}
function renderRanking() {
  $("#main").innerHTML = `<div class="page rank-page"><header class="rank-top"><span class="rank-icon">${icon("trophy")}</span><div class="rank-title"><h1>Rànquing</h1><p>Puzles resolts sense pistes · cada puzle compta una vegada · toca un jugador per veure’n les partides</p></div><div class="rank-chips" id="hero-stats"></div></header><div class="rank-layout"><div class="rank-main"><div class="level-tabs" id="level-tabs" role="group" aria-label="Nivell"></div><div id="rank-list"><div class="panel empty">Carregant el rànquing…</div></div></div><aside class="rank-side"><section class="panel me-card">${meCard()}</section><section class="panel how-card"><h3>Com es puntua</h3><ul><li><b>+10</b> per cada moviment del mínim</li><li><b>−5</b> per cada moviment de més</li><li><b>1×</b> cada puzle, amb el millor resultat</li><li><b>1 any</b> dura cada resultat</li><li><b class="star">${icon("star")}</b> perfecte: resolt amb el mínim</li></ul></section></aside></div></div>`;
  loadRanking();
}
// Ordena i numera (empats amb el mateix lloc).
function rankRows(rows) {
  rows.sort((a, b) => b.points - a.points || b.perfect - a.perfect || b.solved - a.solved || a.name.localeCompare(b.name));
  let last = null,
    rank = 0;
  rows.forEach((r, i) => {
    if (r.points !== last) rank = i + 1;
    r.rank = rank;
    last = r.points;
  });
  return rows;
}
let boardLoading = null;
function fetchBoard() {
  if (board_ && Date.now() - board_.at < 30e3) return Promise.resolve(board_);
  return (boardLoading ||= (async () => {
    const { uid, list } = await online.players(),
      rows = (await verify(list))
        .map((r) => ({ ...r, solved: r.solved ?? 0, perfect: r.perfect ?? 0, games: r.games ?? [], me: r.uid === uid }))
        .filter((r) => r.points > 0);
    board_ = { rows: rankRows(rows), at: Date.now() };
    return board_;
  })().finally(() => (boardLoading = null)));
}
// Rànquing d'un sol nivell: només compten les partides d'aquell nivell.
function levelRows(level) {
  if (level === "all") return board_.rows;
  const name = LEVELS[level][0];
  return rankRows(
    board_.rows
      .map((r) => {
        const games = r.games.filter((g) => levelOf(g.min) === name);
        return { ...r, points: games.reduce((t, g) => t + g.points, 0), solved: games.length, perfect: games.filter((g) => g.n === g.min).length };
      })
      .filter((r) => r.points > 0),
  );
}
async function loadRanking() {
  try {
    await fetchBoard();
    if (view !== "ranking") return;
    const rows = levelRows(rankLevel),
      top = rows[0]?.points || 1,
      total = rows.reduce((t, r) => t + r.solved, 0);
    $("#level-tabs").innerHTML = [["all", "Tots", "#1d2b38"], ...Object.entries(LEVELS).map(([v, [n]]) => [v, n, LEVEL_COLORS[n]])]
      .map(([v, n, col]) => `<button class="${rankLevel === v ? "on" : ""}" data-rank-level="${v}" style="--l:${col}">${n}</button>`)
      .join("");
    $("#hero-stats").innerHTML = `<span><b>${rows.length}</b> ${rows.length === 1 ? "jugador" : "jugadors"}</span><span><b>${total}</b> ${total === 1 ? "puzle resolt" : "puzles resolts"}</span>`;
    if (player?.name && !$("#name-input")) $(".me-card").innerHTML = meCard();
    const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`,
      row = (r) =>
        `<li><button class="ranking-row ${r.rank <= 3 ? "top t" + r.rank : ""} ${r.me ? "me" : ""}" data-player="${esc(r.uid)}" aria-label="Estadístiques de ${esc(r.name)}"><span class="pos">${r.rank}</span>${avatar(r.name)}<span class="who"><strong>${esc(r.name)}${r.me ? ' <span class="badge">Tu</span>' : ""}</strong><span class="bar"><i style="width:${Math.max(3, (100 * r.points) / top)}%"></i></span><small class="mini">${plural(r.solved, "puzle", "puzles")} · ${plural(r.perfect, "perfecte", "perfectes")}</small></span><span class="num solved" title="Puzles resolts">${r.solved}</span><span class="num perfect" title="Puzles amb el mínim de moviments">${icon("star")}${r.perfect}</span><span class="score">${r.points}<small>punts</small></span></button></li>`;
    $("#rank-list").innerHTML = rows.length
      ? `<section class="panel rank-table"><div class="rank-head" aria-hidden="true"><span>#</span><span>Jugador</span><span>Puzles</span><span>Perfectes</span><span>Punts</span></div><ol>${rows.map(row).join("")}</ol></section>`
      : rankLevel !== "all"
        ? `<div class="panel empty">${icon("trophy")}<h3>Ningú no ha resolt encara cap puzle d’aquest nivell.</h3><p>Tria’l a «Nou repte» i el primer lloc pot ser teu.</p></div>`
        : `<div class="panel empty">${icon("trophy")}<h3>Encara no hi ha ningú al rànquing.</h3><p>Resol un puzle sense pistes i el primer lloc pot ser teu.</p><button class="primary" data-nav="play">Juga</button></div>`;
  } catch (e) {
    if (view === "ranking")
      $("#rank-list").innerHTML =
        `<div class="panel empty">${icon("trophy")}<h3>El rànquing no està disponible ara.</h3><p>Comprova la connexió. Pots continuar jugant mentrestant.</p></div>`;
  }
}
const LEVEL_COLORS = { Fàcil: "#1f9d6b", Mitjà: "#2f80d1", Difícil: "#ff8a3d", Expert: "#e5533d" };
const day = (t) => new Date(t).toLocaleDateString("ca", { day: "numeric", month: "short", year: "numeric" });
function showPlayer(uid) {
  const r = board_?.rows.find((x) => x.uid === uid);
  if (!r) return;
  const games = [...r.games].sort((a, b) => b.t - a.t),
    timed = games.filter((g) => g.s != null),
    best = timed.length ? Math.min(...timed.map((g) => g.s)) : null,
    extra = games.length ? games.reduce((t, g) => t + g.n - g.min, 0) / games.length : 0,
    item = (g) => {
      const level = levelOf(g.min) || "—",
        perfect = g.n === g.min;
      return `<li class="game-row"><span class="lvl" style="--l:${LEVEL_COLORS[level] || "#5b6b7a"}">${level}</span><span class="when">${day(g.t)}</span><span class="moves ${perfect ? "perfect" : ""}">${perfect ? icon("star") : ""}<b>${g.n}</b> <small>/ mínim ${g.min}</small></span><span class="secs">${icon("clock")}${g.s != null ? time(g.s) : "—"}</span><span class="pts">+${g.points}</span><button class="ghost play-again" data-puzzle="v1-classic-${esc(g.k)}" aria-label="Juga aquest puzle">${icon("play")}</button></li>`;
    };
  modal(
    `<div class="player-card"><header class="player-head">${avatar(r.name)}<div><small>${ord(r.rank)} lloc del rànquing</small><h2>${esc(r.name)}${r.me ? ' <span class="badge">Tu</span>' : ""}</h2></div></header><div class="me-stats player-stats"><div><b>${r.points}</b><small>punts</small></div><div><b>${r.solved}</b><small>puzles</small></div><div><b>${r.perfect}</b><small>perfectes</small></div><div><b>${best != null ? time(best) : "—"}</b><small>millor temps</small></div></div><p class="player-sub">${games.length ? (extra === 0 ? "Tots els puzles, amb el mínim de moviments." : `De mitjana, ${extra.toLocaleString("ca", { maximumFractionDigits: 1 })} ${extra === 1 ? "moviment" : "moviments"} més que el mínim.`) : ""}</p><h3>Partides</h3><ol class="game-list">${games.map(item).join("")}</ol><small class="player-note">Es desa el millor resultat de cada puzle. El temps es registra des de la versió 2.4. Toca ${icon("play")} per jugar el mateix puzle.</small></div>`,
  );
}
function renderAbout() {
  const rules = [
      ["target", "#1f9d6b", "Forma el tren", "a la via A, en ordre"],
      ["train", "#e5533d", "Màxim 3 vagons", "darrere la locomotora"],
      ["lock", "#5b6b7a", "Només els de davant", "els del fons, esperen"],
      ["swap", "#ff8a3d", "Anar i tornar", "compta 1 moviment"],
    ],
    skills = ["Planificar", "Pensar enrere", "Dividir el problema", "Provar i ajustar", "Pensament computacional"];
  $("#main").innerHTML = `<div class="page about-page"><header class="about-top"><img src="assets/favicon.svg" alt=""><div><div class="eyebrow">Sobre el joc</div><h1>Pocs vagons, poques vies, molt de cap</h1><p>Un trencaclosques de lògica: forma un tren amb el mínim de maniobres.</p></div></header><section class="panel about-rules"><h3>Les regles</h3><div class="rule-tiles">${rules.map(([ic, c, t, d]) => `<div><span style="--c:${c}">${icon(ic)}</span><b>${t}</b><small>${d}</small></div>`).join("")}</div></section><div class="about-trio"><section class="panel about-card"><h3>${icon("trophy")} Com puntua</h3><div class="score-pills"><span class="plus"><b>+10</b> per moviment del mínim</span><span class="minus"><b>−5</b> per moviment de més</span><span class="gold"><b>${icon("star")}</b> perfecte: el mínim exacte</span></div><small>Sense pistes · un cop per puzle · dura un any</small></section><section class="panel about-card"><h3>${icon("bulb")} Què s’hi aprèn</h3><div class="skill-chips">${skills.map((x) => `<span>${x}</span>`).join("")}</div></section><section class="panel about-card"><h3>${icon("route")} D’on ve</h3><p class="origin"><b>1979</b><span><strong>Inglenook Sidings</strong>, d’Alan Wright: un clàssic del modelisme ferroviari britànic basat en una feina real d’estació.</span></p></section></div><section class="panel about-facts"><div class="facts"><div><strong>8</strong><small>vagons a l’estació</small></div><div><strong>5</strong><small>formen el tren</small></div><div><strong>356.160</strong><small>situacions diferents</small></div><div><strong>17</strong><small>moviments, el repte més llarg</small></div></div></section><p class="credits">Versió 2.9.1 · Creat per <a href="https://ja.cat/felipsarroca" target="_blank" rel="noopener noreferrer">Felip Sarroca</a> amb assistència de la IA · Codi AGPLv3 i continguts CC BY-NC-SA 4.0 · <a href="https://github.com/felipsarroca/jocs/tree/main/Maniobres" target="_blank" rel="noopener noreferrer">Codi font</a> · <a href="https://github.com/felipsarroca/jocs/issues/new?template=maniobres.yml" target="_blank" rel="noopener noreferrer">Suggeriments i errors</a> · El rànquing només desa el nom de jugador i les solucions.</p></div>`;
}
// Escenes del «Com s'hi juga»: una estació petita (via de maniobra, via A amb corba i via B recta).
function scene(step) {
  const P = 190,
    T = 250,
    W = 58,
    yA = 42,
    yB = 112,
    slot = (k) => T + k * W,
    head = (k) => 74 + k * 62,
    finger = (x, y) => `<g class="finger" transform="translate(${x + 16} ${y + 12})"><circle r="15" fill="#ffffff55"/><circle r="8.5" fill="#fff" stroke="#1d2b38" stroke-width="2"/></g>`,
    tags = (list) =>
      list
        .map((w, k) => `<g transform="translate(${slot(k) + 26} ${yA - 30})"><rect x="-14" y="-10" width="28" height="19" rx="4" fill="${colors[w]}" stroke="#263e43" stroke-width="1"/><text y="4.5" text-anchor="middle" font-family="system-ui" font-size="12" font-weight="800" fill="#21333b">${w}</text></g>`)
        .join(""),
    base = (capA = 3, capB = 3) =>
      `${trackPath([[0, yB], [P, yB]])}${trackPath(curvePoints(P, yB, P + 30, yA, T, yA, slot(capA) - 8))}${trackPath(curvePoints(P, yB, P + 30, yB, T, yB, slot(capB) - 8))}${bufferStop(slot(capA) - 8, yA)}${bufferStop(slot(capB) - 8, yB)}${["A", "B"].map((l, i) => `<g transform="translate(${slot(capA) + 10} ${[yA, yB][i] - 9})"><rect width="18" height="18" rx="4" fill="${i ? "#546766" : "#2f6a55"}"/><text x="9" y="13.5" text-anchor="middle" class="scene-tag">${l}</text></g>`).join("")}<g transform="translate(10 ${yB})">${LOCO}</g>`;
  let body = "";
  if (step === 0)
    body = `${base()}${tags([3, 1, 2])}${[3, 1, 2].map((w, k) => wagonArt(w, slot(k), yA)).join("")}<g class="pop">${[0, 1, 2].map((k) => `<g transform="translate(${slot(k) + 46} ${yA - 18})"><circle r="8" fill="#1f9d6b" stroke="#fff" stroke-width="2"/><path d="M-3.5 0l2.5 2.5 4.5-5" fill="none" stroke="#fff" stroke-width="2"/></g>`).join("")}</g>`;
  else if (step === 1)
    body = `${base()}${wagonArt(5, slot(2), yB)}<g class="slide take" style="--dx:${head(0) - slot(0)}px">${wagonArt(4, slot(0), yB)}${wagonArt(6, slot(1), yB)}${finger(slot(1) + 26, yB)}</g>`;
  else if (step === 2)
    body = `${base()}<g class="slide leave" style="--dx:${slot(0) - head(0)}px">${wagonArt(4, head(0), yB)}${wagonArt(6, head(1), yB)}${finger(head(0) + 26, yB)}</g>`;
  else if (step === 3)
    body = `${base()}${[5, 7, 8].map((w, k) => wagonArt(w, slot(k), yB)).join("")}<g transform="translate(${slot(0) + 26} ${yB + 33})"><rect x="-38" y="-10" width="76" height="20" rx="10" fill="#1f9d6b"/><text y="4.5" text-anchor="middle" class="scene-tag">es pot agafar</text></g>${[1, 2].map((k) => `<g transform="translate(${slot(k) + 26} ${yB})"><circle r="13" fill="#1d2b38d9"/><path d="M-5 -1h10v8h-10zM-3 -1v-3a3 3 0 016 0v3" fill="none" stroke="#fff" stroke-width="1.8"/></g>`).join("")}<g transform="translate(${head(0) + 40} ${yB + 33})"><rect x="-44" y="-10" width="88" height="20" rx="10" fill="#e5533d"/><text y="4.5" text-anchor="middle" class="scene-tag">porta màx. 3</text></g>`;
  else
    return `<div class="guide-tools"><div><span style="--c:#5b6b7a">${icon("undo")}</span><b>Desfer</b><small>gratuït</small></div><div><span style="--c:#f5b82e">${icon("bulb")}</span><b>Pista</b><small>no puntua</small></div><div><span style="--c:#ff8a3d">${icon("swap")}</span><b>Anar i tornar</b><small>1 moviment</small></div><div><span style="--c:#1f9d6b">${icon("star")}</span><b>Mínim</b><small>perfecte</small></div></div>`;
  return `<svg class="scene" viewBox="0 -8 462 168" aria-hidden="true"><defs>${ART_DEFS}</defs>${body}</svg>`;
}
function tutorial(step = 0) {
  tutorialStep = step;
  const pages = [
    ["Forma el tren a la via A", "Els números de dalt marquen quin vagó va a cada plaça."],
    ["Endú-te vagons", "Arrossega un vagó cap a la locomotora: se l’endú amb els que té davant."],
    ["Deixa’ls en una via", "Arrossega un vagó del tren cap a una via: s’hi queda amb els que té darrere."],
    ["Poc espai, molt de cap", "Només pots agafar els vagons de davant, i la locomotora en porta com a molt tres."],
    ["Ajudes i punts", "Prova-ho amb un puzle de pràctica de dos moviments."],
  ];
  modal(
    `<div class="guide"><div class="guide-art ${step === 4 ? "tools" : ""}">${scene(step)}</div><div class="guide-dots" aria-hidden="true">${pages.map((_, i) => `<i class="${i === step ? "on" : i < step ? "done" : ""}"></i>`).join("")}</div><div class="eyebrow">Com s’hi juga · ${step + 1} de ${pages.length}</div><h2>${pages[step][0]}</h2><p>${pages[step][1]}</p><div class="guide-actions">${step ? '<button data-action="tutorial-back">Enrere</button>' : '<button class="ghost" data-action="close">Ara no</button>'}<button class="primary" data-action="tutorial-next">${step === 4 ? `${icon("play")} Prova-ho` : `Següent ${icon("arrow")}`}</button></div></div>`,
  );
}
const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1),
  standalone = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
function installRow() {
  if (standalone()) return "";
  if (installEvent)
    return `<div class="pref-row install-row"><span class="pref-ic" style="--c:#2f80d1">${icon("download")}</span><span class="pref-txt"><b>Instal·la el joc</b><small>S’obre com una app i recorda millor el teu nom</small></span><button class="primary" data-action="install">Instal·la</button></div>`;
  if (ios)
    return `<div class="pref-row install-row"><span class="pref-ic" style="--c:#2f80d1">${icon("download")}</span><span class="pref-txt"><b>Afegeix-lo a la pantalla d’inici</b><small>Toca el botó Comparteix del Safari i tria «Afegeix a la pantalla d’inici»</small></span></div>`;
  return "";
}
function settings() {
  modal(
    `<div class="eyebrow">Al teu gust</div><h2>Preferències</h2><div class="pref-list">${[
      ["sound", "sound", "#ff8a3d", "So", "Efectes discrets en enganxar vagons i en acabar"],
      ["reduced", "motion", "#5b6b7a", "Menys animacions", "Sense lliscaments ni sortida del tren"],
      ["minimum", "eye", "#1f9d6b", "Mostra el mínim", "Quants moviments calen com a mínim"],
    ]
      .map(
        ([k, ic, col, n, d]) =>
          `<label class="pref-row"><span class="pref-ic" style="--c:${col}">${icon(ic)}</span><span class="pref-txt"><b>${n}</b><small>${d}</small></span><input type="checkbox" class="switch" data-pref="${k}" ${prefs[k] ? "checked" : ""}></label>`,
      )
      .join(
        "",
      )}${installRow()}</div><div class="keys"><h3>${icon("keyboard")} Dreceres de teclat</h3><div class="keys-grid"><span><kbd>A</kbd><kbd>B</kbd><kbd>C</kbd> tria una via</span><span><kbd>0</kbd>–<kbd>3</kbd> torna amb tants vagons</span><span><kbd>Ctrl</kbd>+<kbd>Z</kbd> desfer</span><span><kbd>P</kbd> pista</span><span><kbd>N</kbd> nou repte</span><span><kbd>Esc</kbd> cancel·la</span></div></div><div class="dialog-actions"><button class="primary" data-action="close">Fet</button><small class="pref-note">Es desa en aquest dispositiu.</small></div>`,
  );
}
async function optimal() {
  dialog.close();
  const p = { ...game, state: clone(game.initial) };
  start(p, game.mode, { replay: true });
  game.hints++;
  autoplay = true;
  preview = "Reproduint una solució òptima…";
  while (autoplay && !game.finished) {
    const x = await new Promise((resolve) => {
      solverResolve = resolve;
      solve();
    });
    if (!x.next) break;
    await new Promise((r) => setTimeout(r, prefs.reduced ? 200 : 650));
    if (!autoplay) break;
    doMove(...x.next);
  }
  autoplay = false;
  preview = null;
  renderGame();
  toast("Solució reproduïda. Reinicia per provar-la tu.");
}
async function handle(action) {
  if (action === "close") return dialog.close();
  if (action === "tutorial") return tutorial();
  if (action === "tutorial-back") return tutorial(tutorialStep - 1);
  if (action === "tutorial-next") {
    if (tutorialStep === 4) {
      dialog.close();
      start(catalog.find((p) => p.config === "mini" && p.min === 2), "tutorial");
    } else tutorial(tutorialStep + 1);
    return;
  }
  if (action === "settings") return settings();
  if (action === "menu")
    return modal(
      `<div class="menu-sheet"><h2>Maniobres</h2><div class="menu-grid"><button class="on" data-action="close">${icon("play")}<span>Continua la partida</span></button><button data-nav="ranking">${icon("trophy")}<span>Rànquing</span></button><button data-nav="about">${icon("info")}<span>Sobre el joc</span></button><button data-action="tutorial">${icon("help")}<span>Com s’hi juga</span></button><button data-action="settings">${icon("settings")}<span>Preferències</span></button></div></div>`,
    );
  if (action === "rotate-tip") {
    save("rotate-tip", false);
    return document.querySelector(".rotate-tip")?.remove();
  }
  if (action === "install") {
    if (!installEvent) return;
    installEvent.prompt();
    const { outcome } = await installEvent.userChoice.catch(() => ({}));
    installEvent = null;
    document.querySelector(".install-btn")?.remove();
    dialog.querySelector(".install-row")?.remove();
    if (outcome === "accepted") toast("Fet! Ja tens Maniobres a la pantalla d’inici.");
    return;
  }
  if (action === "cancel") {
    selected = 0;
    hintMove = null;
    preview = null;
    return renderGame();
  }
  if (action === "new-menu") {
    modal(
      `<div class="eyebrow">Nou repte</div><h2>Tria la dificultat</h2><p>Com més moviments calen, més punts val el repte.</p><div class="difficulty-grid">${Object.entries(
        LEVELS,
      )
        .map(
          ([v, [n, lo, hi]], i) =>
            `<button class="level-card ${difficulty === v ? "on" : ""}" data-difficulty="${v}" style="--l:${LEVEL_COLORS[n]}"><span class="bars" aria-hidden="true">${[0, 1, 2, 3].map((j) => `<i class="${j <= i ? "f" : ""}" style="height:${7 + j * 4}px"></i>`).join("")}</span><b>${n}</b><small>${lo === 2 ? "fins a " + hi : lo + " a " + hi} moviments</small><span class="pts">${score(lo, lo)}–${score(hi, hi)} punts</span></button>`,
        )
        .join("")}</div>`,
    );
    return;
  }
  if (action === "new") {
    if (game && !game.finished && game.log.length) {
      modal(
        '<h2>Comença una altra partida?</h2><p>El repte actual es perdrà.</p><div class="dialog-actions"><button class="primary" data-action="new-confirm">Nova partida</button><button data-action="close">Continua jugant</button></div>',
      );
    } else handle("new-confirm");
    return;
  }
  if (action === "new-confirm" || action === "next") {
    if (dialog.open) dialog.close();
    const [, lo, hi] = LEVELS[difficulty];
    toast("Preparant una nova maniobra…");
    worker.postMessage({ type: "generate", config: "classic", lo, hi, exclude: solvedLocal.map((k) => "v1-classic-" + k) });
    return;
  }
  if (action === "undo") {
    if (!game.log.length || autoplay) return;
    game.state = game.undo.pop();
    game.log.pop();
    game.finished = false;
    selected = 0;
    hintMove = null;
    preview = null;
    departToken++;
    persist();
    renderGame();
    solve();
    return;
  }
  if (action === "restart") {
    autoplay = false;
    start({ ...game, state: clone(game.initial) }, game.mode);
    return;
  }
  if (action === "hint") {
    if (!nextMove) return toast("No hi ha cap pista disponible.");
    game.hints++;
    selected = 0;
    hintMove = nextMove;
    preview = `Pista: arrossega el vagó marcat on indica la fletxa (${"ABC"[nextMove[0] - 1]}${nextMove[1]}). Amb pistes, la partida no puntua.`;
    persist();
    renderGame();
    return;
  }
  if (action === "result") return showResult();
  if (action === "optimal") return optimal();
  if (action === "retry") return publish();
  if (action === "welcome-save") {
    const input = $("#name-input"),
      err = $("#name-error"),
      btn = dialog.querySelector('[data-action="welcome-save"]');
    btn.disabled = true;
    err.textContent = "";
    try {
      await online.register(input?.value || "");
      await loadPlayer();
      board_ = null;
      dialog.close();
      toast(`Hola, ${player.name}! Ja surts al rànquing.`);
      afterWelcome();
    } catch (e) {
      btn.disabled = false;
      if (e.code === "taken") return offerClaim(e.name);
      err.textContent = e.message;
      input?.focus();
    }
    return;
  }
  if (action === "claim-cancel") {
    pendingClaim = null;
    document.querySelector(".claim-box")?.remove();
    const input = $("#name-input");
    input?.select();
    input?.focus();
    return;
  }
  if (action === "claim") {
    const btn = document.querySelector('[data-action="claim"]'),
      fromWelcome = !!dialog.querySelector(".welcome");
    if (btn) btn.disabled = true;
    try {
      await online.claim(pendingClaim);
      pendingClaim = null;
      await loadPlayer();
      board_ = null;
      toast(`Hola de nou, ${player.name}! Continues amb els teus punts.`);
      if (fromWelcome) {
        dialog.close();
        afterWelcome();
      } else if (dialog.open && game?.ranked && game.finished) await publish();
      if (view === "ranking") renderRanking();
    } catch (e) {
      if (btn) btn.disabled = false;
      toast(e.message);
    }
    return;
  }
  if (action === "register") {
    const input = $("#name-input");
    try {
      await online.register(input?.value || "");
      await loadPlayer();
      toast("Nom desat: " + player.name);
      if (dialog.open && game?.ranked && game.finished) await publish();
      board_ = null;
      if (view === "ranking") renderRanking();
    } catch (e) {
      if (e.code === "taken") return offerClaim(e.name);
      toast(e.message);
    }
    return;
  }
  if (action === "rename") {
    $(".me-card").innerHTML = `<b>Nou nom de jugador</b><span class="name-form"><input id="name-input" maxlength="16" value="${esc(player.name)}" aria-label="Nom de jugador"><button class="primary" data-action="register">Desa</button><button class="ghost" data-nav="ranking">Cancel·la</button></span><small>Els teus punts es conserven.</small>`;
    $("#name-input").focus();
    return;
  }
  if (action === "erase") {
    modal(
      '<h2>T’esborres del rànquing?</h2><p>S’eliminaran el teu nom i tots els teus resultats. No es pot desfer.</p><div class="dialog-actions"><button data-action="erase-confirm">Esborra’m</button><button class="primary" data-action="close">Cancel·la</button></div>',
    );
    return;
  }
  if (action === "erase-confirm") {
    try {
      await online.erase();
      save("me", null);
      player = null;
      board_ = null;
      dialog.close();
      renderRanking();
      toast("Dades esborrades.");
    } catch (e) {
      toast("No s’ha pogut esborrar: comprova la connexió.");
    }
  }
}
// Arrossegar vagons amb el ratolí o el dit. Cada deixada vàlida és una maniobra.
let drag = null,
  dragFrom = null,
  noClickUntil = 0;
function svgPoint(svg, e) {
  const m = svg.getScreenCTM().inverse();
  return new DOMPoint(e.clientX, e.clientY).matrixTransform(m);
}
function dropPlan(d, zone) {
  const c = config(),
    s = game.state;
  if (d.src === 0) {
    if (zone === 0) return { zone, quiet: true };
    const v = zone,
      k = d.idx,
      cap = c.caps[v - 1];
    if (s[0].length + s[v].length - k > cap)
      return { zone, error: `A la via ${"ABC"[v - 1]} només hi caben ${cap} vagons.` };
    return { zone, v, k };
  }
  if (zone === d.src) return { zone, quiet: true };
  if (zone !== 0)
    return { zone, error: "Els vagons no salten de via: porta’ls primer a la locomotora." };
  const k = s[0].length + d.idx + 1;
  if (k > c.h) return { zone, error: `La locomotora només pot arrossegar ${c.h} vagons.` };
  return { zone, v: d.src, k };
}
// Les vies capten el clic sencer (pointer-events: bounding-box): busquem el vagó per posició.
function wagonAt(e) {
  const svg = e.target.closest?.("#main .board");
  if (!svg) return null;
  const direct = e.target.closest("[data-src]");
  if (direct) return direct;
  // Amb el dit, s'accepta un toc una mica fora del vagó (uns 22 px de pantalla): el més proper.
  const p = svgPoint(svg, e),
    k = svg.getScreenCTM()?.a || 1,
    tol = e.pointerType === "mouse" ? 0 : Math.min(34, 22 / k);
  let best = null,
    bd = Infinity;
  svg.querySelectorAll("[data-src]").forEach((el) => {
    const [x, y] = el.getAttribute("transform").match(/[-\d.]+/g).map(Number),
      d = Math.hypot(Math.max(x - 6 - p.x, 0, p.x - x - 58), Math.max(y - 27 - p.y, 0, p.y - y - 27));
    if (d <= tol && d < bd) {
      best = el;
      bd = d;
    }
  });
  return best;
}
document.addEventListener("pointerdown", (e) => {
  const el = wagonAt(e);
  if (!el || !game || game.finished || autoplay || e.button > 0) return;
  const svg = el.ownerSVGElement,
    src = +el.dataset.src,
    idx = +el.dataset.idx,
    els = [...svg.querySelectorAll(`[data-src="${src}"]`)].filter((x) =>
      src === 0 ? +x.dataset.idx >= idx : +x.dataset.idx <= idx,
    );
  const L = layout(),
    start = svgPoint(svg, e);
  drag = {
    svg,
    src,
    idx,
    els,
    L,
    id: e.pointerId,
    start,
    s0: els.map((x) => parked(L, src, +x.dataset.idx)),
    sp0: src ? project(route(L, src), start).s : Math.min(start.x, L.pt),
    via: src || L.ys.reduce((b, y, i) => (Math.abs(start.y - y) < Math.abs(start.y - L.ys[b - 1]) ? i + 1 : b), 1),
    moved: false,
    plan: null,
  };
});
document.addEventListener("pointermove", (e) => {
  if (!drag || e.pointerId !== drag.id) return;
  const p = svgPoint(drag.svg, e),
    dx = p.x - drag.start.x,
    dy = p.y - drag.start.y;
  if (!drag.moved) {
    if (Math.hypot(dx, dy) < 8) return;
    drag.moved = true;
    try {
      drag.svg.setPointerCapture(e.pointerId);
    } catch {}
    drag.svg.classList.add("dragging");
    // Al final de l'SVG perquè passin per sobre de les altres vies.
    drag.els.forEach((x) => {
      x.classList.add("lifted");
      drag.svg.append(x);
    });
  }
  e.preventDefault();
  // Els vagons no volen: llisquen pel recorregut dels rails.
  const L = drag.L,
    s = game.state;
  let v = drag.src;
  if (!v) {
    // Des de la locomotora: passades les agulles, la via més propera al dit.
    v = [1, 2, 3].reduce((b, i) => (project(route(L, i), p).d < project(route(L, b), p).d - 1 ? i : b), drag.via);
    drag.via = v;
  }
  const r = route(L, v),
    sp = project(r, p).s;
  let delta = sp - drag.sp0;
  if (drag.src) {
    const front = Math.min(...drag.s0),
      limit = L.headX + s[0].length * L.headStep + 26;
    delta = Math.min(0, Math.max(limit - front, delta));
  } else {
    const lead = Math.max(...drag.s0),
      m = s[v].length,
      limit = m ? r.sTx + 26 - 58 : r.sTx + (L.caps[v - 1] - 1) * L.step + 26;
    delta = Math.max(0, Math.min(limit - lead, delta));
  }
  drag.cur = drag.s0.map((x) => x + delta);
  drag.els.forEach((x, i) => placeAt(x, r, drag.cur[i]));
  let zone = drag.src ? (Math.min(...drag.cur) < L.pt ? 0 : drag.src) : Math.max(...drag.cur) > L.pt + 4 ? v : 0;
  // Si el dit va clarament cap a una altra via, avisa que els vagons no hi poden saltar.
  if (drag.src && p.x > L.pt) {
    const d = [1, 2, 3].map((i) => project(route(L, i), p).d),
      other = d.indexOf(Math.min(...d)) + 1;
    if (other !== drag.src && d[drag.src - 1] - d[other - 1] > 30) zone = other;
  }
  drag.plan = dropPlan(drag, zone);
  drag.svg.querySelectorAll(".drop-ok,.drop-bad").forEach((x) => x.classList.remove("drop-ok", "drop-bad"));
  const target =
    drag.plan.zone === 0
      ? drag.svg.querySelector(".maniobra-halo")
      : drag.svg.querySelector(`.siding[data-via="${drag.plan.zone}"]`);
  if (target && !drag.plan.quiet) target.classList.add(drag.plan.error ? "drop-bad" : "drop-ok");
});
function endDrag(e, cancel = false) {
  if (!drag || e.pointerId !== drag.id) return;
  const d = drag;
  drag = null;
  if (!d.moved) return;
  noClickUntil = Date.now() + 350;
  if (!cancel && d.plan?.v) {
    dragFrom = new Map(d.els.map((x, i) => [x.dataset.wagon, d.cur[i]]));
    doMove(d.plan.v, d.plan.k);
  }
  else {
    if (!cancel && d.plan?.error) toast(d.plan.error);
    renderGame();
  }
}
document.addEventListener("pointerup", (e) => endDrag(e));
document.addEventListener("pointercancel", (e) => endDrag(e, true));
document.addEventListener("click", async (e) => {
  if (Date.now() < noClickUntil && e.target.closest("#main .board")) return;
  const b = e.target.closest("button,[data-cut],[data-via]");
  if (!b || b.disabled) return;
  try {
    if (b.dataset.nav) {
      autoplay = false;
      if (dialog.open) dialog.close();
      view = b.dataset.nav;
      render();
    } else if (b.dataset.action) await handle(b.dataset.action);
    else if (b.dataset.player) showPlayer(b.dataset.player);
    else if (b.dataset.rankLevel) {
      rankLevel = b.dataset.rankLevel;
      loadRanking();
    }
    else if (b.dataset.puzzle) {
      const p = puzzleFromKey(b.dataset.puzzle);
      if (!p) return;
      dialog.close();
      start(p);
    }
    else if (b.dataset.difficulty) {
      difficulty = b.dataset.difficulty;
      dialog.close();
      handle("new");
    } else if (b.dataset.via) {
      // Les zones de les vies se superposen a les agulles: amb el punter, la via és la més propera.
      let v = +b.dataset.via;
      const svg = b.ownerSVGElement;
      if (e.detail && svg) {
        const p = svgPoint(svg, e);
        if (p.x >= +svg.dataset.pt - 10)
          v = layout().ys.reduce((best, y, i) => (Math.abs(p.y - y) < Math.abs(p.y - layout().ys[best - 1]) ? i + 1 : best), 1);
      }
      select(v);
    }
    else if (b.dataset.cut !== undefined) doMove(selected, +b.dataset.cut);
  } catch (e) {
    toast("No s’ha pogut completar l’acció: " + e.message);
  }
});
document.addEventListener("change", (e) => {
  if (e.target.dataset.pref) {
    prefs[e.target.dataset.pref] = e.target.checked;
    save("prefs", prefs);
    document.body.classList.toggle("reduced", prefs.reduced);
    if (view === "play") renderGame();
  }
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && e.target.id === "name-input") {
    e.preventDefault();
    handle(dialog.querySelector('[data-action="welcome-save"]') ? "welcome-save" : "register");
  }
});
document.addEventListener("keydown", (e) => {
  if (e.target.closest("input,select,textarea") || dialog.open) return;
  if (view !== "play" || autoplay) return;
  if (e.ctrlKey || e.metaKey || e.altKey) {
    if (e.key.toLowerCase() === "z" && !e.altKey) {
      e.preventDefault();
      handle("undo");
    }
    return;
  }
  if (e.key === "Escape" && (selected || hintMove)) {
    e.preventDefault();
    handle("cancel");
  } else if (e.key.toLowerCase() === "p") {
    e.preventDefault();
    handle("hint");
  } else if (e.key.toLowerCase() === "n") {
    e.preventDefault();
    handle("new-menu");
  } else if (/^[abc]$/i.test(e.key)) {
    e.preventDefault();
    select("abc".indexOf(e.key.toLowerCase()) + 1);
  } else if (selected && /^[0-3]$/.test(e.key)) {
    e.preventDefault();
    doMove(selected, +e.key);
  } else if (e.key.toLowerCase() === "z") {
    e.preventDefault();
    handle("undo");
  } else if (
    ["ArrowLeft", "ArrowRight"].includes(e.key) &&
    e.target.closest(".choice-row")
  ) {
    e.preventDefault();
    const all = [...e.target.closest(".choice-row").querySelectorAll("button:not(:disabled)")],
      i = all.indexOf(e.target);
    all[(i + (e.key === "ArrowRight" ? 1 : all.length - 1)) % all.length]?.focus();
  } else if (e.target.matches("[data-via]") && e.key === "Enter") {
    e.preventDefault();
    select(+e.target.dataset.via);
  }
});
setInterval(() => {
  if ($("#timer") && game && !game.finished) $("#timer").textContent = time(elapsed());
}, 1000);
setTimeout(
  () => toast("Fa mitja hora que ets a l’estació. Et ve de gust fer una pausa?"),
  30 * 60e3,
);
function validSaved(g) {
  try {
    if (!g || !Array.isArray(g.log) || g.log.length > 500) return false;
    const c = CONFIGS.find((c) => c.id === g.config);
    if (!c) return false;
    const valid = (s) =>
      Array.isArray(s) &&
      s.length === 4 &&
      s.every(
        (a, i) => Array.isArray(a) && a.length <= (i ? c.caps[i - 1] : c.h),
      ) &&
      s
        .flat()
        .slice()
        .sort((a, b) => a - b)
        .join(",") === Array.from({ length: c.n }, (_, i) => i + 1).join(",");
    if (!valid(g.initial) || !valid(g.state)) return false;
    let s = clone(g.initial);
    g.undo = [];
    for (const m of g.log) {
      g.undo.push(clone(s));
      s = move(s, c, ...m);
    }
    if (key(s) !== key(g.state)) return false;
    g.finished = won(s, c);
    if (!Number.isFinite(g.started)) g.started = Date.now();
    if (
      !Array.isArray(g.labels) ||
      g.labels
        .slice()
        .sort((a, b) => a - b)
        .join(",") !== Array.from({ length: c.n }, (_, i) => i + 1).join(",")
    )
      g.labels = Array.from({ length: c.n }, (_, i) => i + 1);
    return true;
  } catch {
    return false;
  }
}
const query = new URLSearchParams(location.search),
  linked =
    catalog.find((p) => p.id === query.get("p")) ||
    puzzleFromKey(query.get("p")),
  saved = read("game", null);
if (linked) start(linked);
else if (validSaved(saved)) {
  game = saved;
  solve();
  render();
} else start(pick("facil"));
if (read("nowelcome", false)) loadPlayer();
else
  loadPlayer().then((p) => {
    if (p && !p.name) welcome();
    else afterWelcome();
  });
if (!storageOK)
  toast(
    "El navegador no permet desar el progrés. Pots jugar, però no es conservarà en tancar.",
  );
navigator.storage?.persist?.().catch(() => {});
addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  installEvent = e;
  const top = $(".top-actions");
  if (top && !top.querySelector(".install-btn"))
    top.insertAdjacentHTML("afterbegin", `<button class="install-btn" data-action="install" aria-label="Instal·la el joc">${icon("download")} Instal·la</button>`);
});
addEventListener("appinstalled", () => {
  installEvent = null;
  document.querySelector(".install-btn")?.remove();
});
if ("serviceWorker" in navigator)
  navigator.serviceWorker.register("./sw.js").catch(() => {});

// Mòbil horitzontal: només el tauler. Quan s'hi gira, l'avís de girar ja no cal.
const landscape = matchMedia("(orientation: landscape) and (max-height: 500px) and (pointer: coarse)");
const onLandscape = () => {
  if (landscape.matches) {
    save("rotate-tip", false);
    document.querySelector(".rotate-tip")?.remove();
  }
};
landscape.addEventListener("change", onLandscape);
onLandscape();
matchMedia("(max-width:650px)").addEventListener("change", () => {
  if (view === "play") renderGame();
});