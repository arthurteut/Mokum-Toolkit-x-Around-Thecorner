# Paginile de intrare: `/` și `/acasa/`, animate

Cele două pagini rămân cum sunt (designul, textele, pozele). Primesc doar animații din pluginul
**ATC Motion** și, pe `/acasa/`, două plăci noi: **Academie** și **Shop**.

Prototipul lor: `prototype/index.html` (pagina 1) și `prototype/acasa.html` (pagina 2).

## Ce se întâmplă

**Pagina 1 (`/`)**

1. Trei benzi verzi acoperă cele trei poze și se ridică pe rând, una pentru fiecare coloană.
2. Fotografia intră cu un zoom-out lent și se mișcă ușor după mouse.
3. Peste ceștile din dreapta se ridică abur.
4. Banda cu logo-ul și banda „Find out more” alunecă din stânga.
5. Titlul urcă cuvânt cu cuvânt.
6. Săgeata „→” se mișcă din când în când, iar butonul e atras de cursor.
7. La click, trei benzi verzi închid pagina și se deschid pe `/acasa/`.

**Pagina 2 (`/acasa/`)**

1. Benzile se ridică, iar fundalul cu espresso trece din încețoșat în focus, cu zoom-out.
2. Plăcile intră pe rând cu o rotire 3D, iconițele „sar”, iar textele urcă.
3. La hover, o lumină aurie urmărește mouse-ul pe placă, iconița se ridică și conturul devine auriu.
4. Mai jos: logo-ul auriu crește, textul de prezentare urcă linie cu linie, meniul apare pe rând.
5. „AROUND THE CORNER” se scrie literă cu literă la final, iar butonul WhatsApp urcă de jos.

## Pașii în WordPress

### 0. Pregătire

1. Instalează și activează pluginul (`dist/atc-motion.zip`).
2. **Setări → ATC Motion:** bifează *Scroll fin* și **Tranziții între pagini**. Lasă *Preloader*
   debifat: intrarea o face pagina 1.
3. **Scoate scriptul vechi de tranziție.** Acum ai în site un bloc *HTML* care începe cu
   `document.addEventListener("DOMContentLoaded", function () { document.body.classList.add('fade-in');`.
   Fie e un widget *HTML* în footer, fie e în *Elementor → Custom Code*. Șterge-l (sau dezactivează-l),
   altfel cele două tranziții se bat cap în cap.
4. Pe elementele de mai jos, **scoate animațiile Elementor** (*Advanced → Motion Effects → Entrance
   Animation: None* și *Scrolling Effects: Off*). Acum au `fadeInDown` / `fadeIn`.

Clasele se pun în **Advanced → CSS Classes**. Atributele, în **Advanced → Attributes**, câte unul pe
rând, `cheie|valoare`. Site-ul are secțiuni separate pentru desktop și pentru mobil, așa că pune
clasele pe **ambele** variante.

### 1. Pagina „First” (`/`)

| Element | CSS Classes | Attributes |
|---|---|---|
| Secțiunea cu fotografia în trei coloane | `atc-curtain atc-bg-zoom atc-bg-zoom--drift atc-steam` | `data-atc-strips\|3` · `data-atc-from\|1.18` · `data-atc-steam-x\|0.84` · `data-atc-steam-y\|0.6` |
| Banda de sus, cu logo-ul | `atc-reveal atc-reveal--left atc-delay-8` | |
| Titlul „We create third spaces…” | `atc-split atc-split--words atc-split--instant atc-delay-9` | |
| Banda cu „Find out more” | `atc-reveal atc-reveal--left atc-delay-9` | |
| Butonul / linkul „Find out more” | `atc-magnetic` | |

> Fotografia rămâne fundalul secțiunii, setat în Elementor. Pluginul o mută singur într-un strat care
> poate face zoom, fără să schimbi nimic la fundal.

### 2. Pagina „Acasa” (`/acasa/`)

| Element | CSS Classes | Attributes |
|---|---|---|
| Secțiunea cu fundalul espresso | `atc-bg-zoom atc-bg-zoom--focus atc-bg-zoom--drift` | `data-atc-blur\|3` (cât de încețoșat rămâne fundalul; `0` = clar) |
| Logo-ul din stânga sus | `atc-reveal atc-delay-3` | |
| Secțiunea interioară cu plăcile | `atc-tiles atc-delay-4` | |
| Logo-ul auriu „A” de jos | `atc-reveal atc-reveal--scale` | |
| Textul „Around The Corner oferă consultanță…” | `atc-split` | |
| Meniul (About · Development · …) | `atc-reveal` | |
| Iconițele WhatsApp / telefon / email | `atc-stagger` (pe containerul lor) | |
| Textul mare „AROUND THE CORNER” | `atc-split atc-split--chars` | |

**Hover-ul plăcilor:** coloanele plăcilor au deja colțuri rotunjite și fundal de sticlă. Ca să
apară și conturul auriu la hover, adaugă în *Advanced → Custom CSS* al secțiunii cu plăcile:

```css
selector .atc-tile { transition: border-color .4s ease; border: 1px solid rgba(255,255,255,.13); }
selector .atc-tile:hover { border-color: rgba(235,187,77,.55); }
```

### 3. Cele două plăci noi

1. În secțiunea cu plăcile, **duplică** o coloană (click dreapta → *Duplicate*) de două ori.
2. Placa 7: iconița Academie, textele **ÎNVĂȚ** / **LA ACADEMIE**, link `/academie/`.
   Placa 8: iconița Shop, textele **CUMPĂR** / **DIN SHOP**, link `/shop/`.
   Linkul se setează exact ca la celelalte plăci (*PowerPack → Wrapper Link* pe coloană).
3. Iconițele: `prototype/img/icons/academie.svg` și `shop.svg`, desenate în același stil (linie
   aurie `#ebbb4d`). Le urci în *Media* (pentru SVG îți trebuie pluginul „Safe SVG”) sau le pui
   într-un widget *HTML*.
4. **Așezarea:** pe desktop, 4 plăci pe rând (lățimea coloanei **25%**), adică 2 rânduri. Pe mobil
   rămân 2 pe rând (**50%**).
5. Opțional, eticheta „NOU”: un widget *Heading* mic, cu fundal auriu, poziționat *Absolute* în
   colțul plăcii.

În meniul de jos, „Equipments” devine **Shop** (`/shop/`) și „Training” devine **Academie**
(`/academie/`). Paginile vechi trimit acolo prin redirecturile 301 din
[ARHITECTURA.md](ARHITECTURA.md).

## Verificare

- Deschide `/` într-o fereastră privată: benzile se ridică, apoi titlul urcă.
- Click pe „Find out more”: benzile închid pagina, iar pe `/acasa/` se ridică din nou.
- Pe `/acasa/`, ține mouse-ul pe o placă: apare lumina aurie.
- Pe telefon: plăcile intră la fel, iar hover-ul nu există (e normal).
- Dacă ceva nu apare, pornește *Markeri de depanare* din Setări → ATC Motion.
