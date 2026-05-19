# PR Integrity

## Purpose

PR Integrity is the next local Integrity Pipeline layer after Git Monitoring.

It evaluates whether a pull request or merge candidate is safe enough for review, approval, and merge.

PR Integrity consumes the existing review result:

```text
Git Monitoring
-> Risk Classification
-> Severity
-> Review Packs
-> Risk Combination Detection
-> Integrity Reports
-> PR Integrity
```

## Scope

PR Integrity v1 produces:

- merge readiness
- approval risk
- required review packs
- blocking reasons
- missing evidence
- reviewer checklist
- recommended decision

It is local-first and report-only.

## Merge Readiness States

### ready

The change has no detected blockers, no high or critical severity, no unknown warnings, no critical warnings, and no high or critical risk combinations.

Ready does not mean auto-approved. It means the merge candidate is ready for normal review.

### needs-review

The change needs targeted review before approval or merge.

V1 marks a change as needs-review when:

- highest severity is high
- any high risk combination exists
- unknown warnings exist
- suggested review packs include release-readiness-pack
- detected env var-like names exist

### blocked

The change should not be approved or merged until blockers are resolved.

V1 blocks when:

- highest severity is critical
- any critical risk combination exists
- critical warnings exist

## Approval Risk

Approval risk values:

- low
- medium
- high
- critical

Blocked changes are critical approval risk. High-severity or high-combination changes are high approval risk. Other review-required changes are medium approval risk.

## Missing Evidence

For v1, PR Integrity assumes evidence is missing unless explicit evidence support is added later.

Missing evidence can include:

- no test result attached
- no reviewer confirmation
- no selected review pack evidence
- no deploy/readiness notes for release-readiness-pack
- no Vault confirmation when vault-pack is selected
- no security review notes when security-pack is selected
- no payment review notes when payment-pack is selected

## Reviewer Checklist

Reviewer checklist items are generated from suggested review packs.

Examples:

- security-pack: confirm authorization boundaries, API exposure, and server-only service-role usage
- payment-pack: confirm provider trust, webhook validation, idempotency, and state consistency
- sms-compliance-pack: confirm consent, STOP/HELP, and marketing/transactional boundaries
- vault-pack: confirm secret names only, source of truth, and runtime/CI availability
- runtime-pack: confirm bindings, deploy target, and environment alignment
- ux-pack: confirm critical flows, mobile usability, and customer/admin usability
- release-readiness-pack: confirm release notes, canary plan, and rollback path

## Limitations

- V1 is based on local Git Monitoring output only.
- V1 does not inspect PR comments, CI systems, GitHub reviews, or attached artifacts.
- V1 assumes evidence is missing unless future input fields provide it.
- V1 does not approve, merge, fix, push, deploy, or call external AI APIs.

## What This Does Not Do Yet

PR Integrity is not:

- Release Monitoring
- Runtime Integrity
- A dashboard
- A SaaS service
- GitHub PR automation
- Auto-approval
- Auto-merge
- Auto-fix

