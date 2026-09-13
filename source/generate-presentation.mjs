import pptxgen from 'pptxgenjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const pptx = new pptxgen();
pptx.layout = 'LAYOUT_WIDE';
pptx.author = 'Pyrneo';
pptx.subject = 'HomeFlow AI — SITA GovTech SMME Innovation Challenge 2026';
pptx.title = 'HomeFlow AI by Pyrneo';
pptx.company = 'Pyrneo';
pptx.lang = 'en-ZA';
pptx.theme = { headFontFace: 'Aptos Display', bodyFontFace: 'Aptos', lang: 'en-ZA' };
pptx.defineSlideMaster({
  title: 'HOMEFLOW',
  background: { color: '080B10' },
  objects: [
    { rect: { x: 0, y: 0, w: 13.333, h: .055, fill: { color: '59E66F' }, line: { color: '59E66F' } } },
    { text: { text: 'HOMEFLOW AI by PYRNEO', options: { x: .55, y: 7.15, w: 4, h: .2, fontFace: 'Aptos', fontSize: 8, color: '637187', margin: 0 } } },
    { text: { text: 'From stalled projects to completed homes.', options: { x: 8.0, y: 7.15, w: 4.75, h: .2, fontFace: 'Aptos', fontSize: 8, color: '637187', align: 'right', margin: 0 } } }
  ],
  slideNumber: { x: 12.78, y: 7.12, color: '637187', fontSize: 8 }
});

const C = { bg:'080B10', panel:'0E151E', panel2:'121C27', white:'F2F6FB', muted:'93A2B6', green:'59E66F', blue:'42A5FF', red:'FF5664', amber:'F4BA55', line:'253347' };
const addTitle = (slide,title,sub='') => { slide.addText(title,{x:.6,y:.55,w:7.7,h:.55,fontFace:'Aptos Display',fontSize:26,bold:true,color:C.white,margin:0}); if(sub) slide.addText(sub,{x:.62,y:1.18,w:8.8,h:.42,fontSize:12,color:C.muted,margin:0}); slide.addShape(pptx.ShapeType.line,{x:.62,y:1.68,w:1.1,h:0,line:{color:C.green,width:3}}); slide.addShape(pptx.ShapeType.line,{x:1.72,y:1.68,w:.58,h:0,line:{color:C.blue,width:3}}); slide.addShape(pptx.ShapeType.line,{x:2.30,y:1.68,w:.42,h:0,line:{color:C.red,width:3}}); };
const pill = (slide,x,y,w,label,color=C.blue) => { slide.addShape(pptx.ShapeType.roundRect,{x,y,w,h:.34,rectRadius:.08,fill:{color:'0C121A'},line:{color,width:1}}); slide.addText(label,{x:x+.08,y:y+.08,w:w-.16,h:.15,fontSize:8,bold:true,color,align:'center',margin:0}); };
const card = (slide,x,y,w,h,title,body,color=C.blue) => { slide.addShape(pptx.ShapeType.roundRect,{x,y,w,h,rectRadius:.08,fill:{color:C.panel,transparency:3},line:{color:C.line,width:1}}); slide.addShape(pptx.ShapeType.ellipse,{x:x+.18,y:y+.18,w:.38,h:.38,fill:{color,transparency:15},line:{color,width:1.5}}); slide.addText(title,{x:x+.7,y:y+.18,w:w-.86,h:.38,fontSize:13,bold:true,color:C.white,margin:0}); slide.addText(body,{x:x+.22,y:y+.78,w:w-.44,h:h-.98,fontSize:9.5,color:C.muted,breakLine:false,margin:0,fit:'shrink'}); };

// 1
{
 const s=pptx.addSlide(); s.background={color:C.bg};
 s.addShape(pptx.ShapeType.rect,{x:0,y:0,w:13.333,h:7.5,fill:{color:C.bg},line:{color:C.bg}});
 for(let i=0;i<16;i++) s.addShape(pptx.ShapeType.ellipse,{x:8.2+(i%4)*1.05,y:1.2+Math.floor(i/4)*1.1,w:.06,h:.06,fill:{color:i%3===0?C.green:i%3===1?C.blue:C.red,transparency:20},line:{transparency:100}});
 s.addText('PYRNEO',{x:.65,y:.55,w:2.25,h:.36,fontSize:20,bold:true,color:C.white,charSpacing:3,margin:0});
 s.addText('PEOPLE   SOLUTIONS   PROGRESS',{x:.67,y:.97,w:3.2,h:.18,fontSize:7.5,color:C.muted,charSpacing:2,margin:0});
 s.addText('HomeFlow AI',{x:.68,y:2.05,w:6.4,h:.75,fontFace:'Aptos Display',fontSize:42,bold:true,color:C.white,margin:0});
 s.addText('AI-powered delivery assurance for Human Settlements',{x:.72,y:2.95,w:6.55,h:.5,fontSize:18,color:'C8D4E3',margin:0});
 s.addShape(pptx.ShapeType.line,{x:.72,y:3.58,w:1.15,h:0,line:{color:C.green,width:4}}); s.addShape(pptx.ShapeType.line,{x:1.87,y:3.58,w:.65,h:0,line:{color:C.blue,width:4}}); s.addShape(pptx.ShapeType.line,{x:2.52,y:3.58,w:.5,h:0,line:{color:C.red,width:4}});
 s.addText('From stalled projects to completed homes.',{x:.72,y:3.86,w:5.8,h:.35,fontSize:15,bold:true,color:C.white,margin:0});
 s.addText('SITA GovTech SMME Innovation Challenge 2026',{x:.72,y:4.48,w:4.5,h:.22,fontSize:9,color:C.muted,charSpacing:1.4,margin:0});
 card(s,7.55,1.75,4.95,1.08,'MONITOR PROGRESS','Bring portfolio, budget, milestone and site evidence into one delivery view.',C.green);
 card(s,7.55,3.0,4.95,1.08,'ANTICIPATE RISK','Detect deteriorating delivery patterns before they become executive crises.',C.blue);
 card(s,7.55,4.25,4.95,1.08,'ORCHESTRATE RECOVERY','Turn insight into owned actions, deadlines, escalation and evidence.',C.red);
 pill(s,.72,5.55,1.65,'Project visibility',C.green); pill(s,2.55,5.55,1.75,'Early risk detection',C.blue); pill(s,4.48,5.55,2.25,'Recovery orchestration',C.red);
 s.addText('HomeFlow AI by Pyrneo',{x:.72,y:6.55,w:3.2,h:.25,fontSize:10,color:C.muted,margin:0});
}
// 2 Challenge
{
 const s=pptx.addSlide('HOMEFLOW'); addTitle(s,'The Challenge','Housing delivery problems are often discovered too late.');
 const items=[['Fragmented project visibility','Programme teams work across disconnected reports, spreadsheets and systems.',C.green],['Disconnected cost, schedule & progress','Financial expenditure and verified physical delivery are difficult to reconcile quickly.',C.blue],['Late detection of delivery risk','Schedule slippage and contractor deterioration can escalate before executive intervention.',C.red],['Weak verification of site evidence','Reported progress may not be supported by current, structured and reviewable evidence.',C.green],['Limited accountability & escalation','Actions, decisions and blockers can become fragmented across meetings and emails.',C.blue]];
 items.forEach((it,i)=>card(s,.62+i*2.48,2.1,2.27,2.75,it[0],it[1],it[2]));
 s.addShape(pptx.ShapeType.roundRect,{x:.62,y:5.25,w:12.08,h:.83,fill:{color:'171116'},line:{color:'4C2029',width:1.2}});
 s.addText('RESULT',{x:.88,y:5.53,w:.85,h:.18,fontSize:9,bold:true,color:C.red,charSpacing:2,margin:0});
 s.addText('Delayed homes  •  budget leakage  •  stalled projects  •  reduced public value',{x:1.78,y:5.45,w:9.75,h:.34,fontSize:14,bold:true,color:C.white,margin:0});
}
//3 Solution
{
 const s=pptx.addSlide('HOMEFLOW'); addTitle(s,'Our Solution','A Human Settlements delivery control tower powered by responsible AI.');
 const items=[['AI Project Health Score','See which projects need attention first, with transparent drivers and confidence.',C.green],['Early Warning Engine','Detect budget, schedule, milestone, evidence and contractor risk patterns.',C.blue],['Recovery Workflows','Assign actions, owners, due dates, dependencies and escalation paths.',C.red],['Site Evidence Capture','Link photos, inspections, documents and progress updates to delivery milestones.',C.green],['Executive Dashboards','Move from national or provincial portfolio health to project-level evidence.',C.blue],['Audit & Governance','Track material changes, AI-assisted actions, approvals and official decisions.',C.red]];
 items.forEach((it,i)=>{ const col=i%3,row=Math.floor(i/3); card(s,.72+col*4.08,2.1+row*2.0,3.78,1.68,it[0],it[1],it[2]); });
 s.addText('From stalled projects to completed homes.',{x:.75,y:6.38,w:5.8,h:.3,fontSize:15,bold:true,color:C.white,margin:0});
}
//4 workflow
{
 const s=pptx.addSlide('HOMEFLOW'); addTitle(s,'How It Works','Data → Intelligence → Action → Accountability → Impact');
 const steps=[['1','Capture','Project data and site evidence',C.green],['2','Track','Milestones, spend and physical progress',C.blue],['3','Explain','AI detects risk and shows likely causes',C.red],['4','Act','Officials assign interventions and recovery plans',C.green],['5','Verify','Leadership monitors outcomes and evidence',C.blue]];
 steps.forEach((st,i)=>{ const x=.72+i*2.47; s.addShape(pptx.ShapeType.ellipse,{x,y:2.12,w:.75,h:.75,fill:{color:st[3],transparency:18},line:{color:st[3],width:2}}); s.addText(st[0],{x:x+.24,y:2.33,w:.27,h:.18,fontSize:14,bold:true,color:C.white,align:'center',margin:0}); s.addText(st[1],{x,y:3.12,w:2.0,h:.28,fontSize:14,bold:true,color:C.white,margin:0}); s.addText(st[2],{x,y:3.55,w:2.0,h:.8,fontSize:10,color:C.muted,margin:0}); if(i<4) s.addText('›',{x:x+1.92,y:2.25,w:.35,h:.3,fontSize:28,color:'55677C',margin:0}); });
 s.addShape(pptx.ShapeType.roundRect,{x:.72,y:5.15,w:11.9,h:.8,fill:{color:C.panel2},line:{color:C.line}}); s.addText('Human oversight remains in control; AI supports faster and better decisions.',{x:1.1,y:5.43,w:11.1,h:.22,fontSize:13,bold:true,color:C.white,align:'center',margin:0});
}
//5 Features
{
 const s=pptx.addSlide('HOMEFLOW'); addTitle(s,'Platform Features','One platform. Greater delivery impact.');
 const items=[['Portfolio Dashboard','Complete visibility across all projects.',C.green],['Project Workspace','Manage milestones, work items and comments.',C.blue],['Budget vs Progress','Track cost and verified delivery divergence.',C.red],['Contractor Performance','Monitor quality, speed and delivery trends.',C.green],['Risk Register','Identify, assign and mitigate risk early.',C.blue],['Alerts & Escalation','Surface overdue and high-impact interventions.',C.red],['Multilingual Voice AI','Hands-free queries, navigation and safe actions.',C.green],['Role-Based Access','Tailored access for executives, teams and auditors.',C.blue]];
 items.forEach((it,i)=>{ const col=i%4,row=Math.floor(i/4); card(s,.64+col*3.08,2.02+row*2.05,2.82,1.72,it[0],it[1],it[2]); });
 s.addText('Web and mobile ready',{x:9.6,y:6.25,w:2.7,h:.3,fontSize:13,bold:true,color:C.white,align:'right',margin:0});
}
//6 Architecture
{
 const s=pptx.addSlide('HOMEFLOW'); addTitle(s,'Microsoft-Aligned Architecture','API-first. Secure. Scalable. Integration-ready.');
 const layers=[['DATA SOURCES',['Excel / CSV','ERP & finance','Project reports','GIS','Mobile site capture'],C.green],['HOMEFLOW INTELLIGENCE',['Azure OpenAI','Business rules','Risk scoring','Workflow engine','Grounded Copilot'],C.blue],['APPLICATION',['Dashboards','Projects & recovery','Voice AI','Notifications','Reporting'],C.red]];
 layers.forEach((l,i)=>{const x=.72+i*4.08; s.addShape(pptx.ShapeType.roundRect,{x,y:2.05,w:3.6,h:3.3,fill:{color:C.panel},line:{color:l[2],width:1.6}}); s.addText(l[0],{x:x+.22,y:2.3,w:3.15,h:.3,fontSize:12,bold:true,color:l[2],charSpacing:1.2,margin:0}); l[1].forEach((v,j)=>s.addText('• '+v,{x:x+.26,y:2.95+j*.42,w:3.0,h:.25,fontSize:10.5,color:C.white,margin:0})); if(i<2)s.addText('›',{x:x+3.68,y:3.25,w:.28,h:.35,fontSize:29,color:'586A7E',margin:0});});
 s.addShape(pptx.ShapeType.roundRect,{x:.72,y:5.62,w:11.75,h:.65,fill:{color:'11182A'},line:{color:'374D68'}}); s.addText('Azure App Service / Container Apps   |   Azure SQL / PostgreSQL   |   Blob Storage   |   Entra ID   |   Key Vault   |   Power BI   |   Azure Monitor',{x:.92,y:5.84,w:11.35,h:.18,fontSize:8.8,color:'CBD8E8',align:'center',margin:0});
}
//7 Value
{
 const s=pptx.addSlide('HOMEFLOW'); addTitle(s,'Value and Impact','Turning insight into stronger delivery discipline.');
 const items=[['Earlier intervention','Identify deteriorating projects before delays compound.',C.green],['Better oversight','Connect portfolio, budget, physical progress and evidence.',C.blue],['Faster blocker resolution','Give actions clear owners, dates and escalation paths.',C.red],['Stronger accountability','Preserve an auditable link between evidence, recommendation and decision.',C.green],['Improved housing outcomes','Improve the path from public budget to completed homes.',C.blue]];
 items.forEach((it,i)=>card(s,.68+i*2.49,2.12,2.26,2.75,it[0],it[1],it[2]));
 s.addShape(pptx.ShapeType.roundRect,{x:.72,y:5.35,w:11.76,h:.8,fill:{color:C.panel2},line:{color:'29415A'}}); s.addText('HomeFlow AI helps government detect risk earlier, intervene faster, and improve the path from budget to completed homes.',{x:1.0,y:5.6,w:11.15,h:.28,fontSize:13,bold:true,color:C.white,align:'center',margin:0});
}
//8 Pilot
{
 const s=pptx.addSlide('HOMEFLOW'); addTitle(s,'90-Day Pilot Plan','Start focused, learn quickly, scale on evidence.');
 const phases=[['PHASE 1','Discover & Configure',['Select pilot projects','Define data inputs','Configure users and rules'],C.green],['PHASE 2','Activate & Train',['Train officials','Launch site reporting','Run AI in advisory mode'],C.blue],['PHASE 3','Measure & Scale',['Review outcomes','Refine workflows','Prepare scale model'],C.red]];
 phases.forEach((p,i)=>{const x=.82+i*4.05; s.addShape(pptx.ShapeType.roundRect,{x,y:2.05,w:3.52,h:3.35,fill:{color:C.panel},line:{color:p[3],width:1.6}}); s.addText(p[0],{x:x+.25,y:2.35,w:1.2,h:.2,fontSize:9,bold:true,color:p[3],charSpacing:1.2,margin:0}); s.addText(p[1],{x:x+.25,y:2.75,w:2.95,h:.45,fontSize:18,bold:true,color:C.white,margin:0}); p[2].forEach((v,j)=>s.addText('• '+v,{x:x+.28,y:3.55+j*.48,w:2.95,h:.28,fontSize:10.5,color:C.muted,margin:0}));});
 s.addText('Ideal pilot scope: one province or municipality, 10–20 projects.',{x:.85,y:5.83,w:6.8,h:.3,fontSize:12,bold:true,color:C.white,margin:0});
}
//9 close
{
 const s=pptx.addSlide(); s.background={color:C.bg};
 s.addText('PYRNEO',{x:.65,y:.6,w:2.2,h:.35,fontSize:20,bold:true,color:C.white,charSpacing:3,margin:0});
 s.addText('Thank You',{x:.7,y:2.0,w:5.7,h:.7,fontFace:'Aptos Display',fontSize:42,bold:true,color:C.white,margin:0});
 s.addText('HomeFlow AI by Pyrneo',{x:.73,y:2.95,w:4.5,h:.4,fontSize:20,color:'CFD9E6',margin:0});
 s.addShape(pptx.ShapeType.line,{x:.75,y:3.52,w:1.1,h:0,line:{color:C.green,width:4}}); s.addShape(pptx.ShapeType.line,{x:1.85,y:3.52,w:.6,h:0,line:{color:C.blue,width:4}}); s.addShape(pptx.ShapeType.line,{x:2.45,y:3.52,w:.45,h:0,line:{color:C.red,width:4}});
 s.addText('Turning stalled projects into completed homes.',{x:.75,y:3.9,w:5.8,h:.35,fontSize:16,bold:true,color:C.white,margin:0});
 s.addText('Built for the SITA GovTech SMME Innovation Challenge 2026',{x:.75,y:4.5,w:5.5,h:.25,fontSize:10,color:C.muted,margin:0});
 card(s,7.25,1.8,4.8,1.1,'SMARTER SETTLEMENTS','Use delivery intelligence to focus intervention where it matters most.',C.green);
 card(s,7.25,3.15,4.8,1.1,'STRONGER COMMUNITIES','Connect public investment to visible, accountable delivery outcomes.',C.blue);
 card(s,7.25,4.5,4.8,1.1,'RESPONSIBLE AI','Keep accountable officials in control of consequential decisions.',C.red);
 s.addText('pyrneo.com',{x:.75,y:6.65,w:2,h:.25,fontSize:10,color:C.muted,margin:0});
}

const outDir = path.join(root,'presentations');
fs.mkdirSync(outDir,{recursive:true});
await pptx.writeFile({ fileName: path.join(outDir,'HomeFlow_AI_by_Pyrneo_Presentation.pptx') });
console.log('Generated HomeFlow AI presentation.');
