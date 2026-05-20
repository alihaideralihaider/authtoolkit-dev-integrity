# Plain English Summaries

## Purpose

Plain English summaries provide a short non-technical companion explanation for the top-level Integrity Control Room and Integrity Decision Summary outputs.

They help founders, operators, reviewers, and non-specialists quickly understand whether a change should stop, slow down, proceed carefully, or follow the normal review path.

## Not A Layman Engine

This is not a full layman explanation engine. It does not translate every finding, risk, file path, review pack, or awareness layer into general-audience language.

The detailed report remains technical. Plain English summaries only provide one short deterministic line near the top of the report.

## Template-Based Summaries

Plain English summaries are deterministic and template-based.

They are derived from existing structured fields:

- Control Room status: `green`, `yellow`, `orange`, `red`
- Integrity decision: `trusted`, `trusted-with-review`, `caution`, `high-risk`, `blocked`

They do not call external AI APIs. They do not generate free-form prose. They do not inspect private data.

## Where They Appear

The markdown report includes plain English lines under:

- `## Integrity Control Room Overview`
- `## Integrity Decision Summary`

Example Control Room summaries:

- red: Stop. This change has serious blockers or critical operational risk.
- orange: Slow down. This change needs escalation or targeted validation.
- yellow: Proceed carefully. Required evidence or review is still needed.
- green: Normal review path. No major operational blocker was detected.

Example decision summaries:

- blocked: This change should not move forward yet. Important blockers or missing evidence must be resolved first.
- high-risk: This change may affect important systems and needs senior human review before merge or release.
- caution: This change may be safe, but only after the required review and evidence are completed.
- trusted-with-review: This change can likely move forward after targeted review.
- trusted: This change appears safe to move through the normal review process.

## Limitations

- Plain English summaries are intentionally shallow.
- They do not replace the technical report.
- They do not explain every risk driver.
- They do not make approval decisions.
- They do not reduce required review or evidence.
- They do not turn high-risk work into low-risk work.

The goal is readability at the top of the report, not simplification of the underlying workflow.
