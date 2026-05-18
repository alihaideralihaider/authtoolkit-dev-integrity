# Pre-Deploy Integrity Check

## Purpose

Confirm that a change is ready for deployment.

## Steps

1. Review git status and changed files.
2. Run project tests.
3. Run integrity review.
4. Run selected skills.
5. Confirm Vault readiness for new or changed env vars.
6. Confirm runtime bindings for platform changes.
7. Capture final findings and confidence score.

## Blockers

- Critical security finding
- High payment or webhook risk
- Missing required production secret
- Unknown deployment target
- Failed build or test

