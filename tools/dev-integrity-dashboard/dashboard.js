(() => {
const {
  emptyList,
  escapeHtml,
  filterCatalogByRepo,
  formatPercent,
  getSelectedRepo,
  loadArtifacts,
  missingField,
  noBlockers,
  noGithubFailures,
  noWorkflows,
  reportHref,
  renderNav,
  renderRepoContext,
  sectionItems,
  shortRepo,
  showMissing,
  status,
  summaryValue,
  text,
  unique,
} = window.IntegrityDashboard;

function latest(artifacts) {
  return artifacts.catalog[0] || {};
}

function card(title, body, tone = "") {
  return `<article class="panel decision-card ${tone}"><h2>${title}</h2>${body}</article>`;
}

function summary(textValue, tone = "") {
  return `<p class="operational-summary ${tone}">${escapeHtml(textValue)}</p>`;
}

function kv(rows) {
  return `<div class="kv">${rows.map(([label, value]) => `
    <div><span>${escapeHtml(label)}</span><span>${value || missingField()}</span></div>
  `).join("")}</div>`;
}

function pills(values, empty = noWorkflows()) {
  return values && values.length
    ? `<div class="pill-list">${values.map((value) => `<span class="pill">${escapeHtml(value)}</span>`).join("")}</div>`
    : empty;
}

function list(values, limit = 5, empty = "No generated evidence in the current artifacts.") {
  const visible = unique(values || []).slice(0, limit);
  return visible.length
    ? `<ul class="clean-list">${visible.map((value) => `<li>${escapeHtml(value)}</li>`).join("")}</ul>`
    : emptyList(empty);
}

function detail(title, values, limit = 6, open = false, empty = "No generated evidence in the current artifacts.") {
  return `
    <details class="detail-panel" ${open ? "open" : ""}>
      <summary>${escapeHtml(title)}</summary>
      ${list(values, limit, empty)}
    </details>
  `;
}

function score(value, label = "Confidence") {
  return `
    <div class="score-block">
      <div class="score">${escapeHtml(formatPercent(value))}</div>
      <div class="score-label">${escapeHtml(label)}</div>
    </div>
  `;
}

function reportLink(entry) {
  return entry.reportPath
    ? `<a href="${reportHref(entry.reportPath)}">${escapeHtml(entry.reportPath)}</a>`
    : missingField("No markdown report linked.");
}

function releaseGateDecision(entry) {
  return entry.prReadinessLabel || entry.overallIntegrityDecision || "unknown";
}

function timelineSummary(artifacts) {
  return {
    confidenceTrend: summaryValue(artifacts.timeline, "Confidence trend"),
    controlRoomTrend: summaryValue(artifacts.timeline, "Control room trend"),
    decisionTrend: summaryValue(artifacts.timeline, "Operational decision trend"),
    driftTrend: summaryValue(artifacts.timeline, "Drift trend"),
    focus: summaryValue(artifacts.timeline, "Recommended operational focus"),
  };
}

function releaseSummary(entry, blockers, risks) {
  const decision = releaseGateDecision(entry);
  if (decision === "blocked") {
    const driver = risks[0] || blockers[0] || "current evidence posture";
    return `Release currently blocked due to ${driver}.`;
  }
  if (entry.releaseGateConfidenceBand && entry.releaseGateConfidenceBand !== "unknown") {
    return `Release gate is ${decision} with ${entry.releaseGateConfidenceBand} confidence.`;
  }
  return "Release state is available in the current artifact, but confidence evidence is incomplete.";
}

function workflowSummary(entry) {
  const priority = text(entry.workflowPriority, "unknown");
  if (priority === "critical") return "Workflow routing requires evidence review before release movement.";
  if (priority === "high") return "Workflow routing is elevated and needs operator review.";
  if (priority === "unknown") return "Workflow routing data unavailable.";
  return `Workflow routing priority is ${priority}.`;
}

function githubSummary(failedChecks, failedRuns, pendingChecks, pendingRuns) {
  if (failedChecks || failedRuns) return `${failedChecks + failedRuns} failed GitHub checks or jobs detected.`;
  if (pendingChecks || pendingRuns) return `${pendingChecks + pendingRuns} GitHub checks or jobs pending.`;
  return "No failed GitHub checks detected.";
}

function countBadge(value, label, state) {
  return `<div class="count-badge ${state}"><strong>${escapeHtml(text(value, "0"))}</strong><span>${escapeHtml(label)}</span></div>`;
}

function guidanceDetail(title, body, open = false) {
  return `
    <details class="guidance-detail" ${open ? "open" : ""}>
      <summary>${escapeHtml(title)}</summary>
      ${body}
    </details>
  `;
}

function scoringModeBody() {
  return `
    <div class="mode-grid">
      <div>
        <h3>Local Dev</h3>
        <p>Used for experimentation. Missing CI, runtime, or release evidence should be softer and is useful for early development.</p>
      </div>
      <div>
        <h3>Staging</h3>
        <p>Used before release. Evidence, checks, workflow routing, and release signals matter more.</p>
      </div>
      <div>
        <h3>Production Strict</h3>
        <p>Used for release governance. Red Control Room, blocked decisions, recovery risk, failed checks, and missing evidence can collapse confidence quickly.</p>
      </div>
    </div>
  `;
}

function lowScoreDrivers(entry, blockers) {
  const workflows = Array.isArray(entry.activeWorkflows) ? entry.activeWorkflows : [];
  return unique([
    entry.controlRoomStatus === "red" ? "Control Room is red." : "",
    entry.overallIntegrityDecision === "blocked" ? "Integrity decision is blocked." : "",
    entry.workflowPriority === "critical" ? "Release workflow priority is critical." : "",
    workflows.includes("evidence-review") ? "Evidence review workflow is active." : "",
    workflows.includes("recovery-review") ? "Recovery review workflow is active." : "",
    workflows.includes("release-review") ? "Release review workflow is active." : "",
    entry.releaseGateConfidenceBand === "very-low" ? "Release gate confidence band is very-low." : "",
    ...blockers.slice(0, 5),
  ]);
}

function renderScoringGuidance(targetId, entry, blockers) {
  const target = document.getElementById(targetId);
  if (!target) return;

  const drivers = lowScoreDrivers(entry, blockers);
  target.innerHTML = `
    <article class="panel guidance-card">
      <div class="guidance-header">
        <div>
          <p class="eyebrow muted-eyebrow">Scoring Guidance</p>
          <h2>Scoring Mode: Production Strict</h2>
        </div>
        <span class="status ${statusClassTone(releaseGateDecision(entry)).replace("tone-", "") || "unknown"}">${escapeHtml(releaseGateDecision(entry))}</span>
      </div>
      <p class="guidance-lede">0% confidence does not mean the code is useless. It means this change is not safe to release under the current scoring mode.</p>
      <div class="guidance-details">
        ${guidanceDetail("What does 0% mean?", "<p>Under Production Strict scoring, release confidence can collapse when required release, runtime, recovery, reviewer, or check evidence is missing or blocked. It is a release-safety signal, not a code-quality verdict.</p>", true)}
        ${guidanceDetail("Scoring modes", scoringModeBody())}
        ${guidanceDetail("Why this score is low", list(drivers, 10, "No low-score drivers found in current artifacts."), true)}
        ${guidanceDetail("How to improve confidence", list([
          "Resolve blockers shown in the current artifacts.",
          "Attach release evidence.",
          "Attach recovery or rollback evidence.",
          "Rerun checks.",
          "Rerun the Integrity review.",
          "Confirm reviewer and release owner decision.",
        ], 10))}
      </div>
    </article>
  `;
}

function renderOverview(artifacts) {
  const entry = latest(artifacts);
  const blockers = sectionItems(artifacts.timeline, "Repeated Blocking Factors");
  const warnings = sectionItems(artifacts.timeline, "Repeated Risk Drivers");
  const workflows = Array.isArray(entry.activeWorkflows) ? entry.activeWorkflows : [];
  const trends = timelineSummary(artifacts);
  const releaseDecision = releaseGateDecision(entry);

  document.getElementById("overview-decisions").innerHTML = [
    card("Release Gate", `${summary(releaseSummary(entry, blockers, warnings), "strong")}
      <div class="release-hero">
        <div class="decision-stack">
          ${status(releaseDecision)}
          <span>${escapeHtml(text(entry.releaseGateConfidenceBand, "unknown"))} Confidence</span>
        </div>
        ${score(entry.releaseGateScore)}
      </div>
      ${kv([
        ["Confidence band", status(entry.releaseGateConfidenceBand)],
        ["Operational decision", status(entry.overallIntegrityDecision)],
        ["Release signal", `${escapeHtml(text(entry.releaseSignalProvider))} / ${status(entry.releaseSignalConclusion)}`],
        ["Workflow priority", status(entry.workflowPriority)],
      ])}`, `primary-card ${statusClassTone(releaseDecision)}`),
    card("Control Room Status", `<div class="hero-status">${status(entry.controlRoomStatus)}</div>${kv([
      ["Integrity decision", status(entry.overallIntegrityDecision)],
      ["Operational trust", status(entry.operationalTrustLevel)],
      ["Confidence trend", escapeHtml(trends.confidenceTrend)],
    ])}`, statusClassTone(entry.controlRoomStatus)),
    card("Latest Review", `<div class="hero-status">${escapeHtml(shortRepo(entry.repoPath))}</div>${kv([
      ["Generated", escapeHtml(text(entry.generatedAt))],
      ["Highest severity", status(entry.highestSeverity)],
      ["Report", reportLink(entry)],
    ])}`),
  ].join("");

  renderScoringGuidance("overview-scoring-guidance", entry, blockers);
  document.getElementById("overview-blockers").innerHTML = blockers.length ? list(blockers, 5) : noBlockers();
  document.getElementById("overview-warnings").innerHTML = list(warnings, 5, "No repeated risk drivers detected in current artifacts.");
  document.getElementById("overview-workflows").innerHTML = pills(workflows);
  document.getElementById("overview-latest").innerHTML = kv([
    ["Repo", escapeHtml(shortRepo(entry.repoPath))],
    ["Generated", escapeHtml(text(entry.generatedAt))],
    ["Reports for repo", escapeHtml(text(artifacts.catalog.length, "0"))],
    ["Skill", escapeHtml(text(entry.selectedSkill))],
    ["Timeline focus", escapeHtml(trends.focus)],
    ["Report", reportLink(entry)],
  ]);
}

function renderReviews(artifacts) {
  const rows = artifacts.catalog.map((entry) => `
    <tr class="click-row" data-href="${reportHref(entry.reportPath)}">
      <td>${escapeHtml(text(entry.generatedAt))}</td>
      <td><span class="repo-chip">${escapeHtml(shortRepo(entry.repoPath))}</span></td>
      <td>${status(entry.operationalTrustLevel)}</td>
      <td>${status(entry.overallIntegrityDecision)}</td>
      <td>${status(entry.workflowPriority)}</td>
      <td>${escapeHtml(formatPercent(entry.releaseGateScore))} <span class="dot-separator">•</span> ${status(entry.releaseGateConfidenceBand)}</td>
      <td>${reportLink(entry)}</td>
    </tr>
  `).join("");

  document.getElementById("review-count").textContent = `${artifacts.catalog.length} reports`;
  document.getElementById("reviews-table").innerHTML = rows;
  document.querySelectorAll(".click-row").forEach((row) => {
    row.addEventListener("click", (event) => {
      if (event.target.closest("a")) return;
      const href = row.getAttribute("data-href");
      if (href) window.location.href = new URL(href, document.baseURI).href;
    });
  });
}

function renderReleaseGates(artifacts) {
  const entry = latest(artifacts);
  const blockers = sectionItems(artifacts.timeline, "Repeated Blocking Factors");
  const risks = sectionItems(artifacts.timeline, "Repeated Risk Drivers");
  const releaseDecision = releaseGateDecision(entry);
  const positives = [
    entry.releaseSignalConclusion === "success" ? "Release signal conclusion is success." : "",
    Number(entry.githubFailedChecks) === 0 ? "No failed GitHub checks reported in the catalog entry." : "",
    Number(entry.githubActionsFailedRuns) === 0 ? "No failed GitHub Actions runs reported in the catalog entry." : "",
  ];
  const negatives = unique([
    entry.overallIntegrityDecision ? `Integrity decision is ${entry.overallIntegrityDecision}.` : "",
    entry.prReadinessLabel ? `PR readiness is ${entry.prReadinessLabel}.` : "",
    entry.releaseGateConfidenceBand ? `Release gate confidence band is ${entry.releaseGateConfidenceBand}.` : "",
    ...risks.slice(0, 3),
  ]);

  document.getElementById("release-main").innerHTML = [
    card("Release Gate Decision", `${summary(releaseSummary(entry, blockers, risks), "strong")}
      <div class="release-hero">
        <div class="decision-stack">
          ${status(releaseDecision)}
          <span>${escapeHtml(text(entry.releaseGateConfidenceBand, "unknown"))} Confidence</span>
        </div>
        ${score(entry.releaseGateScore, "Release Confidence")}
      </div>
      ${kv([
      ["Confidence band", status(entry.releaseGateConfidenceBand)],
      ["Control room", status(entry.controlRoomStatus)],
      ["Highest severity", status(entry.highestSeverity)],
    ])}`, `primary-card ${statusClassTone(releaseDecision)}`),
    card("Release Workflow Status", `<div class="hero-status">${status(entry.workflowPriority)}</div>${kv([
      ["Release review active", status((entry.activeWorkflows || []).includes("release-review") ? "active" : "inactive")],
      ["Pipeline", `${escapeHtml(text(entry.cicdProvider))} / ${status(entry.pipelineStatus)}`],
      ["Run", escapeHtml(text(entry.pipelineRunId))],
    ])}`),
  ].join("");

  renderScoringGuidance("release-scoring-guidance", entry, blockers);
  document.getElementById("release-positive").innerHTML = list(unique(positives), 6, "No positive release contributors detected in current artifacts.");
  document.getElementById("release-negative").innerHTML = list(negatives, 6, "No negative release contributors detected in current artifacts.");
  document.getElementById("release-evidence").innerHTML = blockers.length
    ? `<div class="blocker-callout">${list(blockers, 4)}</div>${detail("All Required Gate Evidence", blockers, 10, false)}`
    : noBlockers();
  document.getElementById("release-signal").innerHTML = kv([
    ["Provider", escapeHtml(text(entry.releaseSignalProvider))],
    ["Conclusion", status(entry.releaseSignalConclusion)],
    ["Run ID", escapeHtml(text(entry.releaseSignalRunId))],
  ]);
}

function renderWorkflows(artifacts) {
  const entry = latest(artifacts);
  const repeatedWorkflows = sectionItems(artifacts.timeline, "Repeated Workflow Patterns");
  const blockers = sectionItems(artifacts.timeline, "Repeated Blocking Factors");
  const reasons = sectionItems(artifacts.timeline, "Repeated Risk Drivers");
  const active = Array.isArray(entry.activeWorkflows) ? entry.activeWorkflows : [];

  document.getElementById("workflow-decision").innerHTML = card("Recommended Workflow Path", `
    ${summary(workflowSummary(entry), "strong")}
    <div class="hero-status">${status(entry.workflowPriority)}</div>
    ${kv([
      ["Active workflows", escapeHtml(text(active.length, "0"))],
      ["Operational decision", status(entry.overallIntegrityDecision)],
      ["Recommended focus", escapeHtml(summaryValue(artifacts.timeline, "Recommended operational focus"))],
    ])}
  `, statusClassTone(entry.workflowPriority));
  document.getElementById("workflow-active").innerHTML = pills(active);
  document.getElementById("workflow-repeated").innerHTML = list(repeatedWorkflows, 10, "No repeated workflow patterns detected.");
  document.getElementById("workflow-reasons").innerHTML = detail("Workflow Reasons", reasons, 10, true, "No workflow reasons detected.");
  document.getElementById("workflow-evidence").innerHTML = detail("Evidence Needs", blockers, 10, true, "No workflow evidence attached.");
}

function renderTimeline(artifacts) {
  const trends = timelineSummary(artifacts);
  document.getElementById("timeline-markdown").textContent = artifacts.timeline;
  document.getElementById("timeline-trend").innerHTML = kv([
    ["Latest confidence", escapeHtml(formatPercent(latest(artifacts).confidenceScore))],
    ["Confidence trend", escapeHtml(trends.confidenceTrend)],
    ["Control room trend", escapeHtml(trends.controlRoomTrend)],
    ["Decision trend", escapeHtml(trends.decisionTrend)],
    ["Drift trend", escapeHtml(trends.driftTrend)],
  ]);
  document.getElementById("timeline-blockers").innerHTML = detail("Repeated Blockers", sectionItems(artifacts.timeline, "Repeated Blocking Factors"), 12, true, "No repeated blockers detected.");
  document.getElementById("timeline-workflows").innerHTML = detail("Repeated Workflows", sectionItems(artifacts.timeline, "Repeated Workflow Patterns"), 12, true, "No repeated workflows detected.");
  document.getElementById("timeline-risks").innerHTML = detail("Repeated Risk Drivers", sectionItems(artifacts.timeline, "Repeated Risk Drivers"), 12, true, "No repeated risk drivers detected.");
}

function renderGithub(artifacts) {
  const entry = latest(artifacts);
  const failedChecks = Number(entry.githubFailedChecks || 0);
  const pendingChecks = Number(entry.githubPendingChecks || 0);
  const failedRuns = Number(entry.githubActionsFailedRuns || 0);
  const pendingRuns = Number(entry.githubActionsPendingRuns || 0);

  document.getElementById("github-context").innerHTML = `
    ${summary(githubSummary(failedChecks, failedRuns, pendingChecks, pendingRuns), failedChecks || failedRuns ? "danger" : "strong")}
    <div class="count-grid">
      ${countBadge(failedChecks, "failed checks", failedChecks ? "bad" : "good")}
      ${countBadge(failedRuns, "failed jobs", failedRuns ? "bad" : "good")}
      ${countBadge(pendingChecks, "pending checks", pendingChecks ? "warn" : "good")}
      ${countBadge(pendingRuns, "pending jobs", pendingRuns ? "warn" : "good")}
    </div>
    ${kv([
    ["GitHub repo", escapeHtml(text(entry.githubRepo))],
    ["PR number", escapeHtml(text(entry.githubPrNumber))],
    ["Current branch", escapeHtml(text(entry.currentBranch))],
    ["Current commit", escapeHtml(text(entry.currentCommit))],
  ])}`;
  document.getElementById("github-branch").innerHTML = kv([
    ["Base branch", escapeHtml(text(entry.baseBranch))],
    ["Commits ahead", escapeHtml(text(entry.commitsAheadOfBase, "0"))],
    ["Files changed", escapeHtml(text(entry.filesChangedAgainstBase, "0"))],
  ]);
  document.getElementById("github-checks").innerHTML = kv([
    ["Failed checks", status(failedChecks ? "failed" : "green")],
    ["Failed count", escapeHtml(text(failedChecks, "0"))],
    ["Pending count", pendingChecks ? status("pending") + ` ${escapeHtml(text(pendingChecks, "0"))}` : escapeHtml(text(pendingChecks, "0"))],
  ]);
  document.getElementById("github-actions").innerHTML = kv([
    ["Runs found", escapeHtml(text(entry.githubActionsRunsFound, "0"))],
    ["Failed runs", status(failedRuns ? "failed" : "green")],
    ["Pending runs", pendingRuns ? status("pending") + ` ${escapeHtml(text(pendingRuns, "0"))}` : escapeHtml(text(pendingRuns, "0"))],
  ]);
  const failures = [
    failedChecks ? `${failedChecks} GitHub checks failed.` : "",
    failedRuns ? `${failedRuns} GitHub Actions runs failed.` : "",
  ];
  document.getElementById("github-failed").innerHTML = unique(failures).length ? list(failures, 4) : noGithubFailures();
  document.getElementById("github-pending").innerHTML = list([
    pendingChecks ? `${pendingChecks} GitHub checks pending.` : "",
    pendingRuns ? `${pendingRuns} GitHub Actions runs pending.` : "",
  ], 4, "No GitHub checks or jobs pending.");
  document.getElementById("github-release-linkage").innerHTML = kv([
    ["Release signal provider", escapeHtml(text(entry.releaseSignalProvider))],
    ["Release signal conclusion", status(entry.releaseSignalConclusion)],
    ["Release signal run", escapeHtml(text(entry.releaseSignalRunId))],
    ["Release confidence", escapeHtml(formatPercent(entry.releaseGateScore))],
  ]);
}

function statusClassTone(value) {
  const normalized = text(value).toLowerCase();
  if (["green", "trusted", "strong", "high", "very-high", "success"].includes(normalized)) return "tone-green";
  if (["yellow", "caution", "moderate", "medium"].includes(normalized)) return "tone-yellow";
  if (["orange", "high-risk", "guarded", "low", "critical"].includes(normalized)) return "tone-orange";
  if (["red", "blocked", "critical-review-required", "very-low", "failed"].includes(normalized)) return "tone-red";
  return "";
}

async function init() {
  const page = document.body.dataset.page || "overview";

  const artifacts = await loadArtifacts();
  if (artifacts.catalogError) showMissing("reports/catalog.json is missing or unreadable. Run a review first.");
  if (!artifacts.catalog.length) {
    renderNav(page);
    showMissing("No report catalog entries were found. Run a review first.");
    return;
  }

  const selectedRepo = getSelectedRepo(artifacts.catalog);
  const scopedCatalog = filterCatalogByRepo(artifacts.catalog, selectedRepo);
  const scopedArtifacts = {
    ...artifacts,
    allCatalog: artifacts.catalog,
    catalog: scopedCatalog,
    selectedRepo,
  };

  renderNav(page, selectedRepo);
  renderRepoContext(artifacts.catalog, selectedRepo, scopedCatalog);

  if (!scopedCatalog.length) {
    showMissing("No reports found for selected repo.");
    return;
  }

  const renderers = {
    overview: renderOverview,
    reviews: renderReviews,
    "release-gates": renderReleaseGates,
    workflows: renderWorkflows,
    timeline: renderTimeline,
    github: renderGithub,
  };

  renderers[page]?.(scopedArtifacts);
}

init();
})();
