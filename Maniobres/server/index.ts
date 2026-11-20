// SPDX-License-Identifier: AGPL-3.0-or-later
// Public transport endpoint with per-device capability tokens, validated replay and service-only data access.
import { daily, dateKey, replay, hash } from "../src/engine.js";
import catalog from "../data/catalog.json" with { type: "json" };
const base = Deno.env.get("SUPABASE_URL")!,
  secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const origins = new Set([
  "https://felipsarroca.github.io",
  "http://127.0.0.1:4173",
  "http://localhost:4173",
]);
async function digest(s: string) {
  return [
    ...new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)),
    ),
  ]
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
}
function nameFor(s: string) {
  const a = ["Exprés", "Tren", "Vagó", "Rail", "Estel", "Pont", "Far", "Túnel"],
    b = ["Blau", "Verd", "Daurat", "Serè", "Ràpid", "Lunar", "Polar", "Solar"];
  const n = hash(s);
  return `${a[n % a.length]} ${b[Math.floor(n / 8) % b.length]} ${100 + (n % 900)}`;
}
async function db(path: string, method = "GET", data?: unknown) {
  const r = await fetch(base + "/rest/v1/" + path, {
    method,
    headers: {
      apikey: secret,
      Authorization: "Bearer " + secret,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: data === undefined ? undefined : JSON.stringify(data),
  });
  if (!r.ok) {
    console.error("Database request failed", r.status);
    throw Error("Servei temporalment no disponible");
  }
  const text = await r.text();
  return text ? JSON.parse(text) : null;
}
async function room(code: unknown) {
  if (typeof code !== "string" || !/^\w{10}$/.test(code))
    throw Error("Codi de sala incorrecte");
  const rows = await db(
    `maniobres_rooms?code=eq.${code}&expires_at=gt.${encodeURIComponent(new Date().toISOString())}`,
  );
  if (!rows.length) throw Error("Aquesta sala no existeix o ha caducat");
  return rows[0];
}
Deno.serve(async (req) => {
  const origin = req.headers.get("origin") || "",
    cors = {
      "Access-Control-Allow-Origin": origins.has(origin)
        ? origin
        : "https://felipsarroca.github.io",
      "Access-Control-Allow-Headers": "content-type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      Vary: "Origin",
      "Cache-Control": "no-store",
    };
  const out = (x: unknown, status = 200) =>
    Response.json(x, { status, headers: cors });
  if (req.method === "OPTIONS")
    return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return out({ error: "Mètode no permès" }, 405);
  if (origin && !origins.has(origin))
    return out({ error: "Origen no permès" }, 403);
  try {
    const raw = await req.text();
    if (raw.length > 18000) return out({ error: "Petició massa gran" }, 413);
    const b = JSON.parse(raw),
      action = b.action;
    if (action === "health")
      return out({ ok: true, version: "1.0.0", retentionDays: 30 });
    const minute = Math.floor(Date.now() / 60000),
      ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
    const bucket = await digest(secret + ":" + minute + ":" + ip);
    if (
      !(await db("rpc/maniobres_rate", "POST", {
        p_bucket: bucket,
        p_limit: 200,
      }))
    )
      return out({ error: "Massa peticions. Espera un minut." }, 429);
    let actor = "";
    if (
      typeof b.token === "string" &&
      b.token.length >= 64 &&
      b.token.length <= 100
    )
      actor = await digest(b.token);
    if (
      ["submit", "create-room", "export", "delete-room", "erase"].includes(
        action,
      ) &&
      !actor
    )
      return out({ error: "Identificador no vàlid" }, 401);
    const today = dateKey(),
      now = encodeURIComponent(new Date().toISOString());
    if (action === "room") {
      const r = await room(b.room);
      return out({ puzzle: r.puzzle, expires: r.expires_at });
    }
    if (action === "create-room") {
      if (!catalog.some((p) => p.id === b.puzzle))
        throw Error("Puzle desconegut");
      const existing = await db(
        `maniobres_rooms?owner_hash=eq.${actor}&expires_at=gt.${now}&select=code`,
      );
      if (existing.length >= 5)
        throw Error(
          "Ja tens cinc sales actives. Tanca’n una abans de crear-ne més.",
        );
      const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789",
        arr = crypto.getRandomValues(new Uint8Array(10)),
        code = [...arr].map((x) => alphabet[x % alphabet.length]).join("");
      await db("maniobres_rooms", "POST", {
        code,
        owner_hash: actor,
        puzzle: b.puzzle,
      });
      return out({ code });
    }
    if (action === "submit") {
      if (b.day !== today) throw Error("Només pots publicar el repte d’avui");
      let p;
      if (b.room) {
        const r = await room(b.room);
        p = catalog.find((p) => p.id === r.puzzle);
      } else p = daily(catalog, today);
      if (!p || p.id !== b.puzzle)
        throw Error("El puzle no correspon al repte");
      if (!replay(p, b.log)) throw Error("El tren objectiu no està complet");
      if (b.log.length < p.min) throw Error("Solució inconsistent");
      if (!Number.isInteger(b.seconds) || b.seconds < 0 || b.seconds > 86400)
        throw Error("Durada no vàlida");
      if (
        !(await db("rpc/maniobres_rate", "POST", {
          p_bucket: actor + ":" + minute,
          p_limit: 10,
        }))
      )
        return out(
          { error: "Espera un minut abans de tornar a publicar." },
          429,
        );
      const points = Math.max(10, 100 - 5 * (b.log.length - p.min)),
        name = nameFor(actor);
      await db("rpc/maniobres_save", "POST", {
        p_actor: actor,
        p_name: name,
        p_day: today,
        p_room: b.room || "",
        p_puzzle: p.id,
        p_moves: b.log.length,
        p_points: points,
        p_seconds: b.seconds,
        p_log: b.log,
      });
      return out({ points, name });
    }
    if (action === "board") {
      const scope = ["season", "daily", "class"].includes(b.scope)
        ? b.scope
        : "season";
      if (scope === "class") await room(b.room);
      let filter = `room=eq.${scope === "class" ? b.room : ""}&expires_at=gt.${now}`;
      if (scope === "daily") filter += `&day=eq.${today}`;
      else if (scope === "season") filter += `&day=gte.${today.slice(0, 7)}-01`;
      // Page through all eligible results so the rank is not biased by the API row cap.
      const sums = new Map();
      for (let offset = 0; offset < 100000; offset += 1000) {
        const rows = await db(
          `maniobres_scores?${filter}&select=actor_hash,name,points&order=id&offset=${offset}&limit=1000`,
        );
        for (const r of rows) {
          const x = sums.get(r.actor_hash) || {
            name: r.name,
            points: 0,
            games: 0,
            me: r.actor_hash === actor,
          };
          x.points += r.points;
          x.games++;
          sums.set(r.actor_hash, x);
        }
        if (rows.length < 1000) break;
      }
      let last = -1,
        rank = 0;
      const all = [...sums.values()].sort(
        (a, b) => b.points - a.points || a.name.localeCompare(b.name),
      );
      all.forEach((r, i) => {
        if (r.points !== last) rank = i + 1;
        r.rank = rank;
        last = r.points;
      });
      const top = all.slice(0, 100);
      const me = all.find((r) => r.me);
      if (me && !top.includes(me)) top.push(me);
      return out({ rows: top });
    }
    if (action === "export" || action === "delete-room") {
      const r = await room(b.room);
      if (r.owner_hash !== actor)
        return out(
          { error: "Només el creador pot gestionar aquesta sala" },
          403,
        );
      if (action === "export") {
        const rows = await db(
          `maniobres_scores?room=eq.${r.code}&expires_at=gt.${now}&select=name,puzzle,moves,points,day&order=day.desc&limit=1000`,
        );
        return out({ rows });
      }
      await db(`maniobres_scores?room=eq.${r.code}`, "DELETE");
      await db(`maniobres_rooms?code=eq.${r.code}`, "DELETE");
      return out({ ok: true });
    }
    if (action === "erase") {
      const rooms = await db(
        `maniobres_rooms?owner_hash=eq.${actor}&select=code`,
      );
      for (const r of rooms)
        await db(`maniobres_scores?room=eq.${r.code}`, "DELETE");
      await db(`maniobres_rooms?owner_hash=eq.${actor}`, "DELETE");
      await db(`maniobres_scores?actor_hash=eq.${actor}`, "DELETE");
      return out({ ok: true });
    }
    return out({ error: "Acció desconeguda" }, 400);
  } catch (e) {
    return out(
      { error: e instanceof Error ? e.message : "Petició no vàlida" },
      400,
    );
  }
});
