import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { ReportCatalogEntry } from "./reportCatalog.ts";
import type { EvidenceTimeline } from "./evidenceTimeline.ts";

export type TrendValue = "improving" | "stable" | "degrading" | "volatile";
export type ControlRoomTrend = "mostly-green" | "mixed" | "mostly-orange" | "mostly-red";
export type OperationalDecisionTrend = "mostly-trusted" | "mostly-caution" | "mostly-high-risk" | "mostly-blocked";

export type OperationalTimelineSummary = {
  recentTrendSummary: string;
  repeatedRiskDrivers: string[];
  repeatedWorkflowPatterns: string[];
  repeatedBlockingFactors: string[];
  confidenceTrend: TrendValue;
  controlRoomTrend: ControlRoomTrend;
  operationalDecisionTrend: OperationalDecisionTrend;
  driftTrendSummary: string;
  recommendedOperationalFocus: string;
};

type TimelineWithEntry = {
  entry: ReportCatalogEntry;
  timeline?: EvidenceTimeline;
};

function catalogPath(repoRoot: string): string {
  return path.join(repoRoot, "reports", "catalog.json");
}

function timelineSummaryPath(repoRoot: string): string {
  return path.join(repoRoot, "reports", "timeline-summary.md");
}

function loadCatalog(repoRoot: string): ReportCatalogEntry[] {
  const filePath = catalogPath(repoRoot);
  if (!existsSync(filePath)) return [];

  try {
    const parsed = JSON.parse(readFileSync(filePath, "utf8"));
    return Array.isArray(parsed) ? parsed as ReportCatalogEntry[] : [];
  } catch {
    return [];
  }
}

function loadTimeline(repoRoot: string, timelinePath: string): EvidenceTimeline | undefined {
  const filePath = path.join(repoRoot, timelinePath);
  if (!existsSync(filePath)) return undefined;

  try {
    return JSON.parse(readFileSync(filePath, "utf8")) as EvidenceTimeline;
  } catch {
    return undefined;
  }
}

function countValues(values: string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const value of values) {
    counts.set(value, (counts.get(value) || 0) + 1);
  }
  return counts;
}

function repeated(values: string[]): string[] {
  return [...countValues(values).entries()]
    .filter(([, count]) => count > 1)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([value, count]) => `${value} (${count} recent runs)`);
}

function confidenceTrend(entries: ReportCatalogEntry[]): TrendValue {
  if (entries.length < 3) return "stable";

  const newest = entries[0]?.confidenceScore ?? 0;
  const oldest = entries[entries.length - 1]?.confidenceScore ?? 0;
  const deltas = entries.slice(0, -1).map((entry, index) => entry.confidenceScore - entries[index + 1].confidenceScore);
  const hasPositive = deltas.some((delta) => delta > 5);
  const hasNegative = deltas.some((delta) => delta < -5);

  if (hasPositive && hasNegative) return "volatile";
  if (newest > oldest + 5) return "improving";
  if (newest < oldest - 5) return "degrading";
  return "stable";
}

function controlRoomTrend(entries: ReportCatalogEntry[]): ControlRoomTrend {
  const counts = countValues(entries.map((entry) => entry.controlRoomStatus));
  const total = Math.max(entries.length, 1);

  if ((counts.get("green") || 0) / total >= 0.6) return "mostly-green";
  if ((counts.get("red") || 0) / total >= 0.6) return "mostly-red";
  if ((counts.get("orange") || 0) / total >= 0.6) return "mostly-orange";
  return "mixed";
}

function operationalDecisionTrend(entries: ReportCatalogEntry[]): OperationalDecisionTrend {
  const counts = countValues(entries.map((entry) => entry.overallIntegrityDecision));
  const total = Math.max(entries.length, 1);
  const trusted = (counts.get("trusted") || 0) + (counts.get("trusted-with-review") || 0);

  if (trusted / total >= 0.6) return "mostly-trusted";
  if ((counts.get("blocked") || 0) / total >= 0.6) return "mostly-blocked";
  if ((counts.get("high-risk") || 0) / total >= 0.6) return "mostly-high-risk";
  return "mostly-caution";
}

function riskDrivers(items: TimelineWithEntry[]): string[] {
  const drivers: string[] = [];

  for (const item of items) {
    const timeline = item.timeline;
    const combinedText = [
      ...(timeline?.unresolvedRisks || []),
      ...(timeline?.unresolvedWarnings || []),
      ...(timeline?.evidenceItems.riskCombinations || []),
      item.entry.overallIntegrityDecision,
    ].join(" ").toLowerCase();

    if (timeline?.layerSummaries?.architecture?.blastRadius === "critical" || combinedText.includes("critical blast radius")) {
      drivers.push("critical blast radius");
    }
    if (timeline?.layerSummaries?.build?.buildPosture === "failed") {
      drivers.push("failed build");
    }
    if (["escalation-required", "policy-blocked"].includes(timeline?.layerSummaries?.policy?.policyPosture || "")) {
      drivers.push("policy escalation");
    }
    if (combinedText.includes("payment") && (combinedText.includes("trust") || combinedText.includes("webhook"))) {
      drivers.push("payment trust boundary");
    }
    if (combinedText.includes("runtime") && (combinedText.includes("vault") || combinedText.includes("secret") || combinedText.includes("config"))) {
      drivers.push("runtime/Vault coupling");
    }
    if (combinedText.includes("rollback") && (combinedText.includes("missing") || combinedText.includes("incomplete") || combinedText.includes("evidence"))) {
      drivers.push("missing rollback evidence");
    }
    if (["difficult-recovery", "high-risk-recovery", "unknown-recovery"].includes(timeline?.layerSummaries?.recovery?.recoveryPosture || "")) {
      drivers.push("recovery risk");
    }
    if ((timeline?.layerSummaries?.agent?.authorshipSignalsCount || 0) > 0 || (timeline?.layerSummaries?.agent?.automationSignalsCount || 0) > 0) {
      drivers.push("agent-sensitive changes");
    }
  }

  return repeated(drivers);
}

function blockingFactors(items: TimelineWithEntry[]): string[] {
  const factors = items.flatMap((item) => [
    ...(item.timeline?.unresolvedRisks || []),
    ...(item.timeline?.unresolvedWarnings || []),
  ]);

  return repeated(factors).slice(0, 8);
}

function repeatedWorkflows(entries: ReportCatalogEntry[]): string[] {
  return repeated(entries.flatMap((entry) => entry.activeWorkflows));
}

function driftSummary(items: TimelineWithEntry[]): string {
  const driftNotes = items.flatMap((item) => item.timeline?.auditNotes || []);
  const text = driftNotes.join(" ").toLowerCase();

  if (text.includes("runtime") && text.includes("required")) {
    return "Runtime drift needs continued operator review across recent runs.";
  }
  if (text.includes("evidence") && text.includes("incomplete")) {
    return "Evidence drift repeatedly remained incomplete across recent runs.";
  }
  if (text.includes("rollback")) {
    return "Recovery drift requires continued rollback validation.";
  }
  return "Layer drift remained stable or insufficiently evidenced in recent runs.";
}

function recentTrend(entries: ReportCatalogEntry[], summary: Pick<OperationalTimelineSummary, "confidenceTrend" | "controlRoomTrend" | "operationalDecisionTrend" | "repeatedRiskDrivers">): string {
  if (summary.controlRoomTrend === "mostly-red" || summary.operationalDecisionTrend === "mostly-blocked") {
    return "Operational trust remained unstable across recent runs.";
  }
  if (summary.repeatedRiskDrivers.some((driver) => driver.startsWith("critical blast radius"))) {
    return "Critical blast radius repeatedly appeared in recent reviews.";
  }
  if (summary.confidenceTrend === "improving" && ["mostly-green", "mixed"].includes(summary.controlRoomTrend)) {
    return "Recent runs stabilized after evidence and release posture improvements.";
  }
  if (entries.length <= 1) {
    return "Only one recent run is available; trend confidence is limited.";
  }
  return "Recent operational posture is mixed and should be reviewed before relying on trend direction.";
}

function recommendedFocus(summary: Pick<OperationalTimelineSummary, "repeatedRiskDrivers" | "repeatedWorkflowPatterns" | "confidenceTrend" | "controlRoomTrend">): string {
  const joinedDrivers = summary.repeatedRiskDrivers.join(" ").toLowerCase();
  const joinedWorkflows = summary.repeatedWorkflowPatterns.join(" ").toLowerCase();

  if (joinedDrivers.includes("critical blast radius") || joinedWorkflows.includes("escalation-review")) {
    return "Focus on reducing blast radius and completing evidence workflows.";
  }
  if (joinedDrivers.includes("recovery risk") || joinedWorkflows.includes("recovery-review")) {
    return "Focus on stabilizing runtime/recovery posture.";
  }
  if (joinedWorkflows.includes("escalation-review")) {
    return "Focus on reducing repeated escalation-review routing.";
  }
  if (summary.confidenceTrend === "volatile" || summary.confidenceTrend === "degrading") {
    return "Focus on build/release trust consistency.";
  }
  return "Focus on keeping report evidence current and clearing repeated workflow routing.";
}

function buildMarkdown(summary: OperationalTimelineSummary): string {
  const list = (values: string[]) => values.length ? values.map((value) => `- ${value}`).join("\n") : "- none";

  return `# Operational Timeline Summary

## Summary

- Recent trend: ${summary.recentTrendSummary}
- Confidence trend: ${summary.confidenceTrend}
- Control room trend: ${summary.controlRoomTrend}
- Operational decision trend: ${summary.operationalDecisionTrend}
- Drift trend: ${summary.driftTrendSummary}
- Recommended operational focus: ${summary.recommendedOperationalFocus}

## Repeated Risk Drivers

${list(summary.repeatedRiskDrivers)}

## Repeated Workflow Patterns

${list(summary.repeatedWorkflowPatterns)}

## Repeated Blocking Factors

${list(summary.repeatedBlockingFactors)}
`;
}

export function updateOperationalTimelineSummary(repoRoot: string): OperationalTimelineSummary {
  const entries = loadCatalog(repoRoot)
    .sort((a, b) => b.generatedAt.localeCompare(a.generatedAt))
    .slice(0, 10);
  const items = entries.map((entry) => ({ entry, timeline: loadTimeline(repoRoot, entry.timelinePath) }));
  const base = {
    repeatedRiskDrivers: riskDrivers(items),
    repeatedWorkflowPatterns: repeatedWorkflows(entries),
    repeatedBlockingFactors: blockingFactors(items),
    confidenceTrend: confidenceTrend(entries),
    controlRoomTrend: controlRoomTrend(entries),
    operationalDecisionTrend: operationalDecisionTrend(entries),
    driftTrendSummary: driftSummary(items),
  };
  const summary: OperationalTimelineSummary = {
    ...base,
    recentTrendSummary: recentTrend(entries, base),
    recommendedOperationalFocus: recommendedFocus(base),
  };

  writeFileSync(timelineSummaryPath(repoRoot), buildMarkdown(summary));
  return summary;
}
