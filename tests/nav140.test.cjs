'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p)),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const baseline=JSON.parse(read('qa/nav140/baseline.json')),html=require('../qa/nav150/normalize.cjs')(require('../qa/readability/normalize.cjs')(read('index.html').toString())),normalize=require('../qa/nav140/normalize.cjs');
test('nav140 reverses exactly to untouched latest main, preserving every original app/first-run byte',()=>{
 assert.equal(hash(normalize(html)),baseline.files['index.html']);
 for(const [file,expected]of Object.entries(baseline.files))if(!baseline.allowedModifiedFiles.includes(file))assert.equal(hash(read(file)),expected,file);
 for(const [before,after]of JSON.parse(read('qa/nav140/changes.json'))){assert.equal(html.split(after).length-1,1,after);assert.notEqual(before,after);}
 assert.throws(()=>normalize(html.replace('./assets/ro-suite/nav140-host.css','./assets/ro-suite/unapproved.css')),'normalizer must reject an unrelated stylesheet edit');
});
test('nav140 exact immutable source bundle, catalog and lock; old releases remain frozen',()=>{
 const dir='assets/ro-suite/1.4.0/';assert.deepEqual(fs.readdirSync(path.join(root,dir)).sort(),Object.keys(baseline.release).sort());
 for(const [file,expected]of Object.entries(baseline.release))assert.equal(hash(read(dir+file)),expected,file);
 const lock=JSON.parse(read(dir+'nav.lock.json'));assert.equal(lock.bundleVersion,'1.4.0');assert.equal(lock.sourceCommit,'24ca1068c8f6868b38d6224e661f818fec9897f9');
 for(const [file,entry]of Object.entries(lock.files))assert.equal(hash(read(dir+file)),entry.sha256,file);
 assert.deepEqual(JSON.parse(read(dir+'catalog.snapshot.json')),JSON.parse(read('assets/ro-suite/1.3.0/catalog.snapshot.json')),'same IDs, destinations, identities and planned status');
 assert.equal((html.match(/assets\/ro-suite\/1\.4\.1\/nav\.js/g)||[]).length,1);assert(!html.includes('assets/ro-suite/1.3.0/nav.js'));
});
test('nav140 host CSS is scoped and derives the real app shell without altering app CSS',()=>{
 const css=read('assets/ro-suite/nav140-host.css').toString();
 for(const m of css.replace(/\/\*[\s\S]*?\*\//g,'').matchAll(/([^{}]+)\{/g)){const selector=m[1].trim();if(selector.startsWith('@media'))continue;assert.match(selector,/^ro-suite-nav(?:\[tool-id="dim-glacier"\]|\.best-status-suite-nav)(?:\s*>\s*nav(?:\s*>\s*a)?)?$/);}
 assert.match(css,/min-height: 52px/);assert.match(css,/min-height: 44px/);assert.match(css,/box-sizing: border-box/);
 assert.match(css,/--ro-suite-content-max-width:/);assert.match(css,/--ro-suite-inline-padding:/);
 assert.equal((html.match(/<ro-suite-nav\b/g)||[]).length,1);assert.match(html,/<nav aria-label="เครื่องมือ RO">/);assert.match(html,/href="https:\/\/econds.github.io\/ro_tools_portal\/">กลับ RO Tools Portal<\/a>/);
 if(baseline.repository.endsWith('/ro-best-status')){assert.match(html,/<ro-suite-nav class="best-status-suite-nav"/);assert.match(html,/<header class="site-header shell">/);for(const v of ['1392px','1488px','48px','30px','22px','16px'])assert(css.includes(v));assert.match(css,/padding-top: 0/);}else{assert.match(css,/1400px/);assert.match(css,/--ro-suite-inline-padding: 0px/);assert.match(html,/padding: 20px;/);}
});
test('nav140 QA is pinned, same-repository read-only PR validation without publication',()=>{
 const w=read('.github/workflows/nav140-qa.yml').toString();assert.match(w,/permissions:\n  contents: read/);assert.match(w,/github.head_ref == 'chore\/ro-suite-nav-1.4.0'/);assert.match(w,/github.event.pull_request.head.repo.full_name == github.repository/);assert.match(w,/persist-credentials: false/);assert.match(w,/ref: \$\{\{ github.event.pull_request.head.sha \}\}/);assert.match(w,/playwright@1.55.1/);
 assert(!/pull_request_target|workflow_run|workflow_dispatch|(?:contents|pages|id-token):\s*write|write-all|git\s+push|gh\s+pr\s+merge|deploy-pages|upload-pages-artifact|secrets\./.test(w));for(const m of w.matchAll(/uses:\s*([^\s#]+)/g))assert.match(m[1],/^[^@]+@[a-f0-9]{40}$/);
});

test('1.4.1 accessibility patch is exact and keeps the 1.4.0 release immutable',()=>{
 const dir='assets/ro-suite/1.4.1/';assert.deepEqual(fs.readdirSync(path.join(root,dir)).sort(),Object.keys(baseline.patchRelease).sort());
 for(const [file,expected]of Object.entries(baseline.patchRelease))assert.equal(hash(read(dir+file)),expected,file);
 const lock=JSON.parse(read(dir+'nav.lock.json'));assert.equal(lock.bundleVersion,'1.4.1');assert.equal(lock.sourceCommit,baseline.patchSourceCommit);assert.equal(lock.sourceCommit,'ac62659a26539d802111d255edb92b09ec68382b');
 for(const [file,entry]of Object.entries(lock.files))assert.equal(hash(read(dir+file)),entry.sha256,file);
 assert.deepEqual(read(dir+'catalog.snapshot.json'),read('assets/ro-suite/1.4.0/catalog.snapshot.json'));
 const bundle=read(dir+'nav.js').toString();assert(bundle.includes('p:empty{margin:0}'));assert(!bundle.includes('p:empty,[hidden]'));assert(bundle.includes('role'));
});
