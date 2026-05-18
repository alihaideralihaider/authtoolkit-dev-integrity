# Vault Audit

Vault Audit is the evidence and review layer for Vault Control Room.

## Leak Audit

Question: Was a secret exposed in Git, logs, screenshots, tickets, chats, local files, or docs?

Evidence needed:
- Git history scan result
- current repo scan result
- known incident notes
- remediation evidence

Remediation:
- revoke exposed key
- deploy replacement
- verify production
- document evidence

## Access Audit

Question: Who can access each provider, vault, CI secret, and runtime environment?

Evidence needed:
- provider account owners
- team access list
- CI secret admin list
- emergency access process

## Rotation Audit

Question: Was the new key deployed, the old key revoked, and production verified?

Evidence needed:
- rotation event
- deploy evidence
- revocation confirmation
- verification result

## Runtime Usage Audit

Question: Which service consumes this secret, is it still active, and is it orphaned?

Evidence needed:
- env var inventory
- runtime binding inventory
- scanner output
- provider dashboard review

## Revocation Evidence

Question: Can the team prove old keys are no longer valid?

Evidence needed:
- provider revocation timestamp
- validation that the new key works
- deploy or rollback record

## Audit Timeline

Question: What happened, when, who acted, and what evidence exists?

Evidence needed:
- timestamped findings
- actions taken
- verification status
- unresolved follow-ups

## Missing Secret Incident Review

Question: Could a new laptop, server, or CI runner rebuild the project without founder memory?

Remediation:
- document missing secret names
- document source of truth
- update recovery checklist
- rerun Vault readiness review

