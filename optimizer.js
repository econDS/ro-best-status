/** Source model: econDS/RO-help-tool @ 1cc20f489887228eec0ff5b91e4c5fe71c75961f.
 * Independently implemented exact score-indexed minimum-cost dynamic programming.
 */
export const STATS = Object.freeze(['STR', 'AGI', 'VIT', 'INT', 'DEX', 'LUK']);
export const ACTIVITIES = Object.freeze([
  {id:'rune', name:'สร้าง Rune', subtitle:'Rune Knight', formula:'69.4 + DEX ÷ 30 + LUK ÷ 10', constant:69.4, scale:30, weights:{DEX:1,LUK:3}},
  {id:'poison', name:'ทำยาแอส', subtitle:'Assassin Cross / Guillotine Cross', formula:'20 + DEX × 0.4 + LUK × 0.2', constant:20, scale:5, weights:{DEX:2,LUK:1}},
  {id:'potion', name:'ปรุงยา', subtitle:'Alchemist / Genetic', formula:'54 + DEX × 0.1 + LUK × 0.1 + INT × 0.05', constant:54, scale:20, weights:{DEX:2,LUK:2,INT:1}},
].map(a=>Object.freeze({...a,weights:Object.freeze(a.weights)})));
const integer = (v, min, max, name) => {
  if (!Number.isSafeInteger(v) || v < min || v > max) throw new RangeError(`${name}: ต้องเป็นจำนวนเต็ม ${min}–${max}`);
  return v;
};
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
export function successRate(id,stats,bonuses={}) {
  const a=activityById(id);
  let score=0;
  for(const [s,w] of Object.entries(a.weights)) {
    integer(stats[s],1,130,s);
    const bonus=bonuses[s]??0;
    if(!Number.isFinite(bonus)||Math.abs(bonus)>10000) throw new RangeError(`โบนัส ${s} ไม่ถูกต้อง`);
    score+=w*(stats[s]+bonus);
  }
  return a.constant+score/a.scale;
}
/** Optimize raw reference score, retaining all minimum stats (including irrelevant ones).
 * DP stores the minimum cost needed for each exact integer score increase.
 * Each stat is considered once with all legal final values, not all stat tuples.
 * Cost is convex but no greedy assumption is required. Fixed bonuses don't change argmax.
 * Ties: maximum raw score, minimum spent points, then deterministic first DP path.
 */
export function optimize({activity,budget,cap=99,base=Object.fromEntries(STATS.map(s=>[s,1])),bonuses={}}) {
  const a=activityById(activity);
  integer(cap,1,130,'Stat cap');
  integer(budget,0,1000000,'Budget');
  for(const s of STATS) integer(base[s],1,cap,s);
  const startingCost=costOf(base);
  if(startingCost>budget) throw new RangeError('แต้มไม่พอสำหรับ Status ปัจจุบัน');
  // Validate formula/bonuses even when no upgrades are affordable.
  successRate(activity,base,bonuses);
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
  return {stats,spent,remaining:budget-spent,rate:successRate(activity,stats,bonuses),score:bestScore,operations};
}
