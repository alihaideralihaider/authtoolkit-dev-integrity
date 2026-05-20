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

## Risk Combination Detection

Git Monitoring now detects simple risky combinations across changed files.

These combinations identify cases where separately understandable changes become more sensitive together, such as payment plus webhook plus security, runtime plus Vault/config, or admin UX plus API/security changes.

Risk combinations can add review packs and cap confidence until targeted review is complete.

PR Integrity consumes Git Monitoring output and produces merge-readiness guidance.

Release Readiness consumes PR Integrity and produces release guidance.

Runtime Integrity consumes Release Readiness and produces post-release monitoring guidance.

Evidence Timeline preserves explainable integrity history across review runs.

Diff-Aware Integrity inspects safe Git diff signals without printing full raw diffs or secret values.

Posture-Aware Integrity compares integrity posture across review runs.

Architecture-Aware Integrity identifies affected systems, boundaries, dependencies, and blast radius.

Policy-Aware Integrity evaluates governance rules, escalation paths, and approval expectations.

Evidence-Aware Integrity evaluates whether review, release, runtime, and policy evidence is sufficient.

Agent-Aware Integrity detects agent/automation authorship signals and adjusts review expectations.

Recovery-Aware Integrity evaluates rollback feasibility, recovery complexity, and operational recovery burden.

Build-Aware Integrity consumes optional local build summary input and adjusts trust, release, and evidence expectations.

Layer-specific drift keeps drift logic inside each awareness layer rather than creating one giant drift engine.

Impact-Aware Integrity translates technical risk into customer, admin, payment, runtime, data, compliance, and owner/operator impact.

Integrity Decision Summary condenses all awareness layers into a unified operational trust decision.

Integrity Control Room Overview presents the engine and awareness stack as one operational command summary.

Plain English summaries provide a short non-technical companion explanation for top-level decisions.

Workflow Routing Summary connects awareness, decision, and control-room outputs into operational workflow routing.

Report Catalog indexes generated reports so humans can quickly find recent review results.

Operational Timeline Summary condenses recent operational posture and workflow patterns across report history.

Git Context adds local branch, commit, and base comparison metadata without using external Git hosting APIs.

PR Context turns local Git and Integrity output into a pull-request-style review summary without external Git hosting APIs.

CI/CD Context consumes local redacted pipeline summaries and adjusts evidence, release, and workflow expectations without provider APIs.

GitHub PR Comment Draft generates a local reviewable PR comment body without posting to GitHub.

Release Workflow Plan turns release, runtime, recovery, CI/CD, and evidence signals into a local release checklist.

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
