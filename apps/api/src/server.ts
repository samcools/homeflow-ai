import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { projects, auditLog, type Project } from './data.js';
import { executiveBrief, groundedAnswer, projectDrivers } from './insights.js';

const app = express();
const port = Number(process.env.PORT || 8080);
app.disable('x-powered-by');
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '2mb' }));

const allowedModels = new Set(['gpt-5.6-luna','gpt-5.6-terra','gpt-5.6-sol']);
const spendPct = (p: Project) => Math.round(p.expenditure / p.budget * 100);
const divergence = (p: Project) => spendPct(p) - p.physicalProgress;

const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'HomeFlow!2026';
type Role = 'Administrator'|'National Executive'|'Provincial Programme Manager'|'Site Inspector'|'Contractor';
type User = { id:string; name:string; email:string; role:Role; province?:string; organization?:string; permissions:string[] };
const users: User[] = [
  {id:'U-001',name:'Samson Admin',email:'admin@homeflow.ai',role:'Administrator',permissions:['*']},
  {id:'U-002',name:'Executive Demo',email:'executive@homeflow.ai',role:'National Executive',permissions:['portfolio','projects','map','contractors','finance','risks','recovery','usage']},
  {id:'U-003',name:'Gauteng Programme Manager',email:'manager@homeflow.ai',role:'Provincial Programme Manager',province:'Gauteng',permissions:['portfolio','projects','map','contractors','finance','risks','recovery']},
  {id:'U-004',name:'Site Inspector Demo',email:'inspector@homeflow.ai',role:'Site Inspector',province:'Gauteng',permissions:['projects','map','risks','evidence','inspections']},
  {id:'U-005',name:'Ubuntu Contractor Demo',email:'contractor@homeflow.ai',role:'Contractor',organization:'Ubuntu Build Consortium',permissions:['assigned-projects','recovery','evidence']}
];
const sessions = new Map<string,User>();
const usageLogs:Array<{at:string;user:string;email:string;role:string;action:string;target:string;ip?:string}> = [
  {at:'2026-09-13T13:05:00Z',user:'Samson Admin',email:'admin@homeflow.ai',role:'Administrator',action:'Signed in',target:'HomeFlow AI'},
  {at:'2026-09-13T12:58:00Z',user:'Executive Demo',email:'executive@homeflow.ai',role:'National Executive',action:'Generated executive brief',target:'National portfolio'},
  {at:'2026-09-13T12:42:00Z',user:'Gauteng Programme Manager',email:'manager@homeflow.ai',role:'Provincial Programme Manager',action:'Reviewed project',target:'Mamelodi Extension 18 Housing'}
];

function logUsage(user:User, action:string, target='Platform', req?:express.Request){
  usageLogs.unshift({at:new Date().toISOString(),user:user.name,email:user.email,role:user.role,action,target,ip:req?.ip});
  if(usageLogs.length>500) usageLogs.pop();
}
function auth(req:express.Request,res:express.Response,next:express.NextFunction){
  const token=String(req.header('authorization')||'').replace(/^Bearer\s+/i,'').trim();
  const user=sessions.get(token);
  if(!user) return res.status(401).json({error:'Authentication required'});
  (req as any).user=user; (req as any).token=token; next();
}
function currentUser(req:express.Request){ return (req as any).user as User; }
function isAdmin(req:express.Request){ return currentUser(req)?.role==='Administrator'; }
function requireRoles(...roles:Role[]){return (req:express.Request,res:express.Response,next:express.NextFunction)=>roles.includes(currentUser(req).role)?next():res.status(403).json({error:'Your role does not have access to this feature.'});}
function visibleProjects(user:User){
  if(user.role==='Contractor') return projects.filter(p=>p.contractor===user.organization);
  if((user.role==='Provincial Programme Manager'||user.role==='Site Inspector')&&user.province) return projects.filter(p=>p.province===user.province);
  return projects;
}
function publicUser(u:User){return {...u};}

app.get('/api/health',(_req,res)=>res.json({ok:true,service:'homeflow-api',version:'0.6.0',openAIConfigured:Boolean(process.env.OPENAI_API_KEY)}));
app.post('/api/auth/login',(req,res)=>{
  const parsed=z.object({email:z.string().email(),password:z.string().min(1)}).safeParse(req.body);
  if(!parsed.success) return res.status(400).json({error:'Enter a valid email and password.'});
  const user=users.find(u=>u.email.toLowerCase()===parsed.data.email.toLowerCase());
  if(!user||parsed.data.password!==DEMO_PASSWORD) return res.status(401).json({error:'Invalid demo credentials.'});
  const token=randomUUID(); sessions.set(token,user); logUsage(user,'Signed in','HomeFlow AI',req);
  res.json({token,user:publicUser(user)});
});
app.post('/api/auth/logout',auth,(req,res)=>{const user=currentUser(req);sessions.delete((req as any).token);logUsage(user,'Signed out','HomeFlow AI',req);res.json({ok:true});});
app.get('/api/auth/me',auth,(req,res)=>res.json({user:publicUser(currentUser(req))}));

app.use('/api', (req,res,next)=>{
  if(req.path==='/health'||req.path==='/auth/login') return next();
  return auth(req,res,next);
});

app.get('/api/projects',(req,res)=>{
  const user=currentUser(req); const status=String(req.query.status||''); const province=String(req.query.province||'');
  res.json(visibleProjects(user).filter(p=>(!status||p.status===status)&&(!province||p.province===province)));
});
app.get('/api/projects/:id',(req,res)=>{
  const p=visibleProjects(currentUser(req)).find(x=>x.id===req.params.id); if(!p)return res.status(404).json({error:'Project not found or not visible to your role.'});
  logUsage(currentUser(req),'Viewed project',p.name,req); res.json({...p,drivers:projectDrivers(p),spendPct:spendPct(p),divergence:divergence(p)});
});
app.get('/api/dashboard',(req,res)=>{
  const ps=visibleProjects(currentUser(req)); const budget=ps.reduce((s,p)=>s+p.budget,0); const expenditure=ps.reduce((s,p)=>s+p.expenditure,0);
  res.json({totalProjects:ps.length,critical:ps.filter(p=>p.status==='Critical').length,atRisk:ps.filter(p=>p.status==='At Risk').length,watch:ps.filter(p=>p.status==='Watch').length,onTrack:ps.filter(p=>p.status==='Healthy').length,completed:ps.filter(p=>p.status==='Completed').length,unitsPlanned:ps.reduce((s,p)=>s+p.unitsPlanned,0),unitsCompleted:ps.reduce((s,p)=>s+p.unitsCompleted,0),budget,expenditure,overdueMilestones:ps.reduce((s,p)=>s+p.overdueMilestones,0),openRisks:ps.reduce((s,p)=>s+p.openRisks,0),averagePhysicalProgress:Math.round(ps.reduce((s,p)=>s+p.physicalProgress,0)/Math.max(ps.length,1)),highDivergenceProjects:ps.filter(p=>divergence(p)>15).length});
});

app.get('/api/provinces',(req,res)=>{
  const ps=visibleProjects(currentUser(req)); const names=[...new Set(ps.map(p=>p.province))];
  res.json(names.map(name=>{const list=ps.filter(p=>p.province===name);return {name,projects:list.length,critical:list.filter(p=>p.status==='Critical').length,atRisk:list.filter(p=>p.status==='At Risk').length,watch:list.filter(p=>p.status==='Watch').length,healthy:list.filter(p=>p.status==='Healthy').length,completed:list.filter(p=>p.status==='Completed').length,averageHealth:Math.round(list.reduce((s,p)=>s+p.healthScore,0)/list.length),unitsPlanned:list.reduce((s,p)=>s+p.unitsPlanned,0),unitsCompleted:list.reduce((s,p)=>s+p.unitsCompleted,0),budget:list.reduce((s,p)=>s+p.budget,0),expenditure:list.reduce((s,p)=>s+p.expenditure,0),projectsList:list};}));
});
app.get('/api/provinces/:name',(req,res)=>{
  const list=visibleProjects(currentUser(req)).filter(p=>p.province===decodeURIComponent(req.params.name)); if(!list.length)return res.status(404).json({error:'Province not found or outside your scope.'});
  logUsage(currentUser(req),'Viewed province',list[0].province,req); res.json({name:list[0].province,projects:list,summary:{projects:list.length,averageHealth:Math.round(list.reduce((s,p)=>s+p.healthScore,0)/list.length),critical:list.filter(p=>p.status==='Critical').length,atRisk:list.filter(p=>p.status==='At Risk').length,unitsPlanned:list.reduce((s,p)=>s+p.unitsPlanned,0),unitsCompleted:list.reduce((s,p)=>s+p.unitsCompleted,0),budget:list.reduce((s,p)=>s+p.budget,0),expenditure:list.reduce((s,p)=>s+p.expenditure,0)}});
});

app.get('/api/contractors',(req,res)=>{
  const ps=visibleProjects(currentUser(req)); const grouped=new Map<string,Project[]>(); for(const p of ps)grouped.set(p.contractor,[...(grouped.get(p.contractor)||[]),p]);
  res.json([...grouped.entries()].map(([name,list])=>({name,projects:list.length,criticalProjects:list.filter(p=>p.status==='Critical').length,atRiskProjects:list.filter(p=>p.status==='At Risk').length,averageHealth:Math.round(list.reduce((s,p)=>s+p.healthScore,0)/list.length),overdueMilestones:list.reduce((s,p)=>s+p.overdueMilestones,0),unitsCompleted:list.reduce((s,p)=>s+p.unitsCompleted,0),contractValue:list.reduce((s,p)=>s+p.budget,0),projectList:list,performanceContext:list.some(p=>p.healthScore<60)?'Project performance requires management review':'No material delivery exception in current demo data'})));
});
app.get('/api/contractors/:name',(req,res)=>{
  const name=decodeURIComponent(req.params.name); const list=visibleProjects(currentUser(req)).filter(p=>p.contractor===name); if(!list.length)return res.status(404).json({error:'Contractor not found.'});
  logUsage(currentUser(req),'Viewed contractor',name,req); res.json({name,projects:list,summary:{projects:list.length,averageHealth:Math.round(list.reduce((s,p)=>s+p.healthScore,0)/list.length),critical:list.filter(p=>p.status==='Critical').length,atRisk:list.filter(p=>p.status==='At Risk').length,unitsCompleted:list.reduce((s,p)=>s+p.unitsCompleted,0),contractValue:list.reduce((s,p)=>s+p.budget,0)}});
});

app.get('/api/recovery',(req,res)=>res.json(visibleProjects(currentUser(req)).flatMap(p=>p.recoveryActions.map(a=>({...a,projectId:p.id,projectName:p.name,healthScore:p.healthScore,projectStatus:p.status})))));
app.get('/api/risks',(req,res)=>res.json(visibleProjects(currentUser(req)).filter(p=>p.openRisks>0).map(p=>({projectId:p.id,projectName:p.name,province:p.province,municipality:p.municipality,openRisks:p.openRisks,status:p.status,healthScore:p.healthScore,primaryBlocker:p.primaryBlocker,rootCauses:p.rootCauses,evidenceAgeDays:p.evidenceAgeDays,financialPhysicalDivergence:divergence(p)}))));
app.get('/api/audit',requireRoles('Administrator','National Executive'),(_req,res)=>res.json(auditLog));
app.get('/api/usage-logs',requireRoles('Administrator','National Executive'),(req,res)=>res.json(usageLogs.slice(0,250)));
app.post('/api/usage/events',(req,res)=>{const action=String(req.body?.action||'Viewed page').slice(0,100);const target=String(req.body?.target||'Platform').slice(0,160);logUsage(currentUser(req),action,target,req);res.json({ok:true});});

app.get('/api/what-changed/:id',(req,res)=>{const p=visibleProjects(currentUser(req)).find(x=>x.id===req.params.id);if(!p)return res.status(404).json({error:'Project not found'});const changes=[p.trend==='deteriorating'?'Delivery trend is deteriorating.':p.trend==='improving'?'Delivery trend is improving.':'Delivery trend is stable.',p.overdueMilestones?`${p.overdueMilestones} milestones are overdue.`:'No milestones are overdue.',`${spendPct(p)}% expenditure versus ${p.physicalProgress}% physical progress (${divergence(p)} point divergence).`,p.evidenceAgeDays>14?`Site evidence is ${p.evidenceAgeDays} days old and requires review.`:`Site evidence is ${p.evidenceAgeDays} days old.`];res.json({projectId:p.id,projectName:p.name,generatedAt:new Date().toISOString(),changes});});
app.get('/api/executive-brief',(req,res)=>{const brief=executiveBrief(visibleProjects(currentUser(req)));logUsage(currentUser(req),'Generated executive brief','Visible portfolio',req);res.json(brief);});

function getOpenAIKey(req:express.Request){const headerKey=isAdmin(req)?String(req.header('x-openai-api-key')||'').trim():'';return headerKey||String(process.env.OPENAI_API_KEY||'').trim();}
function openAIText(payload:any){if(typeof payload?.output_text==='string'&&payload.output_text.trim())return payload.output_text.trim();const pieces:string[]=[];for(const item of payload?.output||[])for(const content of item?.content||[])if(typeof content?.text==='string')pieces.push(content.text);return pieces.join('\n').trim();}
function groundedContext(user:User,projectId?:string){const visible=visibleProjects(user);const selected=projectId?visible.find(p=>p.id===projectId):undefined;return (selected?[selected]:visible).map(p=>({id:p.id,name:p.name,province:p.province,municipality:p.municipality,contractor:p.contractor,programme:p.programme,status:p.status,healthScore:p.healthScore,budget:p.budget,expenditure:p.expenditure,expenditurePct:spendPct(p),physicalProgress:p.physicalProgress,plannedProgress:p.plannedProgress,divergence:divergence(p),unitsPlanned:p.unitsPlanned,unitsCompleted:p.unitsCompleted,overdueMilestones:p.overdueMilestones,openRisks:p.openRisks,evidenceAgeDays:p.evidenceAgeDays,forecastCompletion:p.forecastCompletion,primaryBlocker:p.primaryBlocker,trend:p.trend,rootCauses:p.rootCauses,recoveryActions:p.recoveryActions}));}
async function callOpenAI(opts:{key:string;model:string;question:string;user:User;projectId?:string}){const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),25000);try{const response=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:`Bearer ${opts.key}`,'Content-Type':'application/json'},body:JSON.stringify({model:opts.model,store:false,max_output_tokens:700,instructions:'You are HomeFlow AI, an intelligent responsible-AI delivery assurance copilot for South African Human Settlements. Answer only from supplied HomeFlow data. Prefer project names over project numbers. Be concise, conversational and operational. Explain uncertainty. Recommendations require accountable human review. Never invent fraud, legal, procurement, contractual or compliance findings.',input:`User role: ${opts.user.role}. User question: ${opts.question}\n\nVisible HomeFlow data:\n${JSON.stringify(groundedContext(opts.user,opts.projectId))}`}),signal:controller.signal});const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data?.error?.message||`OpenAI request failed with HTTP ${response.status}`);const answer=openAIText(data);if(!answer)throw new Error('OpenAI returned no text response.');return {answer,responseId:data?.id||null};}finally{clearTimeout(timeout);}}

app.get('/api/openai/status',requireRoles('Administrator'),(_req,res)=>res.json({serverKeyConfigured:Boolean(process.env.OPENAI_API_KEY),defaultModel:'gpt-5.6-luna',allowedModels:[...allowedModels]}));
app.post('/api/openai/test',requireRoles('Administrator'),async(req,res)=>{const key=getOpenAIKey(req);if(!key)return res.status(400).json({error:'No OpenAI API key supplied.'});const model=allowedModels.has(String(req.body?.model||''))?String(req.body.model):'gpt-5.6-luna';try{const result=await callOpenAI({key,model,question:'Reply exactly: HomeFlow OpenAI connection successful.',user:currentUser(req)});logUsage(currentUser(req),'Tested OpenAI connection',model,req);res.json({ok:true,model,message:result.answer,responseId:result.responseId});}catch(e:any){res.status(502).json({error:e?.message||'OpenAI connection test failed.'});}});
app.post('/api/ai/copilot',async(req,res)=>{const parsed=z.object({question:z.string().min(2).max(1200),projectId:z.string().optional(),model:z.string().optional()}).safeParse(req.body);if(!parsed.success)return res.status(400).json({error:'Invalid request'});const user=currentUser(req);const key=getOpenAIKey(req);const model=allowedModels.has(parsed.data.model||'')?String(parsed.data.model):'gpt-5.6-luna';logUsage(user,'Asked HomeFlow Copilot',parsed.data.projectId?projects.find(p=>p.id===parsed.data.projectId)?.name||parsed.data.projectId:'Portfolio',req);if(key){try{const result=await callOpenAI({key,model,question:parsed.data.question,user,projectId:parsed.data.projectId});return res.json({answer:result.answer,provider:'openai',model,responseId:result.responseId,humanReviewRequired:true,generatedAt:new Date().toISOString()});}catch(e:any){const fallback=groundedAnswer(parsed.data.question,parsed.data.projectId,visibleProjects(user));return res.json({...fallback,provider:'rules-fallback',warning:`OpenAI unavailable: ${e?.message||'unknown error'}`,humanReviewRequired:true});}}res.json({...groundedAnswer(parsed.data.question,parsed.data.projectId,visibleProjects(user)),provider:'rules',humanReviewRequired:true});});

const accentInstructions:Record<string,string>={
  'en-ZA':'Speak in a warm, natural South African English accent.','af-ZA':'Speak fluent Afrikaans with a natural South African Afrikaans accent.','zu-ZA':'Speak fluent isiZulu with a natural South African isiZulu accent.','xh-ZA':'Speak fluent isiXhosa with a natural South African isiXhosa accent.','st-ZA':'Speak fluent Sesotho with a natural South African Sesotho accent.','tn-ZA':'Speak fluent Setswana with a natural South African Setswana accent.','nso-ZA':'Speak fluent Sepedi with a natural South African Sepedi accent.','ts-ZA':'Speak fluent Xitsonga with a natural South African Xitsonga accent.','ve-ZA':'Speak fluent Tshivenda with a natural South African Tshivenda accent.','ss-ZA':'Speak fluent siSwati with a natural South African siSwati accent.','nr-ZA':'Speak fluent isiNdebele with a natural South African isiNdebele accent.'
};
app.post('/api/voice/speak',async(req,res)=>{const parsed=z.object({text:z.string().min(1).max(3500),language:z.string().default('en-ZA')}).safeParse(req.body);if(!parsed.success)return res.status(400).json({error:'Invalid speech request'});const key=getOpenAIKey(req);if(!key)return res.status(400).json({error:'OpenAI voice is not configured; use browser voice fallback.'});try{const response=await fetch('https://api.openai.com/v1/audio/speech',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({model:'gpt-4o-mini-tts',voice:'alloy',input:parsed.data.text,instructions:`${accentInstructions[parsed.data.language]||accentInstructions['en-ZA']} Use a human, calm public-sector executive assistant tone. Pronounce South African place names naturally.`,response_format:'mp3'})});if(!response.ok){const err=await response.text();throw new Error(err||`Voice request failed with HTTP ${response.status}`);}const audio=Buffer.from(await response.arrayBuffer());res.setHeader('Content-Type','audio/mpeg');res.setHeader('Cache-Control','no-store');res.send(audio);}catch(e:any){res.status(502).json({error:e?.message||'Voice generation failed.'});}});

app.post('/api/actions',(req,res)=>{const parsed=z.object({action:z.string().min(2),projectId:z.string(),payload:z.record(z.any()).optional(),confirmed:z.boolean().default(false)}).safeParse(req.body);if(!parsed.success)return res.status(400).json({error:'Invalid action request'});const project=visibleProjects(currentUser(req)).find(p=>p.id===parsed.data.projectId);if(!project)return res.status(404).json({error:'Project not found or outside your role scope.'});if(!parsed.data.confirmed)return res.status(409).json({confirmationRequired:true,message:`Confirm ${parsed.data.action} for ${project.name}.`});logUsage(currentUser(req),parsed.data.action,project.name,req);res.json({ok:true,demo:true,action:parsed.data.action,projectId:project.id,message:'Demo action recorded and added to the usage log.'});});

const moduleDir=path.dirname(fileURLToPath(import.meta.url));
const webDistCandidates=[path.resolve(moduleDir,'../../web/dist'),path.resolve(process.cwd(),'apps/web/dist'),path.resolve(process.cwd(),'../web/dist')];
const webDist=webDistCandidates.find(candidate=>existsSync(candidate));
if(webDist){console.log(`Serving HomeFlow web app from ${webDist}`);app.use(express.static(webDist,{maxAge:'1h',index:'index.html'}));app.use((req,res,next)=>{if(req.method==='GET'&&!req.path.startsWith('/api/'))return res.sendFile(path.join(webDist,'index.html'));next();});}else console.warn(`HomeFlow web build not found. Checked: ${webDistCandidates.join(', ')}`);
app.use((_req,res)=>res.status(404).json({error:'Not found'}));
app.listen(port,()=>console.log(`HomeFlow API listening on ${port}`));
