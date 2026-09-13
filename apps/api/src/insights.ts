import { projects as allProjects, type Project } from './data.js';

const pct=(n:number)=>`${Math.round(n)}%`;
const spendPct=(p:Project)=>p.expenditure/p.budget*100;
const gap=(p:Project)=>Math.round(spendPct(p)-p.physicalProgress);

export function projectDrivers(p:Project){
  const drivers:string[]=[]; const spend=spendPct(p); const variance=spend-p.physicalProgress;
  if(variance>15)drivers.push(`Expenditure (${pct(spend)}) is ${Math.round(variance)} points ahead of verified physical progress (${pct(p.physicalProgress)}).`);
  if(p.plannedProgress-p.physicalProgress>10)drivers.push(`Physical delivery is ${Math.round(p.plannedProgress-p.physicalProgress)} points behind the approved plan.`);
  if(p.overdueMilestones)drivers.push(`${p.overdueMilestones} overdue milestone${p.overdueMilestones===1?'':'s'}.`);
  if(p.evidenceAgeDays>14)drivers.push(`Latest site evidence is ${p.evidenceAgeDays} days old.`);
  if(p.openRisks>4)drivers.push(`${p.openRisks} open risks require active management.`);
  if(p.primaryBlocker&&!p.primaryBlocker.startsWith('None'))drivers.push(`Primary blocker: ${p.primaryBlocker}.`);
  return drivers.length?drivers:['No material exception detected in the current demo data.'];
}

export function executiveBrief(portfolio:Project[]=allProjects){
  const critical=portfolio.filter(p=>p.status==='Critical'); const atRisk=portfolio.filter(p=>p.status==='At Risk'); const units=portfolio.reduce((s,p)=>s+p.unitsCompleted,0);
  const priorities=[...portfolio].filter(p=>p.status!=='Completed').sort((a,b)=>a.healthScore-b.healthScore).slice(0,6);
  return {
    summary:`${critical.length} critical and ${atRisk.length} at-risk projects require management attention. ${units.toLocaleString()} housing units are recorded as completed across the visible portfolio.`,
    priorities:priorities.map(p=>({id:p.id,name:p.name,score:p.healthScore,status:p.status,province:p.province,reason:projectDrivers(p)[0]})),
    decisions:priorities.slice(0,3).map(p=>`Review the recovery path for ${p.name}: ${p.primaryBlocker}.`),
    note:'Demo-data briefing. AI recommendations require accountable official review.'
  };
}

function contractorSummary(portfolio:Project[]){
  const grouped=new Map<string,Project[]>();
  for(const p of portfolio)grouped.set(p.contractor,[...(grouped.get(p.contractor)||[]),p]);
  return [...grouped.entries()].map(([name,list])=>({name,score:Math.round(list.reduce((s,p)=>s+p.healthScore,0)/list.length),critical:list.filter(p=>p.status==='Critical').length,atRisk:list.filter(p=>p.status==='At Risk').length,projects:list.length})).sort((a,b)=>a.score-b.score);
}

export function groundedAnswer(question:string,projectId?:string,portfolio:Project[]=allProjects){
  const q=question.toLowerCase(); const current=projectId?portfolio.find(p=>p.id===projectId):undefined;
  if(current&&(q.includes('why')||q.includes('risk')||q.includes('delayed')||q.includes('failing')||q.includes('score')))return {answer:`${current.name} is ${current.status.toLowerCase()} with a health score of ${current.healthScore}/100. ${projectDrivers(current).join(' ')}`,confidence:current.confidence,sources:[current.id]};
  if(current&&(q.includes('what should')||q.includes('next action')||q.includes('recommend')||q.includes('recovery'))){const actions=current.recoveryActions.length?current.recoveryActions.map(a=>`${a.title} — owner ${a.owner}, ${a.status.toLowerCase()}, due ${a.due}`).join('; '):`Address the primary blocker (${current.primaryBlocker}), confirm accountable ownership and validate the next milestone against current site evidence.`;return {answer:`Recommended delivery focus for ${current.name}: ${actions} Human approval remains required before consequential project changes.`,confidence:.9,sources:[current.id]};}
  if(current&&(q.includes('status')||q.includes('progress')||q.includes('how is'))){return {answer:`${current.name}: ${current.status}, health ${current.healthScore}/100, ${current.physicalProgress}% physical progress versus ${pct(spendPct(current))} expenditure, ${current.overdueMilestones} overdue milestones, ${current.openRisks} open risks, and forecast completion ${current.forecastCompletion}.`,confidence:.97,sources:[current.id]};}
  if(q.includes('attention')||q.includes('priority')){const top=[...portfolio].filter(p=>p.status!=='Completed').sort((a,b)=>a.healthScore-b.healthScore).slice(0,5);return {answer:`Priority today: ${top.map(p=>`${p.name} (${p.status}, ${p.healthScore}/100)`).join('; ')}. ${top[0]?.name||'No project'} needs the earliest intervention because ${top[0]?projectDrivers(top[0])[0].toLowerCase():'no material exception is visible.'}`,confidence:.93,sources:top.map(p=>p.id)};}
  if(q.includes('critical')){const list=portfolio.filter(p=>p.status==='Critical');return {answer:`${list.length} critical projects are visible: ${list.slice(0,10).map(p=>`${p.name} (${p.healthScore}/100)`).join('; ')}.`,confidence:.98,sources:list.map(p=>p.id)};}
  if(q.includes('at risk')){const list=portfolio.filter(p=>p.status==='At Risk');return {answer:`${list.length} at-risk projects are visible: ${list.slice(0,10).map(p=>`${p.name} (${p.healthScore}/100)`).join('; ')}.`,confidence:.98,sources:list.map(p=>p.id)};}
  if(q.includes('contractor')){const x=contractorSummary(portfolio).slice(0,5);return {answer:`Contractors needing the closest delivery review are: ${x.map(v=>`${v.name} (average health ${v.score}/100; ${v.critical} critical; ${v.atRisk} at risk)`).join('; ')}. This is delivery-performance context, not a procurement sanction or blacklist.`,confidence:.9,sources:portfolio.filter(p=>x.some(v=>v.name===p.contractor)).map(p=>p.id)};}
  if(q.includes('budget')||q.includes('spent')||q.includes('expenditure')||q.includes('divergence')||q.includes('gap')){const worst=[...portfolio].sort((a,b)=>gap(b)-gap(a)).slice(0,5);return {answer:`Largest current financial-to-physical progress gaps: ${worst.map(p=>`${p.name} (${pct(spendPct(p))} expenditure vs ${pct(p.physicalProgress)} physical progress; ${gap(p)}-point gap)`).join('; ')}.`,confidence:.96,sources:worst.map(p=>p.id)};}
  if(q.includes('stalled')){const stalled=portfolio.filter(p=>p.evidenceAgeDays>30||(p.healthScore<35&&p.trend==='deteriorating'));return {answer:stalled.length?`${stalled.map(p=>p.name).join('; ')} meet the demo rules for “potentially stalled — review required”. Human review remains mandatory.`:'No visible project currently meets the demo stalled-project rules.',confidence:.88,sources:stalled.map(p=>p.id)};}
  if(q.includes('recovery')){const active=portfolio.flatMap(p=>p.recoveryActions.map(a=>({p,a})));return {answer:active.length?`${active.length} recovery actions are active. ${active.slice(0,8).map(({p,a})=>`${p.name}: ${a.title} (${a.status}, owner ${a.owner}, due ${a.due})`).join('; ')}.`:'No active recovery actions are recorded in the visible portfolio.',confidence:.95,sources:[...new Set(active.map(x=>x.p.id))]};}
  if(q.includes('overdue')&&q.includes('milestone')){const count=portfolio.reduce((s,p)=>s+p.overdueMilestones,0);const worst=[...portfolio].filter(p=>p.overdueMilestones>0).sort((a,b)=>b.overdueMilestones-a.overdueMilestones).slice(0,5);return {answer:`${count} milestones are overdue across the visible portfolio. The largest concentrations are ${worst.map(p=>`${p.name} (${p.overdueMilestones})`).join('; ')}.`,confidence:.99,sources:worst.map(p=>p.id)};}
  if(q.includes('open risk')||q.includes('how many risks')||q.includes('risk count')){const count=portfolio.reduce((s,p)=>s+p.openRisks,0);const worst=[...portfolio].sort((a,b)=>b.openRisks-a.openRisks).slice(0,5);return {answer:`${count} open risks are recorded across the visible portfolio. The highest current counts are ${worst.map(p=>`${p.name} (${p.openRisks})`).join('; ')}.`,confidence:.99,sources:worst.map(p=>p.id)};}
  if((q.includes('how many')||q.includes('completed'))&&(q.includes('complete')||q.includes('units')||q.includes('houses')||q.includes('homes'))){const units=portfolio.reduce((s,p)=>s+p.unitsCompleted,0);return {answer:`${units.toLocaleString()} housing units are recorded as completed in your visible HomeFlow portfolio.`,confidence:1,sources:portfolio.map(p=>p.id)};}
  const province=['gauteng','kwazulu-natal','limpopo','eastern cape','free state','western cape','mpumalanga','north west','northern cape'].find(name=>q.includes(name));
  if(province){const list=portfolio.filter(p=>p.province.toLowerCase()===province);const label=list[0]?.province||province;return {answer:`${label} has ${list.length} visible projects: ${list.filter(p=>p.status==='Critical').length} critical, ${list.filter(p=>p.status==='At Risk').length} at risk, and ${list.reduce((s,p)=>s+p.unitsCompleted,0).toLocaleString()} completed units. Average project health is ${list.length?Math.round(list.reduce((s,p)=>s+p.healthScore,0)/list.length):0}/100.`,confidence:.98,sources:list.map(p=>p.id)};}
  return {answer:current?`${current.name}: ask me about risk, budget, milestones, contractor performance, evidence, blockers, recovery actions, progress or what to do next.`:'I can answer questions about project health, priorities, provinces, contractors, budget-to-progress divergence, stalled-project signals, recovery actions, overdue milestones, completed units and open risks using the HomeFlow portfolio visible to your role.',confidence:.8,sources:current?[current.id]:[]};
}
