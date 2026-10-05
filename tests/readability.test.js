import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),html=fs.readFileSync('index.html','utf8'),normalize=require('../qa/readability/normalize.cjs'),changes=require('../qa/readability/changes.json'),css=fs.readFileSync('qa/readability/readability.css','utf8');
test('only the reviewed readability delta; reversing it restores the previous page',()=>{
  for(const [b,a] of changes)assert.notEqual(b,a);
  const restored=normalize(html);assert.notEqual(restored,html);assert(!restored.includes('id="readability"'));
});
test('scripts and the stylesheet are untouched; one new style block, no animation',()=>{
  const scripts=h=>[...h.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)].map(m=>[m[1],m[2]]);
  const styles=h=>[...h.matchAll(/<style\b([^>]*)>([\s\S]*?)<\/style>/g)].map(m=>m[0]);
  assert.deepEqual(scripts(html),scripts(normalize(html)));
  assert.equal(styles(html).length,styles(normalize(html)).length+1);
  for(const s of styles(normalize(html)))assert(styles(html).includes(s));
  assert(!/@keyframes|animation:|transition:/.test(css));
});
test('readability floor: no content font-size below 12px, decorative caps labels at least 10px',()=>{
  const sizes=[...css.matchAll(/font-size:\s*(\d+(?:\.\d+)?)px/g)].map(m=>Number(m[1]));
  assert(sizes.length>0);assert(Math.min(...sizes)>=10);
  const ten=css.split('\n').filter(l=>/font-size: 10px/.test(l));
  assert.equal(ten.length,1,'only the decorative group uses 10px');
});
test('first-run links, cautions and calculator copy remain',()=>{
  assert(html.includes('href="#planner-form"')&&html.includes('href="#results-panel"'));
  assert(html.includes('สูตรปรุงยายังมีข้อโต้แย้ง')&&html.includes('ไม่ใช่อัตราสำเร็จที่ยืนยันจากเซิร์ฟเวอร์'));
  for(const a of ['rune','poison','potion','all'])assert(html.includes('name="first-activity" value="'+a+'"'));
  assert(!html.includes(' · <a href="#results-panel">'),'orphan separator removed');
});
