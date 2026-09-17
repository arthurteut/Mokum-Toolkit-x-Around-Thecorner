# Mokum × Around The Corner — Barista Hub

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
