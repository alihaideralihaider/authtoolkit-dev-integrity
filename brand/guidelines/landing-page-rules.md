# Landing Page Rules

AuthToolkit landing pages should explain operational infrastructure clearly and calmly. They should help technical buyers, founders, engineering leads, and operators understand what the product does and why it reduces risk.

## Standard Page Structure

Use this structure for most product pages:

```text
1. Hero
2. Proof or problem section
3. Workflow visualization
4. Comparison section
5. Feature grid
6. Developer/API section
7. Pricing or pilot section
8. FAQ
9. Final CTA
```

Not every page needs every section, but the order should preserve the same logic:

```text
outcome -> problem -> workflow -> proof -> details -> action
```

## Hero Rules

Hero must include:

- short operational headline
- calm subheadline
- primary CTA
- secondary CTA
- meaningful product/workflow visual

Headline examples:

- `Reviewer confidence for AI-generated PRs.`
- `Recovery workflows for revenue-critical systems.`
- `API execution you can inspect before it runs.`
- `Webhook orchestration with operational evidence.`

Subheadline should explain:

- what the product reviews
- what decision it supports
- what risk it reduces

Avoid:

- generic "build faster" claims
- abstract AI language
- huge hero illustrations with no operational meaning

## Problem Section

Problem sections should name practical workflow pain:

- missing rollback evidence
- unclear reviewer confidence
- passing tests but unsafe releases
- failed payment recovery
- webhook delivery uncertainty
- agent-written changes without release context

Use short cards or bullets. Do not over-explain.

## Workflow Visualization

Every landing page should include a workflow visual when possible.

Recommended formats:

- horizontal step flow on desktop
- vertical step flow on mobile
- connected node diagram
- event timeline
- API request to response diagram
- dashboard decision path

Example:

```text
External Context -> API Intake -> Dry Run -> Controlled Execution -> Reports -> Dashboard -> Human Review
```

## Comparison Section

Use comparisons to explain tradeoffs honestly.

Examples:

```text
Without AuthToolkit | With AuthToolkit
Manual guesswork    | Evidence-backed review
Hidden risk         | Visible blockers
Ad hoc recovery     | Documented recovery posture
```

Do not attack users or competitors. Focus on operational differences.

## Feature Grid

Feature grids should use 4-6 cards.

Card structure:

```text
Feature title
One-line operational outcome
Optional tiny detail
```

Feature titles should be concrete:

- Release confidence
- API intake
- Controlled execution
- Recovery evidence
- Dashboard artifacts
- Workflow routing

## Developer/API Section

Developer/API sections should show:

- endpoint or command
- request/response shape
- safety boundary
- local-first behavior

Example:

```sh
npm run review -- --repo . --skill saana-plan --base-branch main
```

Pair code with explanation. Do not make code blocks decorative.

## Pricing Section

If pricing is not final, use a pilot CTA instead.

Pilot language:

```text
Free repo/release-risk scan for AI-assisted teams and vibe-coded projects.
```

Do not imply full SaaS availability if the product is not there yet.

## FAQ Section

FAQ should reduce trust friction.

Recommended questions:

- Does code leave my machine?
- Does it write to GitHub?
- Does it execute commands automatically?
- Is this full SaaS?
- What artifacts are created?
- How does local mode work?

Answers should be direct and conservative.

## Spacing

Mobile-first:

- section padding: 48-64px vertical
- side padding: 20-24px
- card gap: 12-16px

Desktop:

- section padding: 72-96px vertical
- side padding: 48-80px
- card gap: 16-24px
- max text width: 680-820px

## Typography

Hero headline:

- 44-56px mobile if space allows
- 64-88px desktop
- bold
- short

Section heading:

- 30-38px mobile
- 42-56px desktop

Body:

- 16-18px
- 1.45-1.65 line height

## CTA Rules

Primary CTA should be green.

Secondary CTA should be navy outline, white outline on dark sections, or muted text link.

CTA copy should be concrete:

- Request a pilot
- Get a free scan
- View dashboard
- Read API contract
- Run local review

## Honesty Rules

Use honest positioning:

- early access
- pilot users
- local-first
- not full SaaS yet
- no code leaves your machine in local mode

Do not imply hosted multi-tenant capabilities before they exist.
