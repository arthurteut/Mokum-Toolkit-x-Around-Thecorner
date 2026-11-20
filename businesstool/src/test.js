/* Test automat (Playwright + clientul Supabase fals): node businesstool/src/test.js <seed.json>
   seed.json: { "coll/id": document, ... } exportat din baza de date a planului. */
const { chromium } = require("playwright");
const fs = require("fs"); const path = require("path");
const HERE = __dirname;
const SEED = fs.readFileSync(process.argv[2], "utf8");
const FAKE = fs.readFileSync(path.join(HERE, "fake-supabase.js"), "utf8");
const PAGE = "file://" + path.join(HERE, "..", "index.html");
const init = (extra) => "window.__SEED = " + SEED + ";" + (extra || "") + "\n" + FAKE;

(async () => {
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: 1280, height: 900 } });
  const errs = []; pg.on("pageerror", (e) => errs.push("PAGEERR " + e.message)); pg.on("console", (m) => { if (m.type() === "error" && !/ERR_CERT|fonts|supabase\.min|net::/.test(m.text())) errs.push("CONSOLE " + m.text()); });
  await pg.route(/supabase-js|supabase\.min\.js/, (r) => r.fulfill({ status: 200, contentType: "text/javascript", body: "/* înlocuit de clientul fals */" }));
  await pg.addInitScript(init());
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
  await pg.close();
  // neautentificat
  const out = await b.newPage({ viewport: { width: 1280, height: 900 } });
  await out.route(/supabase-js|supabase\.min\.js/, (r) => r.fulfill({ status: 200, contentType: "text/javascript", body: "" }));
  await out.addInitScript(init("window.__NO_SESSION = true;")); await out.goto(PAGE); await out.waitForTimeout(800);
  console.log("logged out: login visible", await out.locator("#login").isVisible(), "| form visible", await out.locator("#login-form").isVisible(), "| concept:", await out.textContent("#c-concept"));
  await out.fill("#login-email", "cineva@test.ro"); await out.click("#login-form .btn"); await out.waitForTimeout(300);
  console.log("otp sent to:", await out.evaluate(() => window.__fake.otp), "| fb:", await out.textContent("#login-fb"));
  await out.screenshot({ path: path.join(HERE, "shot-login.png") });
  // autentificat, dar fără acces
  const den = await b.newPage({ viewport: { width: 1280, height: 900 } });
  await den.route(/supabase-js|supabase\.min\.js/, (r) => r.fulfill({ status: 200, contentType: "text/javascript", body: "" }));
  await den.addInitScript(init("window.__EMAIL = 'strain@test.ro';")); await den.goto(PAGE); await den.waitForTimeout(800);
  console.log("denied: msg", await den.textContent("#login-msg"), "| logout btn visible", await den.locator("#login-logout").isVisible());
  console.log("ERRORS", errs);
  await b.close();
})();
