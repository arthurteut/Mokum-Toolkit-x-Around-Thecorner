# Mokum × Around The Corner — Barista Hub

Site-ul are două pagini:

- **`index.html`** — landing-ul public premium: prezentarea toolkit-ului pentru
  proprietarii de cafenele și bariști, cu demo live, cele 9 tool-uri, pași de
  start și FAQ. Către această pagină direcționezi cafenelele.
- **`app.html`** — aplicația propriu-zisă (toolkit-ul complet).
- **`heat.html`** — jurnalul de bonuri al echipei Heat, în identitatea vizuală Heat.

Pentru publicare: GitHub Pages (Settings → Pages → branch → root); landing-ul
se servește automat ca pagină principală, iar aplicația la `/app.html`.

Aplicația internă **Around The Corner** pentru bariștii Mokum, construită în
jurul toolkit-ului avansat de preparare a cafelei: calculatoarele din tabelele
Excel, rescrise ca web app brand-uită Around The Corner, cu profile de bariști
și istoric al completărilor.

## Tabelele toolkit-ului

1. **Randament de extracție** — solver pentru TDS ↔ masă băutură ↔ doză ↔ EY, cu verdict pe fereastra de extracție 18–22%.
2. **Diluție** — diluție țintă (câtă apă adaugi pentru tăria dorită) și post-diluție (ce tărie obții după apa adăugată).
3. **Calculatoare avansate** — masa reală a băuturii la imersie și doza efectivă (corecție umiditate + CO₂).
4. **Calculator de lapte** — compoziția completă a băuturii finale (solubile, grăsime, lactoză, proteine, apă) și tăria totală.
5. **Degustare TDS** — exercițiul celor 10 cești: tabelul de apă per ceașcă pentru pași egali de tărie.
6. **Echilibru termic** — temperatura de echilibru apă + măcinătură.
7. **Calculatorul de apă** — LSI (indicele Langelier, la 95/125 °C și temperatura aleasă), remineralizare cu concentrate (sare Epsom + bicarbonat) și conversia analizei minerale de pe eticheta apei îmbuteliate în GH/KH.

## Heat · jurnal de bonuri (research concurență)

Pagina **`heat.html`** e jurnalul echipei Heat (brand Nashville hot chicken creat de Around The Corner), în identitatea vizuală Heat din brand guidelines: Red Heat `#611923`, Black Rap `#0D0D0D`, Yellow Chicken `#F0B823`, Cream Heat `#F8F9F3`; Barlow Condensed (echivalent gratuit pentru Acumin ExtraCondensed) și Permanent Marker (pentru accentele graffiti Subway); logo-urile extrase din ghid sunt în `assets/heat/`. La fiecare vizită la un concurent se trec datele de pe bon — concurent, locație, dată și oră, nr. bon, casa de marcat, nr. raport Z, total, metoda de plată, produsele cu prețuri și observații (coadă, clienți în local, timp de așteptare, notă). Programul locației și tipul de numerotare se completează automat după prima vizită.

Analizele se calculează live, filtrabile pe concurent și perioadă:

- **Estimare vânzări** — din diferența numerelor de bon: bonuri/oră (două vizite în aceeași zi), bonuri/zi (numerotare continuă, împărțită la zilele din raportul Z, sau numerotare zilnică + program), încasări/zi și ~lunar (bonuri/zi × bonul mediu).
- **Tipare pe timp** — hartă de căldură zi a săptămânii × oră, bonuri/oră pe ore, bonuri/zi pe zile ale săptămânii și pe luni.
- **Comparație** — clasamentul locațiilor și tabel cu bon mediu, încasări, card vs. cash, coadă, așteptare, notă.
- **Prețuri** — ultimul preț văzut pe produs și concurent, cu cel mai mic evidențiat și modificările de preț.
- **Jurnal** — toate bonurile, cu export CSV (se deschide direct în Excel).

Bonurile și profilurile stau în același registru ca toolkit-ul: local pe dispozitiv (aceleași profiluri), sau partajat în contul cafenelei (`cafes/{id}/receipts` — necesită regulile actualizate din `firestore.rules`). Cine e conectat în toolkit e conectat automat și pe `heat.html`.

Secțiunea **Statistici** arată completările per barist (clasament cu bare, defalcare pe tabele, ultima activitate), calculate live din registru.

## Profile & istoric

- **Profile de bariști** — creezi profiluri (nume + rol); profilul activ semnează fiecare calcul.
- **Istoricul completărilor** — fiecare „Salvează în istoric" păstrează intrarea cu barist, dată/oră și valorile calculului; filtrabil pe barist și pe tabel. Datele stau în `localStorage`, pe dispozitivul barului.

## Branding

Site-ul e brand-uit exclusiv **Around The Corner**: logo-ul oficial, paleta
verde-oliv (`#50534A`) + alb și fontul Avenir Next LT Pro (subset WOFF2,
încorporat în pagină). Fără branding de terți.

## Rulare

Un singur fișier, fără dependențe — totul (fonturi, logo) e încorporat:

```bash
python3 -m http.server 8000
# apoi deschide http://localhost:8000
```

Sau deschide `index.html` direct în browser. Poate fi publicat pe GitHub Pages.
