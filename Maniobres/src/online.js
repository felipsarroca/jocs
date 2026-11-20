// SPDX-License-Identifier: AGPL-3.0-or-later
export const API =
  "https://zcwsqrgxoxvjbvpulroq.supabase.co/functions/v1/maniobres";
export async function api(action, data = {}) {
  const r = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...data }),
    signal: AbortSignal.timeout(15000),
  });
  const x = await r.json();
  if (!r.ok) throw Error(x.error || "Servei temporalment no disponible");
  return x;
}
