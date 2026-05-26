# Security and Integrity Reporting

If you observe suspicious code, dependency anomalies, CI drift, release artifact mismatch, runtime integrity concerns, or possible credential exposure, contact:

```text
security@<yourdomain>
```

Please include:

- affected repository or package
- branch, PR, commit, tag, or release
- observed behavior
- timestamps in UTC
- screenshots/logs if safe to share
- whether a release artifact may be affected

Do not include secrets, raw tokens, private keys, customer data, or exploit payloads in the report.

## Response Policy

When an integrity concern appears credible:

- maintainers open `templates/incidents/INCIDENT.md`
- releases freeze until the incident owner clears the build
- suspected credentials are rotated
- suspicious dependencies are quarantined
- final findings are documented after remediation

## Scope

Report:

- suspicious pull requests or commits
- unsigned/unexpected commits in protected paths
- dependency typosquats or lifecycle scripts
- CI/CD drift
- artifact hash mismatch
- release provenance mismatch
- unexpected runtime egress
- token use from unusual environments

Do not use this channel for normal product support.
