import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
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
const allowedModels = new Set(['gpt-5.6-luna', 'gpt-5.6-terra', 'gpt-5.6-sol']);

function getOpenAIKey(req: express.Request) {
  const headerKey = String(req.header('x-openai-api-key') || '').trim();
  return headerKey || String(process.env.OPENAI_API_KEY || '').trim();
}

function openAIText(payload: any): string {
  if (typeof payload?.output_text === 'string' && payload.output_text.trim()) return payload.output_text.trim();
  const pieces: string[] = [];
  for (const item of payload?.output ?? []) {
    for (const content of item?.content ?? []) {
      if (typeof content?.text === 'string') pieces.push(content.text);
    }
  }
  return pieces.join('\n').trim();
}

function groundedContext(projectId?: string) {
  const selected = projectId ? projects.find(p => p.id === projectId) : undefined;
  const list = selected ? [selected] : projects;
  return list.map(p => ({
    id: p.id,
    name: p.name,
    province: p.province,
    municipality: p.municipality,
    contractor: p.contractor,
    programme: p.programme,
    status: p.status,
    healthScore: p.healthScore,
    confidence: p.confidence,
    budget: p.budget,
    expenditure: p.expenditure,
    expenditurePct: spendPct(p),
    physicalProgress: p.physicalProgress,
    plannedProgress: p.plannedProgress,
    divergence: divergence(p),
    unitsPlanned: p.unitsPlanned,
    unitsCompleted: p.unitsCompleted,
    overdueMilestones: p.overdueMilestones,
    openRisks: p.openRisks,
    evidenceAgeDays: p.evidenceAgeDays,
    forecastCompletion: p.forecastCompletion,
    primaryBlocker: p.primaryBlocker,
    trend: p.trend,
    rootCauses: p.rootCauses,
    recoveryActions: p.recoveryActions
  }));
}

async function callOpenAI(opts: { key: string; model: string; question: string; projectId?: string }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);
  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${opts.key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: opts.model,
        store: false,
        max_output_tokens: 600,
        instructions: [
          'You are HomeFlow AI, a responsible AI delivery-assurance copilot for South African Human Settlements.',
          'Answer only from the supplied HomeFlow project data. Do not invent facts, legal findings, procurement findings or official determinations.',
          'Keep answers concise, operational and suitable to be spoken aloud. State uncertainty where appropriate.',
          'For potentially stalled projects, contractor performance, financial anomalies and recovery recommendations, clearly say that accountable human review is required.',
          'Never claim a project is legally non-compliant, corrupt, fraudulent or contractually in default unless that exact determination exists in the supplied data.',
          'When useful, cite project IDs in the answer.'
        ].join(' '),
        input: `User question: ${opts.question}\n\nCurrent HomeFlow data:\n${JSON.stringify(groundedContext(opts.projectId))}`
      }),
      signal: controller.signal
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = data?.error?.message || `OpenAI request failed with HTTP ${response.status}`;
      throw new Error(message);
    }
    const answer = openAIText(data);
    if (!answer) throw new Error('OpenAI returned no text response.');
    return { answer, responseId: data?.id ?? null };
  } finally {
    clearTimeout(timeout);
  }
}

app.get('/api/health', (_req,res) => res.json({ ok: true, service: 'homeflow-api', version: '0.4.1', openAIConfigured: Boolean(process.env.OPENAI_API_KEY) }));
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
app.get('/api/openai/status', (_req,res) => res.json({ serverKeyConfigured: Boolean(process.env.OPENAI_API_KEY), defaultModel: 'gpt-5.6-luna', allowedModels: [...allowedModels] }));

const openAITestSchema = z.object({ model: z.string().optional() });
app.post('/api/openai/test', async (req,res) => {
  const parsed = openAITestSchema.safeParse(req.body ?? {});
  if (!parsed.success) return res.status(400).json({ error: 'Invalid test request' });
  const key = getOpenAIKey(req);
  if (!key) return res.status(400).json({ error: 'No OpenAI API key supplied.' });
  const model = allowedModels.has(parsed.data.model || '') ? String(parsed.data.model) : 'gpt-5.6-luna';
  try {
    const result = await callOpenAI({ key, model, question: 'Reply exactly: HomeFlow OpenAI connection successful.' });
    res.json({ ok: true, model, message: result.answer, responseId: result.responseId });
  } catch (error:any) {
    res.status(502).json({ error: error?.message || 'OpenAI connection test failed.' });
  }
});

const askSchema = z.object({ question: z.string().min(2).max(1000), projectId: z.string().optional(), model: z.string().optional() });
app.post('/api/ai/copilot', async (req,res) => {
  const parsed = askSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid request' });
  const key = getOpenAIKey(req);
  const model = allowedModels.has(parsed.data.model || '') ? String(parsed.data.model) : 'gpt-5.6-luna';
  if (key) {
    try {
      const result = await callOpenAI({ key, model, question: parsed.data.question, projectId: parsed.data.projectId });
      return res.json({
        answer: result.answer,
        provider: 'openai',
        model,
        responseId: result.responseId,
        humanReviewRequired: true,
        generatedAt: new Date().toISOString()
      });
    } catch (error:any) {
      const fallback = groundedAnswer(parsed.data.question, parsed.data.projectId);
      return res.json({
        ...fallback,
        provider: 'rules-fallback',
        model: null,
        warning: `OpenAI was unavailable: ${error?.message || 'unknown error'}`,
        humanReviewRequired: true,
        generatedAt: new Date().toISOString()
      });
    }
  }
  res.json({ ...groundedAnswer(parsed.data.question, parsed.data.projectId), provider: 'rules', model: null, humanReviewRequired: true, generatedAt: new Date().toISOString() });
});

const actionSchema = z.object({ action: z.string().min(2), projectId: z.string(), payload: z.record(z.any()).optional(), confirmed: z.boolean().default(false) });
app.post('/api/actions', (req,res) => {
  const parsed = actionSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid action request' });
  if (!parsed.data.confirmed) return res.status(409).json({ confirmationRequired: true, message: `Confirm ${parsed.data.action} for ${parsed.data.projectId}.` });
  res.json({ ok: true, demo: true, action: parsed.data.action, projectId: parsed.data.projectId, message: 'Demo action recorded. Connect an authenticated production datastore and workflow engine before operational use.' });
});

// Serve the built React application from the same origin in deployed environments.
// npm workspaces execute the API start script with apps/api as process.cwd(), so resolve from the compiled module first.
const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const webDistCandidates = [
  path.resolve(moduleDir, '../../web/dist'),
  path.resolve(process.cwd(), 'apps/web/dist'),
  path.resolve(process.cwd(), '../web/dist')
];
const webDist = webDistCandidates.find(candidate => existsSync(candidate));

if (webDist) {
  console.log(`Serving HomeFlow web app from ${webDist}`);
  app.use(express.static(webDist, { maxAge: '1h', index: 'index.html' }));
  app.get('*', (req,res,next) => {
    if (req.path.startsWith('/api/')) return next();
    return res.sendFile(path.join(webDist, 'index.html'));
  });
} else {
  console.warn(`HomeFlow web build not found. Checked: ${webDistCandidates.join(', ')}`);
}

app.use((_req,res) => res.status(404).json({ error: 'Not found' }));
app.listen(port, () => console.log(`HomeFlow API listening on ${port}`));