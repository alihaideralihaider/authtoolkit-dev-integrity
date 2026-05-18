# AuthToolkit Dev Integrity

AuthToolkit Dev Integrity is an AI-assisted engineering integrity system for teams building and maintaining software with human developers, coding agents, and automation.

It helps projects understand what changed, what risk was introduced, what reviews are required, what evidence was produced, and whether a change is ready to ship.

## Core Loop

AuthToolkit Dev Integrity follows a practical engineering loop:

1. Plan
2. Git Review
3. Implement
4. Test
5. Integrity Review
6. Security Review
7. Deploy Check
8. Report

The system is designed to make AI-assisted development safer by pairing fast implementation with structured review, deterministic checks, evidence capture, and clear confidence scoring.

## Product Direction

This repository is the standalone foundation for the Dev Integrity Agent, Integrity Engine, and Control Room platform. It is documentation-first today and intended to become API-first product infrastructure that can support SaanaOS, Kepler, AuthToolkit, and future projects.

## Principles

- Do not rely on memory for critical engineering decisions.
- Treat code integrity, secret integrity, runtime integrity, deploy integrity, and recovery integrity as one system.
- Prefer local-first evidence and deterministic review where possible.
- Never store real secrets in Git.
- Make findings actionable, reviewable, and auditable.

