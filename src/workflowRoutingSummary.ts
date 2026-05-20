import type { AgentAwareIntegrityResult } from "./agentAwareIntegrity.ts";
import type { ArchitectureAwareIntegrityResult } from "./architectureAwareIntegrity.ts";
import type { BuildAwareIntegrityResult } from "./buildAwareIntegrity.ts";
import type { CicdContext } from "./cicdContext.ts";
import type { ControlRoomOverviewResult } from "./controlRoomOverview.ts";
import type { EvidenceAwareIntegrityResult } from "./evidenceAwareIntegrity.ts";
import type { ImpactAwareIntegrityResult } from "./impactAwareIntegrity.ts";
import type { IntegrityDecisionSummaryResult } from "./integrityDecisionSummary.ts";
import type { PolicyAwareIntegrityResult } from "./policyAwareIntegrity.ts";
import type { PostureAwareIntegrityResult } from "./postureAwareIntegrity.ts";
import type { PrIntegrityResult } from "./prIntegrity.ts";
import type { RecoveryAwareIntegrityResult } from "./recoveryAwareIntegrity.ts";
import type { ReleaseReadinessResult } from "./releaseReadiness.ts";
import type { RuntimeIntegrityResult } from "./runtimeIntegrity.ts";

export type WorkflowName =
  | "merge-review"
  | "release-review"
  | "runtime-watch"
  | "escalation-review"
  | "recovery-review"
  | "evidence-review"
  | "agent-review";

export type WorkflowPriority = "normal" | "elevated" | "high-risk" | "critical";

export type WorkflowRoutingSummaryInput = {
  integrityDecisionSummary: IntegrityDecisionSummaryResult;
  controlRoomOverview: ControlRoomOverviewResult;
  buildAwareIntegrity: BuildAwareIntegrityResult;
  prIntegrity: PrIntegrityResult;
  releaseReadiness: ReleaseReadinessResult;
  runtimeIntegrity: RuntimeIntegrityResult;
  architectureAwareIntegrity: ArchitectureAwareIntegrityResult;
  policyAwareIntegrity: PolicyAwareIntegrityResult;
  evidenceAwareIntegrity: EvidenceAwareIntegrityResult;
  agentAwareIntegrity: AgentAwareIntegrityResult;
  recoveryAwareIntegrity: RecoveryAwareIntegrityResult;
  impactAwareIntegrity: ImpactAwareIntegrityResult;
  postureAwareIntegrity: PostureAwareIntegrityResult;
  cicdContext?: CicdContext;
};

export type WorkflowRoutingSummaryResult = {
  activeWorkflows: WorkflowName[];
  workflowReasons: string[];
  workflowPriority: WorkflowPriority;
  workflowOwners: string[];
  workflowEvidenceNeeds: string[];
  nextWorkflowActions: string[];
  workflowWarnings: string[];
  recommendedWorkflowPath: string;
};

function unique<T extends string>(values: T[]): T[] {
  return [...new Set(values)].sort() as T[];
}

function addWorkflow(workflows: Set<WorkflowName>, reasons: string[], workflow: WorkflowName, reason: string): void {
  workflows.add(workflow);
  reasons.push(`${workflow}: ${reason}`);
}

function activeWorkflowSet(input: WorkflowRoutingSummaryInput): { workflows: Set<WorkflowName>; reasons: string[] } {
  const workflows = new Set<WorkflowName>();
  const reasons: string[] = [];

  if (input.prIntegrity.mergeReadiness !== "ready") {
    addWorkflow(workflows, reasons, "merge-review", "Merge readiness needs review before this change should proceed.");
  }
  if (input.releaseReadiness.releaseDecision !== "ready") {
    addWorkflow(workflows, reasons, "release-review", "Release workflow is active because release trust is not ready.");
  }
  if (input.runtimeIntegrity.runtimePosture !== "stable") {
    addWorkflow(workflows, reasons, "runtime-watch", "Runtime watch workflow is active because runtime posture is not stable.");
  }
  if (
    input.integrityDecisionSummary.overallIntegrityDecision === "high-risk" ||
    input.integrityDecisionSummary.overallIntegrityDecision === "blocked" ||
    input.policyAwareIntegrity.policyPosture === "escalation-required" ||
    input.policyAwareIntegrity.policyPosture === "policy-blocked" ||
    input.architectureAwareIntegrity.blastRadius === "critical" ||
    input.impactAwareIntegrity.overallImpact === "critical"
  ) {
    addWorkflow(workflows, reasons, "escalation-review", "Escalation workflow is active because high-risk, blocked, policy, critical blast radius, or critical impact signals exist.");
  }
  if (
    input.recoveryAwareIntegrity.recoveryPosture === "difficult-recovery" ||
    input.recoveryAwareIntegrity.recoveryPosture === "high-risk-recovery" ||
    input.runtimeIntegrity.runtimePosture === "rollback-watch" ||
    input.recoveryAwareIntegrity.recoveryRisk === "critical"
  ) {
    addWorkflow(workflows, reasons, "recovery-review", "Recovery workflow is active because rollback feasibility or recovery risk needs review.");
  }
  if (input.evidenceAwareIntegrity.evidencePosture !== "sufficient") {
    addWorkflow(workflows, reasons, "evidence-review", "Evidence workflow is active because evidence posture is not sufficient.");
  }
  if (input.cicdContext && ["failed", "cancelled", "skipped", "warning"].includes(input.cicdContext.pipelineStatus)) {
    addWorkflow(workflows, reasons, "evidence-review", "Evidence workflow is active because CI/CD rerun or completion evidence is required.");
    addWorkflow(workflows, reasons, "release-review", "Release workflow is active because CI/CD context is not passing.");
  }
  if (
    input.agentAwareIntegrity.agentRiskPosture === "agent-assisted" ||
    input.agentAwareIntegrity.agentRiskPosture === "agent-generated-suspected" ||
    input.agentAwareIntegrity.agentRiskPosture === "automation-generated" ||
    input.agentAwareIntegrity.agentReviewRequirements.length > 0
  ) {
    addWorkflow(workflows, reasons, "agent-review", "Agent review workflow is active because agent, automation, or sensitive review requirement signals exist.");
  }

  return { workflows, reasons: unique(reasons) };
}

function priorityFor(input: WorkflowRoutingSummaryInput): WorkflowPriority {
  if (
    input.controlRoomOverview.controlRoomStatus === "red" ||
    input.integrityDecisionSummary.overallIntegrityDecision === "blocked" ||
    input.architectureAwareIntegrity.blastRadius === "critical" ||
    input.impactAwareIntegrity.overallImpact === "critical" ||
    input.recoveryAwareIntegrity.recoveryRisk === "critical"
    || (input.cicdContext?.deploymentTarget === "production" && ["failed", "warning"].includes(input.cicdContext.pipelineStatus))
  ) {
    return "critical";
  }
  if (
    input.controlRoomOverview.controlRoomStatus === "orange" ||
    input.integrityDecisionSummary.overallIntegrityDecision === "high-risk" ||
    input.policyAwareIntegrity.policyPosture === "escalation-required" ||
    input.recoveryAwareIntegrity.recoveryPosture === "high-risk-recovery"
  ) {
    return "high-risk";
  }
  if (
    input.controlRoomOverview.controlRoomStatus === "yellow" ||
    input.releaseReadiness.releaseDecision === "caution" ||
    input.evidenceAwareIntegrity.evidencePosture !== "sufficient" ||
    input.buildAwareIntegrity.buildPosture !== "passed"
  ) {
    return "elevated";
  }
  return "normal";
}

function ownersFor(workflows: Set<WorkflowName>, input: WorkflowRoutingSummaryInput): string[] {
  const owners: string[] = [];
  if (workflows.has("merge-review")) owners.push("engineering reviewer");
  if (workflows.has("release-review")) owners.push("release owner");
  if (workflows.has("runtime-watch")) owners.push("runtime operator");
  if (workflows.has("escalation-review")) owners.push("founder/owner", "architecture reviewer");
  if (workflows.has("recovery-review")) owners.push("recovery coordinator");
  if (workflows.has("evidence-review")) owners.push("engineering reviewer");
  if (workflows.has("agent-review")) owners.push("engineering reviewer");
  if (input.policyAwareIntegrity.requiredApprovals.includes("security review")) owners.push("security reviewer");
  if (input.policyAwareIntegrity.requiredApprovals.includes("payment review") || input.impactAwareIntegrity.paymentImpact === "high" || input.impactAwareIntegrity.paymentImpact === "critical") owners.push("payment reviewer");
  return unique(owners);
}

function evidenceNeedsFor(input: WorkflowRoutingSummaryInput): string[] {
  const needs: string[] = [];
  if (input.recoveryAwareIntegrity.recoveryWarnings.length || input.releaseReadiness.rollbackRequirements.length) needs.push("rollback evidence");
  if (input.buildAwareIntegrity.buildPosture !== "passed") needs.push("build evidence");
  if (input.runtimeIntegrity.runtimePosture !== "stable") needs.push("runtime validation");
  if (input.architectureAwareIntegrity.blastRadius === "broad" || input.architectureAwareIntegrity.blastRadius === "critical") needs.push("architecture review notes");
  if (input.policyAwareIntegrity.requiredApprovals.includes("security review")) needs.push("security review notes");
  if (input.policyAwareIntegrity.requiredApprovals.includes("payment review") || input.architectureAwareIntegrity.affectedBoundaries.includes("payment trust boundary")) needs.push("payment review notes");
  if (input.policyAwareIntegrity.requiredApprovals.includes("owner approval")) needs.push("owner approval");
  if (input.releaseReadiness.canaryRecommendations.length) needs.push("canary validation");
  if (input.cicdContext && ["failed", "warning", "cancelled", "skipped"].includes(input.cicdContext.pipelineStatus)) needs.push("CI/CD rerun evidence");
  return unique(needs);
}

function nextActionsFor(input: WorkflowRoutingSummaryInput): string[] {
  return unique([
    ...input.integrityDecisionSummary.requiredNextActions,
    ...input.controlRoomOverview.requiredActions,
    ...(input.releaseReadiness.releaseDecision !== "ready" ? ["complete release review"] : []),
    ...(input.runtimeIntegrity.runtimePosture !== "stable" ? ["complete runtime watch planning"] : []),
    ...(input.evidenceAwareIntegrity.evidencePosture !== "sufficient" ? ["attach missing evidence"] : []),
    ...(input.recoveryAwareIntegrity.recoveryPosture === "difficult-recovery" || input.recoveryAwareIntegrity.recoveryPosture === "high-risk-recovery" ? ["complete recovery review"] : []),
  ]);
}

function warningsFor(workflows: Set<WorkflowName>, input: WorkflowRoutingSummaryInput): string[] {
  const warnings: string[] = [];
  if (workflows.has("release-review")) warnings.push("Release workflow is active because release trust is not ready.");
  if (workflows.has("recovery-review") && input.recoveryAwareIntegrity.rollbackFeasibility === "difficult") warnings.push("Recovery workflow is active because rollback feasibility is difficult.");
  if (workflows.has("escalation-review") && input.architectureAwareIntegrity.blastRadius === "critical") warnings.push("Escalation workflow is active because critical blast radius exists.");
  if (workflows.has("evidence-review") && input.evidenceAwareIntegrity.evidencePosture === "missing") warnings.push("Evidence workflow is active because evidence posture is missing.");
  if (workflows.has("agent-review")) warnings.push("Agent review workflow is active because sensitive agent-assisted or automation signals were detected.");
  if (input.postureAwareIntegrity.escalationWarnings.length) warnings.push("Posture-aware escalation warnings should be reviewed before workflow completion.");
  return unique(warnings);
}

function recommendedPath(priority: WorkflowPriority, workflows: Set<WorkflowName>, input: WorkflowRoutingSummaryInput): string {
  if (input.integrityDecisionSummary.overallIntegrityDecision === "blocked" || priority === "critical") return "Stop and resolve blockers before continuing any workflow.";
  if (workflows.has("escalation-review") && workflows.has("evidence-review")) return "Complete evidence and escalation review before release consideration.";
  if (workflows.has("recovery-review")) return "Complete recovery review and rollback preparation before release.";
  if (workflows.has("merge-review") && workflows.has("runtime-watch")) return "Proceed through merge review and runtime watch workflow.";
  if (workflows.has("release-review")) return "Complete release review and required evidence before release.";
  if (workflows.has("evidence-review")) return "Attach missing evidence and rerun the review.";
  return "Proceed through normal review workflow and preserve generated evidence.";
}

export function buildWorkflowRoutingSummary(input: WorkflowRoutingSummaryInput): WorkflowRoutingSummaryResult {
  const { workflows, reasons } = activeWorkflowSet(input);
  const workflowPriority = priorityFor(input);

  return {
    activeWorkflows: unique([...workflows]),
    workflowReasons: reasons,
    workflowPriority,
    workflowOwners: ownersFor(workflows, input),
    workflowEvidenceNeeds: evidenceNeedsFor(input),
    nextWorkflowActions: nextActionsFor(input),
    workflowWarnings: warningsFor(workflows, input),
    recommendedWorkflowPath: recommendedPath(workflowPriority, workflows, input),
  };
}
