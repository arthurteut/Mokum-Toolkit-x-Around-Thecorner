# Abonamente (Stripe) — cum funcționează și cum se configurează

Toolkit-ul e protejat de un **gate de cont**: aplicația din `app.html` stă
criptată (AES-256-GCM), iar cheia de decriptare se livrează din Firestore
(`config/appkey`) **doar membrilor unei cafenele cu abonament activ**
(`cafes/{id}.active == true`). Fără abonament, adminul cafenelei vede ecranul
de plată cu linkul Stripe; bariștii văd mesajul „vorbește cu administratorul".

## Fluxul banilor

1. Cafeneaua își face cont în `app.html` (nume + email + parolă). Emailul
   devine `billingEmail`-ul cafenelei.
2. Pe ecranul de abonament apasă „Activează abonamentul" → Stripe Payment
   Link (emailul e precompletat ca să se potrivească automat).
3. Stripe trimite evenimentul la webhook (Supabase Edge Function
   `atc-stripe-webhook`, codul în [`infra/stripe-webhook/index.ts`](infra/stripe-webhook/index.ts)),
   care setează `cafes/{id}.active = true`. Accesul se deschide în câteva minute.
4. La anulare/neplată, `customer.subscription.updated|deleted` setează
   `active = false` → la următoarea deschidere, echipa vede din nou ecranul
   de abonament. Datele nu se șterg; citirea registrului rămâne permisă,
   doar scrierea și aplicația se blochează.

Plățile care nu se potrivesc cu nicio cafenea (alt email la checkout) ajung în
colecția `stripe_orphans` și apar în **panoul de owner** din aplicație, unde se
rezolvă manual. Panoul de owner (vizibil doar pentru contul Around The Corner)
poate activa/dezactiva orice cafenea — conturi gratuite, parteneri, teste.

## Configurare (o singură dată)

### 1. Firebase

- **Firestore → Rules**: lipește integral [`firestore.rules`](firestore.rules) → Publish.
- Contul de serviciu al webhook-ului există deja:
  `stripe-service@atc-toolkit.web.app` (drepturile lui sunt definite în reguli).

### 2. Stripe (dashboard)

1. **Product catalog → Add product**: „aroundthecorner.toolkit — abonament
   cafenea", preț **recurring / lunar**, suma pe care o alegi tu.
2. **Payment Links → New**: alege produsul → creează linkul. Linkul se pune în
   `lock-template.html` (`STRIPE_LINK`) la build.
3. **Developers → Webhooks → Add endpoint**: URL-ul funcției Supabase
   (`https://<project-ref>.supabase.co/functions/v1/atc-stripe-webhook`),
   cu evenimentele: `checkout.session.completed`,
   `customer.subscription.updated`, `customer.subscription.deleted`.
   Copiază **Signing secret** (`whsec_…`) → se pune în secretele Supabase.

### 3. Supabase (proiectul `atc-toolkit`)

- Deploy funcția din `infra/stripe-webhook/index.ts` sub numele
  `atc-stripe-webhook`, cu **verify JWT dezactivat** (Stripe nu trimite JWT).
- Secrete (Edge Functions → Secrets): `STRIPE_WEBHOOK_SECRET`, `FB_API_KEY`
  (apiKey-ul web, public), `FB_PROJECT_ID` (`atc-toolkit`), `SVC_EMAIL`,
  `SVC_PASSWORD`.

### 4. Publicarea cheii aplicației

După fiecare schimbare a parolei de build (nu a fiecărui build — cheia e
derivată determinist din parolă), valoarea din `appkey.b64` se scrie în
Firestore la `config/appkey` → `{ k: "<base64>" }` (poate scrie doar owner-ul
sau contul de serviciu, conform regulilor).

## Build

```
./build.sh '<parola-de-build>'
```

Parola de build nu se comite nicăieri; din ea se derivă cheia AES (PBKDF2,
300k iterații, salt fix în `encrypt.js`). În repo ajung doar fișierele
criptate — repo-ul poate rămâne public.
