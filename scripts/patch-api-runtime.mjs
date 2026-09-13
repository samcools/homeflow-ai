import fs from 'node:fs';

const file='apps/api/dist/server-enhanced.js';
let src=fs.readFileSync(file,'utf8');

const greeting="if (/^(hi|hello|hey|howzit|sawubona|good morning|good afternoon|good evening)[!.?,\\s]*$/i.test(question.trim())) return 'Hello. How can I help you with HomeFlow today? You can ask me about the platform, risk projects, completed projects, overdue milestones, contractors, provinces, recovery plans or reports.';";
if(!src.includes('How can I help you with HomeFlow today?')){
  src=src.replace(/function platformAnswer\(question,\s*projectId,\s*ps\)\s*\{\s*const q\s*=\s*question\.toLowerCase\(\);/,m=>`${m}${greeting}`);
}

src=src.replace(/from:\s*REPORT_FROM_EMAIL,\s*to:\s*\[ALERT_RECIPIENT\]/g,"from:(process.env.REPORT_FROM_EMAIL||REPORT_FROM_EMAIL),to:[(process.env.ALERT_RECIPIENT||ALERT_RECIPIENT)]");
src=src.replace(/recipient:\s*ALERT_RECIPIENT/g,"recipient:(process.env.ALERT_RECIPIENT||ALERT_RECIPIENT)");

if(!src.includes("/api/admin/settings/test-email")){
 const routes=`
app.get('/api/admin/settings',requireRoles('Administrator'),(_req,res)=>res.json({
  openAIConfigured:Boolean(process.env.OPENAI_API_KEY),
  reportEmailConfigured:Boolean(process.env.RESEND_API_KEY),
  alertRecipient:process.env.ALERT_RECIPIENT||ALERT_RECIPIENT,
  reportFromEmail:process.env.REPORT_FROM_EMAIL||REPORT_FROM_EMAIL,
  defaultModel:DEFAULT_MODEL,
  storage:'runtime',
  persistenceNotice:'Settings saved here apply immediately to the running HomeFlow service. For persistence across Render redeploys, save the same secrets in Render Environment.'
}));
app.post('/api/admin/settings',requireRoles('Administrator'),(req,res)=>{
  const body=req.body||{};
  const openAIKey=String(body.openAIKey||'').trim();
  const resendApiKey=String(body.resendApiKey||'').trim();
  const alertRecipient=String(body.alertRecipient||'').trim();
  const reportFromEmail=String(body.reportFromEmail||'').trim();
  if(openAIKey)process.env.OPENAI_API_KEY=openAIKey;
  if(resendApiKey)process.env.RESEND_API_KEY=resendApiKey;
  if(alertRecipient)process.env.ALERT_RECIPIENT=alertRecipient;
  if(reportFromEmail)process.env.REPORT_FROM_EMAIL=reportFromEmail;
  logUsage(currentUser(req),'Updated secure runtime settings','AI and email configuration',req);
  res.json({ok:true,openAIConfigured:Boolean(process.env.OPENAI_API_KEY),reportEmailConfigured:Boolean(process.env.RESEND_API_KEY),alertRecipient:process.env.ALERT_RECIPIENT||ALERT_RECIPIENT,reportFromEmail:process.env.REPORT_FROM_EMAIL||REPORT_FROM_EMAIL,defaultModel:DEFAULT_MODEL,storage:'runtime'});
});
app.post('/api/admin/settings/test-email',requireRoles('Administrator'),async(req,res)=>{
  const recipient=process.env.ALERT_RECIPIENT||ALERT_RECIPIENT;
  const result=await sendEmail('HomeFlow AI email configuration test','<h2>HomeFlow AI email test</h2><p>Your transactional email configuration is working.</p>','HomeFlow AI email configuration is working.');
  if(result.ok)logUsage(currentUser(req),'Sent email configuration test',recipient,req);
  res.status(result.ok?200:503).json({...result,recipient});
});
`;
 src=src.replace(/const moduleDir\s*=/,`${routes}\nconst moduleDir=`);
}

fs.writeFileSync(file,src);
console.log('HomeFlow runtime API patch applied.');
