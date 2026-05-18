# vault-secret-readiness-review

## Purpose
Review whether required env vars and secret names are documented, recoverable, and ready for deployment.

## When to run
- Env vars are added, renamed, or removed.
- Provider credentials change.
- Secret inventory changes.
- Deploy readiness is uncertain.

## Inputs
- Secret inventory
- Project config
- Env var scan
- Provider names

## Checklist
- Required secret names are inventoried.
- Secret values are not stored in Git.
- Source of truth is documented.
- Runtime and CI consumers are known.
- Rotation cadence is documented or marked TBD.

## Output format
- Missing inventory items
- Unsafe handling risks
- Readiness status
- Recommended documentation updates

## Failure examples
- Env var appears in code but not inventory.
- Secret value appears in docs.
- Required production secret owner is unknown.

## Suggested fix format
Update inventory with names only, document purpose/source/owner, and rerun Vault readiness review.

