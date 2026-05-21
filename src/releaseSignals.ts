import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import type { GitContext } from "./gitContext.ts";

export type ReleaseSignalConclusion = "success" | "failure" | "cancelled" | "skipped" | "unknown";

export type ReleaseSignalSummary = {
  provider?: string;
  workflowName?: string;
  runId?: string;
  runUrl?: string;
  commitSha?: string;
  branch?: string;
  status?: string;
  conclusion?: string;
  startedAt?: string;
  completedAt?: string;
  logsRedacted?: boolean;
};

export type ReleaseSignals = {
  releaseSignalProvider: string;
  workflowName: string;
  runId: string;
  runUrl: string;
  commitSha: string;
  branch: string;
  signalStatus: string;
  signalConclusion: ReleaseSignalConclusion;
  startedAt: string;
  completedAt: string;
  durationSummary: string;
  logsRedacted: boolean;
  releaseSignalWarnings: string[];
  releaseSignalTrustSummary: string;
  releaseSignalsPath?: string;
};

function normalize(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeConclusion(conclusion: string): ReleaseSignalConclusion {
  const value = conclusion.toLowerCase();
  if (/success|pass|passed|succeeded/.test(value)) return "success";
  if (/failure|fail|failed|error/.test(value)) return "failure";
  if (/cancel/.test(value)) return "cancelled";
  if (/skip/.test(value)) return "skipped";
  return "unknown";
}

function durationSummary(startedAt: string, completedAt: string): string {
  if (!startedAt || !completedAt) return "unknown";
  const started = new Date(startedAt).getTime();
  const completed = new Date(completedAt).getTime();
  if (!Number.isFinite(started) || !Number.isFinite(completed) || completed < started) return "unknown";
  const seconds = Math.round((completed - started) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return remainder ? `${minutes}m ${remainder}s` : `${minutes}m`;
}

function warningsFor(summary: ReleaseSignalSummary, conclusion: ReleaseSignalConclusion, gitContext: GitContext): string[] {
  const warnings: string[] = [];
  const runUrl = normalize(summary.runUrl);
  const commitSha = normalize(summary.commitSha);
  const branch = normalize(summary.branch);

  if (conclusion === "failure") warnings.push("Release signal failed; release gate should not pass without rerun evidence.");
  if (conclusion === "cancelled" || conclusion === "skipped") warnings.push("Release signal did not complete; release evidence is incomplete.");
  if (summary.logsRedacted !== true) warnings.push("Release signal summary must be redacted; raw logs should not be included.");
  if (!runUrl) warnings.push("Release signal run URL is missing; traceability is reduced but not blocked.");
  if (commitSha && commitSha !== "sample" && gitContext.currentCommit !== "unknown" && commitSha !== gitContext.currentCommit) {
    warnings.push("Release signal commit SHA does not match Git Context current commit.");
  }
  if (branch && gitContext.currentBranch !== "unknown" && branch !== gitContext.currentBranch) {
    warnings.push(`Release signal branch does not match Git Context branch: ${branch} != ${gitContext.currentBranch}.`);
  }

  return [...new Set(warnings)].sort();
}

function trustSummary(conclusion: ReleaseSignalConclusion, warnings: string[]): string {
  if (conclusion === "success" && !warnings.length) return "Release signal completed successfully and is redacted.";
  if (conclusion === "success") return "Release signal succeeded, but warnings require review.";
  if (conclusion === "failure") return "Release signal failed; rerun evidence is required before release confidence can pass.";
  if (conclusion === "cancelled" || conclusion === "skipped") return "Release signal evidence is incomplete because the run did not complete.";
  return "No release signal was provided; release signal confidence is unknown.";
}

export function loadReleaseSignalSummary(releaseSignalsPath: string | undefined): {
  summary: ReleaseSignalSummary | null;
  resolvedPath?: string;
} {
  if (!releaseSignalsPath) return { summary: null };

  const resolvedPath = path.resolve(process.cwd(), releaseSignalsPath);
  if (!existsSync(resolvedPath) || !statSync(resolvedPath).isFile()) {
    throw new Error(`Release signals file does not exist: ${resolvedPath}`);
  }

  const parsed = JSON.parse(readFileSync(resolvedPath, "utf8")) as ReleaseSignalSummary;
  return { summary: parsed, resolvedPath };
}

export function evaluateReleaseSignals(summary: ReleaseSignalSummary | null, gitContext: GitContext, releaseSignalsPath?: string): ReleaseSignals {
  if (!summary) {
    return {
      releaseSignalProvider: "none",
      workflowName: "none",
      runId: "none",
      runUrl: "none",
      commitSha: "unknown",
      branch: "unknown",
      signalStatus: "unknown",
      signalConclusion: "unknown",
      startedAt: "unknown",
      completedAt: "unknown",
      durationSummary: "unknown",
      logsRedacted: false,
      releaseSignalWarnings: [],
      releaseSignalTrustSummary: "No release signal was provided; release signal confidence is unknown.",
    };
  }

  const signalConclusion = normalizeConclusion(normalize(summary.conclusion));
  const startedAt = normalize(summary.startedAt) || "unknown";
  const completedAt = normalize(summary.completedAt) || "unknown";
  const releaseSignalWarnings = warningsFor(summary, signalConclusion, gitContext);

  return {
    releaseSignalProvider: normalize(summary.provider) || "unknown",
    workflowName: normalize(summary.workflowName) || "unknown",
    runId: normalize(summary.runId) || "unknown",
    runUrl: normalize(summary.runUrl) || "none",
    commitSha: normalize(summary.commitSha) || "unknown",
    branch: normalize(summary.branch) || "unknown",
    signalStatus: normalize(summary.status) || "unknown",
    signalConclusion,
    startedAt,
    completedAt,
    durationSummary: durationSummary(startedAt, completedAt),
    logsRedacted: summary.logsRedacted === true,
    releaseSignalWarnings,
    releaseSignalTrustSummary: trustSummary(signalConclusion, releaseSignalWarnings),
    releaseSignalsPath,
  };
}
