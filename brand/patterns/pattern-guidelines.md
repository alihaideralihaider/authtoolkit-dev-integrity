# Pattern Guidelines

AuthToolkit patterns should support infrastructure, workflow, and system comprehension. They should not become decorative noise.

## Approved Pattern Types

- subtle grid backgrounds
- connected node paths
- workflow route lines
- API request/response frames
- event stream lines
- soft mint section washes
- pale green active-route highlights
- dashboard panel silhouettes

## Grid Pattern

Use grid patterns to imply infrastructure and systems.

Recommended:

```css
background-image:
  linear-gradient(rgba(4, 27, 77, 0.05) 1px, transparent 1px),
  linear-gradient(90deg, rgba(4, 27, 77, 0.05) 1px, transparent 1px);
background-size: 32px 32px;
```

Rules:

- opacity should stay under 8%
- grid should not reduce text readability
- use behind diagrams or hero visuals, not every section

## Connected Nodes

Connected nodes should represent workflow or topology.

Use for:

- webhook routes
- event orchestration
- recovery workflows
- API execution chains
- auth session flows

Rules:

- nodes should align to a visible path
- use green for active or safe path
- use navy for neutral path
- use red/amber only for risk states
- avoid random constellation layouts

## Workflow Lines

Workflow lines should be thin and direct.

Recommended:

```text
1.5px line
rounded caps
small arrowheads when direction is not obvious
green highlight only for active segment
```

## Soft Background Washes

Use soft mint and pale green as calm section backgrounds.

Recommended:

```css
background: linear-gradient(180deg, #FFFFFF 0%, #F0FAF3 100%);
```

Do not use heavy green backgrounds for long text sections.

## Code/API Patterns

API patterns should look like useful interface examples.

Use:

- endpoint cards
- request/response panels
- command blocks
- event payload snippets

Avoid fake code that does not map to real product behavior.

## Dashboard Preview Patterns

Dashboard previews should show realistic operational surfaces:

- release gate card
- confidence score
- blocker list
- workflow badges
- report table
- event timeline

Do not show unreadable tiny fake dashboards.

## Pattern Density

Pattern density should be low.

Recommended:

- one primary pattern per section
- no more than two pattern styles per page
- plenty of whitespace around diagrams
- no pattern behind dense paragraphs

## Motion Guidance

Patterns should be motion-ready but not motion-dependent.

Future motion examples:

- event pulse through route
- active node glow
- progress line along workflow
- status change from pending to complete

Motion should be subtle and operational.

## Do Not Use

Avoid:

- gradient orbs
- bokeh blobs
- crypto mesh networks
- random star fields
- isometric server farms
- cartoon mascots
- heavy glassmorphism

## Reusable Pattern Examples

### API Intake Pattern

```text
[External Tool] -- [Intake] -- [Dry Run] -- [Execution] -- [Report]
```

### Recovery Pattern

```text
[Failure] -- [Retry] -- [Fallback] -- [Owner Review] -- [Recovered]
```

### Event Pattern

```text
[Event] -- [Route] -- [Handler] -- [Retry Queue] -- [Audit]
```

### Dashboard Pattern

```text
[Decision Card]
[Blockers] [Evidence Needs]
[Timeline] [Reports]
```
