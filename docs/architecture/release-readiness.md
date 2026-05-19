# Release Readiness

## Purpose

Release Readiness is the local Integrity Pipeline layer after PR Integrity.

It evaluates whether a reviewed merge candidate is safe enough to release.

The v1 pipeline is:

```text
Git Monitoring
-> Risk Classification
-> Severity
-> Review Packs
-> Risk Combination Detection
-> PR Integrity
-> Release Readiness
-> Integrity Reports
```

## Release Decisions

### ready

The release has no detected blockers, no high or critical severity, no critical combinations, no critical warnings, and no runtime/Vault/payment/release-readiness sensitive changes.

Ready does not deploy anything. It means the report sees no obvious release blockers.

### caution

The release may proceed only after required checks, canary planning, and rollback path review.

V1 returns caution when:

- PR Integrity merge readiness is needs-review
- release-readiness-pack exists
- runtime-pack exists
- vault-pack exists
- payment-pack exists
- high combinations exist
- env var-like names are detected

### blocked

The release should not proceed.

V1 blocks when:

- PR Integrity merge readiness is blocked
- highest severity is critical
- any critical risk combination exists
- critical warnings exist

## Release Risk

Release risk values:

- low
- medium
- high
- critical

Blocked releases are critical risk. High-combination or high-severity releases are high risk. Other caution releases are medium risk.

## Canary Philosophy

Release Readiness does not execute canaries.

It recommends canary areas based on review packs, such as:

- monitor login
- monitor checkout
- monitor webhook health
- monitor SMS delivery
- monitor runtime errors
- monitor admin access

The goal is to force an explicit validation path before release-sensitive changes ship.

## Rollback Philosophy

Release Readiness does not execute rollback.

It records rollback requirements so a founder or engineer knows what signal should trigger a rollback.

Examples:

- payment-pack: rollback payment webhook or checkout changes immediately if provider state mismatch appears
- runtime-pack: rollback deploy if runtime bindings or routes drift
- vault-pack: rollback if required runtime secret/config mismatch appears
- security-pack: rollback immediately if auth boundary regression is detected

## Limitations

- V1 is local and report-only.
- V1 does not inspect deployed environments.
- V1 does not run canaries.
- V1 does not verify CI status.
- V1 assumes release evidence is missing unless future evidence input is added.
- V1 uses review packs, severity, PR Integrity, risk combinations, and env-name detection only.

## What This Does Not Do Yet

Release Readiness is not:

- Runtime Integrity
- Deployment automation
- Canary execution
- Rollback execution
- A dashboard
- A SaaS service
- An autofix system
- An auto-approval or auto-merge system

