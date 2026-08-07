import { readFile } from "node:fs/promises";
import {
  validateCommittedHistoryBoundary,
  validateReportingSeverityBaseline,
  validateReportingExceptionBaseline,
} from "./validate-posture-reporting.mjs";

const governance = JSON.parse(await readFile("security/cloud-posture-governance.json", "utf8"));
const history = JSON.parse(await readFile("security/posture-metrics-history.json", "utf8"));
const catalogue = JSON.parse(await readFile("security/cloud-posture-controls.json", "utf8"));

let scenarios = 0;
function expect(condition, name) {
  if (!condition) throw new Error(`FAIL ${name}`);
  scenarios += 1;
  console.log(`PASS ${name}`);
}
function pass(name) {
  scenarios += 1;
  console.log(`PASS ${name}`);
}

validateCommittedHistoryBoundary({ governance, history });
expect(history.snapshots.length === 0, "allow: repository baseline keeps committed metrics history empty");

const fabricated = structuredClone(history);
fabricated.snapshots.push({
  schema_version: 1,
  profile_id: "AFYA-CSPM-BASELINE-1",
  generated_at: "2026-08-01T12:00:00Z",
  evidence_mode: "repository-baseline",
  decision: "pass",
  metrics: {
    active_findings: 0,
    overdue_findings: 0,
    risk_accepted_findings: 0,
    closed_findings: 99,
    repository_failing_rules: 0,
    repository_blocking_findings: 0
  }
});
let rejectedHistory = false;
try {
  validateCommittedHistoryBoundary({ governance, history: fabricated });
} catch {
  rejectedHistory = true;
}
expect(rejectedHistory, "deny: repository PR cannot seed invented trend history");

validateReportingSeverityBaseline({ catalogue });
pass("allow: reviewed posture severities remain anchored");

const downgradedHigh = structuredClone(catalogue);
downgradedHigh.controls.find((control) => control.id === "MON-C01").severity = "medium";
let rejectedHighDowngrade = false;
try {
  validateReportingSeverityBaseline({ catalogue: downgradedHigh });
} catch {
  rejectedHighDowngrade = true;
}
expect(rejectedHighDowngrade, "deny: high control cannot be downgraded below merge-blocking severity");

const downgradedCritical = structuredClone(catalogue);
downgradedCritical.controls.find((control) => control.id === "IAM-C01").severity = "high";
let rejectedCriticalDowngrade = false;
try {
  validateReportingSeverityBaseline({ catalogue: downgradedCritical });
} catch {
  rejectedCriticalDowngrade = true;
}
expect(rejectedCriticalDowngrade, "deny: critical control severity cannot be silently reduced");

validateReportingExceptionBaseline({ catalogue });
pass("allow: reviewed exceptionability and maximum lifetimes remain anchored");

const exceptionEnabled = structuredClone(catalogue);
exceptionEnabled.controls.find((control) => control.id === "NET-C01").exception = {
  allowed: true,
  maximum_days: 30,
};
let rejectedExceptionEnable = false;
try {
  validateReportingExceptionBaseline({ catalogue: exceptionEnabled });
} catch {
  rejectedExceptionEnable = true;
}
expect(rejectedExceptionEnable, "deny: non-exceptionable critical control cannot become risk-acceptable");

const exceptionExtended = structuredClone(catalogue);
exceptionExtended.controls.find((control) => control.id === "MON-C01").exception.maximum_days = 90;
let rejectedExceptionExtension = false;
try {
  validateReportingExceptionBaseline({ catalogue: exceptionExtended });
} catch {
  rejectedExceptionExtension = true;
}
expect(rejectedExceptionExtension, "deny: reviewed high-severity exception lifetime cannot be extended");

const stricterException = structuredClone(catalogue);
stricterException.controls.find((control) => control.id === "KMS-C01").exception = { allowed: false };
validateReportingExceptionBaseline({ catalogue: stricterException });
pass("allow: making an exceptionable control stricter remains fail-closed");

console.log(`Posture reporting governance-boundary controls validated: ${scenarios} scenarios passed.`);
