# Posture-Aware Integrity

## Purpose

Posture-Aware Integrity compares the current Evidence Timeline snapshot with the most recent previous snapshot for the same repository.

Its purpose is to detect whether integrity posture is degrading, stabilizing, improving, or critically degrading over time.

## Posture Transition Philosophy

An individual review report explains the current state. Posture-Aware Integrity adds historical context:

- Did confidence recover or fall?
- Did merge readiness move toward blocked?
- Did release posture move toward caution or ready?
- Did runtime posture move toward rollback-watch or stable?
- Did unresolved risks increase or decrease?
- Did sensitive review scope expand?

This layer is deterministic and local-first. It reads local JSON snapshots from `reports/timeline/`.

## Trend Logic

Posture-Aware Integrity emits one trend:

- `improving`
- `stable`
- `degrading`
- `critical-degrading`

The trend is based on simple comparisons between the previous timeline and the current timeline.

## Degradation Logic

Degradation signals include:

- confidence decreased
- highest severity increased
- review pack scope increased
- new unresolved risks appeared
- release moved toward caution or blocked
- runtime moved toward degraded-risk or rollback-watch

Critical degradation is reported when:

- a blocked state is introduced
- rollback-watch is introduced
- a critical diff-aware finding is introduced
- a critical risk combination is introduced

## Recovery Logic

Recovery signals include:

- confidence recovered
- severity decreased
- unresolved risks reduced
- release moved toward ready
- runtime posture improved
- release caution cleared

## Escalation Warnings

Escalation warnings are short operator-facing messages such as:

- Critical release posture introduced.
- Rollback-watch posture newly introduced.
- New critical diff-aware finding detected.
- Security review scope increased.
- Runtime drift exposure increased.

## Report Output

Markdown reports include:

- integrity trend
- posture transitions
- degradation signals
- stabilization signals
- recovery signals
- escalation warnings
- posture summary
- recommended posture action

## Limitations

Posture-Aware Integrity v1 compares only local timeline files. It does not prove root cause, understand semantics, or query external systems.

It depends on prior `reports/timeline/*.json` snapshots being available locally.

For local development, repeated review runs can be used to verify that transitions are being recorded as expected.

## What This Does Not Do Yet

Posture-Aware Integrity is not:

- AI forecasting
- anomaly detection
- SaaS analytics
- external monitoring
- a database
- a dashboard
- release automation
- rollback automation
