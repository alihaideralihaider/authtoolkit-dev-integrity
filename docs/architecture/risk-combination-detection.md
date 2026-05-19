# Risk Combination Detection

## Purpose

Risk Combination Detection looks across changed files and identifies dangerous combinations that are more important together than they are individually.

It builds on the v1 local pipeline:

```text
Git changes -> risk classification -> severity -> review packs -> risk combinations -> markdown report
```

## Why Combinations Matter

A single changed file can look manageable. Multiple related changes can create a release risk that should be reviewed differently.

Examples:

- A payment file plus a webhook file plus a security file can affect payment trust boundaries.
- A runtime file plus an env/config file can create deployment drift.
- An admin UI change plus an API/auth change can affect authorization.

V1 detection is intentionally simple and explainable. It uses changed file classifications, severity, and path/name heuristics only.

## V1 Combinations

### payment-webhook-trust-boundary

- Severity: critical
- Trigger: payment + webhook + security
- Meaning: Payment webhook or trust boundary may be affected.
- Suggested packs: payment-pack, security-pack, release-readiness-pack

### deployment-secret-runtime-drift

- Severity: high
- Trigger: runtime + vault
- Meaning: Runtime or binding changes may interact with secret/config changes.
- Suggested packs: runtime-pack, vault-pack, release-readiness-pack

### admin-authorization-boundary

- Severity: high
- Trigger: security + UX + admin/API path
- Meaning: Admin or API user flow may affect authorization boundary.
- Suggested packs: security-pack, ux-pack, release-readiness-pack

### telecom-runtime-compliance

- Severity: high
- Trigger: SMS compliance + runtime, webhook, or voice-related change
- Meaning: Messaging, voice, webhook, or telecom runtime changes may affect compliance.
- Suggested packs: sms-compliance-pack, runtime-pack, release-readiness-pack

### unknown-risk-near-sensitive-change

- Severity: high
- Trigger: unknown file + any high or critical severity change
- Meaning: Unknown file exists near sensitive changes and needs manual planning review.
- Suggested packs: planning-pack, release-readiness-pack

## Confidence Impact

Risk combinations cap confidence:

- Any critical combination caps confidence at 35.
- Any high combination caps confidence at 50.
- No detected combinations keeps existing confidence logic.

The cap is not a verdict that the change is broken. It means the combination needs targeted human or agent review before the report should be trusted for release decisions.

## Limitations

- Detection is path/name-based only.
- It does not parse code semantics.
- It does not inspect imports, call graphs, runtime behavior, or provider settings.
- It may over-select combinations when broad terms appear in filenames.
- It is designed to route review, not to prove safety.

## What This Does Not Do Yet

Risk Combination Detection v1 is not:

- PR Integrity
- Release Monitoring
- Runtime Integrity
- A dashboard
- A database-backed policy engine
- An autofix system
- A replacement for security, payment, SMS, Vault, or runtime review

