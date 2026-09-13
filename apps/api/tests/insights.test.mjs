import test from 'node:test';
import assert from 'node:assert/strict';
import { projects } from '../dist/data.js';
import { executiveBrief, groundedAnswer, projectDrivers } from '../dist/insights.js';

test('demo portfolio contains all 36 projects', () => {
  assert.equal(projects.length, 36);
  assert.ok(new Set(projects.map(p => p.province)).size >= 9);
});

test('project health drivers are evidence-based', () => {
  const p = projects.find(x => x.status === 'Critical');
  assert.ok(p);
  const drivers = projectDrivers(p);
  assert.ok(Array.isArray(drivers));
  assert.ok(drivers.length > 0);
  assert.ok(drivers.some(d => d.includes('Primary blocker') || d.includes('overdue') || d.includes('Expenditure')));
});

test('executive brief returns named priorities and decisions', () => {
  const brief = executiveBrief(projects);
  assert.match(brief.summary, /projects require management attention/i);
  assert.ok(brief.priorities.length > 0);
  assert.ok(brief.priorities.every(p => typeof p.name === 'string' && p.name.length > 0));
  assert.ok(brief.decisions.length > 0);
});

test('grounded answers cover priority, recovery, risk and finance questions', () => {
  for (const q of [
    'What requires my attention today?',
    'Which recovery actions are overdue?',
    'Which projects have the biggest budget gaps?',
    'How many open risks are there?',
  ]) {
    const result = groundedAnswer(q, undefined, projects);
    assert.equal(typeof result.answer, 'string');
    assert.ok(result.answer.length > 20);
    assert.ok(Array.isArray(result.sources));
  }
});

test('project-specific answer names the selected project', () => {
  const p = projects.find(x => x.status === 'Critical');
  assert.ok(p);
  const result = groundedAnswer(`Why is ${p.name} at risk?`, p.id, projects);
  assert.match(result.answer, new RegExp(p.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
});
