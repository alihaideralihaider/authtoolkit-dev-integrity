import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { spawn } from "node:child_process";
import { readFile, readdir, stat } from "node:fs/promises";
import { resolve } from "node:path";
import {
  type ApiIntakeReviewRequest,
  type ApiIntakeReviewResponse,
  isApiIntakeReviewRequest,
} from "./apiIntakeContract.ts";

const host = "127.0.0.1";
const port = Number(process.env.PORT || 8787);
const maxBodyBytes = 1024 * 1024;
const executionTimeoutMs = 5 * 60 * 1000;
const maxCapturedOutputBytes = 64 * 1024;
const maxSummaryLines = 20;

type InvalidIntakeResponse = {
  accepted: false;
  status: "rejected-invalid-request";
  errors: string[];
};

type DryRunResponse = {
  requestId: string;
  accepted: true;
  status: "dry-run-ready";
  wouldExecute: false;
  recommendedCommand: string;
  resolvedInputs: {
    repoPath: string;
    baseBranch: string;
    releaseSignalsPath: string;
    cicdSummaryPath: string;
    requestedOutputs: string[];
  };
  expectedArtifacts: string[];
  safetyNotes: string[];
};

type ExecuteResponse = {
  requestId: string;
  accepted: true;
  status: "review-executed";
  executed: true;
  command: string;
  exitCode: number;
  reportDetected: boolean;
  reportPath: string;
  stdoutSummary: string[];
  stderrSummary: string[];
  safetyNotes: string[];
};

type ExecuteFailureResponse = {
  requestId?: string;
  accepted: false;
  status: "review-failed";
  exitCode: number | null;
  errors: string[];
  stdoutSummary?: string[];
  stderrSummary?: string[];
};

function json(response: ServerResponse, statusCode: number, body: unknown, request?: IncomingMessage): void {
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    ...corsHeaders(request),
  });
  response.end(JSON.stringify(body, null, 2));
}

function corsHeaders(request?: IncomingMessage): Record<string, string> {
  const origin = request?.headers.origin;
  if (!origin) return {};

  try {
    const url = new URL(origin);
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
      return {
        "access-control-allow-origin": origin,
        "access-control-allow-methods": "GET,POST,OPTIONS",
        "access-control-allow-headers": "content-type",
      };
    }
  } catch {
    return {};
  }

  return {};
}

function notFound(request: IncomingMessage, response: ServerResponse): void {
  json(response, 404, {
    accepted: false,
    status: "not-found",
    errors: ["Endpoint not found."],
  }, request);
}

function shellArg(value: string): string {
  if (/^[A-Za-z0-9_./:=@-]+$/.test(value)) return value;
  return `'${value.replace(/'/g, "'\\''")}'`;
}

function buildReviewArgs(request: ApiIntakeReviewRequest): string[] {
  const args = [
    "run",
    "review",
    "--",
    "--repo",
    request.repo.path,
    "--skill",
    "saana-plan",
    "--base-branch",
    request.git.baseBranch,
  ];

  if (request.signals.releaseSignalsPath) {
    args.push("--release-signals", request.signals.releaseSignalsPath);
  }

  if (request.signals.cicdSummaryPath) {
    args.push("--cicd-summary", request.signals.cicdSummaryPath);
  }

  if (request.requestedOutputs.includes("pr-comment-draft")) {
    args.push("--github-comment-draft");
  }

  return args;
}

function buildRecommendedCommand(request: ApiIntakeReviewRequest): string {
  return ["npm", ...buildReviewArgs(request)].map(shellArg).join(" ");
}

function intakeResponse(request: ApiIntakeReviewRequest): ApiIntakeReviewResponse {
  return {
    requestId: request.requestId,
    accepted: true,
    status: "ready-for-local-review",
    recommendedCommand: buildRecommendedCommand(request),
    expectedArtifacts: [
      "reports/catalog.json",
      "reports/timeline-summary.md",
      "reports/<timestamp>-saana-plan.md",
    ],
    safetyNotes: [
      "No code is modified by intake.",
      "No external API writes are performed.",
      "Review execution remains local-first.",
      "The local API runner does not execute review commands automatically.",
    ],
  };
}

function dryRunResponse(request: ApiIntakeReviewRequest): DryRunResponse {
  return {
    requestId: request.requestId,
    accepted: true,
    status: "dry-run-ready",
    wouldExecute: false,
    recommendedCommand: buildRecommendedCommand(request),
    resolvedInputs: {
      repoPath: request.repo.path,
      baseBranch: request.git.baseBranch,
      releaseSignalsPath: request.signals.releaseSignalsPath || "none",
      cicdSummaryPath: request.signals.cicdSummaryPath || "none",
      requestedOutputs: request.requestedOutputs,
    },
    expectedArtifacts: [
      "reports/catalog.json",
      "reports/timeline-summary.md",
      "reports/<timestamp>-saana-plan.md",
    ],
    safetyNotes: [
      "Dry run only.",
      "No command was executed.",
      "No repository files were modified.",
    ],
  };
}

function stripAnsi(value: string): string {
  return value.replace(/\u001b\[[0-9;]*m/g, "");
}

function sanitizeLine(value: string): string {
  return stripAnsi(value)
    .replace(/([A-Z0-9_]*(?:TOKEN|SECRET|PASSWORD|PASS|KEY)[A-Z0-9_]*=)[^\s]+/gi, "$1[redacted]")
    .replace(/(Bearer\s+)[A-Za-z0-9._~+/-]+=*/gi, "$1[redacted]");
}

function summarizeOutput(value: string): string[] {
  return stripAnsi(value)
    .split(/\r?\n/)
    .map((line) => sanitizeLine(line).trim())
    .filter(Boolean)
    .slice(-maxSummaryLines);
}

function appendLimited(current: string, chunk: Buffer): string {
  const next = current + chunk.toString("utf8");
  if (Buffer.byteLength(next, "utf8") <= maxCapturedOutputBytes) return next;
  return next.slice(-maxCapturedOutputBytes);
}

async function detectLatestReport(stdout: string, startedAtMs = 0): Promise<string> {
  const match = stdout.match(/Report:\s+(.+?\.md)\s*$/m);
  if (match) {
    const absolute = resolve(match[1].trim());
    const root = `${process.cwd()}/`;
    return absolute.startsWith(root) ? absolute.slice(root.length) : absolute;
  }

  try {
    const entries = await readdir("reports");
    const reports = await Promise.all(entries
      .filter((entry) => /^\d{4}-\d{2}-\d{2}T.+\.md$/.test(entry))
      .map(async (entry) => {
        const reportPath = `reports/${entry}`;
        const info = await stat(reportPath);
        return { reportPath, mtimeMs: info.mtimeMs };
      }));
    const latest = reports
      .filter((entry) => entry.mtimeMs >= startedAtMs)
      .sort((a, b) => b.mtimeMs - a.mtimeMs)[0];
    return latest?.reportPath || "none";
  } catch {
    return "none";
  }
}

function validationErrors(value: unknown): string[] {
  if (!value || typeof value !== "object") return ["Request body must be a JSON object."];
  const request = value as Partial<ApiIntakeReviewRequest>;
  const errors: string[] = [];

  if (!request.requestId) errors.push("requestId is required.");
  if (!request.source) errors.push("source is required.");
  if (!request.mode) errors.push("mode is required.");
  if (!request.repo?.name) errors.push("repo.name is required.");
  if (!request.repo?.path) errors.push("repo.path is required.");
  if (!request.git?.baseBranch) errors.push("git.baseBranch is required.");
  if (!request.signals) errors.push("signals is required.");
  if (!Array.isArray(request.requestedOutputs)) errors.push("requestedOutputs must be an array.");

  return errors.length ? errors : ["Request does not match API Intake Review Request v1."];
}

async function readJsonBody(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;

  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.byteLength;
    if (size > maxBodyBytes) throw new Error("Request body exceeds 1 MB limit.");
    chunks.push(buffer);
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw.trim()) throw new Error("Request body is empty.");
  return JSON.parse(raw);
}

async function readValidIntakeRequest(request: IncomingMessage): Promise<
  | { ok: true; body: ApiIntakeReviewRequest }
  | { ok: false; response: InvalidIntakeResponse }
> {
  try {
    const body = await readJsonBody(request);
    if (!isApiIntakeReviewRequest(body)) {
      return {
        ok: false,
        response: {
        accepted: false,
        status: "rejected-invalid-request",
        errors: validationErrors(body),
        },
      };
    }

    return { ok: true, body };
  } catch (error) {
    return {
      ok: false,
      response: {
        accepted: false,
        status: "rejected-invalid-request",
        errors: [error instanceof Error ? error.message : "Invalid JSON request body."],
      },
    };
  }
}

async function handleIntake(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const parsed = await readValidIntakeRequest(request);
  if (!parsed.ok) {
    json(response, 400, parsed.response, request);
    return;
  }

  json(response, 200, intakeResponse(parsed.body), request);
}

async function handleDryRun(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const parsed = await readValidIntakeRequest(request);
  if (!parsed.ok) {
    json(response, 400, parsed.response, request);
    return;
  }

  json(response, 200, dryRunResponse(parsed.body), request);
}

function executeReview(requestBody: ApiIntakeReviewRequest): Promise<{
  exitCode: number | null;
  timedOut: boolean;
  stdout: string;
  stderr: string;
}> {
  return new Promise((resolveExecution) => {
    const child = spawn("npm", buildReviewArgs(requestBody), {
      cwd: process.cwd(),
      shell: false,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    let finished = false;
    let timedOut = false;

    const timeout = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
    }, executionTimeoutMs);

    child.stdout.on("data", (chunk: Buffer) => {
      stdout = appendLimited(stdout, chunk);
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr = appendLimited(stderr, chunk);
    });
    child.on("error", (error) => {
      if (finished) return;
      finished = true;
      clearTimeout(timeout);
      stderr = appendLimited(stderr, Buffer.from(error.message));
      resolveExecution({ exitCode: 1, timedOut, stdout, stderr });
    });
    child.on("close", (code) => {
      if (finished) return;
      finished = true;
      clearTimeout(timeout);
      resolveExecution({ exitCode: code, timedOut, stdout, stderr });
    });
  });
}

async function handleExecute(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const parsed = await readValidIntakeRequest(request);
  if (!parsed.ok) {
    json(response, 400, parsed.response, request);
    return;
  }

  const startedAtMs = Date.now();
  const result = await executeReview(parsed.body);
  const stdoutSummary = summarizeOutput(result.stdout);
  const stderrSummary = summarizeOutput(result.stderr);

  if (result.exitCode !== 0 || result.timedOut) {
    const failure: ExecuteFailureResponse = {
      requestId: parsed.body.requestId,
      accepted: false,
      status: "review-failed",
      exitCode: result.exitCode,
      errors: [
        result.timedOut
          ? "Review execution timed out after 5 minutes."
          : `Review command exited with code ${result.exitCode}.`,
      ],
      stdoutSummary,
      stderrSummary,
    };
    json(response, 500, failure, request);
    return;
  }

  const reportPath = await detectLatestReport(result.stdout, startedAtMs);
  const body: ExecuteResponse = {
    requestId: parsed.body.requestId,
    accepted: true,
    status: "review-executed",
    executed: true,
    command: buildRecommendedCommand(parsed.body),
    exitCode: result.exitCode,
    reportDetected: reportPath !== "none",
    reportPath,
    stdoutSummary,
    stderrSummary,
    safetyNotes: [
      "Only internally-generated review commands may execute.",
      "No arbitrary shell execution is allowed.",
      "No repository files were modified by the API runner itself.",
    ],
  };
  json(response, 200, body, request);
}

async function handleExample(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const examplePath = resolve("examples/api-intake-review-request.json");
  const example = JSON.parse(await readFile(examplePath, "utf8"));
  json(response, 200, example, request);
}

const server = createServer(async (request, response) => {
  if (request.method === "OPTIONS") {
    response.writeHead(204, corsHeaders(request));
    response.end();
    return;
  }

  const url = new URL(request.url || "/", `http://${host}:${port}`);

  if (request.method === "GET" && url.pathname === "/health") {
    json(response, 200, {
      ok: true,
      service: "authtoolkit-dev-integrity-local-api",
      mode: "local-only",
    }, request);
    return;
  }

  if (request.method === "GET" && url.pathname === "/review/example") {
    await handleExample(request, response);
    return;
  }

  if (request.method === "POST" && url.pathname === "/review/intake") {
    await handleIntake(request, response);
    return;
  }

  if (request.method === "POST" && url.pathname === "/review/dry-run") {
    await handleDryRun(request, response);
    return;
  }

  if (request.method === "POST" && url.pathname === "/review/execute") {
    await handleExecute(request, response);
    return;
  }

  notFound(request, response);
});

server.listen(port, host, () => {
  console.log(`AuthToolkit Dev Integrity local API listening at http://${host}:${port}`);
});
