import { readFile } from "node:fs/promises";
import {
  buildPostureReport,
  validateReportingConfiguration,
} from "./generate-posture-report.mjs";

const asOf = new Date("2026-08-07T12:00:00Z");
const [governance, policy, emptyHistory] = await Promise.all([
  readJson("security/cloud-posture-governance.json"),
  readJson("security/posture-reporting-policy.json"),
  readJson("security/posture-metrics-history.json"),
]);

function clone(value) {
  return structuredClone(value);
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

function evaluation(overrides = {}) {
  const summary = {
    rules_evaluated: 11,
    passing: 11,
    failing: 0,
    blocking_findings: 0,
    live_validation_pending: 11,
    ...(overrides.summary ?? {}),
  };
  return {
    schema_version: 1,
    profile_id: "AFYA-CSPM-BASELINE-1",
    check_set_id: "AFYA-CSPM-REPOSITORY-1",
    source: { type: "repository", stage: "repository-desired-state" },
    summary,
    results: [],
  };
}

let findingSequence = 1;
function finding(overrides = {}) {
  const sequence = String(findingSequence++).padStart(3, "0");
  return {
    id: `CSPM-FND-2026-${sequence}`,
    source: "manual-review",
    control_id: "GOV-C01",
    severity: "medium",
    title: "Synthetic posture reporting test finding",
    owner: "cloud-security",
    status: "open",
    detected_at: "2026-08-07T08:00:00Z",
    remediation_due_at: "2026-09-06T08:00:00Z",
    tracking_url: "https://github.com/larrymiami/Afyabridge-Cloud-Security/issues/999",
    history: [
      {
        status: "open",
        at: "2026-08-07T08:00:00Z",
        actor: "cloud-security",
      },
    ],
    ...overrides,
  };
}

function registry(findings = []) {
  return { schema_version: 1, findings };
}

function exceptions(exceptionsList = []) {
  return { schema_version: 1, exceptions: exceptionsList };
}

function postureException(overrides = {}) {
  return {
    id: "SEC-EX-2026-001",
    status: "active",
    gate: "cloud-posture",
    scope: "Synthetic posture exception",
    rationale: "Synthetic reporting fixture with a substantive governance rationale.",
    compensating_controls: ["Synthetic compensating monitoring control"],
    owner: "cloud-security",
    approved_by: "security-operations",
    tracking_url: "https://github.com/larrymiami/Afyabridge-Cloud-Security/issues/998",
    created_on: "2026-08-01",
    expires_on: "2026-08-14",
    finding_ids: ["CSPM-FND-2026-001"],
    ...overrides,
  };
}

function report({ findings = [], exceptionsList = [], evalValue = evaluation(), history = emptyHistory, gov = governance, reportingPolicy = policy } = {}) {
  return buildPostureReport({
    findingsRegistry: registry(findings),
    exceptionsRegistry: exceptions(exceptionsList),
    governance: gov,
    policy: reportingPolicy,
    history,
    evaluation: evalValue,
    asOf,
  });
}

function snapshot(generatedAt, metrics, overrides = {}) {
  return {
    schema_version: 1,
    profile_id: "AFYA-CSPM-BASELINE-1",
    generated_at: generatedAt,
    evidence_mode: "repository-baseline",
    decision: "attention",
    metrics: {
      active_findings: 0,
      overdue_findings: 0,
      risk_accepted_findings: 0,
      closed_findings: 0,
      repository_failing_rules: 0,
      repository_blocking_findings: 0,
      ...metrics,
    },
    ...overrides,
  };
}

let scenarios = 0;
function pass(name) {
  scenarios += 1;
  console.log(`PASS ${name}`);
}

function expect(condition, name) {
  if (!condition) throw new Error(`FAIL ${name}`);
  pass(name);
}

function expectThrows(name, mutate) {
  const mutatedPolicy = clone(policy);
  const mutatedGovernance = clone(governance);
  const mutatedHistory = clone(emptyHistory);
  mutate({ policy: mutatedPolicy, governance: mutatedGovernance, history: mutatedHistory });
  let threw = false;
  try {
    validateReportingConfiguration({
      policy: mutatedPolicy,
      governance: mutatedGovernance,
      history: mutatedHistory,
      asOf,
    });
  } catch {
    threw = true;
  }
  expect(threw, name);
}

validateReportingConfiguration({ policy, governance, history: emptyHistory, asOf });
pass("allow: reviewed reporting governance with empty history");

expectThrows("deny: merge-blocking finding threshold weakened", ({ policy: value }) => {
  value.thresholds.maximum_unaccepted_merge_blocking_findings = 1;
});
expectThrows("deny: overdue threshold weakened", ({ policy: value }) => {
  value.thresholds.maximum_overdue_findings = 1;
});
expectThrows("deny: repository blocking threshold weakened", ({ policy: value }) => {
  value.thresholds.maximum_repository_blocking_findings = 1;
});
expectThrows("deny: decision level removed", ({ policy: value }) => {
  value.decision_levels = ["pass", "block"];
});
expectThrows("deny: resolved removed from unaccepted active statuses", ({ policy: value }) => {
  value.unaccepted_active_statuses = ["open", "in-remediation"];
});
expectThrows("deny: trend lookback silently extended", ({ policy: value }) => {
  value.trend.lookback_days = 90;
});
expectThrows("deny: trend minimum reduced to one snapshot", ({ policy: value }) => {
  value.trend.minimum_snapshots = 1;
});
expectThrows("deny: trend direction inverted", ({ policy: value }) => {
  value.trend.metric_directions.overdue_findings = "higher-is-better";
});
expectThrows("deny: metrics history profile detached from posture profile", ({ history }) => {
  history.profile_id = "OTHER-PROFILE";
});
expectThrows("deny: future history snapshot", ({ history }) => {
  history.snapshots = [snapshot("2026-08-08T12:00:00Z")];
});
expectThrows("deny: duplicate history timestamp", ({ history }) => {
  history.snapshots = [
    snapshot("2026-08-01T12:00:00Z"),
    snapshot("2026-08-01T12:00:00Z"),
  ];
});
expectThrows("deny: out-of-order history", ({ history }) => {
  history.snapshots = [
    snapshot("2026-08-02T12:00:00Z"),
    snapshot("2026-08-01T12:00:00Z"),
  ];
});

const clean = report();
expect(clean.decision === "pass", "allow: empty governed registry and clean repository posture -> PASS");
expect(
  clean.repository_posture.live_validation_pending === 11 && clean.decision === "pass",
  "allow: explicit live-validation debt does not masquerade as a repository failure",
);
expect(
  clean.trend.status === "insufficient-history" && clean.boundary.operational_trend_available === false,
  "allow: empty history reports insufficient trend evidence without fabrication",
);

const mediumOpen = report({ findings: [finding()] });
expect(mediumOpen.decision === "attention", "attention: medium active finding is surfaced without merge block");

const highOpen = report({
  findings: [finding({ control_id: "MON-C01", severity: "high" })],
});
expect(highOpen.decision === "block", "block: high unaccepted open finding");

const highResolved = report({
  findings: [finding({ control_id: "MON-C01", severity: "high", status: "resolved" })],
});
expect(highResolved.decision === "block", "block: high finding remains blocking until independent closure");

const overdueMedium = report({
  findings: [finding({ remediation_due_at: "2026-08-07T11:59:59Z" })],
});
expect(overdueMedium.decision === "block", "block: overdue medium finding fails the zero-overdue threshold");

const acceptedHigh = report({
  findings: [finding({ control_id: "MON-C01", severity: "high", status: "risk-accepted" })],
  exceptionsList: [postureException()],
});
expect(
  acceptedHigh.decision === "attention" && acceptedHigh.findings.unaccepted_merge_blocking === 0,
  "attention: governed risk acceptance does not masquerade as unresolved merge-blocking risk",
);

const repoNonblocking = report({
  evalValue: evaluation({
    summary: { rules_evaluated: 11, passing: 10, failing: 1, blocking_findings: 0, live_validation_pending: 11 },
  }),
});
expect(repoNonblocking.decision === "attention", "attention: repository non-blocking posture failure");

const repoBlocking = report({
  evalValue: evaluation({
    summary: { rules_evaluated: 11, passing: 10, failing: 1, blocking_findings: 1, live_validation_pending: 11 },
  }),
});
expect(repoBlocking.decision === "block", "block: repository merge-blocking posture failure");

const expiring = report({
  exceptionsList: [postureException({ expires_on: "2026-08-10" })],
});
expect(
  expiring.decision === "attention" && expiring.exceptions.expiring_within_warning_window === 1,
  "attention: active posture exception nearing expiry",
);

const improvingHistory = {
  schema_version: 1,
  profile_id: "AFYA-CSPM-BASELINE-1",
  snapshots: [
    snapshot("2026-08-01T12:00:00Z", {
      active_findings: 3,
      overdue_findings: 1,
      risk_accepted_findings: 1,
      closed_findings: 0,
      repository_failing_rules: 1,
      repository_blocking_findings: 1,
    }),
  ],
};
const improving = report({ history: improvingHistory });
expect(
  improving.trend.status === "available" && improving.trend.overall_direction === "improving",
  "allow: governed history computes improving repository trend",
);
expect(
  improving.trend.evidence_class === "repository-evidence" && improving.boundary.operational_trend_available === false,
  "allow: repository trend is not overclaimed as operational trend",
);

const worseningHistory = {
  schema_version: 1,
  profile_id: "AFYA-CSPM-BASELINE-1",
  snapshots: [snapshot("2026-08-01T12:00:00Z")],
};
const worsening = report({
  findings: [finding()],
  history: worseningHistory,
});
expect(
  worsening.trend.status === "available" && worsening.trend.overall_direction === "worsening",
  "allow: governed history computes worsening repository trend",
);

const stable = report({
  history: {
    schema_version: 1,
    profile_id: "AFYA-CSPM-BASELINE-1",
    snapshots: [snapshot("2026-08-01T12:00:00Z")],
  },
});
expect(stable.trend.overall_direction === "stable", "allow: governed history computes stable trend");

expect(
  Object.keys(clean.metrics_snapshot.metrics).sort().join(",") ===
    [
      "active_findings",
      "closed_findings",
      "overdue_findings",
      "repository_blocking_findings",
      "repository_failing_rules",
      "risk_accepted_findings",
    ].sort().join(","),
  "allow: emitted snapshot contains only governed trend metrics",
);

console.log(`Posture reporting controls validated: ${scenarios} scenarios passed.`);
