import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = p => fs.readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const index = read('apps/web/index.html');
const portal = read('apps/web/src/portal-stable.tsx');
const css = read('apps/web/src/portal-stable.css');

assert.match(index, /src\/portal-stable\.tsx/, 'Stable HomeFlow portal entrypoint must be active');
assert.ok(!index.includes('enhancements.ts'), 'Legacy DOM enhancement script must not be loaded');
assert.ok(!index.includes('smart-enhancements.ts'), 'Legacy smart DOM mutation script must not be loaded');
assert.ok(!index.includes('risk-page-fix.ts'), 'Legacy risk-page mutation script must not be loaded');

for (const feature of [
  'CommandCentre','Projects','MapView','Contractors','Finance','Risks','Recovery','Audit','Usage',
  'Voice Agent','Ask HomeFlow','/api/ai/copilot','/api/notifications/report','exportExcel','exportPdf',
  'Gantt','South Africa Delivery Map','AI & Voice Settings','gpt-5.6-luna',"risks:'risks'"
]) assert.ok(portal.includes(feature), `Missing stable portal feature: ${feature}`);

for (const cls of ['.metrics','.metric strong','.gantt','.risk-grid','.risk-card','.sa-map','.copilot','.settings-panel','.login-page','.detail','.table']) {
  assert.ok(css.includes(cls), `Missing stable professional style: ${cls}`);
}

assert.match(css,/\.metric strong\{display:block;color:#fff!important/, 'Dashboard quantities must render white');
assert.ok(portal.includes("user.role==='Administrator'"), 'Administrator settings gate must remain');
assert.ok(portal.includes("onClick={()=>navigate('command')}"), 'Pyrneo brand must navigate home');
assert.ok(!/Powered by Pyrneo/i.test(portal), 'Powered by Pyrneo wording must not appear');
assert.ok(portal.includes("fetchJson('/api/ai/copilot'"), 'Conversational copilot endpoint must be connected');
assert.ok(portal.includes("fetchJson('/api/notifications/report'"), 'Email report endpoint must be connected');
assert.ok(portal.includes("fetchJson('/api/projects'"), 'Projects must load from the API');
assert.ok(portal.includes("case'risks'"), 'Risks page route must be rendered directly by React');
assert.ok(portal.includes('riskFromProject'), 'Risks page must have a project-derived fallback');

console.log('HomeFlow stable portal static QA checks passed.');
