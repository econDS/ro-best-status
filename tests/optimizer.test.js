import test from 'node:test';
import assert from 'node:assert/strict';
import {STATS,ACTIVITIES,totalPoints,upgradeCost,costOf,successRate,optimize} from '../optimizer.js';
const ones=()=>Object.fromEntries(STATS.map(s=>[s,1]));
test('source-table boundaries and budgets',()=>{
  for(const [stat,cost] of [[1,2],[10,2],[11,3],[90,10],[91,11],[99,11],[100,16],[104,16],[105,20],[129,36]]) assert.equal(upgradeCost(stat),cost);
  for(const [level,points] of [[1,48],[99,1273],[100,1295],[150,2545],[151,2573],[200,4099]]) {
    assert.equal(totalPoints(level),points);assert.equal(totalPoints(level,true),points+52);
  }
  assert.equal(costOf({...ones(),DEX:99}),628);
});
test('source formulas and constant stat bonuses',()=>{
  assert.equal(successRate('potion',ones()),54.25);
  assert.equal(successRate('poison',ones()),20.6);
  assert.ok(Math.abs(successRate('rune',ones())-69.53333333333333)<1e-12);
  const a=optimize({activity:'poison',budget:500});
  const b=optimize({activity:'poison',budget:500,bonuses:{DEX:20,LUK:10}});
  assert.deepEqual(a.stats,b.stats); assert.ok(Math.abs(b.rate-a.rate-10)<1e-12);
});
// Exhaustive oracle belongs ONLY in tests; production never enumerates stat tuples.
function oracle(activity,base,cap,budget){
  const a=ACTIVITIES.find(a=>a.id===activity),keys=Object.keys(a.weights);
  let best=-Infinity,minCost=Infinity;
  const walk=(i,stats)=>{
    if(i===keys.length){const cost=costOf(stats);if(cost>budget)return;
      const score=keys.reduce((n,s)=>n+a.weights[s]*(stats[s]-base[s]),0);
      if(score>best || (score===best&&cost<minCost)){best=score;minCost=cost;}return;}
    const key=keys[i];for(let v=base[key];v<=cap;v++)walk(i+1,{...stats,[key]:v});
  };walk(0,base);return{best,minCost};
}
test('exact agreement with exhaustive oracle for all small budgets, caps and activities',()=>{
  for(const a of ACTIVITIES) for(const cap of [2,4,7,11]) for(let budget=0;budget<=100;budget++) {
    const actual=optimize({activity:a.id,budget,cap}),expected=oracle(a.id,ones(),cap,budget);
    assert.equal(actual.score,expected.best,`${a.id}/${cap}/${budget}`);assert.equal(actual.spent,expected.minCost);
  }
});
test('current minima and irrelevant stats are preserved and charged',()=>{
  const base={STR:5,AGI:2,VIT:7,INT:3,DEX:4,LUK:2};
  for(const a of ACTIVITIES) for(let budget=costOf(base);budget<90;budget++) {
    const actual=optimize({activity:a.id,budget,cap:9,base}),expected=oracle(a.id,base,9,budget);
    assert.equal(actual.score,expected.best);assert.equal(actual.spent,expected.minCost);
    for(const s of STATS)assert.ok(actual.stats[s]>=base[s]);
  }
});
test('rune greedy counterexample',()=>{
  const result=optimize({activity:'rune',budget:162});
  assert.equal(result.score,131);assert.equal(result.spent,162);
});
test('no budget, saturated budgets, invalid inputs, deterministic ties',()=>{
  for(const a of ACTIVITIES){
    assert.deepEqual(optimize({activity:a.id,budget:0}).stats,ones());
    const result=optimize({activity:a.id,budget:1000000,cap:130});
    for(const s of Object.keys(a.weights)) assert.equal(result.stats[s],130);
    assert.equal(result.spent,costOf(result.stats));
    assert.deepEqual(result,optimize({activity:a.id,budget:1000000,cap:130}));
  }
  for(const budget of [-1,NaN,1.5,Infinity,1000001])assert.throws(()=>optimize({activity:'rune',budget}));
  assert.throws(()=>optimize({activity:'other',budget:50}));
  assert.throws(()=>optimize({activity:'potion',budget:1,base:{...ones(),STR:2}}));
  assert.throws(()=>optimize({activity:'poison',budget:10,bonuses:{DEX:NaN}}));
  assert.throws(()=>totalPoints(201)); assert.throws(()=>totalPoints(0));
});
