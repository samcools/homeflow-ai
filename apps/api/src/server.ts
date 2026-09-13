import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { projects, auditLog } from './data.js';
import { executiveBrief, groundedAnswer, projectDrivers } from './insights.js';

const app = express();
const port = Number(process.env.PORT || 8080);
app.disable('x-powered-by');
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:5173'] }));
app.use(express.json({ limit: '2mb' }));

const spendPct = (p: (typeof projects)[number]) => Math.round(p.expenditure / p.budget * 100);
const divergence = (p: (typeof projects)[number]) => spendPct(p) - p.physicalProgress;

app.get('/api/health', (_req,res) => res.json({ ok: true, service: 'homeflow-api', version: '0.3.0' }));
app.get('/api/projects', (req,res) => {
  const status = String(req.query.status || '');
  const province = String(req.query.province || '');
  res.json(projects.filter(p => (!status || p.status === status) && (!province || p.province === province)));
});
app.get('/api/projects/:id', (req,res) => {
  const p = projects.find(x => x.id === req.params.id);
  if (!p) return res.status(404).json({ error: 'Project not found' });
  res.json({ ...p, drivers: projectDrivers(p), spendPct: spendPct(p), divergence: divergence(p) });
});
app.get('/api/dashboard', (_req,res) => {
  const budget = projects.reduce((s,p)=>s+p.budget,0); const expenditure = projects.reduce((s,p)=>s+p.expenditure,0);
  res.json({
    totalProjects: projects.length,
    critical: projects.filter(p=>p.status==='Critical').length,
    atRisk: projects.filter(p=>p.status==='At Risk').length,
    watch: projects.filter(p=>p.status==='Watch').length,
    onTrack: projects.filter(p=>p.status==='Healthy').length,
    completed: projects.filter(p=>p.status==='Completed').length,
    unitsPlanned: projects.reduce((s,p)=>s+p.unitsPlanned,0),
    unitsCompleted: projects.reduce((s,p)=>s+p.unitsCompleted,0),
    budget,
    expenditure,
    overdueMilestones: projects.reduce((s,p)=>s+p.overdueMilestones,0),
    openRisks: projects.reduce((s,p)=>s+p.openRisks,0),
    averagePhysicalProgress: Math.round(projects.reduce((s,p)=>s+p.physicalProgress,0)/projects.length),
    highDivergenceProjects: projects.filter(p=>divergence(p)>15).length
  });
});

app.get('/api/contractors', (_req,res) => {
  const grouped = new Map<string, typeof projects>();
  for (const p of projects) grouped.set(p.contractor, [...(grouped.get(p.contractor) ?? []), p]);
  res.json([...grouped.entries()].map(([name, ps]) => ({
    name,
    projects: ps.length,
    criticalProjects: ps.filter(p=>p.status==='Critical').length,
    atRiskProjects: ps.filter(p=>p.status==='At Risk').length,
    averageHealth: Math.round(ps.reduce((s,p)=>s+p.healthScore,0)/ps.length),
    overdueMilestones: ps.reduce((s,p)=>s+p.overdueMilestones,0),
    unitsCompleted: ps.reduce((s,p)=>s+p.unitsCompleted,0),
    performanceContext: ps.some(p=>p.healthScore<60) ? 'Review project performance' : 'No material exception in demo data'
  })));
});

app.get('/api/recovery', (_req,res) => {
  res.json(projects.flatMap(p => p.recoveryActions.map(a => ({...a, projectId:p.id, projectName:p.name, healthScore:p.healthScore, projectStatus:p.status }))));
});

app.get('/api/risks', (_req,res) => {
  res.json(projects.filter(p=>p.openRisks>0).map(p => ({
    projectId:p.id,
    projectName:p.name,
    province:p.province,
    municipality:p.municipality,
    openRisks:p.openRisks,
    status:p.status,
    healthScore:p.healthScore,
    primaryBlocker:p.primaryBlocker,
    rootCauses:p.rootCauses,
    evidenceAgeDays:p.evidenceAgeDays,
    financialPhysicalDivergence:divergence(p)
  })));
});

app.get('/api/stalled', (_req,res) => {
  const candidates = projects.filter(p=>p.evidenceAgeDays>30 || (p.healthScore<35 && p.trend==='deteriorating'));
  res.json(candidates.map(p=>({
    projectId:p.id,
    projectName:p.name,
    municipality:p.municipality,
    reason: p.evidenceAgeDays>30 ? `No current evidence for ${p.evidenceAgeDays} days` : 'Critical health score and deteriorating trend',
    classification:'Potentially stalled — review required',
    humanConfirmationRequired:true
  })));
});

app.get('/api/what-changed/:id', (req,res) => {
  const p = projects.find(x=>x.id===req.params.id);
  if(!p) return res.status(404).json({error:'Project not found'});
  const changes = [
    p.trend==='deteriorating' ? 'Delivery trend is deteriorating.' : p.trend==='improving' ? 'Delivery trend is improving.' : 'Delivery trend is stable.',
    p.overdueMilestones ? `${p.overdueMilestones} milestones are currently overdue.` : 'No overdue milestones are recorded.',
    divergence(p)>15 ? `Financial-to-physical progress divergence is ${divergence(p)} percentage points.` : `Financial-to-physical progress divergence is ${divergence(p)} percentage points and is not above the demo alert threshold.`,
    p.evidenceAgeDays>14 ? `Site evidence is ${p.evidenceAgeDays} days old and needs review.` : `Site evidence age is ${p.evidenceAgeDays} days.`
  ];
  res.json({ projectId:p.id, generatedAt:new Date().toISOString(), changes, note:'Comparison uses the current synthetic demo snapshot; connect historical reporting periods for production trend analysis.' });
});

app.get('/api/audit', (_req,res) => res.json(auditLog));
app.get('/api/executive-brief', (_req,res) => res.json(executiveBrief()));

const askSchema = z.object({ question: z.string().min(2).max(1000), projectId: z.string().optional() });
app.post('/api/ai/copilot', (req,res) => {
  const parsed = askSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid request' });
  res.json({ ...groundedAnswer(parsed.data.question, parsed.data.projectId), humanReviewRequired: true, generatedAt: new Date().toISOString() });
});

const actionSchema = z.object({ action: z.string().min(2), projectId: z.string(), payload: z.record(z.any()).optional(), confirmed: z.boolean().default(false) });
app.post('/api/actions', (req,res) => {
  const parsed = actionSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid action request' });
  if (!parsed.data.confirmed) return res.status(409).json({ confirmationRequired: true, message: `Confirm ${parsed.data.action} for ${parsed.data.projectId}.` });
  res.json({ ok: true, demo: true, action: parsed.data.action, projectId: parsed.data.projectId, message: 'Demo action recorded. Connect an authenticated production datastore and workflow engine before operational use.' });
});

// Serve the built React application from the same origin in deployed environments.
const webDist = path.resolve(process.cwd(), 'apps/web/dist');
if (existsSync(webDist)) {
  app.use(express.static(webDist, { maxAge: '1h' }));
  app.use((req,res,next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api/')) return res.sendFile(path.join(webDist, 'index.html'));
    next();
  });
}

app.use((_req,res) => res.status(404).json({ error: 'Not found' }));
app.listen(port, () => console.log(`HomeFlow API listening on ${port}`));
