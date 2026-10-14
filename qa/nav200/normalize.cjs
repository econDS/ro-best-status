'use strict';
const assert=require('node:assert/strict');
module.exports=html=>{
  const after='./assets/ro-suite/2.0.0/nav.js', before='./assets/ro-suite/1.5.1/nav.js';
  if(!html.includes(after))return html;
  assert.equal(html.split(after).length-1,1,'exact approved v2 module path');
  assert(!html.includes(before),'no duplicate old module');
  return html.replace(after,before);
};
