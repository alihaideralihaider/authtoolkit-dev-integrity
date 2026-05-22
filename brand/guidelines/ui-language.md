# UI Language

AuthToolkit UI should feel operational, organized, scalable, workflow-centric, and trustworthy.

It should not feel flashy, game-like, crypto-native, or like AI magic.

## Core UI Traits

- white or soft mint surfaces
- navy headings
- muted slate body text
- green primary actions
- rounded-xl cards where supported by the implementation
- subtle shadows
- thin borders
- clear section hierarchy
- mobile-first layout behavior

## Hero Sections

Hero sections should clearly state the operational outcome.

Recommended structure:

```text
Eyebrow: Infrastructure / Workflow / Recovery / API
Headline: Short outcome statement
Subheadline: What it helps teams decide or operate
Primary CTA: Action-oriented
Secondary CTA: Dashboard, docs, or demo
Visual: workflow diagram, dashboard preview, API card, or release path
```

Hero rules:

- Use short headlines.
- Use one clear primary CTA.
- Use a meaningful product or workflow visual.
- Keep hero copy grounded in operational value.
- Avoid exaggerated claims.

Example headline patterns:

- `Reviewer confidence for AI-generated PRs.`
- `Recovery infrastructure for failed payment flows.`
- `Webhook execution without operational guesswork.`
- `Authentication workflows teams can operate.`

## Dashboard Cards

Dashboard cards should represent real operational objects:

- release gate
- workflow status
- evidence need
- API request
- event delivery
- recovery path
- approval decision
- revenue risk

Card standards:

- 8-12px radius
- 1px border
- white background
- restrained shadow
- clear label
- one primary value
- secondary context below
- status color only when meaningful

Avoid cards that only decorate a page.

## CTA Buttons

Primary buttons:

- green background
- navy or white text depending on contrast
- clear action
- no vague copy

Secondary buttons:

- white or transparent background
- navy text
- navy or light border

CTA copy should use verbs:

- Request a pilot
- View dashboard
- Run local review
- Get a free scan
- Read the contract
- Start dry run

Avoid:

- Get started now!!!
- Unlock magic
- Supercharge with AI

## Forms

Forms should feel enterprise-ready:

- labels always visible
- clear helper text
- large tap targets
- inline validation
- no playful placeholders
- no hidden critical information

Preferred fields:

- Work email
- Company
- Repo type
- Current workflow
- Release risk area
- Pilot notes

## API Sections

API sections should be concrete and legible:

- endpoint
- method
- request shape
- response shape
- safety boundaries
- example command

Use code blocks only when they help comprehension. Pair code blocks with plain-language explanation.

## Workflow Sections

Workflow sections should show ordered movement:

```text
Input -> Intake -> Dry Run -> Execution -> Reports -> Dashboard -> Human Review
```

Use connected nodes, arrows, timelines, or step cards. Keep labels short. Add detail below, not inside every node.

## Pricing Cards

Pricing is future-facing but should follow the same structure:

- plan name
- intended user
- core capability
- included usage
- trust/safety notes
- CTA

Pricing cards should avoid gimmicks. Use one highlighted recommended plan when needed.

## Comparison Tables

Use comparison tables for operational differences:

- local vs hosted
- dry run vs execute
- staging vs production strict
- manual review vs Dev Integrity review

Rules:

- keep rows short
- use checkmarks sparingly
- use text for important distinctions
- do not hide limitations

## Admin Tables

Admin tables should prioritize scanning:

- sticky or clear headers where possible
- compact row height
- strong status badges
- repo/project identity visible
- timestamps readable
- actions grouped at row end

## Mobile-First Layouts

Mobile rules:

- one primary column
- sections stack vertically
- CTAs wrap cleanly
- diagrams collapse into steps
- tables convert to cards when needed
- avoid tiny code samples

Minimum tap target: 44px.

## Empty States

Empty states should be factual and useful:

```text
No review artifacts found.
Run a local review to populate this dashboard.
```

Avoid cute or clever empty states.
