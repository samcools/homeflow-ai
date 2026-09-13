import { projects as allProjects, type Project } from './data.js';

const pct=(n:number)=>`${Math.round(n)}%`;
export function projectDrivers(p:Project){
  const drivers:string[]=[]; const spend=p.expenditure/p.budget*100; const gap=spend-p.physicalProgress;
  if(gap>15)drivers.push(`Expenditure (${pct(spend)}) is ${Math.round(gap)} points ahead of verified physical progress (${pct(p.physicalProgress)}).`);
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

export function groundedAnswer(question:string,projectId?:string,portfolio:Project[]=allProjects){
  const q=question.toLowerCase(); const current=projectId?portfolio.find(p=>p.id===projectId):undefined;
  if(current&&(q.includes('why')||q.includes('risk')||q.includes('delayed')||q.includes('failing')))return {answer:`${current.name} is ${current.status.toLowerCase()} with a health score of ${current.healthScore}/100. ${projectDrivers(current).join(' ')}`,confidence:current.confidence,sources:[current.id]};
  if(q.includes('attention')||q.includes('priority')){const top=[...portfolio].filter(p=>p.status!=='Completed').sort((a,b)=>a.healthScore-b.healthScore).slice(0,3);return {answer:`Priority today: ${top.map(p=>`${p.name} (${p.healthScore}/100)`).join('; ')}. ${top[0]?.name||'No project'} needs the earliest intervention because ${top[0]?projectDrivers(top[0])[0].toLowerCase():'no material exception is visible.'}`,confidence:.93,sources:top.map(p=>p.id)};}
  if(q.includes('contractor')){const risky=portfolio.filter(p=>p.healthScore<60).map(p=>`${p.contractor} on ${p.name}`);return {answer:`Contractors linked to current at-risk or critical projects include: ${risky.slice(0,8).join('; ')}. This is delivery-performance context, not a procurement sanction or blacklist.`,confidence:.9,sources:portfolio.filter(p=>p.healthScore<60).map(p=>p.id)};}
  if(q.includes('budget')||q.includes('spent')||q.includes('expenditure')){const worst=[...portfolio].sort((a,b)=>((b.expenditure/b.budget*100)-b.physicalProgress)-((a.expenditure/a.budget*100)-a.physicalProgress))[0];return {answer:worst?`${worst.name} has the largest current financial-to-physical progress gap: ${pct(worst.expenditure/worst.budget*100)} expenditure versus ${pct(worst.physicalProgress)} physical progress.`:'No project is visible in your current scope.',confidence:.96,sources:worst?[worst.id]:[]};}
  if(q.includes('stalled')){const stalled=portfolio.filter(p=>p.evidenceAgeDays>30||(p.healthScore<35&&p.trend==='deteriorating'));return {answer:stalled.length?`${stalled.map(p=>p.name).join('; ')} meet the demo rules for “potentially stalled — review required”. Human review remains mandatory.`:'No visible project currently meets the demo stalled-project rules.',confidence:.88,sources:stalled.map(p=>p.id)};}
  if(q.includes('how many')&&q.includes('complete')){const units=portfolio.reduce((s,p)=>s+p.unitsCompleted,0);return {answer:`${units.toLocaleString()} housing units are recorded as completed in your visible HomeFlow portfolio.`,confidence:1,sources:portfolio.map(p=>p.id)};}
  return {answer:current?`${current.name}: ask me about risk, budget, milestones, contractor performance, evidence, blockers, recovery actions or what changed.`:'I can analyse project health, priorities, provinces, contractors, budget-to-progress divergence, stalled-project signals and recovery actions using the HomeFlow portfolio visible to your role.',confidence:.8,sources:current?[current.id]:[]};
}
