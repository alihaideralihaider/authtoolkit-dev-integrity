# Post-Deploy Canary

## Purpose

Verify production after deployment.

## Steps

1. Confirm deployment completed.
2. Check homepage or health route.
3. Check login or auth route.
4. Check one critical customer route.
5. Check one critical admin route.
6. Confirm protected APIs do not allow public access.
7. Capture status codes, timestamps, and follow-ups.

## Rollback Triggers

- Production returns repeated 5xx.
- Auth bypass is suspected.
- Checkout or payment state is broken.
- Customer-critical workflow is unavailable.

