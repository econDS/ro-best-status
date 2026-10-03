'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p)),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
test('nav150 public tokens map exactly to audited host colors and font',()=>{
 const audit=JSON.parse(read('qa/nav150/host-theme.json')),css=read('assets/ro-suite/theme-host.css').toString();
 assert.equal(Object.keys(audit.bindings).length,8);
 for(const [token,value]of Object.entries(audit.bindings))assert(css.includes(`--ro-suite-${token}: ${value};`));
 assert(!/::part|shadowRoot|!important/.test(css));assert(!/padding:|min-height:|max-width:|position:/.test(css));
 for(const token of ['text','accent','surface-hover','focus','font-family'])assert(css.includes(`var(--ro-suite-${token})`));
 for(const mode of Object.values(audit.modes)){for(const token of ['text','muted','accent'])assert(mode.minimum_contrast_against_surface_and_hover[token]>=4.5);assert(mode.minimum_contrast_against_surface_and_hover.focus>=3);}
});
test('nav150 exact pinned release integrity and unchanged catalog',()=>{
 const dir='assets/ro-suite/1.5.1/',lock=JSON.parse(read(dir+'nav.lock.json'));
 assert.equal(lock.bundleVersion,'1.5.1');assert.equal(lock.sourceCommit,'44b090748afc1dbf13eb5d4b78d2a0102d9d9e9c');
 for(const [file,entry]of Object.entries(lock.files))assert.equal(hash(read(dir+file)),entry.sha256);
 assert.deepEqual(read(dir+'catalog.snapshot.json'),read('assets/ro-suite/1.4.1/catalog.snapshot.json'));
 const html=read('index.html').toString();for(const [before,after]of JSON.parse(read('qa/nav150/changes.json'))){assert.equal(html.split(after).length-1,1);assert.notEqual(before,after);}
 const normalize=require('../qa/nav150/normalize.cjs');assert.throws(()=>normalize(html.replace('./assets/ro-suite/theme-host.css','./unapproved.css')));
});
test('theme QA runs on rollout draft PR with read-only permission',()=>{
 const w=read('.github/workflows/nav150-qa.yml').toString();assert(w.includes("github.head_ref == 'chore/ro-suite-nav-theme-rollout'"));assert(w.includes('contents: read'));assert(w.includes('persist-credentials: false'));assert(w.includes('first-run.browser.cjs'));assert(w.includes('1.5.0/*'));assert(!/pull_request_target|(?:contents|pages|id-token):\s*write|deploy-pages/.test(w));
});

test('original 1.5.0 release remains byte-identical',()=>{
 for(const [file,expected]of Object.entries({"catalog.snapshot.json": "a198338ddcb7857094ef950fb1315c532840cf53ac8e7a69b331d8cb4a87dd5d", "nav.js": "62ca63afac192896ff5c4e8d9d1ce7f93f85eeb394be87207e2e567220fc6b47", "nav.lock.json": "a5da4f2bc5a65b7828abe2aa5582117c9ddad78da894eb1f2f3bce8b7225978a"}))assert.equal(hash(read('assets/ro-suite/1.5.0/'+file)),expected);
});
