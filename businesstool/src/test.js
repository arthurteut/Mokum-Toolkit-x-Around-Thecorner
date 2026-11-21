/* Test automat (Playwright + clientul Supabase fals): node businesstool/src/test.js <seed.json>
   seed.json: { "coll/id": document, ... } exportat din baza de date a planului. */
const { chromium } = require("playwright");
const fs = require("fs"); const path = require("path"); const http = require("http"); const crypto = require("crypto");
const HERE = __dirname;
const SEED = fs.readFileSync(process.argv[2], "utf8");
const FAKE = fs.readFileSync(path.join(HERE, "fake-supabase.js"), "utf8");
const init = (extra) => "window.__SEED = " + SEED + ";" + (extra || "") + "\n" + FAKE;
/* Pagina se servește prin http (service worker-ul și notificările nu merg pe file://). */
const ROOT = path.join(HERE, "..");
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".json": "application/json", ".webmanifest": "application/manifest+json", ".png": "image/png", ".css": "text/css" };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]); if (p === "/") p = "/index.html";
  const f = path.normalize(path.join(ROOT, p));
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { "Content-Type": MIME[path.extname(f)] || "application/octet-stream", "Cache-Control": "no-cache" }); fs.createReadStream(f).pipe(res);
});

(async () => {
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const PAGE = "http://127.0.0.1:" + server.address().port + "/index.html";
  const vapidPub = crypto.createECDH("prime256v1"); vapidPub.generateKeys();
  const VAPID = vapidPub.getPublicKey().toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, permissions: ["notifications"] });
  const pg = await ctx.newPage();
  const errs = []; pg.on("pageerror", (e) => errs.push("PAGEERR " + e.message)); pg.on("console", (m) => { if (m.type() === "error" && !/ERR_CERT|fonts|supabase\.min|net::|Push API in incognito/.test(m.text())) errs.push("CONSOLE " + m.text()); });
  await pg.route(/supabase-js|supabase\.min\.js/, (r) => r.fulfill({ status: 200, contentType: "text/javascript", body: "/* înlocuit de clientul fals */" }));
  await pg.addInitScript(init("window.__HB_MS = 400; window.__VAPID = " + JSON.stringify(VAPID) + ";"
    + "try { Object.defineProperty(Notification, 'permission', { get: function () { return 'default'; } }); Notification.requestPermission = function () { return Promise.resolve('granted'); }; } catch (e) {}"));
  await pg.goto(PAGE); await pg.waitForTimeout(1500);
  const t = async (sel) => ((await pg.textContent(sel)) || "").replace(/\s+/g, " ").trim();
  const cnt = (sel) => pg.locator(sel).count();
  console.log("login hidden:", await pg.locator("#login").isHidden(), "| who:", await t("#who"), "| team btn visible:", await pg.locator("#team-btn").isVisible(), "| logout visible:", await pg.locator("#logout").isVisible());
  console.log("progress:", await t("#prog-lab"), "| mini:", (await t("#mini")).slice(0, 80));
  console.log("concept:", (await t("#c-concept .rendered")).slice(0, 70), "| products rows:", await cnt("#c-meniu tbody tr"), "| swot:", await cnt("#c-swot .swot-item"), "| sops:", await cnt("#c-sop-registru tbody tr"), "| kpis:", await cnt("#c-kpi .rowcard"), "| milestones:", await cnt("#c-deschidere tbody tr"));
  console.log("pnl kpis:", (await t("#c-pnl .kpis")).slice(0, 120));
  console.log("names resolved:", await pg.locator(".who-name").evaluateAll((a) => Array.from(new Set(a.map((x) => x.textContent))).join(",")));
  // scriere: bloc text
  await pg.click("#b-cultura .linkish.edit-only"); await pg.fill("#t-cultura", "Test Supabase.\n\n- linia unu"); await pg.click("#b-cultura .editor .btn"); await pg.waitForTimeout(500);
  console.log("cultura saved:", await t("#c-cultura .rendered"), "| write:", JSON.stringify(await pg.evaluate(() => window.__fake.writes.filter((w) => w[1] === "plan/cultura"))), "| stored text:", await pg.evaluate(() => window.__fake.rows.get("plan/cultura").data.text));
  // timeline-ul reperelor din Start
  console.log("timeline items:", await cnt("#next-list .tl-item"), "| done details:", await cnt("#next-list .tl-done"), "| hint:", await t("#next-list .hint"));
  await pg.locator("#next-list .tl-item").first().locator(".tl-status button", { hasText: "În curs" }).click(); await pg.waitForTimeout(400);
  console.log("first item after În curs:", await pg.locator("#next-list .tl-item").first().evaluate((x) => x.className + " | " + x.querySelector(".tl-status .on").textContent), "| stored:", await pg.evaluate(() => { const id = document.querySelector("#next-list .tl-item").dataset.id; const r = window.__fake.rows.get("milestones/" + id); return r && r.data.status; }));
  await pg.fill("#tl-title", "Reper de test"); await pg.fill("#tl-owner", "Cristian"); await pg.fill("#tl-date", "2027-02-01"); await pg.click("#tl-add .btn"); await pg.waitForTimeout(500);
  console.log("timeline after add:", await cnt("#next-list .tl-item"), "| table rows:", await cnt("#c-deschidere tbody tr"), "| table rows with status:", await pg.evaluate(() => Array.from(document.querySelectorAll("#c-deschidere tbody tr")).map((tr) => tr.querySelector("select").value).filter(Boolean).length));
  await pg.locator("#next-list .tl-item", { hasText: "Reper de test" }).locator("button", { hasText: "Editează" }).click(); await pg.waitForTimeout(200);
  await pg.fill("#next-list .tl-edit input[type=text]", "Reper de test editat"); await pg.locator("#next-list .tl-edit .btn", { hasText: "Salvează" }).click(); await pg.waitForTimeout(400);
  console.log("edited present:", await cnt("#next-list .tl-item:has-text('Reper de test editat')"));
  // scriere: rând nou + ștergere
  const before = await cnt("#c-deschidere tbody tr");
  await pg.locator("#c-deschidere .tool-actions .btn").click(); await pg.waitForTimeout(400);
  console.log("milestones add:", before, "->", await cnt("#c-deschidere tbody tr"));
  // modificare externă prin realtime
  await pg.evaluate(() => { const r = { coll: "plan", id: "concept", data: { status: "gata", text: "Schimbat de altcineva.", updatedAt: Date.now(), updatedBy: "11111111-2222-4333-8444-555555555555" } }; window.__fake.rows.set("plan/concept", r); window.__fake.emit("UPDATE", r); });
  await pg.waitForTimeout(400);
  console.log("realtime concept:", await t("#c-concept .rendered"), "| status:", await pg.inputValue("#s-concept"), "| progress:", await t("#prog-lab"));
  // spațiul privat
  await pg.fill("#t-de-ce", "doar pentru mine"); await pg.waitForTimeout(1300);
  console.log("private row:", JSON.stringify(await pg.evaluate(() => { const r = window.__fake.rows.get("private/11111111-2222-4333-8444-555555555555"); return r && r.data; })));
  // echipa (admin)
  await pg.click("#team-btn"); await pg.waitForTimeout(200);
  await pg.fill("#tm-email", "coleg@test.ro"); await pg.fill("#tm-name", "Coleg"); await pg.click("#team-form .btn.yellow"); await pg.waitForTimeout(300);
  console.log("team list:", await pg.locator("#team-list li").count(), "| fb:", await t("#team-fb"));
  await pg.click("#team-close");
  console.log("scrollWidth:", await pg.evaluate(() => document.documentElement.scrollWidth));
  await pg.screenshot({ path: path.join(HERE, "shot-app.png") });
  // activitate: semnalul din pagină (HB_MS scurtat în test) și panoul administratorului
  await pg.waitForTimeout(1000);
  console.log("visits:", JSON.stringify(await pg.evaluate(() => Array.from(window.__fake.visits.values()).map((v) => ({ user: v.user_id.slice(0, 8), email: v.email, sec: v.seconds, blocks: v.blocks, edits: v.edits, dev: v.device, started: !!v.started_at, seen: !!v.last_seen_at })))));
  await pg.click("#act-btn"); await pg.waitForTimeout(600);
  console.log("activity open:", await pg.evaluate(() => document.getElementById("act-dlg").open), "| rows:", await cnt("#act-dlg tbody tr"), "| first row:", await t("#act-dlg tbody tr"), "| visits listed:", await cnt("#act-dlg .log-item"), "| first visit:", await t("#act-dlg .log-item"), "| fb:", await t("#act-fb"));
  await pg.screenshot({ path: path.join(HERE, "shot-activity.png") });
  console.log("notices listed:", await cnt("#act-notices .log-item"), "| notif column:", await t("#act-dlg tbody tr:first-child td:last-child"));
  await pg.fill("#act-msg", "Citiți azi blocul Food cost"); await pg.click("#act-msg-form .btn"); await pg.waitForTimeout(400);
  console.log("message sent:", await t("#act-fb"), "| invoked:", JSON.stringify(await pg.evaluate(() => window.__fake.invoked)), "| notices now:", await cnt("#act-notices .log-item"));
  await pg.click("#act-close");
  // aplicația: service worker, manifest, dialogul și notificările
  console.log("sw active:", await pg.evaluate(() => Promise.race([navigator.serviceWorker.ready.then((r) => !!r.active), new Promise((r) => setTimeout(() => r("timeout"), 5000))])), "| manifest:", await pg.evaluate(() => fetch("manifest.webmanifest").then((r) => r.json()).then((m) => m.short_name + " " + m.icons.length + " icons").catch((e) => "ERR " + e.message)), "| sw.js version:", await pg.evaluate(() => fetch("sw.js").then((r) => r.text()).then((s) => (s.match(/VERSION = "([^"]+)"/) || [])[1])));
  console.log("app btn visible:", await pg.locator("#app-btn").isVisible(), "| banner visible:", await pg.locator("#app-banner").isVisible());
  await pg.click("#app-btn"); await pg.waitForTimeout(600);
  console.log("app dialog:", await t("#app-install"), "||", await t("#app-push"));
  const pushBtn = pg.locator("#app-push button", { hasText: "Pornește" });
  if (await pushBtn.count()) { await pushBtn.click(); await pg.waitForTimeout(2500); console.log("after enable:", await t("#app-fb"), "| push:", await t("#app-push"), "| subs:", await pg.evaluate(() => window.__fake.pushSubs.size), "| vapid asked:", await pg.evaluate(() => window.__fake.invoked.some((i) => i.job === "vapid"))); }
  await pg.screenshot({ path: path.join(HERE, "shot-app-dlg.png") });
  await pg.click("#app-close");
  await pg.click("#app-banner-close"); console.log("banner after close:", await pg.locator("#app-banner").isVisible());
  await pg.close();
  // neautentificat: trimiterea codului, apoi intrarea cu codul
  const out = await b.newPage({ viewport: { width: 1280, height: 900 } });
  await out.route(/supabase-js|supabase\.min\.js/, (r) => r.fulfill({ status: 200, contentType: "text/javascript", body: "" }));
  await out.addInitScript(init("window.__NO_SESSION = true;")); await out.goto(PAGE); await out.waitForTimeout(800);
  console.log("logged out: login visible", await out.locator("#login").isVisible(), "| form visible", await out.locator("#login-form").isVisible(), "| concept:", await out.textContent("#c-concept"));
  await out.fill("#login-email", "cineva@test.ro"); await out.click("#login-form .btn"); await out.waitForTimeout(300);
  console.log("otp sent to:", await out.evaluate(() => window.__fake.otp), "| fb:", await out.textContent("#login-fb"));
  await out.screenshot({ path: path.join(HERE, "shot-login.png") });
  await out.fill("#login-code", "000000"); await out.click("#login-verify"); await out.waitForTimeout(300);
  console.log("wrong code:", await out.textContent("#login-fb"));
  await out.fill("#login-code", "123456"); await out.press("#login-code", "Enter"); await out.waitForTimeout(800);
  console.log("right code -> verify:", JSON.stringify(await out.evaluate(() => window.__fake.verify)), "| login hidden:", await out.locator("#login").isHidden(), "| denied msg:", (await out.textContent("#login-msg")).slice(0, 60));
  // autentificat, dar fără acces
  const den = await b.newPage({ viewport: { width: 1280, height: 900 } });
  await den.route(/supabase-js|supabase\.min\.js/, (r) => r.fulfill({ status: 200, contentType: "text/javascript", body: "" }));
  await den.addInitScript(init("window.__EMAIL = 'strain@test.ro';")); await den.goto(PAGE); await den.waitForTimeout(800);
  console.log("denied: msg", await den.textContent("#login-msg"), "| logout btn visible", await den.locator("#login-logout").isVisible());
  console.log("ERRORS", errs);
  await b.close(); server.close();
})();
