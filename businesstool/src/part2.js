<script>
(function () {
"use strict";

/* ═══════════════════════════════════════════════════════════════════
   Cadrul planului = lecțiile predate echipei Heat de Around The Corner:
   L1 Introduction to the Industry · L2 Hospitality Principles & Food Cost ·
   L3 Standard Operating Procedures · L4 Branding & Marketing ·
   L5 Pricing Strategy · S1–S4 Strategie de Business (Părțile I–IV).
   CBE = know-how de sprijin (Coffee Business Education, SCA).
   Conținutul Heat stă în baza de date a paginii, nu în sursă.
   ═══════════════════════════════════════════════════════════════════ */

const LESSONS = {
  L1: { n: "Lecția 1", t: "Introduction to the Industry", d: "Fundamente (CE · CUM · DE CE), viziune / misiune / valori, fidelizarea oaspeților, comportamentul profesionistului, lumea QSR", ch: "cap. 01–05", to: "#s-fundatia" },
  L2: { n: "Lecția 2", t: "Hospitality Principles & Food Cost", d: "Cele patru principii, Customer Service vs. Customer Care, cele cinci momente, food cost și structura costului", ch: "cap. 06–08", to: "#s-oaspete" },
  L3: { n: "Lecția 3", t: "Standard Operating Procedures", d: "Anatomia unui SOP, regulile de scriere, categoriile, de la SOP la sistem", ch: "cap. 09–12", to: "#s-operatiuni" },
  L4: { n: "Lecția 4", t: "Branding & Marketing", d: "Brand, arhetipuri, poziționare, fir narativ, comunicare, funnel și buckets, marketing în QSR", ch: "cap. 13–20", to: "#s-brand" },
  L5: { n: "Lecția 5", t: "Pricing Strategy", d: "Cost de producție, preț de podea ×1,25, preț de listă ×1,40, strategia de discount", ch: "cap. 21–28", to: "#s-produs" },
  S1: { n: "Strategie de Business I", t: "Planificarea ca mod de a gândi", d: "Trei idei despre plan, piramida de dezvoltare", ch: "", to: "#s-start" },
  S2: { n: "Strategie de Business II", t: "Planul de afaceri", d: "Scop, cele șase componente, versiuni pe cititor, ciclul de viață", ch: "", to: "#s-rezumat" },
  S3: { n: "Strategie de Business III", t: "Fundația afacerii", d: "Concept, misiune, viziune, valori", ch: "", to: "#s-fundatia" },
  S4: { n: "Strategie de Business IV", t: "Cine, de ce și SWOT", d: "Fondator, structura companiei, „de ce”-ul, SWOT", ch: "", to: "#s-fundatia" },
  CBE: { n: "Know-how de sprijin", t: "Coffee Business Education (SCA)", d: "Business plan, piață, customer journey, P&L, cash flow, leadership", ch: "", to: "#s-financiar" }
};
function srcLabel(s) { const k = s.split(" ")[0]; const L = LESSONS[k]; if (!L) return s; const rest = s.slice(k.length).trim(); return L.n + " · " + L.t + (rest ? " · " + rest : ""); }

const MS_STATES = ["Nu s-a făcut", "În curs", "S-a făcut"];
function msStatus(r) { return MS_STATES.includes(r.status) ? r.status : (r.done ? "S-a făcut" : "Nu s-a făcut"); }

const AUD_ALL = ["atc", "client", "investor", "team"];
const AUD_NO_INV = ["atc", "client", "team"];
const AUD_NO_TEAM = ["atc", "client", "investor"];

const SECTIONS = [
  { id: "start", num: "", nav: "Start", title: "Planul ca mod de a gândi", question: "De ce pornesc această afacere?", kind: "start" },
  { id: "rezumat", num: "01", nav: "Rezumat executiv", title: "Rezumatul executiv", question: "Ce fac, în două paragrafe?", src: ["S2"],
    intro: "O prezentare scurtă și la obiect a întregului plan. Se scrie la final, dar se citește primul: ce face Heat, oportunitatea din piață și de ce e poziționat să reușească.",
    blocks: [
      { id: "rezumat", title: "Rezumatul executiv", q: "Testul liftului", aud: AUD_ALL, counter: true, src: ["S2"],
        guide: `Unul sau două paragrafe, cel mult. <b>Testul liftului:</b> dacă nu poți explica ce face Heat în cele câteva minute petrecute într-un lift cu un posibil investitor, nu îți cunoști afacerea suficient de bine. Include ce faci, pentru cine, oportunitatea și motivul pentru care Heat e poziționat să reușească.`,
        prompts: ["Poți descrie afacerea în două paragrafe? Scrie-le.", "Cui trebuie să prezinți planul în următoarele șase luni și ce versiune îi arăți?"] }
    ] },
  { id: "fundatia", num: "02", nav: "Fundația", title: "Fundația: CE · CUM · DE CE", question: "Ce? De către cine?", src: ["L1 cap. 01–02", "S3", "S4"],
    intro: "Pornim de la un limbaj comun: CE (valorile și standardele), CUM (misiunea), DE CE (viziunea). Când înțelegi nu doar ce faci, ci și cum și de ce, munca ta capătă sens; oaspeții simt diferența. Apoi: oamenii din spatele afacerii, structura companiei și SWOT-ul.",
    blocks: [
      { id: "concept", title: "Conceptul de afacere", q: "Cine ești?", aud: AUD_ALL, src: ["S3", "L1 cap. 05"],
        guide: `Conceptul răspunde la trei întrebări: <b>Cine ești?</b> · <b>Ce schimbare vrei să produci?</b> · <b>Cum o faci?</b> Conceptul este felul în care afacerea intră în lume. QSR nu înseamnă calitate scăzută: înseamnă un model construit pe eficiență operațională și pe capacitatea de a livra aceeași experiență de fiecare dată: viteză de servire, meniu standardizat, volum mare, preț accesibil, consistență totală. „Repede și bine, de fiecare dată.”`,
        prompts: ["Cine ești, ce schimbare vrei să produci și cum o faci? Răspunde în câte o frază.", "Ce te face unic față de celelalte locuri cu pui din oraș?"] },
      { id: "viziune", title: "Viziunea", q: "De ce existăm?", aud: AUD_ALL, vmv: true, src: ["L1 cap. 02", "S3"],
        guide: `Viziunea răspunde la întrebarea fundamentală: <b>de ce existăm ca brand?</b> Este rațiunea de a fi, aspirația pe termen lung; destinația. Se poate schimba în timp, odată cu tendințele și tehnologiile noi.`,
        prompts: ["Spune viziunea și unde ajunge Heat peste cinci ani: o locație, o rețea, un brand regional?", "Documentul Heat pune textul sub „De ce facem ceea ce facem?”; playbook-ul îl numește misiune. Care rămâne eticheta oficială?"] },
      { id: "misiune", title: "Misiunea", q: "Cum facem asta?", aud: AUD_ALL, vmv: true, src: ["L1 cap. 02", "S3"],
        guide: `Misiunea descrie <b>cum ne atingem viziunea zi de zi</b>: standardele de preparare, grija față de oaspete, spațiul, fluxul. Nici prea largă („cea mai bună cafea din lume” nu spune nimic concret), nici prea îngustă („doar cafele din Etiopia” nu lasă loc de creștere). Aliniată cu viziunea și valorile, comunicată în toată organizația.`,
        prompts: ["Misiunea e mai aproape de „prea larg” sau de „prea îngust”?", "Poate cineva din echipă să o spună fără să se uite pe hârtie?"] },
      { id: "valori", title: "Valorile", q: "Ce reprezentăm?", aud: AUD_ALL, vmv: true, src: ["L1 cap. 02", "S3"],
        guide: `Valorile sunt principiile care ghidează fiecare decizie și interacțiune: clarifică identitatea, susțin motivația echipei și atrag oameni care împărtășesc aceleași principii. Sunt <b>regulile de circulație</b> pe drumul către viziune; se păstrează cât mai mult, ele definesc Heat. Ordinea contează: prima valoare spune ce e cel mai important.`,
        prompts: ["Pentru fiecare valoare: care e comportamentul concret, observabil într-o tură?", "Care e prima valoare și de ce ea?"] },
      { id: "echipa", title: "Fondatorul și echipa", q: "De către cine?", aud: AUD_ALL, src: ["S4"],
        guide: `Investitorii <b>pariază pe jocheu, nu pe cal</b>. Arată două lucruri: competențe, talente, abilități (dovedesc că poți executa planul) și pasiune, speranțe, visuri (dovedesc că ești motivat). Pasiunea singură nu ajunge.`,
        prompts: ["Ce competențe concrete ale tale și ale echipei dovedesc că puteți executa planul?", "Cine ia deciziile zilnice după deschidere și cine le ia pe cele strategice?"] },
      { id: "structura", title: "Structura companiei", q: "Cu cine se asociază oamenii?", aud: AUD_NO_TEAM, src: ["S4"],
        guide: `Se decide devreme, nu la urmă. Forma juridică schimbă felul în care te privesc investitorii, echipa și partenerii. Stabilește de la început dacă afacerea e <b>pentru profit</b>, nonprofit sau fără scop lucrativ. Cere sfatul contabilului: structura cea mai bună fiscal și pentru atragerea investițiilor.`,
        prompts: ["Ce formă juridică are societatea operatoare și de ce?", "Cine deține ce? (detaliază în tabelul de capitalizare)"] },
      { id: "de-ce", title: "„De ce”-ul tău", q: "Ce te motivează?", aud: AUD_ALL, kind: "private", src: ["S4"],
        guide: `Nu trebuie scris în plan și nu trebuie împărtășit cu nimeni, dar trebuie cunoscut. Îți dă rezistență când e greu, rămâne sub controlul tău, definește succesul și definește ieșirea: când de ce-ul nu mai contează, e timpul să pleci. <b>Câmpul de mai jos e privat:</b> îl vezi doar tu, pe contul tău.`,
        prompts: ["De ce faci această afacere? Răspunde sincer, doar pentru tine. Pasiunea sau banii: ambele sunt în regulă."] },
      { id: "swot", title: "SWOT al fundației", q: "Poți realiza ce ți-ai propus?", aud: AUD_ALL, kind: "swot", src: ["S4"],
        guide: `Puncte forte și slabe sunt <b>interne</b>; oportunitățile și amenințările sunt <b>externe</b>. Dă fiecărui element o greutate. Patru greșeli: <b>subestimezi ce ai</b> (rețeaua, accesul la capital, timpul), <b>supraestimezi</b> („fac un pui bun” e punct forte doar în context), <b>nu dai greutatea corectă</b>, <b>pui elementul în categoria greșită</b> (punct slab ≠ amenințare).`,
        more: `SWOT e un instrument, nu o notă. Exercițiul: cum folosești punctele forte ca să muți punctele slabe și amenințările în oportunități? Ciclul: scrii fundația → o evaluezi prin SWOT → corectezi fundația → repeți periodic.`,
        prompts: ["Ce resursă ai trecut la puncte slabe, deși ar putea fi punct forte?", "Care dintre amenințări e de fapt un punct slab pe care îl poți corecta?"] }
    ] },
  { id: "brand", num: "03", nav: "Brandul", title: "Brandul: cine suntem și cum ajungem la lume", question: "Ce spun oamenii când nu ești în cameră?", src: ["L4 cap. 13–17"],
    intro: "Un brand nu e un logo: e percepția totală pe care o au oamenii despre tine. Brand Identity e ce arăți, branding-ul e ce faci, brandul e ce rămâne în capul oamenilor. Arhetipul îți dă personalitatea, poziționarea îți dă locul în piață, firul narativ le leagă, iar comunicarea le duce la oameni.",
    blocks: [
      { id: "arhetip", title: "Arhetipul de brand", q: "Care e ADN-ul personalității?", aud: AUD_ALL, src: ["L4 cap. 14"],
        guide: `Douăsprezece tipare pe care oamenii le recunosc instinctiv (Inocentul, Exploratorul, Înțeleptul, Eroul, Rebelul, Magicianul, Omul obișnuit, Îngrijitorul, Creatorul, Conducătorul, Bufonul, Îndrăgostitul). Nu alegi arhetipul care sună cool, ci pe cel care se potrivește cu valorile reale, cu audiența, cu experiența din locație și cu diferențierea. Arhetipul influențează <b>totul</b>: tonul, designul, muzica, limbajul de pe meniu, social media, felul în care răspunzi la o reclamație.`,
        prompts: ["Cum arată arhetipul în fiecare detaliu: pahar, meniu, răspuns la un review de o stea?", "Ce ar face brandul niciodată, pentru că nu e în caracterul lui?"] },
      { id: "pozitionare", title: "Poziționarea", q: "Ce loc ocupi în mintea oamenilor?", aud: AUD_ALL, src: ["L4 cap. 15"],
        guide: `Dacă nu îți definești tu poziția, piața o face pentru tine. <b>Triada:</b> audiența (cui îi vorbești?), propunerea de valoare (ce le promiți?), diferențiatorul (de ce tu și nu altcineva?). <b>Statement-ul intern</b>, GPS-ul tău, nu slogan: „Pentru [audiența], [brandul] este [categoria] care [propunerea de valoare], spre deosebire de [competiția], pentru că [diferențiatorul].” Poziționarea nu e despre a fi cel mai bun, ci cel mai clar: dacă oamenii nu pot spune în 10 secunde ce te face diferit, ai doar o locație cu un nume.`,
        prompts: ["Statement-ul trece testul celor 10 secunde?", "Ultima decizie de meniu sau de design s-a potrivit cu poziționarea?"] },
      { id: "fir-narativ", title: "Firul narativ", q: "Ce poveste țin minte oamenii?", aud: AUD_ALL, src: ["L4 cap. 16"],
        guide: `Oamenii nu țin minte fapte, țin minte povești. Patru elemente: <b>originea</b> (de unde venim?), <b>conflictul</b> (ce problemă rezolvăm?), <b>misiunea</b> (ce facem concret?), <b>viziunea</b> (unde vrem să ajungem?). <b>Eroul poveștii nu ești tu:</b> clientul e eroul, brandul e ghidul (Yoda, nu Luke). Nu „noi suntem cei mai buni”, ci „meriți mâncare care chiar are gust”. Firul narativ trăiește în meniu, locație, echipă, social media, ambalaj și în felul în care rezolvi problemele.`,
        prompts: ["Rescrie trei mesaje cu clientul ca erou.", "Știe echipa povestea din spatele produsului?"] },
      { id: "straturi", title: "Cele patru straturi ale brandului", q: "Ce vede, aude, simte și trăiește oaspetele?", aud: AUD_NO_INV, src: ["L4 cap. 13"],
        guide: `<b>Vizual</b> (logo, culori, tipografie, ambalaj, design interior, cum arată echipa), <b>verbal</b> (nume, slogan, textele de pe meniu, cum scrii pe social media, cum salută echipa), <b>emoțional</b> (atmosfera, muzica, mirosul, felul în care echipa îi tratează), <b>experiențial</b> (toată călătoria: de la Google la plecare). Dacă logo-ul zice premium, dar paharul arată ieftin, ceva nu se leagă.`,
        prompts: ["Unde se rupe coerența între straturi azi?"] },
      { id: "tone-of-voice", title: "Tone of voice", q: "Cum sună brandul când vorbește?", aud: AUD_NO_INV, kind: "rows", tool: "tov", src: ["L4 cap. 17.1"],
        guide: `Nu ce spui, ci <b>cum</b> spui. Patru axe: formal ↔ casual, serios ↔ amuzant, respectuos ↔ provocator, entuziast ↔ calm. Alegi unde se pune brandul pe fiecare axă și ții linia peste tot: Instagram, meniu, locație, răspuns la review. Inconsistența în ton e ca și cum ai vorbi cu accent britanic dimineața și american seara.`,
        prompts: ["Dă câte un exemplu de frază Heat pe fiecare axă."] },
      { id: "piloni", title: "Pilonii de comunicare", q: "Ce teme comunici constant?", aud: AUD_NO_INV, src: ["L4 cap. 17.2–17.4"],
        guide: `Trei până la cinci teme mari pe care stă tot ce spui (de exemplu: calitate, educație, comunitate, experiență). <b>CE</b> spui vine din piloni, <b>CUM</b> spui din arhetip și ton, <b>UNDE</b> spui e canalul. <b>Echipa e primul canal de comunicare:</b> cele cinci momente ale ospitalității sunt acte de comunicare de brand. Echipa trebuie să cunoască firul narativ, să știe tonul și să trăiască valorile.`,
        prompts: ["Pentru fiecare pilon: un exemplu de mesaj în tonul Heat."] }
    ] },
  { id: "piata", num: "04", nav: "Piața", title: "Descrierea pieței", question: "Pentru cine?", src: ["S2", "CBE"],
    intro: "Cererea din piață decide ce produse au sens, nu invers. Privire de ansamblu, mărimea pieței (TAM, SAM, SOM), clientul, concurența, canalul și sectorul.",
    blocks: [
      { id: "piata-ansamblu", title: "Privire de ansamblu și tendințe", q: "Care este cererea?", aud: AUD_ALL, src: ["S2", "CBE"],
        guide: `Industria și sectorul în care intră Heat, mărimea și dinamica lor, tendințele care contează și ce s-a schimbat în ultimii doi ani. Întrebarea nu e doar „există cerere?”, ci „de ce acum?”. QSR este cel mai mare segment din foodservice la nivel global, alimentat de schimbările de stil de viață: mâncare bună, rapidă, la preț corect.`,
        prompts: ["Ce s-a schimbat în piață în ultimii doi ani și cum te-ai adaptat?", "Ce tendință poate întoarce planul?"] },
      { id: "tam-sam-som", title: "Mărimea pieței: TAM · SAM · SOM", q: "Cât de mare e premiul?", aud: AUD_NO_TEAM, kind: "market", src: ["S2", "CBE"],
        guide: `<b>TAM</b>: toată piața care ar putea cumpăra. <b>SAM</b>: partea la care ajungi cu modelul tău (geografie, produs, canale). <b>SOM</b>: partea pe care o poți câștiga realist. Arată cum ai calculat: „Sunt X cumpărători în [oraș] (sursa). Y% trec pe lângă locație. Dacă câștigăm Z%, obținem [lei]/an.”`,
        prompts: ["Din ce sursă vine fiecare cifră?", "SOM-ul e coerent cu scenariul realist din planul financiar?"] },
      { id: "clienti", title: "Clientul: segmente", q: "Cine cumpără și de ce?", aud: AUD_ALL, kind: "rows", tool: "segments", src: ["S2", "L4 cap. 15", "CBE"],
        guide: `Segmentul primar, secundar și terțiar. Pentru fiecare: ce vor și pentru ce vin, tiparul vizitelor, cât sunt dispuși să cheltuie, volumul estimat, de ce rămân. Audiența e primul picior al poziționării: „o promisiune pentru toată lumea nu convinge pe nimeni”.`,
        prompts: ["Care e segmentul pe care îl construiești întâi și ce ofertă îi vorbește direct?"] },
      { id: "concurenta", title: "Concurența și poziționarea", q: "Cu cine te bați pentru același client?", aud: AUD_NO_TEAM, kind: "rows", tool: "competitors", src: ["CBE", "L4 cap. 15"],
        guide: `Concurenții <b>direcți</b> (același produs, același client) și <b>indirecți</b> (aceeași nevoie, alt produs: shaorma, burgeri). Strânge informații (produse, prețuri, clienți, canale, experiență, mesaj), evaluează ce laudă și de ce se plâng clienții, compară poziționarea (cum te percepe clientul, nu ce funcții ai). Datele din teren vin din <a href="https://research.heatcertifried.ro" target="_blank" rel="noopener">jurnalul de bonuri Heat</a>.`,
        prompts: ["Ce laudă clienții la fiecare concurent și ce se plâng că lipsește?", "Unde e golul pe care îl ocupă Heat în mintea clientului?"] },
      { id: "canale", title: "Canal și sector", q: "Pe unde ajunge produsul la client?", aud: AUD_NO_TEAM, src: ["S2", "L4 cap. 19.1", "CBE"],
        guide: `<b>Place</b> din cei 4P: unde te găsesc oamenii (local, kiosk-uri, livrare, Google Maps, social media, recenzii); fiecare e un punct de contact cu brandul. Fiecare canal are alt cost, altă marjă și alt ritm de încasare: livrarea prin aplicații ia comision, corporate plătește la 30 de zile.`,
        prompts: ["Ce procent din vânzări vine din fiecare canal în anul 1?", "Prețul pe platformele de livrare e același cu cel din local?"] }
    ] },
  { id: "oaspete", num: "05", nav: "Oaspetele", title: "Oaspetele și ospitalitatea", question: "Cum facem oaspetele să vrea să revină?", src: ["L1 cap. 03–04", "L2 cap. 06–07"],
    intro: "Fidelizarea nu înseamnă carduri și reduceri: e o experiență senzorială care creează recurență, construită prin consistență în locație, customer service și produs, la fiecare vizită. Oricine poate fi amabil când are timp; profesionistul e amabil și când nu are.",
    blocks: [
      { id: "fidelizare", title: "Fidelizarea: locația, serviciul, produsul", q: "De ce se întoarce oaspetele?", aud: AUD_NO_INV, src: ["L1 cap. 03"],
        guide: `Trei componente care lucrează împreună: <b>locația</b> (poziționarea, amenajarea și ambianța comunică cine suntem înainte să spunem un cuvânt; un spațiu curat, ordonat, coerent), <b>customer service</b> (raportul de interacțiune, comunicarea, verbul plăcut; oaspetele trebuie să simtă că e important), <b>produsul</b> (calitate menținută constant la standardul setat; inconsistența distruge încrederea mai repede decât orice). Fidelizarea nu se obține printr-un moment excepțional, ci prin consistență la fiecare vizită.`,
        prompts: ["Ce comunică spațiul Heat în primele 10 secunde?", "Care e standardul care nu se negociază la produs?"] },
      { id: "ospitalitate", title: "Cele patru principii și Service vs. Care", q: "Ce facem și cum facem?", aud: AUD_NO_INV, src: ["L2 cap. 06–07"],
        guide: `<b>Prezența</b> (oaspetele e singura prioritate în interacțiune), <b>anticiparea</b> (observi înainte să ți se ceară), <b>personalizarea</b> (citești oaspetele și te adaptezi), <b>consistența</b> (în fiecare zi, cu fiecare oaspete). <b>Customer Service</b> e ce facem: acțiuni, pași, standarde; se documentează și se măsoară. <b>Customer Care</b> e cum facem: ton, limbaj al corpului, empatie, memorie relațională; se modelează și se cultivă. Service fără Care e tranzacție; Care fără Service e intenție bună fără execuție.`,
        prompts: ["Cum arată „prezența” la kiosk-uri, când e coadă?", "Ce ține minte echipa despre clienții fideli?"] },
      { id: "momente", title: "Cele cinci momente ale interacțiunii", q: "Service și Care la fiecare pas", aud: AUD_NO_INV, kind: "rows", tool: "moments", src: ["L2 cap. 07.4", "L1 cap. 05.6"],
        guide: `Primirea (primele 10 secunde), comanda, așteptarea, livrarea, plecarea. Fiecare moment are o componentă de <b>Service</b> (încadrare operațională) și una de <b>Care</b> (încadrare emoțională). Ultimul moment e cel pe care oaspetele îl ține minte cel mai bine. Definește standardul Heat pentru fiecare: acestea devin SOP-urile de Customer Service.`,
        prompts: ["Ce spune exact echipa la primire și la plecare, în tonul Heat?"] },
      { id: "comportament", title: "Comportamentul profesionistului", q: "Ce fac profesioniștii?", aud: AUD_NO_INV, src: ["L1 cap. 04"],
        guide: `Profesioniștii se diferențiază prin două lucruri: <b>folosirea simțurilor</b> la maximum (olfactiv, gustativ, tactil, auditiv, vizual: evaluezi materia primă și produsul, educi oaspetele, asiguri consistența) și <b>comportamentul conștient, antrenat zilnic</b>: atitudine (politețe, prezență impecabilă, adaptabilitate, etică a muncii), comunicare (ascultare activă, claritate), orientare către oaspete (anticipare, rezolvarea problemelor, altruism), muncă în echipă, managementul timpului și al stresului (urgență controlată, „double-check everything”), dezvoltare continuă.`,
        prompts: ["Ce înseamnă „prezență impecabilă” la Heat: ținută, limbaj, stație?", "Cum antrenați simțurile: degustare zilnică a produsului, test de iuțeală pe niveluri?"] },
      { id: "journey", title: "Harta experienței clientului", q: "Cum se simte clientul la fiecare etapă?", aud: AUD_NO_INV, kind: "journey", src: ["CBE", "L4 cap. 13"],
        guide: `Stratul experiențial al brandului, pus pe hârtie: șase etape, de la prima întâlnire cu brandul la recomandare, și ce vrea clientul, punctele de contact, acțiunile, emoțiile, punctele de durere, oportunitățile și indicatorii fiecărei etape. Instrument de echipă; revizuiește trimestrial și stabilește 2–3 priorități cu responsabili.`,
        more: `Citește harta: unde sunt văile emoționale? unde sunt punctele de contact slabe? unde se blochează clienții (între evaluare și prima vizită)? care sunt momentele cu cel mai mare efect (prima vizită și experiența)? sunt susținătorii echipați să te recomande?`,
        prompts: ["Unde trece clientul de la o emoție pozitivă la una negativă?"] }
    ] },
  { id: "produs", num: "06", nav: "Produsul și prețul", title: "Produsul, food cost-ul și prețul", question: "Cât te costă și cât ceri?", src: ["L2 cap. 08", "L5 cap. 21–28"],
    intro: "Dacă nu știi cât te costă un produs, nu știi dacă faci bani sau pierzi bani. Prețul se construiește din aval în amonte: food cost → cost de producție → preț de podea (×1,25) → preț de listă (×1,40), pentru fiecare produs. Prețul e și un mesaj de brand.",
    blocks: [
      { id: "problema-solutia", title: "Problema și soluția", q: "Ce frustrare rezolvi?", aud: AUD_ALL, src: ["L4 cap. 15–16", "CBE"],
        guide: `Numește frustrarea concretă cu care trăiește clientul azi (conflictul din firul narativ), ce îl costă și de ce acum. Apoi soluția: ce oferi într-o propoziție, în limbajul clientului; de ce e mai bună (un singur motiv ascuțit); pentru cine anume e făcută promisiunea.`,
        prompts: ["Care e singurul motiv pentru care clientul alege Heat în locul alternativei?"] },
      { id: "diferentiere", title: "Ce o face specială și dovada", q: "Ce nu pot copia ceilalți?", aud: AUD_ALL, src: ["L4 cap. 15", "CBE"],
        guide: `Diferențiatorul din triada poziționării, pus în detalii pe care clientul le poate gusta sau simți: rețeta, marinarea, nivelurile de iuțeală, pâinea, sosurile, ambalajul, atmosfera. <b>Dovada</b> că livrează: teste, degustări, un lot vândut, recenzii, clienți care revin. <b>Wedge</b> (pana): avantajul concret cu care intri în piață și câștigi primii clienți, ce ai tu și ceilalți nu pot copia repede. <b>Moat</b> (șanțul de apărare): ce face ca avantajul să țină în timp, după ce concurenții încearcă să te copieze: brandul, comunitatea, procedurile, furnizorii, locația.`,
        prompts: ["Ce dovezi ai deja și ce dovezi strângi în primele 90 de zile?"] },
      { id: "meniu", title: "Food cost și prețul, pe fiecare produs", q: "Cât te costă, cât ceri, cât spațiu ai?", aud: AUD_NO_TEAM, kind: "rows", tool: "products", src: ["L2 cap. 08", "L5 cap. 22–25"],
        guide: `<b>Food cost %</b> = cost ingrediente (+ ambalaj direct) / preț de vânzare × 100; reper 25–35%. <b>Costul de producție</b> = food cost + labor + overhead + marketing, toate în lei per porție. <b>Prețul de podea</b> = cost de producție × 1,25: linia roșie, sub ea nu cobori niciodată, nici la promoție, nici pentru prieteni. <b>Prețul de listă</b> = preț de podea × 1,40: spațiul tău de joc (profit, discount, absorbția fluctuațiilor, investiție). Calculul se face pentru fiecare produs; revizuiește trimestrial.`,
        more: `Factori controlați ai food cost-ului: rețete standardizate, porționare la gram (5 g în plus × 200 porții = 1 kg pe zi), risipa, negocierea cu furnizorii, stocarea, inventarul, training-ul. Greșeli frecvente: nu calculezi ambalajul, nu măsori risipa, improvizezi porțiile, ignori fluctuațiile de preț, nu faci inventar, confunzi food cost-ul cu costul total. Gândește în procente, nu în lei.`,
        prompts: ["Care produs e sub prețul de listă calculat și ce faci: preț, gramaj, furnizor?", "Food cost-ul real (stoc inițial + achiziții − stoc final) se măsoară lunar?"] },
      { id: "pret-politica", title: "Politica de preț și de discount", q: "Cât poți coborî fără să pierzi?", aud: AUD_NO_TEAM, src: ["L5 cap. 26–27", "L4 cap. 19.1"],
        guide: `<b>Niciodată sub podea</b>, indiferent de motiv. Discountul maxim sigur: ~20%. Discountul e temporar, nu permanent (o promoție permanentă e preț nou). Calculează impactul pe volum și cere-i să aducă ceva măsurabil, altfel nu e strategie, e caritate. <b>Alternative:</b> combo / bundle, produs cadou (sos extra), program de loialitate (a 10-a comandă), preț de lansare limitat. Prețul comunică: prea mic = suspect; corect = încredere; premium = risc dacă experiența nu îl justifică. Gândește în procent din marjă, nu în lei.`,
        prompts: ["Care e discountul maxim pe fiecare produs, calculat din prețul de podea?", "Prețul pe platformele de livrare acoperă comisionul de 25–30%?"] }
    ] },
  { id: "operatiuni", num: "07", nav: "Operațiuni", title: "Operațiunile și SOP-urile", question: "Cum merge la fel de bine, fără tine?", src: ["L1 cap. 05", "L3 cap. 09–12"],
    intro: "Un business nu crește pe oameni buni; crește pe sisteme bune operate de oameni buni. Dacă nu poți documenta cum faci ceva, nu ai un sistem, ai un obicei. Obiceiurile se pierd; sistemele se scalează.",
    blocks: [
      { id: "structura-qsr", title: "Structura operațională și fluxul oaspetelui", q: "Cine, unde, în ce ordine?", aud: AUD_NO_INV, src: ["L1 cap. 05.3, 05.6"],
        guide: `Zone clare: <b>Front of House</b> (tejghea, comandă, sală, pickup), <b>Back of House</b> (bucătărie, prep, depozit), <b>Livrare</b> (standarde proprii de timp, ambalare și acuratețe), <b>Management și shift leadership</b> (tura, stocurile, KPI-urile). Fluxul oaspetelui: intrarea și prima impresie, comanda, așteptarea, livrarea produsului, ieșirea; fiecare etapă trebuie să fie fluentă, plăcută și eficientă.`,
        prompts: ["Cum arată harta zonelor pe planul tehnologic și unde se predă comanda între bucătărie, pass și curier?"] },
      { id: "kpi", title: "Indicatorii-cheie (KPI)", q: "Ce măsori ca să nu presupui?", aud: AUD_NO_INV, kind: "rows", tool: "kpis", src: ["L1 cap. 05.4", "L4 cap. 19.3"],
        guide: `În QSR, performanța se măsoară: <b>Speed of Service</b> (timpul de la comandă la produs), <b>ticket average</b>, <b>food cost %</b>, <b>labor cost %</b>, <b>CSAT</b>, <b>waste</b>. În marketing: reach, engagement, creșterea audienței, foot traffic, ticket average, <b>return rate</b> (cel mai important). Fiecare acțiune, de la porționare la viteza de servire, mișcă aceste cifre.`,
        prompts: ["Ce KPI se citește zilnic, săptămânal, lunar și cine îl citește?"] },
      { id: "siguranta", title: "Siguranța alimentară", q: "Dacă nu e sigur, nu e servit", aud: AUD_NO_INV, src: ["L1 cap. 05.5"],
        guide: `<b>FIFO</b> (primul intrat, primul ieșit), <b>temperaturi critice</b> (zona de pericol 4–60 °C, maximum 2 ore), <b>igienă personală</b>, <b>etichetare și datare</b> a oricărui prep, <b>contaminare încrucișată</b> (crud separat de gătit, ustensile diferite), <b>clean as you go</b>. Siguranța alimentară nu e o sarcină în plus: e parte din fiecare sarcină.`,
        prompts: ["Care sunt punctele critice HACCP la pui (75 °C intern), la holding, la grăsimea de prăjire?"] },
      { id: "sop-registru", title: "Registrul de SOP-uri", q: "Ce e scris, antrenat și auditat?", aud: AUD_NO_INV, kind: "rows", tool: "sops", src: ["L3 cap. 10–12"],
        guide: `Anatomia unui SOP: titlu, cod (SOP-BOH-001), dată și versiune, zonă, responsabil, echipamente, ingrediente cu gramaje, pașii numerotați cu standard și timp, standarde de calitate, observații. Reguli: limbaj simplu, un pas = o acțiune, măsurabil („175 °C, 4 minute, auriu-închis”, nu „până e gata”), ordine cronologică, standardul la fiecare pas, punctele critice. Un SOP bun e cel pe care cineva fără experiență îl execută corect din prima.`,
        more: `De la SOP la sistem, în patru etape: <b>inventariază</b> tot ce se repetă, <b>prioritizează</b> după impactul asupra calității, costurilor și experienței, <b>documentează</b> și testează cu cineva care nu a făcut niciodată operațiunea, <b>implementează și revizuiește</b>: antrenează, observă, cere feedback. Un SOP fără verificare e o sugestie; auditul îl transformă în standard.`,
        prompts: ["Care cinci SOP-uri au cel mai mare impact și de ce încep cu ele?"] },
      { id: "operatiuni", title: "Resurse și parteneri", q: "Cu ce produci?", aud: AUD_ALL, src: ["S1", "CBE"],
        guide: `Nivelul 3 al piramidei: de ce ai nevoie ca să produci. Resurse-cheie (locația, echipamentele, echipa, brandul, capitalul de lucru) și parteneri-cheie (furnizori de carne, pâine, cartofi, ambalaje, service, software, platforme). Resursele se stabilesc după produse, nu invers.`,
        prompts: ["Ce furnizor, dacă dispare mâine, oprește producția?"] },
      { id: "deschidere", title: "Planul de deschidere", q: "Ce se întâmplă, când și cine răspunde?", aud: AUD_ALL, kind: "rows", tool: "milestones", src: ["S1", "CBE"],
        guide: `Reperele cu termen, responsabil și stare: avize, devize, amenajare, echipamente, furnizori, angajare, training, SOP-uri, meniu final, soft opening, deschidere. Aceleași repere sunt în timeline-ul din Start, unde se schimbă starea cu un click. Orice plan se schimbă la primul contact cu realitatea; actualizează termenele, nu le ascunde.`,
        prompts: ["Care reper, dacă întârzie, mută data deschiderii?"] },
      { id: "echipa-org", title: "Organizarea echipei", q: "Cine face, cine răspunde?", aud: AUD_NO_INV, kind: "org", src: ["CBE", "L1 cap. 05.3"],
        guide: `Organigrama arată rolurile și cine raportează cui. RACI clarifică pentru fiecare sarcină cine face (R), cine răspunde (A), cine e consultat (C), cine e informat (I): un R și un A pe sarcină. Angajare: interviuri structurate și scorecard (aliniere la valori ×3, inițiativă ×2, disponibilitate ×1), apoi onboarding pe SOP-uri.`,
        prompts: ["Cine are ultimul cuvânt când se strică o friteuză la ora de vârf?"] },
      { id: "riscuri", title: "Riscuri și măsuri", q: "Ce poate încurca planul?", aud: AUD_NO_TEAM, kind: "rows", tool: "risks", src: ["S4", "CBE"],
        guide: `Fiecare risc cu impactul, probabilitatea și ce facem ca să-l prevenim sau să-i reducem efectul. O amenințare din SWOT devine aici o acțiune cu responsabil.`,
        prompts: ["Care risc are cea mai mare probabilitate și ce faci săptămâna asta pentru el?"] }
    ] },
  { id: "marketing", num: "08", nav: "Marketing", title: "Marketingul", question: "Cum te faci cunoscut?", src: ["L4 cap. 18–20"],
    intro: "Brandingul fără marketing e un secret bine păstrat; marketingul fără branding e un megafon care strigă nimic interesant. Marketingul bun nu costă neapărat mult: costă atenție, consistență și cunoașterea audienței.",
    blocks: [
      { id: "gtm", title: "Reach · Acquire · Retain · Grow", q: "Cum ajung oamenii la tine și înapoi?", aud: AUD_ALL, src: ["L4 cap. 19", "CBE"],
        guide: `Cum află de tine (reach), ce îl transformă în cumpărător (acquire), ce îl aduce înapoi (retain), cum valorează mai mult fiecare client (grow). Cei 4P în QSR: produsul (consistent, livrează promisiunea), prețul (mesaj de brand, aliniat cu poziționarea), locul (toate punctele de contact), promovarea (consistentă cu tonul; o campanie agresivă de reduceri pe un brand premium distruge percepția).`,
        prompts: ["Ce faci în primele 30 de zile ca să ajungi la pragul de rentabilitate?"] },
      { id: "continut", title: "Funnel × buckets: planul de conținut", q: "Ce conținut creezi concret?", aud: AUD_NO_INV, kind: "rows", tool: "content", src: ["L4 cap. 18"],
        guide: `<b>Funnel:</b> TOFU (nu te cunosc: atrage atenția; reels, memes, tips), MOFU (te știu, n-au venit: construiește încredere; behind-the-scenes, echipă, proces, reviews), BOFU (sunt gata: convinge și activează; oferte, meniu nou, evenimente, CTA). Proporție: ~50 / 30 / 20. Greșeala a 90% din branduri: doar BOFU. <b>Buckets:</b> educațional, inspirațional, conversațional, promoțional, behind-the-scenes, comunitate; alege 3–4 și acoperă toate etapele.`,
        prompts: ["Ce postezi săptămâna asta pe fiecare etapă, din fiecare bucket?"] },
      { id: "canale-marketing", title: "Canalele de marketing", q: "Unde e audiența ta?", aud: AUD_NO_INV, src: ["L4 cap. 19.2"],
        guide: `Nu trebuie să fii pe toate canalele, ci acolo unde e audiența, consistent: <b>digital</b> (social media, Google Business Profile, website), <b>local</b> (flyere, parteneriate cu business-uri din zonă, evenimente), <b>word-of-mouth</b> (cel mai puternic; se construiește prin experiență, nu prin bugete), <b>PR și colaborări</b> (food bloggeri, influenceri locali: credibilitate prin voci terțe).`,
        prompts: ["Care canal aduce primii 100 de clienți pe zi și cum îl măsori?"] },
      { id: "brand-checklist", title: "Checklist-ul antreprenorului de brand", q: "Ce e bifat înainte de lansare?", aud: AUD_NO_INV, kind: "rows", tool: "checklist", src: ["L4 cap. 20.4"],
        guide: `Zece lucruri de bifat înainte de lansare sau în primele luni. Greșelile frecvente: copiezi alt brand, nu ai arhetip clar, ignori echipa (investești în design, dar nu o antrenezi să trăiască brandul), postezi fără strategie, confunzi reducerile cu marketingul, nu măsori.`,
        prompts: [] }
    ] },
  { id: "financiar", num: "09", nav: "Financiar", title: "Planul financiar", question: "Cât costă? De unde vin banii? Cât câștig?", src: ["S2", "L2 cap. 08.3", "CBE"],
    intro: "Costurile de pornire, modelul de venit și proiecția (pro forma), finanțarea, cash flow-ul și tabelul de capitalizare. Citit în procente din venitul net, nu doar în lei.",
    blocks: [
      { id: "costuri-pornire", title: "Costurile de pornire (CAPEX)", q: "Cât costă până la prima vânzare?", aud: AUD_NO_TEAM, kind: "rows", tool: "costs", src: ["S2", "CBE"],
        guide: `Tot ce costă până la prima zi de vânzări: amenajare și echipamente, stoc inițial, angajare și training, marketing și lansare, plus o <b>rezervă de cash</b> pentru primele luni. Afacerile mor rar din lipsă de profit și des din lipsă de cash.`,
        prompts: ["Ce linii au deviz ferm și ce linii sunt încă estimări?"] },
      { id: "pnl", title: "Modelul de venit și P&L-ul proiectat", q: "Cât câștigă afacerea?", aud: AUD_NO_TEAM, kind: "pnl", src: ["L2 cap. 08.3", "L5 cap. 22.2", "CBE"],
        guide: `Structura costului unui produs QSR: food cost 25–35%, labor 25–35%, overhead 15–25%, marketing 3–5%, profit 5–15%. Dacă aduni costurile și depășești 100%, pierzi bani cu fiecare porție. P&L-ul se citește de sus în jos: venit → COGS → profit brut → cheltuieli → EBITDA → amortizare, dobânzi, impozit → profit net; în procente din venit. Venitul = tranzacții/zi × bon mediu × zile.`,
        more: `Întrebări la fiecare citire: marja brută se ține? munca e proporțională cu vânzările? costurile fixe sunt acoperite confortabil? de unde vine de fapt venitul? Compară cu aceeași lună a anului trecut, nu doar cu luna trecută.`,
        prompts: ["Câte tranzacții pe zi aduc pragul de rentabilitate și cum ajungi acolo în primele luni?"] },
      { id: "finantare", title: "Finanțarea și cererea", q: "De unde vin banii?", aud: AUD_NO_TEAM, src: ["S2", "CBE"],
        guide: `Capital propriu, parteneri, împrumut bancar, linie de credit, leasing operațional, investitori. Fiecare are un cost care intră în preț și în profit. Cererea către investitor: suma, pentru ce reper, în cât timp și cum se împarte pe utilizări.`,
        prompts: ["Ce parte din investiție e capital propriu și ce parte e finanțată?"] },
      { id: "cash", title: "Cash flow și lichiditate", q: "Poți plăti facturile luna asta?", aud: AUD_NO_TEAM, src: ["CBE"],
        guide: `Profitul nu înseamnă cash. Urmărește fluxul de numerar, ciclul de cash (platformele plătesc cu întârziere), stocurile, salariile. Buget lunar și raport buget vs. realizat; contabil și reconcilieri lunare.`,
        prompts: ["Câte luni de cheltuieli fixe ai în rezervă la deschidere?"] },
      { id: "captable", title: "Tabelul de capitalizare", q: "Cine deține ce?", aud: ["atc", "client", "investor"], kind: "rows", tool: "captable", src: ["S2"],
        guide: `Cine deține ce parte din companie și cu ce contribuție. Suma trebuie să fie 100%. Se schimbă la fiecare rundă de finanțare.`, prompts: [] },
      { id: "ciclu-exit", title: "Ciclul de viață și ieșirea", q: "Cum arată o ieșire bună?", aud: AUD_NO_TEAM, src: ["S2", "S4"],
        guide: `Nicio afacere nu durează la nesfârșit; pentru localuri, în medie 8–10 ani. Ieșirea se planifică de la început, pentru echipă și investitori, și poate fi semnul succesului. Când „de ce”-ul nu mai contează, e timpul să pleci.`,
        prompts: ["Cum ar arăta o ieșire bună pentru Heat și peste câți ani?"] }
    ] },
  { id: "sisteme", num: "10", nav: "Sisteme și cultură", title: "Sistemele de management și cultura", question: "Cum conduc simplu, ca să pot crește?", src: ["S1", "L3 cap. 12", "CBE"],
    intro: "Vârful piramidei: sistemele de management fac posibilă creșterea, iar cultura susține tot ce faci. Antreprenorul care lucrează în business face bani azi; cel care construiește sisteme face bani și când nu e acolo.",
    blocks: [
      { id: "management", title: "Sistemele de management", q: "Cum conduci fără să fii în fiecare tură?", aud: AUD_NO_INV, src: ["L3 cap. 12", "CBE"],
        guide: `Mentalitatea de sistem: gândește în procese, nu în sarcini („cum fac ca X să se întâmple corect de fiecare dată, fără mine?”); documentează tot ce se repetă; antrenează, nu presupune; măsoară conformitatea. Plus: comunicare clară („clear is kind”), siguranță psihologică, feedback și recunoaștere, evaluări, delegare, succesiune; schimbările iau timp și cer corectitudinea procesului.`,
        prompts: ["Cum află un angajat nou, în prima săptămână, ce înseamnă „bine” la Heat?"] },
      { id: "cultura", title: "Cultura", q: "Ce valori și comportamente susțin totul?", aud: AUD_NO_INV, src: ["S1", "L1 cap. 05.7", "CBE"],
        guide: `Valorile trăite în comportamente, nu afișate pe perete. Mentalitatea QSR: disciplină, ownership, urgență controlată, respect pentru sistem (propui, nu improvizezi). Tonul vine de sus: ce recompensezi și ce tolerezi devine cultură.`,
        prompts: ["Ce comportament nu e tolerat la Heat, indiferent de rezultate?"] },
      { id: "scalare", title: "Planul de scalare", q: "Vrei să crești? Cum?", aud: AUD_NO_TEAM, src: ["L3 cap. 09", "L4 cap. 20", "S2"],
        guide: `Când deschizi a doua locație, transferi SOP-urile și brandul: nu poți transfera experiența verbal, poți transfera un sistem documentat. Mai mare nu înseamnă întotdeauna mai bine. Ce indicatori din prima locație declanșează decizia?`,
        prompts: ["Ce cifre din primele 12 luni ar justifica a doua locație?"] }
    ] },
  { id: "instrumente", num: "11", nav: "Instrumente", title: "Instrumente de lucru", question: "Un plan, mai multe versiuni", kind: "tools" }
];

/* Blocurile-instrument (rânduri) */
const TOOLS = {
  segments: { coll: "segments", layout: "cards", add: "Adaugă segment", label: "Segment", sort: "tier",
    cols: [
      { k: "tier", l: "Nivel", t: "select", o: ["Primar", "Secundar", "Terțiar / nișă"] },
      { k: "name", l: "Segmentul", t: "text", ph: "ex. 18–35 ani, studenți și tineri profesioniști" },
      { k: "wants", l: "Ce vor și pentru ce vin", t: "long" },
      { k: "pattern", l: "Tiparul vizitelor", t: "long" },
      { k: "spend", l: "Dispoziția de a cheltui", t: "text" },
      { k: "volume", l: "Volum estimat", t: "text" },
      { k: "stay", l: "De ce rămân", t: "long" }
    ] },
  competitors: { coll: "competitors", layout: "cards", add: "Adaugă concurent", label: "Concurent", sort: "type",
    cols: [
      { k: "name", l: "Nume", t: "text" },
      { k: "type", l: "Tip", t: "select", o: ["Direct", "Indirect", "Viitor"] },
      { k: "loc", l: "Prezență locală", t: "text" },
      { k: "price", l: "Poziție de preț", t: "select", o: ["Mic", "Mic–mediu", "Mediu", "Mediu–premium", "Premium"] },
      { k: "offer", l: "Oferta și cifrele", t: "long" },
      { k: "praise", l: "Ce laudă clienții", t: "long" },
      { k: "complaints", l: "De ce se plâng / ce lipsește", t: "long" },
      { k: "position", l: "Poziționare (cum îl percepe clientul)", t: "long" },
      { k: "q", l: "Calitate percepută (1–5)", t: "num", min: 1, max: 5, step: 1 },
      { k: "p", l: "Nivel de preț (1–5)", t: "num", min: 1, max: 5, step: 1 }
    ] },
  products: { coll: "products", layout: "table", add: "Adaugă produs", label: "Produs", sort: "order",
    cols: [
      { k: "name", l: "Produs", t: "text", w: "230px" },
      { k: "cat", l: "Categorie", t: "select", o: ["Pui", "Burger", "Slider", "Meniu", "Garnituri", "Sosuri", "Băuturi", "Desert"], w: "150px" },
      { k: "price", l: "Preț raft (lei)", t: "num", min: 0, step: 0.5, w: "88px" },
      { k: "cogs", l: "Food cost (lei)", t: "num", min: 0, step: 0.01, w: "88px" },
      { k: "alloc", l: "Cotă din bon (%)", t: "num", min: 0, max: 300, step: 5, w: "84px", ph: "auto" },
      { k: "note", l: "Notă", t: "text", w: "220px" }
    ],
    computed: [
      { l: "Food cost %", f: (r, s) => { const fc = foodCost(r, s); return fc === null ? "—" : fmtPct(fc); }, pill: (r, s) => { const fc = foodCost(r, s); return fc === null ? "" : fc <= 30 ? "good" : fc <= 35 ? "warn" : "bad"; } },
      { l: "Cost producție (net)", f: (r, s) => { const p = pricing(r, s); return p ? fmtLei(p.prod, 2) : "—"; } },
      { l: "Podea ×1,25 (cu TVA)", f: (r, s) => { const p = pricing(r, s); return p ? fmtLei(p.floorGross, 2) : "—"; } },
      { l: "Listă ×1,40 (cu TVA)", f: (r, s) => { const p = pricing(r, s); return p ? fmtLei(p.listGross, 2) : "—"; } },
      { l: "Față de podea", f: (r, s) => { const p = pricing(r, s); if (!p || p.net === null) return "—"; return p.net < p.floor ? "sub podea cu " + fmtPct(-p.room, 0) : (p.net < p.list ? "sub listă · spațiu " : "peste listă · spațiu ") + fmtPct(p.room, 0); }, pill: (r, s) => { const p = pricing(r, s); if (!p || p.net === null) return ""; return p.net < p.floor ? "bad" : p.net < p.list ? "warn" : "good"; } }
    ] },
  milestones: { coll: "milestones", layout: "table", add: "Adaugă reper", label: "Reper", sort: "date",
    cols: [
      { k: "date", l: "Termen", t: "date", w: "16%" },
      { k: "title", l: "Reper", t: "text", w: "42%" },
      { k: "owner", l: "Responsabil", t: "text", w: "22%" },
      { k: "status", l: "Stare", t: "select", o: MS_STATES, w: "14%", dv: msStatus }
    ] },
  risks: { coll: "risks", layout: "cards", add: "Adaugă risc", label: "Risc", sort: "order",
    cols: [
      { k: "risk", l: "Riscul", t: "text" },
      { k: "impact", l: "Impact", t: "select", o: ["Mic", "Mic–mediu", "Mediu", "Mare"] },
      { k: "prob", l: "Probabilitate", t: "select", o: ["Mică", "Medie", "Medie–mare", "Mare"] },
      { k: "measure", l: "Măsura de prevenire", t: "long" },
      { k: "owner", l: "Responsabil", t: "text" }
    ] },
  costs: { coll: "costs", layout: "table", add: "Adaugă linie", label: "Linie", sort: "order",
    cols: [
      { k: "label", l: "Capitol", t: "text", w: "40%" },
      { k: "amount", l: "Sumă (EUR)", t: "num", min: 0, step: 100, w: "18%" },
      { k: "note", l: "Observații / deviz", t: "text", w: "34%" }
    ],
    total: (rows) => "Total: " + fmtEur(rows.reduce((s, r) => s + (num(r.amount) || 0), 0)) + " · ≈ " + fmtLei(rows.reduce((s, r) => s + (num(r.amount) || 0), 0) * 5, 0) + " la 5,0 lei/EUR" },
  captable: { coll: "captable", layout: "table", add: "Adaugă asociat", label: "Asociat", sort: "order",
    cols: [
      { k: "name", l: "Asociat", t: "text", w: "30%" },
      { k: "role", l: "Rol", t: "text", w: "22%" },
      { k: "pct", l: "Procent (%)", t: "num", min: 0, max: 100, step: 0.5, w: "14%" },
      { k: "contrib", l: "Contribuție", t: "text", w: "26%" }
    ],
    total: (rows) => { const s = rows.reduce((a, r) => a + (num(r.pct) || 0), 0); return "Total: " + fmtNum(s, 1) + "%" + (rows.length && Math.abs(s - 100) > 0.01 ? " · trebuie să fie 100%" : ""); } },
  roles: { coll: "roles", layout: "table", add: "Adaugă rol", label: "Rol", sort: "order",
    cols: [
      { k: "role", l: "Rol", t: "text", w: "30%" },
      { k: "name", l: "Persoana", t: "text", w: "24%" },
      { k: "reports", l: "Raportează la", t: "text", w: "24%" },
      { k: "count", l: "Posturi", t: "num", min: 0, step: 1, w: "10%" }
    ] },
  tov: { coll: "tov", layout: "table", add: "Adaugă axă", label: "Axă", sort: "order",
    cols: [
      { k: "axis", l: "Axa", t: "text", w: "26%" },
      { k: "pos", l: "Poziția Heat", t: "select", o: ["1 · prima parte", "2", "3 · la mijloc", "4", "5 · a doua parte"], w: "18%" },
      { k: "example", l: "Cum sună la Heat", t: "text", w: "48%" }
    ] },
  moments: { coll: "moments", layout: "cards", add: "Adaugă moment", label: "Moment", sort: "order",
    cols: [
      { k: "moment", l: "Momentul", t: "text" },
      { k: "service", l: "Service (ce facem, standardul)", t: "long" },
      { k: "care", l: "Care (cum facem, în tonul Heat)", t: "long" },
      { k: "sop", l: "SOP / măsurare", t: "text" }
    ] },
  kpis: { coll: "kpis", layout: "cards", add: "Adaugă KPI", label: "KPI", sort: "order",
    cols: [
      { k: "cat", l: "Zona", t: "select", o: ["Operațiuni", "Marketing", "Financiar"] },
      { k: "kpi", l: "Indicator", t: "text" },
      { k: "freq", l: "Frecvență", t: "select", o: ["Zilnic", "Săptămânal", "Lunar", "Trimestrial"] },
      { k: "owner", l: "Responsabil", t: "text" },
      { k: "target", l: "Țintă", t: "long" },
      { k: "how", l: "Cum se măsoară", t: "long" }
    ] },
  sops: { coll: "sops", layout: "table", add: "Adaugă SOP", label: "SOP", sort: "code",
    cols: [
      { k: "code", l: "Cod", t: "text", w: "13%", ph: "SOP-BOH-001" },
      { k: "title", l: "Titlu", t: "text", w: "30%" },
      { k: "cat", l: "Categorie", t: "select", o: ["Preparare produse", "Deschidere / Închidere", "Curățenie și igienă", "Recepție marfă", "Customer Service", "Siguranță alimentară", "Echipamente"], w: "17%" },
      { k: "zone", l: "Zona", t: "select", o: ["FOH", "BOH", "Livrare", "General"], w: "11%" },
      { k: "owner", l: "Responsabil", t: "text", w: "13%" },
      { k: "status", l: "Stare", t: "select", o: ["De scris", "Schiță", "Testat", "Antrenat", "Auditat"], w: "12%" }
    ],
    total: (rows) => { const n = rows.length, a = rows.filter((r) => r.status === "Antrenat" || r.status === "Auditat").length; return n + " SOP-uri · " + a + " antrenate sau auditate"; } },
  content: { coll: "content", layout: "cards", add: "Adaugă bucket", label: "Bucket", sort: "order",
    cols: [
      { k: "bucket", l: "Bucket", t: "select", o: ["Educațional", "Inspirațional", "Conversațional", "Promoțional", "Behind-the-scenes", "Comunitate"] },
      { k: "tofu", l: "TOFU · atenție (~50%)", t: "long" },
      { k: "mofu", l: "MOFU · încredere (~30%)", t: "long" },
      { k: "bofu", l: "BOFU · acțiune (~20%)", t: "long" }
    ] },
  checklist: { coll: "checklist", layout: "table", add: "Adaugă element", label: "Element", sort: "order",
    cols: [
      { k: "item", l: "Element", t: "text", w: "44%" },
      { k: "status", l: "Stare", t: "select", o: ["Nebifat", "În lucru", "Bifat"], w: "14%" },
      { k: "note", l: "Unde / dovada", t: "text", w: "36%" }
    ],
    total: (rows) => rows.filter((r) => r.status === "Bifat").length + " din " + rows.length + " bifate" }
};

const JOURNEY_STAGES = [
  { k: "awareness", t: "Conștientizare", d: "Întâlnește brandul prima dată." },
  { k: "consideration", t: "Evaluare", d: "Cercetează și compară înainte să aleagă." },
  { k: "first", t: "Prima vizită", d: "Intră pe ușă sau plasează prima comandă." },
  { k: "experience", t: "Experiența", d: "Mănâncă și trece prin tot mediul de servire." },
  { k: "loyalty", t: "Loialitate", d: "Revine și te integrează în rutină." },
  { k: "advocacy", t: "Recomandare", d: "Te recomandă, postează, extinde brandul." }
];
const JOURNEY_ROWS = [
  { k: "goals", t: "Ce vrea clientul" }, { k: "touch", t: "Puncte de contact" }, { k: "actions", t: "Acțiuni" },
  { k: "emotions", t: "Emoții" }, { k: "pain", t: "Puncte de durere" }, { k: "opps", t: "Oportunități" },
  { k: "metrics", t: "Indicatori" }, { k: "notes", t: "Note de echipă" }
];

const PYRAMID = [
  { k: "fundatia", t: "Fundația", q: "De ce pornesc această afacere?", to: "#s-fundatia" },
  { k: "piata", t: "1 · Piața", q: "Care este cererea?", to: "#s-piata" },
  { k: "produse", t: "2 · Produse și servicii", q: "Ce ofer ca să răspund cererii?", to: "#s-produs" },
  { k: "resurse", t: "3 · Resurse", q: "De ce am nevoie ca să produc?", to: "#b-operatiuni" },
  { k: "operationale", t: "4 · Sisteme operaționale", q: "Cum aplic resursele asupra produselor?", to: "#b-sop-registru" },
  { k: "management", t: "5 · Sisteme de management", q: "Cum conduc simplu, ca să pot crește?", to: "#b-management" },
  { k: "cultura", t: "6 · Cultură", q: "Ce valori și comportamente susțin totul?", to: "#b-cultura" }
];

const STATUS = { gol: "Gol", schita: "Schiță", gata: "Gata" };
const READERS = {
  atc: { name: "Complet (ATC)", note: "Versiunea completă, de lucru: toate secțiunile." },
  client: { name: "Beneficiar", note: "Versiunea completă de lucru, ca la ATC: toate secțiunile." },
  investor: { name: "Investitor", note: "Accent pe piață, model și partea financiară. Secțiunile de echipă internă, ospitalitate și cultură sunt ascunse." },
  team: { name: "Echipa Heat", note: "Accent pe viziune, valori, brand, oaspete, SOP-uri și felul în care lucrăm. Cifrele financiare sunt ascunse." }
};

const DECK = [
  ["Titlu", "numele, o propoziție: ce faci, pentru cine, de ce contează", ["pozitionare", "concept"]],
  ["Problema", "frustrarea clientului, ce îl costă, de ce acum", ["problema-solutia", "fir-narativ"]],
  ["Soluția", "propunerea de valoare: ce oferi, de ce e mai bună, pentru cine", ["pozitionare", "diferentiere"]],
  ["Produsul", "ce cumpără clientul de fapt, mixul, dovada", ["meniu", "diferentiere"]],
  ["Piața", "TAM / SAM / SOM și cum ai calculat", ["tam-sam-som", "piata-ansamblu"]],
  ["Clienții", "segmentele și cum le păstrezi", ["clienti", "fidelizare"]],
  ["Modelul de business", "surse de venit și structura de cost", ["pnl", "canale"]],
  ["Go-to-market", "reach, acquire, retain, grow", ["gtm", "continut"]],
  ["Operațiuni", "activități, resurse, parteneri, SOP-uri", ["operatiuni", "sop-registru"]],
  ["Concurența", "poziționare, wedge, moat", ["concurenta", "swot"]],
  ["Tracțiune", "dovezi, repere trecute și următoarele 6–12 luni", ["deschidere", "diferentiere"]],
  ["Financiar", "proiecții, prag de rentabilitate, ipoteze", ["pnl", "costuri-pornire"]],
  ["Cererea", "cât ceri și cum folosești banii", ["finantare", "costuri-pornire"]],
  ["Echipa", "de ce această echipă", ["echipa", "echipa-org"]],
  ["Închidere", "viziunea și contactul", ["viziune"]]
];

const GLOSSARY = [
  ["CE · CUM · DE CE", "Limbajul comun ATC: CE = valorile și standardele, CUM = misiunea, DE CE = viziunea."],
  ["Viziune / Misiune / Valori", "Viziunea: de ce existăm (destinația). Misiunea: cum facem asta zi de zi. Valorile: ce reprezentăm, principiile care ghidează deciziile."],
  ["Piramida de dezvoltare", "Fundație → piață → produse și servicii → resurse → sisteme operaționale → sisteme de management → cultură (Flamholtz & Randle)."],
  ["QSR", "Quick Service Restaurant: viteză de servire, meniu standardizat, volum mare, preț accesibil, consistență totală. Repede și bine, de fiecare dată."],
  ["FOH / BOH", "Front of House (tejghea, comandă, sală, pickup) și Back of House (bucătărie, prep, depozit)."],
  ["Fidelizarea", "Experiență senzorială care creează recurență; se construiește pe locație, customer service și produs, prin consistență."],
  ["Customer Service vs. Customer Care", "Service: ce facem (acțiuni, standarde, măsurabil). Care: cum facem (ton, empatie, atenție sinceră)."],
  ["Cele cinci momente", "Primirea (primele 10 secunde), comanda, așteptarea, livrarea, plecarea: fiecare cu Service și Care."],
  ["Cele patru principii ale ospitalității", "Prezența, anticiparea, personalizarea, consistența."],
  ["Food cost %", "Cost ingrediente (+ ambalaj direct) / preț de vânzare × 100. Reper 25–35%; țintă QSR sănătos ~30%."],
  ["Food cost real", "Stoc inițial + achiziții − stoc final, raportat la vânzări; se măsoară periodic, nu se presupune."],
  ["Cost de producție", "Food cost + labor + overhead + marketing, în lei per porție. Baza prețului, nu prețul."],
  ["Preț de podea", "Cost de producție × 1,25. Linia roșie: sub ea nu cobori niciodată. Instrument intern."],
  ["Preț de listă", "Preț de podea × 1,40. Prețul de pe meniu; spațiul dintre podea și listă e spațiul de joc (profit, discount, absorbție de costuri)."],
  ["Discount maxim sigur", "~20% din prețul de listă; temporar, calculat pe volum, cu un rezultat măsurabil. Alternative: combo, produs cadou, loialitate, preț de lansare."],
  ["SOP", "Standard Operating Procedure: pas cu pas, la un standard definit, de fiecare dată. Titlu, cod, versiune, zonă, responsabil, echipamente, ingrediente, pași cu standard și timp, standarde de calitate, observații."],
  ["De la SOP la sistem", "Inventariază → prioritizează → documentează (testează cu cineva fără experiență) → implementează și revizuiește."],
  ["Speed of Service (SOS)", "Timpul mediu de la comandă la produsul în mână: indicatorul principal de eficiență în QSR."],
  ["Ticket average", "Valoarea medie a unei comenzi; crește prin upselling și compoziția meniului."],
  ["Labor cost %", "Procentul din vânzări alocat forței de muncă; planificarea turelor e cheia."],
  ["CSAT", "Satisfacția oaspetelui, măsurată prin feedback, recenzii, mystery shopping."],
  ["Waste / spoilage", "Produs pierdut prin expirare, greșeli de preparare sau porționare incorectă; se măsoară zilnic, nu se presupune."],
  ["FIFO", "First In, First Out: ce intră primul în stoc se folosește primul."],
  ["Zona de pericol", "4–60 °C: produsele nu stau aici mai mult de 2 ore. Pui: reper uzual ≥ 75 °C intern, de confirmat în SOP."],
  ["Clean as you go", "Curăți pe măsură ce lucrezi, nu la sfârșitul turei."],
  ["Brand / Branding / Brand Identity", "Brandul = percepția (reputația). Branding = procesul (ce faci zilnic). Brand Identity = instrumentele (logo, culori, ton, ambalaj)."],
  ["Cele patru straturi", "Vizual (ce vede lumea), verbal (cum vorbești), emoțional (ce simt), experiențial (ce trăiesc)."],
  ["Arhetip de brand", "Unul dintre cele 12 tipare de personalitate (Jung) pe care oamenii le recunosc instinctiv; ADN-ul personalității brandului."],
  ["Triada poziționării", "Audiența (cui îi vorbești), propunerea de valoare (ce promiți), diferențiatorul (de ce tu)."],
  ["Statement de poziționare", "Frază internă: „Pentru [audiența], [brandul] este [categoria] care [propunerea], spre deosebire de [competiția], pentru că [diferențiatorul].”"],
  ["Fir narativ", "Originea, conflictul, misiunea, viziunea. Clientul e eroul; brandul e ghidul."],
  ["Tone of voice", "Cum sună brandul: formal ↔ casual, serios ↔ amuzant, respectuos ↔ provocator, entuziast ↔ calm."],
  ["Piloni de comunicare", "3–5 teme mari pe care stă tot ce spui (calitate, educație, comunitate, experiență)."],
  ["TOFU / MOFU / BOFU", "Etapele funnel-ului de conținut: atenție (nu te cunosc), încredere (te știu, n-au venit), acțiune (sunt gata). Mix ~50 / 30 / 20."],
  ["Content buckets", "Categoriile de conținut: educațional, inspirațional, conversațional, promoțional, behind-the-scenes, comunitate."],
  ["Cei 4P în QSR", "Product, Price, Place, Promotion: produsul livrează promisiunea, prețul e mesaj de brand, locul e orice punct de contact, promovarea ține tonul."],
  ["Return rate", "Câți oaspeți revin: cel mai important KPI de marketing."],
  ["TAM / SAM / SOM", "Toată piața · partea la care ajungi · partea pe care o câștigi realist."],
  ["Concurent direct / indirect", "Direct: produs similar pentru același client. Indirect: aceeași nevoie, alt produs."],
  ["Wedge (pana)", "Avantajul concret cu care intri în piață și câștigi primii clienți: ce ai tu și concurenții nu pot copia repede (de exemplu scara de iuțeală, rețeta, counter-ul la vedere în centru)."], ["Moat (șanțul de apărare)", "Ce face ca avantajul să țină în timp, după ce concurenții încearcă să te copieze: brandul, comunitatea, procedurile, furnizorii, locația."],
  ["Cap table", "Cine deține ce procent din companie."],
  ["Pro forma", "Proiecție financiară pe ipoteze declarate; scenariu, nu garanție."],
  ["P&L", "Venituri → COGS → profit brut → cheltuieli → profit operațional (EBITDA) → amortizare, dobânzi, impozit → profit net."],
  ["30/30/30/10", "Reper orientativ: COGS 30%, muncă 30%, cheltuieli 30%, profit net 10% din venitul net."],
  ["Prag de rentabilitate", "Venitul la care profitul e zero: costuri fixe / (1 − costuri variabile %)."],
  ["Cash flow", "Mișcarea banilor; o afacere profitabilă pe hârtie poate rămâne fără cash."],
  ["RACI", "Responsible, Accountable, Consulted, Informed: un R și un A pe sarcină."],
  ["Scorecard", "Grilă de evaluare a candidaților (1–5 pe criteriu), eventual cu ponderi."],
  ["Siguranță psihologică", "Convingerea că poți semnala probleme și greșeli fără teamă."],
  ["Clear is kind", "Comunicarea directă și clară previne confuzia și susține performanța."],
  ["Ciclul de viață", "Orice afacere are început și sfârșit; la localuri, în medie 8–10 ani. Ieșirea se planifică de la început."]
];

const CLAUDE_UID = "claude";
</script>
