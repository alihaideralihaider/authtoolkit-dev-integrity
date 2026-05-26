# Integrity Incident Playbook

This playbook is a local-first incident response framework for suspicious code, dependency, CI, release, artifact, or runtime integrity events.

It is documentation/template-based for now. It does not add live GitHub automation, hosted execution, external APIs, Slack/Jira integration, or arbitrary command execution.

## When to Trigger This Playbook

Start this playbook when one strong signal or two weak signals appear.

### Strong Signals

- Auth, secrets, deployment, build, release, or package-publish paths changed unexpectedly.
- CI/CD token, deploy key, package registry token, or cloud credential may have been exposed.
- Release artifact hash does not match source/build provenance.
- Runtime shows unexpected egress, token use, privilege escalation, or dependency execution.
- Dependency adds a suspicious `postinstall`, `preinstall`, binary download, credential read, or network call.
- Protected branch was force-pushed, branch protection was changed, or a signed-commit rule was bypassed.
- A released version may contain unreviewed or untrusted code.

### Weak Signals

- Odd PR from a new or inactive account.
- "Bump minor" or dependency-only PR changes business logic.
- New transitive dependency has low age/downloads, typosquat-like name, or unclear maintainer history.
- Lockfile churn appears outside a normal release window.
- CI starts pulling unpinned actions, images, packages, or tags such as `latest`.
- Tests/docs-only PR touches build, auth, release, or runtime configuration.
- Commit signatures are missing, unverifiable, or inconsistent with usual maintainers.

## 15-Minute Triage

Open an incident note using `templates/incidents/INCIDENT.md`.

Capture:

- UTC timestamp
- reporter
- suspected repo/project
- branch, tag, PR, commit, release, artifact, or runtime environment
- last known good commit/tag
- current owner
- immediate next update time

Snapshot evidence:

```bash
git log -n 50 --decorate --show-signature
git diff <last-known-good>..HEAD --stat
git diff <last-known-good>..HEAD
```

Export or save:

- CI run logs
- artifact SHAs
- package lockfile
- SBOM/provenance files if available
- deploy logs
- package registry publish metadata
- runtime logs around first suspicious event

Classify severity:

- High: auth, keys, tokens, build/release path, data exfiltration, production artifact, package publish, or runtime compromise suspected.
- Medium: suspicious code/dependency not released yet, limited environment exposure, or feature-flagged path.
- Low: docs/tests-only, no secrets, no release proximity, no runtime exposure.

## Immediate Containment

Contain first, explain later.

### Access and Secrets Rotation

- Rotate CI/CD tokens and deploy keys.
- Revoke package registry tokens used in the last 7 days.
- Revoke or rotate cloud credentials used by suspect jobs.
- Force MFA re-auth for involved maintainers when feasible.
- Remove unknown deploy keys, GitHub apps, OAuth grants, and machine users.
- Review recent PAT, SSH key, and secret access logs.

### Build and Release Freeze

- Freeze releases until an incident owner clears the build.
- Disable auto-publish and auto-deploy paths.
- Require admin/manual approval for main/release branches.
- Require signed commits where supported.
- Pin third-party actions/modules by commit SHA.
- Replace floating tags such as `@v3`, `latest`, or unversioned container images.

### Dependency Quarantine

- Quarantine new or renamed dependencies since the last known good commit.
- Regenerate/install with the frozen-lockfile equivalent.
- Diff lockfiles carefully.
- Disable lifecycle scripts in install steps when possible.
- Replace suspect dependencies with known-good versions or forks only after review.

### Runtime Containment

- Flip feature flags or kill switches to safe defaults.
- Roll back to the last known good release when shipped artifacts are suspect.
- Invalidate API keys issued during the suspect window.
- Force tenant/customer key rotation only when exposure is plausible.
- Block unexpected egress destinations.
- Preserve logs before rotating or redeploying if possible.

## Scope and Root Cause Checklist

Answer these before declaring containment complete:

- Which repos, branches, commits, tags, builds, and artifacts are in scope?
- Which environments received suspect artifacts?
- Which customers or tenants could have been affected?
- Which credentials existed in the build/runtime scope?
- Which maintainers, bots, GitHub apps, and CI jobs touched the suspect path?
- Did any dependency execute lifecycle scripts?
- Did any build step perform unexpected network access?
- Did any artifact hash differ from the expected build output?
- Did any package publish occur during the suspect window?
- Are there signs of data exfiltration or secret reads?
- What was the first bad commit or first suspicious event?
- What detection gap allowed the issue to reach this stage?

## Remediation Checklist

- Revert to the last known good tag/commit when needed.
- Rebuild artifacts from clean source.
- Publish a hotfix with artifact SHAs attached.
- Rotate affected credentials and record rotation completion.
- Revoke suspect package versions or mark them deprecated if appropriate.
- Backfill SBOM/provenance for the corrected release.
- Add a regression test or integrity check that would have caught the issue.
- Add a dependency policy check for lifecycle scripts and lockfile churn.
- Add a build guard for unsigned commits or unpinned actions.
- Add runtime egress controls where the incident showed a gap.
- Update runbooks/templates after the final report.

## Internal Communication Template

Subject:

```text
Incident declared: integrity investigation and release freeze
```

Body:

```text
What happened:
<1-2 factual lines>

Current status:
Releases are frozen. Last known good: <tag/commit>. Owner: <name>.

Actions in flight:
- evidence snapshot
- dependency/build diff review
- credential and token review
- artifact hash verification

Potential scope:
<repos/branches/artifacts/environments/customers if known>

Next update:
<UTC time + 1 hour>
```

## Customer Notice Template

Use only if a suspect artifact shipped or customer action may be needed.

Subject:

```text
Notice about a recent build integrity investigation
```

Body:

```text
We identified an integrity issue under investigation that may affect builds between <start UTC> and <end UTC>.

Out of caution, we paused releases, rotated credentials, and rebuilt from a known-good source.

If you installed versions <versions>, please upgrade to <hotfix version> and verify the artifact SHA:
<sha>

At this time, <known impact / no confirmed data exposure / investigation ongoing>.

We will provide a final report by <date UTC>.
Contact <support/security contact> for prioritized help.
```

## Final Report Template

Use `templates/incidents/INCIDENT.md` as the working log, then publish a final report with:

- summary
- timeline
- detection source
- affected repos/branches/tags/artifacts/environments
- customer impact
- root cause
- contributing factors
- actions taken
- artifact hashes for remediated builds
- credential rotations performed
- controls added
- controls still planned
- owner and review date

## Post-Incident Controls

Make the fix durable:

- branch protections: signed commits, two reviewers, linear history
- provenance: SBOM, artifact SHAs, release attestations
- dependency policy: lifecycle script review, age/download thresholds, typo-squat checks
- CI hardening: least-privilege tokens, OIDC where possible, no secrets for fork PRs
- release gates: dependency diff, artifact hash match, egress denylist, no-postinstall check
- alerts: new maintainer, registry token use, deploy key change, lockfile churn, branch protection change
- runtime controls: egress policy, secret-access anomaly review, canary checks

## GitHub Integrity Gates Example

See `examples/github/integrity-gates.yml`.

The example is intentionally not installed under `.github/workflows` yet. It is a reference for future repository-specific adoption.

Recommended gates:

- checkout with pinned action SHA
- verify latest commit signature
- install with scripts disabled for dependency audit
- fail on high-severity npm audit findings
- run `scripts/assert-no-postinstall.js`
- review lockfile diffs before release

## No-Postinstall Script

See `scripts/assert-no-postinstall.js`.

The script checks `package.json` and fails if `scripts.postinstall`, `scripts.preinstall`, or `scripts.install` are present. It is deliberately small and local-first.

Use it as a release gate where lifecycle scripts are not expected.

## Local-First Boundary

This playbook does not require hosted execution. Evidence collection, dependency review, token rotation tracking, and final reporting can happen locally in Markdown first.

Future automation may wire these controls into CI, dashboards, or API feeds, but the manual response loop must remain usable during degraded infrastructure events.
