# API

Current hackathon endpoints:

- `GET /api/health`
- `GET /api/dashboard`
- `GET /api/projects`
- `GET /api/projects/:id`
- `GET /api/audit`
- `GET /api/executive-brief`
- `POST /api/ai/copilot`
- `POST /api/actions`

`POST /api/actions` requires `confirmed: true` to demonstrate a human confirmation gate. The MVP returns a demo acknowledgement; production persistence and workflow authorisation remain implementation work.
