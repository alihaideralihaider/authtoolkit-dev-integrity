import type { ArchitectureAwareIntegrityResult } from "./architectureAwareIntegrity.ts";
import type { EvidenceTimeline } from "./evidenceTimeline.ts";
import type { PolicyAwareIntegrityResult } from "./policyAwareIntegrity.ts";
import type { PostureAwareIntegrityResult } from "./postureAwareIntegrity.ts";
import type { PrIntegrityResult } from "./prIntegrity.ts";
import type { ReleaseReadinessResult } from "./releaseReadiness.ts";
import type { RuntimeIntegrityResult } from "./runtimeIntegrity.ts";
import type { BuildAwareIntegrityResult } from "./buildAwareIntegrity.ts";

export type EvidencePosture =
  | "sufficient"
  | "partial"
  | "weak"
  | "missing"
  | "blocking-gap";

export type EvidenceAwareIntegrityInput = {
  prIntegrity: PrIntegrityResult;
  releaseReadiness: ReleaseReadinessResult;
  runtimeIntegrity: RuntimeIntegrityResult;
  evidenceTimeline: EvidenceTimeline;
  postureAwareIntegrity: PostureAwareIntegrityResult;
  architectureAwareIntegrity: ArchitectureAwareIntegrityResult;
  policyAwareIntegrity: PolicyAwareIntegrityResult;
  buildAwareIntegrity: BuildAwareIntegrityResult;
};

export type EvidenceAwareIntegrityResult = {
  evidencePosture: EvidencePosture;
  evidenceGaps: string[];
  evidenceStrengths: string[];
  evidenceRequiredBeforeMerge: string[];
  evidenceRequiredBeforeRelease: string[];
  evidenceRequiredAfterRelease: string[];
  evidenceRequiredForPolicy: string[];
  evidenceWarnings: string[];
  recommendedEvidenceAction: string;
};

function unique(values: string[]): string[] {
  return [...new Set(values)].sort();
}

function baselineStrengths(input: EvidenceAwareIntegrityInput): string[] {
  const strengths = [
    "Integrity report generated.",
    "Evidence timeline generated.",
    "Deterministic rules applied.",
    "No raw secret values stored.",
    "Local audit snapshot preserved.",
  ];

  if (input.evidenceTimeline.timelineId) {
    strengths.push(`Timeline snapshot recorded: ${input.evidenceTimeline.timelineId}.`);
  }

  return strengths;
}

function evidenceGaps(input: EvidenceAwareIntegrityInput): string[] {
  return unique([
    ...input.prIntegrity.missingEvidence.map((item) => `PR evidence gap: ${item}`),
    ...input.releaseReadiness.missingReleaseEvidence.map((item) => `Release evidence gap: ${item}`),
    ...input.runtimeIntegrity.ownerAttentionItems.map((item) => `Runtime evidence item: ${item}`),
    ...input.policyAwareIntegrity.requiredApprovals.map((item) => `Required approval missing until attached: ${item}`),
    ...input.policyAwareIntegrity.policyViolations.map((item) => `Policy evidence gap: ${item}`),
    ...input.architectureAwareIntegrity.architectureWarnings.map((item) => `Architecture evidence gap: ${item}`),
    ...input.buildAwareIntegrity.buildEvidenceRequirements.map((item) => `Build evidence gap: ${item}`),
  ]);
}

function beforeMerge(input: EvidenceAwareIntegrityInput): string[] {
  return unique([
    ...input.prIntegrity.missingEvidence,
    ...input.buildAwareIntegrity.buildEvidenceRequirements,
    ...input.policyAwareIntegrity.requiredApprovals
      .filter((approval) => ["security review", "payment review", "runtime review", "architecture review", "owner approval"].includes(approval))
      .map((approval) => `Attach ${approval} evidence before merge.`),
    ...input.architectureAwareIntegrity.architectureWarnings.map((warning) => `Address architecture warning before merge: ${warning}`),
  ]);
}

function beforeRelease(input: EvidenceAwareIntegrityInput): string[] {
  return unique([
    ...input.releaseReadiness.missingReleaseEvidence,
    ...input.buildAwareIntegrity.buildEvidenceRequirements,
    ...input.releaseReadiness.requiredReleaseChecks.map((check) => `Attach release check evidence: ${check}`),
    ...input.policyAwareIntegrity.requiredApprovals
      .filter((approval) => ["release review", "rollback approval", "owner approval"].includes(approval))
      .map((approval) => `Attach ${approval} evidence before release.`),
  ]);
}

function afterRelease(input: EvidenceAwareIntegrityInput): string[] {
  return unique([
    ...input.runtimeIntegrity.ownerAttentionItems,
    ...input.runtimeIntegrity.runtimeSignalsToWatch.map((signal) => `Capture runtime watch evidence for: ${signal}`),
    ...input.runtimeIntegrity.rollbackTriggers.map((trigger) => `Document rollback decision if observed: ${trigger}`),
  ]);
}

function forPolicy(input: EvidenceAwareIntegrityInput): string[] {
  return unique([
    ...input.policyAwareIntegrity.requiredApprovals.map((approval) => `Attach required approval: ${approval}`),
    ...input.policyAwareIntegrity.policyViolations.map((violation) => `Resolve or explicitly review policy violation: ${violation}`),
    ...input.policyAwareIntegrity.policyEscalations.map((escalation) => `Document policy escalation: ${escalation}`),
    ...input.policyAwareIntegrity.governanceWarnings.map((warning) => `Address governance warning: ${warning}`),
  ]);
}

function evidenceWarnings(input: EvidenceAwareIntegrityInput, gaps: string[]): string[] {
  const warnings: string[] = [];

  if (gaps.length) {
    warnings.push("Generated reports are baseline evidence only; reviewer, test, release, and approval evidence may still be missing.");
  }
  if (input.policyAwareIntegrity.policyPosture === "policy-blocked") {
    warnings.push("Policy posture is blocked; evidence gap blocks progress.");
  }
  if (input.releaseReadiness.releaseDecision === "blocked") {
    warnings.push("Release is blocked; release evidence is insufficient.");
  }
  if (input.prIntegrity.mergeReadiness === "blocked") {
    warnings.push("PR is blocked; merge evidence is insufficient.");
  }
  if (input.architectureAwareIntegrity.blastRadius === "critical") {
    warnings.push("Critical blast radius requires architecture and owner approval evidence.");
  }
  if (input.postureAwareIntegrity.integrityTrend === "critical-degrading") {
    warnings.push("Critical posture degradation requires escalation evidence.");
  }
  if (input.buildAwareIntegrity.buildPosture === "unknown") {
    warnings.push("Build evidence is missing.");
  }
  if (input.buildAwareIntegrity.buildPosture === "failed") {
    warnings.push("Build failed; passing rerun evidence is required.");
  }

  return unique(warnings);
}

function postureFor(input: EvidenceAwareIntegrityInput, gaps: string[]): EvidencePosture {
  const blockingGap = input.policyAwareIntegrity.policyPosture === "policy-blocked"
    || input.releaseReadiness.releaseDecision === "blocked"
    || input.prIntegrity.mergeReadiness === "blocked"
    || (input.architectureAwareIntegrity.blastRadius === "critical"
      && !input.policyAwareIntegrity.requiredApprovals.includes("architecture review"))
    || (input.architectureAwareIntegrity.blastRadius === "critical"
      && !input.policyAwareIntegrity.requiredApprovals.includes("owner approval"))
    || (input.policyAwareIntegrity.policyViolations.some((violation) => /critical diff-aware/i.test(violation))
      && !input.policyAwareIntegrity.requiredApprovals.includes("security review"));

  if (blockingGap) return "blocking-gap";
  if (
    input.prIntegrity.mergeReadiness === "ready"
    && input.releaseReadiness.releaseDecision === "ready"
    && input.policyAwareIntegrity.policyPosture === "compliant"
    && !gaps.length
  ) {
    return "sufficient";
  }
  if (input.policyAwareIntegrity.requiredApprovals.length && gaps.length) {
    return "missing";
  }
  if (input.prIntegrity.missingEvidence.length || input.releaseReadiness.missingReleaseEvidence.length) {
    return "weak";
  }
  return "partial";
}

function actionFor(posture: EvidencePosture): string {
  if (posture === "blocking-gap") {
    return "Block merge or release until blocking evidence gaps are resolved and attached.";
  }
  if (posture === "missing") {
    return "Attach required approvals, reviewer notes, test results, and release evidence before proceeding.";
  }
  if (posture === "weak") {
    return "Add reviewer, test, release, and runtime evidence; generated reports alone are not enough.";
  }
  if (posture === "partial") {
    return "Complete the remaining approval and release evidence before treating the change as ready.";
  }
  return "Evidence is sufficient for the current deterministic review posture.";
}

export function evaluateEvidenceAwareIntegrity(
  input: EvidenceAwareIntegrityInput
): EvidenceAwareIntegrityResult {
  const gaps = evidenceGaps(input);
  const evidencePosture = postureFor(input, gaps);

  return {
    evidencePosture,
    evidenceGaps: gaps,
    evidenceStrengths: baselineStrengths(input),
    evidenceRequiredBeforeMerge: beforeMerge(input),
    evidenceRequiredBeforeRelease: beforeRelease(input),
    evidenceRequiredAfterRelease: afterRelease(input),
    evidenceRequiredForPolicy: forPolicy(input),
    evidenceWarnings: evidenceWarnings(input, gaps),
    recommendedEvidenceAction: actionFor(evidencePosture),
  };
}
