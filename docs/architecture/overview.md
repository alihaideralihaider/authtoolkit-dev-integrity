# Architecture Overview

AuthToolkit Dev Integrity is organized around a small set of core modules.

## Core Modules

### Project Registry

Tracks projects, repository locations, stack metadata, ownership, environments, and enabled review packs.

### Repo Scanner

Builds a local map of files, routes, APIs, services, env vars, runtime bindings, docs, scripts, tests, and generated artifacts.

### Change Classifier

Classifies changed files by risk, domain, trust boundary, and required review packs.

### Review Orchestrator

Selects and orders the review skills required for a change.

### Skill Runner

Executes deterministic checks and structured review workflows for security, payments, SMS compliance, Vault readiness, runtime binding, UX, and deploy canary.

### Findings Engine

Normalizes findings by severity, category, confidence, evidence, affected files, and recommended next action.

### Fix Recommendation Engine

Creates safe, reviewable solution prompts for coding agents. AuthToolkit recommends, the coding agent executes, the user reviews the diff, and AuthToolkit verifies after rerun.

### Evidence Store

Stores local or hosted evidence records, review reports, snapshots, history, and audit timelines. Evidence must not contain secret values.

### Report Generator

Produces human-readable and machine-readable reports for developers, founders, agencies, and future dashboards.

### API Layer

Future API-first interface for project registration, scan submission, review routing, findings retrieval, report generation, and Control Room data.

