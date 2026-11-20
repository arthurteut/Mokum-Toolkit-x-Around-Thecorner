
/* ═══════════════════ Utilitare ═══════════════════ */
const $ = (id) => document.getElementById(id);
function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined && text !== null) e.textContent = text; return e; }
function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
function num(v) { if (v === "" || v === null || v === undefined) return null; const n = typeof v === "number" ? v : parseFloat(String(v).replace(",", ".")); return isFinite(n) ? n : null; }
function fmtNum(n, dec) { if (n === null || n === undefined || !isFinite(n)) return "—"; return n.toLocaleString("ro-RO", { minimumFractionDigits: 0, maximumFractionDigits: dec === undefined ? 0 : dec }); }
function fmtLei(n, dec) { return n === null || !isFinite(n) ? "—" : fmtNum(n, dec === undefined ? 0 : dec) + " lei"; }
function fmtEur(n) { return n === null || !isFinite(n) ? "—" : fmtNum(n, 0) + " EUR"; }
function fmtPct(n, dec) { return n === null || !isFinite(n) ? "—" : fmtNum(n, dec === undefined ? 1 : dec) + " %"; }
function foodCost(r, s) { const p = num(r.price), c = num(r.cogs); if (!p || c === null) return null; const net = p / (1 + (num(s && s.vat) || 0) / 100); return net > 0 ? c / net * 100 : null; }
function pricing(r, s) {
  const c = num(r.cogs); if (c === null) return null;
  const st = s || {}; const p = num(r.price); const vat = num(st.vat) || 0;
  const net = p ? p / (1 + vat / 100) : null; const ticket = num(st.ticket);
  let share = num(r.alloc); if (share === null) share = (p && ticket) ? p / ticket * 100 : 100;
  const perTx = (num(st.labor) || 0) + (num(st.overhead) || 0) + (num(st.mkt) || 0);
  const add = perTx * share / 100; const prod = c + add; const floor = prod * 1.25; const list = floor * 1.4;
  const room = net ? (net - floor) / net * 100 : null;
  return { fc: c, share, perTx, add, prod, floor, list, floorGross: floor * (1 + vat / 100), listGross: list * (1 + vat / 100), net, room };
}
function fmtWhen(ts) { if (!ts) return ""; try { return new Date(ts).toLocaleString("ro-RO", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); } catch (e) { return ""; } }
function fmtDay(s) { if (!s) return "—"; const d = new Date(s + "T12:00:00"); return isNaN(d) ? s : d.toLocaleDateString("ro-RO", { day: "numeric", month: "short", year: "numeric" }); }
function debounce(fn, ms) { let t; return function () { const a = arguments, c = this; clearTimeout(t); t = setTimeout(() => fn.apply(c, a), ms); }; }
let toastT; function toast(msg) { const t = $("toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 2200); }
function armButton(btn, label, confirmLabel, action) {
  btn.addEventListener("click", () => {
    if (btn.dataset.armed) { delete btn.dataset.armed; btn.classList.remove("armed"); btn.textContent = label; action(); return; }
    btn.dataset.armed = "1"; btn.classList.add("armed"); btn.textContent = confirmLabel;
    setTimeout(() => { if (btn.dataset.armed) { delete btn.dataset.armed; btn.classList.remove("armed"); btn.textContent = label; } }, 4000);
  });
}
function mdToHtml(text, vmv) {
  const lines = String(text || "").replace(/\r/g, "").split("\n");
  let html = "", para = [], list = null, first = true;
  const flush = () => {
    if (list) { html += "<" + list.tag + ">" + list.items.map((i) => "<li>" + inline(i) + "</li>").join("") + "</" + list.tag + ">"; list = null; }
    if (para.length) { const cls = vmv && first ? ' class="vmv"' : ""; html += "<p" + cls + ">" + inline(para.join("<br>")) + "</p>"; para = []; first = false; }
  };
  const inline = (s) => s.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
  lines.forEach((raw) => {
    const l = esc(raw);
    const t = l.trim();
    if (!t) { flush(); return; }
    if (/^##\s+/.test(t)) { flush(); html += "<h4>" + inline(t.replace(/^##\s+/, "")) + "</h4>"; first = false; return; }
    const ul = /^[-•]\s+/.test(t), ol = /^\d+[.)]\s+/.test(t);
    if (ul || ol) { if (para.length) flush(); const tag = ul ? "ul" : "ol"; if (!list || list.tag !== tag) { if (list) flush(); list = { tag, items: [] }; } list.items.push(t.replace(/^([-•]|\d+[.)])\s+/, "")); return; }
    if (list) flush();
    para.push(t);
  });
  flush();
  return html;
}

/* ═══════════════════ Stare ═══════════════════ */
let db = null, user = null, uid = null, canWrite = null, dbState = "loading";
const blocks = {};      // plan/<id>
const settings = {};    // settings/<id>
const rows = {};        // tool -> {id: row}
const swotItems = {};   // swot/<id>
const journey = {};     // journey/<stage>
const raci = {};        // raci/<id>
let privateDoc = null;
const editing = new Set();
const drafts = {};
const pendingRender = new Set();
const logThrottle = {};
let logQueue = Promise.resolve();
const ALL_BLOCKS = [];
SECTIONS.forEach((s) => (s.blocks || []).forEach((b) => ALL_BLOCKS.push(b)));

/* ═══════════════════ Scheletul paginii ═══════════════════ */
function renderStatic() {
  const tape = $("tape");
  for (let i = 0; i < 16; i++) {
    const s = el("span");
    ["Feel the heat", "×", null, "×"].forEach((t) => {
      if (t === null) { const img = el("img"); img.src = "assets/heat/ht-monogram.png"; img.alt = ""; s.appendChild(img); }
      else s.appendChild(el("span", "", t));
    });
    tape.appendChild(s);
  }
  const main = $("main");
  const chips = $("chips"), side = $("sidenav");
  SECTIONS.forEach((sec) => {
    const a = el("a"); a.href = "#s-" + sec.id; a.textContent = sec.nav; chips.appendChild(a);
    const b = el("a"); b.href = "#s-" + sec.id;
    const i = el("i", "", sec.num || "—"); const t = el("span", "", sec.nav); const sm = el("small", "", ""); sm.id = "nav-" + sec.id; t.appendChild(sm);
    b.appendChild(i); b.appendChild(t); side.appendChild(b);

    const section = el("section", "section"); section.id = "s-" + sec.id;
    if (sec.kind === "start") { section.appendChild(renderStart()); main.appendChild(section); return; }
    section.appendChild(el("div", "chevrons sec-divider"));
    const head = el("div", "sec-head");
    head.appendChild(el("div", "n", sec.num));
    head.appendChild(el("h2", "", sec.title));
    const q = el("span", "q", sec.question); head.appendChild(q);
    if (sec.intro) head.appendChild(el("p", "intro", sec.intro));
    head.style.marginTop = "22px";
    section.appendChild(head);
    const note = el("div", "banner warn reader-note"); note.id = "rn-" + sec.id; note.hidden = true; section.appendChild(note);
    if (sec.kind === "tools") { section.appendChild(renderInstruments()); main.appendChild(section); return; }
    const wrap = el("div", "blocks");
    sec.blocks.forEach((b) => wrap.appendChild(renderBlockShell(b)));
    section.appendChild(wrap);
    main.appendChild(section);
  });
}

function renderBlockShell(b) {
  const art = el("article", "card block"); art.id = "b-" + b.id; art.dataset.id = b.id; art.dataset.aud = b.aud.join(" ");
  const head = el("div", "blk-head");
  const h3 = el("h3", "", b.title); const q = el("span", "q", b.q); h3.appendChild(q); head.appendChild(h3);
  if (b.kind !== "private") {
    const st = el("label", "status");
    st.appendChild(el("span", "sr", "Stare"));
    const sel = el("select"); sel.id = "s-" + b.id; sel.className = "s-gol";
    Object.keys(STATUS).forEach((k) => { const o = el("option", "", STATUS[k]); o.value = k; sel.appendChild(o); });
    sel.addEventListener("change", () => saveBlock(b.id, { status: sel.value }, "stare"));
    st.appendChild(sel); head.appendChild(st);
  }
  art.appendChild(head);
  const g = el("div", "guide");
  g.innerHTML = b.guide
    + (b.more ? "<details><summary>Mai multe detalii</summary><p style=\"margin-top:6px\">" + b.more + "</p></details>" : "")
    + (b.prompts && b.prompts.length ? "<details><summary>Întrebări de reflecție</summary><ul>" + b.prompts.map((p) => "<li>" + esc(p) + "</li>").join("") + "</ul></details>" : "");
  art.appendChild(g);
  const c = el("div", "content"); c.id = "c-" + b.id;
  c.appendChild(el("p", "rendered empty", "Se încarcă…"));
  art.appendChild(c);
  return art;
}

/* ─── Start ─── */
function renderStart() {
  const frag = document.createDocumentFragment();
  const hero = el("div", "hero");
  hero.innerHTML = '<span class="eyebrow">Around The Corner Development × Heat · K&amp;G Nash Food</span>'
    + '<h1>Plan de afaceri</h1>'
    + '<span class="marker">„Planurile nu valorează nimic, dar planificarea este esențială.” — Eisenhower</span>'
    + '<p class="lead">Pagina de lucru a planului Heat, construită pe lecțiile predate echipei de Around The Corner.</p>';
  const ideas = el("div", "ideas");
  [["Fără plan nu reușești", "Definește succesul înainte să începi: planul este, înainte de toate, definiția succesului tău.", "Cine nu se pregătește, se pregătește să eșueze."],
   ["Planul se va schimba", "La primul contact cu realitatea apare ceva care îl schimbă. Ajustezi. Nu e eșecul planului, e situația normală.", "Toată lumea are un plan până când primește un pumn în față."],
   ["Planificarea contează, nu planul", "Documentul se învechește repede; rămâne gândirea: piața, resursele, riscurile. Ea te ajută să reacționezi corect.", "Planurile nu valorează nimic, dar planificarea este esențială."]
  ].forEach((i) => { const d = el("div", "idea"); d.appendChild(el("h3", "", i[0])); d.appendChild(el("p", "", i[1])); d.appendChild(el("q", "", i[2])); ideas.appendChild(d); });
  hero.appendChild(ideas);
  const banner = el("div", "banner"); banner.id = "db-banner"; banner.hidden = true; hero.appendChild(banner);
  frag.appendChild(hero);

  const grid = el("div", "start-grid");
  const metaCard = el("div", "card"); metaCard.id = "meta-card";
  metaCard.innerHTML = '<h3 style="font-size:26px;font-style:italic;color:var(--accent)">Unde e Heat acum</h3><p class="muted" style="font-size:14px;margin:4px 0 12px">Seria ATC se adresează la trei situații: vrei să deschizi, ești pe punctul de a deschide, ai deschis și vrei să scalezi.</p>'
    + '<div class="meta-grid">'
    + '<div class="field"><label for="m-stage">Stadiul</label><select id="m-stage"><option value="">—</option><option>Idee / planificare</option><option>Pe punctul de a deschide</option><option>Deschis, vrem să scalăm</option></select></div>'
    + '<div class="field"><label for="m-city">Locația</label><input type="text" id="m-city" maxlength="120" placeholder="oraș, adresă"></div>'
    + '<div class="field"><label for="m-opening">Deschiderea <span class="sub">estimată</span></label><input type="month" id="m-opening"></div>'
    + '<div class="field"><label for="m-company">Societatea operatoare</label><input type="text" id="m-company" maxlength="80" placeholder="ex. K&G Nash Food"></div>'
    + '</div><div class="meta" id="meta-meta"></div>';
  grid.appendChild(metaCard);
  const pyr = el("div", "card");
  pyr.innerHTML = '<h3 style="font-size:26px;font-style:italic;color:var(--accent)">Piramida de dezvoltare</h3><p class="muted" style="font-size:14px;margin:4px 0 6px">Se construiește de jos în sus; fiecare nivel se sprijină pe cel de dedesubt. Marchează stadiul fiecărui nivel.</p><div class="pyramid" id="pyramid"></div><p class="pyr-foot">Întâi <b>de ce</b>, apoi <b>pentru cine</b>, apoi <b>ce</b>, apoi <b>cu ce</b>, apoi <b>cum</b>, apoi <b>cum conduci</b>, la final <b>cultura</b>.</p>';
  grid.appendChild(pyr);
  frag.appendChild(grid);

  const next = el("div", "card"); next.style.marginTop = "18px";
  next.innerHTML = '<div class="blk-head"><h3>Următoarele repere<span class="q">din planul de deschidere</span></h3></div><div class="next-list" id="next-list" style="margin-top:10px"></div>';
  frag.appendChild(next);
  return frag;
}

function renderPyramid() {
  const box = $("pyramid"); box.innerHTML = "";
  const st = settings.pyramid || {};
  PYRAMID.slice().reverse().forEach((lvl, i) => {
    const idx = PYRAMID.length - 1 - i; // 0 = fundația (jos, lat)
    const s = st[lvl.k] || "gol";
    const a = el("a", "lvl " + s); a.href = lvl.to; a.style.width = (100 - idx * 7) + "%";
    const t = el("span", "t", lvl.t); t.appendChild(el("span", "qq", lvl.q)); a.appendChild(t);
    const sel = el("select"); sel.setAttribute("aria-label", "Stadiul nivelului " + lvl.t);
    Object.keys(STATUS).forEach((k) => { const o = el("option", "", STATUS[k]); o.value = k; sel.appendChild(o); });
    sel.value = s;
    sel.addEventListener("click", (e) => e.preventDefault());
    sel.addEventListener("mousedown", (e) => e.stopPropagation());
    sel.addEventListener("change", (e) => { e.preventDefault(); const d = Object.assign({}, st, { [lvl.k]: sel.value }); saveDoc("settings/pyramid", d, "piramida"); });
    a.appendChild(sel);
    a.addEventListener("click", (e) => { if (e.target.tagName === "SELECT") e.preventDefault(); });
    box.appendChild(a);
  });
}

function renderMeta() {
  const m = settings.meta || {};
  ["stage", "city", "opening", "company"].forEach((k) => { const i = $("m-" + k); if (document.activeElement !== i) i.value = m[k] || ""; });
  const mm = $("meta-meta"); mm.innerHTML = "";
  if (m.updatedAt) { mm.appendChild(el("span", "", "Modificat de ")); mm.appendChild(uidSpan(m.updatedBy)); mm.appendChild(el("span", "", " · " + fmtWhen(m.updatedAt))); }
}
const saveMeta = debounce(() => {
  const d = Object.assign({}, settings.meta || {}, { stage: $("m-stage").value, city: $("m-city").value.trim(), opening: $("m-opening").value, company: $("m-company").value.trim() });
  saveDoc("settings/meta", d, "stadiul");
}, 700);

function renderNext() {
  const box = $("next-list"); box.innerHTML = "";
  const ms = Object.values(rows.milestones || {}).filter((r) => !r.done).sort((a, b) => (a.date || "9999") < (b.date || "9999") ? -1 : 1).slice(0, 5);
  if (!ms.length) { box.appendChild(el("p", "muted", "Niciun reper deschis. Adaugă-le în planul de deschidere (secțiunea 07).")); return; }
  ms.forEach((r) => { const d = el("div", "next-item"); d.appendChild(el("span", "d", r.date ? fmtDay(r.date) : "fără dată")); const t = el("span", "", r.title || "—"); if (r.owner) { t.appendChild(el("span", "muted", " · " + r.owner)); } d.appendChild(t); box.appendChild(d); });
}

/* ─── Instrumente ─── */
function renderInstruments() {
  const wrap = el("div", "blocks");
  const r = el("div", "card");
  r.innerHTML = '<div class="blk-head"><h3>Versiuni pentru cititori<span class="q">Un plan, mai multe versiuni</span></h3></div>'
    + '<div class="guide">Componentele nu au un format fix: pot fi mutate, prezentate diferit sau omise. Planul se adaptează la interesul celui care îl citește: <b>tu</b> → versiunea completă; <b>finanțatorul</b> → partea financiară; <b>membrul echipei</b> → misiunea și valorile.</div>'
    + '<p class="reader-note" style="margin-top:12px">Alege cititorul din antetul paginii. Secțiunile care nu îl privesc se ascund, iar fiecare secțiune spune ce a rămas ascuns. Alegerea rămâne pe acest dispozitiv.</p>'
    + '<div class="table-scroll aud-table"><table class="t"><thead><tr><th>Cititor</th><th>Pe ce pune accentul</th></tr></thead><tbody>'
    + Object.keys(READERS).map((k) => "<tr><td><b>" + esc(READERS[k].name) + "</b></td><td>" + esc(READERS[k].note) + "</td></tr>").join("") + "</tbody></table></div>";
  wrap.appendChild(r);

  const d = el("div", "card");
  d.innerHTML = '<div class="blk-head"><h3>Pitch deck<span class="q">15 slide-uri din plan</span></h3></div>'
    + '<div class="guide">Un pitch deck structurează scopul companiei într-o poveste scurtă și convingătoare: pentru investitori sau pentru alinierea echipei de conducere. Mai puțină estetică, mai multă substanță apărabilă. Dacă afacerea nu există încă, cifrele sunt estimări: arată cum le-ai calculat. Dacă poți spune povestea în cinci minute, ai șanse mai mari cu un investitor ocupat.</div>'
    + '<p class="muted" style="font-size:14px;margin:12px 0 10px">Fiecare slide se alimentează din blocurile planului; starea lor arată cât de pregătit e deck-ul.</p><div class="deck" id="deck"></div>';
  wrap.appendChild(d);

  const g = el("div", "card");
  g.innerHTML = '<div class="blk-head"><h3>Glosar<span class="q">termenii planului</span></h3></div>'
    + '<div class="field gl-filter" style="margin-top:12px"><label for="gl-q" class="sr">Caută în glosar</label><input type="search" id="gl-q" placeholder="caută un termen…"></div><dl class="glossary" id="glossary"></dl>';
  wrap.appendChild(g);

  const l = el("div", "card");
  l.innerHTML = '<div class="blk-head"><h3>Jurnal de modificări<span class="q">planul e un document viu</span></h3></div><p class="muted" style="font-size:14px;margin:10px 0">Ultimele modificări salvate pe pagină, de oricine, inclusiv de Claude.</p><div class="log" id="log"></div>';
  wrap.appendChild(l);
  return wrap;
}
function renderDeck() {
  const box = $("deck"); if (!box) return; box.innerHTML = "";
  DECK.forEach((s, i) => {
    const d = el("div", "slide"); d.appendChild(el("span", "sn", String(i + 1)));
    const body = el("div"); body.appendChild(el("b", "", s[0])); body.appendChild(el("span", "muted", s[1]));
    const pills = el("div", "pills");
    s[2].forEach((id) => { const b = ALL_BLOCKS.find((x) => x.id === id); const st = (blocks[id] && blocks[id].status) || "gol"; const p = el("a", "pill " + st, (b ? b.title : id)); p.href = "#b-" + id; pills.appendChild(p); });
    body.appendChild(pills); d.appendChild(body); box.appendChild(d);
  });
}
function renderGlossary(q) {
  const dl = $("glossary"); if (!dl) return; dl.innerHTML = "";
  const f = (q || "").trim().toLowerCase();
  GLOSSARY.filter((g) => !f || (g[0] + " " + g[1]).toLowerCase().includes(f)).forEach((g) => { const d = el("div"); d.appendChild(el("dt", "", g[0])); d.appendChild(el("dd", "", g[1])); dl.appendChild(d); });
  if (!dl.children.length) dl.appendChild(el("dd", "muted", "Niciun termen pentru „" + f + "”."));
}
function renderLog() {
  const box = $("log"); if (!box) return; box.innerHTML = "";
  const entries = (settings.log && Array.isArray(settings.log.entries)) ? settings.log.entries : [];
  if (!entries.length) { box.appendChild(el("p", "muted", "Nicio modificare încă.")); return; }
  entries.slice(0, 25).forEach((e) => {
    const d = el("div", "log-item"); d.appendChild(el("span", "d", fmtWhen(e.ts)));
    const t = el("span"); t.appendChild(uidSpan(e.uid)); const b = ALL_BLOCKS.find((x) => x.id === e.block);
    t.appendChild(el("span", "", " · " + (e.kind || "modificare") + " · ")); const a = el("a", "", b ? b.title : (e.block || "")); a.href = "#b-" + (e.block || "start"); t.appendChild(a);
    d.appendChild(t); box.appendChild(d);
  });
}

/* ═══════════════════ Nume (user.profiles) ═══════════════════ */
function uidSpan(id) {
  const s = el("span", "who-name", id === CLAUDE_UID ? "Claude" : (id ? "…" : "cineva"));
  if (id && id !== CLAUDE_UID) s.dataset.uid = id;
  return s;
}
const resolveNames = debounce(async () => {
  if (!user) return;
  const nodes = Array.from(document.querySelectorAll("[data-uid]"));
  const ids = Array.from(new Set(nodes.map((n) => n.dataset.uid)));
  if (!ids.length) return;
  const ps = await user.profiles(ids);
  nodes.forEach((n) => { const p = ps[n.dataset.uid]; n.textContent = (p && p.name) || (n.dataset.uid === uid ? "tu" : "cineva"); });
}, 60);

/* ═══════════════════ Scriere ═══════════════════ */
function writeFailed(err) {
  const code = err && err.code;
  if (code === "invalid_argument" && canWrite === null) { setReadOnly("Nu ai drepturi de scriere pe această pagină: vezi planul, dar nu îl poți modifica."); return; }
  if (code === "quota_exceeded") { toast("Spațiul paginii e plin"); return; }
  toast("Nu s-a putut salva");
  console.error(err);
}
async function saveDoc(path, data, kind, block) {
  if (!db) return;
  try { await db.doc(path).set(data); toast("Salvat"); if (kind) appendLog(block || path.split("/")[0], kind); }
  catch (err) { writeFailed(err); throw err; }
}
function appendLog(block, kind) {
  logQueue = logQueue.then(async () => {
    const prev = (settings.log && Array.isArray(settings.log.entries)) ? settings.log.entries : [];
    const e = { ts: Date.now(), uid: uid || "", block, kind };
    const entries = [e].concat(prev).slice(0, 120);
    try { await db.doc("settings/log").set({ entries }); settings.log = { entries }; renderLog(); resolveNames(); } catch (err) { /* jurnalul e secundar */ }
  });
}
function appendLogThrottled(key, block, kind) {
  const t = Date.now();
  if (logThrottle[key] && t - logThrottle[key] < 10 * 60e3) return;
  logThrottle[key] = t; appendLog(block, kind);
}
async function saveBlock(id, patch, kind) {
  const cur = blocks[id] || { text: "", status: "gol" };
  const d = { text: cur.text || "", status: cur.status || "gol" };
  Object.assign(d, patch, { updatedAt: Date.now(), updatedBy: uid || "" });
  blocks[id] = d;
  await saveDoc("plan/" + id, d, kind, id);
}
function setReadOnly(msg) {
  canWrite = false; document.body.classList.add("ro");
  const b = $("db-banner"); b.hidden = false; b.className = "banner warn"; b.textContent = msg;
}

/* ═══════════════════ Blocurile de text ═══════════════════ */
function renderBlockContent(id) {
  const b = ALL_BLOCKS.find((x) => x.id === id); if (!b) return;
  const c = $("c-" + id); if (!c) return;
  const sel = $("s-" + id);
  const data = blocks[id] || {};
  if (sel) { const st = data.status || "gol"; if (sel.value !== st) sel.value = st; sel.className = "s-" + st; }
  if (b.kind === "private") return renderPrivate(id, c);
  if (b.kind === "swot") return renderSwot(c);
  if (b.kind === "market") return renderMarket(c);
  if (b.kind === "rows") return renderRows(b.tool, c, id);
  if (b.kind === "journey") return renderJourney(c);
  if (b.kind === "org") return renderOrg(c);
  if (b.kind === "pnl") return renderPnl(c);
  if (editing.has(id)) return; // nu suprascriem un editor deschis
  c.innerHTML = "";
  if (dbState === "loading") { c.appendChild(el("p", "rendered empty", "Se încarcă…")); return; }
  if (dbState === "none") { c.appendChild(el("p", "rendered empty", "Conținutul planului se vede doar din Claude.")); return; }
  const text = data.text || "";
  const r = el("div", "rendered" + (text ? "" : " empty"));
  if (text) r.innerHTML = mdToHtml(text, b.vmv); else r.textContent = "Nimic scris încă. " + (b.prompts && b.prompts[0] ? b.prompts[0] : "");
  c.appendChild(r);
  const meta = el("div", "meta");
  const ed = el("button", "linkish edit-only", text ? "Editează" : "Scrie"); ed.type = "button"; ed.addEventListener("click", () => openEditor(id, drafts[id] !== undefined ? drafts[id] : text));
  meta.appendChild(ed);
  if (data.updatedAt) { meta.appendChild(el("span", "", "·")); const w = el("span"); w.appendChild(el("span", "", "modificat de ")); w.appendChild(uidSpan(data.updatedBy)); w.appendChild(el("span", "", " · " + fmtWhen(data.updatedAt))); meta.appendChild(w); }
  if (drafts[id] !== undefined && drafts[id] !== text) { meta.appendChild(el("span", "pill schita", "schiță nesalvată")); }
  c.appendChild(meta);
  if (b.counter) c.appendChild(counterLine(text));
  resolveNames();
}
function counterLine(text) {
  const words = (text.trim().match(/\S+/g) || []).length;
  const paras = text.trim() ? text.trim().split(/\n\s*\n/).length : 0;
  const d = el("p", "hint", paras + (paras === 1 ? " paragraf" : " paragrafe") + " · " + words + " cuvinte · ~" + Math.max(1, Math.round(words / 3)) + " secunde de citit" + (paras > 2 || words > 260 ? " · mai lung decât cere lecția (cel mult două paragrafe)" : ""));
  d.style.marginTop = "6px"; return d;
}
function openEditor(id, initial) {
  const b = ALL_BLOCKS.find((x) => x.id === id); const c = $("c-" + id);
  editing.add(id); c.innerHTML = "";
  const ed = el("div", "editor");
  const ta = el("textarea", "ta"); ta.id = "t-" + id; ta.value = initial || ""; ta.placeholder = (b.prompts && b.prompts.join("\n")) || "";
  ta.style.minHeight = Math.min(520, Math.max(150, 24 * ((initial || "").split("\n").length + 3))) + "px";
  ta.addEventListener("input", () => { drafts[id] = ta.value; if (b.counter) cnt.replaceWith(cnt = counterLine(ta.value)); });
  ta.addEventListener("keydown", (e) => { if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); doSave(); } });
  ed.appendChild(ta);
  let cnt = b.counter ? counterLine(initial || "") : el("span");
  ed.appendChild(cnt);
  const row = el("div", "row");
  const save = el("button", "btn", "Salvează"); save.type = "button";
  const cancel = el("button", "btn ghost", "Renunță"); cancel.type = "button";
  row.appendChild(save); row.appendChild(cancel); row.appendChild(el("span", "hint", "Ctrl + Enter salvează · paragrafe separate prin linie goală · „- ” pentru liste · **îngroșat**"));
  ed.appendChild(row); c.appendChild(ed);
  ta.focus();
  const doSave = async () => {
    save.disabled = true;
    try { await saveBlock(id, { text: ta.value.trim(), status: (blocks[id] && blocks[id].status && blocks[id].status !== "gol") ? blocks[id].status : (ta.value.trim() ? "schita" : "gol") }, "text"); delete drafts[id]; editing.delete(id); renderBlockContent(id); updateProgress(); }
    catch (e) { save.disabled = false; }
  };
  save.addEventListener("click", doSave);
  cancel.addEventListener("click", () => { delete drafts[id]; editing.delete(id); renderBlockContent(id); });
}

/* ─── „De ce”-ul privat ─── */
function renderPrivate(id, c) {
  if (c.dataset.built) { const ta = $("t-" + id); if (ta && document.activeElement !== ta && privateDoc) ta.value = privateDoc.why || ""; return; }
  c.innerHTML = "";
  if (dbState !== "ready") { c.appendChild(el("p", "rendered empty", dbState === "loading" ? "Se încarcă…" : "Disponibil doar din Claude.")); return; }
  if (!uid) { c.appendChild(el("p", "rendered empty", "Ca să ai un spațiu privat, pagina trebuie deschisă cu contul tău.")); return; }
  c.dataset.built = "1";
  const ta = el("textarea", "ta"); ta.id = "t-" + id; ta.placeholder = "Doar pentru tine…"; ta.value = (privateDoc && privateDoc.why) || "";
  const st = el("p", "hint", "Se salvează automat, doar în spațiul tău privat.");
  ta.addEventListener("input", debounce(async () => {
    try { await db.doc("data/users/" + uid + "/private").set({ why: ta.value, updatedAt: Date.now() }); st.textContent = "Salvat privat · " + fmtWhen(Date.now()); }
    catch (e) { st.textContent = "Nu s-a putut salva în spațiul privat (contul tău nu poate scrie aici)."; }
  }, 900));
  c.appendChild(ta); c.appendChild(st);
}

/* ═══════════════════ Instrumente pe rânduri ═══════════════════ */
function guardRender(container, key, fn) {
  const ae = document.activeElement;
  if (ae && container.contains(ae) && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName)) {
    pendingRender.add(key);
    if (!container.dataset.guard) {
      container.dataset.guard = "1";
      container.addEventListener("focusout", () => setTimeout(() => { if (!container.contains(document.activeElement) && pendingRender.has(key)) { pendingRender.delete(key); fn(); } }, 0));
    }
    return;
  }
  pendingRender.delete(key); fn();
}
function sortedRows(tool) {
  const def = TOOLS[tool]; const list = Object.values(rows[tool] || {});
  const key = def.sort || "order";
  const ord = (v) => { if (key === "tier") return ["Primar", "Secundar", "Terțiar / nișă"].indexOf(v); if (key === "type") return ["Direct", "Indirect", "Viitor"].indexOf(v); return v; };
  return list.sort((a, b) => { const x = ord(a[key]), y = ord(b[key]); if (x === undefined || x === null || x === "") return 1; if (y === undefined || y === null || y === "") return -1; if (x < y) return -1; if (x > y) return 1; return (a.order || 0) - (b.order || 0); });
}
function renderRows(tool, c, blockId) {
  guardRender(c, tool, () => {
    const def = TOOLS[tool]; c.innerHTML = "";
    if (dbState !== "ready") { c.appendChild(el("p", "rendered empty", dbState === "loading" ? "Se încarcă…" : "Disponibil doar din Claude.")); return; }
    const list = sortedRows(tool);
    if (tool === "products") c.appendChild(productsSettings());
    if (!list.length) c.appendChild(el("div", "tool-empty", "Niciun rând încă. Apasă „" + def.add + "”."));
    else if (def.layout === "table") c.appendChild(rowsTable(tool, list, blockId));
    else c.appendChild(rowsCards(tool, list, blockId));
    if (def.total && list.length) { const t = el("p", "hint total", def.total(list)); t.style.cssText = "font-size:14px;font-weight:700;color:var(--ink);margin-top:8px"; c.appendChild(t); }
    const act = el("div", "tool-actions edit-only");
    const add = el("button", "btn yellow", def.add); add.type = "button";
    add.addEventListener("click", async () => { try { const defaults = {}; def.cols.forEach((col) => { defaults[col.k] = col.t === "check" ? false : col.t === "num" ? null : ""; }); await db.collection(def.coll).add(Object.assign(defaults, { order: Date.now(), createdAt: Date.now(), createdBy: uid || "" })); appendLog(blockId, "rând nou"); } catch (e) { writeFailed(e); } });
    act.appendChild(add); c.appendChild(act);
    if (tool === "competitors") c.appendChild(positioningMatrix(list));
  });
}
function rowInput(tool, row, col) {
  const id = tool + "-" + row.id + "-" + col.k;
  let i;
  if (col.t === "select") { i = el("select"); const o0 = el("option", "", "—"); o0.value = ""; i.appendChild(o0); col.o.forEach((o) => { const op = el("option", "", o); op.value = o; i.appendChild(op); }); i.value = row[col.k] || ""; }
  else if (col.t === "long") { i = el("textarea"); i.value = row[col.k] || ""; i.rows = 2; }
  else if (col.t === "check") { i = el("input"); i.type = "checkbox"; i.checked = !!row[col.k]; i.style.width = "auto"; i.style.transform = "scale(1.3)"; }
  else { i = el("input"); i.type = col.t === "num" ? "number" : col.t === "date" ? "date" : "text"; if (col.t === "num") { if (col.min !== undefined) i.min = col.min; if (col.max !== undefined) i.max = col.max; i.step = col.step || "any"; i.inputMode = "decimal"; } if (col.ph) i.placeholder = col.ph; i.value = row[col.k] === null || row[col.k] === undefined ? "" : row[col.k]; }
  i.id = id; i.setAttribute("aria-label", col.l);
  const commit = () => {
    const v = col.t === "check" ? i.checked : col.t === "num" ? num(i.value) : i.value;
    rows[tool][row.id] = Object.assign({}, rows[tool][row.id], { [col.k]: v });
    return rows[tool][row.id];
  };
  const persist = async () => { const r = commit(); const d = Object.assign({}, r); delete d.id; try { await db.doc(TOOLS[tool].coll + "/" + row.id).set(Object.assign(d, { updatedAt: Date.now(), updatedBy: uid || "" })); appendLogThrottled(tool + ":" + row.id, blockOfTool(tool), "rând"); afterRowChange(tool); } catch (e) { writeFailed(e); } };
  if (col.t === "select" || col.t === "check" || col.t === "date") i.addEventListener("change", persist);
  else { const deb = debounce(persist, 700); i.addEventListener("input", () => { commit(); deb(); }); i.addEventListener("change", persist); }
  return i;
}
function blockOfTool(tool) { const b = ALL_BLOCKS.find((x) => x.tool === tool); return b ? b.id : tool; }
function afterRowChange(tool) {
  if (tool === "milestones") renderNext();
  const def = TOOLS[tool]; const c = $("c-" + blockOfTool(tool));
  if (def.total && c) { const t = c.querySelector(".hint.total"); if (t) t.textContent = def.total(Object.values(rows[tool])); }
  if (tool === "products") refreshComputed();
  if (tool === "competitors") { const cc = $("c-concurenta"); const old = cc && cc.querySelector(".pos-wrap"); if (old) old.replaceWith(positioningMatrix(sortedRows("competitors"))); }
  if (tool === "roles") renderOrg($("c-echipa-org"));
}
function refreshComputed() {
  const c = $("c-meniu"); if (!c) return; const s = settings.products || {};
  c.querySelectorAll("tr[data-row]").forEach((tr) => { const r = rows.products[tr.dataset.row]; if (!r) return; tr.querySelectorAll("td.computed").forEach((td, i) => { const def = TOOLS.products.computed[i]; td.innerHTML = ""; td.appendChild(computedCell(def, r, s)); }); });
}
function computedCell(def, r, s) { const span = el("span", "", def.f(r, s)); if (def.pill) { const p = def.pill(r, s); if (p) { const pill = el("span", "pill " + p, def.f(r, s)); return pill; } } return span; }
function deleteBtn(tool, row, blockId) {
  const b = el("button", "linkish danger", "Șterge"); b.type = "button";
  armButton(b, "Șterge", "Sigur? Șterge", async () => { try { await db.doc(TOOLS[tool].coll + "/" + row.id).delete(); appendLog(blockId, "rând șters"); } catch (e) { writeFailed(e); } });
  b.classList.add("edit-only"); return b;
}
function rowsTable(tool, list, blockId) {
  const def = TOOLS[tool]; const wrap = el("div", "table-scroll"); const t = el("table", "t");
  if (tool === "products") { t.style.width = "max-content"; t.style.minWidth = "100%"; }
  const thead = el("thead"); const trh = el("tr");
  def.cols.forEach((col) => { const th = el("th", col.t === "num" ? "n" : "", col.l); if (col.w) th.style.width = col.w; trh.appendChild(th); });
  (def.computed || []).forEach((cc) => trh.appendChild(el("th", "n", cc.l)));
  trh.appendChild(el("th", "", "")); thead.appendChild(trh); t.appendChild(thead);
  const tb = el("tbody");
  list.forEach((r) => {
    const tr = el("tr"); tr.dataset.row = r.id;
    def.cols.forEach((col) => { const td = el("td", "cell"); td.appendChild(rowInput(tool, r, col)); tr.appendChild(td); });
    (def.computed || []).forEach((cc) => { const td = el("td", "n computed"); td.appendChild(computedCell(cc, r, settings.products || {})); tr.appendChild(td); });
    const td = el("td"); td.appendChild(deleteBtn(tool, r, blockId)); tr.appendChild(td);
    tb.appendChild(tr);
  });
  t.appendChild(tb); wrap.appendChild(t); return wrap;
}
function rowsCards(tool, list, blockId) {
  const def = TOOLS[tool]; const wrap = el("div", "cards");
  list.forEach((r, idx) => {
    const card = el("div", "rowcard");
    const head = el("div", "rc-head"); head.appendChild(el("span", "kicker", def.label + " " + (idx + 1) + (r[def.cols[0].k] && def.cols[0].t === "select" ? " · " + r[def.cols[0].k] : ""))); head.appendChild(deleteBtn(tool, r, blockId)); card.appendChild(head);
    const g = el("div", "fgrid");
    def.cols.forEach((col) => { const f = el("div", "field"); if (col.t === "long") f.style.gridColumn = "1 / -1"; const lab = el("label", "", col.l); lab.htmlFor = tool + "-" + r.id + "-" + col.k; f.appendChild(lab); f.appendChild(rowInput(tool, r, col)); g.appendChild(f); });
    card.appendChild(g); wrap.appendChild(card);
  });
  return wrap;
}
function productsSettings() {
  const s = settings.products || {}; const box = el("div");
  const d = el("div", "fgrid"); d.style.marginBottom = "8px";
  [["vat", "TVA alimente (%)", "pentru prețul net", 1, 0, 30], ["ticket", "Bon mediu (lei, cu TVA)", "cota produsului = preț / bon", 0.5, 0], ["labor", "Labor (lei / bon)", "personal ÷ bonuri pe lună", 0.1, 0], ["overhead", "Overhead (lei / bon)", "chirie, utilități, administrativ, amortizare ÷ bonuri", 0.1, 0], ["mkt", "Marketing (lei / bon)", "", 0.1, 0]].forEach((f) => {
    const fd = el("div", "field"); const lab = el("label", "", f[1]); lab.htmlFor = "pr-" + f[0]; if (f[2]) lab.appendChild(el("span", "sub", " " + f[2])); fd.appendChild(lab);
    const i = el("input"); i.type = "number"; i.id = "pr-" + f[0]; i.step = f[3]; i.min = f[4]; if (f[5] !== undefined) i.max = f[5]; i.inputMode = "decimal"; i.value = s[f[0]] === undefined || s[f[0]] === null ? "" : s[f[0]];
    i.addEventListener("change", () => saveProducts({ [f[0]]: num(i.value) }, false));
    fd.appendChild(i); d.appendChild(fd);
  });
  box.appendChild(d);
  const act = el("div", "tool-actions edit-only"); act.style.marginTop = "0"; act.style.marginBottom = "10px";
  const b = el("button", "btn ghost", "Preia din P&L"); b.type = "button"; b.id = "pr-from-pnl"; b.style.fontSize = "14px"; b.style.padding = "4px 12px";
  b.addEventListener("click", () => { const p = settings.pnl || {}; const g = (k) => num(p[k]) || 0; const n = g("tx") * g("days"); if (!n) { toast("Completează întâi ipotezele din P&L"); return; } const rev = n * g("ticket"); const r2 = (v) => Math.round(v * 100) / 100; saveProducts({ ticket: g("ticket"), labor: r2(g("staff") / n), overhead: r2((g("rent") + g("util") + g("lease") + g("depInt") + rev * g("adminPct") / 100) / n), mkt: r2(g("ticket") * g("mktPct") / 100) }, true); });
  act.appendChild(b); act.appendChild(el("span", "hint", "din scenariul curent al P&L-ului: personal, chirie, utilități, leasing, administrativ, amortizare și marketing, împărțite la bonurile unei luni"));
  box.appendChild(act);
  const per = pricing({ cogs: 0, price: num(s.ticket) || 0 }, s);
  box.appendChild(el("p", "hint", "Cost de producție = food cost + (labor + overhead + marketing) × cota produsului din bon" + (per ? " (" + fmtLei(per.perTx, 2) + " pe un bon întreg)" : "") + " · preț de podea = cost × 1,25 · preț de listă = podea × 1,40. Prețul net = prețul de raft ÷ (1 + TVA). Comisioanele platformelor de livrare nu sunt incluse. Food cost: verde ≤ 30 %, galben 30–35 %, roșu peste 35 %.")).style.marginBottom = "10px";
  return box;
}
async function saveProducts(patch, rerender) {
  const d = Object.assign({}, settings.products || {}, patch, { updatedAt: Date.now(), updatedBy: uid || "" });
  settings.products = d;
  try { await db.doc("settings/products").set(d); toast("Salvat"); appendLogThrottled("products", "meniu", "parametri de preț"); if (rerender) renderRows("products", $("c-meniu"), "meniu"); else refreshComputed(); } catch (e) { writeFailed(e); }
}

/* ─── Matricea de poziționare ─── */
function positioningMatrix(list) {
  const wrap = el("div", "pos-wrap");
  const m = settings.market || {};
  const pts = list.filter((r) => num(r.q) && num(r.p)).map((r) => ({ n: r.name || "?", q: num(r.q), p: num(r.p), heat: false }));
  if (num(m.heatQ) && num(m.heatP)) pts.push({ n: "Heat", q: num(m.heatQ), p: num(m.heatP), heat: true });
  const W = 320, H = 320, pad = 34;
  const sx = (p) => pad + (p - 1) / 4 * (W - 2 * pad), sy = (q) => H - pad - (q - 1) / 4 * (H - 2 * pad);
  let svg = '<svg class="pos-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Matricea de poziționare: preț pe orizontală, calitate percepută pe verticală">';
  svg += '<line class="axis" x1="' + pad + '" y1="' + (H - pad) + '" x2="' + (W - pad) + '" y2="' + (H - pad) + '"/><line class="axis" x1="' + pad + '" y1="' + pad + '" x2="' + pad + '" y2="' + (H - pad) + '"/>';
  svg += '<line class="axis" x1="' + sx(3) + '" y1="' + pad + '" x2="' + sx(3) + '" y2="' + (H - pad) + '" stroke-dasharray="4 4"/><line class="axis" x1="' + pad + '" y1="' + sy(3) + '" x2="' + (W - pad) + '" y2="' + sy(3) + '" stroke-dasharray="4 4"/>';
  svg += '<text class="lbl" x="' + (W / 2) + '" y="' + (H - 10) + '" text-anchor="middle">Preț: ieftin → scump</text>';
  svg += '<text class="lbl" x="12" y="' + (H / 2) + '" text-anchor="middle" transform="rotate(-90 12 ' + (H / 2) + ')">Calitate percepută: ↑</text>';
  pts.forEach((p) => { svg += '<circle class="dot' + (p.heat ? " heat" : "") + '" cx="' + sx(p.p) + '" cy="' + sy(p.q) + '" r="' + (p.heat ? 8 : 6) + '"/><text class="nm" x="' + (sx(p.p) + 9) + '" y="' + (sy(p.q) + 4) + '">' + esc(p.n) + '</text>'; });
  svg += "</svg>";
  const left = el("div"); left.innerHTML = svg; wrap.appendChild(left);
  const right = el("div");
  right.appendChild(el("h4", "", "Poziționarea Heat")).style.cssText = "font-size:18px;font-style:italic;color:var(--accent);margin-bottom:6px";
  right.appendChild(el("p", "hint", "Dă fiecărui concurent o notă de calitate percepută și de preț (1–5) ca să apară pe hartă; Heat se așază aici.")).style.marginBottom = "8px";
  const g = el("div", "fgrid");
  [["heatQ", "Calitate percepută Heat (1–5)"], ["heatP", "Nivel de preț Heat (1–5)"]].forEach((f) => {
    const fd = el("div", "field"); const lab = el("label", "", f[1]); lab.htmlFor = "mk-" + f[0]; fd.appendChild(lab);
    const i = el("input"); i.type = "number"; i.min = 1; i.max = 5; i.step = 1; i.id = "mk-" + f[0]; i.value = m[f[0]] === undefined || m[f[0]] === null ? "" : m[f[0]];
    i.addEventListener("change", () => saveMarket({ [f[0]]: num(i.value) })); fd.appendChild(i); g.appendChild(fd);
  });
  right.appendChild(g);
  if (!pts.length) right.appendChild(el("p", "tool-empty", "Harta e goală până completezi calitatea și prețul.")).style.marginTop = "10px";
  wrap.appendChild(right);
  return wrap;
}
async function saveMarket(patch) {
  const d = Object.assign({}, settings.market || {}, patch, { updatedAt: Date.now(), updatedBy: uid || "" });
  settings.market = d;
  try { await db.doc("settings/market").set(d); toast("Salvat"); appendLogThrottled("market", "tam-sam-som", "cifre"); } catch (e) { writeFailed(e); }
}

/* ─── TAM / SAM / SOM ─── */
function renderMarket(c) {
  guardRender(c, "market", () => {
    c.innerHTML = "";
    if (dbState !== "ready") { c.appendChild(el("p", "rendered empty", dbState === "loading" ? "Se încarcă…" : "Disponibil doar din Claude.")); return; }
    const m = settings.market || {};
    const g = el("div", "fgrid");
    [["tam", "TAM", "lei / an · toată piața"], ["sam", "SAM", "lei / an · partea la care ajungi"], ["som", "SOM", "lei / an · partea pe care o câștigi"]].forEach((f) => {
      const fd = el("div", "field"); const lab = el("label", "", f[1]); lab.htmlFor = "mk-" + f[0]; lab.appendChild(el("span", "sub", " " + f[2])); fd.appendChild(lab);
      const i = el("input"); i.type = "number"; i.min = 0; i.step = 1000; i.id = "mk-" + f[0]; i.inputMode = "decimal"; i.value = m[f[0]] === undefined || m[f[0]] === null ? "" : m[f[0]];
      i.addEventListener("change", () => saveMarket({ [f[0]]: num(i.value) })); fd.appendChild(i);
      const ta = el("textarea"); ta.id = "mk-" + f[0] + "How"; ta.placeholder = "Cum ai calculat și sursa"; ta.value = m[f[0] + "How"] || ""; ta.setAttribute("aria-label", "Cum ai calculat " + f[1]);
      ta.addEventListener("input", debounce(() => saveMarket({ [f[0] + "How"]: ta.value }), 800)); fd.appendChild(ta);
      g.appendChild(fd);
    });
    c.appendChild(g);
    const vals = [["TAM", num(m.tam), "var(--data-3)"], ["SAM", num(m.sam), "var(--data-2)"], ["SOM", num(m.som), "var(--data-1)"]];
    const max = Math.max.apply(null, vals.map((v) => v[1] || 0));
    const box = el("div", "msz");
    vals.forEach((v) => { const r = el("div", "msz-row"); r.appendChild(el("span", "lab", v[0])); const bar = el("div", "bar"); const i = el("i"); i.style.width = (max > 0 && v[1] ? Math.max(1.5, v[1] / max * 100) : 0) + "%"; i.style.background = v[2]; bar.appendChild(i); r.appendChild(bar); r.appendChild(el("span", "val", v[1] ? fmtLei(v[1]) : "—")); box.appendChild(r); });
    c.appendChild(box);
    if (num(m.sam) && num(m.som)) c.appendChild(el("p", "hint", "SOM = " + fmtPct(num(m.som) / num(m.sam) * 100) + " din SAM" + (num(m.tam) ? " · SAM = " + fmtPct(num(m.sam) / num(m.tam) * 100, 2) + " din TAM" : ""))).style.marginTop = "6px";
  });
}

/* ─── SWOT ─── */
function renderSwot(c) {
  guardRender(c, "swot", () => {
    c.innerHTML = "";
    if (dbState !== "ready") { c.appendChild(el("p", "rendered empty", dbState === "loading" ? "Se încarcă…" : "Disponibil doar din Claude.")); return; }
    const grid = el("div", "swot");
    const Q = [["S", "Puncte forte", "intern · ce facem bine"], ["W", "Puncte slabe", "intern · ce putem îmbunătăți"], ["O", "Oportunități", "extern · tendințe de care profităm"], ["T", "Amenințări", "extern · ce ne poate încurca"]];
    Q.forEach((q) => {
      const box = el("div", "quad " + q[0]); const h = el("h4", "", q[1]); h.appendChild(el("small", "", q[2])); box.appendChild(h);
      Object.values(swotItems).filter((i) => i.quad === q[0]).sort((a, b) => (b.weight || 0) - (a.weight || 0) || (a.order || 0) - (b.order || 0)).forEach((it) => box.appendChild(swotItem(it, Q)));
      const add = el("button", "linkish add edit-only", "+ Adaugă"); add.type = "button";
      add.addEventListener("click", async () => { try { await db.collection("swot").add({ quad: q[0], text: "", weight: 2, order: Date.now(), createdBy: uid || "" }); appendLog("swot", "element nou"); } catch (e) { writeFailed(e); } });
      box.appendChild(add); grid.appendChild(box);
    });
    c.appendChild(grid);
    const n = Object.keys(swotItems).length;
    c.appendChild(el("p", "hint", n ? n + " elemente · punctele mari (●●●) apar primele. Mută un element în altă categorie când înțelegi că ține de voi (punct slab), nu de piață (amenințare)." : "Niciun element încă.")).style.marginTop = "10px";
  });
}
function swotItem(it, Q) {
  const d = el("div", "swot-item");
  const ta = el("textarea"); ta.value = it.text || ""; ta.placeholder = "scrie elementul…"; ta.id = "sw-" + it.id; ta.setAttribute("aria-label", "Element SWOT");
  const fit = () => { ta.style.height = "auto"; ta.style.height = (ta.scrollHeight + 2) + "px"; };
  setTimeout(fit, 0);
  const save = async (patch) => { swotItems[it.id] = Object.assign({}, swotItems[it.id], patch); const body = Object.assign({}, swotItems[it.id]); delete body.id; try { await db.doc("swot/" + it.id).set(body); appendLogThrottled("swot:" + it.id, "swot", "element"); } catch (e) { writeFailed(e); } };
  ta.addEventListener("input", () => { fit(); debSave(); });
  const debSave = debounce(() => save({ text: ta.value }), 700);
  d.appendChild(ta);
  const ctl = el("div", "ctl");
  const w = el("span", "wdots"); w.setAttribute("role", "group"); w.setAttribute("aria-label", "Greutate");
  [1, 2, 3].forEach((k) => { const b = el("button", (it.weight || 0) >= k ? "on" : "", "●"); b.type = "button"; b.title = "Greutate " + k; b.addEventListener("click", () => save({ weight: k }).then(() => renderSwot($("c-swot")))); w.appendChild(b); });
  ctl.appendChild(w);
  const mv = el("select", "mv"); mv.setAttribute("aria-label", "Mută în altă categorie");
  Q.forEach((q) => { const o = el("option", "", q[0]); o.value = q[0]; mv.appendChild(o); }); mv.value = it.quad;
  mv.addEventListener("change", () => save({ quad: mv.value }).then(() => renderSwot($("c-swot"))));
  ctl.appendChild(mv);
  const del = el("button", "mv edit-only", "×"); del.type = "button"; del.setAttribute("aria-label", "Șterge elementul");
  armButton(del, "×", "✓?", async () => { try { await db.doc("swot/" + it.id).delete(); appendLog("swot", "element șters"); } catch (e) { writeFailed(e); } });
  ctl.appendChild(del);
  d.appendChild(ctl);
  return d;
}

/* ─── Harta experienței ─── */
function renderJourney(c) {
  guardRender(c, "journey", () => {
    c.innerHTML = "";
    if (dbState !== "ready") { c.appendChild(el("p", "rendered empty", dbState === "loading" ? "Se încarcă…" : "Disponibil doar din Claude.")); return; }
    const sc = el("div", "jm-scroll"); const g = el("div", "jm");
    g.appendChild(el("div", "rh", ""));
    JOURNEY_STAGES.forEach((s) => { const h = el("div", "h", s.t); h.appendChild(el("small", "", s.d)); g.appendChild(h); });
    JOURNEY_ROWS.forEach((r) => {
      g.appendChild(el("div", "rh", r.t));
      JOURNEY_STAGES.forEach((s) => {
        const ta = el("textarea"); ta.id = "jm-" + s.k + "-" + r.k; ta.setAttribute("aria-label", r.t + " · " + s.t); ta.value = (journey[s.k] && journey[s.k][r.k]) || "";
        ta.addEventListener("change", async () => { const d = Object.assign({}, journey[s.k] || {}, { [r.k]: ta.value, updatedAt: Date.now(), updatedBy: uid || "" }); delete d.id; journey[s.k] = Object.assign({ id: s.k }, d); try { await db.doc("journey/" + s.k).set(d); toast("Salvat"); appendLogThrottled("journey:" + s.k, "journey", "harta"); } catch (e) { writeFailed(e); } });
        g.appendChild(ta);
      });
    });
    sc.appendChild(g); c.appendChild(sc);
    c.appendChild(el("p", "hint", "Se salvează la ieșirea din fiecare celulă. Pe telefon, derulează orizontal.")).style.marginTop = "8px";
  });
}

/* ─── Organigramă + RACI ─── */
function renderOrg(c) {
  guardRender(c, "org", () => {
    c.innerHTML = "";
    if (dbState !== "ready") { c.appendChild(el("p", "rendered empty", dbState === "loading" ? "Se încarcă…" : "Disponibil doar din Claude.")); return; }
    const h1 = el("h4", "", "Rolurile și liniile de raportare"); h1.style.cssText = "font-size:18px;font-style:italic;color:var(--accent);margin-bottom:8px"; c.appendChild(h1);
    const roles = sortedRows("roles");
    const inner = el("div"); c.appendChild(inner);
    if (!roles.length) inner.appendChild(el("div", "tool-empty", "Niciun rol încă.")); else inner.appendChild(rowsTable("roles", roles, "echipa-org"));
    const act = el("div", "tool-actions edit-only"); const add = el("button", "btn yellow", TOOLS.roles.add); add.type = "button";
    add.addEventListener("click", async () => { try { await db.collection("roles").add({ role: "", name: "", reports: "", count: null, order: Date.now(), createdBy: uid || "" }); appendLog("echipa-org", "rol nou"); } catch (e) { writeFailed(e); } });
    act.appendChild(add); c.appendChild(act);

    const h2 = el("h4", "", "RACI: cine face, cine răspunde, cine e consultat, cine e informat"); h2.style.cssText = "font-size:18px;font-style:italic;color:var(--accent);margin:22px 0 8px"; c.appendChild(h2);
    const tasks = Object.values(raci).sort((a, b) => (a.order || 0) - (b.order || 0));
    if (!roles.length) c.appendChild(el("p", "hint", "Adaugă întâi rolurile: ele devin coloanele matricei."));
    if (tasks.length && roles.length) {
      const wrap = el("div", "table-scroll"); const t = el("table", "t"); const thead = el("thead"); const trh = el("tr");
      trh.appendChild(el("th", "", "Sarcină")); roles.forEach((r) => trh.appendChild(el("th", "", r.role || "rol"))); trh.appendChild(el("th", "", "Verificare")); trh.appendChild(el("th", "", ""));
      thead.appendChild(trh); t.appendChild(thead); const tb = el("tbody");
      tasks.forEach((task) => {
        const tr = el("tr"); const td0 = el("td", "cell"); const i = el("input"); i.type = "text"; i.id = "raci-" + task.id; i.value = task.task || ""; i.setAttribute("aria-label", "Sarcină");
        const saveTask = async (patch) => { raci[task.id] = Object.assign({}, raci[task.id], patch); const d = Object.assign({}, raci[task.id]); delete d.id; try { await db.doc("raci/" + task.id).set(Object.assign(d, { updatedAt: Date.now(), updatedBy: uid || "" })); appendLogThrottled("raci:" + task.id, "echipa-org", "RACI"); } catch (e) { writeFailed(e); } };
        i.addEventListener("input", debounce(() => saveTask({ task: i.value }), 700)); td0.appendChild(i); tr.appendChild(td0);
        const a = task.a || {};
        roles.forEach((r) => { const td = el("td", "cell"); const s = el("select"); s.setAttribute("aria-label", (task.task || "sarcină") + " · " + (r.role || "rol")); ["", "R", "A", "C", "I"].forEach((v) => { const o = el("option", "", v || "—"); o.value = v; s.appendChild(o); }); s.value = a[r.id] || ""; s.addEventListener("change", () => { const na = Object.assign({}, raci[task.id].a || {}, { [r.id]: s.value }); if (!s.value) delete na[r.id]; saveTask({ a: na }).then(() => renderOrg(c)); }); td.appendChild(s); tr.appendChild(td); });
        const vals = roles.map((r) => a[r.id]).filter(Boolean); const nR = vals.filter((v) => v === "R").length, nA = vals.filter((v) => v === "A").length;
        const chk = el("td"); chk.appendChild(el("span", "pill " + (nR === 1 && nA === 1 ? "good" : "warn"), nR === 1 && nA === 1 ? "1 R · 1 A" : nR + " R · " + nA + " A")); tr.appendChild(chk);
        const del = el("td"); const b = el("button", "linkish danger edit-only", "Șterge"); b.type = "button"; armButton(b, "Șterge", "Sigur? Șterge", async () => { try { await db.doc("raci/" + task.id).delete(); appendLog("echipa-org", "sarcină ștearsă"); } catch (e) { writeFailed(e); } }); del.appendChild(b); tr.appendChild(del);
        tb.appendChild(tr);
      });
      t.appendChild(tb); wrap.appendChild(t); c.appendChild(wrap);
    } else if (roles.length) c.appendChild(el("div", "tool-empty", "Nicio sarcină încă."));
    const act2 = el("div", "tool-actions edit-only"); const add2 = el("button", "btn yellow", "Adaugă sarcină"); add2.type = "button";
    add2.addEventListener("click", async () => { try { await db.collection("raci").add({ task: "", a: {}, order: Date.now(), createdBy: uid || "" }); appendLog("echipa-org", "sarcină nouă"); } catch (e) { writeFailed(e); } });
    act2.appendChild(add2); c.appendChild(act2);
  });
}

/* ─── P&L proiectat ─── */
const PNL_FIELDS = [
  ["tx", "Tranzacții / zi", "bonuri", 1], ["ticket", "Bon mediu (lei, cu TVA)", "", 0.5], ["days", "Zile deschise / lună", "", 1],
  ["cogsPct", "COGS food (% din venit)", "materie primă", 0.5], ["packPct", "Ambalaje & consumabile (%)", "", 0.5],
  ["delivShare", "Pondere livrare în venit (%)", "cât din vânzări vine prin aplicații", 1], ["delivComm", "Comision platforme (%)", "din valoarea comenzilor livrate", 0.5],
  ["mktPct", "Marketing (%)", "", 0.5], ["adminPct", "Administrativ, mentenanță, asigurări (%)", "", 0.5],
  ["staff", "Personal (lei / lună)", "cost total angajator", 500], ["rent", "Chirie + întreținere (lei / lună)", "an 1: ~2.700 EUR + TVA, de confirmat de Heat", 500], ["util", "Utilități (lei / lună)", "", 500],
  ["lease", "Rate leasing echipamente (lei / lună)", "ex. 1.500 EUR ≈ 7.500 lei", 100], ["depInt", "Amortizare + dobândă (lei / lună)", "restul investiției", 500], ["taxPct", "Impozit pe profit (%)", "", 1], ["ramp", "Anul 1 față de maturitate (%)", "notorietate în construcție", 5]
];
const PNL_PRESETS = { pesimist: { tx: 120, staff: 60000, rent: 12000, util: 7000 }, realist: { tx: 200, staff: 66000, rent: 12000, util: 8000 }, optimist: { tx: 300, staff: 75000, rent: 12000, util: 10000 } };
function pnlCompute(p) {
  const g = (k) => num(p[k]) || 0;
  const rev = g("tx") * g("ticket") * g("days");
  const cogs = rev * g("cogsPct") / 100, pack = rev * g("packPct") / 100;
  const gp = rev - cogs - pack;
  const labor = g("staff"), rent = g("rent"), util = g("util"), lease = g("lease");
  const delivPct = (num(p.delivShare) !== null || num(p.delivComm) !== null) ? g("delivShare") * g("delivComm") / 100 : g("deliveryPct");
  const delivery = rev * delivPct / 100, mkt = rev * g("mktPct") / 100, admin = rev * g("adminPct") / 100;
  const opex = labor + rent + util + lease + delivery + mkt + admin;
  const ebitda = gp - opex;
  const depInt = g("depInt"); const ebt = ebitda - depInt;
  const tax = Math.max(0, ebt) * g("taxPct") / 100; const net = ebt - tax;
  const varPct = (g("cogsPct") + g("packPct") + delivPct + g("mktPct") + g("adminPct")) / 100;
  const fixed = labor + rent + util + lease + depInt;
  const beRev = varPct < 1 ? fixed / (1 - varPct) : NaN;
  const beTx = g("ticket") > 0 && g("days") > 0 ? beRev / (g("ticket") * g("days")) : NaN;
  return { rev, cogs, pack, gp, labor, rent, util, lease, delivery, delivPct, mkt, admin, opex, ebitda, depInt, ebt, tax, net, varPct, fixed, beRev, beTx };
}
function renderPnl(c) {
  guardRender(c, "pnl", () => {
    c.innerHTML = "";
    if (dbState !== "ready") { c.appendChild(el("p", "rendered empty", dbState === "loading" ? "Se încarcă…" : "Disponibil doar din Claude.")); return; }
    const p = settings.pnl || {};
    const grid = el("div", "pnl-grid");
    const left = el("div", "pnl-in"); left.appendChild(el("h4", "", "Ipoteze"));
    const presets = el("div", "tool-actions"); presets.style.marginTop = "0"; presets.style.marginBottom = "10px";
    presets.appendChild(el("span", "hint", "Scenarii de volum (120 / 200 / 300 bonuri pe zi):"));
    Object.keys(PNL_PRESETS).forEach((k) => { const b = el("button", "btn ghost", k); b.type = "button"; b.style.fontSize = "14px"; b.style.padding = "4px 12px"; b.addEventListener("click", () => savePnl(PNL_PRESETS[k])); presets.appendChild(b); });
    left.appendChild(presets);
    const g = el("div", "fgrid");
    PNL_FIELDS.forEach((f) => { const fd = el("div", "field"); const lab = el("label", "", f[1]); lab.htmlFor = "pnl-" + f[0]; if (f[2]) lab.appendChild(el("span", "sub", " " + f[2])); fd.appendChild(lab); const i = el("input"); i.type = "number"; i.id = "pnl-" + f[0]; i.step = f[3]; i.min = 0; i.inputMode = "decimal"; i.value = p[f[0]] === undefined || p[f[0]] === null ? "" : p[f[0]]; i.addEventListener("change", () => savePnl({ [f[0]]: num(i.value) })); fd.appendChild(i); g.appendChild(fd); });
    left.appendChild(g); grid.appendChild(left);

    const right = el("div", "pnl-out"); right.appendChild(el("h4", "", "P&L lunar proiectat"));
    const r = pnlCompute(p);
    const pct = (v) => r.rev > 0 ? fmtPct(v / r.rev * 100) : "—";
    const lines = [["Venit (tranzacții × bon × zile)", r.rev, "100 %", true], ["COGS food", -r.cogs, pct(r.cogs)], ["Ambalaje & consumabile", -r.pack, pct(r.pack)], ["Profit brut", r.gp, pct(r.gp), true],
      ["Personal", -r.labor, pct(r.labor)], ["Chirie + întreținere", -r.rent, pct(r.rent)], ["Utilități", -r.util, pct(r.util)], ["Rate leasing echipamente", -r.lease, pct(r.lease)], ["Comisioane livrare (" + fmtPct(r.delivPct) + " din venit)", -r.delivery, pct(r.delivery)], ["Marketing", -r.mkt, pct(r.mkt)], ["Administrativ & diverse", -r.admin, pct(r.admin)],
      ["Profit operațional (EBITDA)", r.ebitda, pct(r.ebitda), true], ["Amortizare + dobândă", -r.depInt, pct(r.depInt)], ["Impozit pe profit", -r.tax, pct(r.tax)], ["Profit net", r.net, pct(r.net), true]];
    const wrap = el("div", "table-scroll"); const t = el("table", "t"); t.style.minWidth = "0";
    const tb = el("tbody");
    lines.forEach((l) => { const tr = el("tr"); const td1 = el("td", "", l[0]); const td2 = el("td", "n", fmtLei(l[1])); const td3 = el("td", "n", l[2]); if (l[3]) { tr.style.fontWeight = "700"; td1.style.fontFamily = "var(--font-display)"; td1.style.fontSize = "15px"; td1.style.textTransform = "uppercase"; } if (l[1] < 0 && l[3]) td2.style.color = "var(--bad)"; tr.appendChild(td1); tr.appendChild(td2); tr.appendChild(td3); tb.appendChild(tr); });
    t.appendChild(tb); wrap.appendChild(t); right.appendChild(wrap);

    const sb = el("div"); sb.appendChild(el("div", "stack-lab")).innerHTML = "<span>Heat (din ipoteze)</span><span>% din venit</span>";
    const shares = r.rev > 0 ? [(r.cogs + r.pack) / r.rev, r.labor / r.rev, (r.rent + r.util + r.lease + r.delivery + r.mkt + r.admin + r.depInt + r.tax) / r.rev, Math.max(0, r.net) / r.rev] : [0, 0, 0, 0];
    const stack = el("div", "stack"); const cols = ["var(--data-2)", "var(--data-1)", "var(--data-3)", "var(--data-4)"]; const names = ["COGS", "Muncă", "Cheltuieli", "Profit net"];
    shares.forEach((s, i) => { const b = el("i"); b.style.width = (Math.max(0, Math.min(1, s)) * 100) + "%"; b.style.background = cols[i]; b.title = names[i] + " " + fmtPct(s * 100); stack.appendChild(b); });
    sb.appendChild(stack);
    sb.appendChild(el("div", "stack-lab")).innerHTML = "<span>Reperul 30 / 30 / 30 / 10</span><span></span>";
    const ref = el("div", "stack"); [30, 30, 30, 10].forEach((s, i) => { const b = el("i"); b.style.width = s + "%"; b.style.background = cols[i]; b.style.opacity = "0.55"; ref.appendChild(b); }); sb.appendChild(ref);
    const leg = el("div", "legend"); names.forEach((n, i) => { const s = el("span"); const ic = el("i"); ic.style.background = cols[i]; s.appendChild(ic); s.appendChild(document.createTextNode(n + " " + (r.rev > 0 ? fmtPct(shares[i] * 100) : "—"))); leg.appendChild(s); }); sb.appendChild(leg);
    right.appendChild(sb);

    const k = el("div", "kpis");
    const kpi = (l, v, small, hot) => { const d = el("div", "kpi" + (hot ? " hot" : "")); d.appendChild(el("div", "l", l)); const vv = el("div", "v", v); if (small) { vv.appendChild(document.createTextNode(" ")); vv.appendChild(el("small", "", small)); } d.appendChild(vv); return d; };
    k.appendChild(kpi("Prag de rentabilitate", isFinite(r.beTx) ? fmtNum(r.beTx, 0) : "—", "tranzacții / zi", true));
    k.appendChild(kpi("Venit lunar la prag", isFinite(r.beRev) ? fmtLei(r.beRev) : "—"));
    k.appendChild(kpi("Marjă EBITDA", r.rev > 0 ? fmtPct(r.ebitda / r.rev * 100) : "—"));
    k.appendChild(kpi("Marjă netă", r.rev > 0 ? fmtPct(r.net / r.rev * 100) : "—"));
    k.appendChild(kpi("Profit net anual", fmtLei(r.net * 12), "≈ " + fmtEur(r.net * 12 / 5)));
    const ramp = num(p.ramp); if (ramp) { const r1 = pnlCompute(Object.assign({}, p, { tx: (num(p.tx) || 0) * ramp / 100 })); k.appendChild(kpi("Anul 1 (" + fmtNum(ramp, 0) + " %)", fmtLei(r1.net * 12), "profit net anual")); }
    right.appendChild(k);
    right.appendChild(el("p", "hint", "Pragul de rentabilitate = costuri fixe (personal, chirie, utilități, leasing, amortizare + dobândă) ÷ (1 − costuri variabile %). Variabile: COGS, ambalaje, comisioanele de livrare (pondere × comision), marketing, administrativ. Toate ipotezele se pot schimba oricând; cifrele de aici urmează ce e scris în ele, nu studiul.")).style.marginTop = "10px";
    const m = el("div", "meta"); if (p.updatedAt) { m.appendChild(el("span", "", "Ipoteze modificate de ")); m.appendChild(uidSpan(p.updatedBy)); m.appendChild(el("span", "", " · " + fmtWhen(p.updatedAt))); } right.appendChild(m);
    grid.appendChild(right); c.appendChild(grid);
    resolveNames();
  });
}
async function savePnl(patch) {
  const d = Object.assign({}, settings.pnl || {}, patch, { updatedAt: Date.now(), updatedBy: uid || "" });
  settings.pnl = d;
  try { await db.doc("settings/pnl").set(d); toast("Salvat"); appendLogThrottled("pnl", "pnl", "ipoteze"); renderPnl($("c-pnl")); } catch (e) { writeFailed(e); }
}

/* ═══════════════════ Progres, cititor, navigare ═══════════════════ */
function updateProgress() {
  const ids = ALL_BLOCKS.filter((b) => b.kind !== "private").map((b) => b.id);
  let gata = 0, schita = 0; ids.forEach((id) => { const s = blocks[id] && blocks[id].status; if (s === "gata") gata++; else if (s === "schita") schita++; });
  $("prog-lab").textContent = gata + " / " + ids.length + " gata";
  $("prog-gata").style.width = (gata / ids.length * 100) + "%"; $("prog-schita").style.width = (schita / ids.length * 100) + "%";
  $("progress").setAttribute("aria-label", gata + " din " + ids.length + " blocuri gata, " + schita + " în schiță");
  SECTIONS.forEach((sec) => { const n = $("nav-" + sec.id); if (!n || !sec.blocks) return; const g = sec.blocks.filter((b) => b.kind !== "private" && blocks[b.id] && blocks[b.id].status === "gata").length; n.textContent = g + " / " + sec.blocks.filter((b) => b.kind !== "private").length + " gata"; });
  const mini = $("mini"); const m = settings.meta || {};
  mini.innerHTML = "<b>" + esc(m.stage || "Stadiu necompletat") + "</b><br>" + (m.opening ? "Deschidere: " + esc(fmtMonth(m.opening)) : "Deschidere: —") + "<br>" + gata + " gata · " + schita + " schițe · " + (ids.length - gata - schita) + " goale";
  renderDeck();
}
function fmtMonth(ym) { if (!ym) return ""; const d = new Date(ym + "-15T12:00:00"); return isNaN(d) ? ym : d.toLocaleDateString("ro-RO", { month: "long", year: "numeric" }); }
function applyReader() {
  const r = $("reader").value;
  try { localStorage.setItem("heat-plan-reader", r); } catch (e) { /* fără memorie */ }
  SECTIONS.forEach((sec) => {
    if (!sec.blocks) return; let hidden = [];
    sec.blocks.forEach((b) => { const show = b.aud.includes(r); const n = $("b-" + b.id); n.hidden = !show; if (!show) hidden.push(b.title); });
    const all = hidden.length === sec.blocks.length;
    $("s-" + sec.id).hidden = all;
    document.querySelectorAll('#sidenav a[href="#s-' + sec.id + '"], #chips a[href="#s-' + sec.id + '"]').forEach((a) => a.classList.toggle("off", all));
    const note = $("rn-" + sec.id);
    if (hidden.length && !all) { note.hidden = false; note.textContent = "Versiunea „" + READERS[r].name + "”: " + hidden.length + (hidden.length === 1 ? " bloc ascuns" : " blocuri ascunse") + " (" + hidden.join(", ") + ")."; } else note.hidden = true;
  });
}
function setupNav() {
  const links = Array.from(document.querySelectorAll("#sidenav a, #chips a"));
  const secs = SECTIONS.map((s) => $("s-" + s.id));
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { const id = e.target.id; links.forEach((a) => a.classList.toggle("on", a.getAttribute("href") === "#" + id)); const chip = document.querySelector('#chips a[href="#' + id + '"]'); if (chip) chip.scrollIntoView({ block: "nearest", inline: "center" }); } });
  }, { rootMargin: "-30% 0px -60% 0px", threshold: 0 });
  secs.forEach((s) => io.observe(s));
  const setHdr = () => document.documentElement.style.setProperty("--hdr", (getComputedStyle($("hdr")).position === "sticky" ? $("hdr").offsetHeight : 0) + "px");
  setHdr(); window.addEventListener("resize", setHdr);
}

/* ═══════════════════ Pornire ═══════════════════ */
function renderAll() {
  ALL_BLOCKS.forEach((b) => renderBlockContent(b.id));
  renderPyramid(); renderMeta(); renderNext(); renderLog(); updateProgress(); resolveNames();
}
async function connect() {
  const claude = window.claude;
  if (!claude || typeof claude.use !== "function") { dbState = "none"; renderAll(); const b = $("db-banner"); b.hidden = false; b.className = "banner warn"; b.textContent = "Deschide pagina din Claude ca să vezi și să completezi planul."; return; }
  const [dbNs, userNs] = await Promise.all([claude.use("db"), claude.use("user")]);
  user = userNs;
  if (!dbNs) { dbState = "none"; renderAll(); const b = $("db-banner"); b.hidden = false; b.className = "banner warn"; b.textContent = "Conținutul planului nu e disponibil în această vizualizare (fără acces la datele paginii)."; return; }
  db = dbNs; dbState = "ready";
  if (user) { uid = await user.id(); canWrite = await user.can("data.write"); if (canWrite === false) setReadOnly("Vezi planul, dar nu îl poți modifica: cere drepturi de contribuitor."); }
  const onErr = (e) => { console.error(e); if (e && e.code === "revoked") { dbState = "none"; renderAll(); } };
  db.collection("plan").onSnapshot((snap) => { Object.keys(blocks).forEach((k) => delete blocks[k]); snap.docs.forEach((d) => { blocks[d.id] = d.data(); }); ALL_BLOCKS.forEach((b) => { if (!["rows", "swot", "journey", "org", "pnl", "market"].includes(b.kind)) renderBlockContent(b.id); else { const sel = $("s-" + b.id); const st = (blocks[b.id] && blocks[b.id].status) || "gol"; if (sel) { sel.value = st; sel.className = "s-" + st; } } }); updateProgress(); }, onErr);
  db.collection("settings").onSnapshot((snap) => { Object.keys(settings).forEach((k) => delete settings[k]); snap.docs.forEach((d) => { settings[d.id] = d.data(); }); renderPyramid(); renderMeta(); renderLog(); renderMarket($("c-tam-sam-som")); renderPnl($("c-pnl")); renderRows("products", $("c-meniu"), "meniu"); const c = $("c-concurenta"); const old = c && c.querySelector(".pos-wrap"); if (old) old.replaceWith(positioningMatrix(sortedRows("competitors"))); updateProgress(); }, onErr);
  Object.keys(TOOLS).forEach((tool) => {
    rows[tool] = {};
    db.collection(TOOLS[tool].coll).onSnapshot((snap) => { rows[tool] = {}; snap.docs.forEach((d) => { rows[tool][d.id] = Object.assign({ id: d.id }, d.data()); }); if (tool === "roles") renderOrg($("c-echipa-org")); else renderRows(tool, $("c-" + blockOfTool(tool)), blockOfTool(tool)); if (tool === "milestones") renderNext(); }, onErr);
  });
  db.collection("swot").onSnapshot((snap) => { Object.keys(swotItems).forEach((k) => delete swotItems[k]); snap.docs.forEach((d) => { swotItems[d.id] = Object.assign({ id: d.id }, d.data()); }); renderSwot($("c-swot")); }, onErr);
  db.collection("journey").onSnapshot((snap) => { Object.keys(journey).forEach((k) => delete journey[k]); snap.docs.forEach((d) => { journey[d.id] = Object.assign({ id: d.id }, d.data()); }); renderJourney($("c-journey")); }, onErr);
  db.collection("raci").onSnapshot((snap) => { Object.keys(raci).forEach((k) => delete raci[k]); snap.docs.forEach((d) => { raci[d.id] = Object.assign({ id: d.id }, d.data()); }); renderOrg($("c-echipa-org")); }, onErr);
  if (uid) db.doc("data/users/" + uid + "/private").onSnapshot((snap) => { privateDoc = snap.exists ? snap.data() : {}; renderPrivate("de-ce", $("c-de-ce")); }, () => { privateDoc = {}; renderPrivate("de-ce", $("c-de-ce")); });
  else renderPrivate("de-ce", $("c-de-ce"));
  renderAll();
}
function start(hot) {
  renderStatic(); renderGlossary(""); renderDeck();
  if (hot && hot.drafts) Object.assign(drafts, hot.drafts);
  let saved = ""; try { saved = localStorage.getItem("heat-plan-reader") || ""; } catch (e) { /* */ }
  if (hot && hot.reader) saved = hot.reader;
  if (saved && READERS[saved]) $("reader").value = saved;
  $("reader").addEventListener("change", applyReader); applyReader();
  ["m-stage", "m-city", "m-opening", "m-company"].forEach((id) => { $(id).addEventListener("change", saveMeta); $(id).addEventListener("input", saveMeta); });
  $("gl-q").addEventListener("input", () => renderGlossary($("gl-q").value));
  setupNav(); renderAll();
  if (window.claude && window.claude.hot && typeof window.claude.hot.snapshot === "function") window.claude.hot.snapshot(() => ({ drafts, reader: $("reader").value }));
  connect();
}
const hotApi = window.claude && window.claude.hot;
if (hotApi && typeof hotApi.ready === "function") hotApi.ready(start); else start((hotApi && hotApi.data) || {});
})();
</script>
