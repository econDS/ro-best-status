import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {STATS,optimize,successRange} from '../optimizer.js';
import {resolveProfile,combineBonuses} from '../job-profiles.js';
const root=new URL('../',import.meta.url);
const read=p=>readFileSync(new URL(p,root));
const json=p=>JSON.parse(read(p));
const hash=x=>createHash('sha256').update(x).digest('hex');
const baseline=json('qa/best-status-nav/source-baseline.json');
const html=read('index.html').toString();
const release='assets/ro-suite/1.3.0/';

test('original calculator, styles, data, tests, package and source limitations stay byte-identical',()=>{
  assert.equal(baseline.baseCommit,'cb6f4aa775e1afc8efc450b6d31cd5fb73f9fd74');
  assert.equal(baseline.originalTests.passed,16);
  for(const [path,expected] of Object.entries(baseline.files)){
    if(path!=='index.html')assert.equal(hash(read(path)),expected,path);
  }
  const original=html.replace('  <!-- RO suite navigation styles: isolated to the host and its fallback. -->\n  <link rel="stylesheet" href="./assets/ro-suite/integration.css">\n','')
    .replace(/  <!-- RO suite navigation: calculator remains independent if the module fails\. -->\n[\s\S]*?  <!-- End RO suite navigation\. -->\n/,'');
  assert.equal(hash(original),baseline.files['index.html'],'all original HTML remains in its original order');
});

test('four frozen calculator scenarios preserve all crafts, class Job bonuses and custom values',()=>{
  const fixture=json('qa/best-status-nav/calculator-baseline.json');
  assert.equal(fixture.sourceCommit,baseline.baseCommit);
  assert.equal(fixture.cases.length,4);
  const classes=new Set();
  for(const item of fixture.cases){const s=item.input;for(const [activity,p]of Object.entries(s.profiles)){
    classes.add(p.classId);
    const resolved=resolveProfile({activity,...p,level:s.level,transcended:s.transcended,budgetOverride:s.budgetOverride,base:s.base});
    const bonuses=combineBonuses(s.gear,resolved.jobBonuses);
    const formula={...s.formula,runeJob:s.profiles.rune.jobLevel,potionJob:s.profiles.potion.jobLevel};
    const actual={profile:{classId:p.classId,cap:resolved.cap,budget:resolved.budget,transcended:resolved.transcended,jobBonuses:resolved.jobBonuses,bonusCaution:resolved.bonusCaution},combinedBonuses:bonuses,current:successRange(activity,s.base,bonuses,formula),result:optimize({activity,budget:resolved.budget,cap:resolved.cap,base:s.mode==='reset'?Object.fromEntries(STATS.map(x=>[x,1])):s.base,bonuses,formula})};
    assert.deepEqual(actual,item.expected[activity],`${item.name}/${activity}`);
  }}
  assert.equal(classes.size,6);
});

test('navigation is pinned, correctly identified and isolated after skip link before original header',()=>{
  assert.equal((html.match(/<ro-suite-nav /g)||[]).length,1);
  assert.match(html,/<ro-suite-nav class="best-status-suite-nav shell" tool-id="best-status" theme="dark" portal-url="https:\/\/econds.github.io\/ro_tools_portal\/">/);
  assert.match(html,/<nav aria-label="เครื่องมือ RO"><a href="https:\/\/econds.github.io\/ro_tools_portal\/">กลับ RO Tools Portal<\/a><\/nav>/);
  assert.ok(html.indexOf('class="skip-link"')<html.indexOf('<ro-suite-nav '));
  assert.ok(html.indexOf('</ro-suite-nav>')<html.indexOf('<header class="site-header shell">'));
  assert.match(html,/<script type="module" src="\.\/assets\/ro-suite\/1\.3\.0\/nav\.js"><\/script>/);
  assert.doesNotMatch(html,/catalog-url=/,'local pinned snapshot does not depend on a remote catalog deployment');
  assert.match(read('styles.css').toString(),/color-scheme:dark/);
  const css=read('assets/ro-suite/integration.css').toString();
  for(const selector of css.replace(/\/\*[\s\S]*?\*\//g,'').matchAll(/([^{}]+)\{/g))assert.match(selector[1].trim(),/^ro-suite-nav\.best-status-suite-nav/);
  assert.match(css,/min-width: 44px/);assert.match(css,/min-height: 44px/);
  assert.match(read('.github/workflows/pages.yml').toString(),/cp -R assets public\//,'existing Pages packaging includes the reviewed local assets');
});

test('vendored release bytes and current identity match the recorded source provenance',()=>{
  const lock=json(release+'nav.lock.json');
  const provenance=json('qa/best-status-nav/navigation-provenance.json');
  assert.equal(lock.bundleVersion,'1.3.0');assert.match(lock.sourceCommit,/^[0-9a-f]{40}$/);
  assert.equal(lock.sourceCommit,provenance.sourceCommit);
  assert.equal(provenance.sourceRepository,'econDS/ro_tools_portal');
  for(const [path,entry]of Object.entries(lock.files))assert.equal(hash(read(release+path)),entry.sha256,path);
  for(const [path,expected]of Object.entries(provenance.sha256))assert.equal(hash(read(release+path)),expected,path);
  const snapshot=json(release+'catalog.snapshot.json');
  const current=snapshot.tools.filter(t=>t.id==='best-status');assert.equal(current.length,1);
  assert.deepEqual(current[0],{id:'best-status',title:'Best Status',canonicalUrl:'https://econds.github.io/ro-best-status/',listingStatus:'listed',identity:{accent:'#7047a8',icon:'gem'}});
  const planned=snapshot.tools.find(t=>t.id==='grade-refine');assert.equal(planned.listingStatus,'planned');assert.equal(planned.canonicalUrl,null);
  for(const id of ['leveling-map','reform-workshop','dim-glacier','ocean-week-guide'])assert.equal(snapshot.tools.find(t=>t.id===id)?.listingStatus,'listed');
  const bundle=read(release+'nav.js').toString();
  assert.doesNotMatch(bundle,/localStorage|sessionStorage|eval\(|new Function\(/);
  assert.match(bundle,/aria-current/);assert.match(bundle,/best-status/);
});
