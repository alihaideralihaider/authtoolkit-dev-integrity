# Git Monitoring

## Purpose

Git Monitoring is the first real Integrity Pipeline component for AuthToolkit Dev Integrity.

Its purpose is to inspect Git changes in a target repository and generate structured review context.

## Pipeline

```text
Git changes -> risk classification -> selected reviews -> markdown report
```

## Scope

Git Monitoring v1:

- Confirms the target path is a Git repository.
- Runs `git status --short`.
- Runs `git diff --name-only`.
- Collects changed files.
- Detects added, modified, deleted, renamed, and unknown file statuses.
- Classifies files with simple path/name heuristics.
- Selects suggested reviews from risk categories.
- Writes a markdown integrity report.

## Risk, Severity, and Review-Pack Routing

Git Monitoring now emits risk categories, severity per changed file, highest severity, and suggested review packs.

This routing remains simple and local-first:

- path/name heuristics classify risk
- risk categories map to review skills and review packs
- high or critical severity adds release readiness review-pack routing
- unknown risk adds planning-pack routing

## What It Does Not Do Yet

Git Monitoring v1 is not:

- PR Integrity
- Release Monitoring
- Runtime Integrity
- Dev Control Room
- Architecture Control Room
- Vault Control Room
- A SaaS service
- A dashboard
- An autofix system

## Safety Rules

- Never print env var values.
- Never modify the target repo.
- Never auto-fix.
- Never auto-commit.
- Never auto-push.
- Do not call external AI APIs.

## First Real Repo Lessons

The first production-style target was the SaanaOS `missed-call-platform` repo.

Lessons learned:

- Dev Integrity tooling files under `scripts/dev-integrity-*` are not app runtime code, but they are runtime/dev-engineering engine changes and should not be unknown.
- Local dashboard prototype files under `tools/dev-integrity-dashboard/` should classify as runtime and UX because they affect the local integrity operator experience.
- Provider paths need simple direct mappings:
  - Supabase files usually imply runtime and security review.
  - Cloudflare and Worker files usually imply runtime review.
  - Stripe, payment, billing, and checkout files imply payment review.
  - Webhook files imply security review, and provider-specific webhooks may imply payment or SMS review through their provider terms.
  - Twilio, SMS, WhatsApp, messaging, and voice files imply SMS compliance review.
  - Restaurant storefront, admin page, menu, hub, dashboard, HTML, CSS, and component files imply UX review.

## Heuristic Improvements

Added v1 path/name heuristics for:

- `scripts/dev-integrity-*` -> runtime
- `tools/dev-integrity-dashboard/*` -> runtime and, where relevant, UX
- `supabase` -> runtime/security
- `cloudflare` and `worker` -> runtime
- `webhook` -> security
- `stripe`, `payment`, `billing`, `checkout` -> payment
- `twilio`, `sms`, `whatsapp`, `message`, `voice` -> SMS compliance
- `dashboard`, `page`, `component`, `menu`, `hub`, `storefront`, `.html`, `.css`, `styles` -> UX

## Known Limitations

- Classification is path/name-based only.
- It does not parse framework route semantics yet.
- It does not inspect imports or call graphs.
- It does not distinguish every webhook provider by behavior.
- It may over-select reviews when filenames contain broad terms.
- Unknown does not mean unsafe; it means v1 heuristics could not classify the path.
