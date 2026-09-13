import './stable-ui-fixes.css';

const API=import.meta.env.VITE_API_URL||(import.meta.env.PROD?'':'http://localhost:8080');
const getToken=()=>sessionStorage.getItem('homeflow_token')||'';
const authHeaders=(json=true)=>{const h:Record<string,string>={Authorization:`Bearer ${getToken()}`};if(json)h['Content-Type']='application/json';return h};

async function json(path:string,init?:RequestInit){const r=await fetch(`${API}${path}`,{...init,headers:{...authHeaders(init?.method!=='GET'),...(init?.headers||{})}});const b=await r.json().catch(()=>({}));if(!r.ok)throw new Error(b.error||`Request failed (${r.status})`);return b}

function currentTitle(){return document.querySelector('main header h1')?.textContent?.trim()||''}
function showInlineMessage(host:HTMLElement,text:string,tone:'ok'|'bad'|'info'='info'){let el=host.querySelector('.hf-settings-message') as HTMLElement|null;if(!el){el=document.createElement('div');el.className='hf-settings-message';host.appendChild(el)}el.className=`hf-settings-message ${tone}`;el.textContent=text}

async function enhanceAdminSettings(){
 const panel=document.querySelector('.settings-panel') as HTMLElement|null;
 if(!panel||panel.dataset.hfEnhanced==='1')return;
 panel.dataset.hfEnhanced='1';
 const section=document.createElement('section');
 section.className='hf-config-section';
 section.innerHTML=`
   <div class="hf-config-heading"><div><span>SECURE CONFIGURATION</span><h3>API and Email Settings</h3></div></div>
   <div class="hf-config-grid">
     <label>OpenAI API key<input id="hf-openai-key" type="password" autocomplete="new-password" placeholder="sk-..." /></label>
     <label>Resend API key<input id="hf-resend-key" type="password" autocomplete="new-password" placeholder="re_..." /></label>
     <label>Report recipient<input id="hf-report-recipient" type="email" value="samson@pyrneo.com" /></label>
     <label>Report sender<input id="hf-report-sender" type="text" value="HomeFlow AI <onboarding@resend.dev>" /></label>
   </div>
   <div class="hf-config-actions">
     <button type="button" data-action="save">Save settings</button>
     <button type="button" data-action="openai">Test OpenAI</button>
     <button type="button" data-action="email">Send test email</button>
   </div>
   <p class="hf-config-note">Secret values are write-only. They are sent over HTTPS to the HomeFlow server and are never written to GitHub or browser storage. Settings saved here apply immediately to the running service. For persistence across a Render redeploy, the same secrets should also be stored in Render Environment.</p>`;
 panel.appendChild(section);
 const openAI=section.querySelector('#hf-openai-key') as HTMLInputElement;
 const resend=section.querySelector('#hf-resend-key') as HTMLInputElement;
 const recipient=section.querySelector('#hf-report-recipient') as HTMLInputElement;
 const sender=section.querySelector('#hf-report-sender') as HTMLInputElement;
 try{const s=await json('/api/admin/settings',{method:'GET'});recipient.value=s.alertRecipient||recipient.value;sender.value=s.reportFromEmail||sender.value;showInlineMessage(section,`OpenAI: ${s.openAIConfigured?'configured':'not configured'} · Email: ${s.reportEmailConfigured?'configured':'not configured'}`,'info')}catch(e:any){showInlineMessage(section,e.message||'Unable to read settings.','bad')}
 section.querySelector('[data-action="save"]')?.addEventListener('click',async()=>{try{showInlineMessage(section,'Saving settings…','info');const payload:any={alertRecipient:recipient.value.trim(),reportFromEmail:sender.value.trim()};if(openAI.value.trim())payload.openAIKey=openAI.value.trim();if(resend.value.trim())payload.resendApiKey=resend.value.trim();const s=await json('/api/admin/settings',{method:'POST',body:JSON.stringify(payload)});openAI.value='';resend.value='';showInlineMessage(section,`Saved. OpenAI: ${s.openAIConfigured?'configured':'not configured'} · Email: ${s.reportEmailConfigured?'configured':'not configured'}`,'ok')}catch(e:any){showInlineMessage(section,e.message||'Settings could not be saved.','bad')}});
 section.querySelector('[data-action="openai"]')?.addEventListener('click',async()=>{try{showInlineMessage(section,'Testing OpenAI…','info');const headers:Record<string,string>={};if(openAI.value.trim())headers['x-openai-api-key']=openAI.value.trim();const r=await json('/api/openai/test',{method:'POST',headers,body:'{}'});showInlineMessage(section,r.message||'OpenAI connection successful.','ok')}catch(e:any){showInlineMessage(section,e.message||'OpenAI test failed.','bad')}});
 section.querySelector('[data-action="email"]')?.addEventListener('click',async()=>{try{showInlineMessage(section,'Sending test email…','info');const payload:any={alertRecipient:recipient.value.trim(),reportFromEmail:sender.value.trim()};if(resend.value.trim())payload.resendApiKey=resend.value.trim();await json('/api/admin/settings',{method:'POST',body:JSON.stringify(payload)});resend.value='';const r=await json('/api/admin/settings/test-email',{method:'POST',body:'{}'});showInlineMessage(section,r.ok?`Test email sent to ${r.recipient}.`:(r.error||'Email test failed.'),r.ok?'ok':'bad')}catch(e:any){showInlineMessage(section,e.message||'Email test failed.','bad')}});
}

let lastDashboardToken='';
async function enhanceDashboardSummary(){
 if(currentTitle()!=='Human Settlements Delivery Assurance')return;
 const metrics=document.querySelector('main .metrics') as HTMLElement|null;
 if(!metrics||document.querySelector('.hf-portfolio-summary'))return;
 const token=getToken();if(!token)return;
 try{const d=await json('/api/dashboard',{method:'GET'});if(token!==getToken())return;const section=document.createElement('section');section.className='hf-portfolio-summary';const pct=d.unitsPlanned?Math.round(d.unitsCompleted/d.unitsPlanned*100):0;section.innerHTML=`
   <div><span>Portfolio budget</span><b>${new Intl.NumberFormat('en-ZA',{style:'currency',currency:'ZAR',maximumFractionDigits:0}).format(d.budget||0)}</b></div>
   <div><span>Expenditure to date</span><b>${new Intl.NumberFormat('en-ZA',{style:'currency',currency:'ZAR',maximumFractionDigits:0}).format(d.expenditure||0)}</b></div>
   <div><span>Average physical progress</span><b>${d.averagePhysicalProgress||0}%</b></div>
   <div><span>Units delivered</span><b>${Number(d.unitsCompleted||0).toLocaleString('en-ZA')} / ${Number(d.unitsPlanned||0).toLocaleString('en-ZA')} <small>${pct}%</small></b></div>
   <div><span>Watch / Healthy / Completed</span><b>${d.watch||0} / ${d.onTrack||0} / ${d.completed||0}</b></div>
   <div><span>High budget-progress divergence</span><b>${d.highDivergenceProjects||0} projects</b></div>`;
 metrics.insertAdjacentElement('afterend',section);lastDashboardToken=token}catch{}
}

function fixStatusChartDetail(){
 if(currentTitle()!=='Human Settlements Delivery Assurance')return;
 const chart=document.querySelector('.bar-chart') as HTMLElement|null;
 const detail=document.querySelector('.chart-detail') as HTMLElement|null;
 if(!chart||!detail||chart.dataset.hfFixed==='1')return;
 chart.dataset.hfFixed='1';
 const buttons=[...chart.querySelectorAll('button')] as HTMLButtonElement[];
 const update=(btn:HTMLButtonElement)=>{const value=btn.querySelector('span')?.textContent?.trim()||'0';const label=btn.querySelector('b')?.textContent?.trim()||'projects';detail.innerHTML=`<strong>${value}</strong> ${label.toLowerCase()} projects in the visible portfolio.`};
 buttons.forEach(btn=>btn.addEventListener('click',()=>update(btn)));
 if(buttons[0])update(buttons[0]);
}

let scheduled=false;
function enhance(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;void enhanceAdminSettings();void enhanceDashboardSummary();fixStatusChartDetail()})}
const observer=new MutationObserver(enhance);observer.observe(document.documentElement,{subtree:true,childList:true});window.addEventListener('load',enhance);setTimeout(enhance,250);
