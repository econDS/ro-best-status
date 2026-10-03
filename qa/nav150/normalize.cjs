'use strict';
const assert=require('node:assert/strict');
const changes=require('./changes.json');
module.exports=html=>{
  if(!html.includes('./assets/ro-suite/1.5.1/nav.js'))return html;
  for(const [before,after]of [...changes].reverse()){
    assert.equal(html.split(after).length-1,1,'exact nav150 delta: '+after);
    html=html.replace(after,before);
  }
  return html;
};
