# GitHub PR Comment Draft

## Purpose

GitHub PR Comment Draft generates a local markdown comment body from the latest AuthToolkit Dev Integrity review result.

It prepares the system for future GitHub pull request integration without posting anything to GitHub or calling GitHub APIs.

## Local Draft Only

The draft is generated only when the CLI flag is supplied:

```sh
npm run review -- --repo . --skill saana-plan --base-branch main --github-comment-draft
```

The output is written to:

- `reports/github-pr-comment.md`

The file is local generated output and should be reviewed before manual posting.

## What It Includes

The draft includes:

- Control Room status
- Plain English summary
- PR readiness label
- overall integrity decision
- operational trust level
- workflow priority
- active workflows
- required actions
- required evidence
- human attention areas
- Git Context branch/base/commit
- CI/CD status when available
- path to the full local report
- safety note: `Generated locally. Review before posting.`

## Safety Rules

GitHub PR Comment Draft must not include:

- raw diffs
- raw logs
- secret values
- environment values
- tokens
- credentials
- customer data

It does not post comments, approve PRs, merge PRs, or call external services.

## Future GitHub API Relationship

Future GitHub integration can use this draft body as the basis for a PR comment. Posting, authentication, retries, permissions, and status checks should be added as a separate integration layer, not hidden inside local report generation.

## Limitations

GitHub PR Comment Draft v1 is intentionally small:

- no GitHub API
- no OAuth
- no webhook integration
- no PR status checks
- no comment posting
- no token handling
- no branch protection awareness

It is a local reviewable draft only.
