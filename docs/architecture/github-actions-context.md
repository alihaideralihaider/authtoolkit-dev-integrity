# GitHub Actions Context

GitHub Actions Context v1 adds read-only workflow run and job metadata to AuthToolkit Dev Integrity reports.

It goes deeper than GitHub Checks Context by reading workflow runs and job metadata for the pull request head SHA. It does not fetch raw logs and does not control workflows.

## Purpose

GitHub Actions Context helps the local Integrity Engine understand whether workflow runs, jobs, or steps are passing, failed, pending, or cancelled before humans rely on release or merge posture.

## Read-Only Behavior

This layer only performs read-only GitHub REST API calls when explicitly enabled. It never:

- posts comments
- writes statuses
- approves pull requests
- merges pull requests
- reruns workflows
- cancels workflows
- deletes branches
- fetches raw logs
- prints tokens

## Flags

Enable with:

```bash
npm run review -- --repo . --skill saana-plan --base-branch main --github-repo owner/repo --github-pr 123 --github-token-env GITHUB_TOKEN --github-actions-context
```

The Actions API is only attempted when all are present:

- `--github-actions-context`
- `--github-repo`
- `--github-pr`
- `--github-token-env`
- the named token environment variable exists

If the token is missing, the report records a warning and continues without calling GitHub.

## APIs Used

v1 uses GitHub REST API endpoints:

- `GET /repos/{owner}/{repo}/pulls/{pull_number}`
- `GET /repos/{owner}/{repo}/actions/runs?head_sha={headSha}`
- `GET /repos/{owner}/{repo}/actions/runs/{run_id}/jobs`

Raw logs are not requested.

## Fields Collected

The context records safe metadata only:

- provider
- workflow run count
- workflow run summaries
- failed, successful, pending, and cancelled workflow names
- failed job names
- failed step names from job metadata
- longest run duration summary
- safe workflow run references
- warnings
- trust summary

## Relationship To GitHub Checks Context

GitHub Checks Context summarizes PR checks and status checks. GitHub Actions Context deepens that view with workflow run and job metadata. It does not override GitHub Checks Context.

## Relationship To CI/CD Context

CI/CD Context consumes a local redacted pipeline summary file. GitHub Actions Context reads provider metadata directly when explicitly configured. Both map into workflow evidence, release review, and PR risk summaries.

## Limitations

- v1 does not fetch logs.
- v1 does not inspect artifacts.
- v1 does not know required workflow policy unless GitHub Checks or future provider metadata supplies it.
- v1 caps workflow run job inspection to a small local review scope.
- v1 does not rerun or cancel workflows.

Future versions may add workflow rerun or cancellation support only as explicit controlled operations, not as part of this read-only context layer.
