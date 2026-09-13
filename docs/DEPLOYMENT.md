# Deployment

The hackathon build is configured to run as one Node web service: the build creates the React application and TypeScript API, and the Express server serves the web bundle and `/api/*` routes from the same origin.

## Local

```bash
npm install
npm run build
npm start
```

For local development:

```bash
npm run dev
```

## Render-ready blueprint

`render.yaml` provides a non-Docker deployment blueprint using Node 22, the Frankfurt region, `/api/health` health checks and the free plan for hackathon demonstration. A production deployment should use an appropriately sized plan, protected environment configuration and operational monitoring.

## Azure target

The strategic production target remains the Microsoft-aligned architecture described in `infrastructure/azure-target.md`: Entra ID, App Service/Container Apps, Azure SQL/PostgreSQL, Blob Storage, Key Vault, Azure OpenAI, Azure AI Speech, Azure Monitor/Application Insights and Power BI/Fabric where justified.

Deployment does not by itself make the application production-ready. Security, access control, persistence, backup/restore, integration, POPIA, performance and operational testing must be completed before live government use.
