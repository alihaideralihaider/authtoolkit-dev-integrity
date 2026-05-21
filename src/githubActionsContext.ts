export type GitHubActionsStatus = "passed" | "failed" | "pending" | "cancelled" | "skipped" | "unknown";

export type WorkflowRunSummary = {
  id: string;
  name: string;
  status: GitHubActionsStatus;
  conclusion: string;
  htmlUrl: string;
  durationSummary: string;
};

export type GitHubActionsContextInput = {
  enabled?: boolean;
  githubRepo?: string;
  githubPr?: string;
  githubTokenEnv?: string;
};

export type GitHubActionsContext = {
  actionsProvider: string;
  workflowRunsFound: number;
  workflowRunSummaries: WorkflowRunSummary[];
  failedWorkflowRuns: string[];
  successfulWorkflowRuns: string[];
  pendingWorkflowRuns: string[];
  cancelledWorkflowRuns: string[];
  failedJobs: string[];
  failedSteps: string[];
  longestRunDurationSummary: string;
  actionsArtifactRefs: string[];
  actionsWarnings: string[];
  actionsTrustSummary: string;
};

type GitHubPull = {
  head?: { sha?: string };
};

type GitHubWorkflowRun = {
  id?: number;
  name?: string;
  status?: string;
  conclusion?: string | null;
  html_url?: string;
  created_at?: string;
  updated_at?: string;
};

type GitHubWorkflowRunsResponse = {
  workflow_runs?: GitHubWorkflowRun[];
};

type GitHubActionsJobStep = {
  name?: string;
  status?: string;
  conclusion?: string | null;
};

type GitHubActionsJob = {
  name?: string;
  status?: string;
  conclusion?: string | null;
  steps?: GitHubActionsJobStep[];
};

type GitHubActionsJobsResponse = {
  jobs?: GitHubActionsJob[];
};

function emptyContext(warnings: string[] = []): GitHubActionsContext {
  return {
    actionsProvider: "none",
    workflowRunsFound: 0,
    workflowRunSummaries: [],
    failedWorkflowRuns: [],
    successfulWorkflowRuns: [],
    pendingWorkflowRuns: [],
    cancelledWorkflowRuns: [],
    failedJobs: [],
    failedSteps: [],
    longestRunDurationSummary: "unknown",
    actionsArtifactRefs: [],
    actionsWarnings: warnings,
    actionsTrustSummary: warnings.length ? "GitHub Actions Context is incomplete; review warnings before relying on workflow state." : "GitHub Actions Context was not requested.",
  };
}

function normalizeStatus(status: string | undefined, conclusion: string | null | undefined): GitHubActionsStatus {
  const normalizedStatus = (status || "").toLowerCase();
  const normalizedConclusion = (conclusion || "").toLowerCase();

  if (["queued", "requested", "waiting", "pending", "in_progress"].includes(normalizedStatus)) return "pending";
  if (normalizedStatus && normalizedStatus !== "completed") return "pending";
  if (["success", "neutral"].includes(normalizedConclusion)) return "passed";
  if (normalizedConclusion === "skipped") return "skipped";
  if (normalizedConclusion === "cancelled") return "cancelled";
  if (["failure", "timed_out", "action_required"].includes(normalizedConclusion)) return "failed";
  return "unknown";
}

async function githubGet<T>(path: string, token: string): Promise<T> {
  const response = await fetch(`https://api.github.com${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "User-Agent": "authtoolkit-dev-integrity-local-review",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub Actions API request failed with status ${response.status}`);
  }

  return await response.json() as T;
}

function durationSummary(run: GitHubWorkflowRun): string {
  if (!run.created_at || !run.updated_at) return "unknown";
  const started = new Date(run.created_at).getTime();
  const ended = new Date(run.updated_at).getTime();
  if (!Number.isFinite(started) || !Number.isFinite(ended) || ended < started) return "unknown";
  const seconds = Math.round((ended - started) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}m ${remainder}s`;
}

function durationSeconds(summary: string): number {
  const minuteMatch = summary.match(/(\d+)m\s+(\d+)s/);
  if (minuteMatch) return Number(minuteMatch[1]) * 60 + Number(minuteMatch[2]);
  const secondMatch = summary.match(/(\d+)s/);
  if (secondMatch) return Number(secondMatch[1]);
  return -1;
}

function trustSummary(context: Pick<GitHubActionsContext, "failedWorkflowRuns" | "failedJobs" | "pendingWorkflowRuns" | "cancelledWorkflowRuns" | "workflowRunsFound">): string {
  if (context.failedWorkflowRuns.length || context.failedJobs.length) return "GitHub Actions workflows or jobs failed; rerun evidence and targeted review are required.";
  if (context.pendingWorkflowRuns.length) return "GitHub Actions workflows are pending; release trust is incomplete.";
  if (context.cancelledWorkflowRuns.length) return "GitHub Actions workflows were cancelled; CI/CD evidence is incomplete.";
  if (context.workflowRunsFound > 0) return "GitHub Actions workflow metadata was read successfully and no failed or pending runs were detected.";
  return "No GitHub Actions workflow runs were found for the PR head SHA.";
}

function warningsFor(context: Pick<GitHubActionsContext, "failedWorkflowRuns" | "failedJobs" | "pendingWorkflowRuns" | "cancelledWorkflowRuns">): string[] {
  const warnings: string[] = [];
  if (context.failedWorkflowRuns.length || context.failedJobs.length) warnings.push("Failed GitHub Actions workflow or job requires evidence-review and rerun evidence.");
  if (context.pendingWorkflowRuns.length) warnings.push("Pending GitHub Actions workflow means release trust is incomplete.");
  if (context.cancelledWorkflowRuns.length) warnings.push("Cancelled GitHub Actions workflow means CI/CD evidence is incomplete.");
  if (context.failedJobs.some((job) => /coverage/i.test(job))) warnings.push("Failed coverage job requires coverage evidence.");
  if (context.failedJobs.some((job) => /security|semgrep|wiz/i.test(job))) warnings.push("Failed security job requires security review notes.");
  return [...new Set(warnings)].sort();
}

export async function collectGitHubActionsContext(input: GitHubActionsContextInput): Promise<GitHubActionsContext> {
  if (!input.enabled) return emptyContext();

  const missingFlags = [
    !input.githubRepo ? "--github-repo" : "",
    !input.githubPr ? "--github-pr" : "",
    !input.githubTokenEnv ? "--github-token-env" : "",
  ].filter(Boolean);
  if (missingFlags.length) {
    return emptyContext([`GitHub Actions Context requires GitHub repo, PR, and token env flags. Missing: ${missingFlags.join(", ")}.`]);
  }

  const token = process.env[input.githubTokenEnv as string];
  if (!token) {
    return emptyContext([`GitHub token env var is not set: ${input.githubTokenEnv}. GitHub Actions API was not called.`]);
  }

  try {
    const repo = input.githubRepo as string;
    const prNumber = input.githubPr as string;
    const pull = await githubGet<GitHubPull>(`/repos/${repo}/pulls/${prNumber}`, token);
    const headSha = pull.head?.sha || "unknown";
    if (headSha === "unknown") return emptyContext(["GitHub PR head SHA could not be determined; GitHub Actions API was not called."]);

    const runsResponse = await githubGet<GitHubWorkflowRunsResponse>(`/repos/${repo}/actions/runs?head_sha=${encodeURIComponent(headSha)}`, token);
    const runs = (runsResponse.workflow_runs || []).slice(0, 10);
    const summaries: WorkflowRunSummary[] = runs.map((run) => ({
      id: String(run.id || "unknown"),
      name: run.name || "unnamed workflow",
      status: normalizeStatus(run.status, run.conclusion),
      conclusion: run.conclusion || "unknown",
      htmlUrl: run.html_url || "unknown",
      durationSummary: durationSummary(run),
    }));

    const failedJobs = new Set<string>();
    const failedSteps = new Set<string>();
    for (const run of runs) {
      if (!run.id) continue;
      const jobsResponse = await githubGet<GitHubActionsJobsResponse>(`/repos/${repo}/actions/runs/${run.id}/jobs`, token);
      for (const job of jobsResponse.jobs || []) {
        const jobName = job.name || "unnamed job";
        if (normalizeStatus(job.status, job.conclusion) === "failed") failedJobs.add(jobName);
        for (const step of job.steps || []) {
          if (normalizeStatus(step.status, step.conclusion) === "failed") {
            failedSteps.add(`${jobName}: ${step.name || "unnamed step"}`);
          }
        }
      }
    }

    const failedWorkflowRuns = summaries.filter((run) => run.status === "failed").map((run) => run.name).sort();
    const successfulWorkflowRuns = summaries.filter((run) => run.status === "passed").map((run) => run.name).sort();
    const pendingWorkflowRuns = summaries.filter((run) => run.status === "pending").map((run) => run.name).sort();
    const cancelledWorkflowRuns = summaries.filter((run) => run.status === "cancelled").map((run) => run.name).sort();
    const longestRun = summaries
      .filter((run) => run.durationSummary !== "unknown")
      .sort((a, b) => durationSeconds(b.durationSummary) - durationSeconds(a.durationSummary))[0];
    const baseContext = {
      actionsProvider: "github-actions",
      workflowRunsFound: summaries.length,
      workflowRunSummaries: summaries,
      failedWorkflowRuns,
      successfulWorkflowRuns,
      pendingWorkflowRuns,
      cancelledWorkflowRuns,
      failedJobs: [...failedJobs].sort(),
      failedSteps: [...failedSteps].sort(),
      longestRunDurationSummary: longestRun ? `${longestRun.name}: ${longestRun.durationSummary}` : "unknown",
      actionsArtifactRefs: summaries.map((run) => `workflow-run:${run.id}`).sort(),
      actionsWarnings: [],
      actionsTrustSummary: "",
    } satisfies GitHubActionsContext;

    return {
      ...baseContext,
      actionsWarnings: warningsFor(baseContext),
      actionsTrustSummary: trustSummary(baseContext),
    };
  } catch (error) {
    return emptyContext([error instanceof Error ? error.message : String(error)]);
  }
}
