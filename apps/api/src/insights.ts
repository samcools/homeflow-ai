import { projects, type Project } from './data.js';

const pct = (n: number) => `${Math.round(n)}%`;

export function projectDrivers(p: Project) {
  const drivers: string[] = [];
  const spendPct = p.expenditure / p.budget * 100;
  const divergence = spendPct - p.physicalProgress;
  if (divergence > 15) drivers.push(`Expenditure (${pct(spendPct)}) is ${Math.round(divergence)} points ahead of verified physical progress (${pct(p.physicalProgress)}).`);
  if (p.plannedProgress - p.physicalProgress > 10) drivers.push(`Physical delivery is ${Math.round(p.plannedProgress - p.physicalProgress)} points behind the approved plan.`);
  if (p.overdueMilestones) drivers.push(`${p.overdueMilestones} milestone${p.overdueMilestones === 1 ? '' : 's'} overdue.`);
  if (p.evidenceAgeDays > 14) drivers.push(`Latest site evidence is ${p.evidenceAgeDays} days old.`);
  if (p.openRisks > 4) drivers.push(`${p.openRisks} open risks require active management.`);
  if (p.primaryBlocker && p.primaryBlocker !== 'None' && p.primaryBlocker !== 'None material') drivers.push(`Primary blocker: ${p.primaryBlocker}.`);
  return drivers.length ? drivers : ['No material exception detected in the current demo data.'];
}

export function executiveBrief() {
  const critical = projects.filter(p => p.status === 'Critical');
  const atRisk = projects.filter(p => p.status === 'At Risk');
  const units = projects.reduce((s,p) => s + p.unitsCompleted, 0);
  return {
    summary: `${critical.length} critical and ${atRisk.length} at-risk projects require attention. ${units.toLocaleString()} housing units are recorded as completed across the demo portfolio.`,
    priorities: critical.map(p => ({ id: p.id, name: p.name, score: p.healthScore, reason: projectDrivers(p)[0] })),
    decisions: ['Resolve bulk services dependency on HF-102', 'Convene contractual recovery intervention for HF-144'],
    note: 'This is a demo-data briefing. AI recommendations require accountable official review.'
  };
}

export function groundedAnswer(question: string, projectId?: string) {
  const q = question.toLowerCase();
  const current = projectId ? projects.find(p => p.id === projectId) : undefined;
  if (current && (q.includes('why') || q.includes('risk') || q.includes('delayed') || q.includes('failing'))) {
    return { answer: `${current.id} is ${current.status.toLowerCase()} with a health score of ${current.healthScore}/100. ${projectDrivers(current).join(' ')}`, confidence: current.confidence, sources: [current.id] };
  }
  if (q.includes('attention') || q.includes('priority')) {
    const top = [...projects].filter(p => p.status !== 'Completed').sort((a,b) => a.healthScore - b.healthScore).slice(0,3);
    return { answer: `Priority today: ${top.map(p => `${p.id} (${p.healthScore}/100)`).join(', ')}. ${top[0].id} needs the earliest intervention because ${projectDrivers(top[0])[0].toLowerCase()}`, confidence: 0.93, sources: top.map(p=>p.id) };
  }
  if (q.includes('contractor')) {
    const risky = projects.filter(p => p.healthScore < 60).map(p => `${p.contractor} on ${p.id}`);
    return { answer: `Contractors associated with the current at-risk/critical projects are: ${risky.join('; ')}. This is project-performance context, not a procurement sanction or blacklist.`, confidence: 0.9, sources: projects.filter(p=>p.healthScore<60).map(p=>p.id) };
  }
  if (q.includes('budget') || q.includes('spent') || q.includes('expenditure')) {
    const worst = [...projects].sort((a,b) => ((b.expenditure/b.budget*100)-b.physicalProgress)-((a.expenditure/a.budget*100)-a.physicalProgress))[0];
    return { answer: `${worst.id} has the largest current financial-to-physical progress gap: ${pct(worst.expenditure/worst.budget*100)} expenditure versus ${pct(worst.physicalProgress)} physical progress.`, confidence: 0.96, sources: [worst.id] };
  }
  if (q.includes('stalled')) {
    const stalled = projects.filter(p => p.evidenceAgeDays > 30 || (p.healthScore < 35 && p.trend === 'deteriorating'));
    return { answer: `${stalled.map(p=>p.id).join(', ')} meet the demo rules for “potentially stalled — review required”. AI does not make the legal or contractual determination.`, confidence: 0.88, sources: stalled.map(p=>p.id) };
  }
  if (q.includes('how many') && q.includes('complete')) {
    const units = projects.reduce((s,p)=>s+p.unitsCompleted,0);
    return { answer: `${units.toLocaleString()} housing units are recorded as completed in the current demo dataset.`, confidence: 1, sources: projects.map(p=>p.id) };
  }
  return { answer: current ? `${current.id}: ${current.name}. Ask about risk, budget, milestones, contractor performance, evidence, blockers or recovery actions.` : 'I can analyse project health, priorities, budget-to-progress divergence, stalled-project signals, contractors and recovery actions using the current HomeFlow demo data.', confidence: 0.8, sources: current ? [current.id] : [] };
}
