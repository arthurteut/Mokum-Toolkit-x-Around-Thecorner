# Activarea conturilor de cafenea (Firebase)

Aplicația funcționează în trei moduri, automat:

1. **Local** (implicit) — fără cont; profilurile și istoricul stau în browserul
   dispozitivului. Așa merge site-ul până activezi conturile.
2. **Conturi de cafenea (cloud)** — fiecare cafenea își face cont, își invită
   bariștii prin **email de activare**, iar registrul e comun pentru toată
   echipa cafenelei, de pe orice dispozitiv.
3. Registrul intern partajat al artefactului Claude (doar versiunea internă).

Pentru modul 2 e nevoie de un proiect **Firebase** (gratuit, planul Spark
acoperă lejer o aplicație ca asta). Configurarea durează ~15 minute și se face
o singură dată:

## 1. Creează proiectul

1. Intră pe [console.firebase.google.com](https://console.firebase.google.com)
   cu un cont Google → **Add project** → nume: `atc-toolkit` (sau ce vrei).
   Google Analytics poate rămâne dezactivat.
2. În proiect: **Build → Authentication → Get started**, apoi în tabul
   **Sign-in method** activează:
   - **Email/Password** (pentru conturile cafenelelor), și, în același panou,
   - **Email link (passwordless sign-in)** (pentru emailurile de activare ale
     bariștilor).
3. Tot în **Authentication → Settings → Authorized domains**, adaugă:
   `toolkit.aroundthecorner.ro` (și `arthurteut.github.io` dacă folosești și
   adresa GitHub Pages).
4. **Build → Firestore Database → Create database** → mod „production" →
   regiunea `europe-west1` (sau alta din Europa).
5. În **Firestore → Rules**, șterge conținutul și lipește integral fișierul
   [`firestore.rules`](firestore.rules) din acest repo → **Publish**.

## 2. Leagă aplicația

1. În **Project settings (rotița) → General → Your apps → Add app → Web**
   (`</>`), nume `toolkit`, fără hosting.
2. Copiază obiectul `firebaseConfig` afișat.
3. Deschide [`assets/firebase-config.js`](assets/firebase-config.js) din repo
   și înlocuiește `null` cu obiectul copiat (instrucțiunile sunt în fișier).
4. Commit + push → site-ul se actualizează; aplicația detectează configurarea
   și afișează singură panoul de cont.

## 3. (Opțional) Personalizează emailul de activare

**Authentication → Templates → Email address sign-in** — aici poți schimba
textul emailului pe care îl primesc bariștii invitați (subiect, expeditor).

## Cum funcționează pentru cafenele

- **Cafeneaua** își creează cont în aplicație (nume cafenea + email + parolă).
  Contul devine automat administratorul cafenelei.
- **Adminul invită bariștii** din secțiunea „Cine e la bar?": nume + email →
  baristul primește un **email de activare** cu un link; când îl deschide,
  contul i se activează și intră direct în echipa cafenelei.
- **Registrul și statisticile** sunt comune pentru toată echipa cafenelei —
  fiecare calcul salvat e semnat de baristul conectat, de pe orice dispozitiv.
- Adminul poate scoate bariști din echipă; fiecare cafenea își vede doar
  propriile date (impus de regulile Firestore, nu doar de interfață).

## Domeniul

`CNAME` din repo e setat pe `toolkit.aroundthecorner.ro`. În DNS-ul domeniului
`aroundthecorner.ro`, adaugă o înregistrare:

```
CNAME  toolkit  →  arthurteut.github.io
```

apoi în GitHub **Settings → Pages** verifică domeniul custom și bifează
**Enforce HTTPS** (după ce se emite certificatul, câteva minute).
