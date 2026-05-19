# Evidence Timeline

## Purpose

Evidence Timeline is the local audit trail layer after Runtime Integrity.

It tracks what the Integrity Pipeline concluded over time and preserves explainable review evidence history.

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
-> Evidence Timeline
-> Integrity Reports
```

## Timeline Philosophy

Each review run should leave behind a small local record of what the system concluded.

The timeline is meant to answer:

- What changed?
- What risks were detected?
- What was the merge posture?
- What was the release posture?
- What should be watched at runtime?
- What evidence was missing?

## Audit Philosophy

Evidence Timeline v1 is not immutable compliance evidence.

It is a local, explainable audit trail that helps founders and engineers understand how review posture changes across runs.

The timeline stores structured conclusions and counts, not raw secrets, raw logs, raw env values, or external monitoring data.

## Unresolved Risk Tracking

Unresolved risks include:

- high or critical risk combinations
- release caution states
- blocked release states
- degraded runtime posture
- rollback-watch posture
- unknown warnings

These risks are preserved so later reports can show what remained unresolved at the time of review.

## Evidence Preservation

Each run can write a JSON snapshot under:

```text
reports/timeline/
```

V1 snapshots include:

- timeline ID
- generated timestamp
- review summary
- integrity snapshot
- posture snapshot
- evidence items
- unresolved risks
- unresolved warnings
- audit notes

## Limitations

- V1 is local-only.
- V1 uses JSON files, not a database.
- V1 does not upload evidence.
- V1 does not ingest external logs.
- V1 does not verify CI, deployment, or production status.
- V1 is not immutable compliance evidence.

## What This Does Not Do Yet

Evidence Timeline is not:

- a database
- Jira integration
- SaaS storage
- cloud storage
- immutable compliance evidence
- external log ingestion
- a dashboard

