# API

Current hackathon endpoints:

- `GET /api/health`
- `GET /api/dashboard`
- `GET /api/projects`
- `GET /api/projects/:id`
- `GET /api/contractors`
- `GET /api/risks`
- `GET /api/recovery`
- `GET /api/stalled`
- `GET /api/what-changed/:id`
- `GET /api/audit`
- `GET /api/executive-brief`
- `POST /api/ai/copilot`
- `POST /api/actions`

`POST /api/actions` requires `confirmed: true` to demonstrate a human confirmation gate. The MVP returns a demo acknowledgement; production persistence, authentication-backed authorisation and workflow-engine integration remain implementation work.

All project and portfolio records currently served by the API are synthetic hackathon data. Production integrations must be authenticated, authorised and validated before use.
