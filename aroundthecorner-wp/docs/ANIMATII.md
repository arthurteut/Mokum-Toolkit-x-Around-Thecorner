# Animațiile în Elementor (pluginul ATC Motion)

Pui o **clasă CSS** pe un element, iar pluginul îl animă. Nimic altceva de instalat.

- **Clasa:** selectezi elementul (widget, container) → **Advanced → CSS Classes** → scrii clasa.
  Mai multe clase se despart prin spațiu: `atc-mask atc-delay-2`.
- **Opțiunile** (`data-atc-…`): **Advanced → Attributes** (Elementor Pro), câte una pe rând,
  în formatul `cheie|valoare`, de exemplu `data-atc-speed|0.3`.
- **În editorul Elementor animațiile sunt oprite**, ca să poți edita liniștit. Le vezi pe pagina
  publicată (*Preview* sau pagina live).
- Vizitatorii care au activat „reduce motion” în sistem văd pagina statică. Dacă JavaScript-ul nu
  pornește, conținutul apare oricum după 4 secunde.

> **Nu combina** clasele ATC cu *Motion Effects* sau *Entrance Animation* din Elementor pe
> **același** element: se bat cap în cap. Folosește-le pe unele, sau pe celelalte.

## Efectele

### Apariții

| Clasă | Unde o pui | Ce face |
|---|---|---|
| `atc-reveal` | orice widget sau container | Apare cu fade și glisare de jos. Variante: `atc-reveal--left`, `atc-reveal--right`, `atc-reveal--scale`. |
| `atc-delay-1` … `atc-delay-9` | împreună cu altă clasă | Întârzie animația cu 0,1 … 0,9 s. |
| `atc-stagger` | un container | Copiii lui apar pe rând. Ritmul: `data-atc-stagger\|0.15`. |
| `atc-mask` | widget *Image* sau containerul pozei | Poza e dezvăluită de o cortină, cu zoom-out. `atc-mask--left` pentru cortină laterală. |

### Text

| Clasă | Unde o pui | Ce face |
|---|---|---|
| `atc-split` | widget *Heading* | Titlul urcă linie cu linie din spatele unei măști. |
| `atc-split--words` / `atc-split--chars` | împreună cu `atc-split` | Pe cuvinte sau literă cu literă (chars e cel mai „wow”; folosește-l pe titluri scurte). |
| `atc-split--instant` | împreună cu `atc-split` | Pornește imediat după încărcare, fără să aștepte scroll-ul. Pentru hero. |
| `atc-scrub-text` | widget *Text Editor* sau *Heading* | Cuvintele se „aprind” pe măsură ce derulezi. Ideal pentru manifest. |
| `atc-counter` | widget *Heading* cu o cifră | Cifra se numără de la 0: „250”, „−25%”, „±1 g”, „4 L/min”. Durata: `data-atc-duration\|2`. |

### Scroll cinematic

| Clasă | Unde o pui | Ce face |
|---|---|---|
| `atc-parallax` | widget *Image* | Poza se mișcă mai lent decât pagina. `atc-parallax--slow` / `--fast` sau `data-atc-speed\|0.3` (negativ = sens invers). `atc-parallax--self` mișcă tot blocul. |
| `atc-zoom` | widget *Image* | Zoom-out lent cât poza traversează ecranul. `data-atc-from\|1.3`. |
| `atc-hero-out` | containerul hero | La ieșire, hero-ul se micșorează și se estompează. |
| `atc-pin` | o secțiune | Secțiunea stă pe loc, iar elementele cu `atc-pin-step` din ea apar pe rând. Cu `atc-pin--replace`, fiecare pas îl înlocuiește pe cel dinainte. |
| `atc-expand` | o secțiune full-height | Poza din `atc-expand__media` crește din card până pe tot ecranul; textele `atc-expand__text` apar la final. |
| `atc-stack` | containerul cu carduri | Cardurile se suprapun la scroll (metoda pe pași). Distanța de sus: `data-atc-top\|96`. **Dă cardurilor aceeași înălțime** (*Min Height* identic), altfel cele mai înalte se văd pe sub cele următoare. |
| `atc-hscroll` | secțiunea | Galerie orizontală fixată. Containerul interior (direcție *Row*, *Wrap: No wrap*) primește `atc-hscroll__track`. Pe telefon devine o bandă cu swipe. |
| `data-atc-bg` | atribut pe secțiune | `data-atc-bg\|#25332c` și opțional `data-atc-fg\|#f8f7f0`: fundalul paginii trece lin la această culoare. Lasă fundalul secțiunii transparent. |

### Interacțiuni

| Clasă | Unde o pui | Ce face |
|---|---|---|
| `atc-marquee` | un container cu logo-uri sau text | Bandă infinită care accelerează la scroll și își schimbă sensul. `atc-marquee--reverse`, `data-atc-duration\|30`. |
| `atc-magnetic` | widget *Button* | Butonul e atras de cursor. |
| `atc-tilt` | card (container) | Se înclină 3D după mouse. `data-atc-tilt\|7`. |
| `atc-steam` | containerul unei poze cu ceașcă | Abur animat peste poză. Poziția: `data-atc-steam-x\|0.5`, `data-atc-steam-y\|0.7`. |
| `atc-draw` | widget *HTML* cu un SVG | Liniile se desenează la scroll. |
| `data-atc-cursor` | atribut pe link sau card | Cu cursorul custom pornit, afișează un text peste element: `data-atc-cursor\|Vezi`. |

## Rețete

**Hero ca în prototip**

1. Container (full width, fundal transparent) cu clasa `atc-hero-out` și atributul `data-atc-bg|#25332c`.
2. *Heading* H1: „We create third spaces that people want to be part of.” → `atc-split atc-split--instant`.
3. Container inner, 3 coloane, cu 3 widget-uri *Image* (proporție 9:13) → `atc-mask atc-delay-2`, `atc-mask atc-delay-3 atc-steam`, `atc-mask atc-delay-4`.

**Banda de logo-uri**

Container *Row, No wrap*, cu 5 widget-uri *Image* (logo-uri) → clasa `atc-marquee` pe container.
Distanța dintre logo-uri: în *Custom CSS* al containerului, `selector { --atc-marquee-gap: 80px; }`.

**Galeria orizontală (studiu de caz)**

1. Container (full width, *Height: 100vh*) → `atc-hscroll`.
2. În el, un container *Row, No wrap, Width: auto* → `atc-hscroll__track`.
3. În track: poze cu înălțime fixă (de ex. 60vh) și carduri de text cu lățime fixă (360px).

## Performanță

- Folosește poze **WebP** de cel mult 1600px pe latura mare (Elementor → Settings → Performance).
- Nu pune mai mult de 2–3 efecte „grele” (`atc-pin`, `atc-expand`, `atc-hscroll`, `atc-stack`) pe aceeași pagină.
- Dacă un efect pare decalat după ce se încarcă pozele, pornește **Markeri de depanare** din
  Setări → ATC Motion: vezi exact unde începe și se termină fiecare animație (doar tu, ca admin).
- Din consolă: `ATCMotion.refresh()` recalculează pozițiile.
