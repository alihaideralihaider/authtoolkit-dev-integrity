# GitHub Checks Context

## Purpose

GitHub Checks Context reads pull request and check status from GitHub in read-only mode and maps it into AuthToolkit Dev Integrity's operational trust output.

It is the first external integration and is intentionally constrained to read-only GitHub API calls.

## Read-Only Integration

GitHub Checks Context does not:

- post comments
- write statuses
- approve pull requests
- merge pull requests
- delete branches
- handle webhooks
- store tokens
- print tokens

The local Integrity Engine remains the source of truth. GitHub data is context, not an override.

## Flags

GitHub Checks Context only runs when all three flags are provided:

```sh
npm run review -- --repo . --skill saana-plan --base-branch main --github-repo owner/repo --github-pr 123 --github-token-env GITHUB_TOKEN
```

If any flag is missing, the review continues without GitHub API calls. If the token environment variable is missing, the review records a warning and does not call GitHub.

## Token Safety

The token is read from `process.env[githubTokenEnv]`.

The token must never be printed, written to reports, stored in catalog output, or included in generated comments. Reports only mention the token environment variable name when it is missing.

## Fields Collected

GitHub Checks Context v1 collects:

- repo
- PR number
- PR state
- PR title
- PR URL
- base ref
- head ref
- head SHA
- mergeable state
- review decision, when available
- total checks
- passed checks
- failed checks
- pending checks
- skipped checks
- required checks unknown
- failed check names
- pending check names
- successful check names
- warnings
- trust summary

## Relationship To CI/CD Context

CI/CD Context consumes local redacted pipeline summary files.

GitHub Checks Context consumes read-only GitHub PR/check API data. Both can influence evidence and release expectations, but neither posts statuses, triggers jobs, downloads logs, or changes the target repository.

## Limitations

GitHub Checks Context v1 is intentionally limited:

- no comment posting
- no status writing
- no approval automation
- no merge automation
- no webhook handling
- no raw logs
- no branch protection rule parsing
- required checks are marked unknown in v1

## Future Integrations

Future GitHub integration may add comment posting, status checks, merge queue awareness, webhook ingestion, and branch protection interpretation. Those capabilities should be separate write-enabled integration layers with explicit safety controls.
