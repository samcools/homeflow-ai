# HomeFlow AI credential handling

HomeFlow AI must not store production API credentials in browser storage or GitHub source files.

## Required Render environment variables

- `OPENAI_API_KEY` — enables OpenAI conversational intelligence and natural server-side speech.
- `RESEND_API_KEY` — enables transactional report and alert email delivery.
- `ALERT_RECIPIENT` — defaults to `samson@pyrneo.com`.
- `REPORT_FROM_EMAIL` — the verified Resend sender. For initial Resend testing this can be `HomeFlow AI <onboarding@resend.dev>` subject to Resend account restrictions.

## Security rules

1. Keep all secret values in Render environment variables or an enterprise secret store such as Azure Key Vault.
2. Never commit a live API key to GitHub.
3. Never expose keys through a client-side settings response.
4. Administrator settings should show only whether a credential is configured.
5. Rotate compromised credentials immediately.

The `.env.example` file contains names and non-secret placeholders only.
