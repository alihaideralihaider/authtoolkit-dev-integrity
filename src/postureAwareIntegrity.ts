import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import type { EvidenceTimeline } from "./evidenceTimeline.ts";

export type IntegrityTrend = "improving" | "stable" | "degrading" | "critical-degrading";

export type PostureAwareIntegrityResult = {
  postureTransitions: string[];
  integrityTrend: IntegrityTrend;
  degradationSignals: string[];
  stabilizationSignals: string[];
  recoverySignals: string[];
  escalationWarnings: string[];
  postureSummary: string;
  recommendedPostureAction: string;
  previousTimelineId?: string;
  previousTimelinePath?: string;
};

type TimelineWithPath = {
  timeline: EvidenceTimeline;
  filePath: string;
};

const severityRank: Record<string, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

const releaseRank: Record<string, number> = {
  ready: 1,
  caution: 2,
  blocked: 3,
};

const runtimeRank: Record<string, number> = {
  stable: 1,
  watch: 2,
  "degraded-risk": 3,
  "rollback-watch": 4,
};

function repoRoot(): string {
  return path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
}

function unique(values: string[]): string[] {
  return [...new Set(values)].sort();
}

function timelineDir(): string {
  return path.join(repoRoot(), "reports", "timeline");
}

function readTimeline(filePath: string): EvidenceTimeline | null {
  try {
    const parsed = JSON.parse(readFileSync(filePath, "utf8"));
    if (!parsed || typeof parsed !== "object") return null;
    if (typeof parsed.repoPath !== "string") return null;
    if (!parsed.integritySnapshot || !parsed.postureSnapshot) return null;
    return parsed as EvidenceTimeline;
  } catch {
    return null;
  }
}

function previousTimelineForRepo(current: EvidenceTimeline): TimelineWithPath | null {
  const directory = timelineDir();
  if (!existsSync(directory) || !statSync(directory).isDirectory()) return null;

  const timelines = readdirSync(directory)
    .filter((fileName) => fileName.endsWith(".json"))
    .map((fileName) => path.join(directory, fileName))
    .map((filePath) => {
      const timeline = readTimeline(filePath);
      return timeline ? { timeline, filePath } : null;
    })
    .filter((entry): entry is TimelineWithPath => Boolean(entry))
    .filter((entry) => entry.timeline.repoPath === current.repoPath)
    .filter((entry) => entry.timeline.timelineId !== current.timelineId)
    .filter((entry) => entry.timeline.generatedAt < current.generatedAt)
    .sort((a, b) => b.timeline.generatedAt.localeCompare(a.timeline.generatedAt));

  return timelines[0] || null;
}

function compareNumber(
  label: string,
  previous: number,
  current: number,
  increasedSignal: string,
  decreasedSignal: string
): {
  transitions: string[];
  degradation: string[];
  recovery: string[];
  stabilization: string[];
} {
  if (current > previous) {
    return {
      transitions: [`${label} increased from ${previous} to ${current}.`],
      degradation: [],
      recovery: [increasedSignal],
      stabilization: [],
    };
  }
  if (current < previous) {
    return {
      transitions: [`${label} decreased from ${previous} to ${current}.`],
      degradation: [decreasedSignal],
      recovery: [],
      stabilization: [],
    };
  }
  return {
    transitions: [`${label} unchanged at ${current}.`],
    degradation: [],
    recovery: [],
    stabilization: [`${label} remained stable.`],
  };
}

function compareRank(
  label: string,
  previous: string,
  current: string,
  rank: Record<string, number>,
  worseSignal: string,
  betterSignal: string
): {
  transitions: string[];
  degradation: string[];
  recovery: string[];
  stabilization: string[];
} {
  const previousRank = rank[previous] ?? 0;
  const currentRank = rank[current] ?? 0;

  if (currentRank > previousRank) {
    return {
      transitions: [`${label} moved from ${previous} to ${current}.`],
      degradation: [worseSignal],
      recovery: [],
      stabilization: [],
    };
  }
  if (currentRank < previousRank) {
    return {
      transitions: [`${label} moved from ${previous} to ${current}.`],
      degradation: [],
      recovery: [betterSignal],
      stabilization: [],
    };
  }
  return {
    transitions: [`${label} stayed ${current}.`],
    degradation: [],
    recovery: [],
    stabilization: [`${label} remained stable.`],
  };
}

function hasNewValue(previous: string[], current: string[], pattern: RegExp): boolean {
  const previousMatches = new Set(previous.filter((value) => pattern.test(value)));
  return current.some((value) => pattern.test(value) && !previousMatches.has(value));
}

function countNewValues(previous: string[], current: string[]): number {
  const previousValues = new Set(previous);
  return current.filter((value) => !previousValues.has(value)).length;
}

function trendFor(input: {
  criticalDegrading: boolean;
  degradationSignals: string[];
  recoverySignals: string[];
}): IntegrityTrend {
  if (input.criticalDegrading) return "critical-degrading";
  if (input.degradationSignals.length > input.recoverySignals.length) return "degrading";
  if (input.recoverySignals.length > input.degradationSignals.length) return "improving";
  return "stable";
}

function summaryFor(trend: IntegrityTrend, previous: EvidenceTimeline | null): string {
  if (!previous) {
    return "No previous timeline snapshot exists for this repo, so posture comparison starts from this run.";
  }
  if (trend === "critical-degrading") {
    return "Integrity posture critically degraded compared with the previous run.";
  }
  if (trend === "degrading") {
    return "Integrity posture degraded compared with the previous run.";
  }
  if (trend === "improving") {
    return "Integrity posture improved compared with the previous run.";
  }
  return "Integrity posture is stable compared with the previous run.";
}

function actionFor(trend: IntegrityTrend): string {
  if (trend === "critical-degrading") {
    return "Stop merge or release work until the new critical posture change is reviewed and resolved.";
  }
  if (trend === "degrading") {
    return "Run targeted review for the new degradation signals before merge or release.";
  }
  if (trend === "improving") {
    return "Confirm recovery evidence is attached and keep monitoring until posture remains stable.";
  }
  return "Continue normal review flow and preserve the timeline evidence.";
}

export function evaluatePostureAwareIntegrity(
  current: EvidenceTimeline
): PostureAwareIntegrityResult {
  const previousEntry = previousTimelineForRepo(current);
  const previous = previousEntry?.timeline || null;

  if (!previous) {
    return {
      postureTransitions: ["No previous timeline snapshot found for this repo."],
      integrityTrend: "stable",
      degradationSignals: [],
      stabilizationSignals: ["Posture baseline established."],
      recoverySignals: [],
      escalationWarnings: [],
      postureSummary: summaryFor("stable", previous),
      recommendedPostureAction: actionFor("stable"),
    };
  }

  const transitions: string[] = [];
  const degradationSignals: string[] = [];
  const stabilizationSignals: string[] = [];
  const recoverySignals: string[] = [];
  const escalationWarnings: string[] = [];

  const confidence = compareNumber(
    "Confidence",
    previous.integritySnapshot.confidenceScore,
    current.integritySnapshot.confidenceScore,
    "Confidence recovered.",
    "Confidence decreased."
  );
  transitions.push(...confidence.transitions);
  degradationSignals.push(...confidence.degradation);
  recoverySignals.push(...confidence.recovery);
  stabilizationSignals.push(...confidence.stabilization);

  const severity = compareRank(
    "Highest severity",
    previous.integritySnapshot.highestSeverity,
    current.integritySnapshot.highestSeverity,
    severityRank,
    "Severity increased.",
    "Severity decreased."
  );
  transitions.push(...severity.transitions);
  degradationSignals.push(...severity.degradation);
  recoverySignals.push(...severity.recovery);
  stabilizationSignals.push(...severity.stabilization);

  const release = compareRank(
    "Release decision",
    previous.integritySnapshot.releaseDecision,
    current.integritySnapshot.releaseDecision,
    releaseRank,
    "Release moved toward caution or block.",
    "Release moved toward ready."
  );
  transitions.push(...release.transitions);
  degradationSignals.push(...release.degradation);
  recoverySignals.push(...release.recovery);
  stabilizationSignals.push(...release.stabilization);

  const runtime = compareRank(
    "Runtime posture",
    previous.integritySnapshot.runtimePosture,
    current.integritySnapshot.runtimePosture,
    runtimeRank,
    "Runtime moved toward degraded-risk.",
    "Runtime posture improved."
  );
  transitions.push(...runtime.transitions);
  degradationSignals.push(...runtime.degradation);
  recoverySignals.push(...runtime.recovery);
  stabilizationSignals.push(...runtime.stabilization);

  if (previous.integritySnapshot.mergeReadiness !== current.integritySnapshot.mergeReadiness) {
    transitions.push(`Merge readiness moved from ${previous.integritySnapshot.mergeReadiness} to ${current.integritySnapshot.mergeReadiness}.`);
  } else {
    transitions.push(`Merge readiness stayed ${current.integritySnapshot.mergeReadiness}.`);
    stabilizationSignals.push("Merge readiness remained stable.");
  }

  const previousPacks = previous.reviewSummary.selectedReviewPacks;
  const currentPacks = current.reviewSummary.selectedReviewPacks;
  if (currentPacks.length > previousPacks.length) {
    degradationSignals.push("Review packs increased.");
    transitions.push(`Review pack count increased from ${previousPacks.length} to ${currentPacks.length}.`);
  } else if (currentPacks.length < previousPacks.length) {
    recoverySignals.push("Review pack scope reduced.");
    transitions.push(`Review pack count decreased from ${previousPacks.length} to ${currentPacks.length}.`);
  } else {
    stabilizationSignals.push("Review pack count remained stable.");
    transitions.push(`Review pack count unchanged at ${currentPacks.length}.`);
  }

  const previousRisks = previous.unresolvedRisks;
  const currentRisks = current.unresolvedRisks;
  const newRiskCount = countNewValues(previousRisks, currentRisks);
  if (newRiskCount > 0) {
    degradationSignals.push("New unresolved risks introduced.");
    transitions.push(`New unresolved risks introduced: ${newRiskCount}.`);
  }
  if (currentRisks.length < previousRisks.length) {
    recoverySignals.push("Unresolved risks reduced.");
  } else if (currentRisks.length === previousRisks.length) {
    stabilizationSignals.push("Unresolved risk count remained stable.");
  }

  const blockedIntroduced = current.integritySnapshot.mergeReadiness === "blocked"
    && previous.integritySnapshot.mergeReadiness !== "blocked";
  const releaseBlockedIntroduced = current.integritySnapshot.releaseDecision === "blocked"
    && previous.integritySnapshot.releaseDecision !== "blocked";
  const rollbackWatchIntroduced = current.integritySnapshot.runtimePosture === "rollback-watch"
    && previous.integritySnapshot.runtimePosture !== "rollback-watch";
  const criticalDiffIntroduced = hasNewValue(
    previous.unresolvedRisks,
    current.unresolvedRisks,
    /critical diff-aware finding/i
  );
  const criticalCombinationIntroduced = hasNewValue(
    previous.unresolvedRisks,
    current.unresolvedRisks,
    /critical risk combination/i
  );

  if (blockedIntroduced || releaseBlockedIntroduced) {
    escalationWarnings.push("Critical release posture introduced.");
  }
  if (rollbackWatchIntroduced) {
    escalationWarnings.push("Rollback-watch posture newly introduced.");
  }
  if (criticalDiffIntroduced) {
    escalationWarnings.push("New critical diff-aware finding detected.");
  }
  if (criticalCombinationIntroduced) {
    escalationWarnings.push("New critical risk combination detected.");
  }
  if (!previousPacks.includes("security-pack") && currentPacks.includes("security-pack")) {
    escalationWarnings.push("Security review scope increased.");
  }
  if (!previousPacks.includes("runtime-pack") && currentPacks.includes("runtime-pack")) {
    escalationWarnings.push("Runtime drift exposure increased.");
  }
  if (previous.integritySnapshot.releaseDecision === "caution" && current.integritySnapshot.releaseDecision === "ready") {
    recoverySignals.push("Release caution cleared.");
  }

  const criticalDegrading = blockedIntroduced
    || releaseBlockedIntroduced
    || rollbackWatchIntroduced
    || criticalDiffIntroduced
    || criticalCombinationIntroduced;
  const integrityTrend = trendFor({
    criticalDegrading,
    degradationSignals,
    recoverySignals,
  });

  return {
    postureTransitions: unique(transitions),
    integrityTrend,
    degradationSignals: unique(degradationSignals),
    stabilizationSignals: unique(stabilizationSignals),
    recoverySignals: unique(recoverySignals),
    escalationWarnings: unique(escalationWarnings),
    postureSummary: summaryFor(integrityTrend, previous),
    recommendedPostureAction: actionFor(integrityTrend),
    previousTimelineId: previous.timelineId,
    previousTimelinePath: previousEntry ? path.relative(repoRoot(), previousEntry.filePath) : undefined,
  };
}
