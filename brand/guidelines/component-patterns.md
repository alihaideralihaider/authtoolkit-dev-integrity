# Component Patterns

AuthToolkit components should make operational systems easier to scan and trust.

## Cards

Use cards for:

- features
- dashboard panels
- pricing plans
- API examples
- workflow steps
- evidence blocks

Standard card:

```text
background: white
border: 1px solid light gray
radius: 12px
padding: 20-24px
shadow: subtle
```

Card content order:

```text
label or icon
title
short description
metadata or action
```

Avoid nested cards unless the inner card is a code sample, metric, or specific repeated item.

## Badges

Use badges for:

- Early access
- Local-first
- Production Strict
- Dry Run
- Read-only
- Recovery
- API Intake

Badge style:

```text
height: 28-32px
radius: 999px
font-size: 12px
font-weight: 700-800
uppercase optional
```

Use green badges for safe/active states, navy badges for identity, and muted badges for metadata.

## Buttons

Primary button:

```text
background: #7ED321
text: #041B4D or white if contrast requires
radius: 8-10px
height: 44-48px
font-weight: 800
```

Secondary button:

```text
background: white or transparent
border: 1px solid navy or light gray
text: navy
```

Danger or destructive buttons should be rare and must use explicit labels.

## Tabs

Use tabs for switching between:

- Overview / Details
- Request / Response
- Local / Staging / Production Strict
- Dry Run / Execute

Tab style:

- segmented control
- clear active state
- no decorative motion required

## Comparison Tables

Comparison tables should be concise.

Use for:

- before/after workflows
- local vs hosted boundaries
- dry-run vs execute
- product tiers

Rules:

- first column describes operational capability
- columns have plain labels
- each row should fit on mobile as stacked cards if needed
- avoid long paragraphs inside cells

## Dashboard Panels

Dashboard panels should prioritize:

- current decision
- confidence
- blockers
- workflow route
- evidence needs
- latest timestamp

Panel content should not become a wall of metrics. Show the decision first, then supporting evidence.

## Feature Sections

Feature sections should group by workflow:

- Intake
- Review
- Evidence
- Recovery
- Dashboard
- API

Feature copy should state what the system helps the user do.

Example:

```text
Release confidence
See whether a change is safe to approve, merge, or ship under the current evidence posture.
```

## Pricing Cards

Pricing cards should be plain and trustworthy.

Recommended structure:

```text
Plan name
Best for
Core capability
Included workflows
Safety notes
CTA
```

Use a pilot card when pricing is not final.

## Stat Blocks

Use stat blocks for meaningful operational numbers only:

- confidence percentage
- number of blocked workflows
- reports generated
- retries recovered
- webhook failures

Do not use vanity metrics without context.

Stat block structure:

```text
value
label
context
```

## Workflow Timelines

Use timelines to show order and accountability.

Example:

```text
Context -> Intake -> Dry Run -> Execute -> Report -> Dashboard -> Human Decision
```

Timeline rules:

- keep labels short
- use green for current/safe step
- use navy for completed/neutral steps
- use amber/red only for risk or blocker states

## Forms

Form components:

- visible labels
- helper text
- clear validation
- consistent input height
- simple submit button

Pilot forms should ask for only what is needed:

- name
- email
- company
- repo/workflow type
- current release risk

## API Blocks

API blocks should use:

- method badge
- endpoint path
- short explanation
- request example
- response example
- safety note

Do not show raw secrets or real tokens.

## Mobile Behavior

Components should stack cleanly:

- 3-column grids become 1 column
- tables become cards
- diagrams become vertical steps
- CTAs wrap below text
- stat blocks keep values readable

Minimum spacing:

- 12px between compact items
- 16px between cards
- 24px between major content groups
