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

API Intake Contract v1 defines the first framework for external tools to submit review context into Dev Integrity without creating a hosted API, database, auth layer, webhook processor, or execution worker. It is a future integration bridge for GitHub, Slack, Jira, CLIs, and external code agents while keeping local review execution as the source of truth. See `docs/architecture/api-intake-contract.md`.

Local API Runner v1 makes that contract testable on localhost. It accepts intake JSON and returns a recommended local review command, but it does not execute reviews, modify repos, store tokens, call external APIs, or run as a hosted service. See `docs/architecture/local-api-runner.md`.

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

Provider-neutral release signals can be supplied with a local redacted signal summary:

```sh
npm run review -- --repo . --skill saana-plan --release-signals examples/sample-release-signals.json
```

Local Git base comparison can be supplied with `--base-branch`:

```sh
npm run review -- --repo . --skill saana-plan --base-branch main
```

A local GitHub PR comment draft can be generated without posting to GitHub:

```sh
npm run review -- --repo . --skill saana-plan --base-branch main --github-comment-draft
```

Read-only GitHub PR/check context can be supplied with GitHub flags:

```sh
npm run review -- --repo . --skill saana-plan --base-branch main --github-repo owner/repo --github-pr 123 --github-token-env GITHUB_TOKEN
```

Read-only GitHub Actions workflow/job metadata can be added with `--github-actions-context`:

```sh
npm run review -- --repo . --skill saana-plan --base-branch main --github-repo owner/repo --github-pr 123 --github-token-env GITHUB_TOKEN --github-actions-context
```

The runner is local-first. It does not call external AI APIs, does not modify the target repo, does not auto-fix, does not commit, does not push, and scans changed files for env var-like names only. Generated reports include Git Context with local branch, commit, base branch, merge base, commit range, and working tree state. Branch Comparison summarizes local branch impact against base without raw diffs. Reports also include PR Context, a local pull-request-style summary. CI/CD Context can consume a redacted local pipeline summary without provider APIs or raw logs. Release Signals can consume a small provider-neutral workflow signal summary without network calls. GitHub Checks Context can read PR/check status from GitHub when explicitly configured, and GitHub Actions Context can read workflow run/job metadata when explicitly enabled, but neither writes statuses, posts comments, approves, merges, reruns workflows, cancels workflows, or fetches raw logs. Release Workflow Plan turns release, runtime, recovery, CI/CD, and evidence signals into a local checklist. Release Gate Decision appears in reports as the deterministic pass/warn/block/human-review recommendation before release, and Release Gate Scoring explains the weighted confidence behind that decision. GitHub PR Comment Draft can generate a local reviewable comment body without posting to GitHub.

Generated reports are indexed in `reports/catalog.md` so recent review results can be scanned without opening every report file manually. Recent operational posture is summarized in `reports/timeline-summary.md`.

## Track Integrity Run State Locally

Integrity Run State v1 adds a small local JSON state layer for review runs. It is useful when a review needs to remember its current stage, open findings, resolved findings, timeline events, and confidence movement after a recheck.

Run-state files are written under `reports/state/`:

- `reports/state/runs/<run_id>.json`
- `reports/state/index.json`

Create a run:

```sh
npm run run-state -- create \
  --project-id devproj_local \
  --project-name "Pilot Dev Integrity Project" \
  --repo-name missed-call-platform \
  --branch main \
  --commit-sha local-preview \
  --confidence-before 62
```

Add a finding:

```sh
npm run run-state -- add-finding \
  --run-id <run_id> \
  --severity warning \
  --category auth \
  --title "Admin route needs explicit auth boundary" \
  --affected-file worker/web/app/api/admin/example/route.ts \
  --suggested-fix "Use the existing restaurant admin access helper." \
  --evidence-required "Route-level auth check and successful build."
```

Append an event:

```sh
npm run run-state -- append-event \
  --run-id <run_id> \
  --type evidence.collected \
  --message "Auth boundary evidence collected."
```

Mark a finding resolved:

```sh
npm run run-state -- resolve-finding \
  --run-id <run_id> \
  --finding-id <finding_id>
```

Record a recheck on the same run:

```sh
npm run run-state -- recheck \
  --run-id <run_id> \
  --confidence-after 82 \
  --stage recheck_completed \
  --status completed
```

List local run summaries:

```sh
npm run run-state -- list
```

This is local-first persistence only. It does not add a database, external API integration, hosted execution, GitHub writes, Jira/Slack integration, or a new dashboard backend. See `examples/integrity-run-state-example.json` for the record shape.

## Run The Local Dashboard

After generating review artifacts, run:

```sh
npm run dashboard
```

Open the local dashboard path shown by `serve`, usually:

```text
http://localhost:3000/tools/dev-integrity-dashboard/
```

The dashboard reads `reports/catalog.json`, `reports/timeline-summary.md`, optional `reports/state/index.json`, and linked local report markdown. It is a read-only artifact viewer: no external APIs, no database, no GitHub writes, no deployment, and no target repo modification.

## Run The Local API Runner

Start the localhost-only intake runner:

```sh
npm run api:local
```

Health check:

```sh
curl http://localhost:8787/health
```

Submit a valid intake request:

```sh
curl -X POST http://localhost:8787/review/intake \
  -H "Content-Type: application/json" \
  --data @examples/api-intake-review-request.json
```

Preview the exact command without executing it:

```sh
curl -X POST http://localhost:8787/review/dry-run \
  -H "Content-Type: application/json" \
  --data @examples/api-intake-review-request.json
```

Execute the internally generated local review command:

```sh
curl -X POST http://localhost:8787/review/execute \
  -H "Content-Type: application/json" \
  --data @examples/api-intake-review-request.json
```

Submit an invalid intake request:

```sh
curl -X POST http://localhost:8787/review/intake \
  -H "Content-Type: application/json" \
  --data '{}'
```

Fetch the example request:

```sh
curl http://localhost:8787/review/example
```

The local API runner binds to `127.0.0.1` only. It never runs arbitrary shell commands, never uses user-provided command strings, does not modify target repositories, does not write GitHub/Slack/Jira data, does not store tokens, does not use a database, and does not call external APIs. `/review/execute` can run only the internally generated `npm run review -- ...` command with `spawn()` and `shell: false`.

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

- `docs/architecture/`: engine, awareness stack, API Intake Contract, Local API Runner, Git Context, Branch Comparison, PR Context, CI/CD Context, Release Signals, Release Gate Decision, Release Gate Scoring, GitHub Checks Context, GitHub Actions Context, Release Workflow Plan, GitHub PR Comment Draft, Local Dashboard, decision summary, control room, report catalog, operational timeline summary, system blueprint, and `docs/architecture/project-map.md` for contributor orientation.
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
