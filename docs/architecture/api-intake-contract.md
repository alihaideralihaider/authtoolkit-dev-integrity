# API Intake Contract v1

API Intake Contract v1 defines the first API-facing request and response shape for external tools that want to submit review context into AuthToolkit Dev Integrity.

This is a contract-first integration boundary. It is not a hosted API, not SaaS, not authentication, not webhook processing, not a database, and not code-agent remediation.

## Why API Intake Exists

Dev Integrity currently runs local-first reviews from CLI arguments and local artifact files. External tools such as GitHub apps, Slack workflows, Jira automations, CLIs, and code agents need a stable way to describe review context without directly executing the Integrity Engine or changing target repositories.

API intake exists to separate context submission from review execution:

- intake describes what should be reviewed
- local review execution remains explicit and operator-controlled
- generated reports remain the source of truth
- external tools do not receive write authority through this contract

## Request Contract

An intake request describes repo, git, ticket, signal, and requested output context.

See `examples/api-intake-review-request.json`.

Required top-level intent fields:

- `requestId`: caller-generated id for correlation
- `source`: submitting channel, such as `github-app`, `cli`, `slack`, `external-agent`, or `manual`
- `mode`: intended review posture, such as `local-dev`, `staging`, or `production-strict`
- `repo`: repo identity and local path
- `git`: branch, commit, and PR context when available
- `signals`: local signal artifact paths or read-only provider context labels
- `requestedOutputs`: desired local artifacts or drafts

The `mode` field is advisory in v1. It documents caller intent but does not switch scoring behavior unless the local engine explicitly supports that in a future version.

## Response Contract

An intake response confirms whether the request is structurally accepted and gives the operator a recommended local review command.

See `examples/api-intake-review-response.json`.

The response does not mean review execution already happened. `ready-for-local-review` means the request has enough context for a local operator or wrapper to run the recommended command.

## API Intake vs Execution

API intake is not execution automation.

Intake may:

- normalize external context into a review request
- return a recommended local command
- describe expected artifacts
- preserve request correlation with `requestId`

Intake must not:

- modify target repos
- call external APIs
- post GitHub comments
- write Slack messages
- update Jira tickets
- start hosted workers
- store tokens
- persist tenant data
- auto-remediate code

The local Integrity Engine remains the execution source of truth.

## Local-First Safety Boundaries

API Intake Contract v1 keeps the current safety model:

- no backend server is required
- no network listener is required
- no database is required
- no secrets or tokens are stored
- no external API writes are performed
- no target repository files are modified
- review artifacts are generated only by explicit local review execution

External URLs in request examples are redacted placeholders. Real integrations should avoid sending secrets, raw logs, or sensitive customer data through this contract.

## Relationship To Integrations

GitHub, Slack, Jira, and code-agent integrations can use this contract as a shared shape for review context.

- GitHub app: can describe repo, PR, commit, read-only checks, and local signal paths.
- Slack workflow: can submit manual release-review context or link to an existing ticket.
- Jira automation: can attach ticket key, summary, and redacted ticket URL.
- External code agent: can request a local review after proposing changes, without receiving permission to modify or deploy.
- CLI wrapper: can transform command flags into this request shape before invoking local review.

These integrations are context providers. They are not trusted execution engines in v1.

## Future Hosted API Direction

A future hosted API may accept this same request shape over HTTP, but that is out of scope for v1.

Hosted direction will require explicit boundaries for:

- authentication
- tenant isolation
- token handling
- request persistence
- audit trails
- rate limits
- webhook verification
- provider-specific permissions

None of those are implemented by this contract.

## Future Webhook Intake

Webhook intake can later adapt provider payloads into `api-intake-review-request` documents.

Examples:

- GitHub pull request opened or synchronized
- GitHub Actions workflow completed
- Slack release approval requested
- Jira ticket moved to release review
- external agent finished implementation

Webhook processing is not part of v1. The v1 contract only defines the normalized shape those future webhook handlers may produce.

## Expected Local Flow

1. External tool creates an intake request JSON document.
2. Local wrapper validates the shape.
3. Local wrapper returns or displays a recommended `npm run review` command.
4. Operator runs the command locally.
5. Dev Integrity writes reports under `reports/`.
6. Local dashboard reads generated artifacts.

This preserves local-first review execution while creating a stable bridge toward API-driven integrations.
