/* Client Supabase fals, doar pentru testul automat (test.js): implementează strict ce folosește adapter.js.
   Se injectează înaintea paginii; datele vin din window.__SEED (cale "coll/id" -> document). */
(function () {
  var rows = new Map();
  Object.keys(window.__SEED || {}).forEach(function (path) {
    var p = path.split("/"); var coll = p[0] === "data" ? "private" : p[0]; var id = p[0] === "data" ? p[2] : p[1];
    rows.set(coll + "/" + id, { coll: coll, id: id, data: window.__SEED[path] });
  });
  var members = [{ email: "arthur@test.ro", name: "Arthur", role: "ATC", is_admin: true }];
  var users = new Map();
  var visits = new Map();
  var pushSubs = new Map();
  var notices = [{ id: 1, kind: "daily", day: "2026-11-20", title: "Azi n-ai intrat pe plan", body: "", recipients: 3, sent: 3, created_by: "", created_at: "2026-11-20T17:00:00Z" }];
  var listeners = [], authCb = null;
  var session = window.__NO_SESSION ? null : { user: { id: "11111111-2222-4333-8444-555555555555", email: window.__EMAIL || "arthur@test.ro" } };
  var isMember = function () { return !!session && members.some(function (m) { return m.email === session.user.email; }); };
  function emit(type, row, old) { listeners.forEach(function (fn) { setTimeout(function () { fn({ eventType: type, new: row || {}, old: old || {}, table: "plan_docs", schema: "public" }); }, 0); }); }
  window.__fake = { rows: rows, emit: emit, members: members, users: users, visits: visits, pushSubs: pushSubs, invoked: [], writes: [] };
  function builder(table) {
    var st = { table: table, filters: [], op: "select", payload: null };
    var b = {
      select: function () { st.op = "select"; return b; },
      eq: function (k, v) { st.filters.push(function (r) { return r[k] === v; }); return b; },
      in: function (k, vs) { st.filters.push(function (r) { return vs.indexOf(r[k]) >= 0; }); return b; },
      match: function (o) { Object.keys(o).forEach(function (k) { st.filters.push(function (r) { return r[k] === o[k]; }); }); return b; },
      order: function () { return b; }, limit: function () { return b; },
      upsert: function (row) { st.op = "upsert"; st.payload = row; return b; },
      insert: function (row) { st.op = "insert"; st.payload = row; return b; },
      delete: function () { st.op = "delete"; return b; },
      then: function (res, rej) { return new Promise(function (r) { setTimeout(function () { r(exec(st)); }, 0); }).then(res, rej); }
    };
    return b;
  }
  function exec(st) {
    var keep = function (r) { return st.filters.every(function (f) { return f(r); }); };
    if (st.table === "plan_docs") {
      if (!isMember()) return st.op === "select" ? { data: [], error: null } : { data: null, error: { code: "42501", message: "new row violates row-level security policy" } };
      if (st.op === "select") return { data: Array.from(rows.values()).filter(keep).filter(function (r) { return r.coll !== "private" || r.id === session.user.id; }).map(function (r) { return { coll: r.coll, id: r.id, data: r.data }; }), error: null };
      if (st.op === "upsert") { var k = st.payload.coll + "/" + st.payload.id; var had = rows.has(k); rows.set(k, { coll: st.payload.coll, id: st.payload.id, data: st.payload.data }); window.__fake.writes.push(["set", k]); emit(had ? "UPDATE" : "INSERT", rows.get(k)); return { data: null, error: null }; }
      if (st.op === "delete") { Array.from(rows.values()).filter(keep).forEach(function (r) { rows.delete(r.coll + "/" + r.id); window.__fake.writes.push(["del", r.coll + "/" + r.id]); emit("DELETE", null, { coll: r.coll, id: r.id }); }); return { data: null, error: null }; }
    }
    if (st.table === "plan_members") {
      if (st.op === "select") return { data: isMember() ? members.filter(keep) : [], error: null };
      if (st.op === "upsert") { members = members.filter(function (m) { return m.email !== st.payload.email; }).concat([st.payload]); window.__fake.members = members; return { data: null, error: null }; }
      if (st.op === "delete") { members = members.filter(function (m) { return !keep(m); }); window.__fake.members = members; return { data: null, error: null }; }
    }
    if (st.table === "plan_users") {
      if (st.op === "select") return { data: Array.from(users.values()).filter(keep), error: null };
      if (st.op === "upsert") { users.set(st.payload.id, st.payload); return { data: null, error: null }; }
    }
    if (st.table === "plan_push_subs") {
      var mine = function (r) { return !!session && r.user_id === session.user.id; };
      var adm = isMember() && members.some(function (m) { return m.email === session.user.email && m.is_admin; });
      if (st.op === "select") return { data: Array.from(pushSubs.values()).filter(keep).filter(function (r) { return adm || mine(r); }), error: null };
      if (st.op === "upsert") { if (!isMember() || !mine(st.payload)) return { data: null, error: { code: "42501", message: "new row violates row-level security policy" } }; pushSubs.set(st.payload.endpoint, JSON.parse(JSON.stringify(st.payload))); return { data: null, error: null }; }
      if (st.op === "delete") { Array.from(pushSubs.values()).filter(keep).filter(mine).forEach(function (r) { pushSubs.delete(r.endpoint); }); return { data: null, error: null }; }
    }
    if (st.table === "plan_notices") {
      if (st.op === "select") return { data: isMember() ? notices.filter(keep) : [], error: null };
    }
    if (st.table === "plan_visits") {
      var own = function (r) { return !!session && r.user_id === session.user.id; };
      var admin = isMember() && members.some(function (m) { return m.email === session.user.email && m.is_admin; });
      if (st.op === "select") return { data: Array.from(visits.values()).filter(keep).filter(function (r) { return admin || own(r); }), error: null };
      if (st.op === "upsert") { if (!isMember() || !own(st.payload)) return { data: null, error: { code: "42501", message: "new row violates row-level security policy" } }; visits.set(st.payload.id, JSON.parse(JSON.stringify(st.payload))); return { data: null, error: null }; }
    }
    return { data: null, error: { message: "unsupported " + st.table + " " + st.op } };
  }
  var client = {
    from: builder,
    channel: function () { var ch = { on: function (ev, opts, cb) { listeners.push(cb); return ch; }, subscribe: function () { return ch; } }; return ch; },
    removeChannel: function () {},
    functions: {
      invoke: function (name, opts) {
        var body = (opts && opts.body) || {}; window.__fake.invoked.push(Object.assign({ fn: name }, body));
        if (!session) return Promise.resolve({ data: null, error: { message: "Unauthorized" } });
        if (body.job === "vapid") return Promise.resolve({ data: { ok: true, publicKey: window.__VAPID || "" }, error: null });
        if (body.job === "test") return Promise.resolve({ data: { ok: true, sent: 1, recipients: 1 }, error: null });
        if (body.job === "message") { notices.unshift({ id: notices.length + 1, kind: "message", day: null, title: "Mesaj", body: body.text, recipients: 2, sent: 2, created_by: session.user.email, created_at: new Date().toISOString() }); return Promise.resolve({ data: { ok: true, sent: 2, recipients: 2 }, error: null }); }
        return Promise.resolve({ data: { ok: false, error: "job necunoscut" }, error: null });
      }
    },
    auth: {
      onAuthStateChange: function (cb) { authCb = cb; setTimeout(function () { cb(session ? "SIGNED_IN" : "SIGNED_OUT", session); }, 0); return { data: { subscription: { unsubscribe: function () {} } } }; },
      verifyOtp: function (o) {
        window.__fake.verify = o;
        if (o.token !== "123456") return Promise.resolve({ data: { session: null }, error: { message: "Token has expired or is invalid" } });
        session = { user: { id: "11111111-2222-4333-8444-555555555555", email: o.email }, access_token: "fake-token" };
        setTimeout(function () { if (authCb) authCb("SIGNED_IN", session); }, 0);
        return Promise.resolve({ data: { session: session }, error: null });
      },
      getSession: function () { return Promise.resolve({ data: { session: session }, error: null }); },
      signInWithOtp: function (o) { window.__fake.otp = o.email; return Promise.resolve({ data: {}, error: null }); },
      signOut: function () { session = null; return Promise.resolve({ error: null }); }
    }
  };
  window.supabase = { createClient: function () { return client; } };
  window.HEAT_SUPABASE = { url: "https://fake.supabase.co", anonKey: "fake" };
})();
