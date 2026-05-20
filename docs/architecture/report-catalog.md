# Report Catalog

## Purpose

Report Catalog is the local index for generated AuthToolkit Dev Integrity reports.

As review reports and evidence timeline snapshots grow, operators need a compact way to find recent review results without opening every markdown file manually. The catalog records report metadata only and keeps the full review details in the generated report and timeline files.

## Files Generated

Report Catalog writes local generated artifacts under `reports/`:

- `reports/catalog.json`
- `reports/catalog.md`

These files are generated locally and ignored with the rest of `reports/` output. They are not a database and are not intended to be committed.

## Catalog Fields

Each catalog entry includes:

- `generatedAt`
- `repoPath`
- `selectedSkill`
- `reportPath`
- `timelinePath`
- `controlRoomStatus`
- `overallIntegrityDecision`
- `operationalTrustLevel`
- `workflowPriority`
- `activeWorkflows`
- `highestSeverity`
- `confidenceScore`

The markdown catalog shows newest reports first with a compact table containing repo, skill, control room status, decision, trust level, workflow priority, report path, active workflows, and timeline path.

## Safety Rules

The catalog must not store:

- raw diffs
- raw logs
- secret values
- environment values
- source snippets
- customer data
- payment data
- session data

It stores only deterministic report metadata already produced by the local Integrity Pipeline.

## Limitations

Report Catalog v1 is intentionally small:

- local files only
- no database
- no remote sync
- no GitHub, Jira, or CI integration
- no search index
- no dashboard UI
- no retention policy beyond local file management

## Future Dashboard Relationship

Future Control Room dashboards can read the catalog as a local report index. The catalog is a delivery surface for report discovery, not a separate reasoning engine. The Integrity Engine remains responsible for risk, posture, workflow routing, and operational decision outputs.
