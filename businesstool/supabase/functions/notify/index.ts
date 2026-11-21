/* Heat · plan de afaceri: notificări push (Supabase Edge Function „notify”).
   Cine o apelează:
   (1) pagina, cu sesiunea utilizatorului (Authorization: Bearer <jwt>): job = vapid | test | message | run;
   (2) pg_cron, o dată pe oră, cu antetul x-cron-secret (valoarea din plan_secrets, cheia "cron"): job = cron.
   Ce trimite: reminderul de seară (19:00, celor care n-au intrat azi), reperele cu termen aproape sau depășit (9:00),
   rezumatul săptămânii (luni 9:00) și mesajele administratorului. Cheile VAPID se generează singure la prima rulare
   și stau în plan_secrets (cheia "vapid"); abonările dispozitivelor sunt în plan_push_subs; ce s-a trimis, în plan_notices.
   Instalare: supabase functions deploy notify --no-verify-jwt (sau din Claude Code, prin MCP). Sursa e și în repo. */
import { createClient } from "jsr:@supabase/supabase-js@2";
import * as webpush from "jsr:@negrel/webpush@^0.5.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const TZ = "Europe/Bucharest";
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

type Sub = { endpoint: string; user_id: string; email: string; sub: { endpoint: string; keys: { p256dh: string; auth: string } }; failed: number };
type Member = { email: string; name: string; role: string; is_admin: boolean };
type Payload = { title: string; body: string; url?: string; tag?: string };
type Milestone = { id: string; title?: string; owner?: string; date?: string; status?: string; done?: boolean };

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...CORS } });
const plural = (n: number, one: string, many: string) => n === 1 ? `1 ${one}` : n >= 20 ? `${n} de ${many}` : `${n} ${many}`;
const fold = (s: string) => (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
const firstName = (s: string) => fold(s).split(/[^a-z0-9]+/).filter(Boolean)[0] || "";
const ownerMatches = (owner: string, name: string) => { const fn = firstName(name); return !!fn && fold(owner).split(/[^a-z0-9]+/).includes(fn); };
const fmtDay = (d: string) => { const x = new Date(d + "T12:00:00Z"); return isNaN(x.getTime()) ? d : x.toLocaleDateString("ro-RO", { day: "numeric", month: "short", timeZone: "UTC" }); };
const addDays = (day: string, n: number) => new Date(Date.parse(day + "T00:00:00Z") + n * 86400000).toISOString().slice(0, 10);
const uniqueUsers = (subs: Sub[]) => new Set(subs.map((s) => s.user_id)).size;

/* ora locală a echipei (ora României), indiferent unde rulează funcția */
function local(d = new Date()) {
  const parts: Record<string, string> = {};
  new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hourCycle: "h23", hour: "2-digit", weekday: "short", year: "numeric", month: "2-digit", day: "2-digit" })
    .formatToParts(d).forEach((p) => { if (p.type !== "literal") parts[p.type] = p.value; });
  return { hour: parseInt(parts.hour, 10) % 24, weekday: parts.weekday, day: `${parts.year}-${parts.month}-${parts.day}` };
}
const localDay = (iso: string) => local(new Date(iso)).day;

/* ── secrete (doar service role vede tabelul) ── */
async function secret(key: string): Promise<string | null> {
  const { data, error } = await admin.from("plan_secrets").select("value").eq("key", key).maybeSingle();
  if (error) throw error;
  return data?.value ?? null;
}
let vapidKeys: CryptoKeyPair | null = null, vapidPublic = "";
const b64url = (u: Uint8Array) => btoa(String.fromCharCode(...u)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const b64urlDecode = (s: string) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - s.length % 4) % 4)), (c) => c.charCodeAt(0));
async function vapid(): Promise<CryptoKeyPair> {
  if (vapidKeys) return vapidKeys;
  let raw = await secret("vapid");
  if (!raw) {
    const fresh = await webpush.generateVapidKeys({ extractable: true });
    const exported = await webpush.exportVapidKeys(fresh);
    await admin.from("plan_secrets").upsert({ key: "vapid", value: JSON.stringify(exported) }, { ignoreDuplicates: true });
    raw = (await secret("vapid")) ?? JSON.stringify(exported);
  }
  const jwks = JSON.parse(raw);
  const pub = jwks.publicKey as { x: string; y: string };
  vapidPublic = b64url(new Uint8Array([4, ...b64urlDecode(pub.x), ...b64urlDecode(pub.y)]));
  vapidKeys = await webpush.importVapidKeys(jwks, { extractable: false });
  return vapidKeys;
}

/* ── date ── */
async function members(): Promise<Member[]> { const { data, error } = await admin.from("plan_members").select("*"); if (error) throw error; return (data ?? []) as Member[]; }
async function allSubs(): Promise<Sub[]> { const { data, error } = await admin.from("plan_push_subs").select("*"); if (error) throw error; return (data ?? []) as Sub[]; }
async function milestones(): Promise<Milestone[]> {
  const { data, error } = await admin.from("plan_docs").select("id,data").eq("coll", "milestones"); if (error) throw error;
  return (data ?? []).map((d: { id: string; data: Record<string, unknown> }) => ({ id: d.id, ...(d.data || {}) })) as Milestone[];
}
const isOpen = (m: Milestone) => !!m.date && m.status !== "S-a făcut" && !(m.status === undefined && m.done);

/* cine a apelat (sesiunea din pagină) */
async function caller(req: Request) {
  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return null;
  const email = (data.user.email || "").toLowerCase();
  const { data: m } = await admin.from("plan_members").select("*").eq("email", email).maybeSingle();
  if (!m) return null;
  return { id: data.user.id, email, name: (m as Member).name, isAdmin: !!(m as Member).is_admin };
}

/* ── trimiterea ── */
async function sendTo(subs: Sub[], payload: Payload): Promise<number> {
  if (!subs.length) return 0;
  const keys = await vapid();
  const admins = (await members()).filter((m) => m.is_admin);
  const server = await webpush.ApplicationServer.new({ contactInformation: "mailto:" + (admins[0]?.email || "plan@heatcertifried.ro"), vapidKeys: keys });
  let sent = 0;
  for (const s of subs) {
    try {
      await server.subscribe(s.sub).pushTextMessage(JSON.stringify(payload), { ttl: 24 * 3600 });
      sent++;
      if (s.failed) await admin.from("plan_push_subs").update({ failed: 0 }).eq("endpoint", s.endpoint);
    } catch (e) {
      const status = e instanceof webpush.PushMessageError ? e.response.status : 0;
      const gone = (e instanceof webpush.PushMessageError && e.isGone()) || status === 404 || status === 410;
      if (gone || (s.failed || 0) >= 5) await admin.from("plan_push_subs").delete().eq("endpoint", s.endpoint);
      else await admin.from("plan_push_subs").update({ failed: (s.failed || 0) + 1 }).eq("endpoint", s.endpoint);
      console.warn("push nereușit", status, String(e));
    }
  }
  return sent;
}
/* o notificare programată se trimite o singură dată pe zi (kind + ziua locală) */
async function claim(kind: string, day: string | null): Promise<number | null> {
  const { data, error } = await admin.from("plan_notices").insert({ kind, day }).select("id").maybeSingle();
  if (error) { if (error.code === "23505") return null; throw error; }
  return (data as { id: number }).id;
}
async function finish(id: number, patch: Record<string, unknown>) { await admin.from("plan_notices").update(patch).eq("id", id); }

/* ── joburile ── */
async function jobDaily(day: string, force = false) {
  const id = await claim("daily", force ? null : day); if (id === null) return { skipped: "deja trimis azi" };
  const subs = await allSubs();
  const since = new Date(Date.now() - 36 * 3600000).toISOString();
  const { data: visits } = await admin.from("plan_visits").select("user_id,last_seen_at").gte("last_seen_at", since);
  const today = new Set(((visits ?? []) as { user_id: string; last_seen_at: string }[]).filter((v) => localDay(v.last_seen_at) === day).map((v) => v.user_id));
  const targets = subs.filter((s) => !today.has(s.user_id));
  const payload: Payload = { title: "Azi n-ai intrat pe plan", body: "Cinci minute pe plan te țin conectat la ce urmează. Deschide-l acum.", url: "./", tag: "daily" };
  const sent = await sendTo(targets, payload);
  await finish(id, { title: payload.title, body: payload.body, recipients: uniqueUsers(targets), sent });
  return { sent, recipients: uniqueUsers(targets) };
}
async function jobMilestones(day: string, force = false) {
  const id = await claim("milestones", force ? null : day); if (id === null) return { skipped: "deja trimis azi" };
  const due = (await milestones()).filter(isOpen).filter((m) => (m.date as string) <= addDays(day, 3)).sort((a, b) => (a.date as string).localeCompare(b.date as string));
  if (!due.length) { await finish(id, { title: "Repere cu termen", body: "nimic de reamintit", recipients: 0, sent: 0 }); return { sent: 0, recipients: 0 }; }
  const subs = await allSubs(), mem = await members();
  const nameOf = new Map(mem.map((m) => [m.email, m.name])), adminEmails = new Set(mem.filter((m) => m.is_admin).map((m) => m.email));
  const byEmail = new Map<string, Sub[]>();
  subs.forEach((s) => { const k = (s.email || "").toLowerCase(); byEmail.set(k, [...(byEmail.get(k) || []), s]); });
  let sent = 0, recipients = 0;
  for (const [email, list] of byEmail) {
    const mine = adminEmails.has(email) ? due : due.filter((m) => ownerMatches(m.owner || "", nameOf.get(email) || ""));
    if (!mine.length) continue;
    const late = mine.filter((m) => (m.date as string) < day), soon = mine.filter((m) => (m.date as string) >= day);
    const title = [late.length ? plural(late.length, "reper depășit", "repere depășite") : "", soon.length ? plural(soon.length, "reper", "repere") + " cu termen în 3 zile" : ""].filter(Boolean).join(" · ");
    const body = mine.slice(0, 4).map((m) => `• ${m.title || "(fără titlu)"} · ${fmtDay(m.date as string)}${(m.date as string) < day ? ", depășit" : ""}`).join("\n") + (mine.length > 4 ? `\n… și încă ${mine.length - 4}` : "");
    sent += await sendTo(list, { title, body, url: "./#b-deschidere", tag: "milestones" }); recipients++;
  }
  await finish(id, { title: "Repere cu termen", body: due.slice(0, 5).map((m) => m.title).join(", "), recipients, sent });
  return { sent, recipients, due: due.length };
}
async function jobWeekly(day: string, force = false) {
  const id = await claim("weekly", force ? null : day); if (id === null) return { skipped: "deja trimis azi" };
  const since = Date.now() - 7 * 86400000;
  const { data: logDoc } = await admin.from("plan_docs").select("data").eq("coll", "settings").eq("id", "log").maybeSingle();
  const entries = (((logDoc as { data?: { entries?: { ts: number; uid: string }[] } } | null)?.data?.entries) ?? []).filter((e) => e.ts >= since);
  const { data: users } = await admin.from("plan_users").select("id,name,email");
  const nameOf = new Map(((users ?? []) as { id: string; name: string; email: string }[]).map((u) => [u.id, u.name || u.email]));
  const counts = new Map<string, number>();
  entries.forEach((e) => { const n = nameOf.get(e.uid) || "cineva"; counts.set(n, (counts.get(n) || 0) + 1); });
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([n, c]) => `${n} ${c}`).join(", ");
  const next = (await milestones()).filter(isOpen).filter((m) => (m.date as string) >= day && (m.date as string) <= addDays(day, 14)).sort((a, b) => (a.date as string).localeCompare(b.date as string));
  const title = entries.length ? `Săptămâna trecută: ${plural(entries.length, "modificare", "modificări")} în plan` : "Săptămâna trecută: nicio modificare în plan";
  const body = (entries.length ? `De la: ${top}. ` : "Planul e un document viu: intră și completează ce lipsește. ")
    + (next.length ? `Urmează ${plural(next.length, "reper", "repere")} în 2 săptămâni: ${next.slice(0, 3).map((m) => `${m.title} (${fmtDay(m.date as string)})`).join(", ")}.` : "Niciun reper cu termen în următoarele 2 săptămâni.");
  const subs = await allSubs();
  const sent = await sendTo(subs, { title, body, url: "./", tag: "weekly" });
  await finish(id, { title, body, recipients: uniqueUsers(subs), sent });
  return { sent, recipients: uniqueUsers(subs) };
}
async function runKind(kind: string, force: boolean) {
  const { day } = local();
  if (kind === "daily") return jobDaily(day, force);
  if (kind === "milestones") return jobMilestones(day, force);
  if (kind === "weekly") return jobWeekly(day, force);
  return { error: "job necunoscut: " + kind };
}
async function cron() {
  const { hour, weekday, day } = local();
  const out: Record<string, unknown> = { day, hour, weekday };
  if (hour === 9) { out.milestones = await jobMilestones(day); if (weekday === "Mon") out.weekly = await jobWeekly(day); }
  if (hour === 19) out.daily = await jobDaily(day);
  return out;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { body = {}; }
  const job = String(body.job || "");
  try {
    if (job === "cron") {
      const want = await secret("cron");
      if (!want || req.headers.get("x-cron-secret") !== want) return json({ ok: false, error: "neautorizat" }, 401);
      const kind = typeof body.kind === "string" ? body.kind : "";
      return json({ ok: true, ...(kind ? { [kind]: await runKind(kind, true) } : await cron()) });
    }
    const who = await caller(req);
    if (!who) return json({ ok: false, error: "neautorizat: intră din nou în pagină" }, 401);
    if (job === "vapid") { await vapid(); return json({ ok: true, publicKey: vapidPublic }); }
    if (job === "test") {
      const subs = (await allSubs()).filter((s) => s.user_id === who.id);
      const sent = await sendTo(subs, { title: "Notificările merg", body: "Așa vei primi reminderele planului Heat.", url: "./", tag: "test" });
      return json({ ok: true, sent, recipients: subs.length });
    }
    if (!who.isAdmin) return json({ ok: false, error: "doar administratorul poate trimite" }, 403);
    if (job === "message") {
      const text = String(body.text || "").trim().slice(0, 140);
      if (!text) return json({ ok: false, error: "mesaj gol" });
      const subs = await allSubs();
      const title = "Mesaj de la " + who.name;
      const sent = await sendTo(subs, { title, body: text, url: "./", tag: "message-" + Date.now() });
      await admin.from("plan_notices").insert({ kind: "message", title, body: text, recipients: uniqueUsers(subs), sent, created_by: who.email });
      return json({ ok: true, sent, recipients: uniqueUsers(subs) });
    }
    if (job === "run") return json({ ok: true, result: await runKind(String(body.kind || ""), true) });
    return json({ ok: false, error: "job necunoscut: " + job });
  } catch (e) {
    console.error(e);
    return json({ ok: false, error: String((e as Error)?.message || e) }, 500);
  }
});
