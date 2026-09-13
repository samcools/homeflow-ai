# Azure Target Deployment

Recommended production topology:

- Azure Front Door / WAF
- Web application on Azure App Service or Container Apps
- API on App Service/Container Apps
- Entra ID authentication
- Azure SQL or Azure Database for PostgreSQL
- Blob Storage for evidence
- Key Vault for secrets
- Azure OpenAI for grounded language workflows
- Azure AI Speech for supported languages/voices
- Application Insights + Azure Monitor

The repository deliberately does not contain live credentials or claim that these services are currently provisioned.
