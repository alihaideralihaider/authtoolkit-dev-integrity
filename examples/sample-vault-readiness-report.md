# Sample Vault Readiness Report

## Project

- Project: sample-project
- Environment: production
- Vault readiness score: 84
- Status: needs review

## Missing Inventory Items

- None

## Runtime Binding Risks

- Cloudflare Worker route target requires owner confirmation.

## Secret Readiness

- `SUPABASE_URL`: documented
- `SUPABASE_SERVICE_ROLE_KEY`: documented as server-only
- `CLOUDFLARE_ACCOUNT_ID`: documented
- `CLOUDFLARE_API_TOKEN`: documented
- `STRIPE_SECRET_KEY`: optional, owner confirmation needed
- `TWILIO_AUTH_TOKEN`: optional, owner confirmation needed
- `RESEND_API_KEY`: optional, owner confirmation needed

## Recovery Checklist

- New laptop can identify required secret names: yes
- Values stored outside Git: owner confirmation needed
- CI can deploy without one local machine: unknown
- Emergency access documented: no

## Recommended Next Actions

1. Confirm provider account owners.
2. Confirm CI secret source of truth.
3. Document emergency access process.

