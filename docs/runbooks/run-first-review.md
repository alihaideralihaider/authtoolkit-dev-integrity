# Run First Review

## Purpose

Run the first local AuthToolkit Dev Integrity CLI review against a repository.

## Command

From the AuthToolkit Dev Integrity repo:

```sh
npm run review -- --repo /path/to/repo --skill vault-secret-readiness-review
```

Example against this repo:

```sh
npm run review -- --repo . --skill vault-secret-readiness-review
```

## Output

The CLI writes a markdown report into:

```text
reports/
```

## Safety

- The CLI does not call external AI APIs.
- The CLI does not modify the target repo.
- The CLI scans changed files for env var-like names only.
- The CLI must not print or store secret values.

