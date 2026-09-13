import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = p => fs.readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const index = read('apps/web/index.html');
const portal = read('apps/web/src/portal-v5.tsx');
const views = read('apps/web/src/views.css');
const portalCss = read('apps/web/src/portal-v5.css');

assert.match(index, /src\/views\.css/, 'Professional shared view stylesheet must be loaded');
assert.match(index, /src\/portal-v5\.tsx/, 'Current HomeFlow portal entrypoint must be active');

for (const feature of [
  'CommandCentre','ProjectsView','MapView','ContractorsView','FinanceView','RisksView','RecoveryView','AuditView','UsageView',
  'Download report','Voice Agent','Executive brief','api/ai/copilot',"view==='recovery'"
]) {
  assert.ok(portal.includes(feature), `Missing required portal feature: ${feature}`);
}

for (const cls of ['.data-table','.table-row','.data-cards','.data-card','.login-page','.map-layout','.copilot','.drawer-backdrop']) {
  assert.ok(views.includes(cls), `Missing shared professional style: ${cls}`);
}

for (const cls of ['.inline-detail','.recovery-row','.sa-map-v5','.brief-card','.metric-btn']) {
  assert.ok(portalCss.includes(cls), `Missing HomeFlow v5 style: ${cls}`);
}

assert.ok(portal.includes("user.role==='Administrator'"), 'OpenAI settings must remain administrator-gated');
assert.ok(!/Powered by Pyrneo/i.test(portal), 'Powered by Pyrneo wording must not appear in portal UI');

console.log('HomeFlow static QA checks passed.');
