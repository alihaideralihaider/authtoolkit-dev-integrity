export type ApiIntakeSource =
  | "github-app"
  | "cli"
  | "slack"
  | "external-agent"
  | "manual";

export type ApiIntakeMode =
  | "local-dev"
  | "staging"
  | "production-strict";

export type ApiIntakeRequestedOutput =
  | "markdown-report"
  | "catalog-entry"
  | "dashboard-update"
  | "pr-comment-draft";

export type ApiIntakeReviewRequest = {
  requestId: string;
  source: ApiIntakeSource;
  mode: ApiIntakeMode;
  repo: {
    name: string;
    path: string;
    provider: string;
    remoteUrl: string;
  };
  git: {
    baseBranch: string;
    headBranch: string;
    commitSha: string;
    prNumber: string;
    prUrl: string;
  };
  ticket?: {
    provider: string;
    key: string;
    url: string;
    summary: string;
  };
  signals: {
    releaseSignalsPath?: string;
    cicdSummaryPath?: string;
    githubChecks?: "read-only-optional";
    githubActions?: "read-only-optional";
  };
  requestedOutputs: ApiIntakeRequestedOutput[];
};

export type ApiIntakeReviewResponse = {
  requestId: string;
  accepted: boolean;
  status: "ready-for-local-review" | "rejected-invalid-request";
  recommendedCommand?: string;
  expectedArtifacts: string[];
  safetyNotes: string[];
};

export function isApiIntakeReviewRequest(value: unknown): value is ApiIntakeReviewRequest {
  if (!value || typeof value !== "object") return false;
  const request = value as Partial<ApiIntakeReviewRequest>;

  return Boolean(
    request.requestId &&
    request.source &&
    request.mode &&
    request.repo?.name &&
    request.repo?.path &&
    request.git?.baseBranch &&
    request.signals &&
    Array.isArray(request.requestedOutputs),
  );
}
