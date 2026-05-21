# AuthToolkit Dev Integrity Local Dashboard

This is a local read-only dashboard over generated Integrity artifacts.

## Purpose

The dashboard helps humans inspect the current operational trust state without opening every generated report manually.

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

## Data Sources

The dashboard reads local generated files only:

- `reports/catalog.json`
- `reports/timeline-summary.md`
- latest report markdown linked from the catalog

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
