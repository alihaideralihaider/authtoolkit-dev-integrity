import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { OperationalTimelineSummary } from "./operationalTimelineSummary.ts";
import { updateOperationalTimelineSummary } from "./operationalTimelineSummary.ts";
import { updateReportCatalog } from "./reportCatalog.ts";
import type { ReviewResult } from "./reviewRunner.ts";

function repoRoot(): string {
  return path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
}

function list(values: string[]): string {
  if (!values.length) return "- none";
  return values.map((value) => `- ${value}`).join("\n");
}

function changedFileList(result: ReviewResult): string {
  if (!result.changedFiles.length) return "- none";

  return result.changedFiles
    .map((file) => `- ${file.path} (${file.status}) - severity: ${file.severity} - risks: ${file.riskCategories.join(", ")} - reason: ${file.severityReason}`)
    .join("\n");
}

function riskCombinationList(result: ReviewResult): string {
  if (!result.riskCombinations.length) return "- none";

  return result.riskCombinations
    .map((combination) => [
      `- ${combination.name}`,
      `  - severity: ${combination.severity}`,
      `  - reason: ${combination.reason}`,
      `  - matched files: ${combination.matchedFiles.join(", ")}`,
      `  - suggested packs: ${combination.suggestedReviewPacks.join(", ")}`,
      `  - suggested next action: ${combination.suggestedNextAction}`,
    ].join("\n"))
    .join("\n");
}

function diffFindingList(result: ReviewResult): string {
  if (!result.diffAwareIntegrity.diffFindings.length) return "- none";

  return result.diffAwareIntegrity.diffFindings
    .map((finding) => [
      `- ${finding.findingName}`,
      `  - severity: ${finding.severity}`,
      `  - file path: ${finding.filePath}`,
      `  - reason: ${finding.reason}`,
      `  - signal type: ${finding.signalType}`,
      `  - suggested packs: ${finding.suggestedReviewPacks.join(", ")}`,
      `  - safe evidence summary: ${finding.safeEvidenceSummary}`,
      `  - suggested next action: ${finding.suggestedNextAction}`,
    ].join("\n"))
    .join("\n");
}

function triggeredPolicyList(result: ReviewResult): string {
  if (!result.policyAwareIntegrity.triggeredPolicies.length) return "- none";

  return result.policyAwareIntegrity.triggeredPolicies
    .map((policy) => [
      `- ${policy.name}`,
      `  - result: ${policy.result}`,
      `  - reason: ${policy.reason}`,
    ].join("\n"))
    .join("\n");
}

function prContextList(values: string[]): string {
  return list(values);
}

function safeFileName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function buildReport(result: ReviewResult, timelinePath: string, operationalTimelineSummary: OperationalTimelineSummary): string {
  return `# AuthToolkit Dev Integrity Report

## Summary

- Project path: ${result.repoPath}
- Selected skill: ${result.selectedSkill}
- Skill file: ${result.skillPath}
- Timestamp: ${result.timestamp}
- Changed files count: ${result.changedFiles.length}
- Highest severity: ${result.highestSeverity}
- Confidence score: ${result.confidenceScore}
- Detected env var-like names count: ${result.detectedEnvVarNames.length}

## Integrity Control Room Overview

- Control room status: ${result.controlRoomOverview.controlRoomStatus}
- Plain English: ${result.controlRoomOverview.plainEnglishSummary}
- Executive summary: ${result.controlRoomOverview.executiveSummary}
- Recommended action: ${result.controlRoomOverview.recommendedControlRoomAction}

### Decision Snapshot

${list(result.controlRoomOverview.decisionSnapshot)}

### Awareness Snapshot

${list(result.controlRoomOverview.awarenessSnapshot)}

### Risk Snapshot

${list(result.controlRoomOverview.riskSnapshot)}

### Required Actions

${list(result.controlRoomOverview.requiredActions)}

### Human Attention Areas

${list(result.controlRoomOverview.humanAttentionAreas)}

### Drift Snapshot

${list(result.controlRoomOverview.driftSnapshot)}

### Control Room Warnings

${list(result.controlRoomOverview.controlRoomWarnings)}

## Workflow Routing Summary

- Workflow priority: ${result.workflowRoutingSummary.workflowPriority}
- Recommended workflow path: ${result.workflowRoutingSummary.recommendedWorkflowPath}

### Active Workflows

${list(result.workflowRoutingSummary.activeWorkflows)}

### Workflow Reasons

${list(result.workflowRoutingSummary.workflowReasons)}

### Workflow Owners

${list(result.workflowRoutingSummary.workflowOwners)}

### Workflow Evidence Needs

${list(result.workflowRoutingSummary.workflowEvidenceNeeds)}

### Next Workflow Actions

${list(result.workflowRoutingSummary.nextWorkflowActions)}

### Workflow Warnings

${list(result.workflowRoutingSummary.workflowWarnings)}

## Release Workflow Plan

- Status: ${result.releaseWorkflowPlan.releaseWorkflowStatus}
- Recommended release path: ${result.releaseWorkflowPlan.recommendedReleasePath}

### Pre-Release Checklist

${list(result.releaseWorkflowPlan.preReleaseChecklist)}

### Release Execution Checklist

${list(result.releaseWorkflowPlan.releaseExecutionChecklist)}

### Post-Release Watch Checklist

${list(result.releaseWorkflowPlan.postReleaseWatchChecklist)}

### Rollback Readiness Checklist

${list(result.releaseWorkflowPlan.rollbackReadinessChecklist)}

### Required Release Evidence

${list(result.releaseWorkflowPlan.requiredReleaseEvidence)}

### Release Owner Attention

${list(result.releaseWorkflowPlan.releaseOwnerAttention)}

## Operational Timeline Summary

- Recent trend: ${operationalTimelineSummary.recentTrendSummary}
- Confidence trend: ${operationalTimelineSummary.confidenceTrend}
- Control room trend: ${operationalTimelineSummary.controlRoomTrend}
- Operational decision trend: ${operationalTimelineSummary.operationalDecisionTrend}
- Drift trend: ${operationalTimelineSummary.driftTrendSummary}
- Recommended operational focus: ${operationalTimelineSummary.recommendedOperationalFocus}

### Repeated Risk Drivers

${list(operationalTimelineSummary.repeatedRiskDrivers)}

### Repeated Workflow Patterns

${list(operationalTimelineSummary.repeatedWorkflowPatterns)}

### Repeated Blocking Factors

${list(operationalTimelineSummary.repeatedBlockingFactors)}

## Integrity Decision Summary

- Overall integrity decision: ${result.integrityDecisionSummary.overallIntegrityDecision}
- Operational trust level: ${result.integrityDecisionSummary.operationalTrustLevel}
- Plain English: ${result.integrityDecisionSummary.plainEnglishSummary}
- Release trust summary: ${result.integrityDecisionSummary.releaseTrustSummary}
- Recovery trust summary: ${result.integrityDecisionSummary.recoveryTrustSummary}
- Recommended operational decision: ${result.integrityDecisionSummary.recommendedOperationalDecision}

### Primary Risk Drivers

${list(result.integrityDecisionSummary.primaryRiskDrivers)}

### Blocking Factors

${list(result.integrityDecisionSummary.blockingFactors)}

### Required Next Actions

${list(result.integrityDecisionSummary.requiredNextActions)}

### Required Human Attention

${list(result.integrityDecisionSummary.requiredHumanAttention)}

## Git Status Summary

\`\`\`text
${result.gitStatus || "clean"}
\`\`\`

## Git Context

- Current branch: ${result.gitContext.currentBranch}
- Base branch: ${result.gitContext.baseBranch}
- Current commit: ${result.gitContext.currentCommit}
- Merge base: ${result.gitContext.mergeBase}
- Commit range: ${result.gitContext.commitRange}
- Ahead/behind summary: ${result.gitContext.aheadBehindSummary}
- Working tree state: ${result.gitContext.workingTreeState}

### Commits In Range

${list(result.gitContext.commitsInRange)}

### Git Context Warnings

${list(result.gitContext.gitContextWarnings)}

## PR Context

- PR title suggestion: ${result.prContext.prTitleSuggestion}
- PR readiness label: ${result.prContext.prReadinessLabel}
- PR summary: ${result.prContext.prSummary}

### Change Scope

${prContextList(result.prContext.prChangeScope)}

### Risk Summary

${prContextList(result.prContext.prRiskSummary)}

### Review Focus

${prContextList(result.prContext.prReviewFocus)}

### Required Evidence

${prContextList(result.prContext.prRequiredEvidence)}

### Recommended Reviewer Types

${prContextList(result.prContext.prRecommendedReviewerTypes)}

## Git Diff Name-Only

\`\`\`text
${result.diffNameOnly || "none"}
\`\`\`

## Changed Files

${changedFileList(result)}

## Detected Risk Categories

${list(result.riskCategories)}

## Risk Combinations

${riskCombinationList(result)}

## Diff-Aware Integrity

- Confidence impact cap: ${result.diffAwareIntegrity.diffConfidenceImpact.cap ?? "none"}
- Confidence impact reason: ${result.diffAwareIntegrity.diffConfidenceImpact.reason}

### Diff Findings

${diffFindingList(result)}

### Diff Risk Signals

${list(result.diffAwareIntegrity.diffRiskSignals)}

### Diff Sensitive Changes

${list(result.diffAwareIntegrity.diffSensitiveChanges)}

### Diff Review Notes

${list(result.diffAwareIntegrity.diffReviewNotes)}

## Build-Aware Integrity

- Build posture: ${result.buildAwareIntegrity.buildPosture}
- Build risk: ${result.buildAwareIntegrity.buildRisk}
- Failed stage: ${result.buildAwareIntegrity.failedStage}
- Likely failure area: ${result.buildAwareIntegrity.likelyFailureArea}
- Build summary path: ${result.buildAwareIntegrity.buildSummaryPath || "none"}
- Release impact: ${result.buildAwareIntegrity.releaseImpact}
- Recommended build action: ${result.buildAwareIntegrity.recommendedBuildAction}

### Affected Review Packs

${list(result.buildAwareIntegrity.affectedReviewPacks)}

### Build Evidence Requirements

${list(result.buildAwareIntegrity.buildEvidenceRequirements)}

## CI/CD Context

- Provider: ${result.cicdContext.cicdProvider}
- Pipeline name: ${result.cicdContext.pipelineName}
- Run ID: ${result.cicdContext.pipelineRunId}
- Status: ${result.cicdContext.pipelineStatus}
- Failed stage: ${result.cicdContext.failedStage}
- Deployment target: ${result.cicdContext.deploymentTarget}
- Environment: ${result.cicdContext.environment}
- Duration: ${result.cicdContext.durationSummary}
- Rerun status: ${result.cicdContext.rerunStatus}
- Trust summary: ${result.cicdContext.cicdTrustSummary}

### Failed Jobs

${list(result.cicdContext.failedJobs)}

### Safe Artifact Refs

${list(result.cicdContext.safeArtifactRefs)}

### CI/CD Warnings

${list(result.cicdContext.cicdWarnings)}

## Architecture-Aware Integrity

- Blast radius: ${result.architectureAwareIntegrity.blastRadius}
- Recommended architecture action: ${result.architectureAwareIntegrity.recommendedArchitectureAction}

### Affected Systems

${list(result.architectureAwareIntegrity.affectedSystems)}

### Affected Boundaries

${list(result.architectureAwareIntegrity.affectedBoundaries)}

### Dependency Signals

${list(result.architectureAwareIntegrity.dependencySignals)}

### Architecture Warnings

${list(result.architectureAwareIntegrity.architectureWarnings)}

### Architecture Review Notes

${list(result.architectureAwareIntegrity.architectureReviewNotes)}

## Policy-Aware Integrity

- Policy posture: ${result.policyAwareIntegrity.policyPosture}
- Recommended policy action: ${result.policyAwareIntegrity.recommendedPolicyAction}

### Triggered Policies

${triggeredPolicyList(result)}

### Policy Violations

${list(result.policyAwareIntegrity.policyViolations)}

### Policy Escalations

${list(result.policyAwareIntegrity.policyEscalations)}

### Required Approvals

${list(result.policyAwareIntegrity.requiredApprovals)}

### Governance Warnings

${list(result.policyAwareIntegrity.governanceWarnings)}

### Policy Review Notes

${list(result.policyAwareIntegrity.policyReviewNotes)}

## Evidence-Aware Integrity

- Evidence posture: ${result.evidenceAwareIntegrity.evidencePosture}
- Recommended evidence action: ${result.evidenceAwareIntegrity.recommendedEvidenceAction}

### Evidence Strengths

${list(result.evidenceAwareIntegrity.evidenceStrengths)}

### Evidence Gaps

${list(result.evidenceAwareIntegrity.evidenceGaps)}

### Evidence Required Before Merge

${list(result.evidenceAwareIntegrity.evidenceRequiredBeforeMerge)}

### Evidence Required Before Release

${list(result.evidenceAwareIntegrity.evidenceRequiredBeforeRelease)}

### Evidence Required After Release

${list(result.evidenceAwareIntegrity.evidenceRequiredAfterRelease)}

### Evidence Required For Policy

${list(result.evidenceAwareIntegrity.evidenceRequiredForPolicy)}

### Evidence Warnings

${list(result.evidenceAwareIntegrity.evidenceWarnings)}

## Agent-Aware Integrity

- Agent risk posture: ${result.agentAwareIntegrity.agentRiskPosture}
- Recommended agent action: ${result.agentAwareIntegrity.recommendedAgentAction}

### Authorship Signals

${list(result.agentAwareIntegrity.authorshipSignals)}

### Automation Signals

${list(result.agentAwareIntegrity.automationSignals)}

### Agent Review Requirements

${list(result.agentAwareIntegrity.agentReviewRequirements)}

### Agent Trust Warnings

${list(result.agentAwareIntegrity.agentTrustWarnings)}

### Agent Boundary Warnings

${list(result.agentAwareIntegrity.agentBoundaryWarnings)}

## Recovery-Aware Integrity

- Recovery posture: ${result.recoveryAwareIntegrity.recoveryPosture}
- Rollback complexity: ${result.recoveryAwareIntegrity.rollbackComplexity}
- Recovery risk: ${result.recoveryAwareIntegrity.recoveryRisk}
- Rollback feasibility: ${result.recoveryAwareIntegrity.rollbackFeasibility}
- Operator recovery burden: ${result.recoveryAwareIntegrity.operatorRecoveryBurden}
- Recommended recovery action: ${result.recoveryAwareIntegrity.recommendedRecoveryAction}

### Recovery Dependencies

${list(result.recoveryAwareIntegrity.recoveryDependencies)}

### Recovery Warnings

${list(result.recoveryAwareIntegrity.recoveryWarnings)}

## Impact-Aware Integrity

- Overall impact: ${result.impactAwareIntegrity.overallImpact}
- Customer impact: ${result.impactAwareIntegrity.customerImpact}
- Admin impact: ${result.impactAwareIntegrity.adminImpact}
- Payment impact: ${result.impactAwareIntegrity.paymentImpact}
- Runtime impact: ${result.impactAwareIntegrity.runtimeImpact}
- Data impact: ${result.impactAwareIntegrity.dataImpact}
- Compliance impact: ${result.impactAwareIntegrity.complianceImpact}
- Owner/operator impact: ${result.impactAwareIntegrity.ownerOperatorImpact}
- Recommended impact action: ${result.impactAwareIntegrity.recommendedImpactAction}

### Impact Warnings

${list(result.impactAwareIntegrity.impactWarnings)}

## Posture-Aware Integrity

- Integrity trend: ${result.postureAwareIntegrity.integrityTrend}
- Previous timeline ID: ${result.postureAwareIntegrity.previousTimelineId || "none"}
- Previous timeline path: ${result.postureAwareIntegrity.previousTimelinePath || "none"}
- Posture summary: ${result.postureAwareIntegrity.postureSummary}
- Recommended posture action: ${result.postureAwareIntegrity.recommendedPostureAction}

### Posture Transitions

${list(result.postureAwareIntegrity.postureTransitions)}

### Layer-Specific Drift

- Build drift: ${result.postureAwareIntegrity.buildDrift}
- Runtime drift: ${result.postureAwareIntegrity.runtimeDrift}
- Architecture drift: ${result.postureAwareIntegrity.architectureDrift}
- Policy drift: ${result.postureAwareIntegrity.policyDrift}
- Evidence drift: ${result.postureAwareIntegrity.evidenceDrift}
- Agent drift: ${result.postureAwareIntegrity.agentDrift}
- Recovery drift: ${result.postureAwareIntegrity.recoveryDrift}

### Degradation Signals

${list(result.postureAwareIntegrity.degradationSignals)}

### Stabilization Signals

${list(result.postureAwareIntegrity.stabilizationSignals)}

### Recovery Signals

${list(result.postureAwareIntegrity.recoverySignals)}

### Escalation Warnings

${list(result.postureAwareIntegrity.escalationWarnings)}

## PR Integrity

- Merge readiness: ${result.prIntegrity.mergeReadiness}
- Approval risk: ${result.prIntegrity.approvalRisk}
- Recommended decision: ${result.prIntegrity.recommendedDecision}

### Required Review Packs

${list(result.prIntegrity.requiredReviewPacks)}

### Blocking Reasons

${list(result.prIntegrity.blockingReasons)}

### Missing Evidence

${list(result.prIntegrity.missingEvidence)}

### Reviewer Checklist

${list(result.prIntegrity.reviewerChecklist)}

## Release Readiness

- Release decision: ${result.releaseReadiness.releaseDecision}
- Release risk: ${result.releaseReadiness.releaseRisk}
- Recommended release action: ${result.releaseReadiness.recommendedReleaseAction}

### Required Release Checks

${list(result.releaseReadiness.requiredReleaseChecks)}

### Missing Release Evidence

${list(result.releaseReadiness.missingReleaseEvidence)}

### Rollback Requirements

${list(result.releaseReadiness.rollbackRequirements)}

### Canary Recommendations

${list(result.releaseReadiness.canaryRecommendations)}

### Release Warnings

${list(result.releaseReadiness.releaseWarnings)}

## Runtime Integrity

- Runtime posture: ${result.runtimeIntegrity.runtimePosture}
- Runtime risk: ${result.runtimeIntegrity.runtimeRisk}
- Recommended runtime action: ${result.runtimeIntegrity.recommendedRuntimeAction}

### Runtime Signals To Watch

${list(result.runtimeIntegrity.runtimeSignalsToWatch)}

### Drift Indicators

${list(result.runtimeIntegrity.driftIndicators)}

### Rollback Triggers

${list(result.runtimeIntegrity.rollbackTriggers)}

### Owner Attention Items

${list(result.runtimeIntegrity.ownerAttentionItems)}

## Evidence Timeline

- Timeline ID: ${result.evidenceTimeline.timelineId}
- Timeline JSON: ${timelinePath}

### Integrity Snapshot

- Highest severity: ${result.evidenceTimeline.integritySnapshot.highestSeverity}
- Merge readiness: ${result.evidenceTimeline.integritySnapshot.mergeReadiness}
- Release decision: ${result.evidenceTimeline.integritySnapshot.releaseDecision}
- Runtime posture: ${result.evidenceTimeline.integritySnapshot.runtimePosture}
- Confidence score: ${result.evidenceTimeline.integritySnapshot.confidenceScore}

### Posture Snapshot

- Approval risk: ${result.evidenceTimeline.postureSnapshot.approvalRisk}
- Release risk: ${result.evidenceTimeline.postureSnapshot.releaseRisk}
- Runtime risk: ${result.evidenceTimeline.postureSnapshot.runtimeRisk}

### Unresolved Risks

${list(result.evidenceTimeline.unresolvedRisks)}

### Unresolved Warnings

${list(result.evidenceTimeline.unresolvedWarnings)}

### Audit Notes

${list(result.evidenceTimeline.auditNotes)}

## Suggested Reviews

${list(result.suggestedReviews)}

## Suggested Review Packs

${list(result.suggestedReviewPacks)}

## Confidence Notes

${list(result.confidenceNotes)}

## Critical Warnings

${list(result.criticalWarnings)}

## Unknown-Risk Warnings

${list(result.unknownRiskWarnings)}

## Detected Env Var-Like Names

${list(result.detectedEnvVarNames)}

## Safety Notes

${list(result.safetyNotes)}

## Next Actions

${list(result.nextActions)}
`;
}

export function writeReport(result: ReviewResult): string {
  const reportsDir = path.join(repoRoot(), "reports");
  const timelineDir = path.join(reportsDir, "timeline");
  mkdirSync(reportsDir, { recursive: true });
  mkdirSync(timelineDir, { recursive: true });

  const timestampSlug = new Date().toISOString().replace(/[:.]/g, "-");
  const reportName = `${timestampSlug}-${safeFileName(result.selectedSkill)}.md`;
  const timelineName = `${timestampSlug}-${result.evidenceTimeline.timelineId}.json`;
  const reportPath = path.join(reportsDir, reportName);
  const timelinePath = path.join(timelineDir, timelineName);
  const relativeTimelinePath = path.relative(repoRoot(), timelinePath);

  writeFileSync(timelinePath, JSON.stringify(result.evidenceTimeline, null, 2));
  updateReportCatalog({ result, reportPath, timelinePath, repoRoot: repoRoot() });
  const operationalTimelineSummary = updateOperationalTimelineSummary(repoRoot());
  writeFileSync(reportPath, buildReport(result, relativeTimelinePath, operationalTimelineSummary));

  return reportPath;
}
