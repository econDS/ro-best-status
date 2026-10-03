#!/usr/bin/env node
'use strict';
// QA-only real Chromium runner. Serve the immutable git archive and candidate through
// the exact project-Pages path; never replace application functions or calculations.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const ROOT = path.resolve(__dirname, '../..');
const FIXTURE = {...JSON.parse(fs.readFileSync(path.join(__dirname, 'browser-scenarios.json'), 'utf8')), widths:[320,360,390,430,768,1440]};
const BASE_SHA = process.env.BASE_SHA || FIXTURE.baselineSHA;
const BASE_ROOT = process.env.BASE_ROOT && path.resolve(process.env.BASE_ROOT);
const OUTPUT = path.resolve(process.env.QA_OUTPUT || path.join(ROOT, 'qa-artifacts'));
const PREFIX = '/ro-best-status/';
const SUFFIX = '?qa=preserve%20me&repeat=a&repeat=b#qa-sentinel';
const NAV_PATH = 'assets/ro-suite/1.5.1/nav.js';
const PIN = '1.55.1';
const PORTAL = 'https://econds.github.io/ro_tools_portal/';
const SELF = 'https://econds.github.io/ro-best-status/';
const DESTINATIONS = [PORTAL, 'https://econds.github.io/ro-leveling-map/', 'https://econds.github.io/ro-reform-preparation/', 'https://econds.github.io/dim_glacier_planner/', 'https://econds.github.io/sessrumnir-ocean-week-guide/', SELF];
const STATS = ['STR', 'AGI', 'VIT', 'INT', 'DEX', 'LUK'];
const ORIGINAL_FILES = ['index.html', 'styles.css', 'app.js', 'optimizer.js', 'job-profiles.js', 'job-bonus-data.js'];
const SENTINEL = { key: 'best-status-nav-qa-unrelated', value: 'unchanged:ไทย:2026' };
const origins = new Set(), servers = [];
let browser;
fs.mkdirSync(OUTPUT, { recursive: true });
function sha(value) { return crypto.createHash('sha256').update(value).digest('hex'); }
function git(args) { return execFileSync('git', ['-C', ROOT, ...args], { encoding: 'utf8' }).trim(); }
const report = {
  schemaVersion: 1, startedAt: new Date().toISOString(), status: 'running', sourceSHA: process.env.SOURCE_SHA || git(['rev-parse', 'HEAD']), baselineSHA: BASE_SHA,
  playwrightVersion: PIN, subpath: PREFIX, fixtureSHA256: sha(fs.readFileSync(path.join(__dirname, 'browser-scenarios.json'))),
  widths: FIXTURE.widths, actualTheme: 'dark', systemColorSchemes: FIXTURE.systemColorSchemes,
  featureInventory: FIXTURE.features, sources: {}, checks: [], failures: [], runs: {}, screenshots: [], releaseAssetHttp: [],
  limitations: [
    'Calculations, UI input, recipe changes, reset, storage reload and migration use the real app in Chromium, never an injected calculator or mock DOM.',
    'The baseline is the immutable original commit, not the candidate with its navbar deleted. Source hashes are checked against git before both are served.',
    'Operating-system light and dark preferences are tested against the actual fixed dark app. There is no theme toggle, share feature or import/export feature.',
    'Only top-level navigation to exact published suite URLs is fulfilled with a destination marker; this proves activation and the URL, not remote-site availability.',
    'The blocked-module cases abort the actual nav.js request. Only diagnostics attributed to that exact deliberately aborted resource may be excluded from baseline comparison.',
    'Original layout is compared relative to the original site header to permit the new normal-flow navbar. Any original narrow-screen overflow remains reported and cannot increase.',
    'DOM normalization removes timing text and inert empty style attributes left by Playwright screenshot caret restoration. Nonempty styles, controls, outputs and original source bytes remain checked.'
  ]
};
function normalize(value) { let v = String(value); for (const origin of origins) v = v.split(origin).join('http://local.test'); return v; }
function save() { report.finishedAt = new Date().toISOString(); fs.writeFileSync(path.join(OUTPUT, 'report.json'), JSON.stringify(report, null, 2) + '\n'); }
function fail(name, error) { report.failures.push({ name, message: error.message || String(error), stack: error.stack || null }); report.checks.push({ name, status: 'failed' }); console.error('FAIL', name, error.message || error); }
async function check(name, task, page) {
  try { const result = await task(); report.checks.push({ name, status: 'passed' }); console.log('PASS', name); return result; }
  catch (error) { fail(name, error); if (page && !page.isClosed()) await screenshot(page, 'failure-' + name).catch(() => {}); }
  finally { save(); }
}
function source(root) {
  const files = ORIGINAL_FILES.map(file => ({ file, sha256: sha(fs.readFileSync(path.join(root, file))) }));
  function walk(dir) { if (!fs.existsSync(dir)) return; for (const e of fs.readdirSync(dir, { withFileTypes: true })) { const p = path.join(dir, e.name); if (e.isDirectory()) walk(p); else files.push({ file: path.relative(root, p).split(path.sep).join('/'), sha256: sha(fs.readFileSync(p)) }); } }
  walk(path.join(root, 'assets'));
  return { files };
}
async function serve(root) {
  const server = http.createServer((req, res) => {
    let url, relative;
    try { url = new URL(req.url, 'http://localhost'); relative = decodeURIComponent(url.pathname.slice(PREFIX.length)) || 'index.html'; }
    catch { res.writeHead(400).end(); return; }
    if (!url.pathname.startsWith(PREFIX)) { res.writeHead(404).end('Only the project Pages subpath is served'); return; }
    const target = path.resolve(root, relative);
    if (!target.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    if (!fs.existsSync(target) || !fs.statSync(target).isFile()) { res.writeHead(404).end('Not found'); return; }
    const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml' };
    res.writeHead(200, { 'Content-Type': types[path.extname(target)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); fs.createReadStream(target).pipe(res);
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  servers.push(server); const origin = 'http://127.0.0.1:' + server.address().port; origins.add(origin);
  return { origin, url: origin + PREFIX + SUFFIX };
}
async function settle(page) {
  // Existing comparison suite keeps all activities visible; separate first-run tests exercise single activity.
  if(await page.locator('#activity-start').count()) { await page.locator('[name="first-activity"][value="all"]').evaluate(el=>{el.checked=true;el.dispatchEvent(new Event('change',{bubbles:true}));}); await page.locator('.first-run-budget').evaluate(el=>{el.open=true;}); }
  await page.waitForFunction(() => document.querySelector('#results-panel')?.getAttribute('aria-busy') === 'false' && !document.querySelector('#calculate')?.disabled);
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}
async function top(page) { await page.evaluate(() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' })); await page.waitForFunction(() => scrollX === 0 && scrollY === 0); }
async function screenshot(page, name, fullPage = false) {
  await top(page); const file = name.replace(/[^a-zA-Z0-9._-]/g, '-') + '.png';
  await page.screenshot({ path: path.join(OUTPUT, file), fullPage, animations: 'disabled' });
  report.screenshots.push({ file, fullPage, viewport: page.viewportSize(), url: normalize(page.url()), sha256: sha(fs.readFileSync(path.join(OUTPUT, file))) });
}
function monitor(page, run) {
  const n = run.diagnostics;
  page.on('request', r => n.requests.push({ url: normalize(r.url()), type: r.resourceType() }));
  page.on('requestfailed', r => n.failedRequests.push({ url: normalize(r.url()), error: r.failure()?.errorText || '' }));
  page.on('response', r => { if (r.status() >= 400) n.badResponses.push({ url: normalize(r.url()), status: r.status() }); });
  page.on('pageerror', e => n.pageErrors.push({ message: normalize(e.message), stack: normalize(e.stack) }));
  page.on('console', m => { if (['error', 'warning'].includes(m.type())) n.console.push({ type: m.type(), text: normalize(m.text()), location: { ...m.location(), url: normalize(m.location().url) } }); });
}
async function snapshot(page) {
  const value = await page.evaluate(() => {
    const text = e => e?.textContent.replace(/\s+/g, ' ').trim() ?? '';
    const controls = [...document.querySelectorAll('#planner-form input, #planner-form select, #profile-controls input, #profile-controls select')].map(e => ({ id: e.id, name: e.name, type: e.type, value: e.value, checked: e.checked ?? null, disabled: e.disabled, min: e.min ?? null, max: e.max ?? null, invalid: e.getAttribute('aria-invalid') }));
    const cards = [...document.querySelectorAll('.result-card')].map(e => ({
      activity: e.dataset.activity, state: e.dataset.state, class: text(e.querySelector('.activity-subtitle')), context: text(e.querySelector('.profile-context')),
      current: text(e.querySelector('.current-rate')), optimal: text(e.querySelector('.big-rate')), improvement: text(e.querySelector('.rate-improvement')),
      stats: Object.fromEntries([...e.querySelectorAll('.allocated-stat')].map(s => [text(s.querySelector('dt')), Number(s.querySelector('dd')?.firstChild?.textContent ?? NaN)])),
      breakdown: [...e.querySelectorAll('.bonus-breakdown tbody tr')].map(r => ({ stat: r.dataset.stat, ...Object.fromEntries([...r.querySelectorAll('[data-part]')].map(c => [c.dataset.part, Number(text(c).replaceAll(',', ''))])) })),
      points: [...e.querySelectorAll('.card-points strong')].map(text), caution: Boolean(e.querySelector('.bonus-source-note.is-caution')), error: text(e.querySelector('.card-error'))
    }));
    let dom = [...document.querySelectorAll('body > .site-header, body > main, body > footer')].map(e => {
      const c = e.cloneNode(true);
      // Playwright screenshots temporarily hide carets, then restore an empty style
      // attribute. A navigation/reload removes it; it is not an application change.
      c.querySelectorAll('[style=""]').forEach(e => e.removeAttribute('style'));
      c.querySelectorAll('.card-timing span').forEach(e => e.textContent = '[measured timing]');
      c.querySelectorAll('#calculation-info').forEach(e => e.textContent = e.textContent.replace(/(?:<\s*)?[\d.]+ ms/g, '[measured timing]'));
      return c.outerHTML;
    }).join('\n');
    return { controls, cards, budget: text(document.querySelector('#budget-display')), spent: text(document.querySelector('#spent-display')), status: text(document.querySelector('#result-status')), formError: document.querySelector('#form-error').hidden ? null : text(document.querySelector('#form-error')), migrationVisible: !document.querySelector('#migration-notice').hidden, migrationOldValues: text(document.querySelector('#migration-old-values')) };
  });
  // Exact HTML presentation delta is separately reversible in tests/first-run.test.js; controls and every calculated output remain compared here.
  return value;
}
async function geometry(page) {
  await top(page);
  return page.evaluate(() => {
    const rect = e => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height, right: r.right, bottom: r.bottom }; };
    const header = document.querySelector('.site-header'), anchor = rect(header).y;
    const selector = 'body > .site-header,body > main,body > footer,.hero,.notice,.planner,.character-panel,.results-panel,.profile-controls,.result-card,.method-section';
    const nodes = [...document.querySelectorAll(selector)].filter(e => e.getClientRects().length);
    const items = nodes.map(e => { const r = rect(e); return { tag: e.tagName, id: e.id, class: e.className, x: r.x, relativeY: r.y - anchor, width: r.width, height: r.height }; });
    const collisions = [];
    nodes.forEach((a, i) => nodes.slice(i + 1).forEach((b, j) => { if (a.contains(b) || b.contains(a)) return; const x = rect(a), y = rect(b); if (Math.min(x.right, y.right) - Math.max(x.x, y.x) > 1 && Math.min(x.bottom, y.bottom) - Math.max(x.y, y.y) > 1) collisions.push([i, i + 1 + j]); }));
    const host = document.querySelector('ro-suite-nav');
    return { viewport: innerWidth, documentWidth: document.documentElement.scrollWidth, bodyWidth: document.body.scrollWidth, overflow: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - innerWidth, theme: getComputedStyle(document.documentElement).colorScheme, background: getComputedStyle(document.body).backgroundColor, header: rect(header), host: host ? rect(host) : null, items, collisions };
  });
}
function compareGeometry(actual, base, label) {
  assert(actual.overflow <= base.overflow + 1, `${label}: new overflow ${actual.overflow}px vs ${base.overflow}px original`);
  assert(actual.collisions.length <= base.collisions.length, label + ': no new content overlap');
  assert.equal(actual.theme, 'dark'); assert.equal(actual.background, base.background);
  if (actual.host) { assert(actual.host.x >= -1 && actual.host.right <= actual.viewport + 1); assert(actual.host.bottom <= actual.header.y + 1, label + ': navbar does not overlap original header'); }
}
async function sentinel(page, run) {
  const state = await page.evaluate(({ sentinel, key, legacyKey }) => ({ local: localStorage.getItem(sentinel.key), session: sessionStorage.getItem(sentinel.key), keys: Object.keys(localStorage), state: JSON.parse(localStorage.getItem(key) || 'null'), legacy: localStorage.getItem(legacyKey) }), { sentinel: SENTINEL, key: FIXTURE.storageKey, legacyKey: FIXTURE.legacyStorageKey });
  assert.equal(state.local, SENTINEL.value); assert.equal(state.session, SENTINEL.value);
  assert(state.keys.every(k => [SENTINEL.key, FIXTURE.storageKey, FIXTURE.legacyStorageKey].includes(k)), 'No new localStorage namespace');
  assert.equal(page.url(), run.url, 'Original query and hash are untouched'); return state;
}
async function reset(page) {
  await page.locator('#reset-settings').click(); await settle(page);
  await page.evaluate(() => { document.querySelector('.bonus-details').open = false; document.querySelector('#formula-details').open = false; });
}
async function fill(page, fields) {
  if (Object.keys(fields).some(k => k.startsWith('bonus-'))) await page.locator('.bonus-details > summary').click();
  if (Object.keys(fields).some(k => /^(rune-|potion-)/.test(k))) await page.locator('#formula-details > summary').click();
  for (const [id, value] of Object.entries(fields)) {
    const control = page.locator('#' + id), tag = await control.evaluate(e => e.tagName);
    if (typeof value === 'boolean') await control.setChecked(value);
    else if (tag === 'SELECT') await control.selectOption(String(value));
    else await control.fill(String(value));
  }
  await settle(page);
}
async function record(page, run, base, name, verify) {
  const value = await snapshot(page); run.cases[name] = value;
  if (verify) verify(value);
  if (base) assert.deepEqual(value, base.cases[name], name + ': all controls, outputs and normalized original DOM equal real baseline');
  await sentinel(page, run); return value;
}
function ready(value) { assert.deepEqual(value.cards.map(c => c.state), ['ready', 'ready', 'ready']); }
function validateBreakdown(value) {
  ready(value);
  for (const card of value.cards) for (const row of card.breakdown) assert.equal(row.total, row.base + row.job + row.gear, 'Base + current Job + shared gear is added once');
}
async function functional(page, run, base) {
  for (const scenario of FIXTURE.scenarios) await check(run.id + '-' + scenario.id, async () => {
    await reset(page); await fill(page, scenario.fields);
    const value = await record(page, run, base, scenario.id, value => { validateBreakdown(value); if (scenario.expectedRates) assert.deepEqual(value.cards.map(c => c.optimal), scenario.expectedRates); });
    if (scenario.id === 'current-minima-shared-gear-transcended-classes') {
      for (const card of value.cards) for (const stat of STATS) assert(card.stats[stat] >= scenario.fields['base-' + stat], 'Current minima retained');
      for (const card of value.cards) for (const row of card.breakdown) assert.equal(row.gear, scenario.fields['bonus-' + row.stat]);
      await page.locator('input[name="mode"][value="reset"]').check(); await settle(page);
      const resetValue = await record(page, run, base, 'reset-allocation', ready);
      for (const card of resetValue.cards) for (const stat of ['STR', 'AGI', 'VIT']) assert.equal(card.stats[stat], 1, 'Reset releases irrelevant stat spending');
      assert.notDeepEqual(resetValue.cards.map(c => c.stats), value.cards.map(c => c.stats));
      const stored = (await sentinel(page, run)).state;
      await page.reload(); await settle(page);
      const after = await record(page, run, base, 'v2-custom-settings-reload', ready);
      assert.deepEqual(after.controls, resetValue.controls); assert.deepEqual(after.cards, resetValue.cards); assert.deepEqual((await sentinel(page, run)).state, stored);
    }
    if (scenario.id === 'alchemist-forced-normal-budget') {
      assert.match(value.cards[1].context, /จุติแล้ว/); assert.match(value.cards[2].context, /ไม่จุติ/); assert(value.cards[1].caution, 'Assassin Cross Job 2 caution is shown');
      assert.notEqual(value.cards[1].context, value.cards[2].context);
    }
    if (scenario.id === 'high-level-third-classes-recipe-range') assert.deepEqual(value.cards.map(c => c.caution), [false, true, true]);
    if (scenario.id === 'zero-custom-budget') for (const card of value.cards) { assert.deepEqual(Object.values(card.stats), [1, 1, 1, 1, 1, 1]); assert.deepEqual(card.points, ['0', '0']); }
  }, page);
  await check(run.id + '-validation-clamp-and-reset', async () => {
    await reset(page);
    await page.locator('#job-potion').fill('70'); await page.locator('#class-potion').selectOption('alchemist'); await settle(page);
    assert.equal(await page.locator('#job-potion').inputValue(), '50'); assert(await page.locator('#profile-potion-change').isVisible());
    await record(page, run, base, 'class-change-clamps-job', ready);
    await page.locator('#level').fill('150'); await settle(page);
    await record(page, run, base, 'card-local-class-validation', v => assert.deepEqual(v.cards.map(c => c.state), ['ready', 'ready', 'invalid']));
    await page.locator('#level').fill(''); await settle(page);
    await record(page, run, base, 'blank-input-validation', v => assert(v.formError));
    await reset(page); await page.locator('#base-DEX').fill('60'); await settle(page); await page.locator('#clear-stats').click(); await settle(page);
    await record(page, run, base, 'clear-stats-button', v => { ready(v); assert(v.controls.filter(c => c.id.startsWith('base-')).every(c => c.value === '1')); });
    await page.locator('#formula-details > summary').click(); await page.locator('#rune-recipe').selectOption('lux-anima'); await page.locator('#rune-skill').fill('1'); await settle(page);
    await record(page, run, base, 'recipe-minimum-skill-validation', v => assert.deepEqual(v.cards.map(c => c.state), ['invalid', 'ready', 'ready']));
    await reset(page);
    await record(page, run, base, 'reset-settings-button', v => assert.deepEqual(v.cards.map(c => c.optimal), FIXTURE.scenarios[0].expectedRates));
  }, page);
  if (run.width === 1440 && run.preference === 'dark') await check(run.id + '-every-real-recipe', async () => {
    await reset(page); await page.locator('#formula-details > summary').click();
    for (const [activity, recipes] of [['rune', FIXTURE.runeRecipes], ['potion', FIXTURE.potionRecipes]]) {
      const allocations = [];
      for (const recipe of recipes) { await page.locator('#' + activity + '-recipe').selectOption(recipe); await settle(page); const v = await record(page, run, base, activity + '-recipe-' + recipe, ready); allocations.push(v.cards.find(c => c.activity === activity).stats); }
      allocations.forEach(a => assert.deepEqual(a, allocations[0], 'Fixed recipe offsets leave optimal allocation unchanged'));
    }
  }, page);
  await check(run.id + '-v1-migration-and-acknowledgement', async () => {
    await page.evaluate(({ current, legacyKey, legacy }) => { localStorage.removeItem(current); localStorage.setItem(legacyKey, JSON.stringify(legacy)); }, { current: FIXTURE.storageKey, legacyKey: FIXTURE.legacyStorageKey, legacy: FIXTURE.legacy });
    await page.reload(); await settle(page);
    const migrated = await record(page, run, base, 'v1-migrated', v => { ready(v); assert(v.migrationVisible); assert(v.controls.filter(c => c.id.startsWith('bonus-')).every(c => c.value === '0')); });
    const stored = await sentinel(page, run);
    assert.deepEqual(stored.state.base, FIXTURE.legacy.base); assert.equal(stored.state.budget, FIXTURE.legacy.budget); assert.equal(stored.state.level, FIXTURE.legacy.level); assert.equal(stored.state.formula.runeRecipe, FIXTURE.legacy.formula.runeRecipe); assert.equal(stored.state.formula.potionRecipe, FIXTURE.legacy.formula.potionRecipe);
    assert.deepEqual(stored.state.migrationPreviousBonuses, FIXTURE.legacy.bonuses); assert.equal(stored.legacy, JSON.stringify(FIXTURE.legacy)); assert.equal(stored.state.migrationPending, true);
    await page.reload(); await settle(page); const reload = await record(page, run, base, 'v1-notice-persists-on-reload', v => assert(v.migrationVisible)); assert.deepEqual(reload.cards, migrated.cards);
    await page.locator('#acknowledge-migration').click(); assert.equal((await sentinel(page, run)).state.migrationPending, false);
    await page.reload(); await settle(page); await record(page, run, base, 'v1-notice-acknowledged', v => { assert.equal(v.migrationVisible, false); assert.deepEqual(v.cards, migrated.cards); });
    await page.evaluate(key => localStorage.removeItem(key), FIXTURE.legacyStorageKey); await reset(page); await page.reload(); await settle(page);
  }, page);
}
async function active(page) { return page.evaluate(() => { const e = document.activeElement?.shadowRoot?.activeElement || document.activeElement; return { tag: e.tagName, id: e.id, class: e.className, href: e.getAttribute('href'), outline: getComputedStyle(e).outlineStyle }; }); }
async function assertHostTheme(page) {
  const audit=JSON.parse(fs.readFileSync(path.join(ROOT,'qa/nav150/host-theme.json'),'utf8'));
  const expected=Object.values(audit.modes)[0].tokens;
  const actual=await page.locator('ro-suite-nav').evaluate((host,expected)=>{
    const root=host.shadowRoot||host;const probe=document.createElement('span');root.append(probe);
    const resolved={},normalized={};
    for(const [key,value]of Object.entries(expected)){
      if(key==='font-family')continue;
      probe.style.color=`var(--ro-suite-${key})`;resolved[key]=getComputedStyle(probe).color;
      probe.style.color=value;normalized[key]=getComputedStyle(probe).color;
    }
    const nav=root.querySelector('nav'),styles=getComputedStyle(nav);probe.remove();
    return{resolved,normalized,surface:styles.backgroundColor,text:styles.color,font:styles.fontFamily};
  },expected);
  assert.deepEqual(actual.resolved,actual.normalized,'resolved public tokens equal the existing host palette');
  assert.equal(actual.surface,actual.normalized.surface);assert.equal(actual.text,actual.normalized.text);
  assert(actual.font.includes(expected['font-family'].split(',')[0].replace(/["']/g,'')),'host font is used');
  return actual;
}

async function navigation(page, run) {
  const host = page.locator('ro-suite-nav'), button = host.locator('button'), panel = host.locator('#tools');
  await check(run.id + '-navbar-theme-identity-and-keyboard', async () => {
    await page.reload(); await settle(page); await page.waitForFunction(() => Boolean(document.querySelector('ro-suite-nav')?.shadowRoot));
    run.hostTheme=await assertHostTheme(page);
    assert.equal(await host.getAttribute('tool-id'), 'best-status'); assert.equal(await host.getAttribute('theme'), 'dark');
    assert.equal(await host.locator('.current').innerText(), 'Best Status');
    const info = await host.evaluate(e => ({ theme: getComputedStyle(e).colorScheme, previous: e.previousElementSibling?.className, next: (() => { let next = e.nextElementSibling; while (next?.tagName === 'SCRIPT') next = next.nextElementSibling; return next?.className; })(), current: [...e.shadowRoot.querySelectorAll('[aria-current="page"]')].map(a => ({ text: a.textContent, href: a.href })), hrefs: [...e.shadowRoot.querySelectorAll('a')].map(a => a.href), button: (() => { const r = e.shadowRoot.querySelector('button').getBoundingClientRect(); return { width: r.width, height: r.height }; })() }));
    run.navIdentity = info; assert.equal(info.theme, 'dark'); assert.equal(info.previous, 'skip-link'); assert.match(info.next, /site-header/); assert.deepEqual(info.current, [{ text: 'Best Status', href: SELF }]);
    assert.deepEqual([...new Set(info.hrefs)].sort(), [...DESTINATIONS].sort()); assert(info.button.width >= 44 && info.button.height >= 44);
    await page.keyboard.press('Tab'); assert.equal((await active(page)).class, 'skip-link');
    await page.keyboard.press('Tab'); assert.equal((await active(page)).href, PORTAL); assert.notEqual((await active(page)).outline, 'none');
    await page.keyboard.press('Tab'); assert.equal((await active(page)).tag, 'BUTTON'); assert.notEqual((await active(page)).outline, 'none');
    await page.keyboard.press('Enter'); assert.equal(await button.getAttribute('aria-expanded'), 'true'); assert(await panel.isVisible());
    await page.keyboard.press('Tab'); assert.equal((await active(page)).href, DESTINATIONS[1]);
    await page.keyboard.press('Escape'); assert.equal(await button.getAttribute('aria-expanded'), 'false'); assert.equal((await active(page)).tag, 'BUTTON'); assert(!(await panel.isVisible()));
    await page.keyboard.press('Space'); assert(await panel.isVisible()); await page.keyboard.press('Space'); assert(!(await panel.isVisible()));
    for (let i = 0; i < 5; i++) { await button.click(); assert(await panel.isVisible()); await button.click(); assert(!(await panel.isVisible())); }
    await button.click();
    const links = await panel.locator('a').count(); for (let i = 0; i < links + 1; i++) await page.keyboard.press('Tab');
    assert.equal((await active(page)).class, 'brand'); assert(!(await panel.isVisible()), 'Tab exits normally and closes menu');
    await sentinel(page, run);
  }, page);
  await check(run.id + '-navbar-open-geometry', async () => {
    await button.click(); const open = await geometry(page); run.menuGeometry = open;
    assert(open.overflow <= run.initialGeometry.overflow + 1); assert(open.host.bottom <= open.header.y + 1);
    const targets = await host.locator('a,button').evaluateAll(nodes => nodes.filter(e => e.getClientRects().length).map(e => { const r = e.getBoundingClientRect(); return { text: e.textContent, x: r.x, right: r.right, width: r.width, height: r.height }; }));
    assert(targets.every(t => t.width >= 44 && t.height >= 44 && t.x >= 0 && t.right <= run.width + 1), 'Visible links and button are 44px targets and fit viewport');
    if ([390, 1440].includes(run.width)) await screenshot(page, run.id + '-menu-open');
    await button.click();
  }, page);
  if (run.width === 1440 && run.preference === 'dark') await check(run.id + '-suite-link-activation-and-back', async () => {
    const before = await snapshot(page), storage = await sentinel(page, run);
    for (const destination of DESTINATIONS) {
      if (destination !== PORTAL) await button.click();
      const link = destination === PORTAL ? host.locator('.bar > a') : panel.locator(`a[href="${destination}"]`);
      await Promise.all([page.waitForURL(destination), link.click()]); assert.equal(page.url(), destination); assert.equal(await page.locator('body').innerText(), 'QA destination');
      await page.goBack(); await settle(page); await page.waitForFunction(() => Boolean(document.querySelector('ro-suite-nav')?.shadowRoot));
      assert.deepEqual((await snapshot(page)).controls, before.controls); assert.deepEqual((await snapshot(page)).cards, before.cards); assert.deepEqual((await sentinel(page, run)).state, storage.state);
    }
  }, page);
}
function diagnosticSignatures(run) {
  const blocked = 'http://local.test' + PREFIX + NAV_PATH;
  const isIntentional = url => run.mode === 'blocked' && url === blocked;
  const d = run.diagnostics;
  run.intentionalNavFailure = { requests: d.failedRequests.filter(e => isIntentional(e.url)), console: d.console.filter(e => isIntentional(e.location.url)) };
  return {
    pageErrors: d.pageErrors.map(e => e.message).sort(),
    badResponses: d.badResponses.map(e => `${e.status} ${e.url}`).sort(),
    failedRequests: d.failedRequests.filter(e => !isIntentional(e.url)).map(e => `${e.url} ${e.error}`).sort(),
    console: d.console.filter(e => !isIntentional(e.location.url)).map(e => `${e.type} ${e.text} ${e.location.url}`).sort()
  };
}
async function runOne(server, mode, width, preference, base) {
  const run = { id: `${mode}-${width}-system-${preference}`, mode, width, preference, url: server.url, cases: {}, diagnostics: { requests: [], failedRequests: [], badResponses: [], pageErrors: [], console: [] }, blockedNavRequests: 0 };
  report.runs[run.id] = run;
  const context = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: preference, reducedMotion: 'reduce' });
  context.setDefaultTimeout(10000);
  await context.addInitScript(s => { if (!localStorage.getItem(s.key)) localStorage.setItem(s.key, s.value); if (!sessionStorage.getItem(s.key)) sessionStorage.setItem(s.key, s.value); }, SENTINEL);
  await context.route('**/*', async route => {
    const request = route.request(), url = request.url();
    if (mode === 'blocked' && url === server.origin + PREFIX + NAV_PATH) { run.blockedNavRequests++; await route.abort('failed'); }
    else if (request.isNavigationRequest() && DESTINATIONS.includes(url)) await route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>QA destination</title><body>QA destination</body>' });
    else await route.continue();
  });
  const page = await context.newPage(); monitor(page, run);
  try {
    const response = await page.goto(server.url, { waitUntil: 'networkidle' }); assert.equal(response.status(), 200); await settle(page);
    await check(run.id + '-initial-layout-and-dom', async () => {
      run.initialGeometry = await geometry(page); assert.equal(run.initialGeometry.theme, 'dark');
      const value = await record(page, run, base, 'initial-default', ready);
      assert.deepEqual(value.cards.map(c => c.optimal), FIXTURE.scenarios[0].expectedRates);
      if (base) compareGeometry(run.initialGeometry, base.initialGeometry, run.id);
      if ([390, 1440].includes(width)) await screenshot(page, run.id + '-default-fullpage', true);
    }, page);
    if (mode === 'blocked') await check(run.id + '-actual-module-block-and-fallback', async () => {
      assert(run.blockedNavRequests > 0, 'Actual nav.js request was intercepted and aborted'); assert.equal(await page.evaluate(() => Boolean(document.querySelector('ro-suite-nav').shadowRoot)), false);
      run.hostTheme=await assertHostTheme(page);
      const fallback = page.locator('ro-suite-nav > nav > a'); assert(await fallback.isVisible()); assert.equal(await fallback.getAttribute('href'), PORTAL);
      const rect = await fallback.boundingBox(); assert(rect.width >= 44 && rect.height >= 44); assert(rect.x >= 0 && rect.x + rect.width <= width + 1);
      if ([390, 1440].includes(width)) await screenshot(page, run.id + '-fallback-top');
      await page.keyboard.press('Tab'); assert.equal((await active(page)).class, 'skip-link'); await page.keyboard.press('Tab'); assert.equal((await active(page)).href, PORTAL); assert.notEqual((await active(page)).outline, 'none');
      await Promise.all([page.waitForURL(PORTAL), page.keyboard.press('Enter')]); assert.equal(page.url(), PORTAL); await page.goBack(); await settle(page); await sentinel(page, run);
    }, page);
    await functional(page, run, base);
    if (mode === 'candidate') await navigation(page, run);
    await check(run.id + '-diagnostics-no-new-errors', async () => {
      run.diagnosticSignatures = diagnosticSignatures(run);
      if (base) assert.deepEqual(run.diagnosticSignatures, base.diagnosticSignatures, 'No added console, request, HTTP or page errors versus actual original');
      if (mode === 'blocked') assert(run.intentionalNavFailure.requests.length > 0, 'The expected aborted module request is recorded');
      assert.equal(run.diagnostics.requests.some(r => /catalog\/v1\/tools\.json/.test(r.url)), false, 'Pinned nav never fetches a remote catalog');
    }, page);
  } catch (e) { fail(run.id + '-setup-or-run', e); await screenshot(page, run.id + '-fatal').catch(() => {}); }
  finally { await context.close(); save(); }
  return run;
}
(async () => {
  try {
    assert(BASE_ROOT, 'BASE_ROOT must point at a git archive of the immutable original commit');
    assert.equal(process.env.BASE_SHA || BASE_SHA, BASE_SHA);
    const { chromium } = require('playwright'); assert.equal(require('playwright/package.json').version, PIN, 'Use exactly the pinned QA-only Playwright version');
    report.sources.baseline = source(BASE_ROOT); report.sources.candidate = source(ROOT); report.worktree = git(['status', '--short']);
    for (const file of ORIGINAL_FILES) assert.equal(sha(fs.readFileSync(path.join(BASE_ROOT, file))), sha(execFileSync('git', ['-C', ROOT, 'show', BASE_SHA + ':' + file])), 'Immutable baseline file: ' + file);
    for (const file of ORIGINAL_FILES.filter(f => f !== 'index.html')) assert.equal(sha(fs.readFileSync(path.join(ROOT, file))), sha(fs.readFileSync(path.join(BASE_ROOT, file))), 'Calculator source unchanged: ' + file);
    save();
    browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } : {}) });
    report.chromiumVersion = browser.version();
    const original = await serve(BASE_ROOT), candidate = await serve(ROOT);
    for (const file of ['index.html', 'styles.css', 'app.js', 'optimizer.js', 'job-profiles.js', 'job-bonus-data.js', NAV_PATH, 'assets/ro-suite/integration.css']) {
      const r = await fetch(candidate.origin + PREFIX + file);
      const response = { path: PREFIX + file, status: r.status, sha256: sha(Buffer.from(await r.arrayBuffer())) };
      report.releaseAssetHttp.push(response); assert.equal(response.status, 200, 'Real subpath resource: ' + file); assert.equal(response.sha256, sha(fs.readFileSync(path.join(ROOT, file))));
    }
    for (const width of FIXTURE.widths) for (const preference of FIXTURE.systemColorSchemes) {
      const base = await runOne(original, 'baseline', width, preference, null);
      await runOne(candidate, 'candidate', width, preference, base);
      await runOne(candidate, 'blocked', width, preference, base);
    }
  } catch (e) { fail('runner', e); }
  finally {
    if (browser) await browser.close(); await Promise.all(servers.map(s => new Promise(resolve => s.close(resolve))));
    report.status = report.failures.length ? 'failed' : 'passed'; save();
    console.log(JSON.stringify({ status: report.status, checks: report.checks.length, failures: report.failures.length, output: OUTPUT }));
    if (report.failures.length) process.exitCode = 1;
  }
})();
