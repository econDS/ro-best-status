/** iRO Wiki success models (checked 2026-09-30); stat costs/budgets from RO-help-tool.
 * Independently implemented exact score-indexed minimum-cost dynamic programming.
 */
export const STATS = Object.freeze(['STR', 'AGI', 'VIT', 'INT', 'DEX', 'LUK']);
export const ACTIVITIES = Object.freeze([
  {id:'rune', name:'สร้าง Rune', subtitle:'Rune Knight', formula:'30 + 2×Rune Mastery + DEX/30 + LUK/10 + Job/10 + Stone − Rank', constant:30, scale:30, weights:{DEX:1,LUK:3}},
  {id:'poison', name:'ทำยาแอส', subtitle:'Assassin Cross / Guillotine Cross', formula:'20 + DEX × 0.4 + LUK × 0.2', constant:20, scale:5, weights:{DEX:2,LUK:1}},
  {id:'potion', name:'ปรุงยา', subtitle:'Alchemist / Genetic', formula:'3×Prepare Potion + Potion Research + Instruction Change + Job/5 + DEX/10 + LUK/10 + INT/20 + Recipe', constant:0, scale:20, weights:{DEX:2,LUK:2,INT:1}},
].map(a=>Object.freeze({...a,weights:Object.freeze(a.weights)})));
const integer = (v, min, max, name) => {
  if (!Number.isSafeInteger(v) || v < min || v > max) throw new RangeError(`${name}: ต้องเป็นจำนวนเต็ม ${min}–${max}`);
  return v;
};
// Community documentation, not live-server verification. No crafting cap or rounding
// rule is documented on these source pages; this app optimizes the RAW formula.
export const FORMULA_SOURCES = Object.freeze({
  rune:'https://irowiki.org/wiki/Rune_Mastery',
  poison:'https://irowiki.org/wiki/Create_Deadly_Poison',
  potion:'https://irowiki.org/wiki/Potion_Creation',
  instruction:'https://irowiki.org/wiki/Instruction_Change',
});
export const RUNE_RECIPES = Object.freeze([
  ['turisus','Turisus',1,5], ['isia','Isia',2,10], ['pertz','Pertz',3,10],
  ['hagalas','Hagalas',4,5], ['asir','Asir',5,5], ['urj','Urj',6,15],
  ['rhydo','Rhydo',7,5], ['nosiege','Nosiege',8,15], ['verkana','Verkana',9,20],
  ['lux-anima','Lux Anima',10,20],
].map(([id,label,minSkill,penalty])=>Object.freeze({id,label,minSkill,penalty})));
export const POTION_RECIPES = Object.freeze([
  ['red','Red Potion',15,25],['yellow','Yellow Potion',15,25],['white','White Potion',15,25],
  ['alcohol','Alcohol',5,15],['acid','Acid Bottle',-5,5],['marine-sphere','Marine Sphere Bottle',-5,5],
  ['bottle-grenade','Bottle Grenade',-5,5],['plant','Plant Bottle',-5,5],
  ['blue','Blue Potion',-5,-5],['anodyne','Anodyne',-5,-5],['aloevera','Aloevera',-5,-5],
  ['embryo','Embryo',-5,-5],['elemental','Elemental Potion',-5,-5],['condensed-red','Condensed Red Potion',-5,-5],
  ['condensed-yellow','Condensed Yellow Potion',-10,-5],
  ['condensed-white','Condensed White Potion',-15,-5],['glistening-coat','Glistening Coat',-15,-5],
].map(([id,label,min,max])=>Object.freeze({id,label,min,max})));
export const FORMULA_DEFAULTS = Object.freeze({
  runeSkill:10,runeJob:70,runeStone:4,runeRecipe:'turisus',
  potionPharmacy:10,potionLearning:10,potionInstruction:0,potionJob:50,potionRecipe:'red',
});
function formulaConstant(id,input) {
  const f={...FORMULA_DEFAULTS,...input};
  if(id==='poison') return {min:20,max:20};
  if(id==='rune') {
    integer(f.runeSkill,1,10,'Rune Mastery'); integer(f.runeJob,1,70,'Rune Job Level');
    if(![4,8,15,30,60].includes(f.runeStone)) throw new RangeError('เลือก Rune Stone ที่ถูกต้อง');
    const recipe=RUNE_RECIPES.find(r=>r.id===f.runeRecipe);
    if(!recipe) throw new RangeError('เลือกชนิด Rune ที่ถูกต้อง');
    if(f.runeSkill<recipe.minSkill) throw new RangeError(`${recipe.label} ต้องใช้ Rune Mastery อย่างน้อย ${recipe.minSkill}`);
    const value=30+2*f.runeSkill+f.runeJob/10+f.runeStone-recipe.penalty;
    return {min:value,max:value};
  }
  integer(f.potionPharmacy,1,10,'Prepare Potion'); integer(f.potionLearning,5,10,'Potion Research');
  integer(f.potionInstruction,0,5,'Instruction Change'); integer(f.potionJob,1,70,'Potion Job Level');
  const recipe=POTION_RECIPES.find(r=>r.id===f.potionRecipe);
  if(!recipe) throw new RangeError('เลือกชนิด Potion ที่ถูกต้อง');
  const value=3*f.potionPharmacy+f.potionLearning+f.potionInstruction+f.potionJob/5;
  return {min:value+recipe.min,max:value+recipe.max};
}
export function upgradeCost(current) {
  integer(current,1,130,'Status');
  return current <= 99 ? Math.floor((current-1)/10)+2 : 4*Math.floor((current-100)/5)+16;
}
const cumulative = new Int32Array(131);
for(let s=2;s<=130;s++) cumulative[s]=cumulative[s-1]+upgradeCost(s-1);
export function totalPoints(level, transcended=false) {
  integer(level,1,200,'Base level');
  let points=transcended?100:48;
  for(let l=1;l<level;l++) points+=l<=99?Math.floor(l/5)+3:l<=150?Math.floor(l/10)+13:Math.floor((l-150)/7)+28;
  return points;
}
export function costOf(stats) {
  return STATS.reduce((sum,s)=>sum+cumulative[integer(stats[s],1,130,s)],0);
}
function activityById(id) {
  const activity=ACTIVITIES.find(a=>a.id===id);
  if(!activity) throw new RangeError('ไม่พบกิจกรรม');
  return activity;
}
export function successRange(id,stats,bonuses={},formula={}) {
  const a=activityById(id);
  let score=0;
  for(const [s,w] of Object.entries(a.weights)) {
    integer(stats[s],1,130,s);
    const bonus=bonuses[s]??0;
    if(!Number.isFinite(bonus)||Math.abs(bonus)>10000) throw new RangeError(`โบนัส ${s} ไม่ถูกต้อง`);
    score+=w*(stats[s]+bonus);
  }
  const range = formulaConstant(id,formula);
  return {min:range.min+score/a.scale,max:range.max+score/a.scale};
}
export function successRate(id,stats,bonuses={},formula={}) {
  return successRange(id,stats,bonuses,formula).min;
}
/** Optimize raw Wiki-model score, retaining all minimum stats (including irrelevant ones).
 * DP stores the minimum cost needed for each exact integer score increase.
 * Each stat is considered once with all legal final values, not all stat tuples.
 * Cost is convex but no greedy assumption is required. Fixed bonuses don't change argmax.
 * Ties: maximum raw score, minimum spent points, then deterministic first DP path.
 */
export function optimize({activity,budget,cap=99,base=Object.fromEntries(STATS.map(s=>[s,1])),bonuses={},formula={}}) {
  const a=activityById(activity);
  integer(cap,1,130,'Stat cap');
  integer(budget,0,1000000,'Budget');
  for(const s of STATS) integer(base[s],1,cap,s);
  const startingCost=costOf(base);
  if(startingCost>budget) throw new RangeError('แต้มไม่พอสำหรับ Status ปัจจุบัน');
  // Validate formula/bonuses even when no upgrades are affordable.
  successRange(activity,base,bonuses,formula);
  const entries=Object.entries(a.weights);
  const maxScore=entries.reduce((sum,[s,w])=>sum+(cap-base[s])*w,0);
  let dp=new Float64Array(maxScore+1).fill(Infinity); dp[0]=0;
  const paths=[];
  let reachableMax=0,operations=0;
  const available=budget-startingCost;
  for(const [stat,weight] of entries) {
    const next=new Float64Array(maxScore+1).fill(Infinity);
    const choices=new Int16Array(maxScore+1).fill(-1);
    const maxIncrement=cap-base[stat];
    for(let score=0;score<=reachableMax;score++) {
      if(!Number.isFinite(dp[score])) continue;
      for(let inc=0;inc<=maxIncrement;inc++) {
        operations++;
        const cost=dp[score]+cumulative[base[stat]+inc]-cumulative[base[stat]];
        if(cost>available) break;
        const target=score+weight*inc;
        if(cost<next[target]) { next[target]=cost; choices[target]=inc; }
      }
    }
    reachableMax+=maxIncrement*weight;
    dp=next; paths.push(choices);
  }
  let bestScore=maxScore;
  while(!Number.isFinite(dp[bestScore])) bestScore--;
  const stats={...base};
  let cursor=bestScore;
  for(let i=entries.length-1;i>=0;i--) {
    const [s,w]=entries[i],inc=paths[i][cursor];
    stats[s]+=inc; cursor-=inc*w;
  }
  const spent=startingCost+dp[bestScore];
  const range=successRange(activity,stats,bonuses,formula);
  return {stats,spent,remaining:budget-spent,rate:range.min,rateMax:range.max,score:bestScore,operations};
}
