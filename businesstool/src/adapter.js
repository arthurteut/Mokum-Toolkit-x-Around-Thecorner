/* Heat · plan de afaceri: adaptorul Supabase.
   Pagina (part3.js) vorbește cu o bază de date prin interfața `window.claude.use("db" | "user")`
   (documente și colecții, cu onSnapshot). Aici aceeași interfață e implementată peste Supabase:
   un singur tabel `plan_docs` (coll, id, data jsonb), login prin link pe email (Supabase Auth),
   acces doar pentru emailurile din `plan_members`, actualizări live prin Realtime.
   Tot aici: vizitele fiecăruia (`plan_visits`: cât stă pe pagină, ce blocuri citește, câte modificări
   salvează) și panoul „Activitate”, vizibil doar administratorului. */
(function () {
  "use strict";
  var cfg = window.HEAT_SUPABASE;
  if (!cfg || !cfg.url || !cfg.anonKey || !window.supabase) { window.claude = undefined; return; }
  var sb = window.supabase.createClient(cfg.url, cfg.anonKey);
  var TABLE = "plan_docs";
  var cache = {}, colFns = {}, docFns = {}, channel = null, allLoaded = null;
  var me = null, member = null, isAdmin = false, members = [];
  var readyResolve, ready = new Promise(function (r) { readyResolve = r; });

  function $(id) { return document.getElementById(id); }
  function clone(v) { return v === undefined ? undefined : JSON.parse(JSON.stringify(v)); }
  function fail(error) {
    var e = new Error((error && error.message) || "eroare");
    e.code = error && error.code === "42501" ? "invalid_argument" : ((error && error.code) || "unknown");
    e.details = error; throw e;
  }
  function parsePath(path) {
    var p = String(path).split("/");
    if (p[0] === "data" && p[1] === "users") return { coll: "private", id: p[2] };
    return { coll: p[0], id: p[1] };
  }
  function map(coll) { return cache[coll] || (cache[coll] = new Map()); }
  function snapDoc(coll, id) {
    var m = map(coll), has = m.has(id);
    return { id: id, exists: has, data: function () { return has ? clone(m.get(id)) : undefined; }, metadata: { fromCache: false, hasPendingWrites: false } };
  }
  function colSnap(coll) {
    var m = map(coll); var ids = Array.from(m.keys()).sort();
    return { docs: ids.map(function (id) { return snapDoc(coll, id); }), size: ids.length, empty: !ids.length, docChanges: function () { return []; }, metadata: { fromCache: false, hasPendingWrites: false } };
  }
  function notifyCol(coll) { (colFns[coll] || []).slice().forEach(function (fn) { try { fn(colSnap(coll)); } catch (e) { console.error(e); } }); }
  function notifyDoc(coll, id) { (docFns[coll + "/" + id] || []).slice().forEach(function (fn) { try { fn(snapDoc(coll, id)); } catch (e) { console.error(e); } }); }

  /* Toate documentele vin într-o singură cerere (regulile de acces filtrează rândurile private ale altora). */
  function loadAll() {
    if (!allLoaded) {
      allLoaded = sb.from(TABLE).select("coll,id,data").limit(5000).then(function (res) {
        if (res.error) { allLoaded = null; fail(res.error); }
        Object.keys(cache).forEach(function (c) { cache[c].clear(); });
        (res.data || []).forEach(function (r) { map(r.coll).set(r.id, r.data || {}); });
        ensureChannel();
      });
    }
    return allLoaded;
  }
  function reloadAll() {
    allLoaded = null;
    loadAll().then(function () {
      Object.keys(colFns).forEach(notifyCol);
      Object.keys(docFns).forEach(function (k) { var p = k.split("/"); notifyDoc(p[0], p[1]); });
    }).catch(function (e) { console.error(e); });
  }
  function ensureChannel() {
    if (channel) return;
    channel = sb.channel("plan-docs")
      .on("postgres_changes", { event: "*", schema: "public", table: TABLE }, function (payload) {
        var row = payload.eventType === "DELETE" ? payload.old : payload.new;
        if (!row || !row.coll || !row.id) return;
        var m = map(row.coll);
        if (payload.eventType === "DELETE") m.delete(row.id); else m.set(row.id, (payload.new && payload.new.data) || {});
        notifyCol(row.coll); notifyDoc(row.coll, row.id);
      })
      .subscribe();
    document.addEventListener("visibilitychange", function () { if (document.visibilityState === "visible") reloadAll(); });
  }
  function stamp() { return { updated_at: new Date().toISOString(), updated_by: me ? me.id : "" }; }
  function newId() {
    if (window.crypto && typeof crypto.randomUUID === "function") return crypto.randomUUID();
    return "m" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  }
  function docRef(coll, id) {
    var ref = {
      id: id, path: coll + "/" + id,
      get: function () { return loadAll().then(function () { return snapDoc(coll, id); }); },
      set: function (data) {
        var row = Object.assign({ coll: coll, id: id, data: data }, stamp());
        return sb.from(TABLE).upsert(row).then(function (res) { if (res.error) fail(res.error); map(coll).set(id, clone(data)); noteEdit(coll, id); notifyCol(coll); notifyDoc(coll, id); });
      },
      update: function (patch) { var cur = map(coll).get(id) || {}; return ref.set(Object.assign({}, cur, patch)); },
      delete: function () {
        return sb.from(TABLE).delete().match({ coll: coll, id: id }).then(function (res) { if (res.error) fail(res.error); map(coll).delete(id); noteEdit(coll, id); notifyCol(coll); notifyDoc(coll, id); });
      },
      onSnapshot: function (next, onErr) {
        var k = coll + "/" + id; (docFns[k] = docFns[k] || []).push(next);
        loadAll().then(function () { next(snapDoc(coll, id)); }).catch(function (e) { if (onErr) onErr(e); });
        return function () { docFns[k] = (docFns[k] || []).filter(function (f) { return f !== next; }); };
      },
      collection: function (name) { return colRef(coll + "/" + id + "/" + name); }
    };
    return ref;
  }
  function colRef(coll) {
    var ref = {
      path: coll,
      doc: function (id) { return docRef(coll, id || newId()); },
      add: function (data) { var d = docRef(coll, newId()); return d.set(data).then(function () { return d; }); },
      get: function () { return loadAll().then(function () { return colSnap(coll); }); },
      onSnapshot: function (next, onErr) {
        (colFns[coll] = colFns[coll] || []).push(next);
        loadAll().then(function () { next(colSnap(coll)); }).catch(function (e) { if (onErr) onErr(e); });
        return function () { colFns[coll] = (colFns[coll] || []).filter(function (f) { return f !== next; }); };
      },
      where: function () { return ref; }, orderBy: function () { return ref; }, limit: function () { return ref; }
    };
    return ref;
  }
  var db = {
    doc: function (path) { var p = parsePath(path); return docRef(p.coll, p.id); },
    collection: function (path) { return colRef(String(path)); }
  };
  var UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  var user = {
    id: function () { return Promise.resolve(me ? me.id : null); },
    me: function () { return Promise.resolve(me ? { id: me.id, name: member ? member.name : "", email: me.email, isOwner: isAdmin, canEdit: !!member } : null); },
    can: function () { return Promise.resolve(!!member); },
    isOwner: function () { return Promise.resolve(isAdmin); },
    canEdit: function () { return Promise.resolve(!!member); },
    name: function () { return Promise.resolve(member ? member.name : ""); },
    profiles: function (ids) {
      ids = Array.isArray(ids) ? ids : [ids];
      var out = {};
      ids.forEach(function (i) { out[i] = { id: i, name: UUID.test(i) ? "" : (i.charAt(0).toUpperCase() + i.slice(1)), isMe: !!me && i === me.id }; });
      var real = ids.filter(function (i) { return UUID.test(i); });
      if (!real.length) return Promise.resolve(out);
      return sb.from("plan_users").select("id,name,email").in("id", real).then(function (res) {
        (res.data || []).forEach(function (r) { out[r.id] = { id: r.id, name: r.name || r.email || "", isMe: !!me && r.id === me.id }; });
        return out;
      });
    }
  };
  window.claude = { use: function (ns) { return ready.then(function () { return ns === "db" ? db : ns === "user" ? user : null; }); } };

  /* ── Login și echipa ── */
  var ui = { box: $("login"), form: $("login-form"), email: $("login-email"), fb: $("login-fb"), msg: $("login-msg"), out: $("login-logout"), hdrOut: $("logout"), who: $("who"), team: $("team-btn"), act: $("act-btn") };
  function show(state, text) { ui.box.hidden = false; ui.form.hidden = state !== "form"; ui.msg.textContent = text || ""; ui.out.hidden = state === "form"; }
  function feedback(t, ok) { ui.fb.textContent = t || ""; ui.fb.className = "login-fb" + (t ? (ok ? " ok" : " err") : ""); }
  ui.form.addEventListener("submit", function (e) {
    e.preventDefault();
    var email = ui.email.value.trim().toLowerCase(); if (!email) return;
    feedback("Se trimite…", true);
    sb.auth.signInWithOtp({ email: email, options: { emailRedirectTo: location.origin + location.pathname.replace(/\/$/, "") } })
      .then(function (res) { if (res.error) throw res.error; feedback("Ți-am trimis linkul de intrare pe " + email + ". Deschide-l de pe acest dispozitiv.", true); })
      .catch(function (err) { feedback("Nu am putut trimite linkul: " + ((err && err.message) || "eroare"), false); });
  });
  function logout() { sb.auth.signOut().then(function () { location.reload(); }); }
  ui.out.addEventListener("click", logout); ui.hdrOut.addEventListener("click", logout);

  function renderTeam() {
    var list = $("team-list"); list.innerHTML = "";
    members.forEach(function (m) {
      var li = document.createElement("li");
      var s = document.createElement("span"); s.textContent = m.name + " · " + m.email + " · " + m.role + (m.is_admin ? " · admin" : ""); li.appendChild(s);
      if (member && m.email !== member.email) {
        var b = document.createElement("button"); b.type = "button"; b.className = "linkish danger"; b.textContent = "Scoate";
        b.addEventListener("click", function () {
          if (b.dataset.armed) { sb.from("plan_members").delete().eq("email", m.email).then(function (res) { $("team-fb").textContent = res.error ? "Nu am putut scoate: " + res.error.message : m.email + " nu mai are acces."; refreshTeam(); }); return; }
          b.dataset.armed = "1"; b.textContent = "Sigur? Scoate"; setTimeout(function () { delete b.dataset.armed; b.textContent = "Scoate"; }, 4000);
        });
        li.appendChild(b);
      }
      list.appendChild(li);
    });
  }
  function refreshTeam() { return sb.from("plan_members").select("*").order("name").then(function (res) { members = res.data || []; renderTeam(); }); }
  ui.team.addEventListener("click", function () { refreshTeam().then(function () { $("team-dlg").showModal(); }); });
  $("team-close").addEventListener("click", function () { $("team-dlg").close(); });
  $("team-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var row = { email: $("tm-email").value.trim().toLowerCase(), name: $("tm-name").value.trim(), role: $("tm-role").value.trim() || "Echipa Heat", is_admin: $("tm-admin").checked };
    if (!row.email || !row.name) return;
    sb.from("plan_members").upsert(row).then(function (res) {
      if (res.error) { $("team-fb").textContent = "Nu am putut adăuga: " + res.error.message; return; }
      $("team-fb").textContent = row.name + " poate intra acum cu " + row.email + ".";
      $("tm-email").value = ""; $("tm-name").value = ""; $("tm-admin").checked = false;
      refreshTeam();
    });
  });

  /* ── Activitate: cât stă fiecare pe pagină, ce citește, cât modifică ──
     O vizită = o deschidere a paginii. La fiecare 30 s, cât pagina e în față și folosită (nu un tab uitat în fundal),
     se adună timpul și se salvează rândul vizitei în `plan_visits`. Un bloc e „văzut” dacă a stat pe ecran
     cel puțin 1,5 s (măcar 40 % din el sau 40 % din ecran). Modificările = scrierile în plan (fără jurnal și fără spațiul privat). */
  var HB_MS = window.__HB_MS || 30000, IDLE_MS = 2 * 60000, DWELL_MS = 1500;
  var visit = null, token = "";
  function deviceKind() { try { return ((navigator.userAgentData && navigator.userAgentData.mobile) || window.matchMedia("(pointer: coarse)").matches) ? "telefon" : "desktop"; } catch (e) { return ""; } }
  function noteEdit(coll, id) { if (visit && coll !== "private" && !(coll === "settings" && id === "log")) { visit.edits++; visit.dirty = true; } }
  function visitRow() {
    return { id: visit.id, user_id: me.id, email: String(me.email || "").toLowerCase(), started_at: visit.started, last_seen_at: new Date().toISOString(),
      seconds: Math.round(visit.seconds), device: deviceKind(), blocks: Object.keys(visit.blocks), edits: visit.edits };
  }
  function flushVisit(final) {
    if (!visit || !me) return;
    visit.dirty = false;
    var r = visitRow();
    if (final) {
      /* la ascunderea/închiderea paginii: o cerere care supraviețuiește navigării (keepalive) */
      if (!token || typeof fetch !== "function") return;
      try {
        fetch(cfg.url + "/rest/v1/plan_visits?on_conflict=id", { method: "POST", keepalive: true, body: JSON.stringify(r),
          headers: { apikey: cfg.anonKey, Authorization: "Bearer " + token, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" } }).catch(function () {});
      } catch (e) { /* secundar */ }
      return;
    }
    sb.from("plan_visits").upsert(r).then(function (res) { if (res.error) console.warn("activitate: " + res.error.message); });
  }
  function tickVisit(final) {
    if (!visit) return;
    var now = Date.now();
    if ((final === true || document.visibilityState === "visible") && now - visit.lastActive < IDLE_MS) { visit.seconds += Math.min(HB_MS, now - visit.lastTick) / 1000; visit.dirty = true; }
    visit.lastTick = now;
    if (visit.dirty) flushVisit(final === true);
  }
  function watchBlocks() {
    if (!("IntersectionObserver" in window)) return;
    var timers = {};
    var io = new IntersectionObserver(function (entries) {
      var vh = window.innerHeight || 800;
      entries.forEach(function (e) {
        var id = e.target.dataset.id; if (!id || visit.blocks[id]) return;
        var on = e.isIntersecting && (e.intersectionRatio >= 0.4 || e.intersectionRect.height >= vh * 0.4);
        if (on && !timers[id]) timers[id] = setTimeout(function () { delete timers[id]; visit.blocks[id] = 1; visit.dirty = true; io.unobserve(e.target); }, DWELL_MS);
        else if (!on && timers[id]) { clearTimeout(timers[id]); delete timers[id]; }
      });
    }, { threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1] });
    var observe = function () { var nodes = document.querySelectorAll(".block[data-id]"); if (!nodes.length) return false; nodes.forEach(function (n) { io.observe(n); }); return true; };
    if (!observe()) setTimeout(observe, 1500);
  }
  function startVisit() {
    if (visit || !me) return;
    visit = { id: newId(), started: new Date().toISOString(), seconds: 0, blocks: {}, edits: 0, dirty: true, lastActive: Date.now(), lastTick: Date.now() };
    var active = function () { visit.lastActive = Date.now(); };
    ["pointerdown", "keydown", "touchstart", "wheel", "scroll"].forEach(function (ev) { document.addEventListener(ev, active, { passive: true, capture: true }); });
    var mm = 0; document.addEventListener("pointermove", function () { var t = Date.now(); if (t - mm > 5000) { mm = t; active(); } }, { passive: true });
    document.addEventListener("visibilitychange", function () { if (document.visibilityState === "hidden") tickVisit(true); else { visit.lastTick = Date.now(); active(); } });
    window.addEventListener("pagehide", function () { tickVisit(true); });
    setInterval(tickVisit, HB_MS);
    watchBlocks();
    flushVisit(false);
  }

  /* ── Panoul „Activitate” (doar administrator) ── */
  function dur(s) { s = Math.round(s || 0); if (s < 60) return s ? "sub 1 min" : "0 min"; var m = Math.round(s / 60); if (m < 60) return m + " min"; return Math.floor(m / 60) + " h" + (m % 60 ? " " + (m % 60) + " min" : ""); }
  function when(iso) {
    var d = new Date(iso); if (isNaN(d)) return "—";
    var mins = (Date.now() - d.getTime()) / 60000, hm = d.toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" });
    if (mins < 2) return "acum"; if (mins < 60) return "acum " + Math.round(mins) + " min";
    var today = new Date(), y = new Date(); y.setDate(y.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return "azi " + hm;
    if (d.toDateString() === y.toDateString()) return "ieri " + hm;
    return d.toLocaleDateString("ro-RO", { day: "numeric", month: "short" }) + " " + hm;
  }
  function dayKey(iso) { var d = new Date(iso); return isNaN(d) ? "" : d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); }
  function cell(tr, text, cls) { var td = document.createElement("td"); if (cls) td.className = cls; td.textContent = text; tr.appendChild(td); return td; }
  function plural(n, one, many) { return n + " " + (n === 1 ? one : many); }
  function renderActivity(visits) {
    var body = $("act-body"); body.innerHTML = "";
    var nBlocks = document.querySelectorAll(".block[data-id]").length, week = Date.now() - 7 * 86400000;
    var stats = {}, order = [];
    function statFor(k) { if (!stats[k]) { stats[k] = { last: 0, days: {}, sec7: 0, sec: 0, blocks: {}, edits7: 0, edits: 0, n: 0 }; order.push(k); } return stats[k]; }
    visits.forEach(function (v) {
      var a = statFor((v.email || "").toLowerCase() || v.user_id), t = new Date(v.last_seen_at).getTime() || 0;
      if (t > a.last) a.last = t;
      a.sec += v.seconds || 0; a.edits += v.edits || 0; a.n++;
      (v.blocks || []).forEach(function (b) { a.blocks[b] = 1; });
      if (t >= week) { a.sec7 += v.seconds || 0; a.edits7 += v.edits || 0; a.days[dayKey(v.started_at)] = 1; a.days[dayKey(v.last_seen_at)] = 1; }
    });
    var names = {}; members.forEach(function (m) { names[m.email] = m.name; statFor(m.email); });
    order.sort(function (x, y) { return stats[y].last - stats[x].last; });
    var tbl = document.createElement("table"); tbl.className = "t";
    tbl.innerHTML = "<thead><tr><th>Persoană</th><th>Ultima vizită</th><th class=\"n\">Zile active<small>ultimele 7 zile</small></th><th class=\"n\">Timp<small>ultimele 7 zile</small></th><th class=\"n\">Timp total</th><th class=\"n\">Blocuri văzute<small>din " + nBlocks + "</small></th><th class=\"n\">Modificări<small>7 zile / total</small></th></tr></thead>";
    var tb = document.createElement("tbody");
    order.forEach(function (k) {
      var a = stats[k], tr = document.createElement("tr");
      var who = cell(tr, names[k] || k); if (!names[k]) who.title = "nu mai e în echipă";
      if (a.last && Date.now() - a.last < 2 * 60000) { var on = document.createElement("span"); on.className = "pill good"; on.textContent = "acum pe pagină"; who.appendChild(document.createTextNode(" ")); who.appendChild(on); }
      if (!a.n) { var td = cell(tr, "nu a intrat încă", "muted"); td.colSpan = 6; tb.appendChild(tr); return; }
      cell(tr, when(new Date(a.last).toISOString()) + " · " + plural(a.n, "vizită", "vizite"));
      cell(tr, Object.keys(a.days).filter(Boolean).length + " / 7", "n");
      cell(tr, dur(a.sec7), "n"); cell(tr, dur(a.sec), "n");
      cell(tr, String(Object.keys(a.blocks).length), "n");
      cell(tr, a.edits7 + " / " + a.edits, "n");
      tb.appendChild(tr);
    });
    tbl.appendChild(tb);
    var sc = document.createElement("div"); sc.className = "table-scroll"; sc.appendChild(tbl); body.appendChild(sc);
    var h = document.createElement("h4"); h.textContent = "Ultimele vizite"; body.appendChild(h);
    var log = document.createElement("div"); log.className = "log";
    if (!visits.length) { var p = document.createElement("p"); p.className = "muted"; p.textContent = "Nicio vizită înregistrată încă."; log.appendChild(p); }
    visits.slice().sort(function (x, y) { return String(y.started_at).localeCompare(String(x.started_at)); }).slice(0, 40).forEach(function (v) {
      var d = document.createElement("div"); d.className = "log-item";
      var s1 = document.createElement("span"); s1.className = "d"; s1.textContent = when(v.started_at); d.appendChild(s1);
      var nb = (v.blocks || []).length;
      var s2 = document.createElement("span");
      s2.textContent = (names[(v.email || "").toLowerCase()] || v.email || "cineva") + " · " + dur(v.seconds) + (v.device ? " · " + v.device : "") + " · " + plural(nb, "bloc", "blocuri") + (v.edits ? " · " + plural(v.edits, "modificare", "modificări") : "");
      d.appendChild(s2); log.appendChild(d);
    });
    body.appendChild(log);
  }
  function openActivity() {
    $("act-fb").textContent = "Se încarcă…"; $("act-body").innerHTML = ""; $("act-dlg").showModal();
    Promise.all([refreshTeam(), sb.from("plan_visits").select("*").order("last_seen_at", { ascending: false }).limit(5000)]).then(function (r) {
      var res = r[1];
      if (res.error) { $("act-fb").textContent = "Nu am putut citi activitatea: " + res.error.message; return; }
      $("act-fb").textContent = ""; renderActivity(res.data || []);
    }).catch(function (e) { $("act-fb").textContent = "Nu am putut citi activitatea: " + ((e && e.message) || "eroare"); });
  }
  ui.act.addEventListener("click", openActivity);
  $("act-close").addEventListener("click", function () { $("act-dlg").close(); });

  var current;
  sb.auth.onAuthStateChange(function (event, session) {
    if (session && session.access_token) token = session.access_token;
    var uid = session && session.user ? session.user.id : null;
    if (uid === current) return; current = uid;
    if (!session || !session.user) { me = null; member = null; show("form"); return; }
    me = session.user;
    var email = String(me.email || "").toLowerCase();
    sb.from("plan_members").select("*").then(function (res) {
      var rows = res.data || [];
      var mine = rows.filter(function (m) { return m.email === email; })[0];
      if (res.error || !mine) { show("denied", "Emailul " + email + " nu e în echipa Heat. Cere-i administratorului să te adauge, apoi reîncarcă pagina."); return; }
      member = mine; isAdmin = !!mine.is_admin; members = rows;
      sb.from("plan_users").upsert({ id: me.id, email: email, name: mine.name, updated_at: new Date().toISOString() }).then(function (r) { if (r.error) console.warn(r.error); });
      ui.box.hidden = true; ui.hdrOut.hidden = false; ui.who.textContent = mine.name; ui.team.hidden = !isAdmin; ui.act.hidden = !isAdmin;
      readyResolve();
      startVisit();
    });
  });
})();
