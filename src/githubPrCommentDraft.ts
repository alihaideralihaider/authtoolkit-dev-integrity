import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { ReviewResult } from "./reviewRunner.ts";

type GitHubPrCommentDraftInput = {
  result: ReviewResult;
  reportPath: string;
};

function repoRoot(): string {
  return path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
}

function list(values: string[]): string {
  if (!values.length) return "- none";
  return values.map((value) => `- ${value}`).join("\n");
}

function relativeReportPath(reportPath: string): string {
  return path.relative(repoRoot(), reportPath);
}

function buildDraft(input: GitHubPrCommentDraftInput): string {
  const result = input.result;
  return `## AuthToolkit Dev Integrity Review

**Control Room:** ${result.controlRoomOverview.controlRoomStatus}  
**Plain English:** ${result.controlRoomOverview.plainEnglishSummary}  
**PR readiness:** ${result.prContext.prReadinessLabel}  
**Decision:** ${result.integrityDecisionSummary.overallIntegrityDecision}  
**Trust:** ${result.integrityDecisionSummary.operationalTrustLevel}  
**Workflow priority:** ${result.workflowRoutingSummary.workflowPriority}

### Active Workflows

${list(result.workflowRoutingSummary.activeWorkflows)}

### Required Actions

${list(result.controlRoomOverview.requiredActions)}

### Required Evidence

${list(result.workflowRoutingSummary.workflowEvidenceNeeds)}

### Human Attention Areas

${list(result.controlRoomOverview.humanAttentionAreas)}

### Git Context

- Branch: ${result.gitContext.currentBranch}
- Base: ${result.gitContext.baseBranch}
- Commit: ${result.gitContext.currentCommit}

### CI/CD Context

- Provider: ${result.cicdContext.cicdProvider}
- Status: ${result.cicdContext.pipelineStatus}
- Run ID: ${result.cicdContext.pipelineRunId}

### Full Local Report

${relativeReportPath(input.reportPath)}

_Generated locally. Review before posting._
`;
}

export function writeGitHubPrCommentDraft(input: GitHubPrCommentDraftInput): string {
  const reportsDir = path.join(repoRoot(), "reports");
  mkdirSync(reportsDir, { recursive: true });

  const draftPath = path.join(reportsDir, "github-pr-comment.md");
  writeFileSync(draftPath, buildDraft(input));
  return draftPath;
}
