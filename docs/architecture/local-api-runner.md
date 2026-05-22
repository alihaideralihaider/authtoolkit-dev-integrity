# Local API Runner

Local API Runner v1 is a tiny localhost-only HTTP surface for testing the API Intake Contract and controlled local review execution.

It accepts API Intake review request JSON, returns recommended local `npm run review` commands, supports dry-run previews, and can execute only the internally generated local review command.

## Purpose

The runner turns `docs/architecture/api-intake-contract.md` into a locally testable integration surface. External tools and local wrappers can send normalized review context and see how Dev Integrity would translate that context into a local review command.

This is still local-first. The Integrity Engine and generated review artifacts remain the source of truth.

## Run

```sh
npm run api:local
```

Default bind address:

```text
http://127.0.0.1:8787
```

The runner binds to `127.0.0.1` only. `PORT` can override the port:

```sh
PORT=8790 npm run api:local
```

## Endpoints

### `GET /health`

Returns:

```json
{
  "ok": true,
  "service": "authtoolkit-dev-integrity-local-api",
  "mode": "local-only"
}
```

### `POST /review/intake`

Accepts an API Intake Review Request JSON body.

Example:

```sh
curl -X POST http://localhost:8787/review/intake \
  -H "Content-Type: application/json" \
  --data @examples/api-intake-review-request.json
```

Valid requests return `ready-for-local-review` with a recommended command and expected artifacts.

Invalid requests return `400`:

```json
{
  "accepted": false,
  "status": "rejected-invalid-request",
  "errors": ["requestId is required."]
}
```

### `POST /review/dry-run`

Accepts the same API Intake Review Request JSON body and returns exactly what local review command would be used, without running it.

Example:

```sh
curl -X POST http://localhost:8787/review/dry-run \
  -H "Content-Type: application/json" \
  --data @examples/api-intake-review-request.json
```

Valid dry-run requests return:

```json
{
  "requestId": "sample-request-001",
  "accepted": true,
  "status": "dry-run-ready",
  "wouldExecute": false,
  "recommendedCommand": "npm run review -- --repo /path/to/repo --skill saana-plan --base-branch main --release-signals examples/sample-release-signals.json",
  "resolvedInputs": {
    "repoPath": "/path/to/repo",
    "baseBranch": "main",
    "releaseSignalsPath": "examples/sample-release-signals.json",
    "cicdSummaryPath": "none",
    "requestedOutputs": ["markdown-report"]
  },
  "expectedArtifacts": [
    "reports/catalog.json",
    "reports/timeline-summary.md",
    "reports/<timestamp>-saana-plan.md"
  ],
  "safetyNotes": [
    "Dry run only.",
    "No command was executed.",
    "No repository files were modified."
  ]
}
```

Invalid dry-run requests return the same `400` validation shape as `/review/intake`.

### `POST /review/execute`

Accepts the same API Intake Review Request JSON body and executes only the internally generated local Integrity review command.

Example:

```sh
curl -X POST http://localhost:8787/review/execute \
  -H "Content-Type: application/json" \
  --data @examples/api-intake-review-request.json
```

Valid execution requests return:

```json
{
  "requestId": "sample-request-001",
  "accepted": true,
  "status": "review-executed",
  "executed": true,
  "command": "npm run review -- --repo . --skill saana-plan --base-branch main --release-signals examples/sample-release-signals.json",
  "exitCode": 0,
  "reportDetected": true,
  "reportPath": "reports/<timestamp>-saana-plan.md",
  "stdoutSummary": ["AuthToolkit Dev Integrity review complete"],
  "stderrSummary": [],
  "safetyNotes": [
    "Only internally-generated review commands may execute.",
    "No arbitrary shell execution is allowed.",
    "No repository files were modified by the API runner itself."
  ]
}
```

Failures return `review-failed` with the exit code and summarized output.

### `GET /review/example`

Returns `examples/api-intake-review-request.json`.

## Request To Command Mapping

The runner builds a recommended command from:

- `repo.path`
- `git.baseBranch`
- `signals.releaseSignalsPath`, when present
- `signals.cicdSummaryPath`, when present
- `requestedOutputs` containing `pr-comment-draft`, which adds `--github-comment-draft`

The command is returned as text for `/review/intake` and `/review/dry-run`. `/review/execute` runs only that internally generated command shape.

## Execution Safety Model

`/review/execute` is not arbitrary command execution. It uses `child_process.spawn()` with `shell: false` and a fixed executable:

```text
npm
```

The argument array is generated internally:

```text
run review -- --repo <repo.path> --skill saana-plan --base-branch <git.baseBranch> ...
```

The runner does not use `exec()`, does not use `shell: true`, does not evaluate shell strings, and does not accept raw command fragments from the request.

Execution limits:

- maximum runtime: 5 minutes
- maximum captured stdout: 64 KB
- maximum captured stderr: 64 KB
- response summaries are capped to the last 20 non-empty lines
- ANSI escape codes are stripped
- token-like output patterns are redacted in summaries

Execution can create normal Dev Integrity review artifacts under `reports/`, because that is the purpose of a local review. The API runner itself does not modify target repository files.

## Safety Boundaries

The local API runner does not:

- bind to public interfaces
- provide a hosted API
- authenticate users
- store tokens
- use a database
- call external APIs
- write GitHub, Slack, or Jira data
- modify target repositories
- run arbitrary commands
- create report artifacts during dry run
- remediate code

It only parses local HTTP requests and returns local JSON responses.

## Relationship To API Intake Contract

The runner uses `src/apiIntakeContract.ts` for the request shape and validation helper. The contract remains the stable boundary. The runner is a local test harness for that boundary.

## Why Reviews Are Not Executed Yet

Review execution through `/review/execute` remains local and deterministic. It reads the validated intake request, builds the same internal command shown by dry-run, and runs only `npm run review -- ...`. Intake and dry-run remain non-executing paths for operators who only want previews.

## Future Execution Governance

Future execution governance may add explicit allowlists, operator confirmations, policy checks, per-repo execution controls, audit trails, and signed intake requests. Those are not implemented in Local API Runner v1.

## Future Hosted API Path

A future hosted API may reuse the same request and response shape, but would require explicit design for:

- authentication
- tenant isolation
- token handling
- webhook verification
- request persistence
- audit trails
- rate limiting
- provider-specific permissions

None of that is implemented in Local API Runner v1.
