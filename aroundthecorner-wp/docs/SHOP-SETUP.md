# Shop, Stripe și Academie pe WordPress

Ordinea recomandată, pe un site cu backup făcut (ideal pe staging). Toate pluginurile de mai jos
sunt gratuite, dacă nu scrie altfel.

## 1. WooCommerce

1. **Module → Adaugă** → „WooCommerce” → Instalează → Activează. Parcurge asistentul:
   - Țara: **România**, moneda: **RON (lei)**, industria: *Food & drink* / *Other*.
   - Sari peste extensiile propuse (Jetpack, MailPoet etc.); le poți adăuga ulterior.
2. **WooCommerce → Setări → General:** adresa firmei, vânzare în România (și UE, dacă vrei),
   format preț `1.234,00 lei` (separator mii `.`, zecimale `,`, poziție *dreapta cu spațiu*).
3. **Taxe:** activează taxele și pune TVA-ul standard (21% de la 1 august 2025). Cursurile și
   consultanța pot avea alt regim; **confirmă cotele cu contabilul**.
4. **Livrare:** zona „România”:
   - *Curier* (tarif fix sau gratuit peste un prag) pentru accesorii și consumabile;
   - *Ridicare personală*;
   - espressoarele profesionale nu trec prin coș (vezi „Cere ofertă”), deci nu au nevoie de tarif.
5. **Pagini legale** (obligatorii în România): Termeni și condiții, Politica de retur (14 zile, cf.
   OUG 34/2014), Politica de confidențialitate (GDPR), Cookies, plus pictogramele **ANPC SAL** și
   **SOL** în subsol, cu link. Pentru cursurile cu dată fixă stabilește clar politica de anulare și
   verifică cu un jurist dacă excepția de la dreptul de retragere se aplică.

## 2. Stripe (plata cu cardul)

1. **Module → Adaugă** → „WooCommerce Stripe Payment Gateway” (de la WooCommerce) → Activează.
2. **WooCommerce → Setări → Plăți → Stripe → Conectează-te la Stripe**: îți creezi sau conectezi
   contul Stripe (date firmă, IBAN). Stripe acceptă firme din România și plătește în RON.
3. Activează metodele: **Card**, **Apple Pay / Google Pay** (butoane express pe pagina de produs și în
   coș) și, opțional, Revolut Pay / Link.
4. Rămâi întâi în **Test mode**: plasează o comandă cu cardul de test `4242 4242 4242 4242`,
   orice dată din viitor, orice CVC. Verifică emailurile primite de client și de tine.
5. Webhook-urile se configurează automat la conectare. În Stripe Dashboard → *Developers → Webhooks*
   trebuie să vezi endpoint-ul site-ului cu statusul *Enabled*.
6. Treci pe **Live mode** și fă o comandă reală mică (o poți rambursa din Stripe).

## 3. Facturi și e-Factura

Din 2025, facturile către persoane fizice trebuie și ele raportate în **e-Factura (ANAF SPV)**.
Leagă WooCommerce de programul de facturare:

- **SmartBill**: pluginul oficial „SmartBill Facturare și Gestiune”, sau
- **Oblio**: pluginul oficial „Oblio.eu”.

Amândouă emit automat factura la plata comenzii, o trimit pe email clientului și o transmit în
SPV. Setează seria de facturi și cota de TVA din pluginul ales.

## 4. Produsele din shop

### Categorii

`Espressoare` · `Râșnițe` · `Lapte & tampare` · `Accesorii` · `cursuri` (slug exact `cursuri`) ·
opțional `la-cerere`.

### Echipamente profesionale: „Cere ofertă”

Lași **prețul gol** (sau pui produsul și în categoria `la-cerere`, dacă vrei să afișezi un preț
orientativ). Tema schimbă automat butonul în **„Cere ofertă”**, care duce la
`/contact/?produs=Numele produsului`, și adaugă sub el nota despre preț de partener, leasing și
închiriere. Produsul nu poate fi pus în coș.

> Ca formularul de contact să preia produsul: în Elementor Pro → *Form* → câmp *Hidden* →
> *Advanced → Default Value → Request Parameter* → `produs`.

### Accesorii și consumabile: cumpărare directă

Produs simplu, cu preț și stoc. Merge prin coș și se plătește prin Stripe.

Pozele de produs pe fundal alb se „topesc” în cardurile crem din temă. Le poți refolosi pe cele
din pagina actuală `/equipments/`.

## 5. Academie: ateliere cu dată și locuri

Fiecare curs e **un produs variabil**, iar fiecare sesiune e o variație.

1. **Produse → Adaugă**: „Tehnici de barista · Începător”, categoria **cursuri**, tip **Produs variabil**.
2. **Atribute → Atribut personalizat:** nume `Data`, valori separate prin `|`:
   `15.11.2026 · București | 29.11.2026 · Cluj-Napoca`. Bifează *Folosit pentru variații*.
   **Data la început, în formatul `ZZ.LL.AAAA`**: după ea se sortează lista și se ascund sesiunile trecute.
3. **Variații → Creează variații din toate atributele.** Pentru fiecare: preț, *Gestionează stocul*
   bifat, **stoc = numărul de locuri** (de ex. 8).
4. Gata. Stocul scade la fiecare rezervare. Pe pagină apare „8 locuri disponibile”, iar la 0 locuri
   „Sesiune completă”.

**Lista de sesiuni** se pune oriunde cu widget-ul *Shortcode* din Elementor:

| Shortcode | Ce afișează |
|---|---|
| `[atc_cursuri]` | toate sesiunile viitoare, sortate după dată |
| `[atc_cursuri limit="5"]` | doar următoarele 5 (pentru pagina Acasă) |
| `[atc_cursuri curs="tehnici-de-barista-incepator"]` | sesiunile unui singur curs (slug sau ID) |
| `[atc_cursuri trecute="da"]` | include și sesiunile trecute |

Butonul „Rezervă loc” pune sesiunea direct în coș. Când nu mai e nicio sesiune viitoare, apare un
mesaj cu link spre contact.

> Ai nevoie de numele fiecărui participant când cineva rezervă mai multe locuri? Adaugă un câmp la
> checkout cu pluginul gratuit „Checkout Field Editor for WooCommerce”.

## 6. Academie: cursuri video (Tutor LMS)

1. **Module → Adaugă** → „Tutor LMS” → Activează. În asistent alege *Individual* (un singur instructor).
2. **Tutor LMS → Setări → Monetizare → eCommerce engine: WooCommerce.** Plata trece prin același
   coș și același Stripe, iar factura pleacă prin SmartBill/Oblio.
3. **Cursuri → Adaugă:** titlu, descriere, imagine, apoi *Course Builder*: topicuri și lecții.
   Videoclipurile le găzduiești pe **Vimeo** (recomandat, poți bloca descărcarea și încorporarea pe
   alte site-uri), Bunny Stream sau YouTube *Unlisted*.
4. La *Pricing*: **Paid** → Tutor creează sau leagă produsul WooCommerce.
5. Lista de cursuri: widget-ul *Tutor Course List* în Elementor sau shortcode-ul `[tutor_course]`.
   Culorile Tutor preiau automat brandul din temă.

## 7. Paginile shop-ului în Elementor Pro

**Templates → Theme Builder:**

- **Product Archive** (`/shop/` și categoriile): hero scurt (`atc-split`), filtre pe categorii, widget
  *Archive Products* cu `atc-stagger`.
- **Single Product:** galerie (`atc-mask`), titlu, preț, *Add to Cart*, descriere, *Upsells*
  cu `atc-stagger`. Pentru cursuri: un *Shortcode* `[atc_cursuri curs="..."]` sub descriere.
- **Cart / Checkout / My Account:** lasă-le simple. Pe ele scroll-ul fin e oprit automat, ca
  formularele să meargă normal.

## Lista finală înainte de lansare

- [ ] Comandă test completă în Live mode: produs + curs + curs video, plus rambursare.
- [ ] Factura a ajuns pe email și apare în SmartBill/Oblio și în SPV.
- [ ] Emailurile WooCommerce traduse și brand-uite (*WooCommerce → Setări → Emailuri*, culoare `#25332c`).
- [ ] Pagini legale, ANPC SAL/SOL, banner de cookies (de ex. „Complianz”, gratuit).
- [ ] Redirecturile 301 din [ARHITECTURA.md](ARHITECTURA.md).
- [ ] Viteza: cache (pluginul hostingului sau „LiteSpeed Cache”), poze WebP.
- [ ] Testat pe telefon: meniu, coș, checkout, Apple Pay / Google Pay.
