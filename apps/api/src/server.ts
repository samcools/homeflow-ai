import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { z } from 'zod';
import { projects, auditLog } from './data.js';
import { executiveBrief, groundedAnswer, projectDrivers } from './insights.js';

const app = express();
const port = Number(process.env.PORT || 8080);
app.disable('x-powered-by');
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:5173'] }));
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_req,res) => res.json({ ok: true, service: 'homeflow-api', version: '0.1.0' }));
app.get('/api/projects', (req,res) => {
  const status = String(req.query.status || '');
  const province = String(req.query.province || '');
  res.json(projects.filter(p => (!status || p.status === status) && (!province || p.province === province)));
});
app.get('/api/projects/:id', (req,res) => {
  const p = projects.find(x => x.id === req.params.id);
  if (!p) return res.status(404).json({ error: 'Project not found' });
  res.json({ ...p, drivers: projectDrivers(p), spendPct: Math.round(p.expenditure / p.budget * 100), divergence: Math.round(p.expenditure / p.budget * 100 - p.physicalProgress) });
});
app.get('/api/dashboard', (_req,res) => {
  const budget = projects.reduce((s,p)=>s+p.budget,0); const expenditure = projects.reduce((s,p)=>s+p.expenditure,0);
  res.json({
    totalProjects: projects.length,
    critical: projects.filter(p=>p.status==='Critical').length,
    atRisk: projects.filter(p=>p.status==='At Risk').length,
    onTrack: projects.filter(p=>p.status==='Healthy').length,
    completed: projects.filter(p=>p.status==='Completed').length,
    unitsPlanned: projects.reduce((s,p)=>s+p.unitsPlanned,0),
    unitsCompleted: projects.reduce((s,p)=>s+p.unitsCompleted,0),
    budget,
    expenditure,
    overdueMilestones: projects.reduce((s,p)=>s+p.overdueMilestones,0),
    openRisks: projects.reduce((s,p)=>s+p.openRisks,0)
  });
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
  res.json({ ok: true, demo: true, action: parsed.data.action, projectId: parsed.data.projectId, message: 'Demo action recorded. Connect a production datastore before operational use.' });
});

app.use((_req,res) => res.status(404).json({ error: 'Not found' }));
app.listen(port, () => console.log(`HomeFlow API listening on ${port}`));
