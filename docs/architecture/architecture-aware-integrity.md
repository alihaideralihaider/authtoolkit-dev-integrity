# Architecture-Aware Integrity

## Purpose

Architecture-Aware Integrity adds relationship and blast-radius reasoning to AuthToolkit Dev Integrity.

It identifies which system areas, boundaries, and dependency paths may be affected by a change using deterministic file-path, risk, review-pack, risk-combination, and diff-aware signals.

## Relationship-Aware Reasoning

Architecture-Aware Integrity asks:

- Which systems are touched?
- Which trust boundaries may be affected?
- Which dependencies might be coupled to the change?
- How broad is the likely blast radius?
- Which architecture review notes should be carried into PR, release, and runtime review?

This is a lightweight reasoning layer. It does not build a full graph.

## Affected Systems

v1 can identify these affected systems:

- api
- auth
- admin
- payment
- messaging
- runtime
- vault
- database
- ux
- ordering
- release
- unknown

Signals come from changed file paths, risk categories, review packs, risk combinations, and diff-aware findings.

## Boundaries

v1 can identify these affected boundaries:

- public-to-private boundary
- admin boundary
- tenant/data boundary
- provider webhook boundary
- payment trust boundary
- runtime/deployment boundary
- secret/config boundary
- customer communication boundary

Boundary detection is intentionally conservative. A boundary warning means review is needed, not that a defect is proven.

## Dependency Signals

Dependency signals explain how an affected system may connect to another system.

Examples:

- API route may affect frontend/admin/customer flows.
- Service-role usage may affect tenant/data boundary.
- Payment webhook may affect order/payment state.
- Runtime binding may affect deployment target.
- SMS/voice webhook may affect consent and messaging behavior.
- Env var change may affect runtime availability.
- Admin UI change may affect privileged workflows.

## Blast Radius

Blast radius values:

- `limited`
- `moderate`
- `broad`
- `critical`

v1 rules:

- `critical` if payment trust and security boundaries overlap, or service-role usage intersects public/admin/API boundaries
- `broad` if runtime and Vault/config change together, or multiple sensitive systems are affected
- `moderate` if one or two sensitive systems are affected
- `limited` for docs, low-risk, or UX-only changes

## Architecture Warnings

Warnings are deterministic review prompts such as:

- Payment trust boundary may be affected.
- Runtime and secret/config boundary changed together.
- Admin/API boundary requires authorization review.
- Customer communication boundary requires compliance review.
- Service-role usage requires tenant/data boundary review.

## Recommended Action

The recommended architecture action is based on blast radius:

- critical: stop and run targeted architecture, security, and release review
- broad: confirm affected systems, boundaries, and runtime checks
- moderate: review the affected boundary and intended scope
- limited: continue normal review while preserving evidence

## Limitations

Architecture-Aware Integrity v1 is heuristic-only.

It does not:

- build a full architecture graph
- parse ASTs
- inspect imports or call graphs
- verify runtime configuration
- query provider dashboards
- prove authorization correctness
- replace human architecture review

## What This Does Not Do Yet

Architecture-Aware Integrity is not:

- full static analysis
- a dependency scanner
- SaaS analytics
- a dashboard
- deployment automation
- runtime monitoring
- an autofix system
