import test from 'node:test';
import assert from 'node:assert/strict';
import {STATS,optimize,totalPoints,successRate,FORMULA_DEFAULTS} from '../optimizer.js';
import {JOB_PROFILES,DEFAULT_PROFILES,jobBonuses,combineBonuses,resolveProfile} from '../job-profiles.js';
import {JOB_BONUS_DATA} from '../job-bonus-data.js';
const ones=()=>Object.fromEntries(STATS.map(s=>[s,1]));
const zeros=()=>Object.fromEntries(STATS.map(s=>[s,0]));
test('all source event boundaries add exactly one and persist at every job level',()=>{
  for(const p of JOB_PROFILES){
    const data=JOB_BONUS_DATA[p.id];
    for(const stat of STATS){
      assert.ok(Array.isArray(data.events[stat]));
      assert.deepEqual([...data.events[stat]].sort((a,b)=>a-b),data.events[stat]);
      assert.equal(new Set(data.events[stat]).size,data.events[stat].length);
      for(const level of data.events[stat])assert.ok(level>=1&&level<=p.maxJob);
    }
    let previous=zeros();
    for(let level=1;level<=p.maxJob;level++){
      const bonus=jobBonuses(p.id,level);
      for(const stat of STATS){
        assert.equal(bonus[stat]-previous[stat],data.events[stat].includes(level)?1:0,`${p.id}/${level}/${stat}`);
      }
      previous=bonus;
    }
    assert.deepEqual(previous,Object.fromEntries(STATS.map(s=>[s,data.events[s].length])));
    for(const invalid of [0,p.maxJob+1,1.5,NaN])assert.throws(()=>jobBonuses(p.id,invalid));
  }
});
test('independently verified max-job totals and job-one bonuses',()=>{
  assert.deepEqual(jobBonuses('alchemist',50),{STR:5,AGI:6,VIT:3,INT:7,DEX:9,LUK:0});
  assert.deepEqual(jobBonuses('creator',70),{STR:4,AGI:6,VIT:3,INT:7,DEX:14,LUK:11});
  assert.deepEqual(jobBonuses('rune-knight',70),{STR:6,AGI:6,VIT:7,INT:10,DEX:9,LUK:5});
  assert.equal(jobBonuses('alchemist',1).INT,1);assert.equal(jobBonuses('creator',1).DEX,1);assert.equal(jobBonuses('rune-knight',1).INT,1);
});
test('class-level budgets, stat caps and rebirth are per activity',()=>{
  const input={level:99,jobLevel:1,base:ones(),transcended:false};
  const alchemist=resolveProfile({...input,activity:'potion',classId:'alchemist'});
  const creator=resolveProfile({...input,activity:'potion',classId:'creator'});
  assert.equal(alchemist.budget,1273);assert.equal(creator.budget,1325);assert.equal(creator.cap,99);
  assert.equal(resolveProfile({...input,activity:'poison',classId:'assassin-cross'}).budget,1325);
  assert.equal(resolveProfile({...input,activity:'potion',classId:'alchemist',transcended:true}).budget,1273);
  assert.equal(resolveProfile({...input,activity:'rune',classId:'rune-knight',transcended:true}).budget,1325);
  assert.throws(()=>resolveProfile({...input,activity:'potion',classId:'alchemist',level:100}));
  assert.throws(()=>resolveProfile({...input,activity:'rune',classId:'rune-knight',level:98}));
  assert.throws(()=>resolveProfile({...input,activity:'potion',classId:'alchemist',base:{...ones(),DEX:100}}));
  assert.throws(()=>resolveProfile({...input,activity:'rune',classId:'alchemist'}));
  assert.equal(resolveProfile({...input,activity:'potion',classId:'creator',budgetOverride:200}).budget,200);
});
test('job bonuses and equipment are counted once; direct JobLevel term remains separate',()=>{
  const stats={...ones(),DEX:90,LUK:100,INT:50},gear={DEX:10,LUK:5,INT:3};
  const job=jobBonuses('rune-knight',70),total=combineBonuses(gear,job);
  assert.equal(total.DEX,19);assert.equal(total.LUK,10);
  const formula={...FORMULA_DEFAULTS,runeJob:70,runeStone:30,runeRecipe:'verkana'};
  const rate=successRate('rune',stats,total,formula);
  assert.ok(Math.abs(rate-(80+19/30+10/10))<1e-10);
  assert.ok(Math.abs(successRate('rune',stats,total,{...formula,runeJob:60})-rate+1)<1e-10);
  // Changing only the direct formula level doesn't secretly add any class bonus.
  assert.deepEqual(total,combineBonuses(gear,job));
});
test('fixed job bonuses change rates, not raw DP stat optimum, and classes do not leak',()=>{
  const base=ones(),gear={DEX:2};
  const a=optimize({activity:'potion',budget:1273,cap:130,base,bonuses:combineBonuses(gear,jobBonuses('genetic',1))});
  const b=optimize({activity:'potion',budget:1273,cap:130,base,bonuses:combineBonuses(gear,jobBonuses('genetic',50))});
  assert.deepEqual(a.stats,b.stats);assert.equal(a.spent,b.spent);assert.notEqual(a.rate,b.rate);
  const prior=jobBonuses('rune-knight',70);jobBonuses('creator',70);assert.deepEqual(jobBonuses('rune-knight',70),prior);
  for(const [activity,p]of Object.entries(DEFAULT_PROFILES))assert.equal(resolveProfile({activity,...p,level:99,transcended:false,base}).profile.id,p.classId);
});
test('source warning appears only for supplemented levels or active AGI discrepancy',()=>{
  const common={level:99,base:ones()};
  for(const [classId,activity,limit]of [['genetic','potion',60],['guillotine-cross','poison',65]]){
    assert.equal(resolveProfile({...common,activity,classId,jobLevel:limit}).bonusCaution,false);
    assert.equal(resolveProfile({...common,activity,classId,jobLevel:limit+1}).bonusCaution,true);
  }
  assert.equal(resolveProfile({...common,activity:'poison',classId:'assassin-cross',jobLevel:1}).bonusCaution,true);
  assert.equal(resolveProfile({...common,activity:'poison',classId:'assassin-cross',jobLevel:3}).bonusCaution,false);
});
test('supplemental event boundaries and complete class maxima stay explicit',()=>{
  assert.deepEqual(jobBonuses('genetic',70),{STR:5,AGI:6,VIT:8,INT:12,DEX:8,LUK:4});
  assert.deepEqual(jobBonuses('guillotine-cross',70),{STR:8,AGI:11,VIT:6,INT:5,DEX:9,LUK:4});
  assert.deepEqual(jobBonuses('assassin-cross',70),{STR:9,AGI:15,VIT:3,INT:0,DEX:10,LUK:8});
  assert.equal(jobBonuses('guillotine-cross',66).DEX,8);assert.equal(jobBonuses('guillotine-cross',67).DEX,9);
  assert.equal(jobBonuses('genetic',60).LUK,2);assert.equal(jobBonuses('genetic',61).LUK,3);assert.equal(jobBonuses('genetic',66).LUK,4);
});
