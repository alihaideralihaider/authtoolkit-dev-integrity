import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { collectGitContext } from "./gitContext.ts";
import { monitorGit } from "./gitMonitor.ts";
import { classifyChangedFiles, collectRiskCategories, confidenceForRisks, confidenceNotes, criticalWarnings, highestSeverity } from "./riskClassifier.ts";
import { confidenceWithRiskCombinations, detectRiskCombinations } from "./riskCombinationDetector.ts";
import { confidenceWithDiffFindings, evaluateDiffAwareIntegrity } from "./diffAwareIntegrity.ts";
import { evaluatePrIntegrity } from "./prIntegrity.ts";
import { evaluateReleaseReadiness } from "./releaseReadiness.ts";
import { evaluateRuntimeIntegrity } from "./runtimeIntegrity.ts";
import { buildEvidenceTimeline } from "./evidenceTimeline.ts";
import { evaluatePostureAwareIntegrity } from "./postureAwareIntegrity.ts";
import { evaluateArchitectureAwareIntegrity } from "./architectureAwareIntegrity.ts";
import { evaluatePolicyAwareIntegrity } from "./policyAwareIntegrity.ts";
import { evaluateEvidenceAwareIntegrity } from "./evidenceAwareIntegrity.ts";
import { evaluateAgentAwareIntegrity } from "./agentAwareIntegrity.ts";
import { evaluateRecoveryAwareIntegrity } from "./recoveryAwareIntegrity.ts";
import { evaluateImpactAwareIntegrity } from "./impactAwareIntegrity.ts";
import { evaluateIntegrityDecisionSummary } from "./integrityDecisionSummary.ts";
import { buildControlRoomOverview } from "./controlRoomOverview.ts";
import { buildWorkflowRoutingSummary } from "./workflowRoutingSummary.ts";
import { buildPrContext } from "./prContext.ts";
import { buildSummaryFromCicdContext, evaluateCicdContext, loadCicdSummary } from "./cicdContext.ts";
import { buildReleaseWorkflowPlan } from "./releaseWorkflowPlan.ts";
import { buildBranchComparison } from "./branchComparison.ts";
import { confidenceWithBuildAwareness, evaluateBuildAwareIntegrity, loadBuildSummary } from "./buildAwareIntegrity.ts";
import { selectReviewPacks, selectReviews } from "./reviewSelector.ts";
import type { ClassifiedFile, RiskCategory, Severity } from "./riskClassifier.ts";
import type { EvidenceTimeline } from "./evidenceTimeline.ts";
import type { LayerSummaries } from "./evidenceTimeline.ts";
import type { PrIntegrityResult } from "./prIntegrity.ts";
import type { ReleaseReadinessResult } from "./releaseReadiness.ts";
import type { RuntimeIntegrityResult } from "./runtimeIntegrity.ts";
import type { PostureAwareIntegrityResult } from "./postureAwareIntegrity.ts";
import type { ArchitectureAwareIntegrityResult } from "./architectureAwareIntegrity.ts";
import type { PolicyAwareIntegrityResult } from "./policyAwareIntegrity.ts";
import type { EvidenceAwareIntegrityResult } from "./evidenceAwareIntegrity.ts";
import type { AgentAwareIntegrityResult } from "./agentAwareIntegrity.ts";
import type { RecoveryAwareIntegrityResult } from "./recoveryAwareIntegrity.ts";
import type { ImpactAwareIntegrityResult } from "./impactAwareIntegrity.ts";
import type { IntegrityDecisionSummaryResult } from "./integrityDecisionSummary.ts";
import type { ControlRoomOverviewResult } from "./controlRoomOverview.ts";
import type { WorkflowRoutingSummaryResult } from "./workflowRoutingSummary.ts";
import type { BuildAwareIntegrityResult } from "./buildAwareIntegrity.ts";
import type { GitContext } from "./gitContext.ts";
import type { PrContext } from "./prContext.ts";
import type { CicdContext } from "./cicdContext.ts";
import type { ReleaseWorkflowPlan } from "./releaseWorkflowPlan.ts";
import type { BranchComparison } from "./branchComparison.ts";
import type { RiskCombination } from "./riskCombinationDetector.ts";
import type { DiffAwareIntegrityResult } from "./diffAwareIntegrity.ts";
import type { ReviewPack } from "./reviewSelector.ts";

export type ReviewResult = {
  repoPath: string;
  selectedSkill: string;
  skillPath: string;
  timestamp: string;
  gitStatus: string;
  diffNameOnly: string;
  gitContext: GitContext;
  branchComparison: BranchComparison;
  changedFiles: ClassifiedFile[];
  riskCategories: RiskCategory[];
  highestSeverity: Severity;
  riskCombinations: RiskCombination[];
  diffAwareIntegrity: DiffAwareIntegrityResult;
  architectureAwareIntegrity: ArchitectureAwareIntegrityResult;
  policyAwareIntegrity: PolicyAwareIntegrityResult;
  evidenceAwareIntegrity: EvidenceAwareIntegrityResult;
  agentAwareIntegrity: AgentAwareIntegrityResult;
  recoveryAwareIntegrity: RecoveryAwareIntegrityResult;
  impactAwareIntegrity: ImpactAwareIntegrityResult;
  integrityDecisionSummary: IntegrityDecisionSummaryResult;
  controlRoomOverview: ControlRoomOverviewResult;
  workflowRoutingSummary: WorkflowRoutingSummaryResult;
  releaseWorkflowPlan: ReleaseWorkflowPlan;
  prContext: PrContext;
  cicdContext: CicdContext;
  buildAwareIntegrity: BuildAwareIntegrityResult;
  prIntegrity: PrIntegrityResult;
  releaseReadiness: ReleaseReadinessResult;
  runtimeIntegrity: RuntimeIntegrityResult;
  evidenceTimeline: EvidenceTimeline;
  postureAwareIntegrity: PostureAwareIntegrityResult;
  suggestedReviews: string[];
  suggestedReviewPacks: ReviewPack[];
  confidenceScore: number;
  confidenceNotes: string[];
  unknownRiskWarnings: string[];
  criticalWarnings: string[];
  detectedEnvVarNames: string[];
  safetyNotes: string[];
  nextActions: string[];
};

type RunReviewInput = {
  repoPath: string;
  selectedSkill: string;
  buildSummaryPath?: string;
  baseBranch?: string;
  cicdSummaryPath?: string;
};

const envNamePattern = /\b[A-Z][A-Z0-9_]{2,}\b/g;
const envNameHints = [
  "ENV",
  "SECRET",
  "TOKEN",
  "KEY",
  "PASSWORD",
  "SUPABASE",
  "STRIPE",
  "TWILIO",
  "RESEND",
  "CLOUDFLARE",
  "OPENAI",
  "GOOGLE",
  "META",
  "WHATSAPP",
];

function repoRoot(): string {
  return path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
}

function normalizeRepoPath(repoPath: string): string {
  return path.resolve(process.cwd(), repoPath);
}

function assertDirectory(directoryPath: string, label: string): void {
  if (!existsSync(directoryPath) || !statSync(directoryPath).isDirectory()) {
    throw new Error(`${label} does not exist or is not a directory: ${directoryPath}`);
  }
}

function skillPathFor(selectedSkill: string): string {
  return path.join(repoRoot(), "docs", "skills", `${selectedSkill}.md`);
}

function isLikelyTextFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  if (!ext) return true;
  return [
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".json",
    ".md",
    ".mjs",
    ".cjs",
    ".yml",
    ".yaml",
    ".toml",
    ".env",
    ".example",
  ].includes(ext);
}

function detectEnvVarNames(repoPath: string, changedFiles: ClassifiedFile[]): string[] {
  const names = new Set<string>();

  for (const file of changedFiles) {
    const absolutePath = path.join(repoPath, file.path);
    if (!existsSync(absolutePath) || !statSync(absolutePath).isFile()) continue;
    if (!isLikelyTextFile(absolutePath)) continue;

    const content = readFileSync(absolutePath, "utf8");
    const matches = content.match(envNamePattern) || [];

    for (const match of matches) {
      if (envNameHints.some((hint) => match.includes(hint))) {
        names.add(match);
      }
    }
  }

  return [...names].sort();
}

function buildUnknownRiskWarnings(changedFiles: ClassifiedFile[]): string[] {
  return changedFiles
    .filter((file) => file.riskCategories.includes("unknown"))
    .map((file) => `${file.path} could not be classified by v1 Git Monitoring heuristics.`);
}

function buildLayerSummaries(input: {
  buildAwareIntegrity: BuildAwareIntegrityResult;
  architectureAwareIntegrity: ArchitectureAwareIntegrityResult;
  policyAwareIntegrity: PolicyAwareIntegrityResult;
  evidenceAwareIntegrity: EvidenceAwareIntegrityResult;
  agentAwareIntegrity: AgentAwareIntegrityResult;
  recoveryAwareIntegrity: RecoveryAwareIntegrityResult;
}): LayerSummaries {
  return {
    build: {
      buildPosture: input.buildAwareIntegrity.buildPosture,
      buildRisk: input.buildAwareIntegrity.buildRisk,
    },
    architecture: {
      blastRadius: input.architectureAwareIntegrity.blastRadius,
    },
    policy: {
      policyPosture: input.policyAwareIntegrity.policyPosture,
    },
    evidence: {
      evidencePosture: input.evidenceAwareIntegrity.evidencePosture,
    },
    agent: {
      agentRiskPosture: input.agentAwareIntegrity.agentRiskPosture,
      authorshipSignalsCount: input.agentAwareIntegrity.authorshipSignals.length,
      automationSignalsCount: input.agentAwareIntegrity.automationSignals.length,
      agentReviewRequirementsCount: input.agentAwareIntegrity.agentReviewRequirements.length,
    },
    recovery: {
      recoveryPosture: input.recoveryAwareIntegrity.recoveryPosture,
    },
  };
}

export function runReview(input: RunReviewInput): ReviewResult {
  const repoPath = normalizeRepoPath(input.repoPath);
  assertDirectory(repoPath, "Repo path");

  const selectedSkill = input.selectedSkill.trim();
  const skillPath = skillPathFor(selectedSkill);
  if (!existsSync(skillPath) || !statSync(skillPath).isFile()) {
    throw new Error(`Selected skill markdown does not exist: ${skillPath}`);
  }

  const gitMonitor = monitorGit(repoPath);
  const gitContext = collectGitContext({
    repoPath,
    gitStatus: gitMonitor.gitStatus,
    baseBranch: input.baseBranch,
  });
  const timestamp = new Date().toISOString();
  const changedFiles = classifyChangedFiles(gitMonitor.changedFiles);
  const riskCategories = collectRiskCategories(changedFiles);
  const maxSeverity = highestSeverity(changedFiles);
  const riskCombinations = detectRiskCombinations(changedFiles);
  const diffAwareIntegrity = evaluateDiffAwareIntegrity(gitMonitor.diffLines);
  const cicdSummary = loadCicdSummary(input.cicdSummaryPath);
  const cicdContext = evaluateCicdContext(cicdSummary.summary, gitContext, cicdSummary.resolvedPath);
  const buildSummary = loadBuildSummary(input.buildSummaryPath);
  const effectiveBuildSummary = buildSummary.summary || buildSummaryFromCicdContext(cicdContext);
  const effectiveBuildSummaryPath = buildSummary.resolvedPath || cicdContext.cicdSummaryPath;
  const buildAwareIntegrity = evaluateBuildAwareIntegrity(
    effectiveBuildSummary,
    effectiveBuildSummaryPath
  );
  const suggestedReviews = selectReviews(riskCategories, selectedSkill);
  const suggestedReviewPacks = [
    ...new Set([
      ...selectReviewPacks(riskCategories, maxSeverity),
      ...riskCombinations.flatMap((combination) => combination.suggestedReviewPacks),
      ...diffAwareIntegrity.diffFindings.flatMap((finding) => finding.suggestedReviewPacks),
      ...buildAwareIntegrity.affectedReviewPacks,
    ]),
  ];
  const branchComparison = buildBranchComparison({
    repoPath,
    gitContext,
    changedFiles,
    diffAwareIntegrity,
    riskCategories,
    suggestedReviewPacks,
  });
  const baseConfidenceScore = confidenceForRisks(riskCategories);
  const combinationConfidenceScore = confidenceWithRiskCombinations(baseConfidenceScore, riskCombinations);
  const diffConfidenceScore = confidenceWithDiffFindings(combinationConfidenceScore, diffAwareIntegrity);
  const confidenceScore = confidenceWithBuildAwareness(diffConfidenceScore, buildAwareIntegrity);
  const detectedEnvVarNames = detectEnvVarNames(repoPath, changedFiles);
  const unknownRiskWarnings = buildUnknownRiskWarnings(changedFiles);
  const criticalWarningList = criticalWarnings(changedFiles);
  const prIntegrity = evaluatePrIntegrity({
    highestSeverity: maxSeverity,
    riskCombinations,
    suggestedReviewPacks,
    unknownRiskWarnings,
    criticalWarnings: criticalWarningList,
    detectedEnvVarNames,
    diffFindings: diffAwareIntegrity.diffFindings,
    buildAwareIntegrity,
  });
  const releaseReadiness = evaluateReleaseReadiness({
    prIntegrity,
    highestSeverity: maxSeverity,
    riskCombinations,
    suggestedReviewPacks,
    criticalWarnings: criticalWarningList,
    detectedEnvVarNames,
    diffFindings: diffAwareIntegrity.diffFindings,
    buildAwareIntegrity,
  });
  const runtimeIntegrity = evaluateRuntimeIntegrity({
    releaseReadiness,
    prIntegrity,
    highestSeverity: maxSeverity,
    riskCombinations,
    suggestedReviewPacks,
    detectedEnvVarNames,
    criticalWarnings: criticalWarningList,
    diffFindings: diffAwareIntegrity.diffFindings,
    buildAwareIntegrity,
  });
  const architectureAwareIntegrity = evaluateArchitectureAwareIntegrity({
    changedFiles,
    riskCategories,
    suggestedReviewPacks,
    riskCombinations,
    diffAwareIntegrity,
    prIntegrity,
    releaseReadiness,
    runtimeIntegrity,
  });
  const baseEvidenceTimeline = buildEvidenceTimeline({
    generatedAt: timestamp,
    repoPath,
    selectedSkill,
    changedFilesCount: changedFiles.length,
    riskCategories,
    highestSeverity: maxSeverity,
    confidenceScore,
    suggestedReviewPacks,
    riskCombinations,
    prIntegrity,
    releaseReadiness,
    runtimeIntegrity,
    criticalWarnings: criticalWarningList,
    unknownRiskWarnings,
    detectedEnvVarNames,
    diffAwareIntegrity,
  });
  const basePostureAwareIntegrity = evaluatePostureAwareIntegrity(baseEvidenceTimeline);
  const policyAwareIntegrity = evaluatePolicyAwareIntegrity({
    riskCategories,
    suggestedReviewPacks,
    riskCombinations,
    diffAwareIntegrity,
    prIntegrity,
    releaseReadiness,
    runtimeIntegrity,
    postureAwareIntegrity: basePostureAwareIntegrity,
    architectureAwareIntegrity,
  });
  const evidenceAwareIntegrity = evaluateEvidenceAwareIntegrity({
    prIntegrity,
    releaseReadiness,
    runtimeIntegrity,
    evidenceTimeline: baseEvidenceTimeline,
    postureAwareIntegrity: basePostureAwareIntegrity,
    architectureAwareIntegrity,
    policyAwareIntegrity,
    buildAwareIntegrity,
  });
  const agentAwareIntegrity = evaluateAgentAwareIntegrity({
    changedFiles,
    diffAwareIntegrity,
    prIntegrity,
    releaseReadiness,
    runtimeIntegrity,
    architectureAwareIntegrity,
    policyAwareIntegrity,
    evidenceAwareIntegrity,
  });
  const recoveryAwareIntegrity = evaluateRecoveryAwareIntegrity({
    diffAwareIntegrity,
    releaseReadiness,
    runtimeIntegrity,
    architectureAwareIntegrity,
    policyAwareIntegrity,
    evidenceAwareIntegrity,
    agentAwareIntegrity,
    buildAwareIntegrity,
  });
  const impactAwareIntegrity = evaluateImpactAwareIntegrity({
    buildAwareIntegrity,
    diffAwareIntegrity,
    releaseReadiness,
    runtimeIntegrity,
    architectureAwareIntegrity,
    policyAwareIntegrity,
    evidenceAwareIntegrity,
    recoveryAwareIntegrity,
  });
  const layerSummaries = buildLayerSummaries({
    buildAwareIntegrity,
    architectureAwareIntegrity,
    policyAwareIntegrity,
    evidenceAwareIntegrity,
    agentAwareIntegrity,
    recoveryAwareIntegrity,
  });
  const evidenceTimeline = buildEvidenceTimeline({
    generatedAt: timestamp,
    repoPath,
    selectedSkill,
    changedFilesCount: changedFiles.length,
    riskCategories,
    highestSeverity: maxSeverity,
    confidenceScore,
    suggestedReviewPacks,
    riskCombinations,
    prIntegrity,
    releaseReadiness,
    runtimeIntegrity,
    criticalWarnings: criticalWarningList,
    unknownRiskWarnings,
    detectedEnvVarNames,
    diffAwareIntegrity,
    layerSummaries,
  });
  const postureAwareIntegrity = evaluatePostureAwareIntegrity(evidenceTimeline);
  const integrityDecisionSummary = evaluateIntegrityDecisionSummary({
    buildAwareIntegrity,
    prIntegrity,
    releaseReadiness,
    runtimeIntegrity,
    architectureAwareIntegrity,
    policyAwareIntegrity,
    evidenceAwareIntegrity,
    agentAwareIntegrity,
    recoveryAwareIntegrity,
    impactAwareIntegrity,
    postureAwareIntegrity,
  });
  const controlRoomOverview = buildControlRoomOverview({
    integrityDecisionSummary,
    buildAwareIntegrity,
    prIntegrity,
    releaseReadiness,
    runtimeIntegrity,
    architectureAwareIntegrity,
    policyAwareIntegrity,
    evidenceAwareIntegrity,
    agentAwareIntegrity,
    recoveryAwareIntegrity,
    impactAwareIntegrity,
    postureAwareIntegrity,
  });
  const workflowRoutingSummary = buildWorkflowRoutingSummary({
    integrityDecisionSummary,
    controlRoomOverview,
    buildAwareIntegrity,
    prIntegrity,
    releaseReadiness,
    runtimeIntegrity,
    architectureAwareIntegrity,
    policyAwareIntegrity,
    evidenceAwareIntegrity,
    agentAwareIntegrity,
    recoveryAwareIntegrity,
    impactAwareIntegrity,
    postureAwareIntegrity,
    cicdContext,
  });
  const releaseWorkflowPlan = buildReleaseWorkflowPlan({
    releaseReadiness,
    buildAwareIntegrity,
    cicdContext,
    runtimeIntegrity,
    recoveryAwareIntegrity,
    impactAwareIntegrity,
    evidenceAwareIntegrity,
    workflowRoutingSummary,
    controlRoomOverview,
  });
  const prContext = buildPrContext({
    gitContext,
    branchComparison,
    changedFiles,
    riskCategories,
    suggestedReviewPacks,
    integrityDecisionSummary,
    workflowRoutingSummary,
    cicdContext,
  });

  return {
    repoPath,
    selectedSkill,
    skillPath,
    timestamp,
    gitStatus: gitMonitor.gitStatus,
    diffNameOnly: gitMonitor.diffNameOnly,
    gitContext,
    branchComparison,
    changedFiles,
    riskCategories,
    highestSeverity: maxSeverity,
    riskCombinations,
    diffAwareIntegrity,
    architectureAwareIntegrity,
    policyAwareIntegrity,
    evidenceAwareIntegrity,
    agentAwareIntegrity,
    recoveryAwareIntegrity,
    impactAwareIntegrity,
    integrityDecisionSummary,
    controlRoomOverview,
    workflowRoutingSummary,
    releaseWorkflowPlan,
    prContext,
    cicdContext,
    buildAwareIntegrity,
    prIntegrity,
    releaseReadiness,
    runtimeIntegrity,
    evidenceTimeline,
    postureAwareIntegrity,
    suggestedReviews,
    suggestedReviewPacks,
    confidenceScore,
    confidenceNotes: confidenceNotes(riskCategories, confidenceScore),
    unknownRiskWarnings,
    criticalWarnings: criticalWarningList,
    detectedEnvVarNames,
    safetyNotes: [
      "Local-only review runner.",
      "No external AI APIs were called.",
      "Target repository was not modified.",
      "Env var-like names were detected by name only; values were not read from environment variables or printed.",
      "Git Monitoring does not auto-fix, auto-commit, auto-push, or deploy.",
    ],
    nextActions: [
      "Review the selected skill checklist.",
      "Review suggested reviews selected by Git Monitoring.",
      "Investigate changed files with relevant risk tags.",
      "Update documentation or code only after human review confirms the issue.",
      "Rerun this command after fixes or documentation updates.",
    ],
  };
}
