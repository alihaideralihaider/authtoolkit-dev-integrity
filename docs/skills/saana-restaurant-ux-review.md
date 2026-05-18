# saana-restaurant-ux-review

## Purpose
Review restaurant-facing and customer-facing UX flows for clarity, operational fit, and regression risk.

## When to run
- Menu, ordering, admin, storefront, QR, hub, or onboarding UX changed.
- User-facing copy or forms changed.
- Restaurant workflow behavior changed.

## Inputs
- Changed UI files
- Route list
- Screenshots or local QA notes
- Known user workflow

## Checklist
- Customer flow is understandable.
- Admin workflow is efficient.
- Copy is clear and domain-specific.
- Empty, loading, error, and success states are handled.
- Mobile layout is usable.

## Output format
- UX findings
- Affected workflow
- Severity
- Recommended fix

## Failure examples
- Checkout flow loses context.
- Admin cannot identify order status.
- Mobile layout hides critical actions.

## Suggested fix format
Describe the workflow issue, apply the smallest UI/content fix, and run browser QA.

