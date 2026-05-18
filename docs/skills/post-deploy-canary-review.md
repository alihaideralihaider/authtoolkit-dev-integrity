# post-deploy-canary-review

## Purpose
Verify that a deployment is reachable, stable, and not obviously broken after release.

## When to run
- After deploy.
- After runtime binding changes.
- After security, payment, SMS, or critical UX changes.

## Inputs
- Deployment URL
- Critical routes
- Health endpoints
- Expected status codes
- Smoke test notes

## Checklist
- Homepage responds.
- Login route responds.
- Critical customer/admin routes respond.
- APIs return expected auth behavior.
- No obvious production errors are visible.

## Output format
- Canary status
- Checked URLs
- Status codes
- Blockers
- Rollback recommendation

## Failure examples
- Production returns 500.
- Protected API is publicly accessible.
- Critical customer route is unreachable.

## Suggested fix format
Classify severity, stop further deploys if needed, fix or rollback, and rerun canary.

