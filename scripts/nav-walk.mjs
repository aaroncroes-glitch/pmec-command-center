// Presses every navigation control in the PMEC web app with real mouse clicks and checks
// where each one lands: whether the landing holds (a redirect can bounce you straight
// back), and what happens after a refresh or from a direct link.
//
//   pnpm dev:metro        start the web server first, in another terminal
//   pnpm test:nav         EXPO_PORT=8083 pnpm test:nav if the server is on another port
//
// Drives the installed Google Chrome; set CHROME_PATH for another Chrome or Chromium.
// --json <file> writes the results as JSON. Exits 1 on a failure or an uncaught page
// exception, 2 when the app or the browser cannot be reached. Takes about four minutes.
import { existsSync, writeFileSync } from "node:fs";
import { launch } from "puppeteer-core";

const BASE = process.env.PMEC_BASE_URL ?? `http://localhost:${process.env.EXPO_PORT ?? 8081}`;
const jsonFlag = process.argv.indexOf("--json");
const JSON_OUT = jsonFlag > -1 ? process.argv[jsonFlag + 1] : null;
const MOBILE = { width: 390, height: 844, deviceScaleFactor: 1 };
const DESKTOP = { width: 1440, height: 900, deviceScaleFactor: 1 };

function stop(message) {
  console.error(message);
  process.exit(2);
}

const executablePath = [
  process.env.CHROME_PATH,
  process.env.PUPPETEER_EXECUTABLE_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
].find((path) => path && existsSync(path));
if (!executablePath) stop("No Chrome found. Install Google Chrome, or set CHROME_PATH.");

try {
  const response = await fetch(BASE);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
} catch (error) {
  stop(
    `The app is not reachable at ${BASE} (${error.message}). Start it with \`pnpm dev:metro\`, or set EXPO_PORT or PMEC_BASE_URL.`,
  );
}

const results = [];
const errors = [];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rx = (re) => ({ source: re.source, flags: re.flags });
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function record(group, name, ok, detail = "", known) {
  const status = ok === null ? "skip" : ok ? "pass" : known ? "known" : "fail";
  results.push({ group, name, status, detail, ...(status === "known" ? { known } : {}) });
  const tag = { pass: "PASS ", fail: "FAIL ", known: "KNOWN", skip: "SKIP " }[status];
  console.log(
    `${tag}  ${group} · ${name}${detail ? `   [${detail}]` : ""}${status === "known" ? `   (${known})` : ""}`,
  );
}

const browser = await launch({ executablePath, headless: true, args: ["--no-sandbox"] }).catch(
  (error) => stop(`Could not start Chrome at ${executablePath}: ${error.message}`),
);

async function newPage(viewport) {
  const p = await browser.newPage();
  await p.setViewport(viewport);
  p.on("pageerror", (e) =>
    errors.push({ kind: "exception", url: p.url(), error: String(e?.message ?? e).slice(0, 240) }),
  );
  p.on("console", (m) => {
    if (m.type() === "error")
      errors.push({ kind: "console", url: p.url(), error: m.text().slice(0, 240) });
  });
  await p.evaluateOnNewDocument(() => {
    window.__vis = (e) => {
      if (!e?.getBoundingClientRect) return false;
      const r = e.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) return false;
      const cs = getComputedStyle(e);
      return cs.visibility !== "hidden" && cs.display !== "none";
    };
    window.__hit = (e) => {
      const r = e.getBoundingClientRect();
      const x = r.left + r.width / 2;
      const y = r.top + r.height / 2;
      if (x < 0 || y < 0 || x >= innerWidth || y >= innerHeight) return true; // will scroll
      const h = document.elementFromPoint(x, y);
      return !!h && (h === e || e.contains(h) || h.contains(e));
    };
    window.__interactive = (e) => {
      const hit = e.closest(
        '[role="button"],[role="link"],[role="tab"],a[href],button,[tabindex="0"]',
      );
      if (hit) return hit;
      for (let x = e; x && x !== document.body; x = x.parentElement) {
        if (getComputedStyle(x).cursor === "pointer") return x;
      }
      return null;
    };
  });
  return p;
}

async function pathOf(p) {
  for (let i = 0; i < 3; i += 1) {
    try {
      return await p.evaluate(() => location.pathname);
    } catch {
      await sleep(150);
    }
  }
  return "?";
}

/** Waits for the path to stop changing, and returns every path it passed through. */
async function settle(p, { timeout = 5000, hold = 900 } = {}) {
  const t0 = Date.now();
  let last = await pathOf(p);
  let since = Date.now();
  const trace = [last];
  while (Date.now() - t0 < timeout) {
    await sleep(60);
    const now = await pathOf(p);
    if (now !== last) {
      last = now;
      since = Date.now();
      trace.push(now);
    } else if (Date.now() - since >= hold) break;
  }
  return { at: last, trace };
}

async function find(p, fn, arg) {
  const h = await p.evaluateHandle(fn, arg);
  const el = h.asElement();
  if (!el) await h.dispose();
  return el;
}

const FIND_TEXT = ({ source, flags }) => {
  const re = new RegExp(source, flags);
  const leaves = [...document.querySelectorAll("body *")].filter(
    (e) => !e.children.length && re.test(e.textContent.trim()) && window.__vis(e),
  );
  for (const l of leaves) {
    const t = window.__interactive(l);
    if (t && window.__vis(t) && window.__hit(t)) return t;
  }
  for (const l of leaves) {
    const t = window.__interactive(l);
    if (t && window.__vis(t)) return t;
  }
  return null;
};

const FIND_BACK = () => {
  const labelled = [...document.querySelectorAll("[aria-label]")].filter(
    (e) => /^(back|go back)\b/i.test(e.getAttribute("aria-label")) && window.__vis(e),
  );
  for (const e of labelled) if (window.__hit(e)) return e;
  const arrows = [...document.querySelectorAll("body *")].filter(
    (e) => !e.children.length && e.textContent.trim() === "←" && window.__vis(e),
  );
  for (const a of arrows) {
    const t = window.__interactive(a) ?? a;
    if (window.__hit(t)) return t;
  }
  return labelled[0] ?? null;
};

const FIND_TAB = (name) =>
  [...document.querySelectorAll('[role="tab"]')].find(
    (t) => t.textContent.trim().includes(name) && window.__vis(t),
  ) ?? null;

const FIND_ROLE_CHIP = (name) => {
  const leaves = [...document.querySelectorAll("body *")].filter(
    (e) => !e.children.length && e.textContent.trim() === name && window.__vis(e),
  );
  for (const l of leaves) {
    const t = window.__interactive(l);
    if (!t) continue;
    const r = t.getBoundingClientRect();
    if (r.top < 130 && r.left > 600) return t;
  }
  return null;
};

async function press(el) {
  await el.click({ delay: 25 });
}
async function tapText(p, re) {
  const el = await find(p, FIND_TEXT, rx(re));
  if (!el) return false;
  await press(el);
  return true;
}
async function tapRole(p, name) {
  const el = await find(p, FIND_ROLE_CHIP, name);
  if (!el) return false;
  await press(el);
  return true;
}
async function tapTab(p, name) {
  const el = await find(p, FIND_TAB, name);
  if (!el) return false;
  await press(el);
  return true;
}
async function back(p) {
  const el = await find(p, FIND_BACK);
  if (!el) return false;
  await press(el);
  return true;
}
const tabBar = (p) =>
  p.evaluate(() => [...document.querySelectorAll('[role="tab"]')].some((t) => window.__vis(t)));
const bodyHas = (p, source, flags = "") =>
  p.evaluate(({ source, flags }) => new RegExp(source, flags).test(document.body.innerText), {
    source,
    flags,
  });

/** Largest type in the top band right of the sidebar: the page title. */
const pageTitle = (p) =>
  p.evaluate(() => {
    let best = null;
    let size = 0;
    for (const e of document.querySelectorAll("body *")) {
      if (e.children.length) continue;
      const t = e.textContent.trim();
      if (!t) continue;
      const r = e.getBoundingClientRect();
      if (!r.width || r.left < 240 || r.top > 110) continue;
      const s = parseFloat(getComputedStyle(e).fontSize);
      if (s > size) {
        size = s;
        best = t;
      }
    }
    return best;
  });

/** Visible text right of the sidebar, to detect that a view actually changed. */
const viewSignature = (p) =>
  p.evaluate(() =>
    [...document.querySelectorAll("body *")]
      .filter((e) => !e.children.length && window.__vis(e) && e.getBoundingClientRect().left >= 220)
      .map((e) => e.textContent.trim())
      .filter(Boolean)
      .join("|"),
  );

async function flow(group, name, viewport, body, { known } = {}) {
  const p = await newPage(viewport);
  let res;
  try {
    res = await body(p);
  } catch (e) {
    res = { ok: false, detail: `threw: ${String(e?.message ?? e).slice(0, 200)}` };
  } finally {
    await p.close().catch(() => {});
  }
  record(group, name, res.ok, res.detail, known);
}

async function enterHome(p) {
  await p.goto(`${BASE}/`, { waitUntil: "networkidle2" });
  let { at } = await settle(p, { hold: 700 });
  if (at !== "/") {
    await p.goto(`${BASE}/demo`, { waitUntil: "networkidle2" });
    await sleep(900);
    if (!(await tapText(p, /^OPEN EMPLOYEE MOBILE SHOWCASE/i)))
      throw new Error("showcase entry not found");
    ({ at } = await settle(p, { hold: 700 }));
  }
  if (at !== "/") throw new Error(`could not reach Home (landed on ${at})`);
}

async function asProjectManager(p) {
  await p.goto(`${BASE}/control-center`, { waitUntil: "networkidle2" });
  await settle(p, { hold: 600 });
  await tapRole(p, "PROJECT MANAGER");
  await sleep(700);
}

// ======================================================================= employee

await flow("Setup", "Showcase entry reaches Home", MOBILE, async (p) => {
  await enterHome(p);
  return { ok: true, detail: "Home" };
});
await flow("Setup", "Employee state survives a fresh load", MOBILE, async (p) => {
  await p.goto(`${BASE}/`, { waitUntil: "networkidle2" });
  const s = await settle(p);
  return { ok: s.at === "/", detail: s.trace.join(" → ") };
});

for (const tab of ["Work", "Projects", "Pay", "Profile"]) {
  await flow("Tab bar", `${tab} tab keeps the tab bar on screen`, MOBILE, async (p) => {
    await enterHome(p);
    if (!(await tapTab(p, tab))) return { ok: false, detail: "tab not found" };
    const s = await settle(p);
    const bar = await tabBar(p);
    return { ok: bar, detail: `${s.trace.join(" → ")}${bar ? "" : " · tab bar gone"}` };
  });
}

for (const tab of ["Pay", "Profile"]) {
  await flow("Tab bar", `${tab} tab ← returns to Home and stays there`, MOBILE, async (p) => {
    await enterHome(p);
    await tapTab(p, tab);
    const s1 = await settle(p);
    if (!(await back(p))) return { ok: false, detail: `${s1.at}: no back control` };
    const s2 = await settle(p, { hold: 1400 });
    return { ok: s2.at === "/", detail: `${s1.at} ← ${s2.trace.join(" → ")}` };
  });
}

const HOME_LINKS = [
  ["Attendance card", /^READY TO START\?$/i],
  ["Notifications row", /^PMEC NOTIFICATIONS$/i],
  ["Assigned work card", /^PMEC ASSIGNED WORK$/i],
  ["Leave forecast card", /^MONTHLY LEAVE FORECAST$/i],
  ["PAYSLIPS quick link", /^PAYSLIPS$/],
];
for (const [name, re] of HOME_LINKS) {
  await flow("Home", `${name} → ← returns to Home`, MOBILE, async (p) => {
    await enterHome(p);
    if (!(await tapText(p, re))) return { ok: false, detail: "control not found on Home" };
    const s1 = await settle(p);
    if (s1.at === "/") return { ok: false, detail: "tap did not navigate" };
    if (!(await back(p))) return { ok: false, detail: `${s1.at}: no back control` };
    const s2 = await settle(p, { hold: 1400 });
    return { ok: s2.at === "/", detail: `${s1.at} ← ${s2.trace.join(" → ")}` };
  });
}

for (const [name, re] of [
  ["PROJECTS quick link", /^PROJECTS$/],
  ["MY TASKS quick link", /^MY TASKS$/],
  ["CALENDAR quick link", /^CALENDAR$/],
]) {
  await flow("Home", `${name} keeps the tab bar on screen`, MOBILE, async (p) => {
    await enterHome(p);
    if (!(await tapText(p, re))) return { ok: false, detail: "control not found on Home" };
    const s = await settle(p);
    const bar = await tabBar(p);
    return {
      ok: s.at !== "/" && bar,
      detail: `${s.trace.join(" → ")}${bar ? "" : " · tab bar gone"}`,
    };
  });
}

for (const item of ["Personal calendar", "Leave requests", "Analytics", "Activity"]) {
  await flow("Profile", `${item} → ← returns to Profile`, MOBILE, async (p) => {
    await enterHome(p);
    await tapTab(p, "Profile");
    const s0 = await settle(p);
    if (!(await tapText(p, new RegExp(`^${esc(item)}$`))))
      return { ok: false, detail: `not found on ${s0.at}` };
    const s1 = await settle(p);
    if (!(await back(p))) return { ok: false, detail: `${s1.at}: no back control` };
    const s2 = await settle(p, { hold: 1200 });
    return { ok: s2.at === s0.at, detail: `${s0.at} → ${s1.at} ← ${s2.trace.join(" → ")}` };
  });
}

await flow("Notifications", "Settings → ← → ← returns to Home", MOBILE, async (p) => {
  await enterHome(p);
  await tapText(p, /^PMEC NOTIFICATIONS$/i);
  const s1 = await settle(p);
  if (!(await tapText(p, /^SETTINGS$/)))
    return { ok: false, detail: `${s1.at}: SETTINGS not found` };
  const s2 = await settle(p);
  if (!(await back(p))) return { ok: false, detail: `${s2.at}: no back control` };
  const s3 = await settle(p);
  if (s3.at !== s1.at)
    return { ok: false, detail: `expected ${s1.at}, got ${s3.trace.join(" → ")}` };
  if (!(await back(p))) return { ok: false, detail: `${s3.at}: no back control` };
  const s4 = await settle(p, { hold: 1200 });
  return { ok: s4.at === "/", detail: `${s1.at} → ${s2.at} ← ${s3.at} ← ${s4.at}` };
});

let projectPath = null;
await flow("Projects", "A project → ← returns to Projects", MOBILE, async (p) => {
  await enterHome(p);
  await tapTab(p, "Projects");
  const s0 = await settle(p);
  const project = await p.evaluate(() => {
    try {
      const pr = (JSON.parse(localStorage.getItem(Object.keys(localStorage).find((key) => key.startsWith("lumen.ess.")) ?? ""))?.projects ?? [])[0];
      return pr ? { id: pr.id, name: pr.name ?? pr.title ?? null } : null;
    } catch {
      return null;
    }
  });
  if (!project?.name) return { ok: false, detail: "no project in local data" };
  if (!(await tapText(p, new RegExp(`^${esc(project.name)}$`, "i"))))
    return { ok: false, detail: `"${project.name}" not tappable` };
  const s1 = await settle(p);
  projectPath = s1.at.startsWith("/work-project/") ? s1.at : `/work-project/${project.id}`;
  if (!(await back(p))) return { ok: false, detail: `${s1.at}: no back control` };
  const s2 = await settle(p, { hold: 1200 });
  return { ok: s2.at === s0.at, detail: `${s0.at} → ${s1.at} ← ${s2.trace.join(" → ")}` };
});

await flow("Pay", "Payslip PIN screen ← list, then ← Home", MOBILE, async (p) => {
  await enterHome(p);
  await tapTab(p, "Pay");
  const s0 = await settle(p);
  if (!(await tapText(p, /^PAID \d{4}-\d{2}-\d{2}$/)))
    return { ok: false, detail: `${s0.at}: no payslip row` };
  await sleep(600);
  if (!(await bodyHas(p, "CONFIRM\\s+YOUR PIN", "i")))
    return { ok: false, detail: "PIN screen did not open" };
  if (!(await back(p))) return { ok: false, detail: "PIN screen: no back control" };
  await sleep(600);
  if (await bodyHas(p, "CONFIRM\\s+YOUR PIN", "i"))
    return { ok: false, detail: "PIN screen did not close" };
  if (!(await back(p))) return { ok: false, detail: "list: no back control" };
  const s2 = await settle(p, { hold: 1400 });
  return { ok: s2.at === "/", detail: `${s0.at} [PIN] ← list ← ${s2.trace.join(" → ")}` };
});

const DIRECT = [
  ["/pay", "/"],
  ["/settings", "/"],
  ["/payslips", "/"],
  ["/profile", "/"],
  ["/attendance", "/"],
  ["/leave", "/"],
  ["/analytics", "/settings"],
  ["/activity", "/settings"],
  ["/personal-calendar", "/settings"],
  ["/notifications", "/"],
  ["/notification-settings", "/notifications"],
  ["/assigned-work", "/"],
  ["/privacy", "/"],
  ["/terms", "/"],
];
if (projectPath) DIRECT.push([projectPath, "/projects"]);
for (const [url, expected] of DIRECT) {
  await flow("Direct link", `${url} ← goes to ${expected}`, MOBILE, async (p) => {
    await p.goto(`${BASE}${url}`, { waitUntil: "networkidle2" });
    const s0 = await settle(p);
    if (s0.at !== url) return { ok: null, detail: `redirected on load: ${s0.trace.join(" → ")}` };
    if (!(await back(p))) return { ok: false, detail: "no back control" };
    const s1 = await settle(p, { hold: 1200 });
    return { ok: s1.at === expected, detail: `${url} ← ${s1.trace.join(" → ")}` };
  });
}

// ======================================================================== desktop

const PM_NAV = ["PM + HR VIEW", "JOB ORDERS", "HOURS & ATTENDANCE", "CAPACITY", "CONTROL ROOM"];
const HR_NAV = [
  "PM + HR VIEW",
  "PEOPLE",
  "HOURS & ATTENDANCE",
  "HR & LEAVE",
  "LEAVE & CAPACITY",
  "CONTROL ROOM",
];

await flow("Control Center", "PM sidebar: every item opens its view", DESKTOP, async (p) => {
  await asProjectManager(p);
  const bad = [];
  for (const label of PM_NAV) {
    if (!(await tapText(p, new RegExp(`^${esc(label)}$`)))) {
      bad.push(`${label}: not found`);
      continue;
    }
    await sleep(700);
    const t = await pageTitle(p);
    if (t !== label) bad.push(`${label} → "${t}"`);
  }
  return { ok: !bad.length, detail: bad.join("; ") || `${PM_NAV.length} views` };
});

await flow(
  "Control Center",
  "PM promo link REVIEW JOB ORDERS → opens a view",
  DESKTOP,
  async (p) => {
    await asProjectManager(p);
    if (!(await tapText(p, /^REVIEW JOB ORDERS →$/))) return { ok: false, detail: "not found" };
    await sleep(700);
    const t = await pageTitle(p);
    return { ok: t !== "CONTROL ROOM", detail: `title "${t}"` };
  },
);

await flow("Job orders", "Open tracker, then back to Control Center", DESKTOP, async (p) => {
  await asProjectManager(p);
  if (!(await tapText(p, /^OPEN JOB ORDER TRACKER →$/)))
    return { ok: false, detail: "tracker link not found" };
  const s1 = await settle(p);
  if (s1.at !== "/job-orders") return { ok: false, detail: s1.trace.join(" → ") };
  if (!(await back(p))) return { ok: false, detail: "/job-orders: no way back to Control Center" };
  const s2 = await settle(p, { hold: 1000 });
  return { ok: s2.at === "/control-center", detail: `/job-orders ← ${s2.trace.join(" → ")}` };
});

await flow("Job orders", "Direct link, then back to Control Center", DESKTOP, async (p) => {
  await asProjectManager(p);
  const q = await newPage(DESKTOP);
  try {
    await q.goto(`${BASE}/job-orders`, { waitUntil: "networkidle2" });
    const s0 = await settle(q);
    if (s0.at !== "/job-orders") return { ok: null, detail: `redirected: ${s0.trace.join(" → ")}` };
    if (!(await back(q))) return { ok: false, detail: "no way back to Control Center" };
    const s1 = await settle(q, { hold: 1000 });
    return { ok: s1.at === "/control-center", detail: `/job-orders ← ${s1.trace.join(" → ")}` };
  } finally {
    await q.close().catch(() => {});
  }
});

await flow("Job orders", "Project detail opens, CLOSE returns to the list", DESKTOP, async (p) => {
  await asProjectManager(p);
  await p.goto(`${BASE}/job-orders`, { waitUntil: "networkidle2" });
  await settle(p);
  const opened =
    (await tapText(p, /^OPEN PROJECT/)) ||
    (await tapText(p, /^Coastal Substation Electrical Retrofit$/));
  if (!opened) return { ok: false, detail: "no project to open" };
  await sleep(900);
  const closeVisible = () =>
    p.evaluate(() =>
      [...document.querySelectorAll("body *")].some(
        (e) => !e.children.length && e.textContent.trim() === "CLOSE" && window.__vis(e),
      ),
    );
  if (!(await closeVisible())) return { ok: false, detail: "detail did not open" };
  await tapText(p, /^CLOSE$/);
  await sleep(900);
  const stillOpen = await closeVisible();
  const at = await pathOf(p);
  return {
    ok: !stillOpen && at === "/job-orders",
    detail: `${stillOpen ? "detail still open" : "closed"} · ${at}`,
  };
});

await flow("Control Center", "HR sidebar: every item opens its view", DESKTOP, async (p) => {
  await p.goto(`${BASE}/control-center`, { waitUntil: "networkidle2" });
  await settle(p, { hold: 600 });
  if (!(await tapRole(p, "HR"))) return { ok: false, detail: "HR toggle not found" };
  await sleep(800);
  const bad = [];
  for (const label of HR_NAV) {
    if (!(await tapText(p, new RegExp(`^${esc(label)}$`)))) {
      bad.push(`${label}: not found`);
      continue;
    }
    await sleep(700);
    const t = await pageTitle(p);
    if (t !== label) bad.push(`${label} → "${t}"`);
  }
  return { ok: !bad.length, detail: bad.join("; ") || `${HR_NAV.length} views` };
});

await flow("Control Center", "HR promo link OPEN WORKFORCE → opens a view", DESKTOP, async (p) => {
  await p.goto(`${BASE}/control-center`, { waitUntil: "networkidle2" });
  await settle(p, { hold: 600 });
  await tapRole(p, "HR");
  await sleep(800);
  if (!(await tapText(p, /^OPEN WORKFORCE →$/))) return { ok: false, detail: "not found" };
  await sleep(700);
  const t = await pageTitle(p);
  return { ok: t !== "CONTROL ROOM", detail: `title "${t}"` };
});

for (const [route, items, known] of [
  ["/pm-ui-demo", ["Portfolio", "Decisions", "Delivery pulse"]],
  [
    "/hr-ui-demo",
    ["Leave review", "People watch", "Workforce pulse"],
    "design-lab sidebar only moves its highlight; nothing links to this page",
  ],
]) {
  await flow(
    "Design labs",
    `${route}: every sidebar item switches the view`,
    DESKTOP,
    async (p) => {
      await p.goto(`${BASE}${route}`, { waitUntil: "networkidle2" });
      await settle(p, { hold: 600 });
      await sleep(600);
      const bad = [];
      let prev = await viewSignature(p);
      for (const item of items) {
        if (!(await tapText(p, new RegExp(`^${esc(item)}$`)))) {
          bad.push(`${item}: not found`);
          continue;
        }
        await sleep(800);
        const sig = await viewSignature(p);
        if (sig === prev) bad.push(`${item}: view unchanged`);
        prev = sig;
      }
      return { ok: !bad.length, detail: bad.join("; ") || `${items.length} views` };
    },
    { known },
  );
}

// ======================================================================== summary

const count = (status) => results.filter((r) => r.status === status).length;
const summary = {
  base: BASE,
  pass: count("pass"),
  fail: count("fail"),
  known: count("known"),
  skip: count("skip"),
};
const distinctErrors = [...new Map(errors.map((e) => [e.error, e])).values()];
const exceptions = distinctErrors.filter((e) => e.kind === "exception");
console.log(
  `\n${summary.pass} passed · ${summary.fail} failed · ${summary.known} known · ${summary.skip} skipped · ${exceptions.length} page exceptions`,
);
for (const e of distinctErrors.slice(0, 12))
  console.log(`  ${e.kind.toUpperCase()} ${e.url.replace(BASE, "")}: ${e.error}`);
if (JSON_OUT)
  writeFileSync(JSON_OUT, JSON.stringify({ summary, results, errors: distinctErrors }, null, 2));
await browser.close();
process.exit(summary.fail || exceptions.length ? 1 : 0);
