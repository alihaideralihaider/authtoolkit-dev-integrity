import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import type { BuildSummary } from "./buildAwareIntegrity.ts";
import type { GitContext } from "./gitContext.ts";

export type PipelineStatus = "passed" | "warning" | "failed" | "cancelled" | "skipped" | "unknown";

export type CicdSummary = {
  provider?: string;
  pipelineName?: string;
  runId?: string;
  branch?: string;
  commit?: string;
  status?: string;
  failedStage?: string;
  failedJobs?: string[];
  deploymentTarget?: string;
  environment?: string;
  durationSeconds?: number;
  rerunStatus?: string;
  logsRedacted?: boolean;
  safeArtifactRefs?: string[];
};

export type CicdContext = {
  cicdProvider: string;
  pipelineName: string;
  pipelineRunId: string;
  pipelineStatus: PipelineStatus;
  failedStage: string;
  failedJobs: string[];
  deploymentTarget: string;
  environment: string;
  durationSummary: string;
  rerunStatus: string;
  safeArtifactRefs: string[];
  cicdWarnings: string[];
  cicdTrustSummary: string;
  cicdSummaryPath?: string;
};

function normalize(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeStatus(status: string): PipelineStatus {
  const value = status.toLowerCase();
  if (/pass|success|succeeded/.test(value)) return "passed";
  if (/warn|flaky|partial/.test(value)) return "warning";
  if (/fail|failed|error|blocked/.test(value)) return "failed";
  if (/cancel/.test(value)) return "cancelled";
  if (/skip/.test(value)) return "skipped";
  return "unknown";
}

function durationSummary(seconds: unknown): string {
  if (typeof seconds !== "number" || !Number.isFinite(seconds)) return "unknown";
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return remainder ? `${minutes}m ${remainder}s` : `${minutes}m`;
}

function warningsFor(summary: CicdSummary, status: PipelineStatus, gitContext: GitContext): string[] {
  const warnings: string[] = [];
  const target = normalize(summary.deploymentTarget).toLowerCase();
  const branch = normalize(summary.branch);
  const commit = normalize(summary.commit);

  if (status === "failed") warnings.push("Failed pipeline requires rerun evidence.");
  if (status === "cancelled" || status === "skipped") warnings.push("Cancelled or skipped pipeline means CI/CD evidence is incomplete.");
  if ((status === "failed" || status === "warning") && /prod|production/.test(target)) {
    warnings.push("Production deployment target with failed or warning status requires release review.");
  }
  if (summary.logsRedacted !== true) {
    warnings.push("CI/CD summary must be redacted; raw logs should not be included.");
  }
  if (branch && gitContext.currentBranch !== "unknown" && branch !== gitContext.currentBranch) {
    warnings.push(`CI/CD branch does not match Git Context branch: ${branch} != ${gitContext.currentBranch}.`);
  }
  if (commit && commit !== "sample" && gitContext.currentCommit !== "unknown" && commit !== gitContext.currentCommit) {
    warnings.push("CI/CD commit does not match Git Context current commit.");
  }

  return [...new Set(warnings)].sort();
}

function trustSummary(status: PipelineStatus, warnings: string[]): string {
  if (status === "passed" && !warnings.length) return "CI/CD evidence is passing and redacted.";
  if (status === "passed") return "CI/CD passed, but warnings require review.";
  if (status === "failed") return "CI/CD failed; rerun evidence is required before release trust.";
  if (status === "warning") return "CI/CD warning requires targeted review before release trust.";
  if (status === "cancelled" || status === "skipped") return "CI/CD evidence is incomplete because the pipeline did not complete.";
  return "No CI/CD summary was provided; pipeline trust is unknown.";
}

export function loadCicdSummary(cicdSummaryPath: string | undefined): {
  summary: CicdSummary | null;
  resolvedPath?: string;
} {
  if (!cicdSummaryPath) return { summary: null };

  const resolvedPath = path.resolve(process.cwd(), cicdSummaryPath);
  if (!existsSync(resolvedPath) || !statSync(resolvedPath).isFile()) {
    throw new Error(`CI/CD summary file does not exist: ${resolvedPath}`);
  }

  const parsed = JSON.parse(readFileSync(resolvedPath, "utf8")) as CicdSummary;
  return { summary: parsed, resolvedPath };
}

export function evaluateCicdContext(summary: CicdSummary | null, gitContext: GitContext, cicdSummaryPath?: string): CicdContext {
  if (!summary) {
    return {
      cicdProvider: "none",
      pipelineName: "none",
      pipelineRunId: "none",
      pipelineStatus: "unknown",
      failedStage: "none",
      failedJobs: [],
      deploymentTarget: "unknown",
      environment: "unknown",
      durationSummary: "unknown",
      rerunStatus: "unknown",
      safeArtifactRefs: [],
      cicdWarnings: [],
      cicdTrustSummary: "No CI/CD summary was provided; pipeline trust is unknown.",
    };
  }

  const pipelineStatus = normalizeStatus(normalize(summary.status));
  const cicdWarnings = warningsFor(summary, pipelineStatus, gitContext);

  return {
    cicdProvider: normalize(summary.provider) || "unknown",
    pipelineName: normalize(summary.pipelineName) || "unknown",
    pipelineRunId: normalize(summary.runId) || "unknown",
    pipelineStatus,
    failedStage: normalize(summary.failedStage) || "none",
    failedJobs: Array.isArray(summary.failedJobs) ? summary.failedJobs.map(String).sort() : [],
    deploymentTarget: normalize(summary.deploymentTarget) || "unknown",
    environment: normalize(summary.environment) || "unknown",
    durationSummary: durationSummary(summary.durationSeconds),
    rerunStatus: normalize(summary.rerunStatus) || "unknown",
    safeArtifactRefs: Array.isArray(summary.safeArtifactRefs) ? summary.safeArtifactRefs.map(String).sort() : [],
    cicdWarnings,
    cicdTrustSummary: trustSummary(pipelineStatus, cicdWarnings),
    cicdSummaryPath,
  };
}

export function buildSummaryFromCicdContext(context: CicdContext): BuildSummary | null {
  if (context.pipelineStatus === "unknown") return null;

  return {
    status: context.pipelineStatus,
    stage: context.failedStage === "none" ? "pipeline" : context.failedStage,
    failedJobs: context.failedJobs,
    failureCategory: context.failedStage === "none" ? "pipeline" : context.failedStage,
    summary: context.cicdTrustSummary,
    logsRedacted: true,
  };
}
