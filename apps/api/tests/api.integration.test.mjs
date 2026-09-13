import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';

const port = 19081;
const base = `http://127.0.0.1:${port}`;

async function waitForServer() {
  let last;
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`${base}/api/health`);
      if (r.ok) return;
      last = new Error(`health ${r.status}`);
    } catch (e) { last = e; }
    await new Promise(r => setTimeout(r, 100));
  }
  throw last || new Error('server did not start');
}

async function login(email) {
  const r = await fetch(`${base}/api/auth/login`, {
    method: 'POST', headers: {'content-type':'application/json'},
    body: JSON.stringify({email,password:'HomeFlow!2026'}),
  });
  assert.equal(r.status, 200, `login failed for ${email}`);
  return r.json();
}
async function get(path, token) {
  const r = await fetch(`${base}${path}`, {headers:{authorization:`Bearer ${token}`}});
  const body = await r.json().catch(() => ({}));
  return {r, body};
}
async function ask(question, token) {
  const r = await fetch(`${base}/api/ai/copilot`, {method:'POST',headers:{authorization:`Bearer ${token}`,'content-type':'application/json'},body:JSON.stringify({question})});
  return {r,body:await r.json()};
}

test('HomeFlow enhanced authenticated API, RBAC, risks, Gantt, alerts and conversational copilot', async (t) => {
  const child = spawn(process.execPath, ['dist/server-enhanced.js'], {
    cwd: process.cwd(), env: {...process.env, PORT:String(port), OPENAI_API_KEY:'', RESEND_API_KEY:''}, stdio: ['ignore','pipe','pipe'],
  });
  t.after(() => child.kill('SIGTERM'));
  await waitForServer();

  const admin = await login('admin@homeflow.ai');
  const health = await fetch(`${base}/api/health`).then(r=>r.json());
  assert.equal(health.defaultModel,'gpt-5.6-luna');
  assert.equal(health.alertRecipient,'samson@pyrneo.com');

  const dashboard = await get('/api/dashboard', admin.token);
  assert.equal(dashboard.r.status, 200);
  assert.equal(dashboard.body.totalProjects, 36);

  const projects = await get('/api/projects', admin.token);
  assert.equal(projects.r.status, 200);
  assert.equal(projects.body.length, 36);

  const gantt = await get(`/api/projects/${projects.body[0].id}/gantt`, admin.token);
  assert.equal(gantt.r.status, 200);
  assert.equal(gantt.body.projectName, projects.body[0].name);
  assert.ok(gantt.body.startDate && gantt.body.forecastCompletion);

  const risks = await get('/api/risks', admin.token);
  assert.equal(risks.r.status, 200);
  assert.ok(risks.body.length > 0);
  assert.ok(risks.body.every(r => r.projectName && r.openRisks > 0 && r.primaryBlocker));

  const alerts = await get('/api/alerts', admin.token);
  assert.equal(alerts.r.status, 200);
  assert.equal(alerts.body.recipient,'samson@pyrneo.com');
  assert.ok(alerts.body.warnings.length > 0);

  const recovery = await get('/api/recovery', admin.token);
  assert.equal(recovery.r.status, 200);
  assert.ok(recovery.body.length > 0);

  const about = await ask('Hi, can you tell me about this platform please?',admin.token);
  assert.equal(about.r.status,200);
  assert.match(about.body.answer,/delivery assurance platform/i);

  const riskQuestion = await ask('Tell me about risk projects',admin.token);
  assert.equal(riskQuestion.r.status,200);
  assert.match(riskQuestion.body.answer,/risk projects|urgent/i);

  const completedQuestion = await ask('Tell me about completed projects',admin.token);
  assert.equal(completedQuestion.r.status,200);
  assert.match(completedQuestion.body.answer,/completed/i);

  const dueQuestion = await ask('Which projects are due or overdue?',admin.token);
  assert.equal(dueQuestion.r.status,200);
  assert.match(dueQuestion.body.answer,/overdue/i);

  const longQuestion = await ask('Please continue this conversation. '.repeat(80),admin.token);
  assert.equal(longQuestion.r.status,200);
  assert.ok(longQuestion.body.answer.length > 10);

  const notificationStatus = await get('/api/notifications/status',admin.token);
  assert.equal(notificationStatus.r.status,200);
  assert.equal(notificationStatus.body.recipient,'samson@pyrneo.com');

  const manager = await login('manager@homeflow.ai');
  const managerProjects = await get('/api/projects', manager.token);
  assert.ok(managerProjects.body.every(p => p.province === 'Gauteng'));
  const managerRisks = await get('/api/risks', manager.token);
  assert.ok(managerRisks.body.every(r => r.province === 'Gauteng'));
  const forbidden = await get('/api/openai/status', manager.token);
  assert.equal(forbidden.r.status, 403);

  const contractor = await login('contractor@homeflow.ai');
  const contractorProjects = await get('/api/projects', contractor.token);
  assert.ok(contractorProjects.body.every(p => p.contractor === 'Ubuntu Build Consortium'));

  const usage = await get('/api/usage-logs', admin.token);
  assert.equal(usage.r.status, 200);
  assert.ok(Array.isArray(usage.body));
});
