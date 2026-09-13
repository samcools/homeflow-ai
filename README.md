# HomeFlow AI by Pyrneo

**AI-powered delivery assurance for Human Settlements**

> From stalled projects to completed homes.

HomeFlow AI is the Human Settlements evolution of the Project Guardian concept. It preserves the Project Guardian operating model—secure project management, milestones, work items, activity, audit, AI assistance, voice and responsive dashboards—and adds housing-delivery intelligence: explainable project health, budget-vs-physical progress, contractor performance, stalled-project signals, inspections and recovery orchestration.

## Current hackathon build

This repository now contains a working MVP scaffold with:

- responsive HomeFlow Command Centre
- synthetic South African Human Settlements portfolio data
- explainable Project Health Score
- budget-versus-physical-progress divergence
- contractor and blocker context
- recovery actions
- executive briefing endpoint
- evidence-grounded demo Copilot
- browser voice input/output with South African English defaults
- confirmation gate for consequential demo actions
- audit-log endpoint
- Responsible AI, POPIA, security and Azure-target documentation
- Pyrneo/HomeFlow presentation assets prepared for the hackathon

The current dataset is synthetic demonstration data. This repository does **not** claim a production government deployment, live government integration, engineering certification, autonomous procurement decisions or autonomous beneficiary decisions.

## Quick start

Prerequisites: Node.js 20+ and npm 10+.

```bash
npm install
npm run dev
```

Open:

- Web: `http://localhost:5173`
- API health: `http://localhost:8080/api/health`

## Repository structure

```text
apps/web        React + TypeScript + Vite responsive interface
apps/api        Express + TypeScript API and grounded demo intelligence
packages        shared domain packages (extensible)
assets          Pyrneo/HomeFlow branding
presentations   hackathon PowerPoint assets
infrastructure  Azure-oriented deployment notes
docs            architecture, security, POPIA, Responsible AI, pilot and demo guides
```

## Flagship demo

1. Open the Command Centre.
2. Ask: **Which projects require my attention today?**
3. Open `HF-102`.
4. Ask: **Why is this project at risk?**
5. Review the financial/physical divergence, blockers and confidence.
6. Ask: **Which project has the largest budget-to-progress gap?**
7. Demonstrate voice input.
8. Generate the Executive Brief.

## Responsible AI

AI recommendations are decision support. Accountable officials remain responsible for inspections, contractual decisions, financial approvals, beneficiary eligibility, project status and other consequential actions.

## Product philosophy

**Monitor → Anticipate → Explain → Act → Escalate → Verify → Learn**

**Smarter settlements. Stronger communities.**
