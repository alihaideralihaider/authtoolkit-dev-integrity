# saana-payment-review

## Purpose
Review checkout, billing, payment state, pricing, webhook handling, idempotency, and reconciliation.

## When to run
- Stripe or payment provider code changed.
- Checkout or billing UI changed.
- Payment webhooks changed.
- Pricing, order state, or subscription logic changed.

## Inputs
- Changed payment files
- Webhook routes
- Provider config names
- Test or canary evidence

## Checklist
- Payment state is provider-confirmed.
- Webhook signature validation exists.
- Idempotency is handled.
- Pricing changes are intentional.
- Failed/cancelled payment states are handled.

## Output format
- Findings by severity
- Payment state risks
- Required verification
- Recommended fixes

## Failure examples
- Order marked paid before provider confirmation.
- Webhook can be replayed.
- Checkout price ID is undocumented.

## Suggested fix format
Verify provider flow, add smallest safe fix if needed, and rerun payment review.

