# Dev Integrity Local Control Room

This is a local read-only Control Room over generated Integrity artifacts.

## Purpose

The dashboard helps humans inspect operational trust state without opening every generated report manually. It is organized as focused drill-down pages so each screen answers one operational question instead of presenting a wall of metrics.

## Generate Data

From the repo root:

```bash
npm run review -- --repo . --skill saana-plan --base-branch main --release-signals examples/sample-release-signals.json
```

## Run

```bash
npm run dashboard
```

Then open:

```text
http://localhost:3000/tools/dev-integrity-dashboard/
```

The exact port may vary if `serve` chooses another available port.

## Pages

- `index.html` - Overview: Control Room status, release gate decision, score, blockers, warnings, active workflows, and latest review summary.
- `reviews.html` - Recent report catalog with links to generated markdown reports.
- `release-gates.html` - Release gate decision, confidence band, contributors, required evidence, workflow status, and release signal summary.
- `workflows.html` - Active workflows, workflow priority, reasons, evidence needs, and recommended workflow path.
- `timeline.html` - Timeline summary markdown, confidence trend, repeated blockers, repeated workflows, and repeated risk drivers.
- `github.html` - Git context, branch comparison, GitHub checks, Actions summary, failed or pending work, and release signal linkage.

Navigation is static HTML. Each page loads the same local artifacts through `shared.js` and renders page-specific panels through `dashboard.js`.

## Data Sources

The dashboard reads local generated files only:

- `reports/catalog.json`
- `reports/timeline-summary.md`
- latest report markdown linked from the catalog

## Scoring Guidance

Overview and Release Gates include explanatory release confidence guidance. This guidance helps interpret strict scores such as `0%`: it means the change is not safe to release under the current gate posture, not that the code is useless.

The displayed scoring mode is currently conceptual:

- Local Dev: early experimentation where missing evidence should be softer.
- Staging: pre-release review where checks, evidence, workflow routing, and release signals matter more.
- Production Strict: release governance where red Control Room state, blocked decisions, recovery risk, failed checks, and missing evidence can collapse confidence quickly.

This guidance is explanatory only. It does not alter scores, recalculate confidence, or duplicate engine logic.

## What It Does Not Do

- no external APIs
- no database
- no hosted dashboard
- no auth
- no GitHub writes
- no deployment
- no target repo modification
- no duplicated engine logic

The dashboard visualizes existing outputs only.
