# Architecture

## Design principle
HomeFlow AI is an API-first delivery-intelligence layer, not a forced replacement for government systems of record.

## Logical layers
1. **Experience** — responsive web/mobile dashboard, AI Copilot, voice interaction.
2. **Application** — projects, milestones, risks, inspections, recovery workflows, reporting.
3. **Intelligence** — grounded analysis, project health, anomaly/risk rules, executive briefings.
4. **Integration** — REST APIs, Excel/CSV import, future NDHSMS/ERP/GIS connectors.
5. **Data** — relational operational data, evidence/document storage, immutable-style audit trail.
6. **Platform** — Azure-aligned hosting, identity, monitoring and secrets.

## Microsoft-aligned target
- Microsoft Entra ID
- Azure App Service or Container Apps
- Azure SQL/PostgreSQL
- Azure Blob Storage
- Azure OpenAI
- Azure AI Speech
- Azure Key Vault
- Azure Monitor / Application Insights
- Power BI / Fabric where justified
- Azure Maps or a GIS abstraction layer

## Project Guardian inheritance
The HomeFlow product model deliberately retains the Project Guardian concepts of secure project workspaces, milestones, work items, comments, activity history, audit logs, AI assistance and voice-driven navigation/action, then extends them with Human Settlements-specific modules.
