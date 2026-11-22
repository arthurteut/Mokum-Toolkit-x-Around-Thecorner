/* Groundwork v0.2 — wizard premium + generatorul planului scris.
   Totul rulează în browser; răspunsurile stau în localStorage ("gw-v1"). */

"use strict";

var GW_UNLOCKED = true; // v0.x: totul deschis; badge-urile PRO arată viitorul model freemium

var $ = function (id) { return document.getElementById(id); };

/* ── starea ───────────────────────────────────────────────────────────── */
var A = {};
try { A = JSON.parse(localStorage.getItem("gw-v1") || "{}"); } catch (e) { A = {}; }
function save() { try { localStorage.setItem("gw-v1", JSON.stringify(A)); } catch (e) {} }

/* ── configurația wizard-ului ─────────────────────────────────────────── */
var STEPS = [
  {
    id: "format", kick: "step 1 · the format", short: "The Format", title: "What are we building?",
    lead: "Formatul decide aproape tot ce urmează: investiția, echipa, meniul, fluxul prin spațiu. E prima decizie, nu ultima.",
    panel: { art: "a35", stat: "60 – 120", sub: "clienți pe zi, realitatea primului an. Pe intervalul ăsta construim planul, nu pe 200+." },
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
        why: "De ce contează: suprafața dictează investiția în amenajare (se calculează pe metru pătrat), iar numărul de locuri pune plafonul veniturilor din servirea la masă.",
        nums: [
          { id: "mp", label: "Suprafață (mp)", def: 60, min: 10 },
          { id: "seats", label: "Locuri la masă", def: 24, min: 0 }
        ]
      }
    ]
  },
  {
    id: "menu", kick: "step 2 · the menu", short: "The Menu", title: "What do we serve?",
    lead: "Meniul nu e o listă de produse, e promisiunea pe care o faci oaspetelui. Scurt și stăpânit bate lung și aproximativ.",
    panel: { art: "a31", stat: "+30 – 40%", sub: "atât poate adăuga food-ul bun la bonul mediu al unei vizite." },
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
    panel: { photo: "food-1.jpg", stat: "Prețul face parte din produs.", sub: "Farfuria, ceașca și bonul spun aceeași poveste." },
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
        why: "De ce contează: espresso-ul și flat white-ul sunt ancorele după care oaspeții îți judecă tot meniul, iar bonul mediu de food îți arată cât aduce bucătăria la fiecare vizită.",
        nums: [
          { id: "p_esp", label: "Espresso", def: 12, min: 5 },
          { id: "p_fw", label: "Flat white", def: 18, min: 8 },
          { id: "p_food", label: "Bon mediu food", def: 25, min: 0 }
        ]
      }
    ]
  },
  {
    id: "service", kick: "step 4 · the service", short: "The Service", title: "How does service work?",
    lead: "Modul de servire stabilește ritmul zilei, numărul de oameni din tură și chiar arhitectura barului.",
    panel: { art: "a32", stat: "4 minute", sub: "ținta de la ușă la cafea în mână, în vârful dimineții." },
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
    panel: { photo: "food-2.jpg", stat: "Brunch-ul de weekend", sub: "bonuri duble, timp lung la masă, alt fel de oaspete." },
    questions: [
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
    panel: { art: "a36", stat: "2 pe tură", sub: "minimul care ține calitatea în viață la orele de vârf." },
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
    lead: "Ultimul pas înainte de plan: banii. Fără cifre exacte încă, doar ordinele de mărime care decid ce fel de proiect construim.",
    panel: { art: "a30", stat: "3 – 4 luni", sub: "de costuri stau în bancă, neatinse, în ziua deschiderii. Regula de aur a supraviețuirii." },
    questions: [
      {
        id: "budget", type: "single",
        h: "Bugetul de investiție",
        why: "De ce contează: bugetul nu decide doar cât de frumos e spațiul, ci mai ales câte luni de rezervă ai după deschidere. Regula de aur: 3-4 luni de costuri de funcționare stau în bancă, neatinse, în ziua deschiderii.",
        opts: [
          { v: "b150", label: "Sub 150.000 lei" },
          { v: "b300", label: "150 – 300.000 lei" },
          { v: "b600", label: "300 – 600.000 lei" },
          { v: "b600p", label: "Peste 600.000 lei" }
        ],
        def: ["b300"]
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

/* ── navigație ecrane ─────────────────────────────────────────────────── */
var step = 0;
var maxStepSeen = 0;

function show(id) {
  ["scr-intro", "scr-wizard", "scr-plan"].forEach(function (s) { $(s).hidden = (s !== id); });
  window.scrollTo(0, 0);
}

function gwHome() { show("scr-intro"); $("top-step").textContent = "groundwork"; $("prog").style.width = "0"; renderRail("intro"); return false; }

function gwStart() {
  A.name = $("i-name").value.trim() || "Cafeneaua";
  A.idea = $("i-idea").value.trim();
  A.city = $("i-city").value.trim() || "orașul tău";
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
  collectNums();
  save();
  if (step === STEPS.length - 1) { buildPlan(); show("scr-plan"); $("top-step").textContent = "the plan"; $("prog").style.width = "100%"; return; }
  step++; renderStep();
}

function gwJump(i) {
  if (i <= maxStepSeen) { collectNums(); save(); step = i; renderStep(); }
}

function gwEdit() { step = 0; show("scr-wizard"); renderStep(); }

/* ── rail-ul lateral ──────────────────────────────────────────────────── */
function renderRail(mode, C) {
  var nav = $("rail-nav"), h = "";
  if (mode === "wizard") {
    STEPS.forEach(function (s, i) {
      var cls = i === step ? "now" : (i <= maxStepSeen ? "done" : "");
      h += '<button type="button" class="rail-item ' + cls + '" ' + (i <= maxStepSeen ? 'onclick="gwJump(' + i + ')"' : "") + ">" +
           '<span class="n">' + String(i + 1).padStart(2, "0") + "</span><span>" + s.short + "</span></button>";
    });
    h += '<div class="rail-rule"></div>' +
         '<div class="rail-item"><span class="n">→</span><span>The Plan</span></div>';
  } else if (mode === "plan" && C) {
    C.forEach(function (c, i) {
      h += '<button type="button" class="rail-item link" onclick="document.getElementById(\'ch' + (i + 1) + '\').scrollIntoView({behavior:\'smooth\'})">' +
           '<span class="n">' + String(i + 1).padStart(2, "0") + "</span><span>" + c.t + "</span></button>";
    });
  } else {
    h = '<div class="rail-item"><span class="n">··</span><span>7 pași · 15 minute</span></div>' +
        '<div class="rail-item"><span class="n">→</span><span>Planul tău, scris</span></div>';
  }
  nav.innerHTML = h;
}

/* ── render wizard ────────────────────────────────────────────────────── */
function renderStep() {
  var s = STEPS[step];
  if (step > maxStepSeen) maxStepSeen = step;

  s.questions.forEach(function (q) {
    if (q.type === "nums") {
      q.nums.forEach(function (n) { if (A[n.id] === undefined) A[n.id] = n.def; });
    } else if (A[q.id] === undefined) {
      A[q.id] = q.def.slice();
    }
  });

  var h = '<div class="step-enter">' +
          '<div class="step-kick caps">' + s.kick + "</div>" +
          '<h2 class="step-title">' + s.title + "</h2>" +
          '<p class="step-lead">' + s.lead + "</p>";

  s.questions.forEach(function (q, qi) {
    h += '<div class="q"><div class="q-n">' + String(step + 1).padStart(2, "0") + "." + (qi + 1) + '</div><h3>' + q.h + "</h3>" + '<p class="why">' + q.why + "</p>";
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
        h += '<button type="button" class="chip' + (on ? " on" : "") + '" data-v="' + o.v + '">' +
             o.label + (o.small ? " <small>· " + o.small + "</small>" : "") + "</button>";
      });
      h += "</div>";
    }
    h += "</div>";
  });
  h += "</div>";

  $("step-host").innerHTML = h;

  /* panoul de context */
  var p = s.panel || {};
  var ctx = "";
  if (p.photo) {
    ctx = '<div class="ctx-tile photo step-enter"><img src="assets/art/' + p.photo + '" alt="">' +
          '<div class="ctx-cap"><div class="ctx-stat" style="font-size:22px">' + p.stat + '</div><div class="ctx-sub">' + p.sub + "</div></div></div>";
  } else {
    ctx = '<div class="ctx-tile step-enter"><div class="ctx-kick caps">groundwork knows</div>' +
          '<div class="ctx-art"><img src="assets/art/' + p.art + '.png" alt=""></div>' +
          '<div class="ctx-stat">' + p.stat + '</div><div class="ctx-sub">' + p.sub + "</div></div>";
  }
  $("ctx").innerHTML = ctx;

  $("prog").style.width = Math.round(((step + 1) / (STEPS.length + 1)) * 100) + "%";
  $("top-step").textContent = "pas " + (step + 1) + " / " + STEPS.length;
  $("btn-next").textContent = step === STEPS.length - 1 ? "Generează planul →" : "Continuă →";
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
    });
  });
}

function collectNums() {
  STEPS[step].questions.forEach(function (q) {
    if (q.type !== "nums") return;
    q.nums.forEach(function (n) {
      var el = $("n-" + n.id);
      if (el) A[n.id] = Math.max(n.min, parseFloat(el.value) || n.def);
    });
  });
}

/* ── helpers generator ────────────────────────────────────────────────── */
function has(qid, v) { return (A[qid] || []).indexOf(v) >= 0; }
function one(qid) { return (A[qid] || [])[0]; }
function pick(qid, map) { return map[one(qid)] || map._ || ""; }
function lei(n) { return Math.round(n).toLocaleString("ro-RO") + " lei"; }

/* ideea fondatorului, îmblânzită pentru mijloc de frază: literă mică, fără punct final */
function ideaInline() {
  var t = (A.idea || "").trim().replace(/\.+$/, "");
  return t.charAt(0).toLowerCase() + t.slice(1);
}

var FORMAT_NAME = { bar: "bar specialty", food: "cafenea cu food", togo: "concept to-go", roastery: "roastery café" };
var FOOD_NAME = { none: "fără food", viennoiserie: "viennoiserie și snacks", brunch: "brunch light", lunch: "bucătărie completă" };

/* investiția estimată: amenajare+echipamente pe mp, după format */
function investEstimate() {
  var perMp = { bar: 3000, food: 3800, togo: 2400, roastery: 3400 }[one("format")] || 3200;
  var base = A.mp * perMp;
  var equipment = { bar: 90000, food: 110000, togo: 70000, roastery: 160000 }[one("format")] || 100000;
  if (one("food") === "lunch") equipment += 60000; else if (one("food") === "brunch") equipment += 30000;
  var monthly = A.mp * 1500 * 0.12 + (A.baristas + 1) * 7500; // aproximare chirie+utilități+echipă
  var wc = monthly * 3.5; // capital de lucru 3-4 luni
  var low = Math.round((base + equipment + wc) * 0.85 / 5000) * 5000;
  var high = Math.round((base + equipment + wc) * 1.2 / 5000) * 5000;
  return { low: low, high: high, wc: Math.round(wc / 5000) * 5000 };
}

var BUDGET_MID = { b150: 120000, b300: 225000, b600: 450000, b600p: 750000 };

/* ── capitolele planului ──────────────────────────────────────────────── */
function chapters() {
  var inv = investEstimate();
  var momentsTxt = [];
  if (has("moments", "commute")) momentsTxt.push("dimineața de 6:30-9:30, când oamenii trec spre birou și vor cafea bună, repede");
  if (has("moments", "laptop")) momentsTxt.push("intervalul 10:00-16:00, al celor care lucrează remote și caută un birou cu espressor");
  if (has("moments", "social")) momentsTxt.push("după-amiaza întâlnirilor, unde contează mesele și liniștea conversației");
  if (has("moments", "brunch")) momentsTxt.push("weekendul de brunch, cu bonuri duble și timp lung la masă");
  if (has("moments", "family")) momentsTxt.push("familiile din cartier, care revin zilnic dacă se simt binevenite");

  var C = [];

  /* 1 ── Executive Summary */
  C.push({ t: "Executive Summary", sub: "Sumarul executiv: pagina pe care o citește toată lumea", pro: false, html:
    "<p><strong>" + A.name + "</strong> este " + (A.idea ? ideaInline() : "o " + FORMAT_NAME[one("format")] + " nouă") +
    ", amplasată în " + A.city + (A.zone ? ", zona " + A.zone : "") + ". Conceptul: " + FORMAT_NAME[one("format")] +
    " de " + A.mp + " mp cu " + A.seats + " locuri, poziționat " +
    pick("segment", { value: "accesibil, cu prețuri corecte care invită la vizite zilnice", mid: "mid-range, unde calitatea specialty rămâne accesibilă zi de zi", premium: "premium, cu o experiență care justifică fiecare leu" }) + ".</p>" +
    "<p>Oferta: " + pick("coffee", { espresso: "program de espresso executat impecabil", both: "espresso pentru ritmul dimineții și filter pentru identitate", filter: "un program de filter care diferențiază locul de orice altă cafenea din zonă" }) +
    ", completat de " + FOOD_NAME[one("food")] + ". Echipa de start: fondatorul " +
    pick("founder", { barista: "prezent zilnic la bar", manager: "în rol de manager activ", investor: "în rol de investitor, cu un head barista responsabil de operare" }) +
    " și " + A.baristas + " bariști.</p>" +
    "<p>Investiția estimată pentru acest format este între " + lei(inv.low) + " și " + lei(inv.high) +
    ", incluzând un capital de lucru de aproximativ " + lei(inv.wc) + " (3-4 luni de funcționare, neatins în ziua deschiderii). Obiectivul: " +
    pick("goal", { lifestyle: "o locație profitabilă și stabilă, cu marjă netă de 8-15% din anul 2", growth: "validarea modelului în prima locație și extinderea la a doua în 24-30 de luni", franchise: "construirea unui brand și a unui manual de operare care să susțină francizarea" }) + ".</p>"
  });

  /* 2 ── The Concept */
  C.push({ t: "The Concept", sub: "Conceptul și povestea locului", pro: false, html:
    "<p>" + A.name + " nu concurează cu toate cafenelele din " + A.city + ", ci cu felul în care arată o zi obișnuită din viața oamenilor din " + (A.zone || "zona aleasă") + ". " +
    pick("vibe", { calm: "Atmosfera e calmă și minimalistă: un loc în care zgomotul orașului rămâne la ușă, iar cafeaua are spațiu să fie luată în serios.",
      social: "Atmosfera e vie și socială: un loc cu energie, în care barista vorbește cu oamenii peste tejghea și muzica face parte din produs.",
      neighborhood: "Atmosfera e de cartier: numele oaspeților se țin minte, comanda „ca de obicei” există, iar locul devine o prelungire a sufrageriei." }) + "</p>" +
    "<p>Formatul de " + FORMAT_NAME[one("format")] + " pe " + A.mp + " mp înseamnă " +
    pick("format", { bar: "un bar dominant, puține locuri și un flux rapid: totul e construit în jurul calității în ceașcă și al vitezei",
      food: "un echilibru între bar și zona de mese: cafeaua aduce frecvența, food-ul aduce valoarea bonului și timpul petrecut",
      togo: "un punct compact, cu flux de trecere: viteza și consistența sunt întregul produs",
      roastery: "prăjitoria la vedere ca spectacol central: locul vinde nu doar cafea, ci și povestea originii ei, plus boabele la raft" }) + ".</p>" +
    (A.idea ? "<p>În cuvintele fondatorului: „" + A.idea + "”. Planul de față transformă această propoziție în decizii concrete de meniu, echipă, spațiu și bani.</p>" : "")
  });

  /* 3 ── The Market */
  C.push({ t: "The Market", sub: "Piața și competiția locală", pro: false, html:
    "<p>Piața de cafea specialty din România crește constant, dar crește și competiția: diferențierea nu mai vine din „avem cafea bună”, ci din consistență, servire și poziția în ziua clientului. Pentru " + A.name + ", piața relevantă nu e " + A.city + " întreg, ci raza de 10 minute de mers pe jos din jurul locației" + (A.zone ? " din " + A.zone : "") + ".</p>" +
    "<div class='callout'><strong>De făcut pe teren:</strong> petrece două dimineți (una de marți, una de sâmbătă) în fața spațiului vizat și numără: câți oameni trec între 7:30 și 9:30, câți intră la competitorii din zonă, cât așteaptă la coadă. Două ore de numărat bat orice studiu cumpărat.</div>" +
    "<ul><li><strong>Competitori direcți:</strong> cafenelele specialty din aceeași zonă de mers pe jos. De cartografiat: prețul flat white-ului, programul, locurile, viteza la vârf.</li>" +
    "<li><strong>Competitori indirecți:</strong> lanțurile (5 to go, Starbucks, Ted's), benzinăriile premium și espressoarele din birouri. Concurează pe preț și comoditate, nu pe calitate.</li>" +
    "<li><strong>Avantajul apărabil:</strong> " + pick("vibe", { calm: "experiența calmă, care nu există în lanțuri", social: "relația personală barista-oaspete, imposibil de copiat la scară", neighborhood: "loialitatea de cartier, construită vizită cu vizită" }) + ".</li></ul>"
  });

  /* 4 ── The Guests */
  C.push({ t: "The Guests", sub: "Clienții și momentele zilei pe care le câștigăm", pro: false, html:
    "<p>" + A.name + " nu își propune să fie cafeneaua tuturor. Planul câștigă " + momentsTxt.length + " momente precise din zi:</p>" +
    "<ul>" + momentsTxt.map(function (m) { return "<li>" + m + ";</li>"; }).join("") + "</ul>" +
    "<p>Fiecare moment are propriul drum al oaspetelui, de la trotuar până la „pe mâine”: cât durează comanda, unde se așteaptă, ce vede pe tejghea, ce primește odată cu cafeaua. Aceste drumuri se desenează explicit (customer journey) înainte de deschidere și se testează în soft opening." +
    (has("moments", "commute") ? " Pentru dimineața de trecere, ținta operațională: maximum 4 minute de la ușă la cafea în mână, altfel momentul e pierdut definitiv în favoarea vitezei." : "") + "</p>"
  });

  /* 5 ── Menu & Pricing */
  var fw = A.p_fw, esp = A.p_esp;
  var segCheck = "";
  if (one("segment") === "mid" && (fw < 14 || fw > 22)) segCheck = "<div class='callout'><strong>Semnal:</strong> un flat white de " + lei(fw) + " iese din intervalul tipic mid-range (14-22 lei). Ori repoziționezi prețul, ori asumă explicit segmentul " + (fw > 22 ? "premium" : "accesibil") + " în tot planul.</div>";
  if (one("segment") === "premium" && fw < 20) segCheck = "<div class='callout'><strong>Semnal:</strong> poziționare premium cu flat white sub 20 de lei contrazice povestea. Prețul face parte din produs.</div>";
  if (one("segment") === "value" && fw > 16) segCheck = "<div class='callout'><strong>Semnal:</strong> pentru segmentul accesibil, flat white peste 16 lei va fi perceput ca scump în " + A.city + ".</div>";
  C.push({ t: "Menu & Pricing", sub: "Meniul și arhitectura prețurilor", pro: false, html:
    "<p>Meniul de start e scurt și stăpânit: " + pick("coffee", { espresso: "linia completă de espresso (espresso, macchiato, flat white, cappuccino, latte)", both: "linia de espresso plus 2-3 origini la filter, rotite lunar", filter: "3-4 origini la filter ca nucleu, cu espresso în rol secundar" }) +
    (one("altmilk") !== "no" ? ", lapte vegetal " + (one("altmilk") === "incl" ? "inclus în preț" : "cu supliment") : "") +
    ", iar la food: " + pick("food", { none: "nimic deocamdată, decizie asumată pentru simplitate operațională", viennoiserie: "viennoiserie de la un furnizor local bun plus 2-3 snacks, fără bucătărie caldă", brunch: "un meniu de brunch scurt (5-7 poziții), servit până la 15:00", lunch: "mic dejun și prânz complet, cu un meniu care se schimbă sezonier" }) + ".</p>" +
    "<table><tr><th>Ancoră</th><th>Preț</th><th>Rol în meniu</th></tr>" +
    "<tr><td>Espresso</td><td>" + lei(esp) + "</td><td>ancora de jos: definește percepția de corectitudine</td></tr>" +
    "<tr><td>Flat white</td><td>" + lei(fw) + "</td><td>vedeta: cel mai vândut produs pe lapte, reperul comparației cu competiția</td></tr>" +
    (one("food") !== "none" ? "<tr><td>Bon mediu food</td><td>" + lei(A.p_food) + "</td><td>ridică bonul mediu al vizitei peste pragul de sustenabilitate</td></tr>" : "") +
    "</table>" + segCheck +
    "<p>Regula de disciplină: niciun produs nou nu intră în meniu fără să iasă altul, și fără să-i fie calculat costul pe porție (COGS) înainte de prima vânzare.</p>"
  });

  /* 6 ── Marketing & Launch */
  C.push({ t: "Marketing & Launch", sub: "Cum află lumea și de ce revine", pro: true, html:
    "<p>Marketingul unei cafenele noi are două faze distincte: înainte de deschidere construiești curiozitate, după deschidere construiești obișnuință. Bugetul e mic, deci fiecare leu merge în lucruri care se văd din stradă sau se dau mai departe.</p>" +
    "<ul><li><strong>Faza 0 (6 săptămâni înainte):</strong> cont de Instagram cu povestea amenajării, geamul folosit ca afiș („deschidem aici în curând”), relație cu 3-4 creatori locali din " + A.city + " invitați la preview.</li>" +
    "<li><strong>Soft opening (1 săptămână):</strong> prieteni, vecini și vecinii de stradă comercială, cafea din partea casei, feedback structurat pe flux și produs.</li>" +
    "<li><strong>Primele 90 de zile:</strong> card de fidelitate simplu (a 10-a cafea din partea casei), prezență constantă pe Instagram (3 postări/săptămână, nu campanii), parteneriate cu birourile din zonă" + (has("moments", "brunch") ? ", și un rezervă-masa simplu pentru brunch-ul de weekend" : "") + ".</li>" +
    (has("service", "delivery") ? "<li><strong>Delivery:</strong> listare pe o singură platformă la început, cu meniu redus care călătorește bine; comisionul de 25-30% se acceptă doar pe produsele cu marjă mare.</li>" : "") +
    "</ul><p>Indicatorul care contează în primele luni nu e numărul de urmăritori, ci rata de revenire: câți dintre oaspeții de luni se întorc până vineri.</p>"
  });

  /* 7 ── Operations & Team */
  C.push({ t: "Operations & Team", sub: "Operațiuni, echipă și responsabilități", pro: true, html:
    "<p>Structura de start: fondatorul " + pick("founder", { barista: "lucrează zilnic la bar și deține calitatea, rețetele și relația cu oaspeții", manager: "conduce operațional fără a fi legat de bar: program, furnizori, cifre, echipă", investor: "deleagă operarea unui head barista cu mandat clar și raportare săptămânală pe cifre" }) +
    ", " + A.baristas + " bariști" + (one("food") === "lunch" || one("food") === "brunch" ? ", plus bucătar responsabil de partea de food" : "") + ".</p>" +
    "<p>Fiecare zonă de responsabilitate are un singur proprietar (principiul RACI: un responsabil, un decident pe fiecare sarcină): </p>" +
    "<table><tr><th>Zona</th><th>Proprietar</th></tr>" +
    "<tr><td>Calitate cafea & rețete (dial-in zilnic)</td><td>" + (one("founder") === "barista" ? "fondatorul" : "head barista") + "</td></tr>" +
    "<tr><td>Program & ture</td><td>" + (one("founder") === "investor" ? "head barista" : "fondatorul") + "</td></tr>" +
    "<tr><td>Comenzi & furnizori</td><td>" + (one("founder") === "investor" ? "head barista" : "fondatorul") + "</td></tr>" +
    (one("food") !== "none" ? "<tr><td>Food: producție / recepție & etichetare</td><td>" + (one("food") === "viennoiserie" ? "barista de serviciu" : "bucătarul") + "</td></tr>" : "") +
    "<tr><td>Cifre: P&L lunar, cash</td><td>fondatorul</td></tr></table>" +
    "<p>Instrumente din ziua 1: registru de rețete și dial-in (un singur adevăr pentru toată echipa), checklist de deschidere/închidere, și o oră pe săptămână de degustare împreună. Consistența nu e talent, e sistem.</p>"
  });

  /* 8 ── Space & Equipment */
  var eq = { bar: ["Espressor 2 grupuri (clasa La Marzocco Linea / Victoria Arduino Eagle One)", "2 râșnițe espresso + 1 râșniță filter", "Filtru batch brew", "Frigidere bar + vitrină mică", "Blat tehnic cu chiuvete conforme DSP"],
             food: ["Espressor 2 grupuri", "2 râșnițe espresso + 1 filter", "Batch brew", "Vitrină food dublă (caldă/rece după meniu)", "Echipare bucătărie după nivelul de food ales", "POS cu modul de stocuri"],
             togo: ["Espressor 2 grupuri rapid", "2 râșnițe", "Batch brew de volum", "Vitrină compactă", "Fereastră/flux de servire dedicat"],
             roastery: ["Prăjitor 5-15 kg cu ventilație autorizată", "Espressor 2 grupuri", "Râșnițe espresso + retail", "Zonă de ambalare și raft de boabe", "Spațiu verde de depozitare"] }[one("format")];
  C.push({ t: "Space & Equipment", sub: "Spațiul, fluxul și echipamentele", pro: true, html:
    "<p>Pe " + A.mp + " mp, prioritatea e fluxul, nu estetica: oaspetele intră, comandă, așteaptă și primește fără să se încrucișeze cu cei care pleacă" + (A.seats > 0 ? ", iar cele " + A.seats + " de locuri sunt dispuse astfel încât barul să rămână scena principală" : "") + ". Amenajarea se bugetează la " + lei({bar:3000,food:3800,togo:2400,roastery:3400}[one("format")] || 3200) + "/mp (medie realistă " + A.city + ", de la instalații la mobilier).</p>" +
    "<p>Echipamentele de bază pentru formatul ales:</p><ul>" + eq.map(function (e) { return "<li>" + e + ";</li>"; }).join("") + "</ul>" +
    "<div class='callout'><strong>Regulă de buget:</strong> espressorul și râșnițele nu sunt locul de economisit, acolo se aude diferența în ceașcă. Economiile se fac la mobilier (second-hand bun) și la lucrările care nu ating instalațiile.</div>"
  });

  /* 9 ── The Numbers */
  var bm = BUDGET_MID[one("budget")];
  var fitNote;
  if (bm < inv.low * 0.9) fitNote = "<div class='callout'><strong>Semnal important:</strong> bugetul declarat (" + pick("budget", { b150: "sub 150.000 lei", b300: "150-300.000 lei", b600: "300-600.000 lei", b600p: "peste 600.000 lei" }) + ") este sub estimarea pentru acest format. Variante: spațiu mai mic, format to-go, echipamente refurbished, sau extinderea bugetului înainte de a semna orice contract de chirie.</div>";
  else if (bm > inv.high * 1.3) fitNote = "<div class='callout'><strong>De remarcat:</strong> bugetul declarat depășește confortabil estimarea. Diferența nu se cheltuie pe amenajare mai scumpă, ci rămâne rezervă: cel mai bun prieten al unei cafenele noi e un cont care nu se golește.</div>";
  else fitNote = "<div class='callout'><strong>Verificare:</strong> bugetul declarat se potrivește cu estimarea formatului. Următorul pas e transformarea estimării în deviz real, pe oferte.</div>";
  C.push({ t: "The Numbers", sub: "Cadrul financiar: estimări și repere sănătoase", pro: false, html:
    "<p>Pentru " + FORMAT_NAME[one("format")] + " de " + A.mp + " mp, investiția totală estimată este <strong>" + lei(inv.low) + " – " + lei(inv.high) + "</strong>: amenajare, echipamente și, obligatoriu, capital de lucru de ~" + lei(inv.wc) + " pentru primele 3-4 luni.</p>" + fitNote +
    "<p>Reperele după care se judecă sănătatea afacerii, lună de lună (P&L pe structura folosită în industria de specialitate):</p>" +
    "<table><tr><th>Indicator</th><th>Interval sănătos</th></tr>" +
    "<tr><td>COGS (cafea, lapte, ambalaje, food)</td><td>25 – 35% din vânzări</td></tr>" +
    "<tr><td>Echipă (salarii + taxe)</td><td>30 – 35% din vânzări</td></tr>" +
    "<tr><td>Chirie + utilități</td><td>sub 15% din vânzări</td></tr>" +
    "<tr><td>Marjă netă (anii 1-2)</td><td>8 – 15%</td></tr></table>" +
    "<p>Și reperul de realism care salvează planuri: aproape toate proiecțiile de cafenele noi pornesc de la 200+ clienți pe zi. Realitatea primului an este de regulă <strong>60-120 de clienți pe zi</strong>, cu creștere lună de lună. Planul " + A.name + " se construiește pe acest interval, iar orice depășire devine surpriză plăcută, nu condiție de supraviețuire.</p>" +
    "<div class='callout'><strong>Urmează:</strong> modulul Groundwork Financials va transforma aceste repere în proiecții complete pe 5 ani (venituri bottom-up, P&L lunar, cash flow și punctul minim de cash), din aceleași răspunsuri.</div>"
  });

  /* 10 ── Risks & Plan B */
  C.push({ t: "Risks & Plan B", sub: "Riscurile principale și răspunsurile pregătite", pro: true, html:
    "<table><tr><th>Risc</th><th>Semnal timpuriu</th><th>Plan B</th></tr>" +
    "<tr><td>Trafic sub așteptări în primele luni</td><td>sub 60 clienți/zi în luna 3</td><td>capitalul de lucru acoperă 3-4 luni; se accelerează parteneriatele cu birouri și cardul de fidelitate înainte de orice reducere de preț</td></tr>" +
    "<tr><td>Creșterea costurilor (cafea verde, lapte, energie)</td><td>COGS trece de 35%</td><td>recalculare porții și prețuri pe ancore, nu panică pe tot meniul; contracte pe 6-12 luni cu furnizorii cheie</td></tr>" +
    "<tr><td>Plecarea unui om cheie</td><td>orice demisie în primele 12 luni</td><td>rețetele și procedurile stau în registru, nu în memoria cuiva; recrutare continuă pasivă (relații, nu anunțuri de urgență)</td></tr>" +
    (has("source", "loan") ? "<tr><td>Rata creditului în luni slabe</td><td>cash sub 1,5 luni de costuri</td><td>linia de rezervă definită înainte de deschidere; discuție cu banca la primul semnal, nu la prima întârziere</td></tr>" : "") +
    (one("food") !== "none" ? "<tr><td>Risipa pe food</td><td>pierderi peste 8% din achiziții</td><td>meniu mai scurt, producție pe baza vânzărilor din registru, reduceri de final de zi</td></tr>" : "") +
    "</table>" +
    "<p>Principiul general: fiecare risc are un semnal măsurabil și o reacție decisă dinainte. Deciziile proaste se iau sub presiune; planul există ca să nu fie nevoie de ele.</p>"
  });

  /* 11 ── Opening Roadmap */
  C.push({ t: "Opening Roadmap", sub: "Drumul până la deschidere, săptămână cu săptămână", pro: true, html:
    "<table><tr><th>Săptămânile</th><th>Etapa</th></tr>" +
    "<tr><td>1 – 2</td><td>validarea zonei pe teren (numărătoarea de trafic), negocierea spațiului, antecontract cu clauză de autorizare</td></tr>" +
    "<tr><td>3 – 4</td><td>SRL & coduri CAEN, proiect de amenajare, deviz pe oferte reale, comanda echipamentelor cu termen lung</td></tr>" +
    "<tr><td>5 – 10</td><td>amenajare; în paralel: dosar DSVSA (înregistrare sanitar-veterinară), aviz DSP, autorizație de funcționare de la primărie, ISU dacă suprafața o cere, contract deșeuri & neutralizare</td></tr>" +
    "<tr><td>11 – 12</td><td>angajare și training echipă (rețete, flux, servire), meniu final cu COGS calculat pe fiecare poziție, POS configurat</td></tr>" +
    "<tr><td>13</td><td>soft opening: prieteni și cartier, ajustări pe flux</td></tr>" +
    "<tr><td>14</td><td>deschidere oficială" + (has("moments", "brunch") ? ", cu primul brunch de weekend anunțat din prima zi" : "") + "</td></tr>" +
    "</table>" +
    "<div class='callout'><strong>Despre autorizații în România:</strong> documentul care blochează cel mai des deschiderile e înregistrarea DSVSA" + (one("food") === "lunch" || one("food") === "brunch" ? " (cu atât mai mult cu bucătărie caldă)" : "") + ". Se depune devreme, nu după amenajare, iar proiectul spațiului se face cu cerințele DSVSA/DSP pe masă, ca să nu se spargă pereți de două ori.</div>"
  });

  return C;
}

/* ── render plan ──────────────────────────────────────────────────────── */
function buildPlan() {
  var C = chapters();
  $("plan-title").textContent = A.name;
  $("plan-sub").textContent = FORMAT_NAME[one("format")] + " · " + A.city + (A.zone ? " · " + A.zone : "") + " · " +
    new Date().toLocaleDateString("ro-RO", { month: "long", year: "numeric" });

  var tocm = "", doc = "";
  C.forEach(function (c, i) {
    var id = "ch" + (i + 1);
    tocm += '<a href="#' + id + '">' + String(i + 1).padStart(2, "0") + " · " + c.t + "</a>";
    doc += '<article class="chapter" id="' + id + '">' +
           (c.pro ? '<span class="pro-badge">Pro</span>' : "") +
           '<div class="ch-head"><span class="ch-no">' + String(i + 1).padStart(2, "0") + "</span>" +
           "<h2>" + c.t + "</h2></div>" +
           '<p class="ch-sub">' + c.sub + "</p>" +
           '<div contenteditable="true" spellcheck="false">' + c.html + "</div>" +
           "</article>";
  });
  $("toc-mobile").innerHTML = tocm;
  $("doc").innerHTML = doc;
  renderRail("plan", C);
}

/* ── pornire: reluăm de unde a rămas utilizatorul ─────────────────────── */
(function () {
  if (A.name) {
    $("i-name").value = A.name === "Cafeneaua" ? "" : A.name;
    $("i-idea").value = A.idea || "";
    $("i-city").value = A.city === "orașul tău" ? "" : A.city;
    $("i-zone").value = A.zone || "";
  }
  renderRail("intro");
})();
