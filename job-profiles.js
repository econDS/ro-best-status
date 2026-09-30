/** Job bonuses are current-class bonuses, not sums of previous job classes.
 * Per-level tables and provenance are kept in job-bonus-data.js.
 */
import {STATS,totalPoints,costOf} from './optimizer.js';
import {JOB_BONUS_DATA} from './job-bonus-data.js';
const DEFINITIONS=[
  {id:'rune-knight',activity:'rune',name:'Rune Knight',minBase:99,maxBase:200,cap:130,forceTrans:null},
  {id:'guillotine-cross',activity:'poison',name:'Guillotine Cross',minBase:99,maxBase:200,cap:130,forceTrans:null},
  {id:'assassin-cross',activity:'poison',name:'Assassin Cross',minBase:1,maxBase:99,cap:99,forceTrans:true},
  {id:'genetic',activity:'potion',name:'Genetic',minBase:99,maxBase:200,cap:130,forceTrans:null},
  {id:'creator',activity:'potion',name:'Creator / Biochemist',minBase:1,maxBase:99,cap:99,forceTrans:true},
  {id:'alchemist',activity:'potion',name:'Alchemist',minBase:1,maxBase:99,cap:99,forceTrans:false},
];
export const JOB_PROFILES=Object.freeze(DEFINITIONS.map(p=>Object.freeze({...p,
  maxJob:JOB_BONUS_DATA[p.id].maxJob,
  sourceNote:JOB_BONUS_DATA[p.id].sourceNote,
  wikiThrough:p.id==='genetic'?60:p.id==='guillotine-cross'?65:JOB_BONUS_DATA[p.id].maxJob,
  sourceUrl:JOB_BONUS_DATA[p.id].sourceUrls[0],
})));
export const DEFAULT_PROFILES=Object.freeze({
  rune:Object.freeze({classId:'rune-knight',jobLevel:Math.min(70,JOB_BONUS_DATA['rune-knight'].maxJob)}),
  poison:Object.freeze({classId:'guillotine-cross',jobLevel:Math.min(70,JOB_BONUS_DATA['guillotine-cross'].maxJob)}),
  potion:Object.freeze({classId:'genetic',jobLevel:Math.min(50,JOB_BONUS_DATA.genetic.maxJob)}),
});
function getProfile(classId) {
  const profile=JOB_PROFILES.find(p=>p.id===classId);
  if(!profile)throw new RangeError('ไม่พบอาชีพที่รองรับ');
  return profile;
}
export function jobBonuses(classId,jobLevel) {
  const p=getProfile(classId);
  if(!Number.isInteger(jobLevel)||jobLevel<1||jobLevel>p.maxJob) throw new RangeError(`${p.name}: Job Level ต้องเป็นจำนวนเต็ม 1–${p.maxJob}`);
  const events=JOB_BONUS_DATA[classId].events;
  return Object.fromEntries(STATS.map(s=>[s,events[s].filter(level=>level<=jobLevel).length]));
}
export function combineBonuses(equipment={},job={}) {
  return Object.fromEntries(STATS.map(s=>{
    const a=equipment[s]??0,b=job[s]??0;
    if(!Number.isFinite(a)||!Number.isFinite(b)||Math.abs(a)>10000||Math.abs(b)>10000)throw new RangeError(`โบนัส ${s} ไม่ถูกต้อง`);
    return [s,a+b];
  }));
}
export function resolveProfile({activity,classId,jobLevel,level,transcended=false,budgetOverride=null,base}) {
  const profile=getProfile(classId);
  if(profile.activity!==activity)throw new RangeError('อาชีพนี้ไม่รองรับกิจกรรมที่เลือก');
  if(!Number.isInteger(level)||level<profile.minBase||level>profile.maxBase)throw new RangeError(`${profile.name}: Base Level ต้องอยู่ในช่วง ${profile.minBase}–${profile.maxBase}`);
  const bonuses=jobBonuses(classId,jobLevel);
  for(const s of STATS)if(!Number.isInteger(base[s])||base[s]<1||base[s]>profile.cap)throw new RangeError(`${profile.name}: Base ${s} ต้องอยู่ในช่วง 1–${profile.cap}`);
  const isTranscended=profile.forceTrans===null?Boolean(transcended):profile.forceTrans;
  const budget=budgetOverride===null?totalPoints(level,isTranscended):budgetOverride;
  if(!Number.isSafeInteger(budget)||budget<0||budget>1000000)throw new RangeError('แต้มรวมต้องเป็นจำนวนเต็ม 0–1,000,000');
  if(costOf(base)>budget)throw new RangeError(`${profile.name}: แต้มไม่พอสำหรับสเตตัสปัจจุบัน`);
  const bonusCaution=jobLevel>profile.wikiThrough || (classId==='assassin-cross' && jobLevel<3);
  const bonusSourceUrl=JOB_BONUS_DATA[classId].sourceUrls[bonusCaution?1:0];
  const bonusSourceNote=bonusCaution?profile.sourceNote:'โบนัสระดับนี้ตรงกับตาราง iRO Wiki ที่ตรวจเทียบ';
  return {profile,jobBonuses:bonuses,cap:profile.cap,budget,transcended:isTranscended,bonusCaution,bonusSourceNote,bonusSourceUrl};
}
