import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Activity, AlertTriangle, BarChart3, Bot, Building2, CheckCircle2, ChevronRight, CircleDollarSign, FileCheck2, Gauge, Home, KeyRound, MapPinned, Mic, RefreshCw, Search, Settings, ShieldCheck, Sparkles, Users, Volume2, VolumeX, X } from 'lucide-react';
import './styles.css';

type Project = {
  id:string; name:string; province:string; municipality:string; contractor:string; programme:string; status:string;
  healthScore:number; confidence:number; budget:number; expenditure:number; physicalProgress:number; plannedProgress:number;
  unitsPlanned:number; unitsCompleted:number; overdueMilestones:number; openRisks:number; evidenceAgeDays:number; forecastCompletion:string;
  primaryBlocker:string; trend:string; rootCauses:string[]; recoveryActions:any[]; activity:any[];
};
type Dashboard = { totalProjects:number; critical:number; atRisk:number; watch?:number; onTrack:number; completed:number; unitsPlanned:number; unitsCompleted:number; budget:number; expenditure:number; overdueMilestones:number; openRisks:number; averagePhysicalProgress?:number; highDivergenceProjects?:number };
type View = 'command'|'projects'|'map'|'contractors'|'finance'|'risks'|'recovery'|'audit';
type Model = 'gpt-5.6-luna'|'gpt-5.6-terra'|'gpt-5.6-sol';

const API = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:8080');
const currency = (n:number) => new Intl.NumberFormat('en-ZA',{style:'currency',currency:'ZAR',maximumFractionDigits:0}).format(n);
const statusClass = (s:string) => s.toLowerCase().replaceAll(' ','-');
const fetchJson = async (url:string) => { const r=await fetch(url); if(!r.ok) throw new Error(String(r.status)); return r.json(); };

function Metric({label,value,icon:Icon,tone='blue'}:{label:string;value:React.ReactNode;icon:any;tone?:string}){
  return <div className="metric"><div className={`metric-icon ${tone}`}><Icon size={19}/></div><div><small>{label}</small><strong>{value}</strong></div></div>
}

const navItems:Array<[View,string,any]> = [
  ['command','Command Centre',Gauge],['projects','Projects',Building2],['map','Delivery Map',MapPinned],['contractors','Contractors',Users],['finance','Finance',CircleDollarSign],['risks','Risks & Blockers',AlertTriangle],['recovery','Recovery Plans',Activity],['audit','Audit & Governance',ShieldCheck]
];

const voiceLanguages = [
  ['en-ZA','English (South Africa)'],['zu-ZA','isiZulu'],['xh-ZA','isiXhosa'],['st-ZA','Sesotho'],['af-ZA','Afrikaans']
];

function App(){
  const [projects,setProjects]=useState<Project[]>([]); const [dashboard,setDashboard]=useState<Dashboard|null>(null);
  const [selected,setSelected]=useState<Project|null>(null); const [panel,setPanel]=useState(false); const [query,setQuery]=useState('');
  const [answer,setAnswer]=useState('Ask what requires attention today, use a voice command, or connect an OpenAI API key for generative answers.');
  const [listening,setListening]=useState(false); const [busy,setBusy]=useState(false); const [brief,setBrief]=useState<any>(null);
  const [view,setView]=useState<View>('command'); const [viewData,setViewData]=useState<any[]>([]); const [viewLoading,setViewLoading]=useState(false);
  const [changed,setChanged]=useState<any>(null); const recognitionRef=useRef<any>(null);
  const [settingsOpen,setSettingsOpen]=useState(false);
  const [apiKey,setApiKey]=useState(()=>sessionStorage.getItem('homeflow_openai_key') || '');
  const [model,setModel]=useState<Model>(()=>(localStorage.getItem('homeflow_model') as Model) || 'gpt-5.6-luna');
  const [voiceLang,setVoiceLang]=useState(()=>localStorage.getItem('homeflow_voice_lang') || 'en-ZA');
  const [autoSpeak,setAutoSpeak]=useState(()=>localStorage.getItem('homeflow_auto_speak') !== 'false');
  const [connection,setConnection]=useState<'untested'|'testing'|'ok'|'error'>('untested');
  const [connectionMessage,setConnectionMessage]=useState('');
  const [provider,setProvider]=useState('rules');

  useEffect(()=>{ Promise.all([fetchJson(`${API}/api/projects`),fetchJson(`${API}/api/dashboard`)]).then(([p,d])=>{setProjects(p);setDashboard(d);setSelected(p[0]??null);}).catch(()=>{}); },[]);
  useEffect(()=>{ if(['contractors','risks','recovery','audit'].includes(view)){ setViewLoading(true); fetchJson(`${API}/api/${view==='recovery'?'recovery':view}`).then(setViewData).catch(()=>setViewData([])).finally(()=>setViewLoading(false)); } },[view]);
  const filtered=useMemo(()=>projects.filter(p=>`${p.id} ${p.name} ${p.province} ${p.municipality} ${p.contractor}`.toLowerCase().includes(query.toLowerCase())),[projects,query]);

  function setKey(value:string){ setApiKey(value); if(value) sessionStorage.setItem('homeflow_openai_key',value); else sessionStorage.removeItem('homeflow_openai_key'); setConnection('untested'); }
  function setPreferredModel(value:Model){ setModel(value); localStorage.setItem('homeflow_model',value); setConnection('untested'); }
  function setPreferredVoice(value:string){ setVoiceLang(value); localStorage.setItem('homeflow_voice_lang',value); }
  function setAutoVoice(value:boolean){ setAutoSpeak(value); localStorage.setItem('homeflow_auto_speak',String(value)); if(!value && 'speechSynthesis' in window) speechSynthesis.cancel(); }

  function speakText(text:string){
    if(!('speechSynthesis' in window) || !text) return;
    speechSynthesis.cancel();
    const u=new SpeechSynthesisUtterance(text.replace(/[*#`]/g,''));
    u.lang=voiceLang; u.rate=.97; u.pitch=1;
    const voices=speechSynthesis.getVoices();
    const exact=voices.find(v=>v.lang.toLowerCase()===voiceLang.toLowerCase());
    const base=voices.find(v=>v.lang.toLowerCase().startsWith(voiceLang.split('-')[0].toLowerCase()));
    if(exact||base) u.voice=exact||base||null;
    speechSynthesis.speak(u);
  }

  async function ask(text:string, speakAfter=false){
    setBusy(true); setPanel(true); setAnswer('Analysing current project data…');
    try {
      const headers:Record<string,string>={'Content-Type':'application/json'};
      if(apiKey) headers['x-openai-api-key']=apiKey;
      const r=await fetch(`${API}/api/ai/copilot`,{method:'POST',headers,body:JSON.stringify({question:text,projectId:selected?.id,model})});
      const body=await r.json();
      const next=body.answer || body.error || 'No grounded answer available.';
      setAnswer(next); setProvider(body.provider || 'rules');
      if((speakAfter||autoSpeak) && r.ok) setTimeout(()=>speakText(next),80);
    } catch {
      const next='The HomeFlow API is unavailable. Check the deployed service and try again.';
      setAnswer(next); setProvider('offline'); if(speakAfter||autoSpeak) speakText(next);
    } finally { setBusy(false); }
  }

  async function loadBrief(speakAfter=false){
    try{
      const b=await fetchJson(`${API}/api/executive-brief`); setBrief(b);
      if(speakAfter){setPanel(true);setAnswer(b.summary);speakText(b.summary);}
    }catch{setBrief({summary:'Executive brief service unavailable.',priorities:[]});}
  }
  async function loadChanges(){ if(!selected)return; try{setChanged(await fetchJson(`${API}/api/what-changed/${selected.id}`));}catch{setChanged({changes:['Change analysis is unavailable.']});} }

  function voiceCommandHelp(){
    const text='Try: open projects, show delivery map, open risks, show contractors, open finance, show recovery plans, open audit, select project HF-102, executive brief, what requires attention today, or stop speaking.';
    setPanel(true); setAnswer(text); speakText(text);
  }

  async function handleCommand(text:string, fromVoice=false){
    const t=text.trim(); const q=t.toLowerCase();
    const navMap:Array<[RegExp,View,string]>=[
      [/^(open|show|go to) (the )?(command centre|dashboard|home)$/i,'command','Opening the Command Centre.'],
      [/^(open|show|go to) (the )?projects?$/i,'projects','Opening Projects.'],
      [/^(open|show|go to) (the )?(delivery )?map$/i,'map','Opening the Delivery Map.'],
      [/^(open|show|go to) (the )?contractors?$/i,'contractors','Opening Contractor Performance.'],
      [/^(open|show|go to) (the )?finance$/i,'finance','Opening Finance.'],
      [/^(open|show|go to) (the )?(risks|risks and blockers|blockers)$/i,'risks','Opening Risks and Blockers.'],
      [/^(open|show|go to) (the )?(recovery|recovery plans?)$/i,'recovery','Opening Recovery Plans.'],
      [/^(open|show|go to) (the )?(audit|audit and governance|governance)$/i,'audit','Opening Audit and Governance.']
    ];
    for(const [re,next,msg] of navMap){ if(re.test(t)){ setView(next); setPanel(true); setAnswer(msg); if(fromVoice||autoSpeak) speakText(msg); return; } }
    const projectMatch=t.match(/(?:open|show|select|go to)\s+(?:project\s+)?(HF-\d+)/i);
    if(projectMatch){ const p=projects.find(x=>x.id.toLowerCase()===projectMatch[1].toLowerCase()); if(p){setSelected(p);setView('projects');const msg=`Opening ${p.id}, ${p.name}.`;setPanel(true);setAnswer(msg);if(fromVoice||autoSpeak)speakText(msg);return;} }
    if(/^(executive brief|read executive brief|generate executive brief)$/i.test(t)){await loadBrief(fromVoice||autoSpeak);return;}
    if(/^(voice help|help with voice commands|what can i say|show voice commands)$/i.test(t)){voiceCommandHelp();return;}
    if(/^(stop speaking|stop voice|be quiet)$/i.test(t)){if('speechSynthesis' in window)speechSynthesis.cancel();setAnswer('Voice playback stopped.');setPanel(true);return;}
    if(q.startsWith('settings')||q==='openai settings'||q==='open settings'){setSettingsOpen(true);setPanel(true);setAnswer('Opening AI and voice settings.');return;}
    await ask(t,fromVoice);
  }

  function startVoice(){
    const SR=(window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if(!SR){ setPanel(true); setAnswer('Voice recognition is not available in this browser. Chrome or Edge usually provide the broadest Web Speech support.'); return; }
    if('speechSynthesis' in window) speechSynthesis.cancel();
    const r=new SR(); recognitionRef.current=r; r.lang=voiceLang; r.interimResults=false; r.continuous=false;
    r.onstart=()=>{setListening(true);setPanel(true);setAnswer('Listening…');}; r.onend=()=>setListening(false); r.onerror=()=>{setListening(false);setAnswer('I could not capture that voice command. Please try again.');};
    r.onresult=(e:any)=>{ const text=e.results[0][0].transcript; setAnswer(`You said: “${text}”`); handleCommand(text,true); };
    r.start();
  }

  async function testOpenAI(){
    if(!apiKey){setConnection('error');setConnectionMessage('Enter an OpenAI API key first.');return;}
    setConnection('testing'); setConnectionMessage('Testing connection…');
    try{
      const r=await fetch(`${API}/api/openai/test`,{method:'POST',headers:{'Content-Type':'application/json','x-openai-api-key':apiKey},body:JSON.stringify({model})});
      const body=await r.json();
      if(!r.ok) throw new Error(body.error||'Connection failed');
      setConnection('ok');setConnectionMessage(body.message||'Connection successful.');
    }catch(e:any){setConnection('error');setConnectionMessage(e?.message||'Connection failed.');}
  }

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark">HF</div><div><b>HomeFlow AI</b><span>by Pyrneo</span></div></div>
      <nav>{navItems.map(([id,label,Icon])=><button key={id} className={view===id?'active':''} onClick={()=>setView(id)}><Icon/>{label}</button>)}</nav>
      <button className="settings-nav" onClick={()=>setSettingsOpen(true)}><Settings size={17}/> AI & Voice Settings</button>
      <div className="sidebar-note"><Sparkles size={16}/><div><b>Responsible AI</b><span>Recommendations require accountable human review.</span></div></div>
    </aside>
    <main className="main">
      <header><div><p className="eyebrow">{view==='command'?'HOMEFLOW COMMAND CENTRE':view.toUpperCase()}</p><h1>{view==='command'?'Human Settlements Delivery Assurance':navItems.find(n=>n[0]===view)?.[1]}</h1></div><div className="header-actions"><button className="ghost" onClick={()=>setSettingsOpen(true)}><KeyRound size={17}/> OpenAI</button><button className="ghost" onClick={()=>loadBrief(false)}><Sparkles size={17}/> Executive brief</button><button className={`voice ${listening?'live':''}`} onClick={startVoice}><Mic size={18}/>{listening?'Listening…':'Voice Agent'}</button></div></header>

      {view==='command' && <CommandCentre dashboard={dashboard} projects={filtered} selected={selected} setSelected={setSelected} query={query} setQuery={setQuery} ask={(q:string)=>handleCommand(q,false)} loadChanges={loadChanges}/>} 
      {view==='projects' && <ProjectsView projects={filtered} selected={selected} setSelected={setSelected} query={query} setQuery={setQuery} ask={(q:string)=>handleCommand(q,false)}/>} 
      {view==='map' && <MapView projects={projects} setSelected={(p)=>{setSelected(p);setView('projects')}}/>}
      {view==='finance' && <FinanceView projects={projects}/>} 
      {['contractors','risks','recovery','audit'].includes(view) && <DataView type={view} data={viewData} loading={viewLoading}/>} 

      {brief && <section className="brief card"><div className="card-head"><div><h2>Executive Brief</h2><p>Generated from current demo data; official review required.</p></div><button className="icon-btn" onClick={()=>setBrief(null)}><X/></button></div><p className="brief-summary">{brief.summary}</p><div className="brief-grid">{(brief.priorities||[]).map((x:any)=><div key={x.id}><b>{x.id} · {x.score}/100</b><span>{x.reason}</span></div>)}</div></section>}
      {changed && <section className="brief card"><div className="card-head"><div><h2>What Changed? · {selected?.id}</h2><p>Current demo snapshot analysis.</p></div><button className="icon-btn" onClick={()=>setChanged(null)}><X/></button></div><div className="change-list">{(changed.changes||[]).map((x:string,i:number)=><div key={i}><RefreshCw size={15}/><span>{x}</span></div>)}</div></section>}
      <footer><span>HomeFlow AI by Pyrneo</span><span>From stalled projects to completed homes.</span><span>Demo data · Not a production government system</span></footer>
    </main>

    {panel && <aside className="copilot"><div className="copilot-head"><div><Bot/><div><b>HomeFlow Voice Copilot</b><span>{selected?`Context: ${selected.id}`:'Portfolio context'} · {provider==='openai'?model:'grounded fallback'}</span></div></div><button onClick={()=>setPanel(false)}><X/></button></div><div className="chat"><div className="assistant-bubble">{busy?<span className="typing">•••</span>:answer}</div><div className="grounding"><ShieldCheck size={15}/> Grounded in current HomeFlow demo records. Human review remains required.</div></div><div className="quick-prompts"><button onClick={()=>handleCommand('Which projects require my attention today?')}>Priorities</button><button onClick={()=>handleCommand('Which projects are potentially stalled?')}>Stalled</button><button onClick={()=>handleCommand('Which project has the largest budget gap?')}>Budget gap</button><button onClick={voiceCommandHelp}>Voice help</button></div><div className="chat-actions"><button onClick={()=>speakText(answer)}><Volume2 size={17}/>Speak</button><button onClick={startVoice}><Mic size={17}/>Voice</button><button onClick={()=>setAutoVoice(!autoSpeak)}>{autoSpeak?<Volume2 size={17}/>:<VolumeX size={17}/>}Auto {autoSpeak?'on':'off'}</button></div><form onSubmit={e=>{e.preventDefault();const f=new FormData(e.currentTarget);const t=String(f.get('q')||''); if(t) handleCommand(t,false); e.currentTarget.reset();}}><input name="q" placeholder="Ask or type a command…"/><button>Ask</button></form></aside>}

    {settingsOpen && <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setSettingsOpen(false)}}><section className="settings-modal card"><div className="card-head"><div><h2>AI & Voice Settings</h2><p>Configure the hackathon copilot without hard-coding credentials.</p></div><button className="icon-btn" onClick={()=>setSettingsOpen(false)}><X/></button></div><div className="settings-body">
      <label>OpenAI API key <span>stored only in this browser tab session</span></label><div className="key-row"><input type="password" autoComplete="off" placeholder="sk-…" value={apiKey} onChange={e=>setKey(e.target.value)}/><button onClick={testOpenAI} disabled={connection==='testing'}>{connection==='testing'?'Testing…':'Test API'}</button></div>
      <div className={`connection-state ${connection}`}>{connectionMessage || 'Optional: without a key, HomeFlow uses its deterministic grounded demo assistant. For production, configure OPENAI_API_KEY as a server-side secret or Azure Key Vault secret.'}</div>
      <div className="settings-grid"><div><label>OpenAI model</label><select value={model} onChange={e=>setPreferredModel(e.target.value as Model)}><option value="gpt-5.6-luna">GPT-5.6 Luna — cost-sensitive</option><option value="gpt-5.6-terra">GPT-5.6 Terra — balanced</option><option value="gpt-5.6-sol">GPT-5.6 Sol — highest capability</option></select></div><div><label>Voice language</label><select value={voiceLang} onChange={e=>setPreferredVoice(e.target.value)}>{voiceLanguages.map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></div></div>
      <label className="toggle-row"><input type="checkbox" checked={autoSpeak} onChange={e=>setAutoVoice(e.target.checked)}/><span>Automatically speak agent responses</span></label>
      <div className="voice-command-box"><b>Voice commands</b><p>“Open projects” · “Show delivery map” · “Open risks” · “Show contractors” · “Open finance” · “Show recovery plans” · “Open audit” · “Select project HF-102” · “Executive brief” · “What requires attention today?” · “Stop speaking”</p></div>
      <div className="security-note"><ShieldCheck size={18}/><div><b>Credential handling</b><span>The API key is not written to the repository, database or localStorage. This demo keeps it in sessionStorage and sends it only to the HomeFlow backend for OpenAI calls. Production deployments should keep provider credentials server-side.</span></div></div>
      <div className="settings-actions"><button className="ghost" onClick={()=>setKey('')}>Clear API key</button><button className="voice" onClick={()=>setSettingsOpen(false)}>Done</button></div>
    </div></section></div>}
  </div>
}

function CommandCentre({dashboard,projects,selected,setSelected,query,setQuery,ask,loadChanges}:any){return <>
  <section className="hero"><div><span className="pulse-dot"></span><b>What requires attention today?</b><p>Monitor delivery, anticipate risk, explain deterioration and orchestrate recovery.</p></div><button onClick={()=>ask('Which projects require my attention today?')}>Analyse priorities <ChevronRight size={18}/></button></section>
  {dashboard && <section className="metrics"><Metric label="Projects" value={dashboard.totalProjects} icon={Building2}/><Metric label="Critical" value={dashboard.critical} icon={AlertTriangle} tone="red"/><Metric label="At risk" value={dashboard.atRisk} icon={Activity} tone="amber"/><Metric label="Units completed" value={dashboard.unitsCompleted.toLocaleString()} icon={Home} tone="green"/><Metric label="Overdue milestones" value={dashboard.overdueMilestones} icon={CheckCircle2} tone="amber"/><Metric label="Open risks" value={dashboard.openRisks} icon={ShieldCheck} tone="red"/></section>}
  <section className="workspace"><Portfolio projects={projects} selected={selected} setSelected={setSelected} query={query} setQuery={setQuery}/><div className="insight card"><div className="card-head"><div><h2>{selected ? selected.id : 'AI Project Health'}</h2><p>{selected ? selected.name : 'Select a project for evidence-grounded insights.'}</p></div><Sparkles size={20}/></div>{selected ? <ProjectInsight p={selected} ask={ask} loadChanges={loadChanges}/> : <div className="empty-state"><Gauge size={42}/><b>Explainable project health</b><p>Select any project to see risk drivers, divergence and recommended actions.</p></div>}</div></section>
</>}

function Portfolio({projects,selected,setSelected,query,setQuery}:any){return <div className="portfolio card"><div className="card-head"><div><h2>Priority portfolio</h2><p>Project health, budget and physical delivery in one view.</p></div><div className="search"><Search size={17}/><input placeholder="Search project, municipality, contractor…" value={query} onChange={e=>setQuery(e.target.value)}/></div></div><div className="project-list">{projects.map((p:Project)=>{ const spend=Math.round(p.expenditure/p.budget*100); return <button className={`project-row ${selected?.id===p.id?'selected':''}`} key={p.id} onClick={()=>setSelected(p)}><div className={`score ${statusClass(p.status)}`}>{p.healthScore}</div><div className="project-main"><b>{p.id} · {p.name}</b><span>{p.municipality} · {p.contractor}</span></div><div className="mini"><span>Spend</span><b>{spend}%</b></div><div className="mini"><span>Physical</span><b>{p.physicalProgress}%</b></div><div className={`status ${statusClass(p.status)}`}>{p.status}</div><ChevronRight size={18}/></button>})}</div></div>}

function ProjectsView({projects,selected,setSelected,query,setQuery,ask}:any){return <><section className="view-toolbar"><div className="search wide"><Search size={17}/><input placeholder="Search projects…" value={query} onChange={e=>setQuery(e.target.value)}/></div><span>{projects.length} projects</span></section><section className="workspace"><Portfolio projects={projects} selected={selected} setSelected={setSelected} query={query} setQuery={setQuery}/><div className="insight card"><div className="card-head"><div><h2>Project workspace</h2><p>Delivery, contractor, finance, risk and recovery context.</p></div><FileCheck2/></div>{selected?<ProjectInsight p={selected} ask={ask} loadChanges={()=>{}}/>:<div className="empty-state">Select a project.</div>}</div></section></>}

function ProjectInsight({p,ask,loadChanges}:{p:Project;ask:(q:string)=>void;loadChanges:()=>void}){const spend=Math.round(p.expenditure/p.budget*100); const div=spend-p.physicalProgress; return <div className="project-insight"><div className="health"><div className={`health-ring ${statusClass(p.status)}`}><strong>{p.healthScore}</strong><span>/100</span></div><div><b>{p.status}</b><span>{Math.round(p.confidence*100)}% confidence · {p.trend}</span></div></div><div className="bars"><label>Budget expenditure <b>{spend}%</b></label><div><i style={{width:`${spend}%`}}></i></div><label>Physical progress <b>{p.physicalProgress}%</b></label><div><i className="physical" style={{width:`${p.physicalProgress}%`}}></i></div></div><div className={`divergence ${div>15?'danger':''}`}><BarChart3 size={18}/><div><b>{div} pt divergence</b><span>{currency(p.expenditure)} spent of {currency(p.budget)}</span></div></div><div className="facts"><div><span>Overdue milestones</span><b>{p.overdueMilestones}</b></div><div><span>Open risks</span><b>{p.openRisks}</b></div><div><span>Evidence age</span><b>{p.evidenceAgeDays}d</b></div><div><span>Units completed</span><b>{p.unitsCompleted}/{p.unitsPlanned}</b></div></div><div className="blocker"><span>Primary blocker</span><b>{p.primaryBlocker}</b></div><div className="recovery-mini"><span>Recovery actions</span>{p.recoveryActions.length?p.recoveryActions.slice(0,3).map(a=><div key={a.id}><b>{a.title}</b><small>{a.owner} · {a.status}</small></div>):<small>No recovery plan required.</small>}</div><div className="insight-actions three"><button onClick={()=>ask('Why is this project at risk?')}>Why this score?</button><button onClick={()=>ask('What should we do next?')}>Recommended action</button><button onClick={loadChanges}>What changed?</button></div></div>}

function FinanceView({projects}:{projects:Project[]}){return <section className="card full-view"><div className="card-head"><div><h2>Budget vs Physical Progress</h2><p>Flag projects where financial progress is materially ahead of verified delivery.</p></div><CircleDollarSign/></div><div className="data-table"><div className="table-row header"><span>Project</span><span>Budget</span><span>Spend</span><span>Physical</span><span>Divergence</span></div>{[...projects].sort((a,b)=>(b.expenditure/b.budget*100-b.physicalProgress)-(a.expenditure/a.budget*100-a.physicalProgress)).map(p=>{const spend=Math.round(p.expenditure/p.budget*100),d=spend-p.physicalProgress;return <div className="table-row" key={p.id}><span><b>{p.id}</b><small>{p.name}</small></span><span>{currency(p.budget)}</span><span>{spend}%</span><span>{p.physicalProgress}%</span><span className={d>15?'danger-text':''}>{d} pts</span></div>})}</div></section>}

function MapView({projects,setSelected}:{projects:Project[];setSelected:(p:Project)=>void}){const provinces=[...new Set(projects.map(p=>p.province))];return <section className="map-layout"><div className="card map-card"><div className="card-head"><div><h2>Delivery Map</h2><p>Geographic portfolio view (schematic hackathon mode).</p></div><MapPinned/></div><div className="sa-map">{provinces.map((prov,i)=>{const ps=projects.filter(p=>p.province===prov);const worst=[...ps].sort((a,b)=>a.healthScore-b.healthScore)[0];return <button key={prov} className={`map-pin p${i+1} ${statusClass(worst.status)}`} onClick={()=>setSelected(worst)}><span>{ps.length}</span><b>{prov}</b></button>})}<div className="map-watermark">SOUTH AFRICA</div></div></div><div className="card map-side"><div className="card-head"><div><h2>Regional risk</h2><p>Click a region to open its highest-risk project.</p></div></div>{provinces.map(prov=>{const ps=projects.filter(p=>p.province===prov),score=Math.round(ps.reduce((s,p)=>s+p.healthScore,0)/ps.length);return <div className="region-row" key={prov}><span>{prov}</span><b>{score}/100</b></div>})}</div></section>}

function DataView({type,data,loading}:{type:View;data:any[];loading:boolean}){if(loading)return <section className="card full-view loading-view">Loading {type}…</section>; const titles:any={contractors:['Contractor Performance','Project delivery context; not a procurement sanction or blacklist.'],risks:['Risks & Blockers','Prioritise project exceptions requiring intervention.'],recovery:['Recovery Plans','Track corrective actions, owners and deadlines.'],audit:['Audit & Governance','Review material activity and AI-assisted actions.']};return <section className="card full-view"><div className="card-head"><div><h2>{titles[type][0]}</h2><p>{titles[type][1]}</p></div>{type==='audit'?<ShieldCheck/>:type==='contractors'?<Users/>:<Activity/>}</div><div className="data-cards">{data.map((x:any,i:number)=><div className="data-card" key={x.id||x.name||x.projectId||i}><div className="data-card-top"><b>{x.name||x.title||x.projectId||x.record}</b>{x.projectStatus&&<span className={`status ${statusClass(x.projectStatus)}`}>{x.projectStatus}</span>}</div>{type==='contractors'&&<><p>{x.projects} project(s) · average health {x.averageHealth}/100</p><small>{x.overdueMilestones} overdue milestones · {x.unitsCompleted} units completed</small><em>{x.performanceContext}</em></>}{type==='risks'&&<><p>{x.projectName}</p><small>{x.openRisks} open risks · {x.primaryBlocker}</small><em>{x.financialPhysicalDivergence} pt budget/progress divergence</em></>}{type==='recovery'&&<><p>{x.projectId} · {x.projectName}</p><small>{x.owner} · due {x.due}</small><em>{x.status}</em></>}{type==='audit'&&<><p>{x.record} · {x.action}</p><small>{x.user} · {x.role}</small><em>{x.aiAssisted?'AI-assisted action':'Human action'}</em></>}</div>)}</div></section>}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);