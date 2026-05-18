# Severity and Review Packs

## Purpose

Severity scoring and review-pack routing make Git Monitoring reports easier to triage.

Git Monitoring should not only say what changed. It should also explain how risky the change appears and which review packs should run next.

## Severity Levels

### low

Docs, examples, README, and markdown-only changes.

### medium

UX, runtime, config, scripts, package files, and Vault-related changes.

### high

Security, payment, SMS compliance, webhooks, auth, admin, and API route changes.

### critical

Heuristic indicators for:

- secret leakage paths
- service-role exposure paths
- production deploy config changes
- payment webhook trust changes

Critical in v1 is a routing signal, not proof of a confirmed incident.

## Initial Scoring Rules

- Low-risk documentation paths score `low`.
- UX, runtime, config, scripts, and package files score `medium`.
- Security, payment, SMS compliance, webhooks, auth, admin, and API paths score `high`.
- Secret-like paths, service-role paths, production deploy config paths, and payment webhook trust paths score `critical`.

## Review Pack Mapping

- `security` risk -> `security-pack`
- `payment` risk -> `payment-pack`
- `sms-compliance` risk -> `sms-compliance-pack`
- `vault` risk -> `vault-pack`
- `runtime` risk -> `runtime-pack`
- `ux` risk -> `ux-pack`
- `unknown` risk -> `planning-pack`
- `high` or `critical` severity -> `release-readiness-pack`

## Limitations

- v1 uses path/name heuristics only.
- v1 does not prove exploitability.
- v1 does not parse code semantics, imports, call graphs, or framework route guards.
- Critical warnings are conservative indicators.
- Unknown risk means the path did not match current heuristics.

## What This Does Not Do Yet

- PR Integrity
- Release Monitoring
- Runtime Integrity
- Dashboard rendering
- Database persistence
- SaaS workflows
- Autofix
- Auto-commit
- Auto-push
- Secret value extraction

