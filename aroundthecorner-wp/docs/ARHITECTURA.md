# Noua arhitectură aroundthecorner.ro

Structura **Servicii + Shop**: consultanța pentru cafenele rămâne în centru, iar Shop-ul și
Academia devin secțiuni de prim rang, cu plată online.

**Intrarea în site rămâne cea de acum:** pagina 1 (`/`, „We create third spaces”) și pagina 2
(`/acasa/`, plăcile), doar animate. Pe `/acasa/` se adaugă plăcile **Academie** și **Shop**. Restul
structurii (Metoda, Proiecte, Shop, Academie, Toolkit) sunt **pagini separate**. Rețeta pentru cele două
pagini e în [PAGINILE-DE-INTRARE.md](PAGINILE-DE-INTRARE.md).

## Harta site-ului

```
Intro  /                         ← pagina 1 actuală, animată (prototype/index.html)
Acasă  /acasa/                   ← pagina 2 actuală cu plăcile, animată + Academie și Shop (prototype/acasa.html)
│
├─ Deschidere cafenea            ← meniu cu 4 intrări
│   ├─ Prima cafenea             /primacafenea/        (există)
│   ├─ O nouă locație            /scaleup/             (există)
│   ├─ Complexe rezidențiale     /rezidential/         (există)
│   └─ Brunch & pizzerii         /brunch/ · /pizzerii/ (există)
│
├─ Metoda „7 steps ahead”        /development/         (există)
├─ Proiecte                      /projects/ + articolele de blog (studii de caz)
│
├─ Shop                          /shop/                (WooCommerce)
│   ├─ Espressoare               /categorie-produs/espressoare/
│   ├─ Râșnițe                   /categorie-produs/rasnite/
│   ├─ Lapte & tampare           /categorie-produs/lapte-tampare/
│   ├─ Accesorii & consumabile   /categorie-produs/accesorii/   ← cumpărare directă
│   └─ Coș · Checkout · Contul meu
│
├─ Academie                      /academie/            ← pagină nouă
│   ├─ Ateliere cu dată          produse din categoria „cursuri” + [atc_cursuri]
│   └─ Cursuri video             /cursuri/             (Tutor LMS)
│
├─ Toolkit                       → toolkit.aroundthecorner.ro (link extern)
├─ Jobs                          → coffeejobs.ro
└─ Contact                       /contact/             (formular „Cere ofertă” inclus)

Subsol: Blog · Termeni și condiții · Politica de retur · GDPR · ANPC SAL/SOL
```

**Păstrează slug-urile existente** (`/primacafenea/`, `/scaleup/`, `/training/` etc.): Google le
cunoaște deja. Pentru paginile care se mută, pune redirecturi 301 cu pluginul gratuit
**Redirection**:

| De la | La |
|---|---|
| `/equipments/` | `/shop/` |
| `/training/` | `/academie/` |
| `/acasa/`, `/home1/`, `/first/` | `/` |

## Meniul principal

`Deschidere cafenea ▾` · `Metoda` · `Proiecte` · `Shop` · `Academie` · `Toolkit` · **[Contact]** + iconița de coș.

În Elementor Pro: **Templates → Theme Builder → Header**. Folosește widget-ul *Nav Menu* și widget-ul
*Menu Cart* (iconița coșului). Header-ul transparent peste hero, care devine opac la scroll, se
setează din *Advanced → Motion Effects → Sticky: Top* plus *Sticky Header Effects* (pluginul e deja
instalat).

## Secțiunile din prototip (`prototype/sectiuni.html`)

Secțiunile de mai jos nu mai stau pe prima pagină. Fiecare devine pagina ei sau o parte dintr-o
pagină separată: „Ce construim” și „7 steps ahead” pe `/development/`, studiul de caz pe
`/projects/`, Shop pe `/shop/`, Academia pe `/academie/`, Toolkit și Contact unde ai nevoie de ele.
Fiecare rând arată ce pui în Elementor și ce clase primește (vezi [ANIMATII.md](ANIMATII.md)).
Fundalul fiecărei secțiuni îl poți lăsa transparent și seta prin atributul `data-atc-bg`: pagina
trece atunci lin dintr-o culoare în alta.

| # | Secțiune | Conținut | Clase / atribute |
|---|---|---|---|
| 1 | **Hero** | Eyebrow „Consultanță cafenele · Academie · Echipamente”, titlul „We create third spaces that people want to be part of.”, un paragraf, 3 poze verticale (bar, extracție, oameni) | container: `atc-hero-out` · titlu: `atc-split atc-split--instant` · poze: `atc-mask` + `atc-delay-2/3/4` · poza cu espresso: `atc-steam` · atribut `data-atc-bg\|#25332c` |
| 2 | **Third place** | O poză mare care crește din card până pe tot ecranul, cu titlul „A treia casă, între muncă și acasă.” | secțiune full-height: `atc-expand` · containerul pozei: `atc-expand__media` · textele: `atc-expand__text` |
| 3 | **Manifest** | Poza lui Arthur + paragraful din „About” | poză: `atc-mask` · paragraf: `atc-scrub-text` · buton: `atc-magnetic` |
| 4 | **Ce construim împreună** | 3 carduri: Deschidere cafenea · Academie · Echipamente, apoi un rând cu Brunch / Pizzerii / Pop-up / Rezidențial | titlu: `atc-split` · carduri: `atc-reveal` · poze: `atc-mask` · rândul de jos: `atc-stagger` |
| 5 | **7 steps ahead** | 8 carduri: 00 Audit, apoi Flow, Playbook, Equipments, Fiscal, Hiring, Training, Follow | containerul cardurilor: `atc-stack` + `data-atc-top\|96` |
| 6 | **Studiu de caz Brick by Brick** | Bandă orizontală: intro, poze, pașii 1–7, link la articol | secțiune: `atc-hscroll` · containerul interior (rând, fără wrap): `atc-hscroll__track` |
| 7 | **Cifre** | 250 băuturi/oră · −25% timp/băutură · +30% capacitate · ±1 g | titlu: `atc-split` · cifre: `atc-counter` |
| 8 | **Shop** | Banda cu logo-uri (La Marzocco, Modbar, Mahlkönig, Übermilk, PUQ Press) + 8 produse | logo-uri: `atc-marquee` · grila de produse (widget *Products*): `atc-stagger` · fiecare card: `atc-tilt` |
| 9 | **Academie** | Lista de ateliere cu date și locuri + cardul „Cursuri video” | widget *Shortcode* cu `[atc_cursuri limit="5"]` · card: `atc-reveal` · poză: `atc-zoom` |
| 10 | **Toolkit** | „Brew by numbers” + diagrama de extracție (SVG) + linkul spre toolkit, apoi banda coffeejobs.ro | SVG: `atc-draw` · buton: `atc-magnetic` |
| 11 | **Contact** | „Hai să dezvoltăm ceva autentic!”, butonul „Programează o discuție”, email, telefon | titlu: `atc-split atc-split--chars` · fundal `data-atc-bg\|#ddaf43` |
| 12 | **Subsol** | Textul uriaș „Around · The Corner · Third spaces” care curge, linkuri, GDPR, ANPC | text: `atc-marquee` |

## Paginile interioare

Toate urmează același ritm: **hero scurt** (titlu `atc-split` + o poză `atc-mask`), **conținut în
blocuri** care apar la scroll (`atc-reveal` / `atc-stagger`) și **CTA final** spre Contact sau Shop.

- **Prima cafenea / O nouă locație / Rezidențial:** modulele (Location, Concept, Flow, Playbook…)
  ca `atc-stack`, iar FAQ-ul ca *Accordion*.
- **Shop:** în *Theme Builder*, template-urile *Product Archive* și *Single Product*. Pe pagina de
  produs: galeria cu `atc-mask`, specificațiile și banda cu produse similare în `atc-stagger`.
- **Academie:** hero, `[atc_cursuri]` (toate sesiunile), apoi cursurile video (*Tutor LMS → Course
  List*) și partenerii (Origo Academy, Barista Hustle, Coffee Science Foundation).
- **Proiecte:** grilă de studii de caz (*Posts*, categoria „Case studies”) cu `atc-stagger`;
  fiecare studiu de caz poate primi un `atc-hscroll` cu pozele.

## Fonturi și culori

| Token | Valoare | Folosire |
|---|---|---|
| Verde închis | `#25332c` | fundaluri dark, text pe crem |
| Verde | `#3e4d45` | secțiunea Toolkit, hover |
| Verde-oliv | `#44554d` | logo, text secundar |
| Crem | `#f8f7f0` | fundal deschis |
| Nisip | `#eee0cb` | Academie, studii de caz |
| Auriu | `#ddaf43` | accent, CTA, cifre |

Fontul: **Avenir Next** (deja urcat în site): 900 cu majuscule pentru titluri, 400 pentru text.
Setează aceste culori și fonturi în **Elementor → Site Settings → Global Colors / Global Fonts**
(acum sunt cele implicite din Elementor), ca să le folosești peste tot dintr-un clic.
