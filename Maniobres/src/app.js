// SPDX-License-Identifier: AGPL-3.0-or-later
import {
  CONFIGS,
  clone,
  key,
  canonical,
  move,
  moves,
  won,
  daily,
  dateKey,
  hash,
  rng,
  puzzleFromKey,
} from "./engine.js";
import { api } from "./online.js";
import {
  ACHIEVEMENTS,
  normalize,
  rating,
  record,
  visit,
  streak,
  title,
} from "./progress.js";
const $ = (s) => document.querySelector(s),
  root = $("#app"),
  dialog = $("#dialog");
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
  medal: "M12 15a6 6 0 100-12 6 6 0 000 12zM8.5 13.5L7 22l5-3 5 3-1.5-8.5",
};
function icon(n) {
  return `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[n] || paths.info}"/></svg>`;
}
const colors = [
  "#aebbc0",
  "#f2b35d",
  "#80c8bd",
  "#d28e82",
  "#a8add2",
  "#dfca7e",
  "#7fa7c3",
  "#b5bf91",
  "#cba8bc",
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
let token = read("token", null);
if (!token) {
  token = crypto.randomUUID() + crypto.randomUUID();
  save("token", token);
}
let prefs = read("prefs", {
    sound: false,
    reduced: matchMedia("(prefers-reduced-motion: reduce)").matches,
    minimum: true,
  }),
  records = read("records", []).filter((r) => Date.now() - r.at < 30 * 864e5),
  progress = read("progress", {}),
  room = read("room", null),
  teacher = read("teacher", null),
  prog = normalize(read("prog", null));
save("records", records);
document.body.classList.toggle("reduced", prefs.reduced);
let catalog, stats;
try {
  [catalog, stats] = await Promise.all(
    ["catalog", "stats"].map(async (f) => {
      const r = await fetch(`data/${f}.json`);
      if (!r.ok) throw Error();
      return r.json();
    }),
  );
} catch {
  root.innerHTML =
    '<p class="loading">No s’han pogut carregar les dades. Comprova la connexió i torna a obrir el joc.</p>';
  throw Error("Dades no disponibles");
}
const campaign = [];
for (let line = 0; line < 6; line++) {
  const a = catalog.filter(
    (p) =>
      p.config ===
        (line === 0 ? "mini" : line === 1 ? "intermedia" : "classic") &&
      p.min >=
        (line < 2
          ? 2
          : line === 2
            ? 5
            : line === 3
              ? 9
              : line === 4
                ? 13
                : 16) &&
      p.min <=
        (line < 2
          ? 12
          : line === 2
            ? 8
            : line === 3
              ? 12
              : line === 4
                ? 15
                : 17),
  );
  for (let j = 0; j < 10; j++)
    campaign.push(a[Math.floor((j * (a.length - 1)) / 9)]);
}
let view = "play",
  rankTab = "season",
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
  rankData = null,
  sprintEnd = 0,
  sprintSolved = 0,
  sprintTimer = null,
  onlineMessage = "",
  tutorialStep = 0;
const worker = new Worker(new URL("./solver-worker.js", import.meta.url), {
  type: "module",
});
worker.onmessage = ({ data }) => {
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
    date: dateKey(),
    ...extra,
  };
  selected = 0;
  remaining = null;
  nextMove = null;
  preview = null;
  view = "play";
  persist();
  solve();
  render();
  if (!extra.replay) celebrate(visit(prog, mode));
}
function celebrate(codes) {
  save("prog", prog);
  if (!codes?.length) return;
  const names = codes.map((c) => ACHIEVEMENTS.find((a) => a[0] === c)?.[1]);
  toast("Nou èxit: " + names.join(" · "));
}
const navs = [
  ["play", "play", "Estació"],
  ["daily", "calendar", "Repte diari"],
  ["campaign", "route", "Les sis línies"],
  ["ranking", "trophy", "Rànquing"],
  ["lab", "lab", "Laboratori"],
  ["class", "users", "A l’aula"],
  ["sprint", "clock", "Contrarellotge"],
  ["progress", "medal", "El meu progrés"],
  ["info", "info", "Sobre el joc"],
];
function render() {
  document.body.classList.toggle(
    "projector",
    !!prefs.projector && view === "play",
  );
  root.innerHTML = `<div class="shell"><header class="topbar"><button class="brand" data-nav="play" aria-label="Maniobres, anar a l’estació"><img src="assets/favicon.svg" alt=""><span><strong>Maniobres</strong><small>Cada moviment compta</small></span></button><div class="top-actions"><button data-action="tutorial">${icon("info")} Com s’hi juga</button><button data-action="settings" aria-label="Preferències">${icon("settings")}</button></div></header><div class="layout"><nav class="nav" aria-label="Modes de joc">${navs.map(([v, i, n]) => `<button data-nav="${v}" class="${view === v ? "active" : ""}" ${view === v ? 'aria-current="page"' : ""}>${icon(i)}${n}</button>`).join("")}<div class="nav-note"><span class="status-dot"></span>Sense anuncis. Sense presses.<br>Un petit pati de vies.<br>Moltes maneres de pensar.</div></nav><main id="main"></main></div></div>`;
  if (view === "play") renderGame();
  else if (view === "campaign") renderCampaign();
  else if (view === "ranking") {
    renderRanking();
    loadRanking();
  } else if (view === "lab") renderLab();
  else if (view === "class") renderClass();
  else if (view === "info") renderInfo();
  else if (view === "sprint") renderSprint();
  else if (view === "progress") renderProgress();
}
function wagon(w, x, y, small = false) {
  w = game.labels?.[w - 1] ?? w;
  return `<g class="wagon" data-wagon="${w}" transform="translate(${x} ${y})"><path d="M-5 0h62" stroke="#3d4b4c" stroke-width="4"/><rect x="0" y="-20" width="52" height="40" rx="6" fill="${colors[w]}" stroke="#263e43" stroke-width="1.5"/><path d="M5-14h42M5 14h42" stroke="#fff5" stroke-width="2"/><path d="M8-21v-5m35 5v-5M8 21v5m35-5v5" stroke="#344349" stroke-width="5"/><text x="26" y="6" text-anchor="middle" font-family="system-ui" font-size="18" font-weight="800" fill="#21333b">${w}</text></g>`;
}
function board(s = game.state, c = config(), interactive = true) {
  const narrow = innerWidth < 650,
    ys = [100, 220, 340],
    headX = narrow ? 70 : 90,
    tx = narrow ? 280 : 450,
    pt = narrow ? 240 : 350,
    cv = narrow ? 260 : 400,
    step = narrow ? 70 : 72,
    width = narrow ? 660 : 1000;
  let a = `<svg class="board" viewBox="0 0 ${width} 430" role="group" aria-label="Estació. Via de maniobra: ${s[0].map((w) => game.labels?.[w - 1] ?? w).join(", ") || "buida"}. ${s
    .slice(1)
    .map(
      (a, i) =>
        `Via ${"ABC"[i]}: ${a.map((w) => game.labels?.[w - 1] ?? w).join(", ") || "buida"}`,
    )
    .join(
      ". ",
    )}"><defs><pattern id="sleepers" width="18" height="18" patternUnits="userSpaceOnUse"><path d="M8 0v18" stroke="#baafa0" stroke-width="5"/></pattern></defs><g opacity=".35" stroke="#d4cbb9" fill="none"><path d="M20 45h${width - 40}M20 390h${width - 40}"/><path d="M40 30v370M${width - 40} 30v370"/></g><text x="36" y="35" fill="#65756e" font-family="monospace" font-size="11" letter-spacing="3">PATI DE MANIOBRES / ${c.caps.join(" · ")}</text><path d="M28 211H${pt}v18H28z" fill="url(#sleepers)"/><path d="M25 212H${pt}M25 228H${pt}" stroke="#697976" stroke-width="3"/>`;
  for (let i = 1; i <= 3; i++) {
    const y = ys[i - 1],
      end = tx + c.caps[i - 1] * step;
    a += `<g class="siding ${selected === i ? "selected" : ""}" ${interactive ? `data-via="${i}" tabindex="0" role="button" aria-label="Via ${"ABC"[i - 1]}, ${s[i].length} de ${c.caps[i - 1]} vagons"` : ""}><path class="track-halo" d="M${pt} 220 Q${cv} ${y} ${tx} ${y}H${end}" fill="none" stroke="#f2b35d66" stroke-width="62" stroke-linecap="round"/><path d="M${pt} 220 Q${cv} ${y} ${tx} ${y}H${end}" fill="none" stroke="#b9ae9a" stroke-width="19" stroke-dasharray="5 12"/><path d="M${pt} 213 Q${cv} ${y - 7} ${tx} ${y - 7}H${end}M${pt} 227 Q${cv} ${y + 7} ${tx} ${y + 7}H${end}" fill="none" stroke="#697976" stroke-width="3"/><path d="M${end} ${y - 17}v34M${end - 5} ${y - 17}h10M${end - 5} ${y + 17}h10" stroke="#485a57" stroke-width="5"/><rect x="${tx - 30}" y="${y - 55}" width="30" height="23" rx="4" fill="${i === 1 ? "#355c52" : "#546766"}"/><text x="${tx - 15}" y="${y - 39}" fill="white" text-anchor="middle" font-size="14" font-weight="700">${"ABC"[i - 1]}</text><text x="${tx + 10}" y="${y - 39}" class="track-label" font-family="system-ui" font-size="12">${i === 1 ? "Tren final" : "Via auxiliar"} <tspan fill="#738079" font-weight="400">${s[i].length}/${c.caps[i - 1]}</tspan></text>`;
    for (let k = 0; k < c.caps[i - 1]; k++)
      a += `<rect x="${tx + k * step}" y="${y - 21}" width="52" height="42" rx="5" fill="none" stroke="#c6beb0" stroke-dasharray="3 5"/>`;
    s[i].forEach(
      (w, j) =>
        (a += cutTarget(wagon(w, tx + j * step, y), i, s[0].length + j + 1, s, c, interactive)),
    );
    a += "</g>";
  }
  a += cutTarget(`<g transform="translate(${narrow ? 10 : 26} 220)"><rect x="0" y="-22" width="54" height="44" rx="6" fill="#304f49" stroke="#1b3734" stroke-width="2"/><rect x="5" y="-16" width="17" height="32" rx="3" fill="#172f32"/><path d="M30-14h16m-16 7h16m-16 7h16m-16 7h16m-16 7h16" stroke="#a8b9a5" stroke-width="2"/><path d="M10-24h32M10 24h32" stroke="#1d3439" stroke-width="5"/><circle cx="51" cy="-13" r="3" fill="#f6cd82"/><circle cx="51" cy="13" r="3" fill="#f6cd82"/></g>`, selected, 0, s, c, interactive, "Locomotora sola");
  s[0].forEach(
    (w, j) =>
      (a += cutTarget(wagon(w, headX + j * (narrow ? 55 : 65), 220), selected, j + 1, s, c, interactive)),
  );
  a += `<text x="34" y="280" fill="#63746c" font-family="system-ui" font-size="12">Via de maniobra · ${s[0].length}/${c.h}</text><circle cx="${pt}" cy="220" r="5" fill="#355c52"/><path d="M${pt} 250v20" stroke="#64736b"/><text x="${pt}" y="288" text-anchor="middle" font-size="11" fill="#64736b">Agulles</text></svg>`;
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
    modeNames = {
      free: "Partida lliure",
      daily: "Repte diari",
      campaign: "Les sis línies",
      lab: "Laboratori",
      class: "Repte de classe",
      sprint: "Contrarellotge",
      tutorial: "Primera maniobra",
    };
  $("#main").innerHTML =
    `<div class="page-head"><div class="title"><div class="eyebrow">${modeNames[game.mode]} · ${c.name}</div><h1>${isWon ? "Tren a punt. Bona feina." : "Troba el camí més curt."}</h1><p>${game.mode === "daily" ? "El mateix repte per a tothom. Una nova oportunitat cada dia." : "Ordena els vagons. Allibera espai. Pensa el següent moviment."}</p></div><div class="mini-metrics"><b>${game.log.length}</b> moviments <span>· mínim ${prefs.minimum ? (game.min ?? "?") : "?"}</span></div><span class="badge">${c.n} vagons · ${c.t} al tren</span></div>${game.mode === "class" ? `<div class="room-banner">Estació compartida <strong>${esc(game.room)}</strong></div>` : ""}<div class="game-grid"><section class="panel"><div class="target-bar"><div><div class="eyebrow">Destinació · Via A</div><div class="label">Forma aquest tren</div></div><div><div class="target-train">${Array.from({ length: c.t }, (_, i) => `<span class="wagon-chip" style="--w:${colors[game.labels?.[i] ?? i + 1]}">${game.labels?.[i] ?? i + 1}</span>`).join("")}</div><div class="direction">AGULLES → FONS DE VIA</div></div></div><div class="board-wrap">${board()}<span class="board-caption">${selected ? "Via " + "ABC"[selected - 1] + " · toca el darrer vagó que vols endur-te" : "Selecciona una via · A / B / C"}</span></div><div class="controls">${isWon ? `<div class="prompt">${icon("trophy")} Tren completat amb ${game.log.length} moviments.</div><div class="choice-row"><button class="primary" data-action="result">Veure el resultat</button><button data-action="new">Una altra partida ${icon("arrow")}</button></div>` : `<div class="prompt">${selected ? `<b>Via ${"ABC"[selected - 1]}</b> · Amb quants vagons vols tornar?` : "<b>01</b> Tria la via on vols fer la maniobra."}</div><div class="choice-row">${selected ? Array.from({ length: c.h + 1 }, (_, k) => `<button data-cut="${k}" ${!moves(game.state, c).some((m) => m[0] === selected && m[1] === k) || autoplay ? "disabled" : ""}>${k === 0 ? "Locomotora sola" : k + " " + (k === 1 ? "vagó" : "vagons")}</button>`).join("") + `<button class="ghost" data-action="cancel">Cancel·la</button>` : [1, 2, 3].map((v) => `<button data-via="${v}" ${autoplay ? "disabled" : ""}>Via ${"ABC"[v - 1]} <span class="muted">${game.state[v].length}/${c.caps[v - 1]}</span></button>`).join("")}</div>${preview ? `<p class="hint-line">${esc(preview)}</p>` : ""}`}</div><div class="tool-row"><button data-action="undo" ${!game.log.length || autoplay ? "disabled" : ""}>${icon("undo")} Desfer</button><button data-action="restart">${icon("reset")} Reiniciar</button><button data-action="hint" ${isWon || autoplay || solving ? "disabled" : ""}>${icon("bulb")} Pista</button><button class="compact-new" data-action="new">Nou repte</button><button data-action="history">${icon("route")} Historial</button><button data-action="print">${icon("print")} Fitxa</button><button data-action="projector" aria-label="${prefs.projector ? "Sortir del projector" : "Mode projector"}">${icon("screen")}</button></div></section><aside class="side-stack"><div class="panel metrics"><div class="metric"><strong>${game.log.length}</strong><span>Moviments</span></div><div class="metric"><strong>${prefs.minimum ? (game.min ?? "—") : "?"}</strong><span>Mínim inicial</span></div><div class="metric"><strong>${prefs.minimum ? (solving ? "…" : (remaining ?? "—")) : "?"}</strong><span>Mínim restant</span></div><div class="metric"><strong id="timer">${time(game.finished ? game.seconds : elapsed())}</strong><span>${game.mode === "sprint" ? "Temps del puzle" : "Temps · sense límit"}</span></div></div><div class="panel small-card"><div class="eyebrow">El teu proper repte</div><label for="difficulty" class="muted" style="font-size:12px">Dificultat</label><select id="difficulty">${[
      ["facil", "Fàcil · fins a 8"],
      ["mitja", "Mitjà · 9–12"],
      ["dificil", "Difícil · 13–15"],
      ["expert", "Expert · 16–17"],
    ]
      .map(
        ([v, l]) =>
          `<option value="${v}" ${difficulty === v ? "selected" : ""}>${l} moviments</option>`,
      )
      .join(
        "",
      )}</select><button class="primary wide" data-action="new">Nova partida</button></div><div class="panel small-card"><div class="eyebrow">Cap d’estació</div><h3>${remaining === null && !solving ? "Aquest tren està bloquejat" : game.log.length === 0 ? "Comença pel fons" : "Fes lloc al següent"}</h3><p>${remaining === null && !solving ? "En aquesta configuració no es pot arribar al tren objectiu. Canvia el repartiment o l’estació al Laboratori." : "El darrer vagó del tren ha de quedar al fons de la via A. Reserva espai abans de moure’l."}</p>${sprintEnd ? `<b class="warning">Ronda: <span id="sprint-time">${time(Math.max(0, Math.ceil((sprintEnd - Date.now()) / 1000)))}</span></b>` : '<button class="ghost" data-action="tutorial">Recorda les regles</button>'}</div><div class="panel small-card history-card"><div class="eyebrow">Quadern de maniobres</div><div class="history">${game.log.length ? game.log.map(([v, k]) => `<span>${"ABC"[v - 1]}${k}</span>`).join("") : "Encara no has mogut cap vagó."}</div></div></aside></div><div class="bottom-note"><span>${icon("info")} A, B, C: via · 0–${c.h}: vagons · Z: desfer</span><span>${game.hints ? "Amb ajuda · " + game.hints + " pistes" : "Al teu ritme. Cada intent ensenya."}</span></div>`;
}
function select(v) {
  if (!game || game.finished || autoplay) return;
  selected = v;
  preview = null;
  renderGame();
  $("#main .choice-row button:not(:disabled)")?.focus({ preventScroll: true });
}
function doMove(v, k) {
  if (game.finished) return;
  const positions = new Map(
    [...document.querySelectorAll(".board [data-wagon]")].map((el) => [
      el.dataset.wagon,
      el.getAttribute("transform"),
    ]),
  );
  try {
    const updated = move(game.state, config(), v, k);
    game.undo.push(clone(game.state));
    game.state = updated;
    animationUntil = prefs.reduced ? 0 : Date.now() + 330;
    game.log.push([v, k]);
    selected = 0;
    preview = null;
    sound("couple");
    persist();
    if (won(game.state, config())) finish();
    else {
      solve();
      renderGame();
    }
    if (!prefs.reduced)
      document.querySelectorAll(".board [data-wagon]").forEach((el) => {
        const before = positions.get(el.dataset.wagon),
          after = el.getAttribute("transform");
        if (before && before !== after) {
          const css = (t) =>
            t.replace(
              /translate\(([-\d.]+) ([-\d.]+)\)/,
              "translate($1px,$2px)",
            );
          el.animate([{ transform: css(before) }, { transform: css(after) }], {
            duration: 320,
            easing: "ease-in-out",
          });
        }
      });
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
  sound("whistle");
  const stars = rating(game.log.length, game.min, game.hints);
  game.outcome = null;
  if (!autoplay) {
    records.push({
      id: game.id,
      min: game.min,
      moves: game.log.length,
      at: Date.now(),
      seconds: game.seconds,
      mode: game.mode,
      hints: game.hints,
    });
    records = records.filter((r) => Date.now() - r.at < 30 * 864e5);
    save("records", records);
    let lineComplete = false;
    if (game.mode === "campaign") {
      progress[game.level] = Math.max(progress[game.level] || 0, stars);
      save("progress", progress);
      const first = game.level - (game.level % 10);
      lineComplete = Array.from({ length: 10 }, (_, j) => progress[first + j]).every(
        (x) => x === 3,
      );
    }
    if (game.mode === "sprint") sprintSolved++;
    game.outcome = record(
      prog,
      {
        id: game.id,
        config: game.config,
        mode: game.mode,
        min: game.min,
        moves: game.log.length,
        hints: game.hints,
        undos: game.undos,
        seconds: game.seconds,
        date: game.date,
      },
      { today: dateKey(), lineComplete },
    );
    save("prog", prog);
  }
  persist();
  renderGame();
  if (!autoplay) showResult();
}
function modal(html) {
  dialog.innerHTML = `<button class="close" data-action="close" aria-label="Tancar">×</button>${html}`;
  const heading = dialog.querySelector("h2");
  if (heading) {
    heading.id = "dialog-title";
    dialog.setAttribute("aria-labelledby", "dialog-title");
  }
  if (!dialog.open) dialog.showModal();
}
function showResult() {
  const n = rating(game.log.length, game.min, game.hints),
    o = game.outcome,
    extra = game.min != null ? game.log.length - game.min : null,
    near =
      extra === 1
        ? "A 1 moviment del mínim!"
        : extra === 2
          ? "A 2 moviments del mínim. Gairebé!"
          : "",
    news = [
      o?.improved
        ? `Nou rècord personal: ${game.log.length} moviments (abans ${o.previous}).`
        : o && o.previous !== null && game.log.length >= o.previous
          ? `El teu rècord en aquest puzle és de ${o.previous} moviments.`
          : "",
      o?.xp ? `+${o.xp} punts d’experiència.` : "",
      ...(o?.unlocked || []).map(
        (c) => "Nou èxit: " + ACHIEVEMENTS.find((a) => a[0] === c)[1] + ".",
      ),
    ].filter(Boolean);
  modal(
    `<div class="eyebrow">Servei completat</div><h2>${n === 3 ? "Una maniobra perfecta." : "El tren ja pot sortir."}</h2><div class="big-stars" aria-label="${n} estrelles">${"★".repeat(n)}${"☆".repeat(3 - n)}</div><p><b>${game.log.length} moviments</b> · mínim ${game.min ?? "desconegut"} · ${time(game.seconds)}${game.hints ? " · amb ajuda" : ""}</p><p>${extra === 0 ? (game.hints ? "Has arribat al mínim, però amb ajuda: la pista resta una estrella." : "Has trobat un dels camins més curts possibles.") : near || `Pots tornar-hi i explorar una altra estratègia.${extra != null ? " T’has quedat a " + extra + " moviments del mínim." : ""}`}${extra && game.hints ? " La pista resta una estrella." : ""}</p>${news.length ? `<ul class="result-news">${news.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}<div class="dialog-actions"><button class="primary" data-action="next">${game.mode === "campaign" ? "Següent nivell" : "Següent repte"}</button><button data-action="optimal">Veure la solució</button><button data-action="share">Compartir</button>${["daily", "class"].includes(game.mode) ? '<button class="accent" data-action="submit">Publicar al rànquing</button>' : ""}</div><p id="online-message" style="margin-top:16px;font-size:12px">${["daily", "class"].includes(game.mode) ? "Publicació opcional amb pseudònim automàtic. El resultat caduca als 30 dies." : ""}</p>`,
  );
}
function renderCampaign() {
  const names = [
    "Aprendre a maniobrar",
    "La línia intermèdia",
    "Guanyar espai",
    "Pensar abans de moure",
    "L’art de l’estratègia",
    "Els disset moviments",
  ];
  $("#main").innerHTML =
    `<div class="page-head"><div><div class="eyebrow">60 parades · 6 línies</div><h1>El viatge de l’aprenent.</h1><p>De la primera maniobra al repte més exigent.</p></div><span class="badge">${Object.keys(progress).length}/60 completades</span></div><div class="cards">${names
      .map(
        (n, i) =>
          `<section class="panel card"><div class="route-num">LÍNIA 0${i + 1} ━━━━━━━━━</div><h3>${n}</h3><p>${i === 0 ? "Cinc vagons. Una estació per començar." : i === 1 ? "Set vagons i una mica més de recorregut." : i === 5 ? "Deu reptes de 16 o 17 moviments mínims." : "Deu reptes per trobar la teva estratègia."}</p><div class="levels">${campaign
            .slice(i * 10, i * 10 + 10)
            .map(
              (p, j) =>
                `<button class="level" data-level="${i * 10 + j}" aria-label="Nivell ${i * 10 + j + 1}, mínim ${p.min} moviments">${String(i * 10 + j + 1).padStart(2, "0")}<small>${progress[i * 10 + j] ? "★".repeat(progress[i * 10 + j]) : "· · ·"}</small></button>`,
            )
            .join("")}</div></section>`,
      )
      .join("")}</div>`;
}
function renderRanking() {
  const d = new Date(),
    localDay = dateKey(),
    [yr, mo, dy] = localDay.split("-").map(Number),
    days = Math.round((Date.UTC(yr, mo, 1) - Date.UTC(yr, mo - 1, dy)) / 864e5),
    month = new Intl.DateTimeFormat("ca", {
      month: "long",
      year: "numeric",
      timeZone: "Europe/Madrid",
    }).format(d);
  $("#main").innerHTML =
    `<div class="page-head"><div><div class="eyebrow">El tauler de l’estació</div><h1>Cada mes, una nova sortida.</h1><p>Reptes compartits. Petites victòries. Sempre hi ets a temps.</p></div></div><section class="season-hero"><div><div class="eyebrow">Temporada en curs</div><h2>${esc(month.charAt(0).toUpperCase() + month.slice(1))}</h2><p>Un millor resultat per dia. Tothom comença de nou cada mes.</p></div><div class="season-clock"><strong>${days} dies</strong><small>per al canvi de temporada</small></div></section><div class="tabs" role="group" aria-label="Classificació"><button data-rank="season" class="${rankTab === "season" ? "active" : ""}">Temporada</button><button data-rank="daily" class="${rankTab === "daily" ? "active" : ""}">Avui</button><button data-rank="local" class="${rankTab === "local" ? "active" : ""}">El meu quadern</button>${room ? `<button data-rank="class" class="${rankTab === "class" ? "active" : ""}">La meva classe</button>` : ""}</div><div id="rank-content"><div class="panel empty">Carregant el tauler…</div></div><div class="legend"><span><b>100 punts</b> amb el mínim</span><span><b>−5 punts</b> per moviment extra</span><span><b>30 dies</b> de conservació</span></div><p class="muted" style="font-size:12px">Només reptes sense pistes ni reproducció de la solució. Els empats comparteixen posició; la velocitat no desempata. Classificació lúdica, no una qualificació escolar. <button class="ghost" data-action="daily">Juga el repte d’avui ${icon("arrow")}</button></p>`;
}
async function loadRanking() {
  const tab = rankTab;
  if (tab === "local") {
    const data = records.slice().reverse();
    $("#rank-content").innerHTML = data.length
      ? `<div class="panel">${data
          .slice(0, 40)
          .map(
            (r) =>
              `<div class="ranking-row"><span class="pos">${rating(r.moves, r.min, r.hints)}★</span><span>${esc(r.id)}${r.hints ? " · amb ajuda" : ""}</span><span class="score">${r.moves} mov.</span><small>${new Date(r.at).toLocaleDateString("ca")}</small></div>`,
          )
          .join("")}</div>`
      : empty(
          "El teu quadern comença aquí.",
          "Resol un puzle i hi trobaràs el resultat durant 30 dies.",
        );
    return;
  }
  try {
    const data = await api("board", {
      scope: tab,
      room: tab === "class" ? room?.code : undefined,
      token,
    });
    if (view !== "ranking" || rankTab !== tab) return;
    rankData = data;
    const rows = data.rows;
    if (!rows.length) {
      $("#rank-content").innerHTML = empty(
        "El primer tren encara no ha arribat.",
        "Resol el repte diari i publica el teu resultat. El primer lloc pot ser teu.",
      );
      return;
    }
    const top = rows.slice(0, 3),
      order = top.length === 3 ? [1, 0, 2] : top.map((_, i) => i);
    $("#rank-content").innerHTML =
      `<div class="podium" ${top.length < 3 ? `style="grid-template-columns:repeat(${top.length},1fr)"` : ""}>${order.map((i) => `<div class="panel podium-card ${i === 0 ? "first" : i === 2 ? "third" : ""}"><div class="medal">${top[i].rank}</div><strong>${esc(top[i].name)}${top[i].me ? " · tu" : ""}</strong><div class="points">${top[i].points}</div><small>punts · ${top[i].games} ${top[i].games === 1 ? "repte" : "reptes"}</small></div>`).join("")}</div><div class="panel">${rows.map((r) => `<div class="ranking-row ${r.me ? "me" : ""}"><span class="pos">${String(r.rank).padStart(2, "0")}</span><span>${esc(r.name)}${r.me ? ' <span class="badge">Tu</span>' : ""}</span><span class="score">${r.points} <small>punts</small></span><small>${r.games} ${r.games === 1 ? "repte" : "reptes"}</small></div>`).join("")}</div>`;
  } catch (e) {
    if (view === "ranking" && rankTab === tab)
      $("#rank-content").innerHTML = empty(
        "El tauler no està disponible ara.",
        "Pots continuar jugant. " + e.message,
      );
  }
}
function empty(h, p) {
  return `<div class="panel empty">${icon("trophy")}<h3>${h}</h3><p>${p}</p></div>`;
}
function renderLab(id = "classic") {
  const c = CONFIGS.find((c) => c.id === id),
    st = stats.find((s) => s.id === id);
  $("#main").innerHTML =
    `<div class="page-head"><div><div class="eyebrow">Laboratori de vies</div><h1>I si faltés una mica d’espai?</h1><p>Compara set estacions verificades. Formula una hipòtesi i posa-la a prova.</p></div></div><div class="info-grid"><section class="panel prose"><label for="lab-config">Disseny de l’estació</label><select id="lab-config" style="display:block;width:100%;margin:12px 0">${CONFIGS.map((x) => `<option value="${x.id}" ${id === x.id ? "selected" : ""}>${x.name} · ${x.caps.join("–")} · maniobra ${x.h}</option>`).join("")}</select><div class="lab-stats"><div class="lab-stat"><strong>${(st.solvable * 100).toFixed(1)} %</strong><small>Partides resolubles</small></div><div class="lab-stat"><strong>${st.max}</strong><small>Mínim més alt</small></div><div class="lab-stat"><strong>${st.mean.toFixed(1)}</strong><small>Mitjana de les resolubles</small></div></div><p>${c.n} vagons en total · tren de ${c.t} vagons · ${st.initial.toLocaleString("ca")} situacions inicials resolubles de ${st.total.toLocaleString("ca")}.</p><div class="hintbox">${st.solvable === 1 ? "Tots els repartiments inicials d’aquest model tenen solució." : "Una part dels repartiments no es pot resoldre. Un vagó pot quedar atrapat al fons d’una via."}</div><div class="dialog-actions"><button class="primary" data-lab-play="${id}">Prova un repte resoluble</button><button data-lab-random="${id}">Investiga un repartiment a l’atzar</button></div></section><section class="panel prose"><h3>Una investigació, tres passos</h3><ol><li>Prediu què passarà si escurces la via de maniobra.</li><li>Compara la clàssica amb «Maniobra curta» mantenint els mateixos vuit vagons.</li><li>Explica quin vagó no pots alliberar i per què falta espai.</li></ol><h3>Què vol dir «mínim»?</h3><p>Una entrada a una via i el retorn a la via de maniobra compten com una maniobra. La dificultat humana també depèn de com sigui de fàcil veure l’estratègia.</p><p>Els valors provenen d’una exploració exhaustiva dels estats. L’editor està acotat a aquestes set configuracions per garantir respostes exactes i ràpides.</p></section></div>`;
}
function renderClass() {
  $("#main").innerHTML =
    `<div class="page-head"><div><div class="eyebrow">Una estació per a tota la classe</div><h1>Penseu junts. Moveu amb criteri.</h1><p>Un codi, el mateix puzle i un tauler privat del grup.</p></div></div><div class="cards"><section class="panel card"><div class="route-num">01 / ALUMNAT</div><h3>Entra a la teva estació</h3><p>Demana el codi al docent. No cal escriure cap nom ni correu.</p><div class="form-line"><input id="room-code" aria-label="Codi de classe" maxlength="10" placeholder="CODI D’ESTACIÓ" value="${esc(room?.code || "")}"></div><button class="primary" data-action="join">Entrar al repte</button></section><section class="panel card"><div class="route-num">02 / DOCENT</div><h3>Obre una estació</h3><p>Comparteix el repte actual o el repte diari. La sala i els resultats s’esborren als 30 dies.</p><select id="class-puzzle" aria-label="Repte de la sala"><option value="daily">Repte diari</option>${catalog.some((p) => p.id === game.id) ? '<option value="current">Repte actual</option>' : ""}</select><button class="primary" data-action="create-room" style="margin-top:10px">Crea una sala</button>${teacher ? `<p style="margin-top:15px">Sala: <b>${esc(teacher.code)}</b></p><div class="form-line"><button data-action="export-room">${icon("download")} CSV</button><button data-action="delete-room">Tanca i esborra</button></div>` : ""}</section><section class="panel card"><div class="route-num">03 / MATERIALS</div><h3>De la pantalla a la taula</h3><p>Imprimeix el puzle actual amb QR, projecta’l o exporta les teves partides.</p><div class="form-line"><button data-action="print">${icon("print")} Fitxa amb QR</button><button data-action="export">${icon("download")} CSV local</button></div><button data-action="guide">Guia docent</button></section></div><div class="panel prose" style="margin-top:18px"><h3>Una proposta per treballar en grup</h3><p>Repartiu quatre rols i canvieu-los després de cada puzle: planificar, executar, registrar i comprovar. Abans de moure, expliqueu què voleu aconseguir. En acabar, compareu dues solucions i justifiqueu les diferències.</p><p>El codi dona accés al tauler de la sala: compartiu-lo només amb el grup. El docent ha de validar l’ús del servei amb el centre. Els pseudònims vinculables a alumnes continuen sent dades personals.</p></div>`;
}
function renderInfo() {
  $("#main").innerHTML =
    `<div class="page-head"><div><div class="eyebrow">Darrere de les agulles</div><h1>Un petit espai. Un gran puzle.</h1><p>Lògica ferroviària per jugar, investigar i aprendre.</p></div></div><div class="info-grid"><article class="panel prose"><h3>Per què «Maniobres»?</h3><p>Una maniobra ferroviària és un moviment que permet ordenar, enganxar o separar vehicles. Aquí cada decisió transforma l’espai disponible. El nom parla del que fas i del que aprens: preparar el següent pas.</p><h3>L’original: Inglenook Sidings</h3><p>Alan Wright va presentar aquest puzle de modelisme ferroviari el 1979. La versió clàssica té vuit vagons, tres vies de capacitats 5–3–3 i una via de maniobra per a la locomotora i tres vagons. L’objectiu és formar un tren de cinc vagons en un ordre concret.</p><p>Maniobres n’és una adaptació digital en català amb regles explícites, solucions òptimes i eines per a l’aula. No és una reproducció oficial ni està afiliada als autors de les referències.</p><h3>Les nostres regles</h3><ol><li>Forma exactament el tren objectiu a la via A, llegit des de les agulles fins al fons.</li><li>Només pots retirar els vagons accessibles des de les agulles. Els vagons no canvien d’ordre quan s’enganxen.</li><li>Tria una via i amb quants vagons en vols sortir. Entrar i tornar compta com una maniobra.</li><li>La locomotora s’acosta fins on cal per enganxar o deixar vagons. No ha d’introduir tot el tren dins la via.</li><li>En acabar cada maniobra, respecta les capacitats i deixa lliures les agulles. Els vagons sobrants poden quedar en qualsevol via, també enganxats a la locomotora.</li></ol><p>La notació <b>B2</b> vol dir: maniobra a la via B i torna amb dos vagons en total. Desfer no penalitza: reconstrueix la solució activa.</p><h3>Fonts i crèdits</h3><p><a href="https://arxiv.org/abs/1810.07970" target="_blank" rel="noopener noreferrer">Simon R. Blackburn · Inglenook Shunting Puzzles</a><br><a href="https://www.wymann.info/ShuntingPuzzles/" target="_blank" rel="noopener noreferrer">Adrian Wymann · Model Railways Shunting Puzzles</a></p><p>Codi sota llicència AGPLv3; dissenys SVG, textos i materials sota CC BY-NC-SA 4.0. Codi disponible a <a href="https://github.com/felipsarroca/jocs/tree/main/Maniobres" target="_blank" rel="noopener noreferrer">GitHub</a>. Versió 1.1.0.</p></article><aside><section class="panel prose"><h3>Què hi trobaràs</h3><p>Partida lliure amb quatre dificultats, 60 nivells, repte diari, contrarellotge, set estacions de laboratori, pistes exactes, reproducció de solucions, fitxes amb QR, mode projector i sales de classe.</p><h3>Un rànquing que es renova</h3><p>La temporada comença el primer dia de cada mes, segons l’hora de Barcelona. El millor resultat de cada dia aporta de 10 a 100 punts. Els empats comparteixen lloc. Els resultats s’oculten en caducar als 30 dies i una neteja diària els elimina del servidor.</p><h3>Privacitat i joc honest</h3><p>No demanem nom, correu ni edat. En publicar, es desa un identificador pseudònim, la solució i la puntuació. El servidor verifica els moviments; això no pot demostrar que ningú hagi fet servir ajuda externa. No hi ha publicitat ni analítica de seguiment.</p><p>Les partides lliures es queden al dispositiu. El servei de rànquing utilitza Supabase a la UE. Els registres tècnics del proveïdor poden incloure dades de connexió. El docent ha de consultar el centre abans de vincular pseudònims a alumnat.</p><button data-action="erase">Esborra les meves dades</button><h3>Accessible i sense connexió</h3><p>Vagons amb números i colors, controls de teclat, moviment reduït i so opcional. Després de la primera càrrega completa es pot jugar sense internet; el rànquing i les sales necessiten connexió.</p></section></aside></div>`;
}
function renderProgress() {
  const t = title(prog.xp),
    today = dateKey(),
    run = streak(prog.days, today),
    got = ACHIEVEMENTS.filter((a) => prog.ach[a[0]]).length,
    pct = t.to ? Math.round(((prog.xp - t.from) / (t.to - t.from)) * 100) : 100,
    when = (ms) => new Date(ms).toLocaleDateString("ca", { day: "numeric", month: "short" });
  $("#main").innerHTML =
    `<div class="page-head"><div><div class="eyebrow">El teu quadern de servei</div><h1>Cada tren t’ensenya alguna cosa.</h1><p>El progrés es desa només en aquest dispositiu.</p></div><span class="badge">${got}/${ACHIEVEMENTS.length} èxits</span></div><section class="season-hero progress-hero"><div><div class="eyebrow">Títol · nivell ${t.level}</div><h2>${esc(t.name)}</h2><div class="xp-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><i style="width:${pct}%"></i></div><p>${prog.xp} punts d’experiència${t.to ? ` · ${t.to - prog.xp} per a «${esc(t.next)}»` : " · títol màxim"}</p></div><div class="progress-figures"><div><strong>${run}</strong><small>${run === 1 ? "dia de ratxa" : "dies de ratxa"}</small></div><div><strong>${prog.solved}</strong><small>trens resolts</small></div><div><strong>${prog.perfect}</strong><small>amb el mínim</small></div></div></section><div class="streak-line">${icon("calendar")}${prog.days.includes(today) ? "Repte d’avui fet. Torna demà per allargar la ratxa." : `<span>Repte d’avui pendent.</span> <button class="ghost" data-action="daily">Juga’l ara ${icon("arrow")}</button>`}<small>Un dia de marge per setmana: un descuit no trenca la ratxa.</small></div><div class="achievements">${ACHIEVEMENTS.map(([code, name, how]) => `<div class="achievement ${prog.ach[code] ? "on" : ""}"><span class="ach-icon">${icon(prog.ach[code] ? "medal" : "lock")}</span><div><b>${name}${prog.ach[code] ? ` <time>${when(prog.ach[code])}</time>` : ""}</b><small>${how}</small></div></div>`).join("")}</div>`;
}
function renderSprint() {
  $("#main").innerHTML =
    `<div class="page-head"><div><div class="eyebrow">Cinc minuts a l’estació</div><h1>Un tren darrere l’altre.</h1><p>Una modalitat opcional per quan et vingui de gust córrer.</p></div></div><section class="panel prose"><h2>Contrarellotge · 5:00</h2><p>Resol tants puzles fàcils com puguis en cinc minuts. Pots desfer, però les pistes no estan disponibles. Aquest mode no participa en el rànquing.</p><button class="primary" data-action="start-sprint">Comença la ronda ${icon("arrow")}</button></section>`;
}
function tutorial(step = 0) {
  tutorialStep = step;
  const pages = [
    [
      "Benvingut al pati de vies.",
      "La teva missió és formar el tren de dalt a la via A. Els números es llegeixen de les agulles cap al fons.",
    ],
    [
      "L’espai és el repte.",
      "La via A admet cinc vagons; B i C, tres cadascuna. La locomotora pot portar-ne tres. En les estacions petites, les capacitats són diferents i sempre estan indicades.",
    ],
    [
      "Una via. Un tall.",
      "Primer tria A, B o C. Després tria el nombre total de vagons amb què vols tornar. «Locomotora sola» deixa tots els vagons a la via, si hi caben.",
    ],
    [
      "No pots saltar vagons.",
      "Només pots agafar els primers vagons, els que són a prop de les agulles. Per arribar a un vagó del fons, abans has de retirar els que el bloquegen.",
    ],
    [
      "Cada intent t’ensenya alguna cosa.",
      "Desfer és gratuït. Les pistes mostren una maniobra òptima des d’on ets. Comença amb un puzle petit i prova d’arribar al mínim.",
    ],
  ];
  modal(
    `<div class="tutorial-progress">${pages.map((_, i) => `<i class="${i <= step ? "on" : ""}"></i>`).join("")}</div><div class="eyebrow">Com s’hi juga · ${step + 1}/5</div><h2>${pages[step][0]}</h2><p>${pages[step][1]}</p><div class="dialog-actions">${step ? '<button data-action="tutorial-back">Anterior</button>' : ""}<button class="primary" data-action="tutorial-next">${step === 4 ? "Prova la primera maniobra" : "Continua"}</button><button class="ghost" data-action="close">Torna al joc</button></div>`,
  );
}
function settings() {
  modal(
    `<div class="eyebrow">Al teu gust</div><h2>Preferències de l’estació</h2>${[
      ["sound", "Efectes de so discrets"],
      ["reduced", "Reduir les animacions"],
      ["minimum", "Mostrar el mínim de moviments"],
    ]
      .map(
        ([k, n]) =>
          `<label class="label-check"><input type="checkbox" data-pref="${k}" ${prefs[k] ? "checked" : ""}>${n}</label>`,
      )
      .join(
        "",
      )}<p>Els canvis es guarden en aquest dispositiu. No hi ha notificacions ni anuncis.</p><button class="primary" data-action="close">Fet</button>`,
  );
}
function printSheet() {
  if (!game) return;
  document.querySelector(".print-sheet")?.remove();
  const c = config(),
    url = new URL(location.href);
  url.search = "";
  url.searchParams.set("p", game.id);
  let qr = "";
  if (
    window.qrcode &&
    (catalog.some((p) => p.id === game.id) || puzzleFromKey(game.id))
  ) {
    const q = window.qrcode(0, "M");
    q.addData(url.href);
    q.make();
    qr = q.createSvgTag(3, 2);
  }
  const el = document.createElement("section");
  el.className = "print-sheet";
  el.innerHTML = `<div class="qr">${qr}</div><h1>Maniobres</h1><p>${esc(c.name)} · ${esc(game.id)} · ${c.n} vagons</p><p><b>Objectiu:</b> deixa ${Array.from({ length: c.t }, (_, i) => game.labels?.[i] ?? i + 1).join(" → ")} a la via A, des de les agulles cap al fons.</p>${board(game.initial, c, false)}<p><b>Registre:</b> B2 vol dir entrar a B i tornar amb dos vagons en total. Una entrada i el retorn compten com una maniobra.</p><div class="writing"></div><p><b>Estratègia:</b> què heu preparat abans de moure el darrer vagó?</p><div class="writing"></div><p>Felip Sarroca · Continguts: CC BY-NC-SA 4.0 · ${qr ? "Escaneja el QR per obrir el mateix puzle." : "Repartiment experimental: conserva aquesta fitxa."}</p>`;
  document.body.append(el);
  window.print();
}
function download(name, rows) {
  const csv =
      "\ufeff" +
      rows
        .map((r) =>
          r
            .map((x) => '"' + String(x ?? "").replaceAll('"', '""') + '"')
            .join(";"),
        )
        .join("\r\n"),
    u = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    ),
    a = document.createElement("a");
  a.href = u;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(u), 2000);
}
async function optimal() {
  dialog.close();
  const p = { ...game, state: clone(game.initial) };
  start(p, game.mode, { level: game.level, room: game.room, replay: true });
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
async function publish() {
  if (game.hints)
    return notify(
      "Aquesta partida té ajuda. Reinicia i resol-la sense pistes per publicar-la.",
    );
  if (game.date !== dateKey())
    return notify(
      "Aquest repte ja no és el d’avui. Els resultats es publiquen el mateix dia.",
    );
  notify("Comprovant la solució…");
  try {
    const x = await api("submit", {
      token,
      day: game.date,
      puzzle: game.id,
      room: game.mode === "class" ? game.room : null,
      log: game.log,
      seconds: game.seconds,
    });
    notify(
      `Publicat com ${x.name}. ${x.points} punts. El resultat caduca als 30 dies.`,
    );
  } catch (e) {
    notify(e.message);
  }
}
async function handle(action) {
  if (action === "close") {
    dialog.close();
    return;
  }
  if (action === "tutorial") {
    tutorial();
    return;
  }
  if (action === "tutorial-back") {
    tutorial(tutorialStep - 1);
    return;
  }
  if (action === "tutorial-next") {
    if (tutorialStep === 4) {
      dialog.close();
      start(
        catalog.find((p) => p.config === "mini" && p.min === 2),
        "tutorial",
      );
    } else tutorial(tutorialStep + 1);
    return;
  }
  if (action === "settings") {
    settings();
    return;
  }
  if (action === "cancel") {
    selected = 0;
    renderGame();
    return;
  }
  if (action === "new") {
    if (game && !game.finished && game.log.length) {
      modal(
        '<h2>Comença una altra partida?</h2><p>El repte actual es reemplaçarà. Els resultats acabats es conserven.</p><div class="dialog-actions"><button class="primary" data-action="new-confirm">Nova partida</button><button data-action="close">Continua jugant</button></div>',
      );
    } else handle("new-confirm");
    return;
  }
  if (action === "new-confirm") {
    dialog.close();
    sprintEnd = 0;
    const [lo, hi] = {
      facil: [2, 8],
      mitja: [9, 12],
      dificil: [13, 15],
      expert: [16, 17],
    }[difficulty];
    toast("Preparant una nova maniobra…");
    worker.postMessage({
      type: "generate",
      config: "classic",
      lo,
      hi,
      exclude: Object.keys(prog.best),
    });
    return;
  }
  if (action === "daily") {
    dialog.close();
    sprintEnd = 0;
    start(daily(catalog), "daily");
    return;
  }
  if (action === "undo") {
    if (!game.log.length || autoplay) return;
    game.state = game.undo.pop();
    game.log.pop();
    game.undos = (game.undos || 0) + 1;
    game.finished = false;
    selected = 0;
    persist();
    renderGame();
    solve();
    return;
  }
  if (action === "restart") {
    autoplay = false;
    if (game.log.length && !game.finished && !game.hints) {
      prog.restarts[game.id] = (prog.restarts[game.id] || 0) + 1;
      save("prog", prog);
    }
    start({ ...game, state: clone(game.initial) }, game.mode, {
      level: game.level,
      room: game.room,
      replay: true,
    });
    return;
  }
  if (action === "hint") {
    if (game.mode === "sprint")
      return toast("Les pistes no estan disponibles en contrarellotge.");
    if (!nextMove) return toast("No hi ha cap pista disponible.");
    game.hints++;
    selected = nextMove[0];
    preview = `Prova ${"ABC"[nextMove[0] - 1]}${nextMove[1]}: torna amb ${nextMove[1]} vagons. Aquesta maniobra redueix el mínim restant.`;
    persist();
    renderGame();
    return;
  }
  if (action === "history") {
    modal(
      '<h2>Quadern de maniobres</h2><p>B2 vol dir entrar a B i sortir amb dos vagons en total.</p><div class="history" style="max-height:50vh">' +
        (game.log.length
          ? game.log
              .map(([v, k], i) => `<span>${i + 1}. ${"ABC"[v - 1]}${k}</span>`)
              .join(" ")
          : "Encara no has fet cap maniobra.") +
        "</div>",
    );
    return;
  }
  if (action === "result") {
    showResult();
    return;
  }
  if (action === "submit") {
    await publish();
    return;
  }
  if (action === "optimal") {
    await optimal();
    return;
  }
  if (action === "share") {
    const label =
        game.mode === "daily"
          ? "Repte diari " + game.date.split("-").reverse().join("/")
          : game.mode === "campaign"
            ? "Nivell " + (game.level + 1)
            : "Partida lliure",
      text = `Maniobres · ${label} · ${game.log.length} moviments (mínim ${game.min ?? "?"}) · ${"★".repeat(rating(game.log.length, game.min, game.hints))}\n${location.origin + location.pathname}`;
    try {
      await navigator.clipboard.writeText(text);
      toast("Resultat copiat.");
    } catch {
      modal(`<h2>Comparteix el resultat</h2><p>${esc(text)}</p>`);
    }
    return;
  }
  if (action === "next") {
    dialog.close();
    if (game.mode === "campaign" && game.level < 59)
      start(campaign[game.level + 1], "campaign", { level: game.level + 1 });
    else if (game.mode === "sprint" && sprintEnd > Date.now())
      start(pick("facil"), "sprint");
    else handle("new-confirm");
    return;
  }
  if (action === "projector") {
    prefs.projector = !prefs.projector;
    save("prefs", prefs);
    view = "play";
    render();
    return;
  }
  if (action === "print") {
    printSheet();
    return;
  }
  if (action === "export") {
    download("maniobres-resultats.csv", [
      ["Puzle", "Modalitat", "Moviments", "Mínim", "Pistes", "Segons", "Data"],
      ...records.map((r) => [
        r.id,
        r.mode,
        r.moves,
        r.min,
        r.hints,
        r.seconds,
        new Date(r.at).toISOString(),
      ]),
    ]);
    return;
  }
  if (action === "start-sprint") {
    sprintEnd = Date.now() + 300000;
    sprintSolved = 0;
    start(pick("facil"), "sprint");
    return;
  }
  if (action === "create-room") {
    try {
      const chosen = $("#class-puzzle").value === "current" ? game : daily(catalog);
      const x = await api("create-room", { token, puzzle: chosen.id });
      teacher = { code: x.code };
      room = { code: x.code };
      save("teacher", teacher);
      save("room", room);
      renderClass();
      toast("Sala creada: " + x.code);
    } catch (e) {
      toast(e.message);
    }
    return;
  }
  if (action === "join") {
    try {
      const code = $("#room-code").value.trim().toUpperCase();
      const x = await api("room", { room: code });
      room = { code };
      save("room", room);
      start(
        catalog.find((p) => p.id === x.puzzle),
        "class",
        { room: code },
      );
    } catch (e) {
      toast(e.message);
    }
    return;
  }
  if (action === "export-room") {
    try {
      const x = await api("export", { room: teacher.code, token });
      download("maniobres-classe.csv", [
        ["Pseudònim", "Puzle", "Moviments", "Punts", "Data"],
        ...x.rows.map((r) => [r.name, r.puzzle, r.moves, r.points, r.day]),
      ]);
    } catch (e) {
      toast(e.message);
    }
    return;
  }
  if (action === "delete-room") {
    modal(
      '<h2>Esborra la sala i els resultats?</h2><p>Aquesta acció elimina la sala que has creat i els seus resultats compartits.</p><div class="dialog-actions"><button data-action="delete-room-confirm">Esborra la sala</button><button class="primary" data-action="close">Conserva-la</button></div>',
    );
    return;
  }
  if (action === "delete-room-confirm") {
    try {
      await api("delete-room", { room: teacher.code, token });
      teacher = null;
      room = null;
      save("teacher", null);
      save("room", null);
      dialog.close();
      renderClass();
      toast("Sala esborrada.");
    } catch (e) {
      toast(e.message);
    }
    return;
  }
  if (action === "erase") {
    modal(
      '<h2>Esborra les teves dades?</h2><p>S’eliminaran els teus resultats publicats, les sales que has creat i el progrés local d’aquest navegador. No es pot desfer.</p><div class="dialog-actions"><button data-action="erase-confirm">Esborra-ho</button><button class="primary" data-action="close">Conserva-ho</button></div>',
    );
    return;
  }
  if (action === "erase-confirm") {
    try {
      await api("erase", { token });
      for (const k of [
        "records",
        "progress",
        "room",
        "teacher",
        "game",
        "token",
        "prog",
      ])
        localStorage.removeItem("maniobres-" + k);
      location.reload();
    } catch (e) {
      toast(
        "No s’han esborrat les dades: " +
          e.message +
          " Torna-ho a provar amb connexió.",
      );
    }
    return;
  }
  if (action === "guide") {
    modal(
      '<div class="eyebrow">Guia docent</div><h2>De jugar a investigar</h2><p><b>1.</b> Familiarització: tutorial i puzle petit.</p><p><b>2.</b> Registre: anoteu les maniobres i compareu dues solucions.</p><p><b>3.</b> Estratègia: formuleu un mètode i proveu-lo en un repte nou.</p><p><b>4.</b> Laboratori: predieu l’efecte d’escurçar una via i contrasteu-ho.</p><p><b>5.</b> Disseny: compareu espai, resolubilitat i moviments.</p><p><b>6.</b> Transferència: resoleu un repte desconegut i defenseu les decisions.</p><p>Avalueu l’anticipació, la justificació, la revisió i la col·laboració. La classificació no és una nota. Materials preparats i revisats; pendents de validació amb alumnat.</p><a href="docs/guia-docent.md" target="_blank">Obre la guia completa</a>',
    );
  }
}
document.addEventListener("click", async (e) => {
  const b = e.target.closest("button,[data-cut],[data-via]");
  if (!b || b.disabled) return;
  try {
    if (b.dataset.nav) {
      autoplay = false;
      const v = b.dataset.nav;
      if (v === "daily") {
        handle("daily");
        return;
      }
      view = v;
      render();
    } else if (b.dataset.action) await handle(b.dataset.action);
    else if (b.dataset.via) select(+b.dataset.via);
    else if (b.dataset.cut !== undefined) doMove(selected, +b.dataset.cut);
    else if (b.dataset.level !== undefined)
      start(campaign[+b.dataset.level], "campaign", {
        level: +b.dataset.level,
      });
    else if (b.dataset.rank) {
      rankTab = b.dataset.rank;
      renderRanking();
      loadRanking();
    } else if (b.dataset.labPlay) start(pick("all", b.dataset.labPlay), "lab");
    else if (b.dataset.labRandom) {
      const c = CONFIGS.find((c) => c.id === b.dataset.labRandom),
        a = Array.from({ length: c.n }, (_, i) => i + 1).sort(
          () => Math.random() - 0.5,
        ),
        s = [[], [], [], []];
      for (const w of a) {
        const options = [1, 2, 3].filter((i) => s[i].length < c.caps[i - 1]);
        s[options[Math.floor(Math.random() * options.length)]].push(w);
      }
      start(
        { id: "experiment-" + Date.now(), config: c.id, state: s, min: null },
        "lab",
      );
      const id = requestId;
      const wait = setInterval(() => {
        if (requestId !== id) {
          clearInterval(wait);
          return;
        }
        if (!solving) {
          clearInterval(wait);
          if (remaining === null && !prog.ach.investigador) {
            prog.ach.investigador = Date.now();
            celebrate(["investigador"]);
          }
          game.min = remaining;
          persist();
          renderGame();
        }
      }, 50);
    }
  } catch (e) {
    toast("No s’ha pogut completar l’acció: " + e.message);
  }
});
document.addEventListener("change", (e) => {
  if (e.target.id === "difficulty") difficulty = e.target.value;
  if (e.target.id === "lab-config") renderLab(e.target.value);
  if (e.target.dataset.pref) {
    prefs[e.target.dataset.pref] = e.target.checked;
    save("prefs", prefs);
    document.body.classList.toggle("reduced", prefs.reduced);
    if (view === "play") renderGame();
  }
});
document.addEventListener("keydown", (e) => {
  if (e.target.closest("input,select,textarea") || dialog.open) return;
  if (view !== "play" || autoplay) return;
  if (e.key === "Escape" && prefs.projector) {
    handle("projector");
    return;
  }
  if (/^[abc]$/i.test(e.key)) {
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
  if ($("#timer") && game && !game.finished)
    $("#timer").textContent = time(elapsed());
  if (sprintEnd) {
    if ($("#sprint-time"))
      $("#sprint-time").textContent = time(
        Math.max(0, Math.ceil((sprintEnd - Date.now()) / 1000)),
      );
    if (Date.now() >= sprintEnd) {
      sprintEnd = 0;
      autoplay = false;
      modal(
        `<div class="eyebrow">Fi de la ronda</div><h2>${sprintSolved} trens completats.</h2><p>Cinc minuts de concentració. Ara pots continuar al teu ritme.</p><button class="primary" data-action="new-confirm">Torna a la partida lliure</button>`,
      );
    }
  }
}, 1000);
setTimeout(
  () =>
    toast("Fa mitja hora que ets a l’estació. Et ve de gust fer una pausa?"),
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
if (!storageOK)
  toast(
    "El navegador no permet desar el progrés. Pots jugar, però no es conservarà en tancar.",
  );
if ("serviceWorker" in navigator)
  navigator.serviceWorker.register("./sw.js").catch(() => {});

matchMedia("(max-width:650px)").addEventListener("change", () => {
  if (view === "play") renderGame();
});
