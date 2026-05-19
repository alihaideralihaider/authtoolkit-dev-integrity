import type { GitDiffLine } from "./gitMonitor.ts";
import type { Severity } from "./riskClassifier.ts";
import type { ReviewPack } from "./reviewSelector.ts";

export type DiffSignalType =
  | "auth-security"
  | "payment-webhook"
  | "runtime-config"
  | "sms-compliance"
  | "safety";

export type DiffFinding = {
  findingName: string;
  severity: Severity;
  filePath: string;
  reason: string;
  signalType: DiffSignalType;
  suggestedReviewPacks: ReviewPack[];
  safeEvidenceSummary: string;
  suggestedNextAction: string;
};

export type DiffConfidenceImpact = {
  cap: number | null;
  reason: string;
};

export type DiffAwareIntegrityResult = {
  diffFindings: DiffFinding[];
  diffRiskSignals: string[];
  diffSensitiveChanges: string[];
  diffReviewNotes: string[];
  diffConfidenceImpact: DiffConfidenceImpact;
};

const secretNamePattern = /\b[A-Z][A-Z0-9_]*(?:SECRET|TOKEN|PASSWORD|PRIVATE|SERVICE_ROLE|WEBHOOK_SECRET|API_KEY|AUTH_TOKEN)[A-Z0-9_]*\b/g;
const envNamePattern = /\b(?:process\.env\.)?([A-Z][A-Z0-9_]{2,})\b/g;

function unique(values: string[]): string[] {
  return [...new Set(values)].sort();
}

function includesPattern(line: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(line));
}

function safeEnvNames(line: string): string[] {
  const names = new Set<string>();

  for (const match of line.matchAll(envNamePattern)) {
    const name = match[1];
    if (/(ENV|SECRET|TOKEN|KEY|PASSWORD|SUPABASE|STRIPE|TWILIO|RESEND|CLOUDFLARE|OPENAI|GOOGLE|META|WHATSAPP|WEBHOOK)/.test(name)) {
      names.add(name);
    }
  }

  return [...names].sort();
}

function secretLikeNames(line: string): string[] {
  return [...new Set((line.match(secretNamePattern) || []).sort())];
}

function hasAssignmentShape(line: string): boolean {
  return /[:=]/.test(line);
}

function addFinding(
  findings: DiffFinding[],
  finding: DiffFinding
): void {
  const key = `${finding.findingName}:${finding.filePath}:${finding.signalType}`;
  if (findings.some((existing) => `${existing.findingName}:${existing.filePath}:${existing.signalType}` === key)) {
    return;
  }
  findings.push(finding);
}

function pathHints(filePath: string): {
  payment: boolean;
  webhook: boolean;
  sms: boolean;
  runtime: boolean;
  security: boolean;
} {
  const text = filePath.toLowerCase();
  return {
    payment: /stripe|payment|billing|checkout|order/.test(text),
    webhook: /webhook|callback|inbound/.test(text),
    sms: /twilio|sms|whatsapp|message|voice/.test(text),
    runtime: /wrangler|cloudflare|worker|binding|deploy|runtime|config|package\.json/.test(text),
    security: /auth|admin|api|session|service-role|service_role|supabase|rls/.test(text),
  };
}

function confidenceImpact(findings: DiffFinding[]): DiffConfidenceImpact {
  if (findings.some((finding) => finding.severity === "critical")) {
    return {
      cap: 30,
      reason: "Critical diff-aware finding detected; confidence is capped at 30.",
    };
  }
  if (findings.some((finding) => finding.severity === "high")) {
    return {
      cap: 45,
      reason: "High diff-aware finding detected; confidence is capped at 45.",
    };
  }
  if (findings.some((finding) => finding.severity === "medium")) {
    return {
      cap: 55,
      reason: "Medium diff-aware finding detected; confidence is capped at 55.",
    };
  }
  return {
    cap: null,
    reason: "No diff-aware confidence impact.",
  };
}

export function confidenceWithDiffFindings(
  confidence: number,
  diffAwareIntegrity: DiffAwareIntegrityResult
): number {
  const cap = diffAwareIntegrity.diffConfidenceImpact.cap;
  return cap === null ? confidence : Math.min(confidence, cap);
}

export function evaluateDiffAwareIntegrity(diffLines: GitDiffLine[]): DiffAwareIntegrityResult {
  const findings: DiffFinding[] = [];

  for (const line of diffLines) {
    const text = line.text;
    const lower = text.toLowerCase();
    const hints = pathHints(line.filePath);
    const isAdded = line.changeType === "added";
    const isRemoved = line.changeType === "removed";
    const envNames = safeEnvNames(text);
    const secretNames = secretLikeNames(text);

    if (isAdded && secretNames.length && hasAssignmentShape(text)) {
      addFinding(findings, {
        findingName: "secret-like-assignment-added",
        severity: "critical",
        filePath: line.filePath,
        reason: "A secret-like variable assignment was added. Only the variable name is reported; value-like text is redacted.",
        signalType: "safety",
        suggestedReviewPacks: ["vault-pack", "security-pack", "release-readiness-pack"],
        safeEvidenceSummary: `Secret-like name changed: ${secretNames.join(", ")}. Value redacted.`,
        suggestedNextAction: "Confirm no secret value was committed and move any real value to the approved secret store.",
      });
    }

    if (envNames.length && includesPattern(lower, [/process\.env/, /env/, /secret/, /token/, /key/])) {
      addFinding(findings, {
        findingName: "env-var-name-changed",
        severity: "medium",
        filePath: line.filePath,
        reason: "An environment variable name was added or removed in the diff.",
        signalType: "runtime-config",
        suggestedReviewPacks: ["vault-pack", "runtime-pack"],
        safeEvidenceSummary: `Env var-like names changed: ${envNames.join(", ")}.`,
        suggestedNextAction: "Confirm the env var inventory, runtime config, and deployment environment are updated by name only.",
      });
    }

    if (isRemoved && includesPattern(lower, [/requireauth/, /authguard/, /isauthenticated/, /getsession/, /\bsession\b/, /verifyuser/, /requireuser/])) {
      addFinding(findings, {
        findingName: "auth-guard-indicator-removed",
        severity: "high",
        filePath: line.filePath,
        reason: "A line containing an auth guard indicator was removed.",
        signalType: "auth-security",
        suggestedReviewPacks: ["security-pack", "release-readiness-pack"],
        safeEvidenceSummary: "Removed line matched an auth guard keyword; raw diff line omitted.",
        suggestedNextAction: "Verify the route or handler still requires the intended identity/session guard.",
      });
    }

    if (isRemoved && includesPattern(lower, [/authorize/, /authorization/, /isadmin/, /requireadmin/, /tenant/, /membership/, /permission/, /canaccess/, /\brole\b/])) {
      addFinding(findings, {
        findingName: "authorization-check-indicator-removed",
        severity: "high",
        filePath: line.filePath,
        reason: "A line containing an authorization or tenant-boundary indicator was removed.",
        signalType: "auth-security",
        suggestedReviewPacks: ["security-pack", "release-readiness-pack"],
        safeEvidenceSummary: "Removed line matched an authorization or tenant-boundary keyword; raw diff line omitted.",
        suggestedNextAction: "Verify authorization checks still enforce the intended tenant/admin boundary.",
      });
    }

    if (isAdded && includesPattern(lower, [/allowanonymous/, /skipauth/, /noauth/, /public route/, /unauthenticated/])) {
      addFinding(findings, {
        findingName: "public-access-indicator-added",
        severity: "high",
        filePath: line.filePath,
        reason: "A line containing a public or unauthenticated access indicator was added.",
        signalType: "auth-security",
        suggestedReviewPacks: ["security-pack", "release-readiness-pack"],
        safeEvidenceSummary: "Added line matched a public-access keyword; raw diff line omitted.",
        suggestedNextAction: "Confirm the public access change is intentional and does not expose protected data or admin behavior.",
      });
    }

    if (includesPattern(lower, [/service[_-]?role/, /service role/, /supabase_service_role_key/])) {
      addFinding(findings, {
        findingName: "service-role-usage-changed",
        severity: "high",
        filePath: line.filePath,
        reason: "Service-role usage changed in added or removed diff lines.",
        signalType: "auth-security",
        suggestedReviewPacks: ["security-pack", "vault-pack", "release-readiness-pack"],
        safeEvidenceSummary: "Diff matched service-role terminology; raw diff line omitted.",
        suggestedNextAction: "Confirm service-role usage remains server-only and protected by auth/tenant checks.",
      });
    }

    if (isRemoved && (hints.webhook || hints.payment) && includesPattern(lower, [/signature/, /constructevent/, /webhook.*secret/, /stripe_webhook_secret/, /x-twilio-signature/, /\bverify\b/])) {
      addFinding(findings, {
        findingName: "webhook-signature-verification-indicator-removed",
        severity: "high",
        filePath: line.filePath,
        reason: "A webhook or provider verification indicator was removed.",
        signalType: "payment-webhook",
        suggestedReviewPacks: ["security-pack", "payment-pack", "release-readiness-pack"],
        safeEvidenceSummary: "Removed line matched webhook signature/verification terminology; raw diff line omitted.",
        suggestedNextAction: "Verify provider signature validation and replay/idempotency protections still exist.",
      });
    }

    if ((hints.webhook || includesPattern(lower, [/webhook/, /callback/, /inbound/])) && includesPattern(lower, [/webhook/, /callback/, /inbound/, /constructevent/, /stripe\.webhooks/, /twilio/])) {
      addFinding(findings, {
        findingName: "webhook-handling-changed",
        severity: hints.payment || hints.sms ? "high" : "medium",
        filePath: line.filePath,
        reason: "Webhook handling changed in a changed file or diff line.",
        signalType: hints.sms ? "sms-compliance" : "payment-webhook",
        suggestedReviewPacks: hints.sms
          ? ["sms-compliance-pack", "runtime-pack", "release-readiness-pack"]
          : ["security-pack", "payment-pack", "release-readiness-pack"],
        safeEvidenceSummary: "Diff matched webhook/provider handling terminology; raw diff line omitted.",
        suggestedNextAction: "Verify webhook trust, runtime routing, and idempotency expectations before release.",
      });
    }

    if ((hints.payment || includesPattern(lower, [/payment/, /checkout/, /stripe/, /order/])) && includesPattern(lower, [/payment_status/, /\bpaid\b/, /checkout/, /order.*state/, /payment.*state/, /reconcil/])) {
      addFinding(findings, {
        findingName: "payment-state-logic-changed",
        severity: "medium",
        filePath: line.filePath,
        reason: "Payment, checkout, or order-state logic changed.",
        signalType: "payment-webhook",
        suggestedReviewPacks: ["payment-pack", "release-readiness-pack"],
        safeEvidenceSummary: "Diff matched payment/order state terminology; raw diff line omitted.",
        suggestedNextAction: "Verify provider-confirmed state, idempotency, and order/payment reconciliation.",
      });
    }

    if ((hints.payment || hints.webhook) && includesPattern(lower, [/idempotenc/, /dedup/, /event\.id/, /alreadyprocessed/, /processed/])) {
      addFinding(findings, {
        findingName: "idempotency-logic-changed",
        severity: "medium",
        filePath: line.filePath,
        reason: "Idempotency-related logic changed around payment or webhook handling.",
        signalType: "payment-webhook",
        suggestedReviewPacks: ["payment-pack", "security-pack"],
        safeEvidenceSummary: "Diff matched idempotency terminology; raw diff line omitted.",
        suggestedNextAction: "Verify duplicate webhook/event handling remains safe.",
      });
    }

    if (hints.runtime || includesPattern(lower, [/wrangler/, /cloudflare/, /binding/, /\broute\b/, /\broutes\b/, /worker/, /deploy/, /environment/])) {
      addFinding(findings, {
        findingName: "runtime-config-changed",
        severity: "medium",
        filePath: line.filePath,
        reason: "Runtime, binding, route, or deployment configuration changed.",
        signalType: "runtime-config",
        suggestedReviewPacks: ["runtime-pack", "vault-pack"],
        safeEvidenceSummary: "Diff matched runtime/config/deploy terminology; raw diff line omitted.",
        suggestedNextAction: "Verify local, preview, and production runtime targets and bindings are not drifting.",
      });
    }

    if ((hints.sms || includesPattern(lower, [/twilio/, /\bsms\b/, /whatsapp/, /voice/])) && includesPattern(lower, [/stop/, /help/, /opt[- ]?out/, /consent/, /opt[- ]?in/, /message frequency/, /data rates/, /twilio/, /whatsapp/, /voice/])) {
      addFinding(findings, {
        findingName: "telecom-compliance-copy-or-runtime-changed",
        severity: "medium",
        filePath: line.filePath,
        reason: "SMS, voice, WhatsApp, consent, STOP/HELP, or telecom runtime terms changed.",
        signalType: "sms-compliance",
        suggestedReviewPacks: ["sms-compliance-pack", "runtime-pack"],
        safeEvidenceSummary: "Diff matched telecom/compliance terminology; raw diff line omitted.",
        suggestedNextAction: "Verify transactional versus marketing behavior, consent path, and STOP/HELP expectations.",
      });
    }

    if (hints.security && includesPattern(lower, [/api/, /admin/, /auth/, /session/, /tenant/, /supabase/])) {
      addFinding(findings, {
        findingName: "security-sensitive-logic-changed",
        severity: "medium",
        filePath: line.filePath,
        reason: "Security-sensitive route, admin, auth, session, tenant, or data access terminology changed.",
        signalType: "auth-security",
        suggestedReviewPacks: ["security-pack"],
        safeEvidenceSummary: "Diff matched security-sensitive terminology; raw diff line omitted.",
        suggestedNextAction: "Verify auth, authorization, and data access behavior remains intended.",
      });
    }
  }

  const diffConfidenceImpact = confidenceImpact(findings);
  const diffRiskSignals = unique(findings.map((finding) => `${finding.signalType}:${finding.findingName}`));
  const diffSensitiveChanges = unique(
    findings
      .filter((finding) => finding.severity === "high" || finding.severity === "critical")
      .map((finding) => `${finding.severity}: ${finding.findingName} in ${finding.filePath}`)
  );
  const diffReviewNotes = findings.length
    ? [
        "Diff-aware findings are deterministic line-pattern signals, not semantic AI review.",
        "Reports intentionally omit raw diff lines and secret values.",
        "Human review should confirm whether each signal represents a real issue.",
      ]
    : ["No diff-aware findings detected from added or removed lines."];

  return {
    diffFindings: findings,
    diffRiskSignals,
    diffSensitiveChanges,
    diffReviewNotes,
    diffConfidenceImpact,
  };
}
