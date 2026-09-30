import {performance} from 'node:perf_hooks';
import {ACTIVITIES,optimize,totalPoints} from '../optimizer.js';
const cases=ACTIVITIES.map(a=>({activity:a.id,budget:totalPoints(200,true),cap:130}));
for(let i=0;i<100;i++)for(const input of cases)optimize(input);
for(const input of cases){
  const runs=500,start=performance.now();let result;
  for(let i=0;i<runs;i++)result=optimize(input);
  console.log(`${input.activity}: ${((performance.now()-start)/runs).toFixed(3)}ms mean; ${result.operations} transitions; ${JSON.stringify(result.stats)}; raw ${result.rate.toFixed(6)}%`);
}
