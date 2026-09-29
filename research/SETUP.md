# research.heatfriedchicken.ro: punerea online

Jurnalul de bonuri Heat, pe domeniul Heat, cu datele în Supabase-ul Heat.
Folderul `research/` e tot site-ul: `index.html`, `config.js`, `assets/`.

**De ce nu direct din Supabase:** Supabase nu servește pagini web. Fișierele
HTML din Storage sunt livrate ca text simplu, iar domeniul personalizat
Supabase e doar pentru API. Pagina stă deci pe un hosting static gratuit
(Cloudflare Pages sau Netlify), iar datele și login-ul rămân în Supabase.

Durează ~30 de minute, o singură dată. Pașii 1–3 îi face cineva de la Heat
(proprietarul domeniului și al proiectului Supabase).

---

## 1. Domeniul `heatfriedchicken.ro`

În prezent domeniul **nu e înregistrat** (registrul .ro răspunde „domeniu
inexistent").

1. Se cumpără de la un registrar acreditat ROTLD (ex. Romarg, Hostico,
   ROTLD direct), pe firma Heat. Costul e de câteva zeci de lei pe an.
2. Păstrați acces la panoul **DNS** al domeniului: la pasul 5 se adaugă o
   singură înregistrare.

## 2. Baza de date în Supabase

1. Supabase → proiectul Heat → **SQL Editor → New query**.
2. Lipește tot fișierul [`supabase-setup.sql`](supabase-setup.sql).
3. **Înainte de Run**, în ultimul bloc, înlocuiește `admin@exemplu.ro` și
   `Nume Admin` cu emailul și numele persoanei care administrează echipa.
4. **Run.** Se creează tabelele `research_members` (cine are acces) și
   `research_receipts` (bonurile), cu reguli de acces: doar emailurile din
   echipă văd și scriu, fiecare își poate șterge bonurile proprii, iar
   adminul le poate șterge pe toate.

## 3. Login-ul echipei (Supabase Auth)

1. **Authentication → Sign In / Providers → Email**: trebuie să fie activ
   (e activ implicit).
2. **Authentication → URL Configuration**:
   - *Site URL*: `https://research.heatfriedchicken.ro`
   - *Redirect URLs*: adaugă `https://research.heatfriedchicken.ro` și
     adresa temporară de la pasul 4 (ex. `https://heat-research.pages.dev`).
3. **Recomandat: SMTP propriu** (Authentication → Emails → SMTP Settings).
   Serverul de email implicit al Supabase trimite doar câteva emailuri pe
   oră. Cu un SMTP propriu (Resend, Brevo, Google Workspace) linkurile de
   intrare ajung la toată echipa fără întârziere. Fiecare om intră o
   singură dată pe dispozitiv, apoi rămâne conectat.

Colegii se adaugă apoi **din pagină**: adminul intră și completează emailul,
numele și rolul la „Cine e pe teren?". Nu mai e nevoie de Supabase pentru asta.

## 4. Legarea paginii de Supabase și publicarea

1. Supabase → **Project Settings → API**: copiază *Project URL* și cheia
   **anon public**. Nu folosi cheia `service_role`.
2. Pune-le în [`config.js`](config.js) (instrucțiunile sunt în fișier) și
   fă commit.
3. Publică folderul `research/`, cu una dintre variante:
   - **Cloudflare Pages** (recomandat): *Workers & Pages → Create → Pages →
     Connect to Git* → repo-ul `Mokum-Toolkit-x-Around-Thecorner`, branch-ul
     principal. *Build command*: gol. *Build output directory*: `research`.
     Primești o adresă `…pages.dev`.
   - **Netlify**: *Add new site → Import from Git*, același repo. *Base
     directory*: `research`, *Publish directory*: `research`, fără build
     command. Primești o adresă `…netlify.app`.

   Fiecare commit pe branch-ul principal republică automat pagina.

## 5. Subdomeniul `research.heatfriedchicken.ro`

1. În Cloudflare Pages (*Custom domains → Set up a domain*) sau Netlify
   (*Domain management → Add a domain*) scrie
   `research.heatfriedchicken.ro`.
2. La registrarul domeniului, în panoul DNS, adaugă:

   | Tip   | Nume / Host | Valoare                                        | TTL  |
   |-------|-------------|------------------------------------------------|------|
   | CNAME | `research`  | adresa de la pasul 4 (ex. `heat-research.pages.dev`) | 300 |

3. Certificatul HTTPS se emite automat în câteva minute (uneori până la
   câteva ore, cât se propagă DNS-ul).

## 6. Verificare

- `https://research.heatfriedchicken.ro` se deschide în stilul Heat.
- Adminul își introduce emailul, primește linkul, intră și vede
  „Echipa Heat · live".
- Salvează un bon de probă, îl vede în tabul *Jurnal*, apoi îl șterge.
- Adaugă un coleg; colegul intră de pe telefonul lui și vede același bon.
