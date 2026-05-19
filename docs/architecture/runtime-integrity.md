# Runtime Integrity

## Purpose

Runtime Integrity is the local Integrity Pipeline layer after Release Readiness.

It evaluates what must be monitored after release and what runtime signals would indicate drift, failure, rollback need, or owner attention.

The v1 pipeline is:

```text
Git Monitoring
-> Risk Classification
-> Severity
-> Review Packs
-> Risk Combination Detection
-> PR Integrity
-> Release Readiness
-> Runtime Integrity
-> Integrity Reports
```

## Runtime Posture States

### stable

No special runtime watch is required beyond normal post-release observation.

### watch

The release should be watched because runtime, Vault, UX, env-name, or PR review signals exist.

### degraded-risk

The release has caution-level release risk, sensitive review packs, or high risk combinations. It needs targeted post-release observation and owner attention.

### rollback-watch

The release is blocked or critical. If already released, rollback triggers should be watched immediately.

## Runtime Risk

Runtime risk values:

- low
- medium
- high
- critical

Runtime risk is derived from Release Readiness, PR Integrity, risk combinations, review packs, env-name detection, and critical warnings.

## Signals To Watch

Runtime Integrity recommends signals based on review packs.

Examples:

- security-pack: login failures, admin access errors, unexpected 401/403/200 behavior, session errors
- payment-pack: checkout failures, webhook delivery failures, payment/order state mismatch, duplicate payment/order events
- sms-compliance-pack: SMS delivery failures, opt-out/STOP failures, consent path failures, provider webhook failures
- vault-pack: missing env/runtime config errors, provider authentication failures, secret/binding mismatch errors
- runtime-pack: 5xx errors, route failures, worker/runtime exceptions, deploy target mismatch, binding errors
- ux-pack: broken customer flow, broken admin flow, mobile layout failure, checkout abandonment spike

## Drift Indicators

Drift indicators are generated from review packs:

- runtime-pack: route/runtime/binding drift
- vault-pack: env/config/secret drift
- payment-pack: payment state drift
- security-pack: auth boundary drift
- sms-compliance-pack: consent/messaging behavior drift
- ux-pack: user-flow drift

## Rollback Triggers

Rollback triggers are generated from review packs:

- security-pack: auth bypass or admin exposure
- payment-pack: payment state mismatch or broken checkout
- runtime-pack: repeated 5xx or route outage
- vault-pack: missing required secret/config in runtime
- sms-compliance-pack: non-compliant outbound messaging behavior
- ux-pack: critical customer/admin flow unusable

## Limitations

- V1 is local and report-only.
- V1 does not ingest logs.
- V1 does not call external APIs.
- V1 does not inspect a live deployment.
- V1 does not execute canaries.
- V1 does not execute rollback.
- V1 does not create dashboards or alerts.

## What This Does Not Do Yet

Runtime Integrity is not:

- live production monitoring
- external log ingestion
- deployment automation
- rollback execution
- a dashboard
- a SaaS service
- an autofix system

