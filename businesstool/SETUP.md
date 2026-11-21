# businesstool.heatcertifried.ro: punerea online

Planul de afaceri Heat ca pagină proprie, pe domeniul Heat, cu datele în Supabase
și login prin link pe email (fără parole, fără conturi Claude).
Folderul `businesstool/` e tot site-ul: `index.html`, `config.js`, `assets/`.

Pașii seamănă cu cei de la `research/`: baza de date (1), login-ul (2),
publicarea (3), subdomeniul (4), echipa (5).

---

## 1. Baza de date (Supabase)

Proiectul folosit acum: **atc-toolkit** (`tckcmfdolaickwtxglvt`), al ATC. Dacă
planul trebuie să stea în proiectul Heat, aceiași pași se fac acolo și se
schimbă `url` și `anonKey` din `config.js`.

1. Supabase → proiectul → **SQL Editor → New query**.
2. Lipește tot fișierul [`supabase-plan.sql`](supabase-plan.sql) și **Run**.
   Se creează:
   - `plan_members`: emailurile cu acces (cine nu e aici nu vede nimic);
   - `plan_users`: numele celor care au intrat, pentru „modificat de …”;
   - `plan_docs`: documentele planului (o colecție + un id + conținut JSON),
     cu reguli de acces: echipa citește și scrie tot, iar „De ce”-ul fiecăruia
     e privat (coll `private`, id = utilizatorul);
   - `plan_visits`: vizitele fiecăruia (cât stă pe pagină, ce blocuri citește,
     câte modificări salvează); fiecare își scrie doar vizitele lui, iar
     administratorul le vede pe toate în pagină, butonul **Activitate**;
   - `plan_push_subs`, `plan_notices`, `plan_secrets` + extensiile `pg_cron`
     și `pg_net`: notificările push (pasul 6).
3. Primul administrator: decomentează ultimele linii din fișier, pune emailul
   și numele, rulează. Colegii se adaugă apoi din pagină (butonul **Echipa**).
4. Conținutul de pornire (planul scris până acum în pagina Claude) se importă
   cu fișierul `plan-seed.sql` (îl generează Claude din pagina Claude: 183 de
   documente), tot din SQL Editor.

## 2. Login-ul echipei (Supabase Auth)

1. **Authentication → Sign In / Providers → Email**: activ (implicit).
2. **Authentication → URL Configuration**:
   - *Site URL*: `https://businesstool.heatcertifried.ro`
   - *Redirect URLs*: `https://businesstool.heatcertifried.ro` și adresa
     temporară de la pasul 3 (ex. `https://heat-businesstool.pages.dev`).
3. **Codul de 6 cifre în email** (necesar pentru aplicația de pe ecranul
   principal, pe iPhone): Authentication → Emails → Templates → *Magic Link*,
   pune în corp și `{{ .Token }}`, de exemplu:

   ```html
   <h2>Intrare în planul Heat</h2>
   <p>Codul tău de intrare: <b style="font-size:22px;letter-spacing:4px">{{ .Token }}</b></p>
   <p>Sau deschide linkul de pe același dispozitiv: <a href="{{ .ConfirmationURL }}">Intră în plan</a></p>
   <p>Codul și linkul merg o singură dată și expiră într-o oră.</p>
   ```

   Pagina trimite codul și linkul cu același buton; în aplicație se tastează
   codul (`verifyOtp`, tip `email`).
4. Recomandat: **SMTP propriu** (Authentication → Emails → SMTP Settings),
   altfel Supabase trimite doar câteva emailuri pe oră. Fiecare om intră o
   dată pe dispozitiv, apoi rămâne conectat.

## 3. Publicarea paginii

`config.js` are deja URL-ul și cheia anon ale proiectului atc-toolkit (cheia e
publică prin design; accesul e dat de regulile din SQL).

- **Cloudflare Pages** (recomandat, ca la research): *Workers & Pages → Create →
  Pages → Connect to Git* → acest repo, branch-ul principal. *Build command*:
  gol. *Build output directory*: `businesstool`. Primești o adresă `…pages.dev`.
- **Netlify**: *Add new site → Import from Git*, *Base directory* și *Publish
  directory*: `businesstool`, fără build command.

Fiecare commit republică pagina. Sursa paginii e în `src/`; după o modificare
se rulează `python3 businesstool/src/build.py`, care rescrie `index.html`.

## 4. Subdomeniul `businesstool.heatcertifried.ro`

1. Cloudflare Pages (*Custom domains → Set up a domain*) sau Netlify (*Domain
   management → Add a domain*): `businesstool.heatcertifried.ro`.
2. La DNS-ul domeniului `heatcertifried.ro`:

   | Tip   | Nume / Host    | Valoare                                            | TTL |
   |-------|----------------|----------------------------------------------------|-----|
   | CNAME | `businesstool` | adresa de la pasul 3 (ex. `heat-businesstool.pages.dev`) | 300 |

   Certificatul HTTPS se emite singur în câteva minute.

## 5. Echipa

Administratorul intră, apasă **Echipa** în antet și adaugă emailul, numele și
rolul fiecărui coleg. Colegul deschide pagina, scrie emailul, primește linkul
și intră. Cine e scos din listă pierde accesul imediat.

## Verificare

- Pagina se deschide pe `https://businesstool.heatcertifried.ro` cu ecranul
  de login Heat.
- După link, planul se încarcă, antetul arată numele și **Echipa** (la admin).
- O modificare făcută pe un telefon apare pe celălalt fără reîncărcare.

## Test automat (opțional)

`node businesstool/src/test.js <seed.json>` pornește pagina cu un client
Supabase fals (`src/fake-supabase.js`) și verifică login-ul, drepturile,
scrierea, actualizările live și spațiul privat. `seed.json` e exportul
paginii Claude (`{"coll/id": document}`).

## 6. Aplicația pe telefon și notificările push

Pagina e o aplicație instalabilă (PWA): `manifest.webmanifest`, `sw.js`
(service worker, generat de `build.py` din `src/sw.js`, cu versiunea paginii)
și pictogramele din `assets/app/`. Din pagină, butonul **Aplicația** explică
instalarea (Android: „Instalează aplicația”; iPhone: Safari → Partajare →
„Adaugă pe ecranul principal”) și pornește notificările pe dispozitivul
respectiv. Pe iPhone notificările merg doar din aplicația instalată (iOS 16.4+).

Notificările le trimite funcția Supabase **`notify`**
(`supabase/functions/notify/index.ts`), apelată:

- din pagină, cu sesiunea utilizatorului: `vapid` (cheia publică pentru
  abonare), `test` (o notificare de probă către tine), `message` (doar
  administratorul, din panoul Activitate), `run` (doar administratorul,
  rulează acum un job: `daily` / `milestones` / `weekly`);
- de `pg_cron`, o dată pe oră, cu antetul `x-cron-secret` (valoarea din
  `plan_secrets`, cheia `cron`): la ora României 19 trimite reminderul celor
  care n-au intrat în ziua aceea, la 9 reperele cu termen în 3 zile sau
  depășite (responsabilului, după prenume, și administratorilor), luni la 9
  rezumatul săptămânii. Fiecare job programat se trimite o singură dată pe zi
  (`plan_notices`, unic pe `kind` + `day`).

Instalare: tabelele și programarea sunt în `supabase-plan.sql` (sau migrațiile
`plan_visits_activity` și `plan_push_notifications`, aplicate deja în
atc-toolkit); funcția se publică cu
`supabase functions deploy notify --no-verify-jwt` (autentificarea o face
funcția: secretul de cron sau sesiunea utilizatorului). Cheile VAPID se
generează singure la prima apelare și rămân în `plan_secrets`; nu e nimic de
copiat manual. Ce s-a trimis se vede în pagină, în Activitate → „Trimise”.
