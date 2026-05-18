# Missing Env Vars Recovery

## Purpose

Recover from missing local, CI, preview, or production env vars without exposing secret values.

## Steps

1. Identify missing env var names.
2. Check the project env inventory.
3. Confirm source of truth in provider console or approved vault.
4. Confirm owner and access path.
5. Restore values outside Git.
6. Run Vault secret readiness review.
7. Run runtime binding review if deployment or platform secrets changed.

## Rules

- Do not paste secret values into docs, chat, tickets, or reports.
- Document names, purpose, owner, source of truth, and recovery notes only.

