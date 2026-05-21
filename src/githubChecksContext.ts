export type NormalizedCheckStatus = "passed" | "failed" | "pending" | "skipped" | "unknown";

export type GitHubChecksContextInput = {
  githubRepo?: string;
  githubPr?: string;
  githubTokenEnv?: string;
};

export type GitHubChecksContext = {
  githubRepo: string;
  githubPrNumber: string;
  prState: string;
  prTitle: string;
  prUrl: string;
  baseRef: string;
  headRef: string;
  headSha: string;
  mergeableState: string;
  reviewDecision: string;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  pendingChecks: number;
  skippedChecks: number;
  requiredChecksUnknown: boolean;
  failedCheckNames: string[];
  pendingCheckNames: string[];
  successfulCheckNames: string[];
  githubChecksWarnings: string[];
  githubChecksTrustSummary: string;
};

type GitHubPull = {
  state?: string;
  title?: string;
  html_url?: string;
  mergeable_state?: string;
  mergeable?: boolean | null;
  base?: { ref?: string };
  head?: { ref?: string; sha?: string };
};

type GitHubCheckRun = {
  name?: string;
  status?: string;
  conclusion?: string | null;
};

type GitHubCheckRunsResponse = {
  check_runs?: GitHubCheckRun[];
};

type GitHubStatus = {
  context?: string;
  state?: string;
};

type GitHubStatusResponse = {
  statuses?: GitHubStatus[];
};

function emptyContext(warnings: string[] = []): GitHubChecksContext {
  return {
    githubRepo: "none",
    githubPrNumber: "none",
    prState: "unknown",
    prTitle: "unknown",
    prUrl: "unknown",
    baseRef: "unknown",
    headRef: "unknown",
    headSha: "unknown",
    mergeableState: "unknown",
    reviewDecision: "unknown",
    totalChecks: 0,
    passedChecks: 0,
    failedChecks: 0,
    pendingChecks: 0,
    skippedChecks: 0,
    requiredChecksUnknown: true,
    failedCheckNames: [],
    pendingCheckNames: [],
    successfulCheckNames: [],
    githubChecksWarnings: warnings,
    githubChecksTrustSummary: warnings.length ? "GitHub Checks Context is incomplete; review warnings before relying on GitHub state." : "GitHub Checks Context was not requested.",
  };
}

function shouldLoad(input: GitHubChecksContextInput): boolean {
  return Boolean(input.githubRepo || input.githubPr || input.githubTokenEnv);
}

function normalizeStatus(status: string | undefined, conclusion: string | null | undefined): NormalizedCheckStatus {
  const normalizedStatus = (status || "").toLowerCase();
  const normalizedConclusion = (conclusion || "").toLowerCase();

  if (normalizedStatus && normalizedStatus !== "completed") return "pending";
  if (["success", "neutral"].includes(normalizedConclusion)) return "passed";
  if (normalizedConclusion === "skipped") return "skipped";
  if (["failure", "timed_out", "action_required", "cancelled"].includes(normalizedConclusion)) return "failed";
  if (["pending", "queued", "in_progress"].includes(normalizedStatus)) return "pending";
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
    throw new Error(`GitHub API request failed with status ${response.status}`);
  }

  return await response.json() as T;
}

function countByStatus(checks: Array<{ name: string; status: NormalizedCheckStatus }>): Pick<GitHubChecksContext, "passedChecks" | "failedChecks" | "pendingChecks" | "skippedChecks" | "failedCheckNames" | "pendingCheckNames" | "successfulCheckNames"> {
  return {
    passedChecks: checks.filter((check) => check.status === "passed").length,
    failedChecks: checks.filter((check) => check.status === "failed").length,
    pendingChecks: checks.filter((check) => check.status === "pending").length,
    skippedChecks: checks.filter((check) => check.status === "skipped").length,
    failedCheckNames: checks.filter((check) => check.status === "failed").map((check) => check.name).sort(),
    pendingCheckNames: checks.filter((check) => check.status === "pending").map((check) => check.name).sort(),
    successfulCheckNames: checks.filter((check) => check.status === "passed").map((check) => check.name).sort(),
  };
}

function warningsFor(input: {
  pull: GitHubPull;
  failedCheckNames: string[];
  pendingCheckNames: string[];
  reviewDecision: string;
  mergeableState: string;
}): string[] {
  const warnings: string[] = [];

  if (input.failedCheckNames.length) warnings.push("Failed GitHub checks require evidence-review and rerun evidence.");
  if (input.pendingCheckNames.length) warnings.push("Pending GitHub checks mean release should not be treated as ready.");
  if (/review_required|changes_requested|required/i.test(input.reviewDecision)) warnings.push("GitHub review state indicates review is still required or not approved.");
  if (/blocked|dirty|unknown/i.test(input.mergeableState)) warnings.push(`GitHub mergeable state requires review: ${input.mergeableState}.`);
  if (input.pull.state === "closed" && input.failedCheckNames.length) warnings.push("PR appears closed while failed checks exist; post-merge recovery/watch review may be required.");

  return [...new Set(warnings)].sort();
}

function trustSummary(context: Pick<GitHubChecksContext, "failedChecks" | "pendingChecks" | "totalChecks" | "reviewDecision" | "mergeableState">): string {
  if (context.failedChecks > 0) return "GitHub checks failed; rerun evidence and targeted review are required.";
  if (context.pendingChecks > 0) return "GitHub checks are pending; release trust is incomplete.";
  if (/review_required|changes_requested|required/i.test(context.reviewDecision)) return "GitHub review decision indicates review is still required.";
  if (/blocked|dirty|unknown/i.test(context.mergeableState)) return "GitHub mergeability is not clean; merge review is required.";
  if (context.totalChecks > 0) return "GitHub checks are passing based on read-only API data.";
  return "No GitHub checks were found; required checks are unknown.";
}

export async function collectGitHubChecksContext(input: GitHubChecksContextInput): Promise<GitHubChecksContext> {
  if (!shouldLoad(input)) return emptyContext();

  const missingFlags = [
    !input.githubRepo ? "--github-repo" : "",
    !input.githubPr ? "--github-pr" : "",
    !input.githubTokenEnv ? "--github-token-env" : "",
  ].filter(Boolean);
  if (missingFlags.length) {
    return emptyContext([`GitHub Checks Context requires all GitHub flags. Missing: ${missingFlags.join(", ")}.`]);
  }

  const token = process.env[input.githubTokenEnv as string];
  if (!token) {
    return {
      ...emptyContext([`GitHub token env var is not set: ${input.githubTokenEnv}. GitHub API was not called.`]),
      githubRepo: input.githubRepo as string,
      githubPrNumber: input.githubPr as string,
    };
  }

  try {
    const repo = input.githubRepo as string;
    const prNumber = input.githubPr as string;
    const pull = await githubGet<GitHubPull>(`/repos/${repo}/pulls/${prNumber}`, token);
    const headSha = pull.head?.sha || "unknown";
    const checkRuns = headSha === "unknown"
      ? { check_runs: [] }
      : await githubGet<GitHubCheckRunsResponse>(`/repos/${repo}/commits/${headSha}/check-runs`, token);
    const statusResponse = headSha === "unknown"
      ? { statuses: [] }
      : await githubGet<GitHubStatusResponse>(`/repos/${repo}/commits/${headSha}/status`, token);
    const checks = [
      ...(checkRuns.check_runs || []).map((check) => ({
        name: check.name || "unnamed check",
        status: normalizeStatus(check.status, check.conclusion),
      })),
      ...(statusResponse.statuses || []).map((status) => ({
        name: status.context || "unnamed status",
        status: normalizeStatus(status.state, status.state === "success" ? "success" : status.state),
      })),
    ];
    const counts = countByStatus(checks);
    const mergeableState = pull.mergeable_state || (pull.mergeable === true ? "clean" : "unknown");
    const reviewDecision = "unknown";
    const warnings = warningsFor({
      pull,
      failedCheckNames: counts.failedCheckNames,
      pendingCheckNames: counts.pendingCheckNames,
      reviewDecision,
      mergeableState,
    });

    const context: GitHubChecksContext = {
      githubRepo: repo,
      githubPrNumber: prNumber,
      prState: pull.state || "unknown",
      prTitle: pull.title || "unknown",
      prUrl: pull.html_url || "unknown",
      baseRef: pull.base?.ref || "unknown",
      headRef: pull.head?.ref || "unknown",
      headSha,
      mergeableState,
      reviewDecision,
      totalChecks: checks.length,
      requiredChecksUnknown: true,
      githubChecksWarnings: warnings,
      ...counts,
      githubChecksTrustSummary: "",
    };
    return {
      ...context,
      githubChecksTrustSummary: trustSummary(context),
    };
  } catch (error) {
    return {
      ...emptyContext([`GitHub Checks Context could not be loaded: ${error instanceof Error ? error.message : String(error)}.`]),
      githubRepo: input.githubRepo as string,
      githubPrNumber: input.githubPr as string,
    };
  }
}
