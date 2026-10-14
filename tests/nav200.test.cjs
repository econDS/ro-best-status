'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto'),cp=require('node:child_process');
const read=f=>fs.readFileSync(f),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
test('raw v2 candidate preserves host bytes and all historical releases',()=>{
 const html=read('index.html').toString(),baseline=cp.execFileSync('git',['show','8c45e80f93afc15bf5a79280c4a3fc9018684af1:index.html'],{encoding:'utf8'});
 assert.equal(require('../qa/nav200/normalize.cjs')(html),baseline);
 assert.equal(html.split('./assets/ro-suite/2.0.0/nav.js').length-1,1);
 assert.match(html,/tool-id="best-status" theme="dark"/);assert(!html.includes('catalog-url='));
 for(const f of cp.execFileSync('git',['ls-tree','-r','--name-only','8c45e80f93afc15bf5a79280c4a3fc9018684af1','assets/ro-suite'],{encoding:'utf8'}).trim().split('\n'))assert.deepEqual(read(f),cp.execFileSync('git',['show','8c45e80f93afc15bf5a79280c4a3fc9018684af1:'+f]),f);
 for(const f of ['app.js','styles.css','optimizer.js','job-profiles.js','job-bonus-data.js','.github/workflows/pages.yml'])assert.deepEqual(f==='.github/workflows/pages.yml'?require('../qa/nav200/pages-normalize.cjs')(read(f)):read(f),cp.execFileSync('git',['show','8c45e80f93afc15bf5a79280c4a3fc9018684af1:'+f]),f);
});
test('installed immutable v2 files match release lock and automatic catalog contract',()=>{
 const dir='assets/ro-suite/2.0.0/',lock=JSON.parse(read(dir+'nav.lock.json'));assert.equal(lock.bundleVersion,'2.0.0');assert.match(lock.sourceCommit,/^[a-f0-9]{40}$/);
 for(const [f,entry] of Object.entries(lock.files))assert.equal(hash(read(dir+f)),entry.sha256);
 assert(read(dir+'nav.js').includes('https://econds.github.io/ro_tools_portal/catalog/v1/tools.json'));
 const w=read('.github/workflows/nav200-qa.yml').toString();assert(w.includes("github.head_ref == 'feat/dynamic-ro-suite-nav'"));assert(w.includes('contents: read'));assert(w.includes('persist-credentials: false'));assert(!/pull_request_target|(?:contents|pages|id-token):\s*write|deploy-pages/.test(w));
});

test('Pages checkout fetches provenance history and rejects any unrelated workflow delta',()=>{
 const bytes=read('.github/workflows/pages.yml'),normalize=require('../qa/nav200/pages-normalize.cjs');
 assert(bytes.includes('          fetch-depth: 0'));
 assert.deepEqual(normalize(bytes),cp.execFileSync('git',['show','8c45e80f93afc15bf5a79280c4a3fc9018684af1:.github/workflows/pages.yml']));
 assert.throws(()=>normalize(Buffer.from(bytes.toString().replace('fetch-depth: 0','fetch-depth: 1'))));
});
