# Illustration System

AuthToolkit illustrations should explain infrastructure. They should look like diagrams a developer, operator, or engineering lead can trust.

## Illustration Goals

Use illustrations to show:

- workflows
- API orchestration
- event routing
- authentication flows
- payment and recovery paths
- webhook delivery
- agent review loops
- release gates
- dashboard evidence

Do not use illustrations as random decoration.

## Style

Core style:

- thin line
- rounded corners
- minimal shapes
- structured grids
- soft green highlights
- navy labels
- pale mint backgrounds
- motion-ready paths
- limited depth

Line weight:

- standard diagram line: 1.5px
- emphasis line: 2px
- icon line: 1.75px

Corner radius:

- node cards: 8-12px
- small chips: 999px
- container frames: 12-16px

## Workflow Diagrams

Workflow diagrams should have a clear direction:

```text
Input -> Processing -> Decision -> Artifact -> Human Review
```

Use arrows sparingly. Connected lines with small arrowheads are preferred over large decorative arrows.

Node labels should be short:

- Intake
- Dry Run
- Execute
- Report
- Dashboard
- Review

## Infrastructure Illustrations

Infrastructure visuals should use real system concepts:

- API gateway
- event queue
- webhook endpoint
- auth session
- recovery job
- payment retry
- release gate
- audit log
- dashboard panel

Use simple boxes and connectors. Avoid literal server racks unless the page needs them.

## API Orchestration Visuals

Show API flows as request/response cards:

```text
POST /review/intake
  -> validated request
  -> recommended command
  -> expected artifacts
```

Use monospace sparingly. It should support comprehension, not dominate the visual.

## Payment And Recovery Flow Graphics

Payment/recovery visuals should feel reliable and audit-friendly.

Recommended flow:

```text
Failed charge -> Retry policy -> Customer action -> Recovery event -> Revenue restored
```

Use green only for recovered or safe states. Use muted amber or red for warning/failure states.

## Event-Driven System Diagrams

Event diagrams should show:

- producer
- event
- route
- handler
- status
- retry/recovery

Example:

```text
Checkout event -> Webhook route -> Handler -> Retry queue -> Recovery log
```

Use dotted lines for optional paths and solid lines for primary execution paths.

## Line-Based Icons

Icon standards:

- use outline icons
- use rounded line caps
- use consistent stroke
- avoid filled pictograms unless used as status dots
- keep icons understandable at 16px and 24px

Icon themes:

- key/auth
- workflow
- shield
- API brackets
- recovery loop
- webhook
- event node
- payment
- dashboard
- document/report

## Connected Node Patterns

Connected node patterns can be used as background or section support, but they must remain subtle.

Rules:

- opacity below 12%
- no dense spiderwebs
- no random constellations
- nodes should imply flow or system topology

## Motion Readiness

Illustrations may later animate.

Design diagrams so motion can be added through:

- pulsing active node
- progress along a path
- status change on a card
- event moving through a route
- retry loop animation

Do not rely on animation to explain the core meaning.

## Do Not Use

Avoid:

- cartoon robots
- futuristic neon agents
- crypto-style isometric networks
- generic cloud blobs
- oversized abstract gradients
- decorative 3D shapes
- mascots

## Markdown Visual Examples

### API Intake

```text
GitHub / CLI / Agent
        |
        v
API Intake Request
        |
        v
Dry Run -> Recommended Command
        |
        v
Controlled Local Review
        |
        v
Reports + Dashboard
```

### Recovery

```text
Failure Detected -> Recovery Evidence -> Owner Confirmation -> Safe Release
```

### Webhook

```text
Event Source -> Webhook Route -> Handler -> Retry Queue -> Audit Trail
```
