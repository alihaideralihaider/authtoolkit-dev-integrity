# saana-security-review

## Purpose
Review auth, authorization, tenant boundaries, APIs, secrets, sessions, customer data, webhooks, and privileged runtime paths.

## When to run
- Auth or session logic changed.
- API routes changed.
- Admin or tenant-scoped code changed.
- Secrets, service-role keys, or webhooks changed.

## Inputs
- Changed files
- Route map
- Env var inventory
- Security-sensitive findings
- Test results

## Checklist
- Auth guard exists where required.
- Authorization is not confused with routing.
- Tenant membership checks are explicit.
- Service-role keys are server-only.
- Webhook trust is verified.
- Secrets are not exposed.

## Output format
- Findings by severity
- Evidence
- Required fixes
- Residual risk

## Failure examples
- Public API touches customer data.
- Admin page is guarded but API is not.
- Service-role client runs before authorization.

## Suggested fix format
Identify the boundary, propose the smallest safe fix, add tests where useful, and rerun security review.

