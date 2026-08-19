import { getAllRecords, deleteRecord, putRecord } from "../storage/indexed-db.js";
import { DEFAULT_APPS_SCRIPT_URL } from "../config.js";

export function getEndpoint() {
  if (new URLSearchParams(window.location.search).has("test")) return "";
  return DEFAULT_APPS_SCRIPT_URL;
}

async function request(payload) {
  const endpoint = getEndpoint();
  if (!endpoint) throw new Error("SYNC_NOT_CONFIGURED");
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload),
    redirect: "follow"
  });
  if (!response.ok) throw new Error(`HTTP_${response.status}`);
  const data = await response.json();
  if (!data.ok) throw new Error(data.error?.code || "REMOTE_ERROR");
  return data;
}

export function fetchPlayer(displayName) {
  return request({ apiVersion: 1, action: "player", displayName });
}

export async function fetchRanking() {
  const endpoint = getEndpoint();
  if (!endpoint) throw new Error("SYNC_NOT_CONFIGURED");
  const url = new URL(endpoint);
  url.searchParams.set("action", "ranking");
  url.searchParams.set("apiVersion", "1");
  const response = await fetch(url, { redirect: "follow" });
  if (!response.ok) throw new Error(`HTTP_${response.status}`);
  const data = await response.json();
  if (!data.ok) throw new Error(data.error?.code || "REMOTE_ERROR");
  return data;
}

export async function queueCompletion(normalizedName, completion) {
  return putRecord("queue", completion.requestId, { normalizedName, ...completion, status: "PENDING" });
}

export async function syncPending(displayName, normalizedName) {
  const pending = (await getAllRecords("queue"))
    .filter(item => item.normalizedName === normalizedName)
    .sort((a, b) => a.order - b.order);
  if (!pending.length) return { ok: true, synced: 0 };
  const data = await request({
    apiVersion: 1,
    action: "sync",
    displayName,
    appVersion: "1.2.0",
    completions: pending.map(({ requestId, challengeId, layout }) => ({ requestId, challengeId, layout }))
  });
  for (const item of pending) await deleteRecord("queue", item.requestId);
  return { ...data, synced: pending.length };
}
