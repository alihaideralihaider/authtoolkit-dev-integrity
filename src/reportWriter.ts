import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
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

function safeFileName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function buildReport(result: ReviewResult): string {
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

## Git Status Summary

\`\`\`text
${result.gitStatus || "clean"}
\`\`\`

## Git Diff Name-Only

\`\`\`text
${result.diffNameOnly || "none"}
\`\`\`

## Changed Files

${changedFileList(result)}

## Detected Risk Categories

${list(result.riskCategories)}

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
  mkdirSync(reportsDir, { recursive: true });

  const reportName = `${new Date().toISOString().replace(/[:.]/g, "-")}-${safeFileName(result.selectedSkill)}.md`;
  const reportPath = path.join(reportsDir, reportName);
  writeFileSync(reportPath, buildReport(result));

  return reportPath;
}
