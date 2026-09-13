# Security Architecture

HomeFlow AI follows Zero Trust principles: authenticate explicitly, least privilege, assume breach and verify every consequential action.

## Controls
- Entra ID / OIDC-ready identity integration
- RBAC and jurisdiction-aware access
- MFA-ready deployment
- secure HTTP headers and CORS controls
- server-side validation
- rate-limit integration point
- no secrets in front-end bundles
- Key Vault target for production secrets
- secure evidence-upload validation and malware-scanning integration point
- encryption in transit and at rest in the Azure target architecture
- audit record for material mutations and AI-assisted actions
- human confirmation for consequential AI-triggered actions

## Production gaps to complete
The hackathon MVP must not be treated as production until penetration testing, dependency review, operational monitoring, backup/restore validation, DR planning, secure file scanning and formal access-control testing are completed.
