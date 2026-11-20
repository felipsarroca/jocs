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
  player = null,
  board_ = null;
const LEVELS = {
  facil: ["Fàcil", 2, 8],
  mitja: ["Mitjà", 9, 12],
  dificil: ["Difícil", 13, 15],
  expert: ["Expert", 16, 17],
};
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
  root.innerHTML = `<div class="shell"><header class="topbar"><button class="brand" data-nav="play" aria-label="Maniobres, anar al joc"><img src="assets/favicon.svg" alt=""><span><strong>Maniobres</strong><small>Cada moviment compta</small></span></button><nav class="tabs-top" aria-label="Seccions"><button data-nav="play" class="${view === "play" ? "active" : ""}">${icon("play")} Jugar</button><button data-nav="ranking" class="${view === "ranking" ? "active" : ""}">${icon("trophy")} Rànquing</button><button data-nav="about" class="${view === "about" ? "active" : ""}">${icon("info")} Sobre el joc</button></nav><div class="top-actions"><button data-action="tutorial">${icon("info")} Com s’hi juga</button><button data-action="settings" aria-label="Preferències">${icon("settings")}</button></div></header><main id="main"></main></div>`;
  if (view === "play") renderGame();
  else if (view === "about") renderAbout();
  else renderRanking();
}
function wagon(w, x, y, extra = "") {
  w = game.labels?.[w - 1] ?? w;
  return `<g class="wagon" data-wagon="${w}" ${extra} transform="translate(${x} ${y})"><path d="M-5 0h62" stroke="#3d4b4c" stroke-width="4"/><rect x="0" y="-20" width="52" height="40" rx="6" fill="${colors[w]}" stroke="#263e43" stroke-width="1.5"/><path d="M5-14h42M5 14h42" stroke="#fff5" stroke-width="2"/><path d="M8-21v-5m35 5v-5M8 21v5m35-5v5" stroke="#344349" stroke-width="5"/><text x="26" y="6" text-anchor="middle" font-family="system-ui" font-size="21" font-weight="800" fill="#21333b">${w}</text></g>`;
}
function board(s = game.state, c = config(), interactive = true) {
  const narrow = innerWidth < 650,
    ys = [100, 220, 340],
    loco = narrow ? 8 : 16,
    headX = narrow ? 72 : 84,
    headStep = narrow ? 56 : 64,
    pt = narrow ? 250 : 300,
    cv = narrow ? 268 : 340,
    tx = narrow ? 300 : 400,
    step = 70,
    width = tx + Math.max(...c.caps) * step + 22,
    lbl = (w) => game.labels?.[w - 1] ?? w,
    lineTxt = (a) => a.map(lbl).join(", ") || "buida";
  let a = `<svg class="board" data-pt="${pt}" viewBox="0 36 ${width} 340" preserveAspectRatio="xMidYMid meet" role="group" aria-label="Estació. Via de maniobra: ${lineTxt(s[0])}. ${s
    .slice(1)
    .map((x, i) => `Via ${"ABC"[i]}: ${lineTxt(x)}`)
    .join(". ")}"><defs><pattern id="sleepers" width="16" height="18" patternUnits="userSpaceOnUse"><path d="M7 0v18" stroke="#baafa0" stroke-width="5"/></pattern></defs>`;
  // Via de maniobra
  a += `<path class="maniobra-halo" d="M10 220H${pt}" stroke="#8bd7bd55" stroke-width="66" stroke-linecap="round"/><path d="M6 211H${pt}v18H6z" fill="url(#sleepers)"/><path d="M4 212H${pt}M4 228H${pt}" stroke="#697976" stroke-width="3"/><text x="${headX}" y="276" fill="#53625c" font-family="system-ui" font-size="13" font-weight="700">${narrow ? "Maniobra" : "Via de maniobra"} <tspan font-weight="400">· màx. ${c.h}${narrow ? "" : " vagons"}</tspan></text>`;
  for (let i = 1; i <= 3; i++) {
    const y = ys[i - 1],
      cap = c.caps[i - 1],
      end = tx + cap * step - 12,
      dest = i === 1;
    a += `<g class="siding ${selected === i ? "selected" : ""} ${dest ? "dest" : ""}" ${interactive ? `data-via="${i}" tabindex="0" role="button" aria-label="Via ${"ABC"[i - 1]}, ${s[i].length} de ${cap} vagons"` : ""}><path class="track-halo" d="M${pt} 220 Q${cv} ${y} ${tx} ${y}H${end}" fill="none" stroke="#f2b35d66" stroke-width="62" stroke-linecap="round"/><path d="M${pt} 220 Q${cv} ${y} ${tx} ${y}H${end}" fill="none" stroke="#b9ae9a" stroke-width="19" stroke-dasharray="5 11"/><path d="M${pt} 213 Q${cv} ${y - 7} ${tx} ${y - 7}H${end}M${pt} 227 Q${cv} ${y + 7} ${tx} ${y + 7}H${end}" fill="none" stroke="${dest ? "#3f7a63" : "#697976"}" stroke-width="3"/><path d="M${end + 4} ${y - 17}v34M${end - 1} ${y - 17}h10M${end - 1} ${y + 17}h10" stroke="#485a57" stroke-width="5"/><rect x="${tx - 40}" y="${y - 52}" width="28" height="24" rx="5" fill="${dest ? "#2f6a55" : "#546766"}"/><text x="${tx - 26}" y="${y - 35}" fill="white" text-anchor="middle" font-size="15" font-weight="800" font-family="system-ui">${"ABC"[i - 1]}</text>`;
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
      a += `<rect x="${tx + k * step}" y="${y - 21}" width="52" height="42" rx="5" fill="none" stroke="#c6beb0" stroke-dasharray="3 5"/>`;
    s[i].forEach(
      (w, j) =>
        (a += cutTarget(
          wagon(w, tx + j * step, y, interactive ? `data-src="${i}" data-idx="${j}"` : ""),
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
    `<g transform="translate(${loco} 220)"><rect x="0" y="-23" width="56" height="46" rx="7" fill="#e5533d" stroke="#a63322" stroke-width="2"/><rect x="5" y="-17" width="18" height="34" rx="3" fill="#2b3a4a"/><path d="M31-14h17m-17 7h17m-17 7h17m-17 7h17m-17 7h17" stroke="#ffd2c4" stroke-width="2"/><path d="M10-25h34M10 25h34" stroke="#1d3439" stroke-width="5"/><circle cx="53" cy="-13" r="3" fill="#f6cd82"/><circle cx="53" cy="13" r="3" fill="#f6cd82"/><text x="28" y="44" text-anchor="middle" font-family="system-ui" font-size="11" fill="#53625c">Locomotora</text></g>`,
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
        wagon(w, headX + j * headStep, 220, interactive ? `data-src="0" data-idx="${j}"` : ""),
        selected,
        j + 1,
        s,
        c,
        interactive,
      )),
  );
  a += `<circle cx="${pt}" cy="220" r="5" fill="#355c52"/><text x="${pt - 8}" y="250" text-anchor="end" font-family="system-ui" font-size="11" fill="#64736b">Agulles</text></svg>`;
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
    instruction = isWon
      ? `<b class="ok">✓</b> Tren format amb ${game.log.length} moviments: <span class="solution">${notation}</span>`
      : blocked
        ? "Aquest repartiment no té solució: cap seqüència de maniobres pot formar el tren."
        : selected
          ? `<b>2</b> Via ${"ABC"[selected - 1]}: toca el darrer vagó que vols endur-te, o la locomotora per tornar sola.`
          : `<b>1</b> Arrossega vagons: d’una via a la locomotora per endur-te’ls, o del tren de la locomotora a una via per deixar-los.`;
  $("#main").innerHTML =
    `<div class="stage"><div class="stage-head"><div class="goal"><div class="eyebrow">${game.mode === "tutorial" ? "Partida de pràctica · no puntua" : game.min ? levelOf(game.min) + " · " + score(game.min, game.min) + " punts amb el mínim" : "Preparant…"}</div><div class="goal-line"><span>Forma aquest tren a la <b>via A</b></span><span class="target-train" aria-label="Tren objectiu: ${Array.from({ length: c.t }, (_, i) => game.labels?.[i] ?? i + 1).join(", ")}">${Array.from({ length: c.t }, (_, i) => `<span class="wagon-chip" style="--w:${colors[game.labels?.[i] ?? i + 1]}">${game.labels?.[i] ?? i + 1}</span>`).join("")}</span><small>de les agulles cap al fons</small></div></div><div class="stage-stats"><div><b>${game.log.length}</b><small>moviments</small></div><div><b>${show(game.min)}</b><small>mínim${prefs.minimum && !isWon && remaining != null && game.log.length ? ` · en queden ${solving ? "…" : remaining}` : ""}</small></div><div><b id="timer">${time(game.finished ? game.seconds : elapsed())}</b><small>temps</small></div></div></div><div class="board-wrap ${selected ? "choosing" : ""} ${isWon ? "complete" : ""}">${board()}<p class="board-caption ${blocked ? "warning" : ""}">${instruction}${preview ? `<span class="hint-line">${esc(preview)}</span>` : ""}</p></div><div class="stage-controls">${isWon ? `<div class="choice-row"><button class="primary" data-action="result">Veure el resultat</button><button data-action="new">Una altra partida ${icon("arrow")}</button></div>` : `<div class="choice-row">${selected ? Array.from({ length: c.h + 1 }, (_, k) => `<button data-cut="${k}" ${!moves(game.state, c).some((m) => m[0] === selected && m[1] === k) || autoplay ? "disabled" : ""}>${k === 0 ? "Locomotora sola" : k + " " + (k === 1 ? "vagó" : "vagons")}</button>`).join("") + `<button class="ghost" data-action="cancel">Cancel·la</button>` : ""}</div>`}<div class="tool-row"><button data-action="undo" ${!game.log.length || autoplay ? "disabled" : ""}>${icon("undo")} Desfer</button><button data-action="restart">${icon("reset")} Reiniciar</button><button data-action="hint" ${isWon || autoplay || solving ? "disabled" : ""}>${icon("bulb")} Pista</button><button class="primary" data-action="new-menu">${icon("play")} Nou repte</button></div></div></div>`;
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
  const k = puzzleKey();
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
    prefs.reduced ? 1200 : 2600,
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
    `<div class="welcome"><img class="welcome-logo" src="assets/favicon.svg" alt=""><div class="eyebrow">Et donem la benvinguda a</div><h2>Maniobres</h2><p>Forma trens amb el mínim de moviments i puja al rànquing. Abans de començar, tria el teu nom de jugador.</p><span class="name-form"><input id="name-input" maxlength="16" placeholder="El teu nom de jugador" aria-label="Nom de jugador" autocomplete="off"><button class="primary" data-action="welcome-save">Comença a jugar</button></span><p class="name-error" id="name-error" role="alert"></p><small>Serà públic al rànquing. Fes servir un nom de joc, no el teu nom i cognoms reals. Queda desat en aquest navegador.</small></div>`,
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
  return `+${score(g.min, g.log.length)} punts al rànquing per a <b>${esc(player.name)}</b>.`;
}
function showResult() {
  const n = stars(game.log.length, game.min),
    extra = game.min != null ? game.log.length - game.min : null;
  modal(
    `<div class="eyebrow">Tren format</div><h2>${extra === 0 ? "Una maniobra perfecta." : "El tren ja pot sortir."}</h2><div class="big-stars" aria-label="${n} estrelles">${"★".repeat(n)}${"☆".repeat(3 - n)}</div><p><b>${game.log.length} moviments</b> · mínim ${game.min ?? "?"} · ${time(game.seconds)}</p><p class="your-solution">La teva solució: <b>${esc(game.log.map(([v, k]) => "ABC"[v - 1] + k).join(" · "))}</b></p><p>${extra === 0 ? "Has trobat un dels camins més curts possibles." : extra === 1 ? "A 1 moviment del mínim!" : extra != null ? `T’has quedat a ${extra} moviments del mínim.` : ""}</p><div class="rank-note" id="rank-note">${rankingNote()}</div><div class="dialog-actions"><button class="primary" data-action="next">Següent repte</button><button data-action="optimal">Veure la solució òptima</button></div>`,
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
    const x = await online.submit(puzzleKey(g), g.log);
    g.ranked = x.kept ? "kept" : "done";
    board_ = null;
  } catch {
    g.ranked = "error";
  }
  persist();
  if (game === g) refreshNote();
}
async function loadPlayer() {
  try {
    player = await online.me();
  } catch {
    player = null;
  }
  return player;
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
    return `<div class="me-head">${avatar(player.name)}<div><small>Jugues com a</small><strong>${esc(player.name)}</strong></div></div><div class="me-stats"><div><b>${mine ? mine.rank + "r" : "—"}</b><small>lloc</small></div><div><b>${mine?.points ?? 0}</b><small>punts</small></div><div><b>${mine?.solved ?? 0}</b><small>puzles</small></div></div><div class="me-actions"><button class="ghost" data-action="rename">Canvia el nom</button><button class="ghost" data-action="erase">Esborra’m</button></div>`;
  }
  return `<b>Tria un nom de jugador</b><span class="name-form"><input id="name-input" maxlength="16" placeholder="El teu nom" aria-label="Nom de jugador"><button class="primary" data-action="register">Desa</button></span><small>Serà públic. No hi posis el teu nom i cognoms reals.</small>`;
}
function renderRanking() {
  $("#main").innerHTML = `<div class="page rank-page"><header class="rank-top"><span class="rank-icon">${icon("trophy")}</span><div class="rank-title"><h1>Rànquing</h1><p>Puzles resolts sense pistes · cada puzle compta una vegada · els resultats duren un any</p></div><div class="rank-chips" id="hero-stats"></div></header><div class="rank-layout"><div id="rank-list"><div class="panel empty">Carregant el rànquing…</div></div><aside class="rank-side"><section class="panel me-card">${meCard()}</section><section class="panel how-card"><h3>Com es puntua</h3><ul><li><b>+10</b> per cada moviment del mínim</li><li><b>−5</b> per cada moviment de més</li><li><b>1×</b> cada puzle, amb el millor resultat</li><li><b>1 any</b> dura cada resultat</li></ul></section></aside></div></div>`;
  loadRanking();
}
async function loadRanking() {
  try {
    if (!board_ || Date.now() - board_.at > 30e3) {
      const { uid, list } = await online.players(),
        rows = (await verify(list)).filter((r) => r.points > 0);
      rows.sort((a, b) => b.points - a.points || b.solved - a.solved || a.name.localeCompare(b.name));
      let last = null,
        rank = 0;
      rows.forEach((r, i) => {
        if (r.points !== last) rank = i + 1;
        r.rank = rank;
        last = r.points;
        r.me = r.uid === uid;
      });
      board_ = { rows, at: Date.now() };
    }
    if (view !== "ranking") return;
    const rows = board_.rows,
      mine = rows.find((r) => r.me),
      top = rows[0]?.points || 1,
      total = rows.reduce((t, r) => t + r.solved, 0);
    $("#hero-stats").innerHTML = `<span><b>${rows.length}</b> ${rows.length === 1 ? "jugador" : "jugadors"}</span><span><b>${total}</b> ${total === 1 ? "puzle resolt" : "puzles resolts"}</span>`;
    if (player?.name && !$("#name-input")) $(".me-card").innerHTML = meCard();
    const pod = rows.slice(0, 3),
      order = [1, 0, 2],
      rest = rows.slice(3, 100),
      row = (r) =>
        `<div class="ranking-row ${r.me ? "me" : ""}"><span class="pos">${r.rank}</span>${avatar(r.name)}<span class="who">${esc(r.name)}${r.me ? ' <span class="badge">Tu</span>' : ""}<small>${r.solved} ${r.solved === 1 ? "puzle" : "puzles"}</small></span><span class="bar"><i style="width:${Math.max(4, (100 * r.points) / top)}%"></i></span><span class="score">${r.points}</span></div>`;
    $("#rank-list").innerHTML = rows.length
      ? `<div class="podium-stage"><div class="podium">${order
          .map((i) => [pod[i], i])
          .map(([r, i]) =>
            !r
              ? `<div class="panel podium-card free p${i + 1}"><span class="avatar" style="--a:#d8e3ec">?</span><strong>Lloc lliure</strong><div class="pts">—</div><small>pot ser teu</small><div class="step">${i + 1}</div></div>`
              : `<div class="panel podium-card p${rows.indexOf(r) + 1} ${r.me ? "me" : ""}">${avatar(r.name)}<span class="medal">${r.rank}</span><strong>${esc(r.name)}</strong><div class="pts">${r.points}</div><small>punts · ${r.solved} ${r.solved === 1 ? "puzle" : "puzles"}</small><div class="step">${rows.indexOf(r) + 1}</div></div>`,
          )
          .join("")}</div></div>${rest.length || (mine && mine.rank > 100) ? `<div class="panel rank-table">${rest.map(row).join("")}${mine && rows.indexOf(mine) >= 100 ? row(mine) : ""}</div>` : ""}`
      : `<div class="panel empty">${icon("trophy")}<h3>Encara no hi ha ningú al podi.</h3><p>Resol un puzle sense pistes i el primer lloc pot ser teu.</p><button class="primary" data-nav="play">Juga</button></div>`;
  } catch (e) {
    if (view === "ranking")
      $("#rank-list").innerHTML =
        `<div class="panel empty">${icon("trophy")}<h3>El rànquing no està disponible ara.</h3><p>Comprova la connexió. Pots continuar jugant mentrestant.</p></div>`;
  }
}
const trainArt = `<svg class="hero-art" viewBox="0 0 220 150" aria-hidden="true"><path d="M0 118h220" stroke="#ffffffaa" stroke-width="4"/><path d="M0 126h220" stroke="#ffffff66" stroke-width="10" stroke-dasharray="4 10"/><g transform="translate(6 76)"><rect width="52" height="38" rx="7" fill="#e5533d" stroke="#fff" stroke-width="3"/><rect x="6" y="6" width="16" height="26" rx="3" fill="#2b3a4a"/><circle cx="48" cy="10" r="3" fill="#ffe066"/></g>${[2, 4, 6, 7].map((w, i) => `<g transform="translate(${66 + i * 38} 80)"><rect width="34" height="32" rx="5" fill="${colors[w]}" stroke="#fff" stroke-width="3"/><text x="17" y="22" text-anchor="middle" font-size="16" font-weight="900" fill="#1d2b38" font-family="system-ui">${i + 1}</text></g>`).join("")}<path d="M150 20l8 16 18 2-13 12 4 18-17-9-17 9 4-18-13-12 18-2z" fill="#ffe066"/></svg>`;
function renderAbout() {
  $("#main").innerHTML = `<div class="page"><section class="hero about-hero"><div><div class="eyebrow">Sobre el joc</div><h1>Pocs vagons, poques vies, molt de cap</h1><p>Maniobres és un trencaclosques de lògica: has de formar un tren en l’ordre exacte movent els vagons amb una sola locomotora i molt poc espai. Sembla fàcil, però cada moviment compta.</p></div>${trainArt}</section><div class="about-grid"><section class="panel about-card"><span class="ic" style="background:#ff8a3d">${icon("route")}</span><h3>D’on ve</h3><p>Es basa en l’Inglenook Sidings, un clàssic del modelisme ferroviari britànic ideat per Alan Wright el 1979. Reprodueix una feina real: en una estació petita, el maquinista ha d’ordenar els vagons d’un tren de mercaderies amb vies curtes i sense espai de sobres.</p></section><section class="panel about-card"><span class="ic" style="background:#1f9d6b">${icon("play")}</span><h3>Les regles</h3><ul class="rules-list"><li><b>1</b>Forma a la via A el tren de dalt, en el mateix ordre.</li><li><b>2</b>La locomotora arrossega com a molt tres vagons.</li><li><b>3</b>Només pots agafar els vagons més propers a les agulles.</li><li><b>4</b>Cada anada i tornada de la locomotora és un moviment.</li></ul></section><section class="panel about-card"><span class="ic" style="background:#7ab8ff">${icon("bulb")}</span><h3>Què s’hi aprèn</h3><p>A planificar abans d’actuar, a pensar enrere des de l’objectiu, a dividir un problema gran en passos petits i a no rendir-se quan un camí no funciona. És pensament computacional i combinatòria sense fórmules.</p></section><section class="panel about-card"><span class="ic" style="background:#b69cff">${icon("trophy")}</span><h3>Com puntua</h3><p>Cada puzle té un mínim de moviments calculat per ordinador. Si el resols sense pistes, guanyes 10 punts per cada moviment del mínim i en perds 5 per cada moviment de més. El rànquing comprova cada resultat tornant a jugar la solució.</p></section><section class="panel about-card wide"><h3>L’estació en xifres</h3><div class="facts"><div><strong>8</strong><small>vagons a l’estació</small></div><div><strong>5</strong><small>formen el tren</small></div><div><strong>356.160</strong><small>situacions diferents</small></div><div><strong>17</strong><small>moviments, el repte més llarg</small></div></div></section><section class="panel about-card wide credits"><p>Versió 2.1.1 · Creat per <a href="https://ja.cat/felipsarroca" target="_blank" rel="noopener noreferrer">Felip Sarroca</a> amb assistència de la IA · Codi AGPLv3 i continguts CC BY-NC-SA 4.0 · <a href="https://github.com/felipsarroca/jocs/tree/main/Maniobres" target="_blank" rel="noopener noreferrer">Codi font</a> · <a href="https://github.com/felipsarroca/jocs/issues/new?template=maniobres.yml" target="_blank" rel="noopener noreferrer">Suggeriments i errors</a>. El rànquing només desa el nom de jugador i les solucions: no cal correu ni contrasenya.</p></section></div></div>`;
}
function tutorial(step = 0) {
  tutorialStep = step;
  const pages = [
    [
      "Et donem la benvinguda al pati de vies.",
      "Has de formar a la via A el tren que veus a dalt. Sobre cada plaça de la via A hi ha el número del vagó que hi ha d’anar.",
    ],
    [
      "L’espai és el repte.",
      "La via A admet cinc vagons; B i C, tres cadascuna. La locomotora pot portar-ne tres. En les estacions petites, les capacitats són diferents i sempre estan indicades.",
    ],
    [
      "Una via. Un tall.",
      "Arrossega un vagó d’una via fins a la locomotora: s’hi enganxen ell i els que té davant. Arrossega un vagó del tren de la locomotora fins a una via: s’hi queden ell i els que té darrere. Cada anada i tornada és una maniobra.",
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
  if (action === "cancel") {
    selected = 0;
    return renderGame();
  }
  if (action === "new-menu") {
    modal(
      `<div class="eyebrow">Nou repte</div><h2>Tria la dificultat</h2><p>El número és el mínim de moviments de la millor solució. Com més difícil, més punts.</p><div class="difficulty-grid">${Object.entries(
        LEVELS,
      )
        .map(
          ([v, [n, lo, hi]]) =>
            `<button class="${difficulty === v ? "primary" : ""}" data-difficulty="${v}"><b>${n}</b><small>${lo === 2 ? "fins a " + hi : lo + " a " + hi} moviments</small><small>${score(lo, lo)}–${score(hi, hi)} punts</small></button>`,
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
    selected = nextMove[0];
    preview = `Pista: ${"ABC"[nextMove[0] - 1]}${nextMove[1]}, torna amb ${nextMove[1]} ${nextMove[1] === 1 ? "vagó" : "vagons"}. Amb pistes, la partida no puntua.`;
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
      err.textContent = e.message;
      btn.disabled = false;
      input?.focus();
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
  noClickUntil = 0;
function svgPoint(svg, e) {
  const m = svg.getScreenCTM().inverse();
  return new DOMPoint(e.clientX, e.clientY).matrixTransform(m);
}
function dropPlan(d, x, y) {
  const c = config(),
    s = game.state,
    pt = +d.svg.dataset.pt,
    zone =
      x < pt - 10
        ? 0
        : [100, 220, 340].reduce((b, yy, i) => (Math.abs(y - yy) < Math.abs(y - [100, 220, 340][b - 1]) ? i + 1 : b), 1);
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
  const p = svgPoint(svg, e);
  return (
    [...svg.querySelectorAll("[data-src]")].find((el) => {
      const [x, y] = el.getAttribute("transform").match(/[-\d.]+/g).map(Number);
      return p.x >= x - 6 && p.x <= x + 58 && p.y >= y - 27 && p.y <= y + 27;
    }) || null
  );
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
  drag = {
    svg,
    src,
    idx,
    els,
    id: e.pointerId,
    start: svgPoint(svg, e),
    base: els.map((x) => x.getAttribute("transform").match(/[-\d.]+/g).map(Number)),
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
  drag.els.forEach((x, i) =>
    x.setAttribute("transform", `translate(${drag.base[i][0] + dx} ${drag.base[i][1] + dy})`),
  );
  drag.plan = dropPlan(drag, p.x, p.y);
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
  if (!cancel && d.plan?.v) doMove(d.plan.v, d.plan.k);
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
    else if (b.dataset.difficulty) {
      difficulty = b.dataset.difficulty;
      dialog.close();
      handle("new");
    } else if (b.dataset.via) select(+b.dataset.via);
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
if ("serviceWorker" in navigator)
  navigator.serviceWorker.register("./sw.js").catch(() => {});

matchMedia("(max-width:650px)").addEventListener("change", () => {
  if (view === "play") renderGame();
});