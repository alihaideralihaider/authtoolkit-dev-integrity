# Operational Timeline Summary

## Purpose

Operational Timeline Summary condenses recent AuthToolkit Dev Integrity report history into a compact operational view.

It helps humans understand whether operational trust is improving, degrading, volatile, or stable without opening many generated reports manually.

## Timeline Summarization

The summary consumes local generated artifacts only:

- `reports/catalog.json`
- timeline snapshots under `reports/timeline/`

It considers the latest 10 catalog entries at most. It does not read raw diffs, raw logs, secret values, environment values, or source snippets.

## Trend Summaries

Operational Timeline Summary reports:

- `recentTrendSummary`
- `confidenceTrend`
- `controlRoomTrend`
- `operationalDecisionTrend`
- `driftTrendSummary`
- `recommendedOperationalFocus`

Confidence trend values are:

- `improving`
- `stable`
- `degrading`
- `volatile`

Control room trend values are:

- `mostly-green`
- `mixed`
- `mostly-orange`
- `mostly-red`

Operational decision trend values are:

- `mostly-trusted`
- `mostly-caution`
- `mostly-high-risk`
- `mostly-blocked`

## Repeated Workflow And Risk Detection

The v1 summary detects repeated signals such as:

- critical blast radius
- failed build
- policy escalation
- payment trust boundary
- runtime/Vault coupling
- missing rollback evidence
- recovery risk
- agent-sensitive changes

It also tracks repeated workflow routing patterns such as:

- escalation-review
- runtime-watch
- evidence-review
- recovery-review
- agent-review

Repeated signals are used to guide operational focus, not to make automated approvals or deployment decisions.

## Generated Output

The summary writes:

- `reports/timeline-summary.md`

Each generated integrity report also includes an `Operational Timeline Summary` section near the top.

## Limitations

Operational Timeline Summary v1 is intentionally small:

- local generated files only
- deterministic counting and trend rules only
- no analytics backend
- no anomaly detection
- no dashboard
- no remote sync
- no retention enforcement

The output depends on the quality and completeness of recent generated report and timeline files.

## Future Dashboard Relationship

Future Control Room dashboards can display the timeline summary as a compact historical view. The summary is not a separate reasoning engine; it is a local presentation layer over existing report, catalog, and evidence timeline outputs.
