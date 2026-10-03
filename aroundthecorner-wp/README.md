# aroundthecorner.ro: animații, noua arhitectură și shop

Tot ce trebuie ca să transformi site-ul WordPress actual (Elementor Pro + Hello
Elementor) într-un site cinematic cu shop de echipamente și Academie, plătite cu
cardul prin Stripe.

| Folder | Ce este |
|---|---|
| [`plugins/atc-motion/`](plugins/atc-motion) | Plugin WordPress: animații cinematice (GSAP + ScrollTrigger + SplitText + scroll fin Lenis), pornite prin clase CSS din Elementor. Are pagină de setări în **Setări → ATC Motion**. |
| [`themes/atc-child/`](themes/atc-child) | Child theme pentru Hello Elementor: paleta și fontul brandului, stiluri pentru WooCommerce și Tutor LMS, butonul „Cere ofertă” și shortcode-ul `[atc_cursuri]` pentru sesiunile de curs cu locuri limitate. |
| [`prototype/`](prototype) | Prototipul: `index.html` și `acasa.html` sunt cele două pagini de intrare de acum, animate; `sectiuni.html` are modelele pentru paginile separate (Metoda, Proiecte, Shop, Academie, Toolkit). |
| [`docs/`](docs) | Ghidurile: [paginile de intrare `/` și `/acasa/`](docs/PAGINILE-DE-INTRARE.md), [arhitectura site-ului](docs/ARHITECTURA.md), [animațiile în Elementor](docs/ANIMATII.md), [shop + Stripe + Academie](docs/SHOP-SETUP.md). |
| [`dist/`](dist) | Arhivele `.zip` gata de urcat în WordPress. |

## Instalare, pe scurt

1. **Fă un backup** complet al site-ului (UpdraftPlus sau backup-ul hostingului). Ideal, lucrezi pe o
   copie de staging, dacă hostingul oferă.
2. **Temă:** WordPress → Aspect → Teme → Adaugă → Încarcă → `dist/atc-child.zip` → Activează.
   Hello Elementor rămâne instalată (e tema părinte); paginile Elementor nu se schimbă.
3. **Plugin:** Module → Adaugă → Încarcă → `dist/atc-motion.zip` → Activează.
   Apoi **Setări → ATC Motion**: alegi scroll fin, bară de progres, cursor, preloader.
4. **Shop și Academie:** urmezi [`docs/SHOP-SETUP.md`](docs/SHOP-SETUP.md) (WooCommerce, Stripe,
   SmartBill/Oblio, Tutor LMS).
5. **Paginile de intrare** (`/` și `/acasa/`): pui clasele din
   [`docs/PAGINILE-DE-INTRARE.md`](docs/PAGINILE-DE-INTRARE.md) și adaugi plăcile Academie și Shop.
6. **Paginile noi:** le construiești în Elementor după [`docs/ARHITECTURA.md`](docs/ARHITECTURA.md),
   punând clasele din [`docs/ANIMATII.md`](docs/ANIMATII.md).

## Prototipul

Deschide `prototype/index.html` printr-un server local (fonturile și scripturile se încarcă relativ):

```bash
cd aroundthecorner-wp
python3 -m http.server 8000
# apoi http://localhost:8000/prototype/  (intro → Find out more → /acasa → plăci)
```

Prototipul folosește exact fișierele pluginului (`plugins/atc-motion/assets/`), deci ce vezi acolo e
ce primești în WordPress.

## Reconstruirea arhivelor

```bash
cd aroundthecorner-wp
./tools/build-zips.sh
```

## Licențe

GSAP (inclusiv ScrollTrigger și SplitText) e gratuit și pentru uz comercial, sub
[licența standard GSAP](https://gsap.com/standard-license). Lenis e MIT. Codul pluginului și al temei
e GPL-2.0-or-later, ca WordPress.
