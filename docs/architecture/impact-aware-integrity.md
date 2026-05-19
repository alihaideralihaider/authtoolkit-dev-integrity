# Impact-Aware Integrity

## Purpose

Impact-Aware Integrity translates technical risk into operational impact. It answers who or what may be affected if a change fails, without calling external services, modifying the target repo, or trying to predict live production behavior.

## Scope

Impact-Aware Integrity v1 evaluates:

- customer impact
- admin impact
- payment impact
- runtime impact
- data impact
- compliance impact
- owner/operator impact
- overall impact
- impact warnings
- recommended impact action

## Inputs

The v1 layer consumes existing deterministic pipeline outputs:

- Build-Aware Integrity
- Diff-Aware Integrity
- Release Readiness
- Runtime Integrity
- Architecture-Aware Integrity
- Policy-Aware Integrity
- Evidence-Aware Integrity
- Recovery-Aware Integrity

## Impact Levels

- none: no direct impact detected by v1 rules
- low: limited operational concern
- medium: affected flow or evidence needs confirmation
- high: sensitive flow, boundary, or operational responsibility may be affected
- critical: failure could create critical operational impact or recovery burden

## Simple V1 Rules

- Payment trust boundary or payment review signals raise payment impact.
- Customer communication boundary or SMS compliance signals raise compliance impact.
- Runtime/deployment boundary, failed build, or degraded runtime posture raises runtime impact.
- Tenant/data boundary or database signals raise data impact.
- Admin boundary or admin system signals raise admin impact.
- Critical architecture blast radius raises overall impact to critical.
- High-risk recovery raises owner/operator impact to critical.
- Missing evidence plus release caution raises owner/operator impact.

## Impact Warnings

Warnings explain operational consequences in plain language, for example:

- Customer-facing flows may be affected if this change fails.
- Payment or checkout state may be affected.
- Runtime availability or deployment behavior may be affected.
- Tenant, customer, or database access impact may exist.
- Recovery burden may be significant if this change fails.

## Recommended Actions

Recommended actions stay conservative:

- Critical impact requires owner review, rollback readiness, and targeted validation.
- High impact requires targeted review for the impacted audience.
- Medium impact requires confirming affected flows and preserving evidence.
- Low impact proceeds through normal review with baseline evidence.

## Limitations

Impact-Aware Integrity v1 is heuristic and deterministic. It does not inspect live traffic, customer counts, revenue exposure, provider dashboards, logs, incidents, or runtime metrics. It translates existing local review signals into impact categories only.

## What This Does Not Do Yet

- It does not run live monitoring.
- It does not estimate revenue loss.
- It does not contact customers or providers.
- It does not approve, block, merge, deploy, or roll back changes.
- It does not replace human owner judgment for production impact.
