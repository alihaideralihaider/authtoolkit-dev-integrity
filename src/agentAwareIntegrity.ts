import type { ArchitectureAwareIntegrityResult } from "./architectureAwareIntegrity.ts";
import type { DiffAwareIntegrityResult } from "./diffAwareIntegrity.ts";
import type { EvidenceAwareIntegrityResult } from "./evidenceAwareIntegrity.ts";
import type { PolicyAwareIntegrityResult } from "./policyAwareIntegrity.ts";
import type { PrIntegrityResult } from "./prIntegrity.ts";
import type { ReleaseReadinessResult } from "./releaseReadiness.ts";
import type { RuntimeIntegrityResult } from "./runtimeIntegrity.ts";
import type { ClassifiedFile } from "./riskClassifier.ts";

export type AgentRiskPosture =
  | "human-likely"
  | "agent-assisted"
  | "agent-generated-suspected"
  | "automation-generated"
  | "unknown-authorship";

export type AgentAwareIntegrityInput = {
  changedFiles: ClassifiedFile[];
  diffAwareIntegrity: DiffAwareIntegrityResult;
  prIntegrity: PrIntegrityResult;
  releaseReadiness: ReleaseReadinessResult;
  runtimeIntegrity: RuntimeIntegrityResult;
  architectureAwareIntegrity: ArchitectureAwareIntegrityResult;
  policyAwareIntegrity: PolicyAwareIntegrityResult;
  evidenceAwareIntegrity: EvidenceAwareIntegrityResult;
};

export type AgentAwareIntegrityResult = {
  authorshipSignals: string[];
  automationSignals: string[];
  agentRiskPosture: AgentRiskPosture;
  agentReviewRequirements: string[];
  agentTrustWarnings: string[];
  agentBoundaryWarnings: string[];
  recommendedAgentAction: string;
};

const agentPatterns = [
  /codex/i,
  /copilot/i,
  /cursor/i,
  /claude/i,
  /openai/i,
  /\bagent\b/i,
  /generated/i,
  /auto-generated/i,
  /ai-generated/i,
  /co-authored-by/i,
  /automated/i,
];

const automationPatterns = [
  /github-actions/i,
  /\.github\/workflows/i,
  /workflow/i,
  /\bbot\b/i,
  /script/i,
  /generated report/i,
  /generated file/i,
  /package-lock\.json/i,
  /pnpm-lock\.yaml/i,
  /yarn\.lock/i,
];

function unique(values: string[]): string[] {
  return [...new Set(values)].sort();
}

function pathSignal(filePath: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(filePath));
}

function authorshipSignals(input: AgentAwareIntegrityInput): string[] {
  const signals: string[] = [];

  for (const file of input.changedFiles) {
    if (pathSignal(file.path, agentPatterns)) {
      signals.push(`Agent/AI authorship term found in changed path: ${file.path}`);
    }
  }

  for (const finding of input.diffAwareIntegrity.diffFindings) {
    if (pathSignal(finding.safeEvidenceSummary, agentPatterns) || pathSignal(finding.reason, agentPatterns)) {
      signals.push(`Agent/AI authorship term found in diff-aware finding: ${finding.findingName} in ${finding.filePath}`);
    }
  }

  return unique(signals);
}

function automationSignals(input: AgentAwareIntegrityInput): string[] {
  const signals: string[] = [];
  const sourceFileCount = input.changedFiles.filter((file) => /\.(ts|tsx|js|jsx|mjs|cjs)$/.test(file.path)).length;

  for (const file of input.changedFiles) {
    if (pathSignal(file.path, automationPatterns)) {
      signals.push(`Automation term found in changed path: ${file.path}`);
    }
    if (/lock$|lock\.json|lock\.yaml/.test(file.path) && sourceFileCount === 0) {
      signals.push(`Lockfile/package change without source context: ${file.path}`);
    }
  }

  for (const note of [
    ...input.diffAwareIntegrity.diffReviewNotes,
    ...input.evidenceAwareIntegrity.evidenceStrengths,
  ]) {
    if (pathSignal(note, automationPatterns)) {
      signals.push(`Automation term found in generated review evidence: ${note}`);
    }
  }

  return unique(signals);
}

function postureFor(authorship: string[], automation: string[]): AgentRiskPosture {
  if (automation.length) return "automation-generated";
  if (authorship.some((signal) => /generated|auto-generated|ai-generated/i.test(signal))) {
    return "agent-generated-suspected";
  }
  if (authorship.length) return "agent-assisted";
  return "unknown-authorship";
}

function hasSensitiveIntersection(input: AgentAwareIntegrityInput): boolean {
  const packs = input.prIntegrity.requiredReviewPacks;
  return input.architectureAwareIntegrity.blastRadius === "critical"
    || input.diffAwareIntegrity.diffFindings.some((finding) => finding.severity === "high" || finding.severity === "critical")
    || packs.some((pack) => ["payment-pack", "security-pack", "runtime-pack", "vault-pack"].includes(pack))
    || input.releaseReadiness.releaseDecision !== "ready"
    || input.evidenceAwareIntegrity.evidencePosture !== "sufficient"
    || input.policyAwareIntegrity.policyPosture === "escalation-required"
    || input.policyAwareIntegrity.policyPosture === "policy-blocked";
}

function reviewRequirements(
  input: AgentAwareIntegrityInput,
  hasSignals: boolean,
  sensitiveIntersection: boolean
): string[] {
  const requirements: string[] = [];
  const packs = input.prIntegrity.requiredReviewPacks;

  if (hasSignals || sensitiveIntersection) requirements.push("independent human review required");
  if (packs.includes("security-pack")) requirements.push("security review required for agent-touched auth/API changes");
  if (packs.includes("payment-pack")) requirements.push("payment review required for agent-touched payment/webhook changes");
  if (packs.includes("runtime-pack") || packs.includes("vault-pack")) requirements.push("runtime review required for agent-touched runtime/config changes");
  if (input.architectureAwareIntegrity.blastRadius === "critical") requirements.push("architecture review required for critical blast radius");
  if (input.evidenceAwareIntegrity.evidencePosture !== "sufficient") requirements.push("evidence attachment required before approval");

  return unique(requirements);
}

function trustWarnings(
  input: AgentAwareIntegrityInput,
  hasSignals: boolean,
  sensitiveIntersection: boolean
): string[] {
  const warnings: string[] = [];

  if (hasSignals && sensitiveIntersection) warnings.push("Agent/automation signal detected near sensitive systems.");
  if (hasSignals) warnings.push("Generated change requires independent review.");
  if (input.evidenceAwareIntegrity.evidencePosture !== "sufficient") warnings.push("Agent-touched change cannot rely only on generated report evidence.");
  if (hasSignals && input.policyAwareIntegrity.policyEscalations.length) warnings.push("Policy escalation intersects with agent/automation signal.");
  if (input.architectureAwareIntegrity.blastRadius === "critical") warnings.push("Critical blast radius requires human review even if generated by agent.");

  return unique(warnings);
}

function boundaryWarnings(input: AgentAwareIntegrityInput, hasSignals: boolean): string[] {
  const warnings: string[] = [];

  if (hasSignals || input.policyAwareIntegrity.requiredApprovals.length) warnings.push("Human approval boundary required.");
  if (hasSignals && input.policyAwareIntegrity.policyPosture !== "compliant") warnings.push("Agent-generated code should not self-approve.");
  if (input.prIntegrity.requiredReviewPacks.some((pack) => ["runtime-pack", "vault-pack"].includes(pack))) warnings.push("Agent-authored runtime/config changes need owner confirmation.");
  if (input.prIntegrity.requiredReviewPacks.some((pack) => ["payment-pack", "security-pack"].includes(pack))) warnings.push("Agent-authored payment/security changes require independent review.");

  return unique(warnings);
}

function actionFor(posture: AgentRiskPosture, sensitiveIntersection: boolean): string {
  if (posture === "automation-generated" && sensitiveIntersection) {
    return "Require independent human review and attach evidence before merge or release.";
  }
  if (posture === "agent-generated-suspected" || posture === "agent-assisted") {
    return "Treat agent authorship as a review signal; verify sensitive boundaries and attach independent evidence.";
  }
  if (sensitiveIntersection) {
    return "Authorship is unknown; require human review because sensitive integrity signals are present.";
  }
  return "Authorship is not clearly agent/automation-related; continue normal review evidence flow.";
}

export function evaluateAgentAwareIntegrity(
  input: AgentAwareIntegrityInput
): AgentAwareIntegrityResult {
  const authorship = authorshipSignals(input);
  const automation = automationSignals(input);
  const hasSignals = Boolean(authorship.length || automation.length);
  const sensitiveIntersection = hasSensitiveIntersection(input);
  const agentRiskPosture = postureFor(authorship, automation);

  return {
    authorshipSignals: authorship,
    automationSignals: automation,
    agentRiskPosture,
    agentReviewRequirements: reviewRequirements(input, hasSignals, sensitiveIntersection),
    agentTrustWarnings: trustWarnings(input, hasSignals, sensitiveIntersection),
    agentBoundaryWarnings: boundaryWarnings(input, hasSignals),
    recommendedAgentAction: actionFor(agentRiskPosture, sensitiveIntersection),
  };
}
