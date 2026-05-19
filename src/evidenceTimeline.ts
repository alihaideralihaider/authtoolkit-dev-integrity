import type { PrIntegrityResult } from "./prIntegrity.ts";
import type { ReleaseReadinessResult } from "./releaseReadiness.ts";
import type { RuntimeIntegrityResult } from "./runtimeIntegrity.ts";
import type { DiffAwareIntegrityResult } from "./diffAwareIntegrity.ts";
import type { ReviewPack } from "./reviewSelector.ts";
import type { RiskCombination } from "./riskCombinationDetector.ts";
import type { Severity } from "./riskClassifier.ts";

export type EvidenceTimelineInput = {
  generatedAt: string;
  repoPath: string;
  selectedSkill: string;
  changedFilesCount: number;
  riskCategories: string[];
  highestSeverity: Severity;
  confidenceScore: number;
  suggestedReviewPacks: ReviewPack[];
  riskCombinations: RiskCombination[];
  prIntegrity: PrIntegrityResult;
  releaseReadiness: ReleaseReadinessResult;
  runtimeIntegrity: RuntimeIntegrityResult;
  criticalWarnings: string[];
  unknownRiskWarnings: string[];
  detectedEnvVarNames: string[];
  diffAwareIntegrity: DiffAwareIntegrityResult;
};

export type EvidenceTimeline = {
  timelineId: string;
  generatedAt: string;
  repoPath: string;
  reviewSummary: {
    selectedSkill: string;
    changedFilesCount: number;
    riskCategories: string[];
    selectedReviewPacks: ReviewPack[];
  };
  integritySnapshot: {
    highestSeverity: Severity;
    mergeReadiness: string;
    releaseDecision: string;
    runtimePosture: string;
    confidenceScore: number;
  };
  postureSnapshot: {
    approvalRisk: string;
    releaseRisk: string;
    runtimeRisk: string;
  };
  evidenceItems: {
    selectedReviewPacks: ReviewPack[];
    riskCombinations: string[];
    diffFindings: string[];
    criticalWarnings: string[];
    rollbackTriggers: string[];
    canaryRecommendations: string[];
    ownerAttentionItems: string[];
  };
  unresolvedRisks: string[];
  unresolvedWarnings: string[];
  auditNotes: string[];
};

function safeIdPart(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function unique(values: string[]): string[] {
  return [...new Set(values)].sort();
}

function buildUnresolvedRisks(input: EvidenceTimelineInput): string[] {
  const risks: string[] = [];

  for (const combination of input.riskCombinations) {
    if (combination.severity === "high" || combination.severity === "critical") {
      risks.push(`${combination.severity} risk combination: ${combination.name}`);
    }
  }

  if (input.releaseReadiness.releaseDecision === "caution") {
    risks.push("Release is in caution state.");
  }
  if (input.releaseReadiness.releaseDecision === "blocked") {
    risks.push("Release is blocked.");
  }
  if (input.runtimeIntegrity.runtimePosture === "degraded-risk") {
    risks.push("Runtime posture is degraded-risk.");
  }
  if (input.runtimeIntegrity.runtimePosture === "rollback-watch") {
    risks.push("Runtime posture is rollback-watch.");
  }
  for (const warning of input.unknownRiskWarnings) {
    risks.push(`Unknown risk warning: ${warning}`);
  }
  for (const finding of input.diffAwareIntegrity.diffFindings) {
    if (finding.severity === "high" || finding.severity === "critical") {
      risks.push(`${finding.severity} diff-aware finding: ${finding.findingName} in ${finding.filePath}`);
    }
  }

  return unique(risks);
}

function buildUnresolvedWarnings(input: EvidenceTimelineInput): string[] {
  return unique([
    ...input.prIntegrity.missingEvidence,
    ...input.releaseReadiness.missingReleaseEvidence,
    ...input.releaseReadiness.releaseWarnings,
    ...input.criticalWarnings.map((warning) => `Critical warning: ${warning}`),
    ...input.detectedEnvVarNames.map((name) => `Env var-like name detected: ${name}`),
    ...input.diffAwareIntegrity.diffFindings
      .filter((finding) => finding.severity === "low" || finding.severity === "medium")
      .map((finding) => `Diff-aware warning: ${finding.findingName} in ${finding.filePath}`),
  ]);
}

function buildAuditNotes(input: EvidenceTimelineInput): string[] {
  const notes: string[] = [];

  if (input.suggestedReviewPacks.includes("runtime-pack")) {
    notes.push("Runtime review required before next release.");
  }
  if (input.releaseReadiness.rollbackRequirements.length) {
    notes.push("Rollback path should be validated.");
  }
  if (input.prIntegrity.missingEvidence.length || input.releaseReadiness.missingReleaseEvidence.length) {
    notes.push("Review evidence remains incomplete.");
  }
  if (input.diffAwareIntegrity.diffFindings.length) {
    notes.push("Diff-aware review findings require human confirmation.");
  }
  if (input.suggestedReviewPacks.some((pack) =>
    ["security-pack", "payment-pack", "sms-compliance-pack", "vault-pack", "runtime-pack", "release-readiness-pack"].includes(pack)
  )) {
    notes.push("Sensitive review packs detected.");
  }
  if (!input.criticalWarnings.length && !input.riskCombinations.some((combination) => combination.severity === "critical")) {
    notes.push("No critical blockers detected.");
  }

  return unique(notes);
}

export function buildEvidenceTimeline(input: EvidenceTimelineInput): EvidenceTimeline {
  const timelineId = `timeline-${safeIdPart(input.selectedSkill)}-${input.generatedAt.replace(/[^0-9]/g, "").slice(0, 14)}`;

  return {
    timelineId,
    generatedAt: input.generatedAt,
    repoPath: input.repoPath,
    reviewSummary: {
      selectedSkill: input.selectedSkill,
      changedFilesCount: input.changedFilesCount,
      riskCategories: input.riskCategories,
      selectedReviewPacks: input.suggestedReviewPacks,
    },
    integritySnapshot: {
      highestSeverity: input.highestSeverity,
      mergeReadiness: input.prIntegrity.mergeReadiness,
      releaseDecision: input.releaseReadiness.releaseDecision,
      runtimePosture: input.runtimeIntegrity.runtimePosture,
      confidenceScore: input.confidenceScore,
    },
    postureSnapshot: {
      approvalRisk: input.prIntegrity.approvalRisk,
      releaseRisk: input.releaseReadiness.releaseRisk,
      runtimeRisk: input.runtimeIntegrity.runtimeRisk,
    },
    evidenceItems: {
      selectedReviewPacks: input.suggestedReviewPacks,
      riskCombinations: input.riskCombinations.map((combination) => combination.name),
      diffFindings: input.diffAwareIntegrity.diffFindings.map((finding) => finding.findingName),
      criticalWarnings: input.criticalWarnings,
      rollbackTriggers: input.runtimeIntegrity.rollbackTriggers,
      canaryRecommendations: input.releaseReadiness.canaryRecommendations,
      ownerAttentionItems: input.runtimeIntegrity.ownerAttentionItems,
    },
    unresolvedRisks: buildUnresolvedRisks(input),
    unresolvedWarnings: buildUnresolvedWarnings(input),
    auditNotes: buildAuditNotes(input),
  };
}
