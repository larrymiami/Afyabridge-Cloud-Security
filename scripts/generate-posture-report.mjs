import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

const DAY_MS = 86_400_000;
const REQUIRED_DECISIONS = ["pass", "attention", "block"];
const REQUIRED_UNACCEPTED_STATUSES = ["open", "in-remediation", "resolved"];
const REQUIRED_TREND_METRICS = [
  "active_findings",
  "overdue_findings",
  "risk_accepted_findings",
  "closed_findings",
  "repository_failing_rules",
  "repository_blocking_findings",
];
const REQUIRED_DIRECTIONS = {
  active_findings: "lower-is-better",
  overdue_findings: "lower-is-better",
  risk_accepted_findings: "lower-is-better",
  closed_findings: "higher-is-better",
  repository_failing_rules: "lower-is-better",
  repository_blocking_findings: "lower-is-better",
};

function fail(message) {
  throw new Error(`Posture reporting failed: ${message}`);
}

function requireObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(`${label} must be an object`);
  return value;
}

function requireArray(value, label) {
  if (!Array.isArray(value)) fail(`${label} must be an array`);
  return value;
}

function requireExactStringSet(values, expected, label) {
  if (!Array.isArray(values) || values.length !== expected.length) {
    fail(`${label} must contain exactly ${expected.join(", ")}`);
  }
  const actual = new Set(values);
  if (actual.size !== expected.length || expected.some((item) => !actual.has(item))) {
    fail(`${label} must contain exactly ${expected.join(", ")}`);
  }
}

export function parseReportingTimestamp(value, label = "timestamp") {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(value ?? "")) {
    fail(`${label} must use UTC RFC3339 format YYYY-MM-DDTHH:MM:SSZ`);
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime()) || date.toISOString().replace(".000Z", "Z") !== value) {
    fail(`${label} is invalid`);
  }
  return date;
}

function parseDate(value, label) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? "")) fail(`${label} must use YYYY-MM-DD`);
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    fail(`${label} is invalid`);
  }
  return date;
}

function utcDate(date) {
  const result = new Date(date);
  result.setUTCHours(0, 0, 0, 0);
  return result;
}

function requireNonNegativeInteger(value, label) {
  if (!Number.isInteger(value) || value < 0) fail(`${label} must be a non-negative integer`);
  return value;
}

function countBy(items, key, knownValues = []) {
  const counts = Object.fromEntries(knownValues.map((value) => [value, 0]));
  for (const item of items) {
    const value = item?.[key] ?? "unknown";
    counts[value] = (counts[value] ?? 0) + 1;
  }
  return counts;
}

function exactMetricObject(metrics, label) {
  requireObject(metrics, label);
  const keys = Object.keys(metrics).sort();
  const expected = [...REQUIRED_TREND_METRICS].sort();
  if (keys.length !== expected.length || expected.some((key, index) => keys[index] !== key)) {
    fail(`${label} must contain exactly the governed trend metrics`);
  }
  for (const metric of REQUIRED_TREND_METRICS) {
    requireNonNegativeInteger(metrics[metric], `${label}.${metric}`);
  }
}

export function validateReportingConfiguration({ policy, governance, history, asOf }) {
  requireObject(policy, "reporting policy");
  requireObject(governance, "posture governance");
  requireObject(history, "metrics history");

  if (policy.schema_version !== 1) fail("reporting policy schema_version must be 1");
  if (policy.policy_id !== "AFYA-CSPM-REPORTING-1") {
    fail("reporting policy_id must remain AFYA-CSPM-REPORTING-1");
  }
  if (policy.profile_id !== governance.profile_id || policy.profile_id !== "AFYA-CSPM-BASELINE-1") {
    fail("reporting policy profile_id must match the reviewed posture profile");
  }
  if (governance.profile_stage !== "repository-baseline") {
    fail("v0.10D may not claim a live-operational profile without a reviewed future reporting-stage change");
  }
  if (policy.findings_registry !== "security/posture-findings.json") {
    fail("findings_registry must remain security/posture-findings.json");
  }
  if (policy.exceptions_registry !== "security/exceptions.json") {
    fail("exceptions_registry must remain security/exceptions.json");
  }
  if (policy.history_registry !== "security/posture-metrics-history.json") {
    fail("history_registry must remain security/posture-metrics-history.json");
  }

  requireExactStringSet(policy.decision_levels, REQUIRED_DECISIONS, "decision_levels");
  requireExactStringSet(policy.unaccepted_active_statuses, REQUIRED_UNACCEPTED_STATUSES, "unaccepted_active_statuses");
  if (policy.risk_accepted_status !== "risk-accepted") fail("risk_accepted_status must remain risk-accepted");
  if (policy.closed_status !== "closed") fail("closed_status must remain closed");

  const lifecycleStatuses = new Set(governance.finding_lifecycle?.allowed_statuses ?? []);
  for (const status of [...REQUIRED_UNACCEPTED_STATUSES, "risk-accepted", "closed"]) {
    if (!lifecycleStatuses.has(status)) fail(`reporting status ${status} is not governed by the finding lifecycle`);
  }

  const thresholds = requireObject(policy.thresholds, "thresholds");
  for (const threshold of [
    "maximum_overdue_findings",
    "maximum_unaccepted_merge_blocking_findings",
    "maximum_repository_blocking_findings",
  ]) {
    if (thresholds[threshold] !== 0) fail(`${threshold} must remain zero`);
  }

  const attention = requireObject(policy.attention_conditions, "attention_conditions");
  for (const condition of [
    "nonblocking_active_findings",
    "risk_accepted_findings",
    "repository_nonblocking_findings",
  ]) {
    if (attention[condition] !== true) fail(`${condition} must remain enabled`);
  }

  if (policy.exception_expiry_warning_days !== 7) fail("exception_expiry_warning_days must remain 7");

  const trend = requireObject(policy.trend, "trend");
  if (trend.lookback_days !== 30) fail("trend.lookback_days must remain 30");
  if (trend.minimum_snapshots !== 2) fail("trend.minimum_snapshots must remain 2");
  requireExactStringSet(trend.metrics, REQUIRED_TREND_METRICS, "trend.metrics");
  const directions = requireObject(trend.metric_directions, "trend.metric_directions");
  for (const [metric, direction] of Object.entries(REQUIRED_DIRECTIONS)) {
    if (directions[metric] !== direction) fail(`trend.metric_directions.${metric} must remain ${direction}`);
  }
  if (Object.keys(directions).length !== REQUIRED_TREND_METRICS.length) {
    fail("trend.metric_directions must contain only governed metrics");
  }

  const boundary = requireObject(policy.evidence_boundary, "evidence_boundary");
  if (boundary.live_sources_required_for_operational_trends !== true) {
    fail("live_sources_required_for_operational_trends must remain true");
  }
  if (boundary.repository_baseline_must_report_live_validation_pending !== true) {
    fail("repository_baseline_must_report_live_validation_pending must remain true");
  }

  if (history.schema_version !== 1) fail("metrics history schema_version must be 1");
  if (history.profile_id !== policy.profile_id) fail("metrics history profile_id must match reporting policy");
  const snapshots = requireArray(history.snapshots, "metrics history snapshots");
  let previous = null;
  const seen = new Set();
  for (const [index, snapshot] of snapshots.entries()) {
    requireObject(snapshot, `history.snapshots[${index}]`);
    const generated = parseReportingTimestamp(snapshot.generated_at, `history.snapshots[${index}].generated_at`);
    if (generated > asOf) fail(`history.snapshots[${index}] cannot be future-dated`);
    if (seen.has(snapshot.generated_at)) fail(`duplicate history snapshot timestamp ${snapshot.generated_at}`);
    seen.add(snapshot.generated_at);
    if (previous && generated <= previous) fail("metrics history snapshots must be strictly chronological");
    previous = generated;
    if (!REQUIRED_DECISIONS.includes(snapshot.decision)) fail(`history.snapshots[${index}].decision is unsupported`);
    if (!new Set(["repository-baseline", "live-operational"]).has(snapshot.evidence_mode)) {
      fail(`history.snapshots[${index}].evidence_mode is unsupported`);
    }
    exactMetricObject(snapshot.metrics, `history.snapshots[${index}].metrics`);
  }
  return { snapshots };
}

function trendDirection(delta, preference) {
  if (delta === 0) return "stable";
  if (preference === "lower-is-better") return delta < 0 ? "improving" : "worsening";
  if (preference === "higher-is-better") return delta > 0 ? "improving" : "worsening";
  fail(`unsupported metric direction ${preference}`);
}

function buildTrend({ policy, history, currentSnapshot, asOf }) {
  const lookbackStart = new Date(asOf.getTime() - policy.trend.lookback_days * DAY_MS);
  const prior = history.snapshots.filter((snapshot) => {
    const timestamp = parseReportingTimestamp(snapshot.generated_at, "history snapshot generated_at");
    return timestamp >= lookbackStart && timestamp < asOf;
  });
  const snapshotsConsidered = prior.length + 1;
  const allOperational = currentSnapshot.evidence_mode === "live-operational" && prior.every((snapshot) => snapshot.evidence_mode === "live-operational");
  if (snapshotsConsidered < policy.trend.minimum_snapshots) {
    return {
      status: "insufficient-history",
      evidence_class: allOperational ? "operational" : "repository-evidence",
      lookback_days: policy.trend.lookback_days,
      snapshots_considered: snapshotsConsidered,
      minimum_snapshots: policy.trend.minimum_snapshots,
      baseline_generated_at: null,
      overall_direction: null,
      deltas: {},
    };
  }
  const baseline = prior[0];
  const deltas = {};
  let improving = 0;
  let worsening = 0;
  for (const metric of REQUIRED_TREND_METRICS) {
    const delta = currentSnapshot.metrics[metric] - baseline.metrics[metric];
    const direction = trendDirection(delta, policy.trend.metric_directions[metric]);
    if (direction === "improving") improving += 1;
    if (direction === "worsening") worsening += 1;
    deltas[metric] = { baseline: baseline.metrics[metric], current: currentSnapshot.metrics[metric], delta, direction };
  }
  return {
    status: "available",
    evidence_class: allOperational ? "operational" : "repository-evidence",
    lookback_days: policy.trend.lookback_days,
    snapshots_considered: snapshotsConsidered,
    minimum_snapshots: policy.trend.minimum_snapshots,
    baseline_generated_at: baseline.generated_at,
    overall_direction: worsening > 0 ? "worsening" : improving > 0 ? "improving" : "stable",
    deltas,
  };
}

function normalizeEvidenceContext(value = {}) {
  const input = value && typeof value === "object" ? value : {};
  return {
    repository: input.repository ?? "unknown",
    workflow: input.workflow ?? "unknown",
    run_id: input.run_id ?? "unknown",
    run_attempt: input.run_attempt ?? "unknown",
    event: input.event ?? "unknown",
    ref: input.ref ?? "unknown",
    commit: input.commit ?? "unknown",
  };
}

function validateEvaluation(evaluation) {
  if (evaluation?.schema_version !== 1 || !evaluation.summary) fail("cloud posture evaluation must use schema_version 1 and contain summary");
  for (const field of ["rules_evaluated", "passing", "failing", "blocking_findings", "live_validation_pending"]) {
    requireNonNegativeInteger(evaluation.summary[field], `evaluation.summary.${field}`);
  }
  if (evaluation.summary.passing + evaluation.summary.failing !== evaluation.summary.rules_evaluated) {
    fail("cloud posture evaluation passing + failing must equal rules_evaluated");
  }
  if (!Array.isArray(evaluation.results) || evaluation.results.length !== evaluation.summary.rules_evaluated) {
    fail("cloud posture evaluation results must contain exactly rules_evaluated entries");
  }
  const passing = evaluation.results.filter((result) => result.status === "pass").length;
  const failing = evaluation.results.filter((result) => result.status === "fail").length;
  const blocking = evaluation.results.filter((result) => result.blocking === true).length;
  const pending = evaluation.results.filter((result) => result.live_validation_required === true).length;
  if (passing !== evaluation.summary.passing || failing !== evaluation.summary.failing || blocking !== evaluation.summary.blocking_findings || pending !== evaluation.summary.live_validation_pending) {
    fail("cloud posture evaluation summary must match its per-rule results");
  }
}

function repositoryCategorySummary(evaluation) {
  const categories = {};
  for (const result of evaluation.results) {
    const category = result.category ?? "unknown";
    const current = categories[category] ?? { rules_evaluated: 0, passing: 0, failing: 0, blocking_findings: 0, live_validation_pending: 0 };
    current.rules_evaluated += 1;
    current.passing += result.status === "pass" ? 1 : 0;
    current.failing += result.status === "fail" ? 1 : 0;
    current.blocking_findings += result.blocking === true ? 1 : 0;
    current.live_validation_pending += result.live_validation_required === true ? 1 : 0;
    categories[category] = current;
  }
  return Object.fromEntries(Object.entries(categories).sort(([a], [b]) => a.localeCompare(b)));
}

export function buildPostureReport({ findingsRegistry, exceptionsRegistry, governance, policy, history, evaluation, asOf, evidenceContext = {}, governancePrecondition = "success" }) {
  validateReportingConfiguration({ policy, governance, history, asOf });
  if (findingsRegistry?.schema_version !== 1 || !Array.isArray(findingsRegistry.findings)) fail("finding registry must use schema_version 1 and contain findings array");
  if (exceptionsRegistry?.schema_version !== 1 || !Array.isArray(exceptionsRegistry.exceptions)) fail("exception registry must use schema_version 1 and contain exceptions array");
  validateEvaluation(evaluation);
  if (evaluation.profile_id !== policy.profile_id) fail("cloud posture evaluation profile_id must match reporting policy");

  const findings = findingsRegistry.findings;
  const closedStatus = policy.closed_status;
  const riskAcceptedStatus = policy.risk_accepted_status;
  const unacceptedStatuses = new Set(policy.unaccepted_active_statuses);
  const blockingSeverities = new Set(Object.entries(governance.severity_policy ?? {}).filter(([, config]) => config?.merge_blocking === true).map(([severity]) => severity));
  const active = findings.filter((finding) => finding.status !== closedStatus);
  const riskAccepted = findings.filter((finding) => finding.status === riskAcceptedStatus);
  const resolvedPendingVerification = findings.filter((finding) => finding.status === "resolved");
  const unaccepted = findings.filter((finding) => unacceptedStatuses.has(finding.status));
  const unacceptedMergeBlocking = unaccepted.filter((finding) => blockingSeverities.has(finding.severity));
  const nonblockingActive = unaccepted.filter((finding) => !blockingSeverities.has(finding.severity));
  const overdue = findings.filter((finding) => {
    if (!new Set(["open", "in-remediation"]).has(finding.status)) return false;
    return parseReportingTimestamp(finding.remediation_due_at, `${finding.id ?? "finding"}.remediation_due_at`) < asOf;
  });

  const allowedPostureExceptionGates = new Set(governance.finding_lifecycle?.risk_acceptance?.allowed_exception_gates ?? []);
  const postureExceptions = exceptionsRegistry.exceptions.filter((exception) => allowedPostureExceptionGates.has(exception.gate));
  const activeExceptions = postureExceptions.filter((exception) => exception.status === "active");
  const historicalExceptions = postureExceptions.filter((exception) => exception.status === "historical");
  const asOfDate = utcDate(asOf);
  const expiringSoon = activeExceptions.filter((exception) => {
    const expires = parseDate(exception.expires_on, `${exception.id ?? "exception"}.expires_on`);
    const days = Math.round((expires - asOfDate) / DAY_MS);
    return days >= 0 && days <= policy.exception_expiry_warning_days;
  });

  const severityNames = Object.keys(governance.severity_policy ?? {});
  const statusNames = governance.finding_lifecycle?.allowed_statuses ?? [];
  const ownerNames = governance.owners ?? [];
  const sourceNames = governance.finding_lifecycle?.allowed_sources ?? [];
  const metrics = {
    active_findings: active.length,
    overdue_findings: overdue.length,
    risk_accepted_findings: riskAccepted.length,
    closed_findings: findings.filter((finding) => finding.status === closedStatus).length,
    repository_failing_rules: evaluation.summary.failing,
    repository_blocking_findings: evaluation.summary.blocking_findings,
  };

  const blockReasons = [];
  const thresholds = policy.thresholds;
  if (governancePrecondition !== "success") blockReasons.push({ code: "governance-precondition-failed", count: 1, threshold: 0, message: `Security governance validation precondition is ${governancePrecondition}; this report cannot claim a clean posture decision.` });
  if (metrics.overdue_findings > thresholds.maximum_overdue_findings) blockReasons.push({ code: "overdue-findings", count: metrics.overdue_findings, threshold: thresholds.maximum_overdue_findings, message: "Unaccepted open or in-remediation findings are past their governed remediation deadline." });
  if (unacceptedMergeBlocking.length > thresholds.maximum_unaccepted_merge_blocking_findings) blockReasons.push({ code: "unaccepted-merge-blocking-findings", count: unacceptedMergeBlocking.length, threshold: thresholds.maximum_unaccepted_merge_blocking_findings, message: "Critical/high findings remain unaccepted and not independently closed." });
  if (evaluation.summary.blocking_findings > thresholds.maximum_repository_blocking_findings) blockReasons.push({ code: "repository-blocking-findings", count: evaluation.summary.blocking_findings, threshold: thresholds.maximum_repository_blocking_findings, message: "The executable repository posture evaluation contains merge-blocking failures." });

  const attentionReasons = [];
  if (policy.attention_conditions.nonblocking_active_findings && nonblockingActive.length > 0) attentionReasons.push({ code: "nonblocking-active-findings", count: nonblockingActive.length, message: "Medium/low unaccepted findings remain active and require tracking." });
  if (policy.attention_conditions.risk_accepted_findings && riskAccepted.length > 0) attentionReasons.push({ code: "risk-accepted-findings", count: riskAccepted.length, message: "Time-bounded risk acceptances are currently active." });
  if (policy.attention_conditions.repository_nonblocking_findings && evaluation.summary.failing > evaluation.summary.blocking_findings) attentionReasons.push({ code: "repository-nonblocking-findings", count: evaluation.summary.failing - evaluation.summary.blocking_findings, message: "The repository posture evaluation contains non-blocking failures." });
  if (expiringSoon.length > 0) attentionReasons.push({ code: "posture-exceptions-expiring-soon", count: expiringSoon.length, message: `Posture exceptions expire within ${policy.exception_expiry_warning_days} days.` });

  const decision = blockReasons.length > 0 ? "block" : attentionReasons.length > 0 ? "attention" : "pass";
  const generatedAt = asOf.toISOString().replace(".000Z", "Z");
  const liveCloudSourcesActive = (governance.live_cloud_sources ?? []).filter((source) => source.status === "active").map((source) => source.source);
  const plannedLiveCloudSources = (governance.live_cloud_sources ?? []).filter((source) => source.status !== "active").map((source) => source.source);
  const evidenceMode = "repository-baseline";
  const context = normalizeEvidenceContext(evidenceContext);
  const currentSnapshot = { schema_version: 1, profile_id: policy.profile_id, generated_at: generatedAt, evidence_mode: evidenceMode, decision, evidence_context: context, metrics };
  const trend = buildTrend({ policy, history, currentSnapshot, asOf });
  const categorySummary = repositoryCategorySummary(evaluation);
  const desiredStatePercent = evaluation.summary.rules_evaluated === 0 ? 0 : Number(((evaluation.summary.passing / evaluation.summary.rules_evaluated) * 100).toFixed(1));

  return {
    schema_version: 1,
    policy_id: policy.policy_id,
    profile_id: policy.profile_id,
    generated_at: generatedAt,
    evidence_mode: evidenceMode,
    evidence_context: context,
    governance_precondition: governancePrecondition,
    decision,
    decision_reasons: decision === "block" ? blockReasons : decision === "attention" ? attentionReasons : [],
    repository_posture: { source: evaluation.source ?? null, rules_evaluated: evaluation.summary.rules_evaluated, passing: evaluation.summary.passing, failing: evaluation.summary.failing, blocking_findings: evaluation.summary.blocking_findings, live_validation_pending: evaluation.summary.live_validation_pending, desired_state_pass_percent: desiredStatePercent, by_category: categorySummary },
    findings: { total: findings.length, active: active.length, closed: metrics.closed_findings, overdue: overdue.length, risk_accepted: riskAccepted.length, resolved_pending_verification: resolvedPendingVerification.length, unaccepted_merge_blocking: unacceptedMergeBlocking.length, nonblocking_active: nonblockingActive.length, by_status: countBy(findings, "status", statusNames), by_severity: countBy(findings, "severity", severityNames), by_owner: countBy(findings, "owner", ownerNames), by_source: countBy(findings, "source", sourceNames) },
    exceptions: { posture_total: postureExceptions.length, active: activeExceptions.length, historical: historicalExceptions.length, expiring_within_warning_window: expiringSoon.length, warning_days: policy.exception_expiry_warning_days },
    sla: {
      overdue_open_or_remediation: overdue.length,
      within_deadline_open_or_remediation: findings.filter((finding) => new Set(["open", "in-remediation"]).has(finding.status) && parseReportingTimestamp(finding.remediation_due_at, `${finding.id ?? "finding"}.remediation_due_at`) >= asOf).length,
      active_risk_acceptances: riskAccepted.length,
      pending_independent_verification: resolvedPendingVerification.length,
    },
    trend,
    boundary: { profile_stage: governance.profile_stage, active_operational_finding_sources: governance.finding_lifecycle?.active_sources ?? [], live_cloud_sources_active: liveCloudSourcesActive, live_cloud_sources_planned: plannedLiveCloudSources, operational_trend_available: false, live_validation_pending: evaluation.summary.live_validation_pending },
    metrics_snapshot: currentSnapshot,
  };
}

export function postureReportMarkdown(report) {
  const lines = [
    "# Cloud security posture report",
    "",
    `- Decision: **${report.decision.toUpperCase()}**`,
    `- Evidence mode: \`${report.evidence_mode}\``,
    `- Governance precondition: \`${report.governance_precondition}\``,
    `- Generated: \`${report.generated_at}\``,
    `- Profile: \`${report.profile_id}\``,
    `- Commit: \`${report.evidence_context.commit}\``,
    `- Ref: \`${report.evidence_context.ref}\``,
    `- Run: \`${report.evidence_context.run_id}\` attempt \`${report.evidence_context.run_attempt}\``,
    "",
    "## Repository desired-state posture",
    "",
    "| Metric | Value |",
    "|---|---:|",
    `| Rules evaluated | ${report.repository_posture.rules_evaluated} |`,
    `| Passing | ${report.repository_posture.passing} |`,
    `| Failing | ${report.repository_posture.failing} |`,
    `| Blocking | ${report.repository_posture.blocking_findings} |`,
    `| Desired-state pass rate | ${report.repository_posture.desired_state_pass_percent}% |`,
    `| Still requiring live validation | ${report.repository_posture.live_validation_pending} |`,
    "",
    "### Desired-state coverage by category",
    "",
    "| Category | Rules | Pass | Fail | Blocking | Live pending |",
    "|---|---:|---:|---:|---:|---:|",
  ];
  for (const [category, summary] of Object.entries(report.repository_posture.by_category)) lines.push(`| ${category} | ${summary.rules_evaluated} | ${summary.passing} | ${summary.failing} | ${summary.blocking_findings} | ${summary.live_validation_pending} |`);
  lines.push(
    "",
    "## Governed findings",
    "",
    "| Metric | Value |",
    "|---|---:|",
    `| Total | ${report.findings.total} |`,
    `| Active | ${report.findings.active} |`,
    `| Critical/high unaccepted | ${report.findings.unaccepted_merge_blocking} |`,
    `| Overdue | ${report.findings.overdue} |`,
    `| Risk accepted | ${report.findings.risk_accepted} |`,
    `| Pending independent verification | ${report.findings.resolved_pending_verification} |`,
    `| Closed | ${report.findings.closed} |`,
    "",
    "## Risk acceptance",
    "",
    `- Active posture exceptions: **${report.exceptions.active}**`,
    `- Historical posture exceptions: **${report.exceptions.historical}**`,
    `- Expiring within ${report.exceptions.warning_days} days: **${report.exceptions.expiring_within_warning_window}**`,
    "",
    "## Trend",
    "",
    `- Status: **${report.trend.status}**`,
    `- Evidence class: \`${report.trend.evidence_class}\``,
    `- Snapshots considered: **${report.trend.snapshots_considered}**`,
  );
  if (report.trend.status === "available") {
    lines.push(`- Baseline snapshot: \`${report.trend.baseline_generated_at}\``, `- Overall direction: **${report.trend.overall_direction.toUpperCase()}**`, "", "| Trend metric | Baseline | Current | Delta | Direction |", "|---|---:|---:|---:|---|");
    for (const [metric, result] of Object.entries(report.trend.deltas)) lines.push(`| ${metric} | ${result.baseline} | ${result.current} | ${result.delta} | ${result.direction} |`);
  } else {
    lines.push("- Trend direction is intentionally not claimed until the governed minimum history exists.");
  }
  lines.push("", "## Decision reasons", "");
  if (report.decision_reasons.length === 0) lines.push("- No governed block or attention threshold is currently triggered.");
  else for (const reason of report.decision_reasons) lines.push(`- **${reason.code}** (${reason.count}): ${reason.message}`);
  lines.push(
    "",
    "## Evidence boundary",
    "",
    `- Active operational finding sources: ${report.boundary.active_operational_finding_sources.map((source) => `\`${source}\``).join(", ") || "none"}`,
    `- Active live-cloud sources: ${report.boundary.live_cloud_sources_active.map((source) => `\`${source}\``).join(", ") || "none"}`,
    `- Planned live-cloud sources: ${report.boundary.live_cloud_sources_planned.map((source) => `\`${source}\``).join(", ") || "none"}`,
    `- Operational trend available: **${report.boundary.operational_trend_available ? "yes" : "no"}**`,
    "",
    "The percentage and category table above describe reviewed repository desired state only. A repository-baseline PASS does not prove live Google Cloud effective state, real remote-state drift, or operational trend performance while live sources remain pending.",
    "",
  );
  return `${lines.join("\n")}\n`;
}

async function loadJson(path, label) {
  try { return JSON.parse(await readFile(path, "utf8")); }
  catch (error) { fail(`${label} could not be loaded as JSON: ${error.message}`); }
}

function argument(name, fallback = null) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

async function main() {
  const findingsPath = resolve(argument("--findings", "security/posture-findings.json"));
  const exceptionsPath = resolve(argument("--exceptions", "security/exceptions.json"));
  const governancePath = resolve(argument("--governance", "security/cloud-posture-governance.json"));
  const policyPath = resolve(argument("--policy", "security/posture-reporting-policy.json"));
  const historyPath = resolve(argument("--history", "security/posture-metrics-history.json"));
  const evaluationPath = resolve(argument("--evaluation", "security-evidence/cloud-posture-evaluation.json"));
  const jsonOutput = argument("--json");
  const markdownOutput = argument("--markdown");
  const snapshotOutput = argument("--snapshot");
  const asOfArgument = argument("--as-of");
  const asOf = asOfArgument ? parseReportingTimestamp(asOfArgument, "--as-of") : new Date(Math.floor(Date.now() / 1000) * 1000);
  const governancePrecondition = process.env.POSTURE_GOVERNANCE_RESULT ?? "success";
  const evidenceContext = {
    repository: process.env.GITHUB_REPOSITORY ?? "unknown",
    workflow: process.env.GITHUB_WORKFLOW ?? "unknown",
    run_id: process.env.GITHUB_RUN_ID ?? "unknown",
    run_attempt: process.env.GITHUB_RUN_ATTEMPT ?? "unknown",
    event: process.env.GITHUB_EVENT_NAME ?? "unknown",
    ref: process.env.GITHUB_REF ?? "unknown",
    commit: process.env.GITHUB_SHA ?? "unknown",
  };
  const report = buildPostureReport({
    findingsRegistry: await loadJson(findingsPath, "finding registry"),
    exceptionsRegistry: await loadJson(exceptionsPath, "exception registry"),
    governance: await loadJson(governancePath, "posture governance"),
    policy: await loadJson(policyPath, "reporting policy"),
    history: await loadJson(historyPath, "metrics history"),
    evaluation: await loadJson(evaluationPath, "cloud posture evaluation"),
    asOf,
    evidenceContext,
    governancePrecondition,
  });
  if (jsonOutput) {
    const path = resolve(jsonOutput);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  }
  const markdown = postureReportMarkdown(report);
  if (markdownOutput) {
    const path = resolve(markdownOutput);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, markdown, "utf8");
  }
  if (snapshotOutput) {
    const path = resolve(snapshotOutput);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, `${JSON.stringify(report.metrics_snapshot, null, 2)}\n`, "utf8");
  }
  if (!jsonOutput && !markdownOutput) process.stdout.write(markdown);
  console.log(`Posture report generated: decision=${report.decision}; active=${report.findings.active}; overdue=${report.findings.overdue}; trend=${report.trend.status}/${report.trend.evidence_class}; precondition=${report.governance_precondition}.`);
  if (report.decision === "block") process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error.stack ?? error.message);
    process.exitCode = 1;
  });
}
