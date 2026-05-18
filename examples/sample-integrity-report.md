# Sample Integrity Report

## Project

- Project: sample-project
- Commit: abc123
- Confidence before fixes: 0.72
- Confidence after fixes: 0.91
- Decision: ready for deploy check

## Selected Reviews

- saana-plan
- saana-security-review
- vault-secret-readiness-review
- post-deploy-canary-review

## Findings

### Medium: Unknown auth boundary

Evidence:
- `/api/orders` requires authorization review.

Suggested fix:
- Verify session identity and authorization guard.
- Add the smallest safe fix if missing.
- Rerun integrity review.

## Final Notes

No secret values, raw customer records, or private logs are included in this report.

