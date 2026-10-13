// Supabase Edge Function: atc-stripe-webhook
//
// Primește webhook-urile Stripe ale toolkit-ului și ține în pas abonamentele:
//   - checkout.session.completed  -> activează cafeneaua (după emailul de facturare)
//   - customer.subscription.updated/deleted -> actualizează starea (după customerId)
// Plățile care nu se potrivesc cu nicio cafenea ajung în colecția `stripe_orphans`,
// vizibilă în panoul de owner din aplicație.
//
// Secrets necesare (Supabase -> Edge Functions -> Secrets):
//   STRIPE_WEBHOOK_SECRET  — semnătura endpoint-ului (whsec_...)
//   FB_API_KEY             — apiKey-ul web al proiectului Firebase (public)
//   FB_PROJECT_ID          — ex. atc-toolkit
//   SVC_EMAIL, SVC_PASSWORD — contul de serviciu Firebase (vezi firestore.rules)

const enc = new TextEncoder();

function env(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing secret: ${name}`);
  return v;
}

// ── Verificarea semnăturii Stripe ────────────────────────────────────────────
async function verifyStripeSignature(payload: string, header: string | null, secret: string): Promise<boolean> {
  if (!header) return false;
  const parts = Object.fromEntries(
    header.split(",").map((p) => {
      const i = p.indexOf("=");
      return [p.slice(0, i).trim(), p.slice(i + 1)];
    }),
  );
  const t = parts["t"];
  const v1 = parts["v1"];
  if (!t || !v1) return false;
  if (Math.abs(Date.now() / 1000 - Number(t)) > 300) return false; // 5 min toleranță
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", key, enc.encode(`${t}.${payload}`));
  const expected = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("");
  if (expected.length !== v1.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ v1.charCodeAt(i);
  return diff === 0;
}

// ── Firestore prin REST, autentificat ca utilizatorul de serviciu ────────────
let cachedToken: { token: string; exp: number } | null = null;

async function svcToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.exp) return cachedToken.token;
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${env("FB_API_KEY")}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: env("SVC_EMAIL"), password: env("SVC_PASSWORD"), returnSecureToken: true }),
    },
  );
  if (!res.ok) throw new Error(`Firebase sign-in failed: ${res.status} ${await res.text()}`);
  const body = await res.json();
  cachedToken = { token: body.idToken, exp: Date.now() + 50 * 60 * 1000 };
  return body.idToken;
}

function fsBase(): string {
  return `https://firestore.googleapis.com/v1/projects/${env("FB_PROJECT_ID")}/databases/(default)/documents`;
}

async function fsFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = await svcToken();
  return fetch(path, {
    ...init,
    headers: { ...(init.headers ?? {}), "Content-Type": "application/json", Authorization: `Bearer ${token}` },
  });
}

async function findCafe(fieldPath: string, value: string): Promise<string | null> {
  const res = await fsFetch(`${fsBase()}:runQuery`, {
    method: "POST",
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: "cafes" }],
        where: { fieldFilter: { field: { fieldPath }, op: "EQUAL", value: { stringValue: value } } },
        limit: 1,
      },
    }),
  });
  if (!res.ok) throw new Error(`runQuery failed: ${res.status} ${await res.text()}`);
  const rows = await res.json();
  for (const row of rows) {
    if (row.document?.name) return String(row.document.name).split("/").pop()!;
  }
  return null;
}

async function updateCafe(cafeId: string, active: boolean, sub: Record<string, string>): Promise<void> {
  const subFields: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(sub)) subFields[k] = { stringValue: v };
  subFields["updatedAt"] = { integerValue: String(Date.now()) };
  const url = `${fsBase()}/cafes/${cafeId}?updateMask.fieldPaths=active&updateMask.fieldPaths=subscription`;
  const res = await fsFetch(url, {
    method: "PATCH",
    body: JSON.stringify({ fields: { active: { booleanValue: active }, subscription: { mapValue: { fields: subFields } } } }),
  });
  if (!res.ok) throw new Error(`update failed: ${res.status} ${await res.text()}`);
}

async function addOrphan(info: Record<string, string>): Promise<void> {
  const fields: Record<string, unknown> = { ts: { integerValue: String(Date.now()) } };
  for (const [k, v] of Object.entries(info)) fields[k] = { stringValue: v };
  await fsFetch(`${fsBase()}/stripe_orphans`, { method: "POST", body: JSON.stringify({ fields }) });
}

// ── Logica evenimentelor ─────────────────────────────────────────────────────
const ACTIVE_STATUSES = new Set(["active", "trialing", "past_due"]);

async function handleEvent(event: Record<string, any>): Promise<string> {
  const type = String(event.type ?? "");
  const obj = event.data?.object ?? {};

  if (type === "checkout.session.completed") {
    if (obj.mode && obj.mode !== "subscription") return "ignored (not a subscription)";
    const email = String(obj.customer_details?.email ?? obj.customer_email ?? "").toLowerCase();
    const customerId = String(obj.customer ?? "");
    const subscriptionId = String(obj.subscription ?? "");
    if (!email) return "ignored (no email)";
    const cafeId = await findCafe("billingEmail", email);
    if (!cafeId) {
      await addOrphan({ email, customerId, type });
      return `orphan (no cafe with billingEmail=${email})`;
    }
    await updateCafe(cafeId, true, { status: "active", customerId, subscriptionId });
    return `activated cafe ${cafeId}`;
  }

  if (type === "customer.subscription.updated" || type === "customer.subscription.deleted") {
    const customerId = String(obj.customer ?? "");
    const status = type === "customer.subscription.deleted" ? "canceled" : String(obj.status ?? "");
    if (!customerId) return "ignored (no customer)";
    const cafeId = await findCafe("subscription.customerId", customerId);
    if (!cafeId) {
      await addOrphan({ customerId, status, type });
      return `orphan (no cafe with customerId=${customerId})`;
    }
    const active = ACTIVE_STATUSES.has(status);
    await updateCafe(cafeId, active, { status, customerId, subscriptionId: String(obj.id ?? "") });
    return `cafe ${cafeId} -> ${status} (active=${active})`;
  }

  return `ignored (${type})`;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("method not allowed", { status: 405 });
  const payload = await req.text();
  const ok = await verifyStripeSignature(payload, req.headers.get("stripe-signature"), env("STRIPE_WEBHOOK_SECRET"));
  if (!ok) return new Response("invalid signature", { status: 400 });
  try {
    const result = await handleEvent(JSON.parse(payload));
    console.log(result);
    return new Response(JSON.stringify({ received: true, result }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("webhook error:", err);
    // 500 => Stripe reîncearcă automat livrarea
    return new Response("internal error", { status: 500 });
  }
});
