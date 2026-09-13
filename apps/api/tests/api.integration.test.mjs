import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';

const port = 19081;
const base = `http://127.0.0.1:${port}`;

async function waitForServer() {
  let last;
  for (let i = 0; i < 50; i++) {
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
    method: 'POST',
    headers: {'content-type':'application/json'},
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

test('HomeFlow authenticated API, RBAC, recovery and copilot workflows', async (t) => {
  const child = spawn(process.execPath, ['dist/server.js'], {
    cwd: process.cwd(),
    env: {...process.env, PORT:String(port), OPENAI_API_KEY:''},
    stdio: ['ignore','pipe','pipe'],
  });
  t.after(() => child.kill('SIGTERM'));
  await waitForServer();

  const admin = await login('admin@homeflow.ai');
  const dashboard = await get('/api/dashboard', admin.token);
  assert.equal(dashboard.r.status, 200);
  assert.equal(dashboard.body.totalProjects, 36);

  const projects = await get('/api/projects', admin.token);
  assert.equal(projects.r.status, 200);
  assert.equal(projects.body.length, 36);

  const contractors = await get('/api/contractors', admin.token);
  assert.equal(contractors.r.status, 200);
  assert.ok(contractors.body.length >= 8);

  const gauteng = await get('/api/provinces/Gauteng', admin.token);
  assert.equal(gauteng.r.status, 200);
  assert.ok(gauteng.body.projects.length > 0);
  assert.ok(gauteng.body.projects.every(p => p.province === 'Gauteng'));

  const recovery = await get('/api/recovery', admin.token);
  assert.equal(recovery.r.status, 200);
  assert.ok(recovery.body.length > 0);
  assert.ok(recovery.body.every(a => a.projectName && a.title && a.owner));

  const brief = await get('/api/executive-brief', admin.token);
  assert.equal(brief.r.status, 200);
  assert.ok(brief.body.priorities.length > 0);

  const copilotResponse = await fetch(`${base}/api/ai/copilot`, {
    method:'POST',
    headers:{authorization:`Bearer ${admin.token}`,'content-type':'application/json'},
    body:JSON.stringify({question:'Which projects require attention today?'})
  });
  const copilot = await copilotResponse.json();
  assert.equal(copilotResponse.status, 200);
  assert.ok(copilot.answer.length > 20);
  assert.match(copilot.provider, /rules/);

  const manager = await login('manager@homeflow.ai');
  const managerProjects = await get('/api/projects', manager.token);
  assert.equal(managerProjects.r.status, 200);
  assert.ok(managerProjects.body.length > 0);
  assert.ok(managerProjects.body.every(p => p.province === 'Gauteng'));

  const contractor = await login('contractor@homeflow.ai');
  const contractorProjects = await get('/api/projects', contractor.token);
  assert.equal(contractorProjects.r.status, 200);
  assert.ok(contractorProjects.body.length > 0);
  assert.ok(contractorProjects.body.every(p => p.contractor === 'Ubuntu Build Consortium'));

  const forbidden = await get('/api/openai/status', manager.token);
  assert.equal(forbidden.r.status, 403);

  const usage = await get('/api/usage-logs', admin.token);
  assert.equal(usage.r.status, 200);
  assert.ok(Array.isArray(usage.body));
});
