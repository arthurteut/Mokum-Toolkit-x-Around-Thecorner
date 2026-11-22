/* Groundwork v0.3: wizard premium, pas de confirmare a conceptului, plan generat.
   Totul rulează în browser; răspunsurile stau în localStorage ("gw-v2").
   Generatorul capitolelor stă separat, în content.js. */

"use strict";

var GW_UNLOCKED = true; // v0.x: totul deschis; badge-urile PRO arată viitorul model freemium

var $ = function (id) { return document.getElementById(id); };

/* ── starea ──────────────────────────────────────────────────────────── */
var A = {};
try { A = JSON.parse(localStorage.getItem("gw-v2") || "{}"); } catch (e) { A = {}; }
function save() { try { localStorage.setItem("gw-v2", JSON.stringify(A)); } catch (e) {} }

/* cheia răspunsurilor: editările manuale din plan rămân valabile doar cât timp
   răspunsurile nu se schimbă */
function answersKey() {
  var o = {};
  Object.keys(A).forEach(function (k) {
    if (k !== "edits" && k !== "editsKey" && k !== "generated") o[k] = A[k];
  });
  return JSON.stringify(o);
}

/* ── sugestii la intro ───────────────────────────────────────────────── */
var SG = {
  name: ["Doza", "Origini", "La Filtru", "Primul Shot", "Tura de Dimineață", "Colțul Cald",
    "Apropo", "Pauza Bună", "Strada Nouă", "Undeva Aproape", "Ritual", "Boabe",
    "Partea Bună", "Dimineți", "Al Doilea Shot", "Pe Colț", "Crema", "Mers pe Jos"],
  idea: ["cu viennoiserie din cuptor propriu", "cu filter rotit lunar", "pentru oamenii care lucrează remote",
    "cu brunch de weekend", "cu bar la vedere și locuri puține", "cu boabe la raft de la prăjitori români",
    "pentru părinții din cartier", "cu abonament de cafea pentru birourile din zonă",
    "cu terasă spre stradă", "unde barista îți știe comanda", "cu prăjitorie proprie, la vedere",
    "deschisă de la 7 dimineața, pentru drumul spre birou"],
  zone: ["zonă de birouri", "cartier rezidențial", "centru istoric", "lângă universitate",
    "stradă comercială", "lângă parc"]
};
var sgOff = { name: 0, idea: 0, zone: 0 };

function renderIdeas(kind) {
  var box = $("sg-" + kind);
  if (!box) return;
  var pool = SG[kind], n = kind === "zone" ? pool.length : 5;
  var h = '<span class="lbl">Idei</span>';
  for (var i = 0; i < Math.min(n, pool.length); i++) {
    var v = pool[(sgOff[kind] + i) % pool.length];
    h += '<button type="button" class="idea-chip" data-v="' + v.replace(/"/g, "&quot;") + '">' + v + "</button>";
  }
  if (pool.length > n) h += '<button type="button" class="idea-more" data-more="' + kind + '">Altele &rarr;</button>';
  box.innerHTML = h;
  box.hidden = false;
}

function initIdeas() {
  ["name", "idea", "zone"].forEach(renderIdeas);
  document.addEventListener("click", function (e) {
    var more = e.target.closest(".idea-more");
    if (more) {
      var k = more.getAttribute("data-more");
      sgOff[k] = (sgOff[k] + 5) % SG[k].length;
      renderIdeas(k);
      return;
    }
    var chip = e.target.closest(".idea-chip");
    if (!chip) return;
    var box = chip.closest(".ideas"), v = chip.getAttribute("data-v");
    if (box.id === "sg-name") { $("i-name").value = v; $("i-name").closest(".field").classList.remove("miss"); }
    if (box.id === "sg-zone") { $("i-zone").value = v; }
    if (box.id === "sg-idea") {
      var t = $("i-idea");
      if (!t.value.trim()) t.value = "O cafenea " + v + ".";
      else t.value = t.value.trim().replace(/\.+$/, "") + ", " + v + ".";
    }
  });
}

/* ── configurația wizard-ului ────────────────────────────────────────── */
var STEPS = [
  {
    id: "format", kick: "step 1 · the format", short: "The Format", title: "What are we building?",
    lead: "Formatul decide aproape tot ce urmează: investiția, echipa, meniul, fluxul prin spațiu. E prima decizie, nu ultima.",
    panel: function () { return { art: "a35", stat: "60 – 120", sub: "clienți pe zi, realitatea primului an. Pe intervalul ăsta construim planul, nu pe 200+." }; },
    questions: [
      {
        id: "format", type: "single",
        h: "Formatul cafenelei",
        why: "De ce contează: un bar specialty trăiește din volum și viteză, o cafenea cu food din timpul petrecut la masă și bonul mai mare. <strong>Propunem cafenea cu food</strong>, pentru că partea de mâncare ridică bonul mediu și umple orele dintre vârfurile de cafea.",
        opts: [
          { v: "bar", label: "Bar specialty", small: "cafeaua e vedeta" },
          { v: "food", label: "Cafenea cu food", small: "cafea + bucătărie" },
          { v: "togo", label: "To-go / kiosk", small: "volum, viteză" },
          { v: "roastery", label: "Roastery café", small: "prăjitorie la vedere" }
        ],
        def: ["food"]
      },
      {
        id: "space", type: "nums",
        h: "Spațiul",
        why: "De ce contează: suprafața dictează investiția în amenajare (se calculează pe metru pătrat), locurile pun plafonul veniturilor din servirea la masă, iar terasa poate adăuga un sezon întreg de vânzări.",
        nums: [
          { id: "mp", label: "Suprafață (mp)", def: 60, min: 10 },
          { id: "seats", label: "Locuri la masă", def: 24, min: 0 },
          { id: "terrace", label: "Locuri la terasă", def: 0, min: 0 }
        ]
      },
      {
        id: "rentq", type: "nums",
        h: "Chiria lunară estimată",
        why: function () {
          return "De ce contează: chiria e cel mai nemilos cost fix, o plătești și în lunile proaste. Regula de sănătate: chiria plus utilitățile stau sub 15% din vânzări. Pentru spații stradale bune" + (A.city ? " în " + A.city : " în orașele mari") + ", reperul din 2026 e 90 – 140 lei/mp pe lună; negociază 1-2 luni fără chirie pe perioada amenajării.";
        },
        nums: [
          { id: "rent", label: "Chirie (lei / lună)", def: 7000, min: 0 }
        ]
      }
    ]
  },
  {
    id: "menu", kick: "step 2 · the menu", short: "The Menu", title: "What do we serve?",
    lead: "Meniul nu e o listă de produse, e promisiunea pe care o faci oaspetelui. Scurt și stăpânit bate lung și aproximativ.",
    panel: function () { return { art: "a31", stat: "+30 – 40%", sub: "atât poate adăuga food-ul bun la bonul mediu al unei vizite." }; },
    questions: [
      {
        id: "coffee", type: "single",
        h: "Programul de cafea",
        why: "De ce contează: espresso-ul aduce volumul, filtrul aduce identitatea și marja. <strong>Propunem espresso + filter</strong>: acoperi ambele momente fără să complici barul.",
        opts: [
          { v: "espresso", label: "Doar espresso bar" },
          { v: "both", label: "Espresso + filter" },
          { v: "filter", label: "Accent pe filter / slow" }
        ],
        def: ["both"]
      },
      {
        id: "roaster", type: "single",
        h: "De unde vine cafeaua",
        why: "De ce contează: prăjitorul îți dă nu doar boabele, ci și training, calibrare și uneori espressorul în comodat. <strong>Propunem o prăjitorie parteneră din România</strong>: boabe proaspete, drum scurt, relație directă; prăjirea proprie vine mai târziu, când volumul o justifică.",
        opts: [
          { v: "local", label: "Prăjitorie din România", small: "partener aproape" },
          { v: "import", label: "Prăjitor din străinătate", small: "identitate, logistică" },
          { v: "own", label: "Prăjire proprie", small: "control total" }
        ],
        def: ["local"]
      },
      {
        id: "altmilk", type: "single",
        h: "Lapte vegetal",
        why: "De ce contează: în specialty, laptele vegetal nu mai e un moft, e așteptare de bază. Taxa suplimentară pe el a devenit un semnal prost în ochii clienților fideli.",
        opts: [
          { v: "incl", label: "Inclus în preț" },
          { v: "fee", label: "Cu supliment" },
          { v: "no", label: "Doar lapte clasic" }
        ],
        def: ["incl"]
      },
      {
        id: "food", type: "single",
        h: "Partea de mâncare",
        why: "De ce contează: food-ul ridică bonul mediu și aduce clienți în orele moarte, dar fiecare treaptă în sus cere spațiu, oameni și autorizații în plus. <strong>Propunem viennoiserie și snacks</strong>: impact maxim pe bon cu complexitate minimă în operare.",
        opts: [
          { v: "none", label: "Fără food", small: "doar cafea" },
          { v: "viennoiserie", label: "Viennoiserie & snacks", small: "fără bucătărie caldă" },
          { v: "brunch", label: "Brunch light", small: "bucătărie mică" },
          { v: "lunch", label: "Bucătărie completă", small: "mic dejun + prânz" }
        ],
        def: ["viennoiserie"]
      }
    ]
  },
  {
    id: "position", kick: "step 3 · the position", short: "The Position", title: "Where do we sit in the market?",
    lead: "Prețul e cel mai vizibil mesaj de poziționare pe care îl trimiți. Trebuie să spună aceeași poveste ca spațiul, meniul și servirea.",
    panel: function () {
      var fw = A.p_fw || 20, seg = (A.segment || [])[0];
      if (seg === "mid" && (fw < 16 || fw > 24)) return { stat: lei(fw) + " e în afara benzii", sub: "mid-range înseamnă 16-24 lei pe flat white în 2026. Ori muți prețul, ori îți asumi alt segment." };
      if (seg === "premium" && fw < 22) return { stat: "Premium sub 22 lei?", sub: "prețul face parte din produs: sub 22 de lei, povestea premium nu se mai leagă." };
      if (seg === "value" && fw > 18) return { stat: lei(fw) + " pare scump", sub: "pentru segmentul accesibil, flat white-ul peste 18 lei va fi perceput ca scump." };
      return { stat: "16 – 24 lei", sub: "intervalul sănătos al unui flat white mid-range în orașele mari, în 2026. Prețul tău stă în bandă." };
    },
    questions: [
      {
        id: "segment", type: "single",
        h: "Segmentul de preț",
        why: "De ce contează: segmentul decide cine îți intră pe ușă și cât de des. <strong>Propunem mid-range</strong>: destul de sus cât să susțină calitatea specialty, destul de accesibil cât să suporte vizite zilnice, nu ocazionale.",
        opts: [
          { v: "value", label: "Accesibil" },
          { v: "mid", label: "Mid-range" },
          { v: "premium", label: "Premium" }
        ],
        def: ["mid"]
      },
      {
        id: "prices", type: "nums",
        h: "Prețurile de referință (lei)",
        why: "De ce contează: espresso-ul și flat white-ul sunt ancorele după care oaspeții îți judecă tot meniul, iar bonul mediu de food îți arată cât aduce bucătăria la fiecare vizită. Panoul din dreapta îți spune pe loc dacă prețul se potrivește cu segmentul ales.",
        nums: [
          { id: "p_esp", label: "Espresso", def: 14, min: 5 },
          { id: "p_fw", label: "Flat white", def: 20, min: 8 },
          { id: "p_food", label: "Bon mediu food", def: 25, min: 0 }
        ]
      }
    ]
  },
  {
    id: "service", kick: "step 4 · the service", short: "The Service", title: "How does service work?",
    lead: "Modul de servire stabilește ritmul zilei, numărul de oameni din tură și chiar arhitectura barului.",
    panel: function () { return { art: "a32", stat: "4 minute", sub: "ținta de la ușă la cafea în mână, în vârful dimineții." }; },
    questions: [
      {
        id: "service", type: "multi",
        h: "Canalele de servire",
        why: "De ce contează: fiecare canal adaugă venit, dar și complexitate în operare. <strong>Propunem tejghea + to-go</strong>: fluxul clasic specialty, rapid și cu echipă mică; restul se pot adăuga când există cerere dovedită.",
        opts: [
          { v: "counter", label: "Comandă la tejghea" },
          { v: "table", label: "Servire la masă" },
          { v: "togo", label: "To-go serios", small: "pahare, flux separat" },
          { v: "delivery", label: "Delivery", small: "Glovo / Tazz / Bolt" },
          { v: "preorder", label: "Pre-order în aplicație" }
        ],
        def: ["counter", "togo"]
      },
      {
        id: "hours", type: "single",
        h: "Programul",
        why: "De ce contează: cafeaua se vinde dimineața. O oră de deschidere târzie te costă exact vârful zilei, iar serile lungi costă ture suplimentare pe care food-ul trebuie să le justifice.",
        opts: [
          { v: "h717", label: "7:00 – 17:00", small: "ziua de cafea" },
          { v: "h818", label: "8:00 – 18:00" },
          { v: "h721", label: "7:00 – 21:00", small: "cere food & seri" }
        ],
        def: ["h717"]
      }
    ]
  },
  {
    id: "guests", kick: "step 5 · the guests", short: "The Guests", title: "Who are we serving?",
    lead: "Nu poți fi cafeneaua tuturor. Alege două, trei momente din zi pe care vrei să le câștigi, și construiește totul în jurul lor.",
    panel: function () { return { art: "a36", stat: "Brunch-ul de weekend", sub: "bonuri duble, timp lung la masă, alt fel de oaspete." }; },
    questions: [
      {
        id: "area", type: "single",
        h: "Profilul zonei",
        why: function () {
          return "De ce contează: zona îți scrie calendarul. Birourile mor în august și în weekend, zonele studențești mor vara, centrul are iarna lungă. Planul" + (A.zone ? " pentru " + A.zone : "") + " trebuie construit pe ritmul real al zonei, nu pe media anului.";
        },
        opts: [
          { v: "office", label: "Birouri", small: "luni-vineri, vârf dimineața" },
          { v: "residential", label: "Rezidențial", small: "cel mai stabil" },
          { v: "student", label: "Studențesc", small: "vara scade" },
          { v: "tourist", label: "Central / turistic", small: "vara duce iarna" }
        ],
        def: ["office"]
      },
      {
        id: "moments", type: "multi",
        h: "Momentele pe care le țintim",
        why: "De ce contează: fiecare moment are alt ritm, alt bon mediu și alte așteptări. <strong>Propunem dimineața în drum spre birou + remote workers + brunch de weekend</strong>: împreună acoperă toată săptămâna.",
        opts: [
          { v: "commute", label: "Dimineața, în drum", small: "6:30 – 9:30" },
          { v: "laptop", label: "Remote & laptop", small: "10:00 – 16:00" },
          { v: "social", label: "Întâlniri & social", small: "după-amiaza" },
          { v: "brunch", label: "Brunch de weekend" },
          { v: "family", label: "Familii & cartier" }
        ],
        def: ["commute", "laptop", "brunch"]
      },
      {
        id: "vibe", type: "single",
        h: "Atmosfera",
        why: "De ce contează: atmosfera decide cât stau oamenii și ce postează despre tine. Trebuie aleasă conștient, altfel o decid întâmplător boxele și mobila.",
        opts: [
          { v: "calm", label: "Calm & minimalist" },
          { v: "social", label: "Viu & social" },
          { v: "neighborhood", label: "De cartier, ca acasă" }
        ],
        def: ["social"]
      }
    ]
  },
  {
    id: "team", kick: "step 6 · the team", short: "The Team", title: "Who runs the place?",
    lead: "În primele luni, cafeneaua seamănă izbitor cu omul care stă cel mai mult în ea. Decide din start cine e omul ăla.",
    panel: function () { return { stat: "2 pe tură", sub: "minimul care ține calitatea în viață la orele de vârf. Un barista bun costă 8.000 – 11.000 lei pe lună, cost total angajator, în 2026." }; },
    questions: [
      {
        id: "founder", type: "single",
        h: "Rolul tău",
        why: "De ce contează: cel mai scump cost ascuns al unei cafenele noi e un fondator absent. <strong>Propunem barista-fondator</strong>: în primele 6 luni, prezența ta la bar e cel mai bun marketing și cel mai ieftin control de calitate.",
        opts: [
          { v: "barista", label: "Barista-fondator", small: "la bar zilnic" },
          { v: "manager", label: "Manager prezent", small: "conduci, nu faci cafea" },
          { v: "investor", label: "Investitor", small: "echipa duce tot" }
        ],
        def: ["barista"]
      },
      {
        id: "experience", type: "single",
        h: "Experiența ta în domeniu",
        why: "De ce contează: răspunsul schimbă planul de echipă și dosarul de finanțare. Banca și investitorii întreabă primii de experiență; lipsa ei nu blochează proiectul, dar cere un head barista cu vechime lângă tine, din prima zi.",
        opts: [
          { v: "none", label: "Prima afacere", small: "vin din alt domeniu" },
          { v: "barista", label: "Am lucrat la bar" },
          { v: "manager", label: "Am condus o locație" },
          { v: "owner", label: "Am mai avut o afacere" }
        ],
        def: ["none"]
      },
      {
        id: "staff", type: "nums",
        h: "Echipa de start",
        why: "De ce contează: la program de zi, un bar are nevoie de minimum două persoane pe tură ca să nu moară calitatea la vârf. Trei bariști plus fondatorul acoperă o săptămână întreagă fără epuizare.",
        nums: [
          { id: "baristas", label: "Bariști (fără tine)", def: 3, min: 0 }
        ]
      }
    ]
  },
  {
    id: "money", kick: "step 7 · the money", short: "The Money", title: "What are we working with?",
    lead: "Ultimul set de răspunsuri înainte de plan: banii. Fără cifre exacte încă, doar ordinele de mărime care decid ce fel de proiect construim.",
    panel: function () {
      var inv = investEstimate();
      return { stat: lei(inv.low) + " – " + lei(inv.high), sub: "investiția estimată pentru răspunsurile tale de până acum, cu capital de lucru de " + lei(inv.wc) + " inclus. Se recalculează din răspunsuri." };
    },
    questions: [
      {
        id: "clientsq", type: "nums",
        h: "Câți clienți pe zi, realist?",
        why: function () {
          return "De ce contează: e cifra din care se naște tot planul financiar. Aproape toate proiecțiile de cafenele noi pornesc de la 200+; realitatea primului an" + (A.city ? " în " + A.city : "") + " e de regulă 60-120 de clienți pe zi, ca medie. <strong>Propunem 80</strong>: destul de prudent cât să supraviețuiești, destul de realist cât să te ia banca în serios.";
        },
        nums: [
          { id: "clients", label: "Clienți / zi (media anului 1)", def: 80, min: 10 }
        ]
      },
      {
        id: "budget", type: "single",
        h: "Bugetul de investiție",
        why: function () {
          var inv = investEstimate();
          return "De ce contează: bugetul nu decide doar cât de frumos e spațiul, ci mai ales câte luni de rezervă ai după deschidere. Pentru răspunsurile tale de până acum, estimarea Groundwork e <strong>" + lei(inv.low) + " – " + lei(inv.high) + "</strong>; am propus intervalul de buget care o acoperă.";
        },
        opts: [
          { v: "b150", label: "Sub 150.000 lei" },
          { v: "b300", label: "150.000 – 300.000 lei" },
          { v: "b600", label: "300.000 – 600.000 lei" },
          { v: "b600p", label: "Peste 600.000 lei" }
        ],
        def: ["b300"], dynamicDef: true
      },
      {
        id: "source", type: "multi",
        h: "Sursele banilor",
        why: "De ce contează: sursa banilor schimbă planul. Creditul cere rate din luna 1, investitorul cere raportare și exit, economiile proprii cer doar disciplină.",
        opts: [
          { v: "savings", label: "Economii proprii" },
          { v: "loan", label: "Credit bancar" },
          { v: "investor", label: "Investitor / asociat" },
          { v: "grant", label: "Fonduri / granturi" }
        ],
        def: ["savings"]
      },
      {
        id: "equityq", type: "nums",
        h: "Aportul tău propriu",
        showIf: function () { return (A.source || []).indexOf("loan") >= 0 || (A.source || []).indexOf("grant") >= 0; },
        why: "De ce contează: nicio bancă și niciun program de finanțare nu intră într-un proiect în care fondatorul nu riscă nimic. Pragul uzual: minimum 15% din investiție vine de la tine.",
        nums: [
          { id: "equity", label: "Aport propriu (lei)", def: 60000, min: 0 }
        ]
      },
      {
        id: "collateral", type: "single",
        showIf: function () { return (A.source || []).indexOf("loan") >= 0; },
        h: "Garanțiile pentru credit",
        why: "De ce contează: banca nu finanțează idei, finanțează riscuri acoperite. <strong>Propunem garanția de stat</strong>: programele de garantare acoperă până la 80% din credit și sunt făcute exact pentru afaceri la început de drum.",
        opts: [
          { v: "state", label: "Garanție de stat", small: "FNGCIMM / FRC" },
          { v: "personal", label: "Fideiusiune personală" },
          { v: "realestate", label: "Ipotecă pe imobil" }
        ],
        def: ["state"]
      },
      {
        id: "goal", type: "single",
        h: "Unde vrei să ajungă",
        why: "De ce contează: o cafenea de cartier profitabilă și un lanț în creștere sunt afaceri diferite din ziua 1, de la contractul de chirie până la felul în care îți construiești echipa.",
        opts: [
          { v: "lifestyle", label: "Un loc bun, profitabil" },
          { v: "growth", label: "Creștere, locații noi" },
          { v: "franchise", label: "Brand & francizare" }
        ],
        def: ["lifestyle"]
      }
    ]
  }
];

var CONCEPT_STEP = STEPS.length;      // pasul 8: confirmarea conceptului
var TOTAL_STEPS = STEPS.length + 1;   // 8

/* ── navigație ecrane ────────────────────────────────────────────────── */
var step = 0;
var maxStepSeen = 0;

function show(id) {
  ["scr-intro", "scr-wizard", "scr-plan"].forEach(function (s) { $(s).hidden = (s !== id); });
  window.scrollTo(0, 0);
}

function gwHome() { show("scr-intro"); $("top-step").textContent = "groundwork"; $("prog").style.width = "0"; renderRail("intro"); return false; }

function gwStart() {
  var miss = [];
  [["i-name", "name"], ["i-city", "city"]].forEach(function (p) {
    var el = $(p[0]), row = el.closest(".field");
    if (!el.value.trim()) { row.classList.add("miss"); miss.push(el); }
    else row.classList.remove("miss");
  });
  if (miss.length) { miss[0].focus(); miss[0].scrollIntoView({ behavior: "smooth", block: "center" }); return; }
  A.name = $("i-name").value.trim();
  A.idea = $("i-idea").value.trim();
  A.city = $("i-city").value.trim();
  A.zone = $("i-zone").value.trim();
  save();
  step = 0;
  show("scr-wizard");
  renderStep();
}

function gwBack() {
  if (step === 0) { gwHome(); return; }
  step--; renderStep();
}

function gwNext() {
  if (step === CONCEPT_STEP) { gwGenerate(); return; }
  collectNums();
  save();
  step++;
  renderStep();
}

function gwJump(i) {
  if (i <= maxStepSeen) {
    if (step < CONCEPT_STEP) collectNums();
    save(); step = i;
    show("scr-wizard");
    renderStep();
  }
}

function gwEdit() { step = 0; show("scr-wizard"); renderStep(); }

function gwReset() {
  try { localStorage.removeItem("gw-v2"); } catch (e) {}
  location.reload();
}

/* ── stepper-ul orizontal ────────────────────────────────────────────── */
function renderRail(mode) {
  var nav = $("stepper");
  if (mode !== "wizard") { nav.hidden = true; return; }
  var h = "";
  STEPS.forEach(function (s, i) {
    var cls = i === step ? "now" : (i <= maxStepSeen ? "done" : "");
    h += '<button type="button" class="stp ' + cls + '" ' + (i <= maxStepSeen ? 'onclick="gwJump(' + i + ')"' : "") + ">" +
      '<span class="n">' + String(i + 1).padStart(2, "0") + "</span><span>" + s.short + "</span></button>";
  });
  var ccls = step === CONCEPT_STEP ? "now" : (maxStepSeen >= CONCEPT_STEP ? "done" : "");
  h += '<button type="button" class="stp ' + ccls + '" ' + (maxStepSeen >= CONCEPT_STEP ? 'onclick="gwJump(' + CONCEPT_STEP + ')"' : "") + ">" +
    '<span class="n">08</span><span>The Concept</span></button>';
  h += '<span class="stp goal"><span class="n">→</span><span>The Plan</span></span>';
  nav.innerHTML = h;
  nav.hidden = false;
  var now = nav.querySelector(".stp.now");
  if (now && now.scrollIntoView) now.scrollIntoView({ block: "nearest", inline: "center" });
}

/* ── render wizard ───────────────────────────────────────────────────── */
function visibleQuestions(s) {
  return s.questions.filter(function (q) { return !q.showIf || q.showIf(); });
}

function applyDefaults(s) {
  s.questions.forEach(function (q) {
    if (q.type === "nums") {
      q.nums.forEach(function (n) { if (A[n.id] === undefined) A[n.id] = n.def; });
    } else if (A[q.id] === undefined) {
      if (q.dynamicDef && q.id === "budget") {
        var mid = (investEstimate().low + investEstimate().high) / 2;
        A.budget = [mid < 150000 ? "b150" : mid < 300000 ? "b300" : mid < 600000 ? "b600" : "b600p"];
      } else {
        A[q.id] = q.def.slice();
      }
    }
  });
}

function ctxHtml(p, enter) {
  return '<div class="ctx-tile' + (enter ? " step-enter" : "") + (p.art ? "" : " noart") + '"><div class="ctx-kick caps">groundwork knows</div>' +
    (p.art ? '<div class="ctx-art"><img src="assets/art/' + p.art + '.png" alt=""></div>' : '<div class="ctx-spacer"></div>') +
    '<div class="ctx-stat">' + p.stat + '</div><div class="ctx-sub">' + p.sub + "</div></div>";
}

function updateCtx() {
  if (step === CONCEPT_STEP) { $("ctx").innerHTML = ctxHtml(conceptPanel(), false); return; }
  var s = STEPS[step];
  $("ctx").innerHTML = ctxHtml(s.panel(), false);
}

function renderStep() {
  if (step === CONCEPT_STEP) { renderConcept(); return; }
  var s = STEPS[step];
  if (step > maxStepSeen) maxStepSeen = step;
  applyDefaults(s);

  var h = '<div class="step-enter">' +
          '<div class="shead"><div>' +
          '<div class="step-kick caps">' + s.kick + "</div>" +
          '<h2 class="step-title">' + s.title + "</h2></div>" +
          '<p class="step-lead">' + s.lead + "</p></div>";

  visibleQuestions(s).forEach(function (q, qi) {
    var why = typeof q.why === "function" ? q.why() : q.why;
    h += '<div class="q"><div class="q-n">' + String(step + 1).padStart(2, "0") + "." + (qi + 1) + '</div><h3>' + q.h + "</h3>" + '<p class="why">' + why + "</p>";
    if (q.type === "nums") {
      h += '<div class="num-row">';
      q.nums.forEach(function (n) {
        h += "<div><label class=\"f-label caps\" for=\"n-" + n.id + "\">" + n.label + "</label>" +
             '<input type="number" id="n-' + n.id + '" min="' + n.min + '" value="' + A[n.id] + '"></div>';
      });
      h += "</div>";
    } else {
      h += '<div class="chips" data-q="' + q.id + '" data-type="' + q.type + '">';
      q.opts.forEach(function (o) {
        var on = (A[q.id] || []).indexOf(o.v) >= 0;
        var rec = (q.def || []).indexOf(o.v) >= 0;
        h += '<button type="button" class="chip' + (on ? " on" : "") + '" data-v="' + o.v + '">' +
             o.label + (o.small ? " <small>· " + o.small + "</small>" : "") +
             (rec ? ' <span class="rec">propus</span>' : "") + "</button>";
      });
      h += "</div>";
    }
    h += "</div>";
  });
  h += "</div>";

  $("step-host").innerHTML = h;
  $("ctx").innerHTML = ctxHtml(s.panel(), true);

  $("prog").style.width = Math.round(((step + 1) / (TOTAL_STEPS + 1)) * 100) + "%";
  $("top-step").textContent = "pas " + (step + 1) + " / " + TOTAL_STEPS;
  $("btn-next").textContent = step === STEPS.length - 1 ? "Vezi conceptul →" : "Continuă →";
  $("btn-back").textContent = "← Înapoi";
  renderRail("wizard");

  Array.prototype.forEach.call(document.querySelectorAll(".chips"), function (box) {
    box.addEventListener("click", function (e) {
      var b = e.target.closest(".chip");
      if (!b) return;
      var qid = box.getAttribute("data-q"), multi = box.getAttribute("data-type") === "multi";
      var cur = A[qid] || [];
      if (multi) {
        var i = cur.indexOf(b.getAttribute("data-v"));
        if (i >= 0) cur.splice(i, 1); else cur.push(b.getAttribute("data-v"));
      } else {
        cur = [b.getAttribute("data-v")];
        Array.prototype.forEach.call(box.children, function (c) { c.classList.remove("on"); });
      }
      A[qid] = cur;
      b.classList.toggle("on", cur.indexOf(b.getAttribute("data-v")) >= 0);
      save();
      if (qid === "source") { collectNums(); var y = window.scrollY; renderStep(); window.scrollTo(0, y); return; }
      updateCtx();
    });
  });

  Array.prototype.forEach.call(document.querySelectorAll('.num-row input[type="number"]'), function (inp) {
    inp.addEventListener("input", function () {
      var id = inp.id.replace(/^n-/, "");
      var v = parseFloat(inp.value);
      if (!isNaN(v)) { A[id] = Math.max(parseFloat(inp.min) || 0, v); updateCtx(); }
    });
    inp.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); gwNext(); } });
  });
}

function collectNums() {
  if (step >= STEPS.length) return;
  STEPS[step].questions.forEach(function (q) {
    if (q.type !== "nums") return;
    q.nums.forEach(function (n) {
      var el = $("n-" + n.id);
      if (el) A[n.id] = Math.max(n.min, parseFloat(el.value) || n.def);
    });
  });
}

/* ── pasul 8: The Concept ────────────────────────────────────────────── */
function findQ(qid) {
  for (var i = 0; i < STEPS.length; i++) {
    var qs = STEPS[i].questions;
    for (var j = 0; j < qs.length; j++) if (qs[j].id === qid) return qs[j];
  }
  return null;
}

function lbl(qid) {
  var q = findQ(qid);
  if (!q || !q.opts) return "";
  return (A[qid] || []).map(function (v) {
    for (var i = 0; i < q.opts.length; i++) if (q.opts[i].v === v) return q.opts[i].label;
    return v;
  }).join(", ");
}

function conceptPanel() {
  var inv = investEstimate();
  var rata = has("source", "loan") ? loanMonthly(creditNeeded(inv)) : 0;
  return {
    stat: lei(inv.low) + " – " + lei(inv.high),
    sub: "investiția estimată, cu capital de lucru de " + lei(inv.wc) + ". Pragul de rentabilitate: aproximativ " + breakEvenClients(rata) + " clienți pe zi. Detaliile, în plan."
  };
}

function renderConcept() {
  if (CONCEPT_STEP > maxStepSeen) maxStepSeen = CONCEPT_STEP;

  function fact(k, v, i) {
    return '<div class="fact"><span class="k caps">' + k + '</span><span class="v">' + v +
      '</span><button type="button" class="ed" onclick="gwJump(' + i + ')">Modifică</button></div>';
  }

  var h = '<div class="step-enter">' +
    '<div class="shead"><div>' +
    '<div class="step-kick caps">step 8 · the concept</div>' +
    '<h2 class="step-title">Does this sound right?</h2></div>' +
    '<p class="step-lead">Așa arată conceptul tău, pus cap la cap din răspunsuri. Dacă ceva sună greșit, modifică acum: planul întreg se construiește pe propozițiile de mai jos.</p></div>' +
    '<div class="concept"><p class="lede">' + conceptText() + "</p>" +
    '<div class="facts">' +
    fact("Formatul & spațiul", FORMAT_NAME[one("format")] + " · " + nrDe(A.mp, "mp", "mp") + " · " + nrDe(A.seats, "loc", "locuri") + (A.terrace > 0 ? " + " + nrDe(A.terrace, "loc", "locuri") + " la terasă" : "") + " · chirie " + lei(A.rent) + "/lună", 0) +
    fact("Meniul", lbl("coffee") + " · " + lbl("food") + " · " + lbl("roaster"), 1) +
    fact("Poziționarea", lbl("segment") + " · espresso " + lei(A.p_esp) + " · flat white " + lei(A.p_fw), 2) +
    fact("Servirea", lbl("service") + " · " + lbl("hours"), 3) +
    fact("Oaspeții", lbl("moments") + " · " + lbl("area"), 4) +
    fact("Echipa", lbl("founder") + " · " + nrDe(A.baristas, "barista", "bariști") + " · " + lbl("experience"), 5) +
    fact("Banii", nrDe(A.clients, "client", "clienți") + "/zi · " + lbl("budget") + " · " + lbl("source"), 6) +
    "</div></div></div>";

  $("step-host").innerHTML = h;
  $("ctx").innerHTML = ctxHtml(conceptPanel(), true);

  $("prog").style.width = Math.round((TOTAL_STEPS / (TOTAL_STEPS + 1)) * 100) + "%";
  $("top-step").textContent = "pas 8 / " + TOTAL_STEPS;
  $("btn-next").textContent = "Generează planul →";
  $("btn-back").textContent = "← Înapoi";
  renderRail("wizard");
}

/* ── momentul generării ──────────────────────────────────────────────── */
function gwGenerate() {
  save();
  var C = chapters();
  var ov = document.createElement("div");
  ov.id = "gen";
  ov.innerHTML = '<div class="inner"><div class="caps">groundwork</div><h2>Scriem planul.</h2><ul>' +
    C.map(function (c) { return "<li>" + c.t + "</li>"; }).join("") + "</ul></div>";
  document.body.appendChild(ov);
  var items = ov.querySelectorAll("li");
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var dt = reduced ? 0 : 130;
  items.forEach(function (li, i) {
    setTimeout(function () { li.classList.add("ok"); }, dt * (i + 1));
  });
  setTimeout(function () {
    buildPlan(C);
    A.generated = true;
    save();
    show("scr-plan");
    $("top-step").textContent = "the plan";
    $("prog").style.width = "100%";
    ov.remove();
  }, dt * (items.length + 3));
}

function gwShowPlan() {
  buildPlan(chapters());
  show("scr-plan");
  $("top-step").textContent = "the plan";
  $("prog").style.width = "100%";
  maxStepSeen = CONCEPT_STEP;
}

/* ── render plan ─────────────────────────────────────────────────────── */
var editTimer = null;

function buildPlan(C) {
  $("plan-title").textContent = A.name;
  $("plan-sub").textContent = FORMAT_NAME[one("format")] + " · " + A.city + (A.zone ? " · " + A.zone : "") + " · " +
    new Date().toLocaleDateString("ro-RO", { month: "long", year: "numeric" });

  var key = answersKey();
  var edits = (A.editsKey === key && A.edits) ? A.edits : null;
  if (!edits && A.edits) { delete A.edits; delete A.editsKey; save(); }

  var tocm = "", doc = "";
  C.forEach(function (c, i) {
    var id = "ch" + (i + 1);
    var body = (edits && edits[id]) ? edits[id] : c.html;
    tocm += '<a href="#' + id + '">' + String(i + 1).padStart(2, "0") + " · " + c.t + "</a>";
    doc += '<article class="chapter" id="' + id + '">' +
           (c.pro ? '<span class="pro-badge">Pro</span>' : "") +
           '<div class="ch-head"><span class="ch-no">' + String(i + 1).padStart(2, "0") + "</span>" +
           "<h2>" + c.t + "</h2></div>" +
           '<p class="ch-sub">' + c.sub + "</p>" +
           '<div contenteditable="true" spellcheck="false" data-ch="' + id + '">' + body + "</div>" +
           "</article>";
  });
  $("toc-mobile").innerHTML = tocm;
  $("doc").innerHTML = doc;
  renderRail("plan", C);

  $("doc").addEventListener("input", function (e) {
    var ed = e.target.closest("[data-ch]");
    if (!ed) return;
    clearTimeout(editTimer);
    editTimer = setTimeout(function () {
      A.edits = A.edits || {};
      A.edits[ed.getAttribute("data-ch")] = ed.innerHTML;
      A.editsKey = answersKey();
      save();
    }, 400);
  });
}

/* ── pornire: reluăm de unde a rămas utilizatorul ────────────────────── */
(function () {
  if (A.name) {
    $("i-name").value = A.name;
    $("i-idea").value = A.idea || "";
    $("i-city").value = A.city || "";
    $("i-zone").value = A.zone || "";
  }
  if (A.generated) {
    var r = $("resume");
    r.innerHTML = '<div><div class="caps">plan salvat</div>' +
      "<p>Planul pentru <strong>" + A.name + "</strong> e generat și salvat în acest browser.</p></div>" +
      '<div class="acts"><button class="btn sm" onclick="gwShowPlan()">Deschide planul</button>' +
      '<button class="btn sm ghost" onclick="gwReset()">Ia de la capăt</button></div>';
    r.hidden = false;
  }
  initIdeas();
  ["i-name", "i-city", "i-zone"].forEach(function (id) {
    $(id).addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); gwStart(); } });
  });
  renderRail("intro");
})();
