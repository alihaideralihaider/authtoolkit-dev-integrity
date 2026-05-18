# saana-sms-compliance-review

## Purpose
Review SMS, WhatsApp, IVR, consent, STOP/HELP, A2P, and customer messaging behavior.

## When to run
- SMS or WhatsApp copy changed.
- Twilio integration changed.
- Consent or opt-out flow changed.
- Missed-call recovery flow changed.

## Inputs
- Changed messaging files
- Message templates
- Consent flow evidence
- Provider configuration notes

## Checklist
- Consent is captured before non-transactional messaging.
- STOP/HELP handling is documented.
- Marketing copy is clearly distinguished from transactional copy.
- Provider-specific requirements are reviewed.
- OTP transport helpers are not mistaken for app-authored marketing copy.

## Output format
- Findings by severity
- Message copy evidence
- Required compliance checks
- Follow-up actions

## Failure examples
- Marketing SMS lacks opt-out language.
- Missed-call recovery flow messages users without consent.
- STOP/HELP behavior is absent or unclear.

## Suggested fix format
Identify the message flow, update copy or consent handling, and rerun SMS compliance review.

