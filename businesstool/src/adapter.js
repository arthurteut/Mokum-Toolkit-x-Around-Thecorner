/* Heat · plan de afaceri: adaptorul Supabase.
   Pagina (part3.js) vorbește cu o bază de date prin interfața `window.claude.use("db" | "user")`
   (documente și colecții, cu onSnapshot). Aici aceeași interfață e implementată peste Supabase:
   un singur tabel `plan_docs` (coll, id, data jsonb), login prin link pe email (Supabase Auth),
   acces doar pentru emailurile din `plan_members`, actualizări live prin Realtime. */
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
        return sb.from(TABLE).upsert(row).then(function (res) { if (res.error) fail(res.error); map(coll).set(id, clone(data)); notifyCol(coll); notifyDoc(coll, id); });
      },
      update: function (patch) { var cur = map(coll).get(id) || {}; return ref.set(Object.assign({}, cur, patch)); },
      delete: function () {
        return sb.from(TABLE).delete().match({ coll: coll, id: id }).then(function (res) { if (res.error) fail(res.error); map(coll).delete(id); notifyCol(coll); notifyDoc(coll, id); });
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
  var ui = { box: $("login"), form: $("login-form"), email: $("login-email"), fb: $("login-fb"), msg: $("login-msg"), out: $("login-logout"), hdrOut: $("logout"), who: $("who"), team: $("team-btn") };
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

  var current;
  sb.auth.onAuthStateChange(function (event, session) {
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
      ui.box.hidden = true; ui.hdrOut.hidden = false; ui.who.textContent = mine.name; ui.team.hidden = !isAdmin;
      readyResolve();
    });
  });
})();
