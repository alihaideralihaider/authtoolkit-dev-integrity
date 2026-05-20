# AuthToolkit Dev Integrity

AuthToolkit Dev Integrity is a local-first operational trust system for AI-assisted engineering.

It inspects repository changes, classifies risk, routes review packs, evaluates release/runtime/recovery posture, and produces explainable markdown evidence for humans. It is designed for teams working with human developers, coding agents, and automation where speed has to be balanced with review, recovery, and operational accountability.

## Core Loop

AuthToolkit Dev Integrity follows a practical engineering loop:

1. Plan
2. Git Review
3. Implement
4. Test
5. Integrity Review
6. Security Review
7. Deploy Check
8. Report

The system is designed to make AI-assisted development safer by pairing fast implementation with structured review, deterministic checks, evidence capture, and clear confidence scoring.

## Current Stack

The current implementation is intentionally small:

- Node.js local CLI
- TypeScript source run with `node --experimental-strip-types`
- Git-based change inspection
- Deterministic rule-based awareness layers
- Markdown integrity reports written to `reports/`
- JSON evidence timeline snapshots written to `reports/timeline/`
- No external AI APIs
- No database
- No dashboard yet
- No target-repo modification

## Product Direction

This repository is the standalone foundation for the Dev Integrity Agent, Integrity Engine, and Control Room platform. It is documentation-first today and intended to become API-first product infrastructure that can support SaanaOS, Kepler, AuthToolkit, and future projects.

## Run A Review

The local CLI accepts a repo path and selected skill, then writes a markdown integrity report into `reports/`.

```sh
npm run review -- --repo /path/to/repo --skill saana-plan
```

Example against this repo:

```sh
npm run review -- --repo . --skill saana-plan
```

Optional build evidence can be supplied with a local redacted summary:

```sh
npm run review -- --repo . --skill saana-plan --build-summary examples/sample-build-summary.json
```

Optional CI/CD context can be supplied with a local redacted pipeline summary:

```sh
npm run review -- --repo . --skill saana-plan --cicd-summary examples/sample-cicd-summary.json
```

Local Git base comparison can be supplied with `--base-branch`:

```sh
npm run review -- --repo . --skill saana-plan --base-branch main
```

A local GitHub PR comment draft can be generated without posting to GitHub:

```sh
npm run review -- --repo . --skill saana-plan --base-branch main --github-comment-draft
```

The runner is local-only. It does not call external AI APIs, does not modify the target repo, does not auto-fix, does not commit, does not push, and scans changed files for env var-like names only. Generated reports include Git Context with local branch, commit, base branch, merge base, commit range, and working tree state. Reports also include PR Context, a local pull-request-style summary that does not use GitHub APIs. CI/CD Context can consume a redacted local pipeline summary without provider APIs or raw logs. Release Workflow Plan turns release, runtime, recovery, CI/CD, and evidence signals into a local checklist. GitHub PR Comment Draft can generate a local reviewable comment body without posting to GitHub.

Generated reports are indexed in `reports/catalog.md` so recent review results can be scanned without opening every report file manually. Recent operational posture is summarized in `reports/timeline-summary.md`.

## Read Control Room Status

Each report includes an `Integrity Control Room Overview` near the top.

Status colors:

- `green`: trusted, release ready, runtime stable, and evidence sufficient.
- `yellow`: caution or trusted-with-review; review evidence or drift attention is needed.
- `orange`: high-risk; escalation or targeted review is required before proceeding.
- `red`: blocked or critical-review-required; do not merge or release until blockers are resolved.

The Control Room overview summarizes:

- current decision and trust level
- release/runtime/evidence posture
- primary risks and blockers
- required actions
- human attention areas
- layer-specific drift

See `docs/examples/sample-integrity-report-summary.md` for a compact sample.

## Documentation Map

Key documentation lives in:

- `docs/architecture/`: engine, awareness stack, Git Context, PR Context, CI/CD Context, Release Workflow Plan, GitHub PR Comment Draft, decision summary, control room, report catalog, operational timeline summary, system blueprint, and `docs/architecture/project-map.md` for contributor orientation.
- `docs/skills/`: review skill definitions and checklists.
- `docs/runbooks/`: operational runbooks for onboarding, pre-deploy checks, post-deploy canary, incidents, and recovery.
- `docs/releases/`: project checkpoints, including `docs/releases/v1-foundation-checkpoint.md`.
- `docs/control-rooms/`: control room concepts such as Vault Control Room.
- `docs/audits/`: audit concepts such as Vault Audit.
- `docs/product/`: product vision and strategy.
- `docs/examples/`: sample output summaries.
- `examples/`: sample config, inventory, build summary, and report artifacts.

## Principles

- Do not rely on memory for critical engineering decisions.
- Treat code integrity, secret integrity, runtime integrity, deploy integrity, and recovery integrity as one system.
- Prefer local-first evidence and deterministic review where possible.
- Never store real secrets in Git.
- Make findings actionable, reviewable, and auditable.
