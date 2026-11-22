/* Groundwork: generatorul planului. Totul determinist, din răspunsurile A.
   Separat de interfață (app.js) ca să poată crește independent. */

"use strict";

/* ── helpers ─────────────────────────────────────────────────────────── */
function has(qid, v) { return (A[qid] || []).indexOf(v) >= 0; }
function one(qid) { return (A[qid] || [])[0]; }
function pick(qid, map) { return map[one(qid)] || map._ || ""; }
function lei(n) { return Math.round(n).toLocaleString("ro-RO") + " lei"; }
function pct(n) { return Math.round(n) + "%"; }

/* acordul numeralelor: 24 de locuri, 12 locuri, 1 loc */
function nrDe(n, sg, pl) {
  var r = Math.abs(n) % 100;
  if (n === 1) return "1 " + sg;
  return n + ((r >= 20 || (r === 0 && n >= 100)) ? " de " : " ") + pl;
}

var FORMAT_NAME = { bar: "bar specialty", food: "cafenea cu food", togo: "concept to-go", roastery: "roastery café" };
var FOOD_NAME = { none: "fără food", viennoiserie: "viennoiserie și snacks", brunch: "brunch light", lunch: "bucătărie completă" };

/* ── modelul financiar ───────────────────────────────────────────────── */

/* costul lunar de echipă: 9.000 lei cost total angajator / persoană (2026) */
function staffCost() {
  var c = (A.baristas + 1) * 9000;
  if (one("food") === "brunch" || one("food") === "lunch") c += 8500;
  return c;
}

/* bonul mediu al unei vizite, din prețurile de referință + atașarea de food */
function bonMediu() {
  var cafea = (A.p_esp + 2 * A.p_fw) / 3;
  var attach = { none: 0, viennoiserie: 0.3, brunch: 0.45, lunch: 0.6 }[one("food")] || 0;
  return cafea + attach * A.p_food;
}

/* costuri fixe lunare: chirie + utilități + echipă + filtrare/service + diverse */
function fixedMonthly() {
  return A.rent + A.mp * 10 + staffCost() + 700 + 2500;
}

/* investiția estimată: amenajare + echipamente + capital de lucru 3-4 luni */
function investEstimate() {
  var perMp = { bar: 3000, food: 3800, togo: 2400, roastery: 3400 }[one("format")] || 3200;
  var base = A.mp * perMp;
  var equipment = { bar: 90000, food: 110000, togo: 70000, roastery: 160000 }[one("format")] || 100000;
  if (one("food") === "lunch") equipment += 60000; else if (one("food") === "brunch") equipment += 30000;
  if (A.terrace > 0) base += A.terrace * 900;
  var monthly = fixedMonthly();
  var wc = monthly * 3.5;
  return {
    base: base, equipment: equipment, monthly: monthly,
    wc: Math.round(wc / 5000) * 5000,
    low: Math.round((base + equipment + wc) * 0.85 / 5000) * 5000,
    high: Math.round((base + equipment + wc) * 1.2 / 5000) * 5000
  };
}

var BUDGET_MID = { b150: 120000, b300: 225000, b600: 450000, b600p: 750000 };
var BUDGET_LABEL = { b150: "sub 150.000 lei", b300: "150.000 – 300.000 lei", b600: "300.000 – 600.000 lei", b600p: "peste 600.000 lei" };

/* rata lunară a unui credit (anuitate), dobândă orientativă 9,5%/an, 5 ani */
function loanMonthly(credit) {
  if (credit <= 0) return 0;
  var i = 0.095 / 12, n = 60;
  return credit * i / (1 - Math.pow(1 + i, -n));
}

function creditNeeded(inv) {
  var eq = A.equity || 0;
  return Math.max(0, inv.high - eq);
}

/* pragul de rentabilitate, în clienți pe zi */
function breakEvenClients(rata) {
  var contrib = bonMediu() * 0.70; // după COGS de 30%
  return Math.ceil((fixedMonthly() + (rata || 0)) / (contrib * 30));
}

/* semnalul de preț: refolosit în wizard (live) și în capitolul Menu & Pricing */
function priceSignal() {
  var fw = A.p_fw;
  if (one("segment") === "mid" && (fw < 16 || fw > 24)) {
    return "<div class='callout'><strong>Semnal:</strong> un flat white de " + lei(fw) + " iese din intervalul tipic mid-range (16-24 lei în 2026). Ori repoziționezi prețul, ori îți asumi explicit segmentul " + (fw > 24 ? "premium" : "accesibil") + " în tot planul.</div>";
  }
  if (one("segment") === "premium" && fw < 22) {
    return "<div class='callout'><strong>Semnal:</strong> poziționare premium cu flat white sub 22 de lei contrazice povestea. Prețul face parte din produs.</div>";
  }
  if (one("segment") === "value" && fw > 18) {
    return "<div class='callout'><strong>Semnal:</strong> pentru segmentul accesibil, un flat white peste 18 lei va fi perceput ca scump în " + A.city + ".</div>";
  }
  return "";
}

/* paragraful Concept: sinteza răspunsurilor, confirmată înainte de plan */
function conceptText() {
  var hoursTxt = pick("hours", { h717: "7:00 – 17:00", h818: "8:00 – 18:00", h721: "7:00 – 21:00" });
  var svc = [];
  if (has("service", "counter")) svc.push("comandă la tejghea");
  if (has("service", "table")) svc.push("servire la masă");
  if (has("service", "togo")) svc.push("to-go");
  if (has("service", "delivery")) svc.push("delivery");
  if (has("service", "preorder")) svc.push("pre-order");
  var mom = [];
  if (has("moments", "commute")) mom.push("dimineața în drum spre birou");
  if (has("moments", "laptop")) mom.push("lucrul remote");
  if (has("moments", "social")) mom.push("întâlnirile de după-amiază");
  if (has("moments", "brunch")) mom.push("brunch-ul de weekend");
  if (has("moments", "family")) mom.push("familiile din cartier");
  return "<strong>" + A.name + "</strong> va fi " + (one("format") === "food" ? "o " : "un ") + FORMAT_NAME[one("format")] +
    " de " + nrDe(A.mp, "mp", "mp") + " cu " + nrDe(A.seats, "loc la masă", "locuri") +
    (A.terrace > 0 ? " și " + nrDe(A.terrace, "loc la terasă", "locuri la terasă") : "") +
    " în " + A.city + (A.zone ? ", zona " + A.zone : "") + ". Poziționare " +
    pick("segment", { value: "accesibilă", mid: "mid-range", premium: "premium" }) + ", cu " +
    pick("coffee", { espresso: "espresso", both: "espresso și filter", filter: "accent pe filter" }) +
    (one("food") !== "none" ? " și " + FOOD_NAME[one("food")] : ", fără food deocamdată") + ". " +
    "Cafeaua vine " + pick("roaster", { local: "de la o prăjitorie parteneră din România", import: "de la un prăjitor din străinătate", own: "din prăjitoria proprie" }) + ". " +
    "Servire: " + svc.join(", ") + ", program " + hoursTxt + ". Țintim " + mom.join(", ") + ". " +
    pick("founder", { barista: "Fondatorul lucrează zilnic la bar", manager: "Fondatorul conduce locația zi de zi", investor: "Fondatorul investește, iar operarea stă pe un head barista" }) +
    ", alături de " + nrDe(A.baristas, "barista", "bariști") + ". Buget: " + BUDGET_LABEL[one("budget")] +
    ", " + pick("goal", { lifestyle: "cu direcția unui loc bun și profitabil", growth: "cu direcția de creștere spre locații noi", franchise: "cu direcția unui brand de francizat" }) + ".";
}

/* ── customer journey pe momente ─────────────────────────────────────── */
var JOURNEY = {
  commute: { t: "Dimineața, în drum", rows: [
    ["Trotuar", "semnalizare vizibilă din mers, program afișat, geam prin care se vede barul", "decizia de a intra se ia în 3 secunde"],
    ["Comandă", "meniu scurt deasupra barului, plată contactless", "sub 30 de secunde pe comandă"],
    ["Așteptare", "barul la vedere, apă din partea casei", "maximum 4 minute de la ușă la cafea în mână"],
    ["Predare", "numele pe pahar, capacul pus corect", "zero erori de comandă"],
    ["Revenire", "cardul de fidelitate oferit la a doua vizită", "peste 40% revin în aceeași săptămână"]
  ]},
  laptop: { t: "Remote & laptop", rows: [
    ["Trotuar", "wifi-ul și prizele se văd din mesajele de pe geam și de pe Google", "alegerea locului se face de acasă"],
    ["Comandă", "recomandarea zilei la filter, ton prietenos", "prima comandă peste prețul espresso-ului"],
    ["Ședere", "prize la mese, wifi stabil, mese cu spațiu de lucru", "politica meselor lungi formulată pozitiv: o băutură la fiecare 90 de minute"],
    ["A doua comandă", "barista propune, nu așteaptă", "peste 50% comandă a doua oară"],
    ["Revenire", "locul lui preferat liber dimineața", "2-3 vizite pe săptămână"]
  ]},
  social: { t: "Întâlniri & social", rows: [
    ["Alegere", "recenziile și fotografiile cu mesele, nu doar cu cafeaua", "apare în topul zonei pe Google"],
    ["Comandă", "servire relaxată, fără presiune de timp", "bon cu 2 băuturi și ceva dulce"],
    ["Ședere", "mese care permit conversația, zgomot controlat", "45-60 de minute confortabile"],
    ["Plată", "împărțirea notei fără discuții, plată la masă dacă există servire", "zero fricțiune la final"],
    ["Revenire", "locul devine „unde ne vedem”", "revine cu alți oameni"]
  ]},
  brunch: { t: "Brunch de weekend", rows: [
    ["Rezervare", "un sistem simplu de rezervări, și mesaj de confirmare", "masa garantată fără telefoane"],
    ["Primire", "așezare în 2 minute, apă și meniu pe masă", "startul fără așteptare"],
    ["Comandă", "meniu scurt de brunch, iese din bucătărie sub 15 minute", "bon dublu față de o vizită de cafea"],
    ["Ședere", "60-90 de minute, cafeaua a doua propusă la desert", "mesele se rotesc de 3 ori pe zi"],
    ["Revenire", "rezervarea următoare oferită la plecare", "weekendurile pline cu 2 săptămâni înainte"]
  ]},
  family: { t: "Familii & cartier", rows: [
    ["Intrare", "spațiu pentru cărucior, ușă accesibilă", "familia intră fără acrobații"],
    ["Comandă", "băutură pentru copii, ceva dulce corect", "toată masa are ce comanda"],
    ["Ședere", "colț tolerant la zgomot, toaletă accesibilă", "părinții stau relaxați, nu în gardă"],
    ["Plată", "rapidă, la tejghea sau la masă", "plecarea fără stres"],
    ["Revenire", "numele copilului ținut minte", "ritual de weekend al familiei"]
  ]}
};

/* ── capitolele planului ─────────────────────────────────────────────── */
function chapters() {
  var inv = investEstimate();
  var bon = bonMediu();
  var venitLunar = A.clients * bon * 30;
  var credit = (has("source", "loan")) ? creditNeeded(inv) : 0;
  var rata = loanMonthly(credit);
  var beC = breakEvenClients(rata);
  var ramp = [0.75, 1, 1.25, 1.5].map(function (f) { return Math.round(A.clients * f); });

  var momentsTxt = [];
  if (has("moments", "commute")) momentsTxt.push("dimineața de 6:30-9:30, când oamenii trec spre birou și vor cafea bună, repede");
  if (has("moments", "laptop")) momentsTxt.push("intervalul 10:00-16:00, al celor care lucrează remote și caută un birou cu espressor");
  if (has("moments", "social")) momentsTxt.push("după-amiaza întâlnirilor, unde contează mesele și liniștea conversației");
  if (has("moments", "brunch")) momentsTxt.push("weekendul de brunch, cu bonuri duble și timp lung la masă");
  if (has("moments", "family")) momentsTxt.push("familiile din cartier, care revin zilnic dacă se simt binevenite");

  var C = [];

  /* 1 ── Executive Summary */
  C.push({ t: "Executive Summary", sub: "Sumarul executiv: pagina pe care o citește toată lumea", pro: false, html:
    "<p><strong>" + A.name + "</strong> este un proiect de " + FORMAT_NAME[one("format")] + " în " + A.city + (A.zone ? ", zona " + A.zone : "") + ": " +
    nrDe(A.mp, "mp", "mp") + ", " + nrDe(A.seats, "loc la masă", "locuri") + (A.terrace > 0 ? " plus " + nrDe(A.terrace, "loc", "locuri") + " la terasă" : "") + ", poziționat " +
    pick("segment", { value: "accesibil, cu prețuri corecte care invită la vizite zilnice", mid: "mid-range, unde calitatea specialty rămâne accesibilă zi de zi", premium: "premium, cu o experiență care justifică fiecare leu" }) + ".</p>" +
    (A.idea ? "<p>Punctul de plecare, în cuvintele fondatorului: „" + A.idea + "”.</p>" : "") +
    "<p>Oferta: " + pick("coffee", { espresso: "program de espresso executat impecabil", both: "espresso pentru ritmul dimineții și filter pentru identitate", filter: "un program de filter care diferențiază locul de orice altă cafenea din zonă" }) +
    ", completat de " + FOOD_NAME[one("food")] + ". Echipa de start: fondatorul " +
    pick("founder", { barista: "prezent zilnic la bar", manager: "în rol de manager activ", investor: "în rol de investitor, cu un head barista responsabil de operare" }) +
    " și " + nrDe(A.baristas, "barista", "bariști") + ". " +
    pick("experience", {
      none: "Fondatorul e la prima afacere în domeniu și compensează prin plan, training structurat și un head barista cu experiență.",
      barista: "Fondatorul vine din spatele barului, cu experiență directă de specialty.",
      manager: "Fondatorul a mai condus o locație și cunoaște operarea de zi cu zi.",
      owner: "Fondatorul a mai construit o afacere și știe ce înseamnă primul an." }) + "</p>" +
    "<p>Cifrele de lucru: " + nrDe(A.clients, "client", "clienți") + " pe zi în media anului 1, bon mediu estimat " + lei(bon) +
    ", venit lunar de referință " + lei(venitLunar) + ". Investiția estimată: între " + lei(inv.low) + " și " + lei(inv.high) +
    ", cu un capital de lucru de aproximativ " + lei(inv.wc) + " (3-4 luni de funcționare, neatins în ziua deschiderii). Obiectivul: " +
    pick("goal", { lifestyle: "o locație profitabilă și stabilă, cu marjă netă de 8-15% din anul 2", growth: "validarea modelului în prima locație și extinderea la a doua în 24-30 de luni", franchise: "construirea unui brand și a unui manual de operare care să susțină francizarea" }) + ".</p>" +
    (has("source", "loan") ? "<p>Finanțarea solicitată: credit de investiții de aproximativ " + lei(credit) + ", cu aport propriu de " + lei(A.equity || 0) +
      " (" + pct((A.equity || 0) / inv.high * 100) + " din investiția estimată), destinat echipamentelor și amenajării.</p>" : "")
  });

  /* 2 ── The Concept */
  C.push({ t: "The Concept", sub: "Conceptul și povestea locului", pro: false, html:
    "<p>" + A.name + " nu concurează cu toate cafenelele din " + A.city + ", ci cu felul în care arată o zi obișnuită din viața oamenilor din " + (A.zone || "zona aleasă") + ". " +
    pick("vibe", { calm: "Atmosfera e calmă și minimalistă: un loc în care zgomotul orașului rămâne la ușă, iar cafeaua are spațiu să fie luată în serios.",
      social: "Atmosfera e vie și socială: un loc cu energie, în care barista vorbește cu oamenii peste tejghea și muzica face parte din produs.",
      neighborhood: "Atmosfera e de cartier: numele oaspeților se țin minte, comanda „ca de obicei” există, iar locul devine o prelungire a sufrageriei." }) + "</p>" +
    "<p>Formatul de " + FORMAT_NAME[one("format")] + " pe " + nrDe(A.mp, "mp", "mp") + " înseamnă " +
    pick("format", { bar: "un bar dominant, puține locuri și un flux rapid: totul e construit în jurul calității în ceașcă și al vitezei",
      food: "un echilibru între bar și zona de mese: cafeaua aduce frecvența, food-ul aduce valoarea bonului și timpul petrecut",
      togo: "un punct compact, cu flux de trecere: viteza și consistența sunt întregul produs",
      roastery: "prăjitoria la vedere ca spectacol central: locul vinde nu doar cafea, ci și povestea originii ei, plus boabele la raft" }) + ".</p>" +
    (A.idea ? "<p>Așa sună ideea, spusă de fondator: „" + A.idea + "”. Planul de față o transformă în decizii concrete de meniu, echipă, spațiu și bani.</p>" : "")
  });

  /* 3 ── The Market */
  C.push({ t: "The Market", sub: "Piața, zona și competiția locală", pro: false, html:
    "<p>Piața de cafea specialty din România crește constant, dar crește și competiția: diferențierea nu mai vine din „avem cafea bună”, ci din consistență, servire și poziția în ziua clientului. Pentru " + A.name + ", piața relevantă nu e " + A.city + " întreg, ci raza de 10 minute de mers pe jos din jurul locației" + (A.zone ? " din " + A.zone : "") + ".</p>" +
    "<p>Profilul zonei: " + pick("area", {
      office: "zonă de birouri, puternică de luni până vineri, cu vârf de dimineață și prânz; slăbește vizibil în august și în weekenduri.",
      residential: "cartier rezidențial, cel mai stabil profil: flux constant, weekenduri bune, clienți care devin obișnuiți.",
      student: "zonă studențească, vie în timpul anului universitar și aproape goală din iulie până în septembrie.",
      tourist: "zonă centrală sau turistică: vară puternică, iarnă lungă, clientelă care se schimbă zilnic." }) + "</p>" +
    "<div class='callout'><strong>De făcut pe teren:</strong> petrece două dimineți (una de marți, una de sâmbătă) în fața spațiului vizat și numără: câți oameni trec între 7:30 și 9:30, câți intră la competitorii din zonă, cât așteaptă la coadă. Patru ore de numărat bat orice studiu cumpărat.</div>" +
    "<ul><li><strong>Competitori direcți:</strong> cafenelele specialty din aceeași zonă de mers pe jos. De cartografiat: prețul flat white-ului, programul, locurile, viteza la vârf.</li>" +
    "<li><strong>Competitori indirecți:</strong> lanțurile (5 to go, Starbucks, Ted's), benzinăriile premium și espressoarele din birouri. Concurează pe preț și comoditate, nu pe calitate.</li>" +
    "<li><strong>Avantajul apărabil:</strong> " + pick("vibe", { calm: "experiența calmă, care nu există în lanțuri", social: "relația personală barista-oaspete, imposibil de copiat la scară", neighborhood: "loialitatea de cartier, construită vizită cu vizită" }) + ".</li></ul>"
  });

  /* 4 ── The Guests, cu customer journey pe fiecare moment */
  var guestsHtml;
  if (momentsTxt.length === 0) {
    guestsHtml = "<p>Planul nu are încă momente alese. Întoarce-te la pasul 5 și alege cel puțin unul: restul capitolului se construiește pe el.</p>";
  } else {
    guestsHtml = momentsTxt.length === 1
      ? "<p>" + A.name + " nu își propune să fie cafeneaua tuturor. Planul câștigă un singur moment din zi, ales deliberat:</p>"
      : "<p>" + A.name + " nu își propune să fie cafeneaua tuturor. Planul câștigă " + momentsTxt.length + " momente precise din zi:</p>";
    guestsHtml += "<ul>" + momentsTxt.map(function (m) { return "<li>" + m + ";</li>"; }).join("") + "</ul>" +
      "<p>Fiecare moment are drumul lui, de la trotuar până la „pe mâine”. Mai jos, fiecare drum desenat, cu ținta operațională pe fiecare etapă:</p>";
    (A.moments || []).forEach(function (m) {
      var j = JOURNEY[m];
      if (!j) return;
      guestsHtml += "<p><strong>" + j.t + "</strong></p><table><tr><th>Etapă</th><th>Ce trăiește oaspetele</th><th>Ținta operațională</th></tr>" +
        j.rows.map(function (r) { return "<tr><td>" + r[0] + "</td><td>" + r[1] + "</td><td>" + r[2] + "</td></tr>"; }).join("") + "</table>";
    });
  }
  C.push({ t: "The Guests", sub: "Clienții, momentele zilei și drumul fiecăruia prin local", pro: false, html: guestsHtml });

  /* 5 ── Menu & Pricing */
  var costFW = Math.round((18 / 1000 * 180 + 0.18 * 8 + 0.8) * 10) / 10;
  var costPct = Math.round(costFW / A.p_fw * 100);
  C.push({ t: "Menu & Pricing", sub: "Meniul și arhitectura prețurilor", pro: false, html:
    "<p>Meniul de start e scurt și stăpânit: " + pick("coffee", { espresso: "linia completă de espresso (espresso, macchiato, flat white, cappuccino, latte)", both: "linia de espresso plus 2-3 origini la filter, rotite lunar", filter: "3-4 origini la filter ca nucleu, cu espresso în rol secundar" }) +
    (one("altmilk") !== "no" ? ", lapte vegetal " + (one("altmilk") === "incl" ? "inclus în preț" : "cu supliment") : "") +
    ", iar la food: " + pick("food", { none: "nimic deocamdată, decizie asumată pentru simplitate operațională", viennoiserie: "viennoiserie de la un furnizor local bun plus 2-3 snacks, fără bucătărie caldă", brunch: "un meniu de brunch scurt (5-7 poziții), servit până la 15:00", lunch: "mic dejun și prânz complet, cu un meniu care se schimbă sezonier" }) + ".</p>" +
    "<table><tr><th>Ancoră</th><th>Preț</th><th>Rol în meniu</th></tr>" +
    "<tr><td>Espresso</td><td>" + lei(A.p_esp) + "</td><td>ancora de jos: definește percepția de corectitudine</td></tr>" +
    "<tr><td>Flat white</td><td>" + lei(A.p_fw) + "</td><td>vedeta: cel mai vândut produs pe lapte, reperul comparației cu competiția</td></tr>" +
    (one("food") !== "none" ? "<tr><td>Bon mediu food</td><td>" + lei(A.p_food) + "</td><td>ridică bonul mediu al vizitei peste pragul de sustenabilitate</td></tr>" : "") +
    "</table>" + priceSignal() +
    "<p>Exemplu de calcul care se repetă pentru fiecare produs: un flat white costă aproximativ " + costFW.toLocaleString("ro-RO") + " lei în materie primă (18 g cafea, 180 ml lapte, consumabile), adică " + costPct + "% din prețul de " + lei(A.p_fw) + ". Peste 35% pe un produs de volum, rețeta sau prețul se corectează.</p>" +
    "<div class='callout'><strong>Despre TVA:</strong> prețurile din meniu includ TVA. Pentru servirea în local se aplică de regulă cota redusă, iar pentru boabele vândute la raft și o parte dintre băuturile îmbuteliate cota standard. Configurarea corectă pe POS se face cu contabilul înainte de prima zi, nu după primul control.</div>" +
    "<p>Regula de disciplină: niciun produs nou nu intră în meniu fără să iasă altul și fără să-i fie calculat costul pe porție (COGS) înainte de prima vânzare.</p>"
  });

  /* 6 ── Suppliers & The Coffee Program */
  var kgLunar = Math.round(A.clients * 0.85 * 18 / 1000 * 30);
  var litriLapte = Math.round(A.clients * 0.6 * 0.18 * 30);
  var supRows = "<tr><td>Cafea</td><td>" + pick("roaster", { local: "prăjitorie parteneră din România: boabe proaspete, training, calibrare", import: "prăjitor din străinătate: identitate puternică, logistică de planificat", own: "prăjire proprie: control total, responsabilitate totală" }) + "</td><td>a doua prăjitorie testată și agreată din timp</td></tr>" +
    "<tr><td>Lapte" + (one("altmilk") !== "no" ? " + lapte vegetal" : "") + "</td><td>lăptărie locală, livrare la 2 zile</td><td>un furnizor de rezervă cu comandă de probă făcută</td></tr>" +
    (one("food") === "viennoiserie" ? "<tr><td>Viennoiserie</td><td>furnizor local bun, comandă cu 24h înainte, retur zero</td><td>al doilea furnizor; risipă ținută sub 8%</td></tr>" : "") +
    (has("service", "togo") ? "<tr><td>Ambalaje to-go</td><td>pahare, capace, sleeve-uri cu brand</td><td>stoc tampon de 2 săptămâni</td></tr>" : "") +
    "<tr><td>Service echipamente</td><td>contract de mentenanță cu intervenție sub 48 de ore</td><td>semnat înainte de deschidere, nu după prima pană</td></tr>" +
    "<tr><td>Filtrare apă</td><td>cartușe schimbate la 2-3 luni, după duritatea apei</td><td>calendarul schimburilor în registrul echipei</td></tr>";
  C.push({ t: "Suppliers & The Coffee Program", sub: "Furnizorii, consumurile și programul de cafea", pro: true, html:
    "<p>La " + nrDe(A.clients, "client", "clienți") + " pe zi, consumul de cafea e de aproximativ <strong>" + kgLunar + " kg pe lună</strong>; la prețul en-gros specialty de 160-220 lei/kg, bugetul de boabe e " + lei(kgLunar * 160) + " – " + lei(kgLunar * 220) + " pe lună. Laptele: aproximativ " + litriLapte + " litri pe lună.</p>" +
    "<table><tr><th>Furnizor</th><th>Rolul</th><th>Planul B</th></tr>" + supRows + "</table>" +
    "<p>Programul de cafea: " + pick("coffee", { espresso: "o singură cafea de espresso, schimbată sezonier, executată perfect", both: "o cafea de espresso stabilă plus 2-3 origini la filter, rotite lunar", filter: "3-4 origini la filter, rotite lunar, cu povestea fiecăreia spusă la bar" }) +
    ". Dial-in zilnic notat în registru, o cupping pe săptămână cu toată echipa: consistența nu e talent, e sistem.</p>" +
    (one("roaster") === "local" ? "<div class='callout'><strong>Despre comodat:</strong> espressorul în comodat de la prăjitorie reduce investiția cu 40-60.000 lei, dar te leagă de un singur furnizor și de prețul lui pe kg. Se acceptă doar cu termen de ieșire clar scris în contract.</div>" : "") +
    (one("roaster") === "own" && one("format") !== "roastery" ? "<div class='callout'><strong>Semnal:</strong> prăjirea proprie cere spațiu dedicat, ventilație autorizată și autorizație de mediu. Cu formatul ales, mai realist e un partener de prăjire în primul an.</div>" : "")
  });

  /* 7 ── Marketing & Launch */
  C.push({ t: "Marketing & Launch", sub: "Cum află lumea și de ce revine", pro: true, html:
    "<p>Marketingul unei cafenele noi are două faze distincte: înainte de deschidere construiești curiozitate, după deschidere construiești obișnuință. Bugetul e mic, deci fiecare leu merge în lucruri care se văd din stradă sau se dau mai departe.</p>" +
    "<ul><li><strong>Faza 0 (6 săptămâni înainte):</strong> cont de Instagram cu povestea amenajării, geamul folosit ca afiș („deschidem aici în curând”), relație cu 3-4 creatori locali din " + A.city + " invitați la preview.</li>" +
    "<li><strong>Soft opening (1 săptămână):</strong> prieteni, vecini și comercianții de pe aceeași stradă, cafea din partea casei, feedback structurat pe flux și produs.</li>" +
    "<li><strong>Primele 90 de zile:</strong> card de fidelitate simplu (a 10-a cafea din partea casei), prezență constantă pe Instagram (3 postări/săptămână, nu campanii), parteneriate cu birourile din zonă" + (has("moments", "brunch") ? " și un sistem simplu de rezervări pentru brunch-ul de weekend" : "") + ".</li>" +
    (has("service", "delivery") ? "<li><strong>Delivery:</strong> listare pe o singură platformă la început, cu meniu redus care călătorește bine; comisionul de 25-30% se acceptă doar pe produsele cu marjă mare.</li>" : "") +
    "</ul><p>Indicatorul care contează în primele luni nu e numărul de urmăritori, ci rata de revenire: câți dintre oaspeții de luni se întorc până vineri.</p>"
  });

  /* 8 ── Operations & Team */
  C.push({ t: "Operations & Team", sub: "Operațiuni, echipă și responsabilități", pro: true, html:
    "<p>Structura de start: fondatorul " + pick("founder", { barista: "lucrează zilnic la bar și deține calitatea, rețetele și relația cu oaspeții", manager: "conduce operațional fără a fi legat de bar: program, furnizori, cifre, echipă", investor: "deleagă operarea unui head barista cu mandat clar și raportare săptămânală pe cifre" }) +
    ", " + nrDe(A.baristas, "barista", "bariști") + (one("food") === "lunch" || one("food") === "brunch" ? ", plus bucătar responsabil de partea de food" : "") + ".</p>" +
    "<p>Costul real al unui barista bun în 2026: 4.000-5.500 lei net, adică 8.000-11.000 lei cost total pentru angajator. Sub piață nu se angajează oameni care să țină calitatea.</p>" +
    (one("experience") === "none" ? "<div class='callout'><strong>Recomandare:</strong> la prima afacere în domeniu, primul angajat e un head barista cu minimum 2 ani de bar, iar fondatorul face cursul de igienă și unul de management HoReCa înainte de deschidere. E și răspunsul anticipat la obiecția băncii.</div>" : "") +
    "<p>Fiecare zonă de responsabilitate are un singur proprietar (principiul RACI: un responsabil, un decident pe fiecare sarcină):</p>" +
    "<table><tr><th>Zona</th><th>Proprietar</th></tr>" +
    "<tr><td>Calitate cafea & rețete (dial-in zilnic)</td><td>" + (one("founder") === "barista" ? "fondatorul" : "head barista") + "</td></tr>" +
    "<tr><td>Program & ture</td><td>" + (one("founder") === "investor" ? "head barista" : "fondatorul") + "</td></tr>" +
    "<tr><td>Comenzi & furnizori</td><td>" + (one("founder") === "investor" ? "head barista" : "fondatorul") + "</td></tr>" +
    (one("food") !== "none" ? "<tr><td>Food: producție / recepție & etichetare</td><td>" + (one("food") === "viennoiserie" ? "barista de serviciu" : "bucătarul") + "</td></tr>" : "") +
    "<tr><td>Cifre: P&L lunar, cash</td><td>fondatorul</td></tr></table>" +
    "<p>Instrumente din ziua 1: registru de rețete și dial-in (un singur adevăr pentru toată echipa), checklist de deschidere/închidere și o oră pe săptămână de degustare împreună.</p>"
  });

  /* 9 ── Space & Equipment */
  var eq = { bar: ["Espressor 2 grupuri (clasa La Marzocco Linea / Victoria Arduino Eagle One)", "2 râșnițe espresso + 1 râșniță filter", "Filtru batch brew", "Frigidere bar + vitrină mică", "Blat tehnic cu chiuvete conforme DSP"],
             food: ["Espressor 2 grupuri", "2 râșnițe espresso + 1 filter", "Batch brew", "Vitrină food dublă (caldă/rece după meniu)", "Echipare bucătărie după nivelul de food ales", "POS cu modul de stocuri"],
             togo: ["Espressor 2 grupuri rapid", "2 râșnițe", "Batch brew de volum", "Vitrină compactă", "Fereastră/flux de servire dedicat"],
             roastery: ["Prăjitor 5-15 kg cu ventilație autorizată", "Espressor 2 grupuri", "Râșnițe espresso + retail", "Zonă de ambalare și raft de boabe", "Spațiu verde de depozitare"] }[one("format")].slice();
  eq.push("Sistem de filtrare a apei dimensionat după duritatea apei din " + A.city + "; garanția espressorului depinde de el");
  eq.push("Contract de service pentru espressor și râșnițe, cu timp de intervenție sub 48 de ore");
  if (A.terrace > 0) eq.push("Echipare terasă: mobilier de exterior, umbrele, pături pe scaun în sezonul rece");
  C.push({ t: "Space & Equipment", sub: "Spațiul, fluxul și echipamentele", pro: true, html:
    "<p>Pe " + nrDe(A.mp, "mp", "mp") + ", prioritatea e fluxul, nu estetica: oaspetele intră, comandă, așteaptă și primește fără să se încrucișeze cu cei care pleacă" + (A.seats > 0 ? ", iar locurile la masă sunt dispuse astfel încât barul să rămână scena principală" : "") + ". Amenajarea se bugetează la " + lei({ bar: 3000, food: 3800, togo: 2400, roastery: 3400 }[one("format")] || 3200) + "/mp (medie realistă pentru " + A.city + ", de la instalații la mobilier).</p>" +
    "<p>Echipamentele de bază pentru formatul ales:</p><ul>" + eq.map(function (e) { return "<li>" + e + ";</li>"; }).join("") + "</ul>" +
    "<div class='callout'><strong>Despre apă:</strong> înainte de a comanda espressorul, se face testul de duritate al apei de la locație (gratuit la majoritatea distribuitorilor). Duritatea mare, frecventă în România, cere filtrare cu schimb de cartușe la 2-3 luni. Costul de 200-400 lei pe lună e protecția unei investiții de zeci de mii; funcționarea fără filtrare anulează garanția și strică gustul.</div>" +
    "<div class='callout'><strong>Regulă de buget:</strong> espressorul și râșnițele nu sunt locul de economisit, acolo se aude diferența în ceașcă. Economiile se fac la mobilier (second-hand bun) și la lucrările care nu ating instalațiile.</div>"
  });

  /* 10 ── The Numbers */
  var chPct = (A.rent + A.mp * 10) / venitLunar * 100;
  var stPct = staffCost() / venitLunar * 100;
  var q = ramp.map(function (c) {
    var v = c * bon * 30;
    var rez = v - v * 0.30 - staffCost() - (A.rent + A.mp * 10) - v * 0.08 - 700 - 2500 - rata;
    return { c: c, v: v, rez: rez };
  });
  var an1 = q.reduce(function (s, x) { return s + x.rez * 3; }, 0);
  var beluna = "";
  for (var qi = 0; qi < q.length; qi++) { if (q[qi].c >= beC) { beluna = ["lunile 1-3", "lunile 4-6", "lunile 7-9", "lunile 10-12"][qi]; break; } }
  var bm = BUDGET_MID[one("budget")];
  var fitNote;
  if (bm < inv.low * 0.9) fitNote = "<div class='callout'><strong>Semnal important:</strong> bugetul declarat (" + BUDGET_LABEL[one("budget")] + ") este sub estimarea pentru acest format. Variante: spațiu mai mic, format to-go, echipamente refurbished sau extinderea bugetului înainte de a semna orice contract de chirie.</div>";
  else if (bm > inv.high * 1.3) fitNote = "<div class='callout'><strong>De remarcat:</strong> bugetul declarat depășește confortabil estimarea. Diferența nu se cheltuie pe amenajare mai scumpă, ci rămâne rezervă: cel mai bun prieten al unei cafenele noi e un cont care nu se golește.</div>";
  else fitNote = "<div class='callout'><strong>Verificare:</strong> bugetul declarat se potrivește cu estimarea formatului. Următorul pas e transformarea estimării în deviz real, pe oferte.</div>";
  C.push({ t: "The Numbers", sub: "Venitul, costurile și pragul de rentabilitate", pro: false, html:
    "<p>Bonul mediu estimat: <strong>" + lei(bon) + "</strong>, calculat din prețurile tale de referință" + (one("food") !== "none" ? " și o rată de atașare food de " + Math.round({ viennoiserie: 30, brunch: 45, lunch: 60 }[one("food")]) + "%" : "") +
    ". La " + nrDe(A.clients, "client", "clienți") + " pe zi, venitul lunar de referință este <strong>" + lei(venitLunar) + "</strong>.</p>" +
    "<p>Proiecția primului an, pe o rampă realistă de clienți (estimare de lucru, de înlocuit cu oferte și contracte reale la dosar):</p>" +
    "<table><tr><th>Perioada</th><th>Clienți/zi</th><th>Venit lunar</th><th>Rezultat lunar</th></tr>" +
    q.map(function (x, i) {
      return "<tr><td>" + ["Lunile 1-3", "Lunile 4-6", "Lunile 7-9", "Lunile 10-12"][i] + "</td><td>" + x.c + "</td><td>" + lei(x.v) + "</td><td>" + (x.rez >= 0 ? "+" : "") + lei(x.rez) + "</td></tr>";
    }).join("") +
    "<tr><td><strong>Total an 1</strong></td><td></td><td></td><td><strong>" + (an1 >= 0 ? "+" : "") + lei(an1) + "</strong></td></tr></table>" +
    "<div class='callout'><strong>Pragul de rentabilitate:</strong> aproximativ <strong>" + nrDe(beC, "client", "clienți") + " pe zi</strong>" + (rata > 0 ? " (cu rata creditului inclusă)" : "") + ". Sub acest nivel, fiecare lună consumă din rezervă; peste el, locul construiește. " +
    (beluna ? "În scenariul de lucru, pragul se atinge în " + beluna + "." : "În scenariul de lucru, rampa primului an nu atinge pragul: de redus costurile fixe sau de regândit formatul înainte de a merge mai departe.") + "</div>" +
    (beC > 120 ? "<div class='callout'><strong>Semnal:</strong> pragul depășește realitatea primului an (60-120 de clienți pe zi). De redus costurile fixe sau de regândit formatul înainte de orice semnătură.</div>" : "") +
    "<p>Verificările de sănătate pe cifrele tale: chiria + utilitățile înseamnă " + pct(chPct) + " din venit (sănătos: sub 15%)" + (chPct > 15 ? ", <strong>peste prag</strong>" : "") +
    ", echipa " + pct(stPct) + " (sănătos: 30-35%)" + (stPct > 38 ? ", <strong>peste prag</strong>" : "") + ".</p>" + fitNote +
    "<p>" + pick("area", {
      office: "Sezonalitate: zona de birouri aduce de regulă cu 30-40% mai puțini clienți în august. Luna se bugetează ca lună slabă din start.",
      residential: "Sezonalitate: profilul rezidențial e cel mai stabil. Weekendurile și terasa fac diferența între o lună bună și una foarte bună.",
      student: "Sezonalitate: iulie-septembrie sunt lunile de supraviețuit în zonele studențești. Rezerva de capital se dimensionează pe ele, nu pe octombrie.",
      tourist: "Sezonalitate: iarna e lungă în zonele turistice. Vara trebuie să acopere și lunile de 50%." }) + "</p>" +
    "<p>Investiția totală estimată: <strong>" + lei(inv.low) + " – " + lei(inv.high) + "</strong>, din care capital de lucru ~" + lei(inv.wc) + ".</p>"
  });

  /* 11 ── The Financing */
  var eqv = A.equity || 0;
  C.push({ t: "The Financing", sub: "Planul de finanțare: surse, utilizări și serviciul datoriei", pro: true, html:
    "<p>Pe ce se duc banii și de unde vin, în structura pe care o citește orice bancă sau investitor:</p>" +
    "<table><tr><th>Utilizări</th><th>Suma estimată</th></tr>" +
    "<tr><td>Amenajare (" + nrDe(A.mp, "mp", "mp") + ")</td><td>" + lei(inv.base) + "</td></tr>" +
    "<tr><td>Echipamente</td><td>" + lei(inv.equipment) + "</td></tr>" +
    "<tr><td>Capital de lucru (3-4 luni)</td><td>" + lei(inv.wc) + "</td></tr>" +
    "<tr><td><strong>Total</strong></td><td><strong>" + lei(inv.base + inv.equipment + inv.wc) + "</strong></td></tr></table>" +
    "<table><tr><th>Surse</th><th>Suma</th></tr>" +
    "<tr><td>Aport propriu</td><td>" + (has("source", "loan") || has("source", "grant") ? lei(eqv) : "integral din economii, conform răspunsurilor") + "</td></tr>" +
    (has("source", "loan") ? "<tr><td>Credit bancar de investiții</td><td>" + lei(credit) + "</td></tr>" : "") +
    (has("source", "grant") ? "<tr><td>Finanțare nerambursabilă</td><td>de dimensionat pe ghidul sesiunii active</td></tr>" : "") +
    (has("source", "investor") ? "<tr><td>Investitor / asociat</td><td>conform acordului dintre asociați</td></tr>" : "") +
    "</table>" +
    (has("source", "loan") ?
      "<p>Rata lunară estimată: <strong>" + lei(rata) + "</strong>, la o dobândă orientativă de 9,5% pe an (IRCC plus marjă), pe 5 ani; oferta reală a băncii poate diferi. " +
      (function () {
        var ebitda = venitLunar - venitLunar * 0.30 - staffCost() - (A.rent + A.mp * 10) - venitLunar * 0.08 - 700 - 2500;
        var dscr = rata > 0 ? ebitda / rata : 99;
        return "Gradul de acoperire a ratei (DSCR) la media anului 1: aproximativ " + (Math.round(dscr * 10) / 10).toLocaleString("ro-RO") + "." +
          (dscr < 1.2 ? " <strong>Semnal:</strong> băncile cer de regulă minimum 1,2; variante: credit mai mic, perioadă mai lungă sau aport mai mare." : " Peste pragul uzual de 1,2 cerut de bănci.");
      })() + "</p>" +
      (eqv < 0.15 * inv.high ? "<div class='callout'><strong>Semnal:</strong> aportul propriu de " + pct(eqv / inv.high * 100) + " e sub pragul uzual de 15% cerut la start-up. De crescut aportul sau de redus investiția înainte de depunerea dosarului.</div>" : "") +
      "<p>Garanții: " + pick("collateral", { state: "garanția de stat (FNGCIMM / FRC) poate acoperi până la 80% din credit, restul prin fideiusiune personală.", personal: "fideiusiune personală; de verificat și eligibilitatea pentru garanția de stat, care reduce expunerea personală.", realestate: "ipotecă pe imobil, cea mai puternică garanție în analiza băncii." }) +
      " Dosarul include CV-ul fondatorului și dovezile de experiență" + (one("experience") === "none" ? "; la profil de debutant, contractul head barista-ului intră la dosar" : "") + ".</p>"
      : "<p>Fără credit bancar în plan, dosarul de finanțare rămâne simplu: dovada aportului și devizele pe oferte reale. Dacă pe parcurs apare nevoia de credit, capitolul acesta se recalculează din aceleași răspunsuri.</p>")
  });

  /* 12 ── Funding Programs (doar cu grant sau credit în surse) */
  if (has("source", "grant") || has("source", "loan")) {
    C.push({ t: "Funding Programs", sub: "Programe de finanțare pentru start-up în România", pro: true, html:
      "<ul>" +
      "<li><strong>Start-Up Nation:</strong> finanțare nerambursabilă de până la 250.000 lei, condiționată de locuri de muncă create și menținute. " +
      (A.baristas >= 2 ? "Planul tău de echipă (" + nrDe(A.baristas, "barista", "bariști") + ") acoperă deja cerința pentru punctaj bun." : "Echipa planificată e sub pragul uzual de 2 angajați pentru punctaj maxim; de recalculat dacă aplici.") +
      " Sesiunile se deschid periodic, iar criteriile se schimbă de la ediție la ediție; planul de față e construit să treacă de orice grilă: cifre bottom-up, prag de rentabilitate, capital de lucru.</li>" +
      "<li><strong>IMM Plus / InvestEU:</strong> credite cu garanție de stat de până la 90%, cu dobândă subvenționată în unele scheme. Relevant pentru componenta de credit din planul tău.</li>" +
      "</ul>" +
      "<table><tr><th>Cheltuială</th><th>Eligibilitate tipică</th></tr>" +
      "<tr><td>Echipamente (" + lei(inv.equipment) + ")</td><td>eligibile aproape în toate programele</td></tr>" +
      "<tr><td>Amenajare (" + lei(inv.base) + ")</td><td>eligibilă parțial, după program</td></tr>" +
      "<tr><td>Chirie și salarii</td><td>de regulă neeligibile: se acoperă din aport sau credit</td></tr>" +
      "<tr><td>Capital de lucru (" + lei(inv.wc) + ")</td><td>doar parțial, în unele scheme</td></tr></table>" +
      "<div class='callout'><strong>Regula practică:</strong> grantul se tratează ca accelerator, nu ca fundație. Planul trebuie să stea în picioare și fără el.</div>"
    });
  }

  /* 13 ── Risks & Plan B, cu scenarii în lei */
  var scen = [0.7, 1, 1.4].map(function (f) {
    var c = Math.round(A.clients * f);
    var v = c * bon * 30;
    var rez = v - v * 0.30 - staffCost() - (A.rent + A.mp * 10) - v * 0.08 - 700 - 2500 - rata;
    return { nume: f < 1 ? "Pesimist" : (f === 1 ? "De bază" : "Optimist"), c: c, v: v, rez: rez };
  });
  var pes = scen[0];
  var luniRezerva = pes.rez < 0 ? Math.floor(inv.wc / -pes.rez) : null;
  C.push({ t: "Risks & Plan B", sub: "Scenarii cu cifre, riscuri și răspunsuri pregătite", pro: true, html:
    "<p>Întâi scenariile, în lei, pe aceleași formule ca restul planului:</p>" +
    "<table><tr><th>Scenariu</th><th>Clienți/zi</th><th>Venit lunar</th><th>Rezultat lunar</th><th>Rezerva</th></tr>" +
    scen.map(function (s) {
      return "<tr><td>" + s.nume + "</td><td>" + s.c + "</td><td>" + lei(s.v) + "</td><td>" + (s.rez >= 0 ? "+" : "") + lei(s.rez) + "</td><td>" +
        (s.rez >= 0 ? "rămâne neatinsă" : "ține ~" + Math.floor(inv.wc / -s.rez) + " luni") + "</td></tr>";
    }).join("") + "</table>" +
    (luniRezerva !== null && luniRezerva < 3
      ? "<div class='callout'><strong>Semnal:</strong> în scenariul pesimist, capitalul de lucru planificat se consumă în sub 3 luni. De crescut rezerva înainte de semnarea chiriei.</div>"
      : (luniRezerva !== null ? "<p>În scenariul slab, rezerva acoperă aproximativ " + nrDe(luniRezerva, "lună", "luni") + ": suficient pentru corecții fără decizii sub presiune.</p>" : "<p>Chiar și scenariul pesimist rămâne pe plus: poziție rară și de păstrat prin disciplina costurilor fixe.</p>")) +
    "<table><tr><th>Risc</th><th>Semnal timpuriu</th><th>Plan B</th></tr>" +
    "<tr><td>Trafic sub așteptări în primele luni</td><td>sub " + Math.round(A.clients * 0.75) + " clienți/zi în luna 3</td><td>capitalul de lucru acoperă 3-4 luni; se accelerează parteneriatele cu birouri și cardul de fidelitate înainte de orice reducere de preț</td></tr>" +
    "<tr><td>Creșterea costurilor (cafea verde, lapte, energie)</td><td>COGS trece de 35%</td><td>recalculare porții și prețuri pe ancore, nu panică pe tot meniul; contracte pe 6-12 luni cu furnizorii cheie</td></tr>" +
    "<tr><td>Plecarea unui om cheie</td><td>orice demisie în primele 12 luni</td><td>rețetele și procedurile stau în registru, nu în memoria cuiva; recrutare continuă pasivă</td></tr>" +
    (has("source", "loan") ? "<tr><td>Rata creditului în luni slabe</td><td>cash sub 1,5 luni de costuri</td><td>linia de rezervă definită înainte de deschidere; discuție cu banca la primul semnal, nu la prima întârziere</td></tr>" : "") +
    (one("food") !== "none" ? "<tr><td>Risipa pe food</td><td>pierderi peste 8% din achiziții</td><td>meniu mai scurt, producție pe baza vânzărilor din registru, reduceri de final de zi</td></tr>" : "") +
    "</table>" +
    "<p>Principiul general: fiecare risc are un semnal măsurabil și o reacție decisă dinainte. Deciziile proaste se iau sub presiune; planul există ca să nu fie nevoie de ele.</p>"
  });

  /* 14 ── Legal & Compliance */
  var caen = ["<strong>5630</strong> (baruri și alte activități de servire a băuturilor): activitatea principală"];
  if (one("food") === "brunch" || one("food") === "lunch") caen.push("<strong>5610</strong> (restaurante): pentru bucătărie");
  if (one("format") === "roastery") { caen.push("<strong>1083</strong> (prelucrarea ceaiului și cafelei): pentru prăjire"); caen.push("<strong>4729</strong> (comerț cu amănuntul alimentar): pentru boabele de la raft"); }
  if (has("service", "delivery")) caen.push("<strong>5629</strong> sau mențiunea de livrare, pentru delivery");
  C.push({ t: "Legal & Compliance", sub: "Cadrul juridic și fiscal al afacerii", pro: true, html:
    "<p>Forma recomandată: SRL" + (has("source", "investor") ? " cu asociați și un acord clar între ei semnat înainte de primul leu cheltuit" : " cu asociat unic") + ". Codurile CAEN pentru obiectul de activitate:</p>" +
    "<ul>" + caen.map(function (c) { return "<li>" + c + ";</li>"; }).join("") + "</ul>" +
    "<p>Regimul fiscal se decide cu contabilul înainte de înființare: impozit micro pe venit la început sau impozit pe profit, după structura costurilor; cotele și plafoanele se schimbă, deci cifrele finale se pun la dosar cu contabilul, înainte de depunere.</p>" +
    "<p>Obligatorii din ziua 1: casă de marcat fiscală conectată la ANAF, contract de contabilitate, registrul de casă, e-Factura pentru relațiile B2B.</p>"
  });

  /* 15 ── Opening Roadmap */
  C.push({ t: "Opening Roadmap", sub: "Drumul până la deschidere, săptămână cu săptămână", pro: true, html:
    "<p>De la decizie la prima cafea vândută, " + A.name + " are nevoie de aproximativ 14 săptămâni disciplinate:</p>" +
    "<table><tr><th>Săptămânile</th><th>Etapa</th></tr>" +
    "<tr><td>1 – 2</td><td>validarea zonei pe teren (numărătoarea de trafic), negocierea spațiului, antecontract cu clauză de autorizare; ținta de negociere: 1-2 luni fără chirie pe perioada amenajării (grace period), clauză standard care se pierde doar dacă nu e cerută</td></tr>" +
    "<tr><td>3 – 4</td><td>SRL & coduri CAEN (capitolul Legal), proiect de amenajare, deviz pe oferte reale, comanda echipamentelor cu termen lung</td></tr>" +
    "<tr><td>5 – 10</td><td>amenajare; în paralel: dosar DSVSA (înregistrare sanitar-veterinară), aviz DSP, autorizație de funcționare de la primărie, ISU dacă suprafața o cere, contract deșeuri & neutralizare" + (A.terrace > 0 ? ", autorizația de terasă de la primărie cu taxa de ocupare a domeniului public" : "") + "</td></tr>" +
    "<tr><td>11 – 12</td><td>angajare și training echipă (rețete, flux, servire), meniu final cu COGS calculat pe fiecare poziție, POS configurat cu cotele de TVA corecte</td></tr>" +
    "<tr><td>13</td><td>soft opening: prieteni și cartier, ajustări pe flux</td></tr>" +
    "<tr><td>14</td><td>deschidere oficială" + (has("moments", "brunch") ? ", cu primul brunch de weekend anunțat din prima zi" : "") + "</td></tr>" +
    "</table>" +
    "<div class='callout'><strong>Despre autorizații:</strong> documentul care blochează cel mai des deschiderile e înregistrarea DSVSA" + (one("food") === "lunch" || one("food") === "brunch" ? " (cu atât mai mult cu bucătărie caldă)" : "") + ". Se depune devreme, nu după amenajare, iar proiectul spațiului se face cu cerințele DSVSA/DSP pe masă, ca să nu se spargă pereți de două ori.</div>"
  });

  /* 16 ── The Scoreboard */
  C.push({ t: "The Scoreboard", sub: "Cifrele care se urmăresc săptămânal după deschidere", pro: true, html:
    "<p>Planul se termină la deschidere; afacerea începe după. Tabloul de bord al primelor 6 luni:</p>" +
    "<table><tr><th>Indicator</th><th>Țintă</th><th>Frecvență</th><th>Proprietar</th></tr>" +
    "<tr><td>Clienți pe zi</td><td>" + Math.round(A.clients * 0.7) + " în lunile 1-3, " + A.clients + " în luna 6</td><td>zilnic</td><td>" + (one("founder") === "investor" ? "head barista" : "fondatorul") + "</td></tr>" +
    "<tr><td>Bon mediu</td><td>" + lei(bon) + "</td><td>săptămânal</td><td>fondatorul</td></tr>" +
    "<tr><td>COGS</td><td>25 – 35% din vânzări</td><td>lunar</td><td>fondatorul</td></tr>" +
    "<tr><td>Echipă</td><td>30 – 35% din vânzări</td><td>lunar</td><td>fondatorul</td></tr>" +
    "<tr><td>Rata de revenire (card fidelitate)</td><td>peste 40% revin în 7 zile</td><td>săptămânal</td><td>" + (one("founder") === "barista" ? "fondatorul" : "head barista") + "</td></tr>" +
    (one("food") !== "none" ? "<tr><td>Risipă food</td><td>sub 8% din achiziții</td><td>săptămânal</td><td>" + (one("food") === "viennoiserie" ? "barista de serviciu" : "bucătarul") + "</td></tr>" : "") +
    "<tr><td>Recenzii Google</td><td>peste 4,7, cu răspuns în 48h la fiecare</td><td>săptămânal</td><td>fondatorul</td></tr>" +
    "</table>" +
    "<p>Ritualul: luni dimineața, 30 de minute, aceleași cifre pe aceeași foaie. Un indicator ieșit din interval două săptămâni la rând declanșează planul B din capitolul de riscuri, nu o ședință de panică.</p>" +
    "<div class='callout'><strong>Urmează:</strong> modulul Groundwork Financials va transforma aceste repere în proiecții complete pe 5 ani (P&L lunar, cash flow și punctul minim de cash), din aceleași răspunsuri.</div>"
  });

  return C;
}
